import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useUiStore } from "../../store/uiStore";

function Toast({ toast }) {
  const removeToast = useUiStore((state) => state.removeToast);

  useEffect(() => {
    const timer = window.setTimeout(() => removeToast(toast.id), toast.duration);
    return () => window.clearTimeout(timer);
  }, [removeToast, toast.duration, toast.id]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.98 }}
      className={`toast toast--${toast.tone}`}
    >
      <div>
        <strong>{toast.title}</strong>
        <p>{toast.description}</p>
      </div>
      <button onClick={() => removeToast(toast.id)} aria-label="Dismiss toast">
        ×
      </button>
    </motion.div>
  );
}

export function ToastViewport() {
  const toasts = useUiStore((state) => state.toasts);

  return (
    <div className="toast-viewport" aria-live="polite" aria-atomic="true">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
