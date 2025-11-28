import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    // --- Real Authentication ---
    // We make a test API call with the user's credentials.
    // If it succeeds (status 200-299), we are authenticated.
    // If it fails (status 401), the credentials are bad.
    const credentials = btoa(`${username}:${password}`);
    try {
      const response = await fetch('/api/events', {
        headers: {
          'Authorization': `Basic ${credentials}`
        }
      });

      if (response.ok) {
        // Credentials are valid, store them and proceed
        sessionStorage.setItem('isAuthenticated', 'true');
        sessionStorage.setItem('credentials', credentials);
        navigate('/main');
      } else if (response.status === 401) {
        setError('Invalid username or password.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } catch (error) {
      setError('Could not connect to the server. Please check your connection.');
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <div>
          <label htmlFor="username">Username:</label>
          <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
