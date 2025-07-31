import Appointment from '../models/appointmentModel.js';
import ChatHistory from '../models/chatHistoryModel.js';

export const getStats = async (req, res) => {
  try {
    const totalAppointments = await Appointment.countDocuments({
  status: { $in: ["Scheduled", "Rescheduled"] }
});
    const totalCalls = await ChatHistory?.countDocuments?.() || 0;

    res.json({ totalAppointments, totalCalls });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};
