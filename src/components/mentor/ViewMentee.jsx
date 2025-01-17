"use client"
import React, { useState, useEffect } from 'react';
import { Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, IconButton, Grid } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import Navbar from '@/components/subComponents/Navbar';
import MenteeTable from '../AdminDash/mentee/MenteeTable'; 
import axios from 'axios';
import toast from 'react-hot-toast';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';

const ViewMentee = () => {
    const [mentees, setMentees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedMentee, setSelectedMentee] = useState(null);
    const [editDialog, setEditDialog] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedMentee, setEditedMentee] = useState(null);
    const [mounted, setMounted] = useState(false);

    // Complete theme configuration
    const theme = createTheme({
        palette: {
            primary: {
                main: '#f97316',
            },
            secondary: {
                main: '#ea580c',
            },
            background: {
                default: '#0a0a0a',
                paper: 'rgba(255, 255, 255, 0.05)',
            },
            text: {
                primary: '#ffffff',
                secondary: 'rgba(255, 255, 255, 0.7)',
            },
        },
        components: {
            MuiTextField: {
                styleOverrides: {
                    root: {
                        '& .MuiOutlinedInput-root': {
                            color: 'white',
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#f97316',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#f97316',
                            },
                            // Add styles for disabled state
                            '&.Mui-disabled': {
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                '& input, & textarea': {
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    WebkitTextFillColor: 'rgba(255, 255, 255, 0.7)',
                                },
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(255, 255, 255, 0.2)',
                                },
                            },
                        },
                        '& .MuiInputLabel-root': {
                            color: 'rgba(255, 255, 255, 0.7)',
                            '&.Mui-disabled': {
                                color: 'rgba(255, 255, 255, 0.5)',
                            },
                        },
                    },
                },
            },
        },
    });

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        const fetchMentees = async () => {
            setLoading(true);
            const mentorEmail = sessionStorage.getItem('email'); // Make sure this key matches what you set during login
            
            console.log("Fetching mentees for mentor email:", mentorEmail);
            
            if (!mentorEmail) {
                console.log("No mentor email found in session");
                setLoading(false);
                return;
            }
            
            try {
                const response = await axios.get('/api/mentor/manageMentee', {
                    params: { mentorEmail }
                });
                
                console.log("API Response:", response.data);
                
                if (response.data?.success && Array.isArray(response.data.mentees)) {
                    setMentees(response.data.mentees);
                } else {
                    console.log("No mentees found or invalid response format");
                    setMentees([]);
                }
            } catch (error) {
                console.error('Error fetching mentees:', error.response?.data || error.message);
                setMentees([]);
            } finally {
                setLoading(false);
            }
        };

        fetchMentees();
    }, [mounted]);

    const handleEditClick = (mentee) => {
        setSelectedMentee(mentee);
        setEditDialog(true);
    };

    const handleEditClose = () => {
        setSelectedMentee(null);
        setEditDialog(false);
        setIsEditing(false);
    };

    const handleEditMode = () => {
        setIsEditing(true);
        // Ensure all fields including address are properly copied
        setEditedMentee({
            ...selectedMentee,
            address: selectedMentee.address || '', // Ensure address is initialized
            parents: {
                ...selectedMentee.parents,
                father: { ...selectedMentee.parents?.father } || {},
                mother: { ...selectedMentee.parents?.mother } || {},
                guardian: { ...selectedMentee.parents?.guardian } || {}
            }
        });
    };

    const handleInputChange = (e, category, subcategory) => {
        const { name, value } = e.target;
        
        if (category && subcategory) {
            setEditedMentee(prev => ({
                ...prev,
                parents: {
                    ...prev.parents,
                    [category]: {
                        ...prev.parents?.[category],
                        [subcategory]: value
                    }
                }
            }));
        } else {
            // Make sure we're updating the state properly
            setEditedMentee(prev => ({
                ...prev,
                [name]: value
            }));
            console.log(`Updating ${name} to:`, value); // Debug log
        }
    };

    // Make sure to include MUJid in the update
    const handleUpdate = async () => {
        try {
            const mentorEmail = sessionStorage.getItem('email'); // Get mentor email from session
            const updateData = {
                ...editedMentee,
                MUJid: selectedMentee.MUJid  // Include MUJid for identification
            };
            
            const response = await axios.put('/api/mentor/manageMentee', 
                updateData,
                {
                    headers: {
                        'mentor-email': mentorEmail
                    }
                }
            );
            
            if (response.data.success) {
                toast.success('Mentee details updated successfully');
                // Update the mentees list with new data
                setMentees(prev => prev.map(m => 
                    m.MUJid === editedMentee.MUJid ? editedMentee : m
                ));
                setIsEditing(false);
                handleEditClose();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error updating mentee');
        }
    };

    if (!mounted) {
        return null;
    }

    return (
        <ThemeProvider theme={theme}>
            <div className="min-h-screen bg-[#0a0a0a] overflow-hidden relative">
                {/* Background Effects */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-purple-500/10 to-blue-500/10 animate-gradient" />
                    <div className="absolute inset-0 backdrop-blur-3xl" />
                </div>

                <Navbar />

                <div className="relative z-10 px-4 md:px-6 py-24">
                    {/* Header */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-10"
                    >
                        <motion.h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-pink-500 mb-4">
                            My Mentees
                        </motion.h1>
                    </motion.div>

                    {/* Table Section */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden"
                    >
                        <Box sx={{ 
                            overflowX: 'auto',
                            minHeight: '150px',
                            maxHeight: 'calc(100vh - 300px)',
                            overflowY: 'auto'
                        }}>
                            {!loading && mentees.length > 0 && (
                                <MenteeTable 
                                    mentees={mentees}
                                    onEditClick={handleEditClick}
                                    isSmallScreen={false}
                                    isMentorView={true} // Add this prop to customize table for mentor view
                                />
                            )}
                            {!loading && mentees.length === 0 && (
                                <Typography sx={{ p: 3, textAlign: 'center', color: 'white' }}>
                                    No mentees assigned yet.
                                </Typography>
                            )}
                        </Box>
                    </motion.div>
                </div>

                {/* View/Edit Dialog */}
                <Dialog 
                    open={editDialog} 
                    onClose={handleEditClose}
                    maxWidth="md"
                    fullWidth
                    PaperProps={{ 
                        sx: {
                            background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.95), rgba(31, 41, 55, 0.95))',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '1rem',
                            color: 'white',
                        }
                    }}
                >
                    <DialogTitle 
                        sx={{ 
                            borderBottom: '1px solid rgba(100, 100, 100, 0.1)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            p: 2
                        }}
                    >
                        {/* Fixed: Remove nested Typography components */}
                        <Box component="div" sx={{ typography: 'h6', color: 'white' }}>
                            {isEditing ? 'Edit Mentee Details' : 'View Mentee Details'}
                        </Box>
                        {!isEditing && (
                            <IconButton 
                                onClick={handleEditMode}
                                sx={{ 
                                    color: '#f97316',
                                    '&:hover': { bgcolor: 'rgba(249, 115, 22, 0.1)' }
                                }}
                            >
                                <EditIcon />
                            </IconButton>
                        )}
                    </DialogTitle>
                    <DialogContent sx={{ mt: 2 }}>
                        {(isEditing ? editedMentee : selectedMentee) && (
                            <Grid container spacing={3}>
                                {/* Personal Information */}
                                <Grid item xs={12} md={6}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <Typography variant="subtitle2" color="#f97316">
                                            Personal Information
                                        </Typography>
                                        <TextField
                                            label="Name"
                                            name="name"
                                            value={isEditing ? editedMentee.name : selectedMentee.name}
                                            onChange={handleInputChange}
                                            disabled={!isEditing}
                                            fullWidth
                                        />
                                        <TextField
                                            label="Phone"
                                            name="phone"
                                            value={isEditing ? editedMentee.phone : selectedMentee.phone}
                                            onChange={handleInputChange}
                                            disabled={!isEditing}
                                            fullWidth
                                        />
                                        <TextField
                                            label="Address"
                                            name="address"
                                            multiline
                                            rows={2}
                                            value={isEditing ? editedMentee.address : selectedMentee.address}
                                            onChange={handleInputChange}
                                            disabled={!isEditing}
                                            fullWidth
                                        />
                                    </Box>
                                </Grid>

                                {/* Father's Details */}
                                <Grid item xs={12} md={6}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <Typography variant="subtitle2" color="#f97316">
                                            Father&apos;s Details
                                        </Typography>
                                        <TextField
                                            label="Father's Name"
                                            value={isEditing ? editedMentee.parents?.father?.name : selectedMentee.parents?.father?.name}
                                            onChange={(e) => handleInputChange(e, 'father', 'name')}
                                            disabled={!isEditing}
                                            fullWidth
                                        />
                                        <TextField
                                            label="Father's Email"
                                            value={isEditing ? editedMentee.parents?.father?.email : selectedMentee.parents?.father?.email}
                                            onChange={(e) => handleInputChange(e, 'father', 'email')}
                                            disabled={!isEditing}
                                            fullWidth
                                        />
                                        <TextField
                                            label="Father's Phone"
                                            value={isEditing ? editedMentee.parents?.father?.phone : selectedMentee.parents?.father?.phone}
                                            onChange={(e) => handleInputChange(e, 'father', 'phone')}
                                            disabled={!isEditing}
                                            fullWidth
                                        />
                                    </Box>
                                </Grid>

                                {/* Mother's Details */}
                                <Grid item xs={12} md={6}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <Typography variant="subtitle2" color="#f97316">
                                            Mother&apos;s Details
                                        </Typography>
                                        <TextField
                                            label="Mother's Name"
                                            value={isEditing ? editedMentee.parents?.mother?.name : selectedMentee.parents?.mother?.name}
                                            onChange={(e) => handleInputChange(e, 'mother', 'name')}
                                            disabled={!isEditing}
                                            fullWidth
                                        />
                                        <TextField
                                            label="Mother's Email"
                                            value={isEditing ? editedMentee.parents?.mother?.email : selectedMentee.parents?.mother?.email}
                                            onChange={(e) => handleInputChange(e, 'mother', 'email')}
                                            disabled={!isEditing}
                                            fullWidth
                                        />
                                        <TextField
                                            label="Mother's Phone"
                                            value={isEditing ? editedMentee.parents?.mother?.phone : selectedMentee.parents?.mother?.phone}
                                            onChange={(e) => handleInputChange(e, 'mother', 'phone')}
                                            disabled={!isEditing}
                                            fullWidth
                                        />
                                    </Box>
                                </Grid>

                                {/* Guardian's Details */}
                                <Grid item xs={12} md={6}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <Typography variant="subtitle2" color="#f97316">
                                            Guardian&apos;s Details
                                        </Typography>
                                        <TextField
                                            label="Guardian's Name"
                                            value={isEditing ? editedMentee.parents?.guardian?.name : selectedMentee.parents?.guardian?.name}
                                            onChange={(e) => handleInputChange(e, 'guardian', 'name')}
                                            disabled={!isEditing}
                                            fullWidth
                                        />
                                        <TextField
                                            label="Guardian's Email"
                                            value={isEditing ? editedMentee.parents?.guardian?.email : selectedMentee.parents?.guardian?.email}
                                            onChange={(e) => handleInputChange(e, 'guardian', 'email')}
                                            disabled={!isEditing}
                                            fullWidth
                                        />
                                        <TextField
                                            label="Guardian's Phone"
                                            value={isEditing ? editedMentee.parents?.guardian?.phone : selectedMentee.parents?.guardian?.phone}
                                            onChange={(e) => handleInputChange(e, 'guardian', 'phone')}
                                            disabled={!isEditing}
                                            fullWidth
                                        />
                                        <TextField
                                            label="Relation with Guardian"
                                            value={isEditing ? editedMentee.parents?.guardian?.relation : selectedMentee.parents?.guardian?.relation}
                                            onChange={(e) => handleInputChange(e, 'guardian', 'relation')}
                                            disabled={!isEditing}
                                            fullWidth
                                        />
                                    </Box>
                                </Grid>
                            </Grid>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ borderTop: '1px solid rgba(100, 100, 100, 0.1)', p: 2, gap: 1 }}>
                        <Button 
                            onClick={handleEditClose}
                            variant="outlined"
                            sx={{
                                color: 'white',
                                borderColor: 'rgba(255, 255, 255, 0.2)',
                                '&:hover': {
                                    borderColor: 'rgba(255, 255, 255, 0.5)',
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                }
                            }}
                        >
                            Cancel
                        </Button>
                        {isEditing && (
                            <Button 
                                onClick={handleUpdate}
                                variant="contained"
                                startIcon={<SaveIcon />}
                                sx={{
                                    bgcolor: '#f97316',
                                    '&:hover': {
                                        bgcolor: '#ea580c',
                                    },
                                }}
                            >
                                Save Changes
                            </Button>
                        )}
                    </DialogActions>
                </Dialog>

                <Toaster position="top-right" />
            </div>
        </ThemeProvider>
    );
};

export default ViewMentee;