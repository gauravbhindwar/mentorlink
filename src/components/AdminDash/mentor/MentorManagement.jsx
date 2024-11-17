'use client';
import { useState, useEffect } from 'react';
import { Box, Typography, Button, useMediaQuery, IconButton, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Slide, Alert, AlertTitle, LinearProgress, MenuItem, Divider } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useDropzone } from 'react-dropzone';
import MentorTable from './MentorTable';
import FilterSection from './MentorFilterSection';
import { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import axios from 'axios';
import BulkUploadPreview from '../common/BulkUploadPreview';

const MentorManagement = () => {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [mentorDetails, setMentorDetails] = useState({
    name: '',
    email: '',
    MUJid: '',
    phone_number: '',
    address: '',
    gender: '',
    profile_picture: '',
    role: ['mentor'],
    academicYear: '',
    academicSession: ''
  });
  const [editDialog, setEditDialog] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [alert, setAlert] = useState({ open: false, message: '', severity: '' });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [tableVisible, setTableVisible] = useState(false);
  const [academicYear, setAcademicYear] = useState('');
  const [academicSession, setAcademicSession] = useState('');
  const [academicSessions, setAcademicSessions] = useState([]);
  const [bulkUploadDialog, setBulkUploadDialog] = useState(false);
  const [previewData, setPreviewData] = useState({ data: [], errors: [] });
  const [showPreview, setShowPreview] = useState(false);

  const theme = createTheme({
    palette: {
      primary: {
        main: '#f97316',
      },
      secondary: {
        main: '#ea580c',
      },
    },
  });

  // Add this dialogStyles object
  const dialogStyles = {
    paper: {
      background: 'rgba(17, 17, 17, 0.95)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '1rem',
      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
      color: 'white',
    },
    title: {
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      px: 3,
      py: 2,
    },
    content: {
      px: 3,
      py: 2,
    },
    textField: {
      '& .MuiOutlinedInput-root': {
        color: 'white',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        transition: 'all 0.2s ease',
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: '#f97316',
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: '#f97316',
          borderWidth: '2px',
        },
        '&.Mui-disabled': {
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.1)',
          },
        },
      },
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: 'rgba(255, 255, 255, 0.2)',
      },
      '& .MuiInputLabel-root': {
        color: 'rgba(255, 255, 255, 0.7)',
        '&.Mui-focused': {
          color: '#f97316',
        },
      },
      '& .MuiInputBase-input': {
        '&::placeholder': {
          color: 'rgba(255, 255, 255, 0.5)',
          opacity: 1,
        },
      },
    },
    actions: {
      p: 3,
      gap: 1,
      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    },
  };

  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  // Add these variables for dropzone
  const [isUploading, setIsUploading] = useState(false);
  const [uploading, setUploading] = useState(false); // Changed from setUploading to uploading

  const handleBulkUploadClose = () => {
    setBulkUploadDialog(false);
    setUploadProgress(0);
    setUploading(false);
  };

  const handleFileUpload = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!validTypes.includes(file.type)) {
      showAlert('Please upload only Excel files (.xls or .xlsx)', 'error');
      return;
    }

    setUploading(true);
    setBulkUploadDialog(false); // Close the upload dialog
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'mentor'); // Add the type parameter

    try {
      const previewResponse = await axios.post('/api/admin/manageUsers/previewUpload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      setPreviewData(previewResponse.data);
      setShowPreview(true);
    } catch (error) {
      showAlert(error.response?.data?.error || error.message || 'Error processing file', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmUpload = async () => {
    setUploading(true);
    try {
      const response = await axios.post('/api/admin/manageUsers/bulkUpload', {
        data: previewData.data,
        type: 'mentor' // Explicitly set type for mentors
      });

      showAlert('File uploaded successfully!', 'success');
      setShowPreview(false);
      handleBulkUploadClose();
      fetchMentors();
    } catch (error) {
      showAlert(error.response?.data?.error || 'Error uploading file', 'error');
    } finally {
      setUploading(false);
    }
  };

  // Move useDropzone after handleFileUpload definition
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: handleFileUpload,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false
  });

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/manageUsers/manageMentor');
      setMentors(response.data.mentors);
      setTableVisible(true);
    } catch (error) {
      showAlert(error.response?.data?.error || 'Error fetching mentors', 'error');
      setMentors([]);
      setTableVisible(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMentor = async () => {
    try {
      const response = await axios.post('/api/admin/manageUsers/manageMentor', mentorDetails);
      showAlert('Mentor added successfully', 'success');
      setOpenDialog(false);
      fetchMentors();
      setMentorDetails({
        name: '',
        email: '',
        MUJid: '',
        phone_number: '',
        address: '',
        gender: '',
        profile_picture: '',
        role: ['mentor'],
        academicYear: '',
        academicSession: ''
      });
    } catch (error) {
      showAlert(error.response?.data?.error || 'Error adding mentor', 'error');
    }
  };

  const handleEditMentor = async () => {
    try {
      await axios.put('/api/admin/manageUsers/manageMentor', selectedMentor);
      showAlert('Mentor updated successfully', 'success');
      setEditDialog(false);
      fetchMentors();
    } catch (error) {
      showAlert(error.response?.data?.error || 'Error updating mentor', 'error');
    }
  };

  const handleDeleteMentor = async (MUJid) => {
    try {
      await axios.delete('/api/admin/manageUsers/manageMentor', { data: { MUJid } });
      showAlert('Mentor deleted successfully', 'success');
      fetchMentors();
    } catch (error) {
      showAlert(error.response?.data?.error || 'Error deleting mentor', 'error');
    }
  };

  const getCurrentAcademicYear = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    const startYear = currentMonth > 6 ? currentYear : currentYear - 1;
    const endYear = startYear + 1;
    return `${startYear}-${endYear}`;
  };

  const generateAcademicSessions = (academicYear) => {
    if (!academicYear) return [];
    const [startYear, endYear] = academicYear.split('-');
    return [
      `JULY-DECEMBER ${startYear}`,
      `JANUARY-JUNE ${endYear}`
    ];
  };

  useEffect(() => {
    const currentAcadYear = getCurrentAcademicYear();
    const sessions = generateAcademicSessions(currentAcadYear);
    setAcademicSessions(sessions);
    setMentorDetails(prev => ({
      ...prev,
      academicYear: currentAcadYear,
      academicSession: sessions[0]
    }));
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'MUJid') {
      // Ensure MUJid is capital letters and numbers only
      const formattedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      setMentorDetails(prev => ({
        ...prev,
        [name]: formattedValue
      }));
    } else if (name === 'academicYear') {
      const sessions = generateAcademicSessions(value);
      setAcademicSessions(sessions);
      setMentorDetails(prev => ({
        ...prev,
        [name]: value,
        academicSession: sessions[0]
      }));
    } else {
      setMentorDetails(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedMentor(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const showAlert = (message, severity) => {
    setAlert({ open: true, message, severity });
    setTimeout(() => setAlert({ open: false, message: '', severity: '' }), 3000);
  };

  const handleBulkUploadOpen = () => {
    setBulkUploadDialog(true);
  };

  return (
    <ThemeProvider theme={theme}>
      {/* Toast/Alert Container */}
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[9999] w-full max-w-md max-h-screen">
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'rgba(0, 0, 0, 0.8)',
              color: '#fff',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '0.75rem',
            },
          }}
        />
        <Snackbar
          open={alert.open}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          TransitionComponent={(props) => <Slide {...props} direction="down" />}
          sx={{
            '& .MuiSnackbarContent-root': {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '0.75rem',
            }
          }}
        >
          <Alert 
            severity={alert.severity} 
            onClose={() => setAlert({ ...alert, open: false })}
            sx={{
              backgroundColor: 'transparent',
              color: '#fff',
              '& .MuiAlert-icon': {
                color: '#fff'
              }
            }}
          >
            <AlertTitle>{alert.severity === 'error' ? 'Error' : 'Success'}</AlertTitle>
            {alert.message}
          </Alert>
        </Snackbar>
      </div>

      <div className="min-h-screen bg-[#0a0a0a] overflow-hidden relative">
        {/* Background Effects */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-purple-500/10 to-blue-500/10 animate-gradient" />
          <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-orange-500/20 to-transparent blur-3xl" />
          <div className="absolute inset-0 backdrop-blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 px-4 md:px-6 py-24 max-h-screen">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <motion.h1 
              className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-pink-500 mb-5 !leading-snug"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Mentor Management
            </motion.h1>

            {/* Filter Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white/5 backdrop-blur-md rounded-xl p-6 mb-8 border border-white/10"
            >
              <FilterSection 
                onSearch={handleSearch}
                onAddNew={() => setOpenDialog(true)}
                onBulkUpload={handleBulkUploadOpen}
                filters={{
                  academicYear,
                  academicSession,
                }}
                onFilterChange={(name, value) => {
                  switch(name) {
                    case 'academicYear':
                      setAcademicYear(value);
                      break;
                    case 'academicSession':
                      setAcademicSession(value);
                      break;
                  }
                }}
              />
            </motion.div>

            {/* Table Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden mb-8"
              style={{ position: 'relative', zIndex: 1 }} // Add this to ensure table stays below filters
            >
              <Box sx={{ 
                overflowX: 'auto', 
                minHeight: '150px',
                maxHeight: 'calc(100vh - 400px)',
                overflowY: 'auto',
                position: 'relative',
                zIndex: 1
              }}>
                {!loading && mentors.length > 0 && (
                  <MentorTable 
                    mentors={mentors}
                    onEditClick={(mentor) => {
                      setSelectedMentor(mentor);
                      setEditDialog(true);
                    }}
                    onDeleteClick={handleDeleteMentor}
                    isSmallScreen={isSmallScreen}
                  />
                )}
              </Box>
            </motion.div>
          </motion.div>
        </div>

        {/* Add/Edit Dialog */}
        <Dialog 
          open={openDialog} 
          onClose={() => setOpenDialog(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: dialogStyles.paper }}
        >
          <DialogTitle sx={dialogStyles.title}>
            <Typography variant="h6" component="div" sx={{ color: '#f97316', fontWeight: 600 }}>
              Add New Mentor
            </Typography>
            <IconButton
              aria-label="close"
              onClick={() => setOpenDialog(false)}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: 'rgba(255, 255, 255, 0.7)',
                '&:hover': {
                  color: '#f97316',
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={dialogStyles.content}>
            <Box sx={{ 
              display: 'flex', 
              gap: 4,
              minHeight: '60vh',
            }}>
              {/* Left side - Form */}
              <Box sx={{ 
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                overflowY: 'auto',
                pr: 2,
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(249, 115, 22, 0.5)',
                  borderRadius: '4px',
                  '&:hover': {
                    background: 'rgba(249, 115, 22, 0.7)',
                  },
                },
                '& .MuiTextField-root': dialogStyles.textField,
              }}>
                <TextField
                  label="MUJid"
                  name="MUJid"
                  value={mentorDetails.MUJid}
                  onChange={handleInputChange}
                  required
                />
                <TextField
                  label="Name"
                  name="name"
                  value={mentorDetails.name}
                  onChange={handleInputChange}
                  required
                />
                <TextField
                  label="Email"
                  name="email"
                  type="email"
                  value={mentorDetails.email}
                  onChange={handleInputChange}
                  required
                />
                <TextField
                  label="Phone Number"
                  name="phone_number"
                  value={mentorDetails.phone_number}
                  onChange={handleInputChange}
                  required
                />
                <TextField
                  select
                  label="Gender"
                  name="gender"
                  value={mentorDetails.gender}
                  onChange={handleInputChange}
                >
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </TextField>
                <TextField
                  select
                  label="Role"
                  name="role"
                  value={mentorDetails.role}
                  onChange={handleInputChange}
                  SelectProps={{ multiple: true }}
                >
                  <MenuItem value="mentor">Mentor</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="superadmin">Super Admin</MenuItem>
                </TextField>
                <TextField
                  label="Academic Year"
                  name="academicYear"
                  select
                  value={mentorDetails.academicYear}
                  onChange={handleInputChange}
                  required
                  SelectProps={{
                    MenuProps: {
                      PaperProps: {
                        sx: {
                          bgcolor: '#1a1a1a',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          '& .MuiMenuItem-root': {
                            color: 'white',
                            '&:hover': {
                              bgcolor: '#2a2a2a',
                            },
                            '&.Mui-selected': {
                              bgcolor: '#333333',
                              '&:hover': {
                                bgcolor: '#404040',
                              }
                            }
                          }
                        }
                      }
                    }
                  }}
                >
                  {(() => {
                    const currentYear = new Date().getFullYear();
                    return [
                      `${currentYear}-${currentYear + 1}`,
                      `${currentYear - 1}-${currentYear}`,
                      `${currentYear - 2}-${currentYear - 1}`,
                      `${currentYear - 3}-${currentYear - 2}`
                    ].map(year => (
                      <MenuItem key={year} value={year}>{year}</MenuItem>
                    ));
                  })()}
                </TextField>
                <TextField
                  label="Academic Session"
                  name="academicSession"
                  select
                  value={mentorDetails.academicSession || ''}
                  onChange={handleInputChange}
                  disabled={!mentorDetails.academicYear}
                  required
                  SelectProps={{
                    MenuProps: {
                      PaperProps: {
                        sx: {
                          bgcolor: '#1a1a1a',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          '& .MuiMenuItem-root': {
                            color: 'white',
                            '&:hover': {
                              bgcolor: '#2a2a2a',
                            }
                          }
                        }
                      }
                    }
                  }}
                >
                  {academicSessions.map(session => (
                    <MenuItem key={session} value={session}>{session}</MenuItem>
                  ))}
                </TextField>
              </Box>

              {/* Divider */}
              <Divider orientation="vertical" flexItem sx={{ 
                borderColor: 'rgba(255, 255, 255, 0.1)',
                '&.MuiDivider-root': {
                  '&::before, &::after': {
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                  },
                },
              }}>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>OR</Typography>
              </Divider>

              {/* Right side - Upload */}
              <Box 
                {...getRootProps()} 
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: 4,
                  border: '2px dashed',
                  borderColor: 'rgba(249, 115, 22, 0.5)',
                  borderRadius: 3,
                  bgcolor: 'rgba(255, 255, 255, 0.02)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  '&:hover': {
                    bgcolor: 'rgba(249, 115, 22, 0.1)',
                    borderColor: '#f97316',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <input {...getInputProps()} />
                <UploadFileIcon sx={{ 
                  fontSize: 60, 
                  color: '#f97316', 
                  mb: 2,
                }} />
                <Typography variant="h6" gutterBottom sx={{ color: 'white', fontWeight: 600 }}>
                  Drag & Drop Excel File
                </Typography>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
                  or click to select file
                </Typography>
                <Typography sx={{ 
                  color: '#f97316',
                  bgcolor: 'rgba(249, 115, 22, 0.1)',
                  px: 2,
                  py: 0.5,
                  borderRadius: 1,
                }}>
                  Supported formats: .xls, .xlsx
                </Typography>
                {isUploading && (
                  <Box sx={{ 
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    bgcolor: 'rgba(0, 0, 0, 0.8)',
                    p: 2,
                  }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={uploadProgress}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="caption" sx={{ color: 'white', mt: 1 }}>
                      {uploadProgress}% uploaded
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={dialogStyles.actions}>
            <Button 
              onClick={() => setOpenDialog(false)}
              variant="outlined"
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                },
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddMentor}
              variant="contained"
              sx={{
                bgcolor: '#f97316',
                '&:hover': {
                  bgcolor: '#ea580c',
                },
              }}
            >
              Add Mentor
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog 
          open={editDialog} 
          onClose={() => setEditDialog(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: dialogStyles.paper }}
        >
          <DialogTitle sx={dialogStyles.title}>
            <Typography variant="h6" component="div" sx={{ color: '#f97316', fontWeight: 600 }}>
              Edit Mentor
            </Typography>
            <IconButton
              aria-label="close"
              onClick={() => setEditDialog(false)}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: 'rgba(255, 255, 255, 0.7)',
                '&:hover': {
                  color: '#f97316',
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={dialogStyles.content}>
            <Box sx={{ 
              display: 'flex', 
              gap: 4,
              minHeight: '60vh',
            }}>
              {/* Left side - Form */}
              <Box sx={{ 
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                overflowY: 'auto',
                pr: 2,
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(249, 115, 22, 0.5)',
                  borderRadius: '4px',
                  '&:hover': {
                    background: 'rgba(249, 115, 22, 0.7)',
                  },
                },
                '& .MuiTextField-root': dialogStyles.textField,
              }}>
                <TextField
                  label="MUJid"
                  name="MUJid"
                  value={selectedMentor?.MUJid || ''}
                  onChange={handleEditInputChange}
                  required
                />
                <TextField
                  label="Name"
                  name="name"
                  value={selectedMentor?.name || ''}
                  onChange={handleEditInputChange}
                  required
                />
                <TextField
                  label="Email"
                  name="email"
                  type="email"
                  value={selectedMentor?.email || ''}
                  onChange={handleEditInputChange}
                  required
                />
                <TextField
                  label="Phone Number"
                  name="phone"
                  value={selectedMentor?.phone_number || ''}
                  onChange={handleEditInputChange}
                  required
                />
                <TextField
                  select
                  label="Gender"
                  name="gender"
                  value={selectedMentor?.gender || ''}
                  onChange={handleEditInputChange}
                >
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </TextField>
                <TextField
                  select
                  label="Role"
                  name="role"
                  value={selectedMentor?.role || []}
                  onChange={handleEditInputChange}
                  SelectProps={{ multiple: true }}
                >
                  <MenuItem value="mentor">Mentor</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="superadmin">Super Admin</MenuItem>
                </TextField>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={dialogStyles.actions}>
            <Button 
              onClick={() => setEditDialog(false)}
              variant="outlined"
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                },
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditMentor}
              variant="contained"
              sx={{
                bgcolor: '#f97316',
                '&:hover': {
                  bgcolor: '#ea580c',
                },
              }}
            >
              Update Mentor
            </Button>
          </DialogActions>
        </Dialog>
        <BulkUploadPreview
          open={showPreview}
          onClose={() => setShowPreview(false)}
          data={previewData.data}
          errors={previewData.errors}
          onConfirm={handleConfirmUpload}
          isUploading={uploading}
          type="mentor" // Specify the type as mentor
        />
      </div>
    </ThemeProvider>
  );
};

export default MentorManagement;