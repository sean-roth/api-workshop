// Copy this file to config.js and add your API keys
// config.js is gitignored to keep your keys safe

const config = {
    // Azure Speech Services
    AZURE_KEY: 'your-azure-key-here',
    AZURE_REGION: 'eastus', // or your region
    
    // SpeechSuper
    SPEECHSUPER_KEY: 'your-speechsuper-key',
    SPEECHSUPER_APP_ID: 'your-app-id',
    
    // Speechace (when ready)
    SPEECHACE_KEY: '',
    
    // ELSA (when ready)
    ELSA_KEY: '',
    
    // Google Cloud (optional)
    GOOGLE_CLOUD_KEY: '',
    
    // Settings
    DEFAULT_LANGUAGE: 'zh-TW', // or 'en-US', 'ja-JP', etc.
    AUTO_SAVE_SESSIONS: true,
    MAX_RECORDING_SECONDS: 10,
    SHOW_COSTS: true,
    
    // Quick test phrases
    TEST_PHRASES: [
        '你好嗎',
        '早安',
        '謝謝你',
        '我想要一杯咖啡',
        '明天見',
        'Hello, how are you?',
        'The weather is nice today',
        'pronunciation assessment'
    ],
    
    // API Costs (cents per request)
    COSTS: {
        azure: 0.4,        // $0.004
        speechsuper: 0.2,  // $0.002
        speechace: 0.3,    // $0.003
        elsa: 0.3,         // $0.003
        google: 0.1        // $0.001
    }
};

// Make config available globally
if (typeof window !== 'undefined') {
    window.config = config;
}