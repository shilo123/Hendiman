<template>
  <section class="clientCta" aria-label="פעולות מהירות">
    <div class="ctaRow">
      <button
        class="tile tile--primary"
        type="button"
        @click="$emit('create-call')"
        aria-label="צור קריאה חדשה"
      >
        <span class="tile__txt">צור קריאה</span>
      </button>

      <button
        class="tile tile--secondary"
        type="button"
        @click="$emit('how-it-works')"
        aria-label="איך זה עובד"
      >
        <span class="tile__txt">איך זה עובד?</span>
      </button>
    </div>
  </section>
</template>

<script>
export default {
  name: "ClientActions",
  emits: ["create-call", "how-it-works"],
};
</script>

<style lang="scss" scoped>
.clientCta {
  background: transparent;
  border: none;
  margin: 0;
  padding: 0;
}

.ctaRow {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  align-items: stretch;
}

.tile {
  flex: 1 1 0;
  min-width: 0;
  height: auto;
  min-height: 64px;
  border-radius: 1rem;
  padding: 16px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition: all 0.2s ease;
  box-sizing: border-box;
  border: none;

  &:active {
    transform: scale(0.98);
  }
}

.tile--primary {
  background: #ff6a00;
  box-shadow: 0 0 15px -3px rgba(255, 106, 0, 0.3);
  color: #fff;
  border: none;
  font-weight: 700;
  font-size: 18px;

  &:hover {
    background: #cc5500;
  }
}

.tile--secondary {
  background: rgba(21, 21, 23, 1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  font-weight: 500;
  font-size: 18px;

  &:hover {
    background: rgba(35, 35, 37, 1);
  }
}

.tile__txt {
  white-space: nowrap;
  font-weight: inherit;
  font-size: inherit;
  letter-spacing: -0.2px;
}

@media (max-width: 420px) {
  .tile {
    min-height: 60px;
    padding: 14px 16px;
  }
  .tile__txt {
    font-size: 16px;
  }
}
</style>
