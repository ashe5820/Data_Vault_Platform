"use client";
import React from 'react';
import { FileText, File } from 'lucide-react';
import AssetCard from './AssetCard';

interface AssetsTabProps {
  assets: any[];
  registrationStatus: string;
  loading: boolean;
  onRegisterOwnership: (assetId: string) => void;
  onViewOwnershipDeed: (asset: any) => void;
  onShowLicenseModal: (asset: any) => void;
  onSwitchToUpload: () => void;
}

const AssetsTab: React.FC<AssetsTabProps> = ({
  assets,
  registrationStatus,
  loading,
  onRegisterOwnership,
  onViewOwnershipDeed,
  onShowLicenseModal,
  onSwitchToUpload
}) => {
  return (
    <div>
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-semibold flex items-center">
                <FileText className="w-6 h-6 mr-2" />
                Your Assets ({assets.length})
              </h2>
            </div>
            
            {registrationStatus && (
              <div className={`mb-4 p-4 rounded-lg ${registrationStatus.includes('success') ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                {registrationStatus}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assets.map((asset) => (
                <AssetCard
                key={asset.id}
                asset={asset}
                loading={loading}
                onRegisterOwnership={onRegisterOwnership}
                onViewOwnershipDeed={onViewOwnershipDeed}
                onShowLicenseModal={onShowLicenseModal}
              />
              ))}
            </div>
            
            {assets.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg">
                <File className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No assets uploaded yet</p>
                <button
                  onClick={() => onSwitchToUpload()}
                  className="mt-4 text-blue-600 hover:text-blue-700"
                >
                  Upload your first asset
                </button>
              </div>
            )}
        </div>
  );
};

export default AssetsTab;