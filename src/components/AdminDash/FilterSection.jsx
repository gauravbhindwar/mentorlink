'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Snackbar,
  Slide,
  Alert,
  AlertTitle,
  CircularProgress,
  TextField
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import axios from 'axios';

const FilterSection = ({ filters = {}, onFilterChange, onSearch, onSearchAll, onReset, onAddNew, onBulkUpload }) => {
  const [alert, setAlert] = useState({ open: false, message: '', severity: '' });
  const [isLoading, setIsLoading] = useState({
    search: false,
    searchAll: false,
    add: false,
    bulkAdd: false
  });

  const [academicSessions, setAcademicSessions] = useState([]);
  const [currentAcademicYear, setCurrentAcademicYear] = useState('');
  const [currentAcademicSession, setCurrentAcademicSession] = useState('');
  const [isSearchAllEnabled, setIsSearchAllEnabled] = useState(false);

  // Add new function to generate academic sessions based on academic year
  const generateAcademicSessions = (startYear, endYear) => {
    if (!startYear || !endYear) return [];
    return [
      `July-December ${startYear}`,
      `January-June ${endYear}`
    ];
  };

  // Add utility function to get current academic year
  const getCurrentAcademicYear = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    const currentYear = currentDate.getFullYear();
    
    // If current month is after June (start of academic year), use current year
    // Otherwise use previous year
    const startYear = currentMonth > 6 ? currentYear : currentYear - 1;
    const endYear = startYear + 1;
    return `${startYear}-${endYear}`;
  };

  useEffect(() => {
    // Only set initial values if they haven't been set yet
    if (!filters.startYear && !filters.endYear && !filters.academicSession) {
      const currentYear = new Date().getFullYear();
      const nextYear = currentYear + 1;
      const sessions = generateAcademicSessions(currentYear, nextYear);
      setAcademicSessions(sessions);
      setCurrentAcademicYear(currentYear);
      setCurrentAcademicSession(sessions[0]);
      
      // Batch the filter changes to prevent multiple re-renders
      Promise.resolve().then(() => {
        onFilterChange('startYear', currentYear);
        onFilterChange('endYear', nextYear);
        onFilterChange('academicSession', sessions[0]);
      });
    }
  }, []); // Remove onFilterChange from dependencies

  // Add effect to update academic sessions when academic year changes
  useEffect(() => {
    if (filters.startYear && filters.endYear) {
      const newSessions = generateAcademicSessions(filters.startYear, filters.endYear);
      setAcademicSessions(newSessions);
    }
  }, [filters.startYear, filters.endYear]);

  useEffect(() => {
    setIsSearchAllEnabled(Object.values(filters).some(x => x !== ''));
  }, [filters]);

  const showAlert = (message, severity) => {
    setAlert({ open: true, message, severity });
    setTimeout(() => setAlert({ open: false, message: '', severity: '' }), 3000);
  };

  const handleSearch = async () => {
    setIsLoading(prev => ({ ...prev, search: true }));
    try {
      // Create query object with all non-empty filters including optional MUJID filters
      const queryFilters = {
        ...(filters.academicYear && { academicYear: filters.academicYear }),
        ...(filters.academicSession && { academicSession: filters.academicSession }),
        ...(filters.semester && { semester: filters.semester }),
        ...(filters.section && { section: filters.section }),
        ...(filters.mentorMUJID && { mentorMUJID: filters.mentorMUJID }),
        ...(filters.menteeMUJID && { menteeMUJID: filters.menteeMUJID })
      };

      // Proceed with search even if only MUJID filters are present
      const hasFilters = Object.keys(queryFilters).length > 0;
      if (!hasFilters) {
        showAlert('Please select at least one filter', 'warning');
        onSearch([]);
        return;
      }

      const response = await axios.get('/api/admin/manageUsers/manageMentee', {
        params: queryFilters
      });

      const menteeData = response.data;
      
      // Filter data based on all selected criteria
      const filteredData = menteeData.filter(mentee => {
        return Object.entries(queryFilters).every(([key, value]) => {
          return mentee[key] === value;
        });
      });

      if (filteredData.length > 0) {
        sessionStorage.setItem('menteeData', JSON.stringify(filteredData));
        onSearch(filteredData);
      } else {
        onSearch([]);
        showAlert('No mentees found matching all selected filters', 'info');
      }
    } catch (error) {
      showAlert(error.response?.data?.error || 'Error searching mentees', 'error');
      onSearch([]);
    } finally {
      setIsLoading(prev => ({ ...prev, search: false }));
    }
  };

  const handleSearchAll = async () => {
    setIsLoading(prev => ({ ...prev, searchAll: true }));
    try {
      const queryFilters = {
        mentorMujid: sessionStorage.getItem('mujid'),
        ...(filters.academicYear && { academicYear: filters.academicYear }),
        ...(filters.academicSession && { academicSession: filters.academicSession }),
        ...(filters.semester && { semester: filters.semester }),
        ...(filters.section && { section: filters.section })
      };

      const response = await axios.get('/api/admin/search', { 
        params: queryFilters 
      });

      const menteeData = response.data;
      
      // Filter data to match all selected criteria
      const filteredData = menteeData.filter(mentee => {
        return Object.entries(queryFilters).every(([key, value]) => {
          return mentee[key] === value;
        });
      });

      if (filteredData.length > 0) {
        sessionStorage.setItem('menteeData', JSON.stringify(filteredData));
        onSearchAll(filteredData);
      } else {
        onSearchAll([]);
        showAlert('No mentees found matching all selected filters', 'info');
      }
    } catch (error) {
      showAlert(error.response?.data?.error || 'Error searching mentees', 'error');
      onSearchAll([]);
    } finally {
      setIsLoading(prev => ({ ...prev, searchAll: false }));
    }
  };

  const handleAddMentee = async (menteeData) => {
    setIsLoading(prev => ({ ...prev, add: true }));
    try {
      const response = await axios.post('/api/admin/manageUsers/manageMentee', menteeData);
      
      if (response.status === 201) {
        showAlert('Mentee added successfully', 'success');
        // Refresh the search results if needed
        handleSearch();
      } else {
        showAlert(response.data.error || 'Failed to add mentee', 'error');
      }
    } catch (error) {
      showAlert(error.response?.data?.error || 'Error adding mentee', 'error');
    } finally {
      setIsLoading(prev => ({ ...prev, add: false }));
    }
  };

  const handleBulkAddMentees = async (menteesData) => {
    setIsLoading(prev => ({ ...prev, bulkAdd: true }));
    try {
      const response = await axios.post('/api/admin/manageUsers/manageMentee', menteesData);
      
      if (response.status === 201) {
        showAlert(`Successfully added ${response.data.savedCount} mentees with ${response.data.relationshipsCreated} mentor relationships`, 'success');
        handleSearch();
      } else {
        showAlert(response.data.error || 'Failed to add mentees', 'error');
      }
    } catch (error) {
      showAlert(error.response?.data?.error || 'Error adding mentees', 'error');
    } finally {
      setIsLoading(prev => ({ ...prev, bulkAdd: false }));
    }
  };

  const handleReset = () => {
    sessionStorage.removeItem('menteeData'); // Clear session storage on reset
    onReset();
  };

  const handleBulkUploadClick = () => {
    if (onBulkUpload) {
      onBulkUpload();
    }
  };

  const handleFilterChange = (name, value) => {
    sessionStorage.removeItem('menteeData');
    
    // Reset all filters after the changed one
    const filterOrder = ['startYear', 'endYear', 'academicSession', 'semester', 'section'];
    const currentIndex = filterOrder.indexOf(name);
    
    // First set the current filter
    onFilterChange(name, value);
    
    // If changing academic year, update sessions accordingly
    if (name === 'academicYear' && value) {
      const [startYear] = value.split('-');
      const endYear = parseInt(startYear) + 1;
      const newSessions = generateAcademicSessions(startYear, endYear.toString());
      onFilterChange('academicSession', newSessions[0]); // Set first session by default
    }
    
    // Then reset all subsequent filters
    filterOrder.forEach((filter, index) => {
      if (index > currentIndex && filter !== 'academicSession') {
        onFilterChange(filter, '');
      }
    });
  };

  const handleSectionChange = (e) => {
    let value = e.target.value;
    // Convert to uppercase and limit to one character
    value = value.toUpperCase().slice(0, 1);
    // Only allow letters A-Z
    if (value && !/^[A-Z]$/.test(value)) return;
    
    handleFilterChange('section', value);
  };

  useEffect(() => {
    // Set initial values only if they haven't been set yet
    if (!filters.academicYear || !filters.academicSession) {
      const currentAcademicYear = getCurrentAcademicYear();
      const [startYear] = currentAcademicYear.split('-');
      const sessions = generateAcademicSessions(parseInt(startYear), parseInt(startYear) + 1);
      
      // Determine current session based on month
      const currentMonth = new Date().getMonth() + 1;
      const currentSession = currentMonth >= 7 && currentMonth <= 12 
        ? sessions[0] // July-December
        : sessions[1]; // January-June

      // Batch updates
      Promise.resolve().then(() => {
        onFilterChange('academicYear', currentAcademicYear);
        onFilterChange('academicSession', currentSession);
      });
    }
  }, []); // Run only on mount

  const filterControls = [
    {
      name: 'academicYear',
      label: 'Academic Year',
      options: (() => {
        const currentAcademicYear = getCurrentAcademicYear();
        const [currentStartYear] = currentAcademicYear.split('-');
        const startYear = parseInt(currentStartYear);
        
        return [
          currentAcademicYear,
          `${startYear-1}-${startYear}`,
          `${startYear-2}-${startYear-1}`,
          `${startYear-3}-${startYear-2}`
        ];
      })()
    },
    {
      name: 'academicSession',
      label: 'Academic Session',
      options: academicSessions
    },
    {
      name: 'semester',
      label: 'Semester',
      getDynamicOptions: (academicSession) => {
        if (academicSession && academicSession.includes('July-December')) return [3, 5, 7];
        if (academicSession && academicSession.includes('January-June')) return [2, 4, 6, 8];
        return [];
      }
    },
    {
      name: 'section',
      label: 'Section',
      customRender: (
        <TextField
          size="small"
          label="Section"
          value={filters.section || ''}
          onChange={handleSectionChange}
          inputProps={{
            style: { textTransform: 'uppercase' },
            maxLength: 1
          }}
          placeholder="A-Z"
          sx={{
            minWidth: 120,
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
            }
          }}
        />
      )
    },
    {
      name: 'mentorMUJID',
      label: 'Mentor MUJID',
      customRender: (
        <TextField
          size="small"
          label="Mentor MUJID"
          value={filters.mentorMUJID || ''}
          onChange={(e) => handleFilterChange('mentorMUJID', e.target.value)}
          placeholder="Search by Mentor ID"
          sx={{
            minWidth: 120,
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
            }
          }}
        />
      )
    },
    {
      name: 'menteeMUJID',
      label: 'Mentee MUJID',
      customRender: (
        <TextField
          size="small"
          label="Mentee MUJID"
          value={filters.menteeMUJID || ''}
          onChange={(e) => handleFilterChange('menteeMUJID', e.target.value)}
          placeholder="Search by Mentee ID"
          sx={{
            minWidth: 120,
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
            }
          }}
        />
      )
    }
  ];

  const buttons = [
    { 
      label: isLoading.search ? 'Searching...' : 'Search',
      onClick: handleSearch,
      color: 'primary',
      disabled: !Object.values(filters).every(x => x !== ''), // disable button if any of the filter values is empty
      icon: true 
    },
    { 
      label: isLoading.searchAll ? 'Loading...' : 'Search All',
      onClick: handleSearchAll,
      color: 'secondary',
      disabled: !isSearchAllEnabled, // enable button only if at least one filter value is selected
      icon: true 
    },
    { 
      label: isLoading.add ? 'Adding...' : 'Add New Mentee',
      onClick: () => onAddNew(handleAddMentee), // Pass the handler to parent
      color: 'primary',
      disabled: isLoading.add,
      icon: false 
    },
    { 
      label: 'Reset',
      onClick: handleReset,
      color: 'default',
      disabled: false,
      icon: false 
    },
    { 
      label: isLoading.bulkAdd ? 'Uploading...' : 'File Upload',
      onClick: () => onBulkUpload(handleBulkAddMentees), // Pass the handler to parent
      color: 'secondary',
      disabled: isLoading.bulkAdd,
      icon: false
    }
  ];

  return (
    <>
      <Snackbar
        open={alert.open}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        TransitionComponent={(props) => <Slide {...props} direction="left" />}
        autoHideDuration={3000}
        onClose={() => setAlert({ ...alert, open: false })}
        sx={{
          mt: 2, // Add margin top
          '& .MuiSnackbarContent-root': {
            marginTop: '64px' // Push it below the header
          }
        }}
      >
        <Alert 
          severity={alert.severity} 
          onClose={() => setAlert({ ...alert, open: false })}
          sx={{
            minWidth: '300px',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#fff',
            position: 'relative',
            zIndex: 9999,
            '& .MuiAlert-icon': {
              color: alert.severity === 'error' ? '#ff4444' : 
                     alert.severity === 'success' ? '#00C851' : 
                     alert.severity === 'warning' ? '#ffbb33' : '#33b5e5'
            }
          }}
        >
          <AlertTitle sx={{ color: '#f97316' }}>
            {alert.severity === 'error' ? 'Error' : 
             alert.severity === 'success' ? 'Success' : 
             alert.severity === 'warning' ? 'Warning' : 'Info'}
          </AlertTitle>
          {alert.message}
        </Alert>
      </Snackbar>

      <Box sx={{ 
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 2,
        mb: 3,
        alignItems: { xs: 'stretch', md: 'center' },
        justifyContent: 'space-between'
      }}>
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          flexDirection: { xs: 'column', sm: 'row' },
          flexWrap: 'wrap'
        }}>
          {filterControls.map((control) => (
            <Box key={control.name}>
              {control.customRender || (
                <FormControl 
                  size="small" 
                  sx={{ 
                    minWidth: 120,
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
                    '& .MuiSelect-icon': {
                      color: '#f97316',
                    },
                    '& .MuiMenuItem-root': {
                      color: 'white',
                    }
                  }}
                >
                  <InputLabel>{control.label}</InputLabel>
                  <Select
                    value={filters[control.name] || ''}
                    label={control.label}
                    onChange={(e) => handleFilterChange(control.name, e.target.value)}
                    disabled={control.name === 'semester' && !filters.academicSession}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          bgcolor: 'rgba(0, 0, 0, 0.8)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          '& .MuiMenuItem-root': {
                            color: 'white',
                            '&:hover': {
                              bgcolor: 'rgba(249, 115, 22, 0.1)',
                            },
                            '&.Mui-selected': {
                              bgcolor: 'rgba(249, 115, 22, 0.2)',
                              '&:hover': {
                                bgcolor: 'rgba(249, 115, 22, 0.3)',
                              }
                            }
                          }
                        }
                      }
                    }}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {(control.getDynamicOptions 
                      ? control.getDynamicOptions(filters.academicSession)
                      : control.options
                    ).map((option) => (
                      <MenuItem key={option} value={option}>
                        {typeof option === 'string' 
                          ? option.charAt(0).toUpperCase() + option.slice(1) 
                          : `${control.label} ${option}`
                        }
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>
          ))}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {buttons.map(button => (
            <Button 
              key={button.label}
              variant="contained" 
              color={button.color}
              onClick={button.onClick}
              disabled={button.disabled}
              startIcon={button.icon ? <SearchIcon /> : null}
              sx={{ 
                borderRadius: '50px',
                px: { xs: 2, sm: 3 },
                py: { xs: 0.5, sm: 1 },
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                background: button.color === 'primary' ? '#f97316' : 
                           button.color === 'secondary' ? '#ea580c' : 
                           'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'white',
                '&:hover': {
                  transform: button.disabled ? 'none' : 'scale(1.05)',
                  transition: 'transform 0.2s',
                  background: button.color === 'primary' ? '#ea580c' : 
                             button.color === 'secondary' ? '#c2410c' : 
                             'rgba(255, 255, 255, 0.2)',
                },
                '&:disabled': {
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'rgba(255, 255, 255, 0.3)',
                }
              }}
            >
              {button.label}
            </Button>
          ))}
        </Box>

        {isLoading.search || isLoading.searchAll ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2 }}>
            <CircularProgress sx={{ color: '#f97316' }} />
          </Box>
        ) : null}
      </Box>
    </>
  );
};

export default FilterSection;