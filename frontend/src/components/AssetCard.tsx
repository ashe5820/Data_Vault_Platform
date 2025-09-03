"use client";
import React from 'react';
import { File, Shield, AlertCircle, Eye } from 'lucide-react';



interface AssetCardProps {
  asset: any;
  loading: boolean;
  onRegisterOwnership: (assetId: string) => void;
  onViewOwnershipDeed: (asset: any) => void;
  onShowLicenseModal: (asset: any) => void;
}

const AssetCard: React.FC<AssetCardProps> = ({
  asset,
  loading,
  onRegisterOwnership,
  onViewOwnershipDeed,
  onShowLicenseModal
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <File className="w-8 h-8 text-blue-500 mr-3" />
          <div>
            <h3 className="font-semibold text-gray-800">{asset.assetName}</h3>
            <p className="text-sm text-gray-500">{asset.description}</p>
          </div>
        </div>
        {asset.status === 'registered' ? (
          <Shield className="w-6 h-6 text-green-500" />
        ) : (
          <AlertCircle className="w-6 h-6 text-yellow-500" />
        )}
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Status:</span>
          <span className={`font-medium ${asset.status === 'registered' ? 'text-green-600' : 'text-yellow-600'}`}>
            {asset.status === 'registered' ? 'Protected' : 'Uploaded'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">IPFS Hash:</span>
          <span className="font-mono text-xs">{asset.ipfsHash?.substring(0, 12)}...</span>
        </div>
        {asset.transactionHash && (
          <div className="flex justify-between">
            <span className="text-gray-600">Tx Hash:</span>
            <span className="font-mono text-xs">{asset.transactionHash?.substring(0, 12)}...</span>
          </div>
        )}
      </div>
      
      <div className="mt-4 flex gap-2">
        {asset.status !== 'registered' && (
          <button
            onClick={() => onRegisterOwnership(asset.id)}
            disabled={loading}
            className="flex-1 bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Register Ownership
          </button>
        )}
        {asset.status === 'registered' && (
          <>
            <button
              onClick={() => onViewOwnershipDeed(asset)}
              className="flex-1 bg-purple-500 text-white px-3 py-2 rounded hover:bg-purple-600 text-sm flex items-center justify-center gap-1"
            >
              <Eye className="w-4 h-4" />
              View Deed
            </button>
            <button
              onClick={() => onShowLicenseModal(asset)}
              className="flex-1 bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 text-sm"
            >
              Create License
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AssetCard;