'use client';
import { DataGrid } from '@mui/x-data-grid';
import { Button, Box, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Typography, IconButton, TextField } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import InfoIcon from '@mui/icons-material/Info';
import TransferIcon from '@mui/icons-material/SwapHoriz';
import SelectIcon from '@mui/icons-material/FilterList'; // Add this import
import MentorDetailsDialog from './MentorDetailsDialog';
import SelectiveMenteeTransferDialog from './SelectiveMenteeTransferDialog'; // Add this import
import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Add this import
import { Stack } from '@mui/material';
import TransferLoadingDialog from './TransferLoadingDialog';
import NoMenteesDialog from './NoMenteesDialog';

const BATCH_SIZE = 50;
const BACKGROUND_BATCH_SIZE = 100;
const INITIAL_VISIBLE_ROWS = 10;
const ROW_LOAD_STEP = 10;

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
  const cachedData = useRef(new Map());
  const batchKey = useRef('');
  const gridContainerRef = useRef(null);
  const [menteeStats, setMenteeStats] = useState(null);
  const [targetMenteeStats, setTargetMenteeStats] = useState(null);
  const [showTransferLoading, setShowTransferLoading] = useState(false);
  const [showNoMenteesDialog, setShowNoMenteesDialog] = useState(false);
  const [selectiveMenteeDialog, setSelectiveMenteeDialog] = useState(false); // Add this state
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_ROWS);

  const fetchMenteeStats = async (mentorId) => {
    try {
      const response = await axios.get(`/api/admin/getMenteesCount?mentorMujid=${mentorId}`);
      setMenteeStats(response.data.counts);
    } catch (error) {
      console.error('Error fetching mentee stats:', error);
      toast.error('Error loading mentee statistics', toastConfig);
    }
  };

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

  const handleConfirmDelete = async () => {
    if (deleteDialog.mujid) {
      setLoading(true);
      try {
        await onDeleteClick(deleteDialog.mujid);
        
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

  const handleTransferMentees = async () => {
    setSearchingMentor(true);
    setTransferError('');
    
    try {
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
        setSearchingMentor(false);
        return;
      }

      if (foundMentor.MUJid === transferDialog.fromMentor.MUJid) {
        setTransferError('Cannot transfer mentees to the same mentor');
        setSearchingMentor(false);
        return;
      }

      setTargetMentor(foundMentor);
      setSearchingMentor(false);

      const menteeStatsResponse = await axios.get(`/api/admin/getMenteesCount?mentorMujid=${foundMentor.MUJid}`);
      setTargetMenteeStats(menteeStatsResponse.data.counts);

    } catch (error) {
      setTransferError(error.response?.data?.message || 'Error finding mentor');
      setSearchingMentor(false);
    }
  };

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

  const processedMentors = useMemo(() => {
    if (!mentors) return [];

    const searchFields = ['name', 'email', 'MUJid', 'phone_number', 'academicYear', 'academicSession'];
    
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

  const displayedMentors = useMemo(() => {
    if (!processedMentors.length) return [];
    return processedMentors.slice(0, Math.min(visibleCount, processedMentors.length));
  }, [processedMentors, visibleCount]);

  useEffect(() => {
    if (!processedMentors.length) {
      setVisibleCount(0);
      return;
    }

    setVisibleCount((prev) => {
      if (prev === 0) {
        return Math.min(INITIAL_VISIBLE_ROWS, processedMentors.length);
      }

      if (prev > processedMentors.length) {
        return processedMentors.length;
      }

      return prev;
    });
  }, [processedMentors.length]);

  const hasMoreRows = visibleCount < processedMentors.length;

  const loadMoreRows = useCallback(() => {
    if (!hasMoreRows) {
      return;
    }

    setVisibleCount((prev) => {
      if (prev >= processedMentors.length) {
        return prev;
      }

      return Math.min(prev + ROW_LOAD_STEP, processedMentors.length);
    });
  }, [hasMoreRows, processedMentors.length]);

  useEffect(() => {
    const container = gridContainerRef.current;
    if (!container) return;

    const scroller = container.querySelector('.MuiDataGrid-virtualScroller');
    if (!scroller) return;

    const handleScroll = () => {
      if (!hasMoreRows) return;

      const { scrollTop, scrollHeight, clientHeight } = scroller;
      if (scrollHeight - (scrollTop + clientHeight) <= 40) {
        loadMoreRows();
      }
    };

    scroller.addEventListener('scroll', handleScroll);
    return () => {
      scroller.removeEventListener('scroll', handleScroll);
    };
  }, [hasMoreRows, loadMoreRows]);

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
          
          cachedData.current.set(currentKey, initialData);
          batchKey.current = currentKey;

          const remainingResponse = await axios.get('/api/admin/manageUsers/manageMentor', {
            params: {
              ...filters,
              batchSize: BACKGROUND_BATCH_SIZE,
              offset: BATCH_SIZE
            }
          });

          const allData = [...initialData, ...remainingResponse.data];
          cachedData.current.set(currentKey, allData);

          return allData;
        } catch (error) {
          console.error('Error fetching data:', error);
          return [];
        }
      }
    };

    fetchDataInBatches();
  }, [filters.academicYear, filters.academicSession]);

  useEffect(() => {
    const fetchAndCacheData = async () => {
      const currentKey = `${filters.academicYear}-${filters.academicSession}`;
      
      if (cachedData.current.has(currentKey)) {
        const cachedResult = cachedData.current.get(currentKey);
        setBaseData(Array.isArray(cachedResult) ? cachedResult : cachedResult?.mentors || []);
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
      } catch (error) {
        console.error('Error fetching data:', error);
        setBaseData([]);
      }
    };

    if (filters.academicYear && filters.academicSession) {
      fetchAndCacheData();
    }
  }, [filters.academicYear, filters.academicSession]);

  useEffect(() => {
    const applyFilters = async () => {
      let dataToFilter = baseData;

      if (!dataToFilter.length && filters.academicYear && filters.academicSession) {
        dataToFilter = await getDataFromCacheOrFetch(filters.academicYear, filters.academicSession);
      }
    };

    applyFilters();
  }, [filters, baseData]);

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

  useEffect(() => {
    if (Array.isArray(mentors)) {
      setBaseData(mentors);
    } else if (mentors?.mentors) {
      setBaseData(mentors.mentors);
    } else {
      setBaseData([]);
    }
  }, [mentors]);

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
        color: '#f5f5f5',
        fontSize: '0.95rem',
        fontWeight: 600,
        width: '100%',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        padding: '8px',
        textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
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
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTop: '1px solid rgba(249, 115, 22, 0.3)',
      background: 'linear-gradient(to right, rgba(249, 115, 22, 0.15), rgba(249, 115, 22, 0.05))',
    }}>
      <Typography variant="body2" sx={{ 
        color: 'rgba(249, 115, 22, 0.9)',
        fontWeight: 500
      }}>
        Showing {displayedMentors.length} of {processedMentors.length} mentors
      </Typography>
      <Typography variant="body2" sx={{ 
        color: 'rgba(249, 115, 22, 0.9)',
        fontWeight: 500
      }}>
        Last updated: {new Date().toLocaleDateString()}
      </Typography>
    </Box>
  );

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

  useEffect(() => {
    if (mentors?.length > 0 && filters.academicYear && filters.academicSession) {
      setBaseData(mentors);
      const cacheKey = `${filters.academicYear}-${filters.academicSession}`;
      cachedData.current.set(cacheKey, mentors);
    }
  }, [mentors, filters.academicYear, filters.academicSession]);

  const handleCloseTransferDialog = () => {
    setTransferDialog({ open: false, fromMentor: null });
    setTransferEmail('');
    setTargetMentor(null);
    setTransferError('');
    setTargetMenteeStats(null);
    setShowTransferLoading(false);
    setShowNoMenteesDialog(false);
  };

  const hasMentees = (stats) => {
    return stats && Object.values(stats).some(count => count > 0);
  };

  const EmailSuggestionField = ({ value, onChange, mentors, error }) => {
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef(null);

    const filterSuggestions = (inputValue) => {
      if (!inputValue || !Array.isArray(mentors)) return [];
      
      const inputLower = inputValue.toLowerCase();
      return mentors
        .filter(mentor => {
          const emailMatch = mentor?.email?.toLowerCase()?.includes(inputLower);
          const nameMatch = mentor?.name?.toLowerCase()?.includes(inputLower);
          const mujidMatch = mentor?.MUJid?.toString()?.toLowerCase()?.includes(inputLower);
          
          return emailMatch || nameMatch || mujidMatch;
        })
        .slice(0, 5);
    };

    useEffect(() => {
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
          autoFocus
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
                key={mentor?.MUJid || Math.random()}
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
      <Box sx={{ 
        mb: 4,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="h6" sx={{ 
          color: '#10B981', 
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          fontSize: '1.5rem',
          fontWeight: 600
        }}>
          <TransferIcon /> Mentee Transfer
        </Typography>
        
        {/* Only show Select Mentees button when a target mentor is found */}
        {targetMentor && (
          <Button
            variant="outlined"
            startIcon={<SelectIcon />}
            onClick={() => setSelectiveMenteeDialog(true)}
            sx={{
              color: '#10B981',
              borderColor: 'rgba(16, 185, 129, 0.3)',
              '&:hover': {
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)'
              }
            }}
          >
            Select Mentees
          </Button>
        )}
      </Box>

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

  useEffect(() => {
    if (transferDialog.open && transferDialog.fromMentor) {
      fetchMenteeStats(transferDialog.fromMentor.MUJid);
    } else {
      setMenteeStats(null);
    }
  }, [transferDialog.open, transferDialog.fromMentor]);

  useEffect(() => {
    if (menteeStats && !hasMentees(menteeStats)) {
      setShowNoMenteesDialog(true);
    }
  }, [menteeStats]);

  const handleNoMenteesClose = () => {
    setShowNoMenteesDialog(false);
    handleCloseTransferDialog();
  };

  const handleSelectiveTransferComplete = () => {
    setSelectiveMenteeDialog(false);
    handleCloseTransferDialog();
    if (onDataUpdate) {
      onDataUpdate([...mentors]);
    }
  };

  return (
    <Box sx={{ 
      width: '100%',
      position: 'relative', 
      overflow: 'hidden',
      display: 'flex',
      height: '100%',
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
      
      <Box ref={gridContainerRef} sx={{ width: '100%', flex: 1 }}>
        <DataGrid
          rows={displayedMentors}
          columns={columns}
          getRowId={(row) => row?._id || row?.id || String(Math.random())}
          sx={{
            height: { xs: '500px', lg: '100%' },
            width: '100%',
            '& .MuiDataGrid-main': {
              overflow: 'auto',
              minHeight: { xs: '300px', lg: '100vh-250px' },
              maxHeight: { xs: '500px', lg: 'calc(100vh - 250px)' },
              height: '100%',
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
              height: '100% !important',
              minHeight: { xs: '300px', lg: '200px' },
              maxHeight: { xs: '500px', lg: 'unset !important' },
            },
            '& .MuiDataGrid-virtualScrollerContent': {
              minWidth: 'fit-content',
              height: '100%',
            },
            '& .MuiDataGrid-virtualScrollerRenderZone': {
              width: '100%',
              height: '100%',
            },
            width: '100%',
            height: '100%',
            minHeight: '400px',
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
              backgroundColor: 'rgba(249, 115, 22, 0.15)',
              borderBottom: '2px solid rgba(249, 115, 22, 0.3)',
              transition: 'none !important',
              minHeight: '56px !important',
              '& .MuiDataGrid-columnHeader': {
                outline: 'none !important',
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
              minHeight: '56px !important',
              maxHeight: '56px !important',
              borderTop: '2px solid rgba(249, 115, 22, 0.3)',
              zIndex: 2,
              borderRadius: '0 0 12px 12px',
              backdropFilter: 'blur(10px)',
              marginTop: 'auto',
              display: 'flex',
              position: 'sticky',
              bottom: 0,
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
              color: 'rgba(255, 255, 255, 0.9)',
            },
            '& .MuiTablePagination-selectIcon': {
              color: '#ea580c',
            },
            '& .MuiMenu-paper': {
              bgcolor: 'rgba(0, 0, 0, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(249, 115, 22, 0.2)',
            },
            '& .MuiMenuItem-root': {
              color: 'rgba(255, 255, 255, 0.9)',
              '&.Mui-selected': {
                backgroundColor: 'rgba(249, 115, 22, 0.3)',
                color: '#ea580c',
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: 'rgba(249, 115, 22, 0.4)',
                },
              },
              '&:hover': {
                backgroundColor: 'rgba(249, 115, 22, 0.1)',
              },
            },
            flex: 2,
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
          hideFooterPagination
        />
      </Box>
      
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
        onClose={handleNoMenteesClose}
        mentorName={transferDialog.fromMentor?.name}
      />

      <SelectiveMenteeTransferDialog
        open={selectiveMenteeDialog}
        onClose={() => setSelectiveMenteeDialog(false)}
        fromMentor={transferDialog.fromMentor}
        targetMentor={targetMentor}
        toastConfig={toastConfig}
        academicYear={transferDialog.fromMentor?.academicYear}
        academicSession={transferDialog.fromMentor?.academicSession}
        onTransferComplete={handleSelectiveTransferComplete}
      />
    </Box>
  );
};

export default MentorTable;
