import { askGemini } from '../services/geminiService.js';
import { handleAppointmentIntent } from '../services/appointmentService.js';

function extractJsonFromResponse(str) {
  try {
    // First, try to parse as direct JSON
    const directJson = JSON.parse(str);
    return typeof directJson === 'object' && directJson !== null ? directJson : null;
  } catch (e) {
    // If direct parsing fails, look for JSON in markdown code blocks
    const jsonMatch = str.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const extractedJson = JSON.parse(jsonMatch[1].trim());
        return typeof extractedJson === 'object' && extractedJson !== null ? extractedJson : null;
      } catch (parseError) {
        console.error('Error parsing extracted JSON:', parseError);
        return null;
      }
    }
    
    // Also try to find JSON without markdown blocks (between { and })
    const jsonObjectMatch = str.match(/\{[\s\S]*\}/);
    if (jsonObjectMatch) {
      try {
        const extractedJson = JSON.parse(jsonObjectMatch[0]);
        return typeof extractedJson === 'object' && extractedJson !== null ? extractedJson : null;
      } catch (parseError) {
        console.error('Error parsing JSON object:', parseError);
        return null;
      }
    }
    
    return null;
  }
}

export async function processMessage(req, res) {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  try {
    const aiReply = await askGemini(message);
    console.log("aiReply", aiReply);

    // Try to extract JSON from the response
    const extractedJson = extractJsonFromResponse(aiReply);
    
    if (extractedJson && extractedJson.intent) {
      console.log("Extracted JSON:", extractedJson);
      const reply = await handleAppointmentIntent(extractedJson);
      return res.json({ reply });
    }

    // If no JSON found or no intent, return the original reply
    res.json({ reply: aiReply });
  } catch (error) {
    console.error('Chat error:', error.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
}