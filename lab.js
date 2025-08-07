/**
 * PronunciationLab - Core testing engine for pronunciation APIs
 */
class PronunciationLab {
    constructor() {
        this.apis = {};
        this.currentAudio = null;
        this.results = {};
        this.timings = {};
        this.costs = 0;
        this.sessions = [];
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        
        // Load saved sessions if any
        this.loadSessions();
    }

    /**
     * Register an API adapter
     */
    registerAPI(name, adapter) {
        this.apis[name] = adapter;
        this.createPanel(name);
        this.log(`Registered API: ${name}`);
    }

    /**
     * Create UI panel for an API
     */
    createPanel(name) {
        const grid = document.getElementById('api-grid');
        const panel = document.createElement('div');
        panel.className = 'api-panel';
        panel.id = `api-panel-${name}`;
        panel.innerHTML = `
            <div class="api-header">
                <span class="api-name">${name.toUpperCase()}</span>
                <span class="api-status" id="status-${name}">⏳</span>
            </div>
            <div class="api-results" id="results-${name}">
                <div class="result-row">
                    <span class="result-label">Status:</span>
                    <span class="result-value">Ready</span>
                </div>
            </div>
            <button onclick="lab.testSingle('${name}')" style="margin-top: 10px; width: 100%;">Test ${name}</button>
        `;
        grid.appendChild(panel);
    }

    /**
     * Test all registered APIs
     */
    async testAll() {
        if (!this.currentAudio) {
            this.log('No audio to test!', 'error');
            return;
        }

        const phrase = document.getElementById('test-phrase').value;
        const language = document.getElementById('language-select').value;
        
        this.log(`Testing all APIs with: "${phrase}" (${language})`);
        
        const promises = Object.entries(this.apis).map(async ([name, api]) => {
            await this.testSingle(name);
        });
        
        await Promise.all(promises);
        this.compareResults();
    }

    /**
     * Test a single API
     */
    async testSingle(name) {
        if (!this.currentAudio) {
            this.log(`${name}: No audio to test`, 'error');
            return;
        }

        const api = this.apis[name];
        const phrase = document.getElementById('test-phrase').value;
        const language = document.getElementById('language-select').value;
        const panel = document.getElementById(`api-panel-${name}`);
        const status = document.getElementById(`status-${name}`);
        const results = document.getElementById(`results-${name}`);
        
        // Update UI to show testing
        panel.className = 'api-panel testing';
        status.textContent = '⏳';
        results.innerHTML = '<div class="loading">Testing...</div>';
        
        try {
            const start = performance.now();
            const result = await api.test(this.currentAudio, phrase, language);
            const elapsed = performance.now() - start;
            
            this.results[name] = result;
            this.timings[name] = elapsed;
            
            // Update cost tracking
            if (config.COSTS && config.COSTS[name]) {
                this.costs += config.COSTS[name] / 100;
                this.updateCostDisplay();
            }
            
            // Update UI with results
            panel.className = 'api-panel success';
            status.textContent = '✅';
            results.innerHTML = this.formatResults(result, elapsed);
            
            this.log(`${name}: Success - Score: ${result.score?.toFixed(2) || 'N/A'} (${elapsed.toFixed(0)}ms)`);
            
            // Update JSON viewer
            this.updateJSONViewer(name, result);
            
        } catch (error) {
            panel.className = 'api-panel error';
            status.textContent = '❌';
            results.innerHTML = `<div class="error">Error: ${error.message}</div>`;
            
            this.log(`${name} ERROR: ${error.message}`, 'error');
            console.error(`${name} full error:`, error);
        }
    }

    /**
     * Format results for display
     */
    formatResults(result, elapsed) {
        let html = '';
        
        if (result.score !== undefined) {
            const scoreClass = result.score >= 80 ? 'good' : result.score >= 60 ? 'warning' : 'bad';
            html += `
                <div class="result-row">
                    <span class="result-label">Score:</span>
                    <span class="result-value ${scoreClass}">${result.score.toFixed(1)}</span>
                </div>
            `;
        }
        
        if (result.details) {
            Object.entries(result.details).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    const displayValue = typeof value === 'number' ? value.toFixed(1) : value;
                    html += `
                        <div class="result-row">
                            <span class="result-label">${key}:</span>
                            <span class="result-value">${displayValue}</span>
                        </div>
                    `;
                }
            });
        }
        
        html += `
            <div class="result-row">
                <span class="result-label">Time:</span>
                <span class="result-value">${elapsed.toFixed(0)}ms</span>
            </div>
        `;
        
        return html;
    }

    /**
     * Compare results across APIs
     */
    compareResults() {
        const scores = Object.entries(this.results)
            .filter(([_, result]) => result.score !== undefined)
            .map(([api, result]) => ({ api, score: result.score }));
        
        if (scores.length === 0) return;
        
        const avg = scores.reduce((a, b) => a + b.score, 0) / scores.length;
        const max = Math.max(...scores.map(s => s.score));
        const min = Math.min(...scores.map(s => s.score));
        const spread = max - min;
        
        this.log('===== COMPARISON =====');
        this.log(`Average score: ${avg.toFixed(1)}`);
        this.log(`Spread: ${spread.toFixed(1)} (${min.toFixed(1)} - ${max.toFixed(1)})`);
        
        // Find outliers
        const stdDev = Math.sqrt(
            scores.reduce((sq, s) => sq + Math.pow(s.score - avg, 2), 0) / scores.length
        );
        
        scores.forEach(s => {
            if (Math.abs(s.score - avg) > stdDev * 1.5) {
                this.log(`OUTLIER: ${s.api} (${s.score.toFixed(1)} vs avg ${avg.toFixed(1)})`, 'warning');
            }
        });
        
        // Update JSON viewer with comparison
        const comparison = {
            timestamp: new Date().toISOString(),
            phrase: document.getElementById('test-phrase').value,
            language: document.getElementById('language-select').value,
            statistics: { avg, min, max, spread, stdDev },
            scores,
            timings: this.timings,
            fullResults: this.results
        };
        
        document.getElementById('json-viewer').textContent = JSON.stringify(comparison, null, 2);
    }

    /**
     * Update JSON viewer with latest result
     */
    updateJSONViewer(name, result) {
        const viewer = document.getElementById('json-viewer');
        const current = viewer.textContent;
        
        try {
            const data = current === 'No data yet...' ? {} : JSON.parse(current);
            data[name] = result;
            viewer.textContent = JSON.stringify(data, null, 2);
        } catch (e) {
            viewer.textContent = JSON.stringify({ [name]: result }, null, 2);
        }
    }

    /**
     * Log message to terminal
     */
    log(message, level = 'info') {
        const terminal = document.getElementById('terminal');
        const timestamp = new Date().toLocaleTimeString();
        const levelClass = level === 'error' ? 'error' : level === 'warning' ? 'warning' : 'info';
        
        const line = document.createElement('div');
        line.className = `terminal-line ${levelClass}`;
        line.textContent = `[${timestamp}] ${message}`;
        
        terminal.appendChild(line);
        terminal.scrollTop = terminal.scrollHeight;
        
        // Also log to console in debug mode
        if (window.location.search.includes('debug=true')) {
            console.log(`[LAB ${level}] ${message}`);
        }
    }

    /**
     * Save current session
     */
    saveSession() {
        const session = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            phrase: document.getElementById('test-phrase').value,
            language: document.getElementById('language-select').value,
            results: this.results,
            timings: this.timings,
            costs: this.costs,
            audioLength: this.currentAudio?.size
        };
        
        this.sessions.push(session);
        
        // Save to localStorage
        localStorage.setItem('pronunciation-lab-sessions', JSON.stringify(this.sessions));
        
        // Download as file
        const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `session-${session.id}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.log(`Session saved (ID: ${session.id})`);
    }

    /**
     * Load saved sessions
     */
    loadSessions() {
        try {
            const saved = localStorage.getItem('pronunciation-lab-sessions');
            if (saved) {
                this.sessions = JSON.parse(saved);
                this.log(`Loaded ${this.sessions.length} saved sessions`);
            }
        } catch (e) {
            this.log('Could not load saved sessions', 'warning');
        }
    }

    /**
     * Update cost display
     */
    updateCostDisplay() {
        const display = document.getElementById('cost-tracker');
        if (display) {
            display.textContent = `Session cost: $${this.costs.toFixed(3)}`;
        }
    }

    /**
     * Clear all results
     */
    clear() {
        this.results = {};
        this.timings = {};
        
        // Reset UI
        document.querySelectorAll('.api-panel').forEach(panel => {
            panel.className = 'api-panel';
            const name = panel.id.replace('api-panel-', '');
            document.getElementById(`status-${name}`).textContent = '⏳';
            document.getElementById(`results-${name}`).innerHTML = `
                <div class="result-row">
                    <span class="result-label">Status:</span>
                    <span class="result-value">Ready</span>
                </div>
            `;
        });
        
        document.getElementById('json-viewer').textContent = 'No data yet...';
        this.log('Results cleared');
    }
}

// Helper functions for UI

/**
 * Toggle recording
 */
function toggleRecording() {
    if (lab.isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
}

/**
 * Start recording audio
 */
async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        lab.mediaRecorder = new MediaRecorder(stream);
        lab.audioChunks = [];
        
        lab.mediaRecorder.ondataavailable = (event) => {
            lab.audioChunks.push(event.data);
        };
        
        lab.mediaRecorder.onstop = () => {
            const audioBlob = new Blob(lab.audioChunks, { type: 'audio/webm' });
            lab.currentAudio = audioBlob;
            displayAudio(audioBlob);
            
            // Enable test button
            document.getElementById('test-all-btn').disabled = false;
            
            lab.log('Recording saved and ready to test');
        };
        
        lab.mediaRecorder.start();
        lab.isRecording = true;
        
        // Update button
        const btn = document.getElementById('record-btn');
        btn.className = 'active';
        btn.innerHTML = '<span class="icon">⏹️</span> Stop';
        
        lab.log('Recording started...');
        
        // Auto-stop after configured time
        const maxSeconds = config.MAX_RECORDING_SECONDS || 10;
        setTimeout(() => {
            if (lab.isRecording) {
                stopRecording();
                lab.log(`Auto-stopped after ${maxSeconds} seconds`);
            }
        }, maxSeconds * 1000);
        
    } catch (error) {
        lab.log(`Recording error: ${error.message}`, 'error');
    }
}

/**
 * Stop recording
 */
function stopRecording() {
    if (lab.mediaRecorder && lab.isRecording) {
        lab.mediaRecorder.stop();
        lab.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        lab.isRecording = false;
        
        // Update button
        const btn = document.getElementById('record-btn');
        btn.className = '';
        btn.innerHTML = '<span class="icon">🎤</span> Record';
        
        lab.log('Recording stopped');
    }
}

/**
 * Handle file upload
 */
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        lab.currentAudio = file;
        displayAudio(file);
        document.getElementById('test-all-btn').disabled = false;
        lab.log(`Loaded audio file: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    }
}

/**
 * Display audio player
 */
function displayAudio(audioBlob) {
    const controls = document.getElementById('audio-controls');
    const player = document.getElementById('audio-player');
    const info = document.getElementById('audio-info');
    
    controls.style.display = 'flex';
    player.src = URL.createObjectURL(audioBlob);
    
    const size = (audioBlob.size / 1024).toFixed(1);
    info.textContent = `Size: ${size} KB`;
}

/**
 * Test all APIs
 */
function testAllAPIs() {
    lab.testAll();
}

/**
 * Save current session
 */
function saveSession() {
    lab.saveSession();
}

/**
 * Clear results
 */
function clearResults() {
    lab.clear();
}

/**
 * Clear terminal
 */
function clearTerminal() {
    document.getElementById('terminal').innerHTML = '';
    lab.log('Terminal cleared');
}

/**
 * Copy JSON to clipboard
 */
function copyJSON() {
    const json = document.getElementById('json-viewer').textContent;
    navigator.clipboard.writeText(json).then(() => {
        lab.log('JSON copied to clipboard');
    });
}

/**
 * Load quick phrases
 */
function loadQuickPhrases() {
    const container = document.getElementById('phrase-buttons');
    const phrases = config.TEST_PHRASES || [];
    
    phrases.forEach((phrase, index) => {
        const btn = document.createElement('button');
        btn.className = 'phrase-btn';
        btn.textContent = phrase.substring(0, 20) + (phrase.length > 20 ? '...' : '');
        btn.title = phrase;
        btn.onclick = () => {
            document.getElementById('test-phrase').value = phrase;
            lab.log(`Loaded phrase: "${phrase}"`);
        };
        container.appendChild(btn);
        
        // Keyboard shortcut (1-9)
        if (index < 9) {
            document.addEventListener('keydown', (e) => {
                if (e.key === String(index + 1) && e.ctrlKey) {
                    e.preventDefault();
                    btn.click();
                }
            });
        }
    });
}

/**
 * Test API connections
 */
async function testConnections() {
    const status = document.getElementById('connection-status');
    let connected = 0;
    let total = Object.keys(lab.apis).length;
    
    if (total === 0) {
        status.textContent = 'No APIs configured';
        status.className = 'error';
        return;
    }
    
    status.textContent = `Testing ${total} APIs...`;
    
    for (const [name, api] of Object.entries(lab.apis)) {
        try {
            if (api.testConnection) {
                await api.testConnection();
                connected++;
                lab.log(`${name}: Connection OK`);
            } else {
                connected++; // Assume OK if no test method
            }
        } catch (error) {
            lab.log(`${name}: Connection failed - ${error.message}`, 'error');
        }
    }
    
    status.textContent = `Connected: ${connected}/${total} APIs`;
    status.className = connected === total ? 'connected' : connected > 0 ? 'warning' : 'error';
}