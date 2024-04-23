import React, { useState, useEffect } from 'react';
import { useAuth0 } from "@auth0/auth0-react";
import '../style/profile.css';

export default function Profile() {
  const { user, isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();
  const [userData, setUserData] = useState({});
  const [totalVotes, setTotalVotes] = useState(0);  
  const [editMode, setEditMode] = useState(false);
  const [newName, setNewName] = useState(user.name || '');

  // Fetch user data and total votes
  const fetchData = async () => {
    const accessToken = await getAccessTokenSilently();
    try {
      const responses = await Promise.all([
        fetch(`${process.env.REACT_APP_API_URL}/me`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }),
        fetch(`${process.env.REACT_APP_API_URL}/my-votes/count`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })
      ]);

      const userData = await responses[0].json();
      const votesData = await responses[1].json();

      if (!responses[0].ok) throw new Error('Failed to fetch user data');
      if (!responses[1].ok) throw new Error('Failed to fetch vote count');

      setUserData(userData);
      setNewName(userData.name);
      setTotalVotes(votesData.totalVotes);  
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };


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
      setEditMode(false); 
      alert('Name updated successfully!');
    } catch (error) {
      console.error('Error updating name:', error);
      alert('Failed to update name');
    }
  };

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, isLoading, getAccessTokenSilently]);

  return (
    <div className="profile-container">
      <div className={editMode ? "profile-edit" : "profile-details"}>
        {editMode ? (
          <>
            <img src={user.picture} alt="Profile" />
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
            <p>Email: {user.email}</p>
            <p>Total Number of Votes Currently: {totalVotes}</p>
            <button className="save-button" onClick={updateName}>Save</button>
            <button className="cancel-button" onClick={() => setEditMode(false)}>Cancel</button>
          </>
        ) : (
          <>
            <img src={user.picture} alt="Profile" />
            <p>Name: {userData.name}</p>
            <p>Email: {user.email}</p>
            <p>Total Number of Votes Currently: {totalVotes}</p>
            <button onClick={() => setEditMode(true)}>Edit Name</button>
          </>
        )}
      </div>
    </div>
  );
}
