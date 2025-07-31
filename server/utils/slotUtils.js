import { listAppointments } from '../services/calendarService.js';

const CLINIC_START_HOUR = 9;
const CLINIC_END_HOUR = 18;
const SLOT_DURATION_MINUTES = 30;

function generateDaySlots(date) {
  const slots = [];
  const start = new Date(date.setHours(CLINIC_START_HOUR, 0, 0, 0));
  const end = new Date(date.setHours(CLINIC_END_HOUR, 0, 0, 0));

  let current = new Date(start);
  while (current < end) {
    slots.push(new Date(current));
    current = new Date(current.getTime() + SLOT_DURATION_MINUTES * 60 * 1000);
  }

  return slots;
}

function filterOccupiedSlots(allSlots, bookedEvents) {
  const bookedTimes = bookedEvents.map(event => new Date(event.start.dateTime).toISOString());

  return allSlots.filter(slot => !bookedTimes.includes(slot.toISOString()));
}

export async function getAvailableSlots({ doctor, preferredDate, preferredTime }) {
  const calendarId = doctor.calendarId;
  const date = preferredDate ? new Date(preferredDate) : new Date();
  const bookedEvents = await listAppointments({ calendarId });
  // Generate all potential slots for the day
  const allSlots = generateDaySlots(date);
  // Filter out occupied ones
  const availableSlots = filterOccupiedSlots(allSlots, bookedEvents);

  // Apply preferredTime filtering if given
  const filtered = preferredTime
    ? availableSlots.filter(slot => {
        const hour = slot.getHours();
        const [preferredHour] = preferredTime.split(':').map(Number);
        return Math.abs(hour - preferredHour) <= 1; // Allow ±1 hour
      })
    : availableSlots;

  // Return next 3 slots
  return filtered.slice(0, 3);
}
