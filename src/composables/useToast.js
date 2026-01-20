import { createApp } from "vue";
import ToastMessage from "@/components/Global/ToastMessage.vue";

let toastContainer = null;
let toastApps = []; // Array to hold multiple toast instances

// Ensure container exists
function ensureContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    toastContainer.style.cssText = `
      position: fixed;
      top: 0;
      right: 0;
      z-index: 100002;
      pointer-events: none;
    `;
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

// Remove a specific toast
function removeToast(id) {
  const index = toastApps.findIndex((app) => app.id === id);
  if (index !== -1) {
    const app = toastApps[index];
    try {
      app.instance.unmount();
    } catch (e) {
      // Ignore errors
    }
    toastApps.splice(index, 1);

    // Remove container if no more toasts
    if (toastApps.length === 0 && toastContainer) {
      if (toastContainer.parentNode) {
        toastContainer.parentNode.removeChild(toastContainer);
      }
      toastContainer = null;
    }
  }
}

export function useToast() {
  const showToast = (content, type = "success", duration = 4000) => {
    ensureContainer();

    const id = Date.now() + Math.random();
    const container = document.createElement("div");
    container.style.cssText = `
      pointer-events: auto;
      margin-bottom: 8px;
    `;
    toastContainer.appendChild(container);

    // Calculate top position based on existing toasts
    const topOffset = 24 + toastApps.length * 80; // 24px base + 80px per toast
    container.style.top = `${topOffset}px`;

    // Create toast component instance
    const toastApp = createApp(ToastMessage, {
      content,
      type,
      duration,
      onClose: () => {
        removeToast(id);
      },
    });

    // Mount toast
    toastApp.mount(container);

    // Store the app instance
    toastApps.push({
      id,
      instance: toastApp,
      container,
    });

    // Auto-remove after duration
    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  return {
    showToast,
    showSuccess: (content, duration) => showToast(content, "success", duration),
    showError: (content, duration) => showToast(content, "error", duration),
    showWarning: (content, duration) => showToast(content, "warning", duration),
    showInfo: (content, duration) => showToast(content, "info", duration),
  };
}
