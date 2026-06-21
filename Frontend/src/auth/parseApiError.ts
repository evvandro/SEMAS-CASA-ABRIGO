import { AxiosError } from 'axios';

function withRequestId(message: string, error: AxiosError): string {
  const requestId = error.response?.headers['x-request-id'];

  return requestId ? `${message} Código: ${requestId}` : message;
}

export function parseApiError(error: unknown): string {
  if (error instanceof AxiosError) {
    if (!error.response) {
      if (error.code === 'ERR_NETWORK') {
        return withRequestId(
          'Sem conexão com o servidor. Verifique se o backend está rodando.',
          error,
        );
      }
      if (error.code === 'ECONNABORTED') {
        return withRequestId(
          'A requisição demorou demais. Tente novamente.',
          error,
        );
      }
      return withRequestId(
        'Erro de rede. Verifique sua conexão e tente novamente.',
        error,
      );
    }

    const apiMessage = (error.response.data as { message?: string } | undefined)
      ?.message;
    if (apiMessage) {
      return withRequestId(apiMessage, error);
    }

    if (error.response.status === 422) {
      return withRequestId(
        'Dados inválidos. Verifique e tente novamente.',
        error,
      );
    }

    if (error.response.status === 503) {
      return withRequestId(
        'Serviço temporariamente indisponível. Tente novamente em instantes.',
        error,
      );
    }

    if (error.response.status >= 500) {
      return withRequestId(
        'Erro interno do servidor. Tente novamente mais tarde.',
        error,
      );
    }
  }

  return 'Não foi possível concluir a operação.';
}
