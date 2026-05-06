import type { Sector } from '../types'

export const SECTORS: Sector[] = [
  { id: 'A1', name: 'Setor A-1', sub: 'Famílias',         color: '#4F46E5', capacity: 32, occupied: 28 },
  { id: 'A2', name: 'Setor A-2', sub: 'Famílias',         color: '#0EA5E9', capacity: 32, occupied: 31 },
  { id: 'B1', name: 'Setor B-1', sub: 'Gestantes/PCD',    color: '#DB2777', capacity: 20, occupied: 14 },
  { id: 'B2', name: 'Setor B-2', sub: 'Idosos',           color: '#EA580C', capacity: 18, occupied: 12 },
  { id: 'C',  name: 'Setor C',   sub: 'Saúde/Isolamento', color: '#DC2626', capacity: 12, occupied: 4 },
  { id: 'T',  name: 'Triagem',   sub: 'Entrada',          color: '#64748B', capacity: 10, occupied: 3 },
]

export const SECTOR_MAP: Record<string, Sector> = Object.fromEntries(
  SECTORS.map(s => [s.id, s])
)
