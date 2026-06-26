import {
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import GroupIcon from '@mui/icons-material/Group';
import GridViewIcon from '@mui/icons-material/GridView';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import PersonIcon from '@mui/icons-material/Person';
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import { useEffect, useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { api } from '../services/api';
import { ACOLHIDOS_COUNT_REFRESH_EVENT } from '../utils/acolhidosEvents';
import { ProfileMenu } from '../components/ProfileMenu';

const SIDEBAR_W = 220;
const COLLAPSED_W = 68;
const HEADER_H = { xs: 60, sm: 68 };
const SIDEBAR_STORAGE_KEY = 'casa-abrigo:sidebar-collapsed';

const NAV = [
  {
    id: 'dashboard',
    label: 'Início',
    icon: HomeIcon,
    path: '/dashboard',
    submodules: [{ label: 'Painel', path: '/dashboard' }],
  },
  {
    id: 'acolhidos',
    label: 'Acolhidos',
    icon: GroupIcon,
    path: '/acolhidos',
    submodules: [
      { label: 'Acolhidos', path: '/acolhidos' },
      { label: 'Gestão', path: '/acolhidos/gestao' },
    ],
  },
  {
    id: 'setores',
    label: 'Setores',
    icon: GridViewIcon,
    path: '/setores',
    submodules: [{ label: 'Setores', path: '/setores' }],
  },
  {
    id: 'estoque',
    label: 'Estoque',
    icon: Inventory2Icon,
    path: '/estoque',
    submodules: [{ label: 'Materiais', path: '/estoque' }],
  },
  {
    id: 'saidas',
    label: 'Saídas',
    icon: ExitToAppIcon,
    path: '/saidas',
    submodules: [{ label: 'Saídas', path: '/saidas' }],
  },
];

const ADMIN_NAV = {
  id: 'admin',
  label: 'Usuários',
  icon: PersonIcon,
  path: '/admin',
  submodules: [{ label: 'Usuários', path: '/admin' }],
};

const isActivePath = (pathname: string, path: string) =>
  pathname === path || pathname.startsWith(`${path}/`);

export function AppLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  // Abaixo de ~1100px a sidebar fica sempre recolhida (só ícones) para preservar
  // largura útil de conteúdo em notebooks 1024–1100.
  const forceCollapse = useMediaQuery('(max-width:1100px)');
  const compactDate = useMediaQuery('(max-width:1000px)');
  const hideDate = useMediaQuery('(max-width:820px)');
  const [acolhidosAtivos, setAcolhidosAtivos] = useState<number | null>(null);
  const [collapsedPref, setCollapsedPref] = useState<boolean>(
    () => window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1',
  );

  const collapsed = forceCollapse || collapsedPref;
  const sidebarWidth = collapsed ? COLLAPSED_W : SIDEBAR_W;
  const widthTransition = theme.transitions.create('width', {
    duration: theme.transitions.duration.shorter,
  });

  const toggleSidebar = () => {
    setCollapsedPref((prev) => {
      const next = !prev;
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? '1' : '0');
      return next;
    });
  };

  useEffect(() => {
    const loadAcolhidosCount = async () => {
      try {
        const res = await api.get<{ data: { acolhidos_ativos: number } }>(
          '/dashboard',
        );
        setAcolhidosAtivos(res.data.data.acolhidos_ativos);
      } catch {
        // silent
      }
    };

    void loadAcolhidosCount();

    const handleRefresh = () => {
      void loadAcolhidosCount();
    };
    window.addEventListener(ACOLHIDOS_COUNT_REFRESH_EVENT, handleRefresh);
    return () =>
      window.removeEventListener(ACOLHIDOS_COUNT_REFRESH_EVENT, handleRefresh);
  }, []);

  const navigationItems = user?.role === 'admin' ? [...NAV, ADMIN_NAV] : NAV;
  const activeModule = navigationItems.find((item) =>
    isActivePath(location.pathname, item.path),
  );
  const activeSubmodule = activeModule?.submodules.find(
    (item) =>
      location.pathname === item.path ||
      (item.path !== activeModule.path &&
        isActivePath(location.pathname, item.path)),
  );

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
          width: sidebarWidth,
          flexShrink: 0,
          transition: widthTransition,
          '& .MuiDrawer-paper': {
            width: sidebarWidth,
            boxSizing: 'border-box',
            borderRight: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
            overflowX: 'hidden',
            transition: widthTransition,
          },
        }}
      >
        <Box
          sx={{
            height: HEADER_H,
            minHeight: HEADER_H,
            maxHeight: HEADER_H,
            px: collapsed ? 0 : 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
            flexShrink: 0,
          }}
        >
          <Avatar
            variant="rounded"
            sx={{
              bgcolor: 'primary.main',
              width: 32,
              height: 32,
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            SE
          </Avatar>
          {!collapsed && (
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 600 }} noWrap>
                SEMAS
              </Typography>
              <Typography variant="caption" noWrap>
                Casa Abrigo Temporário
              </Typography>
            </Box>
          )}
        </Box>

        {!collapsed && (
          <Typography
            variant="caption"
            sx={{
              px: 2,
              pt: 1.5,
              pb: 0.5,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'text.disabled',
            }}
          >
            Operação
          </Typography>
        )}
        <List sx={{ px: collapsed ? 0.75 : 1, flex: 1, pt: collapsed ? 1 : 0 }}>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(location.pathname, item.path);
            const button = (
              <ListItemButton
                selected={active}
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 1.5,
                  py: 1,
                  px: collapsed ? 1 : 2,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  '&.Mui-selected': {
                    bgcolor: 'primary.light',
                    color: 'primary.main',
                    '&:hover': { bgcolor: 'primary.light' },
                  },
                  '&.Mui-selected .MuiListItemIcon-root': {
                    color: 'primary.main',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: collapsed ? 0 : 32,
                    justifyContent: 'center',
                    color: 'text.secondary',
                  }}
                >
                  <Icon sx={{ fontSize: 18 }} />
                </ListItemIcon>
                {!collapsed && (
                  <ListItemText
                    primary={item.label}
                    slotProps={{
                      primary: { sx: { fontSize: 13.5, fontWeight: 500 } },
                    }}
                  />
                )}
                {!collapsed &&
                  item.id === 'acolhidos' &&
                  acolhidosAtivos != null && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: active ? 'primary.main' : 'text.disabled',
                      }}
                    >
                      {acolhidosAtivos}
                    </Typography>
                  )}
              </ListItemButton>
            );

            return (
              <ListItem key={item.id} disablePadding sx={{ mb: 0.25 }}>
                {collapsed ? (
                  <Tooltip title={item.label} placement="right" arrow>
                    {button}
                  </Tooltip>
                ) : (
                  button
                )}
              </ListItem>
            );
          })}
        </List>

        <Divider />
        <Box
          sx={{
            p: collapsed ? 1 : 1.5,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <ProfileMenu variant={collapsed ? 'icon' : 'card'} />
        </Box>
      </Drawer>

      {/* Main */}
      <Box
        sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}
      >
        <Toolbar
          sx={{
            height: HEADER_H,
            minHeight: HEADER_H,
            maxHeight: HEADER_H,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            px: { xs: 1.5, md: 3 },
            gap: 1,
            flexShrink: 0,
          }}
        >
          {!forceCollapse && (
            <Tooltip title={collapsed ? 'Expandir menu' : 'Recolher menu'}>
              <IconButton
                onClick={toggleSidebar}
                size="small"
                aria-label="Alternar menu lateral"
                sx={{ flexShrink: 0, color: 'text.secondary' }}
              >
                {collapsed ? <MenuIcon /> : <MenuOpenIcon />}
              </IconButton>
            </Tooltip>
          )}
          <Box
            component="nav"
            aria-label="Submódulos"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              overflowX: 'auto',
              minWidth: 0,
              flex: 1,
              pb: 0.25,
            }}
          >
            {(activeModule?.submodules ?? []).map((item) => {
              const active = activeSubmodule?.path === item.path;

              return (
                <Button
                  key={item.path}
                  variant={active ? 'contained' : 'text'}
                  color={active ? 'primary' : 'inherit'}
                  onClick={() => navigate(item.path)}
                  size="small"
                  sx={{
                    flexShrink: 0,
                    px: 1.5,
                    color: active ? 'primary.contrastText' : 'text.secondary',
                    '&:hover': {
                      color: active ? 'primary.contrastText' : 'text.primary',
                    },
                  }}
                >
                  {item.label}
                </Button>
              );
            })}
          </Box>
          {!hideDate && (
            <Typography
              variant="caption"
              sx={{ flexShrink: 0, whiteSpace: 'nowrap', color: 'text.secondary' }}
            >
              {new Date().toLocaleString(
                'pt-BR',
                compactDate
                  ? { day: '2-digit', month: 'short' }
                  : {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    },
              )}
            </Typography>
          )}
        </Toolbar>

        <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 1.5, sm: 2, lg: 3.5 } }}>
          <Box sx={{ maxWidth: 1280, mx: 'auto', minWidth: 0 }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
