"use client"
import React, { useState, useEffect } from 'react';
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
  const [uploadProgress, setUploadProgress] = useState(0);

  // Simulate upload progress
  useEffect(() => {
    if (isUploading) {
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + Math.random() * 15;
        });
      }, 500);
      return () => clearInterval(interval);
    } else {
      setUploadProgress(0);
    }
  }, [isUploading]);

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
  
  // Enhanced error grouping that consolidates duplicate errors
  const groupErrors = (errors) => {
    // Error category definitions with colors and priorities
    const errorCategories = {
      'duplicate_email': { 
        title: 'Duplicate Email', 
        color: '#fb923c',
        priority: 1,
        pattern: /email already exists|duplicate email/i
      },
      'invalid_session': { 
        title: 'Invalid Academic Session', 
        color: '#f43f5e',
        priority: 2,
        pattern: /invalid academic session/i
      },
      'missing_session': { 
        title: 'Missing Academic Session', 
        color: '#f43f5e',
        priority: 2,
        pattern: /academic session not found/i
      },
      'validation': { 
        title: 'Validation Error', 
        color: '#ef4444',
        priority: 3,
        pattern: /validation|invalid format|required/i
      }
    };

    // First pass: Group errors by their exact message
    const errorMap = new Map();
    
    errors.forEach(error => {
      const errorMessages = error.errors.map(err => err.trim());
      errorMessages.forEach(message => {
        // Find matching category
        let category = 'other';
        for (const [key, cat] of Object.entries(errorCategories)) {
          if (cat.pattern.test(message.toLowerCase())) {
            category = key;
            break;
          }
        }

        const errorKey = `${category}:${message}`;
        if (!errorMap.has(errorKey)) {
          errorMap.set(errorKey, {
            category,
            message,
            rows: [],
            count: 0,
            ...errorCategories[category] || { title: 'Other Error', color: '#94a3b8', priority: 4 }
          });
        }
        
        const errorInfo = errorMap.get(errorKey);
        errorInfo.rows.push(error.row);
        errorInfo.count++;
      });
    });

    // Convert map to array and sort by priority
    return Array.from(errorMap.values())
      .sort((a, b) => (a.priority || 99) - (b.priority || 99));
  };

  // Render error summary more concisely
  const renderErrorSummary = (groupedErrors) => {
    return (
      <Alert 
        severity="error" 
        sx={{ 
          mb: 2,
          borderRadius: '8px',
          border: '1px solid rgba(220, 38, 38, 0.2)',
          bgcolor: 'rgba(220, 38, 38, 0.1)',
          color: '#ffffff',
          '& .MuiAlert-icon': {
            color: '#ef4444'
          }
        }}
      >
        <Typography variant="subtitle1" sx={{ 
          fontWeight: 600, 
          mb: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <span style={{ color: '#ef4444' }}>●</span>
          {errors.length} Issue{errors.length > 1 ? 's' : ''} Found
        </Typography>
        
        {groupedErrors.map((group, index) => (
          <Box key={index} sx={{ mb: 1 }}>
            <Typography sx={{ 
              color: group.color,
              fontSize: '0.875rem',
              fontWeight: 600,
              mb: 0.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              {group.title} ({group.count})
            </Typography>
            <Typography sx={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.8rem',
              pl: 2
            }}>
              {group.message} (Rows: {group.rows.join(', ')})
            </Typography>
          </Box>
        ))}

        {groupedErrors.some(g => g.category === 'missing_session') && (
          <Typography sx={{ 
            mt: 2,
            color: '#f97316',
            fontSize: '0.875rem',
            fontStyle: 'italic'
          }}>
            Tip: Ensure academic sessions are created before uploading
          </Typography>
        )}
      </Alert>
    );
  };

  return (
    <Dialog 
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#1a1a1a',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(249, 115, 22, 0.15)',
          color: '#ffffff',
          overflow: 'hidden',
          border: '1px solid rgba(249, 115, 22, 0.1)',
          maxHeight: '90vh',
          transition: 'all 0.3s ease-in-out',
        }
      }}
    >
      <DialogTitle 
        sx={{
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          p: 2, // Reduced padding
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#1a1a1a',
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#ffffff',
            letterSpacing: '-0.025em'
          }}
        >
          Preview Data
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{
            color: '#94a3b8',
            transition: 'all 0.2s',
            '&:hover': {
              transform: 'scale(1.1)',
              color: '#f97316',
              bgcolor: 'rgba(249, 115, 22, 0.1)'
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 2, bgcolor: '#1a1a1a' }}> {/* Reduced padding */}
        {errors.length > 0 && renderErrorSummary(groupErrors(errors))}

        <Box sx={{ 
          height: errors.length > 0 ? 400 : 500, // Adjust height based on errors
          width: '100%',
          '& .MuiDataGrid-root': {
            border: '1px solid rgba(249, 115, 22, 0.2)',
            borderRadius: '8px',
            overflow: 'hidden',
            color: '#ffffff',
            '& .MuiDataGrid-cell': {
              borderColor: 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              transition: 'background-color 0.2s ease',
              '&:hover': {
                backgroundColor: 'rgba(249, 115, 22, 0.05)'
              }
            },
            '& .MuiDataGrid-columnHeaders': {
              background: 'rgba(249, 115, 22, 0.1)',
              borderBottom: '2px solid rgba(249, 115, 22, 0.2)'
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 600,
              color: '#ffffff' // Darker color for better visibility
            },
            '& .MuiDataGrid-row': {
              transition: 'transform 0.2s ease, background-color 0.2s ease',
              '&:hover': {
                backgroundColor: 'rgba(249, 115, 22, 0.05)',
                transform: 'translateX(6px)'
              }
            },
            '& .MuiDataGrid-footerContainer': {
              borderTop: '1px solid rgba(249, 115, 22, 0.2)',
              bgcolor: 'rgba(249, 115, 22, 0.05)'
            },
            '& .MuiTablePagination-root': {
              color: '#ffffff',
              '& .MuiIconButton-root': {
                color: '#94a3b8',
                '&.Mui-disabled': {
                  color: 'rgba(255, 255, 255, 0.3)'
                },
                '&:hover': {
                  color: '#f97316',
                  bgcolor: 'rgba(249, 115, 22, 0.1)'
                }
              }
            },
            '& .MuiDataGrid-menuIcon': {
              color: '#94a3b8',
              '&:hover': {
                color: '#f97316'
              }
            },
            '& .MuiDataGrid-sortIcon': {
              color: '#94a3b8'
            }
          }
        }}>
          {Array.isArray(data) && data.length > 0 ? (
            <DataGrid
              rows={rows}
              columns={columns}
              pageSize={7} // Increased page size
              rowsPerPageOptions={[7]}
              disableSelectionOnClick
              disableColumnMenu
              disableColumnFilter
              checkboxSelection={false} // Removed checkboxes
              sx={{
                '& .MuiDataGrid-cell': {
                  color: '#ffffff'
                }
              }}
            />
          ) : (
            <Box sx={{ 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)'
            }}>
              <Typography sx={{ color: '#94a3b8', fontWeight: 500 }}>
                No valid data to preview
              </Typography>
            </Box>
          )}
        </Box>

        {isUploading && (
          <Box sx={{ width: '100%', mt: 2 }}> {/* Reduced margin */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, position: 'relative' }}>
              <Typography 
                sx={{ 
                  color: '#ffffff',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  mr: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                {uploadProgress < 100 
                  ? `Uploading... ${Math.round(uploadProgress)}%`
                  : 'Processing...'
                }
                <Box 
                  component="span" 
                  sx={{ 
                    display: 'flex',
                    gap: '4px',
                    alignItems: 'center'
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      style={{
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        backgroundColor: '#f97316',
                        animation: `bounce 0.8s ${i * 0.2}s infinite`
                      }}
                    />
                  ))}
                </Box>
              </Typography>
            </Box>
            <LinearProgress  
              variant="determinate"
              value={uploadProgress}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: 'rgba(249, 115, 22, 0.1)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: '#f97316',
                  backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)',
                  backgroundSize: '1rem 1rem',
                  animation: 'uploadProgress 1s linear infinite, stripe 1s linear infinite'
                }
              }}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ 
        p: 2, // Reduced padding
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        background: '#1a1a1a',
        gap: 1 // Reduced gap
      }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          disabled={isUploading} // Add this line
          sx={{
            color: '#94a3b8',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': {
              borderColor: '#f97316',
              bgcolor: 'rgba(249, 115, 22, 0.1)'
            },
            '&.Mui-disabled': { // Add disabled styles
              borderColor: 'rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.3)'
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
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: 'none',
            '&:hover': {
              bgcolor: '#ea580c',
              boxShadow: '0 4px 12px rgba(30, 64, 175, 0.2)'
            },
            '&.Mui-disabled': {
              bgcolor: 'rgba(249, 115, 22, 0.3)',
              color: 'rgba(255, 255, 255, 0.5)'
            }
          }}
        >
          {isUploading ? 'Uploading...' : 'Confirm Upload'}
        </Button>
      </DialogActions>

      <style jsx global>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.4; }
          100% { opacity: 1; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        
        @keyframes uploadProgress {
          0% { background-position: 1rem 0; }
          100% { background-position: 0 0; }
        }
        
        @keyframes stripe {
          0% { background-position: 0 0; }
          100% { background-position: 1rem 0; }
        }
        
        .MuiDataGrid-row {
          cursor: pointer;
        }
        
        .MuiDataGrid-cell:hover {
          color: #f97316 !important;
        }
      `}</style>
    </Dialog>
  );
};

export default BulkUploadPreview;