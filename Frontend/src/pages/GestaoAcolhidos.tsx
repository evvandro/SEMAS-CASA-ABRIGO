import {
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

const indicadores = [
  {
    title: 'Cadastros ativos',
    description:
      'Acompanhe acolhidos com permanencia em andamento e historico recente.',
  },
];

export function GestaoAcolhidos() {
  return (
    <Stack spacing={3}>
      <Card
        elevation={0}
        sx={{
          backgroundColor: 'common.white',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <CardContent>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ width: '100%' }}
            spacing={1}
          >
            <Typography variant="h4">Gestao de Acolhidos</Typography>
            <Button variant="contained" startIcon={<PersonAddIcon />}>
              Novo cadastro
            </Button>
          </Stack>
          <Typography variant="h6" color="text.secondary">
            Sistema de gerenciamento de pessoas e famílias acolhidas.
          </Typography>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {indicadores.map((item) => (
          <Grid key={item.title} size={{ xs: 12, md: 12 }}>
            <Card
              elevation={0}
              sx={{
                backgroundColor: 'common.white',
                border: '1px solid',
                borderColor: 'divider',
                height: '100%',
                widht: '100%',
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {item.title}
                </Typography>
                <Typography color="text.secondary">
                  {item.description}
                </Typography>

                <Button variant="contained">Buscar</Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}
