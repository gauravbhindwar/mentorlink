export const archiveTheme = {
  colors: {
    primary: '#f97316',
    secondary: '#ea580c',
    accent: '#c2410c',
    background: '#0a0a0a',
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)'
    }
  }
};

export const glassmorphismStyles = {
  background: '#1a1a1a',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '24px'
};

export const dropdownStyles = {
  background: '#1a1a1a',
  color: '#ffffff',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  '& .MuiPaper-root': {
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
  },
  '& .MuiMenuItem-root': {
    color: '#ffffff',
    '&:hover': {
      backgroundColor: '#2d2d2d',
    },
    '&.Mui-selected': {
      backgroundColor: '#333333',
    }
  }
};

export const inputStyles = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: '#1f1f1f',
    color: '#ffffff',
    '& fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    '&:hover fieldset': {
      borderColor: '#f97316',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#f97316',
    }
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.7)',
    '&.Mui-focused': {
      color: '#f97316',
    }
  },
  '& .MuiSelect-icon': {
    color: '#f97316',
  }
};

export const cardStyles = {
  ...glassmorphismStyles,
  padding: '1.5rem',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
};

export const gradientText = {
  background: `linear-gradient(to right, ${archiveTheme.colors.primary}, ${archiveTheme.colors.accent})`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent'
};

export const containerStyles = {
  maxWidth: '1400px',
  margin: '0 auto',
  padding: '0 1.5rem',
  height: 'calc(100vh - 100px)',
  display: 'flex',
  flexDirection: 'column'
};

export const tableStyles = {
  '& .MuiDataGrid-root': {
    border: 'none',
    color: archiveTheme.colors.text.primary,
  },
  '& .MuiDataGrid-cell': {
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60px !important',
    padding: '16px',
    fontSize: '0.95rem',
  },
  '& .MuiDataGrid-row': {
    transition: 'background-color 0.2s ease, transform 0.2s ease',
    '&:hover': {
      backgroundColor: `${archiveTheme.colors.primary}15`,
      transform: 'translateY(-1px)',
    }
  },
  '& .MuiDataGrid-columnHeaders': {
    backgroundColor: `${archiveTheme.colors.primary}15`,
    borderBottom: `1px solid ${archiveTheme.colors.primary}30`,
  },
  '& .MuiDataGrid-virtualScroller': {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    '&::-webkit-scrollbar': {
      width: '8px',
      height: '8px',
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: `${archiveTheme.colors.primary}50`,
      borderRadius: '4px',
      '&:hover': {
        backgroundColor: `${archiveTheme.colors.primary}70`,
      },
    },
  }
};
