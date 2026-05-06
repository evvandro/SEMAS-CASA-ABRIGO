export type AlertCategory = 'pcd' | 'gestante' | 'cronica' | 'idoso'

export type AcolhidoAction = 'view' | 'edit' | 'print' | 'exit'

export type CadastroAction = Exclude<AcolhidoAction, 'view'>

export type AcolhidosFilters = Record<AlertCategory, boolean>

export interface Acolhido {
  id: string             // ex. 'AC-0234'
  name: string
  cpf: string            // formatado: '000.000.000-00'
  age: number
  sectorId: string       // FK para Sector.id
  alerts: AlertCategory[]
  entry: string          // ISO datetime
  family: number
}

export interface Sector {
  id: string
  name: string           // 'Setor A-1'
  sub: string            // 'Famílias'
  color: string          // hex
  capacity: number
  occupied: number       // calculado a partir dos acolhidos
}

export interface CadastroPayload {
  name: string
  cpf: string
  birth: string          // 'DD/MM/YYYY'
  family: number
  pcd: boolean
  gestante: boolean
  cronica: boolean
  idoso: boolean
  sectorId: string
  notes?: string
}
