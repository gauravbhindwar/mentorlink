import { Box, TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const MenteeFilters = ({ filters, setFilters }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        flexWrap: 'wrap',
      }}
    >
      <TextField
        placeholder="Search by email..."
        value={filters.email}
        onChange={(e) => setFilters(prev => ({ ...prev, email: e.target.value }))}
        variant="outlined"
        size="small"
        sx={{
          minWidth: 300,
          '& .MuiOutlinedInput-root': {
            color: 'white',
            '& fieldset': {
              borderColor: 'rgba(249, 115, 22, 0.3)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(249, 115, 22, 0.5)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#f97316',
            },
          },
          '& .MuiInputLabel-root': {
            color: 'rgba(255, 255, 255, 0.7)',
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: 'rgba(249, 115, 22, 0.7)' }} />
            </InputAdornment>
          ),
        }}
      />
      {/* Add other filter components here */}
    </Box>
  );
};

export default MenteeFilters;
