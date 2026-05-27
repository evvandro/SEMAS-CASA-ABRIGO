import { api } from './api'
import type { Acolhido, AlertCategory, CadastroPayload, Sector, SaidaPayload } from '../modules/acolhidos/types'
import { calculateAgeFromIsoDate } from '../modules/acolhidos/utils/date'

// ── Tipos da API ──────────────────────────────────────────────────────────────

export interface ApiSetor {
  id: number
  nome: string
  cor: string
  capacidade: number | null
  ativo: boolean
  leitos_interditados?: string[]
}

export interface ApiAcolhido {
  id: number
  codigo_pulseira: string
  nome: string
  cpf: string | null
  data_nascimento: string | null
  telefone: string | null
  genero: string | null
  leito: string | null
  parentesco: string | null
  observacoes: string | null
  pertences_registrados: string | null
  pcd: boolean
  gestante: boolean
  cronica: boolean
  idoso: boolean
  familia: {
    id: number
    codigo: string
    responsavel_nome: string
    acolhidos_count?: number
  } | null
  setor: ApiSetor | null
  data_entrada: string
  hora_entrada: string | null
  data_saida: string | null
  hora_saida: string | null
  tipo_saida: string | null
  destino_informado: string | null
  municipio_destino: string | null
  condicao_saida: string | null
  responsavel_desligamento: string | null
  ativo: boolean
}

export interface AcolhidoRequestPayload {
  nome: string
  cpf?: string | null
  data_nascimento?: string | null
  setor_id: number
  telefone?: string | null
  genero?: string | null
  leito?: string | null
  observacoes?: string | null
  pertences_registrados?: string | null
  data_entrada?: string
  hora_entrada?: string | null
  familia_id?: number | null
  parentesco?: string | null
  pcd?: boolean
  gestante?: boolean
  cronica?: boolean
  idoso?: boolean
}

// ── Mappers ───────────────────────────────────────────────────────────────────

function formatCpf(raw: string | null): string {
  if (!raw) return ''
  const digits = raw.replace(/\D/g, '')
  if (digits.length !== 11) return raw
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

function getObservationValue(notes: string | null | undefined, label: string): string {
  const prefix = `${label}:`
  const line = (notes ?? '').split(/\r?\n/).find(item => item.trim().startsWith(prefix))

  return line ? line.trim().slice(prefix.length).trim() : ''
}

function normalizeTime(value?: string | null): string | null {
  const match = value?.match(/^(\d{2}):(\d{2})/)
  return match ? `${match[1]}:${match[2]}` : null
}

export function toAcolhido(api: ApiAcolhido): Acolhido {
  const alerts: AlertCategory[] = (['pcd', 'gestante', 'cronica', 'idoso'] as AlertCategory[]).filter(
    k => api[k],
  )
  return {
    apiId: api.id,
    id: api.codigo_pulseira || String(api.id),
    name: api.nome,
    cpf: formatCpf(api.cpf),
    age: calculateAgeFromIsoDate(api.data_nascimento),
    sectorId: api.setor ? String(api.setor.id) : '',
    alerts,
    entry: api.data_entrada,
    entryTime: normalizeTime(api.hora_entrada) ?? normalizeTime(getObservationValue(api.observacoes, 'Hora da entrada')),
    exitDate: api.data_saida,
    exitTime: normalizeTime(api.hora_saida),
    exitType: api.tipo_saida,
    exitDestination: api.destino_informado,
    exitCity: api.municipio_destino,
    exitCondition: api.condicao_saida,
    exitResponsible: api.responsavel_desligamento,
    birthDate: api.data_nascimento,
    phone: api.telefone,
    gender: api.genero,
    bed: api.leito,
    notes: api.observacoes,
    belongings: api.pertences_registrados,
    familyCode: api.familia?.codigo ?? null,
    familyResponsible: api.familia?.responsavel_nome ?? null,
    familyId: api.familia?.id ?? null,
    familyMembersCount: api.familia?.acolhidos_count ?? null,
    kinship: api.parentesco ?? null,
  }
}

export function toSector(api: ApiSetor, occupied = 0): Sector {
  return {
    id: String(api.id),
    name: api.nome,
    sub: '',
    color: api.cor,
    capacity: api.capacidade ?? 0,
    occupied,
    active: api.ativo,
    blockedBeds: api.leitos_interditados ?? [],
  }
}

export function toCadastroPayload(payload: CadastroPayload) {
  const [day, month, year] = payload.birth.split('/')
  return {
    nome: payload.name,
    cpf: payload.cpf.replace(/\D/g, '') || null,
    data_nascimento: day && month && year ? `${year}-${month}-${day}` : null,
    setor_id: Number(payload.sectorId),
    leito: payload.bed?.trim() || null,
    pcd: payload.pcd,
    gestante: payload.gestante,
    cronica: payload.cronica,
    idoso: payload.idoso,
    observacoes: payload.notes ?? '',
  }
}

// ── Chamadas API ──────────────────────────────────────────────────────────────

export async function fetchAcolhidos(params?: { status?: 'ativos' | 'saida'; search?: string; setorId?: string }): Promise<Acolhido[]> {
  const res = await api.get<{ data: ApiAcolhido[] }>('/acolhidos', {
    params: {
      status: params?.status === 'saida' ? 'saida' : undefined,
      search: params?.search || undefined,
      setor_id: params?.setorId || undefined,
    },
  })
  return res.data.data.map(toAcolhido)
}

export async function fetchSetores(): Promise<ApiSetor[]> {
  const res = await api.get<{ data: ApiSetor[] }>('/setores')
  return res.data.data
}

export async function createAcolhido(payload: CadastroPayload): Promise<Acolhido> {
  return createAcolhidoRecord(toCadastroPayload(payload))
}

export async function createAcolhidoRecord(payload: AcolhidoRequestPayload): Promise<Acolhido> {
  const res = await api.post<{ data: ApiAcolhido }>('/acolhidos', payload)
  return toAcolhido(res.data.data)
}

export async function fetchAcolhidoDetail(apiId: number): Promise<Acolhido> {
  const res = await api.get<{ data: ApiAcolhido }>(`/acolhidos/${apiId}`)
  return toAcolhido(res.data.data)
}

export async function updateAcolhidoRecord(
  apiId: number,
  payload: Partial<AcolhidoRequestPayload>,
): Promise<Acolhido> {
  const res = await api.patch<{ data: ApiAcolhido }>(`/acolhidos/${apiId}`, payload)
  return toAcolhido(res.data.data)
}

export async function registerAcolhidoSaida(apiId: number, dataSaida: string, tipoSaida: string, detalhesSaida: SaidaPayload): Promise<Acolhido> {
  const res = await api.post<{ data: ApiAcolhido }>(`/acolhidos/${apiId}/saida`, toSaidaRequestPayload(dataSaida, tipoSaida, detalhesSaida))
  return toAcolhido(res.data.data)
}

export function toSaidaRequestPayload(dataSaida: string, tipoSaida: string, detalhesSaida: SaidaPayload) {
  const encaminhamentos = detalhesSaida.encaminhamentos.includes('Outro servico') && detalhesSaida.encaminhamentoOutro
    ? [...detalhesSaida.encaminhamentos, detalhesSaida.encaminhamentoOutro]
    : detalhesSaida.encaminhamentos

  return {
    data_saida: dataSaida,
    hora_saida: detalhesSaida.hora || null,
    tipo_saida: tipoSaida,
    detalhes_saida: detalhesSaida,
    destino_informado: detalhesSaida.destinoInformado || null,
    endereco_destino: detalhesSaida.destinoEndereco || null,
    municipio_destino: detalhesSaida.destinoMunicipio || null,
    telefone_destino: detalhesSaida.destinoTelefone || null,
    encaminhamentos_rede: encaminhamentos,
    resumo_encaminhamento: detalhesSaida.encaminhamentoResumo || null,
    condicao_saida: detalhesSaida.condicoesNaSaida || null,
    observacoes_tecnicas: detalhesSaida.condicoesObservacoes || null,
    responsavel_desligamento: detalhesSaida.responsavelNome || null,
    cargo_responsavel: detalhesSaida.responsavelCargo || null,
  }
}
