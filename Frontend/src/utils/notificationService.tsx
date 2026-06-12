import { toast } from 'sonner';
import NotificationToast from './NotificationToast';

type NotificationType = 'success' | 'error';

function showToast(
  type: NotificationType,
  title: string,
  description?: string,
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
