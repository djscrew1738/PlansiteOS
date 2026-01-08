import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function BlueprintUpload({ onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [projectName, setProjectName] = useState('');
  const [projectAddress, setProjectAddress] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
    onDrop: acceptedFiles => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]);
      }
    },
  });

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    if (!projectName.trim()) {
      toast.error('Please enter a project name');
      return;
    }

    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('blueprint', file);
    formData.append('projectName', projectName);
    if (projectAddress.trim()) {
      formData.append('projectAddress', projectAddress);
    }

    try {
      const response = await axios.post(`${BASE_URL}/api/blueprints/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'x-correlation-id': crypto.randomUUID(),
        },
        onUploadProgress: progressEvent => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        },
      });

      toast.success('Blueprint uploaded successfully!');
      onSuccess(response.data);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.error?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Upload Blueprint</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition-all"
            disabled={uploading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* File Drop Zone */}
          <div>
            <label className="label flex items-center space-x-2">
              <FileText className="w-4 h-4 text-gray-600" />
              <span>Blueprint File</span>
            </label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                isDragActive
                  ? 'border-primary-500 bg-primary-50 scale-[1.02]'
                  : file
                  ? 'border-emerald-400 bg-emerald-50/50'
                  : 'border-gray-300 hover:border-primary-400 hover:bg-blue-50/30'
              }`}
            >
              <input {...getInputProps()} />
              {file ? (
                <div className="flex items-center justify-center space-x-4 animate-fade-in">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-600">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • Ready to upload
                    </p>
                  </div>
                </div>
              ) : (
                <div className="animate-fade-in">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                    <Upload className={`w-8 h-8 text-blue-600 ${isDragActive ? 'animate-pulse' : ''}`} />
                  </div>
                  <p className="text-gray-900 font-semibold mb-2">
                    {isDragActive ? 'Drop the file here' : 'Drag & drop your blueprint'}
                  </p>
                  <p className="text-sm text-gray-500">
                    or click to browse • PNG, JPG, PDF • max 50MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Project Name */}
          <div>
            <label htmlFor="projectName" className="label">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="projectName"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              className="input"
              placeholder="e.g., Smith Residence Bathroom Remodel"
              disabled={uploading}
            />
          </div>

          {/* Project Address */}
          <div>
            <label htmlFor="projectAddress" className="label">
              Project Address (Optional)
            </label>
            <input
              type="text"
              id="projectAddress"
              value={projectAddress}
              onChange={e => setProjectAddress(e.target.value)}
              className="input"
              placeholder="e.g., 123 Main St, City, State 12345"
              disabled={uploading}
            />
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">AI-Powered Analysis</p>
              <p>
                Once uploaded, Claude Vision will analyze your blueprint to detect fixtures,
                measurements, and room layouts. This typically takes 30-60 seconds.
              </p>
            </div>
          </div>

          {/* Progress */}
          {uploading && (
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={uploading}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            className="btn-primary"
            disabled={!file || !projectName.trim() || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload & Analyze'}
          </button>
        </div>
      </div>
    </div>
  );
}
