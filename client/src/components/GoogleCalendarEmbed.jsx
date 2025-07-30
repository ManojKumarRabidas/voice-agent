const GoogleCalendarEmbed = ({ calendarId }) => {
  const embedUrl = `https://calendar.google.com/calendar/embed?src=${calendarId}&ctz=America%2FNew_York`;
  
  return (
    <iframe
      src={embedUrl}
      style={{ border: 0 }}
      width="100%"
      height="600"
      frameBorder="0"
      scrolling="no"
    />
  );
};

export default GoogleCalendarEmbed;
