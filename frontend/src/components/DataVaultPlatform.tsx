"use client";

import React, { useState, useEffect } from 'react';
import Header from './Header';
import NavigationTabs from './NavigationTabs';
import { formatFileSize, formatTermsAndConditions } from './utils/formatters';
import UploadTab from './UploadTab';
import AssetsTab from './AssetsTab';
import LicensesTab from './LicensesTab';
import AuditTab from './AuditTab';
import OwnershipDeedModal from './ODModal';
import LicenseModal from './LicenseModal';

const DataVaultPlatform = () => {
  const [currentTab, setCurrentTab] = useState('upload');
  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [registrationStatus, setRegistrationStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [showDeedModal, setShowDeedModal] = useState(false);
  const [selectedDeed, setSelectedDeed] = useState(null);
  const [licenses, setLicenses] = useState([]);
  const [licensesLoading, setLicensesLoading] = useState(false);
  const [licenseForm, setLicenseForm] = useState({
    licensee: '',
    duration: 30,
    commercialUse: false
  });

  const API_BASE = 'http://localhost:3001/api';

  // Simulated user data
  const currentUser = {
    id: 'user_001',
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
    name: 'Demo User'
  };

  useEffect(() => {
    loadUserAssets();
  }, []);

  const loadUserAssets = async () => {
    try {
      const response = await fetch(`${API_BASE}/assets/user/${currentUser.id}`);
      const data = await response.json();
      setAssets(data.assets || []);
    } catch (error) {
      console.error('Failed to load assets:', error);
    }
  };

    useEffect(() => {
        loadUserAssets();
        loadUserLicenses(); // Add this line
    }, []);

    const loadUserLicenses = async () => {
        setLicensesLoading(true);
        try {
            const response = await fetch(`${API_BASE}/licenses/user/${currentUser.id}`);
            const data = await response.json();
            console.log("data fetched licenses:", data);
            setLicenses(data.licenses || []);
        } catch (error) {
            console.error('Failed to load licenses:', error);
        } finally {
            setLicensesLoading(false);
        }
    };

    const onShowLicenseModal = async (asset) => {
        setLoading(true);
        try {
            // Fetch the ownership deed first
            const response = await fetch(`${API_BASE}/assets/${asset.id}/ownership-deed`);
            const data = await response.json();
            console.log("Fetched response data: ", data);
            // let regAssetID = data.ownershipDeed.regAssetID; // fallback
            // console.log("regAssetID: ", regAssetID);
            let regAssetID = asset.regAssetID || null; // fallback to existing
            if (data.ownershipDeed) {
                regAssetID = data.ownershipDeed.regAssetID;
            }

            setSelectedAsset({ ...asset, regAssetID: regAssetID});
            setShowLicenseModal(true);
        } catch (error) {
            alert('Failed to fetch ownership deed: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setUploadStatus('Encrypting and uploading to IPFS...');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', currentUser.id);
    formData.append('assetName', file.name);
    formData.append('description', `Uploaded on ${new Date().toLocaleDateString()}`);

    try {
      const response = await fetch(`${API_BASE}/assets/upload`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        setUploadStatus('Asset uploaded successfully! ✓');
        await loadUserAssets();
        setTimeout(() => {
          setUploadStatus('');
          setCurrentTab('assets');
        }, 2000);
      } else {
        setUploadStatus('Upload failed: ' + result.error);
      }
    } catch (error) {
      setUploadStatus('Upload failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterOwnership = async (assetId) => {
    setLoading(true);
    setRegistrationStatus('Creating Ownership Deed and notarizing on blockchain...');

    try {
      const response = await fetch(`${API_BASE}/assets/${assetId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          jurisdiction: 'United States',
          termsAndConditions: {
            ownership: 'Full ownership retained by creator',
            usage: 'No usage without explicit permission',
            distribution: 'Distribution prohibited without license',
            attribution: 'Attribution required for any authorized use',
            modifications: 'No modifications allowed',
            commercialUse: 'Commercial use prohibited'
          }
        })
      });

      const result = await response.json();


      if (result.success) {
          // result.regAssetId is the blockchain asset ID returned from backend
          setRegistrationStatus('Ownership Deed registered on blockchain! ✓');
        await loadUserAssets();
        setTimeout(() => {
          setRegistrationStatus('');
        }, 3000);
      } else {
        setRegistrationStatus('Registration failed: ' + result.error);
      }
    } catch (error) {
      setRegistrationStatus('Registration failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOwnershipDeed = async (asset) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/assets/${asset.id}/ownership-deed`);
      const data = await response.json();
      console.log("OD Data: ", data);
      if (data.ownershipDeed) {
        setSelectedDeed({
          ...data.ownershipDeed,
          asset: {
              ...asset,
              regAssetId: asset.regAssetId || data.ownershipDeed.regAssetID

          }
        });
        setShowDeedModal(true);
      } else {
        alert('No ownership deed found for this asset');
      }
    } catch (error) {
      alert('Failed to load ownership deed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDeed = () => {
    if (!selectedDeed) return;
    
    // Create a formatted text version of the deed
    const deedContent = `
DIGITAL ASSET OWNERSHIP DEED
=============================

Asset Information:
------------------
Asset ID: ${selectedDeed.asset.id}
Asset Name: ${selectedDeed.asset.assetName}
Description: ${selectedDeed.asset.description}
IPFS Hash: ${selectedDeed.asset.ipfsHash}
File Type: ${selectedDeed.asset.contentType || 'N/A'}
File Size: ${formatFileSize(selectedDeed.asset.size)}

Ownership Details:
------------------
Owner: ${currentUser.name} (${currentUser.address})
Registration Date: ${new Date(selectedDeed.createdAt).toLocaleDateString()}
Jurisdiction: ${selectedDeed.odDocument?.data?.jurisdiction || 'United States'}

Terms and Conditions:
---------------------
${formatTermsAndConditions(selectedDeed.odDocument?.data?.termsAndConditions)}

Blockchain Verification:
------------------------
Transaction Hash: ${selectedDeed.transactionHash || 'Pending...'}
Block Number: ${selectedDeed.blockNumber || 'Pending...'}
Network: Ethereum ${process.env.NEXT_PUBLIC_CHAIN_ID === '1' ? 'Mainnet' : 'Testnet'}

Digital Signature:
------------------
Document Hash: ${selectedDeed.odDocument?.hash || 'N/A'}
Signed by: ${currentUser.address}
Timestamp: ${new Date(selectedDeed.createdAt).toISOString()}

=============================
This deed has been notarized and recorded on the Ethereum blockchain for immutable verification.
Generated on: ${new Date().toLocaleString()}
    `;

    // Create and download the file
    const blob = new Blob([deedContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ownership-deed-${selectedDeed.asset.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };


  const handleCreateLicense = async () => {
    if (!selectedAsset || !licenseForm.licensee) return;
      // Pull regAssetId from the deed if available, fallback to selectedAsset.regAssetId
      console.log("Selected Asset is : ", selectedAsset);
      const regAssetID = selectedAsset.regAssetID;
      console.log("RegAssetID from selected asset: ", regAssetID);

      if (!regAssetID) {
          alert("Asset must be registered on blockchain before creating a license.");
          return;
      }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/assets/${selectedAsset.id}/license`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            regAssetID: regAssetID, // HERE IS WHERE I NEED HELP
          licensee: licenseForm.licensee,
          terms: {
            usage: 'Limited use as specified',
            distribution: 'No redistribution',
            attribution: 'Required',
            modifications: 'Not allowed',
            commercialUse: licenseForm.commercialUse
          },
          duration: licenseForm.duration,
          commercialUse: licenseForm.commercialUse,

        })
      });
      console.log("📡 Response status:", response.status, response.statusText);
      const result = await response.json();
      console.log("📨 Response data:", result);
      
      if (result.success) {
        console.log("✅ License created successfully");
        alert('License created successfully!');
        setShowLicenseModal(false);
        setLicenseForm({ licensee: '', duration: 30, commercialUse: false });
        await loadUserLicenses(); // Add this line to refresh licenses

      }
    } catch (error) {
      alert('Failed to create license: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
    const handleRevokeLicense = async (licenseId) => {
        if (!confirm('Are you sure you want to revoke this license?')) return;

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/licenses/${licenseId}/revoke`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser.id })
            });

            const result = await response.json();

            if (result.success) {
                alert('License revoked successfully!');
                await loadUserLicenses(); // Reload licenses
            } else {
                alert('Failed to revoke license: ' + result.error);
            }
        } catch (error) {
            alert('Failed to revoke license: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

  return (
    <div className="min-h-screen bg-gray-50">
        <Header currentUser={currentUser} />
        <NavigationTabs currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main Content */}
        <div className="bg-red-500 p-4 text-white rounded">`
          If this is red and styled, Tailwind is working!
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Upload Tab */}
          {currentTab === 'upload' && (
            <UploadTab
              loading={loading}
              uploadStatus={uploadStatus}
              onFileUpload={handleFileUpload}
            />
          )}

        {/* Assets Tab */}
          {currentTab === 'assets' && (
            <AssetsTab
            assets={assets}
            registrationStatus={registrationStatus}
            loading={loading}
            onRegisterOwnership={handleRegisterOwnership}
            onViewOwnershipDeed={handleViewOwnershipDeed}
            onShowLicenseModal={onShowLicenseModal} // <-- updated here
            onSwitchToUpload={() => setCurrentTab('upload')}
          />
          )}

        {/* Licenses Tab */}
        {currentTab === 'licenses' && (
            <LicensesTab
                licenses={licenses}
                isLoading={licensesLoading}
                onRevokeLicense={handleRevokeLicense} // Optional: if you added the revoke handler
            />
        )}

        {/* Audit Tab */}
        {currentTab === 'audit' && <AuditTab />}
      </div>

      {/* Ownership Deed Modal */}
      {showDeedModal && selectedDeed && <OwnershipDeedModal
            isOpen={showDeedModal}
            selectedDeed={selectedDeed}
            currentUser={currentUser}
            onClose={() => setShowDeedModal(false)}
            onDownload={handleDownloadDeed}
            />
      }
      {/* License Modal */}
      {showLicenseModal &&  <LicenseModal
          isOpen={showLicenseModal}
          licenseForm={licenseForm}
          loading={loading}
          selectedAsset={selectedAsset}
          onFormChange={(field, value) => setLicenseForm(prev => ({
            ...prev,
            [field]: value
          }))}
          onCreate={handleCreateLicense}
          onClose={() => setShowLicenseModal(false)}
        />}

</div>
  );
}

export default DataVaultPlatform;