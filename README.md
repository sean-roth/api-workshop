# API Workshop - Pronunciation Testing Lab 🔬

A lightweight testing environment for comparing pronunciation assessment APIs. Built for rapid experimentation and R&D.

## 🎯 Purpose

This is a developer-focused dashboard for testing and comparing pronunciation APIs. It's designed as a research tool, not a product - think of it as a lab notebook that runs code.

## ✨ Features

- 🎤 **Record or Upload**: Test with live recordings or audio files
- ⚡ **Multi-API Testing**: Compare results across multiple APIs simultaneously
- 📊 **Real-time Analysis**: See scores, timing, and detailed feedback
- 💾 **Data Export**: Save sessions as JSON for further analysis
- 🔍 **Raw Response Viewer**: Inspect actual API responses
- 💰 **Cost Tracking**: Monitor API usage costs per session
- 🌏 **Multi-language**: Support for Chinese, English, Japanese, Korean, and more
- 🛠️ **Developer-friendly**: Terminal output, JSON viewer, debug mode

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/sean-roth/api-workshop.git
cd api-workshop
```

### 2. Configure API keys
```bash
cp config.example.js config.js
# Edit config.js with your API keys
```

### 3. Open in browser
```bash
# Just open the HTML file directly
open index.html  # macOS
# or
start index.html  # Windows
# or simply drag index.html into Chrome
```

### 4. Test pronunciation
- Enter text to practice (e.g., "你好嗎" for Chinese)
- Click 🎤 Record or 📁 Upload audio
- Click ⚡ Test All to compare APIs
- View results and analysis

## 🔑 API Configuration

Edit `config.js` with your API credentials:

```javascript
const config = {
    // Azure Speech Services
    AZURE_KEY: 'your-azure-key',
    AZURE_REGION: 'eastus',
    
    // SpeechSuper
    SPEECHSUPER_KEY: 'your-key',
    SPEECHSUPER_APP_ID: 'your-app-id',
    
    // Add more as needed...
};
```

## 📚 Supported APIs

| API | Status | Languages | Key Features |
|-----|--------|-----------|--------------|
| **Azure Speech** | ✅ Ready | 15+ languages | Phoneme-level analysis, word-level scoring |
| **SpeechSuper** | ✅ Ready | 8 languages | Tone analysis for Chinese, detailed phoneme feedback |
| **Speechace** | 📝 Template | English, Spanish, French | Grammar & vocabulary assessment |
| **ELSA** | 📝 Template | English | Engagement-focused feedback |
| **Google Cloud** | 📝 Template | 125+ languages | Baseline transcription |

## 🎮 Usage Guide

### Recording Audio
- **Space**: Start/stop recording
- **Auto-stop**: Recordings stop after 10 seconds
- **Upload**: Support for WAV, MP3, WebM formats

### Keyboard Shortcuts
- `Space` - Start/stop recording
- `Ctrl+Enter` - Test all APIs
- `Ctrl+S` - Save session
- `Ctrl+1-9` - Quick load test phrases

### Debug Mode
Add `?debug=true` to the URL for verbose logging:
```
file:///path/to/index.html?debug=true
```

## 🔧 Adding New APIs

1. Copy the template:
```bash
cp apis/_template.js apis/newapi.js
```

2. Implement the required methods:
```javascript
class NewAPIAdapter {
    async test(audioBlob, referenceText, language) {
        // Your implementation
    }
    
    normalizeResponse(apiResponse) {
        return {
            score: apiResponse.score,
            details: {...},
            raw: apiResponse
        };
    }
}
```

3. Register in `index.html`:
```javascript
lab.registerAPI('newapi', new NewAPIAdapter(config));
```

## 📊 Understanding Results

### Score Interpretation
- **80-100**: Excellent pronunciation
- **60-79**: Good, minor issues
- **40-59**: Needs improvement
- **0-39**: Significant issues

### API Comparison
The terminal shows:
- Average scores across APIs
- Standard deviation
- Outlier detection
- Response times

### Cost Tracking
Session costs are tracked based on typical pricing:
- Azure: ~$0.004 per assessment
- SpeechSuper: ~$0.002 per assessment
- Speechace: ~$0.003 per assessment

## 📁 Project Structure

```
api-workshop/
├── index.html          # Main dashboard
├── lab.js              # Core testing engine
├── style.css           # Dark theme styling
├── config.js           # Your API keys (gitignored)
├── config.example.js   # Template configuration
├── apis/
│   ├── _template.js    # API adapter template
│   ├── azure.js        # Azure implementation
│   └── speechsuper.js  # SpeechSuper implementation
└── utils/
    └── audio.js        # Audio processing utilities
```

## 🐛 Troubleshooting

### No microphone access
- Ensure using HTTPS or localhost
- Check browser permissions
- Try Chrome/Edge for best compatibility

### API errors
- Verify API keys in config.js
- Check console for detailed errors
- Use "Test Connection" on page load

### Audio format issues
- Use WAV for best compatibility
- The tool includes converters for other formats
- Check console for conversion errors

## 🧪 Advanced Features

### Audio Processing
- WAV conversion
- Base64 encoding
- Sample rate resampling
- Silence trimming
- Volume normalization

### Session Management
- Local storage persistence
- JSON export
- Batch session analysis
- Historical comparisons

### Data Analysis
The exported JSON includes:
- Raw API responses
- Normalized scores
- Timing data
- Cost calculations
- Audio metadata

## 💡 Tips

1. **Start simple**: Test with Azure first (most reliable)
2. **Use consistent audio**: Same recording across APIs for fair comparison
3. **Monitor costs**: Check the session cost tracker
4. **Export everything**: Save JSONs for later analysis
5. **Test edge cases**: Try different accents, speeds, background noise

## 🤝 Contributing

This is a research tool, not a product. Fork and modify as needed for your research.

### Ideas for Extension
- Add more language-specific APIs
- Implement real-time streaming
- Add visualization charts
- Create automated test suites
- Build API performance benchmarks

## 📜 License

MIT - Use freely for testing and research

## 🔗 Resources

- [Azure Speech Docs](https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/)
- [SpeechSuper API](https://docs.speechsuper.com/)
- [Speechace Documentation](https://docs.speechace.com/)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

---

**Note**: This tool stores API keys locally in your browser. Never commit `config.js` to version control.

**Purpose**: Built for testing pronunciation APIs during R&D for language learning applications.