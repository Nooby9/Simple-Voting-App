import React, { useState, useEffect } from 'react';
import { useAuth0 } from "@auth0/auth0-react";
import '../style/createCandidate.css';

function CreateCandidate() {
  const [candidateName, setCandidateName] = useState('');
  const [candidateTypes, setCandidateTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [newType, setNewType] = useState('');
  const { getAccessTokenSilently } = useAuth0();

  useEffect(() => {
    async function fetchCandidateTypes() {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/candidate-types`);
        const data = await response.json();
        setCandidateTypes(data);
        setSelectedType('none');
        // if (data.length > 0) {
        //   setSelectedType(data[0].id); // Default to the first type
        // }
      } catch (error) {
        console.error('Error fetching candidate types:', error);
      }
    }

    fetchCandidateTypes();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    let typeId = selectedType;
    const accessToken = await getAccessTokenSilently();
    if (newType && selectedType === 'none') {
        try {
          const typeResponse = await fetch(`${process.env.REACT_APP_API_URL}/candidate-types`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`
            },
            body: JSON.stringify({ type: newType })
          });
          if (!typeResponse.ok) {
            if (typeResponse.status === 409) {
              const errorMessage = await typeResponse.text();
              alert(errorMessage);  
              return;  
            }
            throw new Error('Failed to create new type');
          }
          const newTypeData = await typeResponse.json();
          typeId = newTypeData.id;  
        } catch (error) {
          alert(`Error creating new type: ${error.message}`);
          return;
        }
    }
    try {
        const candidateResponse = await fetch(`${process.env.REACT_APP_API_URL}/candidates`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ name: candidateName, typeId })
        });
        if (!candidateResponse.ok) {
          throw new Error('Failed to create candidate');
        }
        alert('Candidate created successfully!');
        setCandidateName('');
        setNewType('');
        setSelectedType('');
      } catch (error) {
        alert(`Error: ${error.message}`);
      }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create a New Candidate</h2>
      <label>
        Candidate Name:
        <input type="text" value={candidateName} onChange={(e) => setCandidateName(e.target.value)} required />
      </label>
      <label>
        Choose a Candidate Type: (Choose "None" if you want to define a new type)
        <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
          <option value="none">None</option>
          {candidateTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.type}
            </option>
          ))}
        </select>
      </label>
      <label>
        Or Define a New Type:
        <input type="text" value={newType} onChange={(e) => setNewType(e.target.value)} disabled={selectedType !== 'none'} />
      </label>
      <button type="submit">Submit</button>
    </form>
  );
}

export default CreateCandidate;
