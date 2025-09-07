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
                fields: [
                    // From your data
                    'assetId',           // From your data
                    'licensor',          // Required by template but missing from your data!
                    'licensee',          // From your data
                    'duration',          // From your data
                    'grantedAt',         // Required by template but missing from your data!
                    'expiresAt',         // Required by template but missing from your data!
                    'commercialUse',     // From your data
                    'exclusiveLicense',  // From your data
                    'sublicensable',     // From your data
                    'revocable',         // From your data
                    'derivativesAllowed',// From your data
                    'viralLicense',      // From your data
                    'translationAllowed',// From your data
                    'transferable',      // From your data
                    'physicalDistribution', // From your data
                    'royaltyFree',       // From your data
                    'attributionRequired', // From your data
                    'terminationNoticeDays' // From your data
                    ],
                template: this.getLicenseTemplate()
            }
        };
    }

    async fillAndValidateTemplate({ templateType, data }) {
        console.log("SLCEngine: fillAndValidateTemplate called");
        console.log("SLCEngine: templateType =", templateType);
        console.log("SLCEngine: input data =", data);

        const template = this.templates[templateType];
        if (!template) {
            console.error(`SLCEngine ERROR: Template ${templateType} not found`);
            throw new Error(`Template ${templateType} not found`);
        }
        console.log("SLCEngine: template found =", template);

        // Validate required fields
        console.log("SLCEngine: validating required fields:", template.fields);
        for (const field of template.fields) {
            if (data[field] === undefined || data[field] === null) {
                console.error(`SLCEngine ERROR: Missing required field: ${field}`);
                console.error("SLCEngine: current data keys:", Object.keys(data));
                throw new Error(`Missing required field: ${field}`);
            } else {
                console.log(`SLCEngine: field ${field} exists in data`);
            }
        }
        if (templateType === 'license-agreement') {
            console.log("SLCEngine: Processing license agreement template");
            // Special validation for license agreements
            const duration = data.duration; // number of days
            const currentDate = new Date();
            const expiryDate = new Date(currentDate);
            expiryDate.setDate(currentDate.getDate() + duration);
            console.log("Expiry date:", expiryDate.toISOString());

        }



        // Fill template with data
        const filledDocument = {
            type: templateType,
            version: template.version,
            createdAt: new Date().toISOString(),
            data: data,
            hash: this.hashDocument(data)
        };
        console.log("SLCEngine: filledDocument =", filledDocument);

        // Validate the document
        const isValid = this.validateDocument(filledDocument);
        console.log("SLCEngine: validateDocument result =", isValid);
        if (!isValid) {
            console.error("SLCEngine ERROR: Document validation failed");
            throw new Error('Document validation failed');
        }

        console.log("SLCEngine: Document successfully filled and validated");
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
        const digest = '0x' + hash.digest('hex');
        console.log("SLC Engine has hashed the terms: ", digest)
        return digest;
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
            "$class": "org.accordproject.licensing.LicenseAgreementContract",
            "clauseId": "license-{{assetId}}-{{licensee}}",
            "assetId": "{{assetId}}",
            // "regAssetId": "{{regAssetId}}",
            "licensor": "{{licensor}}",
            "licensee": "{{licensee}}",
            "grantedAt": "{{grantedAt}}",
            "expiresAt": "{{expiresAt}}",
            "duration": "{{duration}}",

            // License characteristics with defaults
            "commercialUse": "{{commercialUse}}",
            "exclusiveLicense": "{{exclusiveLicense}}",
            "geographicScope": "{{geographicScope}}",
            "sublicensable": "{{sublicensable}}",
            "revocable": "{{revocable}}",
            "derivativesAllowed": "{{derivativesAllowed}}",
            "viralLicense": "{{viralLicense}}",
            "translationAllowed": "{{translationAllowed}}",
            "transferable": "{{transferable}}",
            "physicalDistribution": "{{physicalDistribution}}",

            // Usage
            "fieldOfUse": "{{fieldOfUse}}",
            "restrictions": "{{restrictions}}",
            "permittedUses": "{{permittedUses}}",

            // Fees & royalty
            "royaltyFree": "{{royaltyFree}}",
            "licenseFeeAmount": "{{licenseFeeAmount}}",
            "currency": "{{currency}}",
            "paymentTerms": "{{paymentTerms}}",

            // Attribution
            "attributionRequired": "{{attributionRequired}}",
            "attributionText": "{{attributionText}}",

            // Termination
            "terminationNoticeDays": "{{terminationNoticeDays}}",

            // Warranties & liability (static defaults)
            "warranties": "Licensor provides asset 'as-is'; no additional warranties.",
            "liability": "Licensor not liable for any damages arising from use."
        };
    }
}
module.exports = SLCEngine;
