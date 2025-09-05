// LicensesTab.tsx
"use client";
import React from 'react';
import { Key, Users, Calendar, DollarSign, User, FileText } from 'lucide-react';

interface License {
    id: string;
    assetId: string;
    assetName?: string;
    licensee: string;
    licensor: string;
    duration: number;
    commercialUse: boolean;
    status: 'active' | 'expired' | 'revoked';
    createdAt: string;
    expiresAt: string;
    transactionHash?: string;
}

interface LicensesTabProps {
    licenses?: License[];
    isLoading?: boolean;
    onRevokeLicense?: (licenseId: string) => void;
}

const LicensesTab: React.FC<LicensesTabProps> = ({
                                                     licenses = [],
                                                     isLoading = false,
                                                     onRevokeLicense
                                                 }) => {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    console.log("Licenses length: ", licenses.length);

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'expired': return 'bg-gray-100 text-gray-800';
            case 'revoked': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg shadow p-8">
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                    <Key className="w-6 h-6 mr-2" />
                    License Management
                </h2>
                <p className="text-gray-600">Loading licenses...</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-xl font-semibold mb-6 flex items-center">
                <Key className="w-6 h-6 mr-2" />
                License Management
            </h2>

            {licenses.length > 0 ? (
                <div className="mt-6 space-y-4">
                    {licenses.map(license => (
                        <div key={license.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center mb-2">
                                        <FileText className="w-5 h-5 mr-2 text-gray-500" />
                                        <h3 className="font-semibold">{license.assetName || `Asset ${license.assetId}`}</h3>
                                        <span className={`ml-3 px-2 py-1 rounded-full text-xs ${getStatusColor(license.status)}`}>
                      {license.status}
                    </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                                        <div className="flex items-center">
                                            <User className="w-4 h-4 mr-1" />
                                            <span>Licensee: </span>
                                            <span className="font-mono text-xs ml-1">
                        {license.licensee.slice(0, 6)}...{license.licensee.slice(-4)}
                      </span>
                                        </div>

                                        <div className="flex items-center">
                                            <Calendar className="w-4 h-4 mr-1" />
                                            <span>Expires: {formatDate(license.expiresAt)}</span>
                                        </div>

                                        <div className="flex items-center">
                                            <DollarSign className="w-4 h-4 mr-1" />
                                            <span>Commercial: {license.commercialUse ? 'Yes' : 'No'}</span>
                                        </div>

                                        <div className="flex items-center">
                                            <Calendar className="w-4 h-4 mr-1" />
                                            <span>Created: {formatDate(license.createdAt)}</span>
                                        </div>
                                    </div>

                                    {license.transactionHash && (
                                        <div className="mt-2 text-xs text-gray-500">
                                            Tx: {license.transactionHash.slice(0, 10)}...{license.transactionHash.slice(-8)}
                                        </div>
                                    )}
                                </div>

                                {license.status === 'active' && onRevokeLicense && (
                                    <button
                                        onClick={() => onRevokeLicense(license.id)}
                                        className="ml-4 px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                                    >
                                        Revoke
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="mt-8 text-center py-8">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No licenses created yet</p>
                    <p className="text-sm text-gray-400 mt-2">
                        Create licenses to grant access to your protected assets
                    </p>
                </div>
            )}
        </div>
    );
};

export default LicensesTab;