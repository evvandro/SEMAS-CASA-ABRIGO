import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import AssignmentIcon from '@mui/icons-material/Assignment'
import SaveIcon from '@mui/icons-material/Save'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  createAcolhidoRecord,
  fetchAcolhidoDetail,
  fetchSetores,
  updateAcolhidoRecord,
  type ApiSetor,
} from '../services/acolhidosService'
import type { Acolhido } from '../modules/acolhidos/types'

interface FormData {
  dataEntrada: string
  horaEntrada: string
  setorId: string
  leito: string
  nomeCompleto: string
  cpf: string
  dataNascimento: string
  sexo: string
  telefone: string
  responsavelFamiliar: string
  familiaAcolhidaJunta: string
  pcd: boolean
  gestante: boolean
  cronica: boolean
  idoso: boolean
  motivoAcolhimento: string[]
  observacoesSaude: string
  observacoesGerais: string
  pertencesRegistrados: string
  nomeResponsavelAtendimento: string
  cargoFuncao: string
}

type FieldErrors = Partial<Record<keyof FormData, string>>

const riskOptions = ['Enchente', 'Deslizamento', 'Vendaval', 'Incendio', 'Interdicao de moradia', 'Outro']

const initialFormData: FormData = {
  dataEntrada: '',
  horaEntrada: '',
  setorId: '',
  leito: '',
  nomeCompleto: '',
  cpf: '',
  dataNascimento: '',
  sexo: '',
  telefone: '',
  responsavelFamiliar: '',
  familiaAcolhidaJunta: '',
  pcd: false,
  gestante: false,
  cronica: false,
  idoso: false,
  motivoAcolhimento: [],
  observacoesSaude: '',
  observacoesGerais: '',
  pertencesRegistrados: '',
  nomeResponsavelAtendimento: '',
  cargoFuncao: '',
}

function FormSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, border: '1px solid', borderColor: 'divider' }}>
      <Stack spacing={2.5}>
        <Typography variant="h6">{title}</Typography>
        <Divider />
        {children}
      </Stack>
    </Paper>
  )
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '')
}

function formatCpf(value: string): string {
  const digits = onlyDigits(value).slice(0, 11)

  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

function buildObservacoes(formData: FormData, setorNome?: string): string {
  return [
    formData.horaEntrada ? `Hora da entrada: ${formData.horaEntrada}` : '',
    setorNome ? `Setor selecionado: ${setorNome}` : '',
    formData.responsavelFamiliar ? `Responsavel familiar: ${formData.responsavelFamiliar}` : '',
    formData.familiaAcolhidaJunta ? `Familia acolhida junta: ${formData.familiaAcolhidaJunta}` : '',
    formData.motivoAcolhimento.length ? `Motivo do acolhimento: ${formData.motivoAcolhimento.join(', ')}` : '',
    formData.observacoesSaude ? `Saude declarada: ${formData.observacoesSaude}` : '',
    formData.observacoesGerais ? `Observacoes gerais: ${formData.observacoesGerais}` : '',
    formData.nomeResponsavelAtendimento
      ? `Responsavel pelo atendimento: ${formData.nomeResponsavelAtendimento}${
          formData.cargoFuncao ? ` - ${formData.cargoFuncao}` : ''
        }`
      : '',
  ]
    .filter(Boolean)
    .join('\n')
}

const observationPrefixes = [
  'Hora da entrada',
  'Setor selecionado',
  'Responsavel familiar',
  'Familia acolhida junta',
  'Motivo do acolhimento',
  'Saude declarada',
  'Observacoes gerais',
  'Responsavel pelo atendimento',
]

function getObservationValue(notes: string | null | undefined, label: string): string {
  const prefix = `${label}:`
  const line = (notes ?? '').split(/\r?\n/).find(item => item.trim().startsWith(prefix))

  return line ? line.trim().slice(prefix.length).trim() : ''
}

function hasStructuredObservations(notes: string | null | undefined): boolean {
  return observationPrefixes.some(prefix => getObservationValue(notes, prefix))
}

function getDateInputValue(value?: string | null): string {
  return value?.split('T')[0] ?? ''
}

function normalizeDateInput(value: string): string {
  return value.split('T')[0]
}

function parseResponsibleAttendance(value: string): Pick<FormData, 'nomeResponsavelAtendimento' | 'cargoFuncao'> {
  const [name, ...roleParts] = value.split(' - ')

  return {
    nomeResponsavelAtendimento: name?.trim() ?? '',
    cargoFuncao: roleParts.join(' - ').trim(),
  }
}

function toFormDataFromAcolhido(row: Acolhido): FormData {
  const notes = row.notes ?? ''
  const responsibleAttendance = parseResponsibleAttendance(getObservationValue(notes, 'Responsavel pelo atendimento'))
  const structuredNotes = hasStructuredObservations(notes)
  const motivoAcolhimento = getObservationValue(notes, 'Motivo do acolhimento')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)

  return {
    dataEntrada: getDateInputValue(row.entry),
    horaEntrada: row.entryTime ?? getObservationValue(notes, 'Hora da entrada'),
    setorId: row.sectorId,
    leito: row.bed ?? '',
    nomeCompleto: row.name,
    cpf: formatCpf(row.cpf),
    dataNascimento: getDateInputValue(row.birthDate),
    sexo: row.gender ?? '',
    telefone: row.phone ?? '',
    responsavelFamiliar: getObservationValue(notes, 'Responsavel familiar') || row.familyResponsible || '',
    familiaAcolhidaJunta: getObservationValue(notes, 'Familia acolhida junta'),
    pcd: row.alerts.includes('pcd'),
    gestante: row.alerts.includes('gestante'),
    cronica: row.alerts.includes('cronica'),
    idoso: row.alerts.includes('idoso'),
    motivoAcolhimento,
    observacoesSaude: getObservationValue(notes, 'Saude declarada'),
    observacoesGerais: getObservationValue(notes, 'Observacoes gerais') || (structuredNotes ? '' : notes),
    pertencesRegistrados: row.belongings ?? '',
    nomeResponsavelAtendimento: responsibleAttendance.nomeResponsavelAtendimento,
    cargoFuncao: responsibleAttendance.cargoFuncao,
  }
}

function getErrorMessage(error: unknown): string {
  const response = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response
  const validationErrors = response?.data?.errors
  const firstValidationMessage = validationErrors ? Object.values(validationErrors)[0]?.[0] : undefined

  return firstValidationMessage ?? response?.data?.message ?? 'Nao foi possivel salvar a ficha. Verifique os dados.'
}

export function CadastrosPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [baselineFormData, setBaselineFormData] = useState<FormData>(initialFormData)
  const [sectors, setSectors] = useState<ApiSetor[]>([])
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [loadingSectors, setLoadingSectors] = useState(true)
  const [loadingAcolhido, setLoadingAcolhido] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitMessage, setSubmitMessage] = useState<string | null>(null)
  const editIdParam = searchParams.get('edit')
  const parsedEditId = editIdParam ? Number(editIdParam) : null
  const editId = parsedEditId && Number.isFinite(parsedEditId) && parsedEditId > 0 ? parsedEditId : null
  const isEditing = editId !== null

  useEffect(() => {
    let active = true

    const loadSectors = async () => {
      setLoadingSectors(true)
      setLoadError(null)

      try {
        const data = await fetchSetores()
        if (active) setSectors(data.filter((setor) => setor.ativo))
      } catch {
        if (active) setLoadError('Nao foi possivel carregar os setores.')
      } finally {
        if (active) setLoadingSectors(false)
      }
    }

    void loadSectors()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!editId) {
      setFormData(initialFormData)
      setBaselineFormData(initialFormData)
      setLoadError(null)
      return
    }

    let active = true

    const loadAcolhido = async () => {
      setLoadingAcolhido(true)
      setLoadError(null)
      setSubmitError(null)
      setSubmitMessage(null)

      try {
        const acolhido = await fetchAcolhidoDetail(editId)
        if (!active) return
        const nextFormData = toFormDataFromAcolhido(acolhido)
        setFormData(nextFormData)
        setBaselineFormData(nextFormData)
        setFieldErrors({})
      } catch {
        if (active) setLoadError('Nao foi possivel carregar o cadastro para edicao.')
      } finally {
        if (active) setLoadingAcolhido(false)
      }
    }

    void loadAcolhido()

    return () => {
      active = false
    }
  }, [editId])

  const selectedSetor = useMemo(
    () => sectors.find((setor) => String(setor.id) === formData.setorId),
    [formData.setorId, sectors],
  )

  const setField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
    setSubmitMessage(null)
    setSubmitError(null)
  }

  const handleArrayToggle = (value: string) => {
    setFormData((prev) => {
      const values = prev.motivoAcolhimento
      const nextValues = values.includes(value) ? values.filter((item) => item !== value) : [...values, value]

      return {
        ...prev,
        motivoAcolhimento: nextValues,
      }
    })
    setSubmitMessage(null)
    setSubmitError(null)
  }

  const validate = (): boolean => {
    const errors: FieldErrors = {}

    if (formData.nomeCompleto.trim().length < 3) errors.nomeCompleto = 'Informe o nome completo.'
    if (onlyDigits(formData.cpf).length !== 11) errors.cpf = 'CPF deve ter 11 digitos.'
    if (!formData.dataNascimento) errors.dataNascimento = 'Informe a data de nascimento.'
    if (!formData.dataEntrada) errors.dataEntrada = 'Informe a data de entrada.'
    if (!formData.setorId) errors.setorId = 'Selecione um setor.'

    setFieldErrors(errors)

    return Object.keys(errors).length === 0
  }

  const handleReset = () => {
    setFormData(isEditing ? baselineFormData : initialFormData)
    setFieldErrors({})
    setSubmitError(null)
    setSubmitMessage(null)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitError(null)
    setSubmitMessage(null)

    if (!validate()) return

    setSubmitting(true)

    try {
      const payload = {
        nome: formData.nomeCompleto.trim(),
        cpf: onlyDigits(formData.cpf),
        data_nascimento: normalizeDateInput(formData.dataNascimento),
        setor_id: Number(formData.setorId),
        telefone: formData.telefone.trim() || null,
        genero: formData.sexo || null,
        leito: formData.leito.trim() || null,
        data_entrada: normalizeDateInput(formData.dataEntrada),
        hora_entrada: formData.horaEntrada || null,
        pcd: formData.pcd,
        gestante: formData.gestante,
        cronica: formData.cronica,
        idoso: formData.idoso,
        observacoes: buildObservacoes(formData, selectedSetor?.nome) || null,
        pertences_registrados: formData.pertencesRegistrados.trim() || null,
      }
      const saved = editId
        ? await updateAcolhidoRecord(editId, payload)
        : await createAcolhidoRecord(payload)

      setSubmitMessage(`Ficha de ${saved.name} ${editId ? 'atualizada' : 'salva'} com sucesso.`)
      if (editId) {
        const nextFormData = toFormDataFromAcolhido(saved)
        setFormData(nextFormData)
        setBaselineFormData(nextFormData)
      } else {
        setFormData(initialFormData)
        setBaselineFormData(initialFormData)
      }
      setFieldErrors({})
    } catch (error) {
      setSubmitError(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Stack spacing={3}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3.5 },
          border: '1px solid',
          borderColor: 'divider',
          background: (theme) =>
            `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.14)} 0%, ${alpha(
              theme.palette.secondary.main,
              0.1,
            )} 100%)`,
        }}
      >
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="h4">{isEditing ? 'Editar ficha detalhada' : 'Ficha detalhada de entrada'}</Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                {isEditing ? 'Atualizacao do cadastro completo do acolhido.' : 'Cadastro essencial para acolhimento temporario.'}
              </Typography>
            </Box>
            <Chip
              icon={<AssignmentIcon />}
              label={isEditing ? 'Modo edição' : 'SUAS | Acolhimento provisório'}
              color="primary"
            />
          </Stack>
        </Stack>
      </Paper>

      {loadingAcolhido ? <Alert severity="info">Carregando dados do cadastro...</Alert> : null}
      {loadError ? <Alert severity="error">{loadError}</Alert> : null}
      {submitError ? <Alert severity="error">{submitError}</Alert> : null}
      {submitMessage ? <Alert severity="success">{submitMessage}</Alert> : null}

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <FormSection title="1. Entrada e alocacao">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  required
                  label="Data da entrada"
                  type="date"
                  value={formData.dataEntrada}
                  onChange={(event) => setField('dataEntrada', event.target.value)}
                  error={!!fieldErrors.dataEntrada}
                  helperText={fieldErrors.dataEntrada}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  label="Hora"
                  type="time"
                  value={formData.horaEntrada}
                  onChange={(event) => setField('horaEntrada', event.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth required error={!!fieldErrors.setorId}>
                  <InputLabel>Setor</InputLabel>
                  <Select
                    label="Setor"
                    value={formData.setorId}
                    onChange={(event) => setField('setorId', String(event.target.value))}
                    disabled={loadingSectors}
                  >
                    {sectors.map((setor) => (
                      <MenuItem key={setor.id} value={String(setor.id)}>
                        {setor.nome}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    {fieldErrors.setorId ?? (loadingSectors ? 'Carregando setores...' : ' ')}
                  </FormHelperText>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField
                  fullWidth
                  label="Leito"
                  value={formData.leito}
                  onChange={(event) => setField('leito', event.target.value)}
                />
              </Grid>
            </Grid>
          </FormSection>

          <FormSection title="2. Identificacao da pessoa acolhida">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  required
                  label="Nome completo"
                  value={formData.nomeCompleto}
                  onChange={(event) => setField('nomeCompleto', event.target.value)}
                  error={!!fieldErrors.nomeCompleto}
                  helperText={fieldErrors.nomeCompleto}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  required
                  label="CPF"
                  value={formData.cpf}
                  onChange={(event) => setField('cpf', formatCpf(event.target.value))}
                  error={!!fieldErrors.cpf}
                  helperText={fieldErrors.cpf}
                  slotProps={{ htmlInput: { inputMode: 'numeric' } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  required
                  label="Data de nascimento"
                  type="date"
                  value={formData.dataNascimento}
                  onChange={(event) => setField('dataNascimento', event.target.value)}
                  error={!!fieldErrors.dataNascimento}
                  helperText={fieldErrors.dataNascimento}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>Sexo</InputLabel>
                  <Select label="Sexo" value={formData.sexo} onChange={(event) => setField('sexo', String(event.target.value))}>
                    <MenuItem value="Feminino">Feminino</MenuItem>
                    <MenuItem value="Masculino">Masculino</MenuItem>
                    <MenuItem value="Outro">Outro</MenuItem>
                    <MenuItem value="Nao informado">Nao informado</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Telefone"
                  value={formData.telefone}
                  onChange={(event) => setField('telefone', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Responsavel familiar"
                  value={formData.responsavelFamiliar}
                  onChange={(event) => setField('responsavelFamiliar', event.target.value)}
                />
              </Grid>
            </Grid>
          </FormSection>

          <FormSection title="3. Publico preferencial">
            <FormControl component="fieldset">
              <FormLabel>Marque as condicoes prioritarias</FormLabel>
              <FormGroup row>
                <FormControlLabel
                  control={<Checkbox checked={formData.pcd} onChange={(event) => setField('pcd', event.target.checked)} />}
                  label="PCD"
                />
                <FormControlLabel
                  control={<Checkbox checked={formData.cronica} onChange={(event) => setField('cronica', event.target.checked)} />}
                  label="Doenca cronica"
                />
                <FormControlLabel
                  control={<Checkbox checked={formData.gestante} onChange={(event) => setField('gestante', event.target.checked)} />}
                  label="Gestante"
                />
                <FormControlLabel
                  control={<Checkbox checked={formData.idoso} onChange={(event) => setField('idoso', event.target.checked)} />}
                  label="Idoso 60+"
                />
              </FormGroup>
            </FormControl>
          </FormSection>

          <FormSection title="4. Motivo e saude">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 5 }}>
                <FormControl>
                  <FormLabel>Motivo do acolhimento</FormLabel>
                  <FormGroup>
                    {riskOptions.map((option) => (
                      <FormControlLabel
                        key={option}
                        control={
                          <Checkbox
                            checked={formData.motivoAcolhimento.includes(option)}
                            onChange={() => handleArrayToggle(option)}
                          />
                        }
                        label={option}
                      />
                    ))}
                  </FormGroup>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 7 }}>
                <TextField
                  fullWidth
                  label="Condicoes de saude e encaminhamentos"
                  multiline
                  minRows={6}
                  value={formData.observacoesSaude}
                  onChange={(event) => setField('observacoesSaude', event.target.value)}
                />
              </Grid>
            </Grid>
          </FormSection>

          <FormSection title="5. Responsavel e observacoes">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 5 }}>
                <TextField
                  fullWidth
                  label="Nome do responsavel pelo atendimento"
                  value={formData.nomeResponsavelAtendimento}
                  onChange={(event) => setField('nomeResponsavelAtendimento', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  label="Cargo / funcao"
                  value={formData.cargoFuncao}
                  onChange={(event) => setField('cargoFuncao', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl>
                  <FormLabel>Familia acolhida junta?</FormLabel>
                  <RadioGroup
                    row
                    value={formData.familiaAcolhidaJunta}
                    onChange={(event) => setField('familiaAcolhidaJunta', event.target.value)}
                  >
                    <FormControlLabel value="Sim" control={<Radio />} label="Sim" />
                    <FormControlLabel value="Nao" control={<Radio />} label="Nao" />
                  </RadioGroup>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Observacoes gerais"
                  multiline
                  minRows={4}
                  value={formData.observacoesGerais}
                  onChange={(event) => setField('observacoesGerais', event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Pertences registrados na entrada"
                  multiline
                  minRows={3}
                  value={formData.pertencesRegistrados}
                  onChange={(event) => setField('pertencesRegistrados', event.target.value)}
                />
              </Grid>
            </Grid>
          </FormSection>

          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }}>
              <Box>
                <Typography variant="subtitle1">Ficha detalhada</Typography>
                <Typography variant="body2" color="text.secondary">
                  Revise os dados antes de finalizar o registro.
                </Typography>
              </Box>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button variant="outlined" onClick={handleReset} disabled={submitting}>
                  {isEditing ? 'Restaurar dados' : 'Limpar formulario'}
                </Button>
                {isEditing ? (
                  <Button variant="text" onClick={() => navigate('/acolhidos')} disabled={submitting}>
                    Voltar
                  </Button>
                ) : null}
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={submitting ? <CircularProgress color="inherit" size={18} /> : <SaveIcon />}
                  disabled={submitting || loadingSectors || loadingAcolhido || !!loadError}
                >
                  {submitting ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Salvar ficha'}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Stack>
      </Box>
    </Stack>
  )
}
