import React, { useEffect, useState, useCallback  } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { useAuthToken } from "../AuthTokenContext";
import { useAuth0 } from "@auth0/auth0-react";
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

function MyVotesList() {
  const [rowData, setRowData] = useState([]);
  const { isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();

  const unvoteCandidate = useCallback(async (voteId) => {
    try {
      const accessToken = await getAccessTokenSilently();
      const response = await fetch(`${process.env.REACT_APP_API_URL}/votes/${voteId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        }
      });
    } catch (error) {
      alert(`Error voting: ${error.message}`);
    }
  }, [getAccessTokenSilently]);

  const columnDefs = [
    { headerName: "Voter Name", field: "userName", sortable: true, filter: true, resizable: false},
    { headerName: "Candidate Name", field: "candidateName", sortable: true, filter: true, resizable: false },
    { headerName: "Candidate Type", field: "candidateType", sortable: true, filter: true, resizable: false },
    { headerName: "Candidate Total Votes", field: "votesCount", sortable: true, filter: true, resizable: false},
    {
      headerName: "Unvote",
      field: "id",
      cellRenderer: (params) => <button onClick={() => unvoteCandidate(params.value)}>Unvote</button>, 
      resizable: false
    }
  ];

  useEffect(() => {
    if (isLoading) {
      console.log("Authentication is still loading...");
      return; 
    }

    if (!isAuthenticated) {
      console.log("User is not authenticated.");
      return; 
    }

    const fetchCandidates = async () => {
      const accessToken = await getAccessTokenSilently();
      if (!accessToken) {
        console.log("Access token is loading.");
        return;
      }

      //console.log(`Fetching data with access token: ${accessToken}`);
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/my-votes`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setRowData(data);
      } catch (error) {
        console.error('Error fetching candidates:', error);
      }
    };

    fetchCandidates();
  }, [isLoading, isAuthenticated]); 

  const autoSizeStrategy = {
    type: 'fitGridWidth'
  };

  return (
    <div className="ag-theme-alpine" style={{ height: 400, width: '60%' }}>
      <AgGridReact
        columnDefs={columnDefs}
        rowData={rowData}
        domLayout='autoHeight'
        animateRows={true}
        autoSizeStrategy={autoSizeStrategy}
      />
    </div>
  );
}

export default MyVotesList;
