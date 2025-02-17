import { Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography, IconButton, TextField, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { dialogStyles } from '../menteeStyle';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const EditMenteeDialog = ({ open, onClose, mentee, onUpdate }) => {
  const [editedMentee, setEditedMentee] = useState(mentee);
  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState({});
  const [confirmDialog, setConfirmDialog] = useState(false);

  // Initialize editedMentee when mentee prop changes
  useEffect(() => {
    if (mentee) {
      console.log("Initializing edit dialog with mentee:", mentee); // Debug log
      setEditedMentee({
        ...mentee,
        // Ensure all required fields are present with proper values
        MUJid: mentee.MUJid || '',
        name: mentee.name || '',
        email: mentee.email || '',
        phone: mentee.phone || '',
        semester: mentee.semester || '',
        academicYear: mentee.academicYear || '',
        academicSession: mentee.academicSession || '',
        mentorMujid: mentee.mentorMujid || '',
        mentorEmailid: mentee.mentorEmailid || '',
        yearOfRegistration: mentee.yearOfRegistration || ''
      });
      setHasChanges(false);
      setErrors({});
    }
  }, [mentee]);

  // Modify validateField function to make semester and academic year required
  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        return value?.trim() ? '' : 'Name is required';
      case 'email':
        return value ? (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Invalid email format') : 'Email is required';
      case 'phone':
        return value ? (/^\d{10}$/.test(value) ? '' : 'Invalid phone number') : '';
      case 'yearOfRegistration':
        return value ? (value >= 2000 && value <= new Date().getFullYear() ? '' : 'Invalid year') : '';
      case 'semester':
        return !value ? 'Semester is required' : (value >= 1 && value <= 8 ? '' : 'Semester must be between 1 and 8');
      case 'academicYear':
        return !value ? 'Academic Year is required' : '';
      default:
        return '';
    }
  };

  // Update the areRequiredFieldsFilled function
  const areRequiredFieldsFilled = () => {
    return (
      editedMentee?.semester && 
      editedMentee?.yearOfRegistration &&
      !isNaN(editedMentee.semester) && 
      !isNaN(editedMentee.yearOfRegistration) &&
      editedMentee.semester.toString().trim() !== '' &&
      editedMentee.yearOfRegistration.toString().trim() !== '' &&
      !Object.values(errors).some(error => error !== '')
    );
  };

  const handleEditInputChange = (e, category, subcategory) => {
    const { name, value } = e.target;
    let updatedValue = value;
    let updatedMentee;

    // Format specific fields
    if (name === 'MUJid' || name === 'mentorMujid') {
      updatedValue = value.toUpperCase();
    } else if (name === 'phone') {
      updatedValue = value.replace(/\D/g, '').slice(0, 10);
    }

    // Update nested or regular fields
    if (category && subcategory) {
      updatedMentee = {
        ...editedMentee,
        parents: {
          ...editedMentee.parents,
          [category]: {
            ...editedMentee.parents?.[category],
            [subcategory]: updatedValue
          }
        }
      };
    } else {
      updatedMentee = {
        ...editedMentee,
        [name]: updatedValue
      };
    }

    // Validate the field
    const error = validateField(name, updatedValue);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));

    setEditedMentee(updatedMentee);
    setHasChanges(true);
    
    // Remove the toast notifications from here
    // Toast errors will only show when trying to update
  };

  // Modified handleUpdate function
  const handleUpdate = () => {
    const editableFields = ['name', 'email', 'phone', 'yearOfRegistration', 'semester'];
    const newErrors = {};
    let hasErrors = false;

    editableFields.forEach(field => {
      const error = validateField(field, editedMentee?.[field]);
      if (error) {
        newErrors[field] = error;
        hasErrors = true;
      }
    });

    setErrors(newErrors);
    
    if (hasErrors) {
      toast.error('Please fix all errors before updating');
      return;
    }

    // Show confirmation dialog
    setConfirmDialog(true);
  };

  const handleConfirmUpdate = () => {
    try {
      // Add null check
      if (!editedMentee || !editedMentee.MUJid) {
        throw new Error('Invalid mentee data');
      }

      // Close confirmation dialog first
      setConfirmDialog(false);
      
      // Call parent's onUpdate with edited data
      if (onUpdate) {
        onUpdate(editedMentee);
      }
      
      // Reset states and close dialog
      setErrors({});
      setHasChanges(false);
      onClose();
    } catch (error) {
      console.error('Error in handleConfirmUpdate:', error);
      toast.error('Failed to update mentee: Invalid data');
    }
  };

  // Rest of the component remains the same, just update the DialogActions
  return (
    <>
      <Dialog 
        open={open} 
        onClose={() => {
          if (hasChanges) {
            toast('You have unsaved changes', {
              icon: '⚠️',
              duration: 3000,
            });
          } else {
            onClose();
          }
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: dialogStyles.paper }}
      >
        <DialogTitle sx={dialogStyles.title}>
          <Typography variant="h6" component="div" sx={{ color: '#f97316', fontWeight: 600 }}>
            Edit Mentee Details
          </Typography>
          <IconButton
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': { color: '#f97316' }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={dialogStyles.content}>
          {mentee && (
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
              gap: 3,
              py: 2
            }}>
              {/* Student Information */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="subtitle1" sx={{ color: '#f97316', fontWeight: 600 }}>
                  Student Information
                </Typography>
                <TextField
                  label="MUJid"
                  name="MUJid"
                  value={editedMentee?.MUJid || ''} 
                  // disabled
                  sx={{ ...dialogStyles.textField, pointerEvents: 'none', cursor: 'default', opacity: 0.5}}
                />
                <TextField
                  label="Name"
                  name="name"
                  value={editedMentee?.name || ''} 
                  onChange={handleEditInputChange}
                  required
                  error={!!errors.name}
                  helperText={errors.name}
                  sx={dialogStyles.textField}
                />
                <TextField
                  label="Email"
                  name="email"
                  type="email"
                  value={editedMentee?.email || ''}
                  onChange={handleEditInputChange}
                  required
                  error={!!errors.email}
                  helperText={errors.email || ' '}
                  sx={{
                    ...dialogStyles.textField,
                    '& .MuiFormHelperText-root': {
                      color: errors.email ? '#ef4444' : 'inherit',
                      margin: '4px 0 0 0',
                      lineHeight: '1.2',
                      fontSize: '0.75rem'
                    }
                  }}
                />
                <TextField
                  label="Phone"
                  name="phone"
                  value={editedMentee?.phone || ''}
                  onChange={handleEditInputChange}
                  error={!!errors.phone}
                  helperText={errors.phone}
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
                  value={editedMentee?.yearOfRegistration || ''} // Changed from mentee to editedMentee
                  onChange={handleEditInputChange}
                  required
                  error={!!errors.yearOfRegistration}
                  helperText={errors.yearOfRegistration}
                  sx={dialogStyles.textField}
                />
                <TextField
                  label="Semester"
                  name="semester"
                  type="number"
                  value={editedMentee?.semester || ''} // Changed from mentee to editedMentee
                  onChange={handleEditInputChange}
                  required
                  error={!!errors.semester}
                  helperText={errors.semester}
                  sx={dialogStyles.textField}
                />
                <TextField
                  label="Academic Year"
                  name="academicYear"
                  value={editedMentee?.academicYear || ''} // Changed from mentee to editedMentee
                  sx={{ ...dialogStyles.textField, pointerEvents: 'none', cursor: 'default', opacity: 0.5}}
                />
                <TextField
                  label="Academic Session"
                  name="academicSession"
                  value={editedMentee?.academicSession || ''} // Changed from mentee to editedMentee
                  sx={{ ...dialogStyles.textField, pointerEvents: 'none', cursor: 'default', opacity: 0.5}}
                />
              </Box>

              {/* Mentor Information - Updated Layout */}
              <Box sx={{ 
                gridColumn: '1 / -1', // Span full width
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }}>
                <Typography variant="subtitle1" sx={{ color: '#f97316', fontWeight: 600 }}>
                  Mentor Information
                </Typography>
                <Box sx={{ 
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                  gap: 2
                }}>
                  <TextField
                    label="Mentor MUJid"
                    name="mentorMujid"
                    value={editedMentee?.mentorMujid || ''}
                    sx={{ ...dialogStyles.textField, pointerEvents: 'none', cursor: 'default', opacity: 0.5}}
                  />
                  <TextField
                    label="Mentor Email"
                    name="mentorEmailid"
                    value={editedMentee?.mentorEmailid || ''}
                    sx={{ ...dialogStyles.textField, pointerEvents: 'none', cursor: 'default', opacity: 0.5}}
                  />
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={dialogStyles.actions}>
          <Button 
            onClick={onClose}
            variant="outlined"
            sx={{
              borderColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
              },
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUpdate}
            variant="contained"
            disabled={!areRequiredFieldsFilled()}
            sx={{
              bgcolor: '#f97316',
              '&:hover': {
                bgcolor: '#ea580c',
              },
              '&:disabled': {
                bgcolor: 'rgba(249, 115, 22, 0.5)',
              }
            }}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog}
        onClose={() => setConfirmDialog(false)}
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '1rem',
            color: 'white'
          }
        }}
      >
        <DialogTitle>
          Confirm Update
        </DialogTitle>
        <DialogContent>
          Are you sure you want to update this mentee&apos;s information?
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmDialog(false)}
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
            onClick={handleConfirmUpdate}
            variant="contained"
            sx={{
              bgcolor: '#f97316',
              '&:hover': { bgcolor: '#ea580c' }
            }}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EditMenteeDialog;
