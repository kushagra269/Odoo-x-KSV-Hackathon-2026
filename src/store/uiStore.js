import { create } from "zustand";

const buildToast = (payload) => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  tone: "info",
  duration: 3200,
  ...payload,
});

export const useUiStore = create((set) => ({
  toasts: [],
  pushToast: (payload) =>
    set((state) => ({
      toasts: [...state.toasts, buildToast(payload)],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
}));
