const { ethers } = require('ethers');
const IPRightsRegistryABI = require('../contracts/IPRightsRegistry.json');  // loads the ABI (instruction manual for JS)
const DataAssetManager = require('./DataAssetManager');
const IPRService = require('./IPRService');
const SLCEngine = require('./SLCEngine');


class BlockchainService {
// ========== MOCK constructor() ========

    // constructor(wallet, contractAddress) {
    //     this.mockMode = !contractAddress || contractAddress === 'mock';
    //     if (this.mockMode) {
    //         console.log('🔧 BlockchainService running in MOCK mode');
    //         this.mockData = new Map();
    //         this.assetCounter = 0;
    //     } else {
    //         this.wallet = wallet;
    //         this.contract = new ethers.Contract(
    //             contractAddress,
    //             IPRightsRegistryABI.abi,
    //             wallet
    //         );
    //     }
    // }

    constructor(wallet, contractAddress) {
        this.wallet = wallet;
        this.contract = new ethers.Contract( // creates a new K using the ABI
            contractAddress,
            IPRightsRegistryABI.abi,
            wallet
        );
        this.eventHandlers = new Map();
    }

// // ========== MOCK registerAsset() ========
//     async registerAsset({ ipfsHash, termsHash, slcManifestIPFS }) {
//         console.log("BlockchainService is trying to register an asset...");
//         if (this.mockMode) {
//             // Simulate blockchain registration
//             this.assetCounter++;
//             const mockTxHash = '0x' + Math.random().toString(16).substr(2, 64);
//             const mockBlockNumber = Math.floor(Math.random() * 1000000);
            
//             this.mockData.set(this.assetCounter, {
//                 ipfsHash,
//                 termsHash,
//                 slcManifestIPFS,
//                 txHash: mockTxHash,
//                 blockNumber: mockBlockNumber
//             });
            
//             console.log('📝 Mock registration:', { assetId: this.assetCounter, txHash: mockTxHash });
            
//             return {
//                 hash: mockTxHash,
//                 blockNumber: mockBlockNumber,
//                 assetId: this.assetCounter
//             };
//         }
//     }


    async registerAsset({ ipfsHash, termsHash, slcManifestIPFS }) {
            // ipfsHash - The IPFS address where the encrypted file is stored
            // termsHash - A hash of the terms and conditions
            // slcManifestIPFS - IPFS address of the Smart Legal Contract manifest
        try {
            console.log("Calling the Smart Contract...");
    //             Sends a transaction to Ethereum network
                // Transaction goes into the "mempool" (waiting area)
                // Returns immediately with transaction details
            const tx = await this.contract.registerAsset(
                ipfsHash,
                termsHash,
                slcManifestIPFS
            );
            
            const receipt = await tx.wait();
            
            // Extract asset ID from events
            const event = receipt.logs.find(log => 
                log.fragment && log.fragment.name === 'AssetRegistered'
            );
            
            return {
                hash: receipt.hash,
                blockNumber: receipt.blockNumber,
                assetId: event ? event.args[0] : null
            };
        } catch (error) {
            throw new Error(`Blockchain registration failed: ${error.message}`);
        }
    }

    async grantLicense({ assetId, licensee, termsHash, licenseIPFS, expiresAt }) {

        try {
            console.log("=== GRANT LICENSE DEBUG ===");
            console.log("Parameters:", {
                assetId,
                licensee,
                termsHash,
                licenseIPFS,
                expiresAt,
                expiresAtType: typeof expiresAt
            });
            // Check contract connection
        console.log("Contract address:", this.contract.address);
        console.log("Signer address:", await this.contract.signer.getAddress());
        
        // Check account balance
        const balance = await this.contract.signer.getBalance();
        console.log("Account balance:", ethers.utils.formatEther(balance), "ETH");
        
        // Estimate gas first
        try {
            const gasEstimate = await this.contract.estimateGas.grantLicense(
                assetId,
                licensee,
                termsHash,
                licenseIPFS,
                expiresAt
            );
            console.log("Estimated gas:", gasEstimate.toString());
        } catch (gasError) {
            console.error("Gas estimation failed:", gasError);
            // This often reveals the actual revert reason
        }
            console.log("BlockchainService: sending this transaction trying to grant you a licence!");
            const tx = await this.contract.grantLicense(
                assetId,
                licensee,
                termsHash,
                licenseIPFS,
                expiresAt
            );
            
            const receipt = await tx.wait();
            console.log("The BlockchainService has granted you the licence!");
            return receipt;
        } catch (error) {
            throw new Error(`Blockchain license grant failed: ${error.message}`);
        }
    }

    async verifyLicense(assetId, licenseeAddress) {
        try {
            const isValid = await this.contract.isLicenseValid(assetId, licenseeAddress);
            return isValid;
        } catch (error) {
            throw new Error(`License verification failed: ${error.message}`);
        }
    }

    async logAccessRequest(assetId, purpose) {
        try {
            const tx = await this.contract.requestAccess(assetId, purpose);
            await tx.wait();
        } catch (error) {
            console.error('Failed to log access request:', error);
        }
    }

    async grantAccess(assetId, grantee) {
        try {
            const tx = await this.contract.grantAccess(assetId, grantee);
            await tx.wait();
        } catch (error) {
            throw new Error(`Access grant failed: ${error.message}`);
        }
    }

    async getAuditTrail(assetId) {
        try {
            // Get all events related to this asset
            const filter = {
                address: this.contract.address,
                topics: [null, ethers.id(assetId)]
            };
            
            const logs = await this.wallet.provider.getLogs(filter);
            return logs.map(log => this.contract.interface.parseLog(log));
        } catch (error) {
            throw new Error(`Failed to get audit trail: ${error.message}`);
        }
    }

    async getEvents(fromBlock, toBlock) {
        try {
            const events = await this.contract.queryFilter('*', fromBlock, toBlock);
            return events.map(event => ({
                event: event.event,
                args: event.args,
                blockNumber: event.blockNumber,
                transactionHash: event.transactionHash
            }));
        } catch (error) {
            throw new Error(`Failed to get events: ${error.message}`);
        }
    }

    // Async Event Handler functionality
    setupEventListeners() {
        this.contract.on('AssetRegistered', (assetId, owner, ipfsHash, termsHash, event) => {
            console.log('Asset registered:', { assetId, owner, ipfsHash });
            this.handleAsyncEvent('AssetRegistered', { assetId, owner, ipfsHash, termsHash });
        });

        this.contract.on('LicenseGranted', (assetId, licensor, licensee, termsHash, event) => {
            console.log('License granted:', { assetId, licensor, licensee });
            this.handleAsyncEvent('LicenseGranted', { assetId, licensor, licensee, termsHash });
        });
    }

    handleAsyncEvent(eventType, data) {
        const handler = this.eventHandlers.get(eventType);
        if (handler) {
            handler(data);
        }
    }

    registerEventHandler(eventType, handler) {
        this.eventHandlers.set(eventType, handler);
    }
}

module.exports = BlockchainService;