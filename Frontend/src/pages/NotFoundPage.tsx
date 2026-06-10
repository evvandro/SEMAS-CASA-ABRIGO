import { Box, Button, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';

export function NotFoundPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: 4,
        background:
          'radial-gradient(circle at top, #ffe9c7 0%, #f4f6f8 45%, #e8eef2 100%)',
      }}
    >
      <Typography
        sx={{
          fontSize: { xs: 80, sm: 120 },
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: '-4px',
          color: 'primary.main',
          opacity: 0.15,
          userSelect: 'none',
        }}
      >
        404
      </Typography>

      <Box sx={{ textAlign: 'center', mt: -4 }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Página não encontrada
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 360 }}>
          A rota solicitada não existe neste sistema. Verifique o endereço ou
          retorne ao painel.
        </Typography>
      </Box>

      <Button
        component={Link}
        to="/dashboard"
        variant="contained"
        startIcon={<HomeIcon />}
        sx={{ mt: 1 }}
      >
        Voltar ao painel
      </Button>
    </Box>
  );
}
