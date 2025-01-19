import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from '@mui/icons-material/Search';
import { dialogStyles } from '../mentorStyle';
import { determineAcademicPeriod } from '../utils/academicUtils';

const AddMentorDialog = ({ open, onClose, mentorDetails, setMentorDetails, handleAddMentor, handleSearchMentor, searchingMentor }) => {
  // Initialize dialog only with academic details
  useEffect(() => {
    if (open) {
      const { academicYear, academicSession } = determineAcademicPeriod();
      // Reset form but keep academic details
      setMentorDetails(prev => ({
        ...prev,
        name: "",
        email: "",
        MUJid: "",
        phone_number: "",
        address: "",
        gender: "",
        profile_picture: "",
        role: ["mentor"],
        academicYear,
        academicSession
      }));
    }
  }, [open, setMentorDetails]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'email') {
      // When email is cleared, also clear MUJid
      if (!value.trim()) {
        setMentorDetails(prev => ({
          ...prev,
          email: '',
          MUJid: ''
        }));
        return;
      }
    }
    setMentorDetails(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ 
        sx: {
          ...dialogStyles.paper,
          maxHeight: '90vh', // Ensure dialog doesn't exceed viewport height
          bgcolor: 'rgba(17, 24, 39, 0.95)', // Darker background
          backdropFilter: 'blur(10px)',
        }
      }}
    >
      <DialogTitle 
        sx={{
          ...dialogStyles.title,
          borderBottom: '1px solid rgba(249, 115, 22, 0.2)',
          mb: 0, // Remove bottom margin
          pb: 2, // Add padding bottom
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4ZM13 8V11H16V13H13V16H11V13H8V11H11V8H13Z" 
              fill="#f97316"/>
          </svg>
          <Typography variant="h6" sx={{ 
            color: '#f97316',
            fontWeight: 600,
            letterSpacing: '0.5px',
            fontSize: '1.25rem'
          }}>
            Add New Mentor
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: '16px',
            top: '16px',
            color: 'rgba(255, 255, 255, 0.5)',
            '&:hover': { color: '#f97316' },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent 
        sx={{
          ...dialogStyles.content,
          padding: '24px',
          overflowY: 'auto',
          mt: 0, // Remove top margin
          pt: 3, // Add padding top
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(249, 115, 22, 0.5)',
            borderRadius: '4px',
            '&:hover': {
              background: 'rgba(249, 115, 22, 0.7)',
            },
          },
        }}
      >
        <Box 
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: 3,
            width: '100%',
          }}
        >
          {/* Academic Fields - First Section */}
          <Grid 
            container 
            spacing={3} 
            sx={{
              width: '100%',
              gridColumn: '1 / -1', // Make grid span full width
              m: 0, // Remove default margins
            }}
          >
            {/* Academic Year */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Academic Year"
                name="academicYear"
                value={mentorDetails.academicYear}
                disabled
                required
                sx={{
                  ...dialogStyles.textField,
                  '& .MuiInputBase-root.Mui-disabled': {
                    backgroundColor: 'rgba(249, 115, 22, 0.1)',
                    '& fieldset': {
                      borderColor: 'rgba(249, 115, 22, 0.3) !important',
                    },
                  },
                  '& .MuiInputBase-input.Mui-disabled': {
                    WebkitTextFillColor: 'rgba(255, 255, 255, 0.8)',
                    color: 'rgba(255, 255, 255, 0.8)',
                  },
                  '& .MuiInputLabel-root.Mui-disabled': {
                    color: 'rgba(255, 255, 255, 0.6)',
                  },
                }}
              />
            </Grid>

            {/* Academic Session */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Academic Session"
                name="academicSession"
                value={mentorDetails.academicSession}
                disabled
                required
                sx={{
                  ...dialogStyles.textField,
                  '& .MuiInputBase-root.Mui-disabled': {
                    backgroundColor: 'rgba(249, 115, 22, 0.1)',
                    '& fieldset': {
                      borderColor: 'rgba(249, 115, 22, 0.3) !important',
                    },
                  },
                  '& .MuiInputBase-input.Mui-disabled': {
                    WebkitTextFillColor: 'rgba(255, 255, 255, 0.8)',
                    color: 'rgba(255, 255, 255, 0.8)',
                  },
                  '& .MuiInputLabel-root.Mui-disabled': {
                    color: 'rgba(255, 255, 255, 0.6)',
                  },
                }}
              />
            </Grid>

            {/* Email with Search - Place this before MUJid field */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  value={mentorDetails.email}
                  onChange={handleInputChange}
                  required
                  sx={{
                    ...dialogStyles.textField,
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': {
                        borderColor: 'rgba(249, 115, 22, 0.5)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#f97316',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#f97316',
                    },
                    '& .MuiInputBase-input': {
                      color: 'white',
                    },
                  }}
                />
                <IconButton 
                  onClick={handleSearchMentor}
                  disabled={searchingMentor || !mentorDetails.email}
                  sx={{
                    bgcolor: 'rgba(249, 115, 22, 0.1)',
                    '&:hover': { 
                      bgcolor: 'rgba(249, 115, 22, 0.2)',
                    },
                    '&.Mui-disabled': {
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                    },
                    width: '48px',
                    height: '48px',
                  }}
                >
                  {searchingMentor ? (
                    <CircularProgress size={24} sx={{ color: '#f97316' }} />
                  ) : (
                    <SearchIcon sx={{ color: '#f97316' }} />
                  )}
                </IconButton>
              </Box>
            </Grid>

            {/* MUJid field - will show either existing or new ID */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="MUJid"
                name="MUJid"
                value={mentorDetails.MUJid || ""}
                disabled
                required
                sx={{
                  ...dialogStyles.textField,
                  '& .MuiInputBase-root.Mui-disabled': {
                    backgroundColor: 'rgba(249, 115, 22, 0.1)',
                    '& fieldset': {
                      borderColor: 'rgba(249, 115, 22, 0.3) !important',
                    },
                  },
                  '& .MuiInputBase-input.Mui-disabled': {
                    WebkitTextFillColor: 'rgba(255, 255, 255, 0.8)',
                    color: 'rgba(255, 255, 255, 0.8)',
                  },
                  '& .MuiInputLabel-root.Mui-disabled': {
                    color: 'rgba(255, 255, 255, 0.6)',
                  },
                }}
              />
            </Grid>

            {/* Name */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={mentorDetails.name}
                onChange={handleInputChange}
                required
                sx={{
                  ...dialogStyles.textField,
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: 'rgba(249, 115, 22, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#f97316',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#f97316',
                  },
                  '& .MuiInputBase-input': {
                    color: 'white',
                  },
                }}
              />
            </Grid>

            {/* Phone Number */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phone_number"
                value={mentorDetails.phone_number}
                onChange={handleInputChange}
                required
                sx={{
                  ...dialogStyles.textField,
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: 'rgba(249, 115, 22, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#f97316',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#f97316',
                  },
                  '& .MuiInputBase-input': {
                    color: 'white',
                  },
                }}
              />
            </Grid>

            {/* Role - Hidden but set to mentor by default */}
            <input 
              type="hidden" 
              name="role" 
              value={["mentor"]} 
            />
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions sx={{
        ...dialogStyles.actions,
        padding: '16px 24px',
        borderTop: '1px solid rgba(249, 115, 22, 0.2)',
        gap: 2,
      }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderColor: "rgba(255, 255, 255, 0.2)",
            color: "white",
            "&:hover": {
              borderColor: "#f97316",
              backgroundColor: "rgba(249, 115, 22, 0.1)",
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleAddMentor}
          variant="contained"
          sx={{
            bgcolor: "#f97316",
            "&:hover": {
              bgcolor: "#ea580c",
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(249, 115, 22, 0.25)',
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          Add Mentor
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddMentorDialog;
