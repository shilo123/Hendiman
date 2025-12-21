import { createApp } from "vue";
import ToastMessage from "@/components/ToastMessage.vue";

let toastContainer = null;

export function useToast() {
  const showToast = (content, type = "success", duration = 3000) => {
    // Create container if it doesn't exist
    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.id = "toast-container";
      document.body.appendChild(toastContainer);
    }

    // Create toast component instance
    const toastApp = createApp(ToastMessage, {
      content,
      type,
      duration,
      onClose: () => {
        toastApp.unmount();
        document.body.removeChild(toastContainer);
        toastContainer = null;
      },
    });

    // Mount toast
    toastApp.mount(toastContainer);
  };

  return {
    showToast,
    showSuccess: (content, duration) => showToast(content, "success", duration),
    showError: (content, duration) => showToast(content, "error", duration),
    showWarning: (content, duration) => showToast(content, "warning", duration),
  };
}
