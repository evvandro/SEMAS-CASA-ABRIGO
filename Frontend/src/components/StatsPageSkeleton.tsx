import { Grid, Skeleton, Stack } from '@mui/material';

/**
 * Esqueleto para páginas de indicadores (cards + painel), evitando o salto de
 * layout do spinner centralizado durante o primeiro carregamento.
 */
export function StatsPageSkeleton() {
  return (
    <Stack spacing={3}>
      <Skeleton variant="rounded" height={56} sx={{ maxWidth: 420 }} />
      <Grid container spacing={2}>
        {[0, 1, 2, 3].map((indice) => (
          <Grid key={indice} size={{ xs: 12, sm: 6, lg: 3 }}>
            <Skeleton variant="rounded" height={140} />
          </Grid>
        ))}
      </Grid>
      <Skeleton variant="rounded" height={320} />
    </Stack>
  );
}
