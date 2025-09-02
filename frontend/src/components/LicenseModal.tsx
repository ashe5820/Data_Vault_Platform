"use client";
import React from 'react';

interface LicenseForm {
  licensee: string;
  duration: number;
  commercialUse: boolean;
}

interface LicenseModalProps {
  isOpen: boolean;
  licenseForm: LicenseForm;
  loading: boolean;
  selectedAsset: any; // You can create a proper interface for this
  onFormChange: (field: keyof LicenseForm, value: string | number | boolean) => void;
  onCreate: () => void;
  onClose: () => void;
}

const LicenseModal: React.FC<LicenseModalProps> = ({
  isOpen,
  licenseForm,
  loading,
  selectedAsset,
  onFormChange,
  onCreate,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">Create License</h3>
        
        {selectedAsset && (
          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <p className="text-sm font-medium">For: {selectedAsset.assetName}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Licensee Address
            </label>
            <input
              type="text"
              value={licenseForm.licensee}
              onChange={(e) => onFormChange('licensee', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="0x..."
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (days)
            </label>
            <input
              type="number"
              value={licenseForm.duration}
              onChange={(e) => onFormChange('duration', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={loading}
              min="1"
            />
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={licenseForm.commercialUse}
                onChange={(e) => onFormChange('commercialUse', e.target.checked)}
                className="mr-2"
                disabled={loading}
              />
              <span className="text-sm">Allow commercial use</span>
            </label>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
             onClick={(e) => {
                console.log("Create License initiated");
                onCreate();
            }}
            disabled={loading || !licenseForm.licensee}
            className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create License'}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default LicenseModal;