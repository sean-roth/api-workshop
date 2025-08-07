/**
 * Audio utility functions for format conversion and processing
 */

/**
 * Convert any audio blob to WAV format
 * Many APIs require WAV format for best results
 */
async function convertToWAV(audioBlob) {
    return new Promise((resolve, reject) => {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                const audioBuffer = await audioContext.decodeAudioData(e.target.result);
                const wavBlob = audioBufferToWav(audioBuffer);
                resolve(wavBlob);
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = reject;
        reader.readAsArrayBuffer(audioBlob);
    });
}

/**
 * Convert AudioBuffer to WAV blob
 */
function audioBufferToWav(buffer) {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const out = new ArrayBuffer(length);
    const view = new DataView(out);
    const channels = [];
    let sample;
    let offset = 0;
    let pos = 0;

    // Write WAVE header
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length = 16
    setUint16(1); // PCM
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2); // block-align
    setUint16(16); // 16-bit
    setUint32(0x61746164); // "data" - chunk
    setUint32(length - pos - 4); // chunk length

    // Write interleaved data
    for (let i = 0; i < buffer.numberOfChannels; i++) {
        channels.push(buffer.getChannelData(i));
    }

    while (pos < length) {
        for (let i = 0; i < numOfChan; i++) {
            sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
            sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF; // scale
            view.setInt16(pos, sample, true); // write 16-bit sample
            pos += 2;
        }
        offset++;
    }

    return new Blob([out], { type: 'audio/wav' });

    function setUint16(data) {
        view.setUint16(pos, data, true);
        pos += 2;
    }

    function setUint32(data) {
        view.setUint32(pos, data, true);
        pos += 4;
    }
}

/**
 * Convert audio blob to base64 string
 */
function audioToBase64(audioBlob) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.readAsDataURL(audioBlob);
    });
}

/**
 * Get audio duration from blob
 */
function getAudioDuration(audioBlob) {
    return new Promise((resolve) => {
        const audio = new Audio();
        audio.addEventListener('loadedmetadata', () => {
            resolve(audio.duration);
        });
        audio.src = URL.createObjectURL(audioBlob);
    });
}

/**
 * Resample audio to specific sample rate
 */
async function resampleAudio(audioBlob, targetSampleRate = 16000) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(await audioBlob.arrayBuffer());
    
    // Create offline context with target sample rate
    const offlineContext = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.duration * targetSampleRate,
        targetSampleRate
    );
    
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineContext.destination);
    source.start();
    
    const resampled = await offlineContext.startRendering();
    return audioBufferToWav(resampled);
}

/**
 * Trim silence from audio
 */
async function trimSilence(audioBlob, threshold = 0.01) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(await audioBlob.arrayBuffer());
    const data = audioBuffer.getChannelData(0);
    
    // Find start and end of audio
    let start = 0;
    let end = data.length - 1;
    
    for (let i = 0; i < data.length; i++) {
        if (Math.abs(data[i]) > threshold) {
            start = i;
            break;
        }
    }
    
    for (let i = data.length - 1; i >= 0; i--) {
        if (Math.abs(data[i]) > threshold) {
            end = i;
            break;
        }
    }
    
    // Create new buffer with trimmed audio
    const trimmedLength = end - start;
    const trimmedBuffer = audioContext.createBuffer(
        audioBuffer.numberOfChannels,
        trimmedLength,
        audioBuffer.sampleRate
    );
    
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        const trimmedData = trimmedBuffer.getChannelData(channel);
        for (let i = 0; i < trimmedLength; i++) {
            trimmedData[i] = channelData[start + i];
        }
    }
    
    return audioBufferToWav(trimmedBuffer);
}

/**
 * Normalize audio volume
 */
async function normalizeAudio(audioBlob) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(await audioBlob.arrayBuffer());
    
    // Find peak amplitude
    let maxAmplitude = 0;
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const data = audioBuffer.getChannelData(channel);
        for (let i = 0; i < data.length; i++) {
            maxAmplitude = Math.max(maxAmplitude, Math.abs(data[i]));
        }
    }
    
    // Calculate normalization factor
    const factor = 0.95 / maxAmplitude; // Normalize to 95% to avoid clipping
    
    // Apply normalization
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const data = audioBuffer.getChannelData(channel);
        for (let i = 0; i < data.length; i++) {
            data[i] *= factor;
        }
    }
    
    return audioBufferToWav(audioBuffer);
}