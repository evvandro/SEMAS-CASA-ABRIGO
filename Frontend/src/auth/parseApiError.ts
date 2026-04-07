import { AxiosError } from 'axios'

export function parseApiError(error: unknown): string {
  if (error instanceof AxiosError) {
    if (!error.response) {
      if (error.code === 'ERR_NETWORK') {
        return 'Sem conexão com o servidor. Verifique se o backend está rodando.'
      }
      if (error.code === 'ECONNABORTED') {
        return 'A requisição demorou demais. Tente novamente.'
      }
      return 'Erro de rede. Verifique sua conexão e tente novamente.'
    }

    const apiMessage = (error.response.data as { message?: string } | undefined)
      ?.message
    if (apiMessage) {
      return apiMessage
    }

    if (error.response.status === 422) {
      return 'Dados inválidos. Verifique e tente novamente.'
    }

    if (error.response.status === 503) {
      return 'Serviço temporariamente indisponível. Tente novamente em instantes.'
    }

    if (error.response.status >= 500) {
      return 'Erro interno do servidor. Tente novamente mais tarde.'
    }
  }

  return 'Não foi possível concluir a operação.'
}
