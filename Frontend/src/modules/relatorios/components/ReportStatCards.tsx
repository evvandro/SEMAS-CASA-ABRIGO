import { Grid, Paper, Typography } from '@mui/material';

export interface ReportStat {
  label: string;
  value: string | number;
  helper?: string;
}

export function ReportStatCards({ stats }: { stats: ReportStat[] }) {
  return (
    <Grid container spacing={2}>
      {stats.map((stat) => (
        <Grid key={stat.label} size={{ xs: 6, sm: 6, md: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              height: '100%',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="body2" color="text.secondary" noWrap>
              {stat.label}
            </Typography>
            <Typography variant="h5" sx={{ mt: 0.5 }}>
              {stat.value}
            </Typography>
            {stat.helper && (
              <Typography variant="caption" color="text.secondary">
                {stat.helper}
              </Typography>
            )}
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}
