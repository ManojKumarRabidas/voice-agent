
// import { google } from 'googleapis';
// import path from 'path';
// import { fileURLToPath } from 'url';

// const __dirname = path.dirname(fileURLToPath(import.meta.url));
// const calendar = google.calendar('v3');

// const auth = new google.auth.GoogleAuth({
//   keyFile: path.join(__dirname, '../credentials/google-calendar.json'),
//   scopes: ['https://www.googleapis.com/auth/calendar'],
// });

// export async function createGoogleEvent({
//   summary,
//   description = '',
//   start,
//   end,
//   calendarId,
//   eventId,
//   update = false,
//   cancel = false,
// }) {
//   const authClient = await auth.getClient();

//   if (cancel) {
//     if (!eventId) throw new Error('eventId is required for cancellation');
//     await calendar.events.delete({
//       auth: authClient,
//       calendarId,
//       eventId,
//     });
//     return true;
//   }

//   const event = {
//     summary,
//     description,
//     start: { dateTime: new Date(start).toISOString(), timeZone: 'America/New_York' },
//     end: { dateTime: new Date(end).toISOString(), timeZone: 'America/New_York' },
//   };

//   if (update) {
//     if (!eventId) throw new Error('eventId is required for update');
//     const response = await calendar.events.update({
//       auth: authClient,
//       calendarId,
//       eventId,
//       requestBody: event,
//     });
//     return response.data.id;
//   }

//   // Create new event
//   const response = await calendar.events.insert({
//     auth: authClient,
//     calendarId,
//     requestBody: event,
//   });
//   return response.data.id;
// }

import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const calendar = google.calendar('v3');

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, '../credentials/google-calendar.json'),
  scopes: ['https://www.googleapis.com/auth/calendar'],
});

async function checkTimeConflicts(authClient, calendarId, startTime, endTime, excludeEventId = null) {
  try {
    // Add buffer time to check for conflicts (e.g., 1 minute before and after)
    const bufferMinutes = 1;
    const searchStart = new Date(startTime.getTime() - (bufferMinutes * 60 * 1000));
    const searchEnd = new Date(endTime.getTime() + (bufferMinutes * 60 * 1000));

    const response = await calendar.events.list({
      auth: authClient,
      calendarId,
      timeMin: searchStart.toISOString(),
      timeMax: searchEnd.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 100, 
    });

    const events = response.data.items || [];
    
    // Filter out cancelled events and the event being updated
    const activeEvents = events.filter(event => 
      event.status !== 'cancelled' && 
      event.id !== excludeEventId &&
      event.start && event.end &&
      (event.start.dateTime || event.start.date) &&
      (event.end.dateTime || event.end.date)
    );

    // Check for overlaps
    const conflicts = [];
    
    for (const event of activeEvents) {
      const eventStart = new Date(event.start.dateTime || event.start.date);
      const eventEnd = new Date(event.end.dateTime || event.end.date);
      
      // Check if times overlap
      // Two events overlap if: start1 < end2 && start2 < end1
      const isOverlapping = startTime < eventEnd && eventStart < endTime;
      
      if (isOverlapping) {
        conflicts.push({
          id: event.id,
          summary: event.summary || 'Untitled Event',
          start: eventStart,
          end: eventEnd,
          description: event.description || ''
        });
      }
    }

    return {hasConflicts: conflicts.length > 0, conflicts, totalEventsChecked: activeEvents.length};
  } catch (error) {
    console.error('Error checking time conflicts:', error);
    throw new Error(`Failed to check calendar conflicts: ${error.message}`);
  }
}


function validateEventParams({ summary, start, end, calendarId }) {
  const errors = [];

  if (!summary || typeof summary !== 'string' || summary.trim().length === 0) {errors.push('Summary is required and must be a non-empty string')}
  if (!calendarId || typeof calendarId !== 'string' || calendarId.trim().length === 0) {errors.push('Calendar ID is required and must be a non-empty string')}
  if (!start) {errors.push('Start time is required')}
  if (!end) {errors.push('End time is required')}
  let startDate, endDate;
  try {
    startDate = new Date(start);
    if (isNaN(startDate.getTime())) {errors.push('Start time must be a valid date')}
  } 
  catch (error) {errors.push('Start time must be a valid date')}

  try {
    endDate = new Date(end);
    if (isNaN(endDate.getTime())) {errors.push('End time must be a valid date')}
  } 
  catch (error) {errors.push('End time must be a valid date');}

  if (startDate && endDate && startDate >= endDate) {errors.push('End time must be after start time')}

  // Check if the event is in the past (with 5-minute grace period)
  const now = new Date();
  const graceTime = new Date(now.getTime() - (5 * 60 * 1000)); // 5 minutes ago
  if (startDate && startDate < graceTime) {errors.push('Cannot create events in the past')}

  // Check if event duration is reasonable (not more than 24 hours)
  if (startDate && endDate) {
    const durationHours = (endDate - startDate) / (1000 * 60 * 60);
    if (durationHours > 24) {
      errors.push('Event duration cannot exceed 24 hours');
    }
    if (durationHours < 0.25) { // 15 minutes minimum
      errors.push('Event duration must be at least 15 minutes');
    }
  }

  return {isValid: errors.length === 0, errors, startDate, endDate};
}


export async function createGoogleEvent({summary, description = '', start, end, calendarId, eventId, update = false, cancel = false}) {
  let authClient;

  try {
    authClient = await auth.getClient();
  } catch (error) {
    console.error('Authentication failed:', error);
    return {status: false, msg: 'Failed to authenticate with Google Calendar API'};
  }

  // Handle cancellation
  if (cancel) {
    if (!eventId) {return {status: false, msg: 'Event ID is required for cancellation'}}

    try {
      // Check if event exists before attempting to delete
      await calendar.events.get({ auth: authClient, calendarId, eventId});
      await calendar.events.delete({ auth: authClient, calendarId, eventId});
      return { status: true, eventId, msg: 'Event cancelled successfully'};
    } catch (error) {
      console.error('Error cancelling event:', error);
      if (error.code === 404) {return {status: false, msg: 'Event not found or already deleted'};}
      return {status: false, msg: `Failed to cancel event: ${error.message}`};
    }
  }

  const validation = validateEventParams({ summary, start, end, calendarId });
  if (!validation.isValid) { return {status: false, msg: `Validation failed: ${validation.errors.join(', ')}`}}
  const { startDate, endDate } = validation;
  try {
    // Check for time conflicts
    const conflictCheck = await checkTimeConflicts(authClient, calendarId, startDate, endDate, update ? eventId : null);

    if (conflictCheck.hasConflicts) {
      // const conflictDetails = conflictCheck.conflicts.map(conflict => 
      //   `"${conflict.summary}" (${conflict.start.toLocaleString()} - ${conflict.end.toLocaleString()})`
      // ).join(', ');
      return {status: false, msg: 'Slot already booked. Please choose another time.'};
    }

    // Prepare event object
    const event = {
      summary: summary.trim(),
      description: description.trim(),
      start: {dateTime: startDate.toISOString(), timeZone: 'America/New_York'},
      end: {dateTime: endDate.toISOString(), timeZone: 'America/New_York'},
      status: 'confirmed',
      transparency: 'opaque', // Marks time as busy
      visibility: 'default'
    };

    let response;

    if (update) {
      if (!eventId) {return { status: false, msg: 'Event ID is required for update'}}
      try {await calendar.events.get({auth: authClient, calendarId, eventId})} 
      catch (error) {
        if (error.code === 404) {return {status: false, msg: 'Event not found for update'}}
        return {status: false, msg: `Failed to check event for update: ${error.message}`};
      }
      response = await calendar.events.update({auth: authClient, calendarId, eventId, requestBody: event});
      return {status: true, eventId: response.data.id};

    } else {
      response = await calendar.events.insert({auth: authClient, calendarId, requestBody: event});
      return {status: true, eventId: response.data.id};
    }

  } catch (error) {
    console.error('Google Calendar API error:', error);
    if (error.code === 403) { return {status: false, msg: 'Access denied. Check calendar permissions.'}}
    if (error.code === 404) { return {status: false, msg: 'Calendar not found'}}
    if (error.code === 409) {return {status: false, msg: 'Conflict with existing event'}}
    return {status: false, msg: `Operation failed: ${error.message || 'Unknown error occurred'}`};
  }
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
