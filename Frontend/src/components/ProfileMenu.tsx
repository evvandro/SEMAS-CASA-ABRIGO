import {
  Avatar,
  Box,
  Button,
  ButtonBase,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Popover,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import EditIcon from '@mui/icons-material/Edit';
import LockIcon from '@mui/icons-material/Lock';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { listUsers, updateMyProfile } from '../services/usersService';
import { showErrorToast, showSuccessToast } from '../utils/notificationService';
import type { AuthUser } from '../types/auth';

const MENU_BACKGROUND = 'background.paper';
const INACTIVE_TEXT = 'text.secondary';

const PROFILE_OPTIONS = [
  {
    id: 'switch',
    label: 'Trocar perfil',
    description: 'Selecione outro perfil existente',
    icon: SwapHorizIcon,
  },
  {
    id: 'edit',
    label: 'Editar perfil',
    description: 'Atualize seus dados pessoais',
    icon: EditIcon,
  },
  {
    id: 'settings',
    label: 'Configurações',
    description: 'Ajuste aparência e preferências',
    icon: SettingsIcon,
  },
  {
    id: 'password',
    label: 'Alterar senha',
    description: 'Atualize sua senha de acesso',
    icon: LockIcon,
  },
] as const;

type ProfileAction = (typeof PROFILE_OPTIONS)[number]['id'];

type ProfileSettingsState = {
  themeMode: 'light' | 'dark';
  primaryColor: 'Ciano' | 'Verde' | 'Roxo';
  language: 'Português (BR)' | 'English (US)';
  notifications: boolean;
  sounds: boolean;
  publicProfile: boolean;
  dataVisibility: 'Público' | 'Privado';
};

type ChangePasswordState = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  showCurrent: boolean;
  showNew: boolean;
  showConfirm: boolean;
};

type EditProfileState = {
  name: string;
  email: string;
  username: string;
  phone: string;
  bio: string;
};

const DEFAULT_SETTINGS: ProfileSettingsState = {
  themeMode: 'dark',
  primaryColor: 'Ciano',
  language: 'Português (BR)',
  notifications: true,
  sounds: false,
  publicProfile: true,
  dataVisibility: 'Privado',
};

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getPasswordStrength(password: string) {
  if (password.length >= 12 && /[A-Z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password)) {
    return { label: 'Forte', color: '#22C55E' };
  }

  if (password.length >= 8 && /\d/.test(password) && /[A-Za-z]/.test(password)) {
    return { label: 'Média', color: '#F59E0B' };
  }

  return { label: 'Fraca', color: '#E11D48' };
}

function buildUsername(email: string) {
  if (!email.includes('@')) {
    return email;
  }

  return email.split('@')[0];
}

type ProfileMenuProps = {
  variant?: 'icon' | 'card';
};

export function ProfileMenu({ variant = 'icon' }: ProfileMenuProps) {
  const { user, logout, updateUser } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [activeDialog, setActiveDialog] = useState<'none' | ProfileAction>('none');
  const [profiles, setProfiles] = useState<AuthUser[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [profilesError, setProfilesError] = useState<string | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [settings, setSettings] = useState<ProfileSettingsState>(DEFAULT_SETTINGS);
  const [editForm, setEditForm] = useState<EditProfileState>({
    name: user?.name ?? '',
    email: user?.email ?? '',
    username: buildUsername(user?.email ?? ''),
    phone: user?.phone ?? '',
    bio: '',
  });
  const [passwordForm, setPasswordForm] = useState<ChangePasswordState>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    showCurrent: false,
    showNew: false,
    showConfirm: false,
  });
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const menuOpen = Boolean(anchorEl);

  useEffect(() => {
    if (!user) return;
    setEditForm({
      name: user.name,
      email: user.email,
      username: buildUsername(user.email),
      phone: user.phone ?? '',
      bio: '',
    });
    setSelectedProfileId(user.id);
  }, [user]);

  useEffect(() => {
    const storedSettings = window.localStorage.getItem('profile-menu-settings');
    if (storedSettings) {
      try {
        setSettings(JSON.parse(storedSettings) as ProfileSettingsState);
      } catch {
        setSettings(DEFAULT_SETTINGS);
      }
    }
  }, []);

  useEffect(() => {
    if (activeDialog !== 'switch') {
      return;
    }

    if (!user) {
      setProfiles([]);
      return;
    }

    if (user.role !== 'admin') {
      setProfiles([user]);
      setProfilesError(null);
      return;
    }

    setProfilesLoading(true);
    setProfilesError(null);

    void listUsers()
      .then((result) => {
        setProfiles(result);
        setSelectedProfileId((prev) => prev ?? user.id);
      })
      .catch(() => {
        setProfilesError('Não foi possível carregar perfis.');
      })
      .finally(() => setProfilesLoading(false));
  }, [activeDialog, user]);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleOpenSection = (section: ProfileAction) => {
    setActiveDialog(section);
    handleCloseMenu();
    setDialogError(null);
  };

  const handleLogout = async () => {
    handleCloseMenu();
    await logout();
    navigate('/login', { replace: true });
  };

  const handleConfirmProfileSwitch = async () => {
    if (!user) {
      return;
    }

    if (selectedProfileId === user.id) {
      showSuccessToast('Perfil ativo', 'Você já está usando este perfil.');
      setActiveDialog('none');
      return;
    }

    if (!selectedProfileId) {
      return;
    }

    handleCloseMenu();

    await logout();
    navigate('/login', { replace: true });
  };

  const handleSaveProfile = async () => {
    if (!user) {
      return;
    }

    const name = editForm.name.trim();
    const email = editForm.email.trim();

    if (!name) {
      setDialogError('Nome é obrigatório.');
      return;
    }

    if (email && !isValidEmail(email)) {
      setDialogError('Informe um e-mail válido.');
      return;
    }

    setSaving(true);
    setDialogError(null);

    try {
      const updatedUser = await updateMyProfile({
        name,
        email,
        phone: editForm.phone || null,
      });

      updateUser(updatedUser);
      showSuccessToast('Perfil atualizado', 'Seus dados foram atualizados com sucesso.');
      setActiveDialog('none');
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setDialogError(message ?? 'Erro ao atualizar perfil.');
      showErrorToast('Erro ao atualizar perfil', message ?? 'Não foi possível salvar seus dados.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = () => {
    window.localStorage.setItem('profile-menu-settings', JSON.stringify(settings));
    showSuccessToast('Configurações salvas', 'Suas preferências foram atualizadas.');
    setActiveDialog('none');
  };

  const handleUpdatePassword = async () => {
    if (!user) {
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setDialogError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setDialogError('A confirmação de senha deve ser igual à nova senha.');
      return;
    }

    if (!passwordForm.currentPassword) {
      setDialogError('Informe a senha atual.');
      return;
    }

    setSaving(true);
    setDialogError(null);

    try {
      const updatedUser = await updateMyProfile({
        current_password: passwordForm.currentPassword,
        password: passwordForm.newPassword,
        password_confirmation: passwordForm.confirmPassword,
      });

      updateUser(updatedUser);
      showSuccessToast('Senha atualizada', 'Sua senha foi alterada com sucesso.');
      setActiveDialog('none');
      setPasswordForm((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setDialogError(message ?? 'Erro ao atualizar senha.');
      showErrorToast('Erro ao atualizar senha', message ?? 'Não foi possível alterar a senha.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddProfile = () => {
    handleCloseMenu();
    if (user?.role === 'admin') {
      navigate('/admin');
      return;
    }

    navigate('/login');
  };

  const menuContent = (
    <Paper
      elevation={0}
      sx={{
        width: 320,
        bgcolor: MENU_BACKGROUND,
        color: 'text.primary',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ p: 2, pb: 1.5 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1.5 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 42, height: 42, fontWeight: 700 }}>
            {getInitials(user?.name ?? 'U')}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 15 }} noWrap>
              {user?.name}
            </Typography>
            <Typography variant="body2" sx={{ color: INACTIVE_TEXT, fontSize: 12 }} noWrap>
              {user?.email ?? user?.role}
            </Typography>
          </Box>
          <ChevronRightIcon sx={{ color: INACTIVE_TEXT, ml: 'auto' }} />
        </Stack>

        <Typography variant="body2" sx={{ color: INACTIVE_TEXT, mb: 1.5 }}>
          Gerencie sua conta sem sair da tela atual.
        </Typography>
      </Box>

      <Divider />

      <List disablePadding>
        {PROFILE_OPTIONS.map((option) => {
          const Icon = option.icon;

          return (
            <ListItemButton
              key={option.id}
              onClick={() => handleOpenSection(option.id)}
              sx={{
                py: 1.5,
                px: 2.25,
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: 'primary.main' }}>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={option.label}
                secondary={option.description}
                primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }}
                secondaryTypographyProps={{ fontSize: 12, color: INACTIVE_TEXT }}
              />
              <ArrowForwardIosIcon sx={{ fontSize: 14, color: INACTIVE_TEXT }} />
            </ListItemButton>
          );
        })}
      </List>

      <Divider />

      <Box sx={{ p: 2 }}>
        <Button
          variant="outlined"
          fullWidth
          color="error"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{ borderRadius: 1.5 }}
        >
          Sair da conta
        </Button>
      </Box>
    </Paper>
  );

  const profileTitle = user?.role ? `${user.name} · ${user.role}` : user?.name ?? '';
  const passwordStrength = useMemo(
    () => getPasswordStrength(passwordForm.newPassword),
    [passwordForm.newPassword],
  );

  if (!user) {
    return null;
  }

  const trigger = variant === 'card' ? (
    <Box
      component={ButtonBase}
      onClick={handleOpenMenu}
      sx={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 1.5,
        borderRadius: 2,
        bgcolor: 'background.paper',
        textAlign: 'left',
        '&:hover': { bgcolor: 'action.hover' },
      }}
      aria-label="Abrir menu de perfil"
    >
      <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 34, height: 34, fontWeight: 700 }}>
        {getInitials(user.name)}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} noWrap>
          {user.name}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
          {user.role}
        </Typography>
      </Box>
      <ChevronRightIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
    </Box>
  ) : (
    <IconButton
      onClick={handleOpenMenu}
      size="small"
      sx={{ width: 42, height: 42, ml: 1, bgcolor: 'background.paper' }}
      aria-label="Abrir menu de perfil"
    >
      <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main' }}>
        {getInitials(user.name)}
      </Avatar>
    </IconButton>
  );

  return (
    <>
      {trigger}

      {isMobile ? (
        <Dialog
          open={menuOpen}
          onClose={handleCloseMenu}
          fullScreen
          PaperProps={{
            sx: {
              bgcolor: MENU_BACKGROUND,
              color: 'common.white',
              borderRadius: 0,
            },
          }}
        >
          <DialogContent sx={{ p: 0 }}>{menuContent}</DialogContent>
        </Dialog>
      ) : (
        <Popover
          open={menuOpen}
          anchorEl={anchorEl}
          onClose={handleCloseMenu}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          PaperProps={{
            sx: {
              bgcolor: 'transparent',
              boxShadow: 'none',
            },
          }}
        >
          {menuContent}
        </Popover>
      )}

      <Dialog
        open={activeDialog === 'switch'}
        onClose={() => setActiveDialog('none')}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            bgcolor: MENU_BACKGROUND,
            color: 'text.primary',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        <DialogTitle>Trocar perfil</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ color: INACTIVE_TEXT, mb: 2 }}>
            Selecione um perfil existente ou entre com outro usuário.
          </Typography>

          {profilesError && (
            <Typography variant="body2" color="error" sx={{ mb: 2 }}>
              {profilesError}
            </Typography>
          )}

          <List disablePadding>
            {profiles.map((profile) => (
              <ListItemButton
                key={profile.id}
                selected={selectedProfileId === profile.id}
                onClick={() => setSelectedProfileId(profile.id)}
                sx={{
                  mb: 1,
                  borderRadius: 1.5,
                  bgcolor: selectedProfileId === profile.id ? 'action.selected' : 'action.hover',
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>{getInitials(profile.name)}</Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={profile.name}
                  secondary={profile.email}
                  primaryTypographyProps={{ fontWeight: 600 }}
                  secondaryTypographyProps={{ color: INACTIVE_TEXT, fontSize: 12 }}
                />
                {profile.id === user.id && (
                  <Chip label="Ativo" size="small" color="primary" variant="outlined" />
                )}
              </ListItemButton>
            ))}
          </List>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} mt={2}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<AddIcon />}
              onClick={handleAddProfile}
              sx={{ borderRadius: 2 }}
            >
              Adicionar perfil
            </Button>
            <Button
              variant="outlined"
              fullWidth
              color="primary"
              onClick={handleConfirmProfileSwitch}
              disabled={selectedProfileId === user.id || profilesLoading}
              sx={{ borderRadius: 2 }}
            >
              Entrar em outro perfil
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setActiveDialog('none')} color="inherit">
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={activeDialog === 'edit'}
        onClose={() => setActiveDialog('none')}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            bgcolor: MENU_BACKGROUND,
            color: 'text.primary',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        <DialogTitle>Editar perfil</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontSize: 16 }}>
                {getInitials(user.name)}
              </Avatar>
              <Box>
                <Typography fontWeight={700}>{profileTitle}</Typography>
                <Typography variant="body2" sx={{ color: INACTIVE_TEXT }}>
                  Atualize suas informações de contato.
                </Typography>
              </Box>
            </Stack>

            {dialogError && (
              <Typography color="error" variant="body2">
                {dialogError}
              </Typography>
            )}

            <TextField
              label="Nome completo"
              value={editForm.name}
              onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))}
              fullWidth
              InputLabelProps={{ sx: { color: INACTIVE_TEXT } }}
            />
            <TextField
              label="Nome de usuário"
              value={editForm.username}
              disabled
              fullWidth
              InputLabelProps={{ sx: { color: INACTIVE_TEXT } }}
            />
            <TextField
              label="E-mail"
              value={editForm.email}
              onChange={(event) => setEditForm((prev) => ({
                ...prev,
                email: event.target.value,
                username: buildUsername(event.target.value),
              }))}
              fullWidth
              InputLabelProps={{ sx: { color: INACTIVE_TEXT } }}
            />
            <TextField
              label="Telefone"
              value={editForm.phone}
              onChange={(event) => setEditForm((prev) => ({ ...prev, phone: event.target.value }))}
              fullWidth
              InputLabelProps={{ sx: { color: INACTIVE_TEXT } }}
            />
            <TextField
              label="Bio (opcional)"
              value={editForm.bio}
              onChange={(event) => setEditForm((prev) => ({ ...prev, bio: event.target.value }))}
              fullWidth
              multiline
              minRows={3}
              InputLabelProps={{ sx: { color: INACTIVE_TEXT } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button color="inherit" onClick={() => {
            setEditForm({
              name: user.name,
              email: user.email,
              username: buildUsername(user.email),
              phone: user.phone ?? '',
              bio: '',
            });
            setDialogError(null);
          }}>
            Restaurar
          </Button>
          <Button onClick={() => setActiveDialog('none')} color="inherit">
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSaveProfile} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={activeDialog === 'settings'}
        onClose={() => setActiveDialog('none')}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            bgcolor: MENU_BACKGROUND,
            color: 'text.primary',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        <DialogTitle>Configurações</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                Aparência
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <FormControlLabel
                  control={(
                    <Switch
                      checked={settings.themeMode === 'dark'}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          themeMode: event.target.checked ? 'dark' : 'light',
                        }))
                      }
                      color="primary"
                    />
                  )}
                  label="Tema escuro"
                />
                <Select
                  value={settings.primaryColor}
                  onChange={(event) => setSettings((prev) => ({ ...prev, primaryColor: event.target.value as ProfileSettingsState['primaryColor'] }))}
                  sx={{ minWidth: 160, bgcolor: 'action.hover', borderRadius: 1 }}
                >
                  <MenuItem value="Ciano">Ciano</MenuItem>
                  <MenuItem value="Verde">Verde</MenuItem>
                  <MenuItem value="Roxo">Roxo</MenuItem>
                </Select>
              </Stack>
            </Box>

            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                Preferências
              </Typography>
              <FormControlLabel
                control={(
                  <Switch
                    checked={settings.language === 'English (US)'}
                    onChange={(event) =>
                      setSettings((prev) => ({
                        ...prev,
                        language: event.target.checked ? 'English (US)' : 'Português (BR)',
                      }))
                    }
                    color="primary"
                  />
                )}
                label="Idioma inglês"
              />
              <FormControlLabel
                control={(
                  <Switch
                    checked={settings.notifications}
                    onChange={(event) => setSettings((prev) => ({ ...prev, notifications: event.target.checked }))}
                    color="primary"
                  />
                )}
                label="Notificações"
              />
              <FormControlLabel
                control={(
                  <Switch
                    checked={settings.sounds}
                    onChange={(event) => setSettings((prev) => ({ ...prev, sounds: event.target.checked }))}
                    color="primary"
                  />
                )}
                label="Sons"
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                Privacidade
              </Typography>
              <FormControlLabel
                control={(
                  <Switch
                    checked={settings.publicProfile}
                    onChange={(event) => setSettings((prev) => ({ ...prev, publicProfile: event.target.checked }))}
                    color="primary"
                  />
                )}
                label="Perfil público"
              />
              <Select
                value={settings.dataVisibility}
                onChange={(event) => setSettings((prev) => ({ ...prev, dataVisibility: event.target.value as ProfileSettingsState['dataVisibility'] }))}
                sx={{ minWidth: 180, bgcolor: 'action.hover', borderRadius: 1, mt: 1 }}
              >
                <MenuItem value="Público">Público</MenuItem>
                <MenuItem value="Privado">Privado</MenuItem>
              </Select>
            </Box>

            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                Conta
              </Typography>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => showSuccessToast('Sessões encerradas', 'Sessões em outros dispositivos foram encerradas.')}
                sx={{ borderColor: 'divider' }}
                color="inherit"
              >
                Encerrar sessão em outros dispositivos
              </Button>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setActiveDialog('none')} color="inherit">
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSaveSettings}>
            Salvar alterações
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={activeDialog === 'password'}
        onClose={() => setActiveDialog('none')}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            bgcolor: MENU_BACKGROUND,
            color: 'text.primary',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        <DialogTitle>Alterar senha</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            {dialogError && (
              <Typography color="error" variant="body2">
                {dialogError}
              </Typography>
            )}
            <TextField
              label="Senha atual"
              type={passwordForm.showCurrent ? 'text' : 'password'}
              value={passwordForm.currentPassword}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
              fullWidth
              InputLabelProps={{ sx: { color: INACTIVE_TEXT } }}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setPasswordForm((prev) => ({ ...prev, showCurrent: !prev.showCurrent }))}
                        edge="end"
                        size="small"
                        sx={{ color: 'text.secondary' }}
                      >
                        {passwordForm.showCurrent ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              label="Nova senha"
              type={passwordForm.showNew ? 'text' : 'password'}
              value={passwordForm.newPassword}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
              fullWidth
              InputLabelProps={{ sx: { color: INACTIVE_TEXT } }}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setPasswordForm((prev) => ({ ...prev, showNew: !prev.showNew }))}
                        edge="end"
                        size="small"
                        sx={{ color: 'text.secondary' }}
                      >
                        {passwordForm.showNew ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: INACTIVE_TEXT }}>
                Força da senha
              </Typography>
              <Typography variant="body2" sx={{ color: passwordStrength.color, fontWeight: 700 }}>
                {passwordStrength.label}
              </Typography>
            </Box>
            <TextField
              label="Confirmar nova senha"
              type={passwordForm.showConfirm ? 'text' : 'password'}
              value={passwordForm.confirmPassword}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
              fullWidth
              InputLabelProps={{ sx: { color: INACTIVE_TEXT } }}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setPasswordForm((prev) => ({ ...prev, showConfirm: !prev.showConfirm }))}
                        edge="end"
                        size="small"
                        sx={{ color: 'text.secondary' }}
                      >
                        {passwordForm.showConfirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setActiveDialog('none')} color="inherit">
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleUpdatePassword} disabled={saving}>
            Atualizar senha
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
