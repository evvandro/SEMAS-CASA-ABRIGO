import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AppsIcon from '@mui/icons-material/Apps';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { parseApiError } from '../auth/parseApiError';
import { showErrorToast } from '../utils/notificationService';

interface LocationState {
  from?: {
    pathname: string;
  };
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from =
    (location.state as LocationState | null)?.from?.pathname ?? '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = email.trim();

    if (!normalizedEmail || !password) {
      showErrorToast(
        'Dados incompletos',
        'Informe e-mail e senha para continuar.',
      );
      return;
    }

    if (!normalizedEmail.includes('@')) {
      showErrorToast(
        'E-mail inválido',
        'O e-mail precisa conter @ para continuar.',
      );
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      showErrorToast('E-mail inválido', 'Informe um e-mail funcional válido.');
      return;
    }

    setIsSubmitting(true);

    try {
      await login(
        {
          email: normalizedEmail,
          password,
          device_name: 'frontend-web',
        },
        remember,
      );

      navigate(from, { replace: true });
    } catch (error: unknown) {
      showErrorToast('Erro ao entrar', parseApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1.1fr 1fr' },
        bgcolor: 'background.paper',
      }}
    >
      <Box
        sx={{
          minHeight: { xs: 360, md: '90vh' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: { xs: 3, sm: 5, lg: 8 },
          color: 'common.white',
          bgcolor: '#0f4f58',
          position: 'relative',
          overflow: 'hidden',
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: '58% -18% -20% 40%',
            bgcolor: 'rgba(255,255,255,0.06)',
            transform: 'skewX(-18deg)',
          },
        }}
      >
        <Stack
          spacing={{ xs: 4, md: 6 }}
          sx={{ position: 'relative', zIndex: 1 }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box
              sx={{
                width: 88,
                height: 72,
                borderRadius: 3,
                bgcolor: 'common.white',
                overflow: 'hidden',
                boxShadow: '0 18px 45px rgba(0,0,0,0.18)',
                flexShrink: 0,
              }}
            >
              <Box
                component="img"
                src="/bandeira-sao-bento-do-sul.png"
                alt="Bandeira de São Bento do Sul"
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </Box>
            <Box>
              <Typography
                variant="h5"
                sx={{ fontWeight: 800, lineHeight: 1.1 }}
              >
                Sistema Casa Abrigo
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.72)', mt: 0.5 }}>
                Assistência Social de São Bento do Sul
              </Typography>
            </Box>
          </Stack>

          <Stack spacing={3} sx={{ maxWidth: 620 }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box
                sx={{ width: 28, height: 2, bgcolor: 'rgba(255,255,255,0.55)' }}
              />
              <Typography
                variant="overline"
                sx={{
                  color: 'rgba(255,255,255,0.68)',
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                }}
              >
                SEMAS · Gestão de acolhimento
              </Typography>
            </Stack>

            <Typography
              component="h3"
              sx={{
                fontSize: { xs: 38, sm: 52, lg: 64 },
                lineHeight: 1.08,
                fontWeight: 900,
                letterSpacing: 0,
              }}
            >
              Cada pessoa acolhida com{' '}
              <Box component="span" sx={{ color: '#91d4c7' }}>
                dignidade
              </Box>{' '}
              e agilidade.
            </Typography>

            <Typography
              sx={{
                maxWidth: 560,
                color: 'rgba(255,255,255,0.74)',
                fontSize: 18,
                lineHeight: 1.7,
              }}
            >
              Plataforma de gestão da Casa Abrigo Temporário: cadastro rápido,
              controle de setores e acompanhamento de famílias, pronta para
              operar mesmo em situações de calamidade.
            </Typography>

            <Stack spacing={2.25} sx={{ pt: 2 }}>
              <Feature
                icon={<AddIcon />}
                label="Cadastro de acolhidos em segundos"
              />
              <Feature
                icon={<AppsIcon />}
                label="Mapa de setores e ocupação em tempo real"
              />
              <Feature
                icon={<FavoriteBorderIcon />}
                label="Atenção a perfis prioritários"
              />
            </Stack>
          </Stack>
        </Stack>

        <Typography
          variant="body2"
          sx={{
            position: 'relative',
            zIndex: 1,
            color: 'rgba(255,255,255,0.48)',
            mt: 4,
          }}
        >
          © 2026 SEMAS · Prefeitura de São Bento do Sul
        </Typography>
      </Box>

      <Box
        sx={{
          minHeight: { xs: 'auto', md: '100vh' },
          display: 'grid',
          placeItems: 'center',
          px: { xs: 3, sm: 5 },
          py: { xs: 4, md: 6 },
          '@media (max-height:760px)': { py: 3 },
        }}
      >
        <Stack
          spacing={{ xs: 2.5, md: 3 }}
          component="form"
          onSubmit={handleSubmit}
          noValidate
          sx={{ width: '100%', maxWidth: 520 }}
        >
          <Stack spacing={1}>
            <Typography variant="h4" sx={{ fontWeight: 850, color: '#12313a' }}>
              Entrar no sistema
            </Typography>
            <Typography color="text.secondary">
              Acesso restrito à equipe da Casa Abrigo.
            </Typography>
          </Stack>

          <Stack spacing={{ xs: 2, md: 2.5 }}>
            <TextField
              label="E-mail funcional"
              placeholder="nome@saobentodosul.sc.gov.br"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              fullWidth
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <MailOutlineIcon sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={fieldSx}
            />

            <TextField
              label="Senha"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              fullWidth
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={
                          showPassword ? 'Ocultar senha' : 'Visualizar senha'
                        }
                        onClick={() => setShowPassword((prev) => !prev)}
                        edge="end"
                      >
                        {showPassword ? (
                          <VisibilityOffIcon />
                        ) : (
                          <VisibilityIcon />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={fieldSx}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                  size="small"
                  sx={{
                    color: '#1b7280',
                    '&.Mui-checked': { color: '#1b7280' },
                  }}
                />
              }
              label={
                <Typography variant="body2" color="text.secondary">
                  Manter conectado
                </Typography>
              }
            />
          </Stack>

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isSubmitting}
            endIcon={!isSubmitting ? <ArrowForwardIcon /> : undefined}
            sx={{
              minHeight: 56,
              borderRadius: 2,
              bgcolor: '#176f7c',
              fontWeight: 800,
              fontSize: 16,
              boxShadow: 'none',
              '&:hover': { bgcolor: '#125b66', boxShadow: 'none' },
              '@media (max-height:760px)': { minHeight: 48 },
            }}
          >
            {isSubmitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Entrar'
            )}
          </Button>

          <Stack direction="row" alignItems="center" spacing={2}>
            <Divider sx={{ flex: 1 }} />
            <Typography variant="body2" color="text.disabled">
              acesso seguro
            </Typography>
            <Divider sx={{ flex: 1 }} />
          </Stack>

          <Box
            sx={{
              p: 2.5,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: '#f6f8f8',
              textAlign: 'center',
            }}
          >
            <Typography color="text.secondary">
              Sem acesso? Solicite credenciais à{' '}
              <Box
                component="span"
                sx={{ color: 'text.primary', fontWeight: 800 }}
              >
                Coordenação da SEMAS
              </Box>
              <br />
              ou pelo ramal{' '}
              <Box
                component="span"
                sx={{ color: 'text.primary', fontWeight: 800 }}
              >
                (47) 3631-6013.
              </Box>
            </Typography>
          </Box>

          <Typography
            variant="body2"
            color="text.disabled"
            sx={{ textAlign: 'center' }}
          >
            Ao entrar você concorda com a{' '}
            <Link component="button" type="button" color="inherit">
              política de uso
            </Link>{' '}
            do sistema.
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    minHeight: 58,
    borderRadius: 2,
    bgcolor: 'common.white',
    '@media (max-height:760px)': { minHeight: 50 },
  },
};

function Feature({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <Stack direction="row" alignItems="center" spacing={2}>
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 2,
          display: 'grid',
          placeItems: 'center',
          bgcolor: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.15)',
          color: 'rgba(255,255,255,0.82)',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Typography sx={{ color: 'rgba(255,255,255,0.88)', fontSize: 17 }}>
        {label}
      </Typography>
    </Stack>
  );
}
