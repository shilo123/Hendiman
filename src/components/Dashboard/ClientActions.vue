<template>
  <div class="cta-row">
    <button
      class="btn btn--primary"
      type="button"
      @click="$emit('create-call')"
      aria-label="צור קריאה חדשה"
    >
      <span class="btn__text">צור קריאה</span>
    </button>
    <button
      class="btn btn--secondary"
      type="button"
      @click="$emit('how-it-works')"
      aria-label="איך זה עובד"
    >
      <span class="btn__text">איך זה עובד?</span>
      <span class="btn__arrow">›</span>
    </button>
  </div>
</template>

<script>
export default {
  name: "ClientActions",
  emits: ["create-call", "how-it-works"],
};
</script>

<style lang="scss" scoped>
// --- Theme vars (תשנה רק פה אם צריך) ---
$bg: #181818;
$card: #242424;

$orange-1: #e07000; // כתום "בוגר"
$orange-2: #c85f00; // כהה לגרדיאנט
$txt: #f5f5f5;
$txt-muted: #b0b0b0;

.cta-row {
  position: relative;
  width: 100%;
  height: 48px; // גובה אחיד למיקום הכפתורים
  margin: 0;
  padding: 0;
}

// Override margin for mobile (client-actions-top)
:deep(.client-actions-top) .cta-row {
  margin: 0;
  padding: 0;
}

// Override margin for desktop (client-actions-desktop)
:deep(.client-actions-desktop) .cta-row {
  margin: 0;
  padding: 0;
}

.btn {
  position: absolute;
  height: 48px;
  border-radius: 14px;
  border: 1px solid transparent;
  font-weight: 700;
  letter-spacing: 0.2px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0 14px;
  user-select: none;
  transition: transform 120ms ease, box-shadow 120ms ease, background 120ms ease,
    border-color 120ms ease, opacity 120ms ease;
  top: 0;

  &:active {
    transform: translateY(1px) scale(0.99);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  &__icon {
    width: 28px;
    height: 28px;
    border-radius: 10px;
    display: grid;
    place-items: center;
    font-size: 18px;
    line-height: 1;
  }

  &__text {
    font-size: 15px;
  }

  &__arrow {
    font-size: 18px;
    opacity: 0.9;
  }
}

// --- Primary: כתום+שחור+אפור, צבעים משולבים יפים ---
.btn--primary {
  right: 0;
  left: 0;
  width: calc(55% - 6px); // 55% פחות חצי מהגאפ
  color: $txt;
  background: linear-gradient(
    135deg,
    #1a1a1a 0%,
    #2d2d2d 25%,
    $orange-1 50%,
    $orange-2 75%,
    #1a1a1a 100%
  );
  background-size: 200% 200%;
  animation: gradientShift 8s ease infinite;
  border: 1px solid rgba(224, 112, 0, 0.3);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(224, 112, 0, 0.1) inset, 0 2px 4px rgba(224, 112, 0, 0.2);

  &:hover {
    background-position: 100% 0%;
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.5),
      0 0 0 1px rgba(224, 112, 0, 0.2) inset, 0 4px 8px rgba(224, 112, 0, 0.3);
    transform: translateY(-1px);
    border-color: rgba(224, 112, 0, 0.5);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(224, 112, 0, 0.3), 0 12px 28px rgba(0, 0, 0, 0.5),
      0 0 0 1px rgba(224, 112, 0, 0.2) inset;
  }
}

@keyframes gradientShift {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

// --- Secondary: רגוע, לא מתחרה ב-CTA ---
.btn--secondary {
  left: 0;
  width: calc(45% - 6px); // 45% פחות חצי מהגאפ
  color: $txt;
  background: $card;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.25);

  .btn__text {
    color: $txt;
  }

  .btn__arrow {
    color: $txt-muted;
  }

  &:hover {
    border-color: rgba(255, 255, 255, 0.14);
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1),
      0 8px 18px rgba(0, 0, 0, 0.25);
  }
}

// --- Mobile tweak (אם זה צר) ---
@media (max-width: 420px) {
  .cta-row {
    height: 46px;
  }
  .btn {
    height: 46px;
    border-radius: 13px;
  }

  .btn--primary {
    width: calc(50% - 6px);
    right: 0;
  }

  .btn--secondary {
    width: calc(50% - 6px);
    left: 0;
  }
}
</style>
