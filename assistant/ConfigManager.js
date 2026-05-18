const fs = require('fs');
const path = require('path');

class ConfigManager {
  constructor(configPath) {
    this.configPath = configPath || path.join(__dirname, '..', 'config.json');
    this.config = {};
    this.listeners = [];
    this.watchDebounceTimeout = null;

    this.loadConfig();
    this.startWatching();
  }

  loadConfig() {
    try {
      if (!fs.existsSync(this.configPath)) {
        console.log('[ConfigManager] Creating default config.json at:', this.configPath);
        const defaultConfig = {
          assistantName: 'Cyberdeck',
          wakeWord: 'cyberdeck',
          ttsVoice: 'Default',
          llmProvider: 'gemini',
          apiKey: '',
          customCommands: []
        };
        fs.writeFileSync(this.configPath, JSON.stringify(defaultConfig, null, 2), 'utf8');
      }

      const data = fs.readFileSync(this.configPath, 'utf8');
      if (data.trim() === '') return; // Wait if file is currently empty/being written
      this.config = JSON.parse(data);
      console.log('[ConfigManager] Config loaded successfully:', this.config);
    } catch (error) {
      console.error('[ConfigManager] Error reading/parsing config file:', error.message);
    }
  }

  startWatching() {
    console.log('[ConfigManager] Started watching:', this.configPath);
    
    // Using fs.watch with a debounce to prevent multiple triggers from single writes on Windows
    fs.watch(this.configPath, (eventType, filename) => {
      if (eventType === 'change') {
        if (this.watchDebounceTimeout) {
          clearTimeout(this.watchDebounceTimeout);
        }

        this.watchDebounceTimeout = setTimeout(() => {
          console.log('[ConfigManager] Config change detected on disk. Hot-reloading...');
          const oldConfig = { ...this.config };
          this.loadConfig();

          // Notify all registered change listeners
          this.listeners.forEach(callback => {
            try {
              callback(this.config, oldConfig);
            } catch (err) {
              console.error('[ConfigManager] Listener callback crashed:', err);
            }
          });
        }, 150); // 150ms debounce
      }
    });
  }

  getConfig() {
    return this.config;
  }

  onChange(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
  }
}

module.exports = ConfigManager;
