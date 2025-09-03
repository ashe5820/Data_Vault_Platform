// server.js - Main Express Server
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { ethers } = require('ethers');
const CryptoJS = require('crypto-js');
const { create } = require('ipfs-http-client');
const { Template, Clause } = require('@accordproject/cicero-core');
const { Engine } = require('@accordproject/cicero-engine');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const fetch = require('node-fetch');



const app = express();
const upload = multer({ memory: true });

const ipfsConfig = {
    host: process.env.IPFS_HOST || 'localhost',
    port: process.env.IPFS_PORT || 5001,
    protocol: process.env.IPFS_PROTOCOL || 'http',
  //   options: {
  //   fetch: fetch
  // }
};

// Only add duplex in Node.js environments (not browser)
if (typeof window === 'undefined') {
    ipfsConfig.fetchOptions = {
        duplex: 'half'
    };
}

const ipfs = create(ipfsConfig);

// Initialize IPFS client
// const ipfs = create({
//     host: process.env.IPFS_HOST || 'localhost',
//     port: process.env.IPFS_PORT || 5001,
//     protocol: 'http',
//     fetchOptions: {
//         duplex: 'half'  // ← Add this line to fix the error
//     }
// });

// Initialize Ethereum provider
const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
// const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Make sure private key is properly formatted
let privateKey = process.env.PRIVATE_KEY;
if (!privateKey.startsWith('0x')) {
    privateKey = '0x' + privateKey;
}
 
// Option 1
// const wallet = new ethers.Wallet(privateKey, provider);

// Option 2 Use Hardhat's first test account (has 10000 ETH)
const wallet = new ethers.Wallet(
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", // Hardhat account #0
    provider
);

console.log("Connected wallet address:", wallet.address);

// Middleware
app.use(cors());
app.use(express.json());

// Import services
const DataAssetManager = require('./services/DataAssetManager');
const IPRService = require('./services/IPRService');
const SLCEngine = require('./services/SLCEngine');
const BlockchainService = require('./services/BlockchainService');

// Initialize services
const dataAssetManager = new DataAssetManager(ipfs);
const slcEngine = new SLCEngine();
const blockchainService = new BlockchainService(wallet, process.env.CONTRACT_ADDRESS);
const iprService = new IPRService(slcEngine, blockchainService, dataAssetManager);




// ============= PHASE 0: MOCK BC Contracts =============

// const USE_MOCK_BLOCKCHAIN = !process.env.CONTRACT_ADDRESS || process.env.CONTRACT_ADDRESS === 'mock';

// if (USE_MOCK_BLOCKCHAIN) {
//     console.log('⚠️  Running in MOCK mode - no blockchain connection');
// }

// // Modify the BlockchainService initialization
// const MockBlockchainService = USE_MOCK_BLOCKCHAIN 
//     ? new BlockchainService()  // Create a mock version
//     : new BlockchainService(wallet, process.env.CONTRACT_ADDRESS);


// ============= PHASE 1: Asset Upload Routes =============

/**
 * Upload and encrypt asset
 * Corresponds to: User -> Frontend UI -> Data Asset Manager flow
 */
app.post('/api/assets/upload', upload.single('file'), async (req, res) => {
    try {
        const { userId, assetName, description } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        // Encrypt the file (client-side encryption would be better in production)
        const encryptionKey = CryptoJS.lib.WordArray.random(256 / 8).toString();
        const encrypted = CryptoJS.AES.encrypt(
            file.buffer.toString('base64'),
            encryptionKey
        ).toString();

        // Upload to IPFS via Data Asset Manager
        const ipfsHash = await dataAssetManager.uploadAsset({
            data: encrypted,       // <-- must match backend function
            metadata: {
                name: assetName,
                description,
                contentType: file.mimetype,
                size: file.size,
                uploadedBy: userId,
                uploadedAt: new Date().toISOString()
            }
        });

        // Store asset metadata in database
        const assetId = await dataAssetManager.storeAssetMetadata({
            ipfsHash,
            encryptionKey, // In production, store this securely
            userId,
            assetName,
            description,
            contentType: file.mimetype,
            size: file.size
        });

        res.json({
            success: true,
            assetId,
            ipfsHash,
            message: 'Asset uploaded successfully'
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get user's assets
 */
app.get('/api/assets/user/:userId', async (req, res) => {
    try {
        const assets = await dataAssetManager.getUserAssets(req.params.userId);
        res.json({ assets });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============= PHASE 2: Ownership Deed Registration Routes =============

/**
 * Register asset with Ownership Deed
 * Corresponds to: Frontend UI -> IPR Service -> SLC Engine flow
 */
app.post('/api/assets/:assetId/register', async (req, res) => {
    try {
        console.log("PHASE 2: Trying to register the asset with an Ownership Deed");
        const { assetId } = req.params;
        const { userId, jurisdiction, termsAndConditions } = req.body;

        // Step 1: Get asset metadata
        console.log("Retrieving asset metadata...");  
        const assetMetadata = await dataAssetManager.getAssetMetadata(assetId);
        console.log("Asset Metadata:", assetMetadata);   // prints the metadata object

        
        if (!assetMetadata) {
            return res.status(404).json({ error: 'Asset not found' });
        }

        // Step 2: Create SLC OD instance via IPR Service
        console.log("Creating an SLC OD instance via IPR Service");   // prints the metadata object
        const odInstance = await iprService.createOwnershipDeed({
            assetId,
            assetMetadata,
            owner: userId,
            jurisdiction,
            termsAndConditions
        });

        // Step 3: Fill and validate OD SLC template
        console.log("Filling and validating OD SLC template");
        const validatedOD = await slcEngine.fillAndValidateTemplate({
            templateType: 'ownership-deed',
            data: odInstance
        });

        // Step 4: Notarize on blockchain
        console.log("This is the validated OD");
        console.log(validatedOD);
        console.log("Asking the IPRService to notarize this OD");
        const notarizationResult = await iprService.notarizeOwnershipDeed({
            assetId,
            odDocument: validatedOD,
            ipfsHash: assetMetadata.ipfsHash
        });
        console.log("IPRService: we have received regAssetID: ", notarizationResult.regAssetID);

        // Step 5: Save OD metadata
        await dataAssetManager.saveODMetadata({
            assetId,
            odDocument: validatedOD,
            transactionHash: notarizationResult.transactionHash,
            blockNumber: notarizationResult.blockNumber,
            regAssetID: notarizationResult.regAssetID,
        });

        res.json({
            success: true,
            assetId,
            transactionHash: notarizationResult.transactionHash,
            odDocument: validatedOD,
            message: 'Ownership Deed registered successfully',
            regAssetId: notarizationResult.regAssetId,
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get Ownership Deed for an asset
 */
app.get('/api/assets/:assetId/ownership-deed', async (req, res) => {
    try {
        const od = await iprService.getOwnershipDeed(req.params.assetId);
        console.log("IPRService retrieved OD: ", od);
        res.json({ ownershipDeed: od });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============= License Management Routes =============

/**
 * Create a license for an asset
 */
app.post('/api/assets/:assetId/license', async (req, res) => {
    try {
        const { assetId } = req.params;
        const { regAssetId, licensee, terms, duration, commercialUse } = req.body;
        console.log("You're trying to create a licence for asset w ID: ", assetId);
        console.log("We have received from FE regAssetId: ", regAssetId);
        const license = await iprService.createLicense({
            regAssetId,
            assetId,
            licensee,
            terms,
            duration,
            commercialUse
        });

        res.json({
            success: true,
            license,
            message: 'License created successfully'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Verify license validity
 */
app.get('/api/assets/:assetId/verify-license/:licenseeAddress', async (req, res) => {
    try {
        const { assetId, licenseeAddress } = req.params;
        const isValid = await blockchainService.verifyLicense(assetId, licenseeAddress);
        
        res.json({
            assetId,
            licensee: licenseeAddress,
            isValid
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============= Access Request/Approval Routes =============

/**
 * Request access to an asset
 */
app.post('/api/assets/:assetId/request-access', async (req, res) => {
    try {
        const { assetId } = req.params;
        const { requesterId, purpose, duration } = req.body;

        const request = await iprService.requestAccess({
            assetId,
            requesterId,
            purpose,
            duration
        });

        res.json({
            success: true,
            requestId: request.id,
            message: 'Access request submitted'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Approve or deny access request
 */
app.post('/api/access-requests/:requestId/respond', async (req, res) => {
    try {
        const { requestId } = req.params;
        const { approved, ownerId } = req.body;

        const result = await iprService.respondToAccessRequest({
            requestId,
            approved,
            ownerId
        });

        res.json({
            success: true,
            result,
            message: approved ? 'Access granted' : 'Access denied'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============= Audit & Compliance Routes =============

/**
 * Get audit trail for an asset
 */
app.get('/api/assets/:assetId/audit-trail', async (req, res) => {
    try {
        const trail = await blockchainService.getAuditTrail(req.params.assetId);
        res.json({ auditTrail: trail });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get blockchain events (for async event handler)
 */
app.get('/api/blockchain/events', async (req, res) => {
    try {
        const { fromBlock = 0, toBlock = 'latest' } = req.query;
        const events = await blockchainService.getEvents(fromBlock, toBlock);
        res.json({ events });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============= Health Check =============
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        services: {
            ipfs: ipfs.isOnline(),
            blockchain: provider._isProvider,
            timestamp: new Date().toISOString()
        }
    });
});


// ============= Get Deed =============

app.get('/api/assets/:assetId/ownership-deed', async (req, res) => {
    try {
        const { assetId } = req.params;
        
        // Get the ownership deed from the Data Asset Manager
        const odMetadata = await dataAssetManager.getODMetadata(assetId);
        
        if (!odMetadata) {
            return res.status(404).json({ 
                error: 'No ownership deed found for this asset' 
            });
        }
        
        // Get the asset details as well
        const assetMetadata = await dataAssetManager.getAssetMetadata(assetId);
        
        // Combine the data for a complete view
        const completeOwnershipDeed = {
            ...odMetadata,
            asset: assetMetadata
        };
        
        res.json({ 
            success: true,
            ownershipDeed: completeOwnershipDeed 
        });
    } catch (error) {
        console.error('Error fetching ownership deed:', error);
        res.status(500).json({ error: error.message });
        }
    });

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Data Vault Platform API running on port ${PORT}`);
    console.log(`IPFS Gateway: ${process.env.IPFS_HOST}:${process.env.IPFS_PORT}`);
    console.log(`Ethereum RPC: ${process.env.ETHEREUM_RPC_URL}`);
});