import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    primary: {
      main: '#10b981',
      dark: '#065f46',
      light: '#d1fae5',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#0f172a',
    },
    error: {
      main: '#ef4444',
    },
    warning: {
      main: '#f59e0b',
    },
    success: {
      main: '#10b981',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#64748b',
    },
    divider: '#e2e8f0',
  },
  typography: {
    fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 700, letterSpacing: '-0.01em' },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    body2: { fontSize: '0.875rem' },
    caption: { fontSize: '0.75rem' },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          letterSpacing: '0',
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
    },
    MuiSelect: {
      defaultProps: { size: 'small' },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#e2e8f0',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#94a3b8',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          fontSize: '0.6875rem',
          color: '#64748b',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          backgroundColor: '#f8fafc',
          padding: '10px 12px',
          borderBottom: '1px solid #e2e8f0',
        },
        body: {
          padding: '6px 12px',
          verticalAlign: 'middle',
          borderBottom: '1px solid #f1f5f9',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: '10px' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 500 },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: '0.75rem',
          borderRadius: '6px',
          backgroundColor: '#1e293b',
        },
      },
    },
  },
})
