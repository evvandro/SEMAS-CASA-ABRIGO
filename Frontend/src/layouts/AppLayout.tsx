import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Toolbar, Typography, Avatar, Divider, IconButton, Breadcrumbs, Link,
} from '@mui/material'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import HomeIcon from '@mui/icons-material/Home'
import GroupIcon from '@mui/icons-material/Group'
import GridViewIcon from '@mui/icons-material/GridView'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import LogoutIcon from '@mui/icons-material/Logout'
import ExitToAppIcon from '@mui/icons-material/ExitToApp'
import { useAuth } from '../auth/useAuth'

const SIDEBAR_W = 220
const HEADER_H = { xs: 72, sm: 80 }

const NAV = [
  { id: 'dashboard', label: 'Início',    icon: HomeIcon,        path: '/dashboard' },
  { id: 'acolhidos', label: 'Acolhidos', icon: GroupIcon,       path: '/acolhidos', count: 92 },
  { id: 'setores',   label: 'Setores',   icon: GridViewIcon,    path: '/setores' },
  { id: 'estoque',   label: 'Estoque',   icon: Inventory2Icon,  path: '/estoque' },
  { id: 'saidas',    label: 'Saídas',    icon: ExitToAppIcon,   path: '/saidas' },
]

export function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const initials = (user?.name || 'U').split(' ').filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase()

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <Drawer
        variant="permanent"
        sx={{
          width: SIDEBAR_W,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: SIDEBAR_W, boxSizing: 'border-box',
            borderRight: '1px solid', borderColor: 'divider',
            backgroundColor: 'background.paper',
          },
        }}
      >
        <Box sx={{
          height: HEADER_H,
          minHeight: HEADER_H,
          maxHeight: HEADER_H,
          px: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
        }}>
          <Avatar variant="rounded" sx={{ bgcolor: 'primary.main', width: 32, height: 32, fontSize: 13, fontWeight: 700 }}>
            SE
          </Avatar>
          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>SEMAS</Typography>
            <Typography variant="caption">Casa Abrigo Temporário</Typography>
          </Box>
        </Box>

        <Typography variant="caption" sx={{ px: 2, pt: 1.5, pb: 0.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'text.disabled' }}>
          Operação 
        </Typography>
        <List sx={{ px: 1, flex: 1 }}>
          {NAV.map(item => {
            const Icon = item.icon
            const active = location.pathname.startsWith(item.path)
            return (
              <ListItem key={item.id} disablePadding sx={{ mb: 0.25 }}>
                <ListItemButton
                  selected={active}
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: 1.5, py: 1,
                    '&.Mui-selected': { bgcolor: 'primary.light', color: 'primary.main', '&:hover': { bgcolor: 'primary.light' } },
                    '&.Mui-selected .MuiListItemIcon-root': { color: 'primary.main' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32, color: 'text.secondary' }}>
                    <Icon sx={{ fontSize: 18 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    slotProps={{ primary: { sx: { fontSize: 13.5, fontWeight: 500 } } }}
                  />
                  {item.count != null && (
                    <Typography variant="caption" sx={{ color: active ? 'primary.main' : 'text.disabled' }}>
                      {item.count}
                    </Typography>
                  )}
                </ListItemButton>
              </ListItem>
            )
          })}
        </List>

        <Divider />
        <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 30, height: 30, fontSize: 12, fontWeight: 600 }}>
            {initials}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name}
            </Typography>
            <Typography variant="caption">{user?.role}</Typography>
          </Box>
          <IconButton size="small" onClick={handleLogout} aria-label="Sair">
            <LogoutIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      </Drawer>

      {/* Main */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Toolbar sx={{
          height: HEADER_H,
          minHeight: HEADER_H,
          maxHeight: HEADER_H,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          px: 3,
          flexShrink: 0,
        }}>
          <Breadcrumbs separator="/" sx={{ fontSize: 13 }}>
            <Link underline="hover" color="text.secondary" onClick={() => navigate('/dashboard')} sx={{ cursor: 'pointer' }}>
              Operação
            </Link>
            <Typography sx={{ fontSize: 13, color: 'text.primary', fontWeight: 500 }}>
              {NAV.find(n => location.pathname.startsWith(n.path))?.label ?? 'Página'}
            </Typography>
          </Breadcrumbs>
          <Box sx={{ flex: 1 }} />
          <Typography variant="caption">
            {new Date().toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </Typography>
        </Toolbar>

        <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 2, md: 3.5 } }}>
          <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
