'use client';
import { useState, useEffect } from 'react';
import { TextField, Box, Button, Typography } from '@mui/material';
import { 
  getCurrentAcademicYear, 
  generateAcademicSessions, 
  validateAcademicYear 
} from '@/utils/academicYear';
import SearchIcon from '@mui/icons-material/Search';

const YearSessionSelector = ({ onSearch }) => {
  const [academicYear, setAcademicYear] = useState('');
  const [academicSession, setAcademicSession] = useState('');
  const [sessions, setSessions] = useState([]);
  const [yearError, setYearError] = useState('');
  const [sessionError, setSessionError] = useState('');

  useEffect(() => {
    // Set default academic year on mount
    const currentYear = getCurrentAcademicYear();
    setAcademicYear(currentYear.startYear + '-' + currentYear.endYear);
  }, []);

  useEffect(() => {
    if (validateAcademicYear(academicYear)) {
      const availableSessions = generateAcademicSessions(academicYear);
      setSessions(availableSessions);
      setYearError('');
    } else {
      setSessions([]);
      if (academicYear) {
        setYearError('Invalid academic year format (YYYY-YYYY)');
      }
    }
  }, [academicYear]);

  const handleSearch = () => {
    if (!academicYear || !academicSession) {
      if (!academicYear) setYearError('Academic year is required');
      if (!academicSession) setSessionError('Academic session is required');
      return;
    }
    onSearch({ academicYear, academicSession });
  };

  return (
    <Box sx={{
      height: '100%',
      backgroundColor: '#1a1a1a',
      borderRadius: '24px',
      border: '1px solid rgba(249, 115, 22, 0.2)',
      p: 3,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
      display: 'flex',
      flexDirection: 'column',
      gap: 3
    }}>
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        mb: 1,
        borderBottom: '1px solid rgba(249, 115, 22, 0.2)',
        pb: 2
      }}>
        <SearchIcon sx={{ color: '#f97316' }} />
        <Typography 
          variant="h6" 
          sx={{ 
            color: '#f97316',
            fontWeight: 600,
            letterSpacing: '0.5px'
          }}
        >
          Archive Filters
        </Typography>
      </Box>
      
      <TextField
        label="Academic Year"
        value={academicYear}
        onChange={(e) => setAcademicYear(e.target.value)}
        error={!!yearError}
        helperText={yearError}
        fullWidth
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#262626',
            borderRadius: '12px',
            '& fieldset': {
              borderColor: 'rgba(249, 115, 22, 0.3)',
            },
            '&:hover fieldset': {
              borderColor: '#f97316',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#f97316',
              borderWidth: '2px',
            }
          },
          '& .MuiInputLabel-root': {
            color: '#f97316',
            '&.Mui-focused': {
              color: '#f97316',
            }
          },
          '& input': {
            color: 'white',
          }
        }}
      />

      <TextField
        select
        label="Academic Session"
        value={academicSession}
        onChange={(e) => setAcademicSession(e.target.value)}
        error={!!sessionError}
        helperText={sessionError}
        fullWidth
        SelectProps={{
          native: true,
          sx: {
            '& option': {
              backgroundColor: '#262626 !important',
              color: 'white !important',
              padding: '8px',
              '&:hover': {
                backgroundColor: '#333333 !important',
              }
            }
          }
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#262626',
            borderRadius: '12px',
            '& fieldset': {
              borderColor: 'rgba(249, 115, 22, 0.3)',
            },
            '&:hover fieldset': {
              borderColor: '#f97316',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#f97316',
              borderWidth: '2px',
            },
            '& input': {
              color: 'white !important', // Ensure the selected value remains white
            },
            '& .MuiSelect-select': {
              color: 'white !important', // Ensure the selected value remains white
            },
            '& select': {
              color: 'white !important', // Ensure the selected value remains white
            }
          },
          '& .MuiInputLabel-root': {
            color: '#f97316',
            '&.Mui-focused': {
              color: '#f97316',
            }
          },
          '& .MuiSelect-select': {
            color: 'white',
            padding: '12px',
          },
          '& .MuiSvgIcon-root': {
            color: '#f97316',
          },
          '& .MuiSelect-nativeInput': {
            backgroundColor: '#262626',
          }
        }}
      >
        <option value="" style={{ 
          backgroundColor: '#262626', 
          color: 'white',
          padding: '12px'
        }}>
          Select a session
        </option>
        {sessions.map((session) => (
          <option 
            key={session} 
            value={session}
            style={{ 
              backgroundColor: '#262626', 
              color: 'white',
              padding: '12px'
            }}
          >
            {session}
          </option>
        ))}
      </TextField>

      <Button
        fullWidth
        variant="contained"
        onClick={handleSearch}
        disabled={!academicYear || !academicSession}
        startIcon={<SearchIcon />}
        sx={{
          mt: 2,
          bgcolor: '#f97316',
          color: 'white',
          borderRadius: '12px',
          py: 1.5,
          textTransform: 'none',
          fontSize: '1rem',
          fontWeight: 600,
          boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
          '&:hover': {
            bgcolor: '#ea580c',
            transform: 'translateY(-1px)',
            boxShadow: '0 6px 16px rgba(249, 115, 22, 0.4)',
          },
          '&.Mui-disabled': {
            bgcolor: '#262626',
            color: 'rgba(255, 255, 255, 0.3)',
          },
          transition: 'all 0.2s ease',
        }}
      >
        Search Archives
      </Button>
    </Box>
  );
};

export default YearSessionSelector;
