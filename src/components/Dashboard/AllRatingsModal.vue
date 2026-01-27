<template>
  <div
    v-if="isVisible"
    class="allRatingsModal"
    dir="rtl"
    @click.self="close"
    role="dialog"
    aria-label="כל הביקורות"
  >
    <div class="allRatingsModal__container">
      <header class="allRatingsModal__header">
        <h2 class="allRatingsModal__title">כל הביקורות</h2>
        <button
          type="button"
          class="allRatingsModal__close"
          @click="close"
          aria-label="סגור"
        >
          <span class="material-symbols-outlined">close</span>
        </button>
      </header>

      <div
        class="allRatingsModal__content"
        ref="scrollContainer"
        @scroll="onScroll"
      >
        <div v-if="isLoading && ratings.length === 0" class="allRatingsModal__loading">
          <div class="loadingSpinner"></div>
          <p>טוען ביקורות...</p>
        </div>

        <div v-else-if="ratings.length === 0" class="allRatingsModal__empty">
          עדיין אין ביקורות.
        </div>

        <div v-else class="allRatingsModal__list">
          <article
            v-for="r in ratings"
            :key="r._id || r.jobId"
            class="allRatingsModal__item glass"
          >
            <div class="allRatingsModal__itemHeader">
              <div class="allRatingsModal__itemUser">
                <div
                  class="allRatingsModal__avatar"
                  :style="avatarStyle(r.customerImage)"
                  :aria-label="`תמונה של ${r.customerName || 'לקוח'}`"
                ></div>
                <span class="allRatingsModal__userName">{{
                  r.customerName || "לקוח"
                }}</span>
              </div>

              <div
                class="allRatingsModal__stars"
                :aria-label="`דירוג ${r.rating || 0} מתוך 5`"
              >
                <span
                  v-for="i in 5"
                  :key="i"
                  class="material-symbols-outlined allRatingsModal__star"
                  :class="{
                    'allRatingsModal__star--on': i <= Math.round(r.rating || 0),
                  }"
                  >star</span
                >
              </div>
            </div>

            <p class="allRatingsModal__reviewText">
              {{ r.review ? `"${r.review}"` : '"אין ביקורת טקסטואלית"' }}
            </p>

            <span class="allRatingsModal__reviewMeta">
              {{ timeAgo(r.createdAt) }}
              <span v-if="r.jobName"> • {{ r.jobName }}</span>
            </span>
          </article>

          <div
            v-if="isLoadingMore"
            class="allRatingsModal__loadingMore"
          >
            <div class="loadingSpinner"></div>
            <p>טוען עוד ביקורות...</p>
          </div>

          <div
            v-if="!hasMore && ratings.length > 0"
            class="allRatingsModal__end"
          >
            הגעת לסוף הרשימה
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { URL } from "@/Url/url";

export default {
  name: "AllRatingsModal",
  props: {
    isVisible: {
      type: Boolean,
      default: false,
    },
    handymanId: {
      type: String,
      required: true,
    },
  },
  emits: ["close"],
  data() {
    return {
      ratings: [],
      isLoading: false,
      isLoadingMore: false,
      hasMore: true,
      skip: 0,
      limit: 5,
    };
  },
  watch: {
    isVisible(newVal) {
      if (newVal) {
        this.reset();
        this.loadRatings();
      }
    },
  },
  methods: {
    reset() {
      this.ratings = [];
      this.skip = 0;
      this.hasMore = true;
      this.isLoading = false;
      this.isLoadingMore = false;
    },
    async loadRatings() {
      if (this.isLoading || this.isLoadingMore) return;

      const isInitialLoad = this.skip === 0;
      if (isInitialLoad) {
        this.isLoading = true;
      } else {
        this.isLoadingMore = true;
      }

      try {
        const response = await axios.get(
          `${URL}/ratings/handyman/${this.handymanId}`,
          {
            params: { skip: this.skip, limit: this.limit },
          }
        );

        if (response.data.success) {
          const newRatings = response.data.ratings || [];
          this.ratings = [...this.ratings, ...newRatings];

          const p = response.data.pagination || {};
          this.skip = this.skip + newRatings.length;
          this.hasMore = !!p.hasMore;
        }
      } catch (error) {
        // Silent fail
      } finally {
        this.isLoading = false;
        this.isLoadingMore = false;
      }
    },
    onScroll() {
      const container = this.$refs.scrollContainer;
      if (!container) return;

      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;

      // Load more when scrolled to 80% of content
      if (
        scrollTop + clientHeight >= scrollHeight * 0.8 &&
        this.hasMore &&
        !this.isLoadingMore &&
        !this.isLoading
      ) {
        this.loadRatings();
      }
    },
    close() {
      this.$emit("close");
    },
    avatarStyle(url) {
      const safe = url || "/img/Hendima-logo.png";
      return { backgroundImage: `url('${safe}')` };
    },
    timeAgo(date) {
      if (!date) return "";
      const d = new Date(date);
      const diffMs = Date.now() - d.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) return "היום";
      if (diffDays === 1) return "לפני יום";
      if (diffDays === 2) return "לפני יומיים";
      if (diffDays < 7) return `לפני ${diffDays} ימים`;
      return d.toLocaleDateString("he-IL", { day: "numeric", month: "short" });
    },
  },
};
</script>

<style scoped>
.allRatingsModal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow-y: auto;
}

.allRatingsModal__container {
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  background: var(--bg-dark, #221910);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.allRatingsModal__header {
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);
}

.allRatingsModal__title {
  margin: 0;
  font-size: 22px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.95);
}

.allRatingsModal__close {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.9);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.18s ease;
}

.allRatingsModal__close:hover {
  border-color: rgba(242, 127, 13, 0.4);
  background: rgba(242, 127, 13, 0.08);
}

.allRatingsModal__close:active {
  transform: scale(0.98);
}

.allRatingsModal__content {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  min-height: 0;
}

.allRatingsModal__loading,
.allRatingsModal__loadingMore {
  padding: 40px 20px;
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
}

.allRatingsModal__loading .loadingSpinner,
.allRatingsModal__loadingMore .loadingSpinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #f27f0d;
  border-radius: 50%;
  margin: 0 auto 12px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.allRatingsModal__empty {
  padding: 40px 20px;
  text-align: center;
  color: rgba(255, 255, 255, 0.65);
  font-weight: 800;
}

.allRatingsModal__list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.allRatingsModal__item {
  padding: 18px;
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.allRatingsModal__itemHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.allRatingsModal__itemUser {
  display: flex;
  align-items: center;
  gap: 12px;
}

.allRatingsModal__avatar {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  background-color: rgba(255, 255, 255, 0.08);
  background-size: cover;
  background-position: center;
  flex-shrink: 0;
}

.allRatingsModal__userName {
  font-size: 15px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.95);
}

.allRatingsModal__stars {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.allRatingsModal__star {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.22);
}

.allRatingsModal__star--on {
  color: #fbbf24;
}

.allRatingsModal__reviewText {
  margin: 0;
  color: rgba(255, 255, 255, 0.82);
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
}

.allRatingsModal__reviewMeta {
  color: rgba(255, 255, 255, 0.42);
  font-size: 12px;
  font-weight: 700;
}

.allRatingsModal__end {
  padding: 20px;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
  font-weight: 700;
}

.glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

@media (max-width: 600px) {
  .allRatingsModal {
    padding: 0;
  }

  .allRatingsModal__container {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }

  .allRatingsModal__header {
    padding: 16px 20px;
  }

  .allRatingsModal__content {
    padding: 16px 20px;
  }
}
</style>

