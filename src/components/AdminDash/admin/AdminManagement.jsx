"use client";
import { useState, useEffect } from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, TextField, Snackbar, Alert, AlertTitle, Slide, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Avatar } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import { Toaster } from 'react-hot-toast';
import axios from 'axios';
import { motion } from 'framer-motion';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';


const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [ setLoading] = useState(false);
  const [setError] = useState(null);
  const [alert, setAlert] = useState({ open: false, message: '', severity: '' });
  const [adminDetails, setAdminDetails] = useState({
    name: '',
    email: '',
    role: 'admin'
  });

  const theme = createTheme({
    palette: {
      primary: {
        main: '#f97316',
      },
      secondary: {
        main: '#ea580c',
      },
    },
  });

  // Use the same dialogStyles as MentorManagement
  const dialogStyles = {
    paper: {
      background: 'rgba(17, 17, 17, 0.95)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '1rem',
      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
      color: 'white',
    },
    // ...existing dialog styles from MentorManagement...
  };

  const handleAddAdmin = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/admin/manageAdmin', adminDetails);
      setAdmins(prev => [...prev, response.data]);
      setOpenDialog(false);
      setAdminDetails({ name: '', email: '', role: 'admin' });
      showAlert('Admin added successfully', 'success');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add admin');
      showAlert(err.response?.data?.message || 'Failed to add admin', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Modify fetchAdmins to use dummy data temporarily
  const fetchAdmins = async () => {
    try {
      setLoading(true);
      // Comment out the actual API call and use dummy data instead
      // const response = await axios.get('/api/admin/manageAdmin');
      setAdmins(dummyAdmins);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch admins');
      showAlert(err.response?.data?.message || 'Failed to fetch admins', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message, severity) => {
    setAlert({ open: true, message, severity });
    setTimeout(() => setAlert({ open: false, message: '', severity: '' }), 3000);
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      {/* Toast/Alert Container */}
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[9999] w-full max-w-md max-h-screen">
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'rgba(0, 0, 0, 0.8)',
              color: '#fff',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '0.75rem',
            },
          }}
        />
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
      </div>

      <div className="min-h-screen bg-[#0a0a0a] overflow-hidden relative">
        {/* Background Effects */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-purple-500/10 to-blue-500/10 animate-gradient" />
          <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-orange-500/20 to-transparent blur-3xl" />
          <div className="absolute inset-0 backdrop-blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 px-4 md:px-6 py-24 max-h-screen">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <motion.h1 
              className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-pink-500 mb-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Admin Management
            </motion.h1>

            {/* Admin Table Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6"
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ color: 'white' }}>
                  Total Admins: {admins.length}
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={() => setOpenDialog(true)}
                  sx={{ 
                    backgroundColor: 'rgba(249, 115, 22, 0.8)',
                    '&:hover': { backgroundColor: '#f97316' }
                  }}
                >
                  Add New Admin
                </Button>
              </Box>

              <TableContainer component={Paper} sx={{ 
                backgroundColor: 'transparent',
                '& .MuiTableCell-root': { 
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white'
                }
              }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Admin</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Last Active</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {admins.map((admin) => (
                      <TableRow key={admin.id} sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' } }}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: '#f97316' }}>
                              {admin.name.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography sx={{ color: 'white', fontWeight: 500 }}>{admin.name}</Typography>
                              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>{admin.email}</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>{admin.role}</TableCell>
                        <TableCell>{admin.lastActive}</TableCell>
                        <TableCell>
                          <Box sx={{ 
                            backgroundColor: admin.status === 'Active' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            color: admin.status === 'Active' ? '#22c55e' : '#ef4444',
                            px: 2,
                            py: 0.5,
                            borderRadius: '1rem',
                            display: 'inline-block'
                          }}>
                            {admin.status}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <IconButton sx={{ color: '#f97316' }}>
                            <EditIcon />
                          </IconButton>
                          <IconButton sx={{ color: '#ef4444' }}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </motion.div>
          </motion.div>
        </div>

        {/* Add/Edit Dialog */}
        <Dialog 
          open={openDialog} 
          onClose={() => setOpenDialog(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: dialogStyles.paper }}
        >
          <DialogTitle sx={dialogStyles.title}>
            <Typography variant="h6" component="div" sx={{ color: '#f97316' }}>
              Add New Admin
            </Typography>
            <IconButton
              onClick={() => setOpenDialog(false)}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: 'white',
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ 
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            minWidth: '400px'
          }}>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Avatar sx={{ 
                width: 80, 
                height: 80, 
                margin: 'auto',
                bgcolor: '#f97316',
                fontSize: '2rem'
              }}>
                {adminDetails.name ? adminDetails.name.charAt(0) : 'A'}
              </Avatar>
            </Box>
            
            {Object.entries(adminDetails).map(([key, value]) => (
              <TextField
                key={key}
                fullWidth
                label={key.charAt(0).toUpperCase() + key.slice(1)}
                name={key}
                value={value}
                onChange={(e) => setAdminDetails(prev => ({
                  ...prev,
                  [key]: e.target.value
                }))}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                    '&:hover fieldset': { borderColor: '#f97316' },
                    '&.Mui-focused fieldset': { borderColor: '#f97316' }
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                }}
              />
            ))}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button onClick={handleAddAdmin} variant="contained">
              Add Admin
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </ThemeProvider>
  );
};

export default AdminManagement;