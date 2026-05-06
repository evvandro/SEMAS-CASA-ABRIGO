import { Box } from '@mui/material'
import { SECTOR_MAP } from '../data/sectors'

export function SectorPill({ sectorId }: { sectorId: string }) {
  const s = SECTOR_MAP[sectorId]
  if (!s) return null
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, fontSize: 13 }}>
      <Box sx={{ width: 8, height: 8, borderRadius: 0.5, bgcolor: s.color }} />
      {s.name}
    </Box>
  )
}
