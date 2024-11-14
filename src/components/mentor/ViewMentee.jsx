"use client"
import React, { useState, useEffect } from 'react';
import { Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import Navbar from '@/components/subComponents/Navbar';
import MenteeTable from '../AdminDash/MenteeTable'; // Reuse the table component

const ViewMentee = () => {
    const [mentees, setMentees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedMentee, setSelectedMentee] = useState(null);
    const [editDialog, setEditDialog] = useState(false);

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
                        },
                        '& .MuiInputLabel-root': {
                            color: 'rgba(255, 255, 255, 0.7)',
                        },
                    },
                },
            },
        },
    });

    // Updated fetchMentees function with better error handling
    useEffect(() => {
        const fetchMentees = async () => {
            setLoading(true);
            try {
                const response = await fetch('/api/mentor/getMentees', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                if (data.success) {
                    setMentees(data.mentees || []);
                } else {
                    console.error('Failed to fetch mentees:', data.message);
                    setMentees([]);
                }
            } catch (error) {
                console.error('Error fetching mentees:', error);
                setMentees([]);
            } finally {
                setLoading(false);
            }
        };

        fetchMentees();
    }, []);

    const handleEditClick = (mentee) => {
        setSelectedMentee(mentee);
        setEditDialog(true);
    };

    const handleEditClose = () => {
        setSelectedMentee(null);
        setEditDialog(false);
    };

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
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{ 
                        sx: {
                            background: 'rgba(17, 17, 17, 0.95)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '1rem',
                            color: 'white',
                        }
                    }}
                >
                    <DialogTitle sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        View Mentee Details
                    </DialogTitle>
                    <DialogContent sx={{ mt: 2 }}>
                        {selectedMentee && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    label="MUJID"
                                    value={selectedMentee.mujid || ''}
                                    disabled
                                    fullWidth
                                />
                                <TextField
                                    label="Name"
                                    value={selectedMentee.name || ''}
                                    disabled
                                    fullWidth
                                />
                                <TextField
                                    label="Email"
                                    value={selectedMentee.email || ''}
                                    disabled
                                    fullWidth
                                />
                                <TextField
                                    label="Phone"
                                    value={selectedMentee.phone || ''}
                                    disabled
                                    fullWidth
                                />
                                <TextField
                                    label="Father's Name"
                                    value={selectedMentee.fatherName || ''}
                                    disabled
                                    fullWidth
                                />
                                <TextField
                                    label="Mother's Name"
                                    value={selectedMentee.motherName || ''}
                                    disabled
                                    fullWidth
                                />
                                <TextField
                                    label="Parents' Contact"
                                    value={selectedMentee.parentsPhone || ''}
                                    disabled
                                    fullWidth
                                />
                                <TextField
                                    label="Year of Registration"
                                    value={selectedMentee.yearOfRegistration || ''}
                                    disabled
                                    fullWidth
                                />
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', p: 2 }}>
                        <Button 
                            onClick={handleEditClose}
                            variant="contained"
                            sx={{
                                bgcolor: '#f97316',
                                '&:hover': {
                                    bgcolor: '#ea580c',
                                },
                            }}
                        >
                            Close
                        </Button>
                    </DialogActions>
                </Dialog>

                <Toaster position="top-right" />
            </div>
        </ThemeProvider>
    );
};

export default ViewMentee;