const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Config Management
  getConfig: () => ipcRenderer.invoke('get-config'),
  onConfigReload: (callback) => ipcRenderer.on('config-reload', (event, config) => callback(config)),
  
  // Speech Processing Trigger
  processSpeech: (text) => ipcRenderer.invoke('process-speech', text),
  
  // Output Responses and State Changes
  onAssistantResponse: (callback) => ipcRenderer.on('assistant-response', (event, data) => callback(data)),
  onStateChange: (callback) => ipcRenderer.on('state-change', (event, state) => callback(state)),

  // Window Controls
  minimize: () => ipcRenderer.send('minimize-window')
});
