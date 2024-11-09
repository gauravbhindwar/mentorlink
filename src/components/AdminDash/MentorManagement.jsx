import { useState } from 'react';
import { Box, Typography, Table, Button } from '@mui/material';

const MentorManagement = () => {
  const [mentors, setMentors] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);

  return (
    <Box>
      <Typography variant="h5" mb={3}>Mentor Management</Typography>
      <Button variant="contained" onClick={() => setOpenDialog(true)}>
        Add New Mentor
      </Button>
      <Table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Expertise</th>
            <th>Current Mentees</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {mentors.map(mentor => (
            <tr key={mentor.id}>
              <td>{mentor.name}</td>
              <td>{mentor.expertise}</td>
              <td>{mentor.currentMentees}</td>
              <td>{mentor.status}</td>
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

export default MentorManagement;