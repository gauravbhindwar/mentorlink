'use client';
import { DataGrid } from '@mui/x-data-grid';
import { Button, Box, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Typography, IconButton, TextField } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import InfoIcon from '@mui/icons-material/Info';
import TransferIcon from '@mui/icons-material/SwapHoriz';
import MentorDetailsDialog from './MentorDetailsDialog';
import { useMemo, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Add this import
import { Stack } from '@mui/material';
import TransferLoadingDialog from './TransferLoadingDialog';
// import NoMenteesFound from './NoMenteesFound';
import NoMenteesDialog from './NoMenteesDialog';

const BATCH_SIZE = 50;
const BACKGROUND_BATCH_SIZE = 100;

const CustomLoadingOverlay = () => (
  <Box sx={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 2
  }}>
    <CircularProgress sx={{ color: '#ea580c' }} />
    <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
      Loading data...
    </Typography>
  </Box>
);

const CustomNoRowsOverlay = () => (
  <Box sx={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 2
  }}>
    <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
      No data available
    </Typography>
  </Box>
);

const MentorTable = ({ mentors, onEditClick, onDeleteClick, emailFilter, onDataUpdate }) => {
  const [deleteDialog, setDeleteDialog] = useState({ open: false, mujid: null });
  const [loading, setLoading] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState({ open: false, mentor: null });
  // const [filteredMentors, setFilteredMentors] = useState(mentors);
  const [transferDialog, setTransferDialog] = useState({ open: false, fromMentor: null });
  const [transferEmail, setTransferEmail] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState('');
  const [targetMentor, setTargetMentor] = useState(null);
  const [searchingMentor, setSearchingMentor] = useState(false);
  const [filters, setFilters] = useState({
    academicYear: '',
    academicSession: '',
    department: '',
    mentorMujid: '',
    mentorEmailid: ''
  });
  const [baseData, setBaseData] = useState([]);
  // const [localData, setLocalData] = useState([]);
  // const [loadingProgress, setLoadingProgress] = useState(0);
  // const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);
  const cachedData = useRef(new Map());
  const batchKey = useRef('');

  const [menteeStats, setMenteeStats] = useState(null);
  // const [selectedSemester, setSelectedSemester] = useState(null);
  // const [semesterMentees, setSemesterMentees] = useState([]);
  // const [loadingMentees, setLoadingMentees] = useState(false);
  const [targetMenteeStats, setTargetMenteeStats] = useState(null);
  const [showTransferLoading, setShowTransferLoading] = useState(false);
  const [showNoMenteesDialog, setShowNoMenteesDialog] = useState(false);

  // Add function to fetch mentee statistics
  const fetchMenteeStats = async (mentorId) => {
    try {
      const response = await axios.get(`/api/admin/getMenteesCount?mentorMujid=${mentorId}`);
      setMenteeStats(response.data.counts);
    } catch (error) {
      console.error('Error fetching mentee stats:', error);
      toast.error('Error loading mentee statistics', toastConfig);
    }
  };

  // Add function to fetch mentees for a specific semester
  // const fetchSemesterMentees = async (mentorId, semester) => {
  //   setLoadingMentees(true);
  //   try {
  //     const response = await axios.get(`/api/admin/getMenteesByMentor?mentorMujid=${mentorId}&semester=${semester}`);
  //     setSemesterMentees(response.data.mentees);
  //   } catch (error) {
  //     console.error('Error fetching semester mentees:', error);
  //     toast.error('Error loading mentee details', toastConfig);
  //   } finally {
  //     setLoadingMentees(false);
  //   }
  // };

  // Add this function to get data from cache or fetch
  const getDataFromCacheOrFetch = async (academicYear, academicSession) => {
    const cacheKey = `${academicYear}-${academicSession}`;

    if (cachedData.current.has(cacheKey)) {
      const data = cachedData.current.get(cacheKey);
      setBaseData(data);
      return data;
    }

    try {
      const response = await axios.get('/api/admin/manageUsers/manageMentor', {
        params: { academicYear, academicSession }
      });
      const data = response.data;
      cachedData.current.set(cacheKey, data);
      setBaseData(data);
      return data;
    } catch (error) {
      console.error("Error fetching data:", error);
      return [];
    }
  };

  // Define toast configuration
  const toastConfig = {
    position: "bottom-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "dark",
    style: {
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      backdropFilter: 'blur(8px)',
      borderRadius: '8px',
      border: '1px solid rgba(249, 115, 22, 0.2)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      fontSize: '0.875rem',
      padding: '12px 16px',
    }
  };

  // Add this function to handle delete click
  const handleDeleteClick = async (mujid) => {
    try {
      const response = await axios.get(`/api/admin/manageUsers/checkMentorMentees?mentorMujid=${mujid}`);
      
      if (response.data.hasMentees) {
        toast.warn(
          `Cannot delete mentor - ${response.data.menteeCount} mentees need to be transferred first`,
          toastConfig
        );
      } else {
        setDeleteDialog({ open: true, mujid });
      }
    } catch (error) {
      console.log('Error checking mentor status:', error);
      toast.error('Error checking mentor status', toastConfig);
    }
  };

  // Update handleConfirmDelete to properly update the table
  const handleConfirmDelete = async () => {
    if (deleteDialog.mujid) {
      setLoading(true);
      try {
        await onDeleteClick(deleteDialog.mujid);
        // toast.success('Mentor deleted successfully', toastConfig);
        
        // Update local data immediately
        const updatedMentors = mentors.filter(mentor => mentor.MUJid !== deleteDialog.mujid);
        if (onDataUpdate) {
          onDataUpdate(updatedMentors);
        }
        
      } catch (error) {
        toast.error('Error deleting mentor', toastConfig);
        console.error('Error deleting mentor:', error);
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
        // toast.error('No mentor found with this email in the same academic year and session', toastConfig);
        setSearchingMentor(false);
        return;
      }

      // Prevent self-transfer
      if (foundMentor.MUJid === transferDialog.fromMentor.MUJid) {
        setTransferError('Cannot transfer mentees to the same mentor');
        // toast.error('Cannot transfer mentees to the same mentor', toastConfig);
        setSearchingMentor(false);
        return;
      }

      setTargetMentor(foundMentor);
      // toast.success('Mentor found successfully', toastConfig);
      setSearchingMentor(false);

      // Fetch target mentor's mentee stats
      const menteeStatsResponse = await axios.get(`/api/admin/getMenteesCount?mentorMujid=${foundMentor.MUJid}`);
      setTargetMenteeStats(menteeStatsResponse.data.counts);

    } catch (error) {
      setTransferError(error.response?.data?.message || 'Error finding mentor');
      // toast.error(error.response?.data?.message || 'Error finding mentor', toastConfig);
      setSearchingMentor(false);
    }
  };

  // Add new function to handle the actual transfer
  const handleConfirmTransfer = async () => {
    setTransferLoading(true);
    setShowTransferLoading(true);
    try {
      const response = await axios.post('/api/admin/manageUsers/transferMentees', {
        fromMentorId: transferDialog.fromMentor.MUJid,
        toMentorEmail: transferEmail,
        academicYear: transferDialog.fromMentor.academicYear,
        academicSession: transferDialog.fromMentor.academicSession
      });

      if (response.data.success) {
        setShowTransferLoading(false);
        toast.success(
          `Successfully transferred ${response.data.updatedCount} mentees from ${transferDialog.fromMentor.name} to ${targetMentor.name}`,
          toastConfig
        );
        handleCloseTransferDialog();
        if (onDataUpdate) {
          onDataUpdate([...mentors]);
        }
      }
    } catch (error) {
      setShowTransferLoading(false);
      setTransferError(error.response?.data?.message || 'Error transferring mentees');
    } finally {
      setTransferLoading(false);
    }
  };

  // Update processedMentors function to include comprehensive search
  const processedMentors = useMemo(() => {
    // Return empty array if mentors is null/undefined
    if (!mentors) return [];

    const searchFields = ['name', 'email', 'MUJid', 'phone_number', 'academicYear', 'academicSession'];
    
    // Only filter if we have data and a filter value
    const menteesToProcess = (emailFilter && mentors.length > 0)
      ? mentors.filter(mentor => {
          const searchValue = emailFilter.toLowerCase();
          return searchFields.some(field => 
            mentor[field]?.toString().toLowerCase().includes(searchValue)
          );
        })
      : mentors;

    return menteesToProcess.map((item) => ({
      ...item,
      id: item._id || item.id,
      MUJid: (item.MUJid || '').toUpperCase(),
      name: item.name || '',
      email: item.email || '',
      phone_number: item.phone_number || '',
      academicYear: item.academicYear || '',
      academicSession: item.academicSession || '',
      role: Array.isArray(item.role) ? item.role : [item.role] || ['mentor'],
      gender: item.gender || '',
      isActive: item.isActive || false,
    }));
  }, [mentors, emailFilter]);

  // Add this effect to handle initial data loading
  useEffect(() => {
    const fetchDataInBatches = async () => {
      if (!mentors || mentors.length === 0) {
        const currentKey = `${filters.academicYear}-${filters.academicSession}`;
        if (cachedData.current.has(currentKey)) {
          return cachedData.current.get(currentKey);
        }

        try {
          const initialResponse = await axios.get('/api/admin/manageUsers/manageMentor', {
            params: {
              ...filters,
              batchSize: BATCH_SIZE,
              offset: 0
            }
          });

          const initialData = initialResponse.data;
          // setLoadingProgress(80);
          
          cachedData.current.set(currentKey, initialData);
          batchKey.current = currentKey;

          // setIsBackgroundLoading(true);
          const remainingResponse = await axios.get('/api/admin/manageUsers/manageMentor', {
            params: {
              ...filters,
              batchSize: BACKGROUND_BATCH_SIZE,
              offset: BATCH_SIZE
            }
          });

          const allData = [...initialData, ...remainingResponse.data];
          cachedData.current.set(currentKey, allData);
          // setLoadingProgress(100);
          // setIsBackgroundLoading(false);

          return allData;
        } catch (error) {
          console.error('Error fetching data:', error);
          // setLoadingProgress(100);
          return [];
        }
      }
    };

    fetchDataInBatches();
  }, [filters.academicYear, filters.academicSession]);

  // Add this effect to handle filtering
  useEffect(() => {
    const fetchAndCacheData = async () => {
      const currentKey = `${filters.academicYear}-${filters.academicSession}`;
      
      if (cachedData.current.has(currentKey)) {
        const cachedResult = cachedData.current.get(currentKey);
        setBaseData(Array.isArray(cachedResult) ? cachedResult : cachedResult?.mentors || []);
        // setLocalData(Array.isArray(cachedResult) ? cachedResult : cachedResult?.mentors || []);
        return;
      }
      
      try {
        const initialResponse = await axios.get('/api/admin/manageUsers/manageMentor', {
          params: {
            academicYear: filters.academicYear,
            academicSession: filters.academicSession,
            batchSize: BATCH_SIZE,
            offset: 0
          }
        });

        const mentorsData = initialResponse.data?.mentors || [];
        cachedData.current.set(currentKey, mentorsData);
        setBaseData(mentorsData);
        // setLocalData(mentorsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setBaseData([]);
        // setLocalData([]);
      }
    };

    if (filters.academicYear && filters.academicSession) {
      fetchAndCacheData();
    }
  }, [filters.academicYear, filters.academicSession]);

  // Add this effect to handle detailed filtering
  useEffect(() => {
    const applyFilters = async () => {
      let dataToFilter = baseData;

      if (!dataToFilter.length && filters.academicYear && filters.academicSession) {
        dataToFilter = await getDataFromCacheOrFetch(filters.academicYear, filters.academicSession);
      }

      // const filteredResults = dataToFilter.filter(mentor => {
      //   const matchesDepartment = !filters.department || 
      //     mentor.department?.toLowerCase().includes(filters.department.toLowerCase());
      //   const matchesMentorMujid = !filters.mentorMujid || 
      //     mentor.MUJid?.toLowerCase().includes(filters.mentorMujid.toLowerCase());
      //   const matchesMentorEmail = !filters.mentorEmailid || 
      //     mentor.email?.toLowerCase().includes(filters.mentorEmailid.toLowerCase());

      //   return matchesDepartment && matchesMentorMujid && matchesMentorEmail;
      // });

      // setLocalData(filteredResults);
    };

    applyFilters();
  }, [filters, baseData]);

  // Initialize filters with current academic year/session
  useEffect(() => {
    const initializeFilters = () => {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      
      const academicYear = `${currentYear}-${currentYear + 1}`;
      const academicSession = currentMonth >= 7 ? 
        `JULY-DECEMBER ${currentYear}` : 
        `JANUARY-JUNE ${currentYear}`;

      setFilters(prev => ({
        ...prev,
        academicYear,
        academicSession
      }));

      if (mentors?.length > 0) {
        const cacheKey = `${academicYear}-${academicSession}`;
        cachedData.current.set(cacheKey, mentors);
      }
    };

    initializeFilters();
  }, [mentors]);

  // Update useEffect to handle mentors prop changes
  useEffect(() => {
    if (Array.isArray(mentors)) {
      // setLocalData(mentors);
      setBaseData(mentors);
    } else if (mentors?.mentors) {
      // setLocalData(mentors.mentors);
      setBaseData(mentors.mentors);
    } else {
      // setLocalData([]);
      setBaseData([]);
    }
  }, [mentors]); // Add mentors as dependency

  // const [displayedMentors, setDisplayedMentors] = useState([]);

  // useEffect(() => {
  //   if (!mentors?.length) {
  //     setDisplayedMentors([]);
  //     return;
  //   }

    // If there's an email filter, apply it
  //   if (emailFilter) {
  //     const filtered = mentors.filter(mentor => 
  //       mentor.email.toLowerCase().includes(emailFilter.toLowerCase())
  //     );
  //     setDisplayedMentors(filtered);
  //   } else {
  //     setDisplayedMentors(mentors);
  //   }
  // }, [mentors, emailFilter]);

  // Update the column definitions to highlight search matches
  const columns = [
    { 
      field: 'serialNumber',    
      headerName: 'S.No',
      width: 70,
      minWidth: 70,
      disableColumnMenu: true,
      renderCell: (params) => {
        const index = processedMentors.findIndex(mentor => mentor.id === params.row.id);
        return index + 1;
      },
      sortable: false,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 180,
      sortable: true,
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1.2,
      minWidth: 220,
      sortable: true,
    },
    {
      field: 'phone_number',
      headerName: 'Phone',
      flex: 0.8,
      minWidth: 130,
      sortable: false,
    },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 120,
      minWidth: 120,
      sortable: true,
      renderCell: (params) => (
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          backgroundColor: params.value ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          padding: '4px 8px',
          borderRadius: '12px',
          width: '90px',
          justifyContent: 'center'
        }}>
          <div className={`w-2 h-2 rounded-full ${params.value ? 'bg-green-500' : 'bg-red-500'}`} />
          <Typography sx={{ 
            color: params.value ? '#22c55e' : '#ef4444',
            fontSize: '0.875rem'
          }}>
            {params.value ? 'Active' : 'Inactive'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 160,
      minWidth: 160,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ 
          display: 'flex', 
          gap: 0.5,
          justifyContent: 'center',
          width: '100%'
        }}>
          <IconButton
            onClick={() => setDetailsDialog({ open: true, mentor: params.row })}
            size="small"
            sx={{
              color: '#3b82f6',
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
            size="small"
            sx={{
              color: '#ea580c',
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
            size="small"
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
            size="small"
            sx={{
              color: '#10B981',
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
    sortable: col.sortable !== undefined ? col.sortable : true,
    renderHeader: (params) => (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'center',
        color: '#f5f5f5', // Changed from rgba(255, 255, 255, 0.9) to be more visible
        fontSize: '0.95rem',
        fontWeight: 600,
        width: '100%',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        padding: '8px',
        // Add text shadow for better contrast
        textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
        // Add hover effect for better interaction feedback
        '&:hover': {
          color: '#ffffff',
          textShadow: '0 1px 4px rgba(249, 115, 22, 0.3)',
        }
      }}>
        {params.colDef.headerName}
      </Box>
    ),
  }));

  const CustomHeader = () => (
    <Box sx={{
      p: 2,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid rgba(249, 115, 22, 0.3)',
      // background: 'linear-gradient(to right, rgba(249, 115, 22, 0.15), rgba(249, 115, 22, 0.05))',
      background: 'rgba(0, 0, 0, 0.8)',
    }}>
      <Typography variant="h6" sx={{ 
        color: '#ea580c', 
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

  // Add this effect to sync filters with academic periods
  useEffect(() => {
    if (filters.academicSession) {
      const [sessionType, year] = filters.academicSession.split(' ');
      const academicYear = sessionType === 'JULY-DECEMBER'
        ? `${year}-${parseInt(year) + 1}`
        : `${parseInt(year) - 1}-${year}`;
      
      setFilters(prev => ({
        ...prev,
        academicYear
      }));
    }
  }, [filters.academicSession]);

  // Update useEffect to sync with parent's filters
  useEffect(() => {
    if (mentors?.length > 0 && filters.academicYear && filters.academicSession) {
      // setLocalData(mentors);
      setBaseData(mentors);
      const cacheKey = `${filters.academicYear}-${filters.academicSession}`;
      cachedData.current.set(cacheKey, mentors);
    }
  }, [mentors, filters.academicYear, filters.academicSession]);

  // Move this function up, before any JSX or component usage
const handleCloseTransferDialog = () => {
  setTransferDialog({ open: false, fromMentor: null });
  setTransferEmail('');
  setTargetMentor(null);
  setTransferError('');
  setTargetMenteeStats(null);
  setShowTransferLoading(false);
  setShowNoMenteesDialog(false); // Add this line to close the no mentees dialog
};

  // Add a helper to check if mentor has mentees
  const hasMentees = (stats) => {
    return stats && Object.values(stats).some(count => count > 0);
  };

  // Add new component for email suggestions
const EmailSuggestionField = ({ value, onChange, mentors, error }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);

  const filterSuggestions = (inputValue) => {
    if (!inputValue || !Array.isArray(mentors)) return [];
    
    const inputLower = inputValue.toLowerCase();
    return mentors
      .filter(mentor => {
        // Add null checks for all fields
        const emailMatch = mentor?.email?.toLowerCase()?.includes(inputLower);
        const nameMatch = mentor?.name?.toLowerCase()?.includes(inputLower);
        const mujidMatch = mentor?.MUJid?.toString()?.toLowerCase()?.includes(inputLower);
        
        return emailMatch || nameMatch || mujidMatch;
      })
      .slice(0, 5);
  };

  useEffect(() => {
    // Only update suggestions if there's a value and mentors exist
    if (value && Array.isArray(mentors)) {
      setSuggestions(filterSuggestions(value));
    } else {
      setSuggestions([]);
    }
  }, [value, mentors]);

  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    onChange(inputValue);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (email) => {
    onChange(email);
    setShowSuggestions(false);
  };

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <Box sx={{ position: 'relative', width: '100%' }} ref={inputRef}>
      <TextField
        fullWidth
        autoFocus  // <-- Added autoFocus so the input remains selected
        placeholder="Search by email, name, or MUJID..."
        value={value}
        onChange={handleInputChange}
        onFocus={() => setShowSuggestions(true)}
        error={!!error}
        helperText={error}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            color: 'white',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(16, 185, 129, 0.3)',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#10B981',
              borderWidth: '2px',
            },
          },
          '& .MuiFormHelperText-root': {
            position: 'absolute',
            bottom: '-24px',
          }
        }}
      />
      {showSuggestions && suggestions.length > 0 && (
        <Box sx={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          mt: 1,
          bgcolor: 'rgba(0, 0, 0, 0.95)',
          borderRadius: '12px',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          zIndex: 1000,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          {suggestions.map((mentor) => (
            <Box
              key={mentor?.MUJid || Math.random()} // Add fallback for key
              sx={{
                p: 2,
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'rgba(16, 185, 129, 0.1)',
                },
                borderBottom: '1px solid rgba(16, 185, 129, 0.1)'
              }}
              onClick={() => handleSuggestionClick(mentor?.email || '')}
            >
              <Typography sx={{ color: 'white', fontSize: '0.9rem' }}>
                {mentor?.email || 'No email'}
              </Typography>
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.8rem' }}>
                {mentor?.name || 'No name'} • {mentor?.MUJid || 'No ID'}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

  // Update the transfer dialog content
const renderTransferDialogContent = () => (
  <DialogContent sx={{ 
    my: 2, 
    px: 4, 
    py: 3,
    minWidth: '900px',
    maxHeight: '85vh',
    overflow: 'auto',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(10px)',
  }}>
    {/* <Box sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ 
        color: '#10B981', 
        mb: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        fontSize: '1.5rem',
        fontWeight: 600
      }}>
        <TransferIcon /> Mentee Transfer
      </Typography>
      <Typography variant="body1" sx={{ 
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '1rem'
      }}>
        Transfer mentees between mentors in the same academic period
      </Typography>
    </Box> */}

    {/* Search Section - Always Visible */}
    <Box sx={{ 
      mb: 4,
      p: 3,
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      borderRadius: '12px',
      border: '1px solid rgba(16, 185, 129, 0.2)',
    }}>
      <Typography variant="subtitle1" sx={{ 
        color: '#10B981',
        mb: 2,
        fontWeight: 500
      }}>
        Search Target Mentor
      </Typography>
      <Box sx={{ 
        display: 'flex',
        gap: 2,
        alignItems: 'flex-start'
      }}>
        <EmailSuggestionField
          value={transferEmail}
          onChange={setTransferEmail}
          mentors={mentors}
          error={transferError}
        />
        <Button
          onClick={handleTransferMentees}
          disabled={!transferEmail || searchingMentor}
          variant="contained"
          sx={{
            bgcolor: '#10B981',
            height: '56px',
            px: 4,
            whiteSpace: 'nowrap',
            '&:hover': { bgcolor: '#059669' },
            '&.Mui-disabled': {
              bgcolor: 'rgba(16, 185, 129, 0.3)',
            }
          }}
        >
          {searchingMentor ? (
            <CircularProgress size={24} sx={{ color: 'white' }} />
          ) : (
            'Search Mentor'
          )}
        </Button>
      </Box>
    </Box>

    <Box sx={{ 
      display: 'grid', 
      gridTemplateColumns: '1fr 80px 1fr', 
      gap: 3,
      alignItems: 'start'
    }}>
      {/* Source Mentor Card */}
      <Box sx={{
        p: 3,
        bgcolor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        transition: 'all 0.3s ease',
        '&:hover': {
          bgcolor: 'rgba(255, 255, 255, 0.08)',
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)'
        }
      }}>
        <Typography variant="h6" sx={{ 
          color: '#fff',
          mb: 3,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          Source Mentor
          <Box sx={{ 
            ml: 'auto',
            px: 2,
            py: 0.5,
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            fontSize: '0.875rem',
            color: 'rgba(255, 255, 255, 0.7)'
          }}>
            {transferDialog.fromMentor?.MUJid}
          </Box>
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ 
            color: '#fff',
            fontWeight: 500,
            fontSize: '1.1rem'
          }}>
            {transferDialog.fromMentor?.name}
          </Typography>
          <Typography sx={{ 
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '0.9rem'
          }}>
            {transferDialog.fromMentor?.email}
          </Typography>
        </Box>

        {menteeStats && (
          <Box>
            <Typography variant="subtitle2" sx={{ 
              color: '#10B981', 
              mb: 2,
              fontWeight: 500
            }}>
              Current Mentees
            </Typography>
            {menteeStats ? (
              hasMentees(menteeStats) ? (
                <Stack spacing={1.5}>
                  {Object.entries(menteeStats).map(([semester, count]) => (
                    <Box key={semester} sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      p: 2,
                      bgcolor: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                      <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                        Semester {semester}
                      </Typography>
                      <Typography sx={{ 
                        color: '#10B981',
                        fontWeight: 600,
                        bgcolor: 'rgba(16, 185, 129, 0.1)',
                        px: 2,
                        py: 0.5,
                        borderRadius: '6px'
                      }}>
                        {count} mentees
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              ) : (
                // Remove the inline NoMenteesFound component
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  p: 3
                }}>
                  <Typography sx={{ 
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontStyle: 'italic'
                  }}>
                    No mentees assigned
                  </Typography>
                </Box>
              )
            ) : (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center',
                py: 2 
              }}>
                <CircularProgress size={24} sx={{ color: '#10B981' }} />
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Center Arrow */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        height: '100%',
        pt: 8
      }}>
        <TransferIcon sx={{ 
          fontSize: '2.5rem', 
          color: '#10B981',
          animation: targetMentor ? 'pulse 2s infinite' : 'none',
          '@keyframes pulse': {
            '0%': { opacity: 0.6, transform: 'scale(1)' },
            '50%': { opacity: 1, transform: 'scale(1.1)' },
            '100%': { opacity: 0.6, transform: 'scale(1)' }
          }
        }} />
      </Box>

      {/* Target Mentor Card */}
      <Box sx={{
        p: 3,
        bgcolor: targetMentor ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.02)',
        borderRadius: '12px',
        border: `1px solid ${targetMentor ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
        transition: 'all 0.3s ease',
        '&:hover': targetMentor ? {
          bgcolor: 'rgba(16, 185, 129, 0.15)',
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 16px rgba(16, 185, 129, 0.1)'
        } : {}
      }}>
        <Typography variant="h6" sx={{ 
          color: targetMentor ? '#10B981' : '#fff',
          mb: 3,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          Target Mentor
          {targetMentor && (
            <Box sx={{ 
              ml: 'auto',
              px: 2,
              py: 0.5,
              bgcolor: 'rgba(16, 185, 129, 0.2)',
              borderRadius: '8px',
              fontSize: '0.875rem',
              color: '#10B981'
            }}>
              {targetMentor.MUJid}
            </Box>
          )}
        </Typography>

        {targetMentor && (
          <>
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ 
                color: '#fff',
                fontWeight: 500,
                fontSize: '1.1rem'
              }}>
                {targetMentor.name}
              </Typography>
              <Typography sx={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.9rem'
              }}>
                {targetMentor.email}
              </Typography>
            </Box>

            {targetMenteeStats && (
              <Box>
                <Typography variant="subtitle2" sx={{ 
                  color: '#10B981', 
                  mb: 2,
                  fontWeight: 500
                }}>
                  Existing Mentees
                </Typography>
                <Stack spacing={1.5}>
                  {Object.entries(targetMenteeStats).map(([semester, count]) => (
                    <Box key={semester} sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      p: 2,
                      bgcolor: 'rgba(16, 185, 129, 0.1)',
                      borderRadius: '8px',
                      border: '1px solid rgba(16, 185, 129, 0.2)'
                    }}>
                      <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                        Semester {semester}
                      </Typography>
                      <Typography sx={{ 
                        color: '#10B981',
                        fontWeight: 600,
                        bgcolor: 'rgba(16, 185, 129, 0.2)',
                        px: 2,
                        py: 0.5,
                        borderRadius: '6px'
                      }}>
                        {count} mentees
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  </DialogContent>
);

  // Update useEffect to fetch mentee stats when transfer dialog opens
  useEffect(() => {
    if (transferDialog.open && transferDialog.fromMentor) {
      fetchMenteeStats(transferDialog.fromMentor.MUJid);
    } else {
      setMenteeStats(null);
      // setSelectedSemester(null);
      // setSemesterMentees([]);
    }
  }, [transferDialog.open, transferDialog.fromMentor]);

  // Add this effect to check mentee stats and show dialog
  useEffect(() => {
    if (menteeStats && !hasMentees(menteeStats)) {
      setShowNoMenteesDialog(true);
    }
  }, [menteeStats]);

  // Update the NoMenteesDialog close handler
  const handleNoMenteesClose = () => {
    setShowNoMenteesDialog(false);
    handleCloseTransferDialog(); // Close transfer dialog as well
  };

  return (
    <Box sx={{ 
       // Responsive height
        width: '100%',
        position: 'relative', 
        overflow: 'hidden',
        display: 'flex',
        height: '100%',
        // flexDirection: 'column',
        transition: 'all 0.3s ease',
          }}>
        <ToastContainer
          position="bottom-right" 
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
          limit={3}
          style={{
            minWidth: '300px',
            maxWidth: '400px'
          }}
          toastStyle={{
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(8px)',
            borderRadius: '8px',
            border: '1px solid rgba(249, 115, 22, 0.2)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            fontSize: '0.875rem',
            padding: '12px 16px',
          }}
        />
        {loading && (
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 10,
            borderRadius: 2
          }}>
            <CircularProgress sx={{ color: '#ea580c', mb: 2 }} />
            <Typography sx={{ color: 'white' }}>
          Loading...
            </Typography>
          </Box>
        )}
        
        <DataGrid
          rows={processedMentors || []} // Add fallback empty array
        columns={columns}
        getRowId={(row) => row?._id || row?.id || String(Math.random())} // Add safer row ID getter
        initialState={{
          pagination: {
            paginationModel: { pageSize: 10, page: 0 },
          },
        }}
        pageSizeOptions={[10, 25, 50]}
        sx={{
          height: { xs: '500px', lg: '100%' }, // Responsive height
          width: '100%',
          '& .MuiDataGrid-main': {
            overflow: 'auto',
            minHeight: { xs: '300px', lg: '100vh-250px' }, // Responsive minHeight
            maxHeight: { xs: '500px', lg: 'calc(100vh - 250px)' }, // Responsive maxHeight
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
          backgroundColor: 'transparent',
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
            minHeight: '50px !important',
            maxHeight: 'unset !important',
            whiteSpace: 'normal',
            lineHeight: '1.5',
            transition: 'all 0.2s ease',
            backgroundColor: 'transparent',
          },
          '& .MuiDataGrid-columnHeaders': {
            position: 'sticky',
            top: 0,
            zIndex: 2,
            backgroundColor: 'rgba(249, 115, 22, 0.15)', // Changed to match MenteeTable
            borderBottom: '2px solid rgba(249, 115, 22, 0.3)',
            transition: 'none !important',
            minHeight: '56px !important', // Ensure minimum height
            '& .MuiDataGrid-columnHeader': {
              outline: 'none !important', // Remove focus outline
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              
            }
          },
          '& .MuiDataGrid-columnHeader': {
            transition: 'background-color 0.2s ease',
            '& .MuiDataGrid-columnSeparator': {
              transition: 'opacity 0.3s ease',
            },
          },
          '& .MuiDataGrid-sortIcon': {
            color: '#ea580c',
            opacity: 0.5,
          },
          '& .MuiDataGrid-columnHeader--sorted .MuiDataGrid-sortIcon': {
            opacity: 1,
          },
          '& .MuiDataGrid-columnHeaderTitle': {
            fontWeight: 600,
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
        disableSelectionOnClick={true}
        disableColumnMenu={true}
        disableRowSelectionOnClick={true}
        disableColumnFilter={false}
        loading={!mentors.length}
        components={{
          LoadingOverlay: CustomLoadingOverlay,
          NoRowsOverlay: CustomNoRowsOverlay,
          Header: CustomHeader,
          Footer: CustomFooter,
        }}
        componentsProps={{
          columnHeaders: {
            sx: {
              transition: 'none !important',
            },
          },
          virtualScroller: {
            sx: {
              scrollBehavior: 'smooth',
            },
          },
        }}
        columnBuffer={5}
        rowBuffer={10}
        rowHeight={50}
        headerHeight={50}
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
          <Typography color="white">
            Are you sure you want to delete this mentor? This action cannot be undone.
            <br/><br/>
            <span style={{ color: '#10B981' }}>✓ Verified: No assigned mentees</span>
          </Typography>
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
        onClose={handleCloseTransferDialog}
        maxWidth="lg"
        PaperProps={{ 
          sx: {
            backgroundColor: '#1a1a1a',
            color: 'white',
            borderRadius: '20px',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            backgroundImage: 'linear-gradient(to bottom right, rgba(16, 185, 129, 0.1), transparent)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          } 
        }}
      >
        <DialogTitle sx={{ 
          color: '#F97316',
          borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
          p: 3,
          fontWeight: 600,
          fontSize: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1
        }}>
          <TransferIcon /> Transfer Mentees
        </DialogTitle>
        {renderTransferDialogContent()}
        <DialogActions sx={{ 
          borderTop: '1px solid rgba(16, 185, 129, 0.2)', 
          p: 3,
          gap: 2
        }}>
          <Button
            onClick={handleCloseTransferDialog}
            variant="outlined"
            sx={{
              color: 'white',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              px: 3,
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
                bgcolor: '#10B981',
                px: 4,
                '&:hover': { bgcolor: '#059669' }
              }}
            > 
              {transferLoading ? (
                <CircularProgress size={24} sx={{ color: 'white' }} />
              ) : (
                'Confirm Transfer'
              )}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <TransferLoadingDialog open={showTransferLoading} />

      <NoMenteesDialog
        open={showNoMenteesDialog}
        onClose={handleNoMenteesClose} // Use the new handler
        mentorName={transferDialog.fromMentor?.name}
      />
    </Box>
  );
};

export default MentorTable;
