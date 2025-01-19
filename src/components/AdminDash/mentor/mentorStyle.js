export const toastStyles = {
  containerStyle: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: 100000, // Ensure it's above everything
  },
  success: {
    style: {
      background: 'rgba(34, 197, 94, 0.9)',
      color: '#fff',
      backdropFilter: 'blur(8px)',
      borderRadius: '8px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      maxWidth: '400px',
      zIndex: 100000,
    },
    iconTheme: {
      primary: '#fff',
      secondary: 'rgba(34, 197, 94, 0.9)',
    }
  },
  error: {
    style: {
      background: 'rgba(239, 68, 68, 0.9)',
      color: '#fff',
      backdropFilter: 'blur(8px)',
      borderRadius: '8px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      maxWidth: '400px',
      zIndex: 100000,
    },
    iconTheme: {
      primary: '#fff',
      secondary: 'rgba(239, 68, 68, 0.9)',
    }
  }
};