import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const calendar = google.calendar('v3');

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, '../credentials/google-calendar.json'),
  scopes: ['https://www.googleapis.com/auth/calendar'],
});

export async function bookAppointment({ summary, dateTime, calendarId }) {
  const authClient = await auth.getClient();

  const event = {
    summary,
    start: { dateTime, timeZone: 'America/New_York' },
    end: {
      dateTime: new Date(new Date(dateTime).getTime() + 30 * 60 * 1000).toISOString(),
      timeZone: 'America/New_York',
    },
  };

  const response = await calendar.events.insert({
    auth: authClient,
    calendarId,
    requestBody: event,
  });

  return response.data;
}

export async function cancelAppointment({ calendarId, eventId }) {
  const authClient = await auth.getClient();

  await calendar.events.delete({
    auth: authClient,
    calendarId,
    eventId,
  });

  return true;
}

export async function listAppointments({ calendarId }) {
  const authClient = await auth.getClient();

  const res = await calendar.events.list({
    auth: authClient,
    calendarId,
    timeMin: new Date().toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  });

  return res.data.items;
}
