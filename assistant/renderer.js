// ==========================================================================
// RENDERER PROCESS - RETRO Y2K CLIENT INTERFACE
// ==========================================================================

const crtTime = document.getElementById('crtTime');
const statusText = document.getElementById('statusText');
const eqContainer = document.getElementById('eqContainer');
const terminalLog = document.getElementById('terminalLog');
const consoleInput = document.getElementById('consoleInput');
const closeBtn = document.getElementById('closeBtn');
const minBtn = document.getElementById('minBtn');
const micTriggerBtn = document.getElementById('micTriggerBtn');

const powerDiode = document.getElementById('powerDiode');
const micDiode = document.getElementById('micDiode');
const thinkDiode = document.getElementById('thinkDiode');

let activeConfig = {};
let appState = 'sleeping'; // sleeping, listening, processing, speaking
let isSpeechActive = false;
let recognition = null;

// Clock updates (Y2K retro dashboard style)
function updateClock() {
  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0];
  crtTime.textContent = timeStr;
}
setInterval(updateClock, 1000);
updateClock();

// Clean up manual inputs
function cleanText(text) {
  return text ? text.trim() : '';
}

// Append logs to the scrollable CRT terminal log
function appendLog(sender, text) {
  if (!text) return;
  const msgDiv = document.createElement('div');
  
  if (sender === 'USER') {
    msgDiv.className = 'user-msg';
    msgDiv.innerHTML = `<span class="system-msg">[USER] &gt;</span> ${text}`;
  } else if (sender === 'CYBERDECK') {
    msgDiv.className = 'assistant-msg';
    msgDiv.innerHTML = `<span class="system-msg">[CYBERDECK] &gt;</span> ${text}`;
  } else {
    msgDiv.className = 'system-msg';
    msgDiv.textContent = `SYSTEM: ${text}`;
  }
  
  terminalLog.appendChild(msgDiv);
  terminalLog.scrollTop = terminalLog.scrollHeight;
}

// Update visual states, diodes, and equalizer modes
function changeState(newState) {
  appState = newState;
  console.log(`[State] Transitioned to: ${newState}`);
  
  // Reset all dynamic equalizer & diode styles
  eqContainer.className = 'eq-container';
  micDiode.className = 'diode-light';
  thinkDiode.className = 'diode-light';
  
  if (newState === 'sleeping') {
    statusText.textContent = 'SLEEPING';
    powerDiode.className = 'diode-light active-green';
    // Restart voice recognition if it was paused
    startSpeechRecognition();
  } else if (newState === 'listening') {
    statusText.textContent = 'LISTENING...';
    eqContainer.classList.add('listening');
    micDiode.className = 'diode-light active-green';
  } else if (newState === 'processing') {
    statusText.textContent = 'THINKING...';
    thinkDiode.className = 'diode-light active-orange';
    // Pause speech recognition while thinking to save API cycles
    stopSpeechRecognition();
  } else if (newState === 'speaking') {
    statusText.textContent = 'SPEAKING';
    eqContainer.classList.add('speaking');
    thinkDiode.className = 'diode-light active-orange';
    // Pause speech recognition while Jarvis speaks to avoid voice feedback loops
    stopSpeechRecognition();
  }
}

// Safe Window Deactivation
closeBtn.addEventListener('click', () => {
  window.close(); // Closes the Electron process safely
});

if (minBtn) {
  minBtn.addEventListener('click', () => {
    window.electronAPI.minimize();
  });
}

// IPC handlers from the main process
window.electronAPI.onStateChange((state) => {
  changeState(state);
});

window.electronAPI.onAssistantResponse((data) => {
  if (data && data.text) {
    appendLog('CYBERDECK', data.text);
  }
});

window.electronAPI.onConfigReload((newConfig) => {
  activeConfig = newConfig;
  console.log('[Config] Hot-reloaded in renderer:', activeConfig);
  document.getElementById('wakeWordMsg').textContent = `WAKE WORD: "${activeConfig.wakeWord.toUpperCase()}"`;
  appendLog('SYSTEM', `Configuration hot-reloaded! Wake word: "${activeConfig.wakeWord}"`);
});

// Load config at startup
async function initConfig() {
  activeConfig = await window.electronAPI.getConfig();
  console.log('[Config] Loaded initial config:', activeConfig);
  document.getElementById('wakeWordMsg').textContent = `WAKE WORD: "${activeConfig.wakeWord.toUpperCase()}"`;
  initSpeechRecognition();
}
initConfig();

// Web Speech API Voice Recognition setup
function initSpeechRecognition() {
  if (!('webkitSpeechRecognition' in window)) {
    appendLog('SYSTEM', 'ERROR: Web Speech API is not supported in this browser.');
    return;
  }

  recognition = new webkitSpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = false;
  
  // Standard English language recognition (supports natural voice commands)
  recognition.lang = 'en-US';

  recognition.onstart = () => {
    isSpeechActive = true;
    console.log('[STT] Speech recognition active.');
  };

  recognition.onend = () => {
    isSpeechActive = false;
    console.log('[STT] Speech recognition disconnected.');
    // Restart only if we are still in sleeping or listening states
    if (appState === 'sleeping' || appState === 'listening') {
      setTimeout(startSpeechRecognition, 400);
    }
  };

  recognition.onerror = (event) => {
    console.error('[STT] Speech recognition error:', event.error);
    if (event.error === 'not-allowed') {
      appendLog('SYSTEM', 'ERROR: Microphone permissions denied.');
    }
  };

  recognition.onresult = async (event) => {
    const transcript = event.results[event.results.length - 1][0].transcript.trim();
    console.log(`[STT] Transcribed text: "${transcript}"`);

    const cleanedText = transcript.toLowerCase();
    const wakeWord = activeConfig.wakeWord.toLowerCase();

    if (appState === 'sleeping') {
      // Check if user spoke the wake word
      if (cleanedText.includes(wakeWord)) {
        appendLog('SYSTEM', `WAKE TRIGGER DETECTED: "${wakeWord}"`);
        
        // Splitting prompt in case wake word and utterance were spoken in a single flow
        const parts = cleanedText.split(wakeWord);
        const prompt = parts.slice(1).join(wakeWord).trim();

        if (prompt.length > 0) {
          appendLog('USER', prompt);
          changeState('processing');
          await window.electronAPI.processSpeech(prompt);
        } else {
          // Play indicator and transition state to listen
          changeState('listening');
          appendLog('SYSTEM', 'Acknowledged. Listening...');
        }
      }
    } else if (appState === 'listening') {
      // In listening state, process any spoken text immediately
      appendLog('USER', transcript);
      changeState('processing');
      await window.electronAPI.processSpeech(transcript);
    }
  };

  startSpeechRecognition();
}

function startSpeechRecognition() {
  if (recognition && !isSpeechActive) {
    try {
      recognition.start();
    } catch (e) {
      console.error('[STT] Failed to start recognition:', e);
    }
  }
}

function stopSpeechRecognition() {
  if (recognition && isSpeechActive) {
    try {
      recognition.stop();
    } catch (e) {
      console.error('[STT] Failed to stop recognition:', e);
    }
  }
}

// Manual Wake overrides (Clicking the plastic dome buttons)
micTriggerBtn.addEventListener('click', () => {
  if (appState === 'sleeping') {
    changeState('listening');
    appendLog('SYSTEM', 'Manual wake overridden. Listening...');
  } else if (appState === 'listening') {
    changeState('sleeping');
    appendLog('SYSTEM', 'Vocal engine returned to sleep.');
  }
});

// Terminal Console prompt keyboard fallbacks
consoleInput.addEventListener('keydown', async (event) => {
  if (event.key === 'Enter') {
    const inputVal = cleanText(consoleInput.value);
    if (!inputVal) return;
    
    consoleInput.value = '';
    appendLog('USER', inputVal);
    
    changeState('processing');
    await window.electronAPI.processSpeech(inputVal);
  }
});
