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
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { updateMyProfile } from '../services/usersService';
import { showSuccessToast } from '../utils/notificationService';
import { getApiErrorMessage } from '../utils/apiError';

const MENU_BACKGROUND = 'background.paper';
const INACTIVE_TEXT = 'text.secondary';

const PROFILE_OPTIONS = [
  {
    id: 'edit',
    label: 'Editar perfil',
    description: 'Atualize seus dados pessoais',
    icon: EditIcon,
  },
  {
    id: 'password',
    label: 'Alterar senha',
    description: 'Atualize sua senha de acesso',
    icon: LockIcon,
  },
] as const;

type ProfileAction = (typeof PROFILE_OPTIONS)[number]['id'];

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
  if (
    password.length >= 12 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  ) {
    return { label: 'Forte', color: '#22C55E' };
  }

  if (
    password.length >= 8 &&
    /\d/.test(password) &&
    /[A-Za-z]/.test(password)
  ) {
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
  const [activeDialog, setActiveDialog] = useState<'none' | ProfileAction>(
    'none',
  );
  const [editForm, setEditForm] = useState<EditProfileState>({
    name: user?.name ?? '',
    email: user?.email ?? '',
    username: buildUsername(user?.email ?? '')
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
      username: buildUsername(user.email)
    });
  }, [user]);

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
        email
      });

      updateUser(updatedUser);
      showSuccessToast(
        'Perfil atualizado',
        'Seus dados foram atualizados com sucesso.',
      );
      setActiveDialog('none');
    } catch (error: unknown) {
      const message = getApiErrorMessage(error, 'Erro ao atualizar perfil.');
      setDialogError(message ?? 'Erro ao atualizar perfil.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!user) {
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setDialogError('A nova senha deve ter ao menos 6 caracteres.');
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
      showSuccessToast(
        'Senha atualizada',
        'Sua senha foi alterada com sucesso.',
      );
      setActiveDialog('none');
      setPasswordForm((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (error: unknown) {
      const message = getApiErrorMessage(error, 'Erro ao atualizar senha.');
      setDialogError(message ?? 'Erro ao atualizar senha.');
    } finally {
      setSaving(false);
    }
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
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              width: 42,
              height: 42,
              fontWeight: 700,
            }}
          >
            {getInitials(user?.name ?? 'U')}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 15 }} noWrap>
              {user?.name}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: INACTIVE_TEXT, fontSize: 12 }}
              noWrap
            >
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
                secondaryTypographyProps={{
                  fontSize: 12,
                  color: INACTIVE_TEXT,
                }}
              />
              <ArrowForwardIosIcon
                sx={{ fontSize: 14, color: INACTIVE_TEXT }}
              />
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

  const profileTitle = user?.role
    ? `${user.name} · ${user.role}`
    : (user?.name ?? '');
  const passwordStrength = useMemo(
    () => getPasswordStrength(passwordForm.newPassword),
    [passwordForm.newPassword],
  );

  if (!user) {
    return null;
  }

  const trigger =
    variant === 'card' ? (
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
        <Avatar
          sx={{
            bgcolor: 'primary.light',
            color: 'primary.main',
            width: 34,
            height: 34,
            fontWeight: 700,
          }}
        >
          {getInitials(user.name)}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 700,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            noWrap
          >
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
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: 'primary.main',
                  fontSize: 16,
                }}
              >
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
              onChange={(event) =>
                setEditForm((prev) => ({ ...prev, name: event.target.value }))
              }
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
              onChange={(event) =>
                setEditForm((prev) => ({
                  ...prev,
                  email: event.target.value,
                  username: buildUsername(event.target.value),
                }))
              }
              fullWidth
              InputLabelProps={{ sx: { color: INACTIVE_TEXT } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            color="inherit"
            onClick={() => {
              setEditForm({
                name: user.name,
                email: user.email,
                username: buildUsername(user.email)
              });
              setDialogError(null);
            }}
          >
            Restaurar
          </Button>
          <Button onClick={() => setActiveDialog('none')} color="inherit">
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveProfile}
            disabled={saving}
          >
            {saving ? 'Salvando...' : 'Salvar alterações'}
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
              onChange={(event) =>
                setPasswordForm((prev) => ({
                  ...prev,
                  currentPassword: event.target.value,
                }))
              }
              fullWidth
              InputLabelProps={{ sx: { color: INACTIVE_TEXT } }}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() =>
                          setPasswordForm((prev) => ({
                            ...prev,
                            showCurrent: !prev.showCurrent,
                          }))
                        }
                        edge="end"
                        size="small"
                        sx={{ color: 'text.secondary' }}
                      >
                        {passwordForm.showCurrent ? (
                          <VisibilityOffIcon />
                        ) : (
                          <VisibilityIcon />
                        )}
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
              onChange={(event) =>
                setPasswordForm((prev) => ({
                  ...prev,
                  newPassword: event.target.value,
                }))
              }
              fullWidth
              InputLabelProps={{ sx: { color: INACTIVE_TEXT } }}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() =>
                          setPasswordForm((prev) => ({
                            ...prev,
                            showNew: !prev.showNew,
                          }))
                        }
                        edge="end"
                        size="small"
                        sx={{ color: 'text.secondary' }}
                      >
                        {passwordForm.showNew ? (
                          <VisibilityOffIcon />
                        ) : (
                          <VisibilityIcon />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="body2" sx={{ color: INACTIVE_TEXT }}>
                Força da senha
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: passwordStrength.color, fontWeight: 700 }}
              >
                {passwordStrength.label}
              </Typography>
            </Box>
            <TextField
              label="Confirmar nova senha"
              type={passwordForm.showConfirm ? 'text' : 'password'}
              value={passwordForm.confirmPassword}
              onChange={(event) =>
                setPasswordForm((prev) => ({
                  ...prev,
                  confirmPassword: event.target.value,
                }))
              }
              fullWidth
              InputLabelProps={{ sx: { color: INACTIVE_TEXT } }}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() =>
                          setPasswordForm((prev) => ({
                            ...prev,
                            showConfirm: !prev.showConfirm,
                          }))
                        }
                        edge="end"
                        size="small"
                        sx={{ color: 'text.secondary' }}
                      >
                        {passwordForm.showConfirm ? (
                          <VisibilityOffIcon />
                        ) : (
                          <VisibilityIcon />
                        )}
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
          <Button
            variant="contained"
            onClick={handleUpdatePassword}
            disabled={saving}
          >
            Atualizar senha
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
