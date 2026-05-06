import { Box, Tooltip } from '@mui/material'
import AccessibleIcon from '@mui/icons-material/Accessible'
import PregnantWomanIcon from '@mui/icons-material/PregnantWoman'
import FavoriteIcon from '@mui/icons-material/Favorite'
import ElderlyIcon from '@mui/icons-material/Elderly'
import type { AlertCategory } from '../types'

const META: Record<AlertCategory, { label: string; color: string; Icon: typeof AccessibleIcon }> = {
  pcd:      { label: 'Pessoa com Deficiência', color: '#7C3AED', Icon: AccessibleIcon },
  gestante: { label: 'Gestante',               color: '#DB2777', Icon: PregnantWomanIcon },
  cronica:  { label: 'Doença Crônica',         color: '#DC2626', Icon: FavoriteIcon },
  idoso:    { label: 'Idoso 60+',              color: '#EA580C', Icon: ElderlyIcon },
}

export function AlertBadges({ alerts }: { alerts: AlertCategory[] }) {
  if (!alerts?.length) {
    return <Box component="span" sx={{ color: 'text.disabled', fontSize: 12 }}>—</Box>
  }
  return (
    <Box sx={{ display: 'inline-flex', gap: 0.5 }}>
      {alerts.map(a => {
        const m = META[a]
        const Icon = m.Icon
        return (
          <Tooltip key={a} title={m.label} arrow>
            <Box
              sx={{
                width: 22, height: 22,
                borderRadius: 1,
                bgcolor: m.color,
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Icon sx={{ fontSize: 13 }} />
            </Box>
          </Tooltip>
        )
      })}
    </Box>
  )
}

export const ALERT_META = META
