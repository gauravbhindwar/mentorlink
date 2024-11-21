'use client';
import { useState, useEffect, useRef } from 'react';
import { Box, Button, FormControl, InputLabel, Select, MenuItem, TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { createPortal } from 'react-dom';

const MentorFilterSection = ({ filters, onFilterChange, onSearch, onAddNew, onBulkUpload }) => {
  const [academicYear, setAcademicYear] = useState('');
  const [academicSession, setAcademicSession] = useState('');
  const [academicSessions, setAcademicSessions] = useState([]);
  const [mentorStatus, setMentorStatus] = useState('');
  const dropdownRoot = document.getElementById('dropdown-root');
  const [yearSuggestions, setYearSuggestions] = useState([]);
  const [sessionSuggestions, setSessionSuggestions] = useState([]);

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

  const handleAcademicYearChange = (event) => {
    const year = event.target.value;
    setAcademicYear(year);
    setAcademicSessions(generateAcademicSessions(year));
    setAcademicSession('');
  };

  const handleSearch = () => {
    onSearch({ academicYear, academicSession, mentorStatus });
  };

  const handleReset = () => {
    setAcademicYear('');
    setAcademicSession('');
    setMentorStatus('');
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

  const textFieldStyles = {
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

  const comboBoxStyles = {
    position: 'relative',
    minWidth: 200,
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
      backgroundColor: '#1a1a1a',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '8px',
      marginTop: '4px',
      padding: '8px 0',
      maxHeight: '200px',
      overflowY: 'auto',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      backdropFilter: 'blur(10px)',
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

  const validateAcademicSession = (value) => {
    const regex = /^(JANUARY|JULY)-(JUNE|DECEMBER)\s(\d{4})$/;
    if (!regex.test(value)) return false;

    const [, month, ] = value.match(regex);
    const validMonths = ['JANUARY', 'JULY'];
    return validMonths.includes(month);
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

  const showAlert = (message) => {
    console.warn(message);
  };

  const filterSectionStyles = {
    wrapper: {
      background: 'rgba(17, 25, 40, 0.75)',
      backdropFilter: 'blur(16px)',
      borderRadius: '24px',
      padding: '24px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
    },
    filterGrid: {
      display: 'grid',
      gridTemplateColumns: {
        xs: '1fr',
        sm: 'repeat(2, 1fr)',
      },
      gap: '16px',
      mb: 3,
    },
    buttonGroup: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '12px',
      justifyContent: 'flex-end',
      mt: 2,
    }
  };

  useEffect(() => {
    // Handle any document-dependent code here
  }, []);

  return (
    <Box sx={filterSectionStyles.wrapper}>
      <Box sx={filterSectionStyles.filterGrid}>
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
              },
            }}
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
            ...buttonStyles('primary'),
            minWidth: '120px',
            height: '40px',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 20px rgba(249, 115, 22, 0.2)',
            },
          }}
        >
          Search
        </Button>
        <Button
          variant="contained"
          onClick={onAddNew}
          sx={buttonStyles('secondary')}
        >
          Add New Mentor
        </Button>
        {/* <Button
          variant="contained"
          onClick={onBulkUpload}
          sx={buttonStyles('secondary')}
        >
          Upload File
        </Button> */}
        <Button
          variant="contained"
          onClick={handleReset}
          sx={buttonStyles('secondary')}
        >
          Reset
        </Button>
      </Box>
    </Box>
  );
};

export default MentorFilterSection;