import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Drawer, Box, Typography, IconButton, TextField, Button, Divider,
  FormControlLabel, Checkbox, FormControl, FormHelperText, InputLabel, MenuItem, Select,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { toast } from 'sonner'
import { cadastroSchema } from '../schemas/cadastroSchema'
import type { Acolhido, CadastroPayload, Sector } from '../types'
import { formatCpf, formatDateInput } from '../utils/formFormatters'
import { scrollAppContentToTop } from '../../../utils/scrollAppContent'

const empty: CadastroPayload = {
  name: '', cpf: '', birth: '',
  pcd: false, gestante: false, cronica: false, idoso: false,
  sectorId: '', bed: '', notes: '',
}

function toBrazilianDate(isoDate?: string | null) {
  if (!isoDate) return ''
  const [year, month, day] = isoDate.split('T')[0].split('-')
  if (!year || !month || !day) return ''
  return `${day}/${month}/${year}`
}

function toFormPayload(row: Acolhido): CadastroPayload {
  return {
    name: row.name,
    cpf: row.cpf,
    birth: toBrazilianDate(row.birthDate),
    pcd: row.alerts.includes('pcd'),
    gestante: row.alerts.includes('gestante'),
    cronica: row.alerts.includes('cronica'),
    idoso: row.alerts.includes('idoso'),
    sectorId: row.sectorId,
    bed: row.bed ?? '',
    notes: row.notes ?? '',
  }
}

export function CadastroDrawer({ open, onClose, onSave, sectors, rows, mode = 'create', initialRow = null }: {
  open: boolean
  onClose: () => void
  onSave: (payload: CadastroPayload) => void | Promise<void>
  sectors: Sector[]
  rows: Acolhido[]
  mode?: 'create' | 'edit'
  initialRow?: Acolhido | null
}) {
  const [form, setForm] = useState<CadastroPayload>(empty)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const firstRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    const timeout = window.setTimeout(() => firstRef.current?.focus(), 280)
    return () => window.clearTimeout(timeout)
  }, [open])

  useEffect(() => {
    if (!open) return
    setForm(initialRow ? toFormPayload(initialRow) : empty)
    setErrors({})
  }, [initialRow, open])

  const resetForm = () => {
    setForm(empty)
    setErrors({})
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const set = <K extends keyof CadastroPayload>(k: K, v: CadastroPayload[K]) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: '' }))
  }

  const setSector = (sectorId: string) => {
    setForm(f => ({ ...f, sectorId, bed: '' }))
    setErrors(e => ({ ...e, sectorId: '', bed: '' }))
  }

  const selectedSector = useMemo(
    () => sectors.find(s => s.id === form.sectorId),
    [form.sectorId, sectors],
  )

  const bedOptions = useMemo(() => {
    if (!selectedSector) return []

    return buildBedOptions({
      capacity: selectedSector.capacity,
      active: selectedSector.active,
      blockedBeds: selectedSector.blockedBeds,
      occupiedBeds: rows
        .filter(row => row.sectorId === selectedSector.id && row.apiId !== initialRow?.apiId)
        .map(row => row.bed),
      currentBed: form.bed,
    })
  }, [form.bed, initialRow?.apiId, rows, selectedSector])

  const submit = async () => {
    const result = cadastroSchema.safeParse(form)
    if (!result.success) {
      const errs: Record<string, string> = {}
      result.error.issues.forEach(i => { if (i.path[0]) errs[i.path[0] as string] = i.message })
      setErrors(errs)
      scrollAppContentToTop()
      toast.error('Corrija os campos obrigatórios antes de continuar.')
      return
    }
    setSubmitting(true)
    try {
      await onSave(result.data)
      resetForm()
    } finally {
      setSubmitting(false)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submit() }
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      slotProps={{ paper: { sx: { width: { xs: '100vw', sm: 560 } } } }}
    >
      <Box onKeyDown={onKeyDown} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {mode === 'edit' ? 'Editar cadastro rápido' : 'Cadastro rápido'}
            </Typography>
            <Typography variant="caption">
              {mode === 'edit' ? 'Atualização dos dados essenciais' : 'Entrada com dados essenciais'}
            </Typography>
          </Box>
          <IconButton onClick={handleClose}><CloseIcon /></IconButton>
        </Box>

        <Box data-drawer-scroll-area sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
          <SectionLabel n={1} title="Identificação" />
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 1.5, mb: 3 }}>
            <Box sx={{ gridColumn: 'span 12' }}>
              <TextField
                inputRef={firstRef}
                label="Nome completo *"
                fullWidth
                value={form.name}
                onChange={e => set('name', e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
              />
            </Box>
            <Box sx={{ gridColumn: 'span 6' }}>
              <TextField
                label="CPF *"
                fullWidth
                value={form.cpf}
                onChange={e => set('cpf', formatCpf(e.target.value))}
                error={!!errors.cpf}
                helperText={errors.cpf}
                placeholder="000.000.000-00"
                slotProps={{ htmlInput: { inputMode: 'numeric' } }}
              />
            </Box>
            <Box sx={{ gridColumn: 'span 6' }}>
              <TextField
                label="Data de nascimento *"
                fullWidth
                value={form.birth}
                onChange={e => set('birth', formatDateInput(e.target.value))}
                error={!!errors.birth}
                helperText={errors.birth}
                placeholder="DD/MM/AAAA"
                slotProps={{ htmlInput: { inputMode: 'numeric' } }}
              />
            </Box>
          </Box>

          <SectionLabel n={2} title="Saúde e perfil prioritário" />
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, mb: 3 }}>
            <FormControlLabel control={<Checkbox checked={form.pcd}      onChange={e => set('pcd', e.target.checked)}/>}      label="PCD" />
            <FormControlLabel control={<Checkbox checked={form.gestante} onChange={e => set('gestante', e.target.checked)}/>} label="Gestante" />
            <FormControlLabel control={<Checkbox checked={form.cronica}  onChange={e => set('cronica', e.target.checked)}/>}  label="Doença crônica" />
            <FormControlLabel control={<Checkbox checked={form.idoso}    onChange={e => set('idoso', e.target.checked)}/>}    label="Idoso 60+" />
          </Box>

          <SectionLabel n={3} title="Alocação de setor" />
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, mb: 1 }}>
            {sectors.map(s => {
              const selected = form.sectorId === s.id
              const interdicted = !s.active
              const summary = getSectorCapacitySummary(s)
              const noUsefulBeds = s.active && summary.capacity > 0 && summary.usableCapacity === 0
              const full = s.active && summary.usableCapacity > 0 && summary.occupied >= summary.usableCapacity
              const unavailable = !selected && (interdicted || noUsefulBeds || full)
              const status = interdicted
                ? 'Interditado'
                : noUsefulBeds || full
                  ? 'Sem vagas'
                  : `${summary.occupied}/${summary.usableCapacity || summary.capacity}`
              const blockedLabel = summary.blockedBedsCount > 0
                ? `${summary.blockedBedsCount} ${summary.blockedBedsCount === 1 ? 'leito interditado' : 'leitos interditados'}`
                : s.sub

              return (
                <Box
                  key={s.id}
                  onClick={unavailable ? undefined : () => setSector(s.id)}
                  sx={{
                    p: 1.25,
                    border: '1px solid',
                    borderColor: selected ? 'primary.main' : interdicted ? 'error.light' : 'divider',
                    bgcolor: selected ? 'primary.light' : 'background.paper',
                    borderRadius: 1,
                    cursor: unavailable ? 'not-allowed' : 'pointer',
                    opacity: unavailable ? 0.5 : 1,
                    display: 'flex', alignItems: 'center', gap: 1,
                  }}
                >
                  <Box sx={{ width: 10, height: 10, borderRadius: 0.4, bgcolor: s.color }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{s.name}</Typography>
                    <Typography variant="caption" color={summary.blockedBedsCount > 0 ? 'error.main' : 'text.secondary'}>
                      {blockedLabel}
                    </Typography>
                  </Box>
                  <Typography variant="caption">
                    {status}
                  </Typography>
                </Box>
              )
            })}
          </Box>
          {errors.sectorId && (
            <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
              {errors.sectorId}
            </Typography>
          )}

          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth disabled={!selectedSector || !selectedSector.active}>
              <InputLabel>Leito</InputLabel>
              <Select
                label="Leito"
                value={form.bed ?? ''}
                onChange={e => set('bed', String(e.target.value))}
              >
                <MenuItem value="">Sem leito definido</MenuItem>
                {bedOptions.length === 0 && selectedSector ? (
                  <MenuItem value="" disabled>Nenhum leito disponível</MenuItem>
                ) : null}
                {bedOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                {selectedSector ? 'Somente leitos livres aparecem na lista.' : 'Selecione um setor primeiro.'}
              </FormHelperText>
            </FormControl>
          </Box>

          <Box sx={{ mt: 2 }}>
            <TextField
              label="Observações (opcional)"
              multiline minRows={3} fullWidth
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
            />
          </Box>
        </Box>

        <Divider />
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">Ficha de entrada simplificada</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={handleClose} disabled={submitting}>Cancelar</Button>
            <Button variant="contained" onClick={submit} disabled={submitting}>
              {submitting ? 'Salvando…' : mode === 'edit' ? 'Salvar alterações' : 'Salvar ficha'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Drawer>
  )
}

const SectionLabel = ({ n, title }: { n: number; title: string }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
    <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: 'primary.light', color: 'primary.main', fontSize: 11, fontWeight: 600, display: 'grid', placeItems: 'center' }}>
      {n}
    </Box>
    <Typography variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'text.primary' }}>
      {title}
    </Typography>
  </Box>
)
