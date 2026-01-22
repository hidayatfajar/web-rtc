export const useAppToast = () => {
  const toast = useToast();

  return {
    success: (title: string, description?: string, duration?: number) =>
      toast.add({
        title,
        description,
        icon: "i-lucide-check",
        color: "success",
        duration: duration || 3000,
      }),

    error: (title: string, description?: string, duration?: number) =>
      toast.add({
        title,
        description,
        icon: "i-lucide-x",
        color: "error",
        duration: duration || 3000,
      }),

    info: (title: string, description?: string, duration?: number) =>
      toast.add({
        title,
        description,
        icon: "i-lucide-info",
        color: "info",
        duration: duration || 3000,
      }),

    warn: (title: string, description?: string, duration?: number) =>
      toast.add({
        title,
        description,
        icon: "i-lucide-alert-triangle",
        color: "warning",
        duration: duration || 3000,
      }),
  };
};
