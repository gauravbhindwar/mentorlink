import { createTheme } from '@mui/material/styles';

export const dialogStyles = {
  paper: {
    background: 'rgba(17, 17, 17, 0.95)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '1rem',
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
    color: 'white',
  },
  title: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    px: 3,
    py: 2,
  },
  content: {
    px: 3,
    py: 2,
  },
  textField: {
    '& .MuiOutlinedInput-root': {
      color: 'white',
      backgroundColor: '#1a1a1a',
      borderRadius: '12px',
      '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: '#f97316',
      },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: '#f97316',
        borderWidth: '2px',
      },
      '&.Mui-disabled': {
        backgroundColor: 'rgba(255, 59, 48, 0.1)',
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: 'rgba(255, 59, 48, 0.3)',
        },
        '& input': {
          color: 'rgba(255, 59, 48, 0.7) !important',
          WebkitTextFillColor: 'rgba(255, 59, 48, 0.7) !important',
        },
      },
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    '& .MuiInputLabel-root': {
      color: 'rgba(255, 255, 255, 0.7)',
      '&.Mui-focused': {
        color: '#f97316',
      },
      '&.Mui-disabled': {
        color: 'rgba(255, 59, 48, 0.7)',
      },
    },
    '& .MuiInputBase-input': {
      '&::placeholder': {
        color: 'rgba(255, 255, 255, 0.5)',
        opacity: 1,
      },
    },
    '& .MuiInputAdornment-root .MuiSvgIcon-root': {
      color: '#f97316',
    },
    '& .MuiIconButton-root': {
      color: '#f97316',
    },
  },
  actions: {
    p: 3,
    gap: 1,
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  },
};

export const comboBoxStyles = {
  position: 'relative',
  width: '100%',
  '& .MuiTextField-root': {
    width: '100%',
  },
  '& .options-dropdown': {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: '#1a1a1a',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    marginTop: '4px',
    padding: '8px 0',
    maxHeight: '200px',
    overflowY: 'auto',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
    '& .option-item': {
      padding: '8px 16px',
      color: 'white',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
      },
    },
  },
};

export const theme = createTheme({
  palette: {
    primary: {
      main: '#f97316',
    },
    secondary: {
      main: '#ea580c',
    },
    background: {
      default: '#0a0a0a',
      paper: 'rgba(255, 255, 255, 0.05)',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
  },
});

export const menuProps = {
  PaperProps: {
    sx: {
      bgcolor: '#1a1a1a',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      '& .MuiMenuItem-root': {
        color: 'white',
        '&:hover': {
          bgcolor: '#2a2a2a',
        },
        '&.Mui-selected': {
          bgcolor: '#333333',
          '&:hover': {
            bgcolor: '#404040',
          }
        }
      }
    }
  }
};
