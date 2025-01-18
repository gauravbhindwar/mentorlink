import { Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography, IconButton, TextField, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { dialogStyles } from '../menteeStyle';

const EditMenteeDialog = ({ open, onClose, mentee, onUpdate }) => {

//   const generateYearSuggestions = (input) => {
//     if (!input) return [];
//     const currentYear = new Date().getFullYear();
//     const suggestions = [];
//     for (let i = 0; i < 5; i++) {
//       const year = currentYear - i;
//       const academicYear = `${year}-${year + 1}`;
//       if (academicYear.startsWith(input)) {
//         suggestions.push(academicYear);
//       }
//     }
//     return suggestions;
//   };

  const handleEditInputChange = (e, category, subcategory) => {
    if (category && subcategory) {
      onUpdate({
        ...mentee,
        parents: {
          ...mentee.parents,
          [category]: {
            ...mentee.parents?.[category],
            [subcategory]: e.target.value
          }
        }
      });
    } else {
      const { name, value } = e.target;
      onUpdate({
        ...mentee,
        [name]: name === 'MUJid' ? value.toUpperCase() : value
      });
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: dialogStyles.paper }}
    >
      <DialogTitle sx={dialogStyles.title}>
        <Typography variant="h6" component="div" sx={{ color: '#f97316', fontWeight: 600 }}>
          Edit Mentee Details
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'rgba(255, 255, 255, 0.7)',
            '&:hover': { color: '#f97316' }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={dialogStyles.content}>
        {mentee && (
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            gap: 3,
            py: 2
          }}>
            {/* Student Information */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="subtitle1" sx={{ color: '#f97316', fontWeight: 600 }}>
                Student Information
              </Typography>
              <TextField
                label="MUJid"
                name="MUJid"
                value={mentee.MUJid || ''}
                disabled
                sx={dialogStyles.textField}
              />
              <TextField
                label="Name"
                name="name"
                value={mentee.name || ''}
                onChange={handleEditInputChange}
                required
                sx={dialogStyles.textField}
              />
              <TextField
                label="Email"
                name="email"
                type="email"
                value={mentee.email || ''}
                onChange={handleEditInputChange}
                required
                sx={dialogStyles.textField}
              />
              <TextField
                label="Phone"
                name="phone"
                value={mentee.phone || ''}
                onChange={handleEditInputChange}
                sx={dialogStyles.textField}
              />
            </Box>

            {/* Academic Information */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="subtitle1" sx={{ color: '#f97316', fontWeight: 600 }}>
                Academic Information
              </Typography>
              <TextField
                label="Year of Registration"
                name="yearOfRegistration"
                type="number"
                value={mentee.yearOfRegistration || ''}
                onChange={handleEditInputChange}
                required
                sx={dialogStyles.textField}
              />
              <TextField
                label="Section"
                name="section"
                value={mentee.section || ''}
                onChange={handleEditInputChange}
                required
                inputProps={{ maxLength: 1, style: { textTransform: 'uppercase' } }}
                sx={dialogStyles.textField}
              />
              <TextField
                label="Semester"
                name="semester"
                type="number"
                value={mentee.semester || ''}
                onChange={handleEditInputChange}
                required
                sx={dialogStyles.textField}
              />
              <TextField
                label="Academic Year"
                name="academicYear"
                value={mentee.academicYear || ''}
                onChange={handleEditInputChange}
                required
                sx={dialogStyles.textField}
              />
              <TextField
                label="Academic Session"
                name="academicSession"
                value={mentee.academicSession || ''}
                onChange={handleEditInputChange}
                required
                sx={dialogStyles.textField}
              />
            </Box>

            {/* Mentor Information */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="subtitle1" sx={{ color: '#f97316', fontWeight: 600 }}>
                Mentor Information
              </Typography>
              <TextField
                label="Mentor MUJid"
                name="mentorMujid"
                value={mentee.mentorMujid || ''}
                onChange={handleEditInputChange}
                required
                sx={dialogStyles.textField}
              />
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={dialogStyles.actions}>
        <Button 
          onClick={onClose}
          variant="outlined"
          sx={{
            borderColor: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            '&:hover': {
              borderColor: 'rgba(255, 255, 255, 0.5)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
            },
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={() => onUpdate(mentee)}
          variant="contained"
          sx={{
            bgcolor: '#f97316',
            '&:hover': {
              bgcolor: '#ea580c',
            },
          }}
        >
          Update
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditMenteeDialog;
