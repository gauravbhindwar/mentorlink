import React from 'react';
import { Menu, MenuItem } from '@mui/material';

const ExportMenu = ({ anchorEl, open, onClose, onExport }) => {
  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          bgcolor: 'rgba(17, 17, 17, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '0.75rem',
          mt: 1,
          '& .MuiMenuItem-root': {
            color: 'white',
            fontSize: '0.875rem',
            transition: 'all 0.2s',
            '&:hover': {
              bgcolor: 'rgba(249, 115, 22, 0.1)',
            },
          },
        },
      }}>
      <MenuItem onClick={() => onExport('xlsx')}>
        Export as Excel (.xlsx)
      </MenuItem>
      <MenuItem onClick={() => onExport('csv')}>
        Export as CSV (.csv)
      </MenuItem>
    </Menu>
  );
};

export default ExportMenu;
