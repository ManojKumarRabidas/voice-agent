// utils/chatUtils.js
import ChatHistory from '../models/chatHistoryModel.js';

// Get conversation history for a session
export async function getConversationHistory(sessionId) {
  try {
    const chatHistory = await ChatHistory.findOne({ sessionId });
    return chatHistory;
  } catch (error) {
    console.error('Error fetching conversation history:', error);
    return null;
  }
}

// Clear conversation history for a session
export async function clearConversationHistory(sessionId) {
  try {
    const result = await ChatHistory.deleteOne({ sessionId });
    return result.deletedCount > 0;
  } catch (error) {
    console.error('Error clearing conversation history:', error);
    return false;
  }
}

// Get recent conversations (for admin/debugging)
export async function getRecentConversations(limit = 10) {
  try {
    const conversations = await ChatHistory.find({})
      .sort({ updatedAt: -1 })
      .limit(limit)
      .select('sessionId createdAt updatedAt messages');
    
    return conversations;
  } catch (error) {
    console.error('Error fetching recent conversations:', error);
    return [];
  }
}

// Update partial data for a session
export async function updatePartialData(sessionId, partialData) {
  try {
    const result = await ChatHistory.updateOne(
      { sessionId },
      { 
        $set: { partialData, updatedAt: new Date() }
      }
    );
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error updating partial data:', error);
    return false;
  }
}

// Get conversation statistics
export async function getConversationStats() {
  try {
    const stats = await ChatHistory.aggregate([
      {
        $group: {
          _id: null,
          totalConversations: { $sum: 1 },
          totalMessages: { $sum: { $size: '$messages' } },
          avgMessagesPerConversation: { $avg: { $size: '$messages' } }
        }
      }
    ]);
    
    return stats[0] || {
      totalConversations: 0,
      totalMessages: 0,
      avgMessagesPerConversation: 0
    };
  } catch (error) {
    console.error('Error getting conversation stats:', error);
    return null;
  }
}