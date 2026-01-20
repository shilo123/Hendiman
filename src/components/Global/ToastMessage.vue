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
  position: relative;
  z-index: 100002;
  animation: fadeIn 0.3s ease-out;
  min-width: 320px;
  max-width: 500px;
  right: 24px;

  @media (max-width: 640px) {
    right: 16px;
    min-width: auto;
    max-width: none;
    width: calc(100vw - 32px);
  }
}

.toast.success {
  background: #f27f0d; // bg-orange-500
  border: 2px solid #fb923c; // border-orange-400
}

.toast.error {
  background: #000000; // bg-black
  border: 2px solid #f27f0d; // border-orange-500
}

.toast.warning {
  background: #ea580c; // bg-orange-600
  border: 2px solid #fb923c; // border-orange-400
}

.toast.info {
  background: #3b82f6; // bg-blue-500
  border: 2px solid #60a5fa; // border-blue-400
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);

  @media (max-width: 640px) {
    padding: 14px 18px;
    gap: 10px;
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
}

.toast-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>

