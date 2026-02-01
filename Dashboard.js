import React, { useContext, useEffect } from 'react';
import { UserContext } from './UserContext';

function Dashboard() {
  const { userName, isAuthenticated } = useContext(UserContext);

  useEffect(() => {
    console.log('Dashboard Mounted');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('userName:', userName);
  }, [userName, isAuthenticated]);

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome to the dashboard page!</p>
      {userName ? (
        <p>Logged in as: <strong>{userName}</strong></p>
      ) : (
        <p>No user information available</p>
      )}
      <hr />
      <div style={{ backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '5px' }}>
        <h3>Debug Info:</h3>
        <p>isAuthenticated: {String(isAuthenticated)}</p>
        <p>userName: {userName || 'undefined'}</p>
      </div>
    </div>
  );
}

export default Dashboard;