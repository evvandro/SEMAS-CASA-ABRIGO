import { Alert, Button, Skeleton, Stack } from '@mui/material';

export function RelatorioLoading() {
  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2}>
        {[0, 1, 2, 3].map((index) => (
          <Skeleton
            key={index}
            variant="rounded"
            height={92}
            sx={{ flex: 1 }}
          />
        ))}
      </Stack>
      <Skeleton variant="rounded" height={280} />
      <Skeleton variant="rounded" height={200} />
    </Stack>
  );
}

export function RelatorioError({
  message = 'Não foi possível carregar o relatório.',
  onRetry,
}: {
  message?: string;
  onRetry: () => void;
}) {
  return (
    <Alert
      severity="error"
      action={
        <Button color="inherit" size="small" onClick={onRetry}>
          Tentar novamente
        </Button>
      }
    >
      {message}
    </Alert>
  );
}

export function RelatorioForbidden() {
  return (
    <Alert severity="warning">
      Seu perfil não tem permissão para visualizar relatórios.
    </Alert>
  );
}
