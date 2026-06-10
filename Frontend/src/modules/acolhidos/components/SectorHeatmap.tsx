import { Paper, Box, Typography, Tooltip } from '@mui/material';
import GridViewIcon from '@mui/icons-material/GridView';
import { useMemo } from 'react';
import type { Acolhido, Sector } from '../types';
import {
  bedKey,
  getSectorCapacitySummary,
  parseBedNumber,
} from '../utils/sectorCapacity';

interface Props {
  rows: Acolhido[];
  sectors: Sector[];
  activeSectorId: string;
  onSelectSector: (id: string) => void;
}

type BedState = 'priority' | 'occupied' | 'blocked' | 'free';

const cellBg = (
  active: boolean,
  pct: number,
  usableCapacity: number,
  occupied: number,
) => {
  if (!active) return '#F8FAFC';
  if (usableCapacity === 0 && occupied === 0) return '#F8FAFC';
  if (pct >= 95) return '#FEE2E2';
  if (pct >= 80) return '#FEF3C7';
  if (pct >= 50) return '#F0FDF4';
  return '#FFFFFF';
};

const blockedBedsLabel = (count: number) =>
  `${count} ${count === 1 ? 'leito interditado' : 'leitos interditados'}`;

const bedStateMeta = (state: BedState, sectorColor: string) => {
  if (state === 'priority')
    return { tip: 'Prioritário', bg: '#DC2626', border: 'none' };
  if (state === 'occupied')
    return { tip: 'Ocupado', bg: sectorColor, border: 'none' };
  if (state === 'blocked')
    return { tip: 'Interditado', bg: '#FEE2E2', border: '1px solid #FCA5A5' };
  return { tip: 'Livre', bg: 'transparent', border: '1px dashed #D1D5DB' };
};

const buildBeds = (
  sector: Sector & ReturnType<typeof getSectorCapacitySummary>,
  occupants: Acolhido[],
): BedState[] => {
  const beds = Array.from({ length: sector.capacity }, (_, index) => {
    const number = index + 1;
    return {
      number,
      state:
        !sector.active || sector.blockedBedKeys.has(bedKey(number))
          ? ('blocked' as BedState)
          : ('free' as BedState),
    };
  });
  const pending: Acolhido[] = [];
  const orderedOccupants = [...occupants].sort(
    (a, b) => Number(b.alerts.length > 0) - Number(a.alerts.length > 0),
  );

  orderedOccupants.forEach((occupant) => {
    const explicitBed = parseBedNumber(occupant.bed, sector.capacity);
    const target = explicitBed ? beds[explicitBed - 1] : null;

    if (target && target.state !== 'occupied' && target.state !== 'priority') {
      target.state = occupant.alerts.length > 0 ? 'priority' : 'occupied';
      return;
    }

    pending.push(occupant);
  });

  pending.forEach((occupant) => {
    const target =
      beds.find((bed) => bed.state === 'free') ??
      beds.find((bed) => bed.state === 'blocked');

    if (target)
      target.state = occupant.alerts.length > 0 ? 'priority' : 'occupied';
  });

  return beds.map((bed) => bed.state);
};

export function SectorHeatmap({
  rows,
  sectors,
  activeSectorId,
  onSelectSector,
}: Props) {
  const data = useMemo(
    () =>
      sectors.map((s) => {
        const occupants = rows.filter((r) => r.sectorId === s.id);
        const priority = occupants.filter((r) => r.alerts.length > 0).length;
        const occupied = occupants.length;
        const summary = getSectorCapacitySummary({ ...s, occupied });
        return { ...s, ...summary, occupants, priority };
      }),
    [rows, sectors],
  );

  const totalOccupied = data.reduce((a, s) => a + s.occupied, 0);
  const totalUsableCapacity = data.reduce((a, s) => a + s.usableCapacity, 0);
  const totalBlockedBeds = data.reduce((a, s) => a + s.blockedBedsCount, 0);

  return (
    <Paper variant="outlined" sx={{ p: 2, mt: 2, borderRadius: 2 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Box>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <GridViewIcon sx={{ fontSize: 16 }} /> Mapa de Setores
          </Typography>
          <Typography variant="caption">
            {totalOccupied} / {totalUsableCapacity} vagas úteis
            {totalBlockedBeds > 0
              ? ` · ${blockedBedsLabel(totalBlockedBeds)}`
              : ''}{' '}
            · clique para filtrar
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            flexWrap: 'wrap',
          }}
        >
          <LegendItem label="Prioritário" color="#DC2626" />
          <LegendItem label="Ocupado" color="primary.main" />
          <LegendItem label="Livre" border="1px dashed #D1D5DB" />
          <LegendItem
            label="Interditado"
            color="#FEE2E2"
            border="1px solid #FCA5A5"
          />
        </Box>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 1.5,
        }}
      >
        {data.map((s) => {
          const beds = buildBeds(s, s.occupants);
          const isActive = activeSectorId === s.id;
          return (
            <Paper
              key={s.id}
              variant="outlined"
              onClick={() => onSelectSector(isActive ? '' : s.id)}
              sx={{
                p: 1.5,
                cursor: 'pointer',
                bgcolor: cellBg(
                  s.active,
                  s.occupancyPercent,
                  s.usableCapacity,
                  s.occupied,
                ),
                borderColor: isActive
                  ? 'primary.main'
                  : !s.active || s.blockedBedsCount > 0
                    ? '#FCA5A5'
                    : 'divider',
                borderWidth: isActive ? 2 : 1,
                transition: 'all .15s',
                '&:hover': { transform: 'translateY(-1px)' },
              }}
            >
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
              >
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: 0.5,
                    bgcolor: s.color,
                  }}
                />
                <Typography
                  sx={{ fontSize: 13, fontWeight: 600, minWidth: 0 }}
                  noWrap
                >
                  {s.name}
                </Typography>
                <Typography
                  variant="caption"
                  color={
                    !s.active || s.blockedBedsCount > 0
                      ? 'error.main'
                      : 'text.secondary'
                  }
                  sx={{ ml: 'auto', flexShrink: 0 }}
                >
                  {!s.active
                    ? 'Interditado'
                    : s.blockedBedsCount > 0
                      ? blockedBedsLabel(s.blockedBedsCount)
                      : s.sub}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(8, 1fr)',
                  gap: 0.5,
                  my: 1,
                }}
              >
                {beds.map((state, i) => {
                  const meta = bedStateMeta(state, s.color);
                  return (
                    <Tooltip key={i} title={meta.tip} arrow>
                      <Box
                        sx={{
                          aspectRatio: '1',
                          borderRadius: 0.4,
                          bgcolor: meta.bg,
                          border: meta.border,
                        }}
                      />
                    </Tooltip>
                  );
                })}
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant="caption">
                  <strong style={{ color: '#0F172A' }}>{s.occupied}</strong> /{' '}
                  {s.usableCapacity} vagas úteis
                </Typography>
                <Typography sx={{ fontWeight: 600, fontSize: 13 }}>
                  {s.active ? `${s.occupancyPercent}%` : 'Interditado'}
                </Typography>
              </Box>
            </Paper>
          );
        })}
      </Box>
    </Paper>
  );
}

function LegendItem({
  label,
  color,
  border,
}: {
  label: string;
  color?: string;
  border?: string;
}) {
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
      <Box
        sx={{
          width: 10,
          height: 10,
          borderRadius: 0.4,
          bgcolor: color ?? 'transparent',
          border: border ?? 'none',
        }}
      />
      <Typography variant="caption">{label}</Typography>
    </Box>
  );
}
