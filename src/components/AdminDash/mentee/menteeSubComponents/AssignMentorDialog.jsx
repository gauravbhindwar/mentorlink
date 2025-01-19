import { Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography, IconButton, TextField, Button, MenuItem } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { dialogStyles } from '../menteeStyle';

const AssignMentorDialog = ({ open, onClose, details, onChange, onSubmit }) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: dialogStyles.paper }}
    >
      <DialogTitle sx={dialogStyles.title}>
        <Typography variant="h6" component="div" sx={{ color: '#f97316', fontWeight: 600 }}>
          Assign Mentor
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
          display: 'flex', 
          flexDirection: 'column', 
          gap: 2,
          '& .MuiTextField-root': dialogStyles.textField,
        }}>
          <TextField
            label="Mentor MUJid"
            name="mentor_MUJid"
            value={details.mentor_MUJid}
            onChange={onChange}
            required
          />
          <TextField
            label="Session"
            name="session"
            value={details.session}
            onChange={onChange}
            required
          />
          <TextField
            label="Semester"
            name="semester"
            type="number"
            value={details.semester}
            onChange={onChange}
            required
          />
          <TextField
            select
            label="Section"
            name="section"
            value={details.section}
            onChange={onChange}
            required
          >
            {['A', 'B', 'C', 'D', 'E'].map(section => (
              <MenuItem key={section} value={section}>{section}</MenuItem>
            ))}
          </TextField>
        </Box>
      </DialogContent>
      <DialogActions sx={dialogStyles.actions}>
        <Button 
          onClick={onClose}
          variant="outlined"
          sx={{
            borderColor: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            '&:hover': {
              borderColor: 'rgba(255, 255, 255, 0.5)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
            },
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={onSubmit}
          variant="contained"
          sx={{
            bgcolor: '#f97316',
            '&:hover': {
              bgcolor: '#ea580c',
            },
          }}
        >
          Assign
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignMentorDialog;
