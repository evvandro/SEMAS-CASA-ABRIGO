import { api } from './api'

export interface ApiSetor {
  id: number
  nome: string
  cor: string
  capacidade: number | null
  ativo: boolean
}

export interface SetorPayload {
  nome: string
  cor: string
  capacidade: number | null
}

export async function fetchSetores(): Promise<ApiSetor[]> {
  const res = await api.get<{ data: ApiSetor[] }>('/setores')
  return res.data.data
}

export async function createSetor(payload: SetorPayload): Promise<ApiSetor> {
  const res = await api.post<{ data: ApiSetor }>('/setores', payload)
  return res.data.data
}

export async function updateSetor(id: number, payload: Partial<SetorPayload & { ativo: boolean }>): Promise<ApiSetor> {
  const res = await api.patch<{ data: ApiSetor }>(`/setores/${id}`, payload)
  return res.data.data
}

export async function deleteSetor(id: number): Promise<void> {
  await api.delete(`/setores/${id}`)
}
