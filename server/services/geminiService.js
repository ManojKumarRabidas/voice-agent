import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not defined in environment variables');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const systemPrompt = `
You are an AI assistant for Dezy Clinic.

- Recognize booking intents and output a JSON like:
  {
    "intent": "book",
    "treatment": "Facelift",
    "dateTime": "2025-08-01T15:00:00Z",
    "name": "John Doe",
    "age": 30,
    "phone": "1234567890"
  }

- Recognize reschedule or cancel intents too, in same format with "intent": "reschedule" or "cancel".

- Respond politely for unrelated questions or missing information.

  When rescheduling or cancelling, always include "eventId" if possible. Example:
  {
  "intent": "cancel",
  "doctorId": "jason",
  "eventId": "abc123"
  }
`;

async function askGemini(message) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    // Start a chat session with system prompt
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
        {
          role: "model",
          parts: [{ text: "I understand. I'm ready to assist with Dezy Clinic inquiries and will recognize booking, rescheduling, and cancellation intents, responding with appropriate JSON format." }],
        },
      ],
    });

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