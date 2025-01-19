export const dialogStyles = {
  paper: {
    background: 'rgba(17, 24, 39, 0.95)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(249, 115, 22, 0.15)',
    borderRadius: '24px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    color: 'white',
    maxWidth: '80vw',
    width: '700px',
    maxHeight: '90vh',
    overflow: 'hidden',
  },
  title: {
    background: 'linear-gradient(180deg, rgba(249, 115, 22, 0.1) 0%, rgba(17, 24, 39, 0.95) 100%)',
    borderBottom: '1px solid rgba(249, 115, 22, 0.15)',
    padding: '20px 24px',
  },
  content: {
    padding: '24px',
    background: 'rgba(17, 24, 39, 0.95)',
  },
  form: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px',
    '& .full-width': {
      gridColumn: '1 / -1',
    },
  },
  textField: {
    '& .MuiOutlinedInput-root': {
      color: 'white',
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      backdropFilter: 'blur(10px)',
      borderRadius: '12px',
      transition: 'all 0.3s ease',
      '&:hover': {
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        transform: 'translateY(-2px)',
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: '#f97316',
        }
      },
      '&.Mui-focused': {
        backgroundColor: 'rgba(249, 115, 22, 0.05)',
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: '#f97316',
          borderWidth: '2px',
        },
      },
    },
    '& .MuiInputLabel-root': {
      color: 'rgba(255, 255, 255, 0.7)',
      '&.Mui-focused': {
        color: '#f97316',
      },
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    '& .MuiFormHelperText-root': {
      color: 'rgba(255, 255, 255, 0.5)'
    }
  },
  section: {
    marginBottom: '24px',
  },
  actions: {
    borderTop: '1px solid rgba(249, 115, 22, 0.2)',
    background: 'linear-gradient(0deg, rgba(249, 115, 22, 0.1) 0%, rgba(17, 24, 39, 0.95) 100%)',
    padding: '16px 24px',
  },
  buttons: {
    outlined: {
      borderColor: 'rgba(255, 255, 255, 0.2)',
      color: 'white',
      '&:hover': {
        borderColor: 'rgba(255, 255, 255, 0.5)',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
      }
    },
    standard: {
      background: 'linear-gradient(45deg, #f97316 30%, #fb923c 90%)',
      color: 'white',
      '&:hover': {
        background: 'linear-gradient(45deg, #ea580c 30%, #f97316 90%)',
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 12px rgba(249, 115, 22, 0.25)',
      }
    }
  }
};

export const toastStyles = {
  success: {
    style: {
      background: 'rgba(17, 24, 39, 0.95)',
      color: '#fff',
      padding: '16px',
      borderRadius: '8px',
      border: '1px solid rgba(249, 115, 22, 0.2)',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    },
    iconTheme: {
      primary: '#f97316',
      secondary: '#fff',
    },
  },
  error: {
    style: {
      background: 'rgba(17, 24, 39, 0.95)',
      color: '#fff',
      padding: '16px',
      borderRadius: '8px',
      border: '1px solid rgba(239, 68, 68, 0.2)',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    },
    iconTheme: {
      primary: '#ef4444',
      secondary: '#fff',
    },
  },
};
