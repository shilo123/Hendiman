<template>
  <div class="action-buttons">
    <button
      class="button"
      type="button"
      @click="$emit('create-call')"
      aria-label="צור קריאה חדשה"
    >
      <span class="button-text">צור קריאה</span>
      <span class="button-shine"></span>
    </button>
  </div>
</template>

<script>
export default {
  name: "ClientActions",
  emits: ["create-call"],
};
</script>

<style lang="scss" scoped>
.action-buttons {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-bottom: 0; // Remove default margin, let parent control spacing

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 8px;
    margin-bottom: 20px;
  }
}

.button {
  width: 100%;
  min-height: 56px;
  display: flex;
  align-items: center;
  justify-content: center; // Center text
  position: relative;
  overflow: hidden;
  background: linear-gradient(
    135deg,
    #1a1a1a 0%,
    #2a1f0f 30%,
    #ff7a00 70%,
    #ff9500 100%
  );
  border-radius: 16px;
  color: #ffffff;
  font-weight: 800;
  font-size: 17px;
  letter-spacing: 0.3px;
  border: none;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 24px rgba(255, 122, 0, 0.35),
    0 4px 12px rgba(255, 122, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2);
  padding: 16px 28px;
  z-index: 1;

  @media (max-width: 768px) {
    min-height: 54px;
    font-size: 16px;
    padding: 14px 24px;
    gap: 10px;
  }

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.3),
      transparent
    );
    transition: left 0.5s ease;
    z-index: 2;
  }

  &:hover::before {
    left: 100%;
  }
}

.button-text {
  position: relative;
  z-index: 3;
  transition: transform 0.3s ease;
}

.button-shine {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s ease, height 0.6s ease;
  z-index: 2;
}

.button:hover {
  background: linear-gradient(
    135deg,
    #2a2a2a 0%,
    #3a2f1f 30%,
    #ff9500 70%,
    #ffaa00 100%
  );
  box-shadow: 0 12px 32px rgba(255, 122, 0, 0.45),
    0 6px 16px rgba(255, 122, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3);
  transform: translateY(-3px) scale(1.02);

  .button-text {
    transform: translateX(-2px);
  }

  .button-shine {
    width: 300px;
    height: 300px;
  }
}

.button:active {
  transform: translateY(-1px) scale(0.98);
  box-shadow: 0 4px 16px rgba(255, 122, 0, 0.4),
    0 2px 8px rgba(255, 122, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transition: all 0.1s ease;
}

.button:focus-visible {
  outline: none;
  box-shadow: 0 8px 24px rgba(255, 122, 0, 0.35),
    0 4px 12px rgba(255, 122, 0, 0.2), 0 0 0 4px rgba(255, 122, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}
</style>
