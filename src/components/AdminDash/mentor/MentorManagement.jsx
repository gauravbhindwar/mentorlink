"use client";
import { useState, useEffect} from "react";
import {
  Typography,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
} from "@mui/material";
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import { createTheme, ThemeProvider } from "@mui/material/styles";
import DeleteIcon from '@mui/icons-material/Delete'; // Add this import
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import { Toaster, toast } from "react-hot-toast";
import { motion } from "framer-motion";
import axios from "axios";
import MentorTable from "./MentorTable";
import MentorFilterSection from "./MentorFilterSection";  // Update import name
import AddMentorDialog from "./mentorSubComponents/AddMentorDialog";
import EditMentorDialog from "./mentorSubComponents/EditMentorDialog";
import DuplicateMentorDialog from "./mentorSubComponents/DuplicateMentorDialog";
import RoleDeletionDialog from "./mentorSubComponents/RoleDeletionDialog";
import { toastStyles } from './mentorStyle';
import { 
  determineAcademicPeriod,
  generateAcademicSessions,
  getCurrentAcademicYear 
} from './utils/academicUtils';
import MentorSkeleton from "./MentorSkeleton";

// Add these imports at the top
import dynamic from 'next/dynamic';
import noData from '@/assets/animations/noData.json';
import MentorCard from '@/components/mentor/MentorCard';
import MentorCardSkeleton from './MentorCardSkeleton';
import Pagination from '@mui/material/Pagination';
import MentorDetailsDialog from './MentorDetailsDialog';

// Add this after the imports
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

// Add this new component at the top level of the file
const EmailConflictDialog = ({ open, onClose, conflictingMentor }) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle sx={{ backgroundColor: 'rgb(17, 24, 39)', color: 'white' }}>
        Email Already in Use
      </DialogTitle>
      <DialogContent sx={{ backgroundColor: 'rgb(17, 24, 39)', color: 'white', pt: 2 }}>
        <Typography>
          This email is already associated with another mentor:
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Typography>Name: {conflictingMentor?.name}</Typography>
          <Typography>Email: {conflictingMentor?.email}</Typography>
          <Typography>MUJID: {conflictingMentor?.MUJid}</Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ backgroundColor: 'rgb(17, 24, 39)', color: 'white' }}>
        <Button onClick={onClose} sx={{ color: 'white' }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const MentorManagement = () => {
  // Add mounted state near the top with other state declarations
  const [mounted, setMounted] = useState(false);
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
  const [searchingMentor, setSearchingMentor] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState({
    name: "",
    email: "",
    MUJid: "",
    phone_number: "",
    role: ["mentor"],
    isActive: true,
    academicYear: "",
    academicSession: "",
  });
  const [tableVisible, setTableVisible] = useState(false);
  const [academicYear, setAcademicYear] = useState("");
  const [academicSession, setAcademicSession] = useState("");
  // const [previewData, setPreviewData] = useState({ data: [], errors: [] });
  // const [showPreview, setShowPreview] = useState(false);
  const [duplicateMentorDialog, setDuplicateMentorDialog] = useState(false);
  const [existingMentorData, setExistingMentorData] = useState({});
  const [duplicateEditMode, setDuplicateEditMode] = useState(false);
  const [deleteRoleDialog, setDeleteRoleDialog] = useState({ open: false, mentor: null });
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [currentFilters, setCurrentFilters] = useState({
    academicYear: '',
    academicSession: '',
    MUJid: ''
  });
  // Add new state for email conflict dialog
  const [emailConflict, setEmailConflict] = useState({ open: false, mentor: null });
  const [expandedCard, setExpandedCard] = useState(null);
  const [page, setPage] = useState(1);
  const cardsPerPage = 5;

  // Add this new state inside MentorManagement component, near other state declarations
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    mentor: null,
    isMobile: false
  });

  // Add these new states near other state declarations
  const [detailsDialog, setDetailsDialog] = useState({ open: false, mentor: null });
  const [transferDialog, setTransferDialog] = useState({ open: false, fromMentor: null });
  const [transferEmail, setTransferEmail] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState('');
  const [targetMentor, setTargetMentor] = useState(null);
  const [menteeStats, setMenteeStats] = useState(null);
  // const [selectedSemester, setSelectedSemester] = useState(null);
  // const [semesterMentees, setSemesterMentees] = useState([]);
  // const [loadingMentees, setLoadingMentees] = useState(false);

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
      academicYear: "", // Will be set by dialog when opened
      academicSession: "", // Will be set by dialog when opened
    });
  };


const handleEditMentor = async (updatedMentor) => {
  try {
    const response = await axios.patch(
      `/api/admin/manageUsers/editMentor/${updatedMentor.MUJid}`,
      updatedMentor
    );
    
    if (response.data.success) {
      setMentors(prev => prev.map(mentor => 
        mentor.MUJid === updatedMentor.MUJid ? updatedMentor : mentor
      ));
      // Remove extra fetch since we already updated the state
      setEditDialog(false);
      // Show single toast notification
      // showAlert("Mentor updated successfully", "success");
    }
  } catch (error) {
    if (error.response?.status === 409) {
      setEmailConflict({
        open: true,
        mentor: error.response.data.conflictingMentor
      });
    } else {
      showAlert(error.response?.data?.error || "Error updating mentor", "error");
    }
  }
};


  const handleDeleteMentor = async (MUJid) => {
    const mentor = mentors.find(m => m.MUJid === MUJid);
    
    // On desktop, show role selection dialog for admin/superadmin
    if (!isSmallScreen && mentor && (mentor.role.includes('admin') || mentor.role.includes('superadmin'))) {
      setSelectedRoles(mentor.role);
      setDeleteRoleDialog({ open: true, mentor });
    } else {
      // For mobile or non-admin mentors, show delete confirmation
      setDeleteConfirm({
        open: true,
        mentor,
        isMobile: isSmallScreen
      });
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

  // const handleInputChange = (e) => {
  //   const { name, value } = e.target;
    
  //   if (name === "MUJid") {
  //     // Only update if the value is valid
  //     const formattedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  //     if (formattedValue !== value) {
  //       e.preventDefault();
  //       return;
  //     }
  //     setMentorDetails(prev => ({
  //       ...prev,
  //       [name]: formattedValue,
  //     }));
  //     return;
  //   }
  
  //   // Handle other inputs normally
  //   setMentorDetails(prev => ({
  //     ...prev,
  //     [name]: value,
  //   }));
  // };

  // const handleEditInputChange = (e) => {
  //   const { name, value } = e.target;
  //   setSelectedMentor((prev) => ({
  //     ...prev,
  //     [name]: value,
  //   }));
  // };

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
  // const handleAcademicYearInput = (e) => {
  //   const value = e?.target?.value || '';
  //   const upperValue = value.toUpperCase();
  
  //   // Don't update state during render, use useEffect instead
  //   setMentorDetails(prev => {
  //     const updates = {
  //       ...prev,
  //       academicYear: upperValue,
  //     };
  
  //     // Only update academicSession if we have a valid year
  //     if (validateAcademicYear(upperValue)) {
  //       const sessions = generateAcademicSessions(upperValue);
  //       updates.academicSession = sessions[0];
  //     } else if (!upperValue) {
  //       // Clear session if year is empty
  //       updates.academicSession = '';
  //     }
  
  //     return updates;
  //   });
  
  //   // Update suggestions outside of render
  //   setTimeout(() => {
  //     if (upperValue) {
  //       const suggestions = generateYearSuggestions(upperValue);
  //       setYearSuggestions(suggestions);
  //       setShowYearOptions(suggestions.length > 0);
  //     } else {
  //       setYearSuggestions([]);
  //       setShowYearOptions(false);
  //     }
  //   }, 0);
  // };
  

    const fetchMentors = async (filters = {}) => {
    if (!filters.academicYear || !filters.academicSession) {
      return;
    }
  
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
  
      const response = await axios.get(`/api/admin/manageUsers/manageMentor?${params}`);
      
      if (response.data) {
        const updatedMentors = response.data.mentors || [];
        
        // If there's an email filter, apply it locally first
        const filteredMentors = filters.mentorEmailid 
          ? updatedMentors.filter(mentor => 
              mentor.email.toLowerCase().includes(filters.mentorEmailid.toLowerCase()))
          : updatedMentors;

        setMentors(filteredMentors);
        setTableVisible(true);
        setCurrentFilters(filters); // Update current filters after successful fetch
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Error fetching mentors");
      setMentors([]);
      setTableVisible(false);
    } finally {
      setLoading(false);
    }
  };

  // Add this new function to handle patch update
  const handlePatchUpdate = async () => {
    if (!existingMentorData?.MUJid) {
      showAlert("Error", "Invalid mentor data", "error");
      return;
    }

    try {
      const response = await axios.patch(
        `/api/admin/manageUsers/manageMentor/${existingMentorData.MUJid}`,
        mentorDetails
      );

      if (response.data) {
        // showAlert("Success", "Mentor updated successfully", "success");
        setDuplicateMentorDialog(false);
        setDuplicateEditMode(false);
        await fetchMentors(currentFilters);
      }
    } catch (error) {
      showAlert("Error", error.response?.data?.error || "Error updating mentor", "error");
    }
  };

  const handleEditClick = (mentor) => {
    const {...mentorData } = mentor;
    setSelectedMentor({
      ...mentorData,
      role: Array.isArray(mentorData.role) ? mentorData.role : [mentorData.role],
      isActive: mentorData.isActive ?? true, // Add this line
      academicYear: mentorData.academicYear || getCurrentAcademicYear(),
      academicSession: mentorData.academicSession || generateAcademicSessions(getCurrentAcademicYear())[0],
    });
    setEditDialog(true);
  };
  // use to upload mentor data
  // const handleBulkUpload = async (formData, onProgress) => {
  //   try {
  //     const previewResponse = await axios.post(
  //       "/api/admin/manageUsers/previewUpload",
  //       formData,
  //       {
  //         headers: {
  //           "Content-Type": "multipart/form-data",
  //         },
  //         onUploadProgress: (progressEvent) => {
  //           const percentCompleted = Math.round(
  //             (progressEvent.loaded * 100) / progressEvent.total
  //           );
  //           if (onProgress) onProgress(percentCompleted);
  //         },
  //       }
  //     );

  //     setPreviewData(previewResponse.data);
  //     setShowPreview(true);
  //     return previewResponse;
  //   } catch (error) {
  //     toast.error(
  //       error.response?.data?.error || "Error processing file",
  //       {
  //         style: toastStyles.error.style,
  //         iconTheme: toastStyles.error.iconTheme,
  //       }
  //     );
  //     throw error;
  //   }
  // };

  // useEffect(() => {
  //   let mounted = true;
  
  //   const handleYearChange = (value) => {
  //     if (!mounted) return;
      
  //     if (value) {
  //       const suggestions = generateYearSuggestions(value);
  //       setYearSuggestions(suggestions);
  //       // setShowYearOptions(suggestions.length > 0);
  //     } else {
  //       setYearSuggestions([]);
  //       // setShowYearOptions(false);
  //     }
  //   };
  
  //   // If mentorDetails.academicYear changes, update suggestions
  //   handleYearChange(mentorDetails.academicYear);
  
  //   return () => {
  //     mounted = false;
  //   };
  // }, [mentorDetails.academicYear]);
  

  // Add this useEffect near other useEffect hooks
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Update the initialization useEffect to check for mounted
  useEffect(() => {
    const initializeComponent = async () => {
      if (!mounted) return;
  
      const { academicYear: currentYear, academicSession: currentSession } = determineAcademicPeriod();
  
      setAcademicYear(currentYear);
      setAcademicSession(currentSession);
      
      // Initialize mentor details with current academic period
      setMentorDetails(prev => ({
        ...prev,
        academicYear: currentYear,
        academicSession: currentSession
      }));
      
      try {
        setLoading(true);
        const response = await axios.get('/api/admin/manageUsers/manageMentor', {
          params: {
            academicYear: currentYear,
            academicSession: currentSession
          }
        });
  
        if (response.data && response.data.mentors) {
          setMentors(response.data.mentors);
          setTableVisible(true);
        }
      } catch (error) {
        if (error.response?.status !== 400) {
          toast.error(error.response?.data?.error || 'Error loading data', {
            style: toastStyles.error.style,
            iconTheme: toastStyles.error.iconTheme,
          });
        }
      } finally {
        setLoading(false);
      }
    };
  
    initializeComponent();
  }, [mounted]); // Add mounted to dependencies
  

  // Add this new function
  const handleSearchMentor = async () => {
    if (!mentorDetails.email) {
      toast.error("Please enter an email address");
      return;
    }
  
    setSearchingMentor(true);
    try {
      // Update to use the correct parameter name
      const response = await axios.get(`/api/admin/manageUsers/manageMentor?email=${encodeURIComponent(mentorDetails.email.trim())}`);
      
      if (response.data.mentors?.length > 0) {
        const existingMentor = response.data.mentors[0];
        setExistingMentorData(existingMentor);
        
        // Show duplicate dialog and copy existing mentor's data
        setDuplicateMentorDialog(true);
        setMentorDetails(prev => ({
          ...prev,
          MUJid: existingMentor.MUJid,
          name: existingMentor.name || '',
          phone_number: existingMentor.phone_number || '',
          // Keep current academic details
          academicYear: prev.academicYear,
          academicSession: prev.academicSession
        }));
        
        setOpenDialog(false);
      } else {
        // Generate new MUJid for new email
        const mujidResponse = await axios.get('/api/admin/manageUsers/getNextMUJid');
        if (mujidResponse.data.nextMUJid) {
          setMentorDetails(prev => ({
            ...prev,
            MUJid: mujidResponse.data.nextMUJid
          }));
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Error searching for mentor");
      // Clear MUJid on error
      setMentorDetails(prev => ({
        ...prev,
        MUJid: ''
      }));
    } finally {
      setSearchingMentor(false);
    }
  };
  
  // // Update dialog open handler
  // const handleDialogOpen = () => {
  //   const { academicYear, academicSession } = determineAcademicPeriod();
  //   setMentorDetails(prev => ({
  //     ...prev,
  //     academicYear,
  //     academicSession
  //   }));
  //   setOpenDialog(true);
  // };

  // Update handleFilterChange to trigger fetch
  const handleFilterChange = async (filters) => {
    // Set loading immediately when filters change
    setLoading(true);
    setTableVisible(true);
    
    // If there's no search term, show initial data
    if (!filters.mentorEmailid) {
      try {
        const response = await axios.get('/api/admin/manageUsers/manageMentor', {
          params: {
            academicYear: filters.academicYear,
            academicSession: filters.academicSession
          }
        });
        
        if (response.data) {
          setMentors(response.data.mentors || []);
        }
      } catch (error) {
        toast.error(error.response?.data?.error || 'Error fetching mentors');
        setMentors([]);
      }
    }
    
    setLoading(false);
    setCurrentFilters(filters);
  };

  // Update email search handling to not trigger API calls
  // const handleEmailFilter = (value) => {
  //   setEmailFilter(value); // This will be used by MentorTable to filter existing data
  // };
  

  // Add this animation configuration
  const filterAnimation = {
    initial: false,
    animate: {
      width: '100%',
      opacity: 1,
      marginLeft: '0px',
    },
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 25,
      mass: 0.5,
      duration: 0.3
    },
    layout: true
  };

  const tableAnimation = {
    layout: true,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 25,
      mass: 0.5,
      duration: 0.3
    }
  };

  const handleExpandCard = (mujId) => {
    setExpandedCard(expandedCard === mujId ? null : mujId);
  };

  const getCurrentCards = () => {
    const startIndex = (page - 1) * cardsPerPage;
    const endIndex = startIndex + cardsPerPage;
    return mentors.slice(startIndex, endIndex);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo(0, 0);
  };

  // Add these new functions before the return statement
  const handleDeleteConfirm = async () => {
    try {
      if (!deleteConfirm.mentor) return;

      // For mobile admin/superadmin users, delete all roles
      const rolesToDelete = isSmallScreen && 
        (deleteConfirm.mentor.role.includes('admin') || deleteConfirm.mentor.role.includes('superadmin')) 
        ? deleteConfirm.mentor.role 
        : ['mentor'];

      await axios.delete("/api/admin/manageUsers/manageMentor", {
        data: { 
          MUJid: deleteConfirm.mentor.MUJid,
          roles: rolesToDelete
        }
      });
      
      showAlert("Mentor deleted successfully", "success");
      fetchMentors(currentFilters);
    } catch (error) {
      showAlert(error.response?.data?.error || "Error deleting mentor", "error");
    } finally {
      setDeleteConfirm({ open: false, mentor: null, isMobile: false });
    }
  };
  
  const handleDeleteCancel = () => {
    setDeleteConfirm({ open: false, mentor: null, isMobile: false });
  };

  // Add these new functions near other handler functions
  const handleTransferMentees = async () => {
    setSearchingMentor(true);
    setTransferError('');
    
    try {
      const findMentorResponse = await axios.get(`/api/admin/manageUsers/manageMentor`, {
        params: {
          email: transferEmail,
          academicYear: transferDialog.fromMentor.academicYear,
          academicSession: transferDialog.fromMentor.academicSession
        }
      });

      const foundMentor = findMentorResponse.data?.mentors?.[0];
      
      if (!foundMentor) {
        setTransferError('No mentor found with this email in the same academic year and session');
        setSearchingMentor(false);
        return;
      }

      if (foundMentor.MUJid === transferDialog.fromMentor.MUJid) {
        setTransferError('Cannot transfer mentees to the same mentor');
        setSearchingMentor(false);
        return;
      }

      setTargetMentor(foundMentor);
      setSearchingMentor(false);

    } catch (error) {
      setTransferError(error.response?.data?.message || 'Error finding mentor');
      setSearchingMentor(false);
    }
  };

  const handleConfirmTransfer = async () => {
    setTransferLoading(true);
    try {
      const response = await axios.post('/api/admin/manageUsers/transferMentees', {
        fromMentorId: transferDialog.fromMentor.MUJid,
        toMentorEmail: transferEmail,
        academicYear: transferDialog.fromMentor.academicYear,
        academicSession: transferDialog.fromMentor.academicSession
      });

      if (response.data.success) {
        toast.success(
          `Successfully transferred ${response.data.updatedCount} mentees`,
          { style: toastStyles.success.style }
        );
        setTransferDialog({ open: false, fromMentor: null });
        setTransferEmail('');
        setTargetMentor(null);
        fetchMentors(currentFilters);
      }
    } catch (error) {
      setTransferError(error.response?.data?.message || 'Error transferring mentees');
    } finally {
      setTransferLoading(false);
    }
  };

  // Add this effect to fetch mentee stats when transfer dialog opens
  useEffect(() => {
    if (transferDialog.open && transferDialog.fromMentor) {
      const fetchMenteeStats = async () => {
        try {
          const response = await axios.get(`/api/admin/getMenteesCount?mentorMujid=${transferDialog.fromMentor.MUJid}`);
          setMenteeStats(response.data.counts);
        } catch (error) {
          console.error('Error fetching mentee stats:', error);
          toast.error('Error loading mentee statistics');
        }
      };
      fetchMenteeStats();
    } else {
      setMenteeStats(null);
      // setSelectedSemester(null);
      // setSemesterMentees([]);
    }
  }, [transferDialog.open, transferDialog.fromMentor]);

  const handleReset = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/manageUsers/manageMentor', {
        params: {
          academicYear: currentFilters.academicYear,
          academicSession: currentFilters.academicSession,
          mentorEmailid: '', // Empty email filter
          batchSize: 50,
          offset: 0
        }
      });
      
      if (response.data) {
        setMentors(response.data.mentors || []);
        setCurrentFilters(prev => ({
          ...prev,
          mentorEmailid: ''
        }));
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error resetting filters');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <div className="fixed inset-0 bg-gray-900 text-white overflow-hidden">
       <Toaster
                position="bottom-right"
                toastOptions={{
                  duration: 3000,
                  style: {
                    background: "rgba(0, 0, 0, 0.8)",
                    color: "#fff",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "0.75rem",
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
          </div>

          {/* Main Grid Layout - Update the grid template columns here */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-[300px,1fr] gap-4 p-4 h-[calc(100vh-100px)] lg:overflow-hidden overflow-auto">
            {/* Filter Panel - Update max-width */}
            <motion.div 
              className="block" // Updated to always show
              {...filterAnimation}
            >
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-4 h-full">
                <MentorFilterSection  // Update component name
                  filters={{
                    academicYear,
                    academicSession,
                  }}
                  onFilterChange={handleFilterChange}
                  onSearch={fetchMentors}
                  onAddNew={() => setOpenDialog(true)}
                  onReset={handleReset} // Add this prop
                  onDelete={handleDeleteMentor}
                  mentors={mentors}
                  // onBulkUpload={handleBulkUpload}
                />
              </div>
            </motion.div>

            {/* Right Column - Table */}
            <motion.div
              className="h-full min-w-0" // Updated height
              {...tableAnimation}
            >
              <div className="bg-gradient-to-br from-orange-500/5 via-orange-500/10 to-transparent backdrop-blur-xl rounded-3xl border border-orange-500/20 h-full">
                <div className="h-full flex flex-col p-4 pb-2"> {/* Added pb-2 for pagination */}
                  {mentors.length > 0 ? (
                    <div className="h-full">
                      {isSmallScreen ? (
                        // Card view for mobile and tablet
                        <div className="h-full overflow-auto pb-16">
                          {getCurrentCards().map((mentor) => (
                            <MentorCard
                              key={mentor.MUJid}
                              mentor={mentor}
                              onEditClick={handleEditClick}
                              onDeleteClick={handleDeleteMentor}
                              expanded={expandedCard === mentor.MUJid}
                              onExpandClick={handleExpandCard}
                              onInfoClick={(mentor) => setDetailsDialog({ open: true, mentor })}
                              onTransferClick={(mentor) => setTransferDialog({
                                open: true,
                                fromMentor: mentor
                              })}
                            />
                          ))}
                          {mentors.length > cardsPerPage && (
                            <Box sx={{ 
                              position: 'fixed',
                              bottom: 0,
                              left: 0,
                              right: 0,
                              display: 'flex', 
                              justifyContent: 'center',
                              backgroundColor: 'rgba(0,0,0,0.8)',
                              backdropFilter: 'blur(10px)',
                              py: 2,
                              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                              zIndex: 10,
                            }}>
                              <Pagination
                                count={Math.ceil(mentors.length / cardsPerPage)}
                                page={page}
                                onChange={handlePageChange}
                                size={isSmallScreen ? "small" : "medium"}
                                siblingCount={isSmallScreen ? 0 : 1}
                                sx={{
                                  '& .MuiPaginationItem-root': {
                                    color: 'white',
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    minWidth: isSmallScreen ? '30px' : '40px',
                                    height: isSmallScreen ? '30px' : '40px',
                                    fontSize: isSmallScreen ? '0.875rem' : '1rem',
                                    '&.Mui-selected': {
                                      backgroundColor: '#f97316',
                                      fontWeight: 'bold',
                                      boxShadow: '0 0 10px rgba(249, 115, 22, 0.5)',
                                      '&:hover': {
                                        backgroundColor: '#ea580c',
                                      },
                                    },
                                    '&:hover': {
                                      backgroundColor: 'rgba(249, 115, 22, 0.2)',
                                    },
                                  },
                                }}
                              />
                            </Box>
                          )}
                        </div>
                      ) : (
                        // Table view for desktop
                        <div className="h-full overflow-auto">
                          <MentorTable 
                            mentors={mentors}
                            onEditClick={handleEditClick}
                            onDeleteClick={handleDeleteMentor}
                            isSmallScreen={isSmallScreen}
                            emailFilter={currentFilters.email}
                            onDataUpdate={(updatedMentors) => setMentors(updatedMentors)}
                          />
                        </div>
                      )}
                    </div>
                  ) : loading ? (
                    <div className="h-full bg-black/20 rounded-xl backdrop-blur-sm">
                      {isSmallScreen ? (
                        <MentorCardSkeleton count={5} />
                      ) : (
                        <MentorSkeleton />
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <div className="w-64 h-64">
                        {typeof window !== 'undefined' && (
                          <Lottie
                            animationData={noData}
                            loop={true}
                            autoplay={true}
                          />
                        )}
                      </div>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          color: 'rgba(255, 255, 255, 0.7)',
                          mt: 2,
                          fontWeight: 500 
                        }}
                      >
                        {tableVisible ? 'No mentors found' : 'Use the filters to search for mentors'}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'rgba(255, 255, 255, 0.5)',
                          mt: 1 
                        }}
                      >
                        {tableVisible ? 
                          'Try different search criteria or add a new mentor' : 
                          'Select academic year and session to get started'}
                      </Typography>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <AddMentorDialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          mentorDetails={mentorDetails}
          setMentorDetails={setMentorDetails}
          handleAddMentor={handleAddMentor}
          handleSearchMentor={handleSearchMentor}
          searchingMentor={searchingMentor}
        />

        <EditMentorDialog
          open={editDialog}
          onClose={() => setEditDialog(false)}
          selectedMentor={selectedMentor}
          setSelectedMentor={setSelectedMentor}
          handleEditMentor={handleEditMentor}
        />

        <DuplicateMentorDialog
          open={duplicateMentorDialog}
          onClose={() => {
            setDuplicateMentorDialog(false);
            setDuplicateEditMode(false);
          }}
          duplicateEditMode={duplicateEditMode}
          setDuplicateEditMode={setDuplicateEditMode}
          existingMentorData={existingMentorData}
          mentorDetails={mentorDetails}
          setMentorDetails={setMentorDetails}
          handlePatchUpdate={handlePatchUpdate}
        />

        {/* Show RoleDeletionDialog only on desktop */}
        {!isSmallScreen && (
          <RoleDeletionDialog
            open={deleteRoleDialog.open}
            onClose={() => setDeleteRoleDialog({ open: false, mentor: null })}
            deleteRoleDialog={deleteRoleDialog}
            selectedRoles={selectedRoles}
            setSelectedRoles={setSelectedRoles}
            handleRoleBasedDelete={handleRoleBasedDelete}
          />
        )}

        <EmailConflictDialog
          open={emailConflict.open}
          onClose={() => setEmailConflict({ open: false, mentor: null })}
          conflictingMentor={emailConflict.mentor}
        />

        {/* Add Delete Confirmation Dialog/Drawer */}
        {deleteConfirm.isMobile ? (
          <SwipeableDrawer
            anchor="bottom"
            open={deleteConfirm.open}
            onClose={handleDeleteCancel}
            onOpen={() => {}}
            sx={{
              '& .MuiDrawer-paper': {
                borderTopLeftRadius: '16px',
                borderTopRightRadius: '16px',
                backgroundColor: 'rgba(0, 0, 0, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            <Box sx={{ p: 3, color: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <DeleteIcon sx={{ color: '#ef4444', mr: 1 }} />
                <Typography variant="h6">Confirm Delete</Typography>
              </Box>
              {deleteConfirm.mentor && (
                <Box sx={{ mb: 2, p: 2, bgcolor: 'rgba(255, 255, 255, 0.05)', borderRadius: 1 }}>
                  <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Mentor Details:
                  </Typography>
                  <Typography>Name: {deleteConfirm.mentor.name}</Typography>
                  <Typography>Email: {deleteConfirm.mentor.email}</Typography>
                  <Typography>MUJID: {deleteConfirm.mentor.MUJid}</Typography>
                  <Typography>Academic Year: {deleteConfirm.mentor.academicYear}</Typography>
                </Box>
              )}
              <Typography sx={{ mb: 3 }}>
                Are you sure you want to delete this mentor? This action cannot be undone.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleDeleteCancel}
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
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleDeleteConfirm}
                  sx={{
                    bgcolor: '#ef4444',
                    '&:hover': { bgcolor: '#dc2626' }
                  }}
                >
                  Delete
                </Button>
              </Box>
            </Box>
          </SwipeableDrawer>
        ) : (
          <Dialog
            open={deleteConfirm.open}
            onClose={handleDeleteCancel}
            PaperProps={{
              sx: {
                backgroundColor: 'rgba(0, 0, 0, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                minWidth: '400px'
              }
            }}
          >
            <DialogTitle sx={{ color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
              <DeleteIcon sx={{ color: '#ef4444' }} />
              Confirm Delete
            </DialogTitle>
            <DialogContent>
              {deleteConfirm.mentor && (
                <Box sx={{ mb: 2, p: 2, bgcolor: 'rgba(255, 255, 255, 0.05)', borderRadius: 1 }}>
                  <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Mentor Details:
                  </Typography>
                  <Typography sx={{ color: 'white' }}>Name: {deleteConfirm.mentor.name}</Typography>
                  <Typography sx={{ color: 'white' }}>Email: {deleteConfirm.mentor.email}</Typography>
                  <Typography sx={{ color: 'white' }}>MUJID: {deleteConfirm.mentor.MUJid}</Typography>
                  <Typography sx={{ color: 'white' }}>Academic Year: {deleteConfirm.mentor.academicYear}</Typography>
                </Box>
              )}
              <Typography sx={{ color: 'white' }}>
                Are you sure you want to delete this mentor? This action cannot be undone.
              </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button
                onClick={handleDeleteCancel}
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
              <Button
                onClick={handleDeleteConfirm}
                variant="contained"
                sx={{
                  bgcolor: '#ef4444',
                  '&:hover': { bgcolor: '#dc2626' }
                }}
              >
                Delete
              </Button>
            </DialogActions>
          </Dialog>
        )}

        <MentorDetailsDialog
          open={detailsDialog.open}
          onClose={() => setDetailsDialog({ open: false, mentor: null })}
          mentor={detailsDialog.mentor}
        />

        {isSmallScreen ? (
          <SwipeableDrawer
            anchor="bottom"
            open={transferDialog.open}
            onClose={() => {
              setTransferDialog({ open: false, fromMentor: null });
              setTransferEmail('');
              setTargetMentor(null);
              setTransferError('');
            }}
            onOpen={() => {}}
            sx={{
              '& .MuiDrawer-paper': {
                borderTopLeftRadius: '16px',
                borderTopRightRadius: '16px',
                backgroundColor: 'rgba(0, 0, 0, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                maxHeight: '90vh'
              }
            }}
          >
            <Box sx={{ p: 3, color: 'white' }}>
              <Typography variant="h6" sx={{ 
                color: '#10B981', 
                mb: 3,
                fontSize: { xs: '1.25rem', sm: '1.5rem' }
              }}>
                Transfer Mentees
              </Typography>

              {transferDialog.fromMentor && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }}>
                    From Mentor:
                  </Typography>
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: 'rgba(255, 255, 255, 0.05)', 
                    borderRadius: 1,
                    mt: 1
                  }}>
                    <Typography sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                      {transferDialog.fromMentor.name}
                    </Typography>
                    <Typography sx={{ 
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}>
                      {transferDialog.fromMentor.email}
                    </Typography>
                  </Box>
                </Box>
              )}

              {menteeStats && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ 
                    color: '#10B981',
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }}>
                    Current Mentees:
                  </Typography>
                  <Stack spacing={1} sx={{ mt: 1 }}>
                    {Object.entries(menteeStats).map(([semester, count]) => (
                      <Box key={semester} sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        p: 1.5,
                        bgcolor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: 1
                      }}>
                        <Typography sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          {semester}
                        </Typography>
                        <Typography sx={{ 
                          color: '#10B981',
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }}>
                          {count} mentees
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}

              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label="Target Mentor Email"
                  value={transferEmail}
                  onChange={(e) => setTransferEmail(e.target.value)}
                  error={!!transferError}
                  helperText={transferError}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.23)',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                    },
                    '& .MuiFormHelperText-root': {
                      color: '#ef4444',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    }
                  }}
                />
              </Box>

              {targetMentor && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }}>
                    Target Mentor:
                  </Typography>
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: 'rgba(16, 185, 129, 0.1)', 
                    borderRadius: 1,
                    mt: 1,
                    border: '1px solid rgba(16, 185, 129, 0.2)'
                  }}>
                    <Typography sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                      {targetMentor.name}
                    </Typography>
                    <Typography sx={{ 
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}>
                      {targetMentor.email}
                    </Typography>
                  </Box>
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => {
                    setTransferDialog({ open: false, fromMentor: null });
                    setTransferEmail('');
                    setTargetMentor(null);
                    setTransferError('');
                  }}
                  sx={{
                    color: 'white',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    }
                  }}
                >
                  Cancel
                </Button>
                {targetMentor ? (
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleConfirmTransfer}
                    disabled={transferLoading}
                    sx={{
                      bgcolor: '#10B981',
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                      '&:hover': { bgcolor: '#059669' }
                    }}
                  >
                    {transferLoading ? 'Transferring...' : 'Confirm Transfer'}
                  </Button>
                ) : (
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleTransferMentees}
                    disabled={!transferEmail || searchingMentor}
                    sx={{
                      bgcolor: '#10B981',
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                      '&:hover': { bgcolor: '#059669' }
                    }}
                  >
                    {searchingMentor ? 'Searching...' : 'Search Mentor'}
                  </Button>
                )}
              </Box>
            </Box>
          </SwipeableDrawer>
        ) : (
          <Dialog
            open={transferDialog.open}
            onClose={() => {
              setTransferDialog({ open: false, fromMentor: null });
              setTransferEmail('');
              setTargetMentor(null);
              setTransferError('');
            }}
            PaperProps={{
              sx: {
                backgroundColor: 'rgba(0, 0, 0, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                minWidth: '400px'
              }
            }}
          >
            <DialogTitle sx={{ color: '#10B981', borderBottom: '1px solid rgba(16, 185, 129, 0.2)' }}>
              Transfer Mentees
            </DialogTitle>
            {/* Rest of your transfer dialog content */}
            {/* ...existing transfer dialog content... */}
          </Dialog>
        )}
      </div>
    </ThemeProvider>
  );
};

export default MentorManagement;