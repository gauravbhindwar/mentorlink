import { Dialog, Box, Typography } from '@mui/material';
import Lottie from 'lottie-react';
import transferAnimation from '@/assets/animations/Transferanimation.json';

const TransferLoadingDialog = ({ open }) => {
  return (
    <Dialog
      open={open}
      PaperProps={{
        sx: {
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          minWidth: '300px',
          maxWidth: '400px'
        }
      }}
    >
      <Box sx={{
        p: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2
      }}>
        <Box sx={{ width: '200px', height: '200px' }}>
          <Lottie 
            animationData={transferAnimation}
            loop={true}
            style={{ width: '100%', height: '100%' }}
          />
        </Box>
        <Typography sx={{
          color: '#10B981',
          fontWeight: 500,
          textAlign: 'center',
          fontSize: '1.1rem'
        }}>
          Transferring Mentees...
        </Typography>
        <Typography sx={{
          color: 'rgba(255, 255, 255, 0.7)',
          textAlign: 'center',
          fontSize: '0.9rem'
        }}>
          Please wait while we process your request
        </Typography>
      </Box>
    </Dialog>
  );
};

export default TransferLoadingDialog;
