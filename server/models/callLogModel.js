import mongoose from 'mongoose';

const callLogSchema = new mongoose.Schema({
  userQuery: {
    type: String,
    required: true,
  },
  botResponse: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const CallLog = mongoose.model('CallLog', callLogSchema);

export default CallLog;
