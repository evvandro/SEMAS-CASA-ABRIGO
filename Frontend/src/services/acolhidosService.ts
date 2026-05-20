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
  } | null
  setor: ApiSetor | null
  data_entrada: string
  hora_entrada: string | null
  data_saida: string | null
  ativo: boolean
}

export interface AcolhidoRequestPayload {
  nome: string
  cpf: string
  data_nascimento: string
  setor_id: number
  telefone?: string | null
  genero?: string | null
  leito?: string | null
  observacoes?: string | null
  pertences_registrados?: string | null
  data_entrada?: string
  hora_entrada?: string | null
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
    birthDate: api.data_nascimento,
    phone: api.telefone,
    gender: api.genero,
    bed: api.leito,
    notes: api.observacoes,
    belongings: api.pertences_registrados,
    familyCode: api.familia?.codigo ?? null,
    familyResponsible: api.familia?.responsavel_nome ?? null,
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
  }
}

export function toCadastroPayload(payload: CadastroPayload) {
  const [day, month, year] = payload.birth.split('/')
  return {
    nome: payload.name,
    cpf: payload.cpf.replace(/\D/g, ''),
    data_nascimento: `${year}-${month}-${day}`,
    setor_id: Number(payload.sectorId),
    pcd: payload.pcd,
    gestante: payload.gestante,
    cronica: payload.cronica,
    idoso: payload.idoso,
    observacoes: payload.notes ?? '',
  }
}

// ── Chamadas API ──────────────────────────────────────────────────────────────

export async function fetchAcolhidos(): Promise<Acolhido[]> {
  const res = await api.get<{ data: ApiAcolhido[] }>('/acolhidos')
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
  const res = await api.post<{ data: ApiAcolhido }>(`/acolhidos/${apiId}/saida`, {
    data_saida: dataSaida,
    tipo_saida: tipoSaida,
    detalhes_saida: detalhesSaida,
  })
  return toAcolhido(res.data.data)
}
