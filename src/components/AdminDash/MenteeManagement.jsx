import { useState } from 'react';
import { Box, Typography, Table, Button } from '@mui/material';

const MenteeManagement = () => {
  const [mentees, setMentees] = useState([]);

  return (
    <Box>
      <Typography variant="h5" mb={3}>Mentee Management</Typography>
      <Button variant="contained">Add New Mentee</Button>
      <Table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Program</th>
            <th>Assigned Mentor</th>
            <th>Progress</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {mentees.map(mentee => (
            <tr key={mentee.id}>
              <td>{mentee.name}</td>
              <td>{mentee.program}</td>
              <td>{mentee.assignedMentor}</td>
              <td>{mentee.progress}</td>
              <td>
                <Button size="small">Edit</Button>
                <Button size="small" color="error">Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Box>
  );
};

export default MenteeManagement;