// Frontend/src/theme.ts
// Substitui o theme.ts atual. Slate + Indigo, 0 sombras, bordas 1px.

import { createTheme } from '@mui/material'

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary:    { main: '#4F46E5', dark: '#4338CA', light: '#EEF2FF', contrastText: '#fff' },
    secondary:  { main: '#0F172A' },
    background: { default: '#F8FAFC', paper: '#FFFFFF' },
    divider:    '#E5E7EB',
    text:       { primary: '#0F172A', secondary: '#64748B' },
    error:      { main: '#DC2626' },
    warning:    { main: '#EA580C' },
    success:    { main: '#16A34A' },
    info:       { main: '#0EA5E9' },
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
        body: { backgroundColor: '#F8FAFC' },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { backgroundImage: 'none', border: '1px solid #E5E7EB' } },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: 'inherit' },
      styleOverrides: { root: { borderBottom: '1px solid #E5E7EB', backgroundColor: '#fff' } },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 6, fontWeight: 500 } },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          '& fieldset': { borderColor: '#E5E7EB' },
          '&:hover fieldset': { borderColor: '#D1D5DB' },
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
          color: '#64748B',
          backgroundColor: '#F9FAFB',
          borderBottom: '1px solid #E5E7EB',
        },
        body: { borderBottom: '1px solid #F1F5F9' },
      },
    },
    MuiChip: { styleOverrides: { root: { borderRadius: 999, fontWeight: 500 } } },
    MuiDrawer: { styleOverrides: { paper: { backgroundImage: 'none' } } },
    MuiDialog:  { styleOverrides: { paper: { borderRadius: 12 } } },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: '#0F172A', fontSize: 11, fontWeight: 500, padding: '4px 8px' },
        arrow: { color: '#0F172A' },
      },
    },
    MuiTabs: { styleOverrides: { indicator: { height: 2 } } },
    MuiTab: { styleOverrides: { root: { textTransform: 'none', fontWeight: 500, minHeight: 44 } } },
  },
})

// Tokens auxiliares — para alertas e setores
export const ALERT_COLORS = {
  pcd:      '#7C3AED',
  gestante: '#DB2777',
  cronica:  '#DC2626',
  idoso:    '#EA580C',
} as const

export type AlertKey = keyof typeof ALERT_COLORS
