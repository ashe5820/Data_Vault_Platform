const CryptoJS = require('crypto-js');

class DataAssetManager {
    constructor(ipfsClient) {
        this.ipfs = ipfsClient;
        this.assets = new Map(); // In production, use a proper database
        this.odMetadata = new Map();
        console.log("DataAssetManager initialized");
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
            // Convert Buffer or object to string
            let stringData;
            if (Buffer.isBuffer(data)) {
                stringData = data.toString('base64');
            } else if (typeof data === 'object') {
                stringData = JSON.stringify(data);
            } else {
                stringData = data; // assume string
            }

            // Encrypt the data
            const encryptionKey = CryptoJS.lib.WordArray.random(256 / 8).toString();
            const encryptedData = CryptoJS.AES.encrypt(stringData, encryptionKey).toString();

            // Prepare IPFS payload
            const assetObject = {
                encryptedData,
                encryptionKey,
                metadata,
                timestamp: new Date().toISOString()
            };

            // Convert JSON payload to Blob or Buffer
            const payload = Buffer.from(JSON.stringify(assetObject));
            console.log("DAM : Uploading payload to IPFS ...");
            // Upload to IPFS via ipfs-http-client
            const result = await this.ipfs.add(JSON.stringify(assetObject), { duplex: "half" });

            console.log("DAM : Upload successful. IPFS path:", result.path);
            return result.path; // Returns IPFS hash

        } catch (error) {
            console.error("DAM : Failed to upload to IPFS:", error);
            throw new Error(`DAM : Failed to upload to IPFS: ${error.message}`);
        }
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

    async saveODMetadata({ assetId, odDocument, transactionHash, blockNumber }) {
        this.odMetadata.set(assetId, {
            odDocument,
            transactionHash,
            blockNumber,
            createdAt: new Date().toISOString()
        });
        
        // Update asset status
        const asset = this.assets.get(assetId);
        if (asset) {
            asset.status = 'registered';
            asset.transactionHash = transactionHash;
        }
    }

    async getODMetadata(assetId) {
        return this.odMetadata.get(assetId);
    }
}

module.exports = DataAssetManager;

