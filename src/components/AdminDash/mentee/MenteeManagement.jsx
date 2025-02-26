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
  Button,
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import FilterListIcon from '@mui/icons-material/FilterList';
// import CloseIcon from '@mui/icons-material/Close';
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
import TableSkeleton from './TableSkeleton';  // Add this import at the top
import dynamic from 'next/dynamic';
import noData from '@/assets/animations/noData.json';
import LoadingDialog from '@/components/common/LoadingDialog';
// import ConfirmDialog from '@/components/common/ConfirmDialog';

// Add dynamic import for Lottie
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

// Add debounce function at the top of the file, before any component code
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};
import MenteeCard from '@/components/mentor/MenteeCard';
import Pagination from '@mui/material/Pagination';

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

    return matchesSemester && 
           matchesMenteeMujid && 
           matchesMentorMujid && 
           matchesMentorEmail;
  });
};

// Add this helper function before the component
const determineCurrentSession = () => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  
  return currentMonth >= 7 && currentMonth <= 12
    ? `JULY-DECEMBER ${currentYear}`
    : `JANUARY-JUNE ${currentYear}`;
};

// Update the filters state to remove menteeMujid
const MenteeManagement = () => {
  const [emailSearch, setEmailSearch] = useState('');
  const [mentees, setMentees] = useState([]);
  const [filters, setFilters] = useState({
    academicYear: '',
    academicSession: '',
    semester: '',
    email: '', // Changed from mentorEmailid/menteeMujid
  });
  const dataCache = useRef(new Map());

  // Simplify loading state
  const [loadingState, setLoadingState] = useState({
    isLoading: false,
    type: null
  });

  // Add currentFilters state
  const [currentFilters, setCurrentFilters] = useState(null);

  // Add data ready state
  // const [isDataReady, setIsDataReady] = useState(false);

  // Add data initialization state
  // const [isInitialized, setIsInitialized] = useState(false);

  // Optimize data fetching
  const fetchMenteeData = useCallback(async (params) => {
    if (!params.academicYear || !params.academicSession) return;
    
    setLoadingState({ isLoading: true, type: 'fetch' });
    
    try {
      const response = await axios.get('/api/admin/manageUsers/manageMentee', { params });
      const processedData = response.data.map(mentee => ({
        ...mentee,
        id: mentee._id || mentee.id,
        MUJid: mentee.MUJid?.toUpperCase(),
        mentorMujid: mentee.mentorMujid?.toUpperCase()
      }));
      
      setMentees(processedData);
      // setTableVisible(true);
      // setIsInitialized(true);
      return processedData;
    } catch (error) {
      console.error('Error fetching mentees:', error);
      setMentees([]);
      return [];
    } finally {
      setLoadingState({ isLoading: false, type: null });
    }
  }, []); 

  // Handle filter changes with timeout
  const filterTimeout = useRef(null);

  // Move debouncedSearch declaration before it's used in handleFilterChange
  const handleEmailSearch = useCallback((value) => {
    setEmailSearch(value);
    
    const storageKey = `${filters.academicYear}-${filters.academicSession}`;
    const localData = JSON.parse(localStorage.getItem(storageKey) || '[]');
  
    if (localData.length > 0) {
      const searchValue = value.toLowerCase();
      
      if (!searchValue) {
        // If search is cleared, restore original data with timestamps
        setMentees(localData.map(mentee => ({
          ...mentee,
          timestamp: mentee.timestamp || Date.now()
        })));
        return;
      }
  
      // Filter and sort the data locally
      const filteredAndSortedData = localData
        .map(mentee => {
          // Calculate match score
          const emailMatch = mentee.email?.toLowerCase().includes(searchValue) ? 2 : 0;
          const mentorEmailMatch = mentee.mentorEmailid?.toLowerCase().includes(searchValue) ? 1 : 0;
          const score = emailMatch + mentorEmailMatch;
  
          return {
            ...mentee,
            timestamp: mentee.timestamp || Date.now(),
            searchScore: score
          };
        })
        .filter(mentee => mentee.searchScore > 0)
        .sort((a, b) => b.searchScore - a.searchScore);
  
      setMentees(filteredAndSortedData);
    }
  }, [filters.academicYear, filters.academicSession]); // Add dependencies
  
  // Debounce the search for smoothness
  const debouncedSearch = useCallback(
    debounce((value) => handleEmailSearch(value), 300),
    [handleEmailSearch] // Add handleEmailSearch as dependency
  );

  // Now we can use debouncedSearch in handleFilterChange
  const handleFilterChange = useCallback((name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));

    if (name === 'email') {
      debouncedSearch(value);
    }

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
  }, [filters.academicYear, filters.academicSession, fetchMenteeData, debouncedSearch]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (filterTimeout.current) {
        clearTimeout(filterTimeout.current);
      }
    };
  }, []);

  const [academicSessions, setAcademicSessions] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [menteeDetails, setMenteeDetails] = useState({
    name: '',
    email: '',
    MUJid: '',
    phone: '',
    yearOfRegistration: '',
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
    semester: ''
  });

  const [bulkUploadDialog, setBulkUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewData, setPreviewData] = useState({ data: [], errors: [] });
  const [showPreview, setShowPreview] = useState(false);
  const [loadingDialog, setLoadingDialog] = useState({
    open: false,
    message: ''
  });

  // const [tableVisible, setTableVisible] = useState(false);
  const [showFilters, setShowFilters] = useState(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('showFilters');
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });
  const [showTable] = useState(true); // Add new state for table visibility
  const [tableVisible, setTableVisible] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

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
    setLoadingState({ isLoading: true, type: 'update' });
    try {
      // Use the mentee data directly from the table
      setSelectedMentee(mentee);
      setEditDialog(true);
    } catch (error) {
      showAlert(error.response?.data?.error || 'Error fetching mentee details', 'error');
    } finally {
      setLoadingState({ isLoading: false, type: 'update' });
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
        semester: ''
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

  // Modify useEffect for mounting
  useEffect(() => {
    // Remove localStorage clear
    setMounted(true);

    const storedData = localStorage.getItem('menteeData');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setMentees(parsedData);
      } catch (error) {
        console.log('Error parsing stored data:', error);
      }
    }
  }, []);

  const handleSearch = async () => {
    if (!filters.academicYear?.trim() || !filters.academicSession?.trim()) return;

    setLoadingState({ isLoading: true, type: 'search' });

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
      if (!localData || (!filters.semester && !filters.email)) {
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
            mentorMujid: item.mentorMujid?.toUpperCase()
          }));
          localStorage.setItem(storageKey, JSON.stringify(sourceData));
          dataCache.current.set(storageKey, sourceData);
        }

        // Apply filters
        data = sourceData.filter(item => {
          const matchSemester = !filters.semester || 
            parseInt(item.semester) === parseInt(filters.semester);

          const matchEmail = !filters.email || 
            item.email?.toLowerCase().includes(filters.email.toLowerCase()) ||
            item.mentorEmailid?.toLowerCase().includes(filters.email.toLowerCase());

          return matchSemester && matchEmail;
        });
      }

      setMentees(data);
      // setTableVisible(true);
      setCurrentFilters({ ...filters, key: storageKey });

    } catch (error) {
      console.error('Search error:', error);
      showAlert('Error searching mentees', 'error');
      setMentees([]);
      // setTableVisible(false);
    } finally {
      setLoadingState({ isLoading: false, type: 'search' });
    }
  };

  // Update handleReset
  const handleReset = () => {
    setFilters({
      academicYear: '',
      academicSession: '',
      semester: '',
      email: ''  // Updated to match new structure
    });
    setMentees([]); // Clear mentees data
    // setTableVisible(false);
    localStorage.removeItem('mentee data');
    // Ensure loading state is set to false after reset
    setLoadingState({ isLoading: false, type: 'reset' });
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

  const handleMenteeAdded = async ({ mentee, storageKey }) => {
    setLoadingDialog({ open: true, message: 'Processing new mentee...' });
    
    try {
      const menteeWithTimestamp = {
        ...mentee,
        timestamp: Date.now(),
        id: `${mentee._id || ''}-${mentee.MUJid || ''}-${Date.now()}`
      };
    
      // Update mentees state
      setMentees(prev => {
        const filtered = prev.filter(m => m.MUJid !== menteeWithTimestamp.MUJid);
        return [...filtered, menteeWithTimestamp];
      });
      
      // Update localStorage
      const existingData = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const updatedData = [
        ...existingData.filter(m => m.MUJid !== menteeWithTimestamp.MUJid),
        menteeWithTimestamp
      ];
      localStorage.setItem(storageKey, JSON.stringify(updatedData));
      
      setCurrentFilters(prev => ({
        ...prev,
        timestamp: Date.now()
      }));

      toast.success('Mentee added successfully');
    } catch (error) {
      console.error('Error processing new mentee:', error);
      toast.error('Error processing new mentee');
      // Optionally revert changes here
    } finally {
      setLoadingDialog({ open: false, message: '' });
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

  // Update filterConfig to reflect new structure
  const filterConfig = {
    academicYear: filters.academicYear,
    academicSession: filters.academicSession,
    semester: filters.semester,
    email: filters.email  // Single email filter
  };
  
 useEffect(() => {
    const initializeComponent = async () => {
      if (!mounted) return;

      try {
        // Set loading state immediately
        setLoadingState({ isLoading: true, type: 'fetch' });

        const currentAcadYear = getCurrentAcademicYear();
        const currentSession = determineCurrentSession();

        // Set initial filters
        setFilters(prev => ({
          ...prev,
          academicYear: currentAcadYear,
          academicSession: currentSession
        }));

        // Fetch initial data
        await fetchMenteeData({
          academicYear: currentAcadYear,
          academicSession: currentSession
        });

      } catch (error) {
        console.error('Initialization error:', error);
        showAlert('Error initializing data', 'error');
      }
    };

    initializeComponent();
  }, [mounted, fetchMenteeData]);

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
      setLoadingState({ isLoading: true, type: 'update' });
      
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
      setLoadingState({ isLoading: false, type: 'update' });
    }
  };

  const [expandedCard, setExpandedCard] = useState(null);
  const [page, setPage] = useState(1);
  const cardsPerPage = 5;

  const handleExpandCard = (mujId) => {
    setExpandedCard(expandedCard === mujId ? null : mujId);
  };

  const getCurrentCards = () => {
    const startIndex = (page - 1) * cardsPerPage;
    const endIndex = startIndex + cardsPerPage;
    return mentees.slice(startIndex, endIndex);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo(0, 0);
  };

  return (
    <ThemeProvider theme={theme}>
      <div className="fixed inset-0 bg-gray-900 text-white overflow-auto pt-16"> {/* Added pt-16 for navbar */}
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
        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Header Section - Updated with center alignment */}
          <div className="flex items-center justify-center px-4 lg:px-6 pt-4 pb-2">
            <motion.h1 
              className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-pink-500 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Mentee Management
            </motion.h1>
          </div>

          {/* Main Grid Layout - Updated with better mobile/tablet handling */}
          <div className={`flex-1 grid gap-2 p-2 ${
            isSmallScreen || isTablet ? 'grid-cols-1' : 'grid-cols-[350px,1fr]'
          }`}>
            {/* Filter Panel - Updated positioning for mobile/tablet */}
            <div className={`${
              isSmallScreen || isTablet 
                ? 'h-auto max-h-[40vh]' 
                : 'h-[calc(100vh-100px)]'
            } overflow-auto`}>
              <div className="bg-black/80 backdrop-blur-xl rounded-3xl border border-white/10 p-4">
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
                  isLoading={loadingState.isLoading && loadingState.type === 'fetching'}
                />
              </div>
            </div>

            {/* Table/Cards Section - Updated to handle filter overlay */}
            <div className={`${
              isSmallScreen || isTablet 
                ? 'h-[calc(60vh-1rem)]' 
                : 'h-[calc(100vh-100px)]'
            } overflow-auto relative`}> {/* Added relative positioning */}
              <div className="bg-gradient-to-br from-orange-500/5 via-orange-500/10 to-transparent backdrop-blur-xl rounded-3xl border border-orange-500/20 h-full">
                <div className="h-full p-4">
                  {loadingState.initial ? (
                    <TableSkeleton rowsNum={8} />
                  ) : mentees.length > 0 ? (
                    <div className="h-full">
                      {isTablet || isSmallScreen ? (
                        // Card view for mobile and tablet
                        <div className="h-full overflow-auto pb-16"> {/* Added pb-16 to prevent content hiding behind pagination */}
                          {getCurrentCards().map((mentee) => (
                            <MenteeCard
                              key={mentee.MUJid}
                              mentee={mentee}
                              onEditClick={handleEditClick}
                              onDeleteClick={handleDelete}
                              expanded={expandedCard === mentee.MUJid}
                              onExpandClick={handleExpandCard}
                            />
                          ))}
                          {mentees.length > cardsPerPage && (
                            <Box sx={{ 
                              position: 'fixed',
                              bottom: 0,
                              left: 0,
                              right: 0,
                              display: 'flex', 
                              justifyContent: 'center',
                              backgroundColor: 'rgba(0,0,0,0.8)',
                              backdropFilter: 'blur(10px)',
                              py: 2,
                              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                              zIndex: 10,
                            }}>
                              <Pagination
                                count={Math.ceil(mentees.length / cardsPerPage)}
                                page={page}
                                onChange={handlePageChange}
                                size={isSmallScreen ? "small" : "medium"} // Adjust size based on screen
                                siblingCount={isSmallScreen ? 0 : 1} // Show fewer page numbers on mobile
                                sx={{
                                  '& .MuiPaginationItem-root': {
                                    color: 'white',
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    minWidth: isSmallScreen ? '30px' : '40px', // Smaller touch targets on mobile
                                    height: isSmallScreen ? '30px' : '40px',
                                    fontSize: isSmallScreen ? '0.875rem' : '1rem',
                                    '&.Mui-selected': {
                                      backgroundColor: '#f97316',
                                      fontWeight: 'bold',
                                      boxShadow: '0 0 10px rgba(249, 115, 22, 0.5)',
                                      '&:hover': {
                                        backgroundColor: '#ea580c',
                                      },
                                    },
                                    '&:hover': {
                                      backgroundColor: 'rgba(249, 115, 22, 0.2)',
                                    },
                                  },
                                }}
                              />
                            </Box>
                          )}
                        </div>
                      ) : (
                        // Table view for desktop
                        <div className="h-full overflow-auto">
                          <MenteeTable 
                            mentees={mentees}
                            onEditClick={handleEditClick}
                            onDeleteClick={handleDelete}
                            isSmallScreen={isSmallScreen}
                            onDataUpdate={handleDataUpdate}
                            isLoading={loadingState.fetching}
                            currentFilters={currentFilters}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center h-full">
                      <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                        {tableVisible ? 'No mentees found' : 'Select filters to load data'}
                      </Typography>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div> 
        </div>

        <AddMenteeDialog
          open={openDialog}
          onClose={handleDialogClose}
          menteeDetails={menteeDetails}
          onInputChange={handleInputChange}
          onSubmit={handleFormSubmit}
          academicSessions={academicSessions}
          onMenteeAdded={handleMenteeAdded} // Add this prop
        />

        <EditMenteeDialog
          open={editDialog}
          onClose={handleEditClose}
          mentee={selectedMentee}
          onUpdate={handleUpdate}
          loading={loadingState.isLoading && loadingState.type === 'update'}
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

        <Dialog open={confirmDialog.open} onClose={handleConfirmClose}>
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
              disabled={loadingState.isLoading && loadingState.type === 'update'}
              sx={{
                bgcolor: '#f97316',
                '&:hover': { bgcolor: '#ea580c' },
                '&:disabled': { bgcolor: 'rgba(249, 115, 22, 0.5)' }
              }}
            >
              {loadingState.isLoading && loadingState.type === 'update' ? 'Updating...' : 'Confirm'}
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
        {loadingState.isLoading && loadingState.type === 'update' && (
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
        <LoadingDialog 
          open={loadingDialog.open}
          message={loadingDialog.message}
        />
      </div>
    </ThemeProvider>
  );
};
export default MenteeManagement;
