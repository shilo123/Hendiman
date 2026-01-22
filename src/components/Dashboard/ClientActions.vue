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
        <span class="tile__txt">איך זה עובד</span>
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
$orange: #f97316;
$orange2: #ea580c;

.clientCta {
  background: transparent;
  border: none;
  margin: 0;
  padding: 0;
}

.ctaRow {
  display: flex;
  gap: 12px;
  align-items: stretch;
}

.tile {
  flex: 1 1 0;
  min-width: 0;
  width: 0;
  height: 64px;
  border-radius: 18px;
  padding: 10px 20px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition: transform 120ms ease, filter 120ms ease;
  box-sizing: border-box;

  &:active {
    transform: scale(0.98);
  }
}

.tile--primary {
  background: linear-gradient(135deg, #fb923c, $orange);
  box-shadow: 0 10px 25px rgba(249, 115, 22, 0.3);
  color: #0b0b0f;
  border: none;
}

.tile--secondary {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.92);

  flex-direction: row;
  gap: 10px;
}

.tile__txt {
  white-space: nowrap;
  font-weight: 1100;
  font-size: 17px;
  letter-spacing: -0.2px;
}

@media (max-width: 420px) {
  .tile {
    height: 60px;
    padding: 9px 16px;
  }
  .tile__txt {
    font-size: 16px;
  }
}
</style>
