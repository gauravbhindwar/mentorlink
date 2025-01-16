'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  CircularProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';

const buttonStyles = {
  actionButton: {
    width: '100%',
    borderRadius: '12px',
    padding: '10px 16px',
    fontSize: '0.875rem',
    fontWeight: 600,
    textTransform: 'none',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s ease',
    marginBottom: '8px',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
    }
  },
  primary: {
    background: 'linear-gradient(45deg, #f97316 30%, #fb923c 90%)',
    color: 'white',
    '&:hover': {
      background: 'linear-gradient(45deg, #ea580c 30%, #f97316 90%)',
    }
  },
  secondary: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: 'white',
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.1)',
    }
  },
  danger: {
    background: 'linear-gradient(45deg, #ef4444 30%, #f87171 90%)',
    color: 'white',
    '&:hover': {
      background: 'linear-gradient(45deg, #dc2626 30%, #ef4444 90%)',
    }
  }
};

const FilterSection = ({ filters = {}, onFilterChange, onSearch, onReset, onAddNew, onBulkUpload, onDelete }) => {
  const [isLoading, setIsLoading] = useState({
    search: false,
    add: false,
    bulkAdd: false
  });
  const [academicYear, setAcademicYear] = useState('');  
  const [yearSuggestions, setYearSuggestions] = useState([]);
  const [sessionSuggestions, setSessionSuggestions] = useState([]);
  const [showYearOptions, setShowYearOptions] = useState(false);
  const [showSessionOptions, setShowSessionOptions] = useState(false);
  const yearRef = useRef(null);
  const sessionRef = useRef(null);
  const dropdownRoot = document.getElementById('dropdown-root');
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [mujidsToDelete, setMujidsToDelete] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

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
      `JULY-DECEMBER ${startYear}`,
      `JANUARY-JUNE ${endYear}`
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
    const currentYear = getCurrentAcademicYear();
    setAcademicYear(currentYear);
    handleFilterChange('academicYear', currentYear);
    
    handleFilterChange('academicSession', '');
  }, []);

  useEffect(() => {
    if (!filters.academicYear) {
      const currentYear = getCurrentAcademicYear();
      handleFilterChange('academicYear', currentYear);
    }
  }, [filters.academicYear, onFilterChange]);

  useEffect(() => {
    if (filters.startYear && filters.endYear) {
      generateAcademicSessions(filters.startYear, filters.endYear);
    }
  }, [filters.startYear, filters.endYear]);

  const showAlert = (message, severity) => {
    switch (severity) {
      case 'error':
        toast.error(message, {
          duration: 5000,
          style: {
            maxWidth: '500px',
            wordBreak: 'break-word'
          }
        });
        break;
      case 'warning':
        toast(message, {
          icon: '⚠️',
          duration: 5000,
          style: {
            background: '#fff3cd',
            color: '#000',
            maxWidth: '500px',
            whiteSpace: 'pre-line'
          }
        });
        break;
      case 'success':
        toast.success(message);
        break;
      case 'info':
        toast(message, {
          icon: 'ℹ️',
          style: {
            background: '#cff4fc',
            color: '#000'
          }
        });
        break;
      default:
        toast(message);
    }
  };

  const handleSearch = async () => {
    // Validate search conditions
    const hasBasicFilters = filters.academicYear && filters.academicSession;
    const hasSemesterSection = filters.semester && filters.section;
    const hasIdFilters = filters.menteeMujid || filters.mentorMujid;

    if (!hasBasicFilters) {
      showAlert('Academic Year and Session are required', 'warning');
      return;
    }

    if (!hasSemesterSection && !hasIdFilters) {
      showAlert('Either (Semester and Section) or (Mentee/Mentor MUJID) are required', 'warning');
      return;
    }

    setIsLoading(prev => ({ ...prev, search: true }));
    
    try {
      // Build query parameters
      const params = {
        academicYear: filters.academicYear,
        academicSession: filters.academicSession?.toUpperCase(),
      };

      // Add optional filters if they exist
      if (filters.semester) params.semester = parseInt(filters.semester);
      if (filters.section) params.section = filters.section?.toUpperCase();
      if (filters.menteeMujid) params.MUJid = filters.menteeMujid?.toUpperCase();
      if (filters.mentorMujid) params.mentorMujid = filters.mentorMujid?.toUpperCase();

      // console.log('Search params:', params); // Debug log

      const response = await axios.get('/api/admin/manageUsers/manageMentee', { params });

      if (response.status === 200) {
        const normalizedData = response.data.map(mentee => ({
          ...mentee,
          id: mentee._id || mentee.id,
          MUJid: mentee.MUJid?.toUpperCase() || '',
          mentorMujid: mentee.mentorMujid?.toUpperCase() || ''
        }));
        
        sessionStorage.setItem('menteeData', JSON.stringify(normalizedData));
        onSearch(normalizedData);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        showAlert('No mentees found matching the criteria', 'info');
      } else {
        showAlert(error.response?.data?.error || 'Error searching mentees', 'error');
      }
      onSearch([]);
    } finally {
      setIsLoading(prev => ({ ...prev, search: false }));
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

  const handleFilterChange = (name, value) => {
    sessionStorage.removeItem('menteeData');
    
    if (name === 'academicYear') {
      const sessions = generateAcademicSessions(value);
      onFilterChange(name, value);
      onFilterChange('academicSession', sessions[0]);
    } else {
      onFilterChange(name, value);
    }
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
  }, [filters.academicSession, filters.academicYear, onFilterChange]);

  const generateSemesterOptions = (academicSession) => {
    if (!academicSession) return [];
    const sessionParts = academicSession.toUpperCase().split(' ');
    const sessionPeriod = sessionParts[0];
    if (sessionPeriod.includes('JULY-DECEMBER')) {
      return [1, 3, 5, 7]; // Odd semesters
    } else if (sessionPeriod.includes('JANUARY-JUNE')) {
      return [2, 4, 6, 8]; // Even semesters
    }
    return [];
  };

  const generateYearSuggestions = (input) => {
    if (!input) return [];
    const currentYear = new Date().getFullYear();
    const suggestions = [];
    
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
      const sessions = generateAcademicSessions(value);
      handleFilterChange('academicYear', value);
      if (sessions.length > 0) {
        handleFilterChange('academicSession', sessions[0]);
      }
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
    
    handleFilterChange('academicSession', value);
  };

  const handleBulkDelete = async () => {
    if (!mujidsToDelete.trim()) {
      showAlert('Please enter at least one MUJID', 'warning');
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
      showAlert('Mentees deleted successfully', 'success');
    } catch (error) {
      showAlert(error.response?.data?.error || 'Error deleting mentees', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filterControls = [
    {
      name: 'academicYear',
      label: 'Academic Year',
      customRender: (
        <Box ref={yearRef} sx={comboBoxStyles}>
          <TextField
            size="small"
            label="Academic Year"
            value={academicYear || ''}  // Changed from filters.academicYear
            onChange={handleAcademicYearInput}
            onClick={() => setShowYearOptions(true)}
            placeholder="YYYY-YYYY"
            helperText={
              <Box component="span" sx={{ fontSize: '0.75rem', color: 'green' }}>
               Example: 2023-2024
              </Box>
            }
            sx={textFieldStyles}
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
                    handleFilterChange('academicYear', year);
                    setShowYearOptions(false);
                    const sessions = generateAcademicSessions(year);
                    if (sessions.length > 0) {
                      handleFilterChange('academicSession', sessions[0]);
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
      )
    },
    {
      name: 'academicSession',
      label: 'Academic Session',
      customRender: (
        <Box ref={sessionRef} sx={comboBoxStyles}>
          <TextField
            size="small"
            label="Academic Session"
            value={filters.academicSession || ''}
            onChange={handleAcademicSessionInput}
            onClick={() => setShowSessionOptions(true)}
            placeholder="MONTH-MONTH YYYY"
            helperText={
              <Box component="span" sx={{ fontSize: '0.75rem', color: 'green' }}>
               Type &apos;jul&apos; or &apos;jan&apos; for quick selection
              </Box>
            }
            disabled={!academicYear}
            sx={textFieldStyles}
          />
          {showSessionOptions && dropdownRoot && createPortal(
            <Box className="options-dropdown" sx={{ position: 'fixed', transform: 'translateY(100%)' }}>
              {(sessionSuggestions.length > 0 ? sessionSuggestions : 
                generateAcademicSessions(academicYear)
              ).map(session => (
                <Box
                  key={session}
                  className="option-item"
                  onClick={() => {
                    handleFilterChange('academicSession', session);
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
      )
    },
    {
      name: 'semester',
      label: 'Semester',
      options: generateSemesterOptions(filters.academicSession),
      disabled: !filters.academicSession,
      getDynamicOptions: generateSemesterOptions
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
      disabled: !(
        filters.academicYear && 
        filters.academicSession && 
        ((filters.semester && filters.section) || filters.menteeMujid || filters.mentorMujid)
      ),
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
    },
    { 
      label: deleteLoading ? 'Deleting...' : 'Delete Mentees',
      onClick: () => setDeleteDialog(true),
      color: 'error',
      disabled: deleteLoading,
      icon: false 
    }
  ];

  return (
    <>
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

        {isLoading.search ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2 }}>
            <CircularProgress sx={{ color: '#f97316' }} />
          </Box>
        ) : null}
      </Box>

      <Dialog 
        open={deleteDialog} 
        onClose={() => setDeleteDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: dialogStyles.paper }}
      >
        <DialogTitle sx={dialogStyles.title}>Delete Mentees</DialogTitle>
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
            sx={{
              bgcolor: '#ef4444',
              '&:hover': { bgcolor: '#dc2626' }
            }}
          >
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
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

const comboBoxStyles = {
  position: 'relative',
  minWidth: 200,
  '& .MuiTextField-root': {
    width: '100%',
  },
  '& .options-dropdown': {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: '#1a1a1a',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    marginTop: '4px',
    padding: '8px 0',
    maxHeight: '200px',
    overflowY: 'auto',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
    '& .option-item': {
      padding: '8px 16px',
      color: 'white',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
      },
    },
  },
};

const dialogStyles = {
  paper: {
    backgroundColor: '#1a1a1a',
    color: 'white',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  title: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    paddingBottom: '8px',
  },
  content: {
    paddingTop: '16px',
  },
  actions: {
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    paddingTop: '8px',
  },
};

export default FilterSection;