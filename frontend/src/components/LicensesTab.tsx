// LicensesTab.tsx
"use client";
import React, { useState } from 'react';
import {
    Key,
    Users,
    Calendar,
    DollarSign,
    User,
    FileText,
    Shield,
    Copy,
    Globe,
    Edit3,
    Share2,
    Move,
    Box,
    Award,
    Bell,
    CheckCircle,
    XCircle,
    Crown,
    Languages,
    Truck,
    Percent,
    Type,
    MapPin,
    Download,
    X
} from 'lucide-react';

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
    onDownloadLicense?: (license: License) => void;
}

const LicensesTab: React.FC<LicensesTabProps> = ({
                                                     licenses = [],
                                                     isLoading = false,
                                                     onRevokeLicense,
                                                     onDownloadLicense
                                                 }) => {
    const [showTemplate, setShowTemplate] = useState(false);
    const [selectedLicense, setSelectedLicense] = useState<License | null>(null);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'expired': return 'bg-gray-100 text-gray-800';
            case 'revoked': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const BooleanDisplay = ({ value }: { value: boolean }) => (
        <span className={`px-2 py-1 rounded text-xs ${value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {value ? 'Yes' : 'No'}
        </span>
    );

    // Hardcoded jurisdictions for display
    const displayJurisdictions = ["United States", "Brazil", "Australia", "United Kingdom", "France", "Germany"];

    const handleViewTemplate = (license: License) => {
        setSelectedLicense(license);
        setShowTemplate(true);
    };

    const handleCloseTemplate = () => {
        setShowTemplate(false);
        setSelectedLicense(null);
    };

    // Function to generate filled license template
    const getFilledLicenseTemplate = (license: License) => {
        const expirationDate = new Date(license.createdAt);
        expirationDate.setDate(expirationDate.getDate() + license.duration);

        return `DIGITAL ASSET LICENSE AGREEMENT
This License Agreement ("Agreement") is entered into on ${new Date(license.createdAt).toLocaleDateString()}

BETWEEN:
Licensor: ${'0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266\n'} ("Licensor")
AND
Licensee: ${license.licensee} ("Licensee")

REGARDING:
Asset ID: ${license.assetId}
Asset Name: ${license.assetName || 'Digital Asset'}

1. LICENSE GRANT
The Licensor grants the Licensee the following rights to use the above-referenced asset:

1.1 Exclusivity
* Type: ${license.commercialUse ? 'COMMERCIAL' : 'NON-COMMERCIAL'}

1.2 Territorial Scope
* Territory: WORLDWIDE

1.3 Sublicensing
* Sublicensing: PERMITTED

1.4 Revocability
* Status: ${license.status === 'active' ? 'ACTIVE' : license.status}

2. COMMERCIAL TERMS
2.1 Commercial Use
* ${license.commercialUse ? 'PERMITTED' : 'NON-COMMERCIAL'}

2.2 License Fees
* ROYALTY-FREE
* Payment Terms: Due upon execution of this agreement.

3. USAGE RIGHTS
3.1 Reproduction
* Unlimited copies allowed for licensed uses

3.2 Physical Distribution
* ALLOWED in digital and physical formats

3.3 Derivatives
* PERMITTED
* Viral License: NO

3.4 Translation
* PERMITTED

3.5 Transfer of Rights
* PERMITTED

3.6 Field of Use
* All fields of use unless otherwise restricted by law

3.7 Permitted Uses
* Personal use, commercial use (if permitted), display, reproduction, and distribution as authorized

3.8 Restrictions
* No unlawful use, no circumvention of DRM protections, no redistribution beyond license terms

4. LICENSE DURATION
* Effective Date: ${new Date(license.createdAt).toLocaleDateString()}
* Expiration Date: ${formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())}
* Duration: ${21} days

5. ATTRIBUTION
* NO ATTRIBUTION REQUIRED

6. TERMINATION
* Termination Notice: 30 days

7. GOVERNING LAW & JURISDICTION
* Primary Jurisdiction: United States
* Additional Jurisdictions: Australia, United Kingdom, France, Germany, Brazil
* Dispute Resolution: Arbitration in accordance with international commercial arbitration rules

8. WARRANTIES & LIABILITY
* Warranties: Licensor provides asset "as-is"; no additional warranties.
* Liability: Licensor not liable for any damages arising from use.

9. BLOCKCHAIN RECORD
* This agreement has been recorded on the blockchain for immutable verification.
* Transaction Hash: ${'0x3967e3f354ba37c695e4228996d4c998f952aacb91d3c68dee587a0c44ee4128'}

10. ENTIRE AGREEMENT
This Agreement constitutes the complete understanding between the parties and supersedes all prior agreements.

DIGITAL SIGNATURES:
Licensor: ${'0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266\n'}
Licensee: ${license.licensee}
Execution Date: ${new Date(license.createdAt).toLocaleDateString()}`;
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

            {/* Template Modal */}
            {showTemplate && selectedLicense && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-4">
                            <h4 className="text-xl font-bold text-gray-900">Smart Legal Contract</h4>
                            <button
                                onClick={handleCloseTemplate}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg border">
                            <pre className="whitespace-pre-wrap text-sm font-mono text-gray-800 leading-relaxed">
                                {getFilledLicenseTemplate(selectedLicense)}
                            </pre>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={handleCloseTemplate}
                                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {licenses.length > 0 ? (
                <div className="mt-6 space-y-4">
                    {licenses.map(license => {
                        return (
                            <div key={license.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center">
                                                <FileText className="w-5 h-5 mr-2 text-gray-500" />
                                                <h3 className="font-semibold">{license.assetName || `License ${license.assetId}`}</h3>
                                                <span className={`ml-3 px-2 py-1 rounded-full text-xs ${getStatusColor(license.status)}`}>
                                                    {license.status}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Basic Information */}
                                        <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 mb-3">
                                            <div className="flex items-center">
                                                <User className="w-4 h-4 mr-1" />
                                                <span>Licensee: </span>
                                                <span className="font-mono text-xs ml-1">
                                                    {license.licensee.slice(0, 6)}...{license.licensee.slice(-4)}
                                                </span>
                                            </div>

                                            <div className="flex items-center">
                                                <Calendar className="w-4 h-4 mr-1" />
                                                <span>Expires: {formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())}</span>
                                            </div>

                                            <div className="flex items-center">
                                                <DollarSign className="w-4 h-4 mr-1" />
                                                <span>Commercial: </span>
                                                <BooleanDisplay value={true} />
                                            </div>

                                            <div className="flex items-center">
                                                <Calendar className="w-4 h-4 mr-1" />
                                                <span>Created: {formatDate(license.createdAt)}</span>
                                            </div>
                                        </div>

                                        {/* Jurisdictions */}
                                        <div className="border-t pt-3 mt-3">
                                            <h4 className="font-medium text-sm mb-2 flex items-center">
                                                <MapPin className="w-4 h-4 mr-1" />
                                                Jurisdictions
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {displayJurisdictions.map((jurisdiction, index) => (
                                                    <span
                                                        key={index}
                                                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                                    >
                                                        {jurisdiction}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Advanced License Terms */}
                                        <div className="border-t pt-3 mt-3">
                                            <h4 className="font-medium text-sm mb-2 flex items-center">
                                                <Shield className="w-4 h-4 mr-1" />
                                                License Terms
                                            </h4>
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className="flex items-center">
                                                    <Crown className="w-3 h-3 mr-1" />
                                                    <span>Exclusive: </span>
                                                    <BooleanDisplay value={false} />
                                                </div>
                                                <div className="flex items-center">
                                                    <Share2 className="w-3 h-3 mr-1" />
                                                    <span>Sublicensable: </span>
                                                    <BooleanDisplay value={true} />
                                                </div>
                                                <div className="flex items-center">
                                                    <Shield className="w-3 h-3 mr-1" />
                                                    <span>Revocable: </span>
                                                    <BooleanDisplay value={false} />
                                                </div>
                                                <div className="flex items-center">
                                                    <Edit3 className="w-3 h-3 mr-1" />
                                                    <span>Derivatives: </span>
                                                    <BooleanDisplay value={true} />
                                                </div>
                                                <div className="flex items-center">
                                                    <Copy className="w-3 h-3 mr-1" />
                                                    <span>Viral License: </span>
                                                    <BooleanDisplay value={false} />
                                                </div>
                                                <div className="flex items-center">
                                                    <Languages className="w-3 h-3 mr-1" />
                                                    <span>Translation: </span>
                                                    <BooleanDisplay value={true} />
                                                </div>
                                                <div className="flex items-center">
                                                    <Move className="w-3 h-3 mr-1" />
                                                    <span>Transferable: </span>
                                                    <BooleanDisplay value={false} />
                                                </div>
                                                <div className="flex items-center">
                                                    <Truck className="w-3 h-3 mr-1" />
                                                    <span>Physical Dist: </span>
                                                    <BooleanDisplay value={true} />
                                                </div>
                                                <div className="flex items-center">
                                                    <Percent className="w-3 h-3 mr-1" />
                                                    <span>Royalty Free: </span>
                                                    <BooleanDisplay value={true} />
                                                </div>
                                                <div className="flex items-center">
                                                    <Type className="w-3 h-3 mr-1" />
                                                    <span>Attribution: </span>
                                                    <BooleanDisplay value={false} />
                                                </div>
                                                <div className="flex items-center col-span-2">
                                                    <Bell className="w-3 h-3 mr-1" />
                                                    <span>Termination Notice: 30 days</span>
                                                </div>
                                            </div>
                                        </div>

                                        {license.transactionHash && (
                                            <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                                                <span className="font-medium">Tx: </span>
                                                {license.transactionHash.slice(0, 10)}...{license.transactionHash.slice(-8)}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-2 ml-4">
                                        {/* View Smart Contract Button */}
                                        <button
                                            onClick={() => handleViewTemplate(license)}
                                            className="flex items-center justify-center p-2 text-green-600 hover:text-green-800 border border-green-300 rounded hover:bg-green-50"
                                            title="View Smart Legal Contract"
                                        >
                                            <FileText className="w-4 h-4" />
                                        </button>

                                        {/* Download Button */}
                                        {onDownloadLicense && (
                                            <button
                                                onClick={() => onDownloadLicense(license)}
                                                className="flex items-center justify-center p-2 text-blue-500 hover:text-blue-700 border border-blue-300 rounded hover:bg-blue-50"
                                                title="Download License Agreement"
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
                                        )}
                                        {/* Revoke Button */}
                                        {onRevokeLicense && (
                                            <button
                                                onClick={() => onRevokeLicense(license.id)}
                                                className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                                            >
                                                Revoke
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
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