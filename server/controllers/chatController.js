import { askGemini } from '../services/geminiService.js';
import { handleAppointmentIntent } from '../services/appointmentService.js';

export async function processMessage(req, res) {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  try {
    const aiReply = await askGemini(message);
    console.log("aiReply", aiReply)

    // Example parsing: you can tune this via Gemini output prompt later
    if (aiReply.includes('intent:book')) {
      const parsed = JSON.parse(aiReply.match(/{.*}/)?.[0]); // extract structured info
      const reply = await handleAppointmentIntent(parsed);
      return res.json({ reply });
    }

    res.json({ reply: aiReply });
  } catch (error) {
    console.error('Chat error:', error.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
}
