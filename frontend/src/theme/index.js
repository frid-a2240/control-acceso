import { createTheme } from '@mui/material/styles'

// Paleta institucional ISP — azules profundos con acentos frescos
const theme = createTheme({
 palette: {
  mode: 'light',
  primary: {
    main: '#00B8B0',    // isp-turquesa
    light: '#26D0C8',
    dark: '#009690',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#203454',    // isp-azul
    light: '#2E4770',
    dark: '#152238',
  },
    success: {
      main: '#059669',
      light: '#10B981',
      dark: '#047857',
    },
    warning: {
      main: '#D97706',
      light: '#F59E0B',
    },
    error: {
      main: '#DC2626',
      light: '#EF4444',
      dark: '#B91C1C',
    },
    background: {
      default: '#F1F5F9',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0F172A',
      secondary: '#475569',
    },
    divider: 'rgba(15, 23, 42, 0.08)',
  },
  typography: {
     fontFamily: '"Montserrat", system-ui, sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontWeight: 700, letterSpacing: '-0.01em' },
    h4: { fontWeight: 700, letterSpacing: '-0.01em' },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { fontWeight: 600, textTransform: 'none' },
    // Fuente monospace para folios e identificadores
    monospace: {
      fontFamily: '"JetBrains Mono", "Consolas", monospace',
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '8px 20px',
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          border: '1px solid rgba(15, 23, 42, 0.06)',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.03)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: { borderRadius: 14 },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: '#FFFFFF',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
          color: '#475569',
          backgroundColor: '#F8FAFC',
        },
      },
    },
  },
})

export default theme