import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
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
import { SectionNavigation } from '../components/SectionNavigation'

interface FamilyMember {
  nome: string
  parentesco: string
}

interface FormData {
  nomeAbrigo: string
  enderecoAbrigo: string
  municipioUf: string
  dataAbertura: string
  orgaoGestor: string
  coordenacaoAbrigo: string
  prontuarioSuas: string
  registroIndividual: string
  dataEntrada: string
  horaEntrada: string
  formaAcesso: string
  outraFormaAcesso: string
  nomeCompleto: string
  nomeSocial: string
  nis: string
  cpf: string
  rg: string
  dataNascimento: string
  idade: string
  sexo: string
  telefone: string
  responsavelFamiliar: string
  familiaAcolhidaJunta: string
  composicaoFamiliar: FamilyMember[]
  enderecoOrigem: string
  bairroComunidade: string
  municipioOrigem: string
  area: string
  motivoAcolhimento: string[]
  outroMotivo: string
  descricaoMotivo: string
  vulnerabilidades: string[]
  detalhamentoVulnerabilidades: string
  usaMedicamentos: string
  medicamentos: string
  alergias: string
  atendimentoImediato: string
  encaminhadoSaude: string
  inscritoCadUnico: string
  beneficios: string
  pertencesRegistrados: string
  setorSala: string
  leito: string
  nomeResponsavelAtendimento: string
  cargoFuncao: string
  assinaturaCarimbo: string
  dataAtendimento: string
}

const accessOptions = [
  'Demanda espontanea',
  'Encaminhamento CRAS',
  'Encaminhamento CREAS',
  'Encaminhamento Defesa Civil',
  'Outro',
]

const riskOptions = ['Enchente', 'Deslizamento', 'Vendaval', 'Incendio', 'Interdicao de moradia', 'Outro']

const vulnerabilityOptions = [
  'Crianca',
  'Adolescente',
  'Idoso',
  'Pessoa com deficiencia',
  'Gestante',
  'Lactante',
  'Mobilidade reduzida',
  'Doenca cronica',
]

const initialFormData: FormData = {
  nomeAbrigo: '',
  enderecoAbrigo: '',
  municipioUf: '',
  dataAbertura: '',
  orgaoGestor: '',
  coordenacaoAbrigo: '',
  prontuarioSuas: '',
  registroIndividual: '',
  dataEntrada: '',
  horaEntrada: '',
  formaAcesso: '',
  outraFormaAcesso: '',
  nomeCompleto: '',
  nomeSocial: '',
  nis: '',
  cpf: '',
  rg: '',
  dataNascimento: '',
  idade: '',
  sexo: '',
  telefone: '',
  responsavelFamiliar: '',
  familiaAcolhidaJunta: '',
  composicaoFamiliar: [
    { nome: '', parentesco: '' },
    { nome: '', parentesco: '' },
    { nome: '', parentesco: '' },
  ],
  enderecoOrigem: '',
  bairroComunidade: '',
  municipioOrigem: '',
  area: '',
  motivoAcolhimento: [],
  outroMotivo: '',
  descricaoMotivo: '',
  vulnerabilidades: [],
  detalhamentoVulnerabilidades: '',
  usaMedicamentos: '',
  medicamentos: '',
  alergias: '',
  atendimentoImediato: '',
  encaminhadoSaude: '',
  inscritoCadUnico: '',
  beneficios: '',
  pertencesRegistrados: '',
  setorSala: '',
  leito: '',
  nomeResponsavelAtendimento: '',
  cargoFuncao: '',
  assinaturaCarimbo: '',
  dataAtendimento: '',
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, border: '1px solid', borderColor: 'divider' }}>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="h6">{title}</Typography>
          {description ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {description}
            </Typography>
          ) : null}
        </Box>
        <Divider />
        {children}
      </Stack>
    </Paper>
  )
}

export function CadastrosPage() {
  const [formData, setFormData] = useState<FormData>(initialFormData)

  const handleTextChange =
    (field: keyof FormData) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: event.target.value,
      }))
    }

  const handleSelectChange =
    (field: keyof FormData) => (event: React.ChangeEvent<HTMLInputElement> | { target: { value: unknown } }) => {
      setFormData((prev) => ({
        ...prev,
        [field]: String(event.target.value),
      }))
    }

  const handleArrayToggle = (field: 'motivoAcolhimento' | 'vulnerabilidades', value: string) => {
    setFormData((prev) => {
      const values = prev[field]
      const nextValues = values.includes(value) ? values.filter((item) => item !== value) : [...values, value]

      return {
        ...prev,
        [field]: nextValues,
      }
    })
  }

  const handleFamilyMemberChange =
    (index: number, field: keyof FamilyMember) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        composicaoFamiliar: prev.composicaoFamiliar.map((member, memberIndex) =>
          memberIndex === index
            ? {
                ...member,
                [field]: event.target.value,
              }
            : member,
        ),
      }))
    }

  const handleReset = () => {
    setFormData(initialFormData)
  }

  return (
    <Stack spacing={3}>
      <SectionNavigation sticky />

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
              <Typography variant="h4">Cadastros - Ficha de entrada</Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Formulario inspirado no documento de entrada do abrigo temporario para situacoes de
                emergencia e calamidade publica.
              </Typography>
            </Box>
            <Chip icon={<AssignmentIcon />} label="SUAS | Acolhimento provisiorio" color="primary" />
          </Stack>

          <Alert severity="info" sx={{ alignItems: 'center' }}>
            Estruturei os formularios com base no documento enviado e mantive o padrao visual das demais paginas.
          </Alert>
        </Stack>
      </Paper>

      <Box component="form">
        <Stack spacing={3}>
          <FormSection title="1. Identificacao do abrigo">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth label="Nome do abrigo" value={formData.nomeAbrigo} onChange={handleTextChange('nomeAbrigo')} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Endereco"
                  value={formData.enderecoAbrigo}
                  onChange={handleTextChange('enderecoAbrigo')}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth label="Municipio / UF" value={formData.municipioUf} onChange={handleTextChange('municipioUf')} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Data de abertura"
                  type="date"
                  value={formData.dataAbertura}
                  onChange={handleTextChange('dataAbertura')}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Coordenacao do abrigo"
                  value={formData.coordenacaoAbrigo}
                  onChange={handleTextChange('coordenacaoAbrigo')}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Orgao gestor da assistencia social"
                  value={formData.orgaoGestor}
                  onChange={handleTextChange('orgaoGestor')}
                />
              </Grid>
            </Grid>
          </FormSection>

          <FormSection title="2. Dados do registro SUAS">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth label="N de prontuario SUAS" value={formData.prontuarioSuas} onChange={handleTextChange('prontuarioSuas')} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="N de registro individual"
                  value={formData.registroIndividual}
                  onChange={handleTextChange('registroIndividual')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  fullWidth
                  label="Data da entrada"
                  type="date"
                  value={formData.dataEntrada}
                  onChange={handleTextChange('dataEntrada')}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  fullWidth
                  label="Hora"
                  type="time"
                  value={formData.horaEntrada}
                  onChange={handleTextChange('horaEntrada')}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
            </Grid>

            <FormControl>
              <FormLabel>Forma de acesso</FormLabel>
              <RadioGroup value={formData.formaAcesso} onChange={handleSelectChange('formaAcesso')}>
                {accessOptions.map((option) => (
                  <FormControlLabel key={option} value={option} control={<Radio />} label={option} />
                ))}
              </RadioGroup>
            </FormControl>

            {formData.formaAcesso === 'Outro' ? (
              <TextField
                fullWidth
                label="Qual outra forma de acesso?"
                value={formData.outraFormaAcesso}
                onChange={handleTextChange('outraFormaAcesso')}
              />
            ) : null}
          </FormSection>

          <FormSection title="3. Identificacao da pessoa acolhida">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth label="Nome completo" value={formData.nomeCompleto} onChange={handleTextChange('nomeCompleto')} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth label="Nome social" value={formData.nomeSocial} onChange={handleTextChange('nomeSocial')} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth label="NIS" value={formData.nis} onChange={handleTextChange('nis')} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth label="CPF" value={formData.cpf} onChange={handleTextChange('cpf')} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth label="RG" value={formData.rg} onChange={handleTextChange('rg')} />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  label="Data de nascimento"
                  type="date"
                  value={formData.dataNascimento}
                  onChange={handleTextChange('dataNascimento')}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField fullWidth label="Idade" value={formData.idade} onChange={handleTextChange('idade')} />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <FormControl fullWidth>
                  <InputLabel>Sexo</InputLabel>
                  <Select label="Sexo" value={formData.sexo} onChange={handleSelectChange('sexo')}>
                    <MenuItem value="Feminino">Feminino</MenuItem>
                    <MenuItem value="Masculino">Masculino</MenuItem>
                    <MenuItem value="Outro">Outro</MenuItem>
                    <MenuItem value="Nao informado">Nao informado</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth label="Telefone" value={formData.telefone} onChange={handleTextChange('telefone')} />
              </Grid>
            </Grid>
          </FormSection>

          <FormSection title="4. Referencia familiar" description="Campos previstos no documento para vinculo e composicao familiar.">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 8 }}>
                <TextField
                  fullWidth
                  label="Responsavel familiar"
                  value={formData.responsavelFamiliar}
                  onChange={handleTextChange('responsavelFamiliar')}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl>
                  <FormLabel>Familia esta acolhida junta?</FormLabel>
                  <RadioGroup row value={formData.familiaAcolhidaJunta} onChange={handleSelectChange('familiaAcolhidaJunta')}>
                    <FormControlLabel value="Sim" control={<Radio />} label="Sim" />
                    <FormControlLabel value="Nao" control={<Radio />} label="Nao" />
                  </RadioGroup>
                </FormControl>
              </Grid>
            </Grid>

            <Stack spacing={2}>
              <Typography variant="subtitle2">Composicao familiar no abrigo</Typography>
              {formData.composicaoFamiliar.map((member, index) => (
                <Grid container spacing={2} key={`membro-${index}`}>
                  <Grid size={{ xs: 12, md: 8 }}>
                    <TextField
                      fullWidth
                      label={`Nome do membro ${index + 1}`}
                      value={member.nome}
                      onChange={handleFamilyMemberChange(index, 'nome')}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Parentesco"
                      value={member.parentesco}
                      onChange={handleFamilyMemberChange(index, 'parentesco')}
                    />
                  </Grid>
                </Grid>
              ))}
            </Stack>
          </FormSection>

          <FormSection title="5. Endereco de origem">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 5 }}>
                <TextField
                  fullWidth
                  label="Endereco"
                  value={formData.enderecoOrigem}
                  onChange={handleTextChange('enderecoOrigem')}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  label="Bairro / comunidade"
                  value={formData.bairroComunidade}
                  onChange={handleTextChange('bairroComunidade')}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField
                  fullWidth
                  label="Municipio"
                  value={formData.municipioOrigem}
                  onChange={handleTextChange('municipioOrigem')}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <FormControl>
                  <FormLabel>Area</FormLabel>
                  <RadioGroup row value={formData.area} onChange={handleSelectChange('area')}>
                    <FormControlLabel value="Urbana" control={<Radio />} label="Urbana" />
                    <FormControlLabel value="Rural" control={<Radio />} label="Rural" />
                  </RadioGroup>
                </FormControl>
              </Grid>
            </Grid>
          </FormSection>

          <FormSection title="6. Situacao de risco / motivo do acolhimento">
            <FormControl>
              <FormLabel>Marque os motivos principais</FormLabel>
              <FormGroup>
                {riskOptions.map((option) => (
                  <FormControlLabel
                    key={option}
                    control={
                      <Checkbox
                        checked={formData.motivoAcolhimento.includes(option)}
                        onChange={() => handleArrayToggle('motivoAcolhimento', option)}
                      />
                    }
                    label={option}
                  />
                ))}
              </FormGroup>
            </FormControl>

            {formData.motivoAcolhimento.includes('Outro') ? (
              <TextField fullWidth label="Outro motivo" value={formData.outroMotivo} onChange={handleTextChange('outroMotivo')} />
            ) : null}

            <TextField
              fullWidth
              label="Descricao"
              multiline
              minRows={4}
              value={formData.descricaoMotivo}
              onChange={handleTextChange('descricaoMotivo')}
            />
          </FormSection>

          <FormSection title="7. Publicos prioritarios e vulnerabilidades">
            <FormControl>
              <FormLabel>Marque os perfis e vulnerabilidades</FormLabel>
              <FormGroup>
                {vulnerabilityOptions.map((option) => (
                  <FormControlLabel
                    key={option}
                    control={
                      <Checkbox
                        checked={formData.vulnerabilidades.includes(option)}
                        onChange={() => handleArrayToggle('vulnerabilidades', option)}
                      />
                    }
                    label={option}
                  />
                ))}
              </FormGroup>
            </FormControl>

            <TextField
              fullWidth
              label="Detalhamento"
              multiline
              minRows={4}
              value={formData.detalhamentoVulnerabilidades}
              onChange={handleTextChange('detalhamentoVulnerabilidades')}
            />
          </FormSection>

          <FormSection title="8. Condicoes de saude declaradas">
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl>
                  <FormLabel>Uso continuo de medicamentos?</FormLabel>
                  <RadioGroup value={formData.usaMedicamentos} onChange={handleSelectChange('usaMedicamentos')}>
                    <FormControlLabel value="Nao" control={<Radio />} label="Nao" />
                    <FormControlLabel value="Sim" control={<Radio />} label="Sim" />
                  </RadioGroup>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <TextField
                  fullWidth
                  label="Quais medicamentos?"
                  value={formData.medicamentos}
                  onChange={handleTextChange('medicamentos')}
                  disabled={formData.usaMedicamentos !== 'Sim'}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth label="Alergias" value={formData.alergias} onChange={handleTextChange('alergias')} />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <FormControl>
                  <FormLabel>Necessita atendimento imediato?</FormLabel>
                  <RadioGroup value={formData.atendimentoImediato} onChange={handleSelectChange('atendimentoImediato')}>
                    <FormControlLabel value="Sim" control={<Radio />} label="Sim" />
                    <FormControlLabel value="Nao" control={<Radio />} label="Nao" />
                  </RadioGroup>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <FormControl>
                  <FormLabel>Encaminhado para saude?</FormLabel>
                  <RadioGroup value={formData.encaminhadoSaude} onChange={handleSelectChange('encaminhadoSaude')}>
                    <FormControlLabel value="Sim" control={<Radio />} label="Sim" />
                    <FormControlLabel value="Nao" control={<Radio />} label="Nao" />
                  </RadioGroup>
                </FormControl>
              </Grid>
            </Grid>
          </FormSection>

          <FormSection title="9. CadUnico e beneficios">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 5 }}>
                <FormControl>
                  <FormLabel>Inscrito no Cadastro Unico?</FormLabel>
                  <RadioGroup row value={formData.inscritoCadUnico} onChange={handleSelectChange('inscritoCadUnico')}>
                    <FormControlLabel value="Sim" control={<Radio />} label="Sim" />
                    <FormControlLabel value="Nao" control={<Radio />} label="Nao" />
                    <FormControlLabel value="Nao sabe" control={<Radio />} label="Nao sabe" />
                  </RadioGroup>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 7 }}>
                <TextField fullWidth label="Beneficios recebidos" value={formData.beneficios} onChange={handleTextChange('beneficios')} />
              </Grid>
            </Grid>
          </FormSection>

          <FormSection title="10. Pertences registrados">
            <TextField
              fullWidth
              label="Descricao dos pertences"
              multiline
              minRows={5}
              value={formData.pertencesRegistrados}
              onChange={handleTextChange('pertencesRegistrados')}
            />
          </FormSection>

          <FormSection title="11. Alocacao no abrigo">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 8 }}>
                <TextField fullWidth label="Setor / sala (por cor)" value={formData.setorSala} onChange={handleTextChange('setorSala')} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth label="Leito" value={formData.leito} onChange={handleTextChange('leito')} />
              </Grid>
            </Grid>
          </FormSection>

          <FormSection title="12. Responsavel pelo atendimento">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Nome do responsavel"
                  value={formData.nomeResponsavelAtendimento}
                  onChange={handleTextChange('nomeResponsavelAtendimento')}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth label="Cargo / funcao" value={formData.cargoFuncao} onChange={handleTextChange('cargoFuncao')} />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField
                  fullWidth
                  label="Data"
                  type="date"
                  value={formData.dataAtendimento}
                  onChange={handleTextChange('dataAtendimento')}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Assinatura com carimbo"
                  value={formData.assinaturaCarimbo}
                  onChange={handleTextChange('assinaturaCarimbo')}
                />
              </Grid>
            </Grid>
          </FormSection>

          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }}>
              <Box>
                <Typography variant="subtitle1">Cadastro pronto para evoluir</Typography>
                <Typography variant="body2" color="text.secondary">
                  A estrutura visual ja esta pronta para depois conectar com validacao, API e persistencia real.
                </Typography>
              </Box>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button variant="outlined" onClick={handleReset}>
                  Limpar formulario
                </Button>
                <Button variant="contained" startIcon={<SaveIcon />}>
                  Salvar cadastro
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Stack>
      </Box>
    </Stack>
  )
}
