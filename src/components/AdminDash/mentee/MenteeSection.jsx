'use client';
import { Box } from '@mui/material';
import MenteeTable from './MenteeTable';
import MenteeFilters from './MenteeFilters';
import { useState } from 'react';

const MenteeSection = () => {
  const [filters, setFilters] = useState({
    email: '',
    // Add other filter states as needed
  });

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        padding: 3,
        minHeight: 'calc(100vh - 64px)', // Adjust based on your navbar height
        bgcolor: 'background.default',
      }}
    >
      {/* Filters Container */}
      <Box
        sx={{
          p: 3,
          borderRadius: 2,
          bgcolor: 'rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(249, 115, 22, 0.2)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        }}
      >
        <MenteeFilters
          filters={filters}
          setFilters={setFilters}
        />
      </Box>

      {/* Table Container */}
      <Box
        sx={{
          flex: 1,
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <MenteeTable
          emailFilter={filters.email}
          // Pass other necessary props
        />
      </Box>
    </Box>
  );
};

export default MenteeSection;
