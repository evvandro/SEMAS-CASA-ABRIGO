import type { Acolhido, AlertCategory, CadastroPayload } from '../types'
import { calculateAgeFromBrazilianDate } from './date'

export const createAcolhidoFromCadastro = (payload: CadastroPayload): Acolhido => {
  const age = calculateAgeFromBrazilianDate(payload.birth)
  const alerts: AlertCategory[] = []

  if (payload.pcd) alerts.push('pcd')
  if (payload.gestante) alerts.push('gestante')
  if (payload.cronica) alerts.push('cronica')
  if (payload.idoso || age >= 60) alerts.push('idoso')

  return {
    id: `AC-${String(235 + Math.floor(Math.random() * 40)).padStart(4, '0')}`,
    name: payload.name.trim(),
    cpf: payload.cpf,
    age,
    sectorId: payload.sectorId,
    alerts,
    entry: new Date().toISOString(),
    family: Number(payload.family) || 1,
  }
}
