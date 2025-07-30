
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const calendar = google.calendar('v3');

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, '../credentials/google-calendar.json'),
  scopes: ['https://www.googleapis.com/auth/calendar'],
});

export async function createGoogleEvent({
  summary,
  description = '',
  start,
  end,
  calendarId,
  eventId,
  update = false,
  cancel = false,
}) {
  const authClient = await auth.getClient();

  if (cancel) {
    if (!eventId) throw new Error('eventId is required for cancellation');
    await calendar.events.delete({
      auth: authClient,
      calendarId,
      eventId,
    });
    return true;
  }

  const event = {
    summary,
    description,
    start: { dateTime: new Date(start).toISOString(), timeZone: 'America/New_York' },
    end: { dateTime: new Date(end).toISOString(), timeZone: 'America/New_York' },
  };

  if (update) {
    if (!eventId) throw new Error('eventId is required for update');
    const response = await calendar.events.update({
      auth: authClient,
      calendarId,
      eventId,
      requestBody: event,
    });
    return response.data.id;
  }

  // Create new event
  const response = await calendar.events.insert({
    auth: authClient,
    calendarId,
    requestBody: event,
  });
  return response.data.id;
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
