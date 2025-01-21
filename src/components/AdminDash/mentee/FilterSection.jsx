'use client';
//gaurav
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
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
// import { debounce } from 'lodash';

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

const FilterSection = ({ 
  filters,
  onFilterChange,
  onSearch,
  onReset,
  onAddNew,
  onBulkUpload,
  onDelete,
  isLoading,
  filterData
}) => {
  const [yearSuggestions, setYearSuggestions] = useState([]);
  const [sessionSuggestions, setSessionSuggestions] = useState([]);
  const [showYearOptions, setShowYearOptions] = useState(false);
  const [showSessionOptions, setShowSessionOptions] = useState(false);
  const yearRef = useRef(null);
  const sessionRef = useRef(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [mujidsToDelete, setMujidsToDelete] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Add new state for client-side rendering check
  const [isClient, setIsClient] = useState(false);
  const [portalRoot, setPortalRoot] = useState(null);

  useEffect(() => {
    setIsClient(true);
    // Only set portal root after component mounts on client
    setPortalRoot(document.getElementById('portal-root'));
  }, []);

  // Simplified portal rendering
  const renderDropdown = (isOpen, content) => {
    if (!isOpen || !isClient || !portalRoot) return null;
    return createPortal(content, portalRoot);
  };

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
    const initializeFilters = async () => {
      if (!isClient) return;

      // Only set default values if both fields are empty
      if (!filters.academicYear && !filters.academicSession) {
        const currentYear = getCurrentAcademicYear();
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const [startYear] = currentYear.split('-');
        
        const currentSession = currentMonth >= 7 
          ? `JULY-DECEMBER ${startYear}` 
          : `JANUARY-JUNE ${parseInt(startYear) + 1}`;

        // Set both values together
        Promise.resolve().then(() => {
          onFilterChange('academicYear', currentYear);
          onFilterChange('academicSession', currentSession);
        });
      }
    };

    initializeFilters();
  }, [isClient, filters.academicYear, filters.academicSession, onFilterChange]);

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
    if (!filters.academicYear?.trim() || !filters.academicSession?.trim()) return;
  
    const baseParams = {
      academicYear: filters.academicYear.trim(),
      academicSession: filters.academicSession.trim().toUpperCase(),
    };
  
    try {
      let data;
      const localData = localStorage.getItem('mentee data');
      
      if (!localData || (!filters.semester && !filters.section && !filters.menteeMujid && !filters.mentorEmailid)) {
        const response = await axios.get('/api/admin/manageUsers/manageMentee', {
          params: baseParams
        });
        data = response.data;
        localStorage.setItem('mentee data', JSON.stringify(data));
      } else {
        data = JSON.parse(localData);
        const filteredData = filterData(data, filters);
        localStorage.setItem('menteeFilteredData', JSON.stringify(filteredData));
        data = filteredData;
      }
  
      onSearch(data, filters); // Pass both data and filters to parent
    } catch (error) {
      console.error('Search error:', error);
      showAlert('Error searching mentees', 'error');
    }
  };
  
  // to do avi
  const handleFilterChange = (name, value) => {
    onFilterChange(name, value);
  };
  

  const handleAddMentee = async (menteeData) => {
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
    }
  };

  const handleBulkAddMentees = async (menteesData) => {
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
    }
  };

  const handleReset = () => {
    sessionStorage.removeItem('menteeData');
    onReset();
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
    const currentAcademicYear = getCurrentAcademicYear();
    // const [currentStartYear] = currentAcademicYear.split('-').map(Number);
    
    // Only return current academic year if it matches input
    if (currentAcademicYear.startsWith(input)) {
      return [currentAcademicYear];
    }
    return [];
  };

  const generateSessionSuggestions = (input) => {
    if (!filters.academicYear || !input) return [];
    const [startYear, endYear] = filters.academicYear.split('-');
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
    
    const [startYear] = value.split('-').map(Number);
    const currentAcademicYear = getCurrentAcademicYear();
    const [currentStartYear] = currentAcademicYear.split('-').map(Number);
    
    // Only allow current academic year
    if (startYear !== currentStartYear) {
      showAlert('Only current academic year is allowed', 'warning');
      return false;
    }
    
    return true;
  };

  const handleAcademicYearInput = (e) => {
    let value = e.target.value.toUpperCase();
    
    // Auto-format while typing
    if (value.length === 4 && !value.includes('-')) {
      const yearNum = parseInt(value);
      const currentAcademicYear = getCurrentAcademicYear();
      const [currentStartYear] = currentAcademicYear.split('-').map(Number);
      
      // Only allow input if it matches current academic year
      if (yearNum !== currentStartYear) {
        showAlert('Only current academic year is allowed', 'warning');
        return;
      }
      value = `${value}-${yearNum + 1}`;
    }
    
    // Update suggestions
    if (value.length > 0) {
      setYearSuggestions(generateYearSuggestions(value));
      setShowYearOptions(true);
    } else {
      setYearSuggestions([]);
      setShowYearOptions(false);
    }

    if (validateAcademicYear(value)) {
      const sessions = generateAcademicSessions(value);
      handleFilterChange('academicYear', value);
      // Automatically select the first session if none is selected
      if (!filters.academicSession && sessions.length > 0) {
        handleFilterChange('academicSession', sessions[0]);
      }
    }
  };

  const handleAcademicSessionInput = (e) => {
    let value = e.target.value.toUpperCase();
    
    // Auto-format while typing
    if (value.startsWith('JUL')) {
      value = `JULY-DECEMBER ${filters.academicYear?.split('-')[0]}`;
    } else if (value.startsWith('JAN')) {
      value = `JANUARY-JUNE ${filters.academicYear?.split('-')[1]}`;
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

  // Update year dropdown render to use renderDropdown instead of renderDropdownPortal
  const renderYearDropdown = () => renderDropdown(
    showYearOptions,
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
    </Box>
  );

  const renderSessionDropdown = () => renderDropdown(
    showSessionOptions,
    <Box className="options-dropdown" sx={{ position: 'fixed', transform: 'translateY(100%)' }}>
      {(sessionSuggestions.length > 0 ? sessionSuggestions : 
        generateAcademicSessions(filters.academicYear)
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
    </Box>
  );

  const filterControls = [
    {
      name: 'academicYear',
      label: 'Academic Year',
      customRender: (
        <Box ref={yearRef} sx={comboBoxStyles}>
         <TextField
           size="small"
           label="Academic Year"
           value={filters.academicYear || ''}  // Changed from filters.academicYear
           onChange={handleAcademicYearInput}
           onClick={() => setShowYearOptions(false)}
          //  disabled={filters.academicSession}
          // disabled={true}
           placeholder="YYYY-YYYY"
           // helperText={
           //   <Box component="span" sx={{ fontSize: '0.75rem', color: 'green' }}>
           //    Example: 2023-2024
           //   </Box>
           // }
           sx={textFieldStyles}
         />
         {renderYearDropdown()}
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
            onClick={() => setShowSessionOptions(false)}
            placeholder="MONTH-MONTH YYYY"
            // helperText={
            //   <Box component="span" sx={{ fontSize: '0.75rem', color: 'green' }}>
            //    Type &apos;jul&apos; or &apos;jan&apos; for quick selection
            //   </Box>
            // }
           disabled={!filters.academicYear}
            sx={textFieldStyles}
          />
          {renderSessionDropdown()}
        </Box>
      )
    },
    {
      name: 'semester',
      label: 'Semester',
      customRender: (
        <FormControl size="small" sx={textFieldStyles}>
          <InputLabel>Semester</InputLabel>
          <Select
            value={filters.semester || ''}
            label="Semester"
            onChange={(e) => {
              const value = e.target.value;
              handleFilterChange('semester', value);
            }}
            disabled={!filters.academicSession}
        
            MenuProps={{
              PaperProps: {
                sx: {
                  bgcolor: '#1a1a1a',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  '& .MuiMenuItem-root': {
                    color: 'white',
                    '&:hover': {
                      bgcolor: '#2a2a2a',
                    },
                    '&.Mui-selected': {
                      bgcolor: '#333333',
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
              <em>All Semesters</em>
            </MenuItem>
            {generateSemesterOptions(filters.academicSession).map((sem) => (
              <MenuItem key={sem} value={sem}>
                Semester {sem}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )
    },
    {
      name: 'section',
      label: 'Section',
      customRender: (
        <TextField
          size="small"
          label={filters.semester ? `Section` : `Select Semester First`}
          value={filters.section || ''}
          onChange={(e) => {
            if(!filters.semester) return;
            const value = e.target.value.toUpperCase().slice(0, 1);
            if (value && !/^[A-Z]$/.test(value)) return;
            handleFilterChange('section', value);

          }}
          // disabled={!filters.semester}
          inputProps={{
            style: { textTransform: 'uppercase' },
            maxLength: 1
          }}
          placeholder={filters.semester ? "A-Z" : `Semester First`}
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
          value={filters.menteeMujid || ''}
          onChange={(e) => handleFilterChange('menteeMujid', e.target.value)}
          inputProps={{
            style: { textTransform: 'uppercase' }
          }}
          sx={textFieldStyles}
        />
      )
    },
    {
      name: 'mentorEmailid',
      label: 'Mentor Email',
      customRender: (
        <TextField
          size="small"
          label="Mentor Email"
          value={filters.mentorEmailid || ''}
          onChange={(e) => handleFilterChange('mentorEmailid', e.target.value)}
          inputProps={{
            style: { textTransform: 'lowercase' }
          }}
          sx={textFieldStyles}
        />
      )
    }
  ];

  const buttons = [
    { 
      label: 'Search',
      onClick: handleSearch,
      color: 'primary',
      disabled: !filters.academicYear?.trim() || !filters.academicSession?.trim() || isLoading,
      icon: <SearchIcon />
    },
    { 
      label: isLoading.add ? 'Adding...' : 'Add New Mentee',
      onClick: () => onAddNew(handleAddMentee),
      color: 'primary',
      disabled: isLoading.add,
      icon: <AddIcon />
    },
    { 
      label: 'Reset',
      onClick: handleReset,
      color: 'default',
      disabled: false,
      icon: <RefreshIcon />
    },
    { 
      label: isLoading.bulkAdd ? 'Uploading...' : 'File Upload',
      onClick: () => onBulkUpload(handleBulkAddMentees),
      color: 'secondary',
      disabled: isLoading.bulkAdd,
      icon: <UploadFileIcon />
    },
    { 
      label: deleteLoading ? 'Deleting...' : 'Delete Mentees',
      onClick: () => setDeleteDialog(true),
      color: 'error',
      disabled: deleteLoading,
      icon: <DeleteIcon />
    }
  ];

  useEffect(() => {
    const initializeAndFetch = async () => {
      if (!isClient) return; // Don't run on server

      if (filters.academicYear && filters.academicSession) {
        await handleSearch();
      } else {
        const currentYear = getCurrentAcademicYear();
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const startYear = currentYear.split('-')[0];
        
        const currentSession = currentMonth >= 7 ? 
          `JULY-DECEMBER ${startYear}` : 
          `JANUARY-JUNE ${parseInt(startYear) + 1}`;

        handleFilterChange('academicYear', currentYear);
        handleFilterChange('academicSession', currentSession);
      }
    };

    initializeAndFetch();
  }, [isClient, filters.academicYear, filters.academicSession]);

  if (!isClient) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '200px' 
      }}>
        <CircularProgress sx={{ color: '#f97316' }} />
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ 
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 2,
        mb: 3,
        position: 'relative',
        // Add custom scrollbar styling
        '&::-webkit-scrollbar': {
          width: '8px'
        },
        '&::-webkit-scrollbar-track': {
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '4px'
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(249, 115, 22, 0.5)',
          borderRadius: '4px',
          '&:hover': {
            background: 'rgba(249, 115, 22, 0.7)'
          }
        }
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
              disabled={button.disabled || isLoading}
              startIcon={isLoading && button.label === 'Search' ? 
                <CircularProgress size={20} sx={{ color: 'white' }} /> : 
                button.icon
              }
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
              {isLoading && button.label === 'Search' ? 'Loading...' : button.label}
            </Button>
          ))}
        </Box>
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
  },
  '&.Mui-disabled': {
    color: 'rgba(255, 255, 255, 0.7) !important',
    '& .MuiOutlinedInput-root': {
      '& input': {
        WebkitTextFillColor: 'rgba(255, 255, 255, 0.7)',
      },
      '& input::placeholder': {
        WebkitTextFillColor: 'rgba(255, 255, 255, 0.7)',
        opacity: 1,
      },
    },
  },
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