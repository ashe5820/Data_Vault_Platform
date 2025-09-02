const crypto = require('crypto');

class SLCEngine {
    constructor() {
        this.templates = this.loadTemplates();
    }

    loadTemplates() {
        // In production, load from Accord Project templates
        return {
            'ownership-deed': {
                type: 'ownership-deed',
                version: '1.0.0',
                fields: ['assetId', 'owner', 'ipfsHash', 'jurisdiction', 'termsAndConditions'],
                template: this.getOwnershipDeedTemplate()
            },
            'license-agreement': {
                type: 'license-agreement',
                version: '1.0.0',
                fields: ['assetId', 'licensor', 'licensee', 'terms', 'duration'],
                template: this.getLicenseTemplate()
            }
        };
    }

    async fillAndValidateTemplate({ templateType, data }) {
        const template = this.templates[templateType];
        if (!template) {
            throw new Error(`Template ${templateType} not found`);
        }

        // Validate required fields
        for (const field of template.fields) {
            if (!data[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        // Fill template with data
        const filledDocument = {
            type: templateType,
            version: template.version,
            createdAt: new Date().toISOString(),
            data: data,
            hash: this.hashDocument(data)
        };

        // Validate the document
        if (!this.validateDocument(filledDocument)) {
            throw new Error('Document validation failed');
        }

        return filledDocument;
    }

    validateDocument(document) {
        // Implement validation logic
        // Check document structure, required fields, data types, etc.
        return document && document.type && document.data && document.hash;
    }

    hashDocument(data) {
        const hash = crypto.createHash('sha256');
        hash.update(JSON.stringify(data));
        return hash.digest('hex');
    }

    hashTerms(terms) {
        const hash = crypto.createHash('sha256');
        hash.update(JSON.stringify(terms));
        return '0x' + hash.digest('hex');
    }

    getOwnershipDeedTemplate() {
        // Accord Project template structure
        return {
            "$class": "org.accordproject.ownership.OwnershipDeed",
            "clauseId": "ownership-deed-{{assetId}}",
            "asset": {
                "id": "{{assetId}}",
                "ipfsHash": "{{ipfsHash}}",
                "name": "{{assetName}}",
                "description": "{{assetDescription}}"
            },
            "owner": "{{owner}}",
            "jurisdiction": "{{jurisdiction}}",
            "termsAndConditions": "{{termsAndConditions}}",
            "creationDate": "{{creationDate}}"
        };
    }

    getLicenseTemplate() {
        return {
            "$class": "org.accordproject.license.LicenseAgreement",
            "clauseId": "license-{{assetId}}-{{licensee}}",
            "asset": "{{assetId}}",
            "licensor": "{{licensor}}",
            "licensee": "{{licensee}}",
            "terms": "{{terms}}",
            "duration": "{{duration}}",
            "commercialUse": "{{commercialUse}}",
            "grantedAt": "{{grantedAt}}",
            "expiresAt": "{{expiresAt}}"
        };
    }
}
module.exports = SLCEngine;
