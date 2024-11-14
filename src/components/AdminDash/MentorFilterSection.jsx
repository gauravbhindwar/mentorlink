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
  const [alert, setAlert] = useState({ open: false, message: '', severity: '' });
  const [isSearchAllEnabled, setIsSearchAllEnabled] = useState(false);

  useEffect(() => {
    setIsSearchAllEnabled(Object.values(filters).some(x => x !== ''));
  }, [filters]);

  const showAlert = (message, severity) => {
    setAlert({ open: true, message, severity });
    setTimeout(() => setAlert({ open: false, message: '', severity: '' }), 3000);
  };

  const handleSearch = async () => {
    if (!onSearch) return;
    setIsLoading(prev => ({ ...prev, search: true }));
    try {
      await onSearch();
    } catch (error) {
      showAlert(error.message || 'Error searching', 'error');
    } finally {
      setIsLoading(prev => ({ ...prev, search: false }));
    }
  };

  const handleSearchAll = async () => {
    if (!onSearchAll) return;
    setIsLoading(prev => ({ ...prev, searchAll: true }));
    try {
      await onSearchAll();
    } catch (error) {
      showAlert(error.message || 'Error searching all', 'error');
    } finally {
      setIsLoading(prev => ({ ...prev, searchAll: false }));
    }
  };

  const handleReset = () => {
    sessionStorage.removeItem('menteeData'); // Clear session storage on reset
    onReset();
  };

  const filterControlStyles = {
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
  };

  const buttonStyles = (color) => ({
    borderRadius: '50px',
    px: { xs: 2, sm: 3 },
    py: { xs: 0.5, sm: 1 },
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    background: color === 'primary' ? '#f97316' : 
               color === 'secondary' ? '#ea580c' : 
               'rgba(255, 255, 255, 0.1)',
    color: 'white',
    '&:hover': {
      background: color === 'primary' ? '#ea580c' : 
                 color === 'secondary' ? '#c2410c' : 
                 'rgba(255, 255, 255, 0.2)',
      transform: 'scale(1.05)',
      transition: 'all 0.2s ease',
    },
    '&:disabled': {
      background: 'rgba(255, 255, 255, 0.05)',
      color: 'rgba(255, 255, 255, 0.3)',
    }
  });

  const filterControls = [
    {
      name: 'year',
      label: 'Year',
      options: (() => {
        const currentYear = new Date().getFullYear();
        // According to schema: past 20 years to current year
        return Array.from({ length: 21 }, (_, i) => currentYear - i);
      })()
    },
    {
      name: 'term',
      label: 'Term',
      options: ['odd', 'even'] // From schema enum
    },
    {
      name: 'semester',
      label: 'Semester',
      options: Array.from({ length: 8 }, (_, i) => i + 1) // From schema min:1, max:8
    },
    {
      name: 'section',
      label: 'Section',
      options: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']
    },
    {
      name: 'role',
      label: 'Role',
      options: ['mentor', 'admin', 'superadmin'] // From schema enum
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
      label: 'Add New Mentor',
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
            sx={filterControlStyles}
          >
            <InputLabel>{control.label}</InputLabel>
            <Select
              value={filters[control.name] || ''}
              label={control.label}
              onChange={(e) => {
                sessionStorage.removeItem('menteeData'); // Clear session storage on filter change
                onFilterChange(control.name, e.target.value);
              }}
              disabled={control.name === 'semester' && !filters.term}
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
            sx={buttonStyles(button.color)}
          >
            {button.label}
          </Button>
        ))}
      </Box>

    </Box>
  );
};

export default FilterSection;