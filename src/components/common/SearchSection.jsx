"use client";
import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography,
  Collapse,
  IconButton,
  Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import { motion } from 'framer-motion';

const SearchSection = ({ 
  onSearch, 
  onReset,
  defaultYear,
  defaultSession,
  isLoading = false,
  showError = false 
}) => {
  const [academicYear, setAcademicYear] = useState('');
  const [academicSession, setAcademicSession] = useState('');
  const [semester, setSemester] = useState('');
  const [sessions, setSessions] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [isValid, setIsValid] = useState(false);

  // Generate academic years (current year - 2 to current year + 1)
  const generateAcademicYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = -2; i <= 1; i++) {
      const year = `${currentYear + i}-${(currentYear + i + 1).toString().slice(-2)}`;
      years.push(year);
    }
    return years;
  };

  const academicYears = generateAcademicYears();

  useEffect(() => {
    // Set default values if provided
    if (defaultYear) setAcademicYear(defaultYear);
    if (defaultSession) setAcademicSession(defaultSession);
  }, [defaultYear, defaultSession]);

  useEffect(() => {
    if (academicYear) {
      // Generate sessions based on academic year
      const [startYear] = academicYear.split('-');
      setSessions([
        `JULY-DECEMBER ${startYear}`,
        `JANUARY-JUNE ${parseInt(startYear) + 1}`
      ]);
    }
  }, [academicYear]);

  useEffect(() => {
    if (academicSession) {
      // Set semesters based on session
      const isOddSemester = academicSession.includes('JULY-DECEMBER');
      setSemesters(isOddSemester ? [1, 3, 5, 7] : [2, 4, 6, 8]);
    }
  }, [academicSession]);

  useEffect(() => {
    // Validate form
    setIsValid(!!academicYear && !!academicSession);
  }, [academicYear, academicSession]);

  const handleReset = () => {
    setAcademicYear('');
    setAcademicSession('');
    setSemester('');
    setSessions([]);
    setSemesters([]);
    onReset?.();
  };

  const handleSearch = () => {
    if (isValid) {
      onSearch?.({
        academicYear,
        academicSession,
        semester: semester || undefined
      });
    }
  };

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 2,
        p: 3,
        bgcolor: 'rgba(0, 0, 0, 0.2)',
        borderRadius: 2,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background gradient effect */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(45deg, rgba(249, 115, 22, 0.05), rgba(249, 115, 22, 0.02))',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Academic Year */}
      <FormControl 
        fullWidth 
        variant="outlined" 
        sx={{ 
          minWidth: { xs: '100%', md: 200 },
          zIndex: 1 
        }}
      >
        <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          Academic Year *
        </InputLabel>
        <Select
          value={academicYear}
          onChange={(e) => setAcademicYear(e.target.value)}
          label="Academic Year *"
          sx={{
            color: 'white',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255, 255, 255, 0.2)',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(249, 115, 22, 0.5)',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#f97316',
            },
          }}
        >
          {academicYears.map((year) => (
            <MenuItem key={year} value={year}>{year}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Academic Session */}
      <FormControl 
        fullWidth 
        variant="outlined"
        sx={{ 
          minWidth: { xs: '100%', md: 250 },
          zIndex: 1 
        }}
      >
        <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          Academic Session *
        </InputLabel>
        <Select
          value={academicSession}
          onChange={(e) => setAcademicSession(e.target.value)}
          label="Academic Session *"
          disabled={!academicYear}
          sx={{
            color: 'white',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255, 255, 255, 0.2)',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(249, 115, 22, 0.5)',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#f97316',
            },
          }}
        >
          {sessions.map((session) => (
            <MenuItem key={session} value={session}>{session}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Semester (Optional) */}
      <FormControl 
        fullWidth 
        variant="outlined"
        sx={{ 
          minWidth: { xs: '100%', md: 150 },
          zIndex: 1 
        }}
      >
        <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Semester</InputLabel>
        <Select
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
          label="Semester"
          disabled={!academicSession}
          sx={{
            color: 'white',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255, 255, 255, 0.2)',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(249, 115, 22, 0.5)',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#f97316',
            },
          }}
        >
          <MenuItem value="">All Semesters</MenuItem>
          {semesters.map((sem) => (
            <MenuItem key={sem} value={sem}>Semester {sem}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Action Buttons */}
      <Box sx={{ 
        display: 'flex', 
        gap: 1,
        alignItems: 'flex-start',
        zIndex: 1
      }}>
        <Tooltip title="Search">
          <span>
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={!isValid || isLoading}
              startIcon={<SearchIcon />}
              sx={{
                bgcolor: '#f97316',
                '&:hover': { bgcolor: '#ea580c' },
                '&.Mui-disabled': {
                  bgcolor: 'rgba(249, 115, 22, 0.3)',
                },
              }}
            >
              Search
            </Button>
          </span>
        </Tooltip>

        <Tooltip title="Reset">
          <IconButton
            onClick={handleReset}
            disabled={isLoading}
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': {
                color: '#f97316',
                bgcolor: 'rgba(249, 115, 22, 0.1)',
              },
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Error Message */}
      <Collapse in={showError}>
        <Typography
          color="error"
          variant="caption"
          sx={{
            position: 'absolute',
            bottom: 8,
            left: 24,
            color: '#ef4444',
          }}
        >
          Please select required fields
        </Typography>
      </Collapse>
    </Box>
  );
};

export default SearchSection;
