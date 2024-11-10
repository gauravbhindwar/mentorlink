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
  AlertTitle
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import axios from 'axios';
// import { Mentee } from '../../lib/dbModels';

const FilterSection = ({ filters = {}, onFilterChange, onSearch, onSearchAll, onReset, onAddNew }) => {

  const [isLoading, setIsLoading] = useState({
    search: false,
    searchAll: false,
    addNew: false
  });

  const [isSearchAllEnabled, setIsSearchAllEnabled] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: '' });

  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newMentee, setNewMentee] = useState({
    mujid: '',
    yearOfRegistration: '',
    name: '',
    email: '',
    phone: '',
    fatherName: '',
    motherName: '',
    dateOfBirth: '',
    parentsPhone: '',
    parentsEmail: '',
    mentorMujid: sessionStorage.getItem('mujid') || ''
  });

  const [editDialog, setEditDialog] = useState(false);
  const [selectedMentee, setSelectedMentee] = useState(null);

  useEffect(() => {
    setIsSearchAllEnabled(Object.values(filters).some(x => x !== ''));
  }, [filters]);

  const showAlert = (message, severity) => {
    setAlert({ open: true, message, severity });
    setTimeout(() => setAlert({ open: false, message: '', severity: '' }), 3000);
  };

  const handleSearch = async () => {
    setIsLoading(prev => ({ ...prev, search: true }));
    const storedMentees = sessionStorage.getItem('menteeData');
    if (storedMentees) {
      const menteeData = JSON.parse(storedMentees);
      const filteredMentees = menteeData.filter(mentee => {
        return (!filters.year || mentee.year === parseInt(filters.year, 10)) &&
               (!filters.term || mentee.term === filters.term) &&
               (!filters.semester || mentee.semester === filters.semester) &&
               (!filters.section || mentee.section === filters.section) &&
               (!filters.mentorMujid || mentee.mentorMujid === filters.mentorMujid);
      });

      if (filteredMentees.length === 0) {
        showAlert('No mentees found with the selected filters', 'error');
      } else {
        showAlert(`Found ${filteredMentees.length} mentees`, 'success');
      }

      onSearch(filteredMentees);
      setIsLoading(prev => ({ ...prev, search: false }));
      return;
    }

    sessionStorage.removeItem('menteeData');
    onSearch([]);
    try {
      const mentorMujid = sessionStorage.getItem('mujid');
      if (!mentorMujid) {
        showAlert('Mentor ID not found. Please login again.', 'error');
        return;
      }

      const response = await axios.get('/api/admin/manageUsers/manageMentee', {
        params: {
          year: parseInt(filters.year, 10),
          term: filters.term,
          semester: filters.semester,
          section: filters.section,
          mentorMujid
        }
      });
      const menteeData = response.data;
      sessionStorage.setItem('menteeData', JSON.stringify(menteeData));
      showAlert(`Found ${menteeData.length} mentees`, 'success');
      onSearch(menteeData);
    } catch (error) {
      showAlert(error.response?.data?.error || 'Error searching mentees', 'error');
    } finally {
      setIsLoading(prev => ({ ...prev, search: false }));
    }
  };

  const handleSearchAll = async () => {
    setIsLoading(prev => ({ ...prev, searchAll: true }));
    const storedMentees = sessionStorage.getItem('menteeData');
    if (storedMentees) {
      const menteeData = JSON.parse(storedMentees);
      const filteredMentees = menteeData.filter(mentee => {
        return (!filters.year || mentee.year === parseInt(filters.year, 10)) &&
               (!filters.term || mentee.term === filters.term) &&
               (!filters.semester || mentee.semester === filters.semester) &&
               (!filters.section || mentee.section === filters.section) &&
               (!filters.mentorMujid || mentee.mentorMujid === filters.mentorMujid);
      });

      if (filteredMentees.length === 0) {
        showAlert('No mentees found with the selected filters', 'error');
      } else {
        showAlert(`Found ${filteredMentees.length} mentees`, 'success');
      }

      onSearchAll(filteredMentees);
      setIsLoading(prev => ({ ...prev, searchAll: false }));
      return;
    }

    sessionStorage.removeItem('menteeData');
    onSearchAll([]);
    try {
      const response = await axios.get('/api/admin/search', {
        params: {
          year: filters.year,
          term: filters.term,
          semester: filters.semester,
          section: filters.section,
          mentorMujid: sessionStorage.getItem('mujid')
        }
      });
      const menteeData = response.data;
      sessionStorage.setItem('menteeData', JSON.stringify(menteeData));
      showAlert(`Found ${menteeData.length} mentees`, 'success');
      onSearchAll(menteeData);
    } catch (error) {
      showAlert(error.response?.data?.error || 'Error searching mentees', 'error');
    } finally {
      setIsLoading(prev => ({ ...prev, searchAll: false }));
    }
  };

  const handleAddNew = () => {
    setOpenAddDialog(true);
  };

  const handleAddClose = () => {
    setOpenAddDialog(false);
    setNewMentee({
      ...newMentee,
      mujid: '',
      yearOfRegistration: '',
      name: '',
      email: '',
      phone: '',
      fatherName: '',
      motherName: '',
      dateOfBirth: '',
      parentsPhone: '',
      parentsEmail: ''
    });
  };

  const handleAddInputChange = (e) => {
    const { name, value } = e.target;
    setNewMentee(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddSubmit = async () => {
    try {
      const response = await axios.post('/api/admin/manageUsers/manageMentee', newMentee);
      showAlert('Mentee added successfully', 'success');
      handleAddClose();
      // Refresh the mentee list if needed
      if (onSearch) {
        onSearch([]);
      }
    } catch (error) {
      showAlert(error.response?.data?.error || 'Error adding mentee', 'error');
    }
  };

  const handleReset = () => {
    sessionStorage.removeItem('menteeData'); // Clear session storage on reset
    onReset();
  };

  const handleEditClose = () => {
    setSelectedMentee(null);
    setEditDialog(false);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedMentee(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdate = async () => {
    try {
      const response = await axios.patch('/api/admin/manageUsers/manageMentee', selectedMentee);
      showAlert('Mentee updated successfully', 'success');
      setMentees(prevMentees => 
        prevMentees.map(mentee => 
          mentee.mujid === selectedMentee.mujid ? response.data : mentee
        )
      );
      handleEditClose();
    } catch (error) {
      showAlert(error.response?.data?.error || 'Error updating mentee', 'error');
    }
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
            sx={{ minWidth: 120 }}
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
            sx={{ 
              borderRadius: '50px',
              px: { xs: 2, sm: 3 },
              py: { xs: 0.5, sm: 1 },
              boxShadow: 2,
              '&:hover': {
                transform: button.disabled ? 'none' : 'scale(1.05)',
                transition: 'transform 0.2s'
              }
            }}
          >
            {button.label}
          </Button>
        ))}
      </Box>

    </Box>
  );
};

export default FilterSection;