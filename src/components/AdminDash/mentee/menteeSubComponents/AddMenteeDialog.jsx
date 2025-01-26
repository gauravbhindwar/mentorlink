import { Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography, IconButton, TextField, Button, Alert, Stack } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { dialogStyles } from '../menteeStyle';
import { useState, useEffect } from 'react';
import { determineAcademicPeriod } from '../utils/academicUtils';
import { toast } from 'react-toastify';

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
      console.error('Error fetching mentors:', error);
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
      console.error('Error looking up mentor:', error);
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
  };

  const handleCreateMentor = async () => {
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
      
      if (data.mentor) {
        setMenteeDetails(prev => ({
          ...prev,
          mentorMujid: data.mentor.MUJid
        }));
        setMentorError(`Mentor created successfully with MUJid: ${data.mentor.MUJid}`);
        setShowCreateMentorPrompt(false);
      } else {
        setMentorError('Failed to create mentor');
      }
    } catch (error) {
      console.error('Error creating mentor:', error);
      setMentorError('Error creating mentor');
    }
  };

  const validateForm = () => {
    const requiredFields = {
      MUJid: 'MUJid',
      name: 'Name',
      email: 'Email',
      yearOfRegistration: 'Year of Registration',
      semester: 'Semester',
      mentorMujid: 'Mentor',
    };

    const missingFields = [];
    
    Object.entries(requiredFields).forEach(([field, label]) => {
      if (!menteeDetails[field]) {
        missingFields.push(label);
      }
    });

    if (missingFields.length > 0) {
      toast.error(`Please fill in required fields: ${missingFields.join(', ')}`, {
        position: "bottom-right",
        autoClose: 3000
      });
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(menteeDetails.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }

    // Validate phone number if provided
    if (menteeDetails.phone && !/^\d{10}$/.test(menteeDetails.phone)) {
      toast.error('Phone number must be 10 digits');
      return false;
    }

    // Validate MUJid format
    if (!/^[A-Z0-9]+$/.test(menteeDetails.MUJid)) {
      toast.error('MUJid must be uppercase alphanumeric only');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const response = await fetch('/api/admin/manageUsers/manageMentee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(menteeDetails)
      });

      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.error || 'Failed to add mentee');
        return;
      }

      // Update localStorage with new mentee data using academicYear and academicSession from menteeDetails
      const storageKey = `${menteeDetails.academicYear}-${menteeDetails.academicSession}`;
      const existingData = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const updatedData = [...existingData, data.mentee];
      localStorage.setItem(storageKey, JSON.stringify(updatedData));

      // Notify parent component with the storage key for context
      if (onMenteeAdded) {
        onMenteeAdded({
          mentee: data.mentee,
          storageKey
        });
      }
      
      toast.success('Mentee added successfully!');
      setMenteeDetails({
        MUJid: '',
        name: '',
        email: '',
        phone: '',
        yearOfRegistration: '',
        semester: '',
        academicYear: menteeDetails.academicYear, // Keep academic period
        academicSession: menteeDetails.academicSession, // Keep academic period
        mentorEmailid: '',
        mentorMujid: '',
        parents: {
          father: { name: null, email: null, phone: null, alternatePhone: null },
          mother: { name: null, email: null, phone: null, alternatePhone: null },
          guardian: { name: null, email: null, phone: null, relation: null }
        }
      });
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Error adding mentee. Please try again.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: dialogStyles.paper }}>
      <DialogTitle sx={dialogStyles.title}>
        <Typography variant="h6" component="div" sx={{ color: '#f97316', fontWeight: 600 }}>
          Add New Mentee
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'rgba(255, 255, 255, 0.7)',
            '&:hover': { color: '#f97316' },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={dialogStyles.content}>
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
      <DialogActions sx={dialogStyles.actions}>
        <Button onClick={onClose} variant="outlined" sx={{ color: 'white' }}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Add Mentee
        </Button>
      </DialogActions>
    </Dialog>
  );

};

export default AddMenteeDialog;
