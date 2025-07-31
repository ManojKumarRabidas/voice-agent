// models/chatHistoryModel.js
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: { type: String, required: true, enum: ['user', 'assistant', 'system']},
  content: { type: String, required: true},
  timestamp: { type: Date, default: Date.now}
}, { _id: false });

const functionResultSchema = new mongoose.Schema({
  success: {type: Boolean, required: true},
  message: {type: String},
  error: {type: String},
  data: {type: mongoose.Schema.Types.Mixed}
}, { _id: false });

const chatHistorySchema = new mongoose.Schema({
  sessionId: {type: String, required: true, unique: true, index: true},
  messages: [messageSchema],
  lastFunctionResult: functionResultSchema,
  partialData: {type: mongoose.Schema.Types.Mixed, default: {}},
  createdAt: {type: Date, default: Date.now},
  updatedAt: {type: Date, default: Date.now}
});

// Index for cleanup operations
chatHistorySchema.index({ updatedAt: 1 });

// Update the updatedAt field on save
chatHistorySchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// TTL index for automatic cleanup 
chatHistorySchema.index({ updatedAt: 1 }, { expireAfterSeconds: 86400 }); // 24 hours
export default mongoose.model('ChatHistory', chatHistorySchema);