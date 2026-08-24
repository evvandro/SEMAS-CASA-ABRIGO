import {
  Chip,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import type { ApiSetor } from '../../../services/setoresService';

export interface PeriodoFilterValue {
  de: Dayjs;
  ate: Dayjs;
  setorId: number | null;
}

interface PeriodoFilterProps {
  value: PeriodoFilterValue;
  setores: ApiSetor[];
  onChange: (value: PeriodoFilterValue) => void;
  /** Desabilita o seletor de setor (relatórios sem recorte por setor). */
  setorDesabilitado?: boolean;
}

const PRESETS = [
  { label: '7 dias', dias: 6 },
  { label: '30 dias', dias: 29 },
  { label: '90 dias', dias: 89 },
] as const;

export function PeriodoFilter({
  value,
  setores,
  onChange,
  setorDesabilitado = false,
}: PeriodoFilterProps) {
  const hoje = dayjs();

  const aplicarPreset = (dias: number) => {
    onChange({ ...value, de: hoje.subtract(dias, 'day'), ate: hoje });
  };

  const presetAtivo = (dias: number) =>
    value.ate.isSame(hoje, 'day') &&
    value.de.isSame(hoje.subtract(dias, 'day'), 'day');

  const mesAtualAtivo =
    value.de.isSame(hoje.startOf('month'), 'day') &&
    value.ate.isSame(hoje, 'day');

  return (
    <Paper
      elevation={0}
      sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        gap={2}
        alignItems={{ xs: 'stretch', md: 'center' }}
      >
        <Stack direction="row" gap={1.5} alignItems="center">
          <DatePicker
            label="De"
            value={value.de}
            maxDate={value.ate}
            format="DD/MM/YYYY"
            onChange={(novaData) => {
              if (novaData?.isValid()) onChange({ ...value, de: novaData });
            }}
            slotProps={{ textField: { size: 'small', sx: { width: 160 } } }}
          />
          <Typography variant="body2" color="text.secondary">
            até
          </Typography>
          <DatePicker
            label="Até"
            value={value.ate}
            minDate={value.de}
            format="DD/MM/YYYY"
            onChange={(novaData) => {
              if (novaData?.isValid()) onChange({ ...value, ate: novaData });
            }}
            slotProps={{ textField: { size: 'small', sx: { width: 160 } } }}
          />
        </Stack>

        <Stack direction="row" gap={0.75} flexWrap="wrap">
          {PRESETS.map((preset) => (
            <Chip
              key={preset.label}
              label={preset.label}
              size="small"
              color={presetAtivo(preset.dias) ? 'primary' : 'default'}
              variant={presetAtivo(preset.dias) ? 'filled' : 'outlined'}
              onClick={() => aplicarPreset(preset.dias)}
            />
          ))}
          <Chip
            label="Este mês"
            size="small"
            color={mesAtualAtivo ? 'primary' : 'default'}
            variant={mesAtualAtivo ? 'filled' : 'outlined'}
            onClick={() =>
              onChange({ ...value, de: hoje.startOf('month'), ate: hoje })
            }
          />
        </Stack>

        <TextField
          select
          size="small"
          label="Setor"
          value={value.setorId ?? ''}
          disabled={setorDesabilitado}
          onChange={(event) =>
            onChange({
              ...value,
              setorId: event.target.value === '' ? null : Number(event.target.value),
            })
          }
          sx={{ width: { xs: '100%', md: 200 }, ml: { md: 'auto' } }}
          helperText={setorDesabilitado ? 'Não se aplica a este relatório' : undefined}
        >
          <MenuItem value="">Todos os setores</MenuItem>
          {setores.map((setor) => (
            <MenuItem key={setor.id} value={setor.id}>
              {setor.nome}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
    </Paper>
  );
}
