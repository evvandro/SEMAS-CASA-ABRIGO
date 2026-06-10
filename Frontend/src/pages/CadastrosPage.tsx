import { useEffect, useMemo, useState } from 'react';
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
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SaveIcon from '@mui/icons-material/Save';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { TimeInput } from '../components/TimeInput';
import {
  createAcolhidoRecord,
  fetchAcolhidos,
  fetchAcolhidoDetail,
  fetchSetores,
  updateAcolhidoRecord,
  type ApiSetor,
} from '../services/acolhidosService';
import { createFamilia } from '../services/familiasService';
import type { Acolhido } from '../modules/acolhidos/types';
import { buildBedOptions } from '../modules/acolhidos/utils/sectorCapacity';

interface FormData {
  dataEntrada: string;
  horaEntrada: string;
  setorId: string;
  leito: string;
  nomeCompleto: string;
  cpf: string;
  dataNascimento: string;
  sexo: string;
  telefone: string;
  responsavelFamiliar: string;
  pcd: boolean;
  gestante: boolean;
  cronica: boolean;
  idoso: boolean;
  motivoAcolhimento: string[];
  observacoesSaude: string;
  observacoesGerais: string;
  pertencesRegistrados: string;
  nomeResponsavelAtendimento: string;
  cargoFuncao: string;
}

type FieldErrors = Partial<Record<keyof FormData, string>>;
type EntryMode = 'individual' | 'familia';

interface FamilyMemberForm {
  id: string;
  nomeCompleto: string;
  cpf: string;
  dataNascimento: string;
  sexo: string;
  telefone: string;
  leito: string;
  parentesco: string;
  pcd: boolean;
  gestante: boolean;
  cronica: boolean;
  idoso: boolean;
  observacoesGerais: string;
  pertencesRegistrados: string;
}

const riskOptions = [
  'Enchente',
  'Deslizamento',
  'Vendaval',
  'Incêndio',
  'Interdição de moradia',
  'Outro',
];

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
};

const createFamilyMember = (): FamilyMemberForm => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  nomeCompleto: '',
  cpf: '',
  dataNascimento: '',
  sexo: '',
  telefone: '',
  leito: '',
  parentesco: '',
  pcd: false,
  gestante: false,
  cronica: false,
  idoso: false,
  observacoesGerais: '',
  pertencesRegistrados: '',
});

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Paper
      elevation={0}
      sx={{ p: { xs: 2, md: 3 }, border: '1px solid', borderColor: 'divider' }}
    >
      <Stack spacing={2.5}>
        <Typography variant="h6">{title}</Typography>
        <Divider />
        {children}
      </Stack>
    </Paper>
  );
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

function formatCpf(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9)
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function buildObservacoes(formData: FormData, setorNome?: string): string {
  return [
    formData.horaEntrada ? `Hora da entrada: ${formData.horaEntrada}` : '',
    setorNome ? `Setor selecionado: ${setorNome}` : '',
    formData.responsavelFamiliar
      ? `Responsavel familiar: ${formData.responsavelFamiliar}`
      : '',
    formData.motivoAcolhimento.length
      ? `Motivo do acolhimento: ${formData.motivoAcolhimento.join(', ')}`
      : '',
    formData.observacoesSaude
      ? `Saude declarada: ${formData.observacoesSaude}`
      : '',
    formData.observacoesGerais
      ? `Observacoes gerais: ${formData.observacoesGerais}`
      : '',
    formData.nomeResponsavelAtendimento
      ? `Responsavel pelo atendimento: ${formData.nomeResponsavelAtendimento}${
          formData.cargoFuncao ? ` - ${formData.cargoFuncao}` : ''
        }`
      : '',
  ]
    .filter(Boolean)
    .join('\n');
}

const observationPrefixes = [
  'Hora da entrada',
  'Setor selecionado',
  'Responsavel familiar',
  'Motivo do acolhimento',
  'Saude declarada',
  'Observacoes gerais',
  'Responsavel pelo atendimento',
];

function getObservationValue(
  notes: string | null | undefined,
  label: string,
): string {
  const prefix = `${label}:`;
  const line = (notes ?? '')
    .split(/\r?\n/)
    .find((item) => item.trim().startsWith(prefix));

  return line ? line.trim().slice(prefix.length).trim() : '';
}

function hasStructuredObservations(notes: string | null | undefined): boolean {
  return observationPrefixes.some((prefix) =>
    getObservationValue(notes, prefix),
  );
}

function getDateInputValue(value?: string | null): string {
  return value?.split('T')[0] ?? '';
}

function normalizeDateInput(value: string): string {
  return value.split('T')[0];
}

function nullableDateInput(value: string): string | null {
  return value ? normalizeDateInput(value) : null;
}

function parseResponsibleAttendance(
  value: string,
): Pick<FormData, 'nomeResponsavelAtendimento' | 'cargoFuncao'> {
  const [name, ...roleParts] = value.split(' - ');

  return {
    nomeResponsavelAtendimento: name?.trim() ?? '',
    cargoFuncao: roleParts.join(' - ').trim(),
  };
}

function toFormDataFromAcolhido(row: Acolhido): FormData {
  const notes = row.notes ?? '';
  const responsibleAttendance = parseResponsibleAttendance(
    getObservationValue(notes, 'Responsavel pelo atendimento'),
  );
  const structuredNotes = hasStructuredObservations(notes);
  const motivoAcolhimento = getObservationValue(notes, 'Motivo do acolhimento')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

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
    responsavelFamiliar:
      getObservationValue(notes, 'Responsavel familiar') ||
      row.familyResponsible ||
      '',
    pcd: row.alerts.includes('pcd'),
    gestante: row.alerts.includes('gestante'),
    cronica: row.alerts.includes('cronica'),
    idoso: row.alerts.includes('idoso'),
    motivoAcolhimento,
    observacoesSaude: getObservationValue(notes, 'Saude declarada'),
    observacoesGerais:
      getObservationValue(notes, 'Observacoes gerais') ||
      (structuredNotes ? '' : notes),
    pertencesRegistrados: row.belongings ?? '',
    nomeResponsavelAtendimento:
      responsibleAttendance.nomeResponsavelAtendimento,
    cargoFuncao: responsibleAttendance.cargoFuncao,
  };
}

function getErrorMessage(error: unknown): string {
  const response = (
    error as {
      response?: {
        data?: { message?: string; errors?: Record<string, string[]> };
      };
    }
  ).response;
  const validationErrors = response?.data?.errors;
  const firstValidationMessage = validationErrors
    ? Object.values(validationErrors)[0]?.[0]
    : undefined;

  return (
    firstValidationMessage ??
    response?.data?.message ??
    'Não foi possível salvar a ficha. Verifique os dados.'
  );
}

export function CadastrosPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [entryMode, setEntryMode] = useState<EntryMode>('individual');
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberForm[]>([
    createFamilyMember(),
    createFamilyMember(),
  ]);
  const [baselineFormData, setBaselineFormData] =
    useState<FormData>(initialFormData);
  const [sectors, setSectors] = useState<ApiSetor[]>([]);
  const [activeAcolhidos, setActiveAcolhidos] = useState<Acolhido[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loadingSectors, setLoadingSectors] = useState(true);
  const [loadingAcolhido, setLoadingAcolhido] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const editIdParam = searchParams.get('edit');
  const parsedEditId = editIdParam ? Number(editIdParam) : null;
  const editId =
    parsedEditId && Number.isFinite(parsedEditId) && parsedEditId > 0
      ? parsedEditId
      : null;
  const isEditing = editId !== null;
  const isFamilyMode = !isEditing && entryMode === 'familia';

  useEffect(() => {
    let active = true;

    const loadSectors = async () => {
      setLoadingSectors(true);
      setLoadError(null);

      try {
        const [data, acolhidos] = await Promise.all([
          fetchSetores(),
          fetchAcolhidos(),
        ]);
        if (active) {
          setSectors(data);
          setActiveAcolhidos(acolhidos);
        }
      } catch {
        if (active) setLoadError('Não foi possível carregar os setores.');
      } finally {
        if (active) setLoadingSectors(false);
      }
    };

    void loadSectors();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!editId) {
      setFormData(initialFormData);
      setBaselineFormData(initialFormData);
      setFamilyMembers([createFamilyMember(), createFamilyMember()]);
      setLoadError(null);
      return;
    }

    let active = true;

    const loadAcolhido = async () => {
      setLoadingAcolhido(true);
      setLoadError(null);
      setSubmitError(null);
      setSubmitMessage(null);

      try {
        const acolhido = await fetchAcolhidoDetail(editId);
        if (!active) return;
        const nextFormData = toFormDataFromAcolhido(acolhido);
        setFormData(nextFormData);
        setBaselineFormData(nextFormData);
        setFieldErrors({});
      } catch {
        if (active)
          setLoadError('Não foi possível carregar o cadastro para edição.');
      } finally {
        if (active) setLoadingAcolhido(false);
      }
    };

    void loadAcolhido();

    return () => {
      active = false;
    };
  }, [editId]);

  const selectedSetor = useMemo(
    () => sectors.find((setor) => String(setor.id) === formData.setorId),
    [formData.setorId, sectors],
  );

  const occupiedBedValues = useMemo(
    () =>
      activeAcolhidos
        .filter(
          (acolhido) =>
            acolhido.sectorId === formData.setorId && acolhido.apiId !== editId,
        )
        .map((acolhido) => acolhido.bed),
    [activeAcolhidos, editId, formData.setorId],
  );

  const individualBedOptions = useMemo(() => {
    if (!selectedSetor) return [];

    return buildBedOptions({
      capacity: selectedSetor.capacidade,
      active: selectedSetor.ativo,
      blockedBeds: selectedSetor.leitos_interditados,
      occupiedBeds: occupiedBedValues,
      currentBed: formData.leito,
    });
  }, [formData.leito, occupiedBedValues, selectedSetor]);

  const setField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setSubmitMessage(null);
    setSubmitError(null);
  };

  const setSetor = (setorId: string) => {
    setFormData((prev) => ({ ...prev, setorId, leito: '' }));
    setFamilyMembers((prev) =>
      prev.map((member) => ({ ...member, leito: '' })),
    );
    setFieldErrors((prev) => ({
      ...prev,
      setorId: undefined,
      leito: undefined,
    }));
    setSubmitMessage(null);
    setSubmitError(null);
  };

  const setFamilyMemberField = <K extends keyof FamilyMemberForm>(
    index: number,
    field: K,
    value: FamilyMemberForm[K],
  ) => {
    setFamilyMembers((prev) =>
      prev.map((member, idx) =>
        idx === index ? { ...member, [field]: value } : member,
      ),
    );
    setSubmitMessage(null);
    setSubmitError(null);
  };

  const getFamilyMemberBedOptions = (index: number) => {
    if (!selectedSetor) return [];

    return buildBedOptions({
      capacity: selectedSetor.capacidade,
      active: selectedSetor.ativo,
      blockedBeds: selectedSetor.leitos_interditados,
      occupiedBeds: [
        ...occupiedBedValues,
        ...familyMembers
          .filter((_, memberIndex) => memberIndex !== index)
          .map((member) => member.leito),
      ],
      currentBed: familyMembers[index]?.leito,
    });
  };

  const addFamilyMember = () => {
    setFamilyMembers((prev) => [...prev, createFamilyMember()]);
  };

  const removeFamilyMember = (index: number) => {
    setFamilyMembers((prev) =>
      prev.length > 2 ? prev.filter((_, idx) => idx !== index) : prev,
    );
  };

  const handleArrayToggle = (value: string) => {
    setFormData((prev) => {
      const values = prev.motivoAcolhimento;
      const nextValues = values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value];

      return {
        ...prev,
        motivoAcolhimento: nextValues,
      };
    });
    setSubmitMessage(null);
    setSubmitError(null);
  };

  const validate = (): boolean => {
    const errors: FieldErrors = {};

    if (!formData.dataEntrada)
      errors.dataEntrada = 'Informe a data de entrada.';
    if (!formData.setorId) errors.setorId = 'Selecione um setor.';
    if (isFamilyMode && formData.responsavelFamiliar.trim().length < 3) {
      errors.responsavelFamiliar = 'Informe o responsável familiar.';
    }

    if (!isFamilyMode) {
      if (formData.nomeCompleto.trim().length < 3)
        errors.nomeCompleto = 'Informe o nome completo.';
      if (formData.cpf && onlyDigits(formData.cpf).length !== 11)
        errors.cpf = 'CPF deve ter 11 dígitos.';
    }

    if (isFamilyMode) {
      const memberError = familyMembers.some((member) => {
        const cpfDigits = onlyDigits(member.cpf);
        return (
          member.nomeCompleto.trim().length < 3 ||
          (cpfDigits.length > 0 && cpfDigits.length !== 11)
        );
      });

      if (memberError) {
        errors.nomeCompleto =
          'Cada membro precisa ter nome; CPF deve ter 11 dígitos quando preenchido.';
      }
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleReset = () => {
    setFormData(isEditing ? baselineFormData : initialFormData);
    setFamilyMembers([createFamilyMember(), createFamilyMember()]);
    setFieldErrors({});
    setSubmitError(null);
    setSubmitMessage(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    setSubmitMessage(null);

    if (!validate()) return;

    setSubmitting(true);

    try {
      if (isFamilyMode) {
        const saved = await createFamilia({
          responsavel_nome: formData.responsavelFamiliar.trim(),
          setor_id: Number(formData.setorId),
          data_entrada: normalizeDateInput(formData.dataEntrada),
          observacoes: buildObservacoes(formData, selectedSetor?.nome) || null,
          acolhidos: familyMembers.map((member) => ({
            nome: member.nomeCompleto.trim(),
            cpf: onlyDigits(member.cpf) || null,
            data_nascimento: nullableDateInput(member.dataNascimento),
            setor_id: Number(formData.setorId),
            familia_id: null,
            parentesco: member.parentesco.trim() || null,
            telefone: member.telefone.trim() || null,
            genero: member.sexo || null,
            leito: member.leito.trim() || null,
            data_entrada: normalizeDateInput(formData.dataEntrada),
            hora_entrada: formData.horaEntrada || null,
            pcd: member.pcd,
            gestante: member.gestante,
            cronica: member.cronica,
            idoso: member.idoso,
            observacoes: member.observacoesGerais.trim() || null,
            pertences_registrados: member.pertencesRegistrados.trim() || null,
          })),
        });

        setSubmitMessage(
          `Família ${saved.codigo} cadastrada com ${saved.acolhidosCount} membros.`,
        );
        setFormData(initialFormData);
        setBaselineFormData(initialFormData);
        setFamilyMembers([createFamilyMember(), createFamilyMember()]);
        setFieldErrors({});
        return;
      }

      const payload = {
        nome: formData.nomeCompleto.trim(),
        cpf: onlyDigits(formData.cpf) || null,
        data_nascimento: nullableDateInput(formData.dataNascimento),
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
      };
      const saved = editId
        ? await updateAcolhidoRecord(editId, payload)
        : await createAcolhidoRecord(payload);

      setSubmitMessage(
        `Ficha de ${saved.name} ${editId ? 'atualizada' : 'salva'} com sucesso.`,
      );
      if (editId) {
        const nextFormData = toFormDataFromAcolhido(saved);
        setFormData(nextFormData);
        setBaselineFormData(nextFormData);
      } else {
        setFormData(initialFormData);
        setBaselineFormData(initialFormData);
      }
      setFieldErrors({});
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

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
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            spacing={2}
          >
            <Box>
              <Typography variant="h4">
                {isEditing
                  ? 'Editar ficha detalhada'
                  : 'Ficha detalhada de entrada'}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                {isEditing
                  ? 'Atualização do cadastro completo do acolhido.'
                  : 'Cadastro essencial para acolhimento temporário.'}
              </Typography>
            </Box>
            <Chip
              icon={<AssignmentIcon />}
              label={
                isEditing ? 'Modo edição' : 'SUAS | Acolhimento provisório'
              }
              color="primary"
            />
          </Stack>
        </Stack>
      </Paper>

      {loadingAcolhido ? (
        <Alert severity="info">Carregando dados do cadastro...</Alert>
      ) : null}
      {loadError ? <Alert severity="error">{loadError}</Alert> : null}
      {submitError ? <Alert severity="error">{submitError}</Alert> : null}
      {submitMessage ? <Alert severity="success">{submitMessage}</Alert> : null}

      {!isEditing ? (
        <Paper
          elevation={0}
          sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button
              variant={entryMode === 'individual' ? 'contained' : 'outlined'}
              onClick={() => setEntryMode('individual')}
            >
              Pessoa sozinha
            </Button>
            <Button
              variant={entryMode === 'familia' ? 'contained' : 'outlined'}
              onClick={() => setEntryMode('familia')}
            >
              Família
            </Button>
          </Stack>
        </Paper>
      ) : null}

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <FormSection title="1. Entrada e alocação">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  required
                  label="Data da entrada"
                  type="date"
                  value={formData.dataEntrada}
                  onChange={(event) =>
                    setField('dataEntrada', event.target.value)
                  }
                  error={!!fieldErrors.dataEntrada}
                  helperText={fieldErrors.dataEntrada}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TimeInput
                  label="Hora"
                  value={formData.horaEntrada}
                  onChange={(value) => setField('horaEntrada', value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth required error={!!fieldErrors.setorId}>
                  <InputLabel>Setor</InputLabel>
                  <Select
                    label="Setor"
                    value={formData.setorId}
                    onChange={(event) => setSetor(String(event.target.value))}
                    disabled={loadingSectors}
                  >
                    {sectors.map((setor) => (
                      <MenuItem
                        key={setor.id}
                        value={String(setor.id)}
                        disabled={!setor.ativo}
                      >
                        {setor.nome}
                        {setor.ativo ? '' : ' (interditado)'}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    {fieldErrors.setorId ??
                      (loadingSectors ? 'Carregando setores...' : ' ')}
                  </FormHelperText>
                </FormControl>
              </Grid>
              {!isFamilyMode ? (
                <Grid size={{ xs: 12, md: 2 }}>
                  <FormControl
                    fullWidth
                    disabled={!selectedSetor || !selectedSetor.ativo}
                  >
                    <InputLabel>Leito</InputLabel>
                    <Select
                      label="Leito"
                      value={formData.leito}
                      onChange={(event) =>
                        setField('leito', String(event.target.value))
                      }
                    >
                      <MenuItem value="">Sem leito</MenuItem>
                      {individualBedOptions.length === 0 && selectedSetor ? (
                        <MenuItem value="" disabled>
                          Nenhum leito livre
                        </MenuItem>
                      ) : null}
                      {individualBedOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>
                      {selectedSetor
                        ? 'Livres do setor selecionado.'
                        : 'Selecione um setor.'}
                    </FormHelperText>
                  </FormControl>
                </Grid>
              ) : null}
            </Grid>
          </FormSection>

          {!isFamilyMode ? (
            <FormSection title="2. Identificação da pessoa acolhida">
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    required
                    label="Nome completo"
                    value={formData.nomeCompleto}
                    onChange={(event) =>
                      setField('nomeCompleto', event.target.value)
                    }
                    error={!!fieldErrors.nomeCompleto}
                    helperText={fieldErrors.nomeCompleto}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    fullWidth
                    label="CPF"
                    value={formData.cpf}
                    onChange={(event) =>
                      setField('cpf', formatCpf(event.target.value))
                    }
                    error={!!fieldErrors.cpf}
                    helperText={fieldErrors.cpf}
                    slotProps={{ htmlInput: { inputMode: 'numeric' } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    fullWidth
                    label="Data de nascimento"
                    type="date"
                    value={formData.dataNascimento}
                    onChange={(event) =>
                      setField('dataNascimento', event.target.value)
                    }
                    error={!!fieldErrors.dataNascimento}
                    helperText={fieldErrors.dataNascimento}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl fullWidth>
                    <InputLabel>Sexo</InputLabel>
                    <Select
                      label="Sexo"
                      value={formData.sexo}
                      onChange={(event) =>
                        setField('sexo', String(event.target.value))
                      }
                    >
                      <MenuItem value="Feminino">Feminino</MenuItem>
                      <MenuItem value="Masculino">Masculino</MenuItem>
                      <MenuItem value="Outro">Outro</MenuItem>
                      <MenuItem value="Nao informado">Não informado</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Telefone"
                    value={formData.telefone}
                    onChange={(event) =>
                      setField('telefone', event.target.value)
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Responsável familiar"
                    value={formData.responsavelFamiliar}
                    onChange={(event) =>
                      setField('responsavelFamiliar', event.target.value)
                    }
                  />
                </Grid>
              </Grid>
            </FormSection>
          ) : (
            <FormSection title="2. Grupo familiar">
              <Stack spacing={2.5}>
                <TextField
                  fullWidth
                  required
                  label="Responsável familiar"
                  value={formData.responsavelFamiliar}
                  onChange={(event) =>
                    setField('responsavelFamiliar', event.target.value)
                  }
                  error={!!fieldErrors.responsavelFamiliar}
                  helperText={fieldErrors.responsavelFamiliar}
                />
                {fieldErrors.nomeCompleto ? (
                  <Alert severity="warning">{fieldErrors.nomeCompleto}</Alert>
                ) : null}
                {familyMembers.map((member, index) => (
                  <Paper
                    key={member.id}
                    elevation={0}
                    sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}
                  >
                    <Stack spacing={2}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography variant="subtitle1">
                          Membro {index + 1}
                        </Typography>
                        <IconButton
                          aria-label="Remover membro"
                          onClick={() => removeFamilyMember(index)}
                          disabled={familyMembers.length <= 2}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 5 }}>
                          <TextField
                            fullWidth
                            required
                            label="Nome completo"
                            value={member.nomeCompleto}
                            onChange={(event) =>
                              setFamilyMemberField(
                                index,
                                'nomeCompleto',
                                event.target.value,
                              )
                            }
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                          <TextField
                            fullWidth
                            label="CPF"
                            value={member.cpf}
                            onChange={(event) =>
                              setFamilyMemberField(
                                index,
                                'cpf',
                                formatCpf(event.target.value),
                              )
                            }
                            slotProps={{ htmlInput: { inputMode: 'numeric' } }}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <TextField
                            fullWidth
                            label="Parentesco"
                            value={member.parentesco}
                            onChange={(event) =>
                              setFamilyMemberField(
                                index,
                                'parentesco',
                                event.target.value,
                              )
                            }
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                          <TextField
                            fullWidth
                            label="Nascimento"
                            type="date"
                            value={member.dataNascimento}
                            onChange={(event) =>
                              setFamilyMemberField(
                                index,
                                'dataNascimento',
                                event.target.value,
                              )
                            }
                            slotProps={{ inputLabel: { shrink: true } }}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                          <FormControl fullWidth>
                            <InputLabel>Sexo</InputLabel>
                            <Select
                              label="Sexo"
                              value={member.sexo}
                              onChange={(event) =>
                                setFamilyMemberField(
                                  index,
                                  'sexo',
                                  String(event.target.value),
                                )
                              }
                            >
                              <MenuItem value="Feminino">Feminino</MenuItem>
                              <MenuItem value="Masculino">Masculino</MenuItem>
                              <MenuItem value="Outro">Outro</MenuItem>
                              <MenuItem value="Nao informado">
                                Não informado
                              </MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                          <TextField
                            fullWidth
                            label="Telefone"
                            value={member.telefone}
                            onChange={(event) =>
                              setFamilyMemberField(
                                index,
                                'telefone',
                                event.target.value,
                              )
                            }
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                          <FormControl
                            fullWidth
                            disabled={!selectedSetor || !selectedSetor.ativo}
                          >
                            <InputLabel>Leito</InputLabel>
                            <Select
                              label="Leito"
                              value={member.leito}
                              onChange={(event) =>
                                setFamilyMemberField(
                                  index,
                                  'leito',
                                  String(event.target.value),
                                )
                              }
                            >
                              <MenuItem value="">Sem leito</MenuItem>
                              {getFamilyMemberBedOptions(index).length === 0 &&
                              selectedSetor ? (
                                <MenuItem value="" disabled>
                                  Nenhum leito livre
                                </MenuItem>
                              ) : null}
                              {getFamilyMemberBedOptions(index).map(
                                (option) => (
                                  <MenuItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </MenuItem>
                                ),
                              )}
                            </Select>
                            <FormHelperText>
                              {selectedSetor
                                ? 'Livres do setor selecionado.'
                                : 'Selecione um setor.'}
                            </FormHelperText>
                          </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <FormGroup row>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={member.pcd}
                                  onChange={(event) =>
                                    setFamilyMemberField(
                                      index,
                                      'pcd',
                                      event.target.checked,
                                    )
                                  }
                                />
                              }
                              label="PCD"
                            />
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={member.cronica}
                                  onChange={(event) =>
                                    setFamilyMemberField(
                                      index,
                                      'cronica',
                                      event.target.checked,
                                    )
                                  }
                                />
                              }
                              label="Doença crônica"
                            />
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={member.gestante}
                                  onChange={(event) =>
                                    setFamilyMemberField(
                                      index,
                                      'gestante',
                                      event.target.checked,
                                    )
                                  }
                                />
                              }
                              label="Gestante"
                            />
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={member.idoso}
                                  onChange={(event) =>
                                    setFamilyMemberField(
                                      index,
                                      'idoso',
                                      event.target.checked,
                                    )
                                  }
                                />
                              }
                              label="Idoso 60+"
                            />
                          </FormGroup>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <TextField
                            fullWidth
                            multiline
                            minRows={2}
                            label="Observações individuais"
                            value={member.observacoesGerais}
                            onChange={(event) =>
                              setFamilyMemberField(
                                index,
                                'observacoesGerais',
                                event.target.value,
                              )
                            }
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <TextField
                            fullWidth
                            multiline
                            minRows={2}
                            label="Pertences individuais"
                            value={member.pertencesRegistrados}
                            onChange={(event) =>
                              setFamilyMemberField(
                                index,
                                'pertencesRegistrados',
                                event.target.value,
                              )
                            }
                          />
                        </Grid>
                      </Grid>
                    </Stack>
                  </Paper>
                ))}
                <Button
                  variant="outlined"
                  startIcon={<PersonAddIcon />}
                  onClick={addFamilyMember}
                >
                  Adicionar membro
                </Button>
              </Stack>
            </FormSection>
          )}

          {!isFamilyMode ? (
            <FormSection title="3. Público preferencial">
              <FormControl component="fieldset">
                <FormLabel>Marque as condições prioritárias</FormLabel>
                <FormGroup row>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.pcd}
                        onChange={(event) =>
                          setField('pcd', event.target.checked)
                        }
                      />
                    }
                    label="PCD"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.cronica}
                        onChange={(event) =>
                          setField('cronica', event.target.checked)
                        }
                      />
                    }
                    label="Doença crônica"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.gestante}
                        onChange={(event) =>
                          setField('gestante', event.target.checked)
                        }
                      />
                    }
                    label="Gestante"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.idoso}
                        onChange={(event) =>
                          setField('idoso', event.target.checked)
                        }
                      />
                    }
                    label="Idoso 60+"
                  />
                </FormGroup>
              </FormControl>
            </FormSection>
          ) : null}

          <FormSection title="4. Motivo e saúde">
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
                            checked={formData.motivoAcolhimento.includes(
                              option,
                            )}
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
                  label="Condições de saúde e encaminhamentos"
                  multiline
                  minRows={6}
                  value={formData.observacoesSaude}
                  onChange={(event) =>
                    setField('observacoesSaude', event.target.value)
                  }
                />
              </Grid>
            </Grid>
          </FormSection>

          <FormSection title="5. Responsável e observações">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 5 }}>
                <TextField
                  fullWidth
                  label="Nome do responsável pelo atendimento"
                  value={formData.nomeResponsavelAtendimento}
                  onChange={(event) =>
                    setField('nomeResponsavelAtendimento', event.target.value)
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  label="Cargo / função"
                  value={formData.cargoFuncao}
                  onChange={(event) =>
                    setField('cargoFuncao', event.target.value)
                  }
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Observações gerais"
                  multiline
                  minRows={4}
                  value={formData.observacoesGerais}
                  onChange={(event) =>
                    setField('observacoesGerais', event.target.value)
                  }
                />
              </Grid>
              {!isFamilyMode ? (
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Pertences registrados na entrada"
                    multiline
                    minRows={3}
                    value={formData.pertencesRegistrados}
                    onChange={(event) =>
                      setField('pertencesRegistrados', event.target.value)
                    }
                  />
                </Grid>
              ) : null}
            </Grid>
          </FormSection>

          <Paper
            elevation={0}
            sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ xs: 'stretch', sm: 'center' }}
            >
              <Box>
                <Typography variant="subtitle1">Ficha detalhada</Typography>
                <Typography variant="body2" color="text.secondary">
                  Revise os dados antes de finalizar o registro.
                </Typography>
              </Box>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="outlined"
                  onClick={handleReset}
                  disabled={submitting}
                >
                  {isEditing ? 'Restaurar dados' : 'Limpar formulário'}
                </Button>
                {isEditing ? (
                  <Button
                    variant="text"
                    onClick={() => navigate('/acolhidos')}
                    disabled={submitting}
                  >
                    Voltar
                  </Button>
                ) : null}
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={
                    submitting ? (
                      <CircularProgress color="inherit" size={18} />
                    ) : (
                      <SaveIcon />
                    )
                  }
                  disabled={
                    submitting ||
                    loadingSectors ||
                    loadingAcolhido ||
                    !!loadError
                  }
                >
                  {submitting
                    ? 'Salvando...'
                    : isEditing
                      ? 'Salvar alterações'
                      : 'Salvar ficha'}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Stack>
      </Box>
    </Stack>
  );
}
