'use client';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { Button, Box, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, IconButton, Typography } from '@mui/material';
import { useMemo, useState, useEffect, useRef } from 'react';
import InfoIcon from '@mui/icons-material/Info';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import MenteeDetailsDialog from './MenteeDetailsDialog';
import axios from 'axios';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

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
    <CircularProgress sx={{ color: '#f97316' }} />
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

const filterData = (data, filters) => {
  if (!data || !filters) return [];
  
  return data.filter(mentee => {
    const matchesSemester = !filters.semester || mentee.semester === parseInt(filters.semester);
    const matchesSection = !filters.section || mentee.section.toUpperCase() === filters.section.toUpperCase();
    const matchesMujid = !filters.menteeMujid || mentee.MUJid?.includes(filters.menteeMujid.toUpperCase());
    const matchesMentorMujid = !filters.mentorMujid || mentee.mentorMujid?.includes(filters.mentorMujid.toUpperCase());
    const matchesMentorEmail = !filters.mentorEmailid || mentee.mentorEmailid?.includes(filters.mentorEmailid);
    return matchesSemester && matchesSection && matchesMujid && matchesMentorMujid && matchesMentorEmail;
  });
};

const MenteeTable = ({ mentees, onDeleteClick, onDataUpdate, onEditClick, isLoading }) => {
  const [deleteDialog, setDeleteDialog] = useState({ open: false, mujid: null });
  const [loading, setLoading] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState({ open: false, mentee: null });
  const [mounted, setMounted] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);
  const cachedData = useRef(new Map());
  const batchKey = useRef('');
  const [filters, setFilters] = useState({
    academicYear: '',
    academicSession: '',
    semester: '',
    section: '',
    mentorMujid: '',
    menteeMujid: '',
    mentorEmailid: ''
  });
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10); // Change rowsPerPage to pageSize
  const [orderBy, setOrderBy] = useState('name');
  const [order, setOrder] = useState('asc');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchDataInBatches = async () => {
      if (!mentees || mentees.length === 0) {
        const currentKey = `${filters.academicYear}-${filters.academicSession}`;
        if (cachedData.current.has(currentKey)) {
          return cachedData.current.get(currentKey);
        }

        try {
          const initialResponse = await axios.get('/api/admin/manageUsers/manageMentee', {
            params: {
              ...filters,
              batchSize: BATCH_SIZE,
              offset: 0
            }
          });

          const initialData = initialResponse.data;
          setLoadingProgress(80);
          
          cachedData.current.set(currentKey, initialData);
          batchKey.current = currentKey;

          setIsBackgroundLoading(true);
          const remainingResponse = await axios.get('/api/admin/manageUsers/manageMentee', {
            params: {
              ...filters,
              batchSize: BACKGROUND_BATCH_SIZE,
              offset: BATCH_SIZE
            }
          });

          const allData = [...initialData, ...remainingResponse.data];
          cachedData.current.set(currentKey, allData);
          setLoadingProgress(100);
          setIsBackgroundLoading(false);

          return allData;
        } catch (error) {
          console.error('Error fetching data:', error);
          setLoadingProgress(100);
          return [];
        }
      }
    };

    fetchDataInBatches();
  }, [filters.academicYear, filters.academicSession]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;
        
        const academicYear = `${currentYear}-${currentYear + 1}`;
        const academicSession = currentMonth >= 7 ? 
          `JULY-DECEMBER ${currentYear}` : 
          `JANUARY-JUNE ${currentYear + 1}`;

        const response = await axios.get('/api/admin/manageUsers/manageMentee', {
          params: {
            academicYear,
            academicSession
          }
        });

        if (response.data) {
          const processedData = response.data.map(mentee => ({
            ...mentee,
            id: mentee._id || mentee.id || `temp-${Math.random().toString(36).substr(2, 9)}`
          }));
          onDataUpdate(processedData);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };

    if (!mentees || mentees.length === 0) {
      fetchInitialData();
    }
  }, [mentees, onDataUpdate]);

  const handleDeleteClick = (mujid) => {
    setDeleteDialog({ open: true, mujid });
  };

  const handleEditClick = (menteeData) => {
    if (onEditClick) {
      onEditClick(menteeData);
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteDialog.mujid) {
      setLoading(true);
      try {
        await onDeleteClick([deleteDialog.mujid]);
        if (onDataUpdate) {
          onDataUpdate(prevMentees => 
            prevMentees.filter(m => m.MUJid !== deleteDialog.mujid)
          );
        }
      } finally {
        setLoading(false);
        setDeleteDialog({ open: false, mujid: null });
      }
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortData = (data) => {
    return [...data].sort((a, b) => {
      if (!a[orderBy] || !b[orderBy]) return 0;
      
      const aValue = a[orderBy].toString().toLowerCase();
      const bValue = b[orderBy].toString().toLowerCase();
      
      if (order === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });
  };

  const processedMentees = useMemo(() => {
    if (!mounted) return [];

    let data = [];
    const currentKey = `${filters.academicYear}-${filters.academicSession}`;

    if (cachedData.current.has(currentKey)) {
      data = cachedData.current.get(currentKey);
    } else if (Array.isArray(mentees) && mentees.length > 0) {
      data = mentees;
      cachedData.current.set(currentKey, mentees);
    }

    const filteredData = filterData(data, filters) || [];
    
    return filteredData.map((mentee = {}, index) => ({
      // Set default values for required fields
      id: mentee._id || mentee.id || `temp-${index}-${Date.now()}`,
      MUJid: (mentee?.MUJid || '').toUpperCase(),
      name: mentee?.name || '',
      email: mentee?.email || '',
      mentorEmailid: mentee?.mentorEmailid || '',
      // Add other fields with default values
      ...mentee,
    }));
  }, [mentees, mounted, filters]);

  useEffect(() => {
    const initializeFilters = () => {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      
      const academicYear = `${currentYear}-${currentYear + 1}`;
      const academicSession = currentMonth >= 7 ? 
        `JULY-DECEMBER ${currentYear}` : 
        `JANUARY-JUNE ${currentYear + 1}`;

      setFilters(prev => ({
        ...prev,
        academicYear,
        academicSession
      }));

      if (mentees?.length > 0) {
        const cacheKey = `${academicYear}-${academicSession}`;
        cachedData.current.set(cacheKey, mentees);
      }
    };

    if (mounted) {
      initializeFilters();
    }
  }, [mounted, mentees]);

  const headerContent = useMemo(() => ({
    title: 'Mentee Management',
    count: processedMentees?.length || 0
  }), [processedMentees?.length]);

  const footerContent = useMemo(() => ({
    lastUpdated: new Date().toLocaleDateString()
  }), []);

  const CustomHeaderComponent = () => (
    <Box sx={{
      p: 2,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid rgba(249, 115, 22, 0.3)',
      background: 'linear-gradient(to right, rgba(249, 115, 22, 0.15), rgba(249, 115, 22, 0.05))',
    }}>
      <Typography variant="h6" sx={{ 
        color: '#f97316', 
        fontWeight: 600,
        textShadow: '0 0 10px rgba(249, 115, 22, 0.3)'
      }}>
        {headerContent.title}
      </Typography>
      <Typography variant="body2" sx={{ 
        color: 'rgba(249, 115, 22, 0.9)',
        fontWeight: 500
      }}>
        Total Mentees: {headerContent.count}
      </Typography>
    </Box>
  );

  const CustomFooterComponent = () => (
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
        Last updated: {footerContent.lastUpdated}
      </Typography>
    </Box>
  );

  if (!mounted) {
    return null;
  }

  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        height: '200px'
      }}>
        <CircularProgress sx={{ color: '#f97316' }} />
      </Box>
    );
  }

  if (!processedMentees.length) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center',
        height: '200px',
        gap: 2,
        color: 'rgba(255, 255, 255, 0.5)'
      }}>
        <Typography variant="h6">
          No mentees found for the selected criteria
        </Typography>
        <Typography variant="body2">
          Try adjusting your filters or add new mentees
        </Typography>
      </Box>
    );
  }

  const columns = [
    { 
      field: 'serialNumber',    
      headerName: 'S.No',
      width: 50,
      renderCell: (params) => {
        const index = processedMentees.findIndex(mentee => mentee.id === params.row.id);
        return index + 1;
      },
      sortable: false,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: 'MUJid',
      headerName: 'MUJ ID',
      width: 150,
      sortable: true,
    },
    {
      field: 'name',
      headerName: 'Name',
      width: 200,
      sortable: true,
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 250,
      sortable: true,
    },
    {
      field: 'mentorEmailid',
      headerName: 'Mentor Email',
      width: 250,
      sortable: true,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      sortable: false,
      renderCell: (params) => {
        if (!params?.row) return null;
        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              onClick={() => setDetailsDialog({ open: true, mentee: params.row })}
              sx={{ 
                color: '#3b82f6',
                '&:hover': {
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  transform: 'scale(1.1)',
                }
              }}
            >
              <InfoIcon fontSize="small" />
            </IconButton>
            <IconButton
              onClick={() => handleEditClick(params.row)}
              sx={{ 
                color: '#f97316',
                '&:hover': {
                  backgroundColor: 'rgba(249, 115, 22, 0.1)',
                  transform: 'scale(1.1)',
                }
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
                }
              }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Box>
        );
      },
    }
  ].map(col => ({
    ...col,
    headerAlign: 'center',
    align: 'center',
    flex: 0,
    minWidth: col.width || 100,
    sortable: col.field !== 'serialNumber' && col.field !== 'actions',
    // Add sort icons configuration
    renderHeader: (params) => (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        gap: 0.5,
        color: '#f97316',
        fontSize: '0.95rem',
        fontWeight: 600,
      }}>
        {params.colDef.headerName}
        {params.colDef.sortable && (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            ml: 0.5
          }}>
            <ArrowUpwardIcon 
              sx={{ 
                fontSize: '0.75rem',
                opacity: params.sortDirection === 'asc' ? 1 : 0.3,
                transition: 'opacity 0.2s'
              }} 
            />
            <ArrowDownwardIcon 
              sx={{ 
                fontSize: '0.75rem',
                opacity: params.sortDirection === 'desc' ? 1 : 0.3,
                marginTop: '-2px',
                transition: 'opacity 0.2s'
              }} 
            />
          </Box>
        )}
      </Box>
    ),
  }));

  const LoadingOverlay = () => (
    <Box
      sx={{
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
        zIndex: 1,
      }}
    >
      <CircularProgress variant="determinate" value={loadingProgress} sx={{ color: '#f97316' }} />
      <Typography sx={{ mt: 2, color: 'white' }}>
        {loadingProgress < 100 ? `Loading ${loadingProgress}%` : 'Finalizing...'}
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ 
      height: { xs: 'auto', lg: 'calc(100vh - 200px)' },
      width: '100%',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      transition: 'all 0.3s ease',
    }}>
      {loading && (
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1,
          borderRadius: 2
        }}>
          <CircularProgress sx={{ color: '#f97316' }} />
        </Box>
      )}
      
      <DataGrid
        rows={processedMentees || []}
        columns={columns}
        getRowId={(row) => row._id || row.id}
        autoHeight={false}
        sx={{
          height: { xs: '500px', lg: '100%' },
          width: '100%',
          '& .MuiDataGrid-main': {
            overflow: 'auto',
            minHeight: { xs: '300px', lg: '200px' },
            maxHeight: { xs: '500px', lg: 'calc(100vh - 300px)' },
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
            scrollBehavior: 'smooth',
            // Add smooth scroll animation
            '@media (prefers-reduced-motion: no-preference)': {
              scrollBehavior: 'smooth',
            },
            // Simplified fade animation
            animation: 'fadeIn 0.2s ease-out',
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
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
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
          },
          '& .MuiDataGrid-row': {
            transition: 'background-color 0.2s ease',
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'rgba(249, 115, 22, 0.08)',
              transform: 'translateY(-1px)',
              transition: 'transform 0.2s ease, background-color 0.2s ease',
            },
          },
          transition: 'all 0.3s ease',
          '& .MuiDataGrid-columnHeader': {
            transition: 'background-color 0.2s ease',
            '& .MuiDataGrid-columnSeparator': {
              transition: 'opacity 0.3s ease',
            },
            '&:hover': {
              backgroundColor: 'rgba(249, 115, 22, 0.15)',
              transition: 'background-color 0.3s ease',
            },
          },
          '& .MuiDataGrid-columnSeparator': {
            transition: 'none !important',
          },
          '& .MuiDataGrid-columnHeaders': {
            position: 'sticky',
            top: 0,
            zIndex: 2,
            backgroundColor: 'rgba(249, 115, 22, 0.15)',
            transition: 'none !important',
          },
          '& .MuiDataGrid-sortIcon': {
            color: '#f97316',
            opacity: 0.5,
          },
          '& .MuiDataGrid-columnHeader--sorted .MuiDataGrid-sortIcon': {
            opacity: 1,
          },
          '& .MuiDataGrid-columnHeaderTitle': {
            fontWeight: 600,
          },
          // Add keyframes for animations
          '@keyframes fadeIn': {
            from: { opacity: 0.8 },
            to: { opacity: 1 }
          },
          // Remove distracting animations
          '& .MuiIconButton-root': {
            transition: 'background-color 0.2s ease',
            '&:hover': {
              backgroundColor: 'rgba(249, 115, 22, 0.08)',
            }
          },
          // Smooth but subtle transitions
          '& .MuiDataGrid-columnHeader': {
            transition: 'background-color 0.2s ease',
          },
          '& .MuiDataGrid-cell': {
            transition: 'background-color 0.2s ease',
          },
          '& .MuiDataGrid-footerContainer': {
            transition: 'opacity 0.2s ease',
          },
          // Remove pulse and slide animations
          animation: 'none',
          // Remove other distracting transitions
          '& *': {
            animation: 'none !important',
          }
        }}
        components={{
          Toolbar: GridToolbar,
          LoadingOverlay: CustomLoadingOverlay,
          NoRowsOverlay: CustomNoRowsOverlay,
          Header: CustomHeaderComponent,
          Footer: CustomFooterComponent,
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
        disableSelectionOnClick
        disableColumnMenu={false}
        disableColumnFilter={false}
      />

      <CustomFooterComponent />

      {(isLoading || isBackgroundLoading) && <LoadingOverlay />}

      <MenteeDetailsDialog
        open={detailsDialog.open}
        onClose={() => setDetailsDialog({ open: false, mentee: null })}
        mentee={detailsDialog.mentee}
      />

      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, mujid: null })}
        PaperProps={{
          sx: {
            backgroundColor: '#1a1a1a',
            color: 'white',
            borderRadius: '12px',
            border: '1px solid rgba(249, 115, 22, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          Confirm Delete
        </DialogTitle>
        <DialogContent sx={{ my: 2 }}>
          Are you sure you want to delete this mentee? This action cannot be undone.
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
    </Box>
  );
};

export default MenteeTable;