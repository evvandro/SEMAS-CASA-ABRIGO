import { api } from './api'
import {
  toAcolhido,
  toSaidaRequestPayload,
  type ApiAcolhido,
  type ApiSetor,
  type AcolhidoRequestPayload,
} from './acolhidosService'
import type { Familia, SaidaPayload } from '../modules/acolhidos/types'

export interface ApiFamilia {
  id: number
  codigo: string
  responsavel_nome: string | null
  setor: ApiSetor | null
  acolhidos_count?: number
  acolhidos?: ApiAcolhido[]
  observacoes?: string | null
  data_entrada: string | null
  data_saida: string | null
  hora_saida?: string | null
  tipo_saida?: string | null
  destino_informado?: string | null
  municipio_destino?: string | null
  condicao_saida?: string | null
  responsavel_desligamento?: string | null
  ativo: boolean
}

export interface FamiliaRequestPayload {
  responsavel_nome: string
  setor_id: number
  observacoes?: string | null
  data_entrada: string
  acolhidos?: AcolhidoRequestPayload[]
}

export function toFamilia(apiFamilia: ApiFamilia): Familia {
  return {
    id: apiFamilia.id,
    codigo: apiFamilia.codigo,
    responsavelNome: apiFamilia.responsavel_nome,
    setorId: apiFamilia.setor ? String(apiFamilia.setor.id) : '',
    setorNome: apiFamilia.setor?.nome ?? null,
    acolhidosCount: apiFamilia.acolhidos_count ?? apiFamilia.acolhidos?.filter(membro => membro.ativo).length ?? 0,
    dataEntrada: apiFamilia.data_entrada,
    dataSaida: apiFamilia.data_saida,
    horaSaida: apiFamilia.hora_saida ?? null,
    tipoSaida: apiFamilia.tipo_saida ?? null,
    destinoInformado: apiFamilia.destino_informado ?? null,
    municipioDestino: apiFamilia.municipio_destino ?? null,
    condicaoSaida: apiFamilia.condicao_saida ?? null,
    responsavelDesligamento: apiFamilia.responsavel_desligamento ?? null,
    observacoes: apiFamilia.observacoes,
    ativo: apiFamilia.ativo,
    membros: apiFamilia.acolhidos?.map(membro => ({ ...toAcolhido(membro), active: membro.ativo })),
  }
}

export async function fetchFamilias(params?: { search?: string; setorId?: string; status?: 'ativos' | 'saida' }): Promise<Familia[]> {
  const res = await api.get<{ data: ApiFamilia[] }>('/familias', {
    params: {
      search: params?.search || undefined,
      setor_id: params?.setorId || undefined,
      status: params?.status === 'saida' ? 'saida' : undefined,
    },
  })

  return res.data.data.map(toFamilia)
}

export async function fetchFamiliaDetail(id: number): Promise<Familia> {
  const res = await api.get<{ data: ApiFamilia }>(`/familias/${id}`)
  return toFamilia(res.data.data)
}

export async function createFamilia(payload: FamiliaRequestPayload): Promise<Familia> {
  const res = await api.post<{ data: ApiFamilia }>('/familias', payload)
  return toFamilia(res.data.data)
}

export async function registerFamiliaSaida(id: number, payload: SaidaPayload): Promise<Familia> {
  const isoDate = toIsoDate(payload.data)
  const tipoSaida = payload.tipoDesligamento === 'Outro' && payload.tipoDesligamentoOutro
    ? payload.tipoDesligamentoOutro
    : payload.tipoDesligamento
  const res = await api.post<{ data: ApiFamilia }>(`/familias/${id}/saida`, toSaidaRequestPayload(isoDate, tipoSaida, payload))

  return toFamilia(res.data.data)
}

export function toIsoDate(value: string): string {
  const [day, month, year] = value.split('/')
  if (day?.length === 2 && month?.length === 2 && year?.length === 4) {
    return `${year}-${month}-${day}`
  }

  return value || new Date().toISOString().split('T')[0]
}
