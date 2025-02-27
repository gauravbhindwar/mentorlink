'use client';
import { useState, useEffect, useRef } from 'react';
import { Box, Button, TextField, Typography, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
// import { display, flexbox, height, width } from '@mui/system';
import SearchIcon from '@mui/icons-material/Search';
import { createPortal } from 'react-dom';
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { useDropzone } from "react-dropzone";
import PropTypes from 'prop-types';
import InputAdornment from '@mui/material/InputAdornment';

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
  // onSearch = () => {}, 
  onAddNew = () => {}, 
  onFilterChange = () => {},
  onReset = () => {},
  // mentors = [] // Add mentors prop
}) => {
  const [academicYear, setAcademicYear] = useState('');
  const [academicSession, setAcademicSession] = useState('');
  // const [academicSessions, setAcademicSessions] = useState([]); // Add this state
  const dropdownRoot = document.getElementById('dropdown-root');
  // Remove unused yearSuggestions state and setter
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [emailSearch, setEmailSearch] = useState('');
  // const [filters, setFilters] = useState({});

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

  useEffect(() => {
    const currentYear = getCurrentAcademicYear();
    setAcademicYear(currentYear);
    // setAcademicSessions(generateAcademicSessions(currentYear));
  }, []);

  // const handleSearch = () => {
  //   if (!academicYear || !academicSession) {
  //     toast.error('Academic Year and Academic Session are required');
  //     return;
  //   }
  
  //   const currentFilters = {
  //     academicYear,
  //     academicSession,
  //     mentorEmailid: emailSearch, // Include email in search
  //     batchSize: 50,
  //     offset: 0
  //   };
  
  //   // Update filters state
  //   // setFilters(currentFilters);
    
  //   // Pass filters to parent components
  //   if (onFilterChange) {
  //     onFilterChange(currentFilters);
  //   }
    
  //   // Call search with filters
  //   onSearch(currentFilters);
  // };
  
  useEffect(() => {
    // Set initial values
    const currentAcadYear = getCurrentAcademicYear();
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const [startYear] = currentAcadYear.split('-');
    
    const currentSession = currentMonth >= 7 && currentMonth <= 12
      ? `JULY-DECEMBER ${startYear}`
      : `JANUARY-JUNE ${parseInt(startYear) + 1}`;
  
    setAcademicYear(currentAcadYear);
    setAcademicSession(currentSession);
    // setAcademicSessions(generateAcademicSessions(currentAcadYear));
  }, []);
  
  // Add effect to handle academic year calculation based on session
  useEffect(() => {
    if (academicSession) {
      const [sessionType, year] = academicSession.split(' ');
      const calculatedAcademicYear = sessionType === 'JULY-DECEMBER'
        ? `${year}-${parseInt(year) + 1}`
        : `${parseInt(year) - 1}-${year}`;
      
      setAcademicYear(calculatedAcademicYear);
    }
  }, [academicSession]);
  
  const handleReset = () => {
    setEmailSearch('');
    // Call parent's onReset handler
    onReset();
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
  const yearRef = useRef(null);
  const sessionRef = useRef(null);

  // useEffect(() => {
  //   const handleClickOutside = (event) => {
  //     if (yearRef.current && !yearRef.current.contains(event.target)) {
  //       setShowYearOptions(false);
  //     }
  //     if (sessionRef.current && !sessionRef.current.contains(event.target)) {
  //       setShowSessionOptions(false);
  //     }
  //   };

  //   document.addEventListener('mousedown', handleClickOutside);
  //   return () => document.removeEventListener('mousedown', handleClickOutside);
  // }, []);

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

  // const handleEmailSearch = (value) => {
  //   setEmailSearch(value);
    
  //   const currentFilters = {
  //     academicYear,
  //     academicSession,
  //     mentorEmailid: value,
  //     batchSize: 50,
  //     offset: 0
  //   };
    
  //   // Only update filters without triggering API call
  //   onFilterChange?.(currentFilters);
  // };

  // Add debounce to search input
  const debouncedSearch = useRef(null);
  
  const handleSearchInput = (e) => {
    const value = e.target.value;
    setEmailSearch(value);
    
    // Clear previous timeout
    if (debouncedSearch.current) {
      clearTimeout(debouncedSearch.current);
    }
    
    // Set new timeout
    debouncedSearch.current = setTimeout(() => {
      const currentFilters = {
        academicYear,
        academicSession,
        mentorEmailid: value
      };
      onFilterChange?.(currentFilters);
    }, 300); // 300ms delay
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debouncedSearch.current) {
        clearTimeout(debouncedSearch.current);
      }
    };
  }, []);

  return (
    <Box sx={filterSectionStyles.wrapper}>
      <Box sx={filterSectionStyles.section}>
       {/* academic year */}
       
        <Box ref={yearRef} sx={comboBoxStyles}>
          <TextField
            label="Academic Year"
            value={academicYear}
            InputProps={{
              readOnly: true,
            }}
            size="small"
            placeholder="YYYY-YYYY"
            margin='dense'
            sx={{...textFieldStyles, pointerEvents: 'none', opacity: 0.7, select: 'none'}}
          />
          {showYearOptions && dropdownRoot && createPortal(
            <Box className="options-dropdown" sx={{ position: 'fixed', transform: 'translateY(100%)' }}>
              {(() => {
                const currentYear = new Date().getFullYear();
                return [0, 1, 2, 3].map(offset => `${currentYear - offset}-${currentYear - offset + 1}`);
              })().map(year => (
                <Box
                  key={year}
                  className="option-item"
                  onClick={() => {
                    setAcademicYear(year);
                    setShowYearOptions(false);
                    const sessions = generateAcademicSessions(year);
                    // setAcademicSessions(sessions);
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
          <Box ref={sessionRef} sx={comboBoxStyles}>
            <TextField
              label="Academic Session"
              value={academicSession}              
              size="small"
              placeholder="MONTH-MONTH YYYY"
              margin='dense'
              // helperText={
              //   <Box component="span" sx={{ fontSize: '0.75rem', color: 'green' }}>
              //   Current academic session
              //   </Box>
              // }
              // Make it read-only
              InputProps={{
                readOnly: true,
              }}
              sx={{...textFieldStyles, pointerEvents: 'none', opacity: 0.7, select: 'none'}}
            />
          </Box>
          <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ color: '#94a3b8', fontWeight: 600, mb: 1 }}>
            Search mentors
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              fullWidth
              placeholder="Search by name, email, phone..."
              value={emailSearch}
              onChange={handleSearchInput} // Updated to use debounced handler
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'rgba(249, 115, 22, 0.7)' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                ...textFieldStyles,
                '& .MuiOutlinedInput-root': {
                  ...textFieldStyles['& .MuiOutlinedInput-root'],
                  height: '50px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(17, 24, 39, 0.8)',
                  backdropFilter: 'blur(12px)',
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#f97316',
                  },
                },
              }}
            />
          </Box>
        </Box>
        </Box>

              <Box sx={filterSectionStyles.buttonGroup}>
          {/* <Button
            variant="contained"
            onClick={handleSearch}
            startIcon={<SearchIcon />}
            disabled={!academicYear || !academicSession}
            sx={{
              ...buttonStyles.standard('primary'),
              py: { xs: 0.5, sm: 0.5 }, // Reduced padding
            height: '32px', // Add fixed height
            '&.Mui-disabled': {
              backgroundColor: 'rgba(249, 115, 22, 0.3)',
              color: 'rgba(255, 255, 255, 0.5)',
            }
          }}
        >
          Load Mentors
        </Button> */}
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
          onClick={handleReset}
          sx={{
            ...buttonStyles.standard('default'),
            py: { xs: 0.5, sm: 0.5 }, // Reduced padding
            height: '32px' // Add fixed height
          }}
        >
          Reset
        </Button>
        {/* <Button
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
        </Button> */}
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

      {/* <Dialog 
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
      </Dialog> */}

    </Box>
  );
};

MentorFilterSection.propTypes = {
  onSearch: PropTypes.func.isRequired,
  onAddNew: PropTypes.func,
  onFilterChange: PropTypes.func,
  onReset: PropTypes.func, // Add this prop type
  mentors: PropTypes.array // Add this prop type
};

export default MentorFilterSection;