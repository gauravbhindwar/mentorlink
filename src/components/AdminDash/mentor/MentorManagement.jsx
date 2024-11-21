'use client';
import { useState, useEffect, useRef } from 'react';
import { Box, Typography, Button, useMediaQuery, IconButton, TextField, Dialog, DialogTitle, DialogContent, DialogActions,  LinearProgress, MenuItem, Divider, List, ListItem, ListItemText, CircularProgress, Grid } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useDropzone } from 'react-dropzone';
import MentorTable from './MentorTable';
import FilterSection from './MentorFilterSection';
import { Toaster ,toast} from 'react-hot-toast';
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

  // Update dialogStyles object
  const dialogStyles = {
    paper: {
      background: 'linear-gradient(145deg, #1a1a1a 0%, #2d1a12 100%)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(249, 115, 22, 0.2)',
      borderRadius: '1.5rem',
      boxShadow: '0 8px 32px rgba(249, 115, 22, 0.1)',
      color: 'white',
      minWidth: '80vw',
      maxWidth: '1200px',
      maxHeight: '90vh',
    },
    title: {
      borderBottom: '1px solid rgba(249, 115, 22, 0.2)',
      background: 'linear-gradient(90deg, rgba(249, 115, 22, 0.1) 0%, rgba(0, 0, 0, 0) 100%)',
      px: 4,
      py: 3,
    },
    content: {
      px: 4,
      py: 3,
    },
    textField: {
      '& .MuiOutlinedInput-root': {
        color: 'white',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 20px rgba(249, 115, 22, 0.15)',
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: '#f97316',
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: '#f97316',
          borderWidth: '2px',
        },
      },
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: 'rgba(249, 115, 22, 0.3)',
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
        },
      },
    },
    actions: {
      p: 4,
      gap: 2,
      borderTop: '1px solid rgba(249, 115, 22, 0.2)',
      background: 'linear-gradient(90deg, rgba(249, 115, 22, 0.1) 0%, rgba(0, 0, 0, 0) 100%)',
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
        type: 'mentor'
      });

      if (response.data && response.status === 201) {
        showAlert('Mentors uploaded successfully!', 'success');
        setShowPreview(false);
        handleBulkUploadClose();
        await fetchMentors(); // Await the fetch
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Error uploading mentors';
      showAlert(errorMessage, 'error');
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

  const validateForm = () => {
    const errors = [];
    if (!mentorDetails.MUJid) errors.push('MUJid is required');
    if (!mentorDetails.name) errors.push('Name is required');
    if (!mentorDetails.email) errors.push('Email is required');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mentorDetails.email)) errors.push('Invalid email format');
    if (!mentorDetails.phone_number) errors.push('Phone number is required');
    if (!mentorDetails.academicYear) errors.push('Academic year is required');
    if (!mentorDetails.academicSession) errors.push('Academic session is required');
    return errors;
  };

  // Add these new state variables after other state declarations
  const [duplicateMentorDialog, setDuplicateMentorDialog] = useState(false);
  const [existingMentorData, setExistingMentorData] = useState({});
  const [fetchingMentorDetails, setFetchingMentorDetails] = useState(false);
  const [duplicateEditMode, setDuplicateEditMode] = useState(false);

  // Add this new function to fetch mentor details
  const fetchMentorDetails = async (MUJid) => {
    if (!MUJid) {
      console.error('MUJid is undefined');
      toast.error('Invalid MUJid', {
        style: toastStyles.error.style,
        iconTheme: toastStyles.error.iconTheme,
      });
      return;
    }
    
    setFetchingMentorDetails(true);
    try {
      const response = await axios.get(`/api/admin/manageUsers/manageMentor/${MUJid}`);
      if (response.data && response.data.mentor) {
        setExistingMentorData(response.data.mentor);
        // Pre-fill the mentorDetails with existing data for editing
        setMentorDetails({
          ...response.data.mentor,
          // Ensure all required fields are present
          role: response.data.mentor.role || ['mentor'],
          academicYear: response.data.mentor.academicYear || getCurrentAcademicYear(),
          academicSession: response.data.mentor.academicSession || generateAcademicSessions(getCurrentAcademicYear())[0]
        });
      } else {
        throw new Error('No mentor data received');
      }
    } catch (error) {
      console.error('Error fetching mentor:', error);
      toast.error(error.response?.data?.error || 'Error fetching mentor details', {
        style: toastStyles.error.style,
        iconTheme: toastStyles.error.iconTheme,
      });
      setDuplicateMentorDialog(false); // Close dialog on error
    } finally {
      setFetchingMentorDetails(false);
    }
  };

  // Replace the handleAddMentor function
  const handleAddMentor = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      toast.error(errors.join(', '), {
        style: toastStyles.error.style,
        iconTheme: toastStyles.error.iconTheme,
      });
      return;
    }
  
    try {
      const response = await axios.post('/api/admin/manageUsers/manageMentor', mentorDetails);
      
      if (response.data && response.status === 201) {
        toast.success('Mentor added successfully', {
          style: toastStyles.success.style,
          iconTheme: toastStyles.success.iconTheme,
        });
        setOpenDialog(false);
        await fetchMentors();
        resetMentorDetails();
      }
    } catch (error) {
      if (error.response?.status === 409 && error.response.data?.existingMentor) {
        const duplicateData = error.response.data.existingMentor;
        
        // Verify data before setting
        if (duplicateData && duplicateData.MUJid) {
          setExistingMentorData(duplicateData);
          setDuplicateMentorDialog(true);
          setOpenDialog(false);
        } else {
          toast.error('Duplicate entry found but details are incomplete', {
            style: toastStyles.error.style,
            iconTheme: toastStyles.error.iconTheme,
          });
        }
      } else {
        toast.error(error.response?.data?.error || 'Error adding mentor', {
          style: toastStyles.error.style,
          iconTheme: toastStyles.error.iconTheme,
        });
      }
    }
  };

  // Add a reset function for mentor details
  const resetMentorDetails = () => {
    setMentorDetails({
      name: '',
      email: '',
      MUJid: '',
      phone_number: '',
      address: '',
      gender: '',
      profile_picture: '',
      role: ['mentor'],
      academicYear: getCurrentAcademicYear(),
      academicSession: generateAcademicSessions(getCurrentAcademicYear())[0]
    });
  };

  // Add this new function to handle using existing data
  const handleUseExistingData = () => {
    if (existingMentorData && Object.keys(existingMentorData).length > 0) {
      setSelectedMentor(existingMentorData);
      setEditDialog(true);
      setDuplicateMentorDialog(false);
    } else {
      toast.error('No existing mentor data available', {
        style: toastStyles.error.style,
        iconTheme: toastStyles.error.iconTheme,
      });
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

  const toastStyles = {
    success: {
      style: {
        background: '#10B981',
        color: '#fff',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#10B981',
      },
    },
    error: {
      style: {
        background: '#EF4444',
        color: '#fff',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#EF4444',
      },
    },
  };

  const showAlert = (message, severity) => {
    const toastConfig = {
      style: toastStyles[severity].style,
      iconTheme: toastStyles[severity].iconTheme,
    };
    
    if (severity === 'success') {
      toast.success(message, toastConfig);
    } else {
      toast.error(message, toastConfig);
    }
  };

  const handleBulkUploadOpen = () => {
    setBulkUploadDialog(true);
  };

  // Add these new state variables
  const [yearSuggestions, setYearSuggestions] = useState([]);
  const [sessionSuggestions, setSessionSuggestions] = useState([]);
  const [showYearOptions, setShowYearOptions] = useState(false);
  const [showSessionOptions, setShowSessionOptions] = useState(false);
  const yearRef = useRef(null);
  const sessionRef = useRef(null);

  // Add these new helper functions
  const generateYearSuggestions = (input) => {
    if (!input) return [];
    const currentYear = new Date().getFullYear();
    const suggestions = [];
    for (let i = 0; i < 5; i++) {
      const year = currentYear - i;
      const academicYear = `${year}-${year + 1}`;
      if (academicYear.startsWith(input)) {
        suggestions.push(academicYear);
      }
    }
    return suggestions;
  };

  const handleAcademicYearInput = (e) => {
    let value = e.target.value.toUpperCase();
    
    if (value.length === 4 && !value.includes('-')) {
      value = `${value}-${parseInt(value) + 1}`;
    }
    
    if (value.length > 0) {
      setYearSuggestions(generateYearSuggestions(value));
      setShowYearOptions(true);
    } else {
      setYearSuggestions([]);
      setShowYearOptions(false);
    }

    setMentorDetails(prev => ({
      ...prev,
      academicYear: value
    }));
    
    if (validateAcademicYear(value)) {
      const sessions = generateAcademicSessions(value);
      setAcademicSessions(sessions);
      setMentorDetails(prev => ({
        ...prev,
        academicSession: sessions[0]
      }));
    }
  };

  const handleAcademicSessionInput = (e) => {
    let value = e.target.value.toUpperCase();
    
    if (value.startsWith('JUL')) {
      value = `JULY-DECEMBER ${mentorDetails.academicYear?.split('-')[0]}`;
    } else if (value.startsWith('JAN')) {
      value = `JANUARY-JUNE ${mentorDetails.academicYear?.split('-')[1]}`;
    }
    
    if (value.length > 0) {
      setSessionSuggestions(generateAcademicSessions(mentorDetails.academicYear));
      setShowSessionOptions(true);
    } else {
      setSessionSuggestions([]);
      setShowSessionOptions(false);
    }
    
    setMentorDetails(prev => ({
      ...prev,
      academicSession: value
    }));
  };

  const validateAcademicYear = (value) => {
    if (!value) return false;
    const regex = /^(\d{4})-(\d{4})$/;
    if (!regex.test(value)) return false;
    const [startYear, endYear] = value.split('-').map(Number);
    return endYear === startYear + 1;
  };

  const fetchMentors = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/manageUsers/manageMentor');
      if (response.data && response.data.mentors) {
        setMentors(response.data.mentors);
        setTableVisible(true);
      }
    } catch (error) {
      showAlert('Error fetching mentors', 'error');
      setMentors([]);
      setTableVisible(false);
    } finally {
      setLoading(false);
    }
  };

  // Add this new function to handle patch update
  const handlePatchUpdate = async () => {
    if (!existingMentorData?.MUJid) {
      toast.error('Invalid mentor data', {
        style: toastStyles.error.style,
        iconTheme: toastStyles.error.iconTheme,
      });
      return;
    }
  
    try {
      const response = await axios.patch(
        `/api/admin/manageUsers/manageMentor/${existingMentorData.MUJid}`, 
        mentorDetails
      );
      
      if (response.data) {
        toast.success('Mentor updated successfully', {
          style: toastStyles.success.style,
          iconTheme: toastStyles.success.iconTheme,
        });
        setDuplicateMentorDialog(false);
        setDuplicateEditMode(false);
        await fetchMentors();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error updating mentor', {
        style: toastStyles.error.style,
        iconTheme: toastStyles.error.iconTheme,
      });
    }
  };

  return (
    <ThemeProvider theme={theme}>
      {/* Toast/Alert Container - Updated positioning and styling */}
      <div className="fixed top-[100px] left-1/2 transform -translate-x-1/2 z-[9999] w-full max-w-md">
        <Toaster 
          position="top-center"
          reverseOrder={false}
          gutter={8}
          toastOptions={{
            duration: 3000,
            success: toastStyles.success,
            error: toastStyles.error,
          }}
        />
      </div>

      {/* Replace the Snackbar component with a simpler success/error message */}
      {alert.open && (
        <div
          className={`fixed top-[100px] left-1/2 transform -translate-x-1/2 z-[9999] w-full max-w-md p-4 rounded-lg shadow-lg ${
            alert.severity === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
          role="alert"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-white font-medium">
                {alert.message}
              </span>
            </div>
            <button
              onClick={() => setAlert({ ...alert, open: false })}
              className="text-white opacity-70 hover:opacity-100"
            >
              <CloseIcon fontSize="small" />
            </button>
          </div>
        </div>
      )}

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
              display: 'grid',
              gridTemplateColumns: '2fr 1px 1fr',
              gap: 4,
              minHeight: '60vh',
            }}>
              {/* Left side - Form */}
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 3,
                overflowY: 'auto',
                pr: 2,
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'rgba(249, 115, 22, 0.1)',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(249, 115, 22, 0.5)',
                  borderRadius: '4px',
                  '&:hover': {
                    background: '#f97316',
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
                  sx={{ gridColumn: '1 / -1' }}
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
                  value={mentorDetails.academicYear}
                  onChange={handleAcademicYearInput}
                  required
                  inputRef={yearRef}
                  onFocus={() => setShowYearOptions(true)}
                  onBlur={() => setTimeout(() => setShowYearOptions(false), 100)}
                />
                {showYearOptions && yearSuggestions.length > 0 && (
                  <List
                    sx={{
                      position: 'absolute',
                      zIndex: 10,
                      width: '100%',
                      bgcolor: 'rgba(17, 17, 17, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '0.5rem',
                      mt: 1,
                      maxHeight: '200px',
                      overflowY: 'auto',
                      '& .MuiListItem-root': {
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 0.1)',
                        },
                      },
                    }}
                  >
                    {yearSuggestions.map((suggestion, index) => (
                      <ListItem
                        key={index}
                        onClick={() => {
                          setMentorDetails(prev => ({
                            ...prev,
                            academicYear: suggestion
                          }));
                          setShowYearOptions(false);
                        }}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                          }
                        }}
                      >
                        <ListItemText primary={suggestion} />
                      </ListItem>
                    ))}
                  </List>
                )}
                <TextField
                  label="Academic Session"
                  name="academicSession"
                  value={mentorDetails.academicSession}
                  onChange={handleAcademicSessionInput}
                  required
                  inputRef={sessionRef}
                  onFocus={() => setShowSessionOptions(true)}
                  onBlur={() => setTimeout(() => setShowSessionOptions(false), 100)}
                />
                {showSessionOptions && sessionSuggestions.length > 0 && (
                  <List
                    sx={{
                      position: 'absolute',
                      zIndex: 10,
                      width: '100%',
                      bgcolor: 'rgba(17, 17, 17, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '0.5rem',
                      mt: 1,
                      maxHeight: '200px',
                      overflowY: 'auto',
                      '& .MuiListItem-root': {
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 0.1)',
                        },
                      },
                    }}
                  >
                    {sessionSuggestions.map((suggestion, index) => (
                      <ListItem
                        key={index}
                        onClick={() => {
                          setMentorDetails(prev => ({
                            ...prev,
                            academicSession: suggestion
                          }));
                          setShowSessionOptions(false);
                        }}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                          }
                        }}
                      >
                        <ListItemText primary={suggestion} />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>

              {/* Divider with gradient */}
              <Divider orientation="vertical" flexItem sx={{ 
                borderColor: 'rgba(249, 115, 22, 0.2)',
                background: 'linear-gradient(180deg, rgba(249, 115, 22, 0.1) 0%, rgba(249, 115, 22, 0.05) 100%)',
                width: '1px',
              }} />

              {/* Right side - Upload */}
              <Box 
                {...getRootProps()} 
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: 4,
                  border: '2px dashed',
                  borderColor: 'rgba(249, 115, 22, 0.3)',
                  borderRadius: '1rem',
                  background: 'linear-gradient(145deg, rgba(249, 115, 22, 0.05) 0%, rgba(0, 0, 0, 0) 100%)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    borderColor: '#f97316',
                    boxShadow: '0 8px 32px rgba(249, 115, 22, 0.15)',
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

        {/* Duplicate Mentor Dialog */}
        <Dialog
          open={duplicateMentorDialog}
          onClose={() => {
            setDuplicateMentorDialog(false);
            setDuplicateEditMode(false);
          }}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: dialogStyles.paper }}
        >
          <DialogTitle sx={{
            ...dialogStyles.title,
            borderBottom: '1px solid rgba(249, 115, 22, 0.2)',
          }}>
            <Typography variant="h6" component="div" sx={{ color: '#f97316', fontWeight: 600 }}>
              {duplicateEditMode ? 'Edit Existing Mentor' : 'Mentor Already Exists'}
            </Typography>
            <IconButton
              aria-label="close"
              onClick={() => {
                setDuplicateMentorDialog(false);
                setDuplicateEditMode(false);
              }}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: 'rgba(255, 255, 255, 0.7)',
                '&:hover': { color: '#f97316' },
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{
            ...dialogStyles.content,
            my: 2,
          }}>
            {fetchingMentorDetails ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                <CircularProgress sx={{ color: '#f97316' }} />
              </Box>
            ) : duplicateEditMode ? (
              // Edit form for duplicate mentor
              <Box sx={{ color: 'white' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Name"
                      name="name"
                      value={mentorDetails.name}
                      onChange={handleInputChange}
                      sx={dialogStyles.textField}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      type="email"
                      value={mentorDetails.email}
                      onChange={handleInputChange}
                      sx={dialogStyles.textField}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      name="phone_number"
                      value={mentorDetails.phone_number}
                      onChange={handleInputChange}
                      sx={dialogStyles.textField}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      select
                      label="Gender"
                      name="gender"
                      value={mentorDetails.gender}
                      onChange={handleInputChange}
                      sx={dialogStyles.textField}
                    >
                      <MenuItem value="male">Male</MenuItem>
                      <MenuItem value="female">Female</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>
              </Box>
            ) : (
              // Existing mentor details view
              <Box sx={{ color: 'white' }}>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  A mentor with these details already exists:
                </Typography>
                <Box sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  p: 3,
                  borderRadius: 2,
                  border: '1px solid rgba(249, 115, 22, 0.2)',
                }}>
                  {/* Only render fields that exist in existingMentorData */}
                  {Object.entries(existingMentorData).map(([key, value]) => {
                    if (value && key !== '_id') {
                      return (
                        <Typography key={key} variant="body2" sx={{ mb: 1 }}>
                          <strong>{key}:</strong> {Array.isArray(value) ? value.join(', ') : value}
                        </Typography>
                      );
                    }
                    return null;
                  })}
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{
            ...dialogStyles.actions,
            justifyContent: 'space-between',
            px: 3,
            py: 2,
          }}>
            <Button
              onClick={() => {
                setDuplicateMentorDialog(false);
                setDuplicateEditMode(false);
              }}
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
            {duplicateEditMode ? (
              <Button
                onClick={handlePatchUpdate}
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
            ) : (
              <Button
                onClick={() => setDuplicateEditMode(true)}
                variant="contained"
                sx={{
                  bgcolor: '#f97316',
                  '&:hover': {
                    bgcolor: '#ea580c',
                  },
                }}
              >
                Edit Details
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </div>
    </ThemeProvider>
  );
};

export default MentorManagement;