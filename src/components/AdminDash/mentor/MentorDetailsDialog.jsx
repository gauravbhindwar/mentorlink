import { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
// Remove the direct Lottie import
import noMenteesAnimation from '../../../assets/animations/no-mentees.json';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Chip,
  CircularProgress,
  Divider,
  Button,
  TextField,
  DialogActions,
  SwipeableDrawer,
  useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import { toast } from 'react-toastify';
import Checkbox from '@mui/material/Checkbox';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

// Dynamically import Lottie with SSR disabled
const Lottie = dynamic(() => import('lottie-react'), {
  ssr: false,
  loading: () => <div style={{ width: 200, height: 200 }} /> // Placeholder while loading
});

// Create a separate component for the no mentees animation
const NoMenteesAnimation = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div style={{ width: 200, height: 200 }} />;
  }

  return (
    <Lottie
      animationData={noMenteesAnimation}
      loop={true}
      style={{
        width: 200,
        height: 200,
        opacity: 0.7
      }}
    />
  );
};

const MentorDetailsDialog = ({ open, onClose, mentor }) => {
  // Add client-side only state initialization
  const [isClient, setIsClient] = useState(false);
  
  // Move default states into useEffect
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [mentees, setMentees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editMenteeDialog, setEditMenteeDialog] = useState(false);
  const [selectedMentee, setSelectedMentee] = useState(null);
  const [bulkAssignDialog, setBulkAssignDialog] = useState(false);
  const [availableMentees, setAvailableMentees] = useState([]);
  const [selectedMentees, setSelectedMentees] = useState([]);
  const [loadingMentees, setLoadingMentees] = useState(false);
  const [showMentorInfo, setShowMentorInfo] = useState(true);
  const [menteeCounts, setMenteeCounts] = useState({});
  const [bulkAssignMenteeCounts, setBulkAssignMenteeCounts] = useState({});
  const [showBulkAssignMentorInfo, setShowBulkAssignMentorInfo] = useState(true);

  // Initialize client-side state
  useEffect(() => {
    setIsClient(true);
    
    // Set default semester based on academic session only on client
    if (mentor?.academicSession) {
      const defaultSemester = mentor.academicSession?.includes('JANUARY-JUNE') ? 4 : 3;
      setBulkAssignDetails({
        semester: defaultSemester,
      });
    }
  }, []);

  // Initialize bulk assign details after client-side hydration
  const [bulkAssignDetails, setBulkAssignDetails] = useState({
    semester: null, // Initialize as null, will be set after hydration
  });

  // Add new state for edit form
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    semester: '',
    yearOfRegistration: '',
  });

  // Add this helper function at the top of the component
  const getSemesterFromYear = (yearOfRegistration, currentAcademicYear, academicSession) => {
    if (!yearOfRegistration || !currentAcademicYear) {
      return '';
    }
    
    // Convert years to numbers to ensure proper calculation
    const regYear = parseInt(yearOfRegistration);
    const curYear = parseInt(currentAcademicYear.split('-')[0]);
    
    if (isNaN(regYear) || isNaN(curYear)) {
      return '';
    }
  
    // Calculate completed years
    const yearsCompleted = curYear - regYear;
    
    // Base semester calculation (2 semesters per year)
    let semester = yearsCompleted * 2;
    
    // Adjust for academic session
    if (academicSession?.includes('JANUARY-JUNE')) {
      semester += 2; // For even semesters
    } else if (academicSession?.includes('JULY-DECEMBER')) {
      semester += 1; // For odd semesters
    }
    
    // Ensure semester is within valid range (1-8)
    const validSemester = Math.min(Math.max(semester, 1), 8);
    
    return validSemester;
  };

  const fetchMentees = async (semester) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/admin/getMenteesByMentor?mentorMujid=${mentor?.MUJid}&semester=${semester}`);
      setMentees(response.data.mentees || []);
      setSelectedSemester(semester);
    } catch (error) {
      console.log('Error fetching mentees:', error);
      setMentees([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenteeCounts = async () => {
    try {
      const response = await axios.get(`/api/admin/getMenteesCount?mentorMujid=${mentor?.MUJid}`);
      setMenteeCounts(response.data.counts || {});
    } catch (error) {
      console.log('Error fetching mentee counts:', error);
    }
  };

  useEffect(() => {
    if (isClient && open && mentor?.MUJid) {
      fetchMenteeCounts();
      
      // Set default semester based on academic session
      const defaultSemester = mentor.academicSession?.includes('JANUARY-JUNE') ? 4 : 3;
      handleSemesterClick(defaultSemester);
    }
  }, [isClient, open, mentor?.MUJid]);

  const handleSemesterClick = (sem) => {
    setSelectedSemester(sem);
    setMentees([]); // Clear mentees list
    // Reset bulk assignment states
    setAvailableMentees([]);
    setSelectedMentees([]);
    setBulkAssignDetails({
      semester: '',
    });
    fetchMentees(sem); // Fetch mentees when semester is selected
  };

  // Update handleEditMentee
  const handleEditMentee = async (mentee) => {
    setSelectedMentee(mentee);
    setEditFormData({
      name: mentee.name || '',
      email: mentee.email || '',
      phone: mentee.phone || '',
      semester: mentee.semester || '',
      yearOfRegistration: mentee.yearOfRegistration || '',
    });
    setEditMenteeDialog(true);
  };

  const handleDeleteMentee = async (mentee) => {
    try {
      await axios.post('/api/admin/unassignMentor', {
        mentee_MUJid: mentee.MUJid,
        mentor_MUJid: mentor.MUJid
      });
      toast.success('Mentee unassigned successfully');
      setEditMenteeDialog(false);
      // Refresh the mentees list
      if (selectedSemester) {
        await fetchMentees(selectedSemester);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error unassigning mentee');
    }
  };

  // Add handler for form changes
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'semester') {
      // Ensure semester is within valid range (1-8)
      const numValue = parseInt(value);
      if (!isNaN(numValue)) {
        const validSemester = Math.min(Math.max(numValue, 1), 8);
        setEditFormData(prev => ({
          ...prev,
          [name]: validSemester
        }));
      }
    } else {
      setEditFormData(prev => ({
        ...prev,
        [name]: value
      }));
      
      // Calculate semester only when yearOfRegistration changes and auto-calc is enabled
      if (name === 'yearOfRegistration') {
        const calculatedSemester = getSemesterFromYear(
          value,
          mentor?.academicYear,
          mentor?.academicSession
        );
        setEditFormData(prev => ({
          ...prev,
          [name]: value,
          semester: calculatedSemester || ''
        }));
      }
    }
  };

  // Update handleSaveMenteeChanges to use editFormData
  const handleSaveMenteeChanges = async () => {
    try {
      await axios.patch(`/api/admin/manageUsers/manageMentee`, {
        MUJid: selectedMentee.MUJid,
        ...editFormData,
        // Use the manually entered semester directly
        semester: parseInt(editFormData.semester) || ''
      });
      toast.success('Mentee details updated successfully');
      setEditMenteeDialog(false);
      // Refresh the mentees list
      if (selectedSemester) {
        await fetchMentees(selectedSemester);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error updating mentee details');
    }
  };

  // Add cleanup when dialog closes
  const handleCloseEditDialog = () => {
    setEditMenteeDialog(false);
    setSelectedMentee(null);
    setEditFormData({
      name: '',
      email: '',
      phone: '',
      semester: '',
      yearOfRegistration: '',
    });
  };

  // Update custom styles for the assignment dialog
  const assignmentDialogStyles = {
    paper: {
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      backdropFilter: 'blur(20px)',
      borderRadius: '16px',
      border: '1px solid rgba(249, 115, 22, 0.2)', // Updated color
      maxWidth: '500px',
      width: '100%',
    },
    title: {
      borderBottom: '1px solid rgba(249, 115, 22, 0.2)', // Updated color
      padding: '20px 24px',
      '& .MuiTypography-root': {
        color: '#f97316', // Updated color
        fontWeight: 600,
        fontSize: '1.25rem',
      },
    },
    content: {
      padding: '24px',
    },
    textField: {
      '& .MuiOutlinedInput-root': {
        color: 'white',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
        },
        '&.Mui-focused': {
          backgroundColor: 'rgba(51, 65, 85, 0.05)',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#3b82f6',
            borderWidth: '2px',
          },
        },
      },
      '& .MuiInputLabel-root': {
        color: 'rgba(255, 255, 255, 0.7)',
        '&.Mui-focused': {
          color: '#3b82f6',
        },
      },
      '& .MuiMenuItem-root': {
        color: 'white',
      },
    },
    helperText: {
      mt: 1,
      color: 'rgba(255, 255, 255, 0.5)',
      fontSize: '0.75rem',
      textAlign: 'center',
    },
  };

  const cardStyles = {
    container: {
      background: 'linear-gradient(165deg, rgba(17, 24, 39, 0.98) 0%, rgba(9, 14, 24, 0.97) 100%)',
      backdropFilter: 'blur(10px)',
      boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
      borderRadius: '24px',
      border: '1px solid rgba(249, 115, 22, 0.2)', // Updated color
    },
    header: {
      background: 'linear-gradient(90deg, rgba(249, 115, 22, 0.1) 0%, rgba(249, 115, 22, 0.05) 100%)', // Updated color
      borderBottom: '1px solid rgba(249, 115, 22, 0.2)', // Updated color
      padding: '20px',
      borderTopLeftRadius: '24px',
      borderTopRightRadius: '24px',
    },
    infoCard: {
      background: 'rgba(249, 115, 22, 0.05)', // Updated color
      borderRadius: '16px',
      padding: '16px',
      border: '1px solid rgba(249, 115, 22, 0.15)', // Updated color
      transition: 'all 0.3s ease',
      minHeight: '90px',
      '&:hover': {
        background: 'rgba(249, 115, 22, 0.08)', // Updated color
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 12px rgba(249, 115, 22, 0.1)', // Updated color
      },
    },
  };

  // Add table header styles
  const tableHeaderStyles = {
    display: 'grid',
    gridTemplateColumns: '1.5fr 1fr 1.5fr 1fr 1fr 1fr 1fr 0.5fr',
    gap: 1,
    p: 2,
    bgcolor: 'rgba(51, 65, 85, 0.1)',
    borderBottom: '1px solid rgba(51, 65, 85, 0.2)',
  };

  // Add table row styles
  const tableRowStyles = {
    display: 'grid',
    gridTemplateColumns: '1.5fr 1fr 1.5fr 1fr 1fr 1fr 1fr 0.5fr',
    gap: 1,
    p: 2,
    '&:hover': {
      bgcolor: 'rgba(51, 65, 85, 0.1)',
    },
    transition: 'all 0.2s ease',
  };

  // Add new function to fetch available mentees
  const fetchAvailableMentees = async (semester) => {
    setLoadingMentees(true);
    try {
      const response = await axios.get(`/api/admin/getMenteesForAssignment`, {
        params: {
          semester,
          academicYear: mentor.academicYear,
          academicSession: mentor.academicSession
        }
      });
      // Filter out mentees that are already assigned
      const unassignedMentees = (response.data.mentees || []).filter(m => !m.mentorMujid);
      setAvailableMentees(unassignedMentees);
    } catch (error) {
      toast.error('Error fetching available mentees');
      console.error(error);
    } finally {
      setLoadingMentees(false);
    }
  };

  const handleBulkAssign = async () => {
    try {
      const assignments = selectedMentees.map(menteeId => {
        const mentee = availableMentees.find(m => m.MUJid === menteeId);
        const calculatedSemester = getSemesterFromYear(
          mentee.yearOfRegistration,
          mentor?.academicYear,
          mentor?.academicSession
        );

        return {
          mentee_MUJid: menteeId,
          mentor_MUJid: mentor.MUJid,
          academicYear: mentor.academicYear,
          academicSession: mentor.academicSession,
          current_semester: calculatedSemester
        };
      });

      await axios.post('/api/admin/assignMentor/bulk', { assignments });
      toast.success('Mentees assigned successfully');
      setBulkAssignDialog(false);
      
      // Refresh both the counts and current list
      await fetchMenteeCounts();
      if (selectedSemester === Number(bulkAssignDetails.semester)) {
        await fetchMentees(selectedSemester);
      }
      
      // Clear selected states
      setSelectedMentees([]);
      setBulkAssignDetails({ semester: '' });
      setAvailableMentees([]);

    } catch (error) {
      toast.error(error.response?.data?.error || 'Error assigning mentees');
    }
  };

  // Modify bulk assignment semester change handler
  // const handleBulkSemesterChange = (e) => {
  //   const value = e.target.value;
  //   setBulkAssignDetails(prev => ({
  //     ...prev,
  //     semester: value
  //   }));
  //   // Reset available mentees and selected mentees
  //   setAvailableMentees([]);
  //   setSelectedMentees([]);
  //   if (value) {
  //     fetchAvailableMentees(value);
  //   }
  // };

  // Update the table styles for better visibility
  const tableStyles = {
    container: {
      maxHeight: '800px',
      bgcolor: 'rgba(0, 0, 0, 0.2)',
      borderRadius: '12px',
      border: '1px solid rgba(51, 65, 85, 0.15)',
      overflow: 'hidden',
    },
    headerCell: {
      bgcolor: 'rgba(51, 65, 85, 0.1)',
      color: '#3b82f6',
      fontWeight: 600,
      borderBottom: '2px solid rgba(51, 65, 85, 0.2)',
      padding: '12px 16px',
    },
    row: {
      '&:nth-of-type(odd)': {
        bgcolor: 'rgba(51, 65, 85, 0.02)',
      },
      '&:hover': {
        bgcolor: 'rgba(51, 65, 85, 0.08)',
      },
      transition: 'all 0.2s ease',
    },
    cell: {
      color: 'white',
      borderBottom: '1px solid rgba(51, 65, 85, 0.1)',
      padding: '12px 16px',
    },
  };

  // Add a function to determine available semesters based on academic session
  const getAvailableSemesters = () => {
    if (!mentor?.academicSession) return [];
    
    // If JANUARY-JUNE, show even semesters (2,4,6,8)
    if (mentor.academicSession.includes('JANUARY-JUNE')) {
      return [2, 4, 6, 8];
    }
    // If JULY-DECEMBER, show odd semesters (1,3,5,7)
    if (mentor.academicSession.includes('JULY-DECEMBER')) {
      return [1, 3, 5, 7];
    }
    return [];
  };

  // Add useEffect to refresh counts periodically or after assignments
  useEffect(() => {
    let interval;
    if (open && mentor?.MUJid) {
      // Initial fetch
      fetchMenteeCounts();
      
      // Set up periodic refresh every 30 seconds
      interval = setInterval(fetchMenteeCounts, 30000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [open, mentor?.MUJid]);

  // Remove or modify the auto-refresh effect
  useEffect(() => {
    let interval;
    if (bulkAssignDialog && bulkAssignDetails.semester) {
      // Do initial fetch only
      fetchAvailableMentees(bulkAssignDetails.semester);
      
      // Remove the interval - this was causing auto-refresh
      // interval = setInterval(() => {
      //   fetchAvailableMentees(bulkAssignDetails.semester);
      // }, 15000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [bulkAssignDialog, bulkAssignDetails.semester]);

  // Modify the bulk assignment semester options to show only odd/even based on session
  const getBulkAssignmentSemesters = () => {
    if (!mentor?.academicSession) return [];
    
    // If JANUARY-JUNE, show even semesters (2,4,6,8)
    if (mentor.academicSession.includes('JANUARY-JUNE')) {
      return [2, 4, 6, 8];
    }
    // If JULY-DECEMBER, show odd semesters (1,3,5,7)
    if (mentor.academicSession.includes('JULY-DECEMBER')) {
      return [1, 3, 5, 7];
    }
    return [];
  };

  // Add useEffect to set default semester when dialog opens
  useEffect(() => {
    if (bulkAssignDialog) {
      const defaultSemester = mentor?.academicSession?.includes('JANUARY-JUNE') ? 4 : 3;
      setBulkAssignDetails(prev => ({ ...prev, semester: defaultSemester }));
      fetchAvailableMentees(defaultSemester);
    }
  }, [bulkAssignDialog]);

  // Add new function to fetch mentee counts for bulk assign dialog
  const fetchBulkAssignMenteeCounts = async () => {
    try {
      const counts = {};
      for (const sem of getBulkAssignmentSemesters()) {
        const response = await axios.get(`/api/admin/getMenteesForAssignment`, {
          params: {
            semester: sem,
            academicYear: mentor?.academicYear,
            academicSession: mentor?.academicSession
          }
        });
        counts[sem] = (response.data.mentees || []).filter(m => !m.mentorMujid).length;
      }
      setBulkAssignMenteeCounts(counts);
    } catch (error) {
      console.error('Error fetching mentee counts:', error);
    }
  };

  // Update useEffect to fetch counts when bulk assign dialog opens
  useEffect(() => {
    if (bulkAssignDialog) {
      fetchBulkAssignMenteeCounts();
      const defaultSemester = mentor?.academicSession?.includes('JANUARY-JUNE') ? 4 : 3;
      setBulkAssignDetails(prev => ({ ...prev, semester: defaultSemester }));
      fetchAvailableMentees(defaultSemester);
    }
  }, [bulkAssignDialog]);

  // Update the no mentees section to use Suspense
  const renderNoMentees = () => (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center',
      height: '100%',
      color: 'rgba(255, 255, 255, 0.5)',
      gap: 2
    }}>
      <Suspense fallback={<div style={{ width: 200, height: 200 }} />}>
        <NoMenteesAnimation />
      </Suspense>
      <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
        {!selectedSemester ? 'Select a semester to view mentees' : 'No mentees found for this semester'}
      </Typography>
    </Box>
  );

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Mobile-specific styles
  const mobileStyles = {
    drawer: {
      '& .MuiDrawer-paper': {
        width: '100%',
        height: '100%',
        bgcolor: 'rgb(17, 24, 39)',
        backgroundImage: 'linear-gradient(to bottom, rgba(17, 24, 39, 0.95), rgba(10, 15, 24, 0.98))',
        backdropFilter: 'blur(10px)',
        borderTopLeftRadius: '16px',
        borderTopRightRadius: '16px',
      },
    },
    header: {
      position: 'sticky',
      top: 0,
      bgcolor: 'rgba(17, 24, 39, 0.95)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      zIndex: 10,
      px: 2,
      py: 1.5,
    },
    content: {
      height: '100%',
      overflow: 'auto',
      px: 2,
      py: 1,
      pb: 8, // Add padding for bottom buttons
    },
    mentorInfo: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: 2,
      mb: 3,
    },
    infoCard: {
      p: 2,
      bgcolor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
    },
    sectionTitle: {
      fontSize: '1rem',
      color: '#f97316',
      mb: 1,
      fontWeight: 600,
    },
    menteesSection: {
      mt: 2,
      '& .MuiChip-root': {
        height: '36px', // Larger touch targets
        fontSize: '0.9rem',
      },
    },
    footer: {
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      bgcolor: 'rgba(17, 24, 39, 0.95)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      p: 2,
      display: 'flex',
      justifyContent: 'center',
      gap: 2,
      zIndex: 10,
    },
  };

  const mobileMenteesContent = () => {
    if (loading) {
      return (
        <Box sx={{ 
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 200
        }}>
          <CircularProgress sx={{ color: '#f97316' }} />
        </Box>
      );
    }
  
    if (!selectedSemester) {
      return (
        <Box sx={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
          px: 2,
          textAlign: 'center'
        }}>
          <Suspense fallback={<CircularProgress sx={{ color: '#f97316' }} />}>
            <NoMenteesAnimation />
          </Suspense>
          <Typography sx={{ 
            color: 'rgba(255, 255, 255, 0.7)',
            mt: 2,
            fontSize: '1rem'
          }}>
            Select a semester to view assigned mentees
          </Typography>
        </Box>
      );
    }
  
    if (mentees.length === 0) {
      return (
        <Box sx={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
          px: 2,
          textAlign: 'center'
        }}>
          <Suspense fallback={<CircularProgress sx={{ color: '#f97316' }} />}>
            <NoMenteesAnimation />
          </Suspense>
          <Typography sx={{ 
            color: 'rgba(255, 255, 255, 0.7)',
            mt: 2,
            fontSize: '1rem'
          }}>
            No mentees assigned for semester {selectedSemester}
          </Typography>
        </Box>
      );
    }
  
    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" sx={{ 
          color: '#f97316',
          mb: 2,
          px: 2
        }}>
          Assigned Mentees - Semester {selectedSemester}
        </Typography>
        
        {mentees.map((mentee) => (
          <Box
            key={mentee.MUJid}
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              mb: 2,
              p: 2, // Moved padding here since we removed the action footer
            }}
          >
            <Typography sx={{ 
              color: 'white',
              fontWeight: 500,
              mb: 1
            }}>
              {mentee.name}
            </Typography>
            
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: 1,
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.875rem'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography component="span" sx={{ color: '#f97316' }}>ID:</Typography>
                {mentee.MUJid}
              </Box>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                wordBreak: 'break-all'
              }}>
                <Typography component="span" sx={{ color: '#f97316' }}>Email:</Typography>
                {mentee.email}
              </Box>
              {mentee.phone && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography component="span" sx={{ color: '#f97316' }}>Phone:</Typography>
                  {mentee.phone}
                </Box>
              )}
            </Box>
          </Box>
        ))}
      </Box>
    );
  };

  // Add new state for mobile assign drawer
  const [mobileAssignDrawer, setMobileAssignDrawer] = useState(false);

  // Add mobile assign drawer styles
  const mobileAssignDrawerStyles = {
    drawer: {
      '& .MuiDrawer-paper': {
        width: '100%',
        height: '100%',
        bgcolor: 'rgb(17, 24, 39)',
        backgroundImage: 'linear-gradient(to bottom, rgba(17, 24, 39, 0.95), rgba(10, 15, 24, 0.98))',
        backdropFilter: 'blur(10px)',
      },
    },
    header: {
      position: 'sticky',
      top: 0,
      bgcolor: 'rgba(17, 24, 39, 0.95)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      zIndex: 10,
      p: 2,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    content: {
      height: 'calc(100% - 64px)', // Subtract header height
      overflow: 'auto',
      p: 2,
    }
  };

  // Add mobile assign drawer content renderer
  const renderMobileAssignContent = () => (
    <>
      <Box sx={mobileAssignDrawerStyles.header}>
        <Typography variant="h6" sx={{ color: '#f97316', fontWeight: 600 }}>
          Assign New Mentees
        </Typography>
        <IconButton 
          onClick={() => setMobileAssignDrawer(false)}
          sx={{ color: 'white' }}
        >
          <CloseIcon />
        </IconButton>
      </Box>
      
      <Box sx={mobileAssignDrawerStyles.content}>
        {/* Semester Selection */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ color: 'white', mb: 2 }}>
            Select Semester
          </Typography>
          <Box sx={{ 
            display: 'flex',
            gap: 1,
            flexWrap: 'wrap'
          }}>
            {getBulkAssignmentSemesters().map((sem) => (
              <Chip
                key={sem}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>Semester {sem}</span>
                    <Chip
                      size="small"
                      label={bulkAssignMenteeCounts[sem] || 0}
                      sx={{
                        height: '20px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        '.MuiChip-label': {
                          px: 1,
                          fontSize: '0.75rem',
                          color: bulkAssignDetails.semester === sem ? 'white' : '#f97316',
                        },
                      }}
                    />
                  </Box>
                }
                onClick={() => {
                  setBulkAssignDetails(prev => ({ ...prev, semester: sem }));
                  setSelectedMentees([]);
                  fetchAvailableMentees(sem);
                }}
                sx={{
                  color: 'white',
                  bgcolor: bulkAssignDetails.semester === sem ? '#f97316' : 'rgba(255, 255, 255, 0.1)',
                  '&:hover': {
                    bgcolor: bulkAssignDetails.semester === sem ? '#ea580c' : 'rgba(255, 255, 255, 0.15)',
                  },
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Available Mentees List */}
        {loadingMentees ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ color: '#f97316' }} />
          </Box>
        ) : (
          <Box sx={{ mt: 2 }}>
            {availableMentees.map((mentee) => (
              <Box
                key={mentee.MUJid}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  mb: 2,
                  overflow: 'hidden',
                }}
              >
                <Box sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ color: 'white', fontWeight: 500 }}>
                      {mentee.name}
                    </Typography>
                    <Checkbox
                      checked={selectedMentees.includes(mentee.MUJid)}
                      onChange={(e) => {
                        setSelectedMentees(prev => 
                          e.target.checked
                            ? [...prev, mentee.MUJid]
                            : prev.filter(id => id !== mentee.MUJid)
                        );
                      }}
                      sx={{ 
                        color: '#f97316',
                        '&.Mui-checked': { color: '#f97316' }
                      }}
                    />
                  </Box>
                  <Box sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                    <Typography>{mentee.MUJid}</Typography>
                    <Typography>{mentee.email}</Typography>
                    <Typography>{mentee.phone || 'No phone'}</Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Fixed Footer */}
      <Box sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        p: 2,
        bgcolor: 'rgba(17, 24, 39, 0.95)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
      }}>
        <Button
          fullWidth
          variant="contained"
          disabled={selectedMentees.length === 0}
          onClick={handleBulkAssign}
          sx={{
            bgcolor: '#f97316',
            '&:hover': { bgcolor: '#ea580c' },
            py: 1.5,
          }}
        >
          Assign Selected ({selectedMentees.length})
        </Button>
      </Box>
    </>
  );

  // Update the mobile footer button to open the assign drawer instead
  const updatedMobileFooter = (
    <Box sx={mobileStyles.footer}>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => setMobileAssignDrawer(true)}
        fullWidth
        sx={{
          bgcolor: '#f97316',
          '&:hover': { bgcolor: '#ea580c' },
          py: 1.5,
        }}
      >
        Assign Mentees
      </Button>
    </Box>
  );

  return isMobile ? (
    <>
      <SwipeableDrawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        onOpen={() => {}}
        sx={mobileStyles.drawer}
        disableSwipeToOpen
      >
        {/* Mobile Header */}
        <Box sx={mobileStyles.header}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ color: '#f97316', fontWeight: 600 }}>
              Mentor Details
            </Typography>
            <IconButton onClick={onClose} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Mobile Content */}
        <Box sx={mobileStyles.content}>
          {/* Mentor Info Section */}
          <Box sx={mobileStyles.mentorInfo}>
            <Box sx={mobileStyles.infoCard}>
              <Typography variant="overline" sx={mobileStyles.sectionTitle}>
                Personal Details
              </Typography>
              <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                {mentor?.name}
              </Typography>
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                MUJ ID: {mentor?.MUJid}
              </Typography>
            </Box>

            <Box sx={mobileStyles.infoCard}>
              <Typography variant="overline" sx={mobileStyles.sectionTitle}>
                Contact Info
              </Typography>
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                {mentor?.email}
              </Typography>
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                {mentor?.phone_number}
              </Typography>
            </Box>

            <Box sx={mobileStyles.infoCard}>
              <Typography variant="overline" sx={mobileStyles.sectionTitle}>
                Academic Details
              </Typography>
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                Year: {mentor?.academicYear}
              </Typography>
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Session: {mentor?.academicSession}
              </Typography>
            </Box>
          </Box>

          {/* Mentees Section */}
          <Box sx={mobileStyles.menteesSection}>
            <Typography variant="h6" sx={{ color: '#f97316', mb: 2 }}>
              Mentees Management
            </Typography>
            
            {/* Semester Selection */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ color: 'white', mb: 1 }}>
                Select Semester
              </Typography>
              <Box sx={{ 
                display: 'flex',
                gap: 1,
                flexWrap: 'wrap'
              }}>
                {getAvailableSemesters().map((sem) => (
                  <Chip
                    key={sem}
                    label={`Sem ${sem} (${menteeCounts[sem] || 0})`}
                    onClick={() => handleSemesterClick(sem)}
                    sx={{
                      color: 'white',
                      bgcolor: selectedSemester === sem ? '#f97316' : 'rgba(255, 255, 255, 0.1)',
                      '&:hover': {
                        bgcolor: selectedSemester === sem ? '#ea580c' : 'rgba(255, 255, 255, 0.15)',
                      },
                      height: '36px',
                      fontSize: '0.9rem'
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* Render Mentees Content */}
            {mobileMenteesContent()}
          </Box>
        </Box>

        {/* Mobile Footer */}
        {updatedMobileFooter}
      </SwipeableDrawer>

      {/* Add the new mobile assign drawer */}
      <SwipeableDrawer
        anchor="bottom"
        open={mobileAssignDrawer}
        onClose={() => setMobileAssignDrawer(false)}
        onOpen={() => {}}
        sx={mobileAssignDrawerStyles.drawer}
        disableSwipeToOpen
      >
        {renderMobileAssignContent()}
      </SwipeableDrawer>
    </>
  ) : (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ 
        sx: {
          ...cardStyles.container,
          maxHeight: '90vh',  // Limit maximum height to 90% of viewport
          margin: '20px',     // Add margin around dialog
          display: 'flex',    // Use flex display
          flexDirection: 'column',  // Stack children vertically
          background: 'linear-gradient(to bottom, rgba(17, 24, 39, 0.95), rgba(10, 15, 24, 0.95))', // Added gradient
        }
      }}
    >
      {/* Header Section with Centered Toggle */}
      <Box sx={{ 
        position: 'relative',
        flexShrink: 0  // Prevent header from shrinking
      }}>
        <Box sx={{
          ...cardStyles.header,
          transition: 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out',
          maxHeight: showMentorInfo ? '500px' : '64px',
          opacity: showMentorInfo ? 1 : 0.8,
          overflow: 'hidden',
          pb: showMentorInfo ? 5 : 2, // Add padding at bottom for toggle button
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: showMentorInfo ? 3 : 0 }}>
            <Typography variant="h5" sx={{ 
              color: '#f97316', // Updated color
              fontWeight: 600,
              letterSpacing: '0.5px',
            }}>
              Mentor Profile
            </Typography>
            <IconButton onClick={onClose} sx={{ 
              color: 'white',
              '&:hover': { 
                background: 'rgba(51, 65, 85, 0.1)',
                transform: 'rotate(90deg)',
                transition: 'all 0.3s ease',
              },
            }}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Mentor Quick Info - Modified for better mobile display */}
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)'
            },
            gap: 2,
            opacity: showMentorInfo ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
            height: showMentorInfo ? 'auto' : 0,
          }}>
            {/* Info Cards with improved mobile layout */}
            <Box sx={cardStyles.infoCard}>
              <Typography variant="overline" sx={{ color: '#f97316', display: 'block', mb: 1 }}>
                Personal Details
              </Typography>
              <Typography variant="h6" sx={{ color: 'white', mb: 0.5, fontSize: { xs: '1rem', md: '1.25rem' } }}>
                {mentor?.name}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                {mentor?.MUJid}
              </Typography>
            </Box>

            <Box sx={cardStyles.infoCard}>
              <Typography variant="overline" sx={{ color: '#f97316', display: 'block', mb: 1 }}>
                Contact Info
              </Typography>
              <Typography variant="body2" sx={{ 
                color: 'rgba(255, 255, 255, 0.7)', 
                mb: 0.5,
                wordBreak: 'break-all'
              }}>
                {mentor?.email}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                {mentor?.phone_number}
              </Typography>
            </Box>

            <Box sx={cardStyles.infoCard}>
              <Typography variant="overline" sx={{ color: '#f97316', display: 'block', mb: 1 }}>
                Academic Details
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 0.5 }}>
                Year: {mentor?.academicYear}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Session: {mentor?.academicSession}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Centered Toggle Button */}
        <Box 
          onClick={() => setShowMentorInfo(!showMentorInfo)}
          sx={{ 
            cursor: 'pointer',
            position: 'absolute',
            left: '50%',
            bottom: 0,
            transform: 'translate(-50%, 50%)',
            zIndex: 2,
            bgcolor: 'rgba(51, 65, 85, 0.1)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(51, 65, 85, 0.2)',
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: 'rgba(51, 65, 85, 0.2)',
              transform: 'translate(-50%, 50%) scale(1.1)',
            }
          }}
        >
          {showMentorInfo ? 
            <ExpandLessIcon sx={{ color: '#3b82f6' }} /> : 
            <ExpandMoreIcon sx={{ color: '#3b82f6' }} />
          }
        </Box>
      </Box>

      {/* Main Content with improved scrolling */}
      <DialogContent sx={{ 
        p: { xs: 1, sm: 2 },
        flex: 1,           // Take remaining space
        overflow: 'auto',  // Enable scrolling
        minHeight: '200px' // Ensure minimum height
      }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ color: '#3b82f6', mb: 2 }}>
            Mentees Management
          </Typography>
          
          {/* Semester Selection */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ color: 'white', mb: 1 }}>
              Select Semester
              <Typography 
                component="span" 
                sx={{ 
                  ml: 1,
                  color: 'rgba(51, 65, 85, 0.7)',
                  fontSize: '0.8rem',
                }}
              >
                ({mentor?.academicSession?.includes('JANUARY-JUNE') ? 'Even Semesters' : 'Odd Semesters'})
              </Typography>
            </Typography>
            <Box sx={{ 
              display: 'flex',
              gap: 1,
              flexWrap: 'wrap'
            }}>
              {getAvailableSemesters().map((sem) => (
                <Chip
                  key={sem}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>Semester {sem}</span>
                      <Chip
                        size="small"
                        label={menteeCounts[sem] || 0}
                        sx={{
                          height: '20px',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          '.MuiChip-label': {
                            px: 1,
                            fontSize: '0.75rem',
                            color: selectedSemester === sem ? 'white' : '#3b82f6',
                          },
                        }}
                      />
                    </Box>
                  }
                  onClick={() => handleSemesterClick(sem)}
                  sx={{
                    color: 'white',
                    bgcolor: selectedSemester === sem ? '#f97316' : 'rgba(249, 115, 22, 0.05)', // Updated color
                    '&:hover': {
                      bgcolor: selectedSemester === sem ? '#ea580c' : 'rgba(249, 115, 22, 0.1)', // Updated color
                    },
                    transition: 'all 0.2s ease',
                    border: '1px solid',
                    borderColor: selectedSemester === sem ? '#f97316' : 'transparent',
                  }}
                />
              ))}
            </Box>
          </Box>

          {/* Mentees List with Table Layout */}
          <Box sx={{
            bgcolor: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid rgba(51, 65, 85, 0.1)',
            height: 'calc(100% - 100px)', // Adjust height to leave space for header
            minHeight: '300px'  // Ensure minimum height
          }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress sx={{ color: '#3b82f6' }} />
              </Box>
            ) : mentees.length > 0 ? (
              <Box sx={{ height: '100%', overflow: 'auto' }}>
                {/* Table Header */}
                <Box sx={tableHeaderStyles}>
                  <Typography variant="subtitle2" sx={{ color: '#3b82f6' }}>Name</Typography>
                  <Typography variant="subtitle2" sx={{ color: '#3b82f6' }}>MUJ ID</Typography>
                  <Typography variant="subtitle2" sx={{ color: '#3b82f6' }}>Email</Typography>
                  <Typography variant="subtitle2" sx={{ color: '#3b82f6' }}>Phone</Typography>
                  <Typography variant="subtitle2" sx={{ color: '#3b82f6' }}>Academic Year</Typography>
                  <Typography variant="subtitle2" sx={{ color: '#3b82f6' }}>Session</Typography>
                  <Typography variant="subtitle2" sx={{ color: '#3b82f6' }}>Reg. Year</Typography>
                  <Typography variant="subtitle2" sx={{ color: '#3b82f6', textAlign: 'center' }}>Edit</Typography>
                </Box>
                
                {/* Table Body */}
                <Box>
                  {mentees.map((mentee, index) => (
                    <Box key={mentee.MUJid}>
                      <Box sx={tableRowStyles}>
                        <Typography color="white" sx={{ fontWeight: 500 }}>
                          {mentee.name}
                        </Typography>
                        <Typography color="rgba(255, 255, 255, 0.7)">
                          {mentee.MUJid}
                        </Typography>
                        <Typography color="rgba(255, 255, 255, 0.7)" sx={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {mentee.email}
                        </Typography>
                        <Typography color="rgba(255, 255, 255, 0.7)">
                          {mentee.phone || 'N/A'}
                        </Typography>
                        <Typography color="rgba(255, 255, 255, 0.7)">
                          {mentee.academicYear}
                        </Typography>
                        <Typography color="rgba(255, 255, 255, 0.7)" sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {mentee.academicSession}
                        </Typography>
                        <Typography color="rgba(255, 255, 255, 0.7)">
                          {mentee.yearOfRegistration}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <IconButton 
                            onClick={() => handleEditMentee(mentee)}
                            sx={{ 
                              color: 'rgba(255, 255, 255, 0.5)',
                              '&:hover': { 
                                color: '#3b82f6',
                                transform: 'scale(1.1)',
                              },
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Box>
                      </Box>
                      {index < mentees.length - 1 && (
                        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                      )}
                    </Box>
                  ))}
                </Box>
              </Box>
            ) : renderNoMentees()}
          </Box>
        </Box>
      </DialogContent>

      {/* Footer Actions with fixed position */}
      <Box sx={{ 
        p: 3, 
        borderTop: '1px solid rgba(51, 65, 85, 0.1)',
        display: 'flex',
        justifyContent: 'flex-end',
        flexShrink: 0,  // Prevent footer from shrinking
        bgcolor: 'rgba(17, 24, 39, 0.95)',  // Match dialog background
        position: 'sticky',  // Stick to bottom
        bottom: 0,
        zIndex: 1
      }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setBulkAssignDialog(true)}
          size="small"
          sx={{
            bgcolor: '#f97316', // Updated color
            fontSize: '0.8rem',
            padding: '4px 10px',
            '&:hover': { 
              bgcolor: '#ea580c', // Updated color
              transform: 'translateY(-2px)',
            },
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(249, 115, 22, 0.25)', // Updated color
          }}
        >
          Assign Mentees
        </Button>
      </Box>

      {/* Updated Edit Mentee Dialog */}
      <Dialog
        open={editMenteeDialog}
        onClose={handleCloseEditDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{ 
          sx: {
            ...assignmentDialogStyles.paper,
            maxHeight: '90vh',    // Limit height
            margin: '20px',       // Add margin
            display: 'flex',      // Use flex layout
            flexDirection: 'column'
          }
        }}
      >
        <DialogTitle sx={{
          ...assignmentDialogStyles.title,
          flexShrink: 0  // Prevent shrinking
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <EditIcon sx={{ color: '#3b82f6' }} />
            <Typography>Edit Mentee Details</Typography>
          </Box>
          <IconButton
            onClick={handleCloseEditDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'rgba(255, 255, 255, 0.5)',
              '&:hover': { color: '#3b82f6' },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ 
          ...assignmentDialogStyles.content,
          flex: 1,           // Take remaining space
          overflow: 'auto'   // Enable scrolling
        }}>
          {selectedMentee && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Personal Information Section */}
              <Box sx={{ 
                p: 2, 
                bgcolor: 'rgba(51, 65, 85, 0.1)', 
                borderRadius: 2,
                border: '1px solid rgba(51, 65, 85, 0.2)'
              }}>
                <Typography variant="subtitle2" sx={{ color: '#3b82f6', mb: 2 }}>
                  Personal Information
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField
                    label="Name"
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditFormChange}
                    sx={assignmentDialogStyles.textField}
                    fullWidth
                  />
                  <TextField
                    label="MUJ ID"
                    value={selectedMentee?.MUJid || ''}
                    sx={{ ...assignmentDialogStyles.textField, pointerEvents: 'none', opacity: 0.7,select: 'none' }}
                    fullWidth
                  />
                  <TextField
                    label="Email"
                    name="email"
                    value={editFormData.email}
                    onChange={handleEditFormChange}
                    sx={assignmentDialogStyles.textField}
                    fullWidth
                  />
                  <TextField
                    label="Phone"
                    name="phone"
                    value={editFormData.phone}
                    onChange={handleEditFormChange}
                    sx={assignmentDialogStyles.textField}
                    fullWidth
                  />
                </Box>
              </Box>

              {/* Academic Information Section */}
              <Box sx={{ 
                p: 2, 
                bgcolor: 'rgba(51, 65, 85, 0.1)', 
                borderRadius: 2,
                border: '1px solid rgba(51, 65, 85, 0.2)'
              }}>
                <Typography variant="subtitle2" sx={{ color: '#3b82f6', mb: 2 }}>
                  Academic Information
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField
                    label="Academic Year"
                    value={selectedMentee?.academicYear || ''}
                    sx={{ ...assignmentDialogStyles.textField, pointerEvents: 'none',select: 'none', opacity: 0.7 }}
                    fullWidth
                  />
                  <TextField
                    label="Academic Session"
                    value={selectedMentee?.academicSession || ''}
                    sx={{ ...assignmentDialogStyles.textField, pointerEvents: 'none',select:"none", opacity: 0.7 }}
                    fullWidth

                  />
                  <TextField
                    label="Current Semester"
                    name="semester"
                    value={editFormData.semester || ''}
                    onChange={handleEditFormChange}
                    type="number"
                    InputProps={{ 
                      inputProps: { 
                        min: 1, 
                        max: 8,
                        step: 1
                      }
                    }}
                    sx={{
                      ...assignmentDialogStyles.textField,
                      '& .MuiInputBase-input': {
                        color: 'white',
                      }
                    }}
                    fullWidth
                    helperText="Enter semester (1-8)"
                  />
                  <TextField
                    label="Year of Registration"
                    name="yearOfRegistration"
                    value={editFormData.yearOfRegistration}
                    onChange={handleEditFormChange}
                    type="number"
                    InputProps={{ inputProps: { min: 2010, max: new Date().getFullYear() } }}
                    sx={assignmentDialogStyles.textField}
                    fullWidth
                  />
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ 
          p: 3, 
          borderTop: '1px solid rgba(51, 65, 85, 0.2)',
          bgcolor: 'rgba(17, 24, 39, 0.95)',
          flexShrink: 0,    // Prevent shrinking
          position: 'sticky',
          bottom: 0,
          zIndex: 1
        }}>
          <Button
            onClick={() => handleDeleteMentee(selectedMentee)}
            startIcon={<DeleteIcon />}
            sx={{
              color: '#ef4444',
              borderColor: '#ef4444',
              '&:hover': {
                bgcolor: 'rgba(239, 68, 68, 0.1)',
              },
            }}
          >
            Unassign Mentee
          </Button>
          <Box>
            <Button
              onClick={handleCloseEditDialog}
              sx={{
                color: 'white',
                mr: 2
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveMenteeChanges}
              variant="contained"
              sx={{
                bgcolor: '#3b82f6',
                '&:hover': { 
                  bgcolor: '#2563eb',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(51, 65, 85, 0.25)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              Save Changes
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* New Bulk Assignment Dialog */}
      <Dialog
        open={bulkAssignDialog}
        onClose={() => setBulkAssignDialog(false)}
        maxWidth={false} // Changed from xl to false for custom width
        PaperProps={{ 
          sx: {
            ...assignmentDialogStyles.paper,
            width: '95vw', // Use viewport width with margin
            maxWidth: '1400px', // Increased max width
            height: '90vh', // Fixed height
            margin: '20px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden', // Prevent outer scroll
          }
        }}
      >
        <DialogTitle sx={{
          ...assignmentDialogStyles.title,
          flexShrink: 0,
          position: 'relative', // For absolute positioning of close button
          minHeight: '64px'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AddIcon sx={{ color: '#3b82f6' }} />
            <Typography>Assign Multiple Mentees</Typography>
          </Box>
          <IconButton
            onClick={() => setBulkAssignDialog(false)}
            sx={{ 
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'white',
              '&:hover': { 
                background: 'rgba(51, 65, 85, 0.1)',
                transform: 'rotate(90deg)',
                transition: 'all 0.3s ease',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ 
          ...assignmentDialogStyles.content, 
          p: 3,
          flex: 1,
          overflow: 'hidden', // Changed from auto to hidden
          display: 'flex',
          flexDirection: 'column',
        }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 3,
            height: '100%', // Take full height
            overflow: 'hidden' // Prevent scroll here
          }}>
            {/* Mentor Info Card - remains unchanged */}
            <Box sx={{ 
              position: 'relative',
              flexShrink: 0
            }}>
              <Box sx={{
                ...cardStyles.header,
                transition: 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out',
                maxHeight: showBulkAssignMentorInfo ? '500px' : '64px',
                opacity: showBulkAssignMentorInfo ? 1 : 0.8,
                overflow: 'hidden',
                pb: showBulkAssignMentorInfo ? 5 : 2,
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  mb: showBulkAssignMentorInfo ? 3 : 0 
                }}>
                  <Typography variant="h6" sx={{ color: '#3b82f6', mb: 1 }}>
                    Assigning to Mentor
                  </Typography>
                </Box>

                {/* Mentor Quick Info Cards */}
                <Box sx={{ 
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)'
                  },
                  gap: 2,
                  opacity: showBulkAssignMentorInfo ? 1 : 0,
                  transition: 'opacity 0.3s ease-in-out',
                  height: showBulkAssignMentorInfo ? 'auto' : 0,
                }}>
                  <Box sx={cardStyles.infoCard}>
                    <Typography variant="overline" sx={{ color: '#3b82f6', display: 'block', mb: 1 }}>
                      Personal Details
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'white', mb: 0.5, fontSize: { xs: '1rem', md: '1.25rem' } }}>
                      {mentor?.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      {mentor?.MUJid}
                    </Typography>
                  </Box>

                  <Box sx={cardStyles.infoCard}>
                    <Typography variant="overline" sx={{ color: '#3b82f6', display: 'block', mb: 1 }}>
                      Contact Info
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: 'rgba(255, 255, 255, 0.7)', 
                      mb: 0.5,
                      wordBreak: 'break-all'
                    }}>
                      {mentor?.email}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      {mentor?.phone_number}
                    </Typography>
                  </Box>

                  <Box sx={cardStyles.infoCard}>
                    <Typography variant="overline" sx={{ color: '#3b82f6', display: 'block', mb: 1 }}>
                      Academic Details
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 0.5 }}>
                      Year: {mentor?.academicYear}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Session: {mentor?.academicSession}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Toggle Button */}
              <Box 
                onClick={() => setShowBulkAssignMentorInfo(!showBulkAssignMentorInfo)}
                sx={{ 
                  cursor: 'pointer',
                  position: 'absolute',
                  left: '50%',
                  bottom: 0,
                  transform: 'translate(-50%, 50%)',
                  zIndex: 2,
                  bgcolor: 'rgba(51, 65, 85, 0.1)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(51, 65, 85, 0.2)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: 'rgba(51, 65, 85, 0.2)',
                    transform: 'translate(-50%, 50%) scale(1.1)',
                  }
                }}
              >
                {showBulkAssignMentorInfo ? 
                  <ExpandLessIcon sx={{ color: '#3b82f6' }} /> : 
                  <ExpandMoreIcon sx={{ color: '#3b82f6' }} />
                }
              </Box>
            </Box>

            {/* Filters Section */}
            <Box sx={{ 
              display: 'flex', 
              gap: 2,
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
              <Typography variant="subtitle2" sx={{ color: 'white', mr: 2 }}>
                Select Semester:
              </Typography>
              {getBulkAssignmentSemesters().map((sem) => (
                <Chip
                  key={sem}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>Semester {sem}</span>
                      <Chip
                        size="small"
                        label={bulkAssignMenteeCounts[sem] || 0}
                        sx={{
                          height: '20px',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          '.MuiChip-label': {
                            px: 1,
                            fontSize: '0.75rem',
                            color: bulkAssignDetails.semester === sem ? 'white' : '#3b82f6',
                          },
                        }}
                      />
                    </Box>
                  }
                  onClick={() => {
                    setBulkAssignDetails(prev => ({ ...prev, semester: sem }));
                    setSelectedMentees([]);
                    fetchAvailableMentees(sem);
                  }}
                  sx={{
                    color: 'white',
                    bgcolor: bulkAssignDetails.semester === sem ? '#f97316' : 'rgba(249, 115, 22, 0.05)', // Updated color
                    '&:hover': {
                      bgcolor: bulkAssignDetails.semester === sem ? '#ea580c' : 'rgba(249, 115, 22, 0.1)', // Updated color
                    },
                    transition: 'all 0.2s ease',
                    border: '1px solid',
                    borderColor: bulkAssignDetails.semester === sem ? '#f97316' : 'transparent',
                  }}
                />
              ))}
            </Box>

            {/* Enhanced Mentees Table with proper scrolling */}
            <TableContainer sx={{
              ...tableStyles.container,
              flex: 1, // Take remaining space
              overflow: 'auto', // Enable scroll only for table
              // Remove maxHeight as we're using flex
            }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={tableStyles.headerCell} align="center" width="60px">
                      <Checkbox
                        sx={{ 
                          color: '#f97316', // Updated color
                          '&.Mui-checked': {
                            color: '#f97316', // Updated color
                          }
                        }}
                        checked={availableMentees.length > 0 && 
                          availableMentees.filter(m => !m.mentorMujid).length === selectedMentees.length}
                        onChange={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const availableIds = availableMentees
                            .filter(m => !m.mentorMujid)
                            .map(m => m.MUJid);
                          setSelectedMentees(e.target.checked ? availableIds : []);
                        }}
                      />
                    </TableCell>
                    {['Name', 'MUJ ID', 'Email', 'Phone', 'Mentor Email', 'Status'].map((header) => (
                      <TableCell 
                        key={header}
                        sx={{
                          ...tableStyles.headerCell,
                          width: header === 'Email' || header === 'Mentor Email' ? '200px' : 
                                 header === 'Status' ? '100px' : '150px',
                        }}
                      >
                        {header}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingMentees ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={tableStyles.cell}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 2,
                          py: 4
                        }}>
                          <CircularProgress size={24} sx={{ color: '#3b82f6' }} />
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            Loading mentees...
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : availableMentees.map((mentee) => (
                    <TableRow key={mentee.MUJid} sx={tableStyles.row}>
                      <TableCell sx={tableStyles.cell} align="center">
                        <Checkbox
                          disabled={mentee.mentorMujid}
                          checked={selectedMentees.includes(mentee.MUJid)}
                          onChange={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedMentees(prev => 
                              e.target.checked
                                ? [...prev, mentee.MUJid]
                                : prev.filter(id => id !== mentee.MUJid)
                            );
                          }}
                          sx={{ 
                            color: '#f97316', // Updated color
                            '&.Mui-checked': {
                              color: '#f97316', // Updated color
                            },
                            '&.Mui-disabled': {
                              color: 'rgba(51, 65, 85, 0.3)',
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell sx={tableStyles.cell}>{mentee.name}</TableCell>
                      <TableCell sx={tableStyles.cell}>{mentee.MUJid}</TableCell>
                      <TableCell sx={tableStyles.cell}>{mentee.email}</TableCell>
                      <TableCell sx={tableStyles.cell}>{mentee.phone || 'N/A'}</TableCell>
                      <TableCell sx={tableStyles.cell}>
                        {mentee.mentorEmailid ? (
                          <Typography 
                            sx={{ 
                              color: 'rgba(255, 255, 255, 0.7)',
                              fontSize: '0.875rem',
                              maxWidth: '200px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                            title={mentee.mentorEmailid} // Shows full email on hover
                          >
                            {mentee.mentorEmailid}
                          </Typography>
                        ) : '—'}
                      </TableCell>
                      <TableCell sx={{
                        ...tableStyles.cell,
                        color: mentee.mentorMujid ? '#ef4444' : '#22c55e',
                        fontWeight: 500,
                      }}>
                        {mentee.mentorMujid ? 'Assigned' : 'Available'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {availableMentees.length === 0 && !loadingMentees && (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={tableStyles.cell}>
                        <Box sx={{ 
                          display: 'flex', 
                          flexDirection: 'column',
                          alignItems: 'center',
                          py: 2
                        }}>
                          <Typography variant="h6" sx={{ 
                            color: 'rgba(255, 255, 255, 0.7)',
                            mb: 1
                          }}>
                            No mentees available for this semester
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            color: 'rgba(255, 255, 255, 0.5)',
                          }}>
                            Try selecting a different semester or check back later
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </DialogContent>

        <DialogActions sx={{ 
          p: 3, 
          borderTop: '1px solid rgba(51, 65, 85, 0.2)',
          bgcolor: 'rgba(17, 24, 39, 0.95)',
          flexShrink: 0,
          display: 'flex',
          justifyContent: 'space-between', // Changed from flex-end
          gap: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              {selectedMentees.length} mentees selected
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              onClick={() => setBulkAssignDialog(false)}
              variant="outlined"
              sx={{ 
                color: 'white',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  bgcolor: 'rgba(255, 255, 255, 0.05)'
                }
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkAssign}
              variant="contained"
              disabled={selectedMentees.length === 0}
              sx={{
                minWidth: '200px', // Ensure button width for text
                bgcolor: '#f97316', // Updated color
                '&:hover': { 
                  bgcolor: '#ea580c', // Updated color
                  transform: 'translateY(-2px)',
                },
                '&.Mui-disabled': {
                  bgcolor: 'rgba(51, 65, 85, 0.3)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              Assign Selected Mentees ({selectedMentees.length})
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Dialog>
  ) ;
};

export default MentorDetailsDialog;