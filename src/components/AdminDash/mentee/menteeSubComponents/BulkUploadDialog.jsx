import { 
  Dialog, 
  DialogContent, 
  Box, 
  Typography, 
  IconButton, 
  LinearProgress,
  Button
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DescriptionIcon from '@mui/icons-material/Description';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {writeFile } from 'xlsx';
import { toast } from 'react-toastify';
import { getTemplateWorkbook } from '../utils/ExcelUploadTemplate';

const BulkUploadDialog = ({ open, onClose, onUpload, uploading, uploadProgress, isProcessing }) => {
  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop: onUpload,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false,
    disabled: isProcessing || uploading
  });

  const handleTemplateDownload = () => {
    try {
      const wb = getTemplateWorkbook();
      writeFile(wb, 'mentee_upload_template.xlsx');
      toast.success('Template downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download template');
      console.error('Template download error:', error);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(249, 115, 22, 0.2)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden'
        }
      }}
    >
      <Box sx={{ position: 'relative', p: 3 }}>
        <IconButton
          onClick={onClose}
          disabled={isProcessing || uploading}
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

        <DialogContent sx={{ p: 0, mb: 2 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Typography variant="h5" sx={{ 
              color: '#f97316', 
              mb: 3, 
              fontWeight: 600,
              textAlign: 'center' 
            }}>
              Bulk Upload Mentees
            </Typography>

            <Box sx={{ mb: 4 }}>
              <Button
                startIcon={<FileDownloadIcon />}
                onClick={handleTemplateDownload}
                variant="outlined"
                fullWidth
                sx={{
                  borderColor: 'rgba(249, 115, 22, 0.5)',
                  color: '#f97316',
                  '&:hover': {
                    borderColor: '#f97316',
                    backgroundColor: 'rgba(249, 115, 22, 0.1)'
                  }
                }}
              >
                Download Template
              </Button>
            </Box>

            <Box
              {...getRootProps()}
              sx={{
                p: 4,
                border: '2px dashed',
                borderColor: isDragActive ? '#f97316' : 'rgba(249, 115, 22, 0.3)',
                borderRadius: '12px',
                bgcolor: isDragActive ? 'rgba(249, 115, 22, 0.1)' : 'transparent',
                transition: 'all 0.2s ease',
                cursor: isProcessing || uploading ? 'not-allowed' : 'pointer',
                opacity: isProcessing || uploading ? 0.7 : 1,
                textAlign: 'center'
              }}
            >
              <input {...getInputProps()} />
              <AnimatePresence mode="wait">
                <motion.div
                  key={isDragActive ? 'drag-active' : 'drag-inactive'}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  {acceptedFiles.length > 0 ? (
                    <Box sx={{ color: '#f97316' }}>
                      <DescriptionIcon sx={{ fontSize: 48, mb: 2 }} />
                      <Typography>{acceptedFiles[0].name}</Typography>
                    </Box>
                  ) : (
                    <>
                      <CloudUploadIcon sx={{ 
                        fontSize: 48, 
                        color: '#f97316', 
                        mb: 2 
                      }} />
                      <Typography sx={{ color: 'white', mb: 1 }}>
                        {isDragActive
                          ? 'Drop the Excel file here'
                          : 'Drag & drop an Excel file here, or click to select'}
                      </Typography>
                      <Typography sx={{ 
                        color: 'rgba(255, 255, 255, 0.5)',
                        fontSize: '0.875rem'
                      }}>
                        Supports .xls and .xlsx files only
                      </Typography>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </Box>

            {(uploading || isProcessing) && (
              <Box sx={{ mt: 3 }}>
                <Typography sx={{ 
                  color: 'white', 
                  mb: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1
                }}>
                  {isProcessing ? 'Processing...' : `Uploading... ${uploadProgress}%`}
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    ⚡
                  </motion.div>
                </Typography>
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
                      animation: 'uploadProgress 1s linear infinite'
                    }
                  }}
                />
              </Box>
            )}
          </motion.div>
        </DialogContent>
      </Box>

      <style jsx global>{`
        @keyframes uploadProgress {
          0% { background-position: 1rem 0; }
          100% { background-position: 0 0; }
        }
      `}</style>
    </Dialog>
  );
};

export default BulkUploadDialog;

