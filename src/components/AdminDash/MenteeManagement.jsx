"use client";
import { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Container, useMediaQuery, IconButton, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Divider, Snackbar, Slide, Alert, AlertTitle, LinearProgress } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useDropzone } from 'react-dropzone';
import MenteeTable from './MenteeTable';
import FilterSection from './FilterSection';
import { Toaster } from 'react-hot-toast';
import axios from 'axios';

const calculateCurrentSemester = (yearOfRegistration) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-based

  // Calculate years completed
  let yearsCompleted = currentYear - yearOfRegistration;
  
  // Calculate semester based on current month
  // August to November is odd semester
  // December to June is even semester
  let semesterInCurrentYear;
  if (currentMonth >= 8 && currentMonth <= 11) {
    semesterInCurrentYear = 1; // Odd semester
  } else if ((currentMonth >= 12) || (currentMonth >= 1 && currentMonth <= 6)) {
    semesterInCurrentYear = 2; // Even semester
  } else {
    // July is considered as end of even semester
    semesterInCurrentYear = 2;
  }

  // Calculate total semesters completed
  let totalSemesters = (yearsCompleted * 2) + semesterInCurrentYear;

  // Ensure semester doesn't exceed 8 (4-year program)
  return Math.min(totalSemesters, 8);
};

const MenteeManagement = () => {
  const [mentees, setMentees] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [year, setYear] = useState('');
  const [term, setTerm] = useState('');
  const [semester, setSemester] = useState('');
  const [section, setSection] = useState('');
  const [isFilterSelected, setIsFilterSelected] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [menteeDetails, setMenteeDetails] = useState({
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
    mentorMujid: '',
  });
  
  const [editDialog, setEditDialog] = useState(false);
  const [selectedMentee, setSelectedMentee] = useState(null);
  const [alert, setAlert] = useState({ open: false, message: '', severity: '' });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, mentee: null });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const showAlert = (message, severity) => {
    setAlert({ open: true, message, severity });
    setTimeout(() => setAlert({ open: false, message: '', severity: '' }), 3000);
  };

  const handleEditClick = (mentee) => {
    setSelectedMentee(mentee);
    setEditDialog(true);
  };

  const handleEditClose = () => {
    setSelectedMentee(null);
    setEditDialog(false);
  };

  const handleUpdate = () => {
    setConfirmDialog({ open: true, mentee: selectedMentee });
  };

  const handleConfirmClose = () => {
    setConfirmDialog({ open: false, mentee: null });
  };

  const handleConfirmUpdate = async () => {
    const mentee = confirmDialog.mentee;
    try {
      const response = await axios.patch('/api/admin/manageUsers/manageMentee', mentee);
      showAlert('Mentee updated successfully', 'success');
      setMentees(prevMentees => 
        prevMentees.map(mentee => 
          mentee.mujid === selectedMentee.mujid ? response.data : mentee
        )
      );
      handleEditClose();
    } catch (error) {
      showAlert(error.response?.data?.error || 'Error updating mentee', 'error');
    } finally {
      handleConfirmClose();
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedMentee(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const theme = createTheme({
    palette: {
      primary: {
        main: '#f97316', // orange-500
      },
      secondary: {
        main: '#ea580c', // orange-600
      },
    },
  });

  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    sessionStorage.removeItem('menteeData'); // Clear session storage on mount
    setMounted(true);
  }, []);

  useEffect(() => {
    setIsFilterSelected(Boolean(year || term || semester || section));
  }, [year, term, semester, section]);

  const handleSearch = (data) => {
    setMentees(data);
  };

  const handleSearchAll = (data) => {
    setMentees(data);
  };

  const handleReset = () => {
    setYear('');
    setTerm('');
    setSemester('');
    setSection('');
    setMentees([]);
    sessionStorage.removeItem('menteeData');
  };

  const handleDialogOpen = () => {
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMenteeDetails({ ...menteeDetails, [name]: value });
  };

  const handleFormSubmit = () => {
    // Implement form submission logic here
    console.log('Mentee Details:', menteeDetails);
    handleDialogClose();
  };

  const handleFileUpload = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (!validTypes.includes(file.type)) {
      showAlert('Please upload only Excel files (.xls or .xlsx)', 'error');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/api/admin/manageUsers/uploadMentees', formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      const { results } = response.data;
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      showAlert(
        `Upload complete: ${successful} mentees added/updated, ${failed} failed`,
        failed > 0 ? 'warning' : 'success'
      );

      // Refresh the mentee list
      if (handleSearch) {
        handleSearch([]);
      }
    } catch (error) {
      showAlert(error.response?.data?.error || 'Error uploading file', 'error');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      handleDialogClose();
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: handleFileUpload,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false
  });

  useEffect(() => {
    const updateSemesters = () => {
      setMentees(prevMentees => 
        prevMentees.map(mentee => ({
          ...mentee,
          semester: calculateCurrentSemester(mentee.yearOfRegistration)
        }))
      );
    };

    // Update initially
    updateSemesters();

    // Update every day at midnight
    const now = new Date();
    const night = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1, // tomorrow
      0, 0, 0 // midnight
    );
    const msToMidnight = night.getTime() - now.getTime();

    const timeout = setTimeout(() => {
      updateSemesters();
      // Then set up daily updates
      const interval = setInterval(updateSemesters, 24 * 60 * 60 * 1000);
      return () => clearInterval(interval);
    }, msToMidnight);

    return () => clearTimeout(timeout);
  }, []);

  const filterConfig = {
    year,
    term,
    semester,
    section,
  };

  const handleFilterChange = (name, value) => {
    const setters = {
      year: setYear,
      term: setTerm,
      semester: setSemester,
      section: setSection
    };
    setters[name](value);
  };

  if (!mounted) return null;

  return (
    <ThemeProvider theme={theme}>
      <Toaster position="top-right" />
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
      <Container 
        maxWidth={false} // Changed from "lg" to false
        sx={{ 
          mt: { xs: '60px', sm: '80px' },
          mb: { xs: 2, sm: 4 },
          pt: { xs: 1, sm: 2 },
          minHeight: { xs: 'calc(100vh - 60px)', sm: 'calc(100vh - 80px)' },
          display: 'flex',
          flexDirection: 'column',
          width: '95% !important', // Added this line
          mx: 'auto' // Added to maintain center alignment
        }}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            p: { xs: 1, sm: 2, md: 3 }, 
            borderRadius: 2,
            background: 'linear-gradient(to right bottom, #fff, #fff8f1)',
            flex: 1,
            overflowX: 'auto'
          }}
        >
          <Typography 
            variant={isSmallScreen ? "h5" : "h4"} 
            mb={isSmallScreen ? 2 : 4} 
            align="center"
            sx={{ 
              color: '#ea580c',
              fontWeight: 'bold'
            }}
          >
            Mentee Management
          </Typography>
          
          <FilterSection 
            filters={filterConfig}
            onFilterChange={handleFilterChange}
            onSearch={handleSearch}
            onSearchAll={handleSearchAll}
            onAddNew={handleDialogOpen} // Pass the handler
            onReset={handleReset}
          />

          <Box 
            sx={{ 
              transform: isFilterSelected ? 'translateY(20px)' : 'none',
              transition: 'transform 0.3s ease-in-out',
              marginTop: isFilterSelected ? 4 : 0
            }}
          >
            <Box sx={{ overflowX: 'auto' }}>
              <MenteeTable 
                mentees={mentees}
                onEditClick={handleEditClick}
                isSmallScreen={isSmallScreen}
              />
            </Box>
          </Box>
        </Paper>
      </Container>

      <Dialog 
  open={openDialog} 
  onClose={handleDialogClose} 
  fullWidth 
  maxWidth="lg" 
  sx={{ 
    '& .MuiDialog-paper': { 
      width: '90%',
      maxHeight: '90vh'
    } 
  }}
>
  <DialogTitle>
    Add New Mentee
    <IconButton
      aria-label="close"
      onClick={handleDialogClose}
      sx={{
        position: 'absolute',
        right: 8,
        top: 8,
        color: (theme) => theme.palette.grey[500],
      }}
    >
      <CloseIcon />
    </IconButton>
  </DialogTitle>
  <DialogContent dividers>
    <Box sx={{ 
      display: 'flex', 
      gap: 4,
      height: '70vh'
    }}>
      {/* Left side - Form with scroll */}
      <Box sx={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        overflowY: 'auto',
        pr: 2,
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: '#f1f1f1',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#888',
          borderRadius: '4px',
          '&:hover': {
            background: '#666',
          },
        },
      }}>
        {Object.entries(menteeDetails).map(([key, value]) => (
          <TextField
            key={key}
            label={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
            name={key}
            type={key === 'dateOfBirth' ? 'date' : key.includes('email') ? 'email' : 'text'}
            value={value}
            onChange={handleInputChange}
            required
            InputLabelProps={key === 'dateOfBirth' ? { shrink: true } : undefined}
          />
        ))}
      </Box>

      <Divider orientation="vertical" flexItem>OR</Divider>

      {/* Right side - Upload with fixed height */}
      <Box 
        {...getRootProps()} 
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 4,
          border: '2px dashed',
          borderColor: 'primary.main',
          borderRadius: 3,
          bgcolor: 'background.paper',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            bgcolor: 'primary.50',
            borderColor: 'primary.dark',
            transform: 'translateY(-2px)',
            boxShadow: 2,
          },
          '&:active': {
            transform: 'translateY(0)',
          }
        }}
      >
        <input {...getInputProps()} />
        <UploadFileIcon 
          sx={{ 
            fontSize: 80, 
            color: 'primary.main', 
            mb: 3,
            transition: 'transform 0.3s ease',
            '&:hover': {
              transform: 'scale(1.1)'
            }
          }} 
        />
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
          Drag & Drop Excel File
        </Typography>
        <Typography variant="body1" color="textSecondary" align="center" sx={{ mb: 2 }}>
          or click to select file
        </Typography>
        <Typography 
          variant="caption" 
          sx={{ 
            color: 'primary.main',
            bgcolor: 'primary.50',
            px: 2,
            py: 0.5,
            borderRadius: 1
          }}
        >
          Supported formats: .xls, .xlsx
        </Typography>
        {isUploading && (
          <Box 
            sx={{ 
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              bgcolor: 'rgba(255, 255, 255, 0.9)',
              p: 2
            }}
          >
            <LinearProgress 
              variant="determinate" 
              value={uploadProgress}
              sx={{
                height: 8,
                borderRadius: 4,
              }}
            />
            <Typography variant="caption" align="center" display="block" sx={{ mt: 1 }}>
              {uploadProgress}% uploaded
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  </DialogContent>
  <DialogActions sx={{ p: 2, gap: 1 }}>
    <Button onClick={handleDialogClose} variant="outlined" color="error">
      Cancel
    </Button>
    <Button onClick={handleFormSubmit} variant="contained" color="primary">
      Add Mentee
    </Button>
  </DialogActions>
</Dialog>

      <Dialog 
        open={editDialog} 
        onClose={handleEditClose}
        fullWidth 
        maxWidth="md"
      >
        <DialogTitle>
          Edit Mentee Details
          <IconButton
            aria-label="close"
            onClick={handleEditClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {selectedMentee && (
              <>
                <TextField
                  label="Mujid"
                  name="mujid"
                  value={selectedMentee.mujid}
                  onChange={handleEditInputChange}
                  disabled
                />
                <TextField
                  label="Year of Registration"
                  name="yearOfRegistration"
                  type="number"
                  value={selectedMentee.yearOfRegistration}
                  onChange={handleEditInputChange}
                />
                <TextField
                  label="Name"
                  name="name"
                  value={selectedMentee.name}
                  onChange={handleEditInputChange}
                />
                <TextField
                  label="Email"
                  name="email"
                  type="email"
                  value={selectedMentee.email}
                  onChange={handleEditInputChange}
                />
                <TextField
                  label="Phone"
                  name="phone"
                  value={selectedMentee.phone}
                  onChange={handleEditInputChange}
                />
                <TextField
                  label="Father's Name"
                  name="fatherName"
                  value={selectedMentee.fatherName}
                  onChange={handleEditInputChange}
                />
                <TextField
                  label="Mother's Name"
                  name="motherName"
                  value={selectedMentee.motherName}
                  onChange={handleEditInputChange}
                />
                <TextField
                  label="Date of Birth"
                  name="dateOfBirth"
                  type="date"
                  value={selectedMentee.dateOfBirth}
                  onChange={handleEditInputChange}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Parents' Phone"
                  name="parentsPhone"
                  value={selectedMentee.parentsPhone}
                  onChange={handleEditInputChange}
                />
                <TextField
                  label="Parents' Email"
                  name="parentsEmail"
                  type="email"
                  value={selectedMentee.parentsEmail}
                  onChange={handleEditInputChange}
                />
                <TextField
                  label="Mentor Mujid"
                  name="mentorMujid"
                  value={selectedMentee.mentorMujid}
                  onChange={handleEditInputChange}
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={handleEditClose}
            variant="outlined"
            color="error"
          >
            Discard
          </Button>
          <Button 
            onClick={handleUpdate}
            variant="contained"
            color="primary"
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmDialog.open} onClose={handleConfirmClose}>
        <DialogTitle>Confirm Update</DialogTitle>
        <DialogContent>
          Are you sure you want to update this mentee&apos;s data? This action is non-reversible.
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmUpdate} color="secondary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
};

export default MenteeManagement;