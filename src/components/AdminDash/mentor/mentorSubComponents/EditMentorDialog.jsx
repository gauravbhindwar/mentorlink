import React from 'react';
import axios from 'axios';  // Add this import
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  IconButton,
  TextField,
  MenuItem,
  Grid2,
  FormControlLabel,
  Switch,
  Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { toast } from "react-hot-toast";
import { dialogStyles, toastStyles } from '../mentorStyle';
import { Opacity } from '@mui/icons-material';

const EditMentorDialog = ({
  open,
  onClose,
  selectedMentor,
  setSelectedMentor,
  handleEditMentor,
}) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedMentor((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Add isFormValid function
  const isFormValid = () => {
    return (
      selectedMentor?.name?.trim() &&
      selectedMentor?.email?.trim() &&
      selectedMentor?.phone_number?.trim() &&
      selectedMentor?.role?.length > 0
    );
  };

  const handleSubmit = async () => {
    try {
      const response = await axios.patch(
        `/api/admin/manageUsers/editMentor/${selectedMentor.MUJid}`,
        {
          name: selectedMentor.name,
          email: selectedMentor.email,
          phone_number: selectedMentor.phone_number,
          role: selectedMentor.role,
          isActive: selectedMentor.isActive
        }
      );

      if (response.data.success) {
        toast.success("Mentor updated successfully", {
          style: toastStyles.success.style,
          iconTheme: toastStyles.success.iconTheme,
          position: "top-center",
          duration: 5000,
        });
        onClose();
        if (handleEditMentor) {
          await handleEditMentor(response.data.mentor);
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.status === 'DUPLICATE_EMAIL' 
        ? "This email is already assigned to another mentor"
        : error.response?.data?.error || "Error updating mentor";

      toast.error(errorMessage, {
        style: {
          ...toastStyles.error.style,
          zIndex: 100000,
        },
        iconTheme: toastStyles.error.iconTheme,
        position: "top-center",
        duration: 5000,
      });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: dialogStyles.paper }}
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
          onClick={onClose}
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
      <DialogContent sx={dialogStyles.content}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <Grid2 container spacing={3}>
            <Grid2 xs={12} md={6}>
              <TextField
                fullWidth
                label="MUJid"
                name="MUJid"
                value={selectedMentor?.MUJid || ""}
                // disabled
                sx={{ ...dialogStyles.textField, opacity: 0.5, cursor: 'not-allowed', pointerEvents: 'none', background: 'rgba(255, 255, 255, 0.05)', color: 'white' ,select:"none" }}
              />
            </Grid2>
            <Grid2 xs={12} md={6}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={selectedMentor?.name || ""}
                onChange={handleInputChange}
                required
                sx={dialogStyles.textField}
              />
            </Grid2>
            <Grid2 xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={selectedMentor?.email || ""}
                onChange={handleInputChange}
                required
                sx={dialogStyles.textField}
              />
            </Grid2>
            <Grid2 xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phone_number"
                value={selectedMentor?.phone_number || ""}
                onChange={handleInputChange}
                required
                sx={dialogStyles.textField}
              />
            </Grid2>
            <Grid2 xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Role"
                name="role"
                value={selectedMentor?.role?.[0] || ""}
                onChange={handleInputChange}
                sx={{...dialogStyles.textField}}
              >
                <MenuItem value="mentor">
                  <Typography variant="body1" sx={{ color: '#f97316', fontWeight: 600 }}>
                    Mentor
                  </Typography>
                </MenuItem>
                <MenuItem value="admin">
                  <Typography variant="body1" sx={{ color: '#f97316', fontWeight: 600 }}>
                    Admin
                  </Typography>
                </MenuItem>
              </TextField>
            </Grid2>
            <Grid2 xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={selectedMentor?.isActive || false}
                    onChange={(e) => handleInputChange({
                      target: {
                        name: 'isActive',
                        value: e.target.checked
                      }
                    })}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#f97316',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#f97316',
                      },
                    }}
                  />
                }
                label="Active Status"
                sx={{ color: 'white' }}
              />
            </Grid2>
          </Grid2>
        </Box>
      </DialogContent>
      <DialogActions sx={dialogStyles.actions}>
        <Button
          onClick={onClose}
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
          onClick={handleSubmit}
          variant="contained"
          disabled={!isFormValid()}
          sx={{
            bgcolor: "#f97316",
            "&:hover": {
              bgcolor: "#ea580c",
            },
            "&:disabled": {
              bgcolor: "rgba(249, 115, 22, 0.4)",
              color: "rgba(255, 255, 255, 0.4)",
              cursor: "not-allowed",
              pointerEvents: "none",
            },
          }}
        >
          Update
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditMentorDialog;
