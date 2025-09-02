-- Database schema for Data Vault Platform

-- Users table with DID support
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address VARCHAR(42) UNIQUE NOT NULL,
    did VARCHAR(255) UNIQUE,
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active'
);

-- Assets table
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    asset_name VARCHAR(255) NOT NULL,
    description TEXT,
    content_type VARCHAR(100),
    file_size BIGINT,
    ipfs_hash VARCHAR(255) UNIQUE NOT NULL,
    encryption_key_hash VARCHAR(255), -- Store hash of encryption key for verification
    status VARCHAR(20) DEFAULT 'uploaded', -- uploaded, registered, archived
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ownership Deeds table
CREATE TABLE ownership_deeds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES users(id),
    jurisdiction VARCHAR(100),
    terms_hash VARCHAR(66) NOT NULL, -- Ethereum hash format (0x + 64 chars)
    slc_manifest_ipfs VARCHAR(255),
    od_document_ipfs VARCHAR(255),
    transaction_hash VARCHAR(66) UNIQUE,
    block_number BIGINT,
    smart_contract_id BIGINT, -- ID from smart contract
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notarized_at TIMESTAMP
);

-- Terms and Conditions table (for reusable terms)
CREATE TABLE terms_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50), -- ownership, license, usage
    terms JSONB NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Licenses table
CREATE TABLE licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    licensor_id UUID REFERENCES users(id),
    licensee_address VARCHAR(42) NOT NULL,
    licensee_id UUID REFERENCES users(id),
    terms JSONB NOT NULL,
    terms_hash VARCHAR(66),
    license_ipfs VARCHAR(255),
    commercial_use BOOLEAN DEFAULT FALSE,
    exclusive_license BOOLEAN DEFAULT FALSE,
    geographic_scope VARCHAR(255),
    field_of_use VARCHAR(255),
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    revocation_reason TEXT,
    transaction_hash VARCHAR(66),
    block_number BIGINT,
    status VARCHAR(20) DEFAULT 'active' -- active, expired, revoked
);

-- Access Requests table
CREATE TABLE access_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    requester_id UUID REFERENCES users(id),
    requester_address VARCHAR(42),
    purpose TEXT NOT NULL,
    duration_days INTEGER,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, denied
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP,
    responded_by UUID REFERENCES users(id),
    response_note TEXT,
    transaction_hash VARCHAR(66)
);

-- Audit Trail table
CREATE TABLE audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL, -- uploaded, registered, licensed, accessed, transferred
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    transaction_hash VARCHAR(66),
    block_number BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Verifiable Credentials table
CREATE TABLE verifiable_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    holder_id UUID REFERENCES users(id),
    holder_did VARCHAR(255),
    credential_type VARCHAR(50), -- ownership, license, access
    credential_jwt TEXT NOT NULL,
    credential_data JSONB,
    related_asset_id UUID REFERENCES assets(id),
    related_license_id UUID REFERENCES licenses(id),
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    revoked_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active' -- active, expired, revoked
);

-- Blockchain Events table (for async event handler)
CREATE TABLE blockchain_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,
    contract_address VARCHAR(42),
    transaction_hash VARCHAR(66) UNIQUE,
    block_number BIGINT,
    block_timestamp TIMESTAMP,
    event_data JSONB,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- IPFS Pins table (track what we've pinned)
CREATE TABLE ipfs_pins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ipfs_hash VARCHAR(255) UNIQUE NOT NULL,
    content_type VARCHAR(50), -- asset, document, manifest
    related_id UUID, -- Can reference asset_id, deed_id, etc.
    pin_status VARCHAR(20) DEFAULT 'pinned', -- pinned, unpinned, failed
    size_bytes BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_verified TIMESTAMP
);

-- Sessions table (for authenticated users)
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    siwe_message TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

-- Create indexes for better query performance
CREATE INDEX idx_assets_user_id ON assets(user_id);
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_ipfs_hash ON assets(ipfs_hash);
CREATE INDEX idx_ownership_deeds_asset_id ON ownership_deeds(asset_id);
CREATE INDEX idx_ownership_deeds_transaction_hash ON ownership_deeds(transaction_hash);
CREATE INDEX idx_licenses_asset_id ON licenses(asset_id);
CREATE INDEX idx_licenses_licensor_id ON licenses(licensor_id);
CREATE INDEX idx_licenses_licensee_id ON licenses(licensee_id);
CREATE INDEX idx_licenses_status ON licenses(status);
CREATE INDEX idx_licenses_expires_at ON licenses(expires_at);
CREATE INDEX idx_access_requests_asset_id ON access_requests(asset_id);
CREATE INDEX idx_access_requests_status ON access_requests(status);
CREATE INDEX idx_audit_trail_asset_id ON audit_trail(asset_id);
CREATE INDEX idx_audit_trail_user_id ON audit_trail(user_id);
CREATE INDEX idx_audit_trail_created_at ON audit_trail(created_at);
CREATE INDEX idx_blockchain_events_processed ON blockchain_events(processed);
CREATE INDEX idx_blockchain_events_block_number ON blockchain_events(block_number);
CREATE INDEX idx_verifiable_credentials_holder_id ON verifiable_credentials(holder_id);
CREATE INDEX idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- Create views for common queries
CREATE VIEW active_licenses AS
SELECT 
    l.*,
    a.asset_name,
    u1.address as licensor_address,
    u2.address as licensee_address
FROM licenses l
JOIN assets a ON l.asset_id = a.id
JOIN users u1 ON l.licensor_id = u1.id
LEFT JOIN users u2 ON l.licensee_id = u2.id
WHERE l.status = 'active' 
    AND l.expires_at > CURRENT_TIMESTAMP 
    AND l.revoked_at IS NULL;

CREATE VIEW asset_summary AS
SELECT 
    a.*,
    u.address as owner_address,
    u.did as owner_did,
    od.transaction_hash as ownership_tx,
    od.block_number as ownership_block,
    COUNT(DISTINCT l.id) as license_count,
    COUNT(DISTINCT ar.id) as access_request_count
FROM assets a
JOIN users u ON a.user_id = u.id
LEFT JOIN ownership_deeds od ON a.id = od.asset_id
LEFT JOIN licenses l ON a.id = l.asset_id
LEFT JOIN access_requests ar ON a.id = ar.asset_id
GROUP BY a.id, u.address, u.did, od.transaction_hash, od.block_number;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to log audit trail
CREATE OR REPLACE FUNCTION log_audit_trail()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_trail (asset_id, user_id, action, details, created_at)
    VALUES (
        NEW.id,
        NEW.user_id,
        TG_ARGV[0],
        row_to_json(NEW),
        CURRENT_TIMESTAMP
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create audit triggers
CREATE TRIGGER audit_asset_upload AFTER INSERT ON assets
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail('uploaded');

CREATE TRIGGER audit_ownership_registration AFTER INSERT ON ownership_deeds
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail('registered');

CREATE TRIGGER audit_license_grant AFTER INSERT ON licenses
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail('licensed');