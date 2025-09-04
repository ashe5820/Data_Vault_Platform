const { ethers } = require('ethers');
const IPRightsRegistryABI = require('../contracts/IPRightsRegistry.json');  // loads the ABI (instruction manual for JS)


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
        // console.log("Blockchain service constructor shoudl've created a K at address: ", contractAddress);
        // const add = await this.contract.getAddress();
        // console.log("Blockchain service constructor has created a K at address: ", add);
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
            console.log('Block number:', receipt.blockNumber);
            console.log('Gas used:', receipt.gasUsed);
            console.log("Receipt: ", receipt);

            const event = receipt.logs.find(log => log.fragment && log.fragment.name === 'AssetRegistered' );
            let regAssetID = event.args[0];
            console.log("Registered Asset ID: ", regAssetID);
            console.log("AssetRegistered event args: ", event.args);

            return {
                receiptHash: receipt.hash,
                blockNumber: receipt.blockNumber,
                regAssetId: regAssetID
            };
        } catch (error) {
            throw new Error(`Blockchain registration failed: ${error.message}`);
        }
    }


    async grantLicense({ regAssetID, assetId, licensee, termsHash, licenseIPFS, expiresAt }) {
        // licensee = licensee address
        try {
            // Before granting license, check ownership
            console.log("BS: received regAssetId:", regAssetID);
            const owner = await this.getAssetOwner(regAssetID);
            const currentSigner = await this.wallet.getAddress();
            console.log("Asset owner add:", owner);
            console.log("Current signer:", currentSigner);
            console.log("Is owner?", owner.toLowerCase() === currentSigner.toLowerCase());

            const assetIdHash = ethers.keccak256(ethers.toUtf8Bytes(assetId));
            console.log("=== GRANT LICENSE DEBUG ===");
            console.log("Parameters:", {
                assetId,
                assetIdHash,
                licensee,
                termsHash,
                licenseIPFS,
                expiresAt,
                expiresAtType: typeof expiresAt
            });
            // Check contract connection
            // Get contract address
            const contractAddress = await this.contract.getAddress();
            console.log("Contract address:", contractAddress);
            // Get signer address
            const signer = await this.contract.runner;  // or this.signer if you stored it
            const signerAddress = await signer.getAddress();
            console.log("Signer address:", signerAddress);

            // Check account balance
            const provider = this.contract.runner.provider;
            const balance = await provider.getBalance(signerAddress);
            console.log("Account balance:", ethers.formatEther(balance), "ETH");
            console.log("Licensee param:", licensee);

            const validateAddress = (address) => {
                if (!ethers.isAddress(address)) {
                    throw new Error(`Invalid Ethereum address: ${address}`);
                }
                return ethers.getAddress(address); // Normalizes to checksum format
            };



            //add function to check licensee is a valid 42 character address
            const normalizedLicensee = validateAddress(licensee);
        // Estimate gas first
        try {

            console.log("ok now trying gas estimate");
            const gasEstimate = await this.contract.grantLicense.estimateGas(
                regAssetID,
                normalizedLicensee,
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
                regAssetID,
                normalizedLicensee,
                termsHash,
                licenseIPFS,
                expiresAt
            );
            console.log("BCService: Transaction transaction sent:", tx);
            
            const receipt = await tx.wait();
            console.log("The BlockchainService has granted you the licence!");
            return receipt;
        } catch (error) {
            console.log("BCService: Error Caught: ", error.message);
            throw new Error(`Blockchain license grant failed: ${error.message}`);
        }
    }

    async getAssetOwner(reqAssetId) {
        try {
            // Assuming your contract has a function to get asset details
            const assetData = await this.contract.assets(reqAssetId);
            console.log("Asset Data retrieved from reqAssetId: ", assetData);
            const assetOwnerAdd = assetData.owner;
            return assetOwnerAdd;
        } catch (error) {
            console.error("Error getting asset owner:", error);
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