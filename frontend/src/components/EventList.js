import React from 'react';

const EventList = ({ events, selectedDate, onEventSelect }) => {
  const filteredEvents = events.filter(event => {
    const eventDate = new Date(event.timestamp.split(' ')[0]);
    return eventDate.toDateString() === selectedDate.toDateString();
  });

  return (
    <div className="event-list">
      <h3>Events for {selectedDate.toDateString()}</h3>
      {filteredEvents.length > 0 ? (
        <ul>
          {filteredEvents.map(event => (
            <li key={event.id} onClick={() => onEventSelect(event)}>
              {event.timestamp}
            </li>
          ))}
        </ul>
      ) : (
        <p>No events for this date.</p>
      )}
    </div>
  );
};

export default EventList;
