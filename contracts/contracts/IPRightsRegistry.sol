// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title IPRightsRegistry
 * @dev Minimal contract for anchoring IP rights and SLC terms on-chain
 */
contract IPRightsRegistry is Ownable {
    // Use simple counter instead of deprecated Counters library
    uint256 private _nextAssetId = 1;
    
    struct Asset {
        uint256 id;
        address owner;
        string ipfsHash;           // Encrypted file on IPFS
        bytes32 termsHash;         // Hash of SLC terms
        string slcManifestIPFS;    // Full SLC manifest on IPFS
        uint256 timestamp;
        bool active;
    }
    
    struct License {
        uint256 assetId;
        address licensor;
        address licensee;
        bytes32 termsHash;
        string licenseIPFS;        // License agreement on IPFS
        uint256 grantedAt;
        uint256 expiresAt;
        bool revoked;
    }
    
    // Mappings
    mapping(uint256 => Asset) public assets;
    mapping(address => uint256[]) public userAssets;
    mapping(uint256 => License[]) public assetLicenses;
    mapping(bytes32 => bool) public registeredTerms;
    
    // Events
    event AssetRegistered(
        uint256 indexed assetId,
        address indexed owner,
        string ipfsHash,
        bytes32 termsHash
    );
    
    event LicenseGranted(
        uint256 indexed assetId,
        address indexed licensor,
        address indexed licensee,
        bytes32 termsHash
    );
    
    event LicenseRevoked(
        uint256 indexed assetId,
        address indexed licensor,
        address indexed licensee
    );
    
    event AccessRequested(
        uint256 indexed assetId,
        address indexed requester,
        string purpose
    );
    
    event AccessGranted(
        uint256 indexed assetId,
        address indexed owner,
        address indexed grantee
    );

    // Custom errors (more gas efficient than require strings)
    error NotAssetOwner();
    error AssetNotActive();
    error InvalidLicensee();
    error InvalidExpiration();
    error InvalidOwner();
    error AssetNotFound();
    error LicenseAlreadyActive(); //

    /**
     * @dev Constructor - sets deployer as initial owner
     */
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Register a new asset with its SLC terms
     */
    function registerAsset(
        string calldata _ipfsHash,
        bytes32 _termsHash,
        string calldata _slcManifestIPFS
    ) external returns (uint256) {
        uint256 newAssetId = _nextAssetId;
        unchecked {
            _nextAssetId++;
        }
        
        Asset memory newAsset = Asset({
            id: newAssetId,
            owner: msg.sender,
            ipfsHash: _ipfsHash,
            termsHash: _termsHash,
            slcManifestIPFS: _slcManifestIPFS,
            timestamp: block.timestamp,
            active: true
        });
        
        assets[newAssetId] = newAsset;
        userAssets[msg.sender].push(newAssetId);
        registeredTerms[_termsHash] = true;
        
        emit AssetRegistered(newAssetId, msg.sender, _ipfsHash, _termsHash);
        
        return newAssetId;
    }
    
    /**
     * @dev Grant a license for an asset
     */
    function grantLicense(
        uint256 _assetId,
        address _licensee,
        bytes32 _licenseTermsHash,
        string calldata _licenseIPFS,
        uint256 _expiresAt
    ) external {
        if (assets[_assetId].owner != msg.sender) revert NotAssetOwner();
        if (!assets[_assetId].active) revert AssetNotActive();
        if (_licensee == address(0)) revert InvalidLicensee();
        if (_expiresAt <= block.timestamp) revert InvalidExpiration();
        
        // 🚨 Guard: prevent duplicate active licenses
            License[] storage licenses = assetLicenses[_assetId];
            uint256 length = licenses.length;
            for (uint256 i = 0; i < length;) {
                if (
                    licenses[i].licensee == _licensee &&
                    !licenses[i].revoked &&
                    licenses[i].expiresAt > block.timestamp
                ) {
                    revert LicenseAlreadyActive();
                }
                unchecked { ++i; }
            }
        License memory newLicense = License({
            assetId: _assetId,
            licensor: msg.sender,
            licensee: _licensee,
            termsHash: _licenseTermsHash,
            licenseIPFS: _licenseIPFS,
            grantedAt: block.timestamp,
            expiresAt: _expiresAt,
            revoked: false
        });
        
        assetLicenses[_assetId].push(newLicense);
        
        emit LicenseGranted(_assetId, msg.sender, _licensee, _licenseTermsHash);
    }
    
    /**
     * @dev Revoke a license
     */
    function revokeLicense(uint256 _assetId, address _licensee) external {
        if (assets[_assetId].owner != msg.sender) revert NotAssetOwner();
        
        License[] storage licenses = assetLicenses[_assetId];
        uint256 length = licenses.length;
        
        for (uint256 i = 0; i < length;) {
            if (licenses[i].licensee == _licensee && !licenses[i].revoked) {
                licenses[i].revoked = true;
                emit LicenseRevoked(_assetId, msg.sender, _licensee);
                break;
            }
            unchecked {
                ++i;
            }
        }
    }
    
    /**
     * @dev Request access to an asset (logs on-chain)
     */
    function requestAccess(uint256 _assetId, string calldata _purpose) external {
        if (!assets[_assetId].active) revert AssetNotActive();
        emit AccessRequested(_assetId, msg.sender, _purpose);
    }
    
    /**
     * @dev Grant access to an asset (logs on-chain)
     */
    function grantAccess(uint256 _assetId, address _grantee) external {
        if (assets[_assetId].owner != msg.sender) revert NotAssetOwner();
        emit AccessGranted(_assetId, msg.sender, _grantee);
    }
    
    /**
     * @dev Transfer ownership of an asset
     */
    function transferAsset(uint256 _assetId, address _newOwner) external {
        if (assets[_assetId].owner != msg.sender) revert NotAssetOwner();
        if (_newOwner == address(0)) revert InvalidOwner();
        
        assets[_assetId].owner = _newOwner;
        
        // Update user assets mappings
        _removeAssetFromUser(msg.sender, _assetId);
        userAssets[_newOwner].push(_assetId);
    }
    
    /**
     * @dev Check if a license is valid
     */
    function isLicenseValid(uint256 _assetId, address _licensee) external view returns (bool) {
        License[] memory licenses = assetLicenses[_assetId];
        uint256 length = licenses.length;
        
        for (uint256 i = 0; i < length;) {
            if (licenses[i].licensee == _licensee && 
                !licenses[i].revoked && 
                licenses[i].expiresAt > block.timestamp) {
                return true;
            }
            unchecked {
                ++i;
            }
        }
        return false;
    }
    
    /**
     * @dev Get all assets owned by a user
     */
    function getUserAssets(address _user) external view returns (uint256[] memory) {
        return userAssets[_user];
    }
    
    /**
     * @dev Get all licenses for an asset
     */
    function getAssetLicenses(uint256 _assetId) external view returns (License[] memory) {
        return assetLicenses[_assetId];
    }

    /**
     * @dev Get current asset counter (useful for frontends)
     */
    function getCurrentAssetId() external view returns (uint256) {
        return _nextAssetId - 1;
    }
    
    /**
     * @dev Internal function to remove asset from user's list
     */
    function _removeAssetFromUser(address _user, uint256 _assetId) private {
        uint256[] storage userAssetList = userAssets[_user];
        uint256 length = userAssetList.length;
        
        for (uint256 i = 0; i < length;) {
            if (userAssetList[i] == _assetId) {
                userAssetList[i] = userAssetList[length - 1];
                userAssetList.pop();
                break;
            }
            unchecked {
                ++i;
            }
        }
    }
}