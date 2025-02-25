import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Checkbox,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { dialogStyles } from '../mentorStyle';

const RoleDeletionDialog = ({
  open,
  onClose,
  deleteRoleDialog,
  selectedRoles,
  setSelectedRoles,
  handleRoleBasedDelete,
}) => {
  // Get only the roles that the mentor currently has
  const availableRoles = deleteRoleDialog.mentor?.role || [];
  
  // Check if all roles are selected
  const isAllRolesSelected = selectedRoles.length === availableRoles.length;

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
          {isAllRolesSelected ? 'Confirm Mentor Deletion' : 'Confirm Role Deletion'}
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
      <DialogContent
        sx={{
          ...dialogStyles.content,
          my: 2,
        }}
      >
        <Typography variant="body1" sx={{ mb: 2 }}>
          {isAllRolesSelected 
            ? 'Warning: Selecting all roles will completely delete the mentor. Are you sure?'
            : 'Select the roles you want to remove:'}
        </Typography>
        <Box sx={{ color: "white" }}>
          {availableRoles.map((role) => (
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
          onClick={handleRoleBasedDelete}
          variant="contained"
          sx={{
            bgcolor: isAllRolesSelected ? "#dc2626" : "#f97316",
            "&:hover": {
              bgcolor: isAllRolesSelected ? "#b91c1c" : "#ea580c",
            },
          }}
        >
          {isAllRolesSelected ? 'Delete Mentor' : 'Delete Selected Roles'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RoleDeletionDialog;
