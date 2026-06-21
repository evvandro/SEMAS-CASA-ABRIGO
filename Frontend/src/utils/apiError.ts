import axios from 'axios';

interface ApiErrorPayload {
  message?: string;
  errors?: Record<string, string[]>;
}

export function getApiValidationErrors(
  error: unknown,
): Record<string, string[]> {
  if (!axios.isAxiosError<ApiErrorPayload>(error)) {
    return {};
  }

  return error.response?.data?.errors ?? {};
}

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Não foi possível concluir a operação.',
): string {
  if (!axios.isAxiosError<ApiErrorPayload>(error)) {
    return error instanceof Error && error.message ? error.message : fallback;
  }

  if (!error.response) {
    if (error.code === 'ERR_NETWORK') {
      return 'Sem conexão com o servidor. Verifique sua conexão e tente novamente.';
    }

    if (error.code === 'ECONNABORTED') {
      return 'A requisição demorou demais. Tente novamente.';
    }

    return 'Erro de rede. Verifique sua conexão e tente novamente.';
  }

  const validationMessages = Object.values(
    getApiValidationErrors(error),
  ).flat();

  if (validationMessages.length > 0) {
    return [...new Set(validationMessages)].slice(0, 3).join('\n');
  }

  if (error.response.data?.message) {
    return error.response.data.message;
  }

  if (error.response.status === 422) {
    return 'Dados inválidos. Revise os campos e tente novamente.';
  }

  if (error.response.status === 429) {
    return 'Muitas tentativas em pouco tempo. Aguarde um instante e tente novamente.';
  }

  if (error.response.status === 503) {
    return 'Serviço temporariamente indisponível. Tente novamente em instantes.';
  }

  if (error.response.status >= 500) {
    return 'Erro interno do servidor. Tente novamente mais tarde.';
  }

  return fallback;
}

export function getApiErrorTitle(error: unknown): string {
  if (!axios.isAxiosError(error) || !error.response) {
    return 'Falha de conexão';
  }

  if (error.response.status === 422) return 'Revise os dados';
  if (error.response.status === 403) return 'Acesso negado';
  if (error.response.status === 404) return 'Registro não encontrado';
  if (error.response.status === 429) return 'Muitas tentativas';
  if (error.response.status >= 500) return 'Serviço indisponível';

  return 'Não foi possível concluir';
}

export function getApiRequestId(error: unknown): string | undefined {
  if (!axios.isAxiosError(error)) {
    return undefined;
  }

  return (
    error.response?.headers['x-request-id'] ??
    error.config?.headers?.['X-Request-ID']
  )?.toString();
}
