"use client";
import React, { useState } from "react";

interface LicenseForm {
    licensee: string;
    duration: number;
    commercialUse: boolean;
    exclusiveLicense: boolean;
    sublicensable: boolean;
    revocable: boolean;
    derivativesAllowed: boolean;
    viralLicense: boolean;
    translationAllowed: boolean;
    transferable: boolean;
    physicalDistribution: boolean;
    royaltyFree: boolean;
    attributionRequired: boolean;
    terminationNoticeDays: number;
    additionalJurisdictions: string[]; // ✅ New field
}

interface LicenseModalProps {
    isOpen: boolean;
    selectedAsset: any;
    loading: boolean;
    onFormChange: (field: keyof LicenseForm, value: string | number | boolean | string[]) => void;
    onCreate: () => void;
    onClose: () => void;
    onDownload: () => void;
}

const defaultLicenseForm: LicenseForm = {
    licensee: "",
    duration: 30,
    commercialUse: false,
    exclusiveLicense: false,
    sublicensable: false,
    revocable: false,
    derivativesAllowed: false,
    viralLicense: false,
    translationAllowed: false,
    transferable: false,
    physicalDistribution: false,
    royaltyFree: true,
    attributionRequired: false,
    terminationNoticeDays: 0,
    additionalJurisdictions: [], // ✅ New field
};

// ✅ Main jurisdictions (10 countries)
const MAIN_JURISDICTIONS = [
    "United Kingdom",
    "Canada",
    "Australia",
    "Germany",
    "France",
    "Japan",
    "China",
    "Brazil",
    "India",
    "Mexico"
];

const LicenseModal: React.FC<LicenseModalProps> = ({
                                                       isOpen,
                                                       selectedAsset,
                                                       loading,
                                                       onFormChange,
                                                       onCreate,
                                                       onClose,
                                                   }) => {
    const [advancedOpen, setAdvancedOpen] = useState(false);
    const [jurisdictionsOpen, setJurisdictionsOpen] = useState(false);
    const [formData, setFormData] = useState<LicenseForm>(defaultLicenseForm);

    const handleFormChange = (field: keyof LicenseForm, value: string | number | boolean | string[]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        onFormChange(field, value);
    };

    const handleJurisdictionChange = (jurisdiction: string, isChecked: boolean) => {
        const updatedJurisdictions = isChecked
            ? [...formData.additionalJurisdictions, jurisdiction]
            : formData.additionalJurisdictions.filter(j => j !== jurisdiction);

        handleFormChange("additionalJurisdictions", updatedJurisdictions);
    };

    React.useEffect(() => {
        if (!isOpen) {
            setFormData(defaultLicenseForm);
            setJurisdictionsOpen(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full overflow-y-auto max-h-[90vh]">
                <h3 className="text-lg font-semibold mb-4">Create License</h3>

                {selectedAsset && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm font-medium">For: {selectedAsset.assetName}</p>
                        <p className="text-xs text-gray-600 mt-1">
                            Default jurisdiction: United States
                        </p>
                    </div>
                )}

                {/* Basic Fields */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Licensee Address</label>
                        <input
                            type="text"
                            value={formData.licensee}
                            onChange={(e) => handleFormChange("licensee", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="0x..."
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
                        <input
                            type="number"
                            value={formData.duration}
                            onChange={(e) => handleFormChange("duration", parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            disabled={loading}
                            min={1}
                        />
                    </div>

                    <div>
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={formData.commercialUse}
                                onChange={(e) => handleFormChange("commercialUse", e.target.checked)}
                                className="mr-2"
                                disabled={loading}
                            />
                            <span className="text-sm">Allow commercial use</span>
                        </label>
                    </div>

                    {/* Additional Jurisdictions */}
                    <div>
                        <button
                            type="button"
                            onClick={() => setJurisdictionsOpen(!jurisdictionsOpen)}
                            className="flex items-center text-sm text-blue-500 underline mb-2"
                        >
                            {jurisdictionsOpen ? "Hide Additional Jurisdictions" : "Show Additional Jurisdictions"}
                        </button>

                        {jurisdictionsOpen && (
                            <div className="border rounded-md p-3 bg-gray-50">
                                <p className="text-sm font-medium mb-2 text-gray-700">
                                    Add jurisdictions (default: United States)
                                </p>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {MAIN_JURISDICTIONS.map((jurisdiction) => (
                                        <label key={jurisdiction} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={formData.additionalJurisdictions.includes(jurisdiction)}
                                                onChange={(e) => handleJurisdictionChange(jurisdiction, e.target.checked)}
                                                className="mr-2"
                                                disabled={loading}
                                            />
                                            <span className="text-sm">{jurisdiction}</span>
                                        </label>
                                    ))}
                                </div>
                                {formData.additionalJurisdictions.length > 0 && (
                                    <p className="text-xs text-gray-500 mt-2">
                                        Selected: {formData.additionalJurisdictions.join(", ")}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Advanced Options */}
                <button
                    className="mt-4 text-sm text-blue-500 underline"
                    type="button"
                    onClick={() => setAdvancedOpen(!advancedOpen)}
                >
                    {advancedOpen ? "Hide Advanced Options" : "Show Advanced Options"}
                </button>

                {advancedOpen && (
                    <div className="mt-3 border-t pt-3 space-y-2">
                        {[
                            { key: "exclusiveLicense", label: "Exclusive License" },
                            { key: "sublicensable", label: "Allow Sublicensing" },
                            { key: "revocable", label: "Revocable License" },
                            { key: "derivativesAllowed", label: "Allow Derivatives" },
                            { key: "viralLicense", label: "Viral License" },
                            { key: "translationAllowed", label: "Allow Translation" },
                            { key: "transferable", label: "Transferable" },
                            { key: "physicalDistribution", label: "Physical Distribution" },
                            { key: "royaltyFree", label: "Royalty-Free" },
                            { key: "attributionRequired", label: "Require Attribution" },
                        ].map((option) => (
                            <label key={option.key} className="flex items-center">
                                <input
                                    type="checkbox"
                                    className="mr-2"
                                    disabled={loading}
                                    checked={formData[option.key as keyof LicenseForm] as boolean}
                                    onChange={(e) => handleFormChange(option.key as keyof LicenseForm, e.target.checked)}
                                />
                                <span className="text-sm">{option.label}</span>
                            </label>
                        ))}
                        <div className="mt-3 border-t pt-3 space-y-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Termination Notice Days
                                </label>
                                <input
                                    type="number"
                                    value={formData.terminationNoticeDays}
                                    onChange={(e) => handleFormChange("terminationNoticeDays", parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    disabled={loading}
                                    min={0}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="mt-6 flex gap-3">
                    <button
                        onClick={onCreate}
                        disabled={loading || !formData.licensee || !selectedAsset}
                        className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Creating..." : "Create License"}
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