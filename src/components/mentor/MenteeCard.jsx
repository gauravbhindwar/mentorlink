import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
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
import SchoolIcon from '@mui/icons-material/School';
import BadgeIcon from '@mui/icons-material/Badge';

const MenteeCard = ({ mentee, onEditClick, onDeleteClick, expanded, onExpandClick }) => {
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
            <Typography variant="h6">{mentee.name}</Typography>
          </Box>
          
          <Stack spacing={1}>
            <Box display="flex" alignItems="center" gap={1}>
              <BadgeIcon sx={{ color: '#f97316', fontSize: '1.2rem' }} />
              <Typography variant="body2" color="rgba(255,255,255,0.7)">
                MUJ ID: {mentee.MUJid}
              </Typography>
            </Box>
            
            <Box display="flex" alignItems="center" gap={1}>
              <EmailIcon sx={{ color: '#f97316', fontSize: '1.2rem' }} />
              <Typography variant="body2" color="rgba(255,255,255,0.7)">
                {mentee.email}
              </Typography>
            </Box>
            
            <Box display="flex" alignItems="center" gap={1}>
              <SchoolIcon sx={{ color: '#f97316', fontSize: '1.2rem' }} />
              <Typography variant="body2" color="rgba(255,255,255,0.7)">
                Semester {mentee.semester}
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Box>
          <IconButton
            onClick={() => onEditClick(mentee)}
            sx={{
              color: '#f97316',
              '&:hover': { bgcolor: 'rgba(249, 115, 22, 0.1)' },
              mr: 1,
            }}>
            <EditIcon />
          </IconButton>
          <IconButton
            onClick={() => onDeleteClick([mentee.MUJid])}
            sx={{
              color: '#ef4444',
              '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' },
            }}>
            <DeleteIcon />
          </IconButton>
        </Box>
        
        <IconButton
          onClick={() => onExpandClick(mentee.MUJid)}
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
                Personal Details
              </Typography>
              <Box sx={{ pl: 2 }}>
                <Stack spacing={1}>
                  {mentee.phone && (
                    <Typography variant="body2" color="rgba(255,255,255,0.7)">
                      Phone: {mentee.phone}
                    </Typography>
                  )}
                  <Typography variant="body2" color="rgba(255,255,255,0.7)">
                    Year of Registration: {mentee.yearOfRegistration}
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
                    Academic Year: {mentee.academicYear}
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.7)">
                    Session: {mentee.academicSession}
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.7)">
                    Current Semester: {mentee.semester}
                  </Typography>
                  {mentee.cgpa && (
                    <Typography variant="body2" color="rgba(255,255,255,0.7)">
                      CGPA: {mentee.cgpa}
                    </Typography>
                  )}
                </Stack>
              </Box>
            </Box>

            {mentee.mentorEmailid && (
              <Box>
                <Typography variant="subtitle2" color="#f97316" gutterBottom>
                  Mentor Information
                </Typography>
                <Box sx={{ pl: 2 }}>
                  <Stack spacing={1}>
                    <Typography variant="body2" color="rgba(255,255,255,0.7)">
                      Mentor Email: {mentee.mentorEmailid}
                    </Typography>
                    {mentee.mentorMujid && (
                      <Typography variant="body2" color="rgba(255,255,255,0.7)">
                        Mentor MUJ ID: {mentee.mentorMujid}
                      </Typography>
                    )}
                  </Stack>
                </Box>
              </Box>
            )}

            {mentee.parents && (
              <Box>
                <Typography variant="subtitle2" color="#f97316" gutterBottom>
                  Parent/Guardian Information
                </Typography>
                <Box sx={{ pl: 2 }}>
                  <Stack spacing={2}>
                    {mentee.parents.father && (
                      <Box>
                        <Typography variant="body2" color="rgba(255,255,255,0.85)">
                          Father
                        </Typography>
                        <Box sx={{ pl: 2 }}>
                          <Typography variant="body2" color="rgba(255,255,255,0.7)">
                            Name: {mentee.parents.father.name}
                          </Typography>
                          {mentee.parents.father.email && (
                            <Typography variant="body2" color="rgba(255,255,255,0.7)">
                              Email: {mentee.parents.father.email}
                            </Typography>
                          )}
                          {mentee.parents.father.phone && (
                            <Typography variant="body2" color="rgba(255,255,255,0.7)">
                              Phone: {mentee.parents.father.phone}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    )}

                    {mentee.parents.mother && (
                      <Box>
                        <Typography variant="body2" color="rgba(255,255,255,0.85)">
                          Mother
                        </Typography>
                        <Box sx={{ pl: 2 }}>
                          <Typography variant="body2" color="rgba(255,255,255,0.7)">
                            Name: {mentee.parents.mother.name}
                          </Typography>
                          {mentee.parents.mother.email && (
                            <Typography variant="body2" color="rgba(255,255,255,0.7)">
                              Email: {mentee.parents.mother.email}
                            </Typography>
                          )}
                          {mentee.parents.mother.phone && (
                            <Typography variant="body2" color="rgba(255,255,255,0.7)">
                              Phone: {mentee.parents.mother.phone}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    )}

                    {mentee.parents.guardian && (
                      <Box>
                        <Typography variant="body2" color="rgba(255,255,255,0.85)">
                          Guardian
                        </Typography>
                        <Box sx={{ pl: 2 }}>
                          <Typography variant="body2" color="rgba(255,255,255,0.7)">
                            Name: {mentee.parents.guardian.name}
                          </Typography>
                          {mentee.parents.guardian.relation && (
                            <Typography variant="body2" color="rgba(255,255,255,0.7)">
                              Relation: {mentee.parents.guardian.relation}
                            </Typography>
                          )}
                          {mentee.parents.guardian.email && (
                            <Typography variant="body2" color="rgba(255,255,255,0.7)">
                              Email: {mentee.parents.guardian.email}
                            </Typography>
                          )}
                          {mentee.parents.guardian.phone && (
                            <Typography variant="body2" color="rgba(255,255,255,0.7)">
                              Phone: {mentee.parents.guardian.phone}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    )}
                  </Stack>
                </Box>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Collapse>
    </Card>
  );
};

export default MenteeCard;
