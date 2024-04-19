// Import necessary hooks
import React, { useEffect, useState } from 'react';
import { AgGridReact } from 'ag-grid-react'; 
import 'ag-grid-community/styles/ag-grid.css'; 
import 'ag-grid-community/styles/ag-theme-alpine.css'; 

// Define the CandidateList component
function CandidateList() {
  const [rowData, setRowData] = useState([]);

  //`${process.env.REACT_APP_API_URL}/candidates`

  const [columnDefs] = useState([
    { headerName: "Name", field: "name", sortable: true, filter: true },
    { headerName: "Type", field: "candidateType", sortable: true, filter: true },
    { headerName: "Votes", field: "votesCount", sortable: true, filter: true }
  ]);

  useEffect(() => {
    // Fetch candidates from the API using fetch
    const fetchCandidates = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/candidates`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            setRowData(data); // Set the fetched data as row data for Ag-Grid
        } catch (error) {
            console.error('Error fetching candidates:', error);
        }
    };

    fetchCandidates();
  }, []);


  return (
    <div className="ag-theme-alpine" style={{ height: 400, width: '100%' }}>
        <AgGridReact
            columnDefs={columnDefs}
            rowData={rowData}
            domLayout='autoHeight' // Automatically adjust grid height based on number of rows
            animateRows={true} // Enable row animations
        />
    </div>
  );
}

export default CandidateList;
