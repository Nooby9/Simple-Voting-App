// Import necessary hooks
import React, { useEffect, useState } from 'react';

// Define the CandidateList component
function CandidateList() {
  const [candidates, setCandidates] = useState([]); 

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/candidates`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();  // Parse JSON data from the response
        setCandidates(data);  // Update state with fetched data
      } catch (error) {
        console.error('Error fetching candidates:', error);
      }
    };

    fetchCandidates();
  }, []);  // Empty dependency array means this effect runs only once after the initial render

  return (
    <div>
      <h1>Candidates</h1>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Votes</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map(candidate => (
            <tr key={candidate.id}>
              <td>{candidate.name}</td>
              <td>{candidate.candidateType}</td>
              <td>{candidate.votesCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CandidateList;
