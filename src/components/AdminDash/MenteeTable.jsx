'use client';

import { Table, TableHead, TableRow, TableCell, TableBody, Button } from '@mui/material';

const MenteeTable = ({ mentees, onEditClick, isSmallScreen }) => {
  const displayFields = [
    'mujid', 'yearOfRegistration', 'name', 'email', 'phone',
    'fatherName', 'motherName', 'dateOfBirth',
    'parentsPhone', 'parentsEmail', 'mentorMujid', 'semester'
  ];

  return (
    <Table sx={{ minWidth: { xs: 300, sm: 650 }, border: '1px solid #ddd' }}>
      <TableHead>
        <TableRow sx={{ backgroundColor: '#f3f4f6' }}>
          {[...displayFields, 'Actions'].map(header => (
            <TableCell key={header} sx={{ 
              fontWeight: 'bold', 
              color: '#ea580c',
              padding: { xs: 1, sm: 2 },
              fontSize: { xs: '0.8rem', sm: '1rem' },
              border: '1px solid #ddd'
            }}>
              {header.charAt(0).toUpperCase() + header.slice(1).replace(/([A-Z])/g, ' $1')}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {mentees.map((mentee, index) => (
          <TableRow key={mentee.mujid} sx={{ 
            backgroundColor: index % 2 === 0 ? '#f9fafb' : '#fff',
            '&:hover': { backgroundColor: '#f3f4f6' }
          }}>
            {displayFields.map(field => (
              <TableCell key={field} sx={{ border: '1px solid #ddd' }}>
                {mentee[field]}
              </TableCell>
            ))}
            <TableCell sx={{ padding: { xs: 1, sm: 2 }, border: '1px solid #ddd' }}>
              <Button 
                size={isSmallScreen ? "small" : "medium"}
                variant="outlined" 
                fullWidth={isSmallScreen}
                onClick={() => onEditClick(mentee)}
                sx={{ borderRadius: '20px', fontSize: { xs: '0.7rem', sm: '0.8rem' } }}
              >
                Edit
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default MenteeTable;