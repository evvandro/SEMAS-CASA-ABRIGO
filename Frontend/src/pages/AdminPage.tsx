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

export function AdminPage() {
  const [users, setUsers] = useState<AuthUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null)
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
    } catch {
      setError('Não foi possível carregar os usuários')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (user?: AuthUser) => {
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
  }

  const handleSubmit = async () => {
    try {
      setError(null)

      // Validações
      if (!formData.name.trim()) {
        setError('Nome é obrigatório')
        return
      }
      if (!formData.email.trim()) {
        setError('Email é obrigatório')
        return
      }
      if (!editingUser && !formData.password.trim()) {
        setError('Senha é obrigatória')
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
        setSuccess('Usuário atualizado com sucesso!')
      } else {
        // Criar novo usuário
        await createUser(formData)
        setSuccess('Usuário criado com sucesso!')
      }

      handleCloseDialog()
      await loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar usuário')
    }
  }

  const handleDelete = async (userId: number) => {
    if (!window.confirm('Tem certeza que deseja deletar este usuário?')) {
      return
    }

    try {
      setError(null)
      await deleteUser(userId)
      setSuccess('Usuário deletado com sucesso!')
      await loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar usuário')
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

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
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
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Senha"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            margin="normal"
            helperText={editingUser ? 'Deixe em branco para não alterar' : 'Campo obrigatório'}
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
            onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
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
