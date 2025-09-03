class IPRService {
    constructor(slcEngine, blockchainService, dataAssetManager) {
        this.slcEngine = slcEngine;
        this.blockchainService = blockchainService;
        this.dataAssetManager = dataAssetManager;
        this.accessRequests = new Map();
    }

    async createOwnershipDeed({ assetId, assetMetadata, owner, jurisdiction, termsAndConditions }) {
        // Prepare ownership deed data
        const odData = {
            assetId,
            assetName: assetMetadata.assetName,
            assetDescription: assetMetadata.description,
            ipfsHash: assetMetadata.ipfsHash,
            owner: owner,
            jurisdiction: jurisdiction || 'United States',
            creationDate: new Date().toISOString(),
            termsAndConditions: termsAndConditions || this.getDefaultTerms(),
            assetType: assetMetadata.contentType,
            assetSize: assetMetadata.size
        };

        return odData;
    }

    async notarizeOwnershipDeed({ assetId, odDocument, ipfsHash }) {
        console.log("Now we'll try to notarize...");
        try {
            // Upload OD document to IPFS
            console.log("Uploading the OD document to IPFS...");
            const odIPFSResult = await this.dataAssetManager.uploadAsset({
                data: JSON.stringify(odDocument),
                metadata: {
                    type: 'ownership-deed',
                    assetId: assetId
                }
            });

            // Create hash of terms for blockchain
            console.log("Creating a hash of terms for the blockchain...");
            const tAndC =odDocument.data.termsAndConditions;
            const termsHash = this.slcEngine.hashTerms(tAndC);
            console.log("Registering on the blockchain...");
            // Register on blockchain
            const txResult = await this.blockchainService.registerAsset({
                ipfsHash: ipfsHash,
                termsHash: termsHash,
                slcManifestIPFS: odIPFSResult
            });
            console.log("Successfully registered !");
            console.log("Block Number:", txResult.blockNumber);
            console.log("Receipt Hash:", txResult.receiptHash);
            console.log("Registered Asset ID: ", txResult.regAssetId);

            return {
                transactionHash: txResult.hash,
                blockNumber: txResult.blockNumber,
                odIPFSHash: odIPFSResult,
                termsHash: termsHash,
                regAssetID: txResult.regAssetId.toString(),
            };
        } catch (error) {
            throw new Error(`Notarization failed: ${error.message}`);
        }
    }

    async getOwnershipDeed(assetId) {
        const odMetadata = await this.dataAssetManager.getODMetadata(assetId);
        if (!odMetadata) {
            throw new Error('Ownership deed not found');
        }
        return odMetadata;
    }

    async createLicense({ regAssetId, assetId, licensee, terms, duration, commercialUse }) {
        console.log("IPRS: You want a licence? Let's first get the metadata of this asset ...");
        const asset = await this.dataAssetManager.getAssetMetadata(assetId);
        if (!asset) {
            throw new Error('Asset not found');
        }
        console.log("IPRService: DAM found the metadata !");
        const licenseData = {
            assetId,
            licensor: asset.userId,
            licensee,
            terms,
            duration,
            commercialUse,
            grantedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString()
        };

        // Create license document
        console.log("IPRService: Asking the SLCEngine to create a licence doc ...");
        const licenseDoc = await this.slcEngine.fillAndValidateTemplate({
            templateType: 'license-agreement',
            data: licenseData
        });

        // Upload license to IPFS
        console.log("IPRService: Uploading the licence doc ...");
        const licenseIPFS = await this.dataAssetManager.uploadAsset({
            data: JSON.stringify(licenseDoc),
            metadata: {
                type: 'license',
                assetId: assetId,
                licensee: licensee
            }
        });
        console.log("IPRService: Registering the licence on BC ...");
        // Register license on blockchain
        const termsHash = this.slcEngine.hashTerms(terms);
        await this.blockchainService.grantLicense({
            regAssetId,
            assetId,
            licensee,
            termsHash,
            licenseIPFS,
            expiresAt: Math.floor(new Date(licenseData.expiresAt).getTime() / 1000)
        });

        return licenseDoc;
    }

    async requestAccess({ assetId, requesterId, purpose, duration }) {
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const request = {
            id: requestId,
            assetId,
            requesterId,
            purpose,
            duration,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        this.accessRequests.set(requestId, request);

        // Log request on blockchain
        await this.blockchainService.logAccessRequest(assetId, purpose);

        return request;
    }

    async respondToAccessRequest({ requestId, approved, ownerId }) {
        const request = this.accessRequests.get(requestId);
        if (!request) {
            throw new Error('Request not found');
        }

        request.status = approved ? 'approved' : 'denied';
        request.respondedAt = new Date().toISOString();
        request.respondedBy = ownerId;

        if (approved) {
            // Grant access on blockchain
            await this.blockchainService.grantAccess(request.assetId, request.requesterId);
        }

        return request;
    }

    getDefaultTerms() {
        return {
            ownership: 'The creator retains full ownership of this digital asset.',
            usage: 'No usage without explicit permission.',
            distribution: 'Distribution prohibited without license.',
            attribution: 'Attribution required for any authorized use.',
            modifications: 'No modifications allowed without permission.',
            commercialUse: 'Commercial use prohibited without license.'
        };
    }
}

module.exports = IPRService;
