'use client';
import { DataGrid } from '@mui/x-data-grid';
import { Button, Box, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Typography, IconButton } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { useMemo, useState } from 'react';

const MentorTable = ({ mentors, onEditClick, onDeleteClick,  onDataUpdate }) => {
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
        await onDeleteClick(deleteDialog.mujid);
        // Update local data
        if (onDataUpdate) {
          onDataUpdate(prevMentors => 
            prevMentors.filter(m => m.MUJid !== deleteDialog.mujid)
          );
        }
      } finally {
        setLoading(false);
        setDeleteDialog({ open: false, mujid: null });
      }
    }
  };

  // Process mentors data - Update this to include all necessary fields
  const processedMentors = useMemo(() => {
    return mentors.map((mentor, index) => ({
      id: mentor._id || mentor.id || `temp-${index}`,
      MUJid: (mentor.MUJid || '').toUpperCase(),
      name: mentor.name || '',
      email: mentor.email || '',
      phone_number: mentor.phone_number || '',
      academicYear: mentor.academicYear || '',
      academicSession: mentor.academicSession || '',
      role: Array.isArray(mentor.role) ? mentor.role : [mentor.role] || ['mentor'],
      gender: mentor.gender || '',
    }));
  }, [mentors]);

  const columns = [
    { 
      field: 'serialNumber',    
      headerName: 'S.No',
      width: 45, // Reduced from 50
      renderCell: (params) => {
        const index = processedMentors.findIndex(mentor => mentor.id === params.row.id);
        return index + 1;
      },
      sortable: false,
    },
    { field: 'MUJid', headerName: 'MUJid', width: 100 }, // Reduced from 110
    { field: 'name', headerName: 'Name', width: 140 }, // Reduced from 160
    { field: 'email', headerName: 'Email', width: 180 }, // Reduced from 200
    { field: 'phone_number', headerName: 'Phone', width: 120 }, // Reduced from 130
    { field: 'academicSession', headerName: 'Session', width: 160 }, // Reduced from 180
    { field: 'academicYear', headerName: 'Academic Year', width: 120 }, // Reduced from 130
    {
      field: 'actions',
      headerName: 'Actions',
      width: 90, // Reduced from 100
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            onClick={() => {
              const mentor = {
                ...params.row,
                role: Array.isArray(params.row.role) 
                  ? params.row.role 
                  : params.row.role.split(', ')
              };
              onEditClick(mentor);
            }}
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
    },
    { field: 'role', headerName: 'Role', width: 120 } // Reduced from 130
  ].map(col => ({
    ...col,
    headerAlign: 'center',
    align: 'center',
    flex: 1,
    minWidth: col.width || 120, // Reduced from 130
    // Add responsive width
    hide: col.field === 'role' ? 'smDown' : 
          col.field === 'academicSession' ? 'mdDown' : false,
  }));

  const CustomHeader = () => (
    <Box sx={{
      p: 1.5, // Reduced from 2
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid rgba(249, 115, 22, 0.3)',
      background: 'linear-gradient(to right, rgba(249, 115, 22, 0.15), rgba(249, 115, 22, 0.05))',
    }}>
      <Typography variant="h6" sx={{ 
        color: '#f97316', 
        fontWeight: 600,
        textShadow: '0 0 10px rgba(249, 115, 22, 0.3)'
      }}>
        Mentor Management
      </Typography>
      <Typography variant="body2" sx={{ 
        color: 'rgba(249, 115, 22, 0.9)',
        fontWeight: 500
      }}>
        Total Mentors: {processedMentors.length}
      </Typography>
    </Box>
  );

  const CustomFooter = () => (
    <Box sx={{
      p: 1, // Reduced from 1.5
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
      borderTop: '1px solid rgba(249, 115, 22, 0.3)',
      background: 'linear-gradient(to right, rgba(249, 115, 22, 0.15), rgba(249, 115, 22, 0.05))',
    }}>
      <Typography variant="body2" sx={{ 
        color: 'rgba(249, 115, 22, 0.9)',
        fontWeight: 500
      }}>
        Last updated: {new Date().toLocaleDateString()}
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ 
      height: '100%',
      width: '100%',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
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
        rows={processedMentors}
        columns={columns}
        getRowId={(row) => row.id}
        autoHeight={false} // Remove autoHeight to enable vertical scrolling
        sx={{
          // ...existing styles...
          height: '100%',
          width: '100%',
          '& .MuiDataGrid-main': {
            overflow: 'auto',
            minHeight: {
              xs: '150px',
              sm: '200px',
              md: '250px',
            },
            maxHeight: {
              xs: 'calc(100vh-320px)',
              sm: 'calc(100vh-280px)',
              md: 'calc(100vh-240px)',
            },
            height: '100%', // Ensure full height
            flex: 1,
          },
          '& .MuiDataGrid-virtualScroller': {
            overflow: 'auto !important',
            '&::-webkit-scrollbar': {
              width: '8px',
              height: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(249, 115, 22, 0.5)',
              borderRadius: '4px',
              '&:hover': {
                background: 'rgba(249, 115, 22, 0.7)',
              },
            },
            height: '100% !important', // Force full height
            minHeight: '300px', // Added minimum height
            maxHeight: 'unset !important',
          },
          '& .MuiDataGrid-virtualScrollerContent': {
            minWidth: 'fit-content', // Ensure horizontal scroll works
            height: '100%',
          },
          '& .MuiDataGrid-virtualScrollerRenderZone': {
            width: '100%',
            height: '100%',
          },
          width: '100%',
          height: '100%',
          minHeight: '400px', // Reduced from 500px
          border: 'none',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(10px)',
          borderRadius: 2,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            padding: {
              xs: '2px',
              sm: '4px',
              md: '6px',
            },
            fontSize: {
              xs: '0.7rem',
              sm: '0.75rem',
              md: '0.8rem',
            },
            color: 'rgba(255, 255, 255, 0.9)',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '40px !important', // Reduced from 45px
            maxHeight: 'unset !important',
            whiteSpace: 'normal',
            lineHeight: '1.5',
            transition: 'all 0.2s ease',
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: 'rgba(249, 115, 22, 0.15)',
            color: '#f97316',
            fontSize: {
              xs: '0.75rem',
              sm: '0.8rem',
              md: '0.85rem',
            },
            fontWeight: 600,
            borderBottom: '2px solid #f97316',
          },
          '& .MuiDataGrid-footerContainer': {
            position: 'sticky',
            bottom: 0,
            bgcolor: 'rgba(0, 0, 0, 0.2)',
            borderTop: '2px solid rgba(249, 115, 22, 0.3)',
            backdropFilter: 'blur(10px)',
          },
          '& .MuiTablePagination-root': {
            color: 'rgba(249, 115, 22, 0.9)',
          },
          '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
            color: 'rgba(249, 115, 22, 0.9)',
          },
          '& .MuiTablePagination-select': {
            color: 'rgba(249, 115, 22, 0.9)',
          },
          flex: 1,
          height: '100%',
          maxHeight: '100%',
          '& .MuiDataGrid-row': {
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'rgba(249, 115, 22, 0.08)',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            },
          },
        }}
        disableSelectionOnClick
        disableColumnMenu={false}
        disableColumnFilter={false}
        loading={!mentors.length}
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
          ),
          Header: CustomHeader,
          Footer: CustomFooter,
          NoRowsOverlay: () => (
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              p: 2,
              textAlign: 'center',
            }}>
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                No mentors found
              </Typography>
            </Box>
          ),
        }}
        columnBuffer={5}
        rowBuffer={10}
        rowHeight={32} // Further reduced from 35
        headerHeight={32} // Further reduced from 35
        pageSize={10}
        rowsPerPageOptions={[10, 25, 50]}
        pagination
      />
      
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
          Are you sure you want to delete this mentor? This action cannot be undone.
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
    </Box>
  );
};

export default MentorTable;