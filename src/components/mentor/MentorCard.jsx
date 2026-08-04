import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Stack,
  Box,
  IconButton,
  Collapse,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import BadgeIcon from '@mui/icons-material/Badge';
import PhoneIcon from '@mui/icons-material/Phone';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import InfoIcon from '@mui/icons-material/Info';
import TransferIcon from '@mui/icons-material/SwapHoriz';

const MentorCard = ({ mentor, onEditClick, onDeleteClick, expanded, onExpandClick, onInfoClick, onTransferClick }) => {
  return (
    <Card
      sx={{
        width: '100%',
        bgcolor: 'rgba(17, 17, 17, 0.8)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '1rem',
        color: 'white',
        transition: 'all 0.3s ease',
        mb: 2,
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
        },
      }}>
      <CardContent>
        <Stack spacing={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <PersonIcon sx={{ color: '#f97316' }} />
            <Typography variant="h6">{mentor.name}</Typography>
          </Box>
          
          <Stack spacing={1}>
            <Box display="flex" alignItems="center" gap={1}>
              <BadgeIcon sx={{ color: '#f97316', fontSize: '1.2rem' }} />
              <Typography variant="body2" color="rgba(255,255,255,0.7)">
                MUJ ID: {mentor.MUJid}
              </Typography>
            </Box>
            
            <Box display="flex" alignItems="center" gap={1}>
              <EmailIcon sx={{ color: '#f97316', fontSize: '1.2rem' }} />
              <Typography variant="body2" color="rgba(255,255,255,0.7)">
                {mentor.email}
              </Typography>
            </Box>

            {mentor.phone_number && (
              <Box display="flex" alignItems="center" gap={1}>
                <PhoneIcon sx={{ color: '#f97316', fontSize: '1.2rem' }} />
                <Typography variant="body2" color="rgba(255,255,255,0.7)">
                  {mentor.phone_number}
                </Typography>
              </Box>
            )}
          </Stack>
        </Stack>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Box>
          <IconButton
            onClick={() => onInfoClick(mentor)}
            sx={{
              color: '#3b82f6',
              '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.1)' },
              mr: 1,
            }}>
            <InfoIcon />
          </IconButton>
          <IconButton
            onClick={() => onEditClick(mentor)}
            sx={{
              color: '#f97316',
              '&:hover': { bgcolor: 'rgba(249, 115, 22, 0.1)' },
              mr: 1,
            }}>
            <EditIcon />
          </IconButton>
          <IconButton
            onClick={() => onDeleteClick(mentor.MUJid)}
            sx={{
              color: '#ef4444',
              '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' },
              mr: 1,
            }}>
            <DeleteIcon />
          </IconButton>
          <IconButton
            onClick={() => onTransferClick(mentor)}
            sx={{
              color: '#10B981',
              '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.1)' },
            }}>
            <TransferIcon />
          </IconButton>
        </Box>
        
        <IconButton
          onClick={() => onExpandClick(mentor.MUJid)}
          sx={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.3s',
          }}>
          <ExpandMoreIcon sx={{ color: 'white' }} />
        </IconButton>
      </CardActions>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent>
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle2" color="#f97316" gutterBottom>
                Roles
              </Typography>
              <Box sx={{ pl: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <AdminPanelSettingsIcon sx={{ color: '#f97316', fontSize: '1.2rem' }} />
                  <Typography variant="body2" color="rgba(255,255,255,0.7)">
                    {Array.isArray(mentor.role) ? mentor.role.join(', ') : mentor.role}
                  </Typography>
                </Stack>
              </Box>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="#f97316" gutterBottom>
                Academic Details
              </Typography>
              <Box sx={{ pl: 2 }}>
                <Stack spacing={1}>
                  <Typography variant="body2" color="rgba(255,255,255,0.7)">
                    Academic Year: {mentor.academicYear}
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.7)">
                    Session: {mentor.academicSession}
                  </Typography>
                </Stack>
              </Box>
            </Box>

            {mentor.address && (
              <Box>
                <Typography variant="subtitle2" color="#f97316" gutterBottom>
                  Address
                </Typography>
                <Box sx={{ pl: 2 }}>
                  <Typography variant="body2" color="rgba(255,255,255,0.7)">
                    {mentor.address}
                  </Typography>
                </Box>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Collapse>
    </Card>
  );
};

export default MentorCard;
