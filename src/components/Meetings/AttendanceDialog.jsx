import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  IconButton,
  Checkbox,
  Typography,
  Divider,
  Button,
} from "@mui/material";
import { FiX } from "react-icons/fi";

const AttendanceDialog = ({
  open,
  onClose,
  mentees,
  presentMentees,
  onUpdateAttendance,
  onSubmit,
}) => {
  const [selectAll, setSelectAll] = useState(false);
  const [localPresentMentees, setLocalPresentMentees] = useState([]);

  // Initialize local state when dialog opens
  useEffect(() => {
    if (open) {
      setLocalPresentMentees([...presentMentees]);
    }
  }, [open, presentMentees]);

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);

    const allMenteeIds = mentees?.map((m) => m.MUJid) || [];
    if (newSelectAll) {
      setLocalPresentMentees(allMenteeIds);
    } else {
      setLocalPresentMentees([]);
    }
  };

  const handleAttendanceChange = (mujId) => {
    setLocalPresentMentees((prev) =>
      prev.includes(mujId)
        ? prev.filter((id) => id !== mujId)
        : [...prev, mujId]
    );
  };

  const handleClose = () => {
    setSelectAll(false);
    onClose();
  };

  const handleSubmit = () => {
    // Update parent state with final attendance
    onUpdateAttendance(localPresentMentees);
    onSubmit();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='sm'
      fullWidth
      sx={{ zIndex: 100000 }} // Add this line
      PaperProps={{
        sx: {
          background:
            "linear-gradient(135deg, rgba(17, 17, 17, 0.95), rgba(31, 41, 55, 0.95))",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "1rem",
          position: "relative",
          overflowX: "hidden",
        },
      }}>
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 1,
          backgroundColor: "rgba(17, 17, 17, 0.95)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          pb: 2,
        }}>
        <DialogTitle
          sx={{
            color: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pr: 6, // Add padding for close button
          }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}>
            <Box component='div' sx={{ typography: "h6" }}>
              Mark Attendance
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                bgcolor: "rgba(255, 255, 255, 0.1)",
                px: 2,
                py: 1,
                borderRadius: "0.5rem",
              }}>
              <Typography sx={{ color: "white" }}>
                {localPresentMentees.length} / {mentees?.length || 0} Present
              </Typography>
              <Divider
                orientation='vertical'
                flexItem
                sx={{ bgcolor: "rgba(255, 255, 255, 0.2)" }}
              />
              <Typography sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
                {(
                  (localPresentMentees.length / (mentees?.length || 1)) *
                  100
                ).toFixed(0)}
                %
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <IconButton
          onClick={handleClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: "white",
          }}>
          <FiX />
        </IconButton>
      </Box>

      <DialogContent sx={{ pt: 2, pb: 4 }}>
        <Box sx={{ py: 2 }}>
          {/* Select All Checkbox */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
              pb: 2,
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            }}>
            <Typography sx={{ color: "white", fontWeight: "bold" }}>
              Select All Students
            </Typography>
            <Checkbox
              checked={selectAll}
              onChange={handleSelectAll}
              sx={{
                color: "rgba(255, 255, 255, 0.7)",
                "&.Mui-checked": {
                  color: "#22c55e",
                },
              }}
            />
          </Box>

          <Box
            sx={{ maxHeight: "400px", overflowY: "auto" }}
            className='custom-scrollbar'>
            {mentees?.map((mentee) => (
              <Box
                key={mentee.MUJid}
                sx={{
                  p: 2,
                  mb: 1,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  bgcolor: "rgba(255, 255, 255, 0.05)",
                  borderRadius: "0.5rem",
                  transition: "all 0.2s",
                  "&:hover": {
                    bgcolor: "rgba(255, 255, 255, 0.1)",
                  },
                }}>
                <Box>
                  <Typography sx={{ color: "white", fontWeight: "bold" }}>
                    {mentee.name}
                  </Typography>
                  <Typography
                    sx={{
                      color: "rgba(255, 255, 255, 0.6)",
                      fontSize: "0.875rem",
                    }}>
                    {mentee.MUJid} - {mentee.email}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Typography
                    sx={{
                      color: localPresentMentees.includes(mentee.MUJid)
                        ? "#22c55e"
                        : "#ef4444",
                      fontWeight: "medium",
                    }}>
                    {localPresentMentees.includes(mentee.MUJid)
                      ? "Present"
                      : "Absent"}
                  </Typography>
                  <Checkbox
                    checked={localPresentMentees.includes(mentee.MUJid)}
                    onChange={() => handleAttendanceChange(mentee.MUJid)}
                    sx={{
                      color: "rgba(255, 255, 255, 0.7)",
                      "&.Mui-checked": {
                        color: "#22c55e",
                      },
                    }}
                  />
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions
        sx={{ p: 2, borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
        <Button
          onClick={handleSubmit}
          fullWidth
          variant='contained'
          sx={{
            bgcolor: "#f97316",
            "&:hover": { bgcolor: "#ea580c" },
            color: "white",
            py: 1,
          }}>
          Submit Attendance
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AttendanceDialog;
