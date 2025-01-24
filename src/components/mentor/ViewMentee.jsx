"use client"
import React, { useState, useEffect } from 'react';
import {Grid2, Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, IconButton, CircularProgress } from '@mui/material'; 
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import Navbar from '@/components/subComponents/Navbar';
import axios from 'axios';
import toast from 'react-hot-toast';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { DataGrid } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';

const ViewMentee = () => {
    const [mentees, setMentees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedMentee, setSelectedMentee] = useState(null);
    const [editDialog, setEditDialog] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedMentee, setEditedMentee] = useState(null);
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredMentees, setFilteredMentees] = useState([]);

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

    // useEffect(() => {
    //     setMounted(true);
    // }, []);

    useEffect(() => {
        setMounted(true);
        try {
            // Get mentor data and meeting data from session storage
            const storedMeetingData = sessionStorage.getItem("meetingData");
            if (storedMeetingData) {
                const meetings = JSON.parse(storedMeetingData);
                
                // Extract unique mentees from all meetings
                const allMentees = meetings.reduce((acc, meeting) => {
                    if (meeting.menteeDetails) {
                        meeting.menteeDetails.forEach(mentee => {
                            if (!acc.find(m => m.MUJid === mentee.MUJid)) {
                                acc.push(mentee);
                            }
                        });
                    }
                    return acc;
                }, []);

                setMentees(allMentees);
                setLoading(false);
            } else {
                toast.error('No meeting data found');
                setMentees([]);
            }
        } catch (error) {
            console.error('Error loading mentee data:', error);
            toast.error('Error loading mentee data');
            setMentees([]);
        }
    }, []);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredMentees(mentees);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = mentees.filter(mentee => 
            mentee.name?.toLowerCase().includes(query) ||
            mentee.MUJid?.toLowerCase().includes(query) ||
            mentee.email?.toLowerCase().includes(query) ||
            mentee.phone?.includes(query) ||
            mentee.section?.toLowerCase().includes(query) ||
            String(mentee.semester)?.includes(query)
        );
        setFilteredMentees(filtered);
    }, [searchQuery, mentees]);

    useEffect(() => {
        setFilteredMentees(mentees);
    }, [mentees]);

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
        setEditedMentee({
            ...selectedMentee,
            address: selectedMentee.address || '',
            email: selectedMentee.email || '',
            section: selectedMentee.section || '',
            semester: selectedMentee.semester || '',
            yearOfRegistration: selectedMentee.yearOfRegistration || '',
            academicSession: selectedMentee.academicSession || '',
            academicYear: selectedMentee.academicYear || '',
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
            const mentorData = JSON.parse(sessionStorage.getItem('mentorData'));
            if (!mentorData?.email) {
                toast.error('Mentor email not found');
                return;
            }

            setLoading(true);
            
            const updateData = {
                ...editedMentee,
                MUJid: selectedMentee.MUJid
            };
            
            const response = await axios.put('/api/mentor/manageMentee', 
                updateData,
                {
                    headers: {
                        'mentor-email': mentorData.email
                    }
                }
            );
            
            if (response.data.success) {
                // Update mentee in local state
                setMentees(prev => prev.map(m => 
                    m.MUJid === editedMentee.MUJid ? editedMentee : m
                ));

                // Update mentee in session storage
                const meetingData = JSON.parse(sessionStorage.getItem('meetingData') || '[]');
                const updatedMeetingData = meetingData.map(meeting => ({
                    ...meeting,
                    menteeDetails: meeting.menteeDetails?.map(mentee => 
                        mentee.MUJid === editedMentee.MUJid ? editedMentee : mentee
                    )
                }));
                sessionStorage.setItem('meetingData', JSON.stringify(updatedMeetingData));

                toast.success('Mentee details updated successfully');
                setIsEditing(false);
                handleEditClose();
            }
        } catch (error) {
            console.error('Error updating mentee:', error);
            toast.error(error.response?.data?.message || 'Error updating mentee');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { 
            field: 'MUJid', 
            headerName: 'MUJ ID', 
            flex: 1,
            headerClassName: 'super-app-theme--header',
            headerAlign: 'center',
            align: 'center',
        },
        { 
            field: 'name', 
            headerName: 'Name', 
            flex: 1.2,
            headerClassName: 'super-app-theme--header',
            headerAlign: 'center',
            align: 'center',
        },
        { 
            field: 'email', 
            headerName: 'Email', 
            flex: 1.5,
            headerClassName: 'super-app-theme--header',
            headerAlign: 'center',
            align: 'center',
        },
        { 
            field: 'phone', 
            headerName: 'Phone', 
            flex: 1,
            headerClassName: 'super-app-theme--header',
            headerAlign: 'center',
            align: 'center',
        },
        { 
            field: 'section', 
            headerName: 'Section', 
            flex: 0.8,
            headerClassName: 'super-app-theme--header',
            headerAlign: 'center',
            align: 'center',
        },
        { 
            field: 'semester', 
            headerName: 'Semester', 
            flex: 0.8,
            headerClassName: 'super-app-theme--header',
            headerAlign: 'center',
            align: 'center',
        },
        {
            field: 'actions',
            headerName: 'Actions',
            flex: 0.7,
            headerClassName: 'super-app-theme--header',
            headerAlign: 'center',
            align: 'center',
            renderCell: (params) => (
                <Box sx={{ 
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <IconButton
                        onClick={() => handleEditClick(params.row)}
                        sx={{ 
                            color: '#f97316',
                            '&:hover': { bgcolor: 'rgba(249, 115, 22, 0.1)' }
                        }}
                    >
                        <EditIcon />
                    </IconButton>
                </Box>
            ),
        },
    ];


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
                        <Box sx={{ mb: 3 }}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                placeholder="Search mentees by name, ID, email, phone, section, or semester..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <SearchIcon sx={{ 
                                            mr: 1, 
                                            color: 'rgba(255, 255, 255, 0.7)'
                                        }} />
                                    ),
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '1rem',
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        backdropFilter: 'blur(10px)',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                        },
                                        '&.Mui-focused': {
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        }
                                    }
                                }}
                            />
                        </Box>
                        <Box sx={{ 
                            overflowX: 'auto',
                            minHeight: '400px',
                            height: 'calc(100vh - 250px)', // Adjusted height
                            overflowY: 'auto'
                        }}>
                            {loading ? (
                                <Box sx={{ 
                                    display: 'flex', 
                                    justifyContent: 'center', 
                                    alignItems: 'center', 
                                    height: '400px',
                                    flexDirection: 'column',
                                    gap: 2
                                }}>
                                    <CircularProgress sx={{ color: '#f97316' }} />
                                    <Typography sx={{ color: 'white', opacity: 0.7 }}>
                                        Loading mentees...
                                    </Typography>
                                </Box>
                            ) : filteredMentees.length > 0 ? (
                                <DataGrid
                                    rows={filteredMentees}
                                    columns={columns}
                                    getRowId={(row) => row.MUJid}
                                    disableRowSelectionOnClick
                                    disableSelectionOnClick={true}
                                    disableColumnMenu={true}
                                    disableColumnFilter={false}
                                    // totalRows={mentees.length}
                                    pageSizeOptions={[5, 10, 25, 50]}
                                    initialState={{
                                        pagination: { paginationModel: { pageSize: 10 } },
                                    }}
                                    sx={{
                                        height: '100%', // Fill available height
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        color: 'white',
                                        '& .MuiDataGrid-cell': {
                                            borderColor: 'rgba(255, 255, 255, 0.1)',
                                        },
                                        '& .MuiDataGrid-columnHeaders': {
                                            backgroundColor: 'rgba(10, 10, 10, 0.9)',
                                            color: '#f97316',
                                            fontWeight: 'bold',
                                            borderColor: 'rgba(255, 255, 255, 0.1)',
                                        },
                                        '& .MuiDataGrid-footerContainer': {
                                            backgroundColor: 'rgba(0, 0, 0, 0.2)',
                                            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                                            minHeight: '56px', // Increased footer height
                                            padding: '8px 0', // Added padding
                                        },
                                        '& .MuiDataGrid-row:hover': {
                                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        },
                                        '& .MuiDataGrid-menuIcon': {
                                            color: 'white',
                                        },
                                        '& .MuiDataGrid-sortIcon': {
                                            color: 'white',
                                        },
                                        '& .MuiDataGrid-pagination': {
                                            color: 'white',
                                        },
                                        '& .MuiTablePagination-root': {
                                            color: 'white',
                                        },
                                        '& .MuiTablePagination-select': {
                                            color: 'white',
                                        },
                                        '& .MuiTablePagination-selectIcon': {
                                            color: 'white',
                                        },
                                        '& .MuiIconButton-root': {
                                            color: 'white',
                                        },
                                    }}
                                    className="custom-scrollbar"
                                />
                            ) : (
                                <Box sx={{ 
                                    p: 4, 
                                    textAlign: 'center', 
                                    color: 'white',
                                    backdropFilter: 'blur(8px)',
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    borderRadius: '1rem',
                                    border: '1px solid rgba(255, 255, 255, 0.1)'
                                }}>
                                    <Typography variant="h6" sx={{ mb: 2, color: '#f97316' }}>
                                        No Mentees Found
                                    </Typography>
                                    <Typography sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.7)' }}>
                                        Try adjusting your filters or add new mentees
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                        Academic Year: {JSON.parse(sessionStorage.getItem('mentorData'))?.academicYear || 'N/A'}<br />
                                        Session: {JSON.parse(sessionStorage.getItem('mentorData'))?.academicSession || 'N/A'}
                                    </Typography>
                                </Box>
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
                            <Grid2 container spacing={3}>
                                {/* Personal Information */}
                                <Grid2 xs={12} md={6}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <Typography variant="subtitle2" color="#f97316">
                                            Personal Information
                                        </Typography>
                                        <TextField
                                            label="MUJ ID"
                                            name="MUJid"
                                            value={isEditing ? editedMentee.MUJid : selectedMentee.MUJid}
                                            disabled={true}
                                            fullWidth
                                        />
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
                                        <TextField
                                            label="Email"
                                            name="email"
                                            value={isEditing ? editedMentee.email : selectedMentee.email}
                                            onChange={handleInputChange}
                                            disabled={!isEditing}
                                            fullWidth
                                        />
                                    </Box>
                                </Grid2>

                                {/* Academic Information */}
                                <Grid2 xs={12} md={6}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <Typography variant="subtitle2" color="#f97316">
                                            Academic Information
                                        </Typography>
                                        <TextField
                                            label="Section"
                                            name="section"
                                            value={isEditing ? editedMentee.section : selectedMentee.section}
                                            onChange={handleInputChange}
                                            disabled={!isEditing}
                                            fullWidth
                                        />
                                        <TextField
                                            label="Semester"
                                            name="semester"
                                            type="number"
                                            value={isEditing ? editedMentee.semester : selectedMentee.semester}
                                            onChange={handleInputChange}
                                            disabled={!isEditing}
                                            fullWidth
                                        />
                                        <TextField
                                            label="Academic Session"
                                            name="academicSession"
                                            value={isEditing ? editedMentee.academicSession : selectedMentee.academicSession}
                                            disabled={true}
                                            fullWidth
                                        />
                                        <TextField
                                            label="Academic Year"
                                            name="academicYear"
                                            value={isEditing ? editedMentee.academicYear : selectedMentee.academicYear}
                                            disabled={true}
                                            fullWidth
                                        />
                                    </Box>
                                </Grid2>

                                {/* Father's Details */}
                                <Grid2 xs={12} md={6}>
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
                                </Grid2>

                                {/* Mother's Details */}
                                <Grid2 xs={12} md={6}>
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
                                            disabled={!isEditing}
                                            fullWidth
                                        />
                                    </Box>
                                </Grid2>

                                {/* Guardian's Details */}
                                <Grid2 xs={12} md={6}>
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
                                </Grid2>
                            </Grid2>
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