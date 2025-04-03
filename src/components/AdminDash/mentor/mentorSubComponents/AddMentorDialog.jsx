import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Dialog,
  Grid,
  CircularProgress,
  useMediaQuery,
  SwipeableDrawer,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from '@mui/icons-material/Search';
import { motion, AnimatePresence } from 'framer-motion';
import { dialogStyles } from '../mentorStyle';
import { determineAcademicPeriod } from '../utils/academicUtils';

const AddMentorDialog = ({ open, onClose, mentorDetails, setMentorDetails, handleAddMentor, handleSearchMentor, searchingMentor }) => {
  const [errors, setErrors] = useState({
    email: '',
    name: '',
    phone_number: '',
  });
  const [showFullForm, setShowFullForm] = useState(false);
  const isSmallScreen = useMediaQuery('(max-width: 1024px)');

  const drawerVariants = {
    initial: { y: '100%' },
    animate: { 
      y: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300
      }
    },
    exit: { 
      y: '100%',
      transition: {
        type: "spring",
        damping: 30,
        stiffness: 300
      }
    }
  };

  useEffect(() => {
    if (open) {
      const { academicYear, academicSession } = determineAcademicPeriod();
      setShowFullForm(false);
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

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "Email is required";
    if (!regex.test(email)) return "Invalid email format";
    return "";
  };

  const validateName = (name) => {
    if (!name) return "Name is required";
    if (name.length < 2) return "Name must be at least 2 characters";
    if (!/^[a-zA-Z\s]+$/.test(name)) return "Name can only contain letters and spaces";
    return "";
  };

  const validatePhone = (phone) => {
    const regex = /^[0-9]{10}$/;
    if (!phone) return "Phone number is required";
    if (!regex.test(phone)) return "Phone number must be 10 digits";
    return "";
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMentorDetails(prev => ({
      ...prev,
      [name]: value,
    }));

    setErrors(prev => ({
      ...prev,
      [name]: '',
    }));
  };

  const handleEmailSearch = async () => {
    await handleSearchMentor();
    setShowFullForm(true);
  };

  const handleSubmit = () => {
    const newErrors = {
      email: validateEmail(mentorDetails.email),
      name: validateName(mentorDetails.name),
      phone_number: validatePhone(mentorDetails.phone_number),
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some(error => error !== "")) {
      return;
    }

    handleAddMentor();
  };

  const DialogContentComponent = () => (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="flex flex-col h-full">
      <div className="flex-shrink-0 flex justify-between items-center p-6 border-b border-gray-800">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
          Add New Mentor
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-orange-500 transition-colors p-2 hover:bg-gray-800 rounded-full"
        >
          <CloseIcon />
        </button>
      </div>
      
      <div className="p-8 overflow-y-auto flex-grow">
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3, width: '100%' }}>
          <Grid container spacing={3} sx={{ width: '100%', gridColumn: '1 / -1', m: 0 }}>
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

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', width: '100%' }}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    value={mentorDetails.email}
                    onChange={handleInputChange}
                    error={!!errors.email}
                    helperText={errors.email}
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
                      '& .MuiFormHelperText-root': {
                        color: '#ef4444',
                      },
                    }}
                  />
                  <Button
                    onClick={handleEmailSearch}
                    disabled={searchingMentor || !mentorDetails.email}
                    variant="contained"
                    startIcon={searchingMentor ? 
                      <CircularProgress size={20} sx={{ color: 'white' }} /> : 
                      <SearchIcon />
                    }
                    sx={{
                      height: '56px',
                      minWidth: '120px',
                      bgcolor: '#f97316',
                      '&:hover': {
                        bgcolor: '#ea580c',
                      },
                      '&.Mui-disabled': {
                        bgcolor: 'rgba(249, 115, 22, 0.3)',
                      },
                    }}
                  >
                    {searchingMentor ? 'Searching...' : 'Submit'}
                  </Button>
                </Box>
              </Box>
            </Grid>

            {showFullForm && (
              <>
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

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Name"
                    name="name"
                    value={mentorDetails.name}
                    onChange={handleInputChange}
                    error={!!errors.name}
                    helperText={errors.name}
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
                      '& .MuiFormHelperText-root': {
                        color: '#ef4444',
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phone_number"
                    value={mentorDetails.phone_number}
                    onChange={handleInputChange}
                    error={!!errors.phone_number}
                    helperText={errors.phone_number}
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
                      '& .MuiFormHelperText-root': {
                        color: '#ef4444',
                      },
                    }}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </Box>
      </div>

      <div className="flex-shrink-0 flex justify-end gap-4 p-6 border-t border-gray-800 bg-gray-900/50">
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
          onClick={handleSubmit}
          variant="contained"
          disabled={!showFullForm}
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
      </div>
    </form>
  );

  if (!open) return null;

  return isSmallScreen ? (
    <AnimatePresence>
      {open && (
        <SwipeableDrawer
          anchor="bottom"
          open={open}
          onClose={onClose}
          onOpen={() => {}}
          disableSwipeToOpen
          PaperProps={{
            sx: {
              height: '100%',
              maxHeight: '100%',
              backgroundColor: 'transparent',
              backgroundImage: 'none',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
            }
          }}
          sx={{
            '& .MuiDrawer-paper': {
              backgroundImage: 'none',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }
          }}
        >
          <motion.div
            className="flex flex-col h-full bg-gray-900 bg-gradient-to-br from-orange-500/5 via-orange-500/10 to-transparent"
            variants={drawerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <DialogContentComponent />
          </motion.div>
        </SwipeableDrawer>
      )}
    </AnimatePresence>
  ) : (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ 
        sx: {
          ...dialogStyles.paper,
          maxHeight: '90vh',
          bgcolor: 'rgba(17, 24, 39, 0.95)',
          backdropFilter: 'blur(10px)',
        }
      }}
    >
      <DialogContentComponent />
    </Dialog>
  );
};

export default AddMentorDialog;
