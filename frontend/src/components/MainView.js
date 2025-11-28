import React, { useState, useEffect, useRef } from 'react';
import Calendar from './Calendar';
import EventList from './EventList';
import './MainView.css';

const MainView = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [mainCamera, setMainCamera] = useState('front');

  const mainVideoRef = useRef(null);

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
        if (data.length > 0) {
          setSelectedEvent(data[0]);
        }
      } else {
        console.error('Failed to fetch events');
      }
    };

    fetchEvents();
  }, []);

  if (!selectedEvent) {
    return <div>Loading...</div>;
  }

  const secondaryCameras = selectedEvent.cameras.filter(cam => cam !== mainCamera);

  return (
    <div className="main-view">
      <div className="video-player-container">
        <div className="main-video">
          <h2>{mainCamera.replace(/_/g, ' ')}</h2>
          <video
            ref={mainVideoRef}
            src={`/api/video/${selectedEvent.id}/${mainCamera}`}
            controls
            autoPlay
            muted
            width="100%"
          />
        </div>
        <div className="thumbnail-gallery">
          {secondaryCameras.map(camera => (
            <div key={camera} className="thumbnail" onClick={() => setMainCamera(camera)}>
              <video src={`/api/video/${selectedEvent.id}/${camera}`} muted loop onMouseOver={e => e.target.play()} onMouseOut={e => e.target.pause()} width="100%" />
              <p>{camera.replace(/_/g, ' ')}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="sidebar">
        <Calendar selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
        <EventList events={events} selectedDate={selectedDate} onEventSelect={setSelectedEvent} />
      </div>
    </div>
  );
};

export default MainView;
