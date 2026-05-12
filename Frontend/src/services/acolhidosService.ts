import { api } from './api'
import type { Acolhido, AlertCategory, CadastroPayload, Sector } from '../modules/acolhidos/types'

// ── Tipos da API ──────────────────────────────────────────────────────────────

export interface ApiSetor {
  id: number
  nome: string
  cor: string
  capacidade: number | null
}

export interface ApiAcolhido {
  id: number
  codigo_pulseira: string
  nome: string
  cpf: string | null
  data_nascimento: string | null
  leito: string | null
  pcd: boolean
  gestante: boolean
  cronica: boolean
  idoso: boolean
  setor: ApiSetor | null
  data_entrada: string
  data_saida: string | null
  ativo: boolean
}

// ── Mappers ───────────────────────────────────────────────────────────────────

function calculateAge(isoDate: string | null): number {
  if (!isoDate) return 0
  const birth = new Date(isoDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function formatCpf(raw: string | null): string {
  if (!raw) return ''
  const digits = raw.replace(/\D/g, '')
  if (digits.length !== 11) return raw
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

export function toAcolhido(api: ApiAcolhido): Acolhido {
  const alerts: AlertCategory[] = (['pcd', 'gestante', 'cronica', 'idoso'] as AlertCategory[]).filter(
    k => api[k],
  )
  return {
    id: api.codigo_pulseira || String(api.id),
    name: api.nome,
    cpf: formatCpf(api.cpf),
    age: calculateAge(api.data_nascimento),
    sectorId: api.setor ? String(api.setor.id) : '',
    alerts,
    entry: api.data_entrada,
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
  const res = await api.post<{ data: ApiAcolhido }>('/acolhidos', toCadastroPayload(payload))
  return toAcolhido(res.data.data)
}
