'use client';
import { useState, useEffect, useRef } from 'react';
import { Box, Typography, Button, useMediaQuery, IconButton, TextField, Dialog, DialogTitle, DialogContent, DialogActions, LinearProgress, MenuItem, Divider, List, ListItem, ListItemText } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import { useDropzone } from 'react-dropzone';
import MentorTable from './MentorTable';
import FilterSection from './MentorFilterSection';
import { Toaster, toast } from 'react-hot-toast';  // Add toast here
import { motion } from 'framer-motion';
import axios from 'axios';
import BulkUploadPreview from '../common/BulkUploadPreview';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [academicYear, setAcademicYear] = useState('');
  const [academicSession, setAcademicSession] = useState('');
  const [academicSessions, setAcademicSessions] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [fileUploadDialog, setFileUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState({ data: [], errors: [] });
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

  // Add sessionRef to existing refs and state declarations
  const yearRef = useRef(null);
  const sessionRef = useRef(null);  // Add this line
  
  // Add missing state declarations at the top with other state variables
  const [yearSuggestions, setYearSuggestions] = useState([]);

  // Update dialogStyles object with new gradients
  const dialogStyles = {
    paper: {
      background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '1rem',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      color: 'white',
      minWidth: '80vw',
      maxWidth: '1200px',
      maxHeight: '90vh',
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '100%',
        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(0, 0, 0, 0) 100%)',
        pointerEvents: 'none',
      }
    },
    title: {
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.05) 0%, rgba(0, 0, 0, 0) 100%)',
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
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(10px)',
        borderRadius: '8px',
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: 'rgba(255, 255, 255, 0.3)',
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: '#3b82f6',
          borderWidth: '2px',
        },
      },
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      '& .MuiInputLabel-root': {
        color: 'rgba(255, 255, 255, 0.7)',
        '&.Mui-focused': {
          color: '#3b82f6',
        },
      },
      '& .MuiInputBase-input': {
        '&::placeholder': {
          color: 'rgba(255, 255, 255, 0.3)',
        },
      },
    },
    actions: {
      p: 4,
      gap: 2,
      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      background: 'rgba(0, 0, 0, 0.2)',
    },
  };

  // Update uploadAnimationStyles with new gradients
  const uploadAnimationStyles = {
    dropzone: {
      position: 'relative',
      minHeight: '400px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      border: '2px dashed rgba(251, 146, 60, 0.3)',
      borderRadius: '16px',
      background: 'linear-gradient(145deg, rgba(28, 25, 23, 0.8) 0%, rgba(67, 20, 7, 0.8) 100%)',
      backdropFilter: 'blur(10px)',
      transition: 'all 0.3s ease-in-out',
      overflow: 'hidden',
      '&:hover': {
        borderColor: '#fb923c',
        transform: 'translateY(-5px)',
        boxShadow: '0 20px 40px rgba(251, 146, 60, 0.2)',
      },
      '&::before': {
        content: '""',
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: 'radial-gradient(circle, rgba(251, 146, 60, 0.1) 0%, rgba(225, 29, 72, 0.05) 50%, transparent 70%)',
        transform: 'rotate(0deg)',
        animation: 'rotate 15s linear infinite',
      }
    },
    uploadIcon: {
      fontSize: '80px',
      color: '#f97316',
      animation: 'float 3s ease-in-out infinite'
    },
    progressOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10
    }
  };

  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  // Add this variable for dropzone
  const [uploading, setUploading] = useState(false);

  const handleBulkUploadClose = () => {
    setUploadProgress(0);
    setUploading(false);
    setShowPreview(false);
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
    setUploading(true);
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
    } catch (error) {
      showAlert(error.response?.data?.error || 'Error fetching mentors', 'error');
      setMentors([]);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = [];
    const requiredFields = {
      name: 'Name',
      email: 'Email',
      MUJid: 'MUJid',
      phone_number: 'Phone number',
      academicYear: 'Academic year',
      academicSession: 'Academic session'
    };

    Object.entries(requiredFields).forEach(([field, label]) => {
      if (!mentorDetails[field]) {
        errors.push(`${label} is required`);
      }
    });

    if (!/^\d{10}$/.test(mentorDetails.phone_number)) {
      errors.push('Phone number must be 10 digits');
    }

    if (!/^[A-Z0-9]+$/.test(mentorDetails.MUJid)) {
      errors.push('MUJid must contain only uppercase letters and numbers');
    }

    if (mentorDetails.academicYear && !/^\d{4}-\d{4}$/.test(mentorDetails.academicYear)) {
      errors.push('Academic year must be in format YYYY-YYYY');
    }

    return errors;
  };

  const handleAddMentor = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      showAlert(errors.join('\n'), 'error');
      return;
    }

    try {
      const response = await axios.post('/api/admin/manageUsers/manageMentor', mentorDetails);
      if (response.data && response.status === 201) {
        showAlert('Mentor added successfully', 'success');
        setOpenDialog(false);
        await fetchMentors(); // Await the fetch
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
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Error adding mentor';
      showAlert(errorMessage, 'error');
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

  const fetchMentors = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/manageUsers/manageMentor', {
        params: {
          academicYear,
          academicSession
        }
      });
      if (response.data && response.data.mentors) {
        setMentors(response.data.mentors);
      }
    } catch (error) {
      showAlert('Error fetching mentors', 'error');
      setMentors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const currentAcadYear = getCurrentAcademicYear();
    const sessions = generateAcademicSessions(currentAcadYear);
    setAcademicSessions(sessions);
    setAcademicYear(currentAcadYear);
    setAcademicSession(sessions[0]); // This will trigger useEffect below
    setMentorDetails(prev => ({
      ...prev,
      academicYear: currentAcadYear,
      academicSession: sessions[0]
    }));
  }, []);

  // Add watcher for academicSession changes
  useEffect(() => {
    if (academicYear && academicSession) {
      fetchMentors(); // This will fetch based on current academicYear and academicSession
    }
  }, [academicYear, academicSession]);

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
    
    toast[severity === 'success' ? 'success' : 'error'](message, toastConfig);
  };

  const handleBulkUploadOpen = () => {
    setFileUploadDialog(true);
  };
  const [sessionSuggestions, setSessionSuggestions] = useState([]);
  const [showYearOptions, setShowYearOptions] = useState(false);
  const [showSessionOptions, setShowSessionOptions] = useState(false);

  // Add these new helper functions
  const generateYearSuggestions = (input) => {
    if (!input) {
      setYearSuggestions([]);
      return [];
    }
    const currentYear = new Date().getFullYear();
    const suggestions = [];
    for (let i = 0; i < 5; i++) {
      const year = currentYear - i;
      const academicYear = `${year}-${year + 1}`;
      if (academicYear.startsWith(input)) {
        suggestions.push(academicYear);
      }
    }
    setYearSuggestions(suggestions);
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

  // Add new handlers
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const fileType = file.name.split('.').pop().toLowerCase();
      if (!['xlsx', 'csv'].includes(fileType)) {
        showAlert('Please upload only .xlsx or .csv files', 'error');
        return;
      }
      setSelectedFile(file);
      const formData = new FormData();
      formData.append('file', file);

      try {
        setUploading(true);
        const response = await axios.post('/api/admin/manageUsers/previewUpload', formData);
        setPreviewData(response.data);
      } catch (error) {
        showAlert('Error processing file', 'error');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleFileUploadSubmit = async () => {
    if (!selectedFile || !previewData) return;

    try {
      setUploading(true);
      const response = await axios.post('/api/admin/manageUsers/bulkUpload', {
        data: previewData.data,
        type: 'mentor'
      });

      if (response.status === 201) {
        showAlert('File uploaded successfully', 'success');
        setFileUploadDialog(false);
        setSelectedFile(null);
        setPreviewData(null);
        await fetchMentors();
      }
    } catch (error) {
      showAlert(error.response?.data?.error || 'Error uploading file', 'error');
    } finally {
      setUploading(false);
    }
  };

  // Add File Upload Dialog
  const renderFileUploadDialog = () => (
    <Dialog
      open={fileUploadDialog}
      onClose={() => setFileUploadDialog(false)}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: dialogStyles.paper }}
    >
      <DialogTitle sx={dialogStyles.title}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CloudUploadIcon sx={{ color: '#f97316', fontSize: 32 }} />
          <Typography variant="h5" sx={{ color: '#f97316', fontWeight: 600 }}>
            Upload Mentors
          </Typography>
        </Box>
        <IconButton
          onClick={() => setFileUploadDialog(false)}
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
      <DialogContent>
        <Box sx={{ p: 3 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {!previewData.data.length ? (
              <Box {...getRootProps()} sx={uploadAnimationStyles.dropzone}>
                <input {...getInputProps()} />
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    duration: 0.5,
                    ease: "easeOut"
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1.5rem'
                  }}
                >
                  <motion.div
                    animate={{
                      y: [0, -10, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <CloudUploadIcon sx={uploadAnimationStyles.uploadIcon} />
                  </motion.div>
                  
                  <Typography variant="h5" sx={{
                    color: 'white',
                    fontWeight: 600,
                    textAlign: 'center',
                    background: 'linear-gradient(90deg, #f97316, #ea580c)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    Drop your Excel file here
                  </Typography>

                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="outlined"
                      sx={{
                        borderColor: 'rgba(249, 115, 22, 0.5)',
                        color: '#f97316',
                        borderRadius: '12px',
                        padding: '8px 24px',
                        '&:hover': {
                          borderColor: '#f97316',
                          backgroundColor: 'rgba(249, 115, 22, 0.1)'
                        }
                      }}
                    >
                      Browse Files
                    </Button>
                  </motion.div>

                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center' }}>
                    Supports .xlsx and .csv files
                  </Typography>
                </motion.div>

                {uploading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    sx={uploadAnimationStyles.progressOverlay}
                  >
                    <Box sx={{ width: '80%', maxWidth: '300px' }}>
                      <LinearProgress
                        variant="determinate"
                        value={uploadProgress}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            backgroundColor: '#f97316',
                            backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.15) 50%, rgba(255,255,255,.15) 75%, transparent 75%, transparent)',
                            backgroundSize: '1rem 1rem',
                            animation: 'progress-animation 1s linear infinite'
                          }
                        }}
                      />
                      <Typography sx={{ color: 'white', mt: 2, textAlign: 'center' }}>
                        Uploading... {uploadProgress}%
                      </Typography>
                    </Box>
                  </motion.div>
                )}
              </Box>
            ) : (
              // Preview section with animation
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="preview-container"
                style={{
                  background: 'linear-gradient(145deg, rgba(26, 28, 30, 0.9) 0%, rgba(45, 27, 19, 0.9) 100%)',
                  borderRadius: '16px',
                  padding: '24px',
                  border: '1px solid rgba(249, 115, 22, 0.2)'
                }}
              >
                {/* ...existing preview content... */}
              </motion.div>
            )}
          </motion.div>
        </Box>
      </DialogContent>
      <DialogActions sx={{
        ...dialogStyles.actions,
        borderTop: '1px solid rgba(249, 115, 22, 0.2)',
        backdropFilter: 'blur(10px)',
      }}>
        <Button
          onClick={() => {
            setFileUploadDialog(false);
            setSelectedFile(null);
            setPreviewData({ data: [], errors: [] });
          }}
          variant="outlined"
          sx={{
            borderColor: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            '&:hover': {
              borderColor: '#f97316',
              backgroundColor: 'rgba(249, 115, 22, 0.1)',
            },
          }}
        >
          Cancel
        </Button>
        {previewData.data.length > 0 && (
          <Button
            onClick={handleFileUploadSubmit}
            variant="contained"
            disabled={uploading}
            startIcon={<CloudUploadIcon />}
            sx={{
              bgcolor: '#f97316',
              '&:hover': { 
                bgcolor: '#ea580c',
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            {uploading ? 'Uploading...' : 'Upload Now'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );

  // Modify the Add New Mentor dialog content section
  const renderAddDialog = () => (
    <Dialog 
      open={openDialog} 
      onClose={() => setOpenDialog(false)}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: dialogStyles.paper }}
    >
      <DialogTitle sx={dialogStyles.title}>
        <Typography variant="h6" component="div" sx={{ color: 'white', fontWeight: 600 }}>
          Add New Mentor
        </Typography>
        <IconButton
          aria-label="close"
          onClick={() => setOpenDialog(false)}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'rgba(255, 255, 255, 0.5)',
            '&:hover': { color: 'white' },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={dialogStyles.content}>
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
          <Box ref={yearRef} sx={comboBoxStyles}>
            <TextField
              label="Academic Year"
              name="academicYear"
              value={mentorDetails.academicYear || ''}
              onChange={handleAcademicYearInput}
              onClick={() => setShowYearOptions(true)}
              placeholder="YYYY-YYYY"
              required
              helperText={
                <Box component="span" sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                  Example: 2023-2024
                </Box>
              }
              sx={textFieldStyles}
            />
            {showYearOptions && (
              <List
                sx={{
                  position: 'absolute',
                  zIndex: 1000,
                  width: '100%',
                  mt: 1,
                  bgcolor: 'rgba(17, 17, 17, 0.95)',
                  border: '1px solid rgba(249, 115, 22, 0.2)',
                  borderRadius: '8px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                }}
              >
                {(yearSuggestions.length > 0 ? yearSuggestions : 
                  (() => {
                    const currentYear = new Date().getFullYear();
                    return [0, 1, 2, 3].map(offset => `${currentYear - offset}-${currentYear - offset + 1}`);
                  })()
                ).map((year) => (
                  <ListItem
                    key={year}
                    onClick={() => {
                      setMentorDetails(prev => ({
                        ...prev,
                        academicYear: year
                      }));
                      setShowYearOptions(false);
                      const sessions = generateAcademicSessions(year);
                      if (sessions.length > 0) {
                        setMentorDetails(prev => ({
                          ...prev,
                          academicSession: sessions[0]
                        }));
                      }
                    }}
                    sx={{
                      cursor: 'pointer',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'rgba(249, 115, 22, 0.1)',
                      }
                    }}
                  >
                    <ListItemText primary={year} />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>

          <Box ref={sessionRef} sx={comboBoxStyles}>
            <TextField
              label="Academic Session"
              name="academicSession"
              value={mentorDetails.academicSession || ''}
              onChange={handleAcademicSessionInput}
              onClick={() => setShowSessionOptions(true)}
              placeholder="MONTH-MONTH YYYY"
              required
              helperText={
                <Box component="span" sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                  Type 'jul' or 'jan' for quick selection
                </Box>
              }
              disabled={!mentorDetails.academicYear}
              sx={textFieldStyles}
            />
            {showSessionOptions && (
              <List
                sx={{
                  position: 'absolute',
                  zIndex: 1000,
                  width: '100%',
                  mt: 1,
                  bgcolor: 'rgba(17, 17, 17, 0.95)',
                  border: '1px solid rgba(249, 115, 22, 0.2)',
                  borderRadius: '8px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                }}
              >
                {(sessionSuggestions.length > 0 ? sessionSuggestions : 
                  generateAcademicSessions(mentorDetails.academicYear)
                ).map((session) => (
                  <ListItem
                    key={session}
                    onClick={() => {
                      setMentorDetails(prev => ({
                        ...prev,
                        academicSession: session
                      }));
                      setShowSessionOptions(false);
                    }}
                    sx={{
                      cursor: 'pointer',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'rgba(249, 115, 22, 0.1)',
                      }
                    }}
                  >
                    <ListItemText primary={session} />
                  </ListItem>
                ))}
              </List>
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
            bgcolor: '#3b82f6',
            '&:hover': {
              bgcolor: '#2563eb',
            },
          }}
        >
          Add Mentor
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Add this style object for the combo boxes
  const comboBoxStyles = {
    position: 'relative',
    width: '100%',
    '& .MuiOutlinedInput-root': {
      width: '100%',
      background: 'rgba(255, 255, 255, 0.03)',
    }
  };

  // Add this style object before the comboBoxStyles
const textFieldStyles = {
  width: '100%',
  '& .MuiOutlinedInput-root': {
    color: 'white',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(10px)',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#3b82f6',
      borderWidth: '2px',
    },
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.7)',
    '&.Mui-focused': {
      color: '#3b82f6',
    },
  },
  '& .MuiFormHelperText-root': {
    color: 'rgba(255, 255, 255, 0.5)',
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

      <div className="min-h-screen bg-[#0a0a0a] overflow-hidden relative">
        {/* Background Effects */}
        <div className="absolute inset-0 z-0">
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
        {renderAddDialog()}

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
        {renderFileUploadDialog()}
      </div>
    </ThemeProvider>
  );
};

export default MentorManagement;