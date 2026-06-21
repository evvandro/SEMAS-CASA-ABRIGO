import { getApiErrorMessage } from '../utils/apiError';

export function parseApiError(error: unknown): string {
  return getApiErrorMessage(error);
}
