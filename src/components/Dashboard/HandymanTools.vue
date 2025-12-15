<template>
  <div class="quick">
    <div class="quick__row">
      <div class="badgeLine">
        <span class="badgeLine__k">תחומי ההתמחות שלי </span>
        <div class="badgeLine__v">
          <span
            class="chip"
            v-for="(subcat, index) in specialties"
            :key="subcat.name || subcat || index"
          >
            <span class="chip__name">{{ subcat.name || subcat }}</span>
            <span v-if="subcat.price" class="chip__price"
              >{{ subcat.price }}₪</span
            >
            <span
              v-if="subcat.typeWork"
              class="chip__type"
              :class="{
                'chip__type--hourly': subcat.typeWork === 'לשעה',
                'chip__type--fixed': subcat.typeWork === 'קבלנות',
              }"
            >
              {{ subcat.typeWork }}
            </span>
          </span>
        </div>
      </div>
    </div>

    <div class="quick__row">
      <button
        class="btn btn--primary btn--full"
        type="button"
        @click="$emit('edit-profile')"
      >
        ערוך פרופיל (אזור פעילות/זמינות)
      </button>
      <button
        class="btn btn--ghost btn--full"
        type="button"
        @click="$emit('open-chat')"
      >
        פתח צ׳אט הנדימנים
      </button>
    </div>

    <div class="note">
      <div class="note__icon">🧠</div>
      <div class="note__txt">
        טיפ: סנן לפי <b>open</b> כדי לראות רק קריאות חדשות, ואז קבל מהר.
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "HandymanTools",
  props: {
    specialties: {
      type: Array,
      required: true,
    },
  },
  emits: ["edit-profile", "open-chat"],
};
</script>

<style lang="scss" scoped>
$orange: #ff6a00;
$orange2: #ff8a2b;
$orange3: #ffb36b;
$text: rgba(255, 255, 255, 0.92);

@mixin focusRing {
  outline: none;
  box-shadow: 0 0 0 3px rgba($orange, 0.32);
}

.quick {
  &__row {
    margin-bottom: 16px;

    @media (max-width: 768px) {
      margin-bottom: 12px;
    }
  }
}

.badgeLine {
  &__k {
    display: block;
    font-size: 12px;
    font-weight: 900;
    color: rgba(255, 255, 255, 0.62);
    margin-bottom: 8px;

    @media (max-width: 768px) {
      font-size: 10px;
      margin-bottom: 6px;
    }
  }

  &__v {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;

    @media (max-width: 768px) {
      gap: 4px;
    }
  }
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 999px;
  padding: 8px 12px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba($orange, 0.1);
  font-weight: 1000;
  font-size: 12px;
  color: $text;
  flex-wrap: wrap;
  margin: 4px;

  @media (max-width: 768px) {
    padding: 4px 8px;
    font-size: 9px;
    gap: 4px;
    margin: 3px;
  }

  &__name {
    color: $text;
    font-weight: 1000;
  }

  &__price {
    color: $orange3;
    font-weight: 1100;
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 999px;
    background: rgba($orange, 0.15);
    border: 1px solid rgba($orange, 0.25);

    @media (max-width: 768px) {
      font-size: 8px;
      padding: 1px 4px;
    }
  }

  &__type {
    font-size: 10px;
    font-weight: 900;
    padding: 2px 6px;
    border-radius: 999px;
    border: 1px solid;

    @media (max-width: 768px) {
      font-size: 7px;
      padding: 1px 4px;
    }

    &--hourly {
      color: $orange2;
      background: rgba($orange2, 0.15);
      border-color: rgba($orange2, 0.25);
    }

    &--fixed {
      color: $orange;
      background: rgba($orange, 0.15);
      border-color: rgba($orange, 0.25);
    }
  }
}

.btn {
  border-radius: 16px;
  padding: 11px 12px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  cursor: pointer;
  font-weight: 1000;
  transition: transform 120ms ease, box-shadow 120ms ease, background 120ms ease;
  font-size: 13px;

  @media (max-width: 768px) {
    padding: 6px 8px;
    font-size: 10px;
    border-radius: 10px;
    min-height: 32px;
  }

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 14px 22px rgba($orange, 0.12);
    background: rgba(255, 255, 255, 0.08);
  }

  &:active {
    transform: translateY(0) scale(0.99);
  }

  &:focus {
    @include focusRing;
  }

  &--primary {
    color: #111;
    border: none;
    background: linear-gradient(135deg, $orange, $orange2);
    box-shadow: 0 18px 44px rgba(255, 106, 0, 0.18);
  }

  &--ghost {
    background: rgba(0, 0, 0, 0.22);
    border-color: rgba(255, 255, 255, 0.12);
  }

  &--full {
    width: 100%;
    justify-content: center;
  }
}

.note {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 12px;
  border-radius: 16px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba($orange, 0.08);
  margin-top: 12px;

  @media (max-width: 768px) {
    padding: 8px;
    gap: 8px;
    border-radius: 12px;
  }

  &__icon {
    font-size: 20px;
    flex-shrink: 0;

    @media (max-width: 768px) {
      font-size: 16px;
    }
  }

  &__txt {
    font-size: 12px;
    font-weight: 900;
    color: rgba(255, 255, 255, 0.84);
    line-height: 1.4;

    @media (max-width: 768px) {
      font-size: 10px;
    }

    b {
      color: $orange3;
      font-weight: 1100;
    }
  }
}
</style>
