
import getChatSession from './chatSession.js';

async function askGemini(message) {
  try {
    const chat = await getChatSession();
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();
    return text;
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

export { askGemini };
