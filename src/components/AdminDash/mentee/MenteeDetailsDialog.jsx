"use client";

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Dialog, 
  DialogContent,
  Box, 
  Typography, 
  IconButton, 
  Tabs,
  Tab,
  Fade,
  Avatar,
  Chip,
  Stack,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SchoolIcon from '@mui/icons-material/School';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';

const TabPanel = ({ children, value, index }) => (
  <Fade in={value === index}>
    <div
      role="tabpanel"
      hidden={value !== index}
      style={{
        display: value === index ? 'block' : 'none',
        padding: '16px 0'
      }}
    >
      {value === index && children}
    </div>
  </Fade>
);

const MenteeDetailsDialog = ({ open, onClose, mentee }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [meetingStats, setMeetingStats] = useState({});
  const statsCache = useRef({}); // Add cache using useRef

  useEffect(() => {

    const fetchMeetingStats = async () => {
      if (mentee?.MUJid) {
        // Check if stats exist in cache
        if (statsCache.current[mentee.MUJid]) {
          setMeetingStats(statsCache.current[mentee.MUJid]);
          return;
        }

        try {
          const response = await axios.get(`/api/admin/getMenteeMeetings?menteeMujid=${mentee.MUJid}`);
          const stats = {
            total: response.data.total || 0,
            completed: response.data.completed || 0,
            pending: response.data.scheduled || 0
          };
          // Store in cache
          statsCache.current[mentee.MUJid] = stats;
          setMeetingStats(stats);
        } catch (error) {
          console.error('Error fetching meeting stats:', error);
          console.log("Meeting stats not found",meetingStats);
          setMeetingStats({ total: 0, completed: 0, pending: 0 });
        }
      }
    };

    // Only fetch when dialog opens and stats aren't cached
    if (open && mentee && !statsCache.current[mentee.MUJid]) {
      fetchMeetingStats();
    }
  }, [open, mentee]); // Remove activeTab dependency

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          background: 'linear-gradient(to bottom, rgba(17, 24, 39, 0.95), rgba(10, 15, 24, 0.95))',
          backdropFilter: 'blur(10px)',
          borderRadius: '24px',
          border: '1px solid rgba(249, 115, 22, 0.2)',
          maxHeight: '90vh',
          overflow: 'hidden'
        }
      }}
    >
      {mentee && (
        <>
          {/* Header Section - Updated */}
          <Box sx={{ 
            p: 3, 
            borderBottom: '1px solid rgba(249, 115, 22, 0.2)',
            background: 'linear-gradient(to right, rgba(249, 115, 22, 0.1), rgba(0, 0, 0, 0))',
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar 
                  sx={{ 
                    width: 60, 
                    height: 60, 
                    background: 'linear-gradient(135deg, #f97316, #ea580c)',
                    border: '2px solid rgba(249, 115, 22, 0.5)'
                  }}
                >
                  {mentee.name?.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ 
                    color: 'white',
                    fontWeight: '600',
                    textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}>
                    {mentee.name}
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    {mentee.MUJid}
                  </Typography>
                </Box>
              </Box>
              <IconButton 
                onClick={onClose} 
                sx={{ 
                  color: '#f97316',
                  '&:hover': { bgcolor: 'rgba(249, 115, 22, 0.1)' }
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {['semester', 'academicYear'].map((field) => (
                mentee[field] && (
                  <Chip 
                    key={field}
                    label={field === 'semester' ? `Semester ${mentee[field]}` : mentee[field]}
                    sx={{ 
                      bgcolor: 'rgba(249, 115, 22, 0.1)',
                      color: '#f97316',
                      border: '1px solid rgba(249, 115, 22, 0.3)',
                      '&:hover': { bgcolor: 'rgba(249, 115, 22, 0.2)' }
                    }}
                  />
                )
              ))}
            </Box>
          </Box>

          {/* Tabs Navigation - Updated */}
          <Box sx={{ borderBottom: 1, borderColor: 'rgba(249, 115, 22, 0.2)' }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{
                '& .MuiTab-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-selected': {
                    color: '#f97316',
                  }
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#f97316',
                }
              }}
            >
              <Tab icon={<AccountCircleIcon />} label="Basic Info" />
              <Tab icon={<SchoolIcon />} label="Academic" />
              <Tab icon={<FamilyRestroomIcon />} label="Family" />
            </Tabs>
          </Box>

          <DialogContent sx={{ 
            p: 3, 
            bgcolor: 'transparent',
            background: 'linear-gradient(to bottom, rgba(26, 26, 26, 0.5), rgba(17, 17, 17, 0.5))'
          }}>
            {/* Basic Info Tab - Updated */}
            <TabPanel value={activeTab} index={0}>
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: 3,
                p: 2,
                background: 'rgba(249, 115, 22, 0.05)',
                borderRadius: 3,
                border: '1px solid rgba(249, 115, 22, 0.2)'
              }}>
                <InfoItem icon="📧" label="Email" value={mentee.email} />
                <InfoItem icon="📱" label="Phone" value={mentee.phone} />
                <InfoItem icon="📍" label="Address" value={mentee.address} />
              </Box>
            </TabPanel>

            {/* Academic Info Tab - Updated */}
            <TabPanel value={activeTab} index={1}>
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: 3,
                p: 2,
                background: 'rgba(249, 115, 22, 0.05)',
                borderRadius: 3,
                border: '1px solid rgba(249, 115, 22, 0.2)'
              }}>
                <InfoItem icon="📚" label="Academic Year" value={mentee.academicYear} />
                <InfoItem icon="🗓️" label="Academic Session" value={mentee.academicSession} />
                <InfoItem icon="📅" label="Year of Registration" value={mentee.yearOfRegistration} />
                <InfoItem icon="👨‍🏫" label="Mentor MUJID" value={mentee.mentorMujid} />
                <InfoItem icon="📧" label="Mentor Email" value={mentee.mentorEmailid || mentee.mentorEmailId} />
              </Box>
            </TabPanel>

            {/* Family Info Tab - Updated */}
            <TabPanel value={activeTab} index={2}>
              {mentee.parents && (
                <Box sx={{ width: '100%' }}>
                  <Box sx={{
                    p: 3,
                    background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.05) 0%, rgba(234, 88, 12, 0.05) 100%)',
                    borderRadius: 3,
                    border: '1px solid rgba(249, 115, 22, 0.2)',
                    mb: 3
                  }}>
                    <Typography variant="h6" sx={{ 
                      color: '#f97316', 
                      mb: 2,
                      fontWeight: 600
                    }}>
                      Family Information
                    </Typography>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                      {/* Update gradient colors for each card */}
                      {mentee.parents.father && (
                        <Box flex={1}>
                          <FamilyContactCard
                            title="Father"
                            icon="👨"
                            contact={mentee.parents.father}
                            gradient="135deg, rgba(249, 115, 22, 0.1) 0%, rgba(234, 88, 12, 0.1) 100%"
                          />
                        </Box>
                      )}
                      {mentee.parents.mother && (
                        <Box flex={1}>
                          <FamilyContactCard
                            title="Mother"
                            icon="👩"
                            contact={mentee.parents.mother}
                            gradient="135deg, rgba(249, 115, 22, 0.1) 0%, rgba(234, 88, 12, 0.1) 100%"
                          />
                        </Box>
                      )}
                      {mentee.parents.guardian && (
                        <Box flex={1}>
                          <FamilyContactCard
                            title="Guardian"
                            icon="👥"
                            contact={mentee.parents.guardian}
                            gradient="135deg, rgba(249, 115, 22, 0.1) 0%, rgba(234, 88, 12, 0.1) 100%"
                          />
                        </Box>
                      )}
                    </Stack>
                  </Box>
                </Box>
              )}
            </TabPanel>
          </DialogContent>
        </>
      )}
    </Dialog>
  );
};

// Updated InfoItem component
const InfoItem = ({ icon, label, value }) => (
  <Box sx={{
    p: 2,
    background: 'rgba(249, 115, 22, 0.05)',
    borderRadius: 2,
    border: '1px solid rgba(249, 115, 22, 0.2)',
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      borderColor: '#f97316',
      boxShadow: '0 4px 12px rgba(249, 115, 22, 0.1)'
    }
  }}>
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
      <Typography>{icon}</Typography>
      <Typography sx={{ color: '#f97316', fontWeight: 500 }}>
        {label}
      </Typography>
    </Box>
    <Typography 
      sx={{ 
        color: 'white',
        wordBreak: 'break-word', // Add word breaking
        overflowWrap: 'break-word', // Ensure long words wrap
        width: '100%' // Ensure full width
      }}
    >
      {value || 'N/A'}
    </Typography>
  </Box>
);

// Updated FamilyContactCard component
const FamilyContactCard = ({ title, icon, contact, gradient }) => (
  <Box sx={{
    p: 2.5,
    background: gradient,
    borderRadius: 2,
    border: '1px solid rgba(249, 115, 22, 0.2)',
    height: '100%',
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      borderColor: '#f97316',
      boxShadow: '0 4px 12px rgba(249, 115, 22, 0.1)'
    }
  }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
      <Typography sx={{ fontSize: '24px' }}>{icon}</Typography>
      <Typography variant="h6" sx={{ 
        color: '#f97316', 
        fontWeight: 600 
      }}>
        {title}
      </Typography>
    </Box>
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <ContactDetail icon="👤" value={contact.name} />
      <ContactDetail icon="📧" value={contact.email} />
      <ContactDetail icon="📱" value={contact.phone} />
      {contact.alternatePhone && (
        <ContactDetail icon="📞" value={contact.alternatePhone} />
      )}
      {contact.relation && (
        <ContactDetail icon="🤝" value={contact.relation} />
      )}
    </Box>
  </Box>
);

const ContactDetail = ({ icon, value }) => (
  <Box sx={{ 
    display: 'flex', 
    alignItems: 'flex-start', // Change from center to flex-start
    gap: 1,
    width: '100%' // Ensure full width
  }}>
    <Typography sx={{ 
      fontSize: '16px',
      minWidth: '20px' // Add minimum width for icon
    }}>
      {icon}
    </Typography>
    <Typography sx={{ 
      color: 'rgba(255, 255, 255, 0.9)',
      fontSize: '0.9rem',
      fontWeight: 500,
      wordBreak: 'break-word', // Add word breaking
      overflowWrap: 'break-word', // Ensure long words wrap
      flex: 1 // Take remaining space
    }}>
      {value || 'N/A'}
    </Typography>
  </Box>
);

export default MenteeDetailsDialog;
