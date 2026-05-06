import { Paper, Box, Typography, Tooltip } from '@mui/material'
import GridViewIcon from '@mui/icons-material/GridView'
import { useMemo } from 'react'
import { SECTORS } from '../data/sectors'
import type { Acolhido } from '../types'

interface Props {
  rows: Acolhido[]
  activeSectorId: string
  onSelectSector: (id: string) => void
}

const cellBg = (pct: number) => {
  if (pct >= 95) return '#FEE2E2'
  if (pct >= 80) return '#FEF3C7'
  if (pct >= 50) return '#F0FDF4'
  return '#FFFFFF'
}

export function SectorHeatmap({ rows, activeSectorId, onSelectSector }: Props) {
  const data = useMemo(() => SECTORS.map(s => {
    const occupants = rows.filter(r => r.sectorId === s.id)
    const priority = occupants.filter(r => r.alerts.length > 0).length
    const occupied = occupants.length
    const pct = Math.round((occupied / s.capacity) * 100)
    return { ...s, occupied, priority, pct }
  }), [rows])

  const totalOccupied = data.reduce((a, s) => a + s.occupied, 0)
  const totalCapacity = data.reduce((a, s) => a + s.capacity, 0)

  return (
    <Paper variant="outlined" sx={{ p: 2, mt: 2, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <GridViewIcon sx={{ fontSize: 16 }} /> Mapa de Setores
          </Typography>
          <Typography variant="caption">
            {totalOccupied} / {totalCapacity} leitos ocupados · clique para filtrar
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="caption">Ocupação</Typography>
          <Box sx={{
            height: 10, width: 100, borderRadius: 0.5,
            background: 'linear-gradient(to right, #DCFCE7 0%, #FEF3C7 50%, #FEE2E2 80%, #FCA5A5 100%)',
            border: '1px solid', borderColor: 'divider',
          }} />
          <Typography variant="caption">0% → 100%</Typography>
        </Box>
      </Box>

      <Box sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 1.5,
      }}>
        {data.map(s => {
          const beds = Array.from({ length: s.capacity }, (_, i) => {
            if (i < s.priority) return 'priority' as const
            if (i < s.occupied) return 'occupied' as const
            return 'free' as const
          })
          const isActive = activeSectorId === s.id
          return (
            <Paper
              key={s.id}
              variant="outlined"
              onClick={() => onSelectSector(isActive ? '' : s.id)}
              sx={{
                p: 1.5,
                cursor: 'pointer',
                bgcolor: cellBg(s.pct),
                borderColor: isActive ? 'primary.main' : 'divider',
                borderWidth: isActive ? 2 : 1,
                transition: 'all .15s',
                '&:hover': { transform: 'translateY(-1px)' },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: s.color }} />
                <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{s.name}</Typography>
                <Typography variant="caption" sx={{ ml: 'auto' }}>{s.sub}</Typography>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 0.5, my: 1 }}>
                {beds.map((b, i) => {
                  const tip = b === 'priority' ? 'Prioritário' : b === 'occupied' ? 'Ocupado' : 'Livre'
                  const bg = b === 'priority' ? '#DC2626' : b === 'occupied' ? s.color : 'transparent'
                  const border = b === 'free' ? '1px dashed #D1D5DB' : 'none'
                  return (
                    <Tooltip key={i} title={tip} arrow>
                      <Box sx={{
                        aspectRatio: '1',
                        borderRadius: 0.4,
                        bgcolor: bg,
                        border,
                      }} />
                    </Tooltip>
                  )
                })}
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption">
                  <strong style={{ color: '#0F172A' }}>{s.occupied}</strong> / {s.capacity} leitos
                </Typography>
                <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{s.pct}%</Typography>
              </Box>
            </Paper>
          )
        })}
      </Box>
    </Paper>
  )
}
