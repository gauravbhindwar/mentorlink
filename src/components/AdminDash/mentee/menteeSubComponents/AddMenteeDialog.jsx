import { Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography, IconButton, TextField, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { dialogStyles } from '../menteeStyle';

const AddMenteeDialog = ({ open, onClose, menteeDetails, onInputChange, onSubmit }) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg" 
      fullWidth
      PaperProps={{ sx: dialogStyles.paper }}
    >
      <DialogTitle sx={dialogStyles.title}>
        <Typography variant="h6" component="div" sx={{ color: '#f97316', fontWeight: 600 }}>
          Add New Mentee
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'rgba(255, 255, 255, 0.7)',
            '&:hover': { color: '#f97316' },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={dialogStyles.content}>
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 3,
          '& .MuiTextField-root': dialogStyles.textField,
        }}>
          {/* Student Information */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="subtitle1" sx={{ color: '#f97316', fontWeight: 600 }}>
              Student Information
            </Typography>
            <TextField
              label="MUJid"
              name="MUJid"
              value={menteeDetails.MUJid}
              onChange={onInputChange}
              required
              inputProps={{ style: { textTransform: 'uppercase' } }}
            />
            <TextField
              label="Name"
              name="name"
              value={menteeDetails.name}
              onChange={onInputChange}
              required
            />
            {/* Add other student information fields */}
          </Box>

          {/* Academic Information */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="subtitle1" sx={{ color: '#f97316', fontWeight: 600 }}>
              Academic Information
            </Typography>
            {/* Add academic information fields */}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={dialogStyles.actions}>
        <Button onClick={onClose} variant="outlined" sx={{ color: 'white' }}>
          Cancel
        </Button>
        <Button onClick={onSubmit} variant="contained" color="primary">
          Add Mentee
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddMenteeDialog;
