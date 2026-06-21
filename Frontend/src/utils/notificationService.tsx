import { toast } from 'sonner';
import NotificationToast from './NotificationToast';
import {
  getApiErrorMessage,
  getApiErrorTitle,
  getApiRequestId,
} from './apiError';

type NotificationType = 'success' | 'error';

let lastApiError: { fingerprint: string; shownAt: number } | null = null;

function showToast(
  type: NotificationType,
  title: string,
  description?: string,
  id?: string,
) {
  toast.custom(
    (id) => (
      <NotificationToast
        id={id}
        title={title}
        description={description}
        variant={type}
      />
    ),
    {
      id,
      duration: 0,
      closeButton: false,
      dismissible: false,
      style: {
        padding: 0,
        background: 'transparent',
        boxShadow: 'none',
      },
    },
  );
}

export function showSuccessToast(title: string, description?: string) {
  showToast('success', title, description);
}

export function showErrorToast(title: string, description?: string) {
  showToast('error', title, description);
}

export function showApiErrorToast(error: unknown) {
  const requestId = getApiRequestId(error);
  const title = getApiErrorTitle(error);
  const message = getApiErrorMessage(error);
  const fingerprint = `${title}|${message}`;
  const now = Date.now();

  if (
    lastApiError?.fingerprint === fingerprint &&
    now - lastApiError.shownAt < 1500
  ) {
    return;
  }

  lastApiError = { fingerprint, shownAt: now };

  showToast(
    'error',
    title,
    message,
    requestId ? `api-error-${requestId}` : undefined,
  );
}
