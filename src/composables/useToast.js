import { createApp } from "vue";
import ToastMessage from "@/components/Global/ToastMessage.vue";

let toastContainer = null;
let toastApp = null;

export function useToast() {
  const showToast = (content, type = "success", duration = 3000) => {
    // If there's an existing toast app, unmount it first
    if (toastApp) {
      try {
        toastApp.unmount();
      } catch (e) {
        // Ignore errors if already unmounted
      }
      toastApp = null;
    }

    // Remove existing container if it exists
    if (toastContainer) {
      if (toastContainer.parentNode) {
        toastContainer.parentNode.removeChild(toastContainer);
      }
      toastContainer = null;
    }

    // Create new container
    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    document.body.appendChild(toastContainer);

    // Create toast component instance
    toastApp = createApp(ToastMessage, {
      content,
      type,
      duration,
      onClose: () => {
        if (toastApp) {
          try {
            toastApp.unmount();
          } catch (e) {
            // Ignore errors
          }
          toastApp = null;
        }
        if (toastContainer && toastContainer.parentNode) {
          toastContainer.parentNode.removeChild(toastContainer);
        }
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
    showInfo: (content, duration) => showToast(content, "info", duration),
  };
}
