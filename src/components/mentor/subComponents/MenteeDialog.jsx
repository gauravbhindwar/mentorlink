import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  Typography,
  TextField,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    {...other}
  >
    {value === index && (
      <Box sx={{ p: 2 }}>
        {children}
      </Box>
    )}
  </div>
);

const MenteeDialog = ({ 
  open, 
  onClose, 
  selectedMentee, 
  editedMentee, 
  isEditing, 
  onEditMode, 
  onInputChange, 
  onUpdate,
  loading
}) => {
  const [tabValue, setTabValue] = React.useState(0);
  const currentMentee = isEditing ? editedMentee : selectedMentee;

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.95), rgba(31, 41, 55, 0.95))',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '1rem',
          color: 'white',
          height: '90vh',
          maxHeight: '800px',
        },
      }}>
      <DialogTitle
        sx={{
          borderBottom: '1px solid rgba(100, 100, 100, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
        }}>
        <Box component='div' sx={{ typography: 'h6', color: 'white' }}>
          {isEditing ? 'Edit Mentee Details' : 'View Mentee Details'}
        </Box>
        {!isEditing && (
          <IconButton
            onClick={onEditMode}
            sx={{
              color: '#f97316',
              '&:hover': { bgcolor: 'rgba(249, 115, 22, 0.1)' },
            }}>
            <EditIcon />
          </IconButton>
        )}
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              color: 'rgba(255, 255, 255, 0.7)',
              '&.Mui-selected': {
                color: '#f97316',
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#f97316',
            },
          }}
        >
          <Tab icon={<PersonIcon />} label="Personal" />
          <Tab icon={<SchoolIcon />} label="Academic" />
          <Tab icon={<FamilyRestroomIcon />} label="Family" />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 0 }}>
        {currentMentee && (
          <>
            <TabPanel value={tabValue} index={0}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <TextField
                    label='MUJ ID'
                    name='MUJid'
                    value={currentMentee.MUJid || ''}
                    disabled={true}
                    fullWidth
                    size="small"
                  />
                </div>
                <div>
                  <TextField
                    label='Name'
                    name='name'
                    value={currentMentee.name || ''}
                    onChange={(e) => onInputChange(e)}
                    disabled={!isEditing}
                    fullWidth
                    size="small"
                  />
                </div>
                <div>
                  <TextField
                    label='Email'
                    name='email'
                    value={currentMentee.email || ''}
                    onChange={(e) => onInputChange(e)}
                    disabled={!isEditing}
                    fullWidth
                    size="small"
                  />
                </div>
                <div>
                  <TextField
                    label='Phone'
                    name='phone'
                    value={currentMentee.phone || ''}
                    onChange={(e) => onInputChange(e)}
                    disabled={!isEditing}
                    fullWidth
                    size="small"
                  />
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <TextField
                    label='Address'
                    name='address'
                    multiline
                    rows={2}
                    value={currentMentee.address || ''}
                    onChange={(e) => onInputChange(e)}
                    disabled={!isEditing}
                    fullWidth
                    size="small"
                  />
                </div>
              </div>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <TextField
                    label='Semester'
                    name='semester'
                    type='number'
                    value={currentMentee.semester || ''}
                    onChange={(e) => onInputChange(e)}
                    disabled={!isEditing}
                    fullWidth
                    size="small"
                  />
                </div>
                <div>
                  <TextField
                    label='Academic Year'
                    name='academicYear'
                    value={currentMentee.academicYear || ''}
                    onChange={(e) => onInputChange(e)}
                    disabled={!isEditing}
                    fullWidth
                    size="small"
                  />
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <TextField
                    label='Academic Session'
                    name='academicSession'
                    value={currentMentee.academicSession || ''}
                    onChange={(e) => onInputChange(e)}
                    disabled={!isEditing}
                    fullWidth
                    size="small"
                  />
                </div>
              </div>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <div className="space-y-6">
                {/* Father's Details */}
                <div className="space-y-4">
                  <Typography variant='subtitle2' color='#f97316' gutterBottom>
                    Father&apos;s Details
                  </Typography>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {['name', 'email', 'phone'].map((field) => (
                      <div key={field}>
                        <TextField
                          label={`Father's ${field.charAt(0).toUpperCase() + field.slice(1)}`}
                          value={currentMentee.parents?.father?.[field] || ''}
                          onChange={(e) => onInputChange(e, 'father', field)}
                          disabled={!isEditing}
                          fullWidth
                          size="small"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mother's Details */}
                <div className="space-y-4">
                  <Typography variant='subtitle2' color='#f97316' gutterBottom>
                    Mother&apos;s Details
                  </Typography>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {['name', 'email', 'phone'].map((field) => (
                      <div key={field}>
                        <TextField
                          label={`Mother's ${field.charAt(0).toUpperCase() + field.slice(1)}`}
                          value={currentMentee.parents?.mother?.[field] || ''}
                          onChange={(e) => onInputChange(e, 'mother', field)}
                          disabled={!isEditing}
                          fullWidth
                          size="small"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Guardian's Details */}
                <div className="space-y-4">
                  <Typography variant='subtitle2' color='#f97316' gutterBottom>
                    Guardian&apos;s Details
                  </Typography>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {['name', 'email', 'phone'].map((field) => (
                      <div key={field}>
                        <TextField
                          label={`Guardian's ${field.charAt(0).toUpperCase() + field.slice(1)}`}
                          value={currentMentee.parents?.guardian?.[field] || ''}
                          onChange={(e) => onInputChange(e, 'guardian', field)}
                          disabled={!isEditing}
                          fullWidth
                          size="small"
                        />
                      </div>
                    ))}
                    <div className="col-span-1 sm:col-span-3">
                      <TextField
                        label="Guardian's Relation"
                        value={currentMentee.parents?.guardian?.relation || ''}
                        onChange={(e) => onInputChange(e, 'guardian', 'relation')}
                        disabled={!isEditing}
                        fullWidth
                        size="small"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabPanel>
          </>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          borderTop: '1px solid rgba(100, 100, 100, 0.1)',
          p: 2,
          gap: 1,
        }}>
        <Button
          onClick={onClose}
          variant='outlined'
          disabled={loading}
          sx={{
            color: 'white',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            '&:hover': {
              borderColor: 'rgba(255, 255, 255, 0.5)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
            },
          }}>
          Cancel
        </Button>
        {isEditing && (
          <Button
            onClick={onUpdate}
            variant='contained'
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            sx={{
              bgcolor: '#f97316',
              '&:hover': {
                bgcolor: '#ea580c',
              },
            }}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default MenteeDialog;
