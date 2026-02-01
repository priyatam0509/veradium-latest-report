import React, { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from './UserContext';

function Callback() {
  const { setUserName, setIsAuthenticated } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    const extractAccessToken = (hash) => {
      const params = new URLSearchParams(hash.substring(1));
      return params.get('access_token');
    };

    const fetchUserInfo = async (accessToken) => {
      try {
        const response = await fetch('https://graph.microsoft.com/v1.0/me', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const data = await response.json();
        console.log('Full response data:', data);
        return data.userPrincipalName || data.displayName || 'User';
      } catch (error) {
        console.error('Error fetching user info:', error);
        return 'User';
      }
    };

    const processAuthentication = async () => {
      const hash = window.location.hash;
      console.log('Callback Hash:', hash);
      
      if (hash.includes('access_token')) {
        console.log('Access token found in callback hash');
        const accessToken = extractAccessToken(hash);
        console.log('Extracted Access Token:', accessToken);
        
        const user = await fetchUserInfo(accessToken);
        console.log('Fetched User Info:', user);
        
        setUserName(user);
        setIsAuthenticated(true);
        console.log('User authenticated and state set in Callback');
        
        // Clear the hash from URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Navigate to dashboard
        setTimeout(() => {
          navigate('/dashboard');
        }, 500);
      } else {
        console.log('No access token found in callback');
        navigate('/');
      }
    };

    processAuthentication();
  }, [navigate, setUserName, setIsAuthenticated]);

  return (
    <div>
      <h1>Processing Authentication...</h1>
      <p>Please wait while we complete your login.</p>
    </div>
  );
}

export default Callback;