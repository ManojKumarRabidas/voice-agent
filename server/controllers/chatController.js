import { askGemini } from '../services/geminiService.js';
import { fetchAvailableSlots, handleAppointment } from '../services/appointmentService.js';
import ChatHistory from '../models/chatHistoryModel.js';
import {doctors} from '../data/doctors.js';

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

const systemPrompt = `
You are a helpful AI assistant for Dezy Clinic with conversation memory and function result awareness.

🎯 Your job is to understand the user's intent and assist with the following actions:
- Book appointment
- Reschedule appointment  
- Cancel appointment
- Query available appointment slots
- Small talk or unrelated queries (respond politely, do NOT return JSON)

🧠 Your main responsibility is to:
1. Understand the user's intent based on conversation history
2. Be aware of previous function call results and handle errors appropriately
3. Collect ALL required information step-by-step through a friendly conversation
4. ONLY return a final JSON when ALL required fields are provided by the user
5. Handle function errors gracefully and guide users to provide corrections

🚫 Do NOT return partial or incomplete JSON.
✅ Wait until the user provides all the required fields before returning JSON.
✅ Remember previous conversation context and function results.
✅ If a function returned an error, help the user correct the issue without starting over.

If ask for list of doctor provide this list:
${doctors.map(doc => `- ${doc.name} (${doc.treatments.join(', ')})`).join('\n')}
Only take booking of the treatments which are available in the list of doctors.

---

🔄 Function Result Handling:
When a previous function call failed, you will receive the error in your conversation context. Handle these scenarios:
- Time slot not available: Ask for alternative date/time while keeping other details
- Doctor not available: Suggest alternative doctors or times
- Invalid phone/data: Ask for correction while maintaining conversation context
- Booking conflicts: Help reschedule without losing progress

---

🧾 Required JSON Formats:

1. Booking:
Return only when you have all of the following:
- intent
- treatment  
- dateTime
- name
- age
- phone
- doctorId

Example:
{
  "intent": "book",
  "treatment": "Facelift",
  "doctorId": "jason", 
  "dateTime": "2025-08-01T15:00:00Z",
  "name": "John Doe",
  "age": 30,
  "phone": "1234567890"
}

2. Cancel:
Return only when you have:
- intent
- eventId (REQUIRED)

Example:
{
  "intent": "cancel",
  "eventId": "ABC1234567"
}

3. Reschedule:
Return only when you have:
- intent
- eventId (REQUIRED) 
- new dateTime

Example:
{
  "intent": "reschedule",
  "eventId": "ABC1234567",
  "dateTime": "2025-08-05T12:30:00Z"
}

4. Query available appointment slots:
Return only when you have:
- intent
- doctorId (REQUIRED) 
- preferredDate (REQUIRED) 
- preferredTime (REQUIRED)

Example:
{
  "intent": "query-appointments",
  "doctorId": "jason", 
  "preferredDate": "2025-08-05T12:30:00Z",
  "preferredTime": "10:30 PM"
}

---

✅ Do:
- Use conversation history to maintain context
- Handle function errors by guiding users to corrections
- Use polite prompts to collect missing info
- Validate all required data is present before generating JSON
- Return ONLY the JSON object when all required information is collected
- Remember partial information across messages until completed

🚫 Do NOT:
- Return partial JSON
- Assume values that were not explicitly provided by the user
- Forget previous conversation context
- Start over when handling function errors
- Invent treatments, doctors, or values not known

Example conversation flow:
User: "I want to book an appointment"
Assistant: Collects info step by step...
User: Provides all details
Assistant: Returns JSON
Function: Returns error "Time not available"
Assistant: "That time slot isn't available. Could you please choose a different date/time? I still have your other details (name, treatment, etc.)"
User: Provides new time
Assistant: Returns JSON with corrected time, keeping other details
`;

// Enhanced processMessage function with database persistence and function awareness
export async function processMessage(req, res) {
  const { message, sessionId } = req.body; // sessionId to track conversations
  
  if (!message) return res.status(400).json({ error: 'Message is required' });
  if (!sessionId) return res.status(400).json({ error: 'Session ID is required' });

  try {
    // Get or create conversation from database
    let chatHistory = await ChatHistory.findOne({ sessionId });
    
    if (!chatHistory) {
      chatHistory = await ChatHistory.create({
        sessionId,
        messages: [],
        lastFunctionResult: null,
        partialData: {},
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Add user message to conversation
    const userMessage = {role: 'user', content: message, timestamp: new Date()};
    
    chatHistory.messages.push(userMessage);

    // Prepare context for AI including conversation history and last function result
    const contextMessages = [
      { role: 'system', content: systemPrompt },
      ...chatHistory.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    // Add function result context if exists
    if (chatHistory.lastFunctionResult) {
      const resultContext = chatHistory.lastFunctionResult.success 
        ? `Previous function call succeeded: ${JSON.stringify(chatHistory.lastFunctionResult.data)}`
        : `Previous function call failed with error: ${chatHistory.lastFunctionResult.error}. Help the user correct this while maintaining conversation context.`;
      
      contextMessages.push({ role: 'system', content: resultContext});
    }

    // Get AI response with full context
    const aiReply = await askGemini(contextMessages);
    console.log("aiReply with context:", aiReply);

    // Add AI response to conversation
    const assistantMessage = {role: 'assistant', content: aiReply, timestamp: new Date()};
    
    chatHistory.messages.push(assistantMessage);
    const extractedJson = extractJsonFromResponse(aiReply);
    
    if (extractedJson && extractedJson.intent) {
      let functionResult;
      if(extractedJson.intent == 'query-appointments') {
        functionResult = await fetchAvailableSlots ({ doctorId: extractedJson.doctorId, preferredDate: extractedJson.preferredDate, preferredTime: extractedJson.preferredTime })
      } else{
        functionResult = await handleAppointment(extractedJson);
      }
      chatHistory.lastFunctionResult = functionResult;
      if (functionResult.success) {
        // Clear partial data on success and reset function result
        chatHistory.partialData = {};
        chatHistory.lastFunctionResult = null;
        
        // Update conversation in database
        chatHistory.updatedAt = new Date();
        await chatHistory.save();
        
        return res.json({ reply: functionResult.message || "Great! Your request has been processed successfully.", success: true, data: functionResult.data});
      } else {
        // Function failed - update database and let AI handle the error in next response
        chatHistory.updatedAt = new Date();
        await chatHistory.save();
        
        return res.json({ reply: `I apologize, but there was an issue: ${functionResult.error}. Please provide the correct information and I'll help you complete your request.`, success: false, needsCorrection: true});
      }
    }

    // Update conversation in database
    chatHistory.updatedAt = new Date();
    await chatHistory.save();

    // If no JSON found or no intent, return the original reply
    res.json({ reply: aiReply });
    
  } catch (error) {
    console.error('Chat error:', error.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
}



// Database cleanup function (call periodically)
export async function cleanupConversationMemory() {
  try {
    const maxAge = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    // Delete conversations older than maxAge
    const result = await ChatHistory.deleteMany({updatedAt: { $lt: maxAge }});
    
    console.log(`Cleaned up ${result.deletedCount} old conversations`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning up conversations:', error);
    throw error;
  }
}

// Optional: Set up periodic cleanup (if using cron jobs, you can remove this)
setInterval(cleanupConversationMemory, 60 * 60 * 1000); // Clean every hour