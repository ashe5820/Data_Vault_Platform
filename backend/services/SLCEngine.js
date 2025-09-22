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

    fillTemplate(template, data) {
        // Check if template is a string (Accord Project .tem format) or object (JSON format)
        if (typeof template === 'string') {
            // Handle Accord Project Template Markdown (.tem) format
            return this.fillTemplateMarkdown(template, data);
        } else if (typeof template === 'object') {
            // Handle JSON template format
            return this.fillTemplateJson(template, data);
        } else {
            throw new Error('Invalid template format');
        }
    }

    fillTemplateMarkdown(templateString, data) {
        let filledTemplate = templateString;

        // Replace all {{field}} placeholders with actual values
        for (const [key, value] of Object.entries(data)) {
            const placeholder = `{{${key}}}`;
            // Handle different value types
            let replacementValue;
            if (value === null || value === undefined) {
                replacementValue = '';
            } else if (typeof value === 'string') {
                replacementValue = value;
            } else if (typeof value === 'boolean') {
                replacementValue = value ? 'Yes' : 'No';
            } else if (typeof value === 'number') {
                replacementValue = value.toString();
            } else if (Array.isArray(value)) {
                // Handle arrays - convert to bullet points
                replacementValue = value.map(item => `• ${item}`).join('\n');
            } else {
                replacementValue = JSON.stringify(value);
            }

            filledTemplate = filledTemplate.replace(
                new RegExp(placeholder, 'g'),
                replacementValue
            );
        }

        // Handle special Accord Project directives
        // Remove any remaining Accord Project directives
        filledTemplate = filledTemplate.replace(/\{\{#.*?\}\}/g, '');
        filledTemplate = filledTemplate.replace(/\{\{\/.*?\}\}/g, '');
        filledTemplate = filledTemplate.replace(/\{\{.*?\..*?\}\}/g, '');

        return filledTemplate;
    }

    fillTemplateJson(templateObj, data) {
        // Convert template to string to perform replacements
        let templateString = JSON.stringify(templateObj);

        // Replace all {{field}} placeholders with actual values
        for (const [key, value] of Object.entries(data)) {
            const placeholder = `{{${key}}}`;
            // Handle different value types appropriately
            const replacementValue = typeof value === 'string' ? value : JSON.stringify(value);
            templateString = templateString.replace(
                new RegExp(placeholder, 'g'),
                replacementValue
            );
        }

        // Clean up any remaining placeholders
        templateString = templateString.replace(/"{{.*?}}"/g, 'null');

        // Parse back to object
        try {
            return JSON.parse(templateString);
        } catch (error) {
            console.error("Error parsing filled JSON template:", error);
            return templateObj; // Return original template if parsing fails
        }
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

        // Validate required fields
        for (const field of template.fields) {
            if (data[field] === undefined || data[field] === null) {
                console.error(`SLCEngine ERROR: Missing required field: ${field}`);
                console.error("SLCEngine: current data keys:", Object.keys(data));
                throw new Error(`Missing required field: ${field}`);
            }
        }

        // SPECIAL: Handle missing required fields for license agreement
        if (templateType === 'license-agreement') {
            // Set default values for missing required fields
            data.grantedAt = data.grantedAt || new Date().toISOString();

            // Calculate expiry date if not provided
            if (!data.expiresAt && data.duration) {
                const currentDate = new Date();
                const expiryDate = new Date(currentDate);
                expiryDate.setDate(currentDate.getDate() + data.duration);
                data.expiresAt = expiryDate.toISOString();
            }

            // Set default licensor if missing (you might want to get this from user context)
            data.licensor = data.licensor || "0xYourDefaultLicensorAddress";
        }

        // ACTUALLY FILL THE TEMPLATE - This is what you're missing!
        const filledTemplate = this.fillTemplate(template.template, data);
        console.log("SLCEngine: FILLED TEMPLATE =", JSON.stringify(filledTemplate, null, 2));

        // Fill template with data
        const filledDocument = {
            type: templateType,
            version: template.version,
            createdAt: new Date().toISOString(),
            data: data,
            template: filledTemplate, // Add the filled template here!
            hash: this.hashDocument(data)
        };

        // Validate the document
        const isValid = this.validateDocument(filledDocument);
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
        // return {
        //     "$class": "org.accordproject.ownership.OwnershipDeed",
        //     "clauseId": "ownership-deed-{{assetId}}",
        //     "asset": {
        //         "id": "{{assetId}}",
        //         "ipfsHash": "{{ipfsHash}}",
        //         "name": "{{assetName}}",
        //         "description": "{{assetDescription}}"
        //     },
        //     "owner": "{{owner}}",
        //     "jurisdiction": "{{jurisdiction}}",
        //     "termsAndConditions": "{{termsAndConditions}}",
        //     "creationDate": "{{creationDate}}"
        // };

        // Update your getOwnershipDeedTemplate to return the .tem format
            return `DIGITAL ASSET OWNERSHIP DEED

This Ownership Deed ("Deed") is executed on {{creationDate}} 

WHEREAS, {{owner}} ("Owner") is the creator and rightful owner of the digital asset identified below:

Asset Details:
- Asset ID: {{assetId}}
- Asset Name: {{assetName}}
- Asset Type: {{assetType}}
- IPFS Hash: {{ipfsHash}}
- Description: {{assetDescription}}

NOW, THEREFORE, the Owner hereby declares and affirms:

1. OWNERSHIP DECLARATION
The Owner holds complete and exclusive ownership rights to the above-described digital asset.

2. JURISDICTION
This Deed shall be governed by the laws of {{jurisdiction}}.

3. INTELLECTUAL PROPERTY RIGHTS
The Owner retains all intellectual property rights including but not limited to:
- Copyright
- Distribution rights
- Reproduction rights
- Derivative work rights
- Public display rights

4. TERMS AND CONDITIONS
{{termsAndConditions}}

5. BLOCKCHAIN NOTARIZATION
This Deed has been notarized and recorded on the Ethereum blockchain for immutable verification.

DIGITAL SIGNATURE:
Owner: {{owner}}
Date: {{creationDate}}`;
        }

    getLicenseTemplate() {
        return `DIGITAL LICENSE AGREEMENT
This License Agreement ("Agreement") is entered into on {{grantedAt}}

BETWEEN:
Licensor: {{licensor}} ("Licensor")
AND
Licensee: {{licensee}} ("Licensee")

REGARDING:
Asset ID: {{assetId}}

1. LICENSE GRANT
The Licensor grants the Licensee the following rights to use the above-referenced asset:

1.1 Exclusivity
* Type: {{#if exclusiveLicense}}EXCLUSIVE{{else}}NON-EXCLUSIVE{{/if}}

1.2 Territorial Scope
* Territory: WORLDWIDE

1.3 Sublicensing
* Sublicensing: {{#if sublicensable}}PERMITTED{{else}}PROHIBITED{{/if}}

1.4 Revocability
* Status: {{#if revocable}}REVOCABLE{{else}}IRREVOCABLE{{/if}}

2. COMMERCIAL TERMS
2.1 Commercial Use
* {{#if commercialUse}}PERMITTED{{else}}NON-COMMERCIAL{{/if}}

2.2 License Fees
* {{#if royaltyFree}}ROYALTY-FREE{{else}}REMUNERATED: Fee of {{licenseFeeAmount}} {{currency}}{{/if}}
* Payment Terms: Due upon execution of this agreement

3. USAGE RIGHTS
3.1 Reproduction
* Unlimited copies allowed for licensed uses

3.2 Physical Distribution
* {{#if physicalDistribution}}ALLOWED in digital and physical formats{{else}}DIGITAL DISTRIBUTION ONLY{{/if}}

3.3 Derivatives
* {{#if derivativesAllowed}}PERMITTED{{else}}PROHIBITED{{/if}}
* {{#if viralLicense}}Viral License: YES{{else}}Viral License: NO{{/if}}

3.4 Translation
* {{#if translationAllowed}}PERMITTED{{else}}PROHIBITED{{/if}}

3.5 Transfer of Rights
* {{#if transferable}}PERMITTED{{else}}PROHIBITED{{/if}}

3.6 Field of Use
* All fields of use unless otherwise restricted by law

3.7 Permitted Uses
* Personal use, commercial use (if permitted), display, reproduction, and distribution as authorized

3.8 Restrictions
* No unlawful use, no circumvention of DRM protections, no redistribution beyond license terms

4. LICENSE DURATION
* Effective Date: {{grantedAt}}
* Expiration Date: {{expiresAt}}
* Duration: {{duration}} days

5. ATTRIBUTION
* {{#if attributionRequired}}ATTRIBUTION REQUIRED: {{attributionText}}{{else}}NO ATTRIBUTION REQUIRED{{/if}}

6. TERMINATION
* Termination Notice: {{terminationNoticeDays}} days

7. GOVERNING LAW & JURISDICTION
* Primary Jurisdiction: United States
* Additional Jurisdictions: Australia, United Kingdom, France, Germany, Brazil
* Dispute Resolution: Arbitration in accordance with international commercial arbitration rules

8. WARRANTIES & LIABILITY
* Warranties: Licensor provides asset "as-is"; no additional warranties.
* Liability: Licensor not liable for any damages arising from use.

9. BLOCKCHAIN RECORD
* This agreement has been recorded on the blockchain for immutable verification.

10. ENTIRE AGREEMENT
This Agreement constitutes the complete understanding between the parties and supersedes all prior agreements.

DIGITAL SIGNATURES:
Licensor: {{licensor}}
Licensee: {{licensee}}
Execution Date: {{grantedAt}}`;
    }
}
module.exports = SLCEngine;
