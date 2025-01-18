'use client';
import { DataGrid } from '@mui/x-data-grid';
import { Button, Box, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Typography, IconButton, TextField } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import InfoIcon from '@mui/icons-material/Info';
import TransferIcon from '@mui/icons-material/SwapHoriz'; // Add this import
import MentorDetailsDialog from './MentorDetailsDialog';
import { useMemo, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const MentorTable = ({ mentors, onEditClick, onDeleteClick, onDataUpdate, emailFilter = '' }) => {
  const [deleteDialog, setDeleteDialog] = useState({ open: false, mujid: null });
  const [loading, setLoading] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState({ open: false, mentor: null });
  const [filteredMentors, setFilteredMentors] = useState(mentors);
  const [transferDialog, setTransferDialog] = useState({ open: false, fromMentor: null });
  const [transferEmail, setTransferEmail] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState('');
  const [targetMentor, setTargetMentor] = useState(null);
  const [searchingMentor, setSearchingMentor] = useState(false);

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

  // Add transfer handler
  const handleTransferMentees = async () => {
    setSearchingMentor(true);
    setTransferError('');
    
    try {
      // Update query to be more specific
      const findMentorResponse = await axios.get(`/api/admin/manageUsers/manageMentor`, {
        params: {
          email: transferEmail,
          academicYear: transferDialog.fromMentor.academicYear,
          academicSession: transferDialog.fromMentor.academicSession
        }
      });

      const foundMentor = findMentorResponse.data?.mentors?.[0];
      
      if (!foundMentor) {
        setTransferError('No mentor found with this email in the same academic year and session');
        toast.error('No mentor found with this email in the same academic year and session');
        setSearchingMentor(false);
        return;
      }

      // Prevent self-transfer
      if (foundMentor.MUJid === transferDialog.fromMentor.MUJid) {
        setTransferError('Cannot transfer mentees to the same mentor');
        toast.error('Cannot transfer mentees to the same mentor');
        setSearchingMentor(false);
        return;
      }

      setTargetMentor(foundMentor);
      toast.success('Mentor found successfully');
      setSearchingMentor(false);

    } catch (error) {
      setTransferError(error.response?.data?.message || 'Error finding mentor');
      toast.error(error.response?.data?.message || 'Error finding mentor');
      setSearchingMentor(false);
    }
  };

  // Add new function to handle the actual transfer
  const handleConfirmTransfer = async () => {
    setTransferLoading(true);
    try {
      const response = await axios.post('/api/admin/manageUsers/transferMentees', {
        fromMentorId: transferDialog.fromMentor.MUJid,
        toMentorEmail: transferEmail,
        academicYear: transferDialog.fromMentor.academicYear,
        academicSession: transferDialog.fromMentor.academicSession
      });

      if (response.data.success) {
        toast.success('Mentees transferred successfully');
        setTransferDialog({ open: false, fromMentor: null });
        setTransferEmail('');
        setTargetMentor(null);
        if (onDataUpdate) {
          onDataUpdate([...mentors]);
        }
      }
    } catch (error) {
      setTransferError(error.response?.data?.message || 'Error transferring mentees');
      toast.error(error.response?.data?.message || 'Error transferring mentees');
    } finally {
      setTransferLoading(false);
    }
  };

  // Process mentors data - Update this to include all necessary fields
  const processedMentors = useMemo(() => {
    return mentors.map((item) => ({
      ...item,  // Keep all original properties
      id: item._id || item.id, // Use _id or existing id
      MUJid: (item.MUJid || '').toUpperCase(),
      name: item.name || '',
      email: item.email || '',
      phone_number: item.phone_number || '',
      academicYear: item.academicYear || '',
      academicSession: item.academicSession || '',
      role: Array.isArray(item.role) ? item.role : [item.role] || ['mentor'],
      gender: item.gender || '',
    }));
  }, [mentors]);

  // Update filtered mentors when email filter or mentors change
  useEffect(() => {
    if (!emailFilter) {
      setFilteredMentors(processedMentors);
    } else {
      const filtered = processedMentors.filter(mentor => 
        mentor.email.toLowerCase().includes(emailFilter.toLowerCase())
      );
      setFilteredMentors(filtered);
    }
  }, [processedMentors, emailFilter]);

  const columns = [
    { 
      field: 'serialNumber',    
      headerName: 'S.No',
      width: 50, // Reduced from 60
      renderCell: (params) => {
        const index = processedMentors.findIndex(mentor => mentor.id === params.row.id);
        return index + 1;
      },
      sortable: false,
    },
    { field: 'MUJid', headerName: 'MUJid', width: 100 }, // Reduced from 130
    { field: 'name', headerName: 'Name', width: 150 }, // Reduced from 180
    { field: 'email', headerName: 'Email', width: 200 }, // Reduced from 235
    { field: 'phone_number', headerName: 'Phone', width: 120 }, // Reduced from 150
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200, // Increased width to accommodate new button
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            onClick={() => setDetailsDialog({ open: true, mentor: params.row })}
            sx={{ 
              color: '#3b82f6', // Blue color for info button
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
            onClick={() => {
              const mentor = {
                ...params.row,
                role: Array.isArray(params.row.role) 
                  ? params.row.role 
                  : params.row.role.split(', '),
                academicYear: params.row.academicYear,
                academicSession: params.row.academicSession
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
          <IconButton
            onClick={() => setTransferDialog({ 
              open: true, 
              fromMentor: params.row 
            })}
            sx={{ 
              color: '#10B981', // Green color for transfer
              '&:hover': {
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                transform: 'scale(1.1)',
              },
              transition: 'all 0.2s ease'
            }}
          >
            <TransferIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    }
  ].map(col => ({
    ...col,
    headerAlign: 'center',
    align: 'center',
    flex: 0, // Changed from 1 to disable flex growth
    minWidth: col.width || 100, // Reduced default minWidth
  }));

  const CustomHeader = () => (
    <Box sx={{
      p: 2,
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
      p: 1.5,
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
      height: { xs: 'auto', lg: 'calc(100vh - 200px)' }, // Responsive height
      width: '100%',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      transition: 'all 0.3s ease',
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
        rows={filteredMentors}
        columns={columns}
        getRowId={(row) => row._id || row.id}
        autoHeight={false} 
        sx={{
          height: { xs: '500px', lg: '100%' }, // Responsive height
          width: '100%',
          '& .MuiDataGrid-main': {
            overflow: 'auto',
            minHeight: { xs: '300px', lg: '200px' }, // Responsive minHeight
            maxHeight: { xs: '500px', lg: 'calc(100vh - 300px)' }, // Responsive maxHeight
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
            minHeight: { xs: '300px', lg: '200px' }, // Responsive minHeight
            maxHeight: { xs: '500px', lg: 'unset !important' }, // Responsive maxHeight
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
            transition: 'all 0.2s ease',
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: 'rgba(249, 115, 22, 0.15)',
            color: '#f97316',
            fontSize: '1rem',
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
          transition: 'all 0.3s ease',
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
        }}
        columnBuffer={5}
        rowBuffer={10}
        rowHeight={60}
        headerHeight={56}
        pageSize={10}
        rowsPerPageOptions={[10, 25, 50]}
        pagination
      />
      
      <MentorDetailsDialog
        open={detailsDialog.open}
        onClose={() => setDetailsDialog({ open: false, mentor: null })}
        mentor={detailsDialog.mentor}
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

      {/* Add Transfer Dialog */}
      <Dialog
        open={transferDialog.open}
        onClose={() => {
          setTransferDialog({ open: false, fromMentor: null });
          setTransferEmail('');
          setTargetMentor(null);
          setTransferError('');
        }}
        PaperProps={{ sx: {
          backgroundColor: '#1a1a1a',
          color: 'white',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        } }}
      >
        <DialogTitle sx={{ color: '#10B981', borderBottom: '1px solid rgba(16, 185, 129, 0.2)' }}>
          Transfer Mentees
        </DialogTitle>
        <DialogContent sx={{ my: 2, px: 3 }}>
          <Typography variant="body2" sx={{ mb: 3, color: 'rgba(255, 255, 255, 0.7)' }}>
            Transfer mentees from {transferDialog.fromMentor?.name} ({transferDialog.fromMentor?.MUJid})
          </Typography>
          
          {!targetMentor ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Enter Mentor Email"
                value={transferEmail}
                onChange={(e) => setTransferEmail(e.target.value)}
                error={!!transferError}
                helperText={transferError}
                disabled={searchingMentor}
                sx={{
                  '& .MuiInputBase-root': {
                    color: 'white',
                  },
                  '& .MuiFormLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.7)',
                    },
                  },
                  '& .MuiFormHelperText-root': {
                    color: '#ef4444',
                  },
                }}
              />
              <Button
                onClick={handleTransferMentees}
                variant="contained"
                disabled={!transferEmail || searchingMentor}
                sx={{
                  bgcolor: '#f97316',
                  '&:hover': { bgcolor: '#ea580c' }
                }}
              >
                {searchingMentor ? <CircularProgress size={24} /> : 'Find Mentor'}
              </Button>
            </Box>
          ) : (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" sx={{ color: '#f97316', mb: 2 }}>
                Transfer to:
              </Typography>
              <Box sx={{ 
                p: 3,
                bgcolor: 'rgba(249, 115, 22, 0.1)',
                borderRadius: 2,
                border: '1px solid rgba(249, 115, 22, 0.2)'
              }}>
                <Typography variant="body1" sx={{ color: 'white', mb: 2, fontWeight: 500 }}>
                  {targetMentor.name}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    <strong>MUJ ID:</strong> {targetMentor.MUJid}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    <strong>Email:</strong> {targetMentor.email}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mt: 1 }}>
                    <strong>Academic Year:</strong> {targetMentor.academicYear}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    <strong>Session:</strong> {targetMentor.academicSession}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(16, 185, 129, 0.2)', p: 2 }}>
          <Button
            onClick={() => {
              setTransferDialog({ open: false, fromMentor: null });
              setTransferEmail('');
              setTargetMentor(null);
              setTransferError('');
            }}
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
          {targetMentor && (
            <Button
              onClick={handleConfirmTransfer}
              variant="contained"
              disabled={transferLoading}
              sx={{
                bgcolor: '#f97316',
                '&:hover': { bgcolor: '#ea580c' }
              }}
            >
              {transferLoading ? <CircularProgress size={24} /> : 'Confirm Transfer'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MentorTable;
