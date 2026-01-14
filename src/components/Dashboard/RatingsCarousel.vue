<template>
  <!-- RatingsCarousel v2.1 - Grid Layout with 5 cards -->
  <div class="ratings-carousel" dir="rtl">
    <div v-if="loadingRatings" class="carousel-loading">
      <div class="spinner"></div>
      <p>טוען דירוגים...</p>
    </div>

    <div v-else-if="ratings.length === 0" class="carousel-empty">
      <p>אין דירוגים עדיין</p>
    </div>

    <div
      style="
        width: 100%;
        display: block;
        padding: 0;
        margin: 0;
        box-sizing: border-box;
      "
    >
      <!-- Carousel Track - Single column, full width cards -->
      <div
        style="
          display: flex !important;
          flex-direction: column !important;
          gap: 12px;
          width: 100% !important;
          max-width: 100%;
          margin: 0;
          padding: 16px;
          box-sizing: border-box;
          background: transparent;
        "
      >
        <div
          v-for="(rating, index) in ratings"
          :key="`${rating._id || rating.jobId}-${index}`"
          class="rating-card-test"
          style="
            display: flex !important;
            flex-direction: row !important;
            gap: 16px;
            padding: 12px 16px;
            background: red !important;
            border: 5px solid yellow !important;
            border-radius: 12px;
            min-height: auto;
            width: 100% !important;
            box-sizing: border-box;
            animation: slideInUp 0.6s ease-out forwards;
            opacity: 1 !important;
            transition: all 0.3s ease;
            align-items: flex-start !important;
          "
        >
          <!-- Avatar Section -->
          <div
            style="
              display: flex;
              flex-direction: column;
              gap: 4px;
              flex-shrink: 0;
              width: 50px;
            "
          >
            <img
              :src="getCustomerImage(rating)"
              :alt="rating.customerName"
              style="
                width: 40px;
                height: 40px;
                border-radius: 50%;
                object-fit: cover;
                border: 2px solid #ff8a2b;
                flex-shrink: 0;
              "
              @error="onImageError"
            />
            <div
              style="
                font-size: 10px;
                color: rgba(255, 255, 255, 0.62);
                white-space: nowrap;
              "
            >
              {{ formatDate(rating.createdAt) }}
            </div>
          </div>

          <!-- Content Section -->
          <div
            style="
              display: flex;
              flex-direction: column;
              gap: 6px;
              flex: 1;
              min-width: 0;
            "
          >
            <!-- Name -->
            <div
              style="
                font-weight: 700;
                color: rgba(255, 255, 255, 0.92);
                font-size: 13px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              "
            >
              {{ rating.customerName || "לקוח" }}
            </div>

            <!-- Stars Section -->
            <div style="display: flex; align-items: center; gap: 4px">
              <svg
                v-for="s in 5"
                :key="s"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                :style="{
                  width: '14px',
                  height: '14px',
                  fill:
                    s <= (rating.rating || 0)
                      ? '#ffd700'
                      : 'rgba(255, 255, 255, 0.15)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }"
              >
                <path
                  d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                ></path>
              </svg>
              <span
                style="
                  font-size: 11px;
                  font-weight: 700;
                  color: #ff8a2b;
                  margin-right: 3px;
                "
                >{{ rating.rating || 0 }}/5</span
              >
            </div>

            <!-- Review Section -->
            <div
              style="
                font-size: 12px;
                line-height: 1.4;
                color: rgba(255, 255, 255, 0.92);
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
                word-break: break-word;
              "
            >
              {{ rating.review || "ללא ביקורת טקסטואלית" }}
            </div>
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
  name: "RatingsCarousel",
  props: {
    handymanId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      ratings: [],
      loadingRatings: false,
      loadingMore: false,
      hasMore: true,
      skip: 0,
      limit: 5,
    };
  },
  watch: {
    handymanId: {
      immediate: true,
      handler(newVal) {
        if (newVal) {
          this.reset();
          this.loadRatings();
        }
      },
    },
  },
  mounted() {},
  methods: {
    reset() {
      this.ratings = [];
      this.skip = 0;
      this.hasMore = true;
      this.loadingRatings = false;
      this.loadingMore = false;
    },

    async loadRatings() {
      if (this.loadingRatings || this.loadingMore) return;

      const isInitialLoad = this.skip === 0;
      if (isInitialLoad) {
        this.loadingRatings = true;
      } else {
        this.loadingMore = true;
      }

      try {
        const response = await axios.get(
          `${URL}/ratings/handyman/${this.handymanId}?limit=${this.limit}&skip=${this.skip}`,
          { timeout: 3000 }
        );

        const newRatings = response.data?.ratings || [];
        if (newRatings.length > 0) {
          this.ratings = [...this.ratings, ...newRatings];
          this.skip += newRatings.length;

          const paginationInfo = response.data?.pagination;
          this.hasMore =
            typeof paginationInfo?.hasMore === "boolean"
              ? paginationInfo.hasMore
              : newRatings.length === this.limit;
        } else {
          this.hasMore = false;
        }
      } catch (error) {
      } finally {
        this.loadingRatings = false;
        this.loadingMore = false;
      }
    },

    formatDate(date) {
      if (!date) return "";
      const d = new Date(date);
      const now = new Date();
      const diffMs = now - d;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return "היום";
      if (diffDays === 1) return "אתמול";
      if (diffDays < 7) return `לפני ${diffDays} ימים`;
      if (diffDays < 30) return `לפני ${Math.floor(diffDays / 7)} שבועות`;

      return d.toLocaleDateString("he-IL");
    },

    getCustomerImage(rating) {
      return (
        rating.customerImage ||
        rating.customerProfilePic ||
        "/img/Hendima-logo.png"
      );
    },

    onImageError(e) {
      e.target.src = "/img/Hendima-logo.png";
    },
  },
};
</script>

<style lang="scss" scoped>
$orange: #ff6a00;

.ratings-carousel {
  width: 100% !important;
  display: block !important;
  margin: 0 !important;
  padding: 0 !important;
}

.carousel-loading,
.carousel-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: rgba(255, 255, 255, 0.62);
  text-align: center;

  p {
    margin-top: 16px;
    font-size: 16px;
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid rgba($orange, 0.2);
  border-top-color: $orange;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.rating-card-test {
  background: blue !important;
  border: 10px solid green !important;
  display: flex !important;
  flex-direction: row !important;
  width: 100% !important;
}
</style>
