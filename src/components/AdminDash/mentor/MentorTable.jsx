'use client';
import { DataGrid } from '@mui/x-data-grid';
import { Button, IconButton, Box } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import React, { useEffect, useState, useMemo } from 'react';

const MentorTable = ({ mentors, onEditClick, onDeleteClick, isSmallScreen, currentFilters = {} }) => {
  const [processedMentors, setProcessedMentors] = useState([]);

  const processData = useMemo(() => {
    if (!mentors || !Array.isArray(mentors)) return [];
    
    const processed = mentors.flatMap(mentor => {
      const matchingRecords = mentor.academicRecords?.filter(record => {
        if (!currentFilters?.academicYear) return true;
        return record.academicYear === currentFilters.academicYear;
      }) || [];

      return matchingRecords.flatMap(record => {
        const matchingSessions = record.sessions?.filter(session => {
          if (!currentFilters?.sessionName) return true;
          return session.sessionName === currentFilters.sessionName;
        }) || [];

        return matchingSessions.flatMap(session => {
          return (session.mentorInfo || []).map((info, index) => ({
            id: `${info.MUJid || index}-${Date.now()}`,
            MUJid: info.MUJid || '',
            name: info.name || '',
            email: info.email || '',
            phone_number: info.phone_number || '',
            role: Array.isArray(info.role) ? info.role : ['mentor'],
            academicYear: record.academicYear || '',
            academicSession: `${session.sessionName} ${record.academicYear?.split('-')[0] || ''}`,
          }));
        });
      });
    });

    return processed;
  }, [mentors, currentFilters.academicYear, currentFilters.sessionName]);

  useEffect(() => {
    if (processData.length > 0) {
      sessionStorage.setItem('mentors', JSON.stringify(processData));
      setProcessedMentors(processData);
    } else {
      const storedMentors = sessionStorage.getItem('mentors');
      if (storedMentors) {
        try {
          const parsed = JSON.parse(storedMentors);
          setProcessedMentors(parsed);
        } catch (error) {
          console.error('Error parsing stored mentors:', error);
          setProcessedMentors([]);
        }
      }
    }
  }, [processData]);

  console.log('Processed Mentors:', processedMentors); // Debug log

  const columns = [
    { 
      field: 'serialNumber',    
      headerName: 'S.No',
      width: 70,
      renderCell: (params) => {
        const index = processedMentors.findIndex(mentor => mentor.MUJid === params.row.MUJid);
        return index + 1;
      },
      sortable: false,
    },
    { field: 'MUJid', headerName: 'MUJid', width: 150 },
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'email', headerName: 'Email', width: 250 },
    { field: 'phone_number', headerName: 'Phone', width: 150 },
    { field: 'academicYear', headerName: 'Academic Year', width: 150 },
    { field: 'academicSession', headerName: 'Session', width: 200 },
    { field: 'role', headerName: 'Role', width: 150,
      renderCell: (params) => params.row.role.join(', ')
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => onEditClick(params.row)}
            sx={{ 
              borderRadius: '12px', 
              fontSize: { xs: '0.8rem', sm: '0.9rem' }, 
              textTransform: 'capitalize',
              margin: 'auto',
              color: '#f97316',
              borderColor: '#f97316',
              '&:hover': {
                borderColor: '#ea580c',
                backgroundColor: 'rgba(249, 115, 22, 0.1)'
              }
            }}
          >
            Edit
          </Button>
          <IconButton
            onClick={() => onDeleteClick(params.row.MUJid)}
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ].map(col => ({
    ...col,
    headerAlign: 'center',
    align: 'center',
    flex: 1,
    minWidth: col.minWidth || 150,
  }));

  return (
    <div style={{ 
      width: '100%', 
      padding: '0 16px', 
      marginBottom: '16px',
      position: 'relative',
      zIndex: 1 // Lower z-index for table
    }}>
      <div style={{ height: '600px', width: '100%' }}>
        <DataGrid
          rows={processedMentors}
          columns={columns}
          getRowId={(row) => row.id}
          autoHeight
          sx={{
            border: 'none',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            position: 'relative',
            zIndex: 1,
            '& .MuiDataGrid-main': {
              border: 'none',
              overflow: 'unset',
              paddingRight: '16px',
            },
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '16px',
              fontSize: '0.95rem',
              color: 'rgba(255, 255, 255, 0.9)',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '60px !important',
              maxHeight: 'unset !important',
              whiteSpace: 'normal',
              lineHeight: '1.5',
              '&:focus': {
                outline: 'none',
              },
              zIndex: 1
            },
            '& .MuiDataGrid-row': {
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                transform: 'translateY(-1px)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
              },
              minHeight: '60px !important',
              maxHeight: 'unset !important',
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: '#f97316',
              color: '#1e293b',
              borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
              borderTop: '2px solid rgba(255, 255, 255, 0.1)',
              fontSize: '1rem',
              fontWeight: 600,
              padding: '8px',
              paddingRight: '16px',
              minHeight: '60px !important',
              maxHeight: 'unset !important',
              zIndex: 1
            },
            '& .MuiDataGrid-columnHeader': {
              '&:focus': {
                outline: 'none',
              },
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 700,
              color: '#f97316',
            },
            // ...existing DataGrid styles from MenteeTable...
            '& .MuiDataGrid-footerContainer': {
              borderTop: '2px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              padding: '8px 16px',
            },
            '& .MuiTablePagination-root': {
              color: 'rgba(255, 255, 255, 0.7)',
            },
            '& .MuiDataGrid-virtualScroller': {
              backgroundColor: 'transparent',
              '&::-webkit-scrollbar': {
                width: '12px',
                height: '12px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                margin: '6px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(249, 115, 22, 0.5)',
                borderRadius: '6px',
                border: '3px solid rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  background: 'rgba(249, 115, 22, 0.7)',
                },
              },
            },
            '& .MuiButtonBase-root': {
              color: '#f97316',
            },
            '& .MuiDataGrid-menuIcon': {
              display: 'block',
              color: '#f97316',
              '& .MuiSvgIcon-root': {
                color: '#f97316',
              },
              '&:hover': {
                backgroundColor: 'rgba(249, 115, 22, 0.1)',
              },
            },
            '& .MuiDataGrid-sortIcon': {
              color: '#f97316',
            },
            '& .MuiDataGrid-panel': {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              '& .MuiButtonBase-root': {
                color: 'rgba(255, 255, 255, 0.9)',
              },
            },
            '& .MuiDataGrid-toolbarContainer': {
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              padding: '8px 16px',
            },
            '& .MuiMenuItem-root': {
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(249, 115, 22, 0.1)',
              },
            },
            '& .MuiDataGrid-menuList': {
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
            },
          }}
          disableSelectionOnClick
          disableColumnMenu={false}
          disableColumnFilter={false}
          loading={!processedMentors.length}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10, page: 0 },
            },
          }}
          pageSizeOptions={[5, 10, 25, 50]}
          getRowHeight={() => 'auto'}
          headerHeight={60}
        />
      </div>
    </div>
  );
};

export default MentorTable;