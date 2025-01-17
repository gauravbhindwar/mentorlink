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
    background: 'rgba(249, 115, 22, 0.05)',
    borderBottom: '1px solid rgba(249, 115, 22, 0.15)',
    padding: '20px 24px',
  },
  content: {
    padding: '24px',
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
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        transform: 'translateY(-2px)',
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
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
  },
  section: {
    marginBottom: '24px',
  },
};

export const toastStyles = {
  success: {
    style: {
      background: "#10B981",
      color: "#fff",
      padding: "16px",
      borderRadius: "8px",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    },
    iconTheme: {
      primary: "#fff",
      secondary: "#10B981",
    },
  },
  error: {
    style: {
      background: "#EF4444",
      color: "#fff",
      padding: "16px",
      borderRadius: "8px",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    },
    iconTheme: {
      primary: "#fff",
      secondary: "#EF4444",
    },
  },
};
