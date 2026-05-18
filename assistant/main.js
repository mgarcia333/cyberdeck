const { app, BrowserWindow, ipcMain, Tray, Menu, shell, nativeImage } = require('electron');
const path = require('path');
const say = require('say');
const http = require('http');
const fs = require('fs');
const url = require('url');

const ConfigManager = require('./ConfigManager');
const CommandEngine = require('./CommandEngine');
const AiEngine = require('./AiEngine');

let win = null;
let tray = null;
let configManager = null;
let commandEngine = null;
let aiEngine = null;
let isSpeaking = false;
let appIsQuitting = false;

// 16x16 / 32x32 Glowing Green Cyber Diode Base64 Icon (Bulletproof self-contained asset)
const base64Icon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAACx0lEQVRYhe2WP2gUQRzHPzO7u5c7c2eM5lQiiIKiVlZaiFpYWlsKgoWFhaWVhYXYWFhaWFhaWlhYWlpYWtglhYWFhbUTREVE1MTEi/Fyd3t7s7MYt/Fyj4tB/GBg2Znh+73fe79vhsU/j9V64G/HA4f62m20gXbV2jMAbUoD1B7apDZgYw04m3f2yUa1/YvAob52+4BqgN2itbWCNlUBpACpAm3K9yT4W1uC3+7O1wZs7eE4h4N5Z+f/CjxwqK99oNpDuyVra3m0KYF0i5b28K4kIKQW/K2lVvhbLdhuNfhuDzh4uK99bKPafknAUF/7QCfY7S1qW8kU+Fty6W0BSpvUprS1tAV/623Vgn+rVfhbsN1qBgeH+trH1tK/2N49tFuytpVHmxIIuQ/2f1bK1H8L/tZS8NuefDcc7Bwa6hvbXksLODxwaEvt9iralkDaT7n39uA3V/F3J/H3pvCby1W43UrcbsVvrZbgdyq/txa832rBw4NDW1q9s5WAs3nX6V6jDcgV2hSAtuFviW9X8Nvz6PsZevcMev8CevcM+v6/Qd//NfjtSfj9p/D3JuD3n9K7Z+F3JtH3U2q9BfR1Oph3ndaC3bWDwOHj2hLskbW1PNoG2lYAfq8Kvz2FfT6NvjmKvjmKvD6CvDKMvj6Mvv2Zvn9o8FtV+N1K+k8JffszfT+Dvj2Bvj2Kvh9S+6QdbD6uLVsLuDrurN1G94LdEm2tFCRX8Nuz9P00vXsKvfMevfsufX8ZfX+Zvn/m+9tH35/x/X3G97cJvT5Gvj6Mvv2Z3j2F3k7Ru4+g9Rbc1VXn1hbs/g0CJ8+c9Yp2i9ZWyVqXQEgv+NtL9P1v6Ls/yNu/Qd9dRd9dhL67sP0N+v4i/P4z6Iek2g+hv/yFvruMvr0Ie/eG2t7F9vOqVzt25pz3G4En59y4O3l2G7C1U9SmBFIi/N5KKn+NfPUPfOM3fP0n+doS+dqv1P/uH5W/mep/k69Nka8tkq9+hr7/Db/7A/y2e+dO3u7H3+Cpc94r2hZsq2it30Gaf4LeT+G3p9Gv/gRvnkDvPoDevc/o5t/j2Dnvw/8KPGm/Yv7X4i+W/kQ8cKivva1v11a4vUPQhuxf38aI2kGaxqgN1D7GNNK09ozV/y1uY3W4Gv5ZJz5uBJ4k9Xn9D9e/AM7P44FfM7kFAAAAAElFTkSuQmCC';

function startDashboardServer() {
  const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // CORS Headers for API requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // Intercept Configuration API routes
    if (pathname === '/api/config') {
      if (req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(configManager.getConfig()));
      } else if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
          try {
            const parsedData = JSON.parse(body);
            // Write config.json
            const configPath = path.join(__dirname, '..', 'config.json');
            fs.writeFileSync(configPath, JSON.stringify(parsedData, null, 2), 'utf8');
            
            // Sync ConfigManager internal state
            configManager.config = parsedData;
            if (configManager.callbacks) {
              configManager.callbacks.forEach(cb => cb(parsedData));
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(parsedData));
          } catch (err) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
          }
        });
      }
      return;
    }

    // Serve Static Next.js Web Assets
    let filePath = path.join(__dirname, 'dashboard_dist', pathname === '/' ? 'index.html' : pathname);

    // Support static clean-url routings (e.g. /dashboard/cyberdeck-config maps to cyberdeck-config.html)
    if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
      filePath += '.html';
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      let contentType = 'text/html';
      if (ext === '.js') contentType = 'application/javascript';
      else if (ext === '.css') contentType = 'text/css';
      else if (ext === '.json') contentType = 'application/json';
      else if (ext === '.png') contentType = 'image/png';
      else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
      else if (ext === '.ico') contentType = 'image/x-icon';
      else if (ext === '.svg') contentType = 'image/svg+xml';

      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
    } else {
      // Client-side Next.js SPA Routing fallback: Only for HTML navigation requests, never for static assets or API routes!
      const acceptHeader = req.headers['accept'] || '';
      const isHtmlRequest = acceptHeader.includes('text/html');
      const hasExtension = path.extname(pathname) !== '';

      const fallbackPath = path.join(__dirname, 'dashboard_dist', 'index.html');
      if (isHtmlRequest && !hasExtension && fs.existsSync(fallbackPath)) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        fs.createReadStream(fallbackPath).pipe(res);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      }
    }
  });

  server.on('error', (err) => {
    console.error('[HTTP Server] Server port 3000 is occupied. Trying another...');
  });

  server.listen(3000, () => {
    console.log('[HTTP Server] Local Control Panel active on http://localhost:3000');
  });
}

function createWindow() {
  const isHiddenStartup = process.argv.includes('--hidden');
  
  win = new BrowserWindow({
    width: 480,
    height: 640,
    resizable: false,
    frame: false, // Frameless design
    transparent: true,
    alwaysOnTop: false,
    show: !isHiddenStartup, // Starts hidden if Windows launched it at startup
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile('index.html');

  // Intercept Close Button: Hide to tray instead of quitting!
  win.on('close', (event) => {
    if (!appIsQuitting) {
      event.preventDefault();
      win.hide();
      console.log('[Lifecycle] Window minimized to System Tray.');
    }
  });

  win.on('closed', () => {
    win = null;
  });
}

function createTray() {
  const trayIcon = nativeImage.createFromDataURL(base64Icon);
  tray = new Tray(trayIcon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Cyberdeck Console',
      click: () => { if (win) win.show(); }
    },
    {
      label: 'Open Settings Panel',
      click: () => { shell.openExternal('http://localhost:3000'); }
    },
    { type: 'separator' },
    {
      label: 'Run on Windows Startup',
      type: 'checkbox',
      checked: app.getLoginItemSettings().openAtLogin,
      click: (menuItem) => {
        app.setLoginItemSettings({
          openAtLogin: menuItem.checked,
          openAsHidden: true
        });
        console.log(`[Startup] Set run-at-startup to: ${menuItem.checked}`);
      }
    },
    { type: 'separator' },
    {
      label: 'Deactivate Cyberdeck (Exit)',
      click: () => {
        appIsQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('CYBERDECK - AI System Assistant');
  tray.setContextMenu(contextMenu);

  // Single-click or double-click to slide the screen on
  tray.on('click', () => {
    if (win) {
      if (win.isVisible()) {
        win.hide();
      } else {
        win.show();
      }
    }
  });
}

app.whenReady().then(() => {
  // Initialize Core Engines
  configManager = new ConfigManager();
  commandEngine = new CommandEngine();
  aiEngine = new AiEngine();

  // Start Tray and Local Server
  createTray();
  startDashboardServer();
  createWindow();

  // Handle hot-reloads
  configManager.onChange((newConfig) => {
    console.log('[Main] Hot-reloaded config inside memory.');
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

// Offline SAPI SAPI Synthesizer helper with sync visualizer callbacks
function speakText(text, voiceName) {
  return new Promise((resolve) => {
    if (win) {
      win.webContents.send('state-change', 'speaking');
    }
    
    isSpeaking = true;
    let selectedVoice = voiceName || null;
    if (selectedVoice === 'Default') {
      selectedVoice = null;
    }

    console.log(`[TTS] Speaking: "${text}" [Voice: ${selectedVoice || 'Default'}]`);
    say.stop();

    say.speak(text, selectedVoice, 1.0, (err) => {
      if (err) {
        console.error('[TTS] Speech error:', err);
      }
      isSpeaking = false;
      if (win) {
        win.webContents.send('state-change', 'sleeping');
      }
      resolve();
    });
  });
}

// IPC Interfaces
ipcMain.on('minimize-window', () => {
  if (win) {
    win.minimize();
    console.log('[Lifecycle] Window minimized to Taskbar.');
  }
});

ipcMain.handle('get-config', () => {
  return configManager.getConfig();
});

ipcMain.handle('process-speech', async (event, text) => {
  const config = configManager.getConfig();
  console.log(`[Main] User input: "${text}"`);
  
  if (win) {
    win.webContents.send('state-change', 'processing');
  }

  // 1. Evaluate custom macro commands
  const macroResult = await commandEngine.matchAndExecute(text, config);
  
  if (macroResult && macroResult.matched) {
    if (macroResult.error) {
      if (win) {
        win.webContents.send('assistant-response', { text: `Error: ${macroResult.error}` });
      }
      await speakText(`Command failed during execution.`, config.ttsVoice);
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

  // 2. Query LLM Cognitive Core
  console.log(`[Main] Sending query to ${config.llmProvider}...`);
  const aiResponse = await aiEngine.ask(text, config);
  
  if (win) {
    win.webContents.send('assistant-response', { text: aiResponse });
  }
  await speakText(aiResponse, config.ttsVoice);
  return { status: 'conversational_responded', response: aiResponse };
});
