import React, { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from './UserContext';
import './App.css';

function App() {
  const { userName, isAuthenticated } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    const authenticate = () => {
      const params = new URLSearchParams({
        client_id: '3e8799c9-f60e-4bbd-8313-a91688c3d44d',
        response_type: 'token',
        redirect_uri: 'http://localhost:3000/auth/callback',
        scope: 'openid profile',
      });

      window.location.href = `https://login.microsoftonline.com/c42f44e3-dca8-43ac-bfd0-9f2bbdce6c7a/oauth2/v2.0/authorize?${params.toString()}`;
    };

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      authenticate();
    }
  }, [isAuthenticated]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to the Dashboard</h1>
        {isAuthenticated ? (
          <>
            <p>You are logged in!</p>
            <p>Welcome, {userName}</p>
          </>
        ) : (
          <p>Redirecting to login...</p>
        )}
      </header>
    </div>
  );
}

export default App;
