const { exec } = require('child_process');
const { shell } = require('electron');

class CommandEngine {
  constructor() {
    console.log('[CommandEngine] Initialized.');
  }

  /**
   * Cleans text by making it lowercase, removing punctuation, and extra whitespace.
   */
  cleanText(text) {
    if (!text) return '';
    return text
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Matches a transcription against the configured macros.
   * @param {string} transcription The text transcribed from user's voice/typing
   * @param {object} config The current loaded config.json
   * @returns {Promise<object|null>} The matched command details, or null if no match
   */
  async matchAndExecute(transcription, config) {
    if (!transcription || !config || !config.customCommands) {
      return null;
    }

    const cleanedInput = this.cleanText(transcription);
    console.log(`[CommandEngine] Evaluating cleaned input: "${cleanedInput}"`);

    // Look for a matched command
    for (const cmd of config.customCommands) {
      const cleanedTrigger = this.cleanText(cmd.trigger);
      
      // We do a flexible inclusion check (e.g. "please open youtube" matches trigger "open youtube")
      if (cleanedTrigger && cleanedInput.includes(cleanedTrigger)) {
        console.log(`[CommandEngine] MATCH FOUND! Trigger: "${cmd.trigger}" -> Action: ${cmd.actionType}`);
        
        try {
          const result = await this.executeAction(cmd.actionType, cmd.payload);
          return {
            matched: true,
            trigger: cmd.trigger,
            actionType: cmd.actionType,
            payload: cmd.payload,
            result: result
          };
        } catch (error) {
          console.error(`[CommandEngine] Error executing action for trigger "${cmd.trigger}":`, error);
          return {
            matched: true,
            trigger: cmd.trigger,
            actionType: cmd.actionType,
            payload: cmd.payload,
            error: error.message
          };
        }
      }
    }

    return null;
  }

  /**
   * Executes the specific macro action type.
   */
  executeAction(actionType, payload) {
    return new Promise((resolve, reject) => {
      if (!payload) {
        return reject(new Error('Empty payload provided.'));
      }

      switch (actionType) {
        case 'open_url':
          console.log(`[CommandEngine] Opening URL: ${payload}`);
          let url = payload.trim();
          if (!/^https?:\/\//i.test(url)) {
            url = 'https://' + url;
          }
          
          // Electron shell.openExternal opens default OS browser safely
          shell.openExternal(url)
            .then(() => resolve(`Opened URL: ${url}`))
            .catch(err => reject(new Error(`Failed to open URL: ${err.message}`)));
          break;

        case 'cli_command':
          console.log(`[CommandEngine] Running CLI Command: ${payload}`);
          exec(payload, (error, stdout, stderr) => {
            if (error) {
              console.error(`[CommandEngine] CLI execution error:`, error);
              return reject(error);
            }
            const output = stdout.trim() || stderr.trim() || 'Executed successfully.';
            resolve(output);
          });
          break;

        case 'keystroke':
          console.log(`[CommandEngine] Simulating keystroke payload: ${payload}`);
          
          // On Windows, simulate keystrokes natively via PowerShell SendKeys!
          const psCommand = `
            Add-Type -AssemblyName System.Windows.Forms;
            [System.Windows.Forms.SendKeys]::SendWait('${this.mapKeysToPowerShell(payload)}');
          `;
          
          // We execute powershell command directly in a single line
          exec(`powershell -Command "${psCommand.replace(/\n/g, '').trim()}"`, (error, stdout, stderr) => {
            if (error) {
              console.error(`[CommandEngine] Keystroke execution error:`, error);
              return reject(error);
            }
            resolve(`Simulated keys: ${payload}`);
          });
          break;

        default:
          reject(new Error(`Unsupported action type: ${actionType}`));
      }
    });
  }

  /**
   * Maps common shortcuts to Windows SendKeys format.
   * SendKeys characters: Shift = +, Ctrl = ^, Alt = %
   * Examples:
   * "Ctrl+c" -> "^(c)"
   * "Alt+Tab" -> "%({TAB})"
   */
  mapKeysToPowerShell(keys) {
    let result = keys.trim();
    
    // Replace standard modifiers with SendKeys markers
    result = result.replace(/ctrl/i, '^');
    result = result.replace(/shift/i, '+');
    result = result.replace(/alt/i, '%');
    
    // Strip "+" characters used to join keys
    result = result.replace(/\+/g, '');
    
    // Wrap key in parenthesis if preceded by modifiers to group them
    const match = result.match(/^([\^+%]+)([a-zA-Z0-9]+)$/);
    if (match) {
      const modifiers = match[1];
      const key = match[2];
      
      const specialKeys = ['tab', 'enter', 'esc', 'space', 'up', 'down', 'left', 'right', 'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12'];
      if (specialKeys.includes(key.toLowerCase())) {
        result = `${modifiers}{${key.toUpperCase()}}`;
      } else {
        result = `${modifiers}(${key})`;
      }
    }
    
    return result;
  }
}

module.exports = CommandEngine;
