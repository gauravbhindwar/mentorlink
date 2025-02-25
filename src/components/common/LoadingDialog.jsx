import { Dialog, CircularProgress, Typography, Box } from '@mui/material';

const LoadingDialog = ({ open, message }) => {
  return (
    <Dialog
      open={open}
      PaperProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          boxShadow: 'none',
          padding: '2rem',
          minWidth: '200px',
          border: '1px solid rgba(249, 115, 22, 0.2)',
          borderRadius: '12px',
        }
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        gap: 2 
      }}>
        <CircularProgress sx={{ color: '#f97316' }} />
        <Typography sx={{ color: 'white' }}>
          {message}
        </Typography>
      </Box>
    </Dialog>
  );
};

export default LoadingDialog;
