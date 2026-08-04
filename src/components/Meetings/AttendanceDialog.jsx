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
import { motion } from 'framer-motion';

const AttendanceDialog = ({
  open,
  onClose,
  mentees,
  presentMentees,
  onUpdateAttendance,
  onSubmit,
  isMobile
}) => {
  const [selectAll, setSelectAll] = useState(false);
  const [tempPresentMentees, setTempPresentMentees] = useState([]);

  // Initialize temporary attendance when dialog opens
  useEffect(() => {
    if (open) {
      setTempPresentMentees(presentMentees);
    }
  }, [open, presentMentees]);

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);

    const allMenteeIds = mentees?.map((m) => m.MUJid) || [];
    setTempPresentMentees(newSelectAll ? allMenteeIds : []);
  };

  const handleAttendanceChange = (mujId) => {
    setTempPresentMentees(prev => 
      prev.includes(mujId) 
        ? prev.filter(id => id !== mujId)
        : [...prev, mujId]
    );
  };

  const handleSubmit = () => {
    // Update the actual attendance only when submitting
    tempPresentMentees.forEach(id => {
      if (!presentMentees.includes(id)) {
        onUpdateAttendance(id);
      }
    });
    presentMentees.forEach(id => {
      if (!tempPresentMentees.includes(id)) {
        onUpdateAttendance(id);
      }
    });
    onSubmit();
  };

  const dialogStyles = isMobile ? {
    '& .MuiDialog-container': {
      alignItems: 'flex-start', // Changed from flex-end to flex-start
    },
    '& .MuiDialog-paper': {
      margin: 0,
      width: '100%',
      maxWidth: '100%',
      minHeight: '100%',
      borderRadius: 0, // Remove border radius on mobile
    },
  } : {};

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='sm'
      fullWidth
      sx={{ zIndex: 100000, ...dialogStyles }} // Add this line
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
      }}
      TransitionComponent={isMobile ? SlideTransition : undefined}
    >
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 1,
          backgroundColor: "rgba(17, 17, 17, 0.95)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          pb: isMobile ? 1 : 2,
        }}>
        <DialogTitle
          sx={{
            color: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pr: 2,
            fontSize: { xs: '1.125rem', md: '1.5rem' },
            py: { xs: 1.5, md: 3 }
          }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              gap: 2,
            }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {isMobile && (
                <IconButton
                  onClick={onClose}
                  sx={{
                    color: "white",
                    p: 0.5,
                  }}>
                  <FiX size={24} />
                </IconButton>
              )}
              <Box component='div' sx={{ typography: "h6" }}>
                Mark Attendance
              </Box>
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                bgcolor: "rgba(255, 255, 255, 0.1)",
                px: { xs: 1.5, md: 2 },
                py: { xs: 0.75, md: 1 },
                borderRadius: "0.5rem",
                flexShrink: 0,
              }}>
              <Typography sx={{ 
                color: "white",
                fontSize: { xs: '0.875rem', md: '1rem' }
              }}>
                {tempPresentMentees.length} / {mentees?.length || 0}
              </Typography>
              <Divider
                orientation='vertical'
                flexItem
                sx={{ bgcolor: "rgba(255, 255, 255, 0.2)" }}
              />
              <Typography sx={{ 
                color: "rgba(255, 255, 255, 0.7)",
                fontSize: { xs: '0.875rem', md: '1rem' }
              }}>
                {((tempPresentMentees.length / (mentees?.length || 1)) * 100).toFixed(0)}%
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        {!isMobile && (
          <IconButton
            onClick={onClose}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: "white",
            }}>
            <FiX />
          </IconButton>
        )}
      </Box>

      <DialogContent 
        sx={{ 
          pt: 2, 
          pb: 4, 
          p: { xs: 2, md: 3 },
          height: isMobile ? 'calc(100vh - 140px)' : 'auto', // Adjust for mobile full height
          maxHeight: isMobile ? 'none' : '400px' 
        }}>
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
            <Typography sx={{ 
              color: "white", 
              fontWeight: "bold",
              fontSize: { xs: '0.9rem', md: '1rem' }
            }}>
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
                padding: { xs: 0.5, md: 1 }
              }}
            />
          </Box>

          <Box
            sx={{ 
              flex: 1,
              overflowY: "auto",
              pb: isMobile ? 2 : 0 
            }}
            className='custom-scrollbar'>
            {mentees?.map((mentee) => (
              <Box
                key={mentee.MUJid}
                sx={{
                  p: { xs: 1.5, md: 2 },
                  mb: 1,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  bgcolor: "rgba(255, 255, 255, 0.05)",
                  borderRadius: "0.5rem",
                }}>
                <Box>
                  <Typography sx={{ 
                    color: "white", 
                    fontWeight: "bold",
                    fontSize: { xs: '0.875rem', md: '1rem' }
                  }}>
                    {mentee.name}
                  </Typography>
                  <Typography
                    sx={{
                      color: "rgba(255, 255, 255, 0.6)",
                      fontSize: { xs: '0.75rem', md: '0.875rem' },
                    }}>
                    {mentee.MUJid}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, md: 2 }}>
                  <Typography
                    sx={{
                      color: tempPresentMentees.includes(mentee.MUJid)
                        ? "#22c55e"
                        : "#ef4444",
                      fontWeight: "medium",
                      fontSize: { xs: '0.75rem', md: '0.875rem' },
                    }}>
                    {tempPresentMentees.includes(mentee.MUJid)
                      ? "Present"
                      : "Absent"}
                  </Typography>
                  <Checkbox
                    checked={tempPresentMentees.includes(mentee.MUJid)}
                    onChange={() => handleAttendanceChange(mentee.MUJid)}
                    sx={{
                      color: "rgba(255, 255, 255, 0.7)",
                      "&.Mui-checked": { color: "#22c55e" },
                      padding: { xs: 0.5, md: 1 }
                    }}
                  />
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{ 
          p: 2, 
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          position: isMobile ? 'sticky' : 'static',
          bottom: 0,
          bgcolor: "rgba(17, 17, 17, 0.95)",
          flexDirection: { xs: 'column', sm: 'row' },
          '& > button': {
            width: { xs: '100%', sm: 'auto' },
            mb: { xs: 1, sm: 0 },
            fontSize: { xs: '0.875rem', md: '1rem' },
            py: { xs: 1.5, md: 1 }
          }
        }}>
        {!isMobile && (
          <Button
            onClick={onClose}
            variant='contained'
            sx={{
              bgcolor: "#f97316",
              "&:hover": { bgcolor: "#ea580c" },
              color: "white",
              py: 1,
            }}>
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          fullWidth={isMobile}
          variant='contained'
          sx={{
            bgcolor: "#f97316",
            "&:hover": { bgcolor: "#ea580c" },
            color: "white",
            py: 1,
          }}>
          {isMobile ? 'Save Attendance' : 'Submit Attendance'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const SlideTransition = React.forwardRef(function SlideTransition(props, ref) {
  return (
    <motion.div
      ref={ref}
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 500 }}
      {...props}
    />
  );
});

export default AttendanceDialog;
