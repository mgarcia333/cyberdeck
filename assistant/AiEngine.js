class AiEngine {
  constructor() {
    console.log('[AiEngine] Initialized.');
  }

  /**
   * Generates a conversational response using Gemini or Groq API.
   * @param {string} prompt The cleaned speech transcript from user
   * @param {object} config The current loaded config.json
   */
  async ask(prompt, config) {
    const { llmProvider, apiKey, assistantName } = config;

    if (!apiKey) {
      return `Master, I am online but I require an API Key to think. Please configure it in the dashboard control panel!`;
    }

    const systemPrompt = `You are ${assistantName || 'Cyberdeck'}, a highly intelligent, retro-styled AI assistant from the Y2K era.
You live inside a skeuomorphic, glowing CRT monitor. Your personality is polite, clever, slightly futuristic, and charmingly retro.
Keep your responses short, conversational, and direct (max 2-3 sentences), since your responses will be read aloud via Text-To-Speech.
Avoid using markdown syntax (like asterisks, hashtags, or bold) because it sounds weird when read by TTS.`;

    try {
      if (llmProvider === 'gemini') {
        return await this.callGemini(prompt, apiKey, systemPrompt);
      } else if (llmProvider === 'groq') {
        return await this.callGroq(prompt, apiKey, systemPrompt);
      } else {
        throw new Error(`Unsupported LLM provider: ${llmProvider}`);
      }
    } catch (error) {
      console.error('[AiEngine] API call failed:', error);
      return `I encountered a cerebral synchronization error. Details: ${error.message}`;
    }
  }

  async callGemini(prompt, apiKey, systemPrompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ]
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!candidateText) {
      throw new Error('Empty response from Gemini.');
    }

    return candidateText.trim();
  }

  async callGroq(prompt, apiKey, systemPrompt) {
    const url = 'https://api.groq.com/openai/v1/chat/completions';
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: 150
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const messageContent = data.choices?.[0]?.message?.content;
    
    if (!messageContent) {
      throw new Error('Empty response from Groq.');
    }

    return messageContent.trim();
  }
}

module.exports = AiEngine;
