// hooks/use-toast.ts
import { useState } from 'react';

type ToastMessage = {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
};

export function useToast() {
  const [message, setMessage] = useState<ToastMessage | null>(null);

  const toast = (msg: ToastMessage) => {
    setMessage(msg);
    // Auto hide after 3 seconds
    setTimeout(() => {
      setMessage(null);
    }, 3000);
  };

  return { toast, message };
}