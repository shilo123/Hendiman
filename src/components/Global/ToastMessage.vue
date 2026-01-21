<template>
  <Transition name="toast">
    <div v-if="isVisible" :class="['toast', type]" dir="rtl">
      <div class="toast-content">
        <span class="toast-icon">
          <span class="material-symbols-outlined">{{
            type === "success"
              ? "check_circle"
              : type === "error"
              ? "cancel"
              : type === "warning"
              ? "warning"
              : "info"
          }}</span>
        </span>
        <p class="toast-message">{{ content }}</p>
        <button
          class="toast-close"
          @click="hide"
          :aria-label="'סגור'"
        >
          <span class="material-symbols-outlined">close</span>
        </button>
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
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.toast {
  position: fixed;
  z-index: 100002;
  animation: fadeIn 0.3s ease-out;
  min-width: 320px;
  max-width: 500px;
  right: 24px;
  top: 24px;
  margin-top: 0;

  @media (max-width: 640px) {
    right: auto;
    left: 50%;
    top: 16px;
    min-width: auto;
    max-width: none;
    width: 75%;
    transform: translateX(-50%);
  }
}

.toast.success {
  background: linear-gradient(135deg, #f27f0d 0%, #ff9800 100%);
  border: 2px solid #ffb74d;
  box-shadow: 0 4px 20px rgba(242, 127, 13, 0.3);
}

.toast.error {
  background: linear-gradient(135deg, #1a1a1a 0%, #000000 100%);
  border: 2px solid #f27f0d;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.toast.warning {
  background: linear-gradient(135deg, #ea580c 0%, #ff6d00 100%);
  border: 2px solid #ff9800;
  box-shadow: 0 4px 20px rgba(234, 88, 12, 0.3);
}

.toast.info {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: 2px solid #60a5fa;
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-radius: 14px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);

  @media (max-width: 640px) {
    padding: 14px 18px;
    gap: 10px;
    border-radius: 12px;
  }
}

.toast-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .material-symbols-outlined {
    font-size: 24px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.toast.success .toast-icon .material-symbols-outlined {
  color: #ffffff;
}

.toast.error .toast-icon .material-symbols-outlined {
  color: #f27f0d;
}

.toast.warning .toast-icon .material-symbols-outlined {
  color: #ffffff;
}

.toast.info .toast-icon .material-symbols-outlined {
  color: #ffffff;
}

.toast-message {
  font-size: 15px;
  font-weight: 500;
  line-height: 1.5;
  flex: 1;
  margin: 0;
  text-align: right;

  @media (max-width: 640px) {
    font-size: 14px;
  }
}

.toast.success .toast-message {
  color: #ffffff;
}

.toast.error .toast-message {
  color: #f27f0d;
}

.toast.warning .toast-message {
  color: #ffffff;
}

.toast.info .toast-message {
  color: #ffffff;
}

.toast-close {
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  flex-shrink: 0;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.7;
  }

  .material-symbols-outlined {
    font-size: 20px;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.toast.success .toast-close .material-symbols-outlined {
  color: #ffffff;
}

.toast.error .toast-close .material-symbols-outlined {
  color: #f27f0d;
}

.toast.warning .toast-close .material-symbols-outlined {
  color: #ffffff;
}

.toast.info .toast-close .material-symbols-outlined {
  color: #ffffff;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: scale(0.9);
  
  @media (max-width: 640px) {
    transform: translateX(-50%) scale(0.9);
  }
}

.toast-leave-to {
  opacity: 0;
  transform: scale(0.9);
  
  @media (max-width: 640px) {
    transform: translateX(-50%) scale(0.9);
  }
}
</style>

