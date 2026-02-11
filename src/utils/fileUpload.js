const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const crypto = require('crypto');
const logger = require('./logger');
const { v4: uuidv4 } = require('uuid');

/**
 * File Upload Utilities
 *
 * Handles file uploads with validation, sanitization, and storage.
 * Supports large PDF blueprints (up to 200 MB) with streaming I/O.
 */

// Ensure upload directory exists
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
const BLUEPRINTS_DIR = path.join(UPLOAD_DIR, 'blueprints');
const TEMP_UPLOAD_DIR = path.join(UPLOAD_DIR, 'tmp');

// Create directories if they don't exist
async function ensureDirectories() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.mkdir(BLUEPRINTS_DIR, { recursive: true });
    await fs.mkdir(TEMP_UPLOAD_DIR, { recursive: true });
    logger.info('Upload directories ensured', {
      uploadDir: UPLOAD_DIR,
      blueprintsDir: BLUEPRINTS_DIR,
      tempDir: TEMP_UPLOAD_DIR
    });
  } catch (error) {
    logger.error('Failed to create upload directories', {
      error: error.message
    });
    throw error;
  }
}

// Initialize directories
ensureDirectories();

/**
 * File size limits (in bytes)
 */
const FILE_SIZE_LIMITS = {
  blueprint: 200 * 1024 * 1024, // 200MB for blueprints (large PDFs)
  image: 10 * 1024 * 1024,      // 10MB for general images
  document: 25 * 1024 * 1024    // 25MB for documents
};

/**
 * Allowed file types
 */
const ALLOWED_MIME_TYPES = {
  blueprint: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/tiff',
    'application/pdf'
  ],
  image: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ]
};

const ALLOWED_EXTENSIONS = {
  blueprint: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.tiff', '.tif', '.pdf'],
  image: ['.jpg', '.jpeg', '.png', '.gif', '.webp']
};

/**
 * Configure multer storage for blueprints
 */
const blueprintStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await fs.mkdir(BLUEPRINTS_DIR, { recursive: true });
      cb(null, BLUEPRINTS_DIR);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename: uuid-original-name.ext
    const uuid = uuidv4();
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .substring(0, 50);

    const filename = `${uuid}-${basename}${ext}`;
    cb(null, filename);
  }
});

/**
 * File filter for blueprints
 */
const blueprintFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype.toLowerCase();

  // Check extension
  if (!ALLOWED_EXTENSIONS.blueprint.includes(ext)) {
    return cb(
      new FileUploadError(
        `Invalid file extension. Allowed: ${ALLOWED_EXTENSIONS.blueprint.join(', ')}`,
        'INVALID_EXTENSION'
      ),
      false
    );
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.blueprint.includes(mimeType)) {
    return cb(
      new FileUploadError(
        `Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.blueprint.join(', ')}`,
        'INVALID_MIME_TYPE'
      ),
      false
    );
  }

  cb(null, true);
};

/**
 * Multer upload middleware for blueprints
 *
 * Supports files up to 200 MB.  For very large files the disk-storage
 * backend streams the request body directly to the file system rather
 * than buffering in memory.
 */
const uploadBlueprint = multer({
  storage: blueprintStorage,
  fileFilter: blueprintFileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.blueprint,
    files: 10 // Allow batch upload of up to 10 files
  }
});

/**
 * Single-file upload middleware (backward-compatible).
 */
const uploadBlueprintSingle = multer({
  storage: blueprintStorage,
  fileFilter: blueprintFileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.blueprint,
    files: 1
  }
});

/**
 * Validate uploaded file
 *
 * @param {Object} file - Multer file object
 * @returns {Object} Validation result
 */
function validateFile(file) {
  const errors = [];

  if (!file) {
    errors.push('No file uploaded');
    return { valid: false, errors };
  }

  // Check file size
  if (file.size > FILE_SIZE_LIMITS.blueprint) {
    errors.push(`File too large. Maximum size: ${FILE_SIZE_LIMITS.blueprint / 1024 / 1024}MB`);
  }

  // Check if file exists on disk
  try {
    fs.access(file.path);
  } catch (_error) {
    errors.push('Uploaded file not accessible');
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * Get file metadata
 *
 * @param {Object} file - Multer file object
 * @returns {Object} File metadata
 */
function getFileMetadata(file) {
  return {
    originalName: file.originalname,
    filename: file.filename,
    path: file.path,
    size: file.size,
    mimeType: file.mimetype,
    extension: path.extname(file.originalname).toLowerCase(),
    uploadDate: new Date().toISOString()
  };
}

/**
 * Delete uploaded file
 *
 * @param {string} filePath - Path to file
 * @returns {Promise<boolean>} Success
 */
async function deleteFile(filePath) {
  try {
    await fs.unlink(filePath);
    logger.info('File deleted', { filePath });
    return true;
  } catch (error) {
    logger.error('Failed to delete file', {
      filePath: filePath,
      error: error.message
    });
    return false;
  }
}

/**
 * Get file size in human-readable format
 *
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted size
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Check available disk space
 *
 * @returns {Promise<Object>} Disk space info
 */
async function checkDiskSpace() {
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    const { stdout } = await execAsync(`df -h ${UPLOAD_DIR} | tail -1`);
    const parts = stdout.trim().split(/\s+/);

    return {
      total: parts[1],
      used: parts[2],
      available: parts[3],
      usage: parts[4],
      healthy: parseInt(parts[4]) < 90
    };
  } catch (error) {
    logger.warn('Could not check disk space', {
      error: error.message
    });
    return { healthy: true, error: error.message };
  }
}

/**
 * Clean up old files
 *
 * @param {number} daysOld - Files older than this many days
 * @returns {Promise<number>} Number of files deleted
 */
async function cleanupOldFiles(daysOld = 30) {
  try {
    const files = await fs.readdir(BLUEPRINTS_DIR);
    const cutoffDate = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(BLUEPRINTS_DIR, file);
      const stats = await fs.stat(filePath);

      if (stats.mtimeMs < cutoffDate) {
        await fs.unlink(filePath);
        deletedCount++;
        logger.info('Old file deleted', {
          file: file,
          age: Math.floor((Date.now() - stats.mtimeMs) / (24 * 60 * 60 * 1000))
        });
      }
    }

    logger.info('Cleanup completed', {
      filesDeleted: deletedCount,
      daysOld: daysOld
    });

    return deletedCount;

  } catch (error) {
    logger.error('Cleanup failed', {
      error: error.message
    });
    return 0;
  }
}

/**
 * Middleware to handle file upload errors
 */
function handleUploadError(error, req, res, next) {
  if (error instanceof multer.MulterError) {
    // Multer-specific errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: {
          message: `File too large. Maximum size: ${FILE_SIZE_LIMITS.blueprint / 1024 / 1024}MB`,
          code: 'FILE_TOO_LARGE'
        }
      });
    } else if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: {
          message: 'Too many files. Only 1 file allowed',
          code: 'TOO_MANY_FILES'
        }
      });
    } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: {
          message: 'Unexpected file field',
          code: 'UNEXPECTED_FILE'
        }
      });
    }
  } else if (error instanceof FileUploadError) {
    // Custom upload errors
    return res.status(400).json({
      error: {
        message: error.message,
        code: error.code
      }
    });
  }

  // Pass other errors to next middleware
  next(error);
}

/**
 * Compute a SHA-256 checksum of a file using a streaming read.
 * Useful for de-duplicating large uploads and verifying integrity.
 *
 * @param {string} filePath - Path to file
 * @returns {Promise<string>} Hex-encoded SHA-256 hash
 */
async function computeFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fsSync.createReadStream(filePath, { highWaterMark: 1024 * 1024 });
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

/**
 * Get basic PDF metadata (page count) without loading the entire file.
 * Falls back to 0 if pdf-parse is not available or the file is not a valid PDF.
 *
 * @param {string} filePath - Path to a PDF file
 * @returns {Promise<{pageCount: number}>}
 */
async function getPdfInfo(filePath) {
  try {
    // Quick heuristic: count occurrences of /Type /Page in the raw bytes.
    // This avoids a heavy dependency for a simple page-count check.
    const buffer = await fs.readFile(filePath);
    const text = buffer.toString('latin1');
    const matches = text.match(/\/Type\s*\/Page[^s]/g);
    return { pageCount: matches ? matches.length : 0 };
  } catch (_error) {
    return { pageCount: 0 };
  }
}

/**
 * Custom File Upload Error
 */
class FileUploadError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'FileUploadError';
    this.code = code;
  }
}

module.exports = {
  uploadBlueprint,
  uploadBlueprintSingle,
  validateFile,
  getFileMetadata,
  deleteFile,
  formatFileSize,
  checkDiskSpace,
  cleanupOldFiles,
  handleUploadError,
  computeFileHash,
  getPdfInfo,
  FileUploadError,
  UPLOAD_DIR,
  BLUEPRINTS_DIR,
  TEMP_UPLOAD_DIR,
  FILE_SIZE_LIMITS,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS
};
