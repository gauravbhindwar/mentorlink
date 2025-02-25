import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';

const ConfirmDialog = ({ 
  open, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmButtonText = 'Confirm',
  cancelButtonText = 'Cancel' 
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          backgroundColor: '#1a1a1a',
          color: 'white',
          borderRadius: '12px',
          border: '1px solid rgba(249, 115, 22, 0.2)',
        }
      }}
    >
      <DialogTitle>
        <Typography variant="h6" sx={{ color: '#f97316' }}>
          {title}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
          {message}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ padding: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            color: 'white',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            '&:hover': {
              borderColor: 'rgba(255, 255, 255, 0.5)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
            }
          }}
        >
          {cancelButtonText}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          sx={{
            bgcolor: '#f97316',
            '&:hover': { bgcolor: '#ea580c' }
          }}
        >
          {confirmButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
