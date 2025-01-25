"use client";
import { useState, useEffect} from "react";
import {
  // Box,
  Typography,
  // Button,
  useMediaQuery,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
// import CloseIcon from "@mui/icons-material/Close";
import FilterListIcon from '@mui/icons-material/FilterList';
import { Toaster, toast } from "react-hot-toast";
import { motion } from "framer-motion";
import axios from "axios";
import MentorTable from "./MentorTable";
import FilterSection from "./MentorFilterSection";
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
  const [showFilters, setShowFilters] = useState(true);
  const [deleteRoleDialog, setDeleteRoleDialog] = useState({ open: false, mentor: null });
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [currentFilters, setCurrentFilters] = useState({
    academicYear: '',
    academicSession: '',
    MUJid: ''
  });


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
    setMentors(prev => prev.map(mentor => 
      mentor.MUJid === updatedMentor.MUJid ? updatedMentor : mentor
    ));
    await fetchMentors(currentFilters);
  } catch (error) {
    toast.error(error.response?.data?.error || "Error updating mentor list", {
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
  

    const fetchMentors = async ({ academicYear = '', academicSession = '' } = {}) => {
    if (!academicYear || !academicSession) {
      return;
    }
  
    setLoading(true);
    try {
      // Store current filters
      setCurrentFilters({ 
        academicYear, 
        academicSession
      });
  
      const params = new URLSearchParams();
      params.append('academicYear', academicYear);
      params.append('academicSession', academicSession);
  
      const response = await axios.get(`/api/admin/manageUsers/manageMentor?${params}`);
      
      if (response.data && response.data.mentors) {
        setMentors(response.data.mentors);
        setTableVisible(true);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Error fetching mentors", {
        style: toastStyles.error.style,
        iconTheme: toastStyles.error.iconTheme,
      });
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
      // Check if email exists
      const response = await axios.get(`/api/admin/manageUsers/manageMentor?email=${mentorDetails.email}`);
      
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

          {/* Main Grid Layout - Update the grid template columns here */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-[300px,1fr] gap-4 p-4 h-[calc(100vh-100px)] lg:overflow-hidden overflow-auto">
            {/* Filter Panel - Update max-width */}
            <motion.div 
              className="lg:h-full max-w-full lg:max-w-[300px]"
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
                      case "email":
                        // Update currentFilters with new email value
                        setCurrentFilters(prev => ({
                          ...prev,
                          email: value
                        }));
                        break;
                    }
                  }}
                  onSearch={({ academicYear, academicSession, MUJid }) => {
                    fetchMentors({ academicYear, academicSession, MUJid });
                  }}
                  onAddNew={() => setOpenDialog(true)}
                  onDelete={handleDeleteMentor}
                  mentors={mentors}
                  // onBulkUpload={handleBulkUpload}
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
                        emailFilter={currentFilters.email} // Pass email filter to table
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

        <RoleDeletionDialog
          open={deleteRoleDialog.open}
          onClose={() => setDeleteRoleDialog({ open: false, mentor: null })}
          deleteRoleDialog={deleteRoleDialog}
          selectedRoles={selectedRoles}
          setSelectedRoles={setSelectedRoles}
          handleRoleBasedDelete={handleRoleBasedDelete}
        />
      </div>
    </ThemeProvider>
  );
};

export default MentorManagement;