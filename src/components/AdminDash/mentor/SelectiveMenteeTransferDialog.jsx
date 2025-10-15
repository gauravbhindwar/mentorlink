import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Box, 
  Typography, 
  CircularProgress,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  TextField,
  Divider,
  Chip
} from '@mui/material';
import axios from 'axios';
import { toast } from 'react-toastify';

const SelectiveMenteeTransferDialog = ({ 
  open, 
  onClose, 
  fromMentor, 
  targetMentor,
  toastConfig,
  academicYear,
  academicSession,
  onTransferComplete
}) => {
  const [loading, setLoading] = useState(true);
  const [mentees, setMentees] = useState([]);
  const [selectedMentees, setSelectedMentees] = useState([]);
  const [transferring, setTransferring] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (open && fromMentor) {
      fetchMentees();
    } else {
      setSelectedMentees([]);
      setMentees([]);
      setSearchTerm('');
    }
  }, [open, fromMentor?.MUJid]);

  const fetchMentees = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/admin/manageUsers/getMentorMentees`, {
        params: {
          mentorMujid: fromMentor.MUJid,
          academicYear,
          academicSession
        }
      });
      
      if (response.data && response.data.mentees) {
        setMentees(response.data.mentees);
      } else {
        setMentees([]);
      }
    } catch (error) {
      console.error('Error fetching mentees:', error);
      toast.error('Failed to fetch mentees', toastConfig);
      setMentees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMentee = (menteeId) => {
    setSelectedMentees(prev => {
      if (prev.includes(menteeId)) {
        return prev.filter(id => id !== menteeId);
      } else {
        return [...prev, menteeId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedMentees.length === filteredMentees.length) {
      setSelectedMentees([]);
    } else {
      setSelectedMentees(filteredMentees.map(mentee => mentee._id));
    }
  };

  const handleTransferSelected = async () => {
    if (!selectedMentees.length || !targetMentor) return;
    
    setTransferring(true);
    try {
      const response = await axios.post('/api/admin/manageUsers/transferMentees', {
        fromMentorId: fromMentor.MUJid,
        toMentorEmail: targetMentor.email,
        academicYear,
        academicSession,
        menteeIds: selectedMentees
      });

      if (response.data.success) {
        toast.success(
          `Successfully transferred ${response.data.updatedCount} mentees`,
          toastConfig
        );
        onClose();
        if (onTransferComplete) {
          onTransferComplete();
        }
      } else {
        toast.error(response.data.message || 'Transfer failed', toastConfig);
      }
    } catch (error) {
      console.error('Transfer error:', error);
      toast.error(
        error.response?.data?.message || 'Error transferring mentees', 
        toastConfig
      );
    } finally {
      setTransferring(false);
    }
  };

  // Filter mentees based on search term
  const filteredMentees = mentees.filter(mentee => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      mentee.name?.toLowerCase().includes(term) ||
      mentee.email?.toLowerCase().includes(term) ||
      mentee.MUJid?.toLowerCase().includes(term) ||
      mentee.regNo?.toString().toLowerCase().includes(term)
    );
  });

  // Group mentees by semester
  const menteesBySemester = filteredMentees.reduce((acc, mentee) => {
    const semester = mentee.semester || 'Unknown';
    if (!acc[semester]) acc[semester] = [];
    acc[semester].push(mentee);
    return acc;
  }, {});

  return (
    <Dialog
      open={open}
      onClose={() => !transferring && onClose()}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          border: '1px solid rgba(16, 185, 129, 0.3)',
        }
      }}
    >
      <DialogTitle sx={{ 
        color: '#10B981',
        borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
        p: 3,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Box>Select Mentees for Transfer</Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {selectedMentees.length > 0 && (
            <Chip 
              label={`${selectedMentees.length} selected`} 
              color="primary"
              sx={{ bgcolor: '#10B981', fontWeight: 'bold' }}
            />
          )}
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ 
          p: 2, 
          bgcolor: 'rgba(16, 185, 129, 0.1)', 
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography sx={{ color: 'white', fontWeight: 500 }}>
              {fromMentor?.name}
            </Typography>
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
              {fromMentor?.email}
            </Typography>
          </Box>

          <Box sx={{ 
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexDirection: { xs: 'column', sm: 'row' }
          }}>
            <TextField
              placeholder="Search mentees..."
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{
                minWidth: '200px',
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(16, 185, 129, 0.5)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#10B981',
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                }
              }}
              InputProps={{
                sx: { bgcolor: 'rgba(0, 0, 0, 0.2)' }
              }}
            />

            <Button
              size="small"
              variant="outlined"
              onClick={handleSelectAll}
              sx={{
                color: '#10B981',
                borderColor: 'rgba(16, 185, 129, 0.5)',
                '&:hover': {
                  borderColor: '#10B981',
                  bgcolor: 'rgba(16, 185, 129, 0.1)'
                }
              }}
            >
              {selectedMentees.length === filteredMentees.length && filteredMentees.length > 0
                ? 'Unselect All'
                : 'Select All'}
            </Button>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress sx={{ color: '#10B981' }} />
          </Box>
        ) : mentees.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              No mentees found for this mentor
            </Typography>
          </Box>
        ) : (
          <Box sx={{ 
            maxHeight: '400px', 
            overflow: 'auto',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(16, 185, 129, 0.3)',
              borderRadius: '4px',
              '&:hover': {
                backgroundColor: 'rgba(16, 185, 129, 0.5)',
              }
            }
          }}>
            {Object.entries(menteesBySemester).map(([semester, semesterMentees]) => (
              <Box key={semester} sx={{ mb: 2 }}>
                <Box sx={{ 
                  px: 2, 
                  py: 1, 
                  bgcolor: 'rgba(16, 185, 129, 0.1)', 
                  borderBottom: '1px solid rgba(16, 185, 129, 0.1)'
                }}>
                  <Typography sx={{ 
                    color: '#10B981', 
                    fontWeight: 500,
                    fontSize: '0.875rem'
                  }}>
                    Semester {semester} • {semesterMentees.length} mentees
                  </Typography>
                </Box>
                <List disablePadding>
                  {semesterMentees.map((mentee, index) => (
                    <React.Fragment key={mentee._id}>
                      <ListItem
                        dense
                        onClick={() => handleToggleMentee(mentee._id)}
                        sx={{
                          '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' },
                          bgcolor: selectedMentees.includes(mentee._id) 
                            ? 'rgba(16, 185, 129, 0.1)' 
                            : 'transparent',
                          cursor: 'pointer'
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: '40px' }}>
                          <Checkbox
                            edge="start"
                            checked={selectedMentees.includes(mentee._id)}
                            tabIndex={-1}
                            disableRipple
                            sx={{
                              color: 'rgba(255, 255, 255, 0.5)',
                              '&.Mui-checked': {
                                color: '#10B981',
                              },
                            }}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography component="span" sx={{ color: 'white' }}>
                              {mentee.name}
                            </Typography>
                          }
                          secondary={
                            <Box component="span" sx={{ 
                              color: 'rgba(255, 255, 255, 0.6)', 
                              fontSize: '0.8rem',
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: 1
                            }}>
                              <span>{mentee.email}</span>
                              <span>•</span>
                              <span>{mentee.regNo || mentee.MUJid || 'No ID'}</span>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < semesterMentees.length - 1 && (
                        <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)' }} />
                      )}
                    </React.Fragment>
                  ))}
                </List>
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ 
        p: 3, 
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        justifyContent: 'space-between'
      }}>
        {targetMentor && (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'flex-start',
            maxWidth: '50%'
          }}>
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.75rem' }}>
              Target Mentor:
            </Typography>
            <Typography 
              sx={{ 
                color: 'white', 
                fontWeight: 500,
                fontSize: '0.875rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%'
              }} 
              title={targetMentor.name}
            >
              {targetMentor.name} ({targetMentor.email})
            </Typography>
          </Box>
        )}
        
        <Box sx={{ display: 'flex', gap: 2, ml: 'auto' }}>
          <Button 
            onClick={onClose} 
            disabled={transferring}
            sx={{ 
              color: 'white', 
              borderColor: 'rgba(255, 255, 255, 0.3)',
              '&:hover': {
                borderColor: 'white',
                bgcolor: 'rgba(255, 255, 255, 0.05)'
              } 
            }}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleTransferSelected} 
            disabled={selectedMentees.length === 0 || transferring || !targetMentor}
            sx={{ 
              bgcolor: '#10B981',
              '&:hover': { bgcolor: '#059669' },
              '&.Mui-disabled': {
                bgcolor: 'rgba(16, 185, 129, 0.3)',
              }
            }}
            variant="contained"
          >
            {transferring ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} sx={{ color: 'white' }} />
                <span>Transferring...</span>
              </Box>
            ) : (
              `Transfer ${selectedMentees.length} Selected Mentees`
            )}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default SelectiveMenteeTransferDialog;
