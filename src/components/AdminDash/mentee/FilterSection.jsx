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
  TextField,
  Autocomplete
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import axios from 'axios';

const FilterSection = ({ filters = {}, onFilterChange, onSearch, onSearchAll, onReset, onAddNew, onBulkUpload, mentees }) => {
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

  const generateAcademicSessions = (academicYear) => {
    if (!academicYear) return [];
    
    let startYear, endYear;
    
    // Handle if academicYear is already a number
    if (typeof academicYear === 'number') {
      startYear = academicYear;
      endYear = academicYear + 1;
    } 
    // Handle if academicYear is a string with format "YYYY-YYYY"
    else if (typeof academicYear === 'string' && academicYear.includes('-')) {
      [startYear, endYear] = academicYear.split('-').map(Number);
    } 
    // Invalid input
    else {
      console.error('Invalid academicYear format:', academicYear);
      return [];
    }
  
    return [
      `July-December ${startYear}`,
      `January-June ${endYear}`
    ];
  };

  const getCurrentAcademicYear = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    const currentYear = currentDate.getFullYear();
    
    const startYear = currentMonth > 6 ? currentYear : currentYear - 1;
    const endYear = startYear + 1;
    return `${startYear}-${endYear}`;
  };

  useEffect(() => {
    if (!filters.academicYear || !filters.academicSession) {
      const currentYear = getCurrentAcademicYear();
      const sessions = generateAcademicSessions(currentYear);
      setAcademicSessions(sessions);
      setCurrentAcademicYear(currentYear);
      setCurrentAcademicSession(sessions[0]);
      
      Promise.resolve().then(() => {
        onFilterChange('academicYear', currentYear);
        onFilterChange('academicSession', sessions[0]);
      });
    }
  }, []);

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
      // Validate required fields
      const requiredFields = ['academicYear', 'academicSession', 'semester', 'section'];
      const missingFields = requiredFields.filter(field => !filters[field]);
      
      if (missingFields.length > 0) {
        showAlert(`Please select ${missingFields.join(', ')}`, 'warning');
        onSearch([]); // Pass empty array to parent
        return;
      }

      const response = await axios.get('/api/admin/manageUsers/manageMentee', {
        params: {
          academicYear: filters.academicYear,
          academicSession: filters.academicSession,
          semester: parseInt(filters.semester),
          section: filters.section
        }
      });

      if (response.data) {
        const normalizedData = Array.isArray(response.data) ? response.data.map(mentee => ({
          ...mentee,
          id: mentee._id || mentee.id, // Ensure id field exists
          MUJid: mentee.MUJid?.toUpperCase() || '',
          mentorMujid: mentee.mentorMujid?.toUpperCase() || ''
        })) : [];

        // Store in session storage
        sessionStorage.setItem('menteeData', JSON.stringify(normalizedData));
        onSearch(normalizedData); // Pass normalized data to parent
      } else {
        sessionStorage.removeItem('menteeData');
        onSearch([]); // Pass empty array if no data
        showAlert('No mentees found', 'info');
      }
    } catch (error) {
      console.error('Search error:', error);
      sessionStorage.removeItem('menteeData');
      showAlert(error.response?.data?.error || 'Error searching mentees', 'error');
      onSearch([]); // Pass empty array on error
    } finally {
      setIsLoading(prev => ({ ...prev, search: false }));
    }
  };

  const handleSearchAll = async () => {
    setIsLoading(prev => ({ ...prev, searchAll: true }));
    try {
      // Validate minimum required fields for Search All
      if (!filters.academicYear || !filters.academicSession || !filters.semester) {
        showAlert('Please select Academic Year, Session, and Semester', 'warning');
        onSearchAll([]);
        return;
      }

      // Build query filters - section is optional
      const queryFilters = {
        academicYear: filters.academicYear,
        academicSession: filters.academicSession,
        semester: parseInt(filters.semester),
        ...(filters.section && { section: filters.section }), // Include section only if provided
      };

      const response = await axios.get('/api/admin/manageUsers/manageMentee', { 
        params: queryFilters 
      });

      if (response.data && response.data.length > 0) {
        // Apply local filter for mentor MUJID if provided
        let filteredData = response.data;
        
        if (filters.mentorMujid) {
          filteredData = filteredData.filter(mentee => 
            mentee.mentorMujid?.toUpperCase().includes(filters.mentorMujid.toUpperCase())
          );
        }

        sessionStorage.setItem('menteeData', JSON.stringify(filteredData));
        onSearchAll(filteredData);
        
        if (filteredData.length === 0) {
          showAlert('No mentees found matching all filters', 'info');
        }
      } else {
        onSearchAll([]);
        showAlert('No mentees found matching the filters', 'info');
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
    sessionStorage.removeItem('menteeData');
    onReset();
  };

  const handleBulkUploadClick = () => {
    if (onBulkUpload) {
      onBulkUpload();
    }
  };

  const handleFilterChange = (name, value) => {
    sessionStorage.removeItem('menteeData');
    
    if (name === 'academicYear') {
      const sessions = generateAcademicSessions(value);
      onFilterChange(name, value);
      onFilterChange('academicSession', sessions[0]);
      setAcademicSessions(sessions);
    } else {
      onFilterChange(name, value);
    }
  };

  const handleSectionChange = (e) => {
    let value = e.target.value;
    value = value.toUpperCase().slice(0, 1);
    if (value && !/^[A-Z]$/.test(value)) return;
    
    handleFilterChange('section', value);
  };

  useEffect(() => {
    if (!filters.academicYear || !filters.academicSession) {
      const currentAcademicYear = getCurrentAcademicYear();
      const [startYear] = currentAcademicYear.split('-');
      const sessions = generateAcademicSessions(parseInt(startYear), parseInt(startYear) + 1);
      
      const currentMonth = new Date().getMonth() + 1;
      const currentSession = currentMonth >= 7 && currentMonth <= 12 
        ? sessions[0]
        : sessions[1];

      Promise.resolve().then(() => {
        onFilterChange('academicYear', currentAcademicYear);
        onFilterChange('academicSession', currentSession);
      });
    }
  }, []);

  const generateSemesterOptions = (academicSession) => {
    if (!academicSession) return [];
    const sessionParts = academicSession.split(' ');
    const sessionPeriod = sessionParts[0];
    if (sessionPeriod === 'July-December') {
      return [1, 3, 5, 7]; // Odd semesters
    } else if (sessionPeriod === 'January-June') {
      return [2, 4, 6, 8]; // Even semesters
    }
    return [];
  };

  const filterControls = [
    {
      name: 'academicYear',
      label: 'Academic Year',
      options: (() => {
        const currentYear = new Date().getFullYear();
        return [
          `${currentYear}-${currentYear + 1}`,
          `${currentYear - 1}-${currentYear}`,
          `${currentYear - 2}-${currentYear - 1}`,
          `${currentYear - 3}-${currentYear - 2}`
        ];
      })()
    },
    {
      name: 'academicSession',
      label: 'Academic Session',
      options: filters.academicYear ? generateAcademicSessions(filters.academicYear) : [],
      disabled: !filters.academicYear
    },
    {
      name: 'semester',
      label: 'Semester',
      options: generateSemesterOptions(filters.academicSession)
    },
    {
      name: 'section',
      label: 'Section',
      customRender: (
        <TextField
          size="small"
          label="Section"
          value={filters.section || ''}
          onChange={(e) => {
            const value = e.target.value.toUpperCase().slice(0, 1);
            if (value && !/^[A-Z]$/.test(value)) return;
            onFilterChange('section', value);
          }}
          inputProps={{
            style: { textTransform: 'uppercase' },
            maxLength: 1
          }}
          placeholder="A-Z"
          sx={textFieldStyles}
        />
      )
    },
    {
      name: 'mentorMujid',
      label: 'Mentor MUJID',
      customRender: (
        <TextField
          size="small"
          label="Mentor MUJID"
          value={filters.mentorMujid || ''} // Ensure correct value
          onChange={(e) => handleFilterChange('mentorMujid', e.target.value)} // Ensure correct onChange handler
          sx={textFieldStyles}
        />
      )
    },
    {
      name: 'menteeMujid',
      label: 'Mentee MUJID',
      customRender: (
        <TextField
          size="small"
          label="Mentee MUJID"
          value={filters.menteeMujid || ''} // Ensure correct value
          onChange={(e) => handleFilterChange('menteeMujid', e.target.value)} // Ensure correct onChange handler
          sx={textFieldStyles}
        />
      )
    }
  ];

  const buttons = [
    { 
      label: isLoading.search ? 'Searching...' : 'Search',
      onClick: handleSearch,
      color: 'primary',
      // Require all fields for Search button
      disabled: !filters.academicYear || !filters.academicSession || !filters.semester || !filters.section,
      icon: true 
    },
    { 
      label: isLoading.searchAll ? 'Loading...' : 'Search All',
      onClick: handleSearchAll,
      color: 'secondary',
      // Only require academicYear, academicSession, and semester for Search All
      disabled: !filters.academicYear || !filters.academicSession || !filters.semester,
      icon: true 
    },
    { 
      label: isLoading.add ? 'Adding...' : 'Add New Mentee',
      onClick: () => onAddNew(handleAddMentee),
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
      onClick: () => onBulkUpload(handleBulkAddMentees),
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
          mt: 2,
          '& .MuiSnackbarContent-root': {
            marginTop: '64px'
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
                      backgroundColor: '#1a1a1a', // Solid dark background
                      // Remove backdropFilter
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
                    disabled={control.disabled}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          bgcolor: '#1a1a1a', // Solid dark background
                          // Remove backdropFilter
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          '& .MuiMenuItem-root': {
                            color: 'white',
                            '&:hover': {
                              bgcolor: '#2a2a2a', // Darker solid color for hover
                            },
                            '&.Mui-selected': {
                              bgcolor: '#333333', // Even darker for selected
                              '&:hover': {
                                bgcolor: '#404040',
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

const textFieldStyles = {
  minWidth: 120,
  '& .MuiOutlinedInput-root': {
    color: 'white',
    backgroundColor: '#1a1a1a', // Solid dark background
    // Remove backdropFilter
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
};

const buttonStyles = {
  primary: {
    bgcolor: '#f97316',
    '&:hover': { bgcolor: '#ea580c' }
  },
  secondary: {
    bgcolor: '#ea580c',
    '&:hover': { bgcolor: '#c2410c' }
  },
  outlined: {
    borderColor: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    '&:hover': {
      borderColor: '#f97316',
      bgcolor: 'rgba(249, 115, 22, 0.1)'
    }
  }
};

const alertStyles = {
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  backdropFilter: 'blur(10px)',
  color: 'white',
  border: '1px solid rgba(255, 255, 255, 0.1)'
};

export default FilterSection;