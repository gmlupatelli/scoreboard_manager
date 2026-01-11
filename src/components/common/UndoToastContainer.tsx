'use client';

import UndoToast from '@/components/common/UndoToast';
import { useUndoQueue } from '@/hooks/useUndoQueue';

export default function UndoToastContainer() {
  const { toasts, executeUndo, removeToast } = useUndoQueue();

  return (
    <>
      {toasts.map((toast, index) => (
        <UndoToast
          key={toast.id}
          toast={toast}
          onUndo={() => executeUndo(toast.id)}
          onDismiss={() => removeToast(toast.id)}
          index={index}
        />
      ))}
    </>
  );
}
