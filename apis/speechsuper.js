/**
 * SpeechSuper Pronunciation Assessment Adapter
 */
class SpeechSuperAdapter {
    constructor(config) {
        this.apiKey = config.SPEECHSUPER_KEY;
        this.appId = config.SPEECHSUPER_APP_ID || 'default';
        this.endpoint = 'https://api.speechsuper.com';
    }

    async test(audioBlob, referenceText, language = 'en-US') {
        try {
            // Prepare audio data
            const audioData = await this.prepareAudio(audioBlob);
            
            // Map language codes
            const langMap = {
                'en-US': 'en',
                'zh-CN': 'zh-cmn',
                'zh-TW': 'zh-cmn',
                'ja-JP': 'jp',
                'ko-KR': 'ko'
            };
            
            const ssLang = langMap[language] || 'en';
            
            // Determine core type based on language
            const coreType = ssLang === 'zh-cmn' ? 'word.eval.cn' : 'word.eval';
            
            // Build request
            const formData = new FormData();
            formData.append('audio', audioBlob, 'audio.wav');
            formData.append('text', referenceText);
            formData.append('coreType', coreType);
            formData.append('language', ssLang);
            
            const response = await fetch(
                `${this.endpoint}/eva/api`,
                {
                    method: 'POST',
                    headers: {
                        'X-API-Key': this.apiKey,
                        'X-App-Id': this.appId
                    },
                    body: formData
                }
            );

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`SpeechSuper API error: ${response.status} - ${error}`);
            }

            const data = await response.json();
            return this.normalizeResponse(data);
            
        } catch (error) {
            console.error('SpeechSuper API Error:', error);
            throw error;
        }
    }

    async prepareAudio(audioBlob) {
        // SpeechSuper accepts various formats
        return audioBlob;
    }

    normalizeResponse(data) {
        if (data.error) {
            throw new Error(`SpeechSuper error: ${data.error}`);
        }
        
        const result = data.result || {};
        const overall = result.overall || 0;
        const words = result.words || [];
        
        // Extract word and phoneme details
        const wordDetails = words.map(w => ({
            word: w.word,
            score: w.scores?.overall,
            phonemes: w.phonemes?.map(p => ({
                phone: p.phone,
                score: p.pronunciation,
                soundLike: p.sound_like
            }))
        }));
        
        // For Chinese, extract tone information
        const toneInfo = words[0]?.tone_scores ? {
            toneScore: words[0].tone_scores?.overall,
            tones: words[0].tone_scores?.details
        } : undefined;
        
        return {
            score: overall,
            details: {
                pronunciation: result.pronunciation,
                fluency: result.fluency,
                integrity: result.integrity,
                rhythm: result.rhythm,
                words: wordDetails.length > 0 ? wordDetails : undefined,
                tones: toneInfo
            },
            raw: data
        };
    }

    async testConnection() {
        // SpeechSuper doesn't have a status endpoint
        // We'll return true if API key is present
        return !!this.apiKey;
    }

    getCapabilities() {
        return {
            languages: [
                'en', 'zh-cmn', 'jp', 'ko',
                'es', 'de', 'fr', 'ru'
            ],
            features: [
                'pronunciation',
                'fluency',
                'integrity',
                'rhythm',
                'phoneme-level',
                'tone-analysis',
                'initial-final-sounds'
            ],
            audioFormats: ['wav', 'mp3', 'amr', 'opus'],
            maxDuration: 60
        };
    }
}