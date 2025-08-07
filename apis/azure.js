/**
 * Azure Speech Services Pronunciation Assessment Adapter
 */
class AzureAdapter {
    constructor(config) {
        this.subscriptionKey = config.AZURE_KEY;
        this.region = config.AZURE_REGION || 'eastus';
        this.endpoint = `https://${this.region}.stt.speech.microsoft.com`;
    }

    async test(audioBlob, referenceText, language = 'en-US') {
        try {
            // Convert audio to WAV format if needed
            const audioData = await this.prepareAudio(audioBlob);
            
            // Create pronunciation assessment config
            const pronunciationConfig = {
                referenceText: referenceText,
                gradingSystem: 'HundredMark',
                granularity: 'Phoneme',
                dimension: 'Comprehensive',
                enableMiscue: true
            };
            
            // Make the API call
            const response = await fetch(
                `${this.endpoint}/speech/recognition/conversation/cognitiveservices/v1?language=${language}`,
                {
                    method: 'POST',
                    headers: {
                        'Ocp-Apim-Subscription-Key': this.subscriptionKey,
                        'Content-Type': 'audio/wav',
                        'Accept': 'application/json',
                        'Pronunciation-Assessment': btoa(JSON.stringify(pronunciationConfig))
                    },
                    body: audioData
                }
            );

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Azure API error: ${response.status} - ${error}`);
            }

            const data = await response.json();
            return this.normalizeResponse(data);
            
        } catch (error) {
            console.error('Azure API Error:', error);
            throw error;
        }
    }

    async prepareAudio(audioBlob) {
        // Azure requires WAV format
        // For now, we'll send as-is and handle conversion later if needed
        return await audioBlob.arrayBuffer();
    }

    normalizeResponse(data) {
        const assessment = data.NBest?.[0]?.PronunciationAssessment;
        const words = data.NBest?.[0]?.Words || [];
        
        if (!assessment) {
            throw new Error('No pronunciation assessment in response');
        }
        
        // Extract word-level details
        const wordScores = words.map(w => ({
            word: w.Word,
            accuracy: w.PronunciationAssessment?.AccuracyScore,
            error: w.PronunciationAssessment?.ErrorType
        }));
        
        return {
            score: assessment.PronScore || 0,
            details: {
                accuracy: assessment.AccuracyScore,
                fluency: assessment.FluencyScore, 
                completeness: assessment.CompletenessScore,
                pronunciation: assessment.PronScore,
                words: wordScores.length > 0 ? wordScores : undefined
            },
            raw: data
        };
    }

    async testConnection() {
        // Test with a simple speech-to-text call
        try {
            const response = await fetch(
                `${this.endpoint}/speech/recognition/conversation/cognitiveservices/v1?language=en-US`,
                {
                    method: 'GET',
                    headers: {
                        'Ocp-Apim-Subscription-Key': this.subscriptionKey
                    }
                }
            );
            
            // Azure returns 405 for GET, but that means auth worked
            return response.status === 405 || response.ok;
        } catch (error) {
            throw new Error(`Azure connection test failed: ${error.message}`);
        }
    }

    getCapabilities() {
        return {
            languages: [
                'en-US', 'en-GB', 'en-AU', 'en-CA', 'en-IN',
                'zh-CN', 'zh-TW', 'zh-HK',
                'ja-JP', 'ko-KR',
                'es-ES', 'es-MX',
                'fr-FR', 'fr-CA',
                'de-DE', 'it-IT', 'pt-BR', 'ru-RU'
            ],
            features: [
                'pronunciation',
                'accuracy',
                'fluency',
                'completeness',
                'phoneme-level',
                'word-level'
            ],
            audioFormats: ['wav', 'mp3', 'ogg'],
            maxDuration: 60
        };
    }
}