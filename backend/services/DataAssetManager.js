const CryptoJS = require('crypto-js');

// handles off-chain part of architecture
class DataAssetManager {
    constructor(ipfsClient) {
        this.ipfs = ipfsClient;
        this.assets = new Map(); // Local in-memory "database" for asset metadata. In production, use a proper database. 
        this.odMetadata = new Map(); // Local in-memory "database" for on-chain deed metadata
        console.log("DataAssetManager initialized");
        this.licenses = new Map(); // Local in-memory "database" for license metadata

    }

    /**
     * Uploads data to IPFS with encryption and metadata
     * @param {Object} params
     * @param {Buffer|string|Object} params.data - The file data or string
     * @param {Object} params.metadata - Metadata object
     * @returns {Promise<string>} - IPFS path / CID
     */

    async uploadAsset({ data, metadata }) {
        console.log("DAM : Starting uploadAsset");
        console.log("DAM : Metadata:", metadata);

        try {
            // DATA NORMALISATION
            // Converts various input types (file buffers, objects, strings) into a consistent string format
            // so it can be uniformly encrypted. Binary data is converted to a Base64 string.
            let stringData;
            if (Buffer.isBuffer(data)) {
                stringData = data.toString('base64');
            } else if (typeof data === 'object') {
                stringData = JSON.stringify(data);
            } else {
                stringData = data; // assume string
            }

            // Encrypt the data
            const encryptionKey = CryptoJS.lib.WordArray.random(256 / 8).toString();    // 32 byte
            const encryptedData = CryptoJS.AES.encrypt(stringData, encryptionKey).toString();

            // Prepare IPFS payload
            const assetObject = {
                encryptedData,  // The unreadable ciphertext
                // encryptionKey,   // The key used for encryption
                metadata,
                timestamp: new Date().toISOString()
            };

            let licenseId = null;
            if (metadata.type === 'license') {
                console.log("DAM : Detected license, storing license metadata ...");
                licenseId = await this.storeLicenseMetadata(metadata);
                console.log("DAM : License metadata stored with ID:", licenseId);
            }

            // Convert JSON payload to Blob or Buffer
            const payload = Buffer.from(JSON.stringify(assetObject));
            console.log("DAM : Uploading payload to IPFS ...");

            // Upload to IPFS via ipfs-http-client
            const result = await this.ipfs.add(JSON.stringify(assetObject), { duplex: "half" });

            console.log("DAM : Upload successful. IPFS path:", result.path);
            return result.path;

        } catch (error) {
            console.error("DAM : Failed to upload to IPFS:", error);
            throw new Error(`DAM : Failed to upload to IPFS: ${error.message}`);
        }
    }


    async uploadLicense({ data, metadata }) {
        console.log("DAM : Starting uploadAsset");
        console.log("DAM : Metadata:", metadata);

        try {
            // DATA NORMALISATION
            // Converts various input types (file buffers, objects, strings) into a consistent string format 
            // so it can be uniformly encrypted. Binary data is converted to a Base64 string.
            let stringData;
            if (Buffer.isBuffer(data)) {
                stringData = data.toString('base64');
            } else if (typeof data === 'object') {
                stringData = JSON.stringify(data);
            } else {
                stringData = data; // assume string
            }

            // Encrypt the data
            const encryptionKey = CryptoJS.lib.WordArray.random(256 / 8).toString();    // 32 byte
            const encryptedData = CryptoJS.AES.encrypt(stringData, encryptionKey).toString();

            // Prepare IPFS payload
            const assetObject = {
                encryptedData,  // The unreadable ciphertext
                // encryptionKey,   // The key used for encryption
                metadata,       
                timestamp: new Date().toISOString()
            };

            let licenseId = null;
            if (metadata.type === 'license') {
                console.log("DAM : Detected license, storing license metadata ...");
                licenseId = await this.storeLicenseMetadata(metadata);
                console.log("DAM : License metadata stored with ID:", licenseId);
            }

            // Convert JSON payload to Blob or Buffer
            const payload = Buffer.from(JSON.stringify(assetObject));
            console.log("DAM : Uploading payload to IPFS ...");

            // Upload to IPFS via ipfs-http-client
            const result = await this.ipfs.add(JSON.stringify(assetObject), { duplex: "half" });

            console.log("DAM : Upload successful. IPFS path:", result.path);
            return {
                ipfsPath: result.path, // the hash
                licenseId: licenseId
            };

        } catch (error) {
            console.error("DAM : Failed to upload to IPFS:", error);
            throw new Error(`DAM : Failed to upload to IPFS: ${error.message}`);
        }
    }

    /**
     * Save a license metadata entry after upload
     */
    async storeLicenseMetadata(metadata) {
        const licenseId = `license_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.licenses.set(licenseId, {
            ...metadata,
            id: licenseId,
            createdAt: new Date().toISOString()
        });
        return licenseId;
    }

    async storeAssetMetadata(metadata) {
        const assetId = `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.assets.set(assetId, {
            ...metadata,
            id: assetId,
            createdAt: new Date().toISOString(),
            status: 'uploaded'
        });
        return assetId;
    }

    async getAssetMetadata(assetId) {
        try {
            console.log("DAM is trying to retrieve the metadata for:", assetId);
            console.log("DAM: but first let's print out all assets");
            this.printAllContents()
            const metadata = this.assets.get(assetId);
    
            if (metadata === undefined) {
                // Handle the case where the assetId is not found
                throw new Error(`DAM : Metadata not found for assetId: ${assetId}`);
            }
    
            console.log("DAM has found metadata", metadata);
            return metadata;
    
        } catch (error) {
            // Log the error for debugging purposes
            console.error("DAM : Error retrieving asset metadata:", error.message);
            // You can choose to re-throw the error, return null, or return a default value
            throw error; // Propagates the error to the caller
            // return null; // Alternatively, return a null value to the caller
        }
    }

    async getUserAssets(userId) {
        const userAssets = [];
        for (const [id, asset] of this.assets) {
            if (asset.userId === userId) {
                userAssets.push({ id, ...asset });
            }
        }
        return userAssets;
    }

    /**
     * Get all licenses created by a specific user
     * (user is licensor / asset owner)
     */
    async getUserLicenses(userId) {
        const userLicenses = [];
        for (const [id, license] of this.licenses) {
            // if (license.licensor === userId) {
                userLicenses.push({ id, ...license });
            // }
        }
        console.log("DAM: content of license map is: ", this.licenses);
        console.log("DAM: we have foudn this many user licenses: ", userLicenses);
        return userLicenses;
    }

    async saveODMetadata({ assetId, odDocument, transactionHash, blockNumber, regAssetID }) {
        console.log("DAM: saving given OD metadata ...")
        console.log("DAM: we have received regAssetID value: ", regAssetID);
        this.odMetadata.set(assetId, {
            odDocument,
            transactionHash,
            blockNumber,
            createdAt: new Date().toISOString(),
            regAssetID,
        });
        
        // Update asset status
        const asset = this.assets.get(assetId);
        console.log("DAM: we have saved odMetadata:", this.getAssetMetadata(assetId));
        if (asset) {
            asset.status = 'registered';
            asset.transactionHash = transactionHash;
        }
    }

    async getODMetadata(assetId) {
        return this.odMetadata.get(assetId);
    }

    printAllContents() {
        console.log("==== DAM: All Assets ====");
        for (const [id, asset] of this.assets) {
            console.log(id, asset);
        }

        console.log("==== DAM: All Ownership Deeds (OD Metadata) ====");
        for (const [assetId, od] of this.odMetadata) {
            console.log(assetId, od);
        }
    }

}

module.exports = DataAssetManager;

