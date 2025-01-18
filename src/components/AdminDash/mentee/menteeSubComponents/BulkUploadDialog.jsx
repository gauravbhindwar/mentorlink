import { Dialog, DialogTitle, DialogContent, Box, Typography, IconButton, LinearProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useDropzone } from 'react-dropzone';
import { dialogStyles } from '../menteeStyle';

const BulkUploadDialog = ({ open, onClose, onUpload, uploading, uploadProgress }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onUpload,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: {
        ...dialogStyles.paper,
        overflow: 'hidden'
      }}}
    >
      <DialogTitle sx={dialogStyles.title}>
        <Typography variant="h6" component="div" sx={{ color: '#f97316', fontWeight: 600 }}>
          Bulk Upload Mentees
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
      <DialogContent sx={{ ...dialogStyles.content, p: 0 }}>
        <Box
          {...getRootProps()}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            border: '2px dashed',
            borderColor: isDragActive ? '#f97316' : 'rgba(255, 255, 255, 0.2)',
            borderRadius: 2,
            bgcolor: isDragActive ? 'rgba(249, 115, 22, 0.1)' : 'transparent',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            '&:hover': {
              borderColor: '#f97316',
              bgcolor: 'rgba(249, 115, 22, 0.05)'
            }
          }}
        >
          <input {...getInputProps()} />
          <UploadFileIcon sx={{ fontSize: 48, color: '#f97316' }} />
          <Typography variant="h6" sx={{ color: 'white', textAlign: 'center' }}>
            {isDragActive
              ? 'Drop the Excel file here'
              : 'Drag & drop an Excel file here, or click to select'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center' }}>
            Supports .xls and .xlsx files only
          </Typography>
        </Box>
        {uploading && (
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" sx={{ color: 'white', mb: 1 }}>
              Uploading... {uploadProgress}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={uploadProgress}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: '#f97316'
                }
              }}
            />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BulkUploadDialog;
