/**
 * Template for adding new pronunciation assessment APIs
 * Copy this file and implement the required methods
 */
class TemplateAPIAdapter {
    constructor(config) {
        // Store your API credentials
        this.apiKey = config.YOUR_API_KEY;
        this.endpoint = 'https://api.example.com/v1/assess';
        
        // API-specific settings
        this.timeout = 10000; // 10 seconds
        this.maxRetries = 3;
    }

    /**
     * Main test method - required
     * @param {Blob} audioBlob - The audio to test
     * @param {string} referenceText - The expected text
     * @param {string} language - Language code (e.g., 'en-US', 'zh-TW')
     * @returns {Object} Standardized result object
     */
    async test(audioBlob, referenceText, language = 'en-US') {
        try {
            // 1. Prepare audio in the format your API needs
            const audioData = await this.prepareAudio(audioBlob);
            
            // 2. Make the API call
            const response = await this.callAPI(audioData, referenceText, language);
            
            // 3. Parse and normalize the response
            return this.normalizeResponse(response);
            
        } catch (error) {
            console.error('API Error:', error);
            throw new Error(`API call failed: ${error.message}`);
        }
    }

    /**
     * Prepare audio for API (convert format if needed)
     */
    async prepareAudio(audioBlob) {
        // Example: Convert to base64
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.readAsDataURL(audioBlob);
        });
        
        // Or convert to specific format using the audio utilities
        // return await convertToWAV(audioBlob);
    }

    /**
     * Make the actual API call
     */
    async callAPI(audioData, referenceText, language) {
        const response = await fetch(this.endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                audio: audioData,
                text: referenceText,
                language: language,
                // Add any API-specific parameters
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * Normalize API response to standard format
     */
    normalizeResponse(apiResponse) {
        // Return standardized format that the lab expects
        return {
            // Required: overall score (0-100)
            score: apiResponse.overall_score || 0,
            
            // Optional: detailed scores
            details: {
                accuracy: apiResponse.accuracy,
                fluency: apiResponse.fluency,
                pronunciation: apiResponse.pronunciation,
                // Add any API-specific details
            },
            
            // Keep raw response for analysis
            raw: apiResponse
        };
    }

    /**
     * Optional: Test if API connection is working
     */
    async testConnection() {
        try {
            // Make a simple API call to verify credentials
            const response = await fetch(this.endpoint + '/status', {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });
            
            return response.ok;
        } catch (error) {
            throw new Error(`Connection test failed: ${error.message}`);
        }
    }

    /**
     * Optional: Get API capabilities
     */
    getCapabilities() {
        return {
            languages: ['en-US', 'en-GB'], // List supported languages
            features: ['pronunciation', 'fluency'], // List features
            audioFormats: ['wav', 'mp3', 'webm'], // Supported formats
            maxDuration: 60, // Maximum audio duration in seconds
        };
    }
}

// Usage example:
// const adapter = new TemplateAPIAdapter(config);
// lab.registerAPI('template', adapter);