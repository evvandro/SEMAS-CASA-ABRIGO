import { Component } from 'react'
import type { ErrorInfo, PropsWithChildren, ReactNode } from 'react'
import { Alert, Box, Button, Stack, Tooltip, Typography } from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<
  PropsWithChildren,
  ErrorBoundaryState
> {
  constructor(props: PropsWithChildren) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            p: 2,
            bgcolor: 'background.default',
          }}
        >
          <Stack spacing={2} alignItems="center" sx={{ maxWidth: 480 }}>
            <Typography variant="h5" fontWeight={700}>
              Algo deu errado
            </Typography>

            <Typography color="text.secondary" textAlign="center">
              Ocorreu um erro inesperado. Tente recarregar a página.
            </Typography>

            <Tooltip
              title={this.state.error?.message ?? 'Erro desconhecido'}
              arrow
              placement="bottom"
            >
              <Alert severity="error" sx={{ width: '100%', cursor: 'help' }}>
                Passe o mouse para ver detalhes técnicos
              </Alert>
            </Tooltip>

            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={this.handleReset}
            >
              Tentar novamente
            </Button>
          </Stack>
        </Box>
      )
    }

    return this.props.children
  }
}
