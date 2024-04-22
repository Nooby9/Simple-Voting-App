import React, { useEffect, useState, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { useAuth0 } from "@auth0/auth0-react";
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

function VoteList() {
  const [rowData, setRowData] = useState([]);
  const { getAccessTokenSilently, isAuthenticated, isLoading } = useAuth0();

  const fetchCandidates = useCallback(async () => {
    if (isLoading || !isAuthenticated) {
      console.log("Waiting for authentication...");
      return;
    }
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/candidates`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setRowData(data);
    } catch (error) {
      console.error('Error fetching candidates:', error);
    }
  }, [isLoading, isAuthenticated]);

  const voteCandidate = useCallback(async (candidateId) => {
    try {
      const accessToken = await getAccessTokenSilently();
      const response = await fetch(`${process.env.REACT_APP_API_URL}/votes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ candidateId })
      });
      if (!response.ok) {
        const errorResponse = await response.text();
        throw new Error(errorResponse || 'Failed to vote');
      } else {
        alert('Vote successful!');
        fetchCandidates();
      }
    } catch (error) {
      alert(`Error voting: ${error.message}`);
    }
  }, [fetchCandidates, getAccessTokenSilently]);

  const [columnDefs] = useState([
    { headerName: "Name", field: "name", sortable: true, filter: true, resizable: false },
    { headerName: "Type", field: "candidateType", sortable: true, filter: true, resizable: false },
    { headerName: "Votes", field: "votesCount", sortable: true, filter: true, resizable: false },
    {
      headerName: "Vote",
      field: "id",
      cellRenderer: (params) => <button onClick={() => voteCandidate(params.value)}>Vote</button>, 
      resizable: false
    }
  ]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

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

export default VoteList;
