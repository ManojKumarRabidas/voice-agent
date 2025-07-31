import Appointment from '../models/appointmentModel.js';
import { createGoogleEvent } from './calendarService.js';
import { getAvailableSlots } from '../utils/slotUtils.js';
import dotenv from 'dotenv';
dotenv.config();

const CALENDAR_IDS = {
  'jason': process.env.JASON_CALENDAR_ID,
  'elizabeth': process.env.ELIZABETH_CALENDAR_ID,
};

export async function fetchAvailableSlots(data) {
  try {
    const { doctorId, preferredDate, preferredTime } = data;
    if (!doctorId || !preferredDate || !preferredTime) {return { success: false, error: 'Missing parameters: doctor, preferredDate, and preferredTime are required. '}}
    const doctor = doctorId || 'jason';
    const calendarId = CALENDAR_IDS[doctor];
    const slots = await getAvailableSlots({ doctor: { calendarId }, preferredDate, preferredTime });
    // return slots.map(slot => slot.toLocaleString());
    return { success: true, message: `Available slots for Dr. ${doctor} on ${preferredDate.toLocaleString()} are ${slots.map(slot => slot.toLocaleString())}.`, data: null};
  } catch (error) {
    return { success: false, error: error.message , massege: "Error fetching available slots"};
  }
}

// Function router to handle different intents
export async function handleAppointment(extractedJson) {
  try {
    if (!extractedJson || !extractedJson.intent) {return { success: false, error: 'Invalid data or intent missing'}}
    const {intent, treatment, dateTime, name, age, phone, doctorId, eventId} = extractedJson;
    const doctor = doctorId || 'jason';
    const calendarId = CALENDAR_IDS[doctor];
    switch (intent) {
      case 'book':
        const appointmentDateTime = new Date(dateTime);
        const endTime = new Date(appointmentDateTime.getTime() + 30 * 60 * 1000);
        const googleEventId = await createGoogleEvent({summary: `${treatment} Appointment for ${name}`, start: appointmentDateTime, end: endTime, calendarId});
        const userDoc = await Appointment.create({patientName: name, patientAge: age, patientPhone: phone, doctor, treatment, appointmentDateTime, status: 'Scheduled', eventId: googleEventId});
       
        console.log("googleEventId", googleEventId);
        console.log("userDoc", userDoc);
        return { success: true, message: `Appointment booked with Dr. ${doctor} on ${appointmentDateTime.toLocaleString()}, and the event ID is ${googleEventId}.`, data: googleEventId};
      
      case 'cancel':
        if (!eventId) throw new Error('eventId is required to cancel');
        await createGoogleEvent({calendarId, eventId, cancel: true});
        await Appointment.findOneAndUpdate({eventId},{status: 'Cancelled'});
        return { success: true, message: `Appointment ${eventId} cancelled successfully`, data: null};

      case 'reschedule':
        if (!eventId) throw new Error('eventId is required to reschedule');
        const newDateTime = new Date(dateTime);
        const newEndTime = new Date(newDateTime.getTime() + 30 * 60 * 1000);
        await createGoogleEvent({summary: `Rescheduled Appointment for ${name}`, start: newDateTime, end: newEndTime, calendarId, eventId, update: true});
        await Appointment.findOneAndUpdate({eventId},{appointmentDateTime: newDateTime, status: 'Rescheduled'});
        return { success: true, message: `Appointment ${eventId} rescheduled successfully to ${newDateTime.toLocaleString()}`, data: null};
      
      default:
        return { success: false, error: 'Invalid data or intent missing'};
    }
  } catch (error) {console.log(error); return { success: false, error: error.message}}
}

