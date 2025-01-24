import React, { useState } from 'react';
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
  Button
} from '@mui/material';
import { FiX } from 'react-icons/fi';

const AttendanceDialog = ({ 
  open, 
  onClose, 
  mentees, 
  presentMentees, 
  onUpdateAttendance,
  onSubmit 
}) => {
  const [selectAll, setSelectAll] = useState(false);

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    
    // Get all mentee IDs
    const allMenteeIds = mentees?.map(m => m.MUJid) || [];
    
    // Update attendance for all mentees
    if (newSelectAll) {
      // Select all mentees
      allMenteeIds.forEach(id => {
        if (!presentMentees.includes(id)) {
          onUpdateAttendance(id);
        }
      });
    } else {
      // Unselect all mentees
      allMenteeIds.forEach(id => {
        if (presentMentees.includes(id)) {
          onUpdateAttendance(id);
        }
      });
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.95), rgba(31, 41, 55, 0.95))',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '1rem',
          position: 'relative', // Add this
          overflowX: 'hidden', // Add this
        }
      }}
    >
      <Box 
        sx={{ 
          position: 'sticky',
          top: 0,
          zIndex: 1,
          backgroundColor: 'rgba(17, 17, 17, 0.95)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          pb: 2
        }}
      >
        <DialogTitle sx={{ 
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pr: 6, // Add padding for close button
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Box component="div" sx={{ typography: 'h6' }}>Mark Attendance</Box>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              px: 2,
              py: 1,
              borderRadius: '0.5rem'
            }}>
              <Typography sx={{ color: 'white' }}>
                {presentMentees.length} / {mentees?.length || 0} Present
              </Typography>
              <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)' }} />
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                {((presentMentees.length / (mentees?.length || 1)) * 100).toFixed(0)}%
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <IconButton 
          onClick={onClose} 
          sx={{ 
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'white'
          }}
        >
          <FiX />
        </IconButton>
      </Box>

      <DialogContent sx={{ pt: 2, pb: 4 }}>
        <Box sx={{ py: 2 }}>
          {/* Select All Checkbox */}
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
            pb: 2,
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <Typography sx={{ color: 'white', fontWeight: 'bold' }}>
              Select All Students
            </Typography>
            <Checkbox
              checked={selectAll}
              onChange={handleSelectAll}
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-checked': {
                  color: '#22c55e',
                },
              }}
            />
          </Box>
          
          <Box sx={{ maxHeight: '400px', overflowY: 'auto' }} className="custom-scrollbar">
            {mentees?.map((mentee) => (
              <Box
                key={mentee.MUJid}
                sx={{
                  p: 2,
                  mb: 1,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '0.5rem',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                  }
                }}
              >
                <Box>
                  <Typography sx={{ color: 'white', fontWeight: 'bold' }}>
                    {mentee.name}
                  </Typography>
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem' }}>
                    {mentee.MUJid} - Section {mentee.section}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography
                    sx={{
                      color: presentMentees.includes(mentee.MUJid) ? '#22c55e' : '#ef4444',
                      fontWeight: 'medium'
                    }}
                  >
                    {presentMentees.includes(mentee.MUJid) ? 'Present' : 'Absent'}
                  </Typography>
                  <Checkbox
                    checked={presentMentees.includes(mentee.MUJid)}
                    onChange={() => onUpdateAttendance(mentee.MUJid)}
                    sx={{
                      color: 'rgba(255, 255, 255, 0.7)',
                      '&.Mui-checked': {
                        color: '#22c55e',
                      },
                    }}
                  />
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Button 
          onClick={onSubmit}
          fullWidth
          variant="contained"
          sx={{
            bgcolor: '#f97316',
            '&:hover': { bgcolor: '#ea580c' },
            color: 'white',
            py: 1
          }}
        >
          Submit Attendance
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AttendanceDialog;
