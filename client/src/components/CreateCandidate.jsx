import React, { useState, useEffect } from 'react';
import { useAuth0 } from "@auth0/auth0-react";
import '../style/createCandidate.css';

function CreateCandidate() {
  const [candidateName, setCandidateName] = useState('');
  const [candidateTypes, setCandidateTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [newType, setNewType] = useState('');
  const { getAccessTokenSilently } = useAuth0();


  const fetchCandidateTypes = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/candidate-types`);
      const data = await response.json();
      setCandidateTypes(data);
      setSelectedType(data.length > 0 ? data[0].id : 'none');
    } catch (error) {
      console.error('Error fetching candidate types:', error);
    }
  };

  useEffect(() => {
    fetchCandidateTypes();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    let typeId = selectedType === 'none' ? undefined : selectedType;
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
          const errorMessage = await typeResponse.text();
          alert(errorMessage);  
          return;  
        }
        const newTypeData = await typeResponse.json();
        typeId = newTypeData.id;
        await fetchCandidateTypes(); 
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
      setSelectedType('none'); 
      await fetchCandidateTypes(); 
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
        <input type="text" value={newType} disabled={selectedType !== 'none'} onChange={(e) => setNewType(e.target.value)} />
      </label>
      <button type="submit">Submit</button>
    </form>
  );
}

export default CreateCandidate;
