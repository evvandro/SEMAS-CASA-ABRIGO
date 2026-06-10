import { useState, useEffect, useRef } from 'react'
import {
  Drawer, Box, Typography, IconButton, TextField, Button, Divider,
  FormControlLabel, Checkbox, Radio, RadioGroup, FormControl
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import { TimeInput } from '../../../components/TimeInput'
import { saidaSchema } from '../schemas/saidaSchema'
import type { SaidaPayload, Acolhido, Familia } from '../types'
import { formatDateInput } from '../utils/formFormatters'

const empty: SaidaPayload = {
  abrigoNome: '', abrigoMunicipio: '', abrigoGestor: '',
  prontuario: '', registroIndividual: '', nome: '', cpfRg: '', responsavelFamiliar: '',
  integrantes: [],
  data: '', hora: '', tipoDesligamento: '', tipoDesligamentoOutro: '',
  destinoInformado: '', destinoEndereco: '', destinoMunicipio: '', destinoTelefone: '',
  encaminhamentos: [], encaminhamentoOutro: '', encaminhamentoResumo: '',
  condicoesNaSaida: '', condicoesObservacoes: '',
  responsavelNome: '', responsavelCargo: '', responsavelData: ''
}

export function SaidaDrawer({ open, onClose, onSave, initialRow = null, initialFamily = null }: {
  open: boolean
  onClose: () => void
  onSave: (payload: SaidaPayload) => void | Promise<void>
  initialRow?: Acolhido | null
  initialFamily?: Familia | null
}) {
  const [form, setForm] = useState<SaidaPayload>(empty)
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
    if (initialFamily) {
      setForm(f => ({
        ...f,
        prontuario: initialFamily.codigo,
        nome: initialFamily.responsavelNome ?? initialFamily.codigo,
        cpfRg: initialFamily.codigo,
        responsavelFamiliar: initialFamily.responsavelNome ?? '',
        integrantes: initialFamily.membros?.map(membro => ({ nome: membro.name, documento: membro.cpf })) ?? [],
        data: new Date().toLocaleDateString('pt-BR'),
        responsavelData: new Date().toLocaleDateString('pt-BR'),
      }))
    } else if (initialRow) {
      setForm(f => ({
        ...f,
        prontuario: initialRow.familyCode ?? '',
        registroIndividual: initialRow.id,
        nome: initialRow.name,
        cpfRg: initialRow.cpf,
        responsavelFamiliar: initialRow.familyResponsible ?? '',
        data: new Date().toLocaleDateString('pt-BR'),
        responsavelData: new Date().toLocaleDateString('pt-BR'),
      }))
    } else {
      setForm(empty)
    }
    setErrors({})
  }, [initialFamily, initialRow, open])

  const resetForm = () => {
    setForm(empty)
    setErrors({})
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const set = <K extends keyof SaidaPayload>(k: K, v: SaidaPayload[K]) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: '' }))
  }

  const handleEncaminhamentoChange = (val: string, checked: boolean) => {
    let curr = [...form.encaminhamentos]
    if (checked) curr.push(val)
    else curr = curr.filter(x => x !== val)
    set('encaminhamentos', curr)
  }

  const submit = async () => {
    const result = saidaSchema.safeParse(form)
    if (!result.success) {
      const errs: Record<string, string> = {}
      result.error.issues.forEach(i => {
        if (i.path.length > 0) {
           const path = i.path.join('.')
           errs[path] = i.message
        }
      })
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
      slotProps={{ paper: { sx: { width: { xs: '100vw', sm: 600 } } } }}
    >
      <Box onKeyDown={onKeyDown} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Registro de Saída</Typography>
            <Typography variant="caption">Desligamento e saída do abrigo</Typography>
          </Box>
          <IconButton onClick={handleClose}><CloseIcon /></IconButton>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
          <SectionLabel n={1} title="Identificação do Abrigo" />
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 1.5, mb: 3 }}>
            <Box sx={{ gridColumn: 'span 12' }}>
              <TextField inputRef={firstRef} label="Nome do Abrigo *" fullWidth value={form.abrigoNome} onChange={e => set('abrigoNome', e.target.value)} error={!!errors.abrigoNome} helperText={errors.abrigoNome} />
            </Box>
            <Box sx={{ gridColumn: 'span 6' }}>
              <TextField label="Município/UF *" fullWidth value={form.abrigoMunicipio} onChange={e => set('abrigoMunicipio', e.target.value)} error={!!errors.abrigoMunicipio} helperText={errors.abrigoMunicipio} />
            </Box>
            <Box sx={{ gridColumn: 'span 6' }}>
              <TextField label="Órgão Gestor *" fullWidth value={form.abrigoGestor} onChange={e => set('abrigoGestor', e.target.value)} error={!!errors.abrigoGestor} helperText={errors.abrigoGestor} />
            </Box>
          </Box>

          <SectionLabel n={2} title="Identificação do Acolhido / Família" />
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 1.5, mb: 2 }}>
            <Box sx={{ gridColumn: 'span 6' }}>
              <TextField label="Nº de Prontuário SUAS" fullWidth value={form.prontuario} onChange={e => set('prontuario', e.target.value)} />
            </Box>
            <Box sx={{ gridColumn: 'span 6' }}>
              <TextField label="Nº de Registro Individual" fullWidth value={form.registroIndividual} onChange={e => set('registroIndividual', e.target.value)} />
            </Box>
            <Box sx={{ gridColumn: 'span 12' }}>
              <TextField label="Nome Completo *" fullWidth value={form.nome} onChange={e => set('nome', e.target.value)} error={!!errors.nome} helperText={errors.nome} />
            </Box>
            <Box sx={{ gridColumn: 'span 6' }}>
              <TextField label="CPF / RG *" fullWidth value={form.cpfRg} onChange={e => set('cpfRg', e.target.value)} error={!!errors.cpfRg} helperText={errors.cpfRg} />
            </Box>
            <Box sx={{ gridColumn: 'span 6' }}>
              <TextField label="Responsável Familiar" fullWidth value={form.responsavelFamiliar} onChange={e => set('responsavelFamiliar', e.target.value)} />
            </Box>
          </Box>

          <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>Demais integrantes desacolhidos:</Typography>
          {form.integrantes.map((int, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField size="small" label="Nome" fullWidth value={int.nome} onChange={e => {
                const arr = [...form.integrantes]; arr[i].nome = e.target.value; set('integrantes', arr)
              }} />
              <TextField size="small" label="Documento" fullWidth value={int.documento} onChange={e => {
                const arr = [...form.integrantes]; arr[i].documento = e.target.value; set('integrantes', arr)
              }} />
              <IconButton size="small" onClick={() => set('integrantes', form.integrantes.filter((_, idx) => idx !== i))}><DeleteIcon fontSize="small" /></IconButton>
            </Box>
          ))}
          <Button size="small" startIcon={<AddIcon />} onClick={() => set('integrantes', [...form.integrantes, {nome: '', documento: ''}])} sx={{ mb: 3 }}>
            Adicionar integrante (max 5)
          </Button>

          <SectionLabel n={3} title="Registro de Saída" />
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 1.5, mb: 2 }}>
            <Box sx={{ gridColumn: 'span 6' }}>
              <TextField label="Data *" fullWidth placeholder="DD/MM/AAAA" value={form.data} onChange={e => set('data', formatDateInput(e.target.value))} error={!!errors.data} helperText={errors.data} />
            </Box>
            <Box sx={{ gridColumn: 'span 6' }}>
              <TimeInput label="Hora" required value={form.hora} onChange={value => set('hora', value)} error={!!errors.hora} helperText={errors.hora} />
            </Box>
          </Box>
          <FormControl fullWidth error={!!errors.tipoDesligamento} sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ mb: 0.5 }}>Tipo de desligamento *</Typography>
            <RadioGroup value={form.tipoDesligamento} onChange={e => set('tipoDesligamento', e.target.value)}>
              <FormControlLabel value="Retorno para residência" control={<Radio size="small"/>} label="Retorno para residência" />
              <FormControlLabel value="Retorno para família" control={<Radio size="small"/>} label="Retorno para família" />
              <FormControlLabel value="Encaminhamento para outro abrigo" control={<Radio size="small"/>} label="Encaminhamento para outro abrigo" />
              <FormControlLabel value="Encaminhamento para acolhimento institucional" control={<Radio size="small"/>} label="Encaminhamento para acolhimento institucional" />
              <FormControlLabel value="Encaminhamento para unidade de saúde" control={<Radio size="small"/>} label="Encaminhamento para unidade de saúde" />
              <FormControlLabel value="Mudança de município" control={<Radio size="small"/>} label="Mudança de município" />
              <FormControlLabel value="Outro" control={<Radio size="small"/>} label="Outro" />
            </RadioGroup>
            {form.tipoDesligamento === 'Outro' && (
              <TextField size="small" sx={{ mt: 1 }} label="Qual outro?" fullWidth value={form.tipoDesligamentoOutro} onChange={e => set('tipoDesligamentoOutro', e.target.value)} />
            )}
            {errors.tipoDesligamento && <Typography variant="caption" color="error">{errors.tipoDesligamento}</Typography>}
          </FormControl>


          <SectionLabel n={4} title="Destino" />
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 1.5, mb: 3 }}>
            <Box sx={{ gridColumn: 'span 12' }}>
              <TextField label="Destino informado *" fullWidth value={form.destinoInformado} onChange={e => set('destinoInformado', e.target.value)} error={!!errors.destinoInformado} helperText={errors.destinoInformado} />
            </Box>
            <Box sx={{ gridColumn: 'span 12' }}>
              <TextField label="Endereço *" fullWidth value={form.destinoEndereco} onChange={e => set('destinoEndereco', e.target.value)} error={!!errors.destinoEndereco} helperText={errors.destinoEndereco} />
            </Box>
            <Box sx={{ gridColumn: 'span 6' }}>
              <TextField label="Município *" fullWidth value={form.destinoMunicipio} onChange={e => set('destinoMunicipio', e.target.value)} error={!!errors.destinoMunicipio} helperText={errors.destinoMunicipio} />
            </Box>
            <Box sx={{ gridColumn: 'span 6' }}>
              <TextField label="Telefone" fullWidth value={form.destinoTelefone} onChange={e => set('destinoTelefone', e.target.value)} />
            </Box>
          </Box>


          <SectionLabel n={5} title="Encaminhamentos Socioassistenciais" />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1 }}>
            {['CRAS', 'CREAS', 'Cadastro Único', 'Benefícios eventuais', 'Defesa Civil', 'Saúde', 'Outro serviço'].map(opt => (
              <FormControlLabel key={opt} control={
                <Checkbox size="small" checked={form.encaminhamentos.includes(opt)} onChange={e => handleEncaminhamentoChange(opt, e.target.checked)} />
              } label={opt} />
            ))}
            {form.encaminhamentos.includes('Outro serviço') && (
              <TextField size="small" sx={{ mt: 1 }} label="Qual outro serviço?" fullWidth value={form.encaminhamentoOutro} onChange={e => set('encaminhamentoOutro', e.target.value)} />
            )}
          </Box>
          <TextField sx={{ mt: 1, mb: 3 }} label="Resumo do encaminhamento" multiline minRows={2} fullWidth value={form.encaminhamentoResumo} onChange={e => set('encaminhamentoResumo', e.target.value)} />

          <SectionLabel n={6} title="Condições na Saída" />
          <FormControl fullWidth error={!!errors.condicoesNaSaida} sx={{ mb: 1 }}>
            <RadioGroup row value={form.condicoesNaSaida} onChange={e => set('condicoesNaSaida', e.target.value)}>
              <FormControlLabel value="Situação regularizada" control={<Radio size="small"/>} label="Situação regularizada" />
              <FormControlLabel value="Ainda em vulnerabilidade" control={<Radio size="small"/>} label="Ainda em vulnerabilidade" />
              <FormControlLabel value="Necessita acompanhamento da rede" control={<Radio size="small"/>} label="Necessita acompanhamento da rede" />
            </RadioGroup>
            {errors.condicoesNaSaida && <Typography variant="caption" color="error">{errors.condicoesNaSaida}</Typography>}
          </FormControl>
          <TextField sx={{ mt: 1, mb: 3 }} label="Observações técnicas" multiline minRows={2} fullWidth value={form.condicoesObservacoes} onChange={e => set('condicoesObservacoes', e.target.value)} />


          <SectionLabel n={7} title="Responsável pelo Desligamento" />
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 1.5, mb: 2 }}>
             <Box sx={{ gridColumn: 'span 6' }}>
              <TextField label="Nome *" fullWidth value={form.responsavelNome} onChange={e => set('responsavelNome', e.target.value)} error={!!errors.responsavelNome} helperText={errors.responsavelNome} />
            </Box>
            <Box sx={{ gridColumn: 'span 6' }}>
              <TextField label="Cargo/Função *" fullWidth value={form.responsavelCargo} onChange={e => set('responsavelCargo', e.target.value)} error={!!errors.responsavelCargo} helperText={errors.responsavelCargo} />
            </Box>
             <Box sx={{ gridColumn: 'span 12' }}>
              <TextField label="Data *" fullWidth placeholder="DD/MM/AAAA" value={form.responsavelData} onChange={e => set('responsavelData', formatDateInput(e.target.value))} error={!!errors.responsavelData} helperText={errors.responsavelData} />
            </Box>
          </Box>

        </Box>

        <Divider />
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">Ficha de saída formal (SUAS)</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={handleClose} disabled={submitting}>Cancelar</Button>
            <Button variant="contained" color="warning" onClick={submit} disabled={submitting}>
              {submitting ? 'Salvando…' : 'Finalizar Saída'}
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
