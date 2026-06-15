import { createTheme } from '@mui/material';

const brand = {
  deep: '#0f4f58',
  main: '#176f7c',
  dark: '#125b66',
  light: '#e4f4f1',
  accent: '#91d4c7',
  text: '#12313a',
  muted: '#60767c',
  surface: '#f6f8f8',
  divider: '#dce7e7',
};

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: brand.main,
      dark: brand.dark,
      light: brand.light,
      contrastText: '#fff',
    },
    secondary: { main: brand.deep },
    background: { default: brand.surface, paper: '#FFFFFF' },
    divider: brand.divider,
    text: { primary: brand.text, secondary: brand.muted },
    error: { main: '#DC2626' },
    warning: { main: '#EA580C' },
    success: { main: '#16A34A' },
    info: { main: '#0EA5E9' },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: '"Inter", system-ui, -apple-system, "Segoe UI", sans-serif',
    fontSize: 14,
    h4: { fontWeight: 600, letterSpacing: 0 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 500 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: brand.surface },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundImage: 'none', border: `1px solid ${brand.divider}` },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: 'inherit' },
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${brand.divider}`,
          backgroundColor: '#fff',
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 6, fontWeight: 700 },
        containedPrimary: {
          '&:hover': { backgroundColor: brand.dark },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          '& fieldset': { borderColor: brand.divider },
          '&:hover fieldset': { borderColor: '#c7d8d8' },
          '&.Mui-focused fieldset': { borderColor: brand.main },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          color: brand.muted,
          backgroundColor: brand.surface,
          borderBottom: `1px solid ${brand.divider}`,
        },
        body: { borderBottom: '1px solid #edf3f3' },
      },
    },
    MuiChip: {
      styleOverrides: { root: { borderRadius: 999, fontWeight: 500 } },
    },
    MuiDrawer: { styleOverrides: { paper: { backgroundImage: 'none' } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 12 } } },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: brand.text,
          fontSize: 11,
          fontWeight: 500,
          padding: '4px 8px',
        },
        arrow: { color: brand.text },
      },
    },
    MuiTabs: { styleOverrides: { indicator: { height: 2 } } },
    MuiTab: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 500, minHeight: 44 },
      },
    },
  },
});

// Tokens auxiliares — para alertas e setores
export const ALERT_COLORS = {
  pcd: '#7C3AED',
  gestante: '#DB2777',
  cronica: '#DC2626',
  idoso: '#EA580C',
} as const;

export type AlertKey = keyof typeof ALERT_COLORS;
