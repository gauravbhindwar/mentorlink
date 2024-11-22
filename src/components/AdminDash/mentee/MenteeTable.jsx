'use client';
import { DataGrid } from '@mui/x-data-grid';
import { Button, Box, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress } from '@mui/material'; // Add Box, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress import
import { useMemo, useState } from 'react';

// Update the component props to include onDeleteClick and onDataUpdate
const MenteeTable = ({ mentees, onEditClick, onDeleteClick, isSmallScreen, onDataUpdate }) => {
  const [deleteDialog, setDeleteDialog] = useState({ open: false, mujid: null });
  const [loading, setLoading] = useState(false);

  // Add this function to handle delete click
  const handleDeleteClick = (mujid) => {
    setDeleteDialog({ open: true, mujid });
  };

  // Update handleConfirmDelete to include loading state
  const handleConfirmDelete = async () => {
    if (deleteDialog.mujid) {
      setLoading(true);
      try {
        await onDeleteClick([deleteDialog.mujid]);
        // Update local data
        if (onDataUpdate) {
          onDataUpdate(prevMentees => 
            prevMentees.filter(m => m.MUJid !== deleteDialog.mujid)
          );
        }
      } finally {
        setLoading(false);
        setDeleteDialog({ open: false, mujid: null });
      }
    }
  };

  // Debug logs
  console.log('Raw mentees received:', mentees);

  // Try to get data from session storage if no mentees provided
  const effectiveMentees = useMemo(() => {
    if ((!mentees || mentees.length === 0) && typeof window !== 'undefined') {
      try {
        const storedData = sessionStorage.getItem('menteeData');
        return storedData ? JSON.parse(storedData) : [];
      } catch (error) {
        console.error('Error parsing stored data:', error);
        return [];
      }
    }
    return mentees;
  }, [mentees]);

  // New function to check which columns have data
  const getColumnsWithData = (data) => {
    if (!Array.isArray(data) || data.length === 0) return [];
    
    const columnsWithData = new Set();
    data.forEach(mentee => {
      Object.entries(mentee).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          columnsWithData.add(key);
        }
      });
    });
    return Array.from(columnsWithData);
  };

  // Guard clause for invalid/empty data
  if (!Array.isArray(effectiveMentees) || effectiveMentees.length === 0) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        height: '200px',
        color: 'rgba(255, 255, 255, 0.5)'
      }}>
        No data available
      </Box>
    );
  }

  // Process mentees data
  const processedMentees = effectiveMentees.map((mentee, index) => ({
    id: mentee._id || mentee.id || `temp-${index}`, // Ensure unique ID
    MUJid: (mentee.MUJid || mentee.mujid || '').toUpperCase(),
    name: mentee.name || '',
    email: mentee.email || '',
    phone: mentee.phone || '',
    address: mentee.address || '',
    yearOfRegistration: mentee.yearOfRegistration || '',
    section: mentee.section || '',
    semester: mentee.semester || '',
    academicYear: mentee.academicYear || '',
    academicSession: mentee.academicSession || '',
    fatherName: mentee.parents?.father?.name || '',
    fatherEmail: mentee.parents?.father?.email || '',
    fatherPhone: mentee.parents?.father?.phone || '',
    fatherAlternatePhone: mentee.parents?.father?.alternatePhone || '',
    motherName: mentee.parents?.mother?.name || '',
    motherEmail: mentee.parents?.mother?.email || '',
    motherPhone: mentee.parents?.mother?.phone || '',
    motherAlternatePhone: mentee.parents?.mother?.alternatePhone || '',
    guardianName: mentee.parents?.guardian?.name || '',
    guardianEmail: mentee.parents?.guardian?.email || '',
    guardianPhone: mentee.parents?.guardian?.phone || '',
    guardianRelation: mentee.parents?.guardian?.relation || '',
    mentorMujid: (mentee.mentorMujid || mentee.mentor_mujid || '').toUpperCase(),
  }));

  // Get list of columns that have data
  const columnsWithData = getColumnsWithData(processedMentees);

  // Filter the columns array to only include columns with data
  const baseColumns = [
    {
      field: 'serialNumber',
      headerName: 'S.No',
      width: 70,
      renderCell: (params) => {
        const index = processedMentees.findIndex(m => m.id === params.row.id);
        return index + 1;
      },
      sortable: false,
    },
    { field: 'MUJid', headerName: 'MUJid', width: 150 },
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'email', headerName: 'Email', width: 250 },
    { field: 'phone', headerName: 'Phone', width: 150 },
    { field: 'address', headerName: 'Address', width: 250 },
    { field: 'yearOfRegistration', headerName: 'Year of Registration', width: 180 },
    { field: 'section', headerName: 'Section', width: 100 },
    { field: 'semester', headerName: 'Semester', width: 100 },
    { field: 'academicYear', headerName: 'Academic Year', width: 150 },
    { field: 'academicSession', headerName: 'Academic Session', width: 150 },
    { field: 'fatherName', headerName: "Father's Name", width: 200 },
    { field: 'fatherEmail', headerName: "Father's Email", width: 250 },
    { field: 'fatherPhone', headerName: "Father's Phone", width: 150 },
    { field: 'fatherAlternatePhone', headerName: "Father's Alternate Phone", width: 150 },
    { field: 'motherName', headerName: "Mother's Name", width: 200 },
    { field: 'motherEmail', headerName: "Mother's Email", width: 250 },
    { field: 'motherPhone', headerName: "Mother's Phone", width: 150 },
    { field: 'motherAlternatePhone', headerName: "Mother's Alternate Phone", width: 150 },
    { field: 'guardianName', headerName: "Guardian's Name", width: 200 },
    { field: 'guardianEmail', headerName: "Guardian's Email", width: 250 },
    { field: 'guardianPhone', headerName: "Guardian's Phone", width: 150 },
    { field: 'guardianRelation', headerName: "Guardian's Relation", width: 150 },
    { field: 'mentorMujid', headerName: 'Mentor MUJID', width: 150 },
  ];

  // Filter columns to only include those with data and the actions column
  const columns = [
    ...baseColumns.filter(col => 
      col.field === 'serialNumber' || // Always include serial number
      col.field === 'MUJid' || // Always include MUJid
      columnsWithData.includes(col.field)
    ),
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size={isSmallScreen ? "small" : "medium"}
            variant="outlined"
            onClick={() => onEditClick(params.row)}
            sx={{ 
              borderRadius: '12px', 
              fontSize: { xs: '0.8rem', sm: '0.9rem' }, 
              textTransform: 'capitalize',
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
          <Button
            size={isSmallScreen ? "small" : "medium"}
            variant="outlined"
            onClick={() => handleDeleteClick(params.row.MUJid)} // Changed to handleDeleteClick
            sx={{ 
              borderRadius: '12px', 
              fontSize: { xs: '0.8rem', sm: '0.9rem' }, 
              textTransform: 'capitalize',
              color: '#ef4444',
              borderColor: '#ef4444',
              '&:hover': {
                borderColor: '#dc2626',
                backgroundColor: 'rgba(239, 68, 68, 0.1)'
              }
            }}
          >
            Delete
          </Button>
        </Box>
      ),
    }
  ];

  // Console log to debug which columns are being displayed
  console.log('Columns with data:', columnsWithData);
  console.log('Final columns being displayed:', columns);

  return (
    <>
      <Box sx={{ 
        position: 'relative',
        width: '100%',
        height: '100%' 
      }}>
        {loading && (
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1,
            borderRadius: 2
          }}>
            <CircularProgress sx={{ color: '#f97316' }} />
          </Box>
        )}
        
        <DataGrid
          rows={processedMentees}
          columns={columns}
          getRowId={(row) => row.id}
          autoHeight
          sx={{
            width: '100%', // Ensure full width
            height: '100%',
            minHeight: '400px',
            border: 'none',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
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
              borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
              color: '#f97316',
              fontSize: '1rem',
              fontWeight: 600,
              padding: '8px',
              paddingRight: '16px',
              minHeight: '60px !important',
              maxHeight: 'unset !important',
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
            '& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus': {
              outline: 'none',
            },
            '& .MuiDataGrid-columnHeader--sortable:hover': {
              backgroundColor: 'rgba(249, 115, 22, 0.1)',
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
            '& .MuiSvgIcon-root': {
              color: '#f97316',
            },
          }}
          disableSelectionOnClick
          disableColumnMenu={false}
          disableColumnFilter={false}
          loading={!mentees || mentees.length === 0} // Updated loading condition
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10, page: 0 },
            },
            columns: {
              columnVisibilityModel: {
                yearOfRegistration: false,
                fatherName: false,
                motherName: false,
                dateOfBirth: false,
                parentsPhone: false,
                parentsEmail: false,
                mentorMujid: true,
              },
            },
          }}
          pageSizeOptions={[5, 10, 25, 50]}
          getRowHeight={() => 'auto'}
          headerHeight={60}
          components={{
            LoadingOverlay: () => (
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%'
              }}>
                <CircularProgress sx={{ color: '#f97316' }} />
              </Box>
            )
          }}
        />
      </Box>

      {/* Add Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, mujid: null })}
        PaperProps={{
          sx: {
            backgroundColor: '#1a1a1a',
            color: 'white',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          Confirm Delete
        </DialogTitle>
        <DialogContent sx={{ my: 2 }}>
          Are you sure you want to delete this mentee? This action cannot be undone.
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', p: 2 }}>
          <Button
            onClick={() => setDeleteDialog({ open: false, mujid: null })}
            variant="outlined"
            sx={{
              color: 'white',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            sx={{
              bgcolor: '#ef4444',
              '&:hover': { bgcolor: '#dc2626' }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MenteeTable;
