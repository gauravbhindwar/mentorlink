"use client"
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  IconButton,
  LinearProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { DataGrid } from '@mui/x-data-grid';

const BulkUploadPreview = ({ open, onClose, data, errors, onConfirm, isUploading, type }) => {
  const columns = type === 'mentee' ? [
    { field: 'MUJid', headerName: 'MUJid', width: 130 },
    { field: 'name', headerName: 'Name', width: 180 },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'section', headerName: 'Section', width: 100 },
    { field: 'semester', headerName: 'Semester', width: 100 },
    { field: 'academicYear', headerName: 'Academic Year', width: 150 },
    { field: 'academicSession', headerName: 'Academic Session', width: 180 },
    { field: 'mentorMujid', headerName: 'Mentor MUJid', width: 130 },
  ] : [
    { field: 'MUJid', headerName: 'MUJid', width: 130 },
    { field: 'name', headerName: 'Name', width: 180 },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'phone_number', headerName: 'Phone Number', width: 150 },
    { field: 'gender', headerName: 'Gender', width: 100 },
    { field: 'role', headerName: 'Role', width: 100 },
    { field: 'academicYear', headerName: 'Academic Year', width: 150 },
    { field: 'academicSession', headerName: 'Academic Session', width: 180 }
  ];

  const rows = data.map((row, index) => ({
    id: index,
    ...row
  }));

  return (
    <Dialog 
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#ffffff',
          borderRadius: '1rem',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
          color: '#1a1a1a',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle 
        sx={{
          borderBottom: '1px solid #e5e7eb',
          p: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: '#f8fafc',
          color: '#1e293b', // Added color to ensure text is visible
        }}
      >
        {/* Updated div styling */}
        <div style={{ 
          fontWeight: 600,
          color: '#1e293b',
          fontSize: '1.25rem',
          fontFamily: '"Roboto","Helvetica","Arial",sans-serif'
        }}>
          Preview {type === 'mentee' ? 'Mentees' : 'Mentors'} Data
        </div>
        <IconButton
          onClick={onClose}
          sx={{ 
            color: '#64748b',
            '&:hover': { 
              bgcolor: '#f1f5f9',
              color: '#475569'
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        {errors.length > 0 && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              '& .MuiAlert-icon': {
                color: '#dc2626'
              }
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Validation Errors Found
            </Typography>
            {errors.map((error, index) => (
              <Typography key={index} sx={{ color: '#dc2626', fontSize: '0.875rem' }}>
                Row {error.row}: {error.errors.join(', ')}
              </Typography>
            ))}
          </Alert>
        )}

        <Box sx={{ 
          height: 400,
          width: '100%',
          '& .MuiDataGrid-root': {
            border: '1px solid #e5e7eb',
            borderRadius: 1,
            '& .MuiDataGrid-cell': {
              borderColor: '#e5e7eb'
            },
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: '#f8fafc!important',
              borderBottom: '2px solid #e5e7eb'
            },
            '& .MuiDataGrid-columnHeaderTitle': {
                bgcolor: '#f8fafc',
              fontWeight: 600,
              color: '#1e293b'
            },
            '& .MuiDataGrid-row:hover': {
              bgcolor: '#f8fafc'
            }
          }
        }}>
          {Array.isArray(data) && data.length > 0 ? (
            <DataGrid
              rows={rows}
              columns={columns}
              pageSize={5}
              rowsPerPageOptions={[5]}
              checkboxSelection
              disableSelectionOnClick
              sx={{
                '& .MuiDataGrid-cell': {
                  color: '#1e293b'
                },
                '& .MuiCheckbox-root': {
                  color: '#64748b',
                  '&.Mui-checked': {
                    color: '#f97316'
                  }
                }
              }}
            />
          ) : (
            <Box sx={{ 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: '1px solid #e5e7eb',
              borderRadius: 1
            }}>
              <Typography sx={{ color: '#64748b' }}>
                No valid data to preview
              </Typography>
            </Box>
          )}
        </Box>

        {isUploading && (
          <Box sx={{ width: '100%', mt: 3 }}>
            <LinearProgress 
              sx={{
                bgcolor: '#f1f5f9',
                '& .MuiLinearProgress-bar': {
                  bgcolor: '#f97316'
                }
              }}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ 
        p: 3,
        borderTop: '1px solid #e5e7eb',
        bgcolor: '#f8fafc'
      }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          sx={{
            color: '#64748b',
            borderColor: '#cbd5e1',
            '&:hover': {
              borderColor: '#94a3b8',
              bgcolor: '#f1f5f9'
            }
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={onConfirm} 
          disabled={isUploading || errors.length > 0}
          variant="contained"
          sx={{
            bgcolor: '#f97316',
            '&:hover': {
              bgcolor: '#ea580c'
            },
            '&.Mui-disabled': {
              bgcolor: '#fed7aa',
              color: '#ffffff'
            }
          }}
        >
          {isUploading ? 'Uploading...' : 'Confirm Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkUploadPreview;