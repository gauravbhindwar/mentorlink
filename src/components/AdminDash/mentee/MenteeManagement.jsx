"use client";
import { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Container, useMediaQuery, IconButton, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Divider, Snackbar, Slide, Alert, AlertTitle, LinearProgress, MenuItem, CircularProgress } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useDropzone } from 'react-dropzone';
import MenteeTable from './MenteeTable';
import FilterSection from './FilterSection';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const calculateCurrentSemester = (yearOfRegistration) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-based

  // Calculate years completed
  let yearsCompleted = currentYear - yearOfRegistration;
  
  // Calculate semester based on current month
  // August to November is odd semester
  // December to June is even semester
  let semesterInCurrentYear;
  if (currentMonth >= 8 && currentMonth <= 11) {
    semesterInCurrentYear = 1; // Odd semester
  } else if ((currentMonth >= 12) || (currentMonth >= 1 && currentMonth <= 6)) {
    semesterInCurrentYear = 2; // Even semester
  } else {
    // July is considered as end of even semester
    semesterInCurrentYear = 2;
  }

  // Calculate total semesters completed
  let totalSemesters = (yearsCompleted * 2) + semesterInCurrentYear;

  // Ensure semester doesn't exceed 8 (4-year program)
  return Math.min(totalSemesters, 8);
};

const getCurrentAcademicYear = () => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // 1-12
  const currentYear = currentDate.getFullYear();
  
  // If current month is after June (start of academic year), use current year
  // Otherwise use previous year
  const startYear = currentMonth > 6 ? currentYear : currentYear - 1;
  const endYear = startYear + 1;
  return `${startYear}-${endYear}`;
};

const generateAcademicSessions = (academicYear) => {
  if (!academicYear) return [];
  const [startYear, endYear] = academicYear.split('-');
  return [
    `July-December ${startYear}`,
    `January-June ${endYear}`
  ];
};

const generateSemesterOptions = (academicSession) => {
  if (!academicSession) return [];
  const sessionParts = academicSession.split(' ');
  const sessionPeriod = sessionParts[0];
  if (sessionPeriod === 'July-December') {
    return [1, 3, 5, 7]; // Odd semesters
  } else if (sessionPeriod === 'January-June') {
    return [2, 4, 6, 8]; // Even semesters
  }
  return [];
};

const MenteeManagement = () => {
  const [mentees, setMentees] = useState([]);
  const [loading, setLoading] = useState(false); // Set initial loading state to false
  const [mounted, setMounted] = useState(false);
  const [academicYear, setAcademicYear] = useState('');
  const [academicSession, setAcademicSession] = useState('');
  const [semester, setSemester] = useState('');
  const [section, setSection] = useState('');
  const [menteeMujid, setMenteeMujid] = useState(''); // Move this up
  const [mentorMujid, setMentorMujid] = useState(''); // Move this up
  const [isFilterSelected, setIsFilterSelected] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [menteeDetails, setMenteeDetails] = useState({
    name: '',
    email: '',
    MUJid: '',
    phone: '',
    yearOfRegistration: '',
    section: '',
    semester: '',
    startYear: '',
    endYear: '',
    academicYear: '', // Changed from AcademicYear
    academicSession: '', // Changed from AcademicSession
    mentorMujid: '',
    parents: {
      father: {
        name: '',
        email: '',
        phone: '',
        alternatePhone: ''
      },
      mother: {
        name: '',
        email: '',
        phone: '',
        alternatePhone: ''
      },
      guardian: {
        name: '',
        email: '',
        phone: '',
        relation: ''
      }
    }
  });
  
  const [editDialog, setEditDialog] = useState(false);
  const [selectedMentee, setSelectedMentee] = useState(null);
  const [alert, setAlert] = useState({ open: false, message: '', severity: '' });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, mentee: null });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const [assignDialog, setAssignDialog] = useState(false);
  const [assignmentDetails, setAssignmentDetails] = useState({
    mentor_MUJid: '',
    mentee_MUJid: '',
    session: '',
    semester: '', // Changed from current_semester to semester
    section: ''
  });

  const [bulkUploadDialog, setBulkUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [tableVisible, setTableVisible] = useState(false);

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
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/api/admin/manageUsers/bulkUpload', formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      showAlert('File uploaded successfully!', 'success');
      handleBulkUploadClose();
      // Refresh the mentee list
      if (handleSearch) {
        handleSearch([]);
      }
    } catch (error) {
      showAlert(error.response?.data?.error || 'Error uploading file', 'error');
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileUpload,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false
  });

  const handleBulkUploadOpen = () => {
    setBulkUploadDialog(true);
  };

  const handleBulkUploadClose = () => {
    setBulkUploadDialog(false);
    setUploadProgress(0);
    setUploading(false);
  };

  const handleBulkUploadClick = () => {
    setBulkUploadDialog(true);
  };

  const showAlert = (message, severity) => {
    setAlert({ open: true, message, severity });
    setTimeout(() => setAlert({ open: false, message: '', severity }), 3000);
  };

  const handleEditClick = (mentee) => {
    setSelectedMentee(mentee);
    setEditDialog(true);
  };

  const handleEditClose = () => {
    setSelectedMentee(null);
    setEditDialog(false);
  };

  const handleUpdate = () => {
    setConfirmDialog({ open: true, mentee: selectedMentee });
  };

  const handleConfirmClose = () => {
    setConfirmDialog({ open: false, mentee: null });
  };

  const handleConfirmUpdate = async () => {
    const mentee = confirmDialog.mentee;
    try {
      const response = await axios.patch('/api/admin/manageUsers/manageMentee', mentee);
      showAlert('Mentee updated successfully', 'success');
      setMentees(prevMentees => 
        prevMentees.map(mentee => 
          mentee.mujid === selectedMentee.mujid ? response.data : mentee
        )
      );
      handleEditClose();
    } catch (error) {
      showAlert(error.response?.data?.error || 'Error updating mentee', 'error');
    } finally {
      handleConfirmClose();
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedMentee(prev => ({
      ...prev,
      [name]: name === 'MUJid' ? value.toUpperCase() : value // Ensure MUJid is uppercase
    }));
  };

  const handleAssignClick = (mentee) => {
    setAssignmentDetails({
        ...assignmentDetails,
        mentee_MUJid: mentee.mujid
    });
    setAssignDialog(true);
  };

  const handleAssignClose = () => {
    setAssignDialog(false);
    setAssignmentDetails({
        mentor_MUJid: '',
        mentee_MUJid: '',
        session: '',
        semester: '', // Changed from current_semester to semester
        section: ''
    });
  };

  const handleAssignInputChange = (e) => {
    const { name, value } = e.target;
    setAssignmentDetails(prev => ({
        ...prev,
        [name]: value
    }));
  };

  const handleAssignSubmit = async () => {
    try {
        const response = await axios.post('/api/admin/manageUsers/assignMentor', assignmentDetails);
        showAlert('Mentor assigned successfully', 'success');
        handleAssignClose();
    } catch (error) {
        showAlert(error.response?.data?.error || 'Error assigning mentor', 'error');
    }
  };

  const theme = createTheme({
    palette: {
      primary: {
        main: '#f97316', // orange-500
      },
      secondary: {
        main: '#ea580c', // orange-600
      },
      background: {
        default: '#0a0a0a',
        paper: 'rgba(255, 255, 255, 0.05)',
      },
      text: {
        primary: '#ffffff',
        secondary: 'rgba(255, 255, 255, 0.7)',
      },
    },
  });

  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    sessionStorage.removeItem('menteeData'); // Clear session storage on mount
    setMounted(true);
  }, []);

  useEffect(() => {
    setIsFilterSelected(Boolean(academicYear || academicSession || semester || section));
  }, [academicYear, academicSession, semester, section]);

  useEffect(() => {
    // Try to get data from session storage on mount
    const storedData = sessionStorage.getItem('menteeData');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setMentees(parsedData);
      } catch (error) {
        console.error('Error parsing stored data:', error);
        sessionStorage.removeItem('menteeData');
      }
    }
    setMounted(true);
  }, []);

  const handleSearch = (data) => {
    setLoading(true);
    try {
      if (Array.isArray(data) && data.length > 0) {
        setMentees(data);
        setTableVisible(true); // Show table when we have data
        console.log('Updated mentees:', data);
      } else {
        setMentees([]);
        setTableVisible(false); // Hide table when no data
      }
    } catch (error) {
      console.error('Error handling search:', error);
      setMentees([]);
      setTableVisible(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchAll = (data) => {
    setLoading(true);
    try {
      if (Array.isArray(data) && data.length > 0) {
        setMentees(data);
        setTableVisible(true);
      } else {
        setMentees([]);
        setTableVisible(false);
      }
    } catch (error) {
      console.error('Error handling search all:', error);
      setMentees([]);
      setTableVisible(false);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setAcademicYear('');
    setAcademicSession('');
    setSemester('');
    setSection('');
    setMentees([]); // Clear mentees data
    setTableVisible(false);
    sessionStorage.removeItem('menteeData');
    setLoading(false); // Ensure loading state is set to false after reset
  };

  const handleDialogOpen = () => {
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'academicYear') {
      const sessions = generateAcademicSessions(value);
      setAcademicSessions(sessions);
      setMenteeDetails(prev => ({
        ...prev,
        [name]: value,
        academicSession: sessions[0] // Set first session by default
      }));
    } else if (name === 'academicSession') {
      setMenteeDetails(prev => ({
        ...prev,
        [name]: value,
        semester: '' // Reset semester when academic session changes
      }));
    } else if (name === 'MUJid') {
      setMenteeDetails(prev => ({
        ...prev,
        [name]: value.toUpperCase() // Ensure MUJid is uppercase
      }));
    } else {
      setMenteeDetails(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // this submits add new mentee dialogue box
  const handleFormSubmit = async () => {
    // Validate required fields
    const requiredFields = [
      'name',
      'email',
      'MUJid',
      'yearOfRegistration',
      'section',
      'semester',
      'academicYear', // Changed from AcademicYear
      'academicSession', // Changed from AcademicSession
      'mentorMujid'
    ];

    const missingFields = requiredFields.filter(field => !menteeDetails[field]);
    if (missingFields.length > 0) {
      showAlert(`Missing required fields: ${missingFields.join(', ')}`, 'error');
      return;
    }

    try {
      const response = await axios.post('/api/admin/manageUsers/manageMentee', menteeDetails);
      if (response.status === 201) {
        showAlert('Mentee added successfully', 'success');
        handleDialogClose();
        // Refresh the mentee list
        handleSearch();
      }
    } catch (error) {
      showAlert(error.response?.data?.error || 'Error adding mentee', 'error');
    }
  };

  const renderBulkUploadDialog = () => (
    <Dialog
      open={bulkUploadDialog}
      onClose={handleBulkUploadClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: {
        ...dialogStyles.paper,
        overflow: 'hidden'
      }}}
    >
      <DialogTitle sx={dialogStyles.title}>
        <Typography variant="h6" component="div" sx={{ color: '#f97316', fontWeight: 600 }}>
          Bulk Upload Mentees
        </Typography>
        <IconButton
          onClick={handleBulkUploadClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'rgba(255, 255, 255, 0.7)',
            '&:hover': { color: '#f97316' }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ ...dialogStyles.content, p: 0 }}>
        <Box
          {...getRootProps()}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            border: '2px dashed',
            borderColor: isDragActive ? '#f97316' : 'rgba(255, 255, 255, 0.2)',
            borderRadius: 2,
            bgcolor: isDragActive ? 'rgba(249, 115, 22, 0.1)' : 'transparent',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            '&:hover': {
              borderColor: '#f97316',
              bgcolor: 'rgba(249, 115, 22, 0.05)'
            }
          }}
        >
          <input {...getInputProps()} />
          <UploadFileIcon sx={{ fontSize: 48, color: '#f97316' }} />
          <Typography variant="h6" sx={{ color: 'white', textAlign: 'center' }}>
            {isDragActive
              ? 'Drop the Excel file here'
              : 'Drag & drop an Excel file here, or click to select'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center' }}>
            Supports .xls and .xlsx files only
          </Typography>
        </Box>
        {uploading && (
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" sx={{ color: 'white', mb: 1 }}>
              Uploading... {uploadProgress}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={uploadProgress}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: '#f97316'
                }
              }}
            />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );

  useEffect(() => {
    const updateSemesters = () => {
      setMentees(prevMentees => 
        prevMentees.map(mentee => ({
          ...mentee,
          semester: calculateCurrentSemester(mentee.yearOfRegistration)
        }))
      );
    };

    // Update initially
    updateSemesters();

    // Update every day at midnight
    const now = new Date();
    const night = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1, // tomorrow
      0, 0, 0 // midnight
    );
    const msToMidnight = night.getTime() - now.getTime();

    const timeout = setTimeout(() => {
      updateSemesters();
      // Then set up daily updates
      const interval = setInterval(updateSemesters, 24 * 60 * 60 * 1000);
      return () => clearInterval(interval);
    }, msToMidnight);

    return () => clearTimeout(timeout);
  }, []);

  const filterConfig = {
    academicYear,
    academicSession,
    semester,
    section,
    menteeMujid, // Add setter for menteeMujid
    mentorMujid  // Add setter for mentorMujid
  };

  const handleFilterChange = (name, value) => {
    const setters = {
      academicYear: setAcademicYear,
      academicSession: setAcademicSession,
      semester: setSemester,
      section: setSection,
      menteeMujid: setMenteeMujid, // Add setter for menteeMujid
      mentorMujid: setMentorMujid  // Add setter for mentorMujid
    };
    
    if (typeof setters[name] === 'function') {
      setters[name](value);
    } else {
      console.error(`No setter function found for filter: ${name}`);
    }
    
    setMentees([]); // Clear data when filter options change
  };

  // Add this common dialog styles object
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
        backgroundColor: '#1a1a1a', // Solid dark background instead of transparent
        // Remove backdropFilter
        borderRadius: '12px',
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: '#f97316',
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: '#f97316',
          borderWidth: '2px',
        },
        '&.Mui-disabled': {
          backgroundColor: 'rgba(255, 59, 48, 0.1)',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 59, 48, 0.3)',
          },
          '& input': {
            color: 'rgba(255, 59, 48, 0.7) !important', // Force red color for disabled input
            WebkitTextFillColor: 'rgba(255, 59, 48, 0.7) !important', // For Safari
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
        '&.Mui-disabled': {
          color: 'rgba(255, 59, 48, 0.7)',
        },
      },
      '& .MuiInputBase-input': {
        '&::placeholder': {
          color: 'rgba(255, 255, 255, 0.5)',
          opacity: 1,
        },
      },
      '& .MuiInputAdornment-root .MuiSvgIcon-root': {
        color: '#f97316',
      },
      '& .MuiIconButton-root': {
        color: '#f97316',
      },
    },
    actions: {
      p: 3,
      gap: 1,
      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    },
  };

  useEffect(() => {
    const currentAcadYear = getCurrentAcademicYear();
    const sessions = generateAcademicSessions(currentAcadYear);
    setAcademicSessions(sessions);
    setMenteeDetails(prev => ({
      ...prev,
      academicYear: currentAcadYear,
      academicSession: sessions[0]
    }));
  }, []);

  const [academicSessions, setAcademicSessions] = useState([]);

  if (!mounted) return null;

  return (
    <ThemeProvider theme={theme}>
      {/* Toast/Alert Container - Moved outside main content */}
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
        <div className="relative z-10 px-4 md:px-6 py-24 max-h-screen"> {/* Updated padding and added min-height */}
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10" // Added margin-bottom
          >
            <motion.h1 
              className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-pink-500 mb-5 !leading-snug" // Increased margin-bottom
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Mentee Management
            </motion.h1>
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
                onSearchAll={handleSearchAll}
                onAddNew={handleDialogOpen}
                onReset={handleReset}
                onBulkUpload={handleBulkUploadOpen}
                mentees={mentees} // Pass mentees data to FilterSection
              />
            </motion.div>

            {/* Table Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: tableVisible ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              style={{ 
                display: tableVisible ? 'block' : 'none',
                marginTop: '20px'
              }}
            >
              <Box sx={{ 
                overflowX: 'auto', 
                minHeight: '150px',
                maxHeight: 'calc(100vh - 400px)', // Limit maximum height
                overflowY: 'auto',
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '16px',
                padding: '16px',
                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                {loading ? (
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    height: '200px',
                  }}>
                    <CircularProgress sx={{ color: '#f97316' }} />
                  </Box>
                ) : (
                  <MenteeTable 
                    mentees={mentees}
                    onEditClick={handleEditClick}
                    isSmallScreen={isSmallScreen}
                  />
                )}
              </Box>
            </motion.div>

            {/* Show "No data" message when table is not visible */}
            {!tableVisible && !loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  height: '200px',
                  color: 'rgba(255, 255, 255, 0.5)',
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '16px',
                  margin: '20px 0'
                }}>
                  Use the filters above to search for mentees
                </Box>
              </motion.div>
            )}
          </motion.div>
        </div>

        <Dialog 
          open={openDialog} 
          onClose={handleDialogClose}
          maxWidth="lg" 
          fullWidth
          PaperProps={{ sx: dialogStyles.paper }}
        >
          <DialogTitle sx={dialogStyles.title}>
            <Typography variant="h6" component="div" sx={{ color: '#f97316', fontWeight: 600 }}>
              Add New Mentee
            </Typography>
            <IconButton
              aria-label="close"
              onClick={handleDialogClose}
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
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)', // Changed from 3 columns to 2
              gap: 3,
              minHeight: '40vh', // Reduced height since we have fewer fields
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
              {/* Essential Information */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="subtitle1" sx={{ color: '#f97316', fontWeight: 600 }}>
                  Student Information
                </Typography>
                <TextField
                  label="MUJid"
                  name="MUJid"         // Changed from mujid to MUJid
                  value={menteeDetails.MUJid}  // Changed from mujid to MUJid
                  onChange={handleInputChange}
                  required
                  inputProps={{
                    style: { textTransform: 'uppercase' }
                  }}
                  SelectProps={{
                    MenuProps: {
                      PaperProps: {
                        sx: {
                          bgcolor: '#1a1a1a', // Solid dark background
                          // Remove backdropFilter
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          '& .MuiMenuItem-root': {
                            color: 'white',
                            '&:hover': {
                              bgcolor: '#2a2a2a', // Darker solid color for hover
                            },
                            '&.Mui-selected': {
                              bgcolor: '#333333', // Even darker for selected
                              '&:hover': {
                                bgcolor: '#404040',
                              }
                            }
                          }
                        }
                      }
                    }
                  }}
                />
                <TextField
                  label="Name"
                  name="name"
                  value={menteeDetails.name}
                  onChange={handleInputChange}
                  required
                  SelectProps={{
                    MenuProps: {
                      PaperProps: {
                        sx: {
                          bgcolor: '#1a1a1a', // Solid dark background
                          // Remove backdropFilter
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          '& .MuiMenuItem-root': {
                            color: 'white',
                            '&:hover': {
                              bgcolor: '#2a2a2a', // Darker solid color for hover
                            },
                            '&.Mui-selected': {
                              bgcolor: '#333333', // Even darker for selected
                              '&:hover': {
                                bgcolor: '#404040',
                              }
                            }
                          }
                        }
                      }
                    }
                  }}
                />
                <TextField
                  label="College Email"
                  name="email"
                  type="email"
                  value={menteeDetails.email}
                  onChange={handleInputChange}
                  required
                  SelectProps={{
                    MenuProps: {
                      PaperProps: {
                        sx: {
                          bgcolor: '#1a1a1a', // Solid dark background
                          // Remove backdropFilter
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          '& .MuiMenuItem-root': {
                            color: 'white',
                            '&:hover': {
                              bgcolor: '#2a2a2a', // Darker solid color for hover
                            },
                            '&.Mui-selected': {
                              bgcolor: '#333333', // Even darker for selected
                              '&:hover': {
                                bgcolor: '#404040',
                              }
                            }
                          }
                        }
                      }
                    }
                  }}
                />
                <TextField
                  label="Phone"
                  name="phone"
                  value={menteeDetails.phone}
                  onChange={handleInputChange}
                  required
                  SelectProps={{
                    MenuProps: {
                      PaperProps: {
                        sx: {
                          bgcolor: '#1a1a1a', // Solid dark background
                          // Remove backdropFilter
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          '& .MuiMenuItem-root': {
                            color: 'white',
                            '&:hover': {
                              bgcolor: '#2a2a2a', // Darker solid color for hover
                            },
                            '&.Mui-selected': {
                              bgcolor: '#333333', // Even darker for selected
                              '&:hover': {
                                bgcolor: '#404040',
                              }
                            }
                          }
                        }
                      }
                    }
                  }}
                />
                <TextField
                  label="Year of Registration"
                  name="yearOfRegistration"
                  type="number"
                  value={menteeDetails.yearOfRegistration}
                  onChange={handleInputChange}
                  required
                  SelectProps={{
                    MenuProps: {
                      PaperProps: {
                        sx: {
                          bgcolor: '#1a1a1a', // Solid dark background
                          // Remove backdropFilter
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          '& .MuiMenuItem-root': {
                            color: 'white',
                            '&:hover': {
                              bgcolor: '#2a2a2a', // Darker solid color for hover
                            },
                            '&.Mui-selected': {
                              bgcolor: '#333333', // Even darker for selected
                              '&:hover': {
                                bgcolor: '#404040',
                              }
                            }
                          }
                        }
                      }
                    }
                  }}
                />
                
              </Box>

              {/* Academic Information */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="subtitle1" sx={{ color: '#f97316', fontWeight: 600 }}>
                  Academic Information
                </Typography>
                <TextField
                  label="Academic Year"
                  name="academicYear"
                  select
                  value={menteeDetails.academicYear}
                  onChange={handleInputChange}
                  required
                  SelectProps={{
                    MenuProps: {
                      PaperProps: {
                        sx: {
                          bgcolor: '#1a1a1a', // Solid dark background
                          // Remove backdropFilter
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          '& .MuiMenuItem-root': {
                            color: 'white',
                            '&:hover': {
                              bgcolor: '#2a2a2a', // Darker solid color for hover
                            },
                            '&.Mui-selected': {
                              bgcolor: '#333333', // Even darker for selected
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
                  value={menteeDetails.academicSession || ''}
                  onChange={handleInputChange}
                  disabled={!menteeDetails.academicYear}
                  required
                  SelectProps={{
                    MenuProps: {
                      PaperProps: {
                        sx: {
                          bgcolor: '#1a1a1a', // Solid dark background
                          // Remove backdropFilter
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          '& .MuiMenuItem-root': {
                            color: 'white',
                            '&:hover': {
                              bgcolor: '#2a2a2a', // Darker solid color for hover
                            },
                            '&.Mui-selected': {
                              bgcolor: '#333333', // Even darker for selected
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
                  {academicSessions.map(session => (
                    <MenuItem key={session} value={session}>{session}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Semester"
                  name="semester"
                  value={menteeDetails.semester || ''}
                  onChange={handleInputChange}
                  required
                  SelectProps={{
                    MenuProps: {
                      PaperProps: {
                        sx: {
                          bgcolor: '#1a1a1a', // Solid dark background
                          // Remove backdropFilter
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          '& .MuiMenuItem-root': {
                            color: 'white',
                            '&:hover': {
                              bgcolor: '#2a2a2a', // Darker solid color for hover
                            },
                            '&.Mui-selected': {
                              bgcolor: '#333333', // Even darker for selected
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
                  <MenuItem value="">Select Semester</MenuItem>
                  {generateSemesterOptions(menteeDetails.academicSession).map((sem) => (
                    <MenuItem key={sem} value={sem}>
                      Semester {sem}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Section"
                  name="section"
                  value={menteeDetails.section}
                  onChange={handleInputChange}
                  required
                  inputProps={{
                    maxLength: 1,
                    pattern: "[A-Z]",
                    style: { textTransform: 'uppercase' }
                  }}
                  helperText="Enter a single capital letter (A-Z)"
                  SelectProps={{
                    MenuProps: {
                      PaperProps: {
                        sx: {
                          bgcolor: '#1a1a1a', // Solid dark background
                          // Remove backdropFilter
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          '& .MuiMenuItem-root': {
                            color: 'white',
                            '&:hover': {
                              bgcolor: '#2a2a2a', // Darker solid color for hover
                            },
                            '&.Mui-selected': {
                              bgcolor: '#333333', // Even darker for selected
                              '&:hover': {
                                bgcolor: '#404040',
                              }
                            }
                          }
                        }
                      }
                    }
                  }}
                />
                <TextField
                  label="Mentor MUJid"
                  name="mentorMujid"
                  value={menteeDetails.mentorMujid}
                  onChange={handleInputChange}
                  required
                  SelectProps={{
                    MenuProps: {
                      PaperProps: {
                        sx: {
                          bgcolor: '#1a1a1a', // Solid dark background
                          // Remove backdropFilter
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          '& .MuiMenuItem-root': {
                            color: 'white',
                            '&:hover': {
                              bgcolor: '#2a2a2a', // Darker solid color for hover
                            },
                            '&.Mui-selected': {
                              bgcolor: '#333333', // Even darker for selected
                              '&:hover': {
                                bgcolor: '#404040',
                              }
                            }
                          }
                        }
                      }
                    }
                  }}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={dialogStyles.actions}>
            <Button 
              onClick={handleDialogClose}
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
              onClick={handleFormSubmit}
              variant="contained"
              sx={{
                bgcolor: '#f97316',
                '&:hover': {
                  bgcolor: '#ea580c',
                },
              }}
            >
              Add Mentee
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog 
          open={editDialog} 
          onClose={handleEditClose}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: dialogStyles.paper }}
        >
          <DialogTitle sx={dialogStyles.title}>
            <Typography variant="h6" component="div" sx={{ color: '#f97316', fontWeight: 600 }}>
              Edit Mentee Details
            </Typography>
            <IconButton
              aria-label="close"
              onClick={handleEditClose}
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
              flexDirection: 'column', 
              gap: 2,
              '& .MuiTextField-root': dialogStyles.textField,
            }}>
              {selectedMentee && (
                <>
                  <TextField
                    label="MUJid"
                    name="MUJid"
                    value={selectedMentee.MUJid}
                    onChange={handleEditInputChange}
                    required
                    disabled
                    inputProps={{
                      style: { textTransform: 'uppercase' }
                    }}
                    helperText="MUJid cannot be changed"
                    SelectProps={{
                      MenuProps: {
                        PaperProps: {
                          sx: {
                            bgcolor: '#1a1a1a', // Solid dark background
                            // Remove backdropFilter
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            '& .MuiMenuItem-root': {
                              color: 'white',
                              '&:hover': {
                                bgcolor: '#2a2a2a', // Darker solid color for hover
                              },
                              '&.Mui-selected': {
                                bgcolor: '#333333', // Even darker for selected
                                '&:hover': {
                                  bgcolor: '#404040',
                                }
                              }
                            }
                          }
                        }
                      }
                    }}
                  />
                  <TextField
                    label="Year of Registration"
                    name="yearOfRegistration"
                    type="number"
                    value={selectedMentee.yearOfRegistration}
                    onChange={handleEditInputChange}
                    SelectProps={{
                      MenuProps: {
                        PaperProps: {
                          sx: {
                            bgcolor: '#1a1a1a', // Solid dark background
                            // Remove backdropFilter
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            '& .MuiMenuItem-root': {
                              color: 'white',
                              '&:hover': {
                                bgcolor: '#2a2a2a', // Darker solid color for hover
                              },
                              '&.Mui-selected': {
                                bgcolor: '#333333', // Even darker for selected
                                '&:hover': {
                                  bgcolor: '#404040',
                                }
                              }
                            }
                          }
                        }
                      }
                    }}
                  />
                  <TextField
                    label="Name"
                    name="name"
                    value={selectedMentee.name}
                    onChange={handleEditInputChange}
                    SelectProps={{
                      MenuProps: {
                        PaperProps: {
                          sx: {
                            bgcolor: '#1a1a1a', // Solid dark background
                            // Remove backdropFilter
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            '& .MuiMenuItem-root': {
                              color: 'white',
                              '&:hover': {
                                bgcolor: '#2a2a2a', // Darker solid color for hover
                              },
                              '&.Mui-selected': {
                                bgcolor: '#333333', // Even darker for selected
                                '&:hover': {
                                  bgcolor: '#404040',
                                }
                              }
                            }
                          }
                        }
                      }
                    }}
                  />
                  <TextField
                    label="Email"
                    name="email"
                    type="email"
                    value={selectedMentee.email}
                    onChange={handleEditInputChange}
                    SelectProps={{
                      MenuProps: {
                        PaperProps: {
                          sx: {
                            bgcolor: '#1a1a1a', // Solid dark background
                            // Remove backdropFilter
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            '& .MuiMenuItem-root': {
                              color: 'white',
                              '&:hover': {
                                bgcolor: '#2a2a2a', // Darker solid color for hover
                              },
                              '&.Mui-selected': {
                                bgcolor: '#333333', // Even darker for selected
                                '&:hover': {
                                  bgcolor: '#404040',
                                }
                              }
                            }
                          }
                        }
                      }
                    }}
                  />
                  <TextField
                    label="Phone"
                    name="phone"
                    value={selectedMentee.phone}
                    onChange={handleEditInputChange}
                    SelectProps={{
                      MenuProps: {
                        PaperProps: {
                          sx: {
                            bgcolor: '#1a1a1a', // Solid dark background
                            // Remove backdropFilter
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            '& .MuiMenuItem-root': {
                              color: 'white',
                              '&:hover': {
                                bgcolor: '#2a2a2a', // Darker solid color for hover
                              },
                              '&.Mui-selected': {
                                bgcolor: '#333333', // Even darker for selected
                                '&:hover': {
                                  bgcolor: '#404040',
                                }
                              }
                            }
                          }
                        }
                      }
                    }}
                  />
                  <TextField
                    label="Father's Name"
                    name="fatherName"
                    value={selectedMentee.fatherName}
                    onChange={handleEditInputChange}
                    SelectProps={{
                      MenuProps: {
                        PaperProps: {
                          sx: {
                            bgcolor: '#1a1a1a', // Solid dark background
                            // Remove backdropFilter
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            '& .MuiMenuItem-root': {
                              color: 'white',
                              '&:hover': {
                                bgcolor: '#2a2a2a', // Darker solid color for hover
                              },
                              '&.Mui-selected': {
                                bgcolor: '#333333', // Even darker for selected
                                '&:hover': {
                                  bgcolor: '#404040',
                                }
                              }
                            }
                          }
                        }
                      }
                    }}
                  />
                  <TextField
                    label="Mother's Name"
                    name="motherName"
                    value={selectedMentee.motherName}
                    onChange={handleEditInputChange}
                    SelectProps={{
                      MenuProps: {
                        PaperProps: {
                          sx: {
                            bgcolor: '#1a1a1a', // Solid dark background
                            // Remove backdropFilter
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            '& .MuiMenuItem-root': {
                              color: 'white',
                              '&:hover': {
                                bgcolor: '#2a2a2a', // Darker solid color for hover
                              },
                              '&.Mui-selected': {
                                bgcolor: '#333333', // Even darker for selected
                                '&:hover': {
                                  bgcolor: '#404040',
                                }
                              }
                            }
                          }
                        }
                      }
                    }}
                  />
                  <TextField
                    label="Date of Birth"
                    name="dateOfBirth"
                    type="date"
                    value={selectedMentee.dateOfBirth}
                    onChange={handleEditInputChange}
                    InputLabelProps={{ shrink: true }}
                    SelectProps={{
                      MenuProps: {
                        PaperProps: {
                          sx: {
                            bgcolor: '#1a1a1a', // Solid dark background
                            // Remove backdropFilter
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            '& .MuiMenuItem-root': {
                              color: 'white',
                              '&:hover': {
                                bgcolor: '#2a2a2a', // Darker solid color for hover
                              },
                              '&.Mui-selected': {
                                bgcolor: '#333333', // Even darker for selected
                                '&:hover': {
                                  bgcolor: '#404040',
                                }
                              }
                            }
                          }
                        }
                      }
                    }}
                  />
                  <TextField
                    label="Parents' Phone"
                    name="parentsPhone"
                    value={selectedMentee.parentsPhone}
                    onChange={handleEditInputChange}
                    SelectProps={{
                      MenuProps: {
                        PaperProps: {
                          sx: {
                            bgcolor: '#1a1a1a', // Solid dark background
                            // Remove backdropFilter
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            '& .MuiMenuItem-root': {
                              color: 'white',
                              '&:hover': {
                                bgcolor: '#2a2a2a', // Darker solid color for hover
                              },
                              '&.Mui-selected': {
                                bgcolor: '#333333', // Even darker for selected
                                '&:hover': {
                                  bgcolor: '#404040',
                                }
                              }
                            }
                          }
                        }
                      }
                    }}
                  />
                  <TextField
                    label="Parents' Email"
                    name="parentsEmail"
                    type="email"
                    value={selectedMentee.parentsEmail}
                    onChange={handleEditInputChange}
                    SelectProps={{
                      MenuProps: {
                        PaperProps: {
                          sx: {
                            bgcolor: '#1a1a1a', // Solid dark background
                            // Remove backdropFilter
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            '& .MuiMenuItem-root': {
                              color: 'white',
                              '&:hover': {
                                bgcolor: '#2a2a2a', // Darker solid color for hover
                              },
                              '&.Mui-selected': {
                                bgcolor: '#333333', // Even darker for selected
                                '&:hover': {
                                  bgcolor: '#404040',
                                }
                              }
                            }
                          }
                        }
                      }
                    }}
                  />
                  <TextField
                    label="Mentor Mujid"
                    name="mentorMujid"
                    value={selectedMentee.mentorMujid}
                    onChange={handleEditInputChange}
                    SelectProps={{
                      MenuProps: {
                        PaperProps: {
                          sx: {
                            bgcolor: '#1a1a1a', // Solid dark background
                            // Remove backdropFilter
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            '& .MuiMenuItem-root': {
                              color: 'white',
                              '&:hover': {
                                bgcolor: '#2a2a2a', // Darker solid color for hover
                              },
                              '&.Mui-selected': {
                                bgcolor: '#333333', // Even darker for selected
                                '&:hover': {
                                  bgcolor: '#404040',
                                }
                              }
                            }
                          }
                        }
                      }
                    }}
                  />
                </>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={dialogStyles.actions}>
            <Button 
              onClick={handleEditClose}
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
              onClick={handleUpdate}
              variant="contained"
              sx={{
                bgcolor: '#f97316',
                '&:hover': {
                  bgcolor: '#ea580c',
                },
              }}
            >
              Update
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog 
          open={assignDialog} 
          onClose={handleAssignClose}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: dialogStyles.paper }}
        >
          <DialogTitle sx={dialogStyles.title}>
            <Typography variant="h6" component="div" sx={{ color: '#f97316', fontWeight: 600 }}>
              Assign Mentor
            </Typography>
            <IconButton
              aria-label="close"
              onClick={handleAssignClose}
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
              flexDirection: 'column', 
              gap: 2,
              '& .MuiTextField-root': dialogStyles.textField,
            }}>
              <TextField
                label="Mentor MUJid"
                name="mentor_MUJid"
                value={assignmentDetails.mentor_MUJid}
                onChange={handleAssignInputChange}
                required
                SelectProps={{
                  MenuProps: {
                    PaperProps: {
                      sx: {
                        bgcolor: '#1a1a1a', // Solid dark background
                        // Remove backdropFilter
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        '& .MuiMenuItem-root': {
                          color: 'white',
                          '&:hover': {
                            bgcolor: '#2a2a2a', // Darker solid color for hover
                          },
                          '&.Mui-selected': {
                            bgcolor: '#333333', // Even darker for selected
                            '&:hover': {
                              bgcolor: '#404040',
                            }
                          }
                        }
                      }
                    }
                  }
                }}
              />
              <TextField
                label="Session"
                name="session"
                value={assignmentDetails.session}
                onChange={handleAssignInputChange}
                required
                SelectProps={{
                  MenuProps: {
                    PaperProps: {
                      sx: {
                        bgcolor: '#1a1a1a', // Solid dark background
                        // Remove backdropFilter
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        '& .MuiMenuItem-root': {
                          color: 'white',
                          '&:hover': {
                            bgcolor: '#2a2a2a', // Darker solid color for hover
                          },
                          '&.Mui-selected': {
                            bgcolor: '#333333', // Even darker for selected
                            '&:hover': {
                              bgcolor: '#404040',
                            }
                          }
                        }
                      }
                    }
                  }
                }}
              />
              <TextField
                label="Semester" // Changed from Current Semester to Semester
                name="semester" // Changed from current_semester to semester
                type="number"
                value={assignmentDetails.semester} // Changed from current_semester to semester
                onChange={handleAssignInputChange}
                required
                SelectProps={{
                  MenuProps: {
                    PaperProps: {
                      sx: {
                        bgcolor: '#1a1a1a', // Solid dark background
                        // Remove backdropFilter
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        '& .MuiMenuItem-root': {
                          color: 'white',
                          '&:hover': {
                            bgcolor: '#2a2a2a', // Darker solid color for hover
                          },
                          '&.Mui-selected': {
                            bgcolor: '#333333', // Even darker for selected
                            '&:hover': {
                              bgcolor: '#404040',
                            }
                          }
                        }
                      }
                    }
                  }
                }}
              />
              <TextField
                select
                label="Section"
                name="section"
                value={assignmentDetails.section}
                onChange={handleAssignInputChange}
                required
                SelectProps={{
                  MenuProps: {
                    PaperProps: {
                      sx: {
                        bgcolor: '#1a1a1a', // Solid dark background
                        // Remove backdropFilter
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        '& .MuiMenuItem-root': {
                          color: 'white',
                          '&:hover': {
                            bgcolor: '#2a2a2a', // Darker solid color for hover
                          },
                          '&.Mui-selected': {
                            bgcolor: '#333333', // Even darker for selected
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
                <MenuItem value="">Select Section</MenuItem>
                <MenuItem value="A">A</MenuItem>
                <MenuItem value="B">B</MenuItem>
                <MenuItem value="C">C</MenuItem>
                <MenuItem value="D">D</MenuItem>
                <MenuItem value="E">E</MenuItem>
              </TextField>
            </Box>
          </DialogContent>
          <DialogActions sx={dialogStyles.actions}>
            <Button 
              onClick={handleAssignClose}
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
              onClick={handleAssignSubmit}
              variant="contained"
              sx={{
                bgcolor: '#f97316',
                '&:hover': {
                  bgcolor: '#ea580c',
                },
              }}
            >
              Assign
            </Button>
          </DialogActions>
        </Dialog>

              <Dialog 
                open={confirmDialog.open}           
                onClose={handleConfirmClose}          
                PaperProps={{           
                   style: {              
                    background: 'rgba(0, 0, 0, 0.8)',              
                    backdropFilter: 'blur(10px)',              
                    border: '1px solid rgba(255, 255, 255, 0.1)',              
                    borderRadius: '1rem',            
                  },          
                }}>          
                <DialogTitle>Confirm Update</DialogTitle>          
                <DialogContent>            
                  Are you sure you want to update this mentee&apos;s data? This action is non-reversible.          
                </DialogContent>          
                <DialogActions>            
                  <Button onClick={handleConfirmClose} color="primary">              
                    Cancel            
                  </Button>            
                  <Button onClick={handleConfirmUpdate} color="secondary">              
                    Confirm            
                  </Button>          
                </DialogActions>        
              </Dialog>        
              {renderBulkUploadDialog()}        
              {/* Toast notifications */}        
              <Toaster position="top-right" />      
            </div>    
          </ThemeProvider>  
        );};

          export default MenteeManagement;