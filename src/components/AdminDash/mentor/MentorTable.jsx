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

const MentorTable = ({ mentors, onEditClick, onDeleteClick, emailFilter }) => {
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

  // Update handleConfirmDelete to include loading state
  const handleConfirmDelete = async () => {
    if (deleteDialog.mujid) {
      setLoading(true);
      try {
        await onDeleteClick(deleteDialog.mujid);
        toast.success('Mentor deleted successfully', toastConfig);
        // Update local data
        if (onDataUpdate) {
          onDataUpdate(prevMentors => 
            prevMentors.filter(m => m.MUJid !== deleteDialog.mujid)
          );
        }
      } catch (error) {
        toast.error('Error deleting mentor', toastConfig);
        console.log('Error deleting mentor:', error);
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
        toast.error('No mentor found with this email in the same academic year and session', toastConfig);
        setSearchingMentor(false);
        return;
      }

      // Prevent self-transfer
      if (foundMentor.MUJid === transferDialog.fromMentor.MUJid) {
        setTransferError('Cannot transfer mentees to the same mentor');
        toast.error('Cannot transfer mentees to the same mentor', toastConfig);
        setSearchingMentor(false);
        return;
      }

      setTargetMentor(foundMentor);
      toast.success('Mentor found successfully', toastConfig);
      setSearchingMentor(false);

    } catch (error) {
      setTransferError(error.response?.data?.message || 'Error finding mentor');
      toast.error(error.response?.data?.message || 'Error finding mentor', toastConfig);
      setSearchingMentor(false);
    }
  };

  // Add new function to handle the actual transfer
  const handleConfirmTransfer = async () => {
    setTransferLoading(true);
    try {
      const response = await axios.post('/api/admin/manageUsers/transferMentees', {
        fromMentorId: transferDialog.fromMentor.MUJid,
        toMentorEmail: transferEmail,
        academicYear: transferDialog.fromMentor.academicYear,
        academicSession: transferDialog.fromMentor.academicSession
      });

      if (response.data.success) {
        toast.success(
          `Successfully transferred ${response.data.updatedCount} mentees from ${transferDialog.fromMentor.name} to ${targetMentor.name}`,
          toastConfig
        );
        setTransferDialog({ open: false, fromMentor: null });
        setTransferEmail('');
        setTargetMentor(null);
        if (onDataUpdate) {
          onDataUpdate([...mentors]);
        }
      }
    } catch (error) {
      toast.error(
        `Error transferring mentees: ${error.response?.data?.message || 'Unknown error'}`,
        toastConfig
      );
      setTransferError(error.response?.data?.message || 'Error transferring mentees');
    } finally {
      setTransferLoading(false);
    }
  };

  // Process mentors data - Update this to include all necessary fields
  const processedMentors = useMemo(() => {
    const mentorsToProcess = emailFilter 
      ? mentors.filter(mentor => 
          mentor.email.toLowerCase().includes(emailFilter.toLowerCase()))
      : mentors;

    return mentorsToProcess.map((item) => ({
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

  const columns = [
    { 
      field: 'serialNumber',    
      headerName: 'S.No',
      flex: 0.4,
      renderCell: (params) => {
        const index = params.api.getRowIndexRelativeToVisibleRows(params.row.id);
        return index !== undefined ? index + 1 : '';
      },
      sortable: true,
    },
    {
      field: 'MUJid',
      headerName: 'MUJ ID', 
      flex: 0.8,
      sortable: true,
    },
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      sortable: true,
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1.2,
      sortable: false,
    },
    {
      field: 'phone_number',
      headerName: 'Phone',
      flex: 0.8,
      sortable: false,
    },
    {
      field: 'isActive',
      headerName: 'Status',
      flex: 0.6,
      renderCell: (params) => (
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          backgroundColor: params.value ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          padding: '4px 8px',
          borderRadius: '12px',
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
      headerAlign: 'center',
      align: 'center',
      width: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            onClick={() => setDetailsDialog({ open: true, mentor: params.row })}
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
    sortable: col.field !== 'actions' && col.field !== 'serialNumber',
    renderHeader: (params) => (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'center',
        color: '#333',  // Updated text color
        fontSize: '0.95rem',
        backgroundColor: '#f5f5f5',  // Updated header color
        fontWeight: 600,
        width: '100%'
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

  return (
    <Box sx={{ 
       // Responsive height
        width: '100%',
        position: 'relative', 
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
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
            minHeight: { xs: '300px', lg: '200px' }, // Responsive minHeight
            maxHeight: { xs: '500px', lg: 'calc(100vh - 300px)' }, // Responsive maxHeight
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
            minHeight: '60px !important',
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
            backgroundColor: 'rgba(0, 0, 0, 0.9)', // Darker black background
            borderBottom: '2px solid rgba(249, 115, 22, 0.3)',
            transition: 'none !important',
            background: 'rgba(0, 0, 0, 0.9)', // Remove gradient, use solid black
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
        rowHeight={60}
        headerHeight={56}
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
        onClose={() => {
          setTransferDialog({ open: false, fromMentor: null });
          setTransferEmail('');
          setTargetMentor(null);
          setTransferError('');
        }}
        PaperProps={{ sx: {
          backgroundColor: '#1a1a1a',
          color: 'white',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        } }}
      >
        <DialogTitle sx={{ color: '#10B981', borderBottom: '1px solid rgba(16, 185, 129, 0.2)' }}>
          Transfer Mentees
        </DialogTitle>
        <DialogContent sx={{ my: 2, px: 3 }}>
          <Typography variant="body2" sx={{ mb: 3, color: 'rgba(255, 255, 255, 0.7)' }}>
            Transfer mentees from {transferDialog.fromMentor?.name} ({transferDialog.fromMentor?.MUJid})
          </Typography>
          
          {!targetMentor ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Enter Mentor Email"
                value={transferEmail}
                onChange={(e) => setTransferEmail(e.target.value)}
                error={!!transferError}
                helperText={transferError}
                disabled={searchingMentor}
                sx={{
                  '& .MuiInputBase-root': {
                    color: 'white',
                  },
                  '& .MuiFormLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.7)',
                    },
                  },
                  '& .MuiFormHelperText-root': {
                    color: '#ef4444',
                  },
                }}
              />
              <Button
                onClick={handleTransferMentees}
                variant="contained"
                disabled={!transferEmail || searchingMentor}
                sx={{
                  bgcolor: '#ea580c',
                  '&:hover': { bgcolor: '#ea580c' }
                }}
              >
                {searchingMentor ? <CircularProgress size={24} /> : 'Find Mentor'}
              </Button>
            </Box>
          ) : (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" sx={{ color: '#ea580c', mb: 2 }}>
                Transfer to:
              </Typography>
              <Box sx={{ 
                p: 3,
                bgcolor: 'rgba(249, 115, 22, 0.1)',
                borderRadius: 2,
                border: '1px solid rgba(249, 115, 22, 0.2)'
              }}>
                <Typography variant="body1" sx={{ color: 'white', mb: 2, fontWeight: 500 }}>
                  {targetMentor.name}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    <strong>MUJ ID:</strong> {targetMentor.MUJid}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    <strong>Email:</strong> {targetMentor.email}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mt: 1 }}>
                    <strong>Academic Year:</strong> {targetMentor.academicYear}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    <strong>Session:</strong> {targetMentor.academicSession}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(16, 185, 129, 0.2)', p: 2 }}>
          <Button
            onClick={() => {
              setTransferDialog({ open: false, fromMentor: null });
              setTransferEmail('');
              setTargetMentor(null);
              setTransferError('');
            }}
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
          {targetMentor && (
            <Button
              onClick={handleConfirmTransfer}
              variant="contained"
              disabled={transferLoading}
              sx={{
                bgcolor: '#ea580c',
                '&:hover': { bgcolor: '#ea580c' }
              }}
            >
              {transferLoading ? <CircularProgress size={24} /> : 'Confirm Transfer'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MentorTable;
