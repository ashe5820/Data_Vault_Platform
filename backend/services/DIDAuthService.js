// services/DIDAuthService.js
const { createVerifiableCredentialJwt, createVerifiablePresentationJwt } = require('did-jwt-vc');
const { Resolver } = require('did-resolver');
const { getResolver } = require('ethr-did-resolver');
const { EthrDID } = require('ethr-did');
const jwt = require('jsonwebtoken');
const { ethers } = require('ethers');


class DIDAuthService {
    // Make constructor private-ish - only for internal use
    constructor(provider, privateKey, wallet) {
        this.provider = provider;
        this.privateKey = privateKey;
        this.wallet = wallet;
        this.issuerDID = null;
        this.resolver = null;
    }

    // Static factory method for async initialization
    static async create(provider, privateKey, wallet) {
        if (!provider || typeof provider !== 'object') {
            throw new Error('Invalid provider passed to DIDAuthService');
        }

        const instance = new DIDAuthService(provider, privateKey, wallet);
        await instance.initializeDID();
        return instance;
    }

    async initialize(provider, privateKey, wallet, chainId, rpcUrl) {
        this.provider = provider;
        this.privateKey = privateKey;
        this.wallet = wallet;

        console.log("Initializing EthrDID with RPC URL:", rpcUrl);

        // Configure DID resolver
        const resolverConfig = getResolver({
            networks: [
                {
                    name: 'dev',
                    rpcUrl: rpcUrl,
                    chainId: parseInt(chainId),
                    registry: process.env.DID_REGISTRY_ADDRESS
                }
            ]
        });

        this.resolver = new Resolver(resolverConfig);

        // KEY FIX: Create EthrDID without passing provider object
        try {
            this.issuerDID = new EthrDID({
                identifier: wallet.address,
                privateKey: privateKey,
                // Omit provider parameter - let ethr-did create its own
                chainNameOrId: chainId,
                rpcUrl: rpcUrl,  // Pass RPC URL directly
                registry: process.env.DID_REGISTRY_ADDRESS
            });

            console.log("✅ EthrDID created successfully:", this.issuerDID.did);

        } catch (error) {
            console.error("❌ EthrDID creation failed:", error);

            // Fallback: try without any network configuration
            console.log("Trying fallback without network config...");
            this.issuerDID = new EthrDID({
                identifier: wallet.address,
                privateKey: privateKey
            });

            console.log("✅ EthrDID created with fallback:", this.issuerDID.did);
        }
    }
    async init() {
        console.log("Initializing DIDAuthService...");

        // First verify provider connectivity
        await this.verifyProvider();

        try {
            this.issuerDID = new EthrDID({
                identifier: this.issuerAddress,
                privateKey: this.privateKey,
                provider: this.provider,
                chainNameOrId: '31337' // Hardhat's chain ID
            });
            console.log("EthrDID created successfully");
            return this;
        } catch (error) {
            console.error("Failed to create EthrDID:", error);
            throw error;
        }
    }

    /**
     * Implement Sign-In with Ethereum (SIWE)
     * * Authenticate users via their Ethereum wallet. Checks their Signature matches claimed wallet. and message isn't expired
     * * RETURN: JWT token to protect API endpoints
     */
    async verifySIWE(message, signature, address) {
        // 1. Parse SIWE message
        // 2. Recover Ethereum address from signature
        // 3. Compare to claimed address
        // 4. Check expiration and "not before"
        // 5. Issue JWT session token
        try {
            // Parse SIWE message
            const siweMessage = this.parseSIWEMessage(message);
            
            // Verify signature
            const recoveredAddress = await this.recoverAddress(message, signature);
            
            if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
                throw new Error('Signature verification failed');
            }
            
            // Check message validity
            const now = new Date();
            if (new Date(siweMessage.expirationTime) < now) {
                throw new Error('Message expired');
            }
            
            if (new Date(siweMessage.notBefore) > now) {
                throw new Error('Message not yet valid');
            }
            
            // Generate session token
            const sessionToken = jwt.sign(
                {
                    address,
                    did: `did:ethr:${address}`,
                    issuedAt: siweMessage.issuedAt,
                    expirationTime: siweMessage.expirationTime
                },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );
            
            return {
                success: true,
                address,
                did: `did:ethr:${address}`,
                sessionToken
            };
        } catch (error) {
            throw new Error(`SIWE verification failed: ${error.message}`);
        }
    }

    /**
     * Create a Verifiable Credential for asset ownership
     * * RETURN: Signed Verifiable Credential JWT that says “this DID owns this asset”.
     */
    async createOwnershipCredential(assetData, ownerDID) {
        const vcPayload = {
            sub: ownerDID,
            vc: {
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                type: ['VerifiableCredential', 'OwnershipCredential'],
                credentialSubject: {
                    id: ownerDID,
                    owns: {
                        type: 'DigitalAsset',
                        id: assetData.assetId,
                        name: assetData.assetName,
                        ipfsHash: assetData.ipfsHash,
                        registeredAt: new Date().toISOString(),
                        blockchainTx: assetData.transactionHash
                    }
                }
            }
        };

        const vcJwt = await createVerifiableCredentialJwt(
            vcPayload,
            this.issuerDID
        );

        return {
            jwt: vcJwt,
            credential: vcPayload
        };
    }

    /**
     * Create a Verifiable Credential for license grants
     */
    async createLicenseCredential(licenseData, licenseeDID) {
        const vcPayload = {
            sub: licenseeDID,
            vc: {
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                type: ['VerifiableCredential', 'LicenseCredential'],
                credentialSubject: {
                    id: licenseeDID,
                    license: {
                        type: 'AssetLicense',
                        assetId: licenseData.assetId,
                        licensor: licenseData.licensorDID,
                        terms: licenseData.terms,
                        grantedAt: new Date().toISOString(),
                        expiresAt: licenseData.expiresAt,
                        commercialUse: licenseData.commercialUse,
                        blockchainTx: licenseData.transactionHash
                    }
                }
            }
        };

        const vcJwt = await createVerifiableCredentialJwt(
            vcPayload,
            this.issuerDID
        );

        return {
            jwt: vcJwt,
            credential: vcPayload
        };
    }

    /**
     * Verify a Verifiable Credential
     * * Uses your DID resolver to verify:
     * ****** Signature is valid (signed by issuer DID).
     ********** Credential has not been tampered with.
     */
    async verifyCredential(vcJwt) {
        try {
            const verifiedVC = await verifyCredential(vcJwt, this.resolver);
            return {
                isValid: true,
                credential: verifiedVC.verifiableCredential,
                issuer: verifiedVC.issuer,
                subject: verifiedVC.subject
            };
        } catch (error) {
            return {
                isValid: false,
                error: error.message
            };
        }
    }

    /**
     * Create a Verifiable Presentation for access requests
     */
    async createAccessPresentation(credentials, holderDID) {
        const vpPayload = {
            vp: {
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                type: ['VerifiablePresentation'],
                verifiableCredential: credentials
            }
        };

        const vpJwt = await createVerifiablePresentationJwt(
            vpPayload,
            { did: holderDID, signer: this.getSigner(holderDID) }
        );

        return {
            jwt: vpJwt,
            presentation: vpPayload
        };
    }

    /**
     * Parse SIWE message format
     */
    parseSIWEMessage(message) {
        const lines = message.split('\n');
        const parsed = {};
        
        lines.forEach(line => {
            if (line.includes('wants you to sign in')) {
                parsed.domain = line.split(' ')[0];
            } else if (line.startsWith('URI:')) {
                parsed.uri = line.split(': ')[1];
            } else if (line.startsWith('Version:')) {
                parsed.version = line.split(': ')[1];
            } else if (line.startsWith('Chain ID:')) {
                parsed.chainId = line.split(': ')[1];
            } else if (line.startsWith('Nonce:')) {
                parsed.nonce = line.split(': ')[1];
            } else if (line.startsWith('Issued At:')) {
                parsed.issuedAt = line.split(': ')[1];
            } else if (line.startsWith('Expiration Time:')) {
                parsed.expirationTime = line.split(': ')[1];
            } else if (line.startsWith('Not Before:')) {
                parsed.notBefore = line.split(': ')[1];
            }
        });
        
        return parsed;
    }

    /**
     * Recover Ethereum address from signature
     */
    async recoverAddress(message, signature) {
        const { ethers } = require('ethers');
        return ethers.verifyMessage(message, signature);
    }

    /**
     * Get signer for DID
     */
    getSigner(did) {
        // Implementation depends on DID method
        return async (data) => {
            const { ethers } = require('ethers');
            const wallet = new ethers.Wallet(this.privateKey);
            return wallet.signMessage(data);
        };
    }
}

// Enhanced authentication middleware
// ****** how you protect your /api/assets and /api/credentials routes.
class AuthMiddleware {
    constructor(didService) {
        this.didService = didService;
    }

    /**
     * Verify session token middleware
     */
    verifySession() {
        return async (req, res, next) => {
            try {
                const token = req.headers.authorization?.split(' ')[1];
                
                if (!token) {
                    return res.status(401).json({ error: 'No authorization token' });
                }

                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                req.user = {
                    address: decoded.address,
                    did: decoded.did
                };
                
                next();
            } catch (error) {
                res.status(401).json({ error: 'Invalid token' });
            }
        };
    }

    /**
     * Verify credential ownership
     */
    verifyCredentialOwnership() {
        return async (req, res, next) => {
            try {
                const vcJwt = req.headers['x-credential'];
                
                if (vcJwt) {
                    const verification = await this.didService.verifyCredential(vcJwt);
                    
                    if (!verification.isValid) {
                        return res.status(403).json({ error: 'Invalid credential' });
                    }
                    
                    req.credential = verification.credential;
                }
                
                next();
            } catch (error) {
                res.status(403).json({ error: 'Credential verification failed' });
            }
        };
    }
}

// Integration with main API
const integrateAuth = (app, didService) => {
    const authMiddleware = new AuthMiddleware(didService);

    // SIWE authentication endpoint
    app.post('/api/auth/siwe', async (req, res) => {
        try {
            const { message, signature, address } = req.body;
            const result = await didService.verifySIWE(message, signature, address);
            res.json(result);
        } catch (error) {
            res.status(401).json({ error: error.message });
        }
    });

    // Protected routes with DID auth
    app.use('/api/assets', authMiddleware.verifySession());
    app.use('/api/credentials', authMiddleware.verifyCredentialOwnership());

    // Issue ownership credential after registration
    app.post('/api/credentials/ownership', authMiddleware.verifySession(), async (req, res) => {
        try {
            const { assetData } = req.body;
            const credential = await didService.createOwnershipCredential(
                assetData,
                req.user.did
            );
            res.json(credential);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Issue license credential
    app.post('/api/credentials/license', authMiddleware.verifySession(), async (req, res) => {
        try {
            const { licenseData } = req.body;
            const credential = await didService.createLicenseCredential(
                licenseData,
                req.user.did
            );
            res.json(credential);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
};

module.exports = {
    DIDAuthService,
    AuthMiddleware,
    integrateAuth
};