import {
  Paper, Box, TextField, InputAdornment, Chip, Select, MenuItem,
  Button, Typography,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import AccessibleIcon from '@mui/icons-material/Accessible'
import PregnantWomanIcon from '@mui/icons-material/PregnantWoman'
import FavoriteIcon from '@mui/icons-material/Favorite'
import ElderlyIcon from '@mui/icons-material/Elderly'
import { SECTORS } from '../data/sectors'
import type { AcolhidosFilters } from '../types'

export type Filters = AcolhidosFilters

interface Props {
  search: string
  onSearch: (v: string) => void
  filters: Filters
  onFilters: (f: Filters) => void
  sectorId: string
  onSector: (id: string) => void
  count: number
  onNew: () => void
}

export function AcolhidosToolbar({ search, onSearch, filters, onFilters, sectorId, onSector, count, onNew }: Props) {
  const toggle = (k: keyof Filters) => onFilters({ ...filters, [k]: !filters[k] })
  const hasFilters = Object.values(filters).some(Boolean) || !!sectorId || !!search
  const clear = () => { onSearch(''); onFilters({ gestante: false, pcd: false, cronica: false, idoso: false }); onSector('') }

  return (
    <Paper variant="outlined" sx={{ p: 1.5, mb: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', borderRadius: 2 }}>
      <TextField
        placeholder="Buscar por nome, CPF ou prontuário…"
        value={search}
        onChange={e => onSearch(e.target.value)}
        size="small"
        sx={{ flex: 1, minWidth: 240, maxWidth: 420 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          },
        }}
        autoFocus
      />

      <Box sx={{ width: 1, height: 22, bgcolor: 'divider' }} />

      <Chip
        icon={<PregnantWomanIcon sx={{ fontSize: 14 }} />}
        label="Gestantes"
        clickable
        variant={filters.gestante ? 'filled' : 'outlined'}
        color={filters.gestante ? 'primary' : 'default'}
        onClick={() => toggle('gestante')}
        size="small"
      />
      <Chip
        icon={<AccessibleIcon sx={{ fontSize: 14 }} />}
        label="PCD"
        clickable
        variant={filters.pcd ? 'filled' : 'outlined'}
        color={filters.pcd ? 'primary' : 'default'}
        onClick={() => toggle('pcd')}
        size="small"
      />
      <Chip
        icon={<FavoriteIcon sx={{ fontSize: 14 }} />}
        label="Crônica"
        clickable
        variant={filters.cronica ? 'filled' : 'outlined'}
        color={filters.cronica ? 'primary' : 'default'}
        onClick={() => toggle('cronica')}
        size="small"
      />
      <Chip
        icon={<ElderlyIcon sx={{ fontSize: 14 }} />}
        label="Idosos"
        clickable
        variant={filters.idoso ? 'filled' : 'outlined'}
        color={filters.idoso ? 'primary' : 'default'}
        onClick={() => toggle('idoso')}
        size="small"
      />

      <Select
        size="small"
        value={sectorId}
        displayEmpty
        onChange={e => onSector(e.target.value)}
        sx={{ minWidth: 200, borderRadius: 999, '& .MuiSelect-select': { py: 0.6 } }}
      >
        <MenuItem value="">Todos os setores</MenuItem>
        {SECTORS.map(s => (
          <MenuItem key={s.id} value={s.id}>{s.name} — {s.sub}</MenuItem>
        ))}
      </Select>

      {hasFilters && (
        <Button size="small" onClick={clear} startIcon={<CloseIcon sx={{ fontSize: 14 }} />} color="inherit">
          Limpar
        </Button>
      )}

      <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Typography variant="caption">
          {count} {count === 1 ? 'pessoa' : 'pessoas'}
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={onNew}>
          Novo Cadastro
        </Button>
      </Box>
    </Paper>
  )
}
