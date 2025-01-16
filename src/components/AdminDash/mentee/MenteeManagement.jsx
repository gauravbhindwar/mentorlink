"use client";
import { useState, useEffect, useRef } from 'react';
import { Box, Typography, Button, useMediaQuery, IconButton, TextField, Dialog, DialogTitle, DialogContent, DialogActions,  LinearProgress, MenuItem, CircularProgress } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useDropzone } from 'react-dropzone';
import MenteeTable from './MenteeTable';
import FilterSection from './FilterSection';
import { Toaster } from 'react-hot-toast';
import { motion} from 'framer-motion';
import axios from 'axios';
import BulkUploadPreview from '../common/BulkUploadPreview';
import toast from 'react-hot-toast';
import FilterListIcon from '@mui/icons-material/FilterList'; // Add this import

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
  // const [isFilterSelected, setIsFilterSelected] = useState(false);
  // console.log(isFilterSelected)
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
  const [confirmDialog, setConfirmDialog] = useState({ open: false, mentee: null });
  const [uploadProgress, setUploadProgress] = useState(0);
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
  const [previewData, setPreviewData] = useState({ data: [], errors: [] });
  const [showPreview, setShowPreview] = useState(false);

  const [tableVisible, setTableVisible] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(true); // Add this state

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
    formData.append('type', 'mentee'); // Add the type parameter
  
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
        type: 'mentee'
      });

      const { errors, savedCount } = response.data;

      // Show success message
      if (savedCount > 0) {
        showAlert(`Successfully uploaded ${savedCount} mentees`, 'success');
      }

      // Show errors if any
      if (errors && errors.length > 0) {
        const errorMessage = errors.map(err => 
          `${err.mujid}: ${err.error}`
        ).join('\n');
        
        showAlert(
          `Some records failed to upload:\n${errorMessage}`, 
          'warning'
        );
      }

      setShowPreview(false);
      handleBulkUploadClose();
      
      // Refresh the table if any records were saved
      if (savedCount > 0) {
        handleSearch([]);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 
                      error.response?.data?.details || 
                      'Error uploading file';
      showAlert(errorMsg, 'error');
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

  // const handleBulkUploadClick = () => {
  //   setBulkUploadDialog(true);
  // };

  const showAlert = (message, severity) => {
    switch (severity) {
      case 'error':
        toast.error(message);
        break;
      case 'success':
        toast.success(message);
        break;
      case 'info':
      case 'warning':
        toast(message, {
          icon: severity === 'warning' ? '⚠️' : 'ℹ️',
          style: {
            background: severity === 'warning' ? '#fff3cd' : '#cff4fc',
            color: '#000'
          }
        });
        break;
      default:
        toast(message);
    }
  };

  const handleEditClick = async (mentee) => {
    setEditLoading(true);
    try {
      // Fetch complete mentee details using MUJid
      const response = await axios.get(`/api/admin/manageUsers/manageMentee`, {
        params: {
          academicYear: mentee.academicYear,
          academicSession: mentee.academicSession,
          MUJid: mentee.MUJid
        }
      });
      
      if (response.data && response.data.length > 0) {
        setSelectedMentee(response.data[0]);
        setEditDialog(true);
      } else {
        showAlert('Mentee details not found', 'error');
      }
    } catch (error) {
      showAlert(error.response?.data?.error || 'Error fetching mentee details', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditClose = () => {
    setSelectedMentee(null);
    setEditDialog(false);
  };

  const handleUpdate = async () => {
    // Show confirmation dialog instead of updating directly
    setConfirmDialog({
      open: true,
      mentee: selectedMentee
    });
  };

  const handleConfirmClose = () => {
    setConfirmDialog({ open: false, mentee: null });
  };

  const handleConfirmUpdate = async () => {
    try {
      const response = await axios.patch('/api/admin/manageUsers/manageMentee', selectedMentee);
      showAlert('Mentee updated successfully', 'success');
      setMentees(prevMentees => 
        prevMentees.map(mentee => 
          mentee.MUJid === selectedMentee.MUJid ? response.data : mentee
        )
      );
      handleEditClose();
      handleConfirmClose();
    } catch (error) {
      showAlert(error.response?.data?.error || 'Error updating mentee', 'error');
    }
  };

  const handleEditInputChange = (e, category, subcategory) => {
    if (category && subcategory) {
      // Handle nested parent fields
      setSelectedMentee(prev => ({
        ...prev,
        parents: {
          ...prev.parents,
          [category]: {
            ...prev.parents?.[category],
            [subcategory]: e.target.value
          }
        }
      }));
    } else {
      // Handle top-level fields
      const { name, value } = e.target;
      setSelectedMentee(prev => ({
        ...prev,
        [name]: name === 'MUJid' ? value.toUpperCase() : value
      }));
    }
  };

  // const handleAssignClick = (mentee) => {
  //   setAssignmentDetails({
  //       ...assignmentDetails,
  //       mentee_MUJid: mentee.mujid
  //   });
  //   setAssignDialog(true);
  // };

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
        await axios.post('/api/admin/manageUsers/assignMentor', assignmentDetails);
        showAlert('Mentor assigned successfully', 'success');
        handleAssignClose();
    } catch (error) {
        showAlert(error.response?.data?.error || 'Error assigning mentor', 'error');
    }
  };

  const handleDelete = async (mujids) => {
    try {
      const response = await axios.delete('/api/admin/manageUsers/manageMentee', {
        data: { MUJids: mujids }
      });
      
      showAlert(`Successfully deleted ${response.data.deletedCount} mentee(s)`, 'success');
      
      // Refresh the table
      if (mentees.length > 0) {
        const updatedMentees = mentees.filter(m => !mujids.includes(m.MUJid));
        setMentees(updatedMentees);
      }
    } catch (error) {
      showAlert(error.response?.data?.error || 'Error deleting mentees', 'error');
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

  // Consolidate screenSize related effects into one
  useEffect(() => {
    // Clear session storage on mount
    sessionStorage.removeItem('menteeData');
    setMounted(true);

    // Handle screen size changes
    if (!isSmallScreen) {
      setShowFilters(true);
    }

    // Try to get data from session storage
    const storedData = sessionStorage.getItem('menteeData');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setMentees(parsedData);
      } catch (error) {
        console.log('Error parsing stored data:', error);
        sessionStorage.removeItem('menteeData');
      }
    }
  }, [isSmallScreen]); // Add isSmallScreen to dependencies

  const handleSearch = (data) => {
    setLoading(true);
    try {
      if (Array.isArray(data) && data.length > 0) {
        setMentees(data);
        setTableVisible(true); // Show table when we have data
        // console.log('Updated mentees:', data);
      } else {
        setMentees([]);
        setTableVisible(false); // Hide table when no data
      }
    } catch (error) {
      console.log('Error handling search:', error);
      setMentees([]);
      setTableVisible(false);
      
    } finally {
      setLoading(false);
    }
  };

  const handleSearchAll = async (data) => {
    setLoading(true);
    try {
      if (Array.isArray(data) && data.length > 0) {
        setMentees(data);
        setTableVisible(true);
        // console.log('Search All data:', data);
      } else {
        setMentees([]);
        setTableVisible(false);
        showAlert('No mentees found', 'info');
      }
    } catch (error) {
      // console.log('Error handling search all:', error);
      setMentees([]);
      setTableVisible(false);
      showAlert('Error fetching mentees', error);
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
      console.log(`No setter function found for filter: ${name}`);

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

  // Add this near other state declarations
  const [yearSuggestions, setYearSuggestions] = useState([]);
  const yearRef = useRef(null);
  const sessionRef = useRef(null);
  const [showYearOptions, setShowYearOptions] = useState(false);
  const [showSessionOptions, setShowSessionOptions] = useState(false);

  // Add these helper functions
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

  // Add this useEffect for handling clicks outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (yearRef.current && !yearRef.current.contains(event.target)) {
        setShowYearOptions(false);
      }
      if (sessionRef.current && !sessionRef.current.contains(event.target)) {
        setShowSessionOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Make sure to add the comboBoxStyles if not already present
  const comboBoxStyles = {
    position: 'relative',
    width: '100%',
    '& .MuiTextField-root': {
      width: '100%',
    },
    '& .options-dropdown': {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      zIndex: 9999,
      backgroundColor: '#1a1a1a',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '8px',
      marginTop: '4px',
      padding: '8px 0',
      maxHeight: '200px',
      overflowY: 'auto',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      '& .option-item': {
        padding: '8px 16px',
        color: 'white',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
        },
      },
    },
  };

  if (!mounted) return null;

  const handleDataUpdate = (updateFn) => {
    setMentees(prevMentees => {
      const updatedMentees = typeof updateFn === 'function' 
        ? updateFn(prevMentees)
        : updateFn;
      
      // Update session storage
      sessionStorage.setItem('menteeData', JSON.stringify(updatedMentees));
      return updatedMentees;
    });
  };

  return (
    <ThemeProvider theme={theme}>
      <div className="fixed inset-0 bg-gray-900 text-white overflow-hidden">
        <Toaster position="top-center" containerStyle={{ top: 100 }} />
        {/* Background Effects */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-purple-500/10 to-blue-500/10 animate-gradient" />
          <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-orange-500/20 to-transparent blur-3xl" />
          <div className="absolute inset-0 backdrop-blur-3xl" />
        </div>

        {/* Main Content Container */}
        <div className="relative z-10 h-screen flex flex-col pt-[60px]">
          {/* Header Section */}
          <div className="flex items-center justify-between px-4 lg:px-6">
            <motion.h1 
              className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-pink-500 mt-5 mb-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Mentee Management
            </motion.h1>

            {isSmallScreen && (
              <IconButton
                onClick={() => setShowFilters(!showFilters)}
                sx={{
                  color: '#f97316',
                  bgcolor: 'rgba(249, 115, 22, 0.1)',
                  '&:hover': {
                    bgcolor: 'rgba(249, 115, 22, 0.2)',
                  },
                  position: 'fixed',
                  right: '1rem',
                  zIndex: 10,
                }}
              >
                <FilterListIcon />
              </IconButton>
            )}
          </div>

          {/* Main Grid Layout - Updated grid and padding */}
          <div className={`flex-1 grid gap-4 p-4 h-[calc(100vh-100px)] transition-all duration-300 ${
            isSmallScreen ? 'grid-cols-1' : 'grid-cols-[400px,1fr] lg:overflow-hidden'
          }`}>
            {/* Filter Panel - Updated width and padding */}
            <motion.div 
              className={`lg:h-full ${isSmallScreen ? 'w-full' : 'w-[400px]'}`}
              initial={false}
              animate={{
                height: showFilters ? 'auto' : 0,
                opacity: showFilters ? 1 : 0,
                marginBottom: showFilters ? '12px' : 0
              }}
              style={{
                display: showFilters ? 'block' : 'none',
                position: isSmallScreen ? 'relative' : 'sticky',
                top: isSmallScreen ? 'auto' : '1rem',
              }}
            >
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 h-full overflow-auto">
                <FilterSection 
                  filters={filterConfig}
                  onFilterChange={handleFilterChange}
                  onSearch={handleSearch}
                  onSearchAll={handleSearchAll}
                  onAddNew={handleDialogOpen}
                  onReset={handleReset}
                  onBulkUpload={handleBulkUploadOpen}
                  onDelete={handleDelete}
                  mentees={mentees}
                />
              </div>
            </motion.div>

            {/* Table Section - Updated for better responsiveness */}
            <motion.div
              className={`h-full min-w-0 transition-all duration-300 ${
                !showFilters && isSmallScreen ? 'col-span-full' : ''
              }`}
              animate={{
                gridColumn: (!showFilters && isSmallScreen) ? 'span 2' : 'auto'
              }}
            >
              <div className="bg-gradient-to-br from-orange-500/5 via-orange-500/10 to-transparent backdrop-blur-xl rounded-3xl border border-orange-500/20 h-full">
                <div className="h-full flex flex-col p-4 pb-2">
                  {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                      <CircularProgress sx={{ color: "#f97316" }} />
                    </div>
                  ) : mentees.length > 0 ? (
                    <div className="h-full">
                      <MenteeTable 
                        mentees={mentees}
                        onEditClick={handleEditClick}
                        onDeleteClick={handleDelete}
                        isSmallScreen={isSmallScreen}
                        onDataUpdate={handleDataUpdate}
                      />
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                        {tableVisible ? 'No mentees found' : 'Use the filters to search for mentees'}
                      </Typography>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ...existing dialogs and other components... */}
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
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: dialogStyles.paper }}
        >
          <DialogTitle sx={dialogStyles.title}>
            <Typography variant="h6" component="div" sx={{ color: '#f97316', fontWeight: 600 }}>
              Edit Mentee Details
            </Typography>
            <IconButton
              onClick={handleEditClose}
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
          <DialogContent sx={dialogStyles.content}>
            {selectedMentee && (
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                gap: 3,
                py: 2
              }}>
                {/* Student Information */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography variant="subtitle1" sx={{ color: '#f97316', fontWeight: 600 }}>
                    Student Information
                  </Typography>
                  <TextField
                    label="MUJid"
                    name="MUJid"
                    value={selectedMentee.MUJid || ''}
                    disabled
                    sx={dialogStyles.textField}
                  />
                  <TextField
                    label="Name"
                    name="name"
                    value={selectedMentee.name || ''}
                    onChange={handleEditInputChange}
                    required
                    sx={dialogStyles.textField}
                  />
                  <TextField
                    label="Email"
                    name="email"
                    type="email"
                    value={selectedMentee.email || ''}
                    onChange={handleEditInputChange}
                    required
                    sx={dialogStyles.textField}
                  />
                  <TextField
                    label="Phone"
                    name="phone"
                    value={selectedMentee.phone || ''}
                    onChange={handleEditInputChange}
                    sx={dialogStyles.textField}
                  />
                  <TextField
                    label="Address"
                    name="address"
                    value={selectedMentee.address || ''}
                    onChange={handleEditInputChange}
                    multiline
                    rows={2}
                    sx={dialogStyles.textField}
                  />
                </Box>

                {/* Academic Information */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography variant="subtitle1" sx={{ color: '#f97316', fontWeight: 600 }}>
                    Academic Information
                  </Typography>
                  {/* Academic Year with suggestions */}
                  <Box ref={yearRef} sx={comboBoxStyles}>
                    <TextField
                      label="Academic Year"
                      name="academicYear"
                      value={selectedMentee?.academicYear || ''}
                      onChange={(e) => {
                        let value = e.target.value.toUpperCase();
                        if (value.length === 4 && !value.includes('-')) {
                          value = `${value}-${parseInt(value) + 1}`;
                        }
                        setYearSuggestions(generateYearSuggestions(value));
                        setShowYearOptions(true);
                        handleEditInputChange({ target: { name: 'academicYear', value } });
                      }}
                      onClick={() => setShowYearOptions(true)}
                      placeholder="YYYY-YYYY"
                      required
                      sx={dialogStyles.textField}
                    />
                    {showYearOptions && (
                      <Box className="options-dropdown">
                        {(yearSuggestions.length > 0 ? yearSuggestions : 
                          (() => {
                            const currentYear = new Date().getFullYear();
                            return [0, 1, 2, 3].map(offset => `${currentYear - offset}-${currentYear - offset + 1}`);
                          })()
                        ).map(year => (
                          <Box
                            key={year}
                            className="option-item"
                            onClick={() => {
                              handleEditInputChange({ target: { name: 'academicYear', value: year } });
                              setShowYearOptions(false);
                              const sessions = generateAcademicSessions(year);
                              if (sessions.length > 0) {
                                handleEditInputChange({ target: { name: 'academicSession', value: sessions[0] } });
                              }
                            }}
                          >
                            {year}
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>

                  {/* Academic Session with suggestions */}
                  <Box ref={sessionRef} sx={comboBoxStyles}>
                    <TextField
                      label="Academic Session"
                      name="academicSession"
                      value={selectedMentee?.academicSession || ''}
                      onChange={(e) => {
                        let value = e.target.value.toUpperCase();
                        if (value.startsWith('JUL')) {
                          value = `JULY-DECEMBER ${selectedMentee?.academicYear?.split('-')[0]}`;
                        } else if (value.startsWith('JAN')) {
                          value = `JANUARY-JUNE ${selectedMentee?.academicYear?.split('-')[1]}`;
                        }
                        handleEditInputChange({ target: { name: 'academicSession', value } });
                        setShowSessionOptions(true);
                      }}
                      onClick={() => setShowSessionOptions(true)}
                      placeholder="MONTH-MONTH YYYY"
                      required
                      disabled={!selectedMentee?.academicYear}
                      sx={dialogStyles.textField}
                    />
                    {showSessionOptions && (
                      <Box className="options-dropdown">
                        {generateAcademicSessions(selectedMentee?.academicYear).map(session => (
                          <Box
                            key={session}
                            className="option-item"
                            onClick={() => {
                              handleEditInputChange({ target: { name: 'academicSession', value: session } });
                              setShowSessionOptions(false);
                            }}
                          >
                            {session}
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>

                  {/* Rest of Academic Information fields */}
                  <TextField
                    label="Year of Registration"
                    name="yearOfRegistration"
                    type="number"
                    value={selectedMentee.yearOfRegistration || ''}
                    onChange={handleEditInputChange}
                    required
                    sx={dialogStyles.textField}
                  />
                  <TextField
                    label="Section"
                    name="section"
                    value={selectedMentee.section || ''}
                    onChange={handleEditInputChange}
                    required
                    sx={dialogStyles.textField}
                  />
                  <TextField
                    label="Semester"
                    name="semester"
                    type="number"
                    value={selectedMentee.semester || ''}
                    onChange={handleEditInputChange}
                    required
                    sx={dialogStyles.textField}
                  />
                </Box>


                {/* Mentor Information */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography variant="subtitle1" sx={{ color: '#f97316', fontWeight: 600 }}>
                    Mentor Information
                  </Typography>
                  <TextField
                    label="Mentor MUJid"
                    name="mentorMujid"
                    value={selectedMentee.mentorMujid || ''}
                    onChange={handleEditInputChange}
                    required
                    sx={dialogStyles.textField}
                  />
                </Box>
              </Box>
            )}
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
        <BulkUploadPreview
          open={showPreview}
          onClose={() => setShowPreview(false)}
          data={previewData.data}
          errors={previewData.errors}
          onConfirm={handleConfirmUpload}
          isUploading={uploading}
          type="mentee" // Specify the type as mentee
        />
        {/* Toast notifications */}        
        <Toaster position="top-right" />      
        {editLoading && (
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              zIndex: 9999,
              backdropFilter: 'blur(5px)',
            }}
          >
            <CircularProgress sx={{ color: '#f97316' }} />
          </Box>
        )}

      </div>    
    </ThemeProvider>  
  );
};

export default MenteeManagement;

