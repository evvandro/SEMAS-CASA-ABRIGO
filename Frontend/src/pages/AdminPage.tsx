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
  Container,
  IconButton,
  InputAdornment,
} from '@mui/material'
import { useState, useEffect } from 'react'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { createUser, listUsers, deleteUser, updateUser } from '../services/usersService'
import type { AuthUser } from '../types/auth'
import type { UserRole } from '../types/auth'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import { showSuccessToast } from '../utils/notificationService'

const PASSWORD_REQUIREMENTS =
  'A senha deve ter no mínimo 6 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais.'

type UserFieldErrors = Partial<Record<'name' | 'email' | 'password' | 'role', string>>

function getUserValidationErrors(error: unknown): UserFieldErrors {
  const validationErrors = (
    error as {
      response?: {
        data?: { errors?: Record<string, string[]> };
      };
    }
  ).response?.data?.errors

  if (!validationErrors) {
    return {}
  }

  return Object.entries(validationErrors).reduce<UserFieldErrors>(
    (errors, [field, messages]) => {
      if (field === 'name' || field === 'email' || field === 'password' || field === 'role') {
        errors[field] = messages[0]
      }

      return errors
    },
    {},
  )
}

function getUserErrorMessage(error: unknown): string {
  const response = (
    error as {
      response?: {
        data?: { message?: string; errors?: Record<string, string[]> };
      };
    }
  ).response
  const validationErrors = response?.data?.errors
  const firstValidationMessage = validationErrors
    ? Object.values(validationErrors)[0]?.[0]
    : undefined

  return (
    firstValidationMessage ??
    response?.data?.message ??
    (error instanceof Error ? error.message : 'Erro ao processar usuário')
  )
}

export function AdminPage() {
  const [users, setUsers] = useState<AuthUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null)
  const [fieldErrors, setFieldErrors] = useState<UserFieldErrors>({})
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'tecnico' as UserRole,
  })
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const loadedUsers = await listUsers()
      setUsers(loadedUsers)
    } catch (err) {
      const message = getUserErrorMessage(err)
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const clearFieldError = (field: keyof UserFieldErrors) => {
    setFieldErrors((prev) => {
      if (!prev[field]) {
        return prev
      }

      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const handleOpenDialog = (user?: AuthUser) => {
    setError(null)
    setFieldErrors({})
    if (user) {
      setEditingUser(user)
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
      })
    } else {
      setEditingUser(null)
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'tecnico',
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingUser(null)
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'tecnico',
    })
    setShowPassword(false)
    setFieldErrors({})
  }

  const handleSubmit = async () => {
    try {
      setError(null)
      setFieldErrors({})

      // Validações
      if (!formData.name.trim()) {
        const message = 'Nome é obrigatório'
        setFieldErrors({ name: message })
        return
      }
      if (!formData.email.trim()) {
        const message = 'Informe o e-mail.'
        setFieldErrors({ email: message })
        return
      }
      if (!editingUser && !formData.password.trim()) {
        const message = PASSWORD_REQUIREMENTS
        setFieldErrors({ password: message })
        return
      }

      if (editingUser) {
        // Editar usuário
        const updatePayload: Record<string, unknown> = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
        }
        if (formData.password.trim()) {
          updatePayload.password = formData.password
        }
        await updateUser(editingUser.id, updatePayload)
        showSuccessToast('Cadastro concluído', 'Usuário atualizado com sucesso.')
      } else {
        // Criar novo usuário
        await createUser(formData)
        showSuccessToast('Cadastro concluído', 'Usuário cadastrado com sucesso.')
      }

      handleCloseDialog()
      await loadUsers()
    } catch (err) {
      const message = getUserErrorMessage(err)
      const validationErrors = getUserValidationErrors(err)
      setFieldErrors(validationErrors)
      setError(Object.keys(validationErrors).length > 0 ? null : message)
    }
  }

  const handleDelete = async (userId: number) => {
    if (!window.confirm('Tem certeza que deseja deletar este usuário?')) {
      return
    }

    try {
      setError(null)
      await deleteUser(userId)
      await loadUsers()
    } catch (err) {
      const message = getUserErrorMessage(err)
      setError(message)
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold' }}>
          Administração de Usuários
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Button
          variant="contained"
          onClick={() => handleOpenDialog()}
          sx={{ mb: 3 }}
        >
          Novo Usuário
        </Button>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
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
                    <TableCell sx={{ textTransform: 'capitalize' }}>{user.role}</TableCell>
                    <TableCell>
                      {user.is_active ? (
                        <Typography sx={{ color: 'green', fontWeight: 'bold' }}>
                          Ativo
                        </Typography>
                      ) : (
                        <Typography sx={{ color: 'red', fontWeight: 'bold' }}>
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
                        onClick={() => handleDelete(user.id)}
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
        )}
      </Box>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            fullWidth
            label="Nome"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value })
              clearFieldError('name')
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
              setFormData({ ...formData, email: e.target.value })
              clearFieldError('email')
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
              setFormData({ ...formData, password: e.target.value })
              clearFieldError('password')
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
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                )
              }
            }}
          />
          <TextField
            fullWidth
            select
            label="Função"
            value={formData.role}
            onChange={(e) => {
              setFormData({ ...formData, role: e.target.value as UserRole })
              clearFieldError('role')
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
    </Container>
  )
}
