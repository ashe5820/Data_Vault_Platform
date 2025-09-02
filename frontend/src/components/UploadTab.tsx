"use client";
import React from 'react';
import { Upload } from 'lucide-react';

interface UploadTabProps {
  loading: boolean;
  uploadStatus: string;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const UploadTab: React.FC<UploadTabProps> = ({ loading, uploadStatus, onFileUpload }) => {
  return (
    <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-xl font-semibold mb-6 flex items-center">
              <Upload className="w-6 h-6 mr-2" />
              Upload & Encrypt Asset
            </h2>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <input
                type="file"
                onChange={onFileUpload}
                disabled={loading}
                className="hidden"
                id="file-upload"
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Select File to Upload'}
              </label>
              <p className="mt-2 text-sm text-gray-500">
                Supported formats: Images, Videos, Audio, Documents
              </p>
            </div>
            
            {uploadStatus && (
              <div className={`mt-4 p-4 rounded-lg ${uploadStatus.includes('success') ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                {uploadStatus}
              </div>
            )}
    </div>
  );
};

export default UploadTab;