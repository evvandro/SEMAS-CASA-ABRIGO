import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  Grid,
  IconButton,
  Paper,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import GridViewIcon from '@mui/icons-material/GridView'
import GroupsIcon from '@mui/icons-material/Groups'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { fetchAcolhidos } from '../services/acolhidosService'
import { showErrorToast, showSuccessToast } from '../utils/notificationService'
import {
  createSetor,
  deleteSetor,
  fetchSetores,
  updateSetor,
  type ApiSetor,
  type SetorPayload,
} from '../services/setoresService'
import { scrollAppContentToTop } from '../utils/scrollAppContent'
import type { Acolhido } from '../modules/acolhidos/types'
import { formatEntryDateTime } from '../modules/acolhidos/utils/date'

const PRESET_COLORS = [
  '#2e7d32', '#1565c0', '#c2185b', '#f9a825',
  '#6a1b9a', '#00838f', '#e65100', '#4e342e',
]

const MAX_PREVIEW_BEDS = 24

type SectorStatusKey = 'available' | 'attention' | 'full' | 'blocked' | 'undefined'

interface FormState {
  nome: string
  cor: string
  capacidade: string
}

interface BedDetail {
  number: number
  label: string
  blocked: boolean
  occupant: Acolhido | null
}

interface SectorDetail {
  setor: ApiSetor
  occupants: Acolhido[]
  beds: BedDetail[]
  capacity: number
  occupied: number
  percent: number
  freeBeds: number
  blockedBeds: number
  status: SectorStatusKey
}

const emptyForm: FormState = { nome: '', cor: '#607d8b', capacidade: '' }

const statusMeta: Record<SectorStatusKey, {
  label: string
  helper: string
  color: string
  bg: string
  border: string
}> = {
  available: {
    label: 'Disponível',
    helper: 'Até 70% de ocupação',
    color: '#15803D',
    bg: '#DCFCE7',
    border: '#BBF7D0',
  },
  attention: {
    label: 'Atenção',
    helper: 'Acima de 70% de ocupação',
    color: '#B45309',
    bg: '#FEF3C7',
    border: '#FDE68A',
  },
  full: {
    label: 'Lotado',
    helper: '100% da capacidade ocupada',
    color: '#B91C1C',
    bg: '#FEE2E2',
    border: '#FECACA',
  },
  blocked: {
    label: 'Interditado',
    helper: 'Setor fora de operação',
    color: '#475569',
    bg: '#E2E8F0',
    border: '#CBD5E1',
  },
  undefined: {
    label: 'Sem capacidade',
    helper: 'Capacidade ainda não definida',
    color: '#64748B',
    bg: '#F1F5F9',
    border: '#E2E8F0',
  },
}

const cellBg = (status: SectorStatusKey, pct: number) => {
  if (status === 'blocked') return '#F8FAFC'
  if (pct >= 95) return '#FEE2E2'
  if (pct >= 80) return '#FEF3C7'
  if (pct >= 50) return '#F0FDF4'
  return '#FFFFFF'
}

const normalizeBlockedBeds = (beds?: string[] | null) =>
  Array.from(new Set((beds ?? []).map((bed) => String(bed).trim()).filter(Boolean)))

const bedKey = (number: number) => String(number)

const bedLabel = (number: number) => `Leito ${String(number).padStart(2, '0')}`

const parseBedNumber = (value: string | null | undefined, capacity: number) => {
  const match = value?.match(/\d+/)
  if (!match) return null

  const parsed = Number(match[0])
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= capacity ? parsed : null
}

const getSectorStatus = (setor: ApiSetor, occupied: number, capacity: number, percent: number): SectorStatusKey => {
  if (!setor.ativo) return 'blocked'
  if (capacity <= 0) return 'undefined'
  if (occupied >= capacity) return 'full'
  if (percent > 70) return 'attention'
  return 'available'
}

const buildSectorDetail = (setor: ApiSetor, allAcolhidos: Acolhido[]): SectorDetail => {
  const capacity = Math.max(Number(setor.capacidade ?? 0), 0)
  const occupants = allAcolhidos
    .filter((acolhido) => acolhido.sectorId === String(setor.id))
    .sort((a, b) => a.name.localeCompare(b.name))
  const manuallyBlocked = new Set(normalizeBlockedBeds(setor.leitos_interditados))

  const beds: BedDetail[] = Array.from({ length: capacity }, (_, index) => {
    const number = index + 1
    return {
      number,
      label: bedLabel(number),
      blocked: !setor.ativo || manuallyBlocked.has(bedKey(number)),
      occupant: null,
    }
  })

  const pending: Acolhido[] = []

  occupants.forEach((occupant) => {
    const explicitBed = parseBedNumber(occupant.bed, capacity)
    const target = explicitBed ? beds[explicitBed - 1] : null

    if (target && !target.occupant) {
      target.occupant = occupant
      return
    }

    pending.push(occupant)
  })

  pending.forEach((occupant) => {
    const availableBed = beds.find((bed) => !bed.occupant && !bed.blocked)
    const fallbackBed = beds.find((bed) => !bed.occupant)
    const target = availableBed ?? fallbackBed

    if (target) target.occupant = occupant
  })

  const occupied = occupants.length
  const percent = capacity > 0 ? Math.min(Math.round((occupied / capacity) * 100), 100) : 0
  const blockedBeds = setor.ativo
    ? beds.filter((bed) => bed.blocked && !bed.occupant).length
    : Math.max(capacity - occupied, 0)
  const freeBeds = setor.ativo ? Math.max(capacity - occupied - blockedBeds, 0) : 0

  return {
    setor,
    occupants,
    beds,
    capacity,
    occupied,
    percent,
    freeBeds,
    blockedBeds,
    status: getSectorStatus(setor, occupied, capacity, percent),
  }
}

function StatusChip({ status }: { status: SectorStatusKey }) {
  const meta = statusMeta[status]

  return (
    <Chip
      size="small"
      label={meta.label}
      sx={{
        bgcolor: meta.bg,
        color: meta.color,
        border: '1px solid',
        borderColor: meta.border,
        fontWeight: 700,
      }}
    />
  )
}

function BedCell({ bed, color, compact = false }: { bed: BedDetail; color: string; compact?: boolean }) {
  const title = bed.occupant
    ? `${bed.label} - ${bed.occupant.name}`
    : bed.blocked
      ? `${bed.label} - Interditado`
      : `${bed.label} - Livre`
  const priority = bed.occupant ? bed.occupant.alerts.length > 0 : false
  const bg = priority ? '#DC2626' : bed.occupant ? color : bed.blocked ? '#FEE2E2' : 'transparent'
  const border = bed.occupant ? 'none' : bed.blocked ? '1px solid #FCA5A5' : '1px dashed #D1D5DB'

  return (
    <Tooltip title={title} arrow>
      <Box
        sx={{
          aspectRatio: '1',
          minWidth: 0,
          borderRadius: compact ? 0.4 : 0.5,
          border,
          bgcolor: bg,
          opacity: bed.occupant || !bed.blocked ? 1 : 0.9,
        }}
      />
    </Tooltip>
  )
}

export function SetoresPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [setores, setSetores] = useState<ApiSetor[]>([])
  const [acolhidos, setAcolhidos] = useState<Acolhido[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ApiSetor | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [confirmDelete, setConfirmDelete] = useState<ApiSetor | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [selectedSetorId, setSelectedSetorId] = useState<number | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const [loadedSetores, acolhidosResult] = await Promise.all([
          fetchSetores(),
          fetchAcolhidos(),
        ])

        if (!active) return

        setSetores(loadedSetores)
        setAcolhidos(acolhidosResult.data)
      } catch {
        if (active) setError('Erro ao carregar setores.')
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [])

  const details = useMemo(
    () => setores.map((setor) => buildSectorDetail(setor, acolhidos)),
    [setores, acolhidos],
  )

  const selectedDetail = useMemo(
    () => details.find((detail) => detail.setor.id === selectedSetorId) ?? null,
    [details, selectedSetorId],
  )

  const totalCapacidade = details.reduce((acc, detail) => acc + detail.capacity, 0)
  const totalOcupado = details.reduce((acc, detail) => acc + detail.occupied, 0)
  const totalLivres = details.reduce((acc, detail) => acc + detail.freeBeds, 0)
  const setoresInterditados = details.filter((detail) => !detail.setor.ativo).length
  const totalLeitosInterditados = details.reduce((acc, detail) => acc + detail.blockedBeds, 0)

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

  const syncSetor = (updated: ApiSetor) => {
    setSetores((prev) => prev.map((setor) => setor.id === updated.id ? updated : setor))
  }

  const handleSave = async () => {
    const capacidade = form.capacidade !== '' ? Number(form.capacidade) : null

    if (!form.nome.trim()) { setFormError('Nome é obrigatório.'); return }
    if (!/^#[0-9a-fA-F]{6}$/.test(form.cor)) { setFormError('Cor inválida.'); return }
    if (capacidade != null && (!Number.isInteger(capacidade) || capacidade < 1)) {
      setFormError('Capacidade deve ser um número inteiro maior que zero.')
      return
    }

    const payload: SetorPayload = {
      nome: form.nome.trim(),
      cor: form.cor,
      capacidade,
    }

    setSaving(true)
    setFormError(null)
    try {
      if (editing) {
        const updated = await updateSetor(editing.id, payload)
        setSetores(prev => prev.map(s => s.id === updated.id ? updated : s))
        scrollAppContentToTop()
        showSuccessToast('Setor atualizado', 'Alterações salvas com sucesso.')
      } else {
        const created = await createSetor(payload)
        setSetores(prev => [...prev, created])
        scrollAppContentToTop()
        showSuccessToast('Setor criado', 'Novo setor cadastrado com sucesso.')
      }
      setDialogOpen(false)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setFormError(msg ?? 'Erro ao salvar setor.')
      scrollAppContentToTop()
      showErrorToast('Erro ao salvar setor', msg ?? 'Erro ao salvar setor.')
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
      showSuccessToast('Setor removido', 'Setor excluído com sucesso.')
      setConfirmDelete(null)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Erro ao remover setor.')
      scrollAppContentToTop()
      showErrorToast('Erro ao remover setor', msg ?? 'Erro ao remover setor.')
      setConfirmDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  const handleToggleSetor = async (setor: ApiSetor, blocked: boolean) => {
    setUpdatingStatus(true)
    try {
      const updated = await updateSetor(setor.id, { ativo: !blocked })
      syncSetor(updated)
      showSuccessToast('Status do setor alterado', blocked ? 'Setor interditado.' : 'Setor liberado.')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Erro ao alterar status do setor.')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleToggleBed = async (setor: ApiSetor, bedNumber: number) => {
    const key = bedKey(bedNumber)
    const current = normalizeBlockedBeds(setor.leitos_interditados)
    const next = current.includes(key)
      ? current.filter((bed) => bed !== key)
      : [...current, key].sort((a, b) => Number(a) - Number(b))

    setUpdatingStatus(true)
    try {
      const updated = await updateSetor(setor.id, { leitos_interditados: next })
      syncSetor(updated)
      showSuccessToast('Leito atualizado', next.includes(key) ? `${bedLabel(bedNumber)} interditado.` : `${bedLabel(bedNumber)} liberado.`)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Erro ao alterar status do leito.')
      showErrorToast('Erro ao alterar leito', msg ?? 'Erro ao alterar status do leito.')
    } finally {
      setUpdatingStatus(false)
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
            Ocupação, leitos e status operacional da Casa Abrigo.
          </Typography>
        </Box>
        {isAdmin && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ flexShrink: 0 }}>
            Novo setor
          </Button>
        )}
      </Stack>

      {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              <GridViewIcon sx={{ fontSize: 16 }} /> Mapa de Setores
            </Typography>
            <Typography variant="caption">
              {totalOcupado} / {totalCapacidade} leitos ocupados · {totalLivres} livres
              {setoresInterditados + totalLeitosInterditados > 0 ? ` · ${setoresInterditados + totalLeitosInterditados} interdições` : ''} · clique para abrir
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="caption">Ocupação</Typography>
            <Box sx={{
              height: 10, width: 100, borderRadius: 0.5,
              background: 'linear-gradient(to right, #DCFCE7 0%, #FEF3C7 50%, #FEE2E2 80%, #FCA5A5 100%)',
              border: '1px solid', borderColor: 'divider',
            }} />
            <Typography variant="caption">0% → 100%</Typography>
          </Box>
        </Box>

        {setores.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
            <GridViewIcon sx={{ fontSize: 42, color: 'text.disabled', mb: 1 }} />
            <Typography gutterBottom>Nenhum setor cadastrado.</Typography>
            {isAdmin && (
              <Button variant="outlined" sx={{ mt: 1 }} onClick={openCreate}>
                Criar primeiro setor
              </Button>
            )}
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
              gap: 1.5,
            }}
          >
            {details.map((detail) => {
              const { setor, beds, capacity, occupied, percent, status } = detail
              const meta = statusMeta[status]
              const previewBeds = beds.slice(0, MAX_PREVIEW_BEDS)
              const hiddenBeds = Math.max(beds.length - previewBeds.length, 0)
              const isSelected = selectedSetorId === setor.id

              return (
                <Paper
                  key={setor.id}
                  variant="outlined"
                  onClick={() => setSelectedSetorId(setor.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setSelectedSetorId(setor.id)
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  sx={{
                    p: 1.5,
                    cursor: 'pointer',
                    bgcolor: cellBg(status, percent),
                    borderColor: isSelected ? 'primary.main' : status === 'blocked' ? meta.border : 'divider',
                    borderWidth: isSelected ? 2 : 1,
                    transition: 'all .15s',
                    '&:hover': { transform: 'translateY(-1px)' },
                    '&:focus-visible': {
                      outline: '2px solid',
                      outlineColor: 'primary.main',
                      outlineOffset: 2,
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: status === 'blocked' ? meta.color : setor.cor, flexShrink: 0 }} />
                    <Typography sx={{ fontSize: 13, fontWeight: 600 }} noWrap>{setor.nome}</Typography>
                    <Typography variant="caption" sx={{ ml: 'auto', flexShrink: 0 }}>
                      {capacity > 0 ? `${occupied}/${capacity}` : '-'}
                    </Typography>
                    {isAdmin && (
                      <Stack direction="row" gap={0.25} onClick={(event) => event.stopPropagation()}>
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => openEdit(setor)}>
                            <EditIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remover">
                          <IconButton size="small" color="error" onClick={() => setConfirmDelete(setor)}>
                            <DeleteIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    )}
                  </Box>

                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 0.5, my: 1 }}>
                    {previewBeds.length > 0 ? (
                      previewBeds.map((bed) => (
                        <BedCell key={bed.number} bed={bed} color={setor.cor} compact />
                      ))
                    ) : (
                      <Box sx={{ gridColumn: '1 / -1', border: '1px dashed #D1D5DB', borderRadius: 0.75, py: 1, px: 1.25 }}>
                        <Typography variant="caption" color="text.secondary">
                          Capacidade não definida
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption">
                      <strong style={{ color: '#0F172A' }}>{occupied}</strong> / {capacity || 0} leitos
                      {hiddenBeds > 0 ? ` · +${hiddenBeds}` : ''}
                    </Typography>
                    <Typography sx={{ fontWeight: 600, fontSize: 13 }}>
                      {capacity > 0 ? `${percent}%` : '-'}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, mt: 1 }}>
                    <StatusChip status={status} />
                    <Button
                      size="small"
                      startIcon={<GroupsIcon />}
                      onClick={(event) => {
                        event.stopPropagation()
                        setSelectedSetorId(setor.id)
                      }}
                    >
                      Detalhes
                    </Button>
                  </Box>
                </Paper>
              )
            })}
          </Box>
        )}
      </Paper>

      <Drawer
        anchor="right"
        open={!!selectedDetail}
        onClose={() => setSelectedSetorId(null)}
        slotProps={{ paper: { sx: { width: { xs: '100vw', sm: 680, md: 760 } } } }}
      >
        {selectedDetail && (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box
              sx={{
                p: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
                <Box>
                  <Stack direction="row" alignItems="center" gap={1.25} sx={{ mb: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: 0.75,
                        bgcolor: selectedDetail.setor.ativo ? selectedDetail.setor.cor : statusMeta.blocked.color,
                      }}
                    />
                    <Typography variant="h5" fontWeight={900}>
                      {selectedDetail.setor.nome}
                    </Typography>
                    <StatusChip status={selectedDetail.status} />
                  </Stack>
                  <Typography color="text.secondary">
                    {selectedDetail.occupied} acolhido ativo | {selectedDetail.freeBeds} leitos livres
                    {selectedDetail.blockedBeds > 0 ? ` | ${selectedDetail.blockedBeds} leitos interditados` : ''}
                  </Typography>
                </Box>
                <IconButton onClick={() => setSelectedSetorId(null)}>
                  <CloseIcon />
                </IconButton>
              </Stack>
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
              <Grid container spacing={1.5} sx={{ mb: 2 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                    <Typography variant="h6" lineHeight={1}>{selectedDetail.occupied}</Typography>
                    <Typography variant="caption" color="text.secondary">acolhidos ativos</Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                    <Typography variant="h6" lineHeight={1}>{selectedDetail.freeBeds}</Typography>
                    <Typography variant="caption" color="text.secondary">leitos livres</Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                    <Typography variant="h6" lineHeight={1}>{selectedDetail.percent}%</Typography>
                    <Typography variant="caption" color="text.secondary">ocupação</Typography>
                  </Paper>
                </Grid>
              </Grid>

              {isAdmin && (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    mb: 2,
                    borderRadius: 1,
                    borderColor: selectedDetail.setor.ativo ? 'divider' : statusMeta.blocked.border,
                    bgcolor: selectedDetail.setor.ativo ? 'background.paper' : statusMeta.blocked.bg,
                  }}
                >
                  <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={1.5}>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={800}>Status do setor</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedDetail.setor.ativo ? 'Setor operacional para novas alocações.' : 'Setor interditado para novas alocações.'}
                      </Typography>
                    </Box>
                    <Stack direction="row" alignItems="center" gap={1}>
                      <Typography variant="body2" fontWeight={700}>
                        Interditar
                      </Typography>
                      <Switch
                        checked={!selectedDetail.setor.ativo}
                        onChange={(event) => handleToggleSetor(selectedDetail.setor, event.target.checked)}
                        disabled={updatingStatus}
                      />
                    </Stack>
                  </Stack>
                </Paper>
              )}

              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Acolhidos
                  </Typography>

                  {selectedDetail.occupants.length > 0 ? (
                    <Stack spacing={1}>
                      {selectedDetail.occupants.map((occupant) => (
                        <Paper
                          key={occupant.apiId}
                          variant="outlined"
                          sx={{
                            p: 1.25,
                            borderRadius: 1,
                          }}
                        >
                          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1}>
                            <Stack direction="row" gap={1} alignItems="center">
                              <Box
                                sx={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: 0.5,
                                  bgcolor: selectedDetail.setor.cor,
                                  flexShrink: 0,
                                }}
                              />
                              <Box>
                                <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{occupant.name}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {occupant.age || '-'} anos | Entrada: {formatEntryDateTime(occupant.entry, occupant.entryTime)}
                                </Typography>
                              </Box>
                            </Stack>
                            <Chip
                              size="small"
                              label={occupant.bed || 'Leito não informado'}
                              variant="outlined"
                              sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
                            />
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  ) : (
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 1, color: 'text.secondary' }}>
                      Nenhum acolhido ativo neste setor.
                    </Paper>
                  )}
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Leitos
                  </Typography>

                  {selectedDetail.beds.length > 0 ? (
                    <>
                      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1, mb: 1.5 }}>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 0.5 }}>
                          {selectedDetail.beds.map((bed) => (
                            <BedCell key={bed.number} bed={bed} color={selectedDetail.setor.cor} compact />
                          ))}
                        </Box>
                      </Paper>

                      <Grid container spacing={1}>
                        {selectedDetail.beds.map((bed) => {
                          const individuallyBlocked = normalizeBlockedBeds(selectedDetail.setor.leitos_interditados).includes(bedKey(bed.number))
                          const canToggleBed = isAdmin && selectedDetail.setor.ativo && !bed.occupant
                          const bedStatus = bed.occupant ? 'Ocupado' : bed.blocked ? 'Interditado' : 'Livre'

                          return (
                            <Grid key={bed.number} size={{ xs: 12, sm: 6 }}>
                              <Paper
                                variant="outlined"
                                sx={{
                                  p: 1.25,
                                  borderRadius: 1,
                                  borderColor: bed.occupant ? selectedDetail.setor.cor : bed.blocked ? '#FCA5A5' : 'divider',
                                  bgcolor: bed.occupant
                                    ? alpha(selectedDetail.setor.cor, 0.08)
                                    : bed.blocked
                                      ? '#FEF2F2'
                                      : 'background.paper',
                                }}
                              >
                                <Stack direction="row" alignItems="center" gap={1}>
                                  <Box sx={{ width: 18, flexShrink: 0 }}>
                                    <BedCell bed={bed} color={selectedDetail.setor.cor} compact />
                                  </Box>
                                  <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="body2" fontWeight={700}>
                                      {bed.label}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" noWrap>
                                      {bed.occupant?.name ?? bedStatus}
                                    </Typography>
                                  </Box>
                                  <Chip
                                    size="small"
                                    label={bedStatus}
                                    color={bed.occupant ? 'primary' : bed.blocked ? 'error' : 'success'}
                                    variant={bed.occupant ? 'filled' : 'outlined'}
                                  />
                                  {isAdmin && (
                                    <Tooltip title={bed.occupant ? 'Leito ocupado' : selectedDetail.setor.ativo ? '' : 'Setor interditado'}>
                                      <span>
                                        <Button
                                          size="small"
                                          variant={individuallyBlocked ? 'contained' : 'outlined'}
                                          color={individuallyBlocked ? 'error' : 'inherit'}
                                          onClick={() => handleToggleBed(selectedDetail.setor, bed.number)}
                                          disabled={!canToggleBed || updatingStatus}
                                        >
                                          {individuallyBlocked ? 'Liberar' : 'Interditar'}
                                        </Button>
                                      </span>
                                    </Tooltip>
                                  )}
                                </Stack>
                              </Paper>
                            </Grid>
                          )
                        })}
                      </Grid>
                    </>
                  ) : (
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 1, color: 'text.secondary' }}>
                      Capacidade não definida para este setor.
                    </Paper>
                  )}
                </Box>
              </Stack>
            </Box>
          </Box>
        )}
      </Drawer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? 'Editar setor' : 'Novo setor'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}

            <TextField
              label="Nome"
              value={form.nome}
              onChange={(event) => setForm((prev) => ({ ...prev, nome: event.target.value }))}
              fullWidth
              autoFocus
            />

            <TextField
              label="Capacidade (leitos)"
              type="number"
              value={form.capacidade}
              onChange={(event) => setForm((prev) => ({ ...prev, capacidade: event.target.value }))}
              fullWidth
              slotProps={{ htmlInput: { min: 1, max: 500 } }}
            />

            <Box>
              <Typography variant="body2" color="text.secondary" mb={1}>Cor</Typography>
              <Stack direction="row" gap={1} flexWrap="wrap" mb={1.5}>
                {PRESET_COLORS.map((color) => (
                  <Box
                    key={color}
                    onClick={() => setForm((prev) => ({ ...prev, cor: color }))}
                    sx={{
                      width: 30,
                      height: 30,
                      borderRadius: 1,
                      bgcolor: color,
                      cursor: 'pointer',
                      outline: form.cor === color ? `2px solid` : '2px solid transparent',
                      outlineColor: form.cor === color ? 'text.primary' : 'transparent',
                      outlineOffset: 2,
                      transition: 'outline .1s',
                    }}
                  />
                ))}
              </Stack>
              <TextField
                label="Hex personalizado"
                value={form.cor}
                onChange={(event) => setForm((prev) => ({ ...prev, cor: event.target.value }))}
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
