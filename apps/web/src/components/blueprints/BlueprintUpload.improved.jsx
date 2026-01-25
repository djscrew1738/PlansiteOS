import { useState, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import BASE_URL from '../../api/baseUrl';
const MAX_FILE_SIZE_MB = 50;

export default function BlueprintUpload({ onClose, onSuccess }) {
  const [files, setFiles] = useState([]);
  const [projectName, setProjectName] = useState('');
  const [projectAddress, setProjectAddress] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback(acceptedFiles => {
    setFiles(acceptedFiles.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file)
    })));
  }, []);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'application/pdf': ['.pdf'],
      'application/dxf': ['.dxf'], // Add DXF file type
    },
    maxFiles: 5,
    maxSize: MAX_FILE_SIZE_MB * 1024 * 1024,
  });

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select at least one file.');
      return;
    }
    if (!projectName.trim()) {
      toast.error('Please provide a project name.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    files.forEach(file => formData.append('blueprints', file));
    formData.append('projectName', projectName);
    if (projectAddress.trim()) formData.append('projectAddress', projectAddress);

    try {
      const response = await axios.post(`${BASE_URL}/api/blueprints/upload-batch`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'x-correlation-id': crypto.randomUUID(),
        },
        onUploadProgress: progressEvent => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });

      toast.custom((t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Upload Successful!
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {files.length} blueprint(s) for "{projectName}" are now being analyzed.
                </p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-gray-200">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-primary-600 hover:text-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              Close
            </button>
          </div>
        </div>
      ), { duration: 5000 });

      onSuccess(response.data);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.error?.message || 'An unknown error occurred during upload.');
    } finally {
      setUploading(false);
    }
  };

  const fileRejectionItems = fileRejections.map(({ file, errors }) => (
    <div key={file.path} className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
      <p className="font-semibold">{file.path} - {(file.size / 1024 / 1024).toFixed(2)}MB</p>
      <ul className="list-disc list-inside">
        {errors.map(e => <li key={e.code}>{e.message}</li>)}
      </ul>
    </div>
  ));

  const removeFile = (filePath) => {
    setFiles(files.filter(f => f.path !== filePath));
  }

  const fileList = useMemo(() => files.map(file => (
    <div key={file.path} className="bg-gray-50 p-3 rounded-lg flex items-center justify-between animate-fade-in-up">
      <div className="flex items-center gap-3">
        <FileText className="w-5 h-5 text-gray-500" />
        <div className="text-sm">
          <p className="font-semibold text-gray-800">{file.name}</p>
          <p className="text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
        </div>
      </div>
      <button onClick={() => removeFile(file.path)} disabled={uploading} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-100 rounded-full transition">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )), [files, uploading]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Upload Blueprints</h2>
              <p className="text-sm text-gray-500">Upload up to 5 files for a new project analysis</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 rounded-full hover:bg-gray-100 transition" disabled={uploading}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* File Drop Zone */}
          <div
            {...getRootProps()}
            className={`p-8 text-center border-2 border-dashed rounded-xl cursor-pointer transition-all ${
              isDragActive ? 'border-primary-500 bg-primary-50 scale-105' : 'border-gray-300 hover:border-primary-400'
            }`}
          >
            <input {...getInputProps()} />
            <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Upload className={`w-8 h-8 ${isDragActive ? 'animate-bounce' : ''}`} />
            </div>
            <p className="font-semibold text-gray-700">
              {isDragActive ? "Drop files here" : "Drag 'n' drop files here, or click to select"}
            </p>
            <p className="text-xs text-gray-500 mt-1">PDF, PNG, JPG, DXF supported (Max {MAX_FILE_SIZE_MB}MB each)</p>
          </div>

          {fileRejectionItems.length > 0 && <div className="space-y-2">{fileRejectionItems}</div>}
          
          {files.length > 0 && <div className="space-y-2">{fileList}</div>}

          {/* Project Details */}
          <div className="space-y-4">
            <div>
              <label htmlFor="projectName" className="label font-medium">
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text" id="projectName" value={projectName}
                onChange={e => setProjectName(e.target.value)}
                className="input w-full"
                placeholder="e.g., The Grandview Heights"
                disabled={uploading}
              />
            </div>
            <div>
              <label htmlFor="projectAddress" className="label font-medium">
                Project Address (Optional)
              </label>
              <input
                type="text" id="projectAddress" value={projectAddress}
                onChange={e => setProjectAddress(e.target.value)}
                className="input w-full"
                placeholder="e.g., 456 Luxury Lane, Big City, ST 54321"
                disabled={uploading}
              />
            </div>
          </div>

          {/* AI Info Box */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-bold">AI-Powered Analysis</p>
              <p>Our vision AI will process each page to detect fixtures, piping, and dimensions. This may take a few moments per page.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-6 border-t bg-gray-50 space-y-4">
          {uploading && (
            <div className="w-full">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-primary-700">Uploading and processing...</span>
                <span className="text-sm font-medium text-primary-700">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-primary-200 rounded-full h-2.5">
                <div className="bg-primary-600 h-2.5 rounded-full transition-all" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            </div>
          )}
          <div className="flex items-center justify-end gap-3">
            <button onClick={onClose} className="btn-secondary" disabled={uploading}>
              Cancel
            </button>
            <button
              onClick={handleUpload}
              className="btn-primary"
              disabled={files.length === 0 || !projectName.trim() || uploading}
            >
              {uploading ? 'Processing...' : `Upload ${files.length} File(s) & Analyze`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
