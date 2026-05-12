import { AppBar, Button, Toolbar, Typography } from '@mui/material'
import { Link as RouterLink, useLocation } from 'react-router-dom'

const NAV_LINKS = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Acolhidos', path: '/acolhidos' },
  { label: 'Setores', path: '/setores' },
  { label: 'Gestão', path: '/gestao' },
  { label: 'Cadastros', path: '/cadastros' },
]

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
          Navegação rápida
        </Typography>
        {NAV_LINKS.map(link => (
          <Button
            key={link.path}
            component={RouterLink}
            to={link.path}
            variant={location.pathname === link.path ? 'contained' : 'text'}
            size="small"
          >
            {link.label}
          </Button>
        ))}
      </Toolbar>
    </AppBar>
  )
}
