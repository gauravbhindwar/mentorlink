"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  IconButton, // Add this
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { motion } from "framer-motion";
import { Toaster } from "react-hot-toast";
import SearchIcon from "@mui/icons-material/Search";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import EditIcon from "@mui/icons-material/Edit"; // Add this
import MenteeDialog from "./subComponents/MenteeDialog";
import MenteeTable from "./subComponents/MenteeTable";
import ExportMenu from "./subComponents/ExportMenu";
import { theme } from "./theme/mentorTheme";
import axios from "axios";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

const ViewMentee = () => {
  const [mentees, setMentees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMentee, setSelectedMentee] = useState(null);
  const [editDialog, setEditDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedMentee, setEditedMentee] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredMentees, setFilteredMentees] = useState([]);
  const [exportAnchorEl, setExportAnchorEl] = useState(null);

  useEffect(() => {
    setMounted(true);
    try {
      const storedMenteeData = sessionStorage.getItem("menteeData");
      if (storedMenteeData) {
        const menteeList = JSON.parse(storedMenteeData);
        setMentees(menteeList);
        setLoading(false);
      } else {
        const mentorData = JSON.parse(sessionStorage.getItem("mentorData"));
        if (mentorData?.email) {
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
        // Update local state first
        const updatedMentees = mentees.map((m) => 
          m.MUJid === editedMentee.MUJid ? editedMentee : m
        );
        setMentees(updatedMentees);
        
        // Update session storage
        sessionStorage.setItem("menteeData", JSON.stringify(updatedMentees));

        // Update meeting data if exists
        try {
          const meetingData = JSON.parse(sessionStorage.getItem("meetingData") || "[]");
          const updatedMeetingData = meetingData.map((meeting) => ({
            ...meeting,
            menteeDetails: meeting.menteeDetails?.map((mentee) =>
              mentee.MUJid === editedMentee.MUJid ? editedMentee : mentee
            ),
          }));
          sessionStorage.setItem("meetingData", JSON.stringify(updatedMeetingData));
        } catch (error) {
          console.error("Error updating meeting data:", error);
        }

        toast.success("Mentee details updated successfully");
        
        // Reset states and close dialog
        setIsEditing(false);
        setEditedMentee(null);
        setSelectedMentee(null);
        setEditDialog(false);
      } else {
        toast.error(response.data.message || "Failed to update mentee details");
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
      const data = mentees.map((mentee) => ({
        "MUJ ID": mentee.MUJid,
        Name: mentee.name,
        Email: mentee.email,
        Phone: mentee.phone,
        Semester: mentee.semester,
        Address: mentee.address,
        "Academic Year": mentee.academicYear,
        "Academic Session": mentee.academicSession,
        "Father's Name": mentee.parents?.father?.name,
        "Father's Email": mentee.parents?.father?.email,
        "Father's Phone": mentee.parents?.father?.phone,
        "Mother's Name": mentee.parents?.mother?.name,
        "Mother's Email": mentee.parents?.mother?.email,
        "Mother's Phone": mentee.parents?.mother?.phone,
        "Guardian's Name": mentee.parents?.guardian?.name,
        "Guardian's Email": mentee.parents?.guardian?.email,
        "Guardian's Phone": mentee.parents?.guardian?.phone,
        "Guardian's Relation": mentee.parents?.guardian?.relation,
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
          }}>
          <IconButton
            onClick={() => handleEditClick(params.row)}
            sx={{
              color: "#f97316",
              "&:hover": { bgcolor: "rgba(249, 115, 22, 0.1)" },
            }}>
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
      <div className='min-h-screen bg-[#0a0a0a] overflow-hidden relative'>
        <div className='absolute inset-0 z-0'>
          <div className='absolute inset-0 bg-gradient-to-br from-orange-500/10 via-purple-500/10 to-blue-500/10 animate-gradient' />
          <div className='absolute inset-0 backdrop-blur-3xl' />
        </div>

        <div className='relative z-10 px-4 md:px-6 py-24'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='flex flex-col md:flex-row justify-between items-center mb-10'>
            <motion.h1 className='text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-pink-500 mb-4 md:mb-0'>
              My Mentees
            </motion.h1>

            <Button
              variant='contained'
              onClick={handleExportClick}
              startIcon={<FileDownloadIcon />}
              sx={{
                bgcolor: "#f97316",
                "&:hover": {
                  bgcolor: "#ea580c",
                },
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "0.75rem",
                padding: "0.75rem 1.5rem",
                textTransform: "none",
                fontSize: "1rem",
                boxShadow:
                  "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
              }}>
              Export
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden'>
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                variant='outlined'
                placeholder='Search mentees by name, ID, email, phone, section, or semester...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <SearchIcon
                      sx={{
                        mr: 1,
                        color: "rgba(255, 255, 255, 0.7)",
                      }}
                    />
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "1rem",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    backdropFilter: "blur(10px)",
                    transition: "all 0.2s",
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                    },
                    "&.Mui-focused": {
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                    },
                  },
                }}
              />
            </Box>
            <Box
              sx={{
                overflowX: "auto",
                minHeight: "400px",
                height: "calc(100vh - 250px)",
                overflowY: "auto",
              }}>
              <MenteeTable
                loading={loading}
                filteredMentees={filteredMentees}
                onEditClick={handleEditClick}
                columns={columns}
              />
            </Box>
          </motion.div>
        </div>

        <MenteeDialog
          open={editDialog}
          onClose={handleEditClose}
          selectedMentee={selectedMentee}
          editedMentee={editedMentee}
          isEditing={isEditing}
          onEditMode={handleEditMode}
          onInputChange={handleInputChange}
          onUpdate={handleUpdate}
          loading={loading}  // Add this line
        />

        <ExportMenu
          anchorEl={exportAnchorEl}
          open={Boolean(exportAnchorEl)}
          onClose={handleExportClose}
          onExport={handleExportFormat}
        />

        <Toaster
          position='bottom-right'
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
