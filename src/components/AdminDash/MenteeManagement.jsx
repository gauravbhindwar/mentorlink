"use client";
import { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Container, useMediaQuery, IconButton, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Divider, Snackbar, Slide, Alert, AlertTitle } from '@mui/material';
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

  const handleFileUpload = (e) => {
    // Implement file upload logic here
    console.log('File uploaded:', e.target.files[0]);
  };

  const onDrop = (acceptedFiles) => {
    // Handle file drop
    console.log('Files dropped:', acceptedFiles);
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

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
            onAddNew={handleDialogOpen}
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

      <Dialog open={openDialog} onClose={handleDialogClose} fullWidth maxWidth="lg" sx={{ '& .MuiDialog-paper': { width: '80%' } }}>
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
        <DialogContent dividers sx={{ display: 'flex', gap: 2 }}>
          <Box component="form" sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Mujid"
              name="mujid"
              value={menteeDetails.mujid}
              onChange={handleInputChange}
              required
            />
            <TextField
              label="Year of Registration"
              name="yearOfRegistration"
              type="number"
              value={menteeDetails.yearOfRegistration}
              onChange={handleInputChange}
              required
            />
            <TextField
              label="Name"
              name="name"
              value={menteeDetails.name}
              onChange={handleInputChange}
              required
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              value={menteeDetails.email}
              onChange={handleInputChange}
              required
            />
            <TextField
              label="Phone"
              name="phone"
              value={menteeDetails.phone}
              onChange={handleInputChange}
              required
            />
            <TextField
              label="Father's Name"
              name="fatherName"
              value={menteeDetails.fatherName}
              onChange={handleInputChange}
              required
            />
            <TextField
              label="Mother's Name"
              name="motherName"
              value={menteeDetails.motherName}
              onChange={handleInputChange}
              required
            />
            <TextField
              label="Date of Birth"
              name="dateOfBirth"
              type="date"
              value={menteeDetails.dateOfBirth}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
              required
            />
            <TextField
              label="Parents' Phone"
              name="parentsPhone"
              value={menteeDetails.parentsPhone}
              onChange={handleInputChange}
              required
            />
            <TextField
              label="Parents' Email"
              type="email"
              name="parentsEmail"
              value={menteeDetails.parentsEmail}
              onChange={handleInputChange}
              required
            />
            <TextField
              label="Mentor Mujid"
              name="mentorMujid"
              value={menteeDetails.mentorMujid}
              onChange={handleInputChange}
              required
            />
          </Box>
          <Divider orientation="vertical" flexItem>
            OR
          </Divider>
          <Box {...getRootProps()} sx={{
            flex: 1,
            border: '2px dashed #f97316',
            padding: 2,
            textAlign: 'center',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            '&:hover': {
              backgroundColor: '#fff8f1'
            }
          }}>
            <input {...getInputProps()} />
            <Typography variant="body1" color="textSecondary">
              OR upload file or drag and drop here
            </Typography>
            <Button
              variant="contained"
              component="label"              
              startIcon={<UploadFileIcon />}              
              sx={{ mt: 2 }}            
            >              
              Upload File              
              <input                
                type="file"
                hidden
                onChange={handleFileUpload}
              />
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFormSubmit} variant="contained" color="primary">
            Submit
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
          Are you sure you want to update this mentee's data? This action is non-reversible.
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