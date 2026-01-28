<template>
  <div class="specialties-block" dir="rtl">
    <h2 class="specialties-title">תחומי ההתמחות שלי</h2>
    
    <div class="specialties-grid" v-if="specialties && specialties.length">
      <div
        class="spec-chip"
        v-for="(subcat, index) in specialties"
        :key="subcat.name || subcat || index"
      >
        <div class="spec-chip__top">
          <span class="spec-chip__name">{{ subcat.name || subcat }}</span>
        </div>
        
        <div class="spec-chip__meta" v-if="subcat.price || subcat.typeWork">
          <span v-if="subcat.price" class="spec-chip__price">{{ subcat.price }}₪</span>
          <span
            v-if="subcat.typeWork"
            class="spec-chip__type-dot"
            :class="{
              'spec-chip__type-dot--hourly': subcat.typeWork === 'לשעה',
              'spec-chip__type-dot--fixed': subcat.typeWork === 'קבלנות',
            }"
            :title="subcat.typeWork"
          ></span>
        </div>
      </div>
    </div>
    
    <div v-else class="specialties-empty">
      טרם הוגדרו תחומי התמחות
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
// Color variables
$primary: #ff6a00;
$primary-light: #ff8a2b;
$surface: #1c1c24;
$border: rgba(255, 255, 255, 0.1);
$text: rgba(255, 255, 255, 0.95);

.specialties-block {
  background: $surface;
  border-radius: 20px;
  padding: 18px;
  border: 1px solid $border;
  width: 100%;
  max-width: 650px;
  margin: 0 auto 20px auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  box-sizing: border-box;
}

.specialties-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: $text;
  margin: 0 0 16px 0;
  text-align: right;
  opacity: 0.9;
  display: flex;
  align-items: center;
  gap: 8px;

  &::before {
    content: '';
    width: 3px;
    height: 16px;
    background: $primary;
    border-radius: 2px;
  }
}

.specialties-grid {
  display: grid;
  /* Force consistent rows: 4 on desktop, 3 on tablet, 2 on small mobile */
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  width: 100%;
  box-sizing: border-box;
}

.spec-chip {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid $border;
  border-radius: 12px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  transition: all 0.2s ease;
  min-height: 52px;
  min-width: 0; /* allow ellipsis in grid */
  box-sizing: border-box;

  &:hover {
    background: rgba($primary, 0.08);
    border-color: rgba($primary, 0.3);
    transform: translateY(-1px);
  }

  &__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2px;
  }

  &__name {
    font-size: 0.85rem;
    font-weight: 700;
    color: $text;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  &__meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
  }

  &__price {
    font-size: 0.72rem;
    font-weight: 900;
    color: $primary-light;
  }

  &__type-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #94a3b8;

    &--hourly {
      background: #60a5fa; // Blue for hourly
      box-shadow: 0 0 8px rgba(96, 165, 250, 0.4);
    }

    &--fixed {
      background: #34d399; // Green for fixed
      box-shadow: 0 0 8px rgba(52, 211, 153, 0.4);
    }
  }
}

.specialties-empty {
  text-align: center;
  padding: 20px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.9rem;
  border: 1px dashed $border;
  border-radius: 12px;
}

@media (max-width: 820px) {
  .specialties-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 480px) {
  .specialties-block {
    padding: 14px;
    border-radius: 16px;
    margin-bottom: 14px;
  }

  .specialties-title {
    font-size: 1rem;
    margin-bottom: 12px;
  }

  .specialties-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .spec-chip {
    padding: 6px 8px;
    min-height: 44px;
    border-radius: 10px;

    &__name {
      font-size: 0.72rem;
    }

    &__price {
      font-size: 0.68rem;
    }
  }
}

@media (max-width: 360px) {
  .specialties-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
