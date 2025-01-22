"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
// Remove lodash import
import { 
  Box, 
  Typography, 
  useMediaQuery, 
  IconButton, 
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import FilterListIcon from '@mui/icons-material/FilterList';
import MenteeTable from './MenteeTable';
import FilterSection from './FilterSection';
import { motion } from 'framer-motion';
import axios from 'axios';
import BulkUploadPreview from '../common/BulkUploadPreview';
import toast, { Toaster } from 'react-hot-toast';
import { theme } from './menteeStyle';
import AddMenteeDialog from './menteeSubComponents/AddMenteeDialog';
import EditMenteeDialog from './menteeSubComponents/EditMenteeDialog';
import AssignMentorDialog from './menteeSubComponents/AssignMentorDialog';
import BulkUploadDialog from './menteeSubComponents/BulkUploadDialog';
import { calculateCurrentSemester, getCurrentAcademicYear, generateAcademicSessions } from './utils/academicUtils';

// Move filterData function up before it's used
const filterData = (data, filters) => {
  if (!data || !filters) return [];
  
  return data.filter(mentee => {
    const matchesMentorMujid = !filters.mentorMujid || (
      mentee.mentorMujid && 
      mentee.mentorMujid.toString().toLowerCase().includes(filters.mentorMujid.toLowerCase())
    );

    const matchesMenteeMujid = !filters.menteeMujid || (
      mentee.MUJid && 
      mentee.MUJid.toString().toLowerCase().includes(filters.menteeMujid.toLowerCase())
    );

    const matchesMentorEmail = !filters.mentorEmailid || (
      mentee.mentorEmailid && 
      mentee.mentorEmailid.toString().toLowerCase().includes(filters.mentorEmailid.toLowerCase())
    );

    const matchesSemester = !filters.semester || 
      mentee.semester === (typeof filters.semester === 'string' ? 
        parseInt(filters.semester) : filters.semester);
    
    const matchesSection = !filters.section || 
      (mentee.section && mentee.section.toString().toUpperCase() === filters.section.toUpperCase());

    return matchesSemester && 
           matchesSection && 
           matchesMenteeMujid && 
           matchesMentorMujid && 
           matchesMentorEmail;
  });
};

const MenteeManagement = () => {
  const [mentees, setMentees] = useState([]);
  const [filters, setFilters] = useState({
    academicYear: '',
    academicSession: '',
    semester: '',
    section: '',
    mentorMujid: '',
    menteeMujid: '',
    mentorEmailid: ''
  });
  const dataCache = useRef(new Map());

  // Add new centralized loading state
  const [loadingStates, setLoadingStates] = useState({
    initial: true,
    fetching: false,
    updating: false
  });

  // Add currentFilters state
  const [currentFilters, setCurrentFilters] = useState(null);

  // Replace debounce with simple delay using setTimeout
  const fetchMenteeData = useCallback(async (params) => {
    if (!params.academicYear || !params.academicSession) return;
    
    const storageKey = `${params.academicYear}-${params.academicSession}`;
    setLoadingStates(prev => ({ ...prev, fetching: true }));
    
    try {
      const response = await axios.get('/api/admin/manageUsers/manageMentee', { params });
      const processedData = response.data.map(mentee => ({
        ...mentee,
        id: mentee._id || mentee.id,
        MUJid: mentee.MUJid?.toUpperCase(),
        mentorMujid: mentee.mentorMujid?.toUpperCase()
      }));
      
      // Update storage and state together
      localStorage.setItem(storageKey, JSON.stringify(processedData));
      setMentees(processedData);
      setTableVisible(true);
      return processedData;
    } catch (error) {
      console.error('Error fetching mentees:', error);
      return [];
    } finally {
      setLoadingStates(prev => ({ ...prev, fetching: false }));
    }
  }, []);

  // Handle filter changes with timeout
  const filterTimeout = useRef(null);
  const handleFilterChange = useCallback((name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));

    // For base filters, fetch new data with a small delay
    if (['academicYear', 'academicSession'].includes(name)) {
      if (filterTimeout.current) {
        clearTimeout(filterTimeout.current);
      }
      
      filterTimeout.current = setTimeout(() => {
        fetchMenteeData({
          academicYear: name === 'academicYear' ? value : filters.academicYear,
          academicSession: name === 'academicSession' ? value : filters.academicSession
        });
      }, 300);
    }
  }, [filters.academicYear, filters.academicSession, fetchMenteeData]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (filterTimeout.current) {
        clearTimeout(filterTimeout.current);
      }
    };
  }, []);

  const [academicSessions, setAcademicSessions] = useState([]);
  const [loading, setLoading] = useState(false); // Set initial loading state to false
  const [mounted, setMounted] = useState(false);
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
    // mentorMujid: '',
    mentorEmailid: '',
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
    // mentor_MUJid: '',
    mentorEmailid: '',
    mentee_MUJid: '',
    session: '',
    semester: '',
    section: ''
  });

  const [bulkUploadDialog, setBulkUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewData, setPreviewData] = useState({ data: [], errors: [] });
  const [showPreview, setShowPreview] = useState(false);

  const [tableVisible, setTableVisible] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('showFilters');
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });
  const [showTable] = useState(true); // Add new state for table visibility

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
    setBulkUploadDialog(false);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'mentee'); 
  
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
        type: 'assignMentee'
      });

      const { errors, savedCount } = response.data;

      // Show success message
      if (savedCount > 0) {
        showAlert(`Successfully uploaded ${savedCount} mentees`, 'success');
      }

      // Show errors if any
      if (errors && errors.length > 0) {
        const errorMessages = errors.map(err => {
          if (err.error) {
            return `${err.mujid}: ${err.error}`;
          }
          return `${err.mujid}: ${err.details}`;
        });

        const errorMessage = errorMessages.join('\n');

        showAlert(
          `Some records failed to upload\n${errorMessage}`,
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
      const errorMessages = [];
      if (error.response?.data?.errors) {
        errorMessages.push(...error.response.data.errors);
      }
      if (error.response?.data?.details) {
        errorMessages.push(error.response.data.details);
      }
      if (error.response?.data?.error) {
        errorMessages.push(error.response.data.error);
      }

      showAlert(
        `Error uploading file\n${errorMessages.join('\n')}`,
        'error'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleBulkUploadOpen = () => {
    setBulkUploadDialog(true);
  };

  const handleBulkUploadClose = () => {
    setBulkUploadDialog(false);
    setUploadProgress(0);
    setUploading(false);
  };

  // Updated showAlert function to handle bulk errors
  const showAlert = (message, severity, options = {}) => {
    // Dismiss all existing toasts
    toast.dismiss();
    
    // If message is a bulk error, format it
    if (typeof message === 'string' && message.includes('Some records failed to upload')) {
      const errorLines = message.split('\n');
      const totalErrors = errorLines.length - 1; // Subtract header line
      
      // Group duplicate errors
      const errorGroups = errorLines.slice(1).reduce((acc, line) => {
        const [mujid, error] = line.split(': ');
        if (!acc[error]) {
          acc[error] = { count: 0, mujids: [] };
        }
        acc[error].count++;
        acc[error].mujids.push(mujid);
        return acc;
      }, {});

      // Create condensed message
      const condensedMessage = Object.entries(errorGroups)
        .map(([error, { count, mujids }]) => {
          const firstMujid = mujids[0];
          const lastMujid = mujids[mujids.length - 1];
          return `${error} (${count} records, ${firstMujid} to ${lastMujid})`;
        })
        .join('\n');

      // Show single toast with grouped errors
      return toast(
        <div>
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>
            Upload Errors ({totalErrors} issues)
          </div>
          <div style={{ fontSize: '0.9em', whiteSpace: 'pre-line' }}>
            {condensedMessage}
          </div>
        </div>,
        {
          duration: 5000,
          style: {
            background: '#fee2e2',
            color: '#991b1b',
            maxWidth: '400px',
            padding: '16px',
          },
          id: 'upload-error' // Add unique ID to prevent duplicates
        }
      );
    }

    // Regular toast messages with unique IDs
    const toastOptions = {
      duration: 3000,
      id: `toast-${Date.now()}`, // Add unique ID
      style: {
        background: severity === 'error' ? '#fee2e2' : 
                   severity === 'success' ? '#dcfce7' : 
                   severity === 'warning' ? '#fff3cd' : '#ffffff',
        color: '#1a1a1a',
        border: `1px solid ${
          severity === 'error' ? '#f87171' : 
          severity === 'success' ? '#86efac' : 
          severity === 'warning' ? '#fbbf24' : '#e5e7eb'
        }`,
        padding: '16px',
        borderRadius: '8px',
        maxWidth: '400px',
        ...options?.style
      },
      ...options
    };

    // Show only one toast based on severity
    switch (severity) {
      case 'error':
        return toast.error(message, toastOptions);
      case 'success':
        return toast.success(message, toastOptions);
      case 'warning':
        return toast(message, { ...toastOptions, icon: '⚠️' });
      default:
        return toast(message, toastOptions);
    }
  };

  const handleEditClick = async (mentee) => {
    console.log("Received mentee for editing:", mentee); // Debug log
    setEditLoading(true);
    try {
      // Use the mentee data directly from the table
      setSelectedMentee(mentee);
      setEditDialog(true);
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

const handleUpdate = (updatedMentee) => {
  if (!updatedMentee || !updatedMentee.MUJid) {
    toast.error('Invalid mentee data');
    return;
  }

  handleEditClose();
  handleConfirmClose();

  const storageKey = `${filters.academicYear}-${filters.academicSession}`;
  
  try {
    // Get and update current data atomically
    const currentData = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const updatedData = currentData.map(mentee => 
      mentee.MUJid === updatedMentee.MUJid ? { ...mentee, ...updatedMentee } : mentee
    );

    // Update localStorage and state in a single batch
    localStorage.setItem(storageKey, JSON.stringify(updatedData));
    
    // Update local state immediately
    setMentees(updatedData);
    
    // Update current filters to trigger table refresh
    setCurrentFilters(prev => ({ ...prev, timestamp: Date.now() }));
    
    // Show loading state
    toast.loading('Saving changes...', { id: 'update' });

    // Make API call
    axios.patch('/api/admin/manageUsers/manageMentee', updatedMentee)
      .then(() => {
        toast.success('Changes saved successfully', { id: 'update' });
        
        // Refresh data cache
        if (dataCache.current.has(storageKey)) {
          dataCache.current.set(storageKey, updatedData);
        }
      })
      .catch(error => {
        console.error('Update error:', error);
        // Rollback on API failure
        const previousData = JSON.parse(localStorage.getItem(storageKey) || '[]');
        localStorage.setItem(storageKey, JSON.stringify(previousData));
        setMentees(previousData);
        setCurrentFilters(prev => ({ ...prev, timestamp: Date.now() }));
        toast.error('Failed to save changes. Changes reverted.', { id: 'update' });
      });

  } catch (error) {
    console.error('Error updating mentee:', error);
    toast.error('Failed to update mentee', { id: 'update' });
  }
};

  const handleConfirmClose = () => {
    setConfirmDialog({ open: false, mentee: null });
  };

  const handleAssignClose = () => {
    setAssignDialog(false);
    setAssignmentDetails({
        mentor_MUJid: '',
        mentee_MUJid: '',
        session: '',
        semester: '',
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
      
      // Update local state immediately
      setMentees(prevMentees => 
        prevMentees.filter(m => !mujids.includes(m.MUJid))
      );

      // Update cache
      const cacheKey = `${filters.academicYear}-${filters.academicSession}`;
      const cachedData = dataCache.current.get(cacheKey);
      if (cachedData) {
        dataCache.current.set(
          cacheKey,
          cachedData.filter(m => !mujids.includes(m.MUJid))
        );
      }

    } catch (error) {
      showAlert(error.response?.data?.error || 'Error deleting mentees', 'error');
      // Optionally refresh data from server if delete failed
      await fetchMenteeData({
        academicYear: filters.academicYear,
        academicSession: filters.academicSession
      });
    }
  };

  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    // // Clear session storage on mount
    // console.log("Mentee Management Mounted    and removing session storage");
    // console.log("Session Storage",localStorage.getItem('menteeData'));
    localStorage.removeItem('mentee data');
    
    setMounted(true);

    // // Handle screen size changes
    // if (!isSmallScreen) {
    //   setShowFilters(true);
    // }

    // Try to get data from session storage
    const storedData = localStorage.getItem('menteeData');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setMentees(parsedData);
      } catch (error) {
        console.log('Error parsing stored data:', error);
        localStorage.removeItem('menteeData');
      }
    }
  }, []);


  useEffect(() => {
    localStorage.setItem('showFilters', JSON.stringify(showFilters));
  }, [showFilters]);

  const handleSearch = async () => {
    if (!filters.academicYear?.trim() || !filters.academicSession?.trim()) return;

    setLoading(true);

    const baseParams = {
      academicYear: filters.academicYear.trim(),
      academicSession: filters.academicSession.trim().toUpperCase(),
    };

    // Create unique keys for storage
    const storageKey = `${baseParams.academicYear}-${baseParams.academicSession}`;

    try {
      let data;
      const localData = localStorage.getItem(storageKey);
      
      // Check if we need to fetch new data
      if (!localData || (!filters.semester && !filters.section && !filters.menteeMujid && !filters.mentorEmailid)) {
        // Fetch new data from API
        const response = await axios.get('/api/admin/manageUsers/manageMentee', {
          params: baseParams
        });
        data = response.data;

        // Store base data
        localStorage.setItem(storageKey, JSON.stringify(data));
        dataCache.current.set(storageKey, data);
      } else {
        // Use cached data
        let sourceData;
        if (localData) {
          sourceData = JSON.parse(localData);
        } else if (dataCache.current.has(storageKey)) {
          sourceData = dataCache.current.get(storageKey);
        } else {
          const response = await axios.get('/api/admin/manageUsers/manageMentee', {
            params: baseParams
          });
          sourceData = response.data.map(item => ({
            ...item,
            MUJid: item.MUJid?.toUpperCase(),
            mentorMujid: item.mentorMujid?.toUpperCase(),
            section: item.section?.toUpperCase()
          }));
          localStorage.setItem(storageKey, JSON.stringify(sourceData));
          dataCache.current.set(storageKey, sourceData);
        }

        // Apply filters
        data = sourceData.filter(item => {
          const matchSemester = !filters.semester || 
            parseInt(item.semester) === parseInt(filters.semester);

          const matchSection = !filters.section || 
            item.section?.toUpperCase() === filters.section.toUpperCase();

          const matchMenteeMujid = !filters.menteeMujid || 
            item.MUJid?.toUpperCase().includes(filters.menteeMujid.toUpperCase());

          const matchMentorMujid = !filters.mentorMujid || 
            item.mentorMujid?.toUpperCase().includes(filters.mentorMujid.toUpperCase());

          const matchMentorEmail = !filters.mentorEmailid || 
            item.mentorEmailid?.toLowerCase().includes(filters.mentorEmailid.toLowerCase());

          return matchSemester && matchSection && matchMenteeMujid && 
                 matchMentorMujid && matchMentorEmail;
        });
      }

      setMentees(data);
      setTableVisible(true);
      setCurrentFilters({ ...filters, key: storageKey });

    } catch (error) {
      console.error('Search error:', error);
      showAlert('Error searching mentees', 'error');
      setMentees([]);
      setTableVisible(false);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFilters({
      academicYear: '',
      academicSession: '',
      semester: '',
      section: '',
      mentorMujid: '',
      menteeMujid: '',
      mentorEmailid: ''
    });
    setMentees([]); // Clear mentees data
    setTableVisible(false);
    localStorage.removeItem('mentee data');
    setLoading(false); // Ensure loading state is set to false after reset
    // Reset current filters
    setCurrentFilters(null);
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
    const requiredFields = [
      'name',
      'email',
      'MUJid',
      'yearOfRegistration',
      'section',
      'semester',
      'academicYear',
      'academicSession', 
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
        handleSearch();
      }
    } catch (error) {
      showAlert(error.response?.data?.error || 'Error adding mentee', 'error');
    }
  };

  useEffect(() => {
    const updateSemesters = () => {
      setMentees(prevMentees => 
        prevMentees.map(mentee => ({
          ...mentee,
          semester: calculateCurrentSemester(mentee.yearOfRegistration)
        }))
      );
    };

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
    academicYear: filters.academicYear,
    academicSession: filters.academicSession,
    semester: filters.semester,
    section: filters.section,
    menteeMujid: filters.menteeMujid, // Add setter for menteeMujid
    mentorMujid: filters.mentorMujid,  // Add setter for mentorMujid,
    mentorEmailid: filters.mentorEmailid
  };
  
 useEffect(() => {
    const initializeComponent = async () => {
      if (!mounted) return;

      const currentAcadYear = getCurrentAcademicYear();
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const [startYear] = currentAcadYear.split('-');
      
      const currentSession = currentMonth >= 7 && currentMonth <= 12
        ? `JULY-DECEMBER ${startYear}`
        : `JANUARY-JUNE ${parseInt(startYear) + 1}`;

      // Update filters instead of using setAcademicYear
      setFilters(prev => ({
        ...prev,
        academicYear: currentAcadYear,
        academicSession: currentSession
      }));

      try {
        setLoadingStates(prev => ({ ...prev, fetching: true }));
        await fetchMenteeData({
          academicYear: currentAcadYear,
          academicSession: currentSession
        });
        setTableVisible(true);
      } catch (error) {
        if (error.response?.status !== 400) {
          showAlert(error.response?.data?.error || 'Error loading data', 'error');
        }
      } finally {
        setLoadingStates(prev => ({ ...prev, fetching: false }));
      }
    };

    initializeComponent();
  }, [mounted]);

  const handleDataUpdate = (updateFn) => {
    setMentees(prevMentees => {
      const updatedMentees = typeof updateFn === 'function' 
        ? updateFn(prevMentees)
        : updateFn;
      
      // Update session storage
      localStorage.setItem('menteeData', JSON.stringify(updatedMentees));
      return updatedMentees;
    });
  };

  // Add mounted state setter
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleConfirmUpdate = async () => {
    try {
      setLoadingStates(prev => ({ ...prev, updating: true }));
      
      if (confirmDialog.mentee) {
        await handleUpdate(confirmDialog.mentee);
        
        // Force table refresh by updating filters
        setCurrentFilters(prev => ({
          ...prev,
          timestamp: Date.now()
        }));
        
        // Refresh the data in the table
        const storageKey = `${filters.academicYear}-${filters.academicSession}`;
        const updatedData = JSON.parse(localStorage.getItem(storageKey) || '[]');
        setMentees(updatedData);
      }
      
      handleConfirmClose();
      
    } catch (error) {
      console.error('Error in handleConfirmUpdate:', error);
      toast.error('Failed to update mentee');
    } finally {
      setLoadingStates(prev => ({ ...prev, updating: false }));
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <div className="fixed inset-0 bg-gray-900 text-white overflow-hidden">
        {/* Single Toaster instance with updated configuration */}
        <Toaster 
          position="bottom-right"
          containerStyle={{
            bottom: 40,
            right: 20,
            maxWidth: '100%'
          }}
          toastOptions={{
            className: '',
            duration: 3000,
            style: {
              maxWidth: '400px',
              background: '#1a1a1a',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '0.875rem',
              whiteSpace: 'pre-line'
            },
          }}
        />

        {/* Background Effects */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-purple-500/10 to-blue-500/10 animate-gradient" />
          <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-orange-500/20 to-transparent blur-3xl" />
          <div className="absolute inset-0 backdrop-blur-3xl" />
        </div>

        {/* Main Content Container */}
        <div className="relative z-10 h-screen flex flex-col pt-[60px]">
          {/* Header Section - Updated with center alignment */}
          <div className="flex items-center justify-center px-4 lg:px-6 relative">
            <motion.h1 
              className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-pink-500 mt-5 mb-2 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Mentee Management
            </motion.h1>

            {/* Position toggle buttons absolutely to maintain header centering */}
            {isSmallScreen && (
              <motion.div
                initial={false}
                animate={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
                transition={{ duration: 0.3 }}
              >
                <IconButton
                  onClick={() => setShowFilters(prev => !prev)}
                  sx={{
                    color: '#f97316',
                    bgcolor: 'rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(249, 115, 22, 0.3)',
                    '&:hover': {
                      bgcolor: 'rgba(249, 115, 22, 0.2)',
                    },
                    transition: 'all 0.3s ease',
                    transform: showFilters ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                >
                  <FilterListIcon />
                </IconButton>
              </motion.div>
            )}
          </div>

          {/* Add this after the header section */}
          {isSmallScreen && (
            <Box sx={{
              position: 'fixed',
              left: '1rem',
              top: '1rem',
              zIndex: 1000,
              display: 'flex',
              gap: 2,
              alignItems: 'center',
            }}>
              <Typography
                variant="caption"
                sx={{
                  color: showFilters ? '#f97316' : 'rgba(255, 255, 255, 0.5)',
                  transition: 'color 0.3s ease',
                  fontSize: '0.75rem',
                }}
              >
                Filters {showFilters ? 'Shown' : 'Hidden'}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: showTable ? '#f97316' : 'rgba(255, 255, 255, 0.5)',
                  transition: 'color 0.3s ease',
                  fontSize: '0.75rem',
                }}
              >
                Table {showTable ? 'Shown' : 'Hidden'}
              </Typography>
            </Box>
          )}

          {/* Main Grid Layout - Updated grid and padding */}
          <div className={`flex-1 grid gap-4 p-4 h-[calc(100vh-100px)] transition-all duration-300 ease-in-out ${
            isSmallScreen ? 'grid-cols-1' : 'grid-cols-[400px,1fr] lg:overflow-hidden'
          }`}>
            {/* Filter Panel - Updated width and padding */}
            <motion.div 
              className={`bg-black/20 backdrop-blur-xl rounded-3xl border border-white/10 transition-all duration-300 ease-in-out ${
                isSmallScreen ? 'w-full' : 'w-[400px]'
              }`}
              initial={false}
              animate={{
                height: showFilters ? 'auto' : '0px',
                opacity: showFilters ? 1 : 0,
                marginBottom: showFilters ? '1rem' : '0px'
              }}
              transition={{ duration: 0.3 }}
              style={{
                display: showFilters ? 'block' : 'none',
                position: isSmallScreen ? 'relative' : 'sticky',
                top: isSmallScreen ? 'auto' : '1rem',
                maxHeight: isSmallScreen ? '80vh' : 'calc(100vh - 120px)',
                overflowY: 'auto',
                zIndex: isSmallScreen ? 50 : 'auto'
              }}
            >
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 h-full">
                <FilterSection 
                  filters={filterConfig}
                  onFilterChange={handleFilterChange}
                  onSearch={handleSearch}
                  // onSearchAll={handleSearchAll}
                  onAddNew={handleDialogOpen}
                  onReset={handleReset}
                  onBulkUpload={handleBulkUploadOpen}
                  onDelete={handleDelete}
                  mentees={mentees}
                  filterData={filterData} // Pass filterData as prop
                  isLoading={loadingStates.fetching}
                />
              </div>
            </motion.div>

            {/* Table Section - Updated for better responsiveness */}
            <motion.div
              className={`h-full min-w-0 transition-all duration-300 ease-in-out ${
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
                        isLoading={loadingStates.fetching}
                        currentFilters={currentFilters} // Pass filters to table
                      />
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                        {tableVisible ? 'No mentees found' : 'Select filters to load data'}
                      </Typography>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div> 
        </div>

        <AddMenteeDialog 
          open={openDialog}
          onClose={handleDialogClose}
          menteeDetails={menteeDetails}
          onInputChange={handleInputChange}
          onSubmit={handleFormSubmit}
          academicSessions={academicSessions}
        />

        <EditMenteeDialog
          open={editDialog}
          onClose={handleEditClose}
          mentee={selectedMentee}
          onUpdate={handleUpdate}
          loading={editLoading}
        />

        <AssignMentorDialog
          open={assignDialog}
          onClose={handleAssignClose}
          details={assignmentDetails}
          onChange={handleAssignInputChange}
          onSubmit={handleAssignSubmit}
        />

        <BulkUploadDialog
          open={bulkUploadDialog}
          onClose={handleBulkUploadClose}
          onUpload={handleFileUpload}
          uploading={uploading}
          uploadProgress={uploadProgress}
        />

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
            <Button 
              onClick={handleConfirmClose} 
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
              onClick={handleConfirmUpdate}
              variant="contained"
              disabled={loadingStates.updating}
              sx={{
                bgcolor: '#f97316',
                '&:hover': { bgcolor: '#ea580c' },
                '&:disabled': { bgcolor: 'rgba(249, 115, 22, 0.5)' }
              }}
            >              
              {loadingStates.updating ? 'Updating...' : 'Confirm'}
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
          type="mentee" // Specify the type as mentee
        />
        {/* Toast notifications */}        
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