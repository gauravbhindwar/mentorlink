"use client";
import { useState} from 'react';
import { Box, Typography, Button, useMediaQuery, IconButton, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Divider, Snackbar, Slide, Alert, AlertTitle, LinearProgress } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useDropzone } from 'react-dropzone';
import MentorTable from './MentorTable';
import FilterSection from './MentorFilterSection';
import { Toaster } from 'react-hot-toast';
import axios from 'axios';
import { motion } from 'framer-motion';


const MentorManagement = () => {
  const [mentors, setMentors] = useState([]);
  const [year, setYear] = useState('');
  const [term, setTerm] = useState('');
  const [semester, setSemester] = useState('');
  const [section, setSection] = useState('');
  const [isFilterSelected, setIsFilterSelected] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [mentorDetails, setMentorDetails] = useState({
    mujid: '',
    name: '',
    email: '',
  });
  const [loading, setLoading] = useState(false); // Set initial loading state to false
  const [error, setError] = useState(null);
  const [editDialog, setEditDialog] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: '' });
  const [uploadProgress, setUploadProgress] = useState(0);

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

  const handleAddMentor = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/admin/manageMentor', mentorDetails);
      setMentors(prev => [...prev, response.data]);
      setOpenDialog(false);
      setMentorDetails({ mujid: '', name: '', email: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add mentor');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (mentor) => {
    setSelectedMentor(mentor);
    setEditDialog(true);
  };

  const handleEditClose = () => {
    setSelectedMentor(null);
    setEditDialog(false);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedMentor(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMentorDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);
      const response = await axios.patch('/api/admin/manageMentor', selectedMentor);
      setMentors(prevMentors => 
        prevMentors.map(mentor => 
          mentor.mujid === selectedMentor.mujid ? response.data : mentor
        )
      );
      handleEditClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update mentor');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (!validTypes.includes(file.type)) {
      showAlert('Please upload only Excel files (.xls or .xlsx)', 'error');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/api/admin/manageMentor/upload', formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      const { results } = response.data;
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      showAlert(
        `Upload complete: ${successful} mentors added/updated, ${failed} failed`,
        failed > 0 ? 'warning' : 'success'
      );

      // Refresh the mentor list
      if (handleSearch) {
        handleSearch([]);
      }
    } catch (error) {
      showAlert(error.response?.data?.error || 'Error uploading file', 'error');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setOpenDialog(false);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: handleFileUpload,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false
  });

  const fetchMentors = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/manageMentor');
      setMentors(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch mentors');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchMentors(); // Fetch data when search is triggered
  };

  const handleFilterChange = (filterName, value) => {
    switch (filterName) {
      case 'year':
        setYear(value);
        break;
      case 'term':
        setTerm(value);
        // Reset semester when term changes
        setSemester('');
        break;
      case 'semester':
        setSemester(value);
        break;
      case 'section':
        setSection(value);
        break;
      default:
        break;
    }
    setMentors([]); // Clear data when filter options change
  };

  const handleReset = () => {
    setYear('');
    setTerm('');
    setSemester('');
    setSection('');
    setIsFilterSelected(false);
  };

  const filterConfig = {
    year,
    term,
    semester,
    section
  };

  const showAlert = (message, severity) => {
    setAlert({ open: true, message, severity });
    setTimeout(() => setAlert({ open: false, message: '', severity: '' }), 3000);
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
                filters={filterConfig}
                onFilterChange={handleFilterChange}
                onSearch={handleSearch}
                onSearchAll={fetchMentors}
                onAddNew={() => setOpenDialog(true)}
                onReset={handleReset}
              />
            </motion.div>

            {/* Table Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden mb-8"
            >
              <Box sx={{ 
                overflowX: 'auto', 
                minHeight: '150px',
                maxHeight: 'calc(100vh - 400px)',
                overflowY: 'auto' 
              }}>
                {!loading && mentors.length > 0 && (
                  <MentorTable 
                    mentors={mentors}
                    onEditClick={handleEditClick}
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
                {Object.entries(mentorDetails).map(([key, value]) => (
                  <TextField
                    key={key}
                    label={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                    name={key}
                    type={key.includes('email') ? 'email' : 'text'}
                    value={value}
                    onChange={handleInputChange}
                    required
                    sx={dialogStyles.textField}
                  />
                ))}
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
          onClose={handleEditClose}
          // ...existing dialog props...
          PaperProps={{ sx: dialogStyles.paper }}
        >
          {/* ...existing dialog content... */}
        </Dialog>
      </div>
    </ThemeProvider>
  );
};

export default MentorManagement;