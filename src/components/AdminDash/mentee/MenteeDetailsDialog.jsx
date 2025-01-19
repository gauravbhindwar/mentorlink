import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Dialog, 
  DialogContent,
  Box, 
  Typography, 
  IconButton, 
  Grid,
  Tabs,
  Tab,
  Fade,
  Avatar,
  Chip,
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
          border: '1px solid rgba(99, 102, 241, 0.2)',
          maxHeight: '90vh',
          overflow: 'hidden'
        }
      }}
    >
      {mentee && (
        <>
          {/* Header Section */}
          <Box sx={{ 
            p: 3, 
            borderBottom: '1px solid rgba(99, 102, 241, 0.2)',
            background: 'linear-gradient(to right, rgba(99, 102, 241, 0.1), rgba(0, 0, 0, 0))',
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
                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    border: '2px solid rgba(99, 102, 241, 0.5)'
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
                  color: '#6366f1',
                  '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.1)' }
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {['semester', 'section', 'academicYear'].map((field) => (
                mentee[field] && (
                  <Chip 
                    key={field}
                    label={field === 'semester' ? `Semester ${mentee[field]}` :
                           field === 'section' ? `Section ${mentee[field]}` :
                           mentee[field]}
                    sx={{ 
                      bgcolor: 'rgba(99, 102, 241, 0.1)',
                      color: '#6366f1',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.2)' }
                    }}
                  />
                )
              ))}
            </Box>
          </Box>

          {/* Tabs Navigation */}
          <Box sx={{ borderBottom: 1, borderColor: 'rgba(99, 102, 241, 0.2)' }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{
                '& .MuiTab-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-selected': {
                    color: '#6366f1',
                  }
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#6366f1',
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
            {/* Basic Info Tab */}
            <TabPanel value={activeTab} index={0}>
              <Grid container spacing={3}>
                <InfoItem icon="📧" label="Email" value={mentee.email} />
                <InfoItem icon="📱" label="Phone" value={mentee.phone} />
                <InfoItem icon="📍" label="Address" value={mentee.address} fullWidth />
              </Grid>
            </TabPanel>

            {/* Academic Info Tab */}
            <TabPanel value={activeTab} index={1}>
              <Grid container spacing={3}>
                <InfoItem icon="📚" label="Academic Year" value={mentee.academicYear} />
                <InfoItem icon="🗓️" label="Academic Session" value={mentee.academicSession} />
                <InfoItem icon="📅" label="Year of Registration" value={mentee.yearOfRegistration} />
                <InfoItem icon="👨‍🏫" label="Mentor MUJID" value={mentee.mentorMujid} />
                <InfoItem icon="📧" label="Mentor Email" value={mentee.mentorEmailid || mentee.mentorEmailId} />
                
                {/* Meeting Statistics */}
                {/* DISABLED FOR NOW */}
                {/* <Grid item xs={12}>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: 'rgba(249, 115, 22, 0.1)',
                      borderRadius: 2,
                      border: '1px solid rgba(249, 115, 22, 0.2)',
                    }}
                  >
                    <Typography variant="h6" sx={{ color: '#f97316', mb: 2 }}>
                      Meeting Statistics
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Box
                          sx={{
                            p: 2,
                            bgcolor: 'rgba(249, 115, 22, 0.05)',
                            borderRadius: 1,
                            textAlign: 'center'
                          }}
                        >
                          <Typography variant="h4" sx={{ color: '#f97316' }}>
                            {meetingStats.total}
                          </Typography>
                          <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            Total Meetings
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box
                          sx={{
                            p: 2,
                            bgcolor: 'rgba(34, 197, 94, 0.05)',
                            borderRadius: 1,
                            textAlign: 'center'
                          }}
                        >
                          <Typography variant="h4" sx={{ color: '#22c55e' }}>
                            {meetingStats.completed}
                          </Typography>
                          <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            Completed
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box
                          sx={{
                            p: 2,
                            bgcolor: 'rgba(234, 179, 8, 0.05)',
                            borderRadius: 1,
                            textAlign: 'center'
                          }}
                        >
                          <Typography variant="h4" sx={{ color: '#eab308' }}>
                            {meetingStats.pending}
                          </Typography>
                          <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            Scheduled
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid> */}
              </Grid>
            </TabPanel>

            {/* Family Info Tab */}
            <TabPanel value={activeTab} index={2}>
              {mentee.parents && (
                <Grid container spacing={3}>
                  {/* Parents Summary Card */}
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        p: 3,
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
                        borderRadius: 3,
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                        mb: 3
                      }}
                    >
                      <Typography variant="h6" sx={{ color: '#6366f1', mb: 2 }}>
                        Family Information
                      </Typography>
                      <Grid container spacing={2}>
                        {mentee.parents.father && (
                          <Grid item xs={12} md={4}>
                            <FamilyContactCard
                              title="Father"
                              icon="👨"
                              contact={mentee.parents.father}
                              gradient="135deg, rgba(99, 102, 241, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%"
                            />
                          </Grid>
                        )}
                        {mentee.parents.mother && (
                          <Grid item xs={12} md={4}>
                            <FamilyContactCard
                              title="Mother"
                              icon="👩"
                              contact={mentee.parents.mother}
                              gradient="135deg, rgba(124, 58, 237, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%"
                            />
                          </Grid>
                        )}
                        {mentee.parents.guardian && (
                          <Grid item xs={12} md={4}>
                            <FamilyContactCard
                              title="Guardian"
                              icon="👥"
                              contact={mentee.parents.guardian}
                              gradient="135deg, rgba(79, 70, 229, 0.2) 0%, rgba(124, 58, 237, 0.2) 100%"
                            />
                          </Grid>
                        )}
                      </Grid>
                    </Box>
                  </Grid>
                </Grid>
              )}
            </TabPanel>
          </DialogContent>
        </>
      )}
    </Dialog>
  );
};

const InfoItem = ({ icon, label, value, fullWidth = false }) => (
  <Grid item xs={12} sm={fullWidth ? 12 : 6}>
    <Box
      sx={{
        p: 2,
        background: 'rgba(99, 102, 241, 0.05)',
        borderRadius: 2,
        border: '1px solid rgba(99, 102, 241, 0.2)',
        height: '100%',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          borderColor: '#6366f1',
          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.1)'
        }
      }}
    >
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
        <Typography>{icon}</Typography>
        <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 500 }}>
          {label}
        </Typography>
      </Box>
      <Typography sx={{ color: 'white' }}>
        {value || 'N/A'}
      </Typography>
    </Box>
  </Grid>
);

const FamilyContactCard = ({ title, icon, contact }) => (
  <Box
    sx={{
      p: 2.5,
      background: 'rgba(99, 102, 241, 0.05)',
      borderRadius: 2,
      border: '1px solid rgba(99, 102, 241, 0.2)',
      height: '100%',
      transition: 'all 0.2s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        borderColor: '#6366f1',
        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.1)'
      }
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
      <Typography sx={{ fontSize: '24px' }}>{icon}</Typography>
      <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
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
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <Typography sx={{ fontSize: '16px' }}>{icon}</Typography>
    <Typography sx={{ 
      color: 'rgba(255, 255, 255, 0.9)',
      fontSize: '0.9rem',
      fontWeight: 500
    }}>
      {value || 'N/A'}
    </Typography>
  </Box>
);

export default MenteeDetailsDialog;
