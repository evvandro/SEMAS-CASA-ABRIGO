import { useState, useEffect, useRef } from 'react'
import {
  Drawer, Box, Typography, IconButton, TextField, Button, Divider,
  FormControlLabel, Checkbox,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { SECTORS } from '../data/sectors'
import { cadastroSchema } from '../schemas/cadastroSchema'
import type { CadastroPayload } from '../types'
import { formatCpf, formatDateInput } from '../utils/formFormatters'

const empty: CadastroPayload = {
  name: '', cpf: '', birth: '', family: 1,
  pcd: false, gestante: false, cronica: false, idoso: false,
  sectorId: '', notes: '',
}

export function CadastroDrawer({ open, onClose, onSave }: {
  open: boolean
  onClose: () => void
  onSave: (payload: CadastroPayload) => void | Promise<void>
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

  const submit = async () => {
    const result = cadastroSchema.safeParse(form)
    if (!result.success) {
      const errs: Record<string, string> = {}
      result.error.issues.forEach(i => { if (i.path[0]) errs[i.path[0] as string] = i.message })
      setErrors(errs)
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
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Novo Cadastro</Typography>
            <Typography variant="caption">Ficha de Entrada · preencha o essencial, complemente depois</Typography>
          </Box>
          <IconButton onClick={handleClose}><CloseIcon /></IconButton>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
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
            <Box sx={{ gridColumn: 'span 6' }}>
              <TextField
                label="Pessoas na família"
                type="number"
                fullWidth
                value={form.family}
                onChange={e => set('family', Number(e.target.value))}
                slotProps={{ htmlInput: { min: 1, max: 20 } }}
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
            {SECTORS.map(s => {
              const full = s.occupied >= s.capacity
              const active = form.sectorId === s.id
              return (
                <Box
                  key={s.id}
                  onClick={full ? undefined : () => set('sectorId', s.id)}
                  sx={{
                    p: 1.25,
                    border: '1px solid',
                    borderColor: active ? 'primary.main' : 'divider',
                    bgcolor: active ? 'primary.light' : 'background.paper',
                    borderRadius: 1,
                    cursor: full ? 'not-allowed' : 'pointer',
                    opacity: full ? 0.5 : 1,
                    display: 'flex', alignItems: 'center', gap: 1,
                  }}
                >
                  <Box sx={{ width: 10, height: 10, borderRadius: 0.4, bgcolor: s.color }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{s.name}</Typography>
                    <Typography variant="caption">{s.sub}</Typography>
                  </Box>
                  <Typography variant="caption">
                    {full ? 'Lotado' : `${s.occupied}/${s.capacity}`}
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
          <Typography variant="caption">Esc para cancelar · ⌘ Enter para salvar</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={handleClose} disabled={submitting}>Cancelar</Button>
            <Button variant="contained" onClick={submit} disabled={submitting}>
              {submitting ? 'Salvando…' : 'Salvar ficha'}
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
