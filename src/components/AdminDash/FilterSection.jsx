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
  CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import axios from 'axios';

const FilterSection = ({ filters = {}, onFilterChange, onSearch, onSearchAll, onReset, onAddNew }) => {
  const [isLoading, setIsLoading] = useState({
    search: false,
    searchAll: false
  });

  const [isSearchAllEnabled, setIsSearchAllEnabled] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: '' });

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
      const mentorMujid = sessionStorage.getItem('mujid');
      if (!mentorMujid) {
        showAlert('Mentor ID not found. Please login again.', 'error');
        return;
      }

      // Create query object with all non-empty filters
      const queryFilters = {
        mentorMujid,
        ...(filters.year && { year: parseInt(filters.year, 10) }),
        ...(filters.term && { term: filters.term }),
        ...(filters.semester && { semester: filters.semester }),
        ...(filters.section && { section: filters.section })
      };

      // Only proceed if we have necessary filters
      const hasRequiredFilters = Object.keys(queryFilters).length > 1; // More than just mentorMujid
      if (!hasRequiredFilters) {
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
          if (key === 'year') return mentee[key] === value;
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
        ...(filters.year && { year: parseInt(filters.year, 10) }),
        ...(filters.term && { term: filters.term }),
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
          if (key === 'year') return mentee[key] === value;
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

  const handleReset = () => {
    sessionStorage.removeItem('menteeData'); // Clear session storage on reset
    onReset();
  };

  const filterControls = [
    {
      name: 'year',
      label: 'Year',
      options: (() => {
        const currentYear = new Date().getFullYear();
        return [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];
      })()
    },
    {
      name: 'term',
      label: 'Term',
      options: ['odd', 'even']
    },
    {
      name: 'semester',
      label: 'Semester',
      getDynamicOptions: (term) => {
        if (term === 'odd') return [3, 5, 7];
        if (term === 'even') return [2, 4, 6, 8];
        return [];
      }
    },
    {
      name: 'section',
      label: 'Section',
      options: ['A', 'B', 'C', 'D','E','F','G','H','I','J']     // need to update and make it dynamic
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
      label: 'Add New Mentee',
      onClick: onAddNew, // Changed to use prop
      color: 'primary',
      disabled: false,
      icon: false 
    },
    { 
      label: 'Reset',
      onClick: handleReset,
      color: 'default',
      disabled: false,
      icon: false 
    }
  ];

  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: { xs: 'column', md: 'row' },
      gap: 2,
      mb: 3,
      alignItems: { xs: 'stretch', md: 'center' },
      justifyContent: 'space-between'
    }}>
      <Snackbar
        open={alert.open}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        TransitionComponent={(props) => <Slide {...props} direction="down" />}
        sx={{
          '& .MuiAlert-root': {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#fff'
          }
        }}
      >
        <Alert severity={alert.severity} onClose={() => setAlert({ ...alert, open: false })}>
          <AlertTitle>{alert.severity === 'error' ? 'Error' : 'Success'}</AlertTitle>
          {alert.message}
        </Alert>
      </Snackbar>

      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        flexDirection: { xs: 'column', sm: 'row' },
        flexWrap: 'wrap'
      }}>
        {filterControls.map((control) => (
          <FormControl 
            key={control.name} 
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
              onChange={(e) => {
                sessionStorage.removeItem('menteeData');
                onFilterChange(control.name, e.target.value);
              }}
              disabled={control.name === 'semester' && !filters.term}
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
                ? control.getDynamicOptions(filters.term)
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
  );
};

export default FilterSection;