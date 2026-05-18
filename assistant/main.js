const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const say = require('say');

const ConfigManager = require('./ConfigManager');
const CommandEngine = require('./CommandEngine');
const AiEngine = require('./AiEngine');

let win;
let configManager;
let commandEngine;
let aiEngine;
let isSpeaking = false;

function createWindow() {
  win = new BrowserWindow({
    width: 480,
    height: 640,
    resizable: false,
    frame: false, // Frameless window for premium skeuomorphic console vibe
    transparent: true, // Transparent window boundaries
    alwaysOnTop: true, // Floating on desktop
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile('index.html');

  // Open DevTools if running in debug mode
  // win.webContents.openDevTools({ mode: 'detach' });

  win.on('closed', () => {
    win = null;
  });
}

app.whenReady().then(() => {
  // Initialize Modules
  configManager = new ConfigManager();
  commandEngine = new CommandEngine();
  aiEngine = new AiEngine();

  createWindow();

  // Handle Config hot-reloading
  configManager.onChange((newConfig) => {
    console.log('[Main] Hot-reloaded new config. Sending to renderer.');
    if (win) {
      win.webContents.send('config-reload', newConfig);
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Helper for TTS speaking with state management
function speakText(text, voiceName) {
  return new Promise((resolve) => {
    if (win) {
      win.webContents.send('state-change', 'speaking');
    }
    
    isSpeaking = true;
    
    // Clean voiceName for SAPI on Windows (say package does exact matching)
    // SAPI voice names usually match "Microsoft David" or "Microsoft Zira"
    let selectedVoice = voiceName || null;
    if (selectedVoice === 'Default') {
      selectedVoice = null;
    }

    console.log(`[TTS] Speaking: "${text}" using voice: ${selectedVoice || 'System Default'}`);
    
    // Stop any current speaking before starting new
    say.stop();

    say.speak(text, selectedVoice, 1.0, (err) => {
      if (err) {
        console.error('[TTS] Error during speaking:', err);
      }
      
      isSpeaking = false;
      
      if (win) {
        win.webContents.send('state-change', 'sleeping');
      }
      resolve();
    });
  });
}

// IPC Handlers
ipcMain.handle('get-config', () => {
  return configManager.getConfig();
});

ipcMain.handle('process-speech', async (event, text) => {
  const config = configManager.getConfig();
  const assistantName = config.assistantName || 'Jarvis';

  console.log(`[Main] Processing user speech: "${text}"`);
  
  if (win) {
    win.webContents.send('state-change', 'processing');
  }

  // 1. Try to match and execute custom macros
  const macroResult = await commandEngine.matchAndExecute(text, config);
  
  if (macroResult && macroResult.matched) {
    if (macroResult.error) {
      const errorMsg = `Command matching trigger ${macroResult.trigger} encountered an execution error.`;
      if (win) {
        win.webContents.send('assistant-response', { text: `Error: ${macroResult.error}` });
      }
      await speakText(errorMsg, config.ttsVoice);
      return { status: 'error', error: macroResult.error };
    }

    const speakMsg = `Executing custom command to ${macroResult.trigger.toLowerCase()} now, Master.`;
    if (win) {
      win.webContents.send('assistant-response', {
        text: `COMMAND TRIGGERED: "${macroResult.trigger}"\nAction: ${macroResult.actionType}\nResult: ${macroResult.result}`
      });
    }
    
    await speakText(speakMsg, config.ttsVoice);
    return { status: 'macro_executed', macro: macroResult };
  }

  // 2. Default to Conversational LLM Response
  console.log(`[Main] Bypassed macros. Querying LLM (${config.llmProvider})...`);
  const aiResponse = await aiEngine.ask(text, config);
  
  if (win) {
    win.webContents.send('assistant-response', { text: aiResponse });
  }

  await speakText(aiResponse, config.ttsVoice);
  return { status: 'conversational_responded', response: aiResponse };
});
