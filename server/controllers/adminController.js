import Appointment from '../models/appointmentModel.js';
import CallLog from '../models/callLogModel.js'; // Optional

export const getStats = async (req, res) => {
  try {
    const totalAppointments = await Appointment.countDocuments();
    const totalCalls = await CallLog?.countDocuments?.() || 0;

    res.json({ totalAppointments, totalCalls });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};
