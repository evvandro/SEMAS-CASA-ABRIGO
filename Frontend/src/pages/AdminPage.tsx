import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Alert,
  CircularProgress,
  Typography,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { useState, useEffect } from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import {
  createUser,
  listUsers,
  deleteUser,
  updateUser,
} from '../services/usersService';
import type { AuthUser } from '../types/auth';
import type { UserRole } from '../types/auth';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { showSuccessToast } from '../utils/notificationService';
import { getApiErrorMessage } from '../utils/apiError';
import { PageHeader } from '../components/PageHeader';
import { ExportPDFButton } from '../components/ExportPDFButton';
import type { ReportColumn } from '../components/ReportTemplate';
import { ConfirmDialog } from '../components/ConfirmDialog';

const usuariosColumns: ReportColumn[] = [
  { header: 'Nome', key: 'name', width: '35%' },
  { header: 'Email', key: 'email', width: '35%' },
  { header: 'Função', key: 'role', width: '15%' },
  { header: 'Status', key: 'statusStr', width: '15%' },
];

const PASSWORD_REQUIREMENTS =
  'A senha deve ter no mínimo 12 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais.';

type UserFieldErrors = Partial<
  Record<'name' | 'email' | 'password' | 'role', string>
>;

function getUserValidationErrors(error: unknown): UserFieldErrors {
  const validationErrors = (
    error as {
      response?: {
        data?: { errors?: Record<string, string[]> };
      };
    }
  ).response?.data?.errors;

  if (!validationErrors) {
    return {};
  }

  return Object.entries(validationErrors).reduce<UserFieldErrors>(
    (errors, [field, messages]) => {
      if (
        field === 'name' ||
        field === 'email' ||
        field === 'password' ||
        field === 'role'
      ) {
        errors[field] = messages[0];
      }

      return errors;
    },
    {},
  );
}

export function AdminPage() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);
  const [fieldErrors, setFieldErrors] = useState<UserFieldErrors>({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'tecnico' as UserRole,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const loadedUsers = await listUsers();
      setUsers(loadedUsers);
    } catch (err) {
      const message = getApiErrorMessage(err, 'Erro ao carregar usuários.');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const clearFieldError = (field: keyof UserFieldErrors) => {
    setFieldErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }

      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleOpenDialog = (user?: AuthUser) => {
    setError(null);
    setFieldErrors({});
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'tecnico',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'tecnico',
    });
    setShowPassword(false);
    setFieldErrors({});
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      setFieldErrors({});

      // Validações
      if (!formData.name.trim()) {
        const message = 'Nome é obrigatório';
        setFieldErrors({ name: message });
        return;
      }
      if (!formData.email.trim()) {
        const message = 'Informe o e-mail.';
        setFieldErrors({ email: message });
        return;
      }
      if (!editingUser && !formData.password.trim()) {
        const message = PASSWORD_REQUIREMENTS;
        setFieldErrors({ password: message });
        return;
      }

      if (editingUser) {
        // Editar usuário
        const updatePayload: Record<string, unknown> = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
        };
        if (formData.password.trim()) {
          updatePayload.password = formData.password;
        }
        await updateUser(editingUser.id, updatePayload);
        showSuccessToast(
          'Cadastro concluído',
          'Usuário atualizado com sucesso.',
        );
      } else {
        // Criar novo usuário
        await createUser(formData);
        showSuccessToast(
          'Cadastro concluído',
          'Usuário cadastrado com sucesso.',
        );
      }

      handleCloseDialog();
      await loadUsers();
    } catch (err) {
      const message = getApiErrorMessage(err, 'Erro ao processar usuário.');
      const validationErrors = getUserValidationErrors(err);
      setFieldErrors(validationErrors);
      setError(Object.keys(validationErrors).length > 0 ? null : message);
    }
  };

  const handleDelete = async () => {
    if (deleteTargetId == null) return;

    try {
      setDeleting(true);
      setError(null);
      await deleteUser(deleteTargetId);
      setDeleteTargetId(null);
      await loadUsers();
    } catch (err) {
      const message = getApiErrorMessage(err, 'Erro ao desativar usuário.');
      setDeleteTargetId(null);
      setError(message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ mb: 3 }}>
          <PageHeader
            title="Administração de Usuários"
            actions={
              <Box sx={{ display: 'flex', gap: 1 }}>
                <ExportPDFButton
                  title="Relatório de Usuários"
                  columns={usuariosColumns}
                  data={users.map((u) => ({
                    ...u,
                    statusStr: u.is_active ? 'Ativo' : 'Inativo',
                  }))}
                  filename="relatorio-usuarios.pdf"
                  variant="outlined"
                />
                <Button variant="contained" onClick={() => handleOpenDialog()}>
                  Novo Usuário
                </Button>
              </Box>
            }
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
            <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Nome</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Função</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="center">
                    Ações
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell sx={{ textTransform: 'capitalize' }}>
                      {user.role}
                    </TableCell>
                    <TableCell>
                      {user.is_active ? (
                        <Typography sx={{ color: 'success.main', fontWeight: 'bold' }}>
                          Ativo
                        </Typography>
                      ) : (
                        <Typography sx={{ color: 'error.main', fontWeight: 'bold' }}>
                          Inativo
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(user)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => setDeleteTargetId(user.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {users.length === 0 && (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="textSecondary">
                  Nenhum usuário cadastrado
                </Typography>
              </Box>
            )}
            </TableContainer>
          </Paper>
        )}
      </Box>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            fullWidth
            label="Nome"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              clearFieldError('name');
            }}
            error={!!fieldErrors.name}
            helperText={fieldErrors.name}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value });
              clearFieldError('email');
            }}
            error={!!fieldErrors.email}
            helperText={fieldErrors.email}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Senha"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => {
              setFormData({ ...formData, password: e.target.value });
              clearFieldError('password');
            }}
            margin="normal"
            error={!!fieldErrors.password}
            helperText={fieldErrors.password ?? PASSWORD_REQUIREMENTS}
            slotProps={{
              htmlInput: {
                autoComplete: 'new-password',
                name: 'new-user-password',
              },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? (
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
            fullWidth
            select
            label="Função"
            value={formData.role}
            onChange={(e) => {
              setFormData({ ...formData, role: e.target.value as UserRole });
              clearFieldError('role');
            }}
            error={!!fieldErrors.role}
            helperText={fieldErrors.role}
            margin="normal"
          >
            <MenuItem value="admin">Administrador</MenuItem>
            <MenuItem value="tecnico">Técnico</MenuItem>
            <MenuItem value="logistica">Logística</MenuItem>
            <MenuItem value="saude">Saúde</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingUser ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog
        open={deleteTargetId != null}
        title="Remover acesso"
        message="Tem certeza que deseja remover o acesso deste usuário? Ele não conseguirá mais entrar no sistema."
        confirmLabel="Remover acesso"
        destructive
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onClose={() => setDeleteTargetId(null)}
      />
    </Box>
  );
}
