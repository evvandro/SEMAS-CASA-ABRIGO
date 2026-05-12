import { Box } from '@mui/material'
import type { Sector } from '../types'

export function SectorPill({ sectorId, sectorMap }: { sectorId: string; sectorMap: Record<string, Sector> }) {
  const s = sectorMap[sectorId]
  if (!s) return null
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, fontSize: 13 }}>
      <Box sx={{ width: 8, height: 8, borderRadius: 0.5, bgcolor: s.color }} />
      {s.name}
    </Box>
  )
}
