'use client';
import { DataGrid } from '@mui/x-data-grid';
import { Button, Box, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, IconButton } from '@mui/material'; // Add Box, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, IconButton import
import { useMemo, useState, useEffect } from 'react';
import InfoIcon from '@mui/icons-material/Info';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import MenteeDetailsDialog from './MenteeDetailsDialog';

// Update the component props to include onDeleteClick and onDataUpdate
const MenteeTable = ({ mentees, onDeleteClick, onDataUpdate, onEditClick, isLoading }) => {
  const [deleteDialog, setDeleteDialog] = useState({ open: false, mujid: null });
  const [loading, setLoading] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState({ open: false, mentee: null });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Add this function to handle delete click
  const handleDeleteClick = (mujid) => {
    setDeleteDialog({ open: true, mujid });
  };
 
  // Add handleEditClick function
  const handleEditClick = (menteeData) => {
    if (onEditClick) {
      onEditClick(menteeData);
    }
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
  // console.log('Raw mentees received:', mentees);

  // Modified effectiveMentees memo
  const effectiveMentees = useMemo(() => {
    if (!mentees || mentees.length === 0) {
      try {
        const storedData = sessionStorage.getItem('menteeData');
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          console.log('Using stored data:', parsedData);
          return parsedData;
        }
        // If no stored data, return empty array immediately
        return [];
      } catch (error) {
        console.error('Error parsing stored data:', error);
        return [];
      }
    }
    return mentees;
  }, [mentees]);

  // Process mentees data with error handling
  const processedMentees = useMemo(() => {
    if (!mounted || !Array.isArray(effectiveMentees)) {
      return [];
    }

    return effectiveMentees.map((mentee, index) => {
      try {
        return {
          id: mentee._id || mentee.id || `temp-${index}`,
          MUJid: (mentee.MUJid || '').toUpperCase(),
          name: mentee.name || '',
          email: mentee.email || '',
          phone: mentee.phone || '',
          yearOfRegistration: mentee.yearOfRegistration || '',
          section: (mentee.section || '').toUpperCase(),
          semester: mentee.semester || '',
          academicYear: mentee.academicYear || '',
          academicSession: mentee.academicSession || '',
          mentorMujid: (mentee.mentorMujid || '').toUpperCase(),
          // Add parent information
          parents: mentee.parents || {},
          // For table display
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
          guardianRelation: mentee.parents?.guardian?.relation || ''
        };
      } catch (error) {
        console.log('Error processing mentee:', error);
        return null;
      }
    }).filter(Boolean); // Remove any null entries
  }, [effectiveMentees, mounted]);

  if (!mounted) {
    return null;
  }

  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        height: '200px'
      }}>
        <CircularProgress sx={{ color: '#f97316' }} />
      </Box>
    );
  }

  if (!processedMentees.length) {
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

  // Define minimum columns that should always be visible
  const minimumColumns = [
    {
      field: 'serialNumber',
      headerName: 'S.No',
      width: 70,
      renderCell: (params) => processedMentees.findIndex(m => m.id === params.row.id) + 1,
      sortable: false,
    },
    { field: 'MUJid', headerName: 'MUJid', width: 150 },
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'email', headerName: 'Email', width: 250 },
    // { field: 'section', headerName: 'Section', width: 100 },
    // { field: 'semester', headerName: 'Semester', width: 100 },
    // { field: 'academicYear', headerName: 'Academic Year', width: 150 },
    // { field: 'academicSession', headerName: 'Academic Session', width: 200 },
    { field: 'mentorMujid', headerName: 'Mentor MUJID', width: 150 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            onClick={() => setDetailsDialog({ open: true, mentee: params.row })}
            sx={{ 
              color: '#3b82f6',
              '&:hover': {
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                transform: 'scale(1.1)',
              },
              transition: 'all 0.2s ease'
            }}
          >
            <InfoIcon fontSize="small" />
          </IconButton>
          <IconButton
            onClick={() => handleEditClick(params.row)}
            sx={{ 
              color: '#f97316',
              '&:hover': {
                backgroundColor: 'rgba(249, 115, 22, 0.1)',
                transform: 'scale(1.1)',
              },
              transition: 'all 0.2s ease'
            }}
          >
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
          <IconButton
            onClick={() => handleDeleteClick(params.row.MUJid)}
            sx={{ 
              color: '#ef4444',
              '&:hover': {
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                transform: 'scale(1.1)',
              },
              transition: 'all 0.2s ease'
            }}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    }
  ];

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
          columns={minimumColumns}
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
          loading={isLoading} // Updated loading condition
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

      <MenteeDetailsDialog
        open={detailsDialog.open}
        onClose={() => setDetailsDialog({ open: false, mentee: null })}
        mentee={detailsDialog.mentee}
      />

      {/* Delete Confirmation Dialog */}
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
