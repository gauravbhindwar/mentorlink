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
  Box,
  Grid,
  FormControlLabel,
  Switch,
  MenuItem,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { dialogStyles } from '../mentorStyle';
import { toast } from "react-hot-toast"; // Add this import

const DuplicateMentorDialog = ({
  open,
  onClose,
  duplicateEditMode,
  setDuplicateEditMode,
  existingMentorData,
  mentorDetails,
  setMentorDetails,
  handlePatchUpdate: onPatchUpdate, // Rename the prop here
}) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMentorDetails(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdate = async () => { // Renamed function
    try {
      const response = await axios.patch(
        `/api/admin/manageUsers/manageMentor/${mentorDetails.MUJid}`,
        mentorDetails
      );

      if (response.data.success) {
        toast.success("Mentor updated successfully", {
          style: {
            background: '#22c55e',
            color: 'white',
            padding: '16px',
          },
          duration: 3000,
        });
        onClose();
        if (onPatchUpdate) { // Use renamed prop
          await onPatchUpdate(response.data.mentor);
        }
      } else {
        throw new Error(response.data.error || "Failed to update mentor");
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Error updating mentor", {
        style: {
          background: '#ef4444',
          color: 'white',
          padding: '16px',
        },
        duration: 3000,
      });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
          {duplicateEditMode ? "Edit Existing Mentor" : "Mentor Already Exists"}
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
        {duplicateEditMode ? (
          <Box sx={{ color: "white", mt: 2 }}>
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
                  label="Role"
                  name="role"
                  value={mentorDetails.role || ["mentor"]}
                  onChange={handleInputChange}
                  SelectProps={{ multiple: true }}
                  sx={dialogStyles.textField}
                >
                  <MenuItem value="mentor">Mentor</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  {/* <MenuItem value="superadmin">Super Admin</MenuItem> */}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={Boolean(mentorDetails.isActive)}
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
              </Grid>
            </Grid>
          </Box>
        ) : (
          <Box sx={{ color: "white", mt: 2 }}>
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
              {Object.entries(existingMentorData)
                .filter(([key]) => [
                  'name',
                  'email',
                  'phone_number',
                  'MUJid',
                  'role',
                  'academicSession',
                  'academicYear',
                  'gender',
                  'isActive'
                ].includes(key))
                .map(([key, value]) => {
                  if (value !== undefined && value !== null) {
                    const formattedKey = key === 'MUJid' 
                      ? 'MUJid'
                      : key.replace(/([A-Z])/g, ' $1')
                          .replace(/_/g, ' ')
                          .toLowerCase()
                          .split(' ')
                          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ');
                    
                    let displayValue = value;
                    if (key === 'isActive') {
                      displayValue = value ? 'Active' : 'Inactive';
                    } else if (Array.isArray(value)) {
                      displayValue = value.join(", ");
                    }

                    return (
                      <Typography 
                        key={key} 
                        variant="body2" 
                        sx={{ 
                          mb: 1.5,
                          display: 'flex',
                          alignItems: 'flex-start'
                        }}
                      >
                        <strong style={{ width: '140px', display: 'inline-block' }}>
                          {formattedKey}:
                        </strong>
                        <span style={{ 
                          flex: 1,
                          color: key === 'isActive' 
                            ? (value ? '#4caf50' : '#f44336')
                            : 'inherit'
                        }}>
                          {displayValue}
                        </span>
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
        {duplicateEditMode ? (
          <Button
            onClick={handleUpdate} // Use renamed function
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
  );
};

export default DuplicateMentorDialog;

