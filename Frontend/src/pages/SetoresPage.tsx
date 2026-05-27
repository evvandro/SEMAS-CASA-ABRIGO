import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import GridViewIcon from '@mui/icons-material/GridView'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '../auth/useAuth'
import {
  createSetor,
  deleteSetor,
  fetchSetores,
  updateSetor,
  type ApiSetor,
  type SetorPayload,
} from '../services/setoresService'
import { scrollAppContentToTop } from '../utils/scrollAppContent'

const PRESET_COLORS = [
  '#2e7d32', '#1565c0', '#c2185b', '#f9a825',
  '#6a1b9a', '#00838f', '#e65100', '#4e342e',
]

interface FormState {
  nome: string
  cor: string
  capacidade: string
}

const emptyForm: FormState = { nome: '', cor: '#607d8b', capacidade: '' }

export function SetoresPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [setores, setSetores] = useState<ApiSetor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ApiSetor | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [confirmDelete, setConfirmDelete] = useState<ApiSetor | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchSetores()
      .then(setSetores)
      .catch(() => setError('Erro ao carregar setores.'))
      .finally(() => setLoading(false))
  }, [])

  const totalCapacidade = setores.reduce((acc, s) => acc + (s.capacidade ?? 0), 0)

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setFormError(null)
    setDialogOpen(true)
  }

  const openEdit = (setor: ApiSetor) => {
    setEditing(setor)
    setForm({
      nome: setor.nome,
      cor: setor.cor,
      capacidade: setor.capacidade != null ? String(setor.capacidade) : '',
    })
    setFormError(null)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.nome.trim()) { setFormError('Nome é obrigatório.'); return }
    if (!/^#[0-9a-fA-F]{6}$/.test(form.cor)) { setFormError('Cor inválida.'); return }

    const payload: SetorPayload = {
      nome: form.nome.trim(),
      cor: form.cor,
      capacidade: form.capacidade !== '' ? Number(form.capacidade) : null,
    }

    setSaving(true)
    setFormError(null)
    try {
      if (editing) {
        const updated = await updateSetor(editing.id, payload)
        setSetores(prev => prev.map(s => s.id === updated.id ? updated : s))
        scrollAppContentToTop()
        toast.success('Setor atualizado.')
      } else {
        const created = await createSetor(payload)
        setSetores(prev => [...prev, created])
        scrollAppContentToTop()
        toast.success('Setor criado.')
      }
      setDialogOpen(false)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setFormError(msg ?? 'Erro ao salvar setor.')
      scrollAppContentToTop()
      toast.error(msg ?? 'Erro ao salvar setor.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      await deleteSetor(confirmDelete.id)
      setSetores(prev => prev.filter(s => s.id !== confirmDelete.id))
      scrollAppContentToTop()
      toast.success('Setor removido.')
      setConfirmDelete(null)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Erro ao remover setor.')
      scrollAppContentToTop()
      toast.error(msg ?? 'Erro ao remover setor.')
      setConfirmDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', height: 300 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={2}>
        <Box>
          <Typography variant="h4" gutterBottom>Setores</Typography>
          <Typography color="text.secondary">
            Áreas de acolhimento com capacidade e identificação por cor.
          </Typography>
        </Box>
        {isAdmin && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ flexShrink: 0 }}>
            Novo setor
          </Button>
        )}
      </Stack>

      {setores.length > 0 && (
        <Stack direction="row" gap={1.5} flexWrap="wrap">
          <Chip icon={<GridViewIcon />} label={`${setores.length} setores`} color="primary" />
          {totalCapacidade > 0 && (
            <Chip label={`${totalCapacidade} leitos no total`} variant="outlined" />
          )}
        </Stack>
      )}

      {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

      {setores.length === 0 ? (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
          <CardContent sx={{ py: 6 }}>
            <GridViewIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary" gutterBottom>Nenhum setor cadastrado.</Typography>
            {isAdmin && (
              <Button variant="outlined" sx={{ mt: 1 }} onClick={openCreate}>
                Criar primeiro setor
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {setores.map(setor => (
            <Grid key={setor.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderTop: `3px solid ${setor.cor}`,
                  height: '100%',
                  transition: 'box-shadow .15s',
                  '&:hover': { boxShadow: 2 },
                }}
              >
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Stack direction="row" alignItems="center" gap={1.5}>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          bgcolor: setor.cor,
                          flexShrink: 0,
                        }}
                      />
                      <Typography variant="subtitle1" fontWeight={600}>
                        {setor.nome}
                      </Typography>
                    </Stack>

                    {isAdmin && (
                      <Stack direction="row" gap={0.5}>
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => openEdit(setor)}>
                            <EditIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remover">
                          <IconButton size="small" color="error" onClick={() => setConfirmDelete(setor)}>
                            <DeleteIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    )}
                  </Stack>

                  <Divider sx={{ my: 1.5 }} />

                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Capacidade</Typography>
                    {setor.capacidade != null ? (
                      <Typography variant="body2" fontWeight={600}>{setor.capacidade} leitos</Typography>
                    ) : (
                      <Chip size="small" label="Não definida" variant="outlined" color="warning" />
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? 'Editar setor' : 'Novo setor'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}

            <TextField
              label="Nome"
              value={form.nome}
              onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              fullWidth
              autoFocus
            />

            <TextField
              label="Capacidade (leitos)"
              type="number"
              value={form.capacidade}
              onChange={e => setForm(f => ({ ...f, capacidade: e.target.value }))}
              fullWidth
              slotProps={{ htmlInput: { min: 1, max: 500 } }}
            />

            <Box>
              <Typography variant="body2" color="text.secondary" mb={1}>Cor</Typography>
              <Stack direction="row" gap={1} flexWrap="wrap" mb={1.5}>
                {PRESET_COLORS.map(c => (
                  <Box
                    key={c}
                    onClick={() => setForm(f => ({ ...f, cor: c }))}
                    sx={{
                      width: 30,
                      height: 30,
                      borderRadius: 1,
                      bgcolor: c,
                      cursor: 'pointer',
                      outline: form.cor === c ? `2px solid` : '2px solid transparent',
                      outlineColor: form.cor === c ? 'text.primary' : 'transparent',
                      outlineOffset: 2,
                      transition: 'outline .1s',
                    }}
                  />
                ))}
              </Stack>
              <TextField
                label="Hex personalizado"
                value={form.cor}
                onChange={e => setForm(f => ({ ...f, cor: e.target.value }))}
                size="small"
                fullWidth
                slotProps={{
                  input: {
                    startAdornment: (
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: 0.5,
                          bgcolor: /^#[0-9a-fA-F]{6}$/.test(form.cor)
                            ? form.cor
                            : (theme) => alpha(theme.palette.divider, 1),
                          border: '1px solid',
                          borderColor: 'divider',
                          mr: 1,
                          flexShrink: 0,
                        }}
                      />
                    ),
                  },
                }}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Remover setor</DialogTitle>
        <DialogContent>
          <Typography>
            Deseja remover o setor <strong>{confirmDelete?.nome}</strong>? Não é possível desfazer esta ação.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmDelete(null)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}>
            {deleting ? <CircularProgress size={20} color="inherit" /> : 'Remover'}
          </Button>
        </DialogActions>
      </Dialog>

    </Stack>
  )
}
