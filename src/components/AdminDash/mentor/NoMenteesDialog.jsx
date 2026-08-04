import { Dialog, DialogContent, DialogTitle, Box, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Lottie from 'lottie-react';
import emptyAnimation from '@/assets/animations/empty-box.json';

const NoMenteesDialog = ({ open, onClose, mentorName }) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      PaperProps={{
        sx: {
          backgroundColor: '#1a1a1a',
          color: 'white',
          borderRadius: '16px',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          minWidth: '300px',
          maxWidth: '400px'
        }
      }}
    >
      <DialogTitle sx={{ 
        p: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(16, 185, 129, 0.2)'
      }}>
        <Typography sx={{ color: '#10B981', fontWeight: 500 }}>
          No Mentees Found
        </Typography>
        <IconButton 
          onClick={onClose}
          size="small"
          sx={{
            color: 'rgba(255, 255, 255, 0.5)',
            '&:hover': {
              color: '#10B981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)'
            }
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}>
          <Box sx={{ width: '200px', height: '200px' }}>
            <Lottie 
              animationData={emptyAnimation}
              loop={true}
              style={{ width: '100%', height: '100%' }}
            />
          </Box>
          <Typography sx={{
            color: 'rgba(255, 255, 255, 0.7)',
            textAlign: 'center',
            fontSize: '0.95rem'
          }}>
            {mentorName} currently has no assigned mentees
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default NoMenteesDialog;
