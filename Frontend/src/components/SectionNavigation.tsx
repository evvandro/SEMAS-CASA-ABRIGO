import { AppBar, Button, Toolbar, Typography } from '@mui/material'
import { Link as RouterLink, useLocation } from 'react-router-dom'

interface SectionNavigationProps {
  sticky?: boolean
}

export function SectionNavigation({ sticky = false }: SectionNavigationProps) {
  const location = useLocation()

  return (
    <AppBar
      position={sticky ? 'sticky' : 'static'}
      color="transparent"
      elevation={0}
      sx={{
        top: sticky ? 16 : 'auto',
        zIndex: (theme) => theme.zIndex.appBar - 1,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: (theme) => (sticky ? theme.palette.background.paper : 'transparent'),
        backdropFilter: sticky ? 'blur(10px)' : 'none',
      }}
    >
      <Toolbar sx={{ gap: 1, flexWrap: 'wrap', px: { xs: 2, sm: 3 } }}>
        <Typography variant="subtitle1" sx={{ flexGrow: 1, fontWeight: 600 }}>
          Navegacao rapida
        </Typography>
        <Button component={RouterLink} to="/dashboard" variant={location.pathname === '/dashboard' ? 'contained' : 'text'}>
          Dashboard
        </Button>
        <Button component={RouterLink} to="/gestao" variant={location.pathname === '/gestao' ? 'contained' : 'text'}>
          Gestao
        </Button>
        <Button component={RouterLink} to="/cadastros" variant={location.pathname === '/cadastros' ? 'contained' : 'text'}>
          Cadastros
        </Button>
      </Toolbar>
    </AppBar>
  )
}
