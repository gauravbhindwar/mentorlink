'use client';
import { useState, useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';

const columns = [
  { 
    field: 'serialNumber',    
    headerName: 'S.No',
    width: 60,  // Reduced width
    renderCell: (params) => params.row?.serialNumber || '',
    sortable: false,
    headerAlign: 'center',
    align: 'center',
  },
  { 
    field: 'MUJid', 
    headerName: 'MUJ ID', 
    width: 120,  // Adjusted width
    renderCell: (params) => params.row?.MUJid || '',
    headerAlign: 'center',
    align: 'center',
  },
  { 
    field: 'name', 
    headerName: 'Name', 
    width: 160,  // Adjusted width
    renderCell: (params) => params.row?.name || '',
    headerAlign: 'center',
    align: 'center',
  },
  { 
    field: 'email', 
    headerName: 'Email', 
    width: 200,  // Adjusted width
    renderCell: (params) => params.row?.email || '',
    headerAlign: 'center',
    align: 'center',
  },
  { 
    field: 'department', 
    headerName: 'Department', 
    width: 130,  // Adjusted width
    renderCell: (params) => params.row?.department || '',
    headerAlign: 'center',
    align: 'center',
  },
  { 
    field: 'phone_number', 
    headerName: 'Phone', 
    width: 120,  // Adjusted width
    renderCell: (params) => params.row?.phone_number || '',
    headerAlign: 'center',
    align: 'center',
  },
  { 
    field: 'mentee_count', 
    headerName: 'Mentees', 
    width: 80,   // Adjusted width
    renderCell: (params) => params.row?.mentees?.length || 0,
    headerAlign: 'center',
    align: 'center',
  },
].map(col => ({
  ...col,
  flex: 0,  // Prevent column expansion
  minWidth: col.width,  // Set minimum width
  maxWidth: col.width,  // Set maximum width to prevent expansion
}));

const ArchiveResults = ({ searchParams }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchArchiveData = async () => {
      if (!searchParams?.academicYear || !searchParams?.academicSession) return;
      
      setLoading(true);
      setError('');
      
      try {
        const response = await axios.get('/api/archive/getMentors', {
          params: searchParams
        });
        
        if (response.data && Array.isArray(response.data)) {
          const processedData = response.data.map((item, index) => ({
            id: `mentor-${index + 1}`,
            serialNumber: index + 1,
            MUJid: item.MUJid || '',
            name: item.name || '',
            email: item.email || '',
            department: item.department || '',
            phone_number: item.phone_number || '',
            mentees: item.mentees || []
          }));
          setData(processedData);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching archive data');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchArchiveData();
  }, [searchParams]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress sx={{ color: '#f97316' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" align="center" sx={{ p: 3 }}>
        {error}
      </Typography>
    );
  }

  return (
    <Box sx={{
      height: '100%',
      backgroundColor: '#1a1a1a',
      borderRadius: '24px',
      border: '1px solid rgba(249, 115, 22, 0.2)',
      p: 3,
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
    }}>
      <Box sx={{
        p: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(249, 115, 22, 0.2)',
        background: 'linear-gradient(to right, rgba(249, 115, 22, 0.1), rgba(249, 115, 22, 0.05))',
        borderRadius: '16px',
        mb: 2,
      }}>
        <Typography sx={{ 
          color: '#f97316',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          fontSize: '1.1rem',
        }}>
          <span className="material-icons" style={{ fontSize: '1.3rem' }}>Archive Results</span>
        </Typography>
        <Typography sx={{ 
          color: '#f97316',
          fontSize: '0.9rem',
          fontWeight: 500,
          padding: '4px 12px',
          borderRadius: '8px',
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
        }}>
          Total Records: {data.length}
        </Typography>
      </Box>

      <Box sx={{ 
        flexGrow: 1,
        '& .MuiDataGrid-root': {
          backgroundColor: '#1a1a1a',  // Darker background
          borderColor: 'rgba(249, 115, 22, 0.2)',
          color: 'white',
          // width: 'fit-content',  // Prevent extra space
          margin: '0 auto',  // Center the table
        },
        '& .MuiDataGrid-columnHeaders': {
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          borderBottom: '2px solid rgba(249, 115, 22, 0.2)',
          '& .MuiDataGrid-columnHeader': {
            color: '#f97316',
            fontWeight: 600,
            flexGrow: 1
          }
        },
        '& .MuiDataGrid-cell': {
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        },
        '& .MuiDataGrid-row': {
          '&:hover': {
            backgroundColor: 'rgba(249, 115, 22, 0.05)',
            cursor: 'pointer',
          }
        },
        // ...existing styles
      }}>
        <DataGrid
          rows={data}
          columns={columns}
          pageSize={5}
          rowsPerPageOptions={[5]}
          disableSelectionOnClick
          autoHeight
          getRowId={(row) => row.id}
          loading={loading}
          initialState={{
            pagination: {
              pageSize: 5,
            },
            sorting: {
              sortModel: [{ field: 'serialNumber', sort: 'asc' }],
            },
          }}
          components={{
            NoRowsOverlay: () => (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100%' 
              }}>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  {error || 'No mentors found'}
                </Typography>
              </Box>
            ),
            LoadingOverlay: () => (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100%' 
              }}>
                <CircularProgress sx={{ color: '#f97316' }} />
              </Box>
            ),
          }}
          componentsProps={{
            cell: {
              sx: {
                // Add safe checks for cell content
                '& .MuiDataGrid-cellContent': {
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }
              }
            }
          }}
          sx={{
            border: 'none',
            '& .MuiDataGrid-footerContainer': {
              borderTop: '1px solid rgba(249, 115, 22, 0.2)',
              backgroundColor: 'rgba(249, 115, 22, 0.05)',
            },
            '& .MuiTablePagination-root': {
              color: 'white',
            },
            '& .MuiIconButton-root': {
              color: '#f97316',
            }
          }}
        />
      </Box>
    </Box>
  );
};

export default ArchiveResults;
