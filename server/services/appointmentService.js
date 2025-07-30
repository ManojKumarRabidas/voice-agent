import Appointment from '../models/appointmentModel.js';
import { createGoogleEvent } from './calendarService.js';
import { getAvailableSlots } from '../utils/slotUtils.js';
import dotenv from 'dotenv';
dotenv.config();

const CALENDAR_IDS = {
  'jason': process.env.JASON_CALENDAR_ID,
  'elizabeth': process.env.ELIZABETH_CALENDAR_ID,
};

export async function handleAppointmentIntent(data) {
  try {
    console.log("data", data)
    if (!data || !data.intent) {
      return 'Invalid data or intent missing';
    }
  const {
    intent,
    treatment,
    dateTime,
    name,
    age,
    phone,
    doctorId,
    eventId,
  } = data;

  const doctor = doctorId || 'jason';
  const calendarId = CALENDAR_IDS[doctor];
  console.log("calendarId", calendarId)
  console.log("doctorId", doctorId)
  console.log("doctor", doctor)

  if (!intent) throw new Error('Intent missing from Gemini response');

  switch (intent) {
    case 'book': {
      const appointmentDateTime = new Date(dateTime);
      const endTime = new Date(appointmentDateTime.getTime() + 30 * 60 * 1000);

      const googleEventId = await createGoogleEvent({
        summary: `${treatment} Appointment for ${name}`,
        start: appointmentDateTime,
        end: endTime,
        calendarId,
      });

      const userDoc = await Appointment.create({
        patientName: name,
        patientAge: age,
        patientPhone: phone,
        doctor,
        treatment,
        appointmentDateTime,
        status: 'Scheduled',
        eventId: googleEventId,
      });
      console.log("userDoc", userDoc)
      return `Appointment booked with Dr. ${doctor} on ${appointmentDateTime.toLocaleString()}`;
    }

    case 'reschedule': {
      if (!eventId) throw new Error('eventId is required to reschedule');

      const newDateTime = new Date(dateTime);
      const newEndTime = new Date(newDateTime.getTime() + 30 * 60 * 1000);

      await createGoogleEvent({
        summary: `Rescheduled Appointment for ${name}`,
        start: newDateTime,
        end: newEndTime,
        calendarId,
        eventId,
        update: true,
      });

      await Appointment.findOneAndUpdate(
        { eventId },
        {
          appointmentDateTime: newDateTime,
          status: 'Rescheduled',
        }
      );

      return `Appointment rescheduled to ${newDateTime.toLocaleString()}`;
    }

    case 'cancel': {
      if (!eventId) throw new Error('eventId is required to cancel');

      await createGoogleEvent({
        calendarId,
        eventId,
        cancel: true,
      });

      await Appointment.findOneAndUpdate(
        { eventId },
        {
          status: 'Cancelled',
        }
      );

      return `Appointment cancelled successfully.`;
    }

    default:
      return `Sorry, I couldn't understand your request.`;
  }
} catch(err){
    console.error('Error handling appointment intent:', err.message);
    return `An error occurred while processing your request: ${err.message}`;
  }
}


export async function fetchAvailableSlots({ doctor, preferredDate, preferredTime }) {
  try {
    const calendarId = CALENDAR_IDS[doctor];
    const slots = await getAvailableSlots({ doctor: { calendarId }, preferredDate, preferredTime });
    return slots.map(slot => slot.toLocaleString());
  } catch (error) {
    console.error('Error fetching available slots:', error);
    throw error;
  }
}
