import {
  bookAppointment,
  cancelAppointment,
  listAppointments,
} from './calendarService.js'

// Map doctor identifiers to their respective Google Calendar IDs
const calendarIds = {
  jason: '03d2d5cd12415b08357ec9293d7fb5f6acfd37e79c12a8a6d1071e4fcc52654d@group.calendar.google.com',
  elizabeth: '916fa54fc623e06e876d138ec7edb2be7861f3bc1813e57893fc905f446136f7@group.calendar.google.com',
}

// Core handler function
export async function handleAppointmentIntent(parsed) {
  const { intent, doctorId, dateTime, name, age, phone, eventId } = parsed
  const calendarId = calendarIds[doctorId]

  if (!calendarId) {
    return "Invalid doctor ID. Please choose between 'jason' or 'elizabeth'."
  }

  switch (intent) {
    case 'book':
      if (!name || !age || !phone || !dateTime) {
        return 'Missing required booking information.'
      }

      const event = await bookAppointment({
        summary: `Appointment for ${name}, Age ${age}, Phone ${phone}`,
        dateTime,
        calendarId,
      })

      return `✅ Appointment booked successfully for ${name} at ${dateTime}. Ref: ${event.id}`

    case 'cancel':
      if (!eventId) return 'Missing event ID to cancel.'
      await cancelAppointment({ calendarId, eventId })
      return `🗑️ Appointment cancelled successfully.`

    case 'reschedule':
      if (!eventId || !dateTime) return 'Missing data to reschedule.'
      await cancelAppointment({ calendarId, eventId })
      const newEvent = await bookAppointment({
        summary: `Rescheduled: ${name}, Age ${age}, Phone ${phone}`,
        dateTime,
        calendarId,
      })
      return `📅 Appointment rescheduled. Ref: ${newEvent.id}`

    case 'list':
      const events = await listAppointments({ calendarId })
      return events

    default:
      return '❌ Invalid appointment action.'
  }
}
