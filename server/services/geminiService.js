
// import getChatSession from './chatSession.js';

// async function askGemini(message) {
//   try {
//     const chat = await getChatSession();
//     const result = await chat.sendMessage(message);
//     const response = await result.response;
//     const text = response.text();
//     return text;
//   } catch (error) {
//     console.error('Gemini API error:', error);
//     throw error;
//   }
// }

// export { askGemini };

import dotenv from 'dotenv'; 
dotenv.config(); 
import { GoogleGenerativeAI } from '@google/generative-ai';  

if (!process.env.GEMINI_API_KEY) { throw new Error('GEMINI_API_KEY is not defined in environment variables') }  

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function askGemini(contextMessages) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Convert contextMessages to Gemini format
    const history = [];
    let systemPrompt = '';

    // Process messages to build history and extract system prompt
    for (let i = 0; i < contextMessages.length; i++) {
      const msg = contextMessages[i];
      
      if (msg.role === 'system') {
        // Store system prompt separately (Gemini handles it differently)
        systemPrompt = msg.content;
      } else if (msg.role === 'user') {
        history.push({
          role: "user",
          parts: [{ text: msg.content }]
        });
      } else if (msg.role === 'assistant') {
        history.push({
          role: "model", // Gemini uses "model" instead of "assistant"
          parts: [{ text: msg.content }]
        });
      }
    }

    // If we have conversation history, start chat with history
    if (history.length > 0) {
      // Add system prompt as first interaction if we have history
      if (systemPrompt) {
        history.unshift(
          {
            role: "user",
            parts: [{ text: systemPrompt }]
          },
          {
            role: "model",
            parts: [{ text: "I understand. I'm ready to assist with Dezy Clinic inquiries and will recognize booking, rescheduling, and cancellation intents, responding with appropriate JSON format when all required information is collected." }]
          }
        );
      }

      // Start chat with history (excluding the last user message)
      const chatHistory = history.slice(0, -1);
      const lastUserMessage = history[history.length - 1];

      const chat = model.startChat({
        history: chatHistory
      });

      // Send the latest message
      const result = await chat.sendMessage(lastUserMessage.parts[0].text);
      const response = await result.response;
      return response.text();
    } else {
      // First message - start fresh chat with system prompt
      const chat = model.startChat({
        history: systemPrompt ? [
          {
            role: "user",
            parts: [{ text: systemPrompt }]
          },
          {
            role: "model",
            parts: [{ text: "I understand. I'm ready to assist with Dezy Clinic inquiries and will recognize booking, rescheduling, and cancellation intents, responding with appropriate JSON format when all required information is collected." }]
          }
        ] : []
      });

      // Get the actual user message (should be the last non-system message)
      const userMessage = contextMessages.find(msg => msg.role === 'user');
      if (!userMessage) {
        throw new Error('No user message found in context');
      }

      const result = await chat.sendMessage(userMessage.content);
      const response = await result.response;
      return response.text();
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

/**
 * Alternative simpler approach - send all context as a single prompt
 * Use this if the above history approach has issues
 */
async function askGeminiSimple(contextMessages) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Build a single prompt with all context
    let fullPrompt = '';
    
    for (const msg of contextMessages) {
      if (msg.role === 'system') {
        fullPrompt += `SYSTEM: ${msg.content}\n\n`;
      } else if (msg.role === 'user') {
        fullPrompt += `USER: ${msg.content}\n\n`;
      } else if (msg.role === 'assistant') {
        fullPrompt += `ASSISTANT: ${msg.content}\n\n`;
      }
    }

    fullPrompt += `Please respond as the assistant based on the above conversation context:`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

export { askGemini, askGeminiSimple };