import React, { useState, useEffect } from 'react';

const EventGallery = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      const credentials = sessionStorage.getItem('credentials');
      const response = await fetch('/api/events', {
        headers: {
          'Authorization': `Basic ${credentials}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      } else {
        console.error('Failed to fetch events');
      }
    };

    fetchEvents();
  }, []);

  return (
    <div>
      <h2>TeslaCam Events</h2>
      <div className="event-list">
        {events.map(event => (
          <div key={event.id} className="event-card">
            <a href={`/player/${event.id}`}>
              <h3>{event.timestamp}</h3>
              <p>{event.cameras.length} cameras</p>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventGallery;
