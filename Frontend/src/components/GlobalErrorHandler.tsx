import axios from 'axios';
import { useEffect } from 'react';
import { showErrorToast } from '../utils/notificationService';

export function GlobalErrorHandler() {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (axios.isAxiosError(event.reason)) {
        event.preventDefault();
        return;
      }

      showErrorToast(
        'Erro inesperado',
        'Não foi possível concluir a operação. Tente novamente.',
      );
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener(
        'unhandledrejection',
        handleUnhandledRejection,
      );
    };
  }, []);

  return null;
}
