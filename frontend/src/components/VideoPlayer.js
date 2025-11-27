import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import ReactSlider from 'react-slider';
import './VideoPlayer.css'; // We'll create this CSS file for styling

const VideoPlayer = () => {
    const { eventId } = useParams();
    const [event, setEvent] = useState(null);
    const [mainCamera, setMainCamera] = useState('front');
    const [duration, setDuration] = useState(0);
    const [clipRange, setClipRange] = useState([0, 60]); // Default to 60 seconds
    const [selectedCameras, setSelectedCameras] = useState({});
    const [isExporting, setIsExporting] = useState(false);
    
    const mainVideoRef = useRef(null);
    const credentials = sessionStorage.getItem('credentials');

    useEffect(() => {
        const fetchEventDetails = async () => {
            const response = await fetch('/api/events', {
                headers: { 'Authorization': `Basic ${credentials}` }
            });
            if (response.ok) {
                const events = await response.json();
                const currentEvent = events.find(e => e.id === eventId);
                if (currentEvent) {
                    setEvent(currentEvent);
                    const initialSelected = currentEvent.cameras.reduce((acc, cam) => {
                        acc[cam] = true; // Select all cameras by default
                        return acc;
                    }, {});
                    setSelectedCameras(initialSelected);
                    if (!currentEvent.cameras.includes('front')) {
                        setMainCamera(currentEvent.cameras[0]);
                    }
                }
            }
        };
        fetchEventDetails();
    }, [eventId, credentials]);

    const handleLoadedMetadata = () => {
        if (mainVideoRef.current) {
            const videoDuration = mainVideoRef.current.duration;
            setDuration(videoDuration);
            setClipRange([0, videoDuration]);
        }
    };

    const handleCameraSelection = (camera) => {
        setSelectedCameras(prev => ({ ...prev, [camera]: !prev[camera] }));
    };

    const handleExport = async () => {
        setIsExporting(true);
        const camerasToExport = Object.keys(selectedCameras).filter(cam => selectedCameras[cam]);
        
        const exportData = {
            eventId,
            startTime: clipRange[0],
            endTime: clipRange[1],
            cameras: camerasToExport,
            mainCamera: mainCamera,
        };

        try {
            const response = await fetch('/api/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${credentials}`
                },
                body: JSON.stringify(exportData)
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `${eventId}_export.mp4`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            } else {
                alert('Export failed. Please check the server logs.');
            }
        } catch (error) {
            console.error('Export error:', error);
            alert('An error occurred during export.');
        } finally {
            setIsExporting(false);
        }
    };
    
    if (!event) return <div>Loading event...</div>;

    const secondaryCameras = event.cameras.filter(cam => cam !== mainCamera);

    return (
        <div className="video-player-container">
            <div className="main-video">
                <h2>{mainCamera.replace(/_/g, ' ')}</h2>
                <video 
                    ref={mainVideoRef}
                    src={`/api/video/${eventId}/${mainCamera}`} 
                    controls 
                    autoPlay 
                    muted 
                    width="100%"
                    onLoadedMetadata={handleLoadedMetadata}
                />
            </div>
            <div className="thumbnail-gallery">
                {secondaryCameras.map(camera => (
                    <div key={camera} className="thumbnail" onClick={() => setMainCamera(camera)}>
                        <video src={`/api/video/${eventId}/${camera}`} muted loop onMouseOver={e => e.target.play()} onMouseOut={e => e.target.pause()} width="100%" />
                        <p>{camera.replace(/_/g, ' ')}</p>
                    </div>
                ))}
            </div>

            <div className="export-controls">
                <h3>Export Clip</h3>
                <div className="camera-selection">
                    <h4>Select Cameras to Export:</h4>
                    {event.cameras.map(camera => (
                        <label key={camera}>
                            <input
                                type="checkbox"
                                checked={selectedCameras[camera] || false}
                                onChange={() => handleCameraSelection(camera)}
                            />
                            {camera.replace(/_/g, ' ')}
                        </label>
                    ))}
                </div>
                <div className="timeline-slider">
                    <p>Clip Range: {clipRange[0].toFixed(1)}s - {clipRange[1].toFixed(1)}s</p>
                    <ReactSlider
                        className="horizontal-slider"
                        thumbClassName="thumb"
                        trackClassName="track"
                        min={0}
                        max={duration}
                        value={clipRange}
                        onChange={setClipRange}
                        ariaLabel={['Lower thumb', 'Upper thumb']}
                        pearling
                        minDistance={1}
                    />
                </div>
                <button onClick={handleExport} disabled={isExporting}>
                    {isExporting ? 'Exporting...' : 'Export Video'}
                </button>
            </div>
        </div>
    );
};

export default VideoPlayer;
