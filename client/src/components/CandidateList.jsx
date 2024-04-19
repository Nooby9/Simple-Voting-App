// Import necessary hooks
import React, { useEffect, useState, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react'; 
import 'ag-grid-community/styles/ag-grid.css'; 
import 'ag-grid-community/styles/ag-theme-alpine.css'; 

// Define the CandidateList component
function CandidateList() {
  const [rowData, setRowData] = useState([]);

  //`${process.env.REACT_APP_API_URL}/candidates`

  const [columnDefs] = useState([
    { headerName: "Name", field: "name", sortable: true, filter: true, resizable: false },
    { headerName: "Type", field: "candidateType", sortable: true, filter: true, resizable: false},
    { headerName: "Votes", field: "votesCount", sortable: true, filter: true, resizable: false}
  ]);

  useEffect(() => {
    const fetchCandidates = async () => {
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
    };

    fetchCandidates();
  }, []);

  
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

export default CandidateList;