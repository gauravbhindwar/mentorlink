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
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  TextField,
  MenuItem,
  DialogActions
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';
import { toast } from 'react-toastify';

const MentorDetailsDialog = ({ open, onClose, mentor }) => {
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [mentees, setMentees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assignmentDialog, setAssignmentDialog] = useState(false);
  const [assignmentDetails, setAssignmentDetails] = useState({
    mentee_MUJid: '',
    section: '',
    current_semester: '',
  });

  const fetchMentees = async (semester) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/admin/getMenteesByMentor?mentorMujid=${mentor?.MUJid}&semester=${semester}`);
      setMentees(response.data.mentees || []);
      setSelectedSemester(semester);
    } catch (error) {
      console.error('Error fetching mentees:', error);
      setMentees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignMentee = async () => {
    try {
      const payload = {
        mentor_MUJid: mentor.MUJid,
        ...assignmentDetails,
        academicYear: mentor.academicYear,
        academicSession: mentor.academicSession,
        session: mentor.academicYear
      };

      await axios.post('/api/admin/assignMentor', payload);
      toast.success('Mentee assigned successfully');
      setAssignmentDialog(false);
      // Refresh mentees list if current semester is selected
      if (selectedSemester === Number(assignmentDetails.current_semester)) {
        await fetchMentees(selectedSemester);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error assigning mentee');
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: 'rgba(17, 24, 39, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          border: '1px solid rgba(249, 115, 22, 0.2)',
          maxHeight: '90vh', // Ensure dialog doesn't exceed viewport
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid rgba(249, 115, 22, 0.2)',
          p: 2 // Reduced padding
        }}
      >
        <Box sx={{ color: '#f97316', typography: 'h6' }}>
          Mentor Details
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ 
        p: 2, // Reduced padding
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        overflow: 'hidden' // Prevent double scrollbars
      }}>
        {mentor && (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Quick Info Bar */}
            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              p: 2,
              bgcolor: 'rgba(249, 115, 22, 0.1)',
              borderRadius: 1,
              mb: 2
            }}>
              <Box>
                <Typography variant="subtitle2" color="rgba(255, 255, 255, 0.6)">
                  {mentor.name} ({mentor.MUJid})
                </Typography>
                <Typography variant="caption" color="rgba(255, 255, 255, 0.5)">
                  {mentor.email} • {mentor.phone_number}
                </Typography>
              </Box>
              <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                {Array.isArray(mentor.role) ? mentor.role.map((role, index) => (
                  <Chip
                    key={index}
                    label={role}
                    size="small"
                    sx={{
                      color: 'white',
                      bgcolor: 'rgba(249, 115, 22, 0.2)',
                      border: '1px solid rgba(249, 115, 22, 0.3)',
                    }}
                  />
                )) : null}
              </Box>
            </Box>

            {/* Academic Info Bar */}
            <Box sx={{ 
              display: 'flex',
              gap: 2,
              mb: 2,
              p: 1.5,
              bgcolor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 1
            }}>
              <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                Academic Year: {mentor.academicYear}
              </Typography>
              <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                Session: {mentor.academicSession}
              </Typography>
            </Box>

            {/* Mentees Section - Given more prominence */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <Typography variant="h6" color="#f97316" sx={{ mb: 2 }}>
                Mentees by Semester
              </Typography>
              
              {/* Semester Selection */}
              <Box sx={{ 
                display: 'flex', 
                gap: 1, 
                flexWrap: 'wrap', 
                mb: 2,
                pb: 2,
                borderBottom: '1px solid rgba(249, 115, 22, 0.2)'
              }}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <Chip
                    key={sem}
                    label={`Semester ${sem}`}
                    onClick={() => fetchMentees(sem)}
                    sx={{
                      color: 'white',
                      bgcolor: selectedSemester === sem ? 'rgba(249, 115, 22, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                      '&:hover': {
                        bgcolor: 'rgba(249, 115, 22, 0.2)',
                      },
                    }}
                  />
                ))}
              </Box>

              {/* Mentees List with Flex Growth */}
              <Box sx={{ 
                flex: 1,
                overflow: 'auto',
                bgcolor: 'rgba(0, 0, 0, 0.2)', 
                borderRadius: 2,
                position: 'relative',
                minHeight: '300px', // Increased minimum height
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'rgba(255, 255, 255, 0.05)',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(249, 115, 22, 0.3)',
                  borderRadius: '4px',
                  '&:hover': {
                    background: 'rgba(249, 115, 22, 0.5)',
                  },
                },
              }}>
                {loading ? (
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    height: '100%'
                  }}>
                    <CircularProgress sx={{ color: '#f97316' }} />
                  </Box>
                ) : mentees.length > 0 ? (
                  <List sx={{ p: 0 }}>
                    {mentees.map((mentee, index) => (
                      <Box key={mentee.MUJid}>
                        <ListItem sx={{ py: 2 }}>
                          <ListItemText
                            primary={
                              <Typography color="white" sx={{ fontWeight: 500 }}>
                                {mentee.name}
                              </Typography>
                            }
                            secondary={
                              <Box sx={{ mt: 0.5 }}>
                                <Typography color="rgba(255, 255, 255, 0.6)" variant="body2">
                                  {mentee.MUJid} • Section {mentee.section}
                                </Typography>
                                <Typography color="rgba(255, 255, 255, 0.5)" variant="body2">
                                  {mentee.email}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < mentees.length - 1 && (
                          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                        )}
                      </Box>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    height: '100%',
                    color: 'rgba(255, 255, 255, 0.5)'
                  }}>
                    {selectedSemester ? 'No mentees found for this semester' : 'Select a semester to view mentees'}
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>
      <Box sx={{ display: 'flex', mb: 2, px: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAssignmentDialog(true)}
          sx={{
            bgcolor: '#f97316',
            '&:hover': { bgcolor: '#ea580c' }
          }}
        >
          Assign Mentee
        </Button>
      </Box>

      {/* Redesigned Assignment Dialog */}
      <Dialog
        open={assignmentDialog}
        onClose={() => setAssignmentDialog(false)}
        PaperProps={{ sx: assignmentDialogStyles.paper }}
      >
        <DialogTitle sx={assignmentDialogStyles.title}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AddIcon sx={{ color: '#f97316' }} />
            <Typography>Assign New Mentee</Typography>
          </Box>
          <IconButton
            onClick={() => setAssignmentDialog(false)}
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Assignment Info Section */}
            <Box sx={{ 
              p: 2, 
              bgcolor: 'rgba(249, 115, 22, 0.1)', 
              borderRadius: 2,
              border: '1px solid rgba(249, 115, 22, 0.2)'
            }}>
              <Typography variant="subtitle2" sx={{ color: '#f97316', mb: 1 }}>
                Assigning to Mentor
              </Typography>
              <Typography variant="body2" sx={{ color: 'white' }}>
                {mentor?.name} ({mentor?.MUJid})
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', display: 'block' }}>
                {mentor?.academicYear} • {mentor?.academicSession}
              </Typography>
            </Box>

            {/* Form Fields */}
            <TextField
              label="Mentee MUJid"
              value={assignmentDetails.mentee_MUJid}
              onChange={(e) => setAssignmentDetails(prev => ({
                ...prev,
                mentee_MUJid: e.target.value.toUpperCase()
              }))}
              sx={assignmentDialogStyles.textField}
              fullWidth
              required
              placeholder="Enter Mentee's MUJid"
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                select
                label="Section"
                value={assignmentDetails.section}
                onChange={(e) => setAssignmentDetails(prev => ({
                  ...prev,
                  section: e.target.value
                }))}
                sx={assignmentDialogStyles.textField}
                fullWidth
                required
              >
                {['A', 'B', 'C', 'D', 'E'].map(section => (
                  <MenuItem key={section} value={section}>
                    Section {section}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Semester"
                value={assignmentDetails.current_semester}
                onChange={(e) => setAssignmentDetails(prev => ({
                  ...prev,
                  current_semester: e.target.value
                }))}
                sx={assignmentDialogStyles.textField}
                fullWidth
                required
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                  <MenuItem key={sem} value={sem}>
                    Semester {sem}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Typography sx={assignmentDialogStyles.helperText}>
              Make sure to verify the mentee&apos;s details before assigning
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(249, 115, 22, 0.2)' }}>
          <Button
            onClick={() => setAssignmentDialog(false)}
            sx={{
              color: 'white',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
                bgcolor: 'rgba(255, 255, 255, 0.05)',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssignMentee}
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
            Assign Mentee
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default MentorDetailsDialog;
