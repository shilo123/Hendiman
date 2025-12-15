<template>
  <div>
    <div class="handymen-list">
      <div v-for="h in filteredHandymen" :key="h.id || h._id" class="hcard">
        <div class="hcard__left">
          <img class="hcard__av" :src="h.imageUrl" alt="handyman" />
          <div class="hcard__meta">
            <div class="hcard__name">{{ h.username }}</div>
            <div class="hcard__sub">
              ⭐ {{ h.rating || 0 }} · {{ h.jobsDone || 0 }} עבודות
            </div>
          </div>
        </div>

        <div class="hcard__actions">
          <button
            class="mini mini--ghost"
            type="button"
            @click="$emit('view-details', h.id || h._id)"
          >
            ראה עוד
          </button>
          <button
            class="mini mini--ghost"
            type="button"
            @click="$emit('open-chat', h.id || h._id)"
          >
            צ׳אט
          </button>
          <button
            class="mini mini--primary"
            type="button"
            @click="$emit('personal-request', h.id || h._id)"
          >
            הזמן
          </button>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div class="pagination" v-if="pagination.totalPages > 1">
      <button
        class="btn btn--ghost"
        type="button"
        :disabled="!pagination.hasNext"
        @click="$emit('next-page')"
      >
        → הבא
      </button>
      <span class="pagination__info">
        עמוד {{ pagination.currentPage || pagination.page }} מתוך
        {{ pagination.totalPages }}
      </span>
      <button
        class="btn btn--ghost"
        type="button"
        :disabled="!pagination.hasPrev"
        @click="$emit('prev-page')"
      >
        הקודם ←
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: "HandymenList",
  props: {
    filteredHandymen: {
      type: Array,
      required: true,
    },
    pagination: {
      type: Object,
      required: true,
    },
  },
  emits: [
    "view-details",
    "open-chat",
    "personal-request",
    "next-page",
    "prev-page",
  ],
};
</script>

<style lang="scss" scoped>
$orange: #ff6a00;
$orange2: #ff8a2b;
$orange3: #ffb36b;
$muted: rgba(255, 255, 255, 0.62);
$text: rgba(255, 255, 255, 0.92);

@mixin focusRing {
  outline: none;
  box-shadow: 0 0 0 3px rgba($orange, 0.32);
}

.handymen-list {
  display: grid;
  gap: 10px;
  margin-top: 12px;

  @media (max-width: 768px) {
    gap: 6px;
  }
}

.hcard {
  border-radius: 20px;
  border: 1px solid rgba($orange, 0.14);
  background: rgba(255, 255, 255, 0.06);
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  transition: transform 120ms ease, box-shadow 120ms ease;

  @media (max-width: 768px) {
    padding: 6px;
    border-radius: 12px;
    gap: 6px;
  }

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 14px 22px rgba($orange, 0.12);
  }

  &__left {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  &__av {
    width: 44px;
    height: 44px;
    border-radius: 999px;
    border: 2px solid rgba($orange, 0.28);
    object-fit: cover;

    @media (max-width: 768px) {
      width: 32px;
      height: 32px;
      border-width: 1.5px;
    }
  }

  &__name {
    font-weight: 1100;

    @media (max-width: 768px) {
      font-size: 12px;
    }
  }

  &__sub {
    margin-top: 2px;
    color: rgba(255, 255, 255, 0.62);
    font-weight: 900;
    font-size: 12px;

    @media (max-width: 768px) {
      font-size: 9px;
      margin-top: 1px;
    }
  }

  &__actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;

    @media (max-width: 768px) {
      gap: 4px;
    }
  }
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding: 12px;
  border-radius: 16px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba(255, 255, 255, 0.04);

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 8px;
    padding: 8px;
  }

  &__info {
    color: $muted;
    font-weight: 900;
    font-size: 12px;

    @media (max-width: 768px) {
      font-size: 10px;
    }
  }

  .btn {
    min-width: 100px;

    @media (max-width: 768px) {
      min-width: 80px;
      width: 100%;
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      pointer-events: none;
    }
  }
}

.mini {
  border-radius: 999px;
  padding: 9px 10px;
  font-weight: 1000;
  font-size: 12px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba($orange, 0.1);
  color: $text;
  cursor: pointer;

  &:focus {
    @include focusRing;
  }

  &--ghost {
    background: rgba(0, 0, 0, 0.22);
    border-color: rgba(255, 255, 255, 0.12);
  }

  &--primary {
    border: none;
    background: linear-gradient(135deg, $orange, $orange2);
    color: #111;
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

  &--ghost {
    background: rgba(0, 0, 0, 0.22);
    border-color: rgba(255, 255, 255, 0.12);
  }
}
</style>
