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
}

interface LicenseModalProps {
    isOpen: boolean;
    selectedAsset: any;
    loading: boolean;
    onFormChange: (field: keyof LicenseForm, value: string | number | boolean) => void;
    onCreate: () => void;
    onClose: () => void;
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
};

const LicenseModal: React.FC<LicenseModalProps> = ({
                                                       isOpen,
                                                       selectedAsset,
                                                       loading,
                                                       onFormChange,
                                                       onCreate,
                                                       onClose,
                                                   }) => {
    const [advancedOpen, setAdvancedOpen] = useState(false);
    const [formData, setFormData] = useState<LicenseForm>(defaultLicenseForm); // ✅ Add local state

    // Handle form changes locally and propagate to parent
    const handleFormChange = (field: keyof LicenseForm, value: string | number | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value })); // ✅ Update local state
        onFormChange(field, value); // ✅ Notify parent
    };

    // Reset form when modal closes
    React.useEffect(() => {
        if (!isOpen) {
            setFormData(defaultLicenseForm); // ✅ Reset form when modal closes
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
                            Default rights: Non-exclusive, irrevocable, worldwide, royalty-free, no derivatives, no transfer.
                        </p>
                    </div>
                )}

                {/* Basic Fields */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Licensee Address</label>
                        <input
                            type="text"
                            value={formData.licensee} // ✅ Use local state
                            onChange={(e) => handleFormChange("licensee", e.target.value)} // ✅ Use local handler
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="0x..."
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
                        <input
                            type="number"
                            value={formData.duration} // ✅ Use local state
                            onChange={(e) => handleFormChange("duration", parseInt(e.target.value) || 0)} // ✅ Use local handler
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            disabled={loading}
                            min={1}
                        />
                    </div>

                    <div>
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={formData.commercialUse} // ✅ Use local state
                                onChange={(e) => handleFormChange("commercialUse", e.target.checked)} // ✅ Use local handler
                                className="mr-2"
                                disabled={loading}
                            />
                            <span className="text-sm">Allow commercial use</span>
                        </label>
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
                                    checked={formData[option.key as keyof LicenseForm] as boolean} // ✅ Use local state
                                    onChange={(e) => handleFormChange(option.key as keyof LicenseForm, e.target.checked)} // ✅ Use local handler
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
                                    value={formData.terminationNoticeDays} // ✅ Use local state
                                    onChange={(e) => handleFormChange("terminationNoticeDays", parseInt(e.target.value) || 0)} // ✅ Use local handler
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
                        disabled={loading || !formData.licensee || !selectedAsset} // ✅ Use local state
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