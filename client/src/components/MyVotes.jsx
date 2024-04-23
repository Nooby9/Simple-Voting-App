import React, { useEffect, useState, useCallback  } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from 'react-router-dom';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import "../style/voteList.css";
import "../style/myVotes.css";

function MyVotesList() {
  const [rowData, setRowData] = useState([]);
  const [isSmallView, setIsSmallView] = useState(window.innerWidth < 768);
  const { isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsSmallView(window.innerWidth < 768);
    };
  
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const fetchCandidates = useCallback(async () => {
    const accessToken = await getAccessTokenSilently();
    if (!accessToken) {
      console.log("Access token is loading.");
      return;
    }
  
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
  }, [getAccessTokenSilently]);

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
      if (!response.ok) {
        const errorResponse = await response.text();
        throw new Error(errorResponse || 'Failed to unvote');
      }
      alert('Unvote successful!');
      fetchCandidates();
    } catch (error) {
      alert(`Error unvoting: ${error.message}`);
    }
  }, [getAccessTokenSilently, fetchCandidates]);

  const onRowClicked = useCallback((event) => {
    navigate(`/app/details/${event.data.id}`); 
  }, [navigate]);

  const unvoteButtonRenderer = (params) => {
    const handleClick = (e) => {
      e.stopPropagation(); 
      unvoteCandidate(params.value); 
    };
  
    return (
      <button className="unvote-button"
        ref={(ref) => {
          if (ref) ref.onclick = handleClick;
        }}
      >
        Unvote
      </button>
    );
  };

  const columnDefs = [
    { headerName: "Candidate", field: "candidateName", sortable: true, filter: true},
    { headerName: "Type", field: "candidateType", sortable: true, filter: true},
    { headerName: "Count", field: "votesCount", sortable: true, filter: true},
    {
      headerName: "Unvote",
      field: "id",
      cellRenderer: unvoteButtonRenderer,
      cellRendererParams: {
        onClick: (event) => {
          event.stopPropagation();
        }
      }
    },
    {
      headerName: "Details",
      field: "id",
      cellRenderer: (params) => <button className="details-button" onClick={() => onRowClicked(params)}>Details</button>
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

    fetchCandidates();
  }, [isLoading, isAuthenticated]); 

  const autoSizeStrategy = isSmallView ? null : { type: 'fitGridWidth' };

  return (
    <div className="vote-list">
      <h2>My Votes</h2>
      <div className="ag-theme-alpine">
        <AgGridReact
          columnDefs={columnDefs}
          rowData={rowData}
          domLayout='autoHeight'
          animateRows={true}
          autoSizeStrategy={autoSizeStrategy}
          onRowClicked={onRowClicked}
        />
      </div>
    </div>
  );
}

export default MyVotesList;
