<template>
  <Transition name="toast">
    <div v-if="isVisible" :class="['toast', type]">
      <div class="toast-content">
        <span class="toast-icon">{{
          type === "success"
            ? "✓"
            : type === "error"
            ? "✕"
            : type === "warning"
            ? "⚠"
            : "ℹ"
        }}</span>
        <span class="toast-message">{{ content }}</span>
        <button class="toast-close" @click="hide" aria-label="סגור">✕</button>
      </div>
    </div>
  </Transition>
</template>

<script>
export default {
  name: "ToastMessage",
  props: {
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      default: "success",
      validator: (value) =>
        ["success", "error", "warning", "info"].includes(value),
    },
    duration: {
      type: Number,
      default: 3000,
    },
  },
  data() {
    return {
      isVisible: false,
    };
  },
  mounted() {
    this.isVisible = true;
    setTimeout(() => {
      this.hide();
    }, this.duration);
  },
  methods: {
    hide() {
      this.isVisible = false;
      setTimeout(() => {
        this.$emit("close");
      }, 300); // Wait for animation to finish
    },
  },
};
</script>

<style lang="scss" scoped>
.toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  min-width: 300px;
  max-width: 500px;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  z-index: 10000;
  animation: slideInDown 0.3s ease-out;
}

.toast.success {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  border: 2px solid #f97316;
  box-shadow: 0 8px 24px rgba(249, 115, 22, 0.4);
}

.toast.error {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border: 2px solid #f97316;
  box-shadow: 0 8px 24px rgba(249, 115, 22, 0.3);
}

.toast.warning {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border: 2px solid #f59e0b;
  box-shadow: 0 8px 24px rgba(245, 158, 11, 0.4);
}

.toast.info {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: 2px solid #3b82f6;
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #ffffff;
  position: relative;
}

.toast-icon {
  font-size: 20px;
  font-weight: bold;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  flex-shrink: 0;
}

.toast-message {
  font-size: 15px;
  font-weight: 500;
  line-height: 1.5;
  flex: 1;
}

.toast-close {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: #ffffff;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: bold;
  padding: 0;
  flex-shrink: 0;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }
}

@keyframes slideInDown {
  from {
    transform: translateX(-50%) translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  transform: translateX(-50%) translateY(-100%);
  opacity: 0;
}

.toast-leave-to {
  transform: translateX(-50%) translateY(-100%);
  opacity: 0;
}

@media (max-width: 480px) {
  .toast {
    left: 50%;
    right: auto;
    min-width: auto;
    max-width: calc(100% - 40px);
    width: calc(100% - 40px);
  }
}
</style>
