"use client";
import { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  useMediaQuery,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  CircularProgress,
  Grid,
  Checkbox, // Add this import
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import MentorTable from "./MentorTable";
import FilterSection from "./MentorFilterSection";
import { Toaster,toast } from "react-hot-toast";
import { motion } from "framer-motion";
import axios from "axios";
import BulkUploadPreview from "../common/BulkUploadPreview";
import FilterListIcon from '@mui/icons-material/FilterList';

const dialogStyles = {
  paper: {
    background: 'rgba(17, 24, 39, 0.95)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(249, 115, 22, 0.15)',
    borderRadius: '24px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    color: 'white',
    maxWidth: '80vw', // Reduced from 90vw
    width: '700px', // Reduced from 800px
    maxHeight: '90vh',
    overflow: 'hidden',
  },
  title: {
    background: 'rgba(249, 115, 22, 0.05)',
    borderBottom: '1px solid rgba(249, 115, 22, 0.15)',
    padding: '20px 24px',
  },
  content: {
    padding: '24px',
  },
  form: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px',
    '& .full-width': {
      gridColumn: '1 / -1',
    },
  },
  textField: {
    '& .MuiOutlinedInput-root': {
      color: 'white',
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      backdropFilter: 'blur(10px)',
      borderRadius: '12px',
      transition: 'all 0.3s ease',
      '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        transform: 'translateY(-2px)',
      },
      '&.Mui-focused': {
        backgroundColor: 'rgba(249, 115, 22, 0.05)',
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: '#f97316',
          borderWidth: '2px',
        },
      },
    },
    '& .MuiInputLabel-root': {
      color: 'rgba(255, 255, 255, 0.7)',
      '&.Mui-focused': {
        color: '#f97316',
      },
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
  },
  section: {
    marginBottom: '24px',
  },
};

const MentorManagement = () => {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [mentorDetails, setMentorDetails] = useState({
    name: "",
    email: "",
    MUJid: "",
    phone_number: "",
    address: "",
    gender: "",
    profile_picture: "",
    role: ["mentor"],
    academicYear: "",
    academicSession: "",
  });
  const [editDialog, setEditDialog] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [tableVisible, setTableVisible] = useState(false);
  const [academicYear, setAcademicYear] = useState("");
  const [academicSession, setAcademicSession] = useState("");
  const [previewData, setPreviewData] = useState({ data: [], errors: [] });
  const [showPreview, setShowPreview] = useState(false);
  const [duplicateMentorDialog, setDuplicateMentorDialog] = useState(false);
  const [existingMentorData, setExistingMentorData] = useState({});
  const [duplicateEditMode, setDuplicateEditMode] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [yearSuggestions, setYearSuggestions] = useState([]);
  const [showYearOptions, setShowYearOptions] = useState(false);
  const [deleteRoleDialog, setDeleteRoleDialog] = useState({ open: false, mentor: null });
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [currentFilters, setCurrentFilters] = useState({
    academicYear: '',
    academicSession: '',
    MUJid: ''
  });
 
  const yearRef = useRef(null);

  const theme = createTheme({
    palette: {
      primary: {
        main: "#f97316",
      },
      secondary: {
        main: "#ea580c",
      },
    },
  });

  const isSmallScreen = useMediaQuery(theme.breakpoints.down("lg"));

  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    console.log("Preview Data:", previewData);
  }, [previewData]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (yearRef.current && !yearRef.current.contains(event.target)) {
        setShowYearOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleConfirmUpload = async () => {
    setUploading(true);
    try {
      const response = await axios.post("/api/admin/manageUsers/bulkUpload", {
        data: previewData.data,
        type: "mentor",
      });

      if (response.data && response.status === 201) {
        showAlert("Mentors uploaded successfully!", "success");
        setShowPreview(false);
        handleBulkUploadClose();
        await fetchMentors(); 
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "Error uploading mentors";
      showAlert(errorMessage, "error");
    } finally {
      setUploading(false);
    }
  };

  const validateForm = () => {
    const errors = [];
    if (!mentorDetails.MUJid) errors.push("MUJid is required");
    if (!mentorDetails.name) errors.push("Name is required");
    if (!mentorDetails.email) errors.push("Email is required");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mentorDetails.email))
      errors.push("Invalid email format");
    if (!mentorDetails.phone_number) errors.push("Phone number is required");
    if (!mentorDetails.academicYear) errors.push("Academic year is required");
    if (!mentorDetails.academicSession)
      errors.push("Academic session is required");
    return errors;
  };
  
  const handleAddMentor = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      toast.error(errors.join(", "), {
        style: toastStyles.error.style,
        iconTheme: toastStyles.error.iconTheme,
      });
      return;
    }

    try {
      const response = await axios.post(
        "/api/admin/manageUsers/manageMentor",
        mentorDetails
      );

      if (response.data && response.status === 201) {
        toast.success("Mentor added successfully", {
          style: toastStyles.success.style,
          iconTheme: toastStyles.success.iconTheme,
        });
        setOpenDialog(false);
        await fetchMentors(currentFilters);
        resetMentorDetails();
      }
    } catch (error) {
      if (
        error.response?.status === 409 &&
        error.response.data?.existingMentor
      ) {
        const duplicateData = error.response.data.existingMentor;

        // Verify data before setting
        if (duplicateData && duplicateData.MUJid) {
          setExistingMentorData(duplicateData);
          setDuplicateMentorDialog(true);
          setOpenDialog(false);
        } else {
          toast.error("Duplicate entry found but details are incomplete", {
            style: toastStyles.error.style,
            iconTheme: toastStyles.error.iconTheme,
          });
        }
      } else {
        toast.error(error.response?.data?.error || "Error adding mentor", {
          style: toastStyles.error.style,
          iconTheme: toastStyles.error.iconTheme,
        });
      }
    }
  };

  // Add a reset function for mentor details
  const resetMentorDetails = () => {
    setMentorDetails({
      name: "",
      email: "",
      MUJid: "",
      phone_number: "",
      address: "",
      gender: "",
      profile_picture: "",
      role: ["mentor"],
      academicYear: getCurrentAcademicYear(),
      academicSession: generateAcademicSessions(getCurrentAcademicYear())[0],
    });
  };


const handleEditMentor = async () => {
  try {
    const { ...updateData } = selectedMentor;
    const hasAdminRole = updateData.role.some(role => ['admin', 'superadmin'].includes(role));

    // First update the mentor record
    const response = await axios.patch(
      `/api/admin/manageUsers/manageMentor/${updateData.MUJid}`,
      updateData
    );

    if (hasAdminRole) {
      // Create/update admin record if admin role is present
      try {
        await axios.post('/api/admin/manageUsers/manageAdmin', {
          ...updateData,
          role: updateData.role.filter(role => ['admin', 'superadmin'].includes(role))
        });
      } catch (adminError) {
        // If admin already exists, update instead
        if (adminError.response?.status === 400) {
          await axios.patch(`/api/admin/manageUsers/manageAdmin/${updateData.MUJid}`, {
            ...updateData,
            role: updateData.role.filter(role => ['admin', 'superadmin'].includes(role))
          });
        }
      }
    }

    if (response.data) {
      toast.success("Mentor updated successfully", {
        style: toastStyles.success.style,
        iconTheme: toastStyles.success.iconTheme,
      });
      setEditDialog(false);
      await fetchMentors(currentFilters);
    }
  } catch (error) {
    toast.error(error.response?.data?.error || "Error updating mentor", {
      style: toastStyles.error.style,
      iconTheme: toastStyles.error.iconTheme,
    });
  }
};


  const handleDeleteMentor = async (MUJid) => {
    try {
      // First fetch the mentor's details to check roles
      const mentor = mentors.find(m => m.MUJid === MUJid);
      
      if (mentor && (mentor.role.includes('admin') || mentor.role.includes('superadmin'))) {
        // Show role selection dialog if mentor has admin roles
        setSelectedRoles(mentor.role);
        setDeleteRoleDialog({ open: true, mentor });
      } else {
        // Regular delete for non-admin mentors
        await axios.delete("/api/admin/manageUsers/manageMentor", {
          data: { MUJid, roles: ['mentor'] }
        });
        showAlert("Mentor deleted successfully", "success");
        fetchMentors(currentFilters);
      }
    } catch (error) {
      showAlert(error.response?.data?.error || "Error deleting mentor", "error");
    }
  };

  // Add this new function to handle role-based deletion
  const handleRoleBasedDelete = async () => {
    try {
      if (!deleteRoleDialog.mentor) return;
  
      await axios.delete("/api/admin/manageUsers/manageMentor", {
        data: { 
          MUJid: deleteRoleDialog.mentor.MUJid,
          roles: selectedRoles
        }
      });
      
      showAlert("Roles deleted successfully", "success");
      setDeleteRoleDialog({ open: false, mentor: null });
      setSelectedRoles([]);
      fetchMentors(currentFilters);
    } catch (error) {
      showAlert(error.response?.data?.error || "Error deleting roles", "error");
    }
  };

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
    const [startYear, endYear] = academicYear.split("-");
    return [`JULY-DECEMBER ${startYear}`, `JANUARY-JUNE ${endYear}`];
  };

  useEffect(() => {
    const currentAcadYear = getCurrentAcademicYear();
    const sessions = generateAcademicSessions(currentAcadYear);
    // setAcademicSessions(sessions);
    setMentorDetails((prev) => ({
      ...prev,
      academicYear: currentAcadYear,
      academicSession: sessions[0],
    }));
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "MUJid") {
      // Only update if the value is valid
      const formattedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (formattedValue !== value) {
        e.preventDefault();
        return;
      }
      setMentorDetails(prev => ({
        ...prev,
        [name]: formattedValue,
      }));
      return;
    }
  
    // Handle other inputs normally
    setMentorDetails(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedMentor((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toastStyles = {
    success: {
      style: {
        background: "#10B981",
        color: "#fff",
        padding: "16px",
        borderRadius: "8px",
        boxShadow:
          "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      },
      iconTheme: {
        primary: "#fff",
        secondary: "#10B981",
      },
    },
    error: {
      style: {
        background: "#EF4444",
        color: "#fff",
        padding: "16px",
        borderRadius: "8px",
        boxShadow:
          "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      },
      iconTheme: {
        primary: "#fff",
        secondary: "#EF4444",
      },
    },
  };

  const showAlert = (message, severity) => {
    const toastConfig = {
      style: toastStyles[severity].style,
      iconTheme: toastStyles[severity].iconTheme,
    };

    if (severity === "success") {
      toast.success(message, toastConfig);
    } else {
      toast.error(message, toastConfig);
    }
  };

  // Add these new helper functions
  const generateYearSuggestions = (input) => {
    if (!input) return [];
    const currentYear = new Date().getFullYear();
    const suggestions = [];
    for (let i = 0; i < 5; i++) {
      const year = currentYear - i;
      const academicYear = `${year}-${year + 1}`;
      if (academicYear.startsWith(input)) {
        suggestions.push(academicYear);
      }
    }
    return suggestions;
  };

  const handleAcademicYearInput = (e) => {
    const value = e?.target?.value || '';
    const upperValue = value.toUpperCase();
  
    // Don't update state during render, use useEffect instead
    setMentorDetails(prev => {
      const updates = {
        ...prev,
        academicYear: upperValue,
      };
  
      // Only update academicSession if we have a valid year
      if (validateAcademicYear(upperValue)) {
        const sessions = generateAcademicSessions(upperValue);
        updates.academicSession = sessions[0];
      } else if (!upperValue) {
        // Clear session if year is empty
        updates.academicSession = '';
      }
  
      return updates;
    });
  
    // Update suggestions outside of render
    setTimeout(() => {
      if (upperValue) {
        const suggestions = generateYearSuggestions(upperValue);
        setYearSuggestions(suggestions);
        setShowYearOptions(suggestions.length > 0);
      } else {
        setYearSuggestions([]);
        setShowYearOptions(false);
      }
    }, 0);
  };
  
  // Also update the validateAcademicYear function to be more defensive:
  const validateAcademicYear = (value) => {
    if (!value || typeof value !== 'string') return false;
    const regex = /^(\d{4})-(\d{4})$/;
    if (!regex.test(value)) return false;
    const [startYear, endYear] = value.split('-').map(Number);
    return !isNaN(startYear) && !isNaN(endYear) && endYear === startYear + 1;
  };
  

    const fetchMentors = async ({ academicYear = '', academicSession = '', MUJid = '' } = {}) => {
    setLoading(true);
    try {
      // Store current filters
      setCurrentFilters({ academicYear, academicSession, MUJid });

      // Build query parameters
      const params = new URLSearchParams();
      if (academicYear) params.append('academicYear', academicYear);
      if (academicSession) params.append('academicSession', academicSession);
      if (MUJid) params.append('MUJid', MUJid);

      const response = await axios.get(`/api/admin/manageUsers/manageMentor?${params}`);
      if (response.data && response.data.mentors) {
        setMentors(response.data.mentors);
        setTableVisible(true);
      }
    } catch (error) {
      showAlert(error.response?.data?.error || "Error fetching mentors", "error");
      setMentors([]);
      setTableVisible(false);
    } finally {
      setLoading(false);
    }
  };

  // Add this new function to handle patch update
  const handlePatchUpdate = async () => {
    if (!existingMentorData?.MUJid) {
      toast.error("Invalid mentor data", {
        style: toastStyles.error.style,
        iconTheme: toastStyles.error.iconTheme,
      });
      return;
    }

    try {
      const response = await axios.patch(
        `/api/admin/manageUsers/manageMentor/${existingMentorData.MUJid}`,
        mentorDetails
      );

      if (response.data) {
        toast.success("Mentor updated successfully", {
          style: toastStyles.success.style,
          iconTheme: toastStyles.success.iconTheme,
        });
        setDuplicateMentorDialog(false);
        setDuplicateEditMode(false);
        await fetchMentors(currentFilters);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Error updating mentor", {
        style: toastStyles.error.style,
        iconTheme: toastStyles.error.iconTheme,
      });
    }
  };

  const handleEditClick = (mentor) => {
    const {...mentorData } = mentor;
    setSelectedMentor({
      ...mentorData,
      role: Array.isArray(mentorData.role) ? mentorData.role : [mentorData.role],
      academicYear: mentorData.academicYear || getCurrentAcademicYear(),
      academicSession: mentorData.academicSession || generateAcademicSessions(getCurrentAcademicYear())[0],
    });
    setEditDialog(true);
  };
  // use to upload mentor data
  const handleBulkUpload = async (formData, onProgress) => {
    try {
      const previewResponse = await axios.post(
        "/api/admin/manageUsers/previewUpload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            if (onProgress) onProgress(percentCompleted);
          },
        }
      );

      setPreviewData(previewResponse.data);
      setShowPreview(true);
      return previewResponse;
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Error processing file",
        {
          style: toastStyles.error.style,
          iconTheme: toastStyles.error.iconTheme,
        }
      );
      throw error;
    }
  };

  useEffect(() => {
    let mounted = true;
  
    const handleYearChange = (value) => {
      if (!mounted) return;
      
      if (value) {
        const suggestions = generateYearSuggestions(value);
        setYearSuggestions(suggestions);
        setShowYearOptions(suggestions.length > 0);
      } else {
        setYearSuggestions([]);
        setShowYearOptions(false);
      }
    };
  
    // If mentorDetails.academicYear changes, update suggestions
    handleYearChange(mentorDetails.academicYear);
  
    return () => {
      mounted = false;
    };
  }, [mentorDetails.academicYear]);
  

  return (
    <ThemeProvider theme={theme}>
      <div className="fixed inset-0 bg-gray-900 text-white overflow-hidden">
        <Toaster 
          position="top-center" 
          containerStyle={{
            top: 100 // This will push the toast below the navbar
          }}
          toastOptions={{
            style: {
              background: 'rgba(17, 24, 39, 0.9)',
              color: '#fff',
              backdropFilter: 'blur(8px)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            },
          }}
        />
        {/* Background Effects */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-purple-500/10 to-blue-500/10 animate-gradient" />
          <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-orange-500/20 to-transparent blur-3xl" />
          <div className="absolute inset-0 backdrop-blur-3xl" />
        </div>

        {/* Main Content Container */}
        <div className="relative z-10 h-screen flex flex-col pt-[60px]">
          <div className="flex items-center justify-between px-4 lg:justify-center"> {/* Added lg:justify-center */}
            <motion.h1 
              className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-pink-500 mt-5 mb-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Mentor Management
            </motion.h1>


            {isSmallScreen && (
              <IconButton
                onClick={() => setShowFilters(!showFilters)}
                sx={{
                  color: '#f97316',
                  bgcolor: 'rgba(249, 115, 22, 0.1)',
                  '&:hover': {
                    bgcolor: 'rgba(249, 115, 22, 0.2)',
                  },
                }}
              >
                <FilterListIcon />
              </IconButton>
            )}
          </div>

          {/* Main Grid Layout */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-[250px,1fr] gap-3 p-3 h-[calc(100vh-100px)] lg:overflow-hidden overflow-auto">
            {/* Filter Panel */}
            <motion.div 
              className="lg:h-full max-w-full lg:max-w-[250px]"
              initial={false} // Add this to prevent initial animation
              animate={{
                height: showFilters ? 'auto' : 0,
                opacity: showFilters ? 1 : 0,
                marginBottom: showFilters ? '12px' : 0
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30
              }}
              style={{
                overflow: showFilters ? 'visible' : 'hidden', // Change to visible when shown
                display: showFilters ? 'block' : 'none'
              }}
            >
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-4 h-full">
                <FilterSection 
                  filters={{
                    academicYear,
                    academicSession,
                  }}
                  onFilterChange={(name, value) => {
                    switch (name) {
                      case "academicYear":
                        setAcademicYear(value);
                        break;
                      case "academicSession":
                        setAcademicSession(value);
                        break;
                    }
                  }}
                  onSearch={({ academicYear, academicSession, MUJid }) => {
                    fetchMentors({ academicYear, academicSession, MUJid });
                  }}
                  onAddNew={() => setOpenDialog(true)}
                  onDelete={handleDeleteMentor}
                  mentors={mentors}
                  onBulkUpload={handleBulkUpload}
                />
              </div>
            </motion.div>

            {/* Right Column - Table */}
            <motion.div
              className="h-auto lg:h-full min-w-0" // Updated height
              animate={{
                gridColumn: (!showFilters && isSmallScreen) ? 'span 2' : 'auto'
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30
              }}
            >
              <div className="bg-gradient-to-br from-orange-500/5 via-orange-500/10 to-transparent backdrop-blur-xl rounded-3xl border border-orange-500/20 h-full">
                <div className="h-full flex flex-col p-4 pb-2"> {/* Added pb-2 for pagination */}
                  {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                      <CircularProgress sx={{ color: "#f97316" }} />
                    </div>
                  ) : mentors.length > 0 ? (
                    <div className="h-full"> {/* Removed overflow-hidden */}
                      <MentorTable 
                        mentors={mentors}
                        onEditClick={handleEditClick}
                        onDeleteClick={handleDeleteMentor}
                        isSmallScreen={isSmallScreen}
                        onDataUpdate={(updatedMentors) => setMentors(updatedMentors)}
                      />
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                        {tableVisible ? 'No mentors found' : 'Use the filters to search for mentors'}
                      </Typography>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Keep existing dialogs */}
        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{ 
            sx: {
              ...dialogStyles.paper,
              maxHeight: '90vh', // Ensure dialog doesn't exceed viewport height
            }
          }}
        >
          <DialogTitle sx={dialogStyles.title}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4ZM13 8V11H16V13H13V16H11V13H8V11H11V8H13Z" 
                  fill="#f97316"/>
              </svg>
              <Typography variant="h6" sx={{ 
                color: '#f97316',
                fontWeight: 600,
                letterSpacing: '0.5px',
                fontSize: '1.25rem'
              }}>
                Add New Mentor
              </Typography>
            </Box>
            <IconButton
              onClick={() => setOpenDialog(false)}
              sx={{
                position: 'absolute',
                right: '16px',
                top: '16px',
                color: 'rgba(255, 255, 255, 0.5)',
                '&:hover': { color: '#f97316' },
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent 
            sx={{
              ...dialogStyles.content,
              padding: '24px',
              overflowY: 'auto',
              marginTop: 2,
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
            }}
          >
            <Box 
              sx={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                width: '100%',
                mt: 1,
              }}
            >
              <Grid container spacing={3}>
                {/* Academic Year */}
                <Grid item xs={12} md={6}>
                  <Box ref={yearRef} sx={{ position: 'relative', width: '100%' }}>
                    <TextField
                      fullWidth
                      label="Academic Year"
                      name="academicYear"
                      value={mentorDetails.academicYear}
                      onChange={handleAcademicYearInput}
                      onClick={() => setShowYearOptions(true)}
                      required
                      sx={dialogStyles.textField}
                      inputProps={{
                        pattern: "\\d{4}-\\d{4}",
                        title: "Format: YYYY-YYYY (e.g., 2023-2024)"
                      }}
                    />
                    {showYearOptions && yearSuggestions.length > 0 && (
                      <Box sx={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 1000,
                        mt: 1,
                        bgcolor: 'rgba(17, 24, 39, 0.95)',
                        borderRadius: '8px',
                        border: '1px solid rgba(249, 115, 22, 0.15)',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                        maxHeight: '200px',
                        overflowY: 'auto'
                      }}>
                        {yearSuggestions.map((year) => (
                          <Box
                            key={year}
                            sx={{
                              px: 2,
                              py: 1,
                              cursor: 'pointer',
                              '&:hover': {
                                bgcolor: 'rgba(249, 115, 22, 0.1)',
                              }
                            }}
                            onClick={() => {
                              setMentorDetails(prev => ({
                                ...prev,
                                academicYear: year,
                                academicSession: generateAcademicSessions(year)[0]
                              }));
                              setShowYearOptions(false);
                            }}
                          >
                            {year}
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                </Grid>

                {/* Academic Session */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    select
                    label="Academic Session"
                    name="academicSession"
                    value={mentorDetails.academicSession}
                    onChange={handleInputChange}
                    required
                    disabled={!mentorDetails.academicYear}
                    sx={dialogStyles.textField}
                  >
                    {mentorDetails.academicYear ? 
                      generateAcademicSessions(mentorDetails.academicYear).map((session) => (
                        <MenuItem key={session} value={session}>
                          {session}
                        </MenuItem>
                      )) : 
                      <MenuItem value="">Select year first</MenuItem>
                    }
                  </TextField>
                </Grid>

                {/* MUJid */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="MUJid"
                    name="MUJid"
                    value={mentorDetails.MUJid}
                    onChange={handleInputChange}
                    required
                    sx={dialogStyles.textField}
                    inputProps={{
                      style: { textTransform: 'uppercase' }
                    }}
                    placeholder="Enter MUJid"
                  />
                </Grid>

                {/* Name */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Name"
                    name="name"
                    value={mentorDetails.name}
                    onChange={handleInputChange}
                    required
                    sx={dialogStyles.textField}
                  />
                </Grid>

                {/* Email */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={mentorDetails.email}
                    onChange={handleInputChange}
                    required
                    sx={dialogStyles.textField}
                  />
                </Grid>

                {/* Phone Number */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phone_number"
                    value={mentorDetails.phone_number}
                    onChange={handleInputChange}
                    required
                    sx={dialogStyles.textField}
                  />
                </Grid>

                {/* Gender */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    select
                    label="Gender"
                    name="gender"
                    value={mentorDetails.gender}
                    onChange={handleInputChange}
                    sx={dialogStyles.textField}
                  >
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </TextField>
                </Grid>

                {/* Role */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    select
                    label="Role"
                    name="role"
                    value={mentorDetails.role}
                    onChange={handleInputChange}
                    SelectProps={{ multiple: true }}
                    sx={dialogStyles.textField}
                  >
                    <MenuItem value="mentor">Mentor</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="superadmin">Super Admin</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>

          <DialogActions sx={{
            padding: '16px 24px',
            borderTop: '1px solid rgba(249, 115, 22, 0.15)',
            background: 'rgba(249, 115, 22, 0.05)',
            gap: '12px',
          }}>
            <Button
              onClick={() => setOpenDialog(false)}
              variant="outlined"
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddMentor}
              variant="contained"
              sx={{
                background: 'linear-gradient(45deg, #f97316 30%, #fb923c 90%)',
                color: 'white',
                fontWeight: 600,
                padding: '8px 24px',
                '&:hover': {
                  background: 'linear-gradient(45deg, #ea580c 30%, #f97316 90%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(249, 115, 22, 0.25)',
                },
              }}
            >
              Add Mentor
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog
          open={editDialog}
          onClose={() => setEditDialog(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{ 
            sx: {
              ...dialogStyles.paper,
              maxHeight: '90vh', // Ensure dialog doesn't exceed viewport height
            }
          }}
        >
          <DialogTitle sx={dialogStyles.title}>
            <Typography
              variant="h6"
              component="div"
              sx={{ color: "#f97316", fontWeight: 600 }}
            >
              Edit Mentor
            </Typography>
            <IconButton
              aria-label="close"
              onClick={() => setEditDialog(false)}
              sx={{
                position: "absolute",
                right: 8,
                top: 8,
                color: "rgba(255, 255, 255, 0.7)",
                "&:hover": {
                  color: "#f97316",
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent 
            sx={{
              ...dialogStyles.content,
              padding: '24px',
              overflowY: 'auto', // Enable vertical scrolling
              marginTop: 2, // Add margin top to the content
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
            }}
          >
            <Box 
              sx={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                width: '100%',
                mt: 1, // Add margin top to the Box container
              }}
            >
              {/* Replace the nested Box structure with a simple Grid */}
              <Grid container spacing={3}> {/* Increased spacing between grid items */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="MUJid"
                    name="MUJid"
                    value={selectedMentor?.MUJid || ""}
                    onChange={handleEditInputChange}
                    required
                    sx={dialogStyles.textField}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Name"
                    name="name"
                    value={selectedMentor?.name || ""}
                    onChange={handleEditInputChange}
                    required
                    sx={dialogStyles.textField}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={selectedMentor?.email || ""}
                    onChange={handleEditInputChange}
                    required
                    sx={dialogStyles.textField}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phone_number"
                    value={selectedMentor?.phone_number || ""}
                    onChange={handleEditInputChange}
                    required
                    sx={dialogStyles.textField}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    select
                    label="Gender"
                    name="gender"
                    value={selectedMentor?.gender || ""}
                    onChange={handleEditInputChange}
                    sx={dialogStyles.textField}
                  >
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    select
                    label="Role"
                    name="role"
                    value={selectedMentor?.role || []}
                    onChange={handleEditInputChange}
                    SelectProps={{ multiple: true }}
                    sx={dialogStyles.textField}
                  >
                    <MenuItem value="mentor">Mentor</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="superadmin">Super Admin</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Academic Year"
                    name="academicYear"
                    value={selectedMentor?.academicYear || ""}
                    onChange={handleEditInputChange}
                    required
                    sx={dialogStyles.textField}
                    inputProps={{
                      pattern: "\\d{4}-\\d{4}",
                      title: "Format: YYYY-YYYY (e.g., 2023-2024)"
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    select
                    label="Academic Session"
                    name="academicSession"
                    value={selectedMentor?.academicSession || ""}
                    onChange={handleEditInputChange}
                    required
                    disabled={!selectedMentor?.academicYear}
                    sx={dialogStyles.textField}
                  >
                    {selectedMentor?.academicYear ? 
                      [
                        `JULY-DECEMBER ${selectedMentor.academicYear.split('-')[0]}`,
                        `JANUARY-JUNE ${selectedMentor.academicYear.split('-')[1]}`
                      ].map((session) => (
                        <MenuItem key={session} value={session}>
                          {session}
                        </MenuItem>
                      )) :
                      <MenuItem value="">Select year first</MenuItem>
                    }
                  </TextField>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions sx={{
            ...dialogStyles.actions,
            padding: '16px 24px',
            borderTop: '1px solid rgba(249, 115, 22, 0.15)',
            background: 'rgba(249, 115, 22, 0.05)',
          }}>
            <Button
              onClick={() => setEditDialog(false)}
              variant="outlined"
              sx={{
                borderColor: "rgba(255, 255, 255, 0.2)",
                color: "white",
                "&:hover": {
                  borderColor: "rgba(255, 255, 255, 0.5)",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditMentor}
              variant="contained"
              sx={{
                bgcolor: "#f97316",
                "&:hover": {
                  bgcolor: "#ea580c",
                },
              }}
            >
              Update
            </Button>
          </DialogActions>
        </Dialog>
        <BulkUploadPreview
          open={showPreview}
          onClose={() => setShowPreview(false)}
          data={previewData.data}
          errors={previewData.errors}
          onConfirm={handleConfirmUpload}
          isUploading={uploading}
          type="mentor" // Specify the type as mentor
        />

        {/* Duplicate Mentor Dialog */}
        <Dialog
          open={duplicateMentorDialog}
          onClose={() => {
            setDuplicateMentorDialog(false);
            setDuplicateEditMode(false);
          }}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: dialogStyles.paper }}
        >
          <DialogTitle
            sx={{
              ...dialogStyles.title,
              borderBottom: "1px solid rgba(249, 115, 22, 0.2)",
            }}
          >
            <Typography
              variant="h6"
              component="div"
              sx={{ color: "#f97316", fontWeight: 600 }}
            >
              {duplicateEditMode
                ? "Edit Existing Mentor"
                : "Mentor Already Exists"}
            </Typography>
            <IconButton
              aria-label="close"
              onClick={() => {
                setDuplicateMentorDialog(false);
                setDuplicateEditMode(false);
              }}
              sx={{
                position: "absolute",
                right: 8,
                top: 8,
                color: "rgba(255, 255, 255, 0.7)",
                "&:hover": { color: "#f97316" },
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent
            sx={{
              ...dialogStyles.content,
              my: 2,
            }}
          >
            {duplicateEditMode ? (
              // Edit form for duplicate mentor
              <Box sx={{ color: "white" }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Name"
                      name="name"
                      value={mentorDetails.name}
                      onChange={handleInputChange}
                      sx={dialogStyles.textField}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      type="email"
                      value={mentorDetails.email}
                      onChange={handleInputChange}
                      sx={dialogStyles.textField}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      name="phone_number"
                      value={mentorDetails.phone_number}
                      onChange={handleInputChange}
                      sx={dialogStyles.textField}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      select
                      label="Gender"
                      name="gender"
                      value={mentorDetails.gender}
                      onChange={handleInputChange}
                      sx={dialogStyles.textField}
                    >
                      <MenuItem value="male">Male</MenuItem>
                      <MenuItem value="female">Female</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>
              </Box>
            ) : (
              // Existing mentor details view
              <Box sx={{ color: "white" }}>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  A mentor with these details already exists:
                </Typography>
                <Box
                  sx={{
                    bgcolor: "rgba(255, 255, 255, 0.05)",
                    p: 3,
                    borderRadius: 2,
                    border: "1px solid rgba(249, 115, 22, 0.2)",
                  }}
                >
                  {/* Only render fields that exist in existingMentorData */}
                  {Object.entries(existingMentorData).map(([key, value]) => {
                    if (value && key !== "_id") {
                      return (
                        <Typography key={key} variant="body2" sx={{ mb: 1 }}>
                          <strong>{key}:</strong>{" "}
                          {Array.isArray(value) ? value.join(", ") : value}
                        </Typography>
                      );
                    }
                    return null;
                  })}
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions
            sx={{
              ...dialogStyles.actions,
              justifyContent: "space-between",
              px: 3,
              py: 2,
            }}
          >
            <Button
              onClick={() => {
                setDuplicateMentorDialog(false);
                setDuplicateEditMode(false);
              }}
              variant="outlined"
              sx={{
                borderColor: "rgba(255, 255, 255, 0.2)",
                color: "white",
                "&:hover": {
                  borderColor: "rgba(255, 255, 255, 0.5)",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                },
              }}
            >
              Cancel
            </Button>
            {duplicateEditMode ? (
              <Button
                onClick={handlePatchUpdate}
                variant="contained"
                sx={{
                  bgcolor: "#f97316",
                  "&:hover": {
                    bgcolor: "#ea580c",
                  },
                }}
              >
                Update
              </Button>
            ) : (
              <Button
                onClick={() => setDuplicateEditMode(true)}
                variant="contained"
                sx={{
                  bgcolor: "#f97316",
                  "&:hover": {
                    bgcolor: "#ea580c",
                  },
                }}
              >
                Edit Details
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Role Deletion Dialog */}
        <Dialog
          open={deleteRoleDialog.open}
          onClose={() => setDeleteRoleDialog({ open: false, mentor: null })}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: dialogStyles.paper }}
        >
          <DialogTitle
            sx={{
              ...dialogStyles.title,
              borderBottom: "1px solid rgba(249, 115, 22, 0.2)",
            }}
          >
            <Typography
              variant="h6"
              component="div"
              sx={{ color: "#f97316", fontWeight: 600 }}
            >
              Confirm Role Deletion
            </Typography>
            <IconButton
              aria-label="close"
              onClick={() => setDeleteRoleDialog({ open: false, mentor: null })}
              sx={{
                position: "absolute",
                right: 8,
                top: 8,
                color: "rgba(255, 255, 255, 0.7)",
                "&:hover": { color: "#f97316" },
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent
            sx={{
              ...dialogStyles.content,
              my: 2,
            }}
          >
            <Typography variant="body1" sx={{ mb: 2 }}>
              The mentor has the following roles. Please select the roles you want to delete:
            </Typography>
            <Box sx={{ color: "white" }}>
              {deleteRoleDialog.mentor?.role.map((role) => (
                <Box key={role} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Checkbox
                    checked={selectedRoles.includes(role)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRoles((prev) => [...prev, role]);
                      } else {
                        setSelectedRoles((prev) => prev.filter((r) => r !== role));
                      }
                    }}
                    sx={{
                      color: 'rgba(255, 255, 255, 0.7)',
                      '&.Mui-checked': {
                        color: '#f97316',
                      },
                    }}
                  />
                  <Typography variant="body2">{role}</Typography>
                </Box>
              ))}
            </Box>
          </DialogContent>
          <DialogActions
            sx={{
              ...dialogStyles.actions,
              justifyContent: "space-between",
              px: 3,
              py: 2,
            }}
          >
            <Button
              onClick={() => setDeleteRoleDialog({ open: false, mentor: null })}
              variant="outlined"
              sx={{
                borderColor: "rgba(255, 255, 255, 0.2)",
                color: "white",
                "&:hover": {
                  borderColor: "rgba(255, 255, 255, 0.5)",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRoleBasedDelete}
              variant="contained"
              sx={{
                bgcolor: "#f97316",
                "&:hover": {
                  bgcolor: "#ea580c",
                },
              }}
            >
              Delete Selected Roles
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </ThemeProvider>
  );
};

export default MentorManagement;
