import React from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';

const MenteeTable = ({ 
  loading, 
  filteredMentees, 
  onEditClick, 
  columns 
}) => {
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '400px',
          flexDirection: 'column',
          gap: 2,
        }}>
        <CircularProgress sx={{ color: '#f97316' }} />
        <Typography sx={{ color: 'white', opacity: 0.7 }}>
          Loading mentees...
        </Typography>
      </Box>
    );
  }

  if (!filteredMentees.length) {
    return (
      <Box
        sx={{
          p: 4,
          textAlign: 'center',
          color: 'white',
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '1rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
        <Typography variant='h6' sx={{ mb: 2, color: '#f97316' }}>
          No Mentees Found
        </Typography>
        <Typography sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.7)' }}>
          Try adjusting your filters or add new mentees
        </Typography>
      </Box>
    );
  }

  return (
    <DataGrid
      rows={filteredMentees}
      columns={columns}
      getRowId={(row) => row.MUJid}
      disableRowSelectionOnClick
      disableSelectionOnClick={true}
      disableColumnMenu={true}
      disableColumnFilter={false}
      pageSizeOptions={[5, 10, 25, 50]}
      initialState={{
        pagination: { paginationModel: { pageSize: 10 } },
      }}
      sx={{
        height: '100%',
        backgroundColor: 'transparent',
        border: 'none',
        color: 'white',
        '& .MuiDataGrid-cell': {
          borderColor: 'rgba(255, 255, 255, 0.1)',
        },
        '& .MuiDataGrid-columnHeaders': {
          backgroundColor: 'rgba(10, 10, 10, 0.9)',
          color: '#f97316',
          fontWeight: 'bold',
          borderColor: 'rgba(255, 255, 255, 0.1)',
        },
        '& .MuiDataGrid-footerContainer': {
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          minHeight: '56px',
          padding: '8px 0',
        },
        '& .MuiDataGrid-row:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
        },
        '& .MuiDataGrid-menuIcon': {
          color: 'white',
        },
        '& .MuiDataGrid-sortIcon': {
          color: 'white',
        },
        '& .MuiDataGrid-pagination': {
          color: 'white',
        },
        '& .MuiTablePagination-root': {
          color: 'white',
        },
        '& .MuiTablePagination-select': {
          color: 'white',
        },
        '& .MuiTablePagination-selectIcon': {
          color: 'white',
        },
        '& .MuiIconButton-root': {
          color: 'white',
        },
      }}
    />
  );
};

export default MenteeTable;
