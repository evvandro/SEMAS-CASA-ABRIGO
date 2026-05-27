export type AlertCategory = 'pcd' | 'gestante' | 'cronica' | 'idoso'

export type AcolhidoAction = 'view' | 'edit' | 'editFull' | 'print' | 'label' | 'exit' | 'exitFamily'

export type CadastroAction = Exclude<AcolhidoAction, 'view' | 'label' | 'editFull'>

export type AcolhidosFilters = Record<AlertCategory, boolean>

export interface Acolhido {
  apiId: number
  id: string             // codigo_pulseira ou String(id)
  name: string
  cpf: string            // formatado: '000.000.000-00'
  age: number
  sectorId: string       // String(setor.id) da API
  alerts: AlertCategory[]
  entry: string          // ISO date
  entryTime?: string | null
  exitDate?: string | null
  exitTime?: string | null
  exitType?: string | null
  exitDestination?: string | null
  exitCity?: string | null
  exitCondition?: string | null
  exitResponsible?: string | null
  family?: number
  birthDate?: string | null
  phone?: string | null
  gender?: string | null
  bed?: string | null
  notes?: string | null
  belongings?: string | null
  familyCode?: string | null
  familyResponsible?: string | null
  familyId?: number | null
  familyMembersCount?: number | null
  kinship?: string | null
}

export interface FamiliaMembro extends Acolhido {
  active: boolean
}

export interface Familia {
  id: number
  codigo: string
  responsavelNome: string | null
  setorId: string
  setorNome?: string | null
  acolhidosCount: number
  dataEntrada: string | null
  dataSaida: string | null
  horaSaida?: string | null
  tipoSaida?: string | null
  destinoInformado?: string | null
  municipioDestino?: string | null
  condicaoSaida?: string | null
  responsavelDesligamento?: string | null
  observacoes?: string | null
  ativo: boolean
  membros?: FamiliaMembro[]
}

export interface Sector {
  id: string
  name: string           // 'Setor A-1'
  sub: string            // 'Famílias'
  color: string          // hex
  capacity: number
  occupied: number       // calculado a partir dos acolhidos
  active: boolean
  blockedBeds: string[]
}

export interface CadastroPayload {
  name: string
  cpf: string
  birth: string          // 'DD/MM/YYYY'
  pcd: boolean
  gestante: boolean
  cronica: boolean
  idoso: boolean
  sectorId: string
  bed?: string
  notes?: string
}

export interface SaidaPayload {
  abrigoNome: string
  abrigoMunicipio: string
  abrigoGestor: string
  prontuario?: string
  registroIndividual?: string
  nome: string
  cpfRg: string
  responsavelFamiliar?: string
  integrantes: Array<{nome: string, documento: string}>
  data: string
  hora: string
  tipoDesligamento: string
  tipoDesligamentoOutro?: string
  destinoInformado: string
  destinoEndereco: string
  destinoMunicipio: string
  destinoTelefone?: string
  encaminhamentos: string[]
  encaminhamentoOutro?: string
  encaminhamentoResumo?: string
  condicoesNaSaida: string
  condicoesObservacoes?: string
  responsavelNome: string
  responsavelCargo: string
  responsavelData: string
}
