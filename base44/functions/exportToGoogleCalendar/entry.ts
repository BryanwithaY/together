import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Exports a ScheduledConnection to Google Calendar
 * Requires user to have authenticated their Google Calendar via OAuth
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { connectionId } = await req.json();

    if (!connectionId) {
      return Response.json({ error: 'connectionId required' }, { status: 400 });
    }

    // Fetch the connection
    const connection = await base44.entities.ScheduledConnection.get(connectionId);

    // TODO: When Google Calendar connector is authorized, use this to push event
    // For now, return the formatted event ready for manual export
    
    return Response.json({
      success: true,
      message: 'Ready for Google Calendar sync',
      event: {
        title: connection.title,
        start: connection.start_time,
        end: connection.end_time,
        description: connection.description,
        location: connection.location || '',
      },
      icsContent: generateICS(connection),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateICS(connection) {
  const start = new Date(connection.start_time);
  const end = new Date(connection.end_time);

  const formatDate = (date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Together//Connection Schedule//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${connection.id}@together.app
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(start)}
DTEND:${formatDate(end)}
SUMMARY:${connection.title}
DESCRIPTION:${connection.description.replace(/\n/g, '\\n')}
LOCATION:${connection.location || ''}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;
}