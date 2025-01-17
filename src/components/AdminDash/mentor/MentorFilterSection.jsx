'use client';
import { useState, useEffect, useRef } from 'react';
import { Box, Button, TextField, Typography, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
// import { display, flexbox, height, width } from '@mui/system';
import SearchIcon from '@mui/icons-material/Search';
import { createPortal } from 'react-dom';
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { useDropzone } from "react-dropzone";
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';

const filterSectionStyles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2, // Reduced from 3
    color: '#FFFFFF',
    height: { xs: 'auto', lg: '100%' }, // Responsive height
    overflow: { xs: 'visible', lg: 'hidden' }, // Changed from 'auto' to 'hidden'
    transition: 'all 0.3s ease',
    // Add these properties for scrollbar
    '&:hover': {
      overflow: { lg: 'auto' } // Show scrollbar only on hover
    },
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
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1.5, // Reduced from 2
    padding: { xs: '10px', sm: '12px' }, // Reduced padding
    backgroundColor: 'rgba(31, 41, 55, 0.7)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
  },
  field: {
    '& .MuiOutlinedInput-root': {
      backgroundColor: 'rgba(17, 24, 39, 0.8)',
      backdropFilter: 'blur(12px)',
      borderRadius: '12px',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 20px rgba(249, 115, 22, 0.2)',
      },
    },
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1, // Reduced from 2
    marginTop: 1, // Reduced from 4
  },
};

const buttonStyles = {
  standard: (color) => ({
    borderRadius: '50px',
    px: { xs: 2, sm: 3 }, // Increased padding
    py: { xs: 1, sm: 1.5 }, // Increased padding
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    background: color === 'primary' ? '#f97316' : 
               color === 'secondary' ? '#ea580c' : 
               'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: 'white',
    whiteSpace:'wrap',
    minWidth: 'fit-content', // Allow button to grow with content
    width: '100%', // Take full width
    height: 'auto', // Allow height to adjust with content
    minHeight: '40px', // Minimum height
    position: 'relative',
    overflow: 'visible', // Changed from 'hidden' to 'visible'
    transform: 'none', // Remove default transform
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', // Separate transitions
    '&:hover': {
      background: color === 'primary' ? '#ea580c' : 
                 color === 'secondary' ? '#c2410c' : 
                 'rgba(255, 255, 255, 0.2)',
      transform: 'translateY(-2px)', // Add subtle lift effect
      boxShadow: '0 4px 12px rgba(249, 115, 22, 0.25)', // Enhanced shadow on hover
    },
    '&:disabled': {
      background: 'rgba(255, 255, 255, 0.05)',
      color: 'rgba(255, 255, 255, 0.3)',
    }
  }),
  outlined: {
    borderColor: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    '&:hover': {
      borderColor: '#f97316',
      bgcolor: 'rgba(249, 115, 22, 0.1)'
    }
  }
};

const MentorFilterSection = ({ 
  onSearch=() => {}, 
  onAddNew = () => {}, 
  onBulkUpload = () => {}, 
  onDelete = () => {} 
}) => {
  const [academicYear, setAcademicYear] = useState('');
  const [academicSession, setAcademicSession] = useState('');
  const [academicSessions, setAcademicSessions] = useState([]);
  const dropdownRoot = document.getElementById('dropdown-root');
  const [yearSuggestions, setYearSuggestions] = useState([]);
  const [sessionSuggestions, setSessionSuggestions] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [mujidsToDelete, setMujidsToDelete] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [mujidSearch, setMujidSearch] = useState('');

  const getCurrentAcademicYear = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    const startYear = currentMonth > 6 ? currentYear : currentYear - 1;
    const endYear = startYear + 1;
    return `${startYear}-${endYear}`;
  };

  const generateAcademicSessions = (academicYear) => {
    if (!academicYear) return [];
    const [startYear, endYear] = academicYear.split('-');
    return [
      `JULY-DECEMBER ${startYear}`,
      `JANUARY-JUNE ${endYear}`
    ];
  };

  const generateYearSuggestions = (input) => {
    if (!input) return [];
    const currentYear = new Date().getFullYear();
    const suggestions = [];
    
    // Generate last 5 years suggestions
    for (let i = 0; i < 5; i++) {
      const year = currentYear - i;
      const academicYear = `${year}-${year + 1}`;
      if (academicYear.startsWith(input)) {
        suggestions.push(academicYear);
      }
    }
    return suggestions;
  };

  const generateSessionSuggestions = (input) => {
    if (!academicYear || !input) return [];
    const [startYear, endYear] = academicYear.split('-');
    const possibleSessions = [
      `JULY-DECEMBER ${startYear}`,
      `JANUARY-JUNE ${endYear}`
    ];
    
    return possibleSessions.filter(session => 
      session.toLowerCase().includes(input.toLowerCase())
    );
  };
  useEffect(() => {
    const currentYear = getCurrentAcademicYear();
    setAcademicYear(currentYear);
    setAcademicSessions(generateAcademicSessions(currentYear));
  }, []);

  const handleSearch = () => {
    if (academicYear || academicSession || mujidSearch) {
      onSearch({ academicYear, academicSession, MUJid: mujidSearch });
    } else {
      toast.error('Please enter at least one filter value');
    }
  };

  const handleReset = () => {
    setAcademicYear('');
    setAcademicSession('');
    setMujidSearch('');
  };


  const textFieldStyles = {
    '& .MuiOutlinedInput-root': {
      color: '#FFFFFF',
      backgroundColor: 'rgba(17, 24, 39, 0.8)',
      backdropFilter: 'blur(12px)',
      borderRadius: '12px',
      '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: '#fb923c',
      },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: '#f97316',
        borderWidth: '2px',
      },
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    '& .MuiInputLabel-root': {
      color: 'rgba(255, 255, 255, 0.9)',
      fontWeight: 500,
      '&.Mui-focused': {
        color: '#fb923c',
      },
    },
    '& .MuiFormHelperText-root': {
      color: '#6ee7b7',
      fontSize: '0.8rem',
      marginTop: '4px',
    },
  };

  const comboBoxStyles = {
    position: 'relative',
    minWidth: 180, // Reduced from 200
    maxWidth: '100%', // Added maxWidth
    '& .MuiTextField-root': {
      width: '100%',
      '& .MuiOutlinedInput-root': {
        color: 'white',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: '#f97316',
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: '#f97316',
        },
      },
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: 'rgba(255, 255, 255, 0.2)',
      },
      '& .MuiInputLabel-root': {
        color: 'rgba(255, 255, 255, 0.7)',
        '&.Mui-focused': {
          color: '#f97316',
        },
      },
    },
    '& .options-dropdown': {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      zIndex: 9999,
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      marginTop: '4px',
      padding: '8px 0',
      maxHeight: '200px',
      overflowY: 'auto',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(12px)',
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
      '& .option-item': {
        padding: '10px 16px',
        color: '#FFFFFF',
        fontSize: '0.9rem',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: 'rgba(249, 115, 22, 0.15)',
        },
      },
    },
  };

  const dialogStyles = {
    paper: {
      background: 'rgba(17, 24, 39, 0.95)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(249, 115, 22, 0.15)',
      borderRadius: '24px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      color: 'white',
      maxWidth: '400px', // Reduced from 500px
      width: '80vw', // Reduced from 90vw
    },
    dropZone: {
      border: '2px dashed rgba(249, 115, 22, 0.3)',
      borderRadius: '16px',
      padding: '32px',
      textAlign: 'center',
      backgroundColor: 'rgba(249, 115, 22, 0.05)',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      '&:hover': {
        borderColor: '#f97316',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
      },
    },
  };

  const [showYearOptions, setShowYearOptions] = useState(false);
  const [showSessionOptions, setShowSessionOptions] = useState(false);
  const yearRef = useRef(null);
  const sessionRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (yearRef.current && !yearRef.current.contains(event.target)) {
        setShowYearOptions(false);
      }
      if (sessionRef.current && !sessionRef.current.contains(event.target)) {
        setShowSessionOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const validateAcademicYear = (value) => {
    if (!value) return false;
    const regex = /^(\d{4})-(\d{4})$/;
    if (!regex.test(value)) return false;
    
    const [startYear, endYear] = value.split('-').map(Number);
    return endYear === startYear + 1;
  };


  const handleAcademicYearInput = (e) => {
    let value = e.target.value.toUpperCase();
    
    // Auto-format while typing
    if (value.length === 4 && !value.includes('-')) {
      value = `${value}-${parseInt(value) + 1}`;
    }
    
    // Update suggestions
    if (value.length > 0) {
      setYearSuggestions(generateYearSuggestions(value));
      setShowYearOptions(true);
    } else {
      setYearSuggestions([]);
      setShowYearOptions(false);
    }

    setAcademicYear(value);
    if (validateAcademicYear(value)) {
      setAcademicSessions(generateAcademicSessions(value));
    }
  };

  const handleAcademicSessionInput = (e) => {
    let value = e.target.value.toUpperCase();
    
    // Auto-format while typing
    if (value.startsWith('JUL')) {
      value = `JULY-DECEMBER ${academicYear?.split('-')[0]}`;
    } else if (value.startsWith('JAN')) {
      value = `JANUARY-JUNE ${academicYear?.split('-')[1]}`;
    }
    
    // Update suggestions
    if (value.length > 0) {
      setSessionSuggestions(generateSessionSuggestions(value));
      setShowSessionOptions(true);
    } else {
      setSessionSuggestions([]);
      setShowSessionOptions(false);
    }
    
    setAcademicSession(value);
  };

  const showAlert = (message, type = 'info') => {
    console.warn(`${type}: ${message}`);
    // You can replace this with your preferred alert system
  };

  const handleFileUpload = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) {
      showAlert("No file selected", "error");
      return;
    }
  
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "mentor");
  
      // Use the existing bulkUpload endpoint
      if (typeof onBulkUpload === 'function') {
        await onBulkUpload(formData, (progress) => {
          setUploadProgress(Math.round(progress));
        });
      }
      
      showAlert("File uploaded successfully", "success");
      setUploadDialog(false);
    } catch (error) {
      console.error('Upload error:', error);
      showAlert(error?.message || "Error uploading file", "error");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };
  

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileUpload,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    multiple: false,
    maxSize: 5242880, // 5MB
  });

  const handleBulkDelete = async () => {
    if (!mujidsToDelete.trim()) {
      showAlert('Please enter at least one MUJID', 'warning');
      return;
      return;
    }

    const mujids = mujidsToDelete.split(',').map(id => id.trim()).filter(Boolean);
    if (mujids.length === 0) {
      showAlert('Please enter valid MUJIDs', 'warning');
      return;
    }

    setDeleteLoading(true);
    try {
      await onDelete(mujids);
      setDeleteDialog(false);
      setMujidsToDelete('');
      showAlert('Mentors deleted successfully', 'success');
    } catch (error) {
      showAlert(error.response?.data?.error || 'Error deleting mentors', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Box 
      sx={{
        ...filterSectionStyles.wrapper,
        animation: 'none', // Remove animation to prevent visibility issues
        position: 'relative', // Add this to ensure proper stacking
        zIndex: 2, // Add this to ensure filters stay above table
        maxHeight: { lg: 'calc(100vh - 120px)' }, // Add max height for desktop
        overflowY: { lg: 'auto' }, // Enable vertical scroll on desktop
      }}
    >
      <Box sx={filterSectionStyles.section}>
        <Typography 
          variant="subtitle2" 
          sx={{ 
            color: 'rgba(255, 255, 255, 0.9)',
            fontWeight: 600,
            mb: 0.5, // Reduced from 1
            letterSpacing: '0.5px'
          }}
        >
          Search by MUJid
        </Typography>
        <TextField
          label="MUJid"
          value={mujidSearch}
          onChange={(e) => setMujidSearch(e.target.value.toUpperCase())}
          size="small"
          placeholder="Enter MUJid"
          sx={{
            ...textFieldStyles,
            mb: 2, // Reduced from 3
            '& .MuiOutlinedInput-root': {
              ...textFieldStyles['& .MuiOutlinedInput-root'],
              background: 'rgba(255, 255, 255, 0.05)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 20px rgba(249, 115, 22, 0.15)',
              },
              height: '36px', // Reduced from 40px
            },
          }}
          fullWidth
        />
        <Typography 
          variant="subtitle2" 
          sx={{ 
            color: 'rgba(255, 255, 255, 0.9)',
            fontWeight: 600,
            mb: 0.5, // Reduced from 1
            letterSpacing: '0.5px'
          }}
        >
          Academic Year
        </Typography>
        {/* Year TextField */}
        <Box ref={yearRef} sx={comboBoxStyles}>
          <TextField
            label="Academic Year"
            value={academicYear}
            onChange={handleAcademicYearInput}
            onClick={() => setShowYearOptions(true)}
            size="small"
            placeholder="YYYY-YYYY"
            helperText={
              <Box component="span" sx={{ fontSize: '0.75rem', color: 'green' }}>
               Example: 2023-2024
              </Box>
            }
            sx={{
              ...textFieldStyles,
              '& .MuiOutlinedInput-root': {
                ...textFieldStyles['& .MuiOutlinedInput-root'],
                background: 'rgba(255, 255, 255, 0.05)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 20px rgba(249, 115, 22, 0.15)',
                },
                height: '40px', // Added fixed height
              },
            }}
            fullWidth
          />
          {showYearOptions && dropdownRoot && createPortal(
            <Box className="options-dropdown" sx={{ position: 'fixed', transform: 'translateY(100%)' }}>
              {(yearSuggestions.length > 0 ? yearSuggestions : 
                (() => {
                  const currentYear = new Date().getFullYear();
                  return [0, 1, 2, 3].map(offset => `${currentYear - offset}-${currentYear - offset + 1}`);
                })()
              ).map(year => (
                <Box
                  key={year}
                  className="option-item"
                  onClick={() => {
                    setAcademicYear(year);
                    setShowYearOptions(false);
                    setAcademicSessions(generateAcademicSessions(year));
                    // Auto-select first session when year changes
                    const sessions = generateAcademicSessions(year);
                    if (sessions.length > 0) {
                      setAcademicSession(sessions[0]);
                    }
                  }}
                >
                  {year}
                </Box>
              ))}
            </Box>,
            dropdownRoot
          )}
        </Box>

        <Typography variant="subtitle2" sx={{ color: 'white/80', mb: 0.5, mt: 1.5 }}>
          Academic Session
        </Typography>
        {/* Session TextField */}
        <Box ref={sessionRef} sx={comboBoxStyles}>
          <TextField
            label="Academic Session"
            value={academicSession}
            onChange={handleAcademicSessionInput}
            onClick={() => setShowSessionOptions(true)}
            size="small"
            placeholder="MONTH-MONTH YYYY"
            helperText={
              <Box component="span" sx={{ fontSize: '0.75rem', color: 'green' }}>
              Type &apos;jul&apos; or &apos;jan&apos; for quick selection
              </Box>
            }
            disabled={!academicYear}
            fullWidth
            sx={{
              ...textFieldStyles,
              '& .MuiOutlinedInput-root': {
                ...textFieldStyles['& .MuiOutlinedInput-root'],
                height: '40px', // Added fixed height
              },
            }}
          />
          {showSessionOptions && dropdownRoot && createPortal(
            <Box className="options-dropdown" sx={{ position: 'fixed', transform: 'translateY(100%)' }}>
              {(sessionSuggestions.length > 0 ? sessionSuggestions : academicSessions).map(session => (
                <Box
                  key={session}
                  className="option-item"
                  onClick={() => {
                    setAcademicSession(session);
                    setShowSessionOptions(false);
                  }}
                >
                  {session}
                </Box>
              ))}
            </Box>,
            dropdownRoot
          )}
        </Box>
      </Box>

      <Box sx={filterSectionStyles.buttonGroup}>
        <Button
          variant="contained"
          onClick={handleSearch}
          startIcon={<SearchIcon />}
          sx={{
            ...buttonStyles.standard('primary'),
            py: { xs: 0.5, sm: 0.5 }, // Reduced padding
            height: '32px' // Add fixed height
          }}
        >
          Search
        </Button>
        <Button
          variant="contained"
          onClick={onAddNew}
          sx={{
            ...buttonStyles.standard('secondary'),
            py: { xs: 0.5, sm: 0.5 }, // Reduced padding
            height: '32px' // Add fixed height
          }}
        >
          Add New Mentor
        </Button>
        <Button
          variant="contained"
          onClick={() => setUploadDialog(true)}
          sx={{
            ...buttonStyles.standard('secondary'),
            py: { xs: 0.5, sm: 0.5 }, // Reduced padding
            height: '32px' // Add fixed height
          }}
        >
          <UploadFileIcon sx={{ fontSize: 20}} />
          Upload Mentors File
        </Button>
        <Button
          variant="contained"
          onClick={handleReset}
          sx={{
            ...buttonStyles.standard('default'),
            py: { xs: 0.5, sm: 0.5 }, // Reduced padding
            height: '32px' // Add fixed height
          }}
        >
          Reset
        </Button>
        <Button
          variant="contained"
          onClick={() => setDeleteDialog(true)}
          sx={{
            ...buttonStyles.standard('default'),
            color: '#ef4444',
            '&:hover': {
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
            },
            py: { xs: 0.5, sm: 0.5 }, // Reduced padding
            height: '32px' // Add fixed height
          }}
        >
          Delete Mentors
        </Button>
      </Box>

      <Dialog
        open={uploadDialog}
        onClose={() => setUploadDialog(false)}
        PaperProps={{ sx: dialogStyles.paper }}
      >
        <DialogTitle sx={{
          color: '#f97316',
          borderBottom: '1px solid rgba(249, 115, 22, 0.15)',
          padding: '20px 24px',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <UploadFileIcon />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Upload Mentors File
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ padding: '24px' }}>
          <div {...getRootProps()}>
            <input {...getInputProps()} />
            <Box sx={{
              ...dialogStyles.dropZone,
              borderColor: isDragActive ? '#f97316' : 'rgba(249, 115, 22, 0.3)',
              backgroundColor: isDragActive ? 'rgba(249, 115, 22, 0.1)' : 'rgba(249, 115, 22, 0.05)',
            }}>
              <UploadFileIcon sx={{ fontSize: 48, color: '#f97316', mb: 2 }} />
              <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
                Drag & Drop Excel File Here
              </Typography>
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                or click to select file
              </Typography>
              {isUploading && (
                <Box sx={{ mt: 2, width: '100%' }}>
                  <Typography variant="caption" sx={{ color: '#f97316' }}>
                    Uploading: {uploadProgress}%
                  </Typography>
                  <Box
                    sx={{
                      width: '100%',
                      height: '2px',
                      bgcolor: 'rgba(249, 115, 22, 0.2)',
                      mt: 1,
                      borderRadius: '1px',
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        width: `${uploadProgress}%`,
                        height: '100%',
                        bgcolor: '#f97316',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </Box>
                </Box>
              )}
            </Box>
          </div>
          <Typography sx={{ 
            mt: 2, 
            color: '#f97316',
            bgcolor: 'rgba(249, 115, 22, 0.1)',
            p: 1,
            borderRadius: '8px',
            fontSize: '0.875rem',
            textAlign: 'center'
          }}>
            Supported formats: .xls, .xlsx
          </Typography>
        </DialogContent>

        <DialogActions sx={{
          padding: '16px 24px',
          borderTop: '1px solid rgba(249, 115, 22, 0.15)',
          gap: '12px',
        }}>
          <Button
            onClick={() => setUploadDialog(false)}
            variant="outlined"
            sx={buttonStyles.outlined}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={deleteDialog} 
        onClose={() => setDeleteDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: dialogStyles.paper }}
      >
        <DialogTitle sx={dialogStyles.title}>Delete Mentors</DialogTitle>
        <DialogContent sx={dialogStyles.content}>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={mujidsToDelete}
            onChange={(e) => setMujidsToDelete(e.target.value)}
            placeholder="Enter MUJIDs separated by commas"
            sx={textFieldStyles}
          />
        </DialogContent>
        <DialogActions sx={dialogStyles.actions}>
          <Button 
            onClick={() => setDeleteDialog(false)}
            variant="outlined"
            sx={buttonStyles.outlined}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleBulkDelete}
            variant="contained"
            disabled={deleteLoading}
            sx={buttonStyles.standard('primary')}
          >
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

MentorFilterSection.propTypes = {
  onSearch: PropTypes.func.isRequired,
  onAddNew: PropTypes.func,
  onBulkUpload: PropTypes.func,
  onDelete: PropTypes.func
};

export default MentorFilterSection;