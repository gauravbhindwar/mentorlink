import { Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography, TextField, Button, Alert, Stack, Slide } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { dialogStyles } from '../menteeStyle';
import { useState, useEffect } from 'react';
import { determineAcademicPeriod } from '../utils/academicUtils';
import { toast } from 'react-toastify';
import LoadingDialog from '@/components/common/LoadingDialog';
import axios from 'axios';


const AddMenteeDialog = ({ open, onClose, onMenteeAdded }) => { // Add onMenteeAdded prop
  const [menteeDetails, setMenteeDetails] = useState({
    MUJid: '',
    name: '',
    email: '',
    phone: '',
    yearOfRegistration: '',
    semester: '',
    academicYear: '',
    academicSession: '',
    mentorEmailid: '',
    mentorMujid: '',
    parents: {
      father: { name: null, email: null, phone: null, alternatePhone: null },
      mother: { name: null, email: null, phone: null, alternatePhone: null },
      guardian: { name: null, email: null, phone: null, relation: null }
    }
  });

  const [mentorError, setMentorError] = useState(null);
  const [showCreateMentorPrompt, setShowCreateMentorPrompt] = useState(false);
  const [loading, setLoading] = useState({
    status: false,
    message: ''
  });
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (open) {
      // Only update academic period when dialog opens
      const { academicYear, academicSession } = determineAcademicPeriod();
      setMenteeDetails(prev => ({
        ...prev,
        academicYear,
        academicSession
      }));
    }
  }, [open]); // Dependency on open prop

  const getMentorFromList = async (email) => {
    try {
      const response = await fetch('/api/admin/manageUsers/manageMentor');
      const data = await response.json();
      if (data.mentors && Array.isArray(data.mentors)) {
        return data.mentors.find(mentor => mentor.email.toLowerCase() === email.toLowerCase());
      }
      return null;
    } catch (error) {
      console.log('Error fetching mentors:', error);
      return null;
    }
  };

  const searchMentor = async () => {
    if (!menteeDetails.mentorEmailid) {
      setMentorError('Please enter mentor email');
      return;
    }

    try {
      const mentor = await getMentorFromList(menteeDetails.mentorEmailid);
      
      if (mentor) {
        setMenteeDetails(prev => ({
          ...prev,
          mentorMujid: mentor.MUJid
        }));
        setMentorError(null);
        setShowCreateMentorPrompt(false);
      } else {
        setMenteeDetails(prev => ({
          ...prev,
          mentorMujid: ''
        }));
        setMentorError('Mentor not found');
        setShowCreateMentorPrompt(true);
      }
    } catch (error) {
      console.log('Error looking up mentor:', error);
      setMentorError('Error looking up mentor');
    }
  };

  const handleInputChange = (e, parentType, field) => {
    const { name, value } = e.target;
    
    if (parentType) {
      setMenteeDetails(prev => ({
        ...prev,
        parents: {
          ...prev.parents,
          [parentType]: {
            ...prev.parents[parentType],
            [field]: value
          }
        }
      }));
    } else {
      setMenteeDetails(prev => ({
        ...prev,
        [name]: value
      }));
    }
    // Clear error for this field
    setFieldErrors(prev => ({
      ...prev,
      [name]: false
    }));
  };

  const handleCreateMentor = async () => {
    setLoading({ status: true, message: 'Creating new mentor...' });
    
    try {
      const response = await fetch('/api/admin/manageUsers/manageMentor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: menteeDetails.mentorEmailid,
          academicYear: menteeDetails.academicYear,
          academicSession: menteeDetails.academicSession

        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Show error toast but don't close dialog
        toast.error(data.error || 'Failed to create mentor', {
          duration: 3000,
          position: "top-right",
          style: {
            background: '#fee2e2',
            color: '#991b1b',
            border: '1px solid #f87171'
          }
        });
        return;
      }
      
      if (data.mentor) {
        setMenteeDetails(prev => ({
          ...prev,
          mentorMujid: data.mentor.MUJid
        }));
        setMentorError(`Mentor created successfully with MUJid: ${data.mentor.MUJid}`);
        setShowCreateMentorPrompt(false);
        
        // Show success toast but don't close dialog
        toast.success(`Mentor created successfully with ID: ${data.mentor.MUJid}`, {
          duration: 3000,
          position: "top-right",
          style: {
            background: '#dcfce7',
            color: '#166534',
            border: '1px solid #86efac'
          }
        });
      }
    } catch (error) {
      // Show error toast but don't close dialog
      toast.error(error.message || 'Error creating mentor', {
        duration: 3000,
        position: "top-right",
        style: {
          background: '#fee2e2',
          color: '#991b1b',
          border: '1px solid #f87171'
        }
      });
    } finally {
      setLoading({ status: false, message: '' });
    }
  };

  // const validateForm = () => {
  //   const requiredFields = {
  //     MUJid: 'MUJid',
  //     name: 'Name',
  //     email: 'Email',
  //     yearOfRegistration: 'Year of Registration',
  //     semester: 'Semester',
  //     mentorMujid: 'Mentor',
  //   };

  //   const missingFields = [];
    
  //   Object.entries(requiredFields).forEach(([field, label]) => {
  //     if (!menteeDetails[field]) {
  //       missingFields.push(label);
  //     }
  //   });

  //   if (missingFields.length > 0) {
  //     toast.error(`Please fill in required fields: ${missingFields.join(', ')}`, {
  //       position: "bottom-right",
  //       autoClose: 3000
  //     });
  //     return false;
  //   }

  //   // Validate email format
  //   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  //   if (!emailRegex.test(menteeDetails.email)) {
  //     toast.error('Please enter a valid email address');
  //     return false;
  //   }

  //   // Validate phone number if provided
  //   if (menteeDetails.phone && !/^\d{10}$/.test(menteeDetails.phone)) {
  //     toast.error('Phone number must be 10 digits');
  //     return false;
  //   }

  //   // Validate MUJid format
  //   if (!/^[A-Z0-9]+$/.test(menteeDetails.MUJid)) {
  //     toast.error('MUJid must be uppercase alphanumeric only');
  //     return false;
  //   }

  //   return true;
  // };

  const handleDialogClose = () => {
    if (onClose) {
      onClose();
    }
    // Reset form state
    setMenteeDetails({
      MUJid: '',
      name: '',
      email: '',
      phone: '',
      yearOfRegistration: '',
      semester: '',
      academicYear: '',
      academicSession: '',
      mentorEmailid: '',
      mentorMujid: '',
      parents: {
        father: { name: null, email: null, phone: null, alternatePhone: null },
        mother: { name: null, email: null, phone: null, alternatePhone: null },
        guardian: { name: null, email: null, phone: null, relation: null }
      }
    });
    setMentorError(null);
    setShowCreateMentorPrompt(false);
  };

  const handleFormSubmit = async () => {
    // Validate all required fields first
    const errors = {};
    const requiredFields = {
      name: 'Name',
      email: 'Email',
      MUJid: 'MUJid',
      yearOfRegistration: 'Year of Registration',
      semester: 'Semester',
      academicYear: 'Academic Year',
      academicSession: 'Academic Session',
      mentorMujid: 'Mentor MUJid'
    };

    try {
      setLoading({ status: true, message: 'Validating...' });

      // Check required fields
      Object.entries(requiredFields).forEach(([field, label]) => {
        if (!menteeDetails[field]) {
          errors[field] = `${label} is required`;
        }
      });

      // Validate email format
      if (menteeDetails.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(menteeDetails.email)) {
        errors.email = 'Invalid email format';
      }

      // Validate phone number if provided
      if (menteeDetails.phone && !/^\d{10}$/.test(menteeDetails.phone)) {
        errors.phone = 'Phone number must be 10 digits';
      }

      // Validate MUJid format
      if (menteeDetails.MUJid && !/^[A-Z0-9]+$/.test(menteeDetails.MUJid)) {
        errors.MUJid = 'MUJid must contain only uppercase letters and numbers';
      }

      // Validate year of registration
      const currentYear = new Date().getFullYear();
      if (menteeDetails.yearOfRegistration) {
        const year = parseInt(menteeDetails.yearOfRegistration);
        if (year < 2000 || year > currentYear) {
          errors.yearOfRegistration = 'Invalid year of registration';
        }
      }

      // Validate semester
      if (menteeDetails.semester) {
        const sem = parseInt(menteeDetails.semester);
        if (sem < 1 || sem > 8) {
          errors.semester = 'Semester must be between 1 and 8';
        }
      }

      // If there are any validation errors, show them and return
      if (Object.keys(errors).length > 0) {
        const errorMessages = Object.values(errors).join('\n');
        toast.error(errorMessages, {
          duration: 4000,
          style: {
            background: '#fee2e2',
            color: '#991b1b',
            border: '1px solid #f87171'
          }
        });
        return;
      }

      setLoading({ status: true, message: 'Adding new mentee...' });

      const response = await axios.post('/api/admin/manageUsers/manageMentee', menteeDetails);
      
      if (response.status === 201 && response.data?.mentee) {
        toast.success('Mentee added successfully', {
          duration: 3000,
          style: {
            background: '#dcfce7',
            color: '#166534',
            border: '1px solid #86efac'
          }
        });
        
        if (onMenteeAdded) {
          const storageKey = `${menteeDetails.academicYear}-${menteeDetails.academicSession}`;
          onMenteeAdded({
            mentee: response.data.mentee,
            storageKey
          });
        }
        
        handleDialogClose();
      }
    } catch (error) {
      console.log('Error adding mentee:', error);
      
      // Handle 409 Conflict errors specifically
      if (error.response?.status === 409) {
        const errorData = error.response.data;
        let errorMessage = 'This mentee cannot be added';
        let errorDetails = '';
        let fieldInError = '';

        // Check specific duplicate field
        if (errorData.error?.includes('MUJid')) {
          errorMessage = 'This MUJid is already registered';
          errorDetails = `MUJid "${menteeDetails.MUJid}" belongs to another mentee`;
          fieldInError = 'MUJid';
        } else if (errorData.error?.includes('email')) {
          errorMessage = 'This email is already registered';
          errorDetails = `Email "${menteeDetails.email}" belongs to another mentee`;
          fieldInError = 'email';
        }

        // Show error toast with details
        toast.error(
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{errorMessage}</div>
            <div style={{ fontSize: '0.9em', color: '#991b1b' }}>{errorDetails}</div>
          </div>,
          {
            duration: 5000,
            style: {
              background: '#fee2e2',
              color: '#991b1b',
              border: '1px solid #f87171',
              padding: '12px'
            }
          }
        );

        // Update the specific field's error state
        if (fieldInError) {
          setFieldErrors(prev => ({
            ...prev,
            [fieldInError]: true
          }));
        }
      } else {
        // Handle other types of errors
        const errorMessage = error.response?.data?.error || error.message || 'Error adding mentee';
        toast.error(errorMessage, {
          duration: 4000,
          style: {
            background: '#fee2e2',
            color: '#991b1b',
            border: '1px solid #f87171'
          }
        });
      }
    } finally {
      setLoading({ status: false, message: '' });
    }
  };

  return (
    <>
      <Dialog 
        open={open}
        fullScreen
        TransitionComponent={Slide}
        TransitionProps={{ direction: "up" }}
        PaperProps={{
          sx: {
            margin: 0,
            maxHeight: '100%',
            background: '#1a1a1a',
            backgroundImage: 'linear-gradient(rgba(249, 115, 22, 0.05), transparent)',
            '@media (min-width: 600px)': {
              maxHeight: '90vh',
              maxWidth: '600px',
              margin: '24px auto',
              borderRadius: '16px',
            }
          }
        }}
      >
        <DialogTitle sx={{
          px: { xs: 2, sm: 3 },
          py: { xs: 1.5, sm: 2 },
          fontSize: { xs: '1.125rem', sm: '1.25rem' },
          fontWeight: 600,
          color: '#f97316',
          borderBottom: '1px solid rgba(249, 115, 22, 0.2)',
        }}>
          Add New Mentee
        </DialogTitle>
        <DialogContent sx={{
          p: { xs: 2, sm: 3 },
          '& .MuiTextField-root': {
            mb: { xs: 1.5, sm: 2 },
            '& .MuiInputLabel-root': {
              fontSize: { xs: '0.875rem', sm: '1rem' }
            },
            '& .MuiInputBase-input': {
              fontSize: { xs: '0.875rem', sm: '1rem' },
              p: { xs: 1.5, sm: 2 }
            }
          }
        }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Student Information */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="subtitle1" sx={{ color: '#f97316', fontWeight: 600 }}>
                  Student Information
                </Typography>
                <TextField
                  label="MUJid"
                  name="MUJid"
                  value={menteeDetails.MUJid}
                  onChange={handleInputChange}
                  required
                  error={fieldErrors.MUJid}
                  helperText={fieldErrors.MUJid ? "This MUJid is already in use" : ""}
                  sx={dialogStyles.textField}
                />
                <TextField
                  label="Name"
                  name="name"
                  value={menteeDetails.name}
                  onChange={handleInputChange}
                  required
                  sx={dialogStyles.textField}
                />
                <TextField
                  label="Email"
                  name="email"
                  value={menteeDetails.email}
                  onChange={handleInputChange}
                  required
                  error={fieldErrors.email}
                  helperText={fieldErrors.email ? "This email is already registered" : ""}
                  sx={dialogStyles.textField}
                />
                <TextField
                  label="Phone"
                  name="phone"
                  value={menteeDetails.phone}
                  onChange={handleInputChange}
                  sx={dialogStyles.textField}
                />
              </Box>

              {/* Academic Information */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="subtitle1" sx={{ color: '#f97316', fontWeight: 600 }}>
                  Academic Information
                </Typography>
                <TextField
                  label="Year of Registration"
                  name="yearOfRegistration"
                  type="number"
                  value={menteeDetails.yearOfRegistration}
                  onChange={handleInputChange}
                  required
                  sx={dialogStyles.textField}
                />
                <TextField
                  label="Semester"
                  name="semester"
                  type="number"
                  value={menteeDetails.semester}
                  onChange={handleInputChange}
                  required
                  sx={dialogStyles.textField}
                />
                <TextField
                  label="Academic Year"
                  name="academicYear"
                  value={menteeDetails.academicYear}
                  sx={{ ...dialogStyles.textField, pointerEvents: 'none', cursor: 'default', opacity: 0.5}}
                />
                <TextField
                  label="Academic Session"
                  name="academicSession"
                  value={menteeDetails.academicSession}
                  sx={{ ...dialogStyles.textField, pointerEvents: 'none', cursor: 'default', opacity: 0.5}}
                />
              </Box>
            </Box>

            {/* Mentor Information */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="subtitle1" sx={{ color: '#f97316', fontWeight: 600 }}>
                Mentor Information
              </Typography>
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <TextField
                  label="Mentor Email"
                  name="mentorEmailid"
                  value={menteeDetails.mentorEmailid}
                  onChange={handleInputChange}
                  required
                  sx={{ flex: 1 , ...dialogStyles.textField}}
                />
                <Button
                  variant="contained"
                  onClick={searchMentor}
                  startIcon={<SearchIcon />}
                  sx={{ height: '56px', borderRadius: '4px', '&:hover':"#f97316" }}
                >
                  Search
                </Button>
              </Stack>
              {mentorError && (
                <Alert 
                  severity={mentorError.includes('successfully') ? "success" : "error"}
                >
                  {mentorError}
                </Alert>
              )}
              {showCreateMentorPrompt && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleCreateMentor}
                  startIcon={<AddIcon />}
                  sx={{ mt: 1, borderRadius: '4px', '&:hover':"#f97316" }}
                >
                  Create New Mentor
                </Button>
              )}
              <TextField
                label="Mentor MUJid"
                name="mentorMujid"
                value={menteeDetails.mentorMujid}
                sx={{ ...dialogStyles.textField, pointerEvents: 'none', cursor: 'default', opacity: 0.5}}
              />
            
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{
          position: { xs: 'sticky', sm: 'static' },
          bottom: 0,
          bgcolor: '#1a1a1a',
          borderTop: '1px solid rgba(249, 115, 22, 0.2)',
          px: { xs: 2, sm: 3 },
          py: { xs: 1.5, sm: 2 },
          gap: 1
        }}>
          <Button onClick={onClose} variant="outlined" sx={{ color: 'white' }}>
            Cancel
          </Button>
          <Button onClick={handleFormSubmit} variant="contained" color="primary">
            Add Mentee
          </Button>
        </DialogActions>
      </Dialog>
      
      <LoadingDialog 
        open={loading.status} 
        message={loading.message}
      />
    </>
  );

};

export default AddMenteeDialog;
