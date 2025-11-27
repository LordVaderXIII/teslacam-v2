import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import EventGallery from './components/EventGallery';
import VideoPlayer from './components/VideoPlayer';
import './App.css';

const PrivateRoute = ({ children }) => {
  const isAuthenticated = sessionStorage.getItem('isAuthenticated');
  return isAuthenticated ? children : <Navigate to="/" />;
};

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1><a href="/gallery">TeslaCam Viewer</a></h1>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route 
              path="/gallery" 
              element={
                <PrivateRoute>
                  <EventGallery />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/player/:eventId" 
              element={
                <PrivateRoute>
                  <VideoPlayer />
                </PrivateRoute>
              } 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
