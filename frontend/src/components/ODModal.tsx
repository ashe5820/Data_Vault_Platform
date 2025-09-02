"use client";
import React from 'react';
import { X, Shield, Download } from 'lucide-react';
import { formatFileSize } from './utils/formatters';

interface OwnershipDeed {
  asset: {
    id: string;
    assetName: string;
    description: string;
    ipfsHash: string;
    contentType?: string;
    size?: number;
  };
  createdAt: string;
  odDocument?: {
    data?: {
      jurisdiction?: string;
      termsAndConditions?: Record<string, string>;
    };
    hash?: string;
  };
  transactionHash?: string;
  blockNumber?: string;
}

interface OwnershipDeedModalProps {
  isOpen: boolean;
  selectedDeed: OwnershipDeed | null;
  currentUser: {
    name: string;
    address: string;
  };
  onClose: () => void;
  onDownload: () => void;
}

const OwnershipDeedModal: React.FC<OwnershipDeedModalProps> = ({
  isOpen,
  selectedDeed,
  currentUser,
  onClose,
  onDownload
}) => {
  if (!isOpen || !selectedDeed) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Ownership Deed</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Deed Header */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <div className="flex items-center">
            <Shield className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <p className="text-lg font-semibold text-blue-900">Digital Asset Ownership Deed</p>
              <p className="text-sm text-blue-700">Blockchain Verified</p>
            </div>
          </div>
        </div>

        {/* Asset Information */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3 border-b pb-2">Asset Information</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Asset ID:</span>
              <span className="font-mono">{selectedDeed.asset.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Name:</span>
              <span className="font-medium">{selectedDeed.asset.assetName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Description:</span>
              <span>{selectedDeed.asset.description}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">IPFS Hash:</span>
              <span className="font-mono text-xs break-all">{selectedDeed.asset.ipfsHash}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">File Type:</span>
              <span>{selectedDeed.asset.contentType || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">File Size:</span>
              <span>{formatFileSize(selectedDeed.asset.size)}</span>
            </div>
          </div>
        </div>

        {/* Ownership Details */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3 border-b pb-2">Ownership Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Owner:</span>
              <span className="font-medium">{currentUser.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Owner Address:</span>
              <span className="font-mono text-xs">{currentUser.address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Registration Date:</span>
              <span>{new Date(selectedDeed.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Jurisdiction:</span>
              <span>{selectedDeed.odDocument?.data?.jurisdiction || 'United States'}</span>
            </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3 border-b pb-2">Terms and Conditions</h4>
          <div className="bg-gray-50 p-4 rounded text-sm space-y-2">
            {selectedDeed.odDocument?.data?.termsAndConditions ? (
              Object.entries(selectedDeed.odDocument.data.termsAndConditions).map(([key, value]) => (
                <div key={key} className="flex">
                  <span className="font-medium text-gray-700 capitalize w-32">{key}:</span>
                  <span className="text-gray-600 flex-1">{value}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500">Standard terms apply</p>
            )}
          </div>
        </div>

        {/* Blockchain Verification */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3 border-b pb-2">Blockchain Verification</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Transaction Hash:</span>
              <span className="font-mono text-xs break-all">
                {selectedDeed.transactionHash || 'Pending...'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Block Number:</span>
              <span className="font-mono">{selectedDeed.blockNumber || 'Pending...'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Network:</span>
              <span>Ethereum {process.env.NEXT_PUBLIC_CHAIN_ID === '1' ? 'Mainnet' : 'Testnet'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Document Hash:</span>
              <span className="font-mono text-xs break-all">
                {selectedDeed.odDocument?.hash || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={onDownload}
            className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Deed
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OwnershipDeedModal;