<template>
  <div
    v-if="visible"
    class="minimizable-notification"
    :class="{
      'minimizable-notification--minimized': isMinimized,
    }"
  >
    <div class="minimizable-notification__header">
      <div class="minimizable-notification__icon">
        <font-awesome-icon :icon="icon" />
      </div>
      <div class="minimizable-notification__title">{{ title }}</div>
      <div class="minimizable-notification__actions">
        <button
          class="minimizable-notification__minimize"
          type="button"
          @click="toggleMinimize"
          :title="isMinimized ? 'הרחב' : 'מזער'"
        >
          {{ isMinimized ? "⬆" : "⬇" }}
        </button>
        <button
          class="minimizable-notification__close"
          type="button"
          @click="close"
          title="סגור"
        >
          ✕
        </button>
      </div>
    </div>
    <div
      v-if="!isMinimized"
      class="minimizable-notification__body"
    >
      <div class="minimizable-notification__message">{{ message }}</div>
      <div v-if="actionButton" class="minimizable-notification__actions-footer">
        <button
          class="minimizable-notification__action-btn"
          type="button"
          @click="handleAction"
        >
          {{ actionButton }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "MinimizableNotification",
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    icon: {
      type: Array,
      default: () => ["fas", "info-circle"],
    },
    actionButton: {
      type: String,
      default: null,
    },
  },
  data() {
    return {
      isMinimized: false,
    };
  },
  methods: {
    toggleMinimize() {
      this.isMinimized = !this.isMinimized;
    },
    close() {
      this.$emit("close");
    },
    handleAction() {
      this.$emit("action");
    },
  },
};
</script>

<style lang="scss" scoped>
$orange: #ff6a00;
$orange2: #ff8a2b;
$bg: #0b0b0f;
$text: rgba(255, 255, 255, 0.92);
$muted: rgba(255, 255, 255, 0.62);

.minimizable-notification {
  position: fixed;
  bottom: 20px;
  left: 20px;
  right: 20px;
  max-width: 500px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba($orange, 0.3);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  z-index: 10000;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);

  &--minimized {
    .minimizable-notification__body {
      display: none;
    }
  }
}

.minimizable-notification__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
}

.minimizable-notification__icon {
  font-size: 20px;
  color: $orange2;
  flex-shrink: 0;
}

.minimizable-notification__title {
  flex: 1;
  font-size: 16px;
  font-weight: 1000;
  color: $text;
}

.minimizable-notification__actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.minimizable-notification__minimize,
.minimizable-notification__close {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: $muted;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba($orange, 0.3);
    color: $text;
  }
}

.minimizable-notification__body {
  padding: 20px;
}

.minimizable-notification__message {
  font-size: 14px;
  line-height: 1.6;
  color: $text;
  margin-bottom: 16px;
}

.minimizable-notification__actions-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.minimizable-notification__action-btn {
  padding: 10px 20px;
  border-radius: 8px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba($orange, 0.15);
  color: $orange2;
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba($orange, 0.25);
    border-color: rgba($orange, 0.5);
    transform: translateY(-1px);
  }
}

@media (max-width: 768px) {
  .minimizable-notification {
    left: 10px;
    right: 10px;
    bottom: 10px;
  }
}
</style>

