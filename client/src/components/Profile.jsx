//`${process.env.REACT_APP_API_URL}/update-user`
import React, { useState, useEffect } from 'react';
import { useAuthToken } from "../AuthTokenContext";
import { useAuth0 } from "@auth0/auth0-react";

export default function Profile() {
  const { user, isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();
  const [userData, setUserData] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [newName, setNewName] = useState(user.name || '');

  // Handle name change submission
  const updateName = async () => {
    const accessToken = await getAccessTokenSilently();
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/update-user`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ name: newName })
      });

      if (!response.ok) {
        throw new Error('Failed to update name');
      }
      setUserData(prev => ({ ...prev, name: newName }));
      setEditMode(false); // Turn off edit mode after successful update
      alert('Name updated successfully!');
    } catch (error) {
      console.error('Error updating name:', error);
      alert('Failed to update name');
    }
  };

  useEffect(() => {
    if (isLoading) {
      console.log("Authentication is still loading...");
      return; 
    }

    if (!isAuthenticated) {
      console.log("User is not authenticated.");
      return; 
    }
    const fetchUserData = async () => {
      const accessToken = await getAccessTokenSilently();
      if (!accessToken) {
        console.log("Access token is loading.");
        return;
      }
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/me`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }
        const data = await response.json();
        setUserData(data);
        setNewName(data.name);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [isAuthenticated, isLoading]);

  return (
    <div>
      <div>
        {editMode ? (
          <>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              style={{ marginRight: '10px' }}
            />
            <button onClick={updateName}>Save</button>
            <button onClick={() => setEditMode(false)}>Cancel</button>
          </>
        ) : (
          <>
            <p>Name: {userData.name}</p>
            <button onClick={() => setEditMode(true)}>Edit Name</button>
          </>
        )}
      </div>
      <div>
        <img src={user.picture} width="70" alt="profile avatar" />
      </div>
      <div>
        <p>📧 Email: {user.email}</p>
      </div>
      <div>
        <p>🔑 Auth0Id: {user.sub}</p>
      </div>
      <div>
        <p>✅ Email verified: {user.email_verified?.toString()}</p>
      </div>
    </div>
  );
}
