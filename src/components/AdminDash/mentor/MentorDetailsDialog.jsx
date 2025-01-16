import { useState } from 'react';
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
  MenuItem,
  DialogActions
} from '@mui/material';
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

const MentorDetailsDialog = ({ open, onClose, mentor }) => {
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [mentees, setMentees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editMenteeDialog, setEditMenteeDialog] = useState(false);
  const [selectedMentee, setSelectedMentee] = useState(null);
  const [bulkAssignDialog, setBulkAssignDialog] = useState(false);
  const [availableMentees, setAvailableMentees] = useState([]);
  const [selectedMentees, setSelectedMentees] = useState([]);
  const [loadingMentees, setLoadingMentees] = useState(false);
  const [bulkAssignDetails, setBulkAssignDetails] = useState({
    semester: '',
    section: '',
  });
  const [showMentorInfo, setShowMentorInfo] = useState(true);

  // Generate sections array A to Z
  const generateSections = () => {
    return Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
  };

  // Update sections state
  const [sections] = useState(generateSections());

  const fetchMentees = async (semester, section) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/admin/getMenteesByMentor?mentorMujid=${mentor?.MUJid}&semester=${semester}&section=${section}`);
      setMentees(response.data.mentees || []);
      setSelectedSemester(semester);
      setSelectedSection(section);
    } catch (error) {
      console.log('Error fetching mentees:', error);
      setMentees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSemesterClick = (sem) => {
    setSelectedSemester(sem);
    setSelectedSection(null); // Reset section when semester changes
    setMentees([]); // Clear mentees list
    // Reset bulk assignment states
    setAvailableMentees([]);
    setSelectedMentees([]);
    setBulkAssignDetails({
      semester: '',
      section: '',
    });
  };

  const handleSectionInput = (event) => {
    const value = event.target.value.toUpperCase();
    // Allow any single uppercase letter A-Z
    if (/^[A-Z]?$/.test(value)) {
      setSelectedSection(value);
      setMentees([]); // Clear mentees list before fetching new data
      if (value && selectedSemester) {
        fetchMentees(selectedSemester, value);
      }
    }
  };

  const handleEditMentee = async (mentee) => {
    setSelectedMentee(mentee);
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
      if (selectedSemester && selectedSection) {
        await fetchMentees(selectedSemester, selectedSection);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error unassigning mentee');
    }
  };

  const handleSaveMenteeChanges = async (updatedData) => {
    try {
      await axios.patch(`/api/admin/manageUsers/manageMentee`, {
        MUJid: selectedMentee.MUJid,
        ...updatedData
      });
      toast.success('Mentee details updated successfully');
      setEditMenteeDialog(false);
      // Refresh the mentees list
      if (selectedSemester && selectedSection) {
        await fetchMentees(selectedSemester, selectedSection);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error updating mentee details');
    }
  };

  // Add custom styles for the assignment dialog
  const assignmentDialogStyles = {
    paper: {
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      backdropFilter: 'blur(20px)',
      borderRadius: '16px',
      border: '1px solid rgba(249, 115, 22, 0.2)',
      maxWidth: '500px',
      width: '100%',
    },
    title: {
      borderBottom: '1px solid rgba(249, 115, 22, 0.2)',
      padding: '20px 24px',
      '& .MuiTypography-root': {
        color: '#f97316',
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
          backgroundColor: 'rgba(249, 115, 22, 0.05)',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#f97316',
            borderWidth: '2px',
          },
        },
      },
      '& .MuiInputLabel-root': {
        color: 'rgba(255, 255, 255, 0.7)',
        '&.Mui-focused': {
          color: '#f97316',
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
      border: '1px solid rgba(249, 115, 22, 0.2)',
    },
    header: {
      background: 'linear-gradient(90deg, rgba(249, 115, 22, 0.15) 0%, rgba(249, 115, 22, 0.05) 100%)',
      borderBottom: '1px solid rgba(249, 115, 22, 0.2)',
      padding: '20px',
      borderTopLeftRadius: '24px',
      borderTopRightRadius: '24px',
    },
    infoCard: {
      background: 'rgba(249, 115, 22, 0.05)',
      borderRadius: '16px',
      padding: '16px',
      border: '1px solid rgba(249, 115, 22, 0.15)',
      transition: 'all 0.3s ease',
      minHeight: '90px',
      '&:hover': {
        background: 'rgba(249, 115, 22, 0.08)',
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 12px rgba(249, 115, 22, 0.1)',
      },
    },
  };

  // Add table header styles
  const tableHeaderStyles = {
    display: 'grid',
    gridTemplateColumns: '1.5fr 1fr 1.5fr 1fr 1fr 1fr 1fr 0.5fr',
    gap: 1,
    p: 2,
    bgcolor: 'rgba(249, 115, 22, 0.1)',
    borderBottom: '1px solid rgba(249, 115, 22, 0.2)',
  };

  // Add table row styles
  const tableRowStyles = {
    display: 'grid',
    gridTemplateColumns: '1.5fr 1fr 1.5fr 1fr 1fr 1fr 1fr 0.5fr',
    gap: 1,
    p: 2,
    '&:hover': {
      bgcolor: 'rgba(249, 115, 22, 0.1)',
    },
    transition: 'all 0.2s ease',
  };

  // Add new function to fetch available mentees
  const fetchAvailableMentees = async (semester, section) => {
    setLoadingMentees(true);
    try {
      const response = await axios.get(`/api/admin/getMenteesForAssignment`, {
        params: {
          semester,
          section,
          academicYear: mentor.academicYear,
          academicSession: mentor.academicSession
        }
      });
      setAvailableMentees(response.data.mentees || []);
    } catch (error) {
      toast.error('Error fetching available mentees');
      console.error(error);
    } finally {
      setLoadingMentees(false);
    }
  };

  const handleBulkAssign = async () => {
    try {
      const assignments = selectedMentees.map(menteeId => ({
        mentee_MUJid: menteeId,
        mentor_MUJid: mentor.MUJid,
        academicYear: mentor.academicYear,
        academicSession: mentor.academicSession,
        section: bulkAssignDetails.section,
        current_semester: bulkAssignDetails.semester
      }));

      await axios.post('/api/admin/assignMentor/bulk', { assignments });
      toast.success('Mentees assigned successfully');
      setBulkAssignDialog(false);
      if (selectedSemester === Number(bulkAssignDetails.semester)) {
        await fetchMentees(selectedSemester, bulkAssignDetails.section);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error assigning mentees');
    }
  };

  // Add a validation function for section input
  const handleBulkSectionInput = (event) => {
    const value = event.target.value.toUpperCase();
    if (/^[A-Z]?$/.test(value)) {
      setBulkAssignDetails(prev => ({
        ...prev,
        section: value
      }));
      // Reset available mentees and selected mentees
      setAvailableMentees([]);
      setSelectedMentees([]);
      if (value && bulkAssignDetails.semester) {
        fetchAvailableMentees(bulkAssignDetails.semester, value);
      }
    }
  };

  // Modify bulk assignment semester change handler
  const handleBulkSemesterChange = (e) => {
    const value = e.target.value;
    setBulkAssignDetails(prev => ({
      ...prev,
      semester: value
    }));
    // Reset available mentees and selected mentees
    setAvailableMentees([]);
    setSelectedMentees([]);
    if (value && bulkAssignDetails.section) {
      fetchAvailableMentees(value, bulkAssignDetails.section);
    }
  };

  // Update the table styles for better visibility
  const tableStyles = {
    container: {
      maxHeight: '600px',
      bgcolor: 'rgba(0, 0, 0, 0.2)',
      borderRadius: '12px',
      border: '1px solid rgba(249, 115, 22, 0.15)',
      overflow: 'hidden',
    },
    headerCell: {
      bgcolor: 'rgba(249, 115, 22, 0.1)',
      color: '#f97316',
      fontWeight: 600,
      borderBottom: '2px solid rgba(249, 115, 22, 0.2)',
      padding: '12px 16px',
    },
    row: {
      '&:nth-of-type(odd)': {
        bgcolor: 'rgba(249, 115, 22, 0.02)',
      },
      '&:hover': {
        bgcolor: 'rgba(249, 115, 22, 0.08)',
      },
      transition: 'all 0.2s ease',
    },
    cell: {
      color: 'white',
      borderBottom: '1px solid rgba(249, 115, 22, 0.1)',
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: cardStyles.container }}
    >
      {/* Header Section with Centered Toggle */}
      <Box sx={{ position: 'relative' }}>
        <Box sx={{
          ...cardStyles.header,
          transition: 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out',
          maxHeight: showMentorInfo ? '500px' : '64px',
          opacity: showMentorInfo ? 1 : 0.8,
          overflow: 'hidden',
          pb: showMentorInfo ? 5 : 2, // Add padding at bottom for toggle button
        }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: showMentorInfo ? 3 : 0 
          }}>
            <Typography variant="h5" sx={{ 
              color: '#f97316',
              fontWeight: 600,
              letterSpacing: '0.5px',
            }}>
              Mentor Profile
            </Typography>
            <IconButton onClick={onClose} sx={{ 
              color: 'white',
              '&:hover': { 
                background: 'rgba(249, 115, 22, 0.1)',
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
            bgcolor: 'rgba(249, 115, 22, 0.1)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(249, 115, 22, 0.2)',
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: 'rgba(249, 115, 22, 0.2)',
              transform: 'translate(-50%, 50%) scale(1.1)',
            }
          }}
        >
          {showMentorInfo ? 
            <ExpandLessIcon sx={{ color: '#f97316' }} /> : 
            <ExpandMoreIcon sx={{ color: '#f97316' }} />
          }
        </Box>
      </Box>

      {/* Main Content with improved mobile responsiveness */}
      <DialogContent sx={{ 
        p: { xs: 1, sm: 2 },
        height: {
          xs: `calc(100vh - ${showMentorInfo ? '350px' : '100px'})`,
          sm: `calc(100vh - ${showMentorInfo ? '400px' : '100px'})`,
        },
        transition: 'height 0.3s ease-in-out',
      }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ color: '#f97316', mb: 2 }}>
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
                  color: 'rgba(249, 115, 22, 0.7)',
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
                  label={`Semester ${sem}`}
                  onClick={() => handleSemesterClick(sem)}
                  sx={{
                    color: 'white',
                    bgcolor: selectedSemester === sem ? '#f97316' : 'rgba(255, 255, 255, 0.05)',
                    '&:hover': {
                      bgcolor: selectedSemester === sem ? '#ea580c' : 'rgba(255, 255, 255, 0.1)',
                    },
                    transition: 'all 0.2s ease',
                    border: '1px solid',
                    borderColor: selectedSemester === sem ? '#f97316' : 'transparent',
                  }}
                />
              ))}
            </Box>
          </Box>

          {/* Section Input */}
          {selectedSemester && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ color: 'white', mb: 1 }}>
                Enter Section
              </Typography>
              <TextField
                value={selectedSection || ''}
                onChange={handleSectionInput}
                placeholder="A-Z"
                inputProps={{ 
                  maxLength: 1,
                  style: { 
                    textTransform: 'uppercase',
                    fontSize: '1.1rem',
                    textAlign: 'center',
                  }
                }}
                sx={{
                  width: '120px',
                  '& .MuiOutlinedInput-root': {
                    height: '48px',
                    color: '#f97316',
                    bgcolor: 'rgba(249, 115, 22, 0.1)',
                    borderRadius: '12px',
                    '&:hover': {
                      bgcolor: 'rgba(249, 115, 22, 0.15)',
                    },
                    '&.Mui-focused': {
                      bgcolor: 'rgba(249, 115, 22, 0.2)',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#f97316',
                        borderWidth: '2px',
                      },
                    },
                  },
                }}
              />
            </Box>
          )}

          {/* Mentees List with Table Layout */}
          <Box sx={{
            bgcolor: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid rgba(249, 115, 22, 0.1)',
            height: '450px',
          }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress sx={{ color: '#f97316' }} />
              </Box>
            ) : mentees.length > 0 ? (
              <Box sx={{ height: '100%', overflow: 'auto' }}>
                {/* Table Header */}
                <Box sx={tableHeaderStyles}>
                  <Typography variant="subtitle2" sx={{ color: '#f97316' }}>Name</Typography>
                  <Typography variant="subtitle2" sx={{ color: '#f97316' }}>MUJ ID</Typography>
                  <Typography variant="subtitle2" sx={{ color: '#f97316' }}>Email</Typography>
                  <Typography variant="subtitle2" sx={{ color: '#f97316' }}>Phone</Typography>
                  <Typography variant="subtitle2" sx={{ color: '#f97316' }}>Academic Year</Typography>
                  <Typography variant="subtitle2" sx={{ color: '#f97316' }}>Session</Typography>
                  <Typography variant="subtitle2" sx={{ color: '#f97316' }}>Reg. Year</Typography>
                  <Typography variant="subtitle2" sx={{ color: '#f97316', textAlign: 'center' }}>Edit</Typography>
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
                                color: '#f97316',
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
            ) : (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                height: '100%',
                color: 'rgba(255, 255, 255, 0.5)'
              }}>
                {!selectedSemester ? 'Select a semester to view mentees' : 
                !selectedSection ? 'Enter a section (A-Z)' : 
                'No mentees found for this semester and section'}
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>

      {/* Footer Actions - Modified to only show bulk assign button */}
      <Box sx={{ 
        p: 3, 
        borderTop: '1px solid rgba(249, 115, 22, 0.1)',
        display: 'flex',
        justifyContent: 'flex-end'  // Changed from space-between to flex-end
      }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setBulkAssignDialog(true)}
          sx={{
            bgcolor: '#f97316',
            '&:hover': { 
              bgcolor: '#ea580c',
              transform: 'translateY(-2px)',
            },
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(249, 115, 22, 0.25)',
          }}
        >
          Assign Mentees
        </Button>
      </Box>

      {/* Updated Edit Mentee Dialog */}
      <Dialog
        open={editMenteeDialog}
        onClose={() => setEditMenteeDialog(false)}
        PaperProps={{ sx: assignmentDialogStyles.paper }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={assignmentDialogStyles.title}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <EditIcon sx={{ color: '#f97316' }} />
            <Typography>Edit Mentee Details</Typography>
          </Box>
          <IconButton
            onClick={() => setEditMenteeDialog(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'rgba(255, 255, 255, 0.5)',
              '&:hover': { color: '#f97316' },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={assignmentDialogStyles.content}>
          {selectedMentee && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Personal Information Section */}
              <Box sx={{ 
                p: 2, 
                bgcolor: 'rgba(249, 115, 22, 0.1)', 
                borderRadius: 2,
                border: '1px solid rgba(249, 115, 22, 0.2)'
              }}>
                <Typography variant="subtitle2" sx={{ color: '#f97316', mb: 2 }}>
                  Personal Information
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField
                    label="Name"
                    defaultValue={selectedMentee.name}
                    sx={assignmentDialogStyles.textField}
                    fullWidth
                  />
                  <TextField
                    label="MUJ ID"
                    value={selectedMentee.MUJid}
                    sx={assignmentDialogStyles.textField}
                    fullWidth
                    disabled
                  />
                  <TextField
                    label="Email"
                    defaultValue={selectedMentee.email}
                    sx={assignmentDialogStyles.textField}
                    fullWidth
                  />
                  <TextField
                    label="Phone"
                    defaultValue={selectedMentee.phone}
                    sx={assignmentDialogStyles.textField}
                    fullWidth
                  />
                </Box>
              </Box>

              {/* Academic Information Section */}
              <Box sx={{ 
                p: 2, 
                bgcolor: 'rgba(249, 115, 22, 0.1)', 
                borderRadius: 2,
                border: '1px solid rgba(249, 115, 22, 0.2)'
              }}>
                <Typography variant="subtitle2" sx={{ color: '#f97316', mb: 2 }}>
                  Academic Information
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField
                    label="Academic Year"
                    defaultValue={selectedMentee.academicYear}
                    sx={assignmentDialogStyles.textField}
                    fullWidth
                  />
                  <TextField
                    label="Academic Session"
                    defaultValue={selectedMentee.academicSession}
                    sx={assignmentDialogStyles.textField}
                    fullWidth
                  />
                  <TextField
                    label="Current Semester"
                    defaultValue={selectedMentee.semester}
                    type="number"
                    InputProps={{ inputProps: { min: 1, max: 8 } }}
                    sx={assignmentDialogStyles.textField}
                    fullWidth
                  />
                  <TextField
                    label="Section"
                    defaultValue={selectedMentee.section}
                    inputProps={{ 
                      style: { textTransform: 'uppercase' },
                      maxLength: 1
                    }}
                    sx={assignmentDialogStyles.textField}
                    fullWidth
                  />
                  <TextField
                    label="Year of Registration"
                    defaultValue={selectedMentee.yearOfRegistration}
                    type="number"
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
          borderTop: '1px solid rgba(249, 115, 22, 0.2)',
          display: 'flex',
          justifyContent: 'space-between'
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
              onClick={() => setEditMenteeDialog(false)}
              sx={{
                color: 'white',
                mr: 2
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleSaveMenteeChanges({
                // Add all the fields you want to update
                name: document.querySelector('[label="Name"] input').value,
                email: document.querySelector('[label="Email"] input').value,
                phone: document.querySelector('[label="Phone"] input').value,
                academicYear: document.querySelector('[label="Academic Year"] input').value,
                academicSession: document.querySelector('[label="Academic Session"] input').value,
                semester: document.querySelector('[label="Current Semester"] input').value,
                section: document.querySelector('[label="Section"] input').value.toUpperCase(),
                yearOfRegistration: document.querySelector('[label="Year of Registration"] input').value,
              })}
              variant="contained"
              sx={{
                bgcolor: '#f97316',
                '&:hover': { 
                  bgcolor: '#ea580c',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(249, 115, 22, 0.25)',
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
        maxWidth="xl" // Changed from md to xl
        fullWidth
        PaperProps={{ 
          sx: {
            ...assignmentDialogStyles.paper,
            maxWidth: '1200px', // Increased max width
            minHeight: '800px', // Added minimum height
          }
        }}
      >
        <DialogTitle sx={assignmentDialogStyles.title}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AddIcon sx={{ color: '#f97316' }} />
            <Typography>Assign Multiple Mentees</Typography>
          </Box>
          <IconButton
            onClick={() => setBulkAssignDialog(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'rgba(255, 255, 255, 0.5)',
              '&:hover': { color: '#f97316' },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ ...assignmentDialogStyles.content, p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Mentor Info Card */}
            <Box sx={{ 
              p: 3, 
              bgcolor: 'rgba(249, 115, 22, 0.1)', 
              borderRadius: 2,
              border: '1px solid rgba(249, 115, 22, 0.2)',
              mb: 2
            }}>
              <Typography variant="h6" sx={{ color: '#f97316', mb: 2 }}>
                Assigning to Mentor
              </Typography>
              <Box sx={{ display: 'flex', gap: 4 }}>
                <Box>
                  <Typography variant="subtitle2" color="white">Name</Typography>
                  <Typography color="rgba(255, 255, 255, 0.7)">{mentor?.name}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="white">MUJ ID</Typography>
                  <Typography color="rgba(255, 255, 255, 0.7)">{mentor?.MUJid}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="white">Academic Year</Typography>
                  <Typography color="rgba(255, 255, 255, 0.7)">{mentor?.academicYear}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="white">Session</Typography>
                  <Typography color="rgba(255, 255, 255, 0.7)">{mentor?.academicSession}</Typography>
                </Box>
              </Box>
            </Box>

            {/* Filters Section */}
            <Box sx={{ 
              display: 'flex', 
              gap: 3,
              alignItems: 'center',
              bgcolor: 'rgba(249, 115, 22, 0.05)',
              p: 2,
              borderRadius: '12px',
              border: '1px solid rgba(249, 115, 22, 0.15)',
            }}>
              <TextField
                select
                label="Semester"
                value={bulkAssignDetails.semester}
                onChange={handleBulkSemesterChange}  // Use the new handler
                sx={{
                  width: '200px',
                  '& .MuiInputLabel-root': {
                    color: 'rgba(249, 115, 22, 0.8)',
                  },
                }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                  <MenuItem key={sem} value={sem}>Semester {sem}</MenuItem>
                ))}
              </TextField>

              <TextField
                label="Section"
                value={bulkAssignDetails.section}
                onChange={handleBulkSectionInput}
                placeholder="A-Z"
                inputProps={{ 
                  maxLength: 1,
                  style: { 
                    textTransform: 'uppercase',
                    fontSize: '1.1rem',
                    textAlign: 'center',
                  }
                }}
                sx={{
                  width: '120px',
                  '& .MuiInputLabel-root': {
                    color: 'rgba(249, 115, 22, 0.8)',
                  },
                }}
              />
            </Box>

            {/* Enhanced Mentees Table */}
            <TableContainer sx={tableStyles.container}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={tableStyles.headerCell} align="center" width="60px">
                      <Checkbox
                        sx={{ 
                          color: '#f97316',
                          '&.Mui-checked': {
                            color: '#f97316',
                          }
                        }}
                        onChange={(e) => {
                          setSelectedMentees(
                            e.target.checked 
                              ? availableMentees.filter(m => !m.mentorMujid).map(m => m.MUJid)
                              : []
                          );
                        }}
                      />
                    </TableCell>
                    {['Name', 'MUJ ID', 'Email', 'Phone', 'Status', 'Current Mentor'].map((header) => (
                      <TableCell 
                        key={header}
                        sx={{
                          ...tableStyles.headerCell,
                          width: header === 'Current Mentor' ? 'auto' : '150px',
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
                      <TableCell colSpan={7} align="center" sx={tableStyles.cell}>
                        <CircularProgress sx={{ color: '#f97316' }} />
                      </TableCell>
                    </TableRow>
                  ) : availableMentees.map((mentee) => (
                    <TableRow key={mentee.MUJid} sx={tableStyles.row}>
                      <TableCell sx={tableStyles.cell} align="center">
                        <Checkbox
                          disabled={mentee.mentorMujid}
                          checked={selectedMentees.includes(mentee.MUJid)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMentees([...selectedMentees, mentee.MUJid]);
                            } else {
                              setSelectedMentees(selectedMentees.filter(id => id !== mentee.MUJid));
                            }
                          }}
                          sx={{ 
                            color: '#f97316',
                            '&.Mui-checked': {
                              color: '#f97316',
                            },
                            '&.Mui-disabled': {
                              color: 'rgba(249, 115, 22, 0.3)',
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell sx={tableStyles.cell}>{mentee.name}</TableCell>
                      <TableCell sx={tableStyles.cell}>{mentee.MUJid}</TableCell>
                      <TableCell sx={tableStyles.cell}>{mentee.email}</TableCell>
                      <TableCell sx={tableStyles.cell}>{mentee.phone || 'N/A'}</TableCell>
                      <TableCell sx={{
                        ...tableStyles.cell,
                        color: mentee.mentorMujid ? '#ef4444' : '#22c55e',
                        fontWeight: 500,
                      }}>
                        {mentee.mentorMujid ? 'Assigned' : 'Available'}
                      </TableCell>
                      <TableCell sx={tableStyles.cell}>
                        {mentee.assignedMentor ? 
                          `${mentee.assignedMentor.name} (${mentee.assignedMentor.MUJid})` : 
                          '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {availableMentees.length === 0 && !loadingMentees && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={tableStyles.cell}>
                        No mentees available for the selected criteria
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
          borderTop: '1px solid rgba(249, 115, 22, 0.2)',
          bgcolor: 'rgba(17, 24, 39, 0.95)',
        }}>
          <Button
            onClick={() => setBulkAssignDialog(false)}
            sx={{ color: 'white' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleBulkAssign}
            variant="contained"
            disabled={selectedMentees.length === 0}
            sx={{
              bgcolor: '#f97316',
              '&:hover': { bgcolor: '#ea580c' },
              '&.Mui-disabled': {
                bgcolor: 'rgba(249, 115, 22, 0.3)',
              }
            }}
          >
            Assign Selected Mentees ({selectedMentees.length})
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default MentorDetailsDialog;

