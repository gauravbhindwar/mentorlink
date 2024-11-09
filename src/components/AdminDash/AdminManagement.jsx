import { useState } from 'react';
import { Box, Typography, Table, Button } from '@mui/material';

const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);

  return (
    <Box>
      <Typography variant="h5" mb={3}>Admin Management</Typography>
      <Button variant="contained">Add New Admin</Button>
      <Table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Last Active</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {admins.map(admin => (
            <tr key={admin.id}>
              <td>{admin.name}</td>
              <td>{admin.role}</td>
              <td>{admin.lastActive}</td>
              <td>{admin.status}</td>
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

export default AdminManagement;