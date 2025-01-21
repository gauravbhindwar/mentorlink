'use client';
import { useState, useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';

const columns = [
    { 
        field: 'serialNumber',    
        headerName: 'S.No',
        flex: 0.7,
        headerClassName: 'super-app-theme--header',
        headerAlign: 'center',
        align: 'center',
    },
    { 
        field: 'MUJid', 
        headerName: 'MUJ ID', 
        flex: 1,
        headerClassName: 'super-app-theme--header',
        headerAlign: 'center',
        align: 'center',
    },
    { 
        field: 'name', 
        headerName: 'Name', 
        flex: 1.2,
        headerClassName: 'super-app-theme--header',
        headerAlign: 'center',
        align: 'center',
    },
    { 
        field: 'email', 
        headerName: 'Email', 
        flex: 1.5,
        headerClassName: 'super-app-theme--header',
        headerAlign: 'center',
        align: 'center',
    },
    { 
        field: 'phone_number', 
        headerName: 'Phone', 
        flex: 1,
        headerClassName: 'super-app-theme--header',
        headerAlign: 'center',
        align: 'center',
    },
    { 
        field: 'mentee_count', 
        headerName: 'Mentees', 
        flex: 0.8,
        headerClassName: 'super-app-theme--header',
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => params.row?.mentees?.length || 0,
    },
];

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

  return (
    <div className="archive-results-container">
        <Box sx={{ 
            height: '100%',
            minHeight: '400px',
            overflowX: 'auto',
            backgroundColor: 'transparent'
        }}>
            {loading ? (
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    height: '400px',
                    flexDirection: 'column',
                    gap: 2
                }}>
                    <CircularProgress sx={{ color: '#f97316' }} />
                    <Typography sx={{ color: 'white', opacity: 0.7 }}>
                        Loading archive data...
                    </Typography>
                </Box>
            ) : data.length > 0 ? (
                <DataGrid
                    rows={data}
                    columns={columns}
                    getRowId={(row) => row.id}
                    disableRowSelectionOnClick
                    disableColumnMenu={true}
                    pageSizeOptions={[5, 10, 25]}
                    initialState={{
                        pagination: { paginationModel: { pageSize: 10 } },
                    }}
                    sx={{
                        height: '100%',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: 'white',
                        '& .MuiDataGrid-cell': {
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                        },
                        '& .MuiDataGrid-columnHeaders': {
                            backgroundColor: '#1a1a1a',
                            borderBottom: '2px solid rgba(249, 115, 22, 0.2)',
                        },
                        '& .MuiDataGrid-columnHeader': {
                            color: '#f97316',
                            fontWeight: 600,
                            fontSize: '0.95rem',
                            backgroundColor: '#1a1a1a',
                            '&:focus': {
                                outline: 'none',
                            },
                            '&:focus-within': {
                                outline: 'none',
                            },
                        },
                        '& .MuiDataGrid-iconButtonContainer': {
                            visibility: 'visible',
                            width: 'auto',
                            padding: '4px',
                        },
                        '& .MuiDataGrid-sortIcon': {
                            color: '#f97316',
                            opacity: 1,
                        },
                        '& .MuiDataGrid-columnHeaderDraggableContainer': {
                            width: '100%',
                        },
                        '& .MuiDataGrid-columnHeaderTitleContainer': {
                            padding: '0 8px',
                        },
                        '& .MuiDataGrid-columnSeparator': {
                            color: 'rgba(249, 115, 22, 0.2)',
                        },
                        '& .MuiDataGrid-footerContainer': {
                            backgroundColor: 'rgba(0, 0, 0, 0.2)',
                            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                            minHeight: '56px',
                            padding: '8px 0',
                        },
                        '& .MuiDataGrid-row': {
                            backgroundColor: 'inherit',
                        },
                        '& .MuiDataGrid-menuIcon': {
                            color: 'white',
                        },
                        '& .MuiDataGrid-pagination': {
                            color: 'white',
                        },
                        '& .MuiTablePagination-root': {
                            color: 'white',
                        },
                        '& .MuiTablePagination-select': {
                            color: 'white',
                        },
                        '& .MuiTablePagination-selectIcon': {
                            color: 'white',
                        },
                        '& .MuiIconButton-root': {
                            color: 'white',
                        },
                    }}
                />
            ) : (
                <Box sx={{ 
                    p: 4, 
                    textAlign: 'center', 
                    color: 'white',
                    backdropFilter: 'blur(8px)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '1rem',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                    <Typography variant="h6" sx={{ mb: 2, color: '#f97316' }}>
                        No Archive Data Found
                    </Typography>
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        {error || 'Try selecting a different academic year or session'}
                    </Typography>
                </Box>
            )}
        </Box>

        <style jsx>{`
            .archive-results-container {
                height: 100%;
                border-radius: 24px;
                border: 1px solid rgba(249, 115, 22, 0.2);
                padding: 24px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
                background: rgba(26, 26, 26, 0.6);
                backdrop-filter: blur(10px);
            }
        `}</style>
    </div>
  );
};

export default ArchiveResults;
