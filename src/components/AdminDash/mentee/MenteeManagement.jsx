"use client";
import { useState, useEffect } from 'react';
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
import { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import axios from 'axios';
import BulkUploadPreview from '../common/BulkUploadPreview';
import toast from 'react-hot-toast';
import { theme } from './menteeStyle';
import AddMenteeDialog from './menteeSubComponents/AddMenteeDialog';
import EditMenteeDialog from './menteeSubComponents/EditMenteeDialog';
import AssignMentorDialog from './menteeSubComponents/AssignMentorDialog';
import BulkUploadDialog from './menteeSubComponents/BulkUploadDialog';
import { calculateCurrentSemester, getCurrentAcademicYear, generateAcademicSessions } from './utils/academicUtils';

const MenteeManagement = () => {
  const [mentees, setMentees] = useState([]);
  const [loading, setLoading] = useState(false); // Set initial loading state to false
  const [mounted, setMounted] = useState(false);
  const [academicYear, setAcademicYear] = useState('');
  const [academicSession, setAcademicSession] = useState('');
  const [semester, setSemester] = useState('');
  const [section, setSection] = useState('');
  const [menteeMujid, setMenteeMujid] = useState(''); 
  const [mentorMujid, setMentorMujid] = useState(''); 
  const [mentorEmailid, setMentorEmailid] = useState('');
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
      const saved = sessionStorage.getItem('showFilters');
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });

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

  const handleBulkUploadOpen = () => {
    setBulkUploadDialog(true);
  };

  const handleBulkUploadClose = () => {
    setBulkUploadDialog(false);
    setUploadProgress(0);
    setUploading(false);
  };

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

  // const handleEditInputChange = (e, category, subcategory) => {
  //   if (category && subcategory) {
  //     // Handle nested parent fields
  //     setSelectedMentee(prev => ({
  //       ...prev,
  //       parents: {
  //         ...prev.parents,
  //         [category]: {
  //           ...prev.parents?.[category],
  //           [subcategory]: e.target.value
  //         }
  //       }
  //     }));
  //   } else {
  //     // Handle top-level fields
  //     const { name, value } = e.target;
  //     setSelectedMentee(prev => ({
  //       ...prev,
  //       [name]: name === 'MUJid' ? value.toUpperCase() : value
  //     }));
  //   }
  // };

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
      
      // Refresh the table
      if (mentees.length > 0) {
        const updatedMentees = mentees.filter(m => !mujids.includes(m.MUJid));
        setMentees(updatedMentees);
      }
    } catch (error) {
      showAlert(error.response?.data?.error || 'Error deleting mentees', 'error');
    }
  };

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
        // console.log('Error parsing stored data:', error);
        sessionStorage.removeItem('menteeData');
      }
    }
  }, [isSmallScreen]); // Add isSmallScreen to dependencies

  useEffect(() => {
    sessionStorage.setItem('showFilters', JSON.stringify(showFilters));
  }, [showFilters]);

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
      // console.log('Error handling search:', error);
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
    academicYear,
    academicSession,
    semester,
    section,
    menteeMujid, // Add setter for menteeMujid
    mentorMujid,  // Add setter for mentorMujid,
    mentorEmailid
  };

  const handleFilterChange = (name, value) => {
    const setters = {
      academicYear: setAcademicYear,
      academicSession: setAcademicSession,
      semester: setSemester,
      section: setSection,
      menteeMujid: setMenteeMujid, 
      mentorMujid: setMentorMujid,
      mentorEmailid: setMentorEmailid  
    };
    
    if (typeof setters[name] === 'function') {
      setters[name](value);
    } else {
      console.log(`No setter function found for filter: ${name}`);

    }
    
    setMentees([]); // Clear data when filter options change
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

  // Add this useEffect for initial data loading
  useEffect(() => {
    const loadInitialData = async () => {
      const currentAcadYear = getCurrentAcademicYear();
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const [startYear] = currentAcadYear.split('-');
      
      const currentSession = currentMonth >= 7 && currentMonth <= 12
        ? `JULY-DECEMBER ${startYear}`
        : `JANUARY-JUNE ${parseInt(startYear) + 1}`;

      // Set initial filter values without triggering search
      setAcademicYear(currentAcadYear);
      setAcademicSession(currentSession);

      // Only perform search once filters are set
      if (currentAcadYear && currentSession) {
        try {
          setLoading(true);
          const response = await axios.get('/api/admin/manageUsers/manageMentee', {
            params: {
              academicYear: currentAcadYear,
              academicSession: currentSession
            }
          });

          if (response.status === 200) {
            const normalizedData = response.data.map(mentee => ({
              ...mentee,
              id: mentee._id || mentee.id,
              MUJid: mentee.MUJid?.toUpperCase() || '',
              mentorMujid: mentee.mentorMujid?.toUpperCase() || ''
            }));
            
            setMentees(normalizedData);
            sessionStorage.setItem('menteeData', JSON.stringify(normalizedData));
            setTableVisible(true);
          }
        } catch (error) {
          // Only show error if it's not the "required fields" error
          if (error.response?.status !== 400) {
            showAlert(error.response?.data?.error || 'Error loading initial data', 'error');
          }
        } finally {
          setLoading(false);
        }
      }
    };

    loadInitialData();
  }, []);

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
                onClick={() => setShowFilters(prev => !prev)}
                sx={{
                  color: '#f97316',
                  bgcolor: 'rgba(249, 115, 22, 0.1)',
                  '&:hover': {
                    bgcolor: 'rgba(249, 115, 22, 0.2)',
                  },
                  position: 'fixed',
                  right: '1rem',
                  top: '5rem', // Adjust position to be more accessible
                  zIndex: 1000,
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
              transition={{ duration: 0.3 }}
              style={{
                display: showFilters ? 'block' : 'none',
                position: isSmallScreen ? 'relative' : 'sticky',
                top: isSmallScreen ? 'auto' : '1rem',
                maxHeight: isSmallScreen ? 'calc(100vh - 200px)' : 'none',
                overflowY: isSmallScreen ? 'auto' : 'visible',
                zIndex: isSmallScreen ? 50 : 'auto'
              }}
            >
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 h-full">
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
            <Button onClick={handleConfirmClose} color="primary">              
              Cancel            
            </Button>            
            <Button onClick={handleConfirmUpdate} color="secondary">              
              Confirm            
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

