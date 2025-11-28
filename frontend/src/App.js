import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import MainView from './components/MainView';
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
          <h1><a href="/main">TeslaCam Viewer</a></h1>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route 
              path="/main"
              element={
                <PrivateRoute>
                  <MainView />
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
