"use client";
import React, { useState, useEffect } from "react";
import {
  Grid as Grid2,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Collapse,
  Stack,
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import { Toaster } from "react-hot-toast";
import axios from "axios";
import toast from "react-hot-toast";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import { DataGrid } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import * as XLSX from "xlsx";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import Pagination from "@mui/material/Pagination";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import PersonIcon from "@mui/icons-material/Person";
import SchoolIcon from "@mui/icons-material/School";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import HomeIcon from "@mui/icons-material/Home";
import GradeIcon from "@mui/icons-material/Grade";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import BadgeIcon from "@mui/icons-material/Badge";
import SendIcon from "@mui/icons-material/Send";
import DialogContentText from "@mui/material/DialogContentText";
// import FilledInput from '@mui/material/FilledInput';

const ViewMentee = () => {
  const [mentees, setMentees] = useState([]);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [selectedMentee, setSelectedMentee] = useState(null);
  const [editDialog, setEditDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedMentee, setEditedMentee] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredMentees, setFilteredMentees] = useState([]);
  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);
  const [page, setPage] = useState(1);
  const [tabValue, setTabValue] = useState(0);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailPreview, setEmailPreview] = useState(false);
  const [emailContent, setEmailContent] = useState({ subject: "", body: "" });
  const [bulkEmailDialog, setBulkEmailDialog] = useState(false);
  const [emailType, setEmailType] = useState(""); // 'students' or 'parents'
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [manualParentEmail, setManualParentEmail] = useState("");
  const [showManualEmailInput, setShowManualEmailInput] = useState(false);
  const [recipientSelectionOpen, setRecipientSelectionOpen] = useState(false);
  const [recipientSearchQuery, setRecipientSearchQuery] = useState(""); // New state for search
  const cardsPerPage = 5;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const themeConfig = createTheme({
    palette: {
      primary: {
        main: "#f97316",
      },
      secondary: {
        main: "#ea580c",
      },
      background: {
        default: "#0a0a0a",
        paper: "rgba(255, 255, 255, 0.05)",
      },
      text: {
        primary: "#ffffff",
        secondary: "rgba(255, 255, 255, 0.7)",
      },
    },
    components: {
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              color: "white",
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "#f97316",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "#f97316",
              },
              "&.Mui-disabled": {
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                "& input, & textarea": {
                  color: "rgba(255, 255, 255, 0.7)",
                  WebkitTextFillColor: "rgba(255, 255, 255, 0.7)",
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255, 255, 255, 0.2)",
                },
              },
            },
            "& .MuiInputLabel-root": {
              color: "rgba(255, 255, 255, 0.7)",
              "&.Mui-disabled": {
                color: "rgba(255, 255, 255, 0.5)",
              },
            },
          },
        },
      },
    },
  });

  const dialogStyles = {
    dialog: {
      "& .MuiDialog-paper": {
        maxHeight: "90vh",
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        [theme.breakpoints.down("sm")]: {
          margin: 0,
          maxHeight: "100%",
          minHeight: "100%",
          width: "100%",
          borderRadius: "1rem 1rem 0 0",
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
        },
      },
      [theme.breakpoints.down("sm")]: {
        "& .MuiDialog-container": {
          alignItems: "flex-end",
          height: "100%",
        },
      },
    },
    dialogContent: {
      flex: 1,
      overflowY: "auto",
      p: 0,
      "&::-webkit-scrollbar": {
        width: "8px",
      },
      "&::-webkit-scrollbar-track": {
        background: "rgba(255, 255, 255, 0.05)",
      },
      "&::-webkit-scrollbar-thumb": {
        background: "rgba(249, 115, 22, 0.5)",
        borderRadius: "4px",
      },
      "&::-webkit-scrollbar-thumb:hover": {
        background: "#f97316",
      },
      [theme.breakpoints.down("sm")]: {
        pb: 4,
      },
    },
    contentWrapper: {
      p: 3,
      height: "100%",
      [theme.breakpoints.down("sm")]: {
        p: 2,
      },
    },
    tabPanel: {
      height: "100%",
      display: "flex",
      flexDirection: "column",
    },
  };

  const tabContentStyles = {
    wrapper: {
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-start",
      minHeight: "400px",
      p: 2,
      [theme.breakpoints.down("sm")]: {
        p: 1,
      },
    },
    contentCard: {
      width: "100%",
      maxWidth: "900px",
      p: 2.5,
      bgcolor: "rgba(255, 255, 255, 0.03)",
      borderRadius: "1rem",
      [theme.breakpoints.down("sm")]: {
        p: 1.5,
      },
    },
    academicCard: {
      p: 2,
      height: "100%",
      background:
        "linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(249, 115, 22, 0.05))",
      border: "1px solid rgba(249, 115, 22, 0.2)",
      borderRadius: "0.75rem",
    },
    sectionTitle: {
      display: "flex",
      alignItems: "center",
      gap: 1,
      mb: 2,
      "& .MuiSvgIcon-root": {
        fontSize: "1.25rem",
      },
    },
    statBox: {
      p: 1.5,
      bgcolor: "rgba(255, 255, 255, 0.03)",
      borderRadius: "0.75rem",
      textAlign: "center",
    },
  };

  useEffect(() => {
    setMounted(true);
    try {
      const storedMenteeData = sessionStorage.getItem("menteeData");
      if (storedMenteeData) {
        const menteeList = JSON.parse(storedMenteeData);
        setMentees(menteeList);
        setLoading(false);
      } else {
        // Try to get mentor data from the new format first
        let mentorData = JSON.parse(sessionStorage.getItem("mentorData") || "{}");
        
        // If mentorData doesn't exist or doesn't have email, try to get from individual session storage items
        if (!mentorData || !mentorData.email) {
          const userEmail = sessionStorage.getItem("userEmail");
          const userName = sessionStorage.getItem("userName");
          const userMUJId = sessionStorage.getItem("userMUJId");
          
          if (userEmail) {
            mentorData = {
              email: userEmail,
              name: userName,
              MUJid: userMUJId,
              // Set default academic info - you may need to adjust these
              academicYear: "2024-2025",
              academicSession: "JULY-DECEMBER 2024"
            };
            // Store the proper mentorData for future use
            sessionStorage.setItem("mentorData", JSON.stringify(mentorData));
          }
        }

        if (mentorData?.email) {
          setLoading(true); // Set loading to true before making API call
          axios
            .get("/api/mentor/manageMentee", {
              params: {
                mentorEmail: mentorData.email,
              },
            })
            .then((response) => {
              if (response.data.success) {
                const menteeList = response.data.mentees;
                sessionStorage.setItem(
                  "menteeData",
                  JSON.stringify(menteeList)
                );
                setMentees(menteeList);
              } else {
                toast.error("Failed to load mentee data");
                setMentees([]);
              }
            })
            .catch((error) => {
              console.error("Error loading mentee data:", error);
              toast.error("Error loading mentee data");
              setMentees([]);
            })
            .finally(() => {
              setLoading(false);
            });
        } else {
          toast.error("Mentor email not found");
          setMentees([]);
          setLoading(false);
        }
      }
    } catch (error) {
      console.error("Error loading mentee data:", error);
      toast.error("Error loading mentee data");
      setMentees([]);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMentees(mentees);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = mentees.filter(
      (mentee) =>
        mentee.name?.toLowerCase().includes(query) ||
        mentee.MUJid?.toLowerCase().includes(query) ||
        mentee.email?.toLowerCase().includes(query) ||
        mentee.phone?.includes(query) ||
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
      address: selectedMentee.address || "",
      email: selectedMentee.email || "",
      name: selectedMentee.name || "",
      phone: selectedMentee.phone || "",
      semester: selectedMentee.semester || "",
      yearOfRegistration: selectedMentee.yearOfRegistration || "",
      academicSession: selectedMentee.academicSession || "",
      academicYear: selectedMentee.academicYear || "",
      parents: {
        father: {
          name: selectedMentee.parents?.father?.name || "",
          email: selectedMentee.parents?.father?.email || "",
          phone: selectedMentee.parents?.father?.phone || "",
          alternatePhone: selectedMentee.parents?.father?.alternatePhone || "",
        },
        mother: {
          name: selectedMentee.parents?.mother?.name || "",
          email: selectedMentee.parents?.mother?.email || "",
          phone: selectedMentee.parents?.mother?.phone || "",
          alternatePhone: selectedMentee.parents?.mother?.alternatePhone || "",
        },
        guardian: {
          name: selectedMentee.parents?.guardian?.name || "",
          email: selectedMentee.parents?.guardian?.email || "",
          phone: selectedMentee.parents?.guardian?.phone || "",
          relation: selectedMentee.parents?.guardian?.relation || "",
        },
      },
    });
  };

  const handleInputChange = (e, category, subcategory) => {
    const { name, value } = e.target;

    if (category && subcategory) {
      setEditedMentee((prev) => ({
        ...prev,
        parents: {
          ...prev.parents,
          [category]: {
            ...prev.parents?.[category],
            [subcategory]: value,
          },
        },
      }));
    } else {
      setEditedMentee((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleUpdate = async () => {
    try {
      const mentorData = JSON.parse(sessionStorage.getItem("mentorData"));
      if (!mentorData?.email) {
        toast.error("Mentor email not found");
        return;
      }

      setLoading(true);

      const updateData = {
        ...editedMentee,
        MUJid: selectedMentee.MUJid,
      };

      const response = await axios.put("/api/mentor/manageMentee", updateData, {
        headers: {
          "mentor-email": mentorData.email,
        },
      });

      if (response.data.success) {
        setMentees((prev) =>
          prev.map((m) => (m.MUJid === editedMentee.MUJid ? editedMentee : m))
        );

        const meetingData = JSON.parse(
          sessionStorage.getItem("meetingData") || "[]"
        );
        const updatedMeetingData = meetingData.map((meeting) => ({
          ...meeting,
          menteeDetails: meeting.menteeDetails?.map((mentee) =>
            mentee.MUJid === editedMentee.MUJid ? editedMentee : mentee
          ),
        }));
        sessionStorage.setItem(
          "meetingData",
          JSON.stringify(updatedMeetingData)
        );

        toast.success("Mentee details updated successfully");
        setIsEditing(false);
        handleEditClose();
      }
    } catch (error) {
      console.error("Error updating mentee:", error);
      toast.error(error.response?.data?.message || "Error updating mentee");
    } finally {
      setLoading(false);
    }
  };

  const handleExportClick = (event) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportAnchorEl(null);
  };

  const handleExportFormat = (format) => {
    try {
      if (!mentees.length) {
        toast.error("No data to export");
        return;
      }

      const data = mentees.map((mentee) => ({
        "MUJ ID": mentee.MUJid,
        Name: mentee.name,
        Email: mentee.email,
        Phone: mentee.phone,
        Semester: mentee.semester,
        Address: mentee.address,
        "Academic Year": mentee.academicYear,
        "Academic Session": mentee.academicSession,
        "Father's Name": mentee.parents?.father?.name || "",
        "Father's Email": mentee.parents?.father?.email || "",
        "Father's Phone": mentee.parents?.father?.phone || "",
        "Mother's Name": mentee.parents?.mother?.name || "",
        "Mother's Email": mentee.parents?.mother?.email || "",
        "Mother's Phone": mentee.parents?.mother?.phone || "",
        "Guardian's Name": mentee.parents?.guardian?.name || "",
        "Guardian's Email": mentee.parents?.guardian?.email || "",
        "Guardian's Phone": mentee.parents?.guardian?.phone || "",
        "Guardian's Relation": mentee.parents?.guardian?.relation || "",
      }));

      if (format === "xlsx") {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Mentees");
        XLSX.writeFile(
          workbook,
          `mentees_${new Date().toISOString().split("T")[0]}.xlsx`
        );
      } else {
        const headers = Object.keys(data[0]);
        const csvContent = [
          headers.join(","),
          ...data.map((row) =>
            headers.map((header) => `"${row[header] || ""}"`).join(",")
          ),
        ].join("\n");

        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `mentees_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast.success(
        `Mentees data exported successfully as ${format.toUpperCase()}`
      );
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error("Failed to export mentees data");
    } finally {
      handleExportClose();
    }
  };

  const handleExpandCard = (mujId) => {
    setExpandedCard(expandedCard === mujId ? null : mujId);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getCurrentCards = () => {
    const startIndex = (page - 1) * cardsPerPage;
    const endIndex = startIndex + cardsPerPage;
    return filteredMentees.slice(startIndex, endIndex);
  };

  const handleBulkEmailClick = () => {
    setBulkEmailDialog(true);
  };

  const handleEmailTypeSelect = (type) => {
    setEmailType(type);
    setBulkEmailDialog(false);
    setRecipientSelectionOpen(true);

    // Set default email content based on type
    if (type === "students") {
      setEmailContent({
        subject: "Important Update from Your Mentor",
        body: "Dear Students,\n\nI hope this email finds you well.\n\n[Your message here]\n\nBest regards,\n[Your Name]\nMentor"
      });
    } else {
      setEmailContent({
        subject: "Academic Update for Your Ward",
        body: "Dear Parents,\n\nI hope this email finds you well.\n\n[Your message here]\n\nBest regards,\n[Your Name]\nMentor"
      });
    }
  };

  // const handleBulkEmailSend = async () => {
  //   try {
  //     if (!selectedRecipients || selectedRecipients.length === 0) {
  //       toast.error('Please select recipients first');
  //       return;
  //     }

  //     const emails = selectedRecipients.map(mentee =>
  //       emailType === 'students' ? mentee.email :
  //       [
  //         mentee.parents?.father?.email,
  //         mentee.parents?.mother?.email,
  //         mentee.parents?.guardian?.email
  //       ].filter(Boolean)
  //     ).flat();

  //     if (emails.length === 0) {
  //       toast.error('No valid email addresses found for selected recipients');
  //       return;
  //     }

  //     setIsSendingEmail(true);
  //     const mentorData = JSON.parse(sessionStorage.getItem('mentorData'));
  //     const response = await axios.post('/api/mentor/send-bulk-email', {
  //       emails,
  //       subject: emailContent.subject,
  //       body: emailContent.body,
  //       mentorData
  //     });

  //     if (response.data.success) {
  //       toast.success('Emails sent successfully');
  //       setSelectedRecipients([]);
  //       setEmailPreview(false);
  //     }
  //   } catch (error) {
  //     console.error('Error sending bulk emails:', error);
  //     toast.error(error.message || 'Failed to send emails');
  //   } finally {
  //     setIsSendingEmail(false);
  //   }
  // };

  const MenteeCard = ({ mentee }) => {
    const isExpanded = expandedCard === mentee.MUJid;

    return (
      <Card
        sx={{
          width: "100%",
          bgcolor: "rgba(17, 17, 17, 0.8)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "1rem",
          color: "white",
          transition: "all 0.3s ease",
          mb: 2,
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
          },
        }}
      >
        <CardContent>
          <Stack spacing={1}>
            <Typography variant="h6" color="#f97316">
              {mentee.name}
            </Typography>
            <Typography variant="body2" color="rgba(255,255,255,0.7)">
              MUJ ID: {mentee.MUJid}
            </Typography>
            <Typography variant="body2" color="rgba(255,255,255,0.7)">
              Semester: {mentee.semester}
            </Typography>
            <Typography variant="body2" color="rgba(255,255,255,0.7)">
              Email: {mentee.email}
            </Typography>
            <Typography variant="body2" color="rgba(255,255,255,0.7)">
              Phone: {mentee.phone}
            </Typography>
          </Stack>
        </CardContent>
        <CardActions>
          <Button
            size="small"
            onClick={() => handleEditClick(mentee)}
            startIcon={<EditIcon />}
            sx={{
              color: "#f97316",
              "&:hover": { bgcolor: "rgba(249, 115, 22, 0.1)" },
            }}
          >
            Edit
          </Button>
          <Button
            size="small"
            onClick={() => handleExpandCard(mentee.MUJid)}
            endIcon={
              <ExpandMoreIcon
                sx={{
                  transform: isExpanded ? "rotate(180deg)" : "rotate(0)",
                  transition: "transform 0.3s",
                }}
              />
            }
            sx={{
              color: "white",
              ml: "auto",
              "&:hover": { bgcolor: "rgba(255, 255, 255, 0.1)" },
            }}
          >
            {isExpanded ? "Show Less" : "Show More"}
          </Button>
        </CardActions>
        <Collapse in={isExpanded}>
          <CardContent>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" color="#f97316">
                  Parents Information
                </Typography>
                <Typography variant="body2">
                  Father: {mentee.parents?.father?.name}
                  {mentee.parents?.father?.phone &&
                    ` (${mentee.parents.father.phone})`}
                </Typography>
                <Typography variant="body2">
                  Mother: {mentee.parents?.mother?.name}
                  {mentee.parents?.mother?.phone &&
                    ` (${mentee.parents.mother.phone})`}
                </Typography>
                {mentee.parents?.guardian?.name && (
                  <Typography variant="body2">
                    Guardian: {mentee.parents.guardian.name}
                    {mentee.parents?.guardian?.relation &&
                      ` (${mentee.parents.guardian.relation})`}
                  </Typography>
                )}
              </Box>
              <Box>
                <Typography variant="subtitle2" color="#f97316">
                  Academic
                </Typography>
                <Typography variant="body2">
                  Session: {mentee.academicSession}
                </Typography>
                <Typography variant="body2">
                  Year: {mentee.academicYear}
                </Typography>
              </Box>
              {mentee.address && (
                <Box>
                  <Typography variant="subtitle2" color="#f97316">
                    Address
                  </Typography>
                  <Typography variant="body2">{mentee.address}</Typography>
                </Box>
              )}
            </Stack>
          </CardContent>
        </Collapse>
      </Card>
    );
  };

  const columns = [
    {
      field: "MUJid",
      headerName: "MUJ ID",
      flex: 1,
      headerClassName: "super-app-theme--header",
      headerAlign: "center",
      align: "center",
    },
    {
      field: "name",
      headerName: "Name",
      flex: 1.2,
      headerClassName: "super-app-theme--header",
      headerAlign: "center",
      align: "center",
    },
    {
      field: "email",
      headerName: "Email",
      flex: 1.5,
      headerClassName: "super-app-theme--header",
      headerAlign: "center",
      align: "center",
    },
    {
      field: "phone",
      headerName: "Phone",
      flex: 1,
      headerClassName: "super-app-theme--header",
      headerAlign: "center",
      align: "center",
    },
    {
      field: "semester",
      headerName: "Semester",
      flex: 0.8,
      headerClassName: "super-app-theme--header",
      headerAlign: "center",
      align: "center",
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 0.7,
      headerClassName: "super-app-theme--header",
      headerAlign: "center",
      align: "center",
      renderCell: (params) => (
        <Box
          sx={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <IconButton
            onClick={() => handleEditClick(params.row)}
            sx={{
              color: "#f97316",
              "&:hover": { bgcolor: "rgba(249, 115, 22, 0.1)" },
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

  const generateEmailContent = (mentee, mentorData) => {
    const subject = `Academic Update for ${mentee.name} (${mentee.MUJid})`;
    const body = `
  Dear Parent,
  
  I hope this email finds you well. I am writing to provide you with an academic update for your ward, ${
    mentee.name
  }.
  
  Academic Details:
  - Current Semester: ${mentee.semester}
  - CGPA: ${mentee.cgpa || "Not available"}
  ${
    mentee.backlogs > 0
      ? `- Number of Backlogs: ${mentee.backlogs}`
      : "- No backlogs pending"
  }
  
  ${
    mentee.academicPerformance
      ? `Additional Notes:\n${mentee.academicPerformance}`
      : ""
  }
  
  Please feel free to reach out if you have any concerns or would like to discuss your ward's academic progress.
  
  Best regards,
  ${mentorData?.name || "Faculty Mentor"}
  ${mentorData?.designation || "Faculty Mentor"}
  Department of Computer Science and Engineering
  Manipal University Jaipur`;

    return { subject, body };
  };

  const handleSendEmailToParents = async () => {
    try {
      if (!selectedMentee) {
        toast.error("No mentee selected");
        return;
      }

      const parentEmails = [
        selectedMentee.parents?.father?.email,
        selectedMentee.parents?.mother?.email,
        selectedMentee.parents?.guardian?.email,
      ].filter(Boolean);

      if (parentEmails.length === 0) {
        // No parent emails available, show manual input option
        setShowManualEmailInput(true);
        setManualParentEmail("");
        toast.info("No parent emails found. Please enter email manually.");
        return;
      }

      const mentorData = JSON.parse(sessionStorage.getItem("mentorData"));
      if (!mentorData) {
        toast.error("Mentor information not available");
        return;
      }

      const content = generateEmailContent(selectedMentee, mentorData);
      setEmailContent(content);
      setEmailPreview(true);
      setShowManualEmailInput(false);
    } catch (error) {
      console.error("Error preparing email:", error);
      toast.error("Failed to prepare email");
    }
  };

  const handleSendManualEmailToParents = async () => {
    try {
      if (!selectedMentee) {
        toast.error("No mentee selected");
        return;
      }

      if (!manualParentEmail.trim() || !manualParentEmail.includes('@')) {
        toast.error("Please enter a valid email address");
        return;
      }

      const mentorData = JSON.parse(sessionStorage.getItem("mentorData"));
      if (!mentorData) {
        toast.error("Mentor information not available");
        return;
      }

      const content = generateEmailContent(selectedMentee, mentorData);
      setEmailContent(content);
      setEmailPreview(true);
      setShowManualEmailInput(false);
    } catch (error) {
      console.error("Error preparing email:", error);
      toast.error("Failed to prepare email");
    }
  };

  const handleConfirmSendEmail = async () => {
    try {
      if (!selectedMentee && selectedRecipients.length === 0) {
        toast.error("No recipients selected");
        return;
      }

      if (!emailContent.subject.trim() || !emailContent.body.trim()) {
        toast.error("Email subject and body are required");
        return;
      }

      setEmailPreview(false);
      setIsSendingEmail(true);

      const mentorData = JSON.parse(sessionStorage.getItem("mentorData"));

      if (selectedRecipients.length > 0) {
        // Collect emails based on type
        let emails = [];

        if (emailType === "students") {
          // For students, collect student emails
          emails = selectedRecipients
            .map((mentee) => mentee.email)
            .filter((email) => email && email.trim() !== "");
        } else {
          // For parents, collect parent emails with priority
          emails = selectedRecipients
            .flatMap((mentee) => {
              const parentEmails = [];
              // Priority: Father > Mother > Guardian
              if (mentee.parents?.father?.email) {
                parentEmails.push(mentee.parents.father.email);
              }
              if (mentee.parents?.mother?.email) {
                parentEmails.push(mentee.parents.mother.email);
              }
              if (mentee.parents?.guardian?.email) {
                parentEmails.push(mentee.parents.guardian.email);
              }
              return parentEmails;
            })
            .filter((email) => email && email.trim() !== "");
        }

        if (emails.length === 0) {
          throw new Error(`No valid email addresses found for selected ${emailType}`);
        }

        console.log(`Sending emails to ${emails.length} ${emailType}:`, emails);
        console.log('Email content:', { subject: emailContent.subject, body: emailContent.body });

        const response = await axios.post("/api/mentor/send-bulk-email", {
          emails,
          subject: emailContent.subject,
          body: emailContent.body,
          mentorData,
        });

        console.log('API Response:', response.data);

        if (response.data.success) {
          toast.success(`Emails sent successfully to ${emails.length} ${emailType}`);
          setSelectedRecipients([]);
        } else {
          throw new Error(response.data.message || 'Failed to send emails');
        }
      } else if (selectedMentee) {
        // Handle manual email input case
        if (showManualEmailInput && manualParentEmail) {
          if (!manualParentEmail.trim() || !manualParentEmail.includes('@')) {
            throw new Error("Please enter a valid email address");
          }

          const response = await axios.post("/api/mentor/send-email-parents", {
            parentEmails: [manualParentEmail.trim()],
            subject: emailContent.subject,
            body: emailContent.body,
            mentorData,
          });

          if (response.data.success) {
            toast.success("Email sent to parent successfully");
            setManualParentEmail("");
          }
        } else {
          // Handle existing parent emails - select only one according to priority
          let selectedParentEmail = null;

          // Priority: Father > Mother > Guardian
          if (selectedMentee.parents?.father?.email) {
            selectedParentEmail = selectedMentee.parents.father.email;
          } else if (selectedMentee.parents?.mother?.email) {
            selectedParentEmail = selectedMentee.parents.mother.email;
          } else if (selectedMentee.parents?.guardian?.email) {
            selectedParentEmail = selectedMentee.parents.guardian.email;
          }

          if (!selectedParentEmail) {
            throw new Error("No parent email addresses available");
          }

          const response = await axios.post("/api/mentor/send-email-parents", {
            parentEmails: [selectedParentEmail],
            subject: emailContent.subject,
            body: emailContent.body,
            mentorData,
          });

          if (response.data.success) {
            toast.success("Email sent to parents successfully");
          }
        }
      }
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error(error.message || "Failed to send email");
    } finally {
      setIsSendingEmail(false);
      setEmailPreview(false);
    }
  };

  return (
    <ThemeProvider theme={themeConfig}>
      <div className="min-h-screen bg-[#0a0a0a] overflow-hidden relative">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-purple-500/10 to-blue-500/10 animate-gradient" />
          <div className="absolute inset-0 backdrop-blur-3xl" />
        </div>

        <div className="relative z-10 px-4 md:px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row justify-center items-center mb-1"
          >
            <motion.h1 className="text-2xl md:text-4xl font-bold bg-clip-text  text-transparent bg-gradient-to-r from-orange-500 to-pink-500 mb-2 md:mb-0 md:mx-auto">
              My Mentees
            </motion.h1>
          </motion.div>

          <Box
            sx={{
              mt: 3,
              mb: 3,
              display: "flex",
              gap: 1,
              flexDirection: {
                xs: "column",
                sm: "column",
                md: "row",
              },
              alignItems: "stretch",
              minHeight: {
                xs: "auto",
                sm: "auto",
                md: "auto",
              },
            }}
          >
            <TextField
              fullWidth
              size="small"
              placeholder="Discover mentees by name, ID, email, phone, section, or semester..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              slotProps={{ input: {
                startAdornment: (
                  <SearchIcon
                    sx={{
                      mr: 1.5,
                      color: "rgba(255, 255, 255, 0.8)",
                      fontSize: "1.4rem",
                      filter: "drop-shadow(0 0 8px rgba(59, 130, 246, 0.4))",
                      transition: "all 0.3s ease",
                    }}
                  />
                ),
              } }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  height: "48px",
                  borderRadius: "20px",
                  background: "linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.85) 50%, rgba(51, 65, 85, 0.85) 100%)",
                  backdropFilter: "blur(25px)",
                  border: "2px solid rgba(255, 255, 255, 0.08)",
                  boxShadow: `
                    0 12px 40px rgba(0, 0, 0, 0.4),
                    inset 0 2px 4px rgba(255, 255, 255, 0.05),
                    0 0 40px rgba(59, 130, 246, 0.08)
                  `,
                  transition: "all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                  color: "rgba(255, 255, 255, 0.95)",
                  position: "relative",
                  overflow: "hidden",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: "-100%",
                    width: "100%",
                    height: "100%",
                    background: "linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.1), transparent)",
                    transition: "left 0.6s ease",
                  },
                  "&:hover": {
                    background: "linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 50%, rgba(51, 65, 85, 0.95) 100%)",
                    border: "2px solid rgba(59, 130, 246, 0.4)",
                    boxShadow: `
                      0 16px 60px rgba(0, 0, 0, 0.5),
                      inset 0 2px 4px rgba(255, 255, 255, 0.08),
                      0 0 60px rgba(59, 130, 246, 0.15),
                      0 0 100px rgba(59, 130, 246, 0.05)
                    `,
                    transform: "translateY(-2px) scale(1.01)",
                    "&::before": {
                      left: "100%",
                    },
                    "& .MuiOutlinedInput-input::placeholder": {
                      color: "rgba(255, 255, 255, 0.7)",
                      transform: "translateX(2px)",
                    },
                  },
                  "&.Mui-focused": {
                    background: "linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 50%, rgba(51, 65, 85, 0.98) 100%)",
                    border: "2px solid rgba(59, 130, 246, 0.6)",
                    boxShadow: `
                      0 20px 80px rgba(0, 0, 0, 0.6),
                      inset 0 2px 4px rgba(255, 255, 255, 0.1),
                      0 0 80px rgba(59, 130, 246, 0.25),
                      0 0 120px rgba(59, 130, 246, 0.1)
                    `,
                    transform: "translateY(-3px) scale(1.02)",
                    "&::before": {
                      left: "100%",
                      background: "linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.2), transparent)",
                    },
                    "& .MuiOutlinedInput-input::placeholder": {
                      color: "rgba(255, 255, 255, 0.5)",
                      opacity: 0.6,
                      transform: "translateX(4px)",
                      fontSize: "0.85rem",
                    },
                  },
                  "& .MuiOutlinedInput-input": {
                    fontSize: "0.95rem",
                    fontWeight: "500",
                    letterSpacing: "0.025em",
                    "&::placeholder": {
                      color: "rgba(255, 255, 255, 0.6)",
                      opacity: 0.8,
                      fontSize: "0.9rem",
                      fontWeight: "400",
                      transition: "all 0.3s ease",
                    },
                    "&:focus::placeholder": {
                      opacity: 0.4,
                    },
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    display: "none",
                  },
                },
              }}
            />
            {/* <Box sx={''}> */}
            <Button
              variant="contained"
              onClick={handleBulkEmailClick}
              startIcon={<SendIcon />}
              sx={{
                position: "relative",
                overflow: "hidden",
                bgcolor: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                color: "white",
                fontWeight: "bold",
                fontSize: "0.875rem",
                px: 2,
                py: 0.25,
                borderRadius: "12px",
                boxShadow: "0 4px 15px rgba(249, 115, 22, 0.3)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                textTransform: "none",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: "-100%",
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)",
                  transition: "left 0.5s",
                },
                "&:hover": {
                  bgcolor: "linear-gradient(135deg, #ea580c 0%, #dc2626 100%)",
                  boxShadow: "0 6px 20px rgba(249, 115, 22, 0.4)",
                  transform: "translateY(-2px)",
                  "&::before": {
                    left: "100%",
                  },
                },
                "&:active": {
                  transform: "translateY(0)",
                  boxShadow: "0 2px 10px rgba(249, 115, 22, 0.3)",
                },
              }}
            >
              Send Emails
            </Button>

            <Button
              variant="contained"
              onClick={handleExportClick}
              startIcon={<FileDownloadIcon />}
              sx={{
                position: "relative",
                overflow: "hidden",
                mt: 1,
                bgcolor: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
                color: "white",
                fontWeight: "bold",
                fontSize: "0.875rem",
                px: 2,
                py: 0.25,
                borderRadius: "12px",
                boxShadow: "0 4px 15px rgba(6, 182, 212, 0.3)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                textTransform: "none",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: "-100%",
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)",
                  transition: "left 0.5s",
                },
                "&:hover": {
                  bgcolor: "linear-gradient(135deg, #0891b2 0%, #0e7490 100%)",
                  boxShadow: "0 6px 20px rgba(6, 182, 212, 0.4)",
                  transform: "translateY(-2px)",
                  "&::before": {
                    left: "100%",
                  },
                },
                "&:active": {
                  transform: "translateY(0)",
                  boxShadow: "0 2px 10px rgba(6, 182, 212, 0.3)",
                },
                "& .MuiButton-startIcon": {
                  mr: 1,
                  transition: "transform 0.2s ease",
                },
                "&:hover .MuiButton-startIcon": {
                  transform: "translateY(-1px) scale(1.1)",
                },
              }}
            >
              Export
            </Button>
            {/* </Box> */}
          </Box>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden p-1"
          >
            {loading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  minHeight: {
                    xs: "250px",
                    sm: "300px",
                    md: "400px",
                  },
                  maxHeight: {
                    xs: "350px",
                    sm: "400px",
                    md: "500px",
                  },
                  height: {
                    xs: "50vh",
                    sm: "55vh",
                    md: "60vh",
                  },
                  flexDirection: "column",
                  gap: 1,
                  color: "white",
                  backdropFilter: "blur(8px)",
                }}
              >
                <CircularProgress sx={{ color: "#f97316" }} />
                <Typography sx={{ color: "white", opacity: 0.7 }}>
                  Loading mentees...
                </Typography>
              </Box>
            ) : filteredMentees.length > 0 ? (
              isMobile ? (
                <Box>
                  {getCurrentCards().map((mentee) => (
                    <MenteeCard key={mentee.MUJid} mentee={mentee} />
                  ))}
                  <Box
                    sx={{
                      mt: 3,
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <Pagination
                      count={Math.ceil(filteredMentees.length / cardsPerPage)}
                      page={page}
                      onChange={handlePageChange}
                      sx={{
                        "& .MuiPaginationItem-root": {
                          color: "white",
                          "&.Mui-selected": {
                            backgroundColor: "#f97316",
                          },
                        },
                      }}
                    />
                  </Box>
                </Box>
              ) : (
                <Box
                  sx={{
                    minHeight: {
                      xs: "calc(100vh - 350px)",
                      sm: "calc(100vh - 320px)",
                      md: "calc(100vh - 280px)",
                    },
                    maxHeight: {
                      xs: "calc(100vh - 300px)",
                      sm: "calc(100vh - 270px)",
                      md: "calc(100vh - 200px)",
                    },
                    height: {
                      xs: "60vh",
                      sm: "65vh",
                      md: "70vh",
                    },
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <DataGrid
                    rows={filteredMentees}
                    columns={columns}
                    getRowId={(row) => row.MUJid}
                    disableRowSelectionOnClick
                    disableSelectionOnClick={true}
                    disableColumnMenu={true}
                    disableColumnFilter={false}
                    pageSizeOptions={[5, 10, 25, 50]}
                    initialState={{
                      pagination: {
                        paginationModel: {
                          pageSize: 10,
                        },
                      },
                    }}
                    sx={{
                      flex: 1,
                      border: "none",
                      "& .MuiDataGrid-cell": {
                        borderColor: "rgba(255, 255, 255, 0.1)",
                      },
                      "& .MuiDataGrid-columnHeaders": {
                        background: "linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(51, 65, 85, 0.95) 100%)",
                        color: "#fbbf24",
                        fontWeight: "600",
                        fontSize: "0.9rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        borderColor: "rgba(255, 255, 255, 0.15)",
                        borderBottom: "2px solid rgba(59, 130, 246, 0.3)",
                        position: "sticky",
                        top: 0,
                        zIndex: 2,
                        backdropFilter: "blur(10px)",
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                        "& .MuiDataGrid-columnHeaderTitle": {
                          fontWeight: "600",
                          color: "#fbbf24",
                        },
                        "& .MuiDataGrid-columnSeparator": {
                          color: "rgba(59, 130, 246, 0.3)",
                        },
                        "&:hover": {
                          background: "linear-gradient(135deg, rgba(30, 41, 59, 0.98) 0%, rgba(51, 65, 85, 0.98) 100%)",
                        },
                      },
                      "& .MuiDataGrid-virtualScroller": {
                        minHeight: "200px",
                      },
                      "& .MuiDataGrid-footerContainer": {
                        background: "linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(51, 65, 85, 0.95) 100%)",
                        borderTop: "2px solid rgba(59, 130, 246, 0.3)",
                        position: "sticky",
                        bottom: 0,
                        zIndex: 2,
                        backdropFilter: "blur(10px)",
                        boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                      },
                      "& .MuiDataGrid-row:hover": {
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                      },
                      "& .MuiDataGrid-menuIcon": {
                        color: "white",
                      },
                      "& .MuiDataGrid-sortIcon": {
                        color: "red",
                      },
                      "& .MuiDataGrid-pagination": {
                        color: "orange",
                      },
                      "& .MuiTablePagination-root": {
                        color: "orange",
                      },
                      "& .MuiTablePagination-select": {
                        color: "red",
                      },
                      "& .MuiTablePagination-selectIcon": {
                        color: "red",
                      },
                      "& .MuiIconButton-root": {
                        color: "orange",
                      },
                    }}
                    className="custom-scrollbar"
                  />
                </Box>
              )
            ) : (
              <Box
                sx={{
                  p: 4,
                  textAlign: "center",
                  color: "white",
                  backdropFilter: "blur(8px)",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderRadius: "1rem",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                <Typography variant="h6" sx={{ mb: 2, color: "#f97316" }}>
                  No Mentees Found
                </Typography>
                <Typography
                  sx={{
                    mb: 2,
                    color: "rgba(255, 255, 255, 0.7)",
                  }}
                >
                  Try adjusting your filters or add new mentees
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "rgba(255, 255, 255, 0.5)" }}
                >
                  Academic Year:{" "}
                  {(() => {
                    const mentorData = JSON.parse(sessionStorage.getItem("mentorData") || "{}");
                    return mentorData?.academicYear || "N/A";
                  })()}
                  <br />
                  Session:{" "}
                  {(() => {
                    const mentorData = JSON.parse(sessionStorage.getItem("mentorData") || "{}");
                    return mentorData?.academicSession || "N/A";
                  })()}
                </Typography>
              </Box>
            )}
          </motion.div>
        </div>

        <Menu
          anchorEl={exportAnchorEl}
          open={Boolean(exportAnchorEl)}
          onClose={handleExportClose}
          slotProps={{ paper: {
            sx: {
              background:
                "linear-gradient(135deg, rgba(17, 17, 17, 0.95), rgba(31, 41, 55, 0.95))",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "0.75rem",
              mt: 1,
              minWidth: "200px",
              "& .MuiMenuItem-root": {
                color: "white",
                fontSize: "0.875rem",
                transition: "all 0.2s",
                "&:hover": {
                  bgcolor: "rgba(249, 115, 22, 0.1)",
                },
              },
            },
          } }}
        >
          <MenuItem onClick={() => handleExportFormat("xlsx")}>
            Export as Excel (.xlsx)
          </MenuItem>
          <MenuItem onClick={() => handleExportFormat("csv")}>
            Export as CSV (.csv)
          </MenuItem>
        </Menu>

        <Dialog
          open={editDialog}
          onClose={handleEditClose}
          maxWidth="md"
          fullWidth
          keepMounted
          slotProps={{ transition: {
            timeout: 300,
          }, paper: {
            sx: {
              background:
                "linear-gradient(135deg, rgba(17, 17, 17, 0.95), rgba(31, 41, 55, 0.95))",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: theme.breakpoints.down("sm")
                ? "1rem 1rem 0 0"
                : "1rem",
              color: "white",
              [theme.breakpoints.down("sm")]: {
                margin: 0,
                width: "100%",
              },
            },
          } }}
        >
          <DialogTitle
            sx={{
              borderBottom: "1px solid rgba(100, 100, 100, 0.1)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              p: theme.breakpoints.down("sm") ? 1.5 : 2,
              "& .MuiTypography-root": {
                fontSize: theme.breakpoints.down("sm") ? "1.25rem" : "1.5rem",
              },
            }}
          >
            <Box component="div" sx={{ typography: "h6", color: "white" }}>
              {isEditing ? "Edit Mentee Details" : "View Mentee Details"}
            </Box>
            {!isEditing && (
              <IconButton
                onClick={handleEditMode}
                sx={{
                  color: "#f97316",
                  "&:hover": {
                    bgcolor: "rgba(249, 115, 22, 0.1)",
                  },
                }}
              >
                <EditIcon />
              </IconButton>
            )}
          </DialogTitle>
          <DialogContent sx={dialogStyles.dialogContent}>
            {(isEditing ? editedMentee : selectedMentee) && (
              <Box sx={dialogStyles.contentWrapper}>
                <Card
                  sx={{
                    background: isEditing
                      ? "linear-gradient(135deg, rgba(249,115,22,0.12), rgba(249,115,22,0.06))"
                      : "linear-gradient(135deg, rgba(249,115,22,0.10), rgba(249,115,22,0.05))",
                    borderRadius: "1rem",
                    border: isEditing
                      ? "1px solid rgba(249,115,22,0.35)"
                      : "1px solid rgba(249,115,22,0.20)",
                    boxShadow: isEditing
                      ? "0 0 0 1px rgba(249,115,22,0.25), 0 8px 24px rgba(0,0,0,0.25)"
                      : "none",
                    transition:
                      "box-shadow 160ms ease, border-color 160ms ease, background 160ms ease",
                    p: 3,
                    mb: 3,
                  }}
                >
                  <Typography variant="h6" color="#f97316" gutterBottom>
                    Editable Information
                  </Typography>

                  <Grid2 container spacing={2}>
                    <Grid2 xs={12} md={6}>
                      <TextField
                        label="Name"
                        name="name"
                        value={
                          (isEditing
                            ? editedMentee.name
                            : selectedMentee.name) || ""
                        }
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        autoFocus={isEditing}
                        fullWidth
                        slotProps={{ input: {
                          startAdornment: (
                            <PersonIcon
                              sx={{
                                mr: 1,
                                color: isEditing
                                  ? "#f97316"
                                  : "rgba(255,255,255,0.5)",
                              }}
                            />
                          ),
                        } }}
                        sx={{
                          mb: 2,
                          "& .MuiOutlinedInput-root": isEditing
                            ? {
                                bgcolor: "rgba(255,255,255,0.06)",
                                boxShadow:
                                  "0 0 0 2px rgba(249,115,22,0.15) inset",
                                "& .MuiOutlinedInput-notchedOutline": {
                                  borderColor: "rgba(249,115,22,0.6)",
                                },
                              }
                            : {},
                        }}
                      />
                      <TextField
                        label="Phone"
                        name="phone"
                        value={
                          (isEditing
                            ? editedMentee.phone
                            : selectedMentee.phone) || ""
                        }
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        fullWidth
                        slotProps={{ input: {
                          startAdornment: (
                            <PhoneIcon
                              sx={{
                                mr: 1,
                                color: isEditing
                                  ? "#f97316"
                                  : "rgba(255,255,255,0.5)",
                              }}
                            />
                          ),
                        } }}
                        sx={{
                          mb: 2,
                          "& .MuiOutlinedInput-root": isEditing
                            ? {
                                bgcolor: "rgba(255,255,255,0.06)",
                                boxShadow:
                                  "0 0 0 2px rgba(249,115,22,0.15) inset",
                                "& .MuiOutlinedInput-notchedOutline": {
                                  borderColor: "rgba(249,115,22,0.6)",
                                },
                              }
                            : {},
                        }}
                      />
                    </Grid2>

                    <Grid2 xs={12} md={6}>
                      <TextField
                        label="Address"
                        name="address"
                        multiline
                        rows={4}
                        value={
                          (isEditing
                            ? editedMentee.address
                            : selectedMentee.address) || ""
                        }
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        fullWidth
                        slotProps={{ input: {
                          startAdornment: (
                            <HomeIcon
                              sx={{
                                mr: 1,
                                color: isEditing
                                  ? "#f97316"
                                  : "rgba(255,255,255,0.5)",
                                alignSelf: "flex-start",
                                mt: 1,
                              }}
                            />
                          ),
                        } }}
                        sx={{
                          "& .MuiOutlinedInput-root": isEditing
                            ? {
                                bgcolor: "rgba(255,255,255,0.06)",
                                boxShadow:
                                  "0 0 0 2px rgba(249,115,22,0.15) inset",
                                "& .MuiOutlinedInput-notchedOutline": {
                                  borderColor: "rgba(249,115,22,0.6)",
                                },
                              }
                            : {},
                        }}
                      />
                    </Grid2>
                  </Grid2>
                </Card>

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                    minHeight: 0,
                  }}
                >
                  <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    variant="fullWidth"
                    sx={{
                      minHeight: theme.breakpoints.down("sm") ? "56px" : "64px",
                      borderBottom: "1px solid rgba(255,255,255,0.1)",
                      mb: theme.breakpoints.down("sm") ? 2 : 3,
                      "& .MuiTab-root": {
                        minHeight: theme.breakpoints.down("sm")
                          ? "56px"
                          : "64px",
                        color: "rgba(255,255,255,0.7)",
                        fontSize: theme.breakpoints.down("sm")
                          ? "0.875rem"
                          : "1rem",
                        transition: "all 0.3s",
                        padding: theme.breakpoints.down("sm")
                          ? "6px 12px"
                          : "12px 16px",
                        "&.Mui-selected": { color: "#f97316" },
                        "& .MuiSvgIcon-root": {
                          mb: 0.5,
                          fontSize: theme.breakpoints.down("sm")
                            ? "1.25rem"
                            : "1.5rem",
                        },
                        "&:hover": {
                          backgroundColor: "rgba(249, 115, 22, 0.08)",
                          color: "#f97316",
                        },
                      },
                      "& .MuiTabs-indicator": {
                        backgroundColor: "#f97316",
                        height: "3px",
                      },
                    }}
                  >
                    <Tab icon={<PersonIcon />} label="Personal" />
                    <Tab icon={<SchoolIcon />} label="Academic" />
                    <Tab icon={<FamilyRestroomIcon />} label="Family" />
                  </Tabs>

                  <Box sx={{ flex: 1, overflowY: "auto", px: 0.5 }}>
                    {tabValue === 0 && (
                      <Box sx={tabContentStyles.wrapper}>
                        <Card sx={tabContentStyles.contentCard}>
                          <Grid2 container spacing={3} justifyContent="center">
                            <Grid2 xs={12} md={6}>
                              <Stack spacing={2}>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <BadgeIcon sx={{ color: "#f97316" }} />
                                  <Box>
                                    <Typography
                                      variant="caption"
                                      color="rgba(255,255,255,0.7)"
                                    >
                                      MUJ ID
                                    </Typography>
                                    <Typography>
                                      {selectedMentee.MUJid}
                                    </Typography>
                                  </Box>
                                </Box>

                                <Box display="flex" alignItems="center" gap={1}>
                                  <EmailIcon sx={{ color: "#f97316" }} />
                                  <Box>
                                    <Typography
                                      variant="caption"
                                      color="rgba(255,255,255,0.7)"
                                    >
                                      Email
                                    </Typography>
                                    <Typography>
                                      {selectedMentee.email}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Stack>
                            </Grid2>

                            <Grid2 xs={12} md={6}>
                              <Stack spacing={2}>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <HomeIcon sx={{ color: "#f97316" }} />
                                  <Box>
                                    <Typography
                                      variant="caption"
                                      color="rgba(255,255,255,0.7)"
                                    >
                                      Current Address
                                    </Typography>
                                    <Typography>
                                      {selectedMentee.address}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Stack>
                            </Grid2>
                          </Grid2>
                        </Card>
                      </Box>
                    )}

                    {tabValue === 1 && (
                      <Box sx={tabContentStyles.wrapper}>
                        <Card sx={tabContentStyles.contentCard}>
                          <Grid2 container spacing={3} justifyContent="center">
                            <Grid2 xs={12} md={6}>
                              <Card
                                elevation={0}
                                sx={tabContentStyles.academicCard}
                              >
                                <Typography
                                  variant="subtitle1"
                                  color="#f97316"
                                  sx={tabContentStyles.sectionTitle}
                                >
                                  <SchoolIcon /> Current Status
                                </Typography>

                                <Stack spacing={2}>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 2,
                                      p: 1.5,
                                      bgcolor: "rgba(255, 255, 255, 0.03)",
                                      borderRadius: "0.75rem",
                                    }}
                                  >
                                    <GradeIcon
                                      sx={{
                                        color: "#f97316",
                                        fontSize: "1.75rem",
                                      }}
                                    />
                                    <Box>
                                      <Typography variant="h4" color="white">
                                        {selectedMentee.cgpa || "N/A"}
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        color="rgba(255,255,255,0.7)"
                                      >
                                        Current CGPA
                                      </Typography>
                                    </Box>
                                  </Box>

                                  <Grid2 container spacing={2}>
                                    <Grid2 xs={6}>
                                      <Box sx={tabContentStyles.statBox}>
                                        <Typography
                                          variant="body1"
                                          color="white"
                                          sx={{ fontSize: "1.25rem" }}
                                        >
                                          {selectedMentee.semester || "N/A"}
                                        </Typography>
                                        <Typography
                                          variant="caption"
                                          color="rgba(255,255,255,0.7)"
                                        >
                                          Semester
                                        </Typography>
                                      </Box>
                                    </Grid2>
                                    <Grid2 xs={6}>
                                      <Box sx={tabContentStyles.statBox}>
                                        <Typography
                                          variant="body1"
                                          color="white"
                                          sx={{ fontSize: "1.25rem" }}
                                        >
                                          {selectedMentee.backlogs || "0"}
                                        </Typography>
                                        <Typography
                                          variant="caption"
                                          color="rgba(255,255,255,0.7)"
                                        >
                                          Backlogs
                                        </Typography>
                                      </Box>
                                    </Grid2>
                                  </Grid2>
                                </Stack>
                              </Card>
                            </Grid2>

                            <Grid2 xs={12} md={6}>
                              <Card
                                elevation={0}
                                sx={tabContentStyles.academicCard}
                              >
                                <Typography
                                  variant="subtitle1"
                                  color="#f97316"
                                  sx={tabContentStyles.sectionTitle}
                                >
                                  <CalendarTodayIcon /> Academic Information
                                </Typography>

                                <Stack spacing={2}>
                                  <Box
                                    sx={{
                                      p: 1.5,
                                      bgcolor: "rgba(255, 255, 255, 0.03)",
                                      borderRadius: "0.75rem",
                                    }}
                                  >
                                    <Grid2 container spacing={2}>
                                      <Grid2 xs={12} sm={6}>
                                        <Typography
                                          variant="caption"
                                          color="rgba(255,255,255,0.7)"
                                        >
                                          Academic Year
                                        </Typography>
                                        <Typography
                                          variant="body2"
                                          color="white"
                                        >
                                          {selectedMentee.academicYear}
                                        </Typography>
                                      </Grid2>
                                      <Grid2 xs={12} sm={6}>
                                        <Typography
                                          variant="caption"
                                          color="rgba(255,255,255,0.7)"
                                        >
                                          Academic Session
                                        </Typography>
                                        <Typography
                                          variant="body2"
                                          color="white"
                                        >
                                          {selectedMentee.academicSession}
                                        </Typography>
                                      </Grid2>
                                    </Grid2>
                                  </Box>

                                  {selectedMentee.academicPerformance && (
                                    <Box
                                      sx={{
                                        p: 1.5,
                                        bgcolor: "rgba(255, 255, 255, 0.03)",
                                        borderRadius: "0.75rem",
                                      }}
                                    >
                                      <Typography
                                        variant="caption"
                                        color="rgba(255,255,255,0.7)"
                                        gutterBottom
                                      >
                                        Performance Notes
                                      </Typography>
                                      <Typography
                                        variant="body2"
                                        color="white"
                                        sx={{
                                          whiteSpace: "pre-wrap",
                                          fontSize: "0.875rem",
                                        }}
                                      >
                                        {selectedMentee.academicPerformance}
                                      </Typography>
                                    </Box>
                                  )}
                                </Stack>
                              </Card>
                            </Grid2>
                          </Grid2>
                        </Card>
                      </Box>
                    )}

                    {tabValue === 2 && (
                      <Box sx={tabContentStyles.wrapper}>
                        <Card sx={tabContentStyles.contentCard}>
                          <Grid2 container spacing={3} justifyContent="center">
                            <Grid2 xs={12} md={4}>
                              <Typography
                                variant="subtitle2"
                                color="#f97316"
                                gutterBottom
                              >
                                Father&apos;s Details
                              </Typography>
                              <Stack spacing={2}>
                                <TextField
                                  label="Father's Name"
                                  value={
                                    isEditing
                                      ? editedMentee.parents?.father?.name || ""
                                      : selectedMentee.parents?.father?.name || ""
                                  }
                                  onChange={(e) => handleInputChange(e, "father", "name")}
                                  disabled={!isEditing}
                                  fullWidth
                                  size="small"
                                  sx={{
                                    "& .MuiOutlinedInput-root": isEditing
                                      ? {
                                          bgcolor: "rgba(255,255,255,0.06)",
                                          boxShadow:
                                            "0 0 0 2px rgba(249,115,22,0.15) inset",
                                          "& .MuiOutlinedInput-notchedOutline": {
                                            borderColor: "rgba(249,115,22,0.6)",
                                          },
                                        }
                                      : {},
                                  }}
                                />
                                <TextField
                                  label="Father's Phone"
                                  value={
                                    isEditing
                                      ? editedMentee.parents?.father?.phone || ""
                                      : selectedMentee.parents?.father?.phone || ""
                                  }
                                  onChange={(e) => handleInputChange(e, "father", "phone")}
                                  disabled={!isEditing}
                                  fullWidth
                                  size="small"
                                  sx={{
                                    "& .MuiOutlinedInput-root": isEditing
                                      ? {
                                          bgcolor: "rgba(255,255,255,0.06)",
                                          boxShadow:
                                            "0 0 0 2px rgba(249,115,22,0.15) inset",
                                          "& .MuiOutlinedInput-notchedOutline": {
                                            borderColor: "rgba(249,115,22,0.6)",
                                          },
                                        }
                                      : {},
                                  }}
                                />
                                <TextField
                                  label="Father's Email"
                                  type="email"
                                  value={
                                    isEditing
                                      ? editedMentee.parents?.father?.email || ""
                                      : selectedMentee.parents?.father?.email || ""
                                  }
                                  onChange={(e) => handleInputChange(e, "father", "email")}
                                  disabled={!isEditing}
                                  fullWidth
                                  size="small"
                                  sx={{
                                    "& .MuiOutlinedInput-root": isEditing
                                      ? {
                                          bgcolor: "rgba(255,255,255,0.06)",
                                          boxShadow:
                                            "0 0 0 2px rgba(249,115,22,0.15) inset",
                                          "& .MuiOutlinedInput-notchedOutline": {
                                            borderColor: "rgba(249,115,22,0.6)",
                                          },
                                        }
                                      : {},
                                  }}
                                />
                              </Stack>
                            </Grid2>

                            <Grid2 xs={12} md={4}>
                              <Typography
                                variant="subtitle2"
                                color="#f97316"
                                gutterBottom
                              >
                                Mother&apos;s Details
                              </Typography>
                              <Stack spacing={2}>
                                <TextField
                                  label="Mother's Name"
                                  value={
                                    isEditing
                                      ? editedMentee.parents?.mother?.name || ""
                                      : selectedMentee.parents?.mother?.name || ""
                                  }
                                  onChange={(e) => handleInputChange(e, "mother", "name")}
                                  disabled={!isEditing}
                                  fullWidth
                                  size="small"
                                  sx={{
                                    "& .MuiOutlinedInput-root": isEditing
                                      ? {
                                          bgcolor: "rgba(255,255,255,0.06)",
                                          boxShadow:
                                            "0 0 0 2px rgba(249,115,22,0.15) inset",
                                          "& .MuiOutlinedInput-notchedOutline": {
                                            borderColor: "rgba(249,115,22,0.6)",
                                          },
                                        }
                                      : {},
                                  }}
                                />
                                <TextField
                                  label="Mother's Phone"
                                  value={
                                    isEditing
                                      ? editedMentee.parents?.mother?.phone || ""
                                      : selectedMentee.parents?.mother?.phone || ""
                                  }
                                  onChange={(e) => handleInputChange(e, "mother", "phone")}
                                  disabled={!isEditing}
                                  fullWidth
                                  size="small"
                                  sx={{
                                    "& .MuiOutlinedInput-root": isEditing
                                      ? {
                                          bgcolor: "rgba(255,255,255,0.06)",
                                          boxShadow:
                                            "0 0 0 2px rgba(249,115,22,0.15) inset",
                                          "& .MuiOutlinedInput-notchedOutline": {
                                            borderColor: "rgba(249,115,22,0.6)",
                                          },
                                        }
                                      : {},
                                  }}
                                />
                                <TextField
                                  label="Mother's Email"
                                  type="email"
                                  value={
                                    isEditing
                                      ? editedMentee.parents?.mother?.email || ""
                                      : selectedMentee.parents?.mother?.email || ""
                                  }
                                  onChange={(e) => handleInputChange(e, "mother", "email")}
                                  disabled={!isEditing}
                                  fullWidth
                                  size="small"
                                  sx={{
                                    "& .MuiOutlinedInput-root": isEditing
                                      ? {
                                          bgcolor: "rgba(255,255,255,0.06)",
                                          boxShadow:
                                            "0 0 0 2px rgba(249,115,22,0.15) inset",
                                          "& .MuiOutlinedInput-notchedOutline": {
                                            borderColor: "rgba(249,115,22,0.6)",
                                          },
                                        }
                                      : {},
                                  }}
                                />
                              </Stack>
                            </Grid2>

                            <Grid2 xs={12} md={4}>
                              <Typography
                                variant="subtitle2"
                                color="#f97316"
                                gutterBottom
                              >
                                Guardian&apos;s Details
                              </Typography>
                              <Stack spacing={2}>
                                <TextField
                                  label="Guardian's Name"
                                  value={
                                    isEditing
                                      ? editedMentee.parents?.guardian?.name || ""
                                      : selectedMentee.parents?.guardian?.name || ""
                                  }
                                  onChange={(e) => handleInputChange(e, "guardian", "name")}
                                  disabled={!isEditing}
                                  fullWidth
                                  size="small"
                                  sx={{
                                    "& .MuiOutlinedInput-root": isEditing
                                      ? {
                                          bgcolor: "rgba(255,255,255,0.06)",
                                          boxShadow:
                                            "0 0 0 2px rgba(249,115,22,0.15) inset",
                                          "& .MuiOutlinedInput-notchedOutline": {
                                            borderColor: "rgba(249,115,22,0.6)",
                                          },
                                        }
                                      : {},
                                  }}
                                />
                                <TextField
                                  label="Relation"
                                  value={
                                    isEditing
                                      ? editedMentee.parents?.guardian?.relation || ""
                                      : selectedMentee.parents?.guardian?.relation || ""
                                  }
                                  onChange={(e) => handleInputChange(e, "guardian", "relation")}
                                  disabled={!isEditing}
                                  fullWidth
                                  size="small"
                                  sx={{
                                    "& .MuiOutlinedInput-root": isEditing
                                      ? {
                                          bgcolor: "rgba(255,255,255,0.06)",
                                          boxShadow:
                                            "0 0 0 2px rgba(249,115,22,0.15) inset",
                                          "& .MuiOutlinedInput-notchedOutline": {
                                            borderColor: "rgba(249,115,22,0.6)",
                                          },
                                        }
                                      : {},
                                  }}
                                />
                                <TextField
                                  label="Guardian's Phone"
                                  value={
                                    isEditing
                                      ? editedMentee.parents?.guardian?.phone || ""
                                      : selectedMentee.parents?.guardian?.phone || ""
                                  }
                                  onChange={(e) => handleInputChange(e, "guardian", "phone")}
                                  disabled={!isEditing}
                                  fullWidth
                                  size="small"
                                  sx={{
                                    "& .MuiOutlinedInput-root": isEditing
                                      ? {
                                          bgcolor: "rgba(255,255,255,0.06)",
                                          boxShadow:
                                            "0 0 0 2px rgba(249,115,22,0.15) inset",
                                          "& .MuiOutlinedInput-notchedOutline": {
                                            borderColor: "rgba(249,115,22,0.6)",
                                          },
                                        }
                                      : {},
                                  }}
                                />
                              </Stack>
                            </Grid2>
                          </Grid2>
                        </Card>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            )}
          </DialogContent>

          <DialogActions
            sx={{
              borderTop: "1px solid rgba(100, 100, 100, 0.1)",
              p: theme.breakpoints.down("sm") ? 1.5 : 2,
              gap: 1,
              [theme.breakpoints.down("sm")]: {
                position: "sticky",
                bottom: 0,
                bgcolor: "rgba(17, 17, 17, 0.95)",
                backdropFilter: "blur(10px)",
              },
            }}
          >
            <Button
              onClick={handleEditClose}
              variant="outlined"
              sx={{
                color: "white",
                borderColor: "rgba(255, 255, 255, 0.2)",
                "&:hover": {
                  borderColor: "rgba(255, 255, 255, 0.5)",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendEmailToParents}
              variant="contained"
              disabled={isSendingEmail}
              startIcon={
                isSendingEmail ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <SendIcon />
                )
              }
              sx={{
                position: "relative",
                overflow: "hidden",
                bgcolor: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                color: "white",
                fontWeight: "bold",
                fontSize: "0.95rem",
                px: 3,
                py: 1.5,
                borderRadius: "12px",
                boxShadow: "0 4px 15px rgba(249, 115, 22, 0.3)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: "-100%",
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)",
                  transition: "left 0.5s",
                },
                "&:hover": {
                  bgcolor: "linear-gradient(135deg, #ea580c 0%, #dc2626 100%)",
                  boxShadow: "0 6px 20px rgba(249, 115, 22, 0.4)",
                  transform: "translateY(-2px)",
                  "&::before": {
                    left: "100%",
                  },
                },
                "&:active": {
                  transform: "translateY(0)",
                  boxShadow: "0 2px 10px rgba(249, 115, 22, 0.3)",
                },
                "&.Mui-disabled": {
                  bgcolor: "rgba(156, 163, 175, 0.5)",
                  color: "rgba(255, 255, 255, 0.7)",
                  boxShadow: "none",
                  transform: "none",
                  "&::before": {
                    display: "none",
                  },
                },
                "& .MuiButton-startIcon": {
                  mr: 1,
                  transition: "transform 0.2s ease",
                },
                "&:hover .MuiButton-startIcon": {
                  transform: "translateX(2px)",
                },
              }}
            >
              {isSendingEmail ? "Sending..." : "Email Parents"}
            </Button>
            {isEditing && (
              <Button
                onClick={handleUpdate}
                variant="contained"
                startIcon={<SaveIcon />}
                sx={{
                  position: "relative",
                  overflow: "hidden",
                  bgcolor: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "0.95rem",
                  px: 3,
                  py: 1.5,
                  borderRadius: "12px",
                  boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  textTransform: "none",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: "-100%",
                    width: "100%",
                    height: "100%",
                    background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)",
                    transition: "left 0.5s",
                  },
                  "&:hover": {
                    bgcolor: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                    boxShadow: "0 6px 20px rgba(16, 185, 129, 0.4)",
                    transform: "translateY(-2px)",
                    "&::before": {
                      left: "100%",
                    },
                  },
                  "&:active": {
                    transform: "translateY(0)",
                    boxShadow: "0 2px 10px rgba(16, 185, 129, 0.3)",
                  },
                  "& .MuiButton-startIcon": {
                    mr: 1,
                    transition: "transform 0.2s ease",
                  },
                  "&:hover .MuiButton-startIcon": {
                    transform: "scale(1.1)",
                  },
                }}
              >
                Save Changes
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Manual Email Input Dialog */}
        <Dialog
          open={showManualEmailInput}
          onClose={() => setShowManualEmailInput(false)}
          maxWidth="sm"
          fullWidth
          slotProps={{ paper: {
            sx: {
              background:
                "linear-gradient(135deg, rgba(17, 17, 17, 0.95), rgba(31, 41, 55, 0.95))",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "1rem",
              color: "white",
            },
          } }}
        >
          <DialogTitle sx={{ borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
            Enter Parent Email Address
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <DialogContentText sx={{ color: "rgba(255, 255, 255, 0.7)", mb: 2 }}>
              No parent email addresses were found for {selectedMentee?.name}. Please enter the email address manually:
            </DialogContentText>
            <TextField
              fullWidth
              label="Parent Email Address"
              type="email"
              value={manualParentEmail}
              onChange={(e) => setManualParentEmail(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  color: "white",
                  bgcolor: "rgba(255, 255, 255, 0.05)",
                  "& fieldset": {
                    borderColor: "rgba(255, 255, 255, 0.2)",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(255, 255, 255, 0.3)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#f97316",
                  },
                },
                "& .MuiInputLabel-root": {
                  color: "rgba(255, 255, 255, 0.7)",
                  "&.Mui-focused": {
                    color: "#f97316",
                  },
                },
              }}
              helperText="Enter a valid email address to send the message"
              slotProps={{ formHelperText: {
                sx: { color: "rgba(255, 255, 255, 0.5)" },
              } }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5, gap: 1 }}>
            <Button
              onClick={() => setShowManualEmailInput(false)}
              variant="outlined"
              sx={{
                color: "white",
                borderColor: "rgba(255, 255, 255, 0.2)",
                "&:hover": {
                  borderColor: "rgba(255, 255, 255, 0.5)",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendManualEmailToParents}
              variant="contained"
              disabled={!manualParentEmail.trim() || !manualParentEmail.includes('@')}
              sx={{
                position: "relative",
                overflow: "hidden",
                bgcolor: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                color: "white",
                fontWeight: "bold",
                fontSize: "0.9rem",
                px: 2.5,
                py: 1.25,
                borderRadius: "10px",
                boxShadow: "0 4px 15px rgba(139, 92, 246, 0.3)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: "-100%",
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)",
                  transition: "left 0.5s",
                },
                "&:hover": {
                  bgcolor: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                  boxShadow: "0 6px 20px rgba(139, 92, 246, 0.4)",
                  transform: "translateY(-1px)",
                  "&::before": {
                    left: "100%",
                  },
                },
                "&:active": {
                  transform: "translateY(0)",
                  boxShadow: "0 2px 10px rgba(139, 92, 246, 0.3)",
                },
                "&.Mui-disabled": {
                  bgcolor: "rgba(156, 163, 175, 0.5)",
                  color: "rgba(255, 255, 255, 0.7)",
                  boxShadow: "none",
                  transform: "none",
                  "&::before": {
                    display: "none",
                  },
                },
              }}
            >
              ✨ Continue to Preview
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={emailPreview}
          onClose={() => setEmailPreview(false)}
          maxWidth="md"
          fullWidth
          keepMounted
          slotProps={{ transition: {
            timeout: 300,
          }, paper: {
            sx: {
              background:
                "linear-gradient(135deg, rgba(17, 17, 17, 0.95), rgba(31, 41, 55, 0.95))",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: theme.breakpoints.down("sm")
                ? "1rem 1rem 0 0"
                : "1rem",
              color: "white",
              [theme.breakpoints.down("sm")]: {
                margin: 0,
                width: "100%",
              },
            },
          } }}
        >
          <DialogTitle
            sx={{
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            Email Preview
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <DialogContentText
              sx={{ color: "rgba(255, 255, 255, 0.7)", mb: 2 }}
            >
              Please review and edit the email content before sending:
            </DialogContentText>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Recipients: (Parents)
              </Typography>
              <Box
                sx={{
                  color: "white",
                  bgcolor: "rgba(255, 255, 255, 0.05)",
                  p: 2,
                  borderRadius: "8px",
                  maxHeight: "200px",
                  overflowY: "auto",
                }}
              >
                {selectedRecipients.length > 0 ? (
                  selectedRecipients.map((recipient) => (
                    <Box
                      key={recipient.MUJid}
                      sx={{
                        mb: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <PersonIcon
                        sx={{
                          fontSize: "0.9rem",
                          color: "#f97316",
                        }}
                      />
                      <Typography>
                        {recipient.name} (
                        {emailType === "students"
                          ? recipient.email
                          : [
                              recipient.parents?.father?.email,
                              recipient.parents?.mother?.email,
                              recipient.parents?.guardian?.email,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                        )
                      </Typography>
                    </Box>
                  ))
                ) : selectedMentee ? (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <PersonIcon
                      sx={{
                        fontSize: "0.9rem",
                        color: "#f97316",
                      }}
                    />
                    <Typography>
                      {selectedMentee.name} (
                      {manualParentEmail
                        ? manualParentEmail
                        : (() => {
                            // Show only the selected parent email according to priority
                            if (selectedMentee.parents?.father?.email) {
                              return selectedMentee.parents.father.email;
                            } else if (selectedMentee.parents?.mother?.email) {
                              return selectedMentee.parents.mother.email;
                            } else if (selectedMentee.parents?.guardian?.email) {
                              return selectedMentee.parents.guardian.email;
                            } else {
                              return "No email available";
                            }
                          })()}
                      )
                    </Typography>
                  </Box>
                ) : (
                  <Typography sx={{ color: "rgba(255,255,255,0.5)" }}>
                    No recipients selected
                  </Typography>
                )}
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Subject:
              </Typography>
              <TextField
                fullWidth
                value={emailContent.subject}
                onChange={(e) =>
                  setEmailContent((prev) => ({
                    ...prev,
                    subject: e.target.value,
                  }))
                }
                sx={{
                  "& .MuiOutlinedInput-root": {
                    color: "white",
                    bgcolor: "rgba(255, 255, 255, 0.05)",
                    "&:hover": {
                      bgcolor: "rgba(255, 255, 255, 0.08)",
                    },
                  },
                }}
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Body:
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={12}
                value={emailContent.body}
                onChange={(e) =>
                  setEmailContent((prev) => ({
                    ...prev,
                    body: e.target.value,
                  }))
                }
                sx={{
                  "& .MuiOutlinedInput-root": {
                    color: "white",
                    bgcolor: "rgba(255, 255, 255, 0.05)",
                    fontFamily: "monospace",
                    "&:hover": {
                      bgcolor: "rgba(255, 255, 255, 0.08)",
                    },
                  },
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, gap: 1 }}>
            <Button
              onClick={() => setEmailPreview(false)}
              variant="outlined"
              sx={{
                color: "white",
                borderColor: "rgba(255, 255, 255, 0.2)",
                "&:hover": {
                  borderColor: "rgba(255, 255, 255, 0.5)",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSendEmail}
              variant="contained"
              disabled={
                isSendingEmail ||
                !emailContent.subject.trim() ||
                !emailContent.body.trim()
              }
              startIcon={
                isSendingEmail ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <SendIcon />
                )
              }
              sx={{
                position: "relative",
                overflow: "hidden",
                bgcolor: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "white",
                fontWeight: "bold",
                fontSize: "0.95rem",
                px: 3,
                py: 1.5,
                borderRadius: "12px",
                boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: "-100%",
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)",
                  transition: "left 0.5s",
                },
                "&:hover": {
                  bgcolor: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                  boxShadow: "0 6px 20px rgba(16, 185, 129, 0.4)",
                  transform: "translateY(-2px)",
                  "&::before": {
                    left: "100%",
                  },
                },
                "&:active": {
                  transform: "translateY(0)",
                  boxShadow: "0 2px 10px rgba(16, 185, 129, 0.3)",
                },
                "&.Mui-disabled": {
                  bgcolor: "rgba(156, 163, 175, 0.5)",
                  color: "rgba(255, 255, 255, 0.7)",
                  boxShadow: "none",
                  transform: "none",
                  "&::before": {
                    display: "none",
                  },
                },
                "& .MuiButton-startIcon": {
                  mr: 1,
                  transition: "transform 0.2s ease",
                },
                "&:hover .MuiButton-startIcon": {
                  transform: "translateX(2px)",
                },
              }}
            >
              {isSendingEmail ? "Sending..." : "🚀 Confirm & Send"}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={bulkEmailDialog}
          onClose={() => setBulkEmailDialog(false)}
          slotProps={{ paper: {
            sx: {
              background:
                "linear-gradient(135deg, rgba(17, 17, 17, 0.95), rgba(31, 41, 55, 0.95))",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "1rem",
              minWidth: "300px",
            },
          } }}
        >
          <DialogTitle sx={{ color: "white" }}>Choose Recipients</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => handleEmailTypeSelect("students")}
                sx={{
                  position: "relative",
                  overflow: "hidden",
                  bgcolor: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "0.95rem",
                  py: 1.5,
                  borderRadius: "12px",
                  boxShadow: "0 4px 15px rgba(59, 130, 246, 0.3)",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: "-100%",
                    width: "100%",
                    height: "100%",
                    background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)",
                    transition: "left 0.5s",
                  },
                  "&:hover": {
                    bgcolor: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                    boxShadow: "0 6px 20px rgba(59, 130, 246, 0.4)",
                    transform: "translateY(-2px)",
                    "&::before": {
                      left: "100%",
                    },
                  },
                  "&:active": {
                    transform: "translateY(0)",
                    boxShadow: "0 2px 10px rgba(59, 130, 246, 0.3)",
                  },
                }}
              >
                Email Students
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={() => handleEmailTypeSelect("parents")}
                sx={{
                  position: "relative",
                  overflow: "hidden",
                  bgcolor: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "0.95rem",
                  py: 1.5,
                  borderRadius: "12px",
                  boxShadow: "0 4px 15px rgba(249, 115, 22, 0.3)",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: "-100%",
                    width: "100%",
                    height: "100%",
                    background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)",
                    transition: "left 0.5s",
                  },
                  "&:hover": {
                    bgcolor: "linear-gradient(135deg, #ea580c 0%, #dc2626 100%)",
                    boxShadow: "0 6px 20px rgba(249, 115, 22, 0.4)",
                    transform: "translateY(-2px)",
                    "&::before": {
                      left: "100%",
                    },
                  },
                  "&:active": {
                    transform: "translateY(0)",
                    boxShadow: "0 2px 10px rgba(249, 115, 22, 0.3)",
                  },
                }}
              >
                Email Parents
              </Button>
            </Stack>
          </DialogContent>
        </Dialog>

        <Dialog
          open={recipientSelectionOpen}
          onClose={() => setRecipientSelectionOpen(false)}
          fullWidth
          maxWidth="md"
          slotProps={{ paper: {
            sx: {
              background:
                "linear-gradient(135deg, rgba(17, 17, 17, 0.95), rgba(31, 41, 55, 0.95))",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "1rem",
              color: "white",
            },
          } }}
        >
          <DialogTitle>Select Recipients</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              size="small"
              variant="outlined"
              placeholder="Search mentees..."
              value={recipientSearchQuery}
              onChange={(e) => setRecipientSearchQuery(e.target.value)}
              slotProps={{ input: {
                startAdornment: (
                  <SearchIcon
                    sx={{
                      mr: 1,
                      color: "rgba(255,255,255,0.7)",
                    }}
                  />
                ),
              } }}
              sx={{
                mt: 1,
                mb: 2,
                "& .MuiOutlinedInput-root": {
                  color: "white",
                  bgcolor: "rgba(255, 255, 255, 0.05)",
                  "&:hover": {
                    bgcolor: "rgba(255, 255, 255, 0.08)",
                  },
                },
              }}
            />
            <DataGrid
              rows={filteredMentees.filter(
                (mentee) =>
                  mentee.name
                    .toLowerCase()
                    .includes(recipientSearchQuery.toLowerCase()) ||
                  mentee.MUJid.toLowerCase().includes(
                    recipientSearchQuery.toLowerCase()
                  ) ||
                  mentee.email
                    .toLowerCase()
                    .includes(recipientSearchQuery.toLowerCase()) ||
                  String(mentee.semester).includes(recipientSearchQuery)
              )}
              columns={[
                {
                  field: "MUJid",
                  headerName: "MUJ ID",
                  flex: 1,
                },
                {
                  field: "name",
                  headerName: "Name",
                  flex: 1.5,
                },
                {
                  field: "email",
                  headerName: "Email",
                  flex: 1.5,
                },
                {
                  field: "semester",
                  headerName: "Semester",
                  flex: 0.8,
                },
              ]}
              checkboxSelection
              onRowSelectionModelChange={(newSelection) => {
                setSelectedRecipients(
                  filteredMentees.filter((mentee) =>
                    newSelection.includes(mentee.MUJid)
                  )
                );
              }}
              getRowId={(row) => row.MUJid}
              sx={{
                mt: 2,
                bgcolor: "rgba(255, 255, 255, 0.05)",
                border: "none",
                "& .MuiDataGrid-cell": { color: "white" },
                "& .MuiDataGrid-columnHeader": {
                  color: "#f97316",
                },
              }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5, gap: 1 }}>
            <Typography
              variant="body2"
              sx={{ mr: "auto", color: "rgba(255,255,255,0.7)" }}
            >
              {selectedRecipients.length} recipient(s) selected
            </Typography>
            <Button
              onClick={() => setRecipientSelectionOpen(false)}
              variant="outlined"
              sx={{
                color: "white",
                borderColor: "rgba(255, 255, 255, 0.2)",
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedRecipients.length === 0) {
                  toast.error("Please select at least one recipient");
                  return;
                }
                setRecipientSelectionOpen(false);
                setEmailPreview(true);
              }}
              variant="contained"
              disabled={selectedRecipients.length === 0}
              sx={{
                position: "relative",
                overflow: "hidden",
                bgcolor: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "white",
                fontWeight: "bold",
                fontSize: "0.9rem",
                px: 2.5,
                py: 1.25,
                borderRadius: "10px",
                boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: "-100%",
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)",
                  transition: "left 0.5s",
                },
                "&:hover": {
                  bgcolor: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                  boxShadow: "0 6px 20px rgba(16, 185, 129, 0.4)",
                  transform: "translateY(-1px)",
                  "&::before": {
                    left: "100%",
                  },
                },
                "&:active": {
                  transform: "translateY(0)",
                  boxShadow: "0 2px 10px rgba(16, 185, 129, 0.3)",
                },
                "&.Mui-disabled": {
                  bgcolor: "rgba(156, 163, 175, 0.5)",
                  color: "rgba(255, 255, 255, 0.7)",
                  boxShadow: "none",
                  transform: "none",
                  "&::before": {
                    display: "none",
                  },
                },
              }}
            >
              ✅ Continue
            </Button>
          </DialogActions>
        </Dialog>

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
      </div>
    </ThemeProvider>
  );
};

export default ViewMentee;
