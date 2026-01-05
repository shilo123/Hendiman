<template>
  <div class="rp" dir="rtl">
    <div class="rp__bg" aria-hidden="true"></div>

    <main class="rp__shell" role="main" aria-labelledby="rpTitle">
      <!-- Header -->
      <header class="rp__head">
        <div class="rp__tag">
          <span class="rp__dot"></span>
          דירוג עבודה
        </div>

        <h1 id="rpTitle" class="rp__title">דרג את ההנדימן</h1>

        <p class="rp__sub">
          <span class="muted">עבודה:</span>
          <span v-if="!isLoading">{{ subcategoryText }}</span>
          <span v-else class="sk sk--text" style="width: 170px"></span>
        </p>
      </header>

      <!-- Body -->
      <section class="rp__body">
        <!-- Loading -->
        <div v-if="isLoading" class="card">
          <div class="row row--between">
            <div class="sk sk--text" style="width: 90px"></div>
            <div class="sk sk--text" style="width: 130px"></div>
          </div>

          <div class="ratingWrap ratingWrap--loading">
            <div class="sk sk--star" v-for="i in 5" :key="'l' + i"></div>
          </div>

          <div class="sk sk--textarea"></div>
          <div class="sk sk--btn"></div>
        </div>

        <!-- Form -->
        <div v-else class="card">
          <!-- Rating header -->
          <div class="row row--between">
            <div class="label">דירוג</div>
            <div class="pill" aria-live="polite">
              <strong class="pill__num">{{ displayRating }}/5</strong>
              <span class="pill__txt">{{ ratingLabel }}</span>
            </div>
          </div>

          <!-- Stars (YOUR HTML, adapted to Vue) -->
          <div class="ratingWrap" @mouseleave="pendingRatingHover = 0">
            <div
              class="rating"
              role="radiogroup"
              aria-label="בחר דירוג מ-1 עד 5"
            >
              <input
                v-for="s in 5"
                :key="'in' + s"
                :value="s"
                v-model.number="pendingRatingValue"
                :name="ratingName"
                :id="`star${s}-${jobId}`"
                type="radio"
              />
              <label
                v-for="s in 5"
                :key="'lb' + s"
                :title="`${s} stars`"
                :for="`star${s}-${jobId}`"
                :class="{
                  'star--filled':
                    (pendingRatingHover > 0 && s <= pendingRatingHover) ||
                    (pendingRatingHover === 0 && pendingRatingValue >= s),
                }"
                @mouseenter="pendingRatingHover = s"
                @keydown.enter.prevent="setRating(s)"
                @keydown.space.prevent="setRating(s)"
                tabindex="0"
                role="radio"
                :aria-checked="pendingRatingValue === s"
                :aria-label="`דירוג ${s} מתוך 5`"
              >
                <svg
                  stroke-linejoin="round"
                  stroke-linecap="round"
                  stroke-width="2"
                  stroke="#000000"
                  fill="none"
                  viewBox="0 0 24 24"
                  :height="starSize"
                  :width="starSize"
                  xmlns="http://www.w3.org/2000/svg"
                  class="svgOne"
                  aria-hidden="true"
                >
                  <polygon
                    points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                  ></polygon>
                </svg>

                <svg
                  stroke-linejoin="round"
                  stroke-linecap="round"
                  stroke-width="2"
                  stroke="#000000"
                  fill="none"
                  viewBox="0 0 24 24"
                  :height="starSize"
                  :width="starSize"
                  xmlns="http://www.w3.org/2000/svg"
                  class="svgTwo"
                  aria-hidden="true"
                >
                  <polygon
                    points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                  ></polygon>
                </svg>

                <div class="ombre" aria-hidden="true"></div>
              </label>
            </div>
          </div>

          <!-- Quick chips -->
          <div class="chips" aria-label="תגיות מהירות (אופציונלי)">
            <button type="button" class="chip" @click="appendTag('מקצועי')">
              מקצועי
            </button>
            <button type="button" class="chip" @click="appendTag('הגיע בזמן')">
              הגיע בזמן
            </button>
            <button type="button" class="chip" @click="appendTag('נקי ומסודר')">
              נקי ומסודר
            </button>
            <button type="button" class="chip" @click="appendTag('שירות טוב')">
              שירות טוב
            </button>
          </div>

          <!-- Review -->
          <div class="review">
            <div class="row row--between row--top">
              <label class="label" for="reviewText">ביקורת (אופציונלי)</label>
              <span
                class="counter"
                :class="{ 'counter--warn': reviewRemaining <= 40 }"
              >
                {{ reviewRemaining }}
              </span>
            </div>

            <div class="field" :class="{ 'field--focus': isReviewFocused }">
              <textarea
                id="reviewText"
                v-model="pendingRatingReview"
                class="ta"
                placeholder="משפט קצר על החוויה שלך…"
                rows="4"
                maxlength="300"
                @focus="isReviewFocused = true"
                @blur="isReviewFocused = false"
              ></textarea>
            </div>

            <p class="hint">טיפ: קצר, אמיתי, ונעים לקריאה.</p>
          </div>

          <!-- Error -->
          <div v-if="uiError" class="err" role="alert">
            {{ uiError }}
          </div>

          <!-- CTA -->
          <div class="ctaBar">
            <button
              class="cta"
              type="button"
              :disabled="pendingRatingValue === 0 || isSubmittingRating"
              @click="submitRating"
            >
              <span v-if="!isSubmittingRating">שלח דירוג</span>
              <span v-else>שולח…</span>
            </button>

            <p class="note">הדירוג ישוייך לעבודה הזו בלבד.</p>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
import axios from "axios";
import { URL } from "@/Url/url";
import { useMainStore } from "@/store/index";

export default {
  name: "RatingPageV3",
  props: {
    jobId: { type: String, required: true },
  },
  data() {
    return {
      store: null,
      jobInfo: null,

      pendingRatingValue: 0,
      pendingRatingHover: 0,
      pendingRatingReview: "",

      isSubmittingRating: false,
      isLoading: true,

      uiError: "",
      isReviewFocused: false,

      maxReviewLen: 300,
    };
  },
  computed: {
    subcategoryText() {
      return this.jobInfo?.subcategoryInfo?.[0]?.subcategory || "עבודה";
    },
    displayRating() {
      return this.pendingRatingHover > 0
        ? this.pendingRatingHover
        : this.pendingRatingValue || 0;
    },
    ratingLabel() {
      const v = this.displayRating;
      if (!v) return "בחר דירוג";
      if (v <= 2) return "אפשר יותר טוב";
      if (v === 3) return "סבבה";
      if (v === 4) return "מצוין";
      return "פצצה!";
    },
    reviewRemaining() {
      return this.maxReviewLen - (this.pendingRatingReview?.length || 0);
    },
    ratingName() {
      // unique radio group per page
      return `rating-${this.jobId}`;
    },
    starSize() {
      // CSS controls the overall, but keep consistent sizes
      return 36;
    },
  },
  async mounted() {
    this.store = useMainStore();
    await this.loadJobInfo();
  },
  methods: {
    setRating(s) {
      this.uiError = "";
      this.pendingRatingValue = Number(s);
    },
    appendTag(tag) {
      this.uiError = "";
      const t = (this.pendingRatingReview || "").trim();
      const addition = t ? `, ${tag}` : tag;
      this.pendingRatingReview = (t + addition).slice(0, this.maxReviewLen);
    },
    async loadJobInfo() {
      try {
        this.isLoading = true;
        this.uiError = "";
        const response = await axios.get(`${URL}/jobs/${this.jobId}`);
        if (response.data?.success && response.data?.job) {
          this.jobInfo = response.data.job;
        } else {
          this.uiError = "לא הצלחתי לטעון את פרטי העבודה.";
        }
      } catch (e) {
        this.uiError = "שגיאה בטעינת פרטי העבודה.";
        if (this.store?.toast) this.store.toast.showError(this.uiError);
      } finally {
        this.isLoading = false;
      }
    },
    async submitRating() {
      this.uiError = "";

      if (this.pendingRatingValue === 0) {
        this.uiError = "אנא בחר דירוג לפני שליחה.";
        if (this.store?.toast) this.store.toast.showError(this.uiError);
        return;
      }

      try {
        this.isSubmittingRating = true;

        const customerId =
          this.store?.user?._id ||
          this.jobInfo?.clientId?.toString?.() ||
          this.jobInfo?.clientId;

        const handymanId =
          this.jobInfo?.handymanId?.[0]?.toString?.() ||
          this.jobInfo?.handymanId?.[0] ||
          this.jobInfo?.handymanId?.toString?.() ||
          this.jobInfo?.handymanId;

        if (!customerId || !handymanId) {
          this.uiError = "לא ניתן לזהות את הלקוח או ההנדימן.";
          if (this.store?.toast) this.store.toast.showError(this.uiError);
          return;
        }

        await axios.post(`${URL}/jobs/rate`, {
          jobId: this.jobId,
          handymanId,
          customerId,
          rating: this.pendingRatingValue,
          review: (this.pendingRatingReview || "").trim(),
        });

        if (this.store?.toast) this.store.toast.showSuccess("הדירוג נשלח");
        // Navigate to job summary after rating
        this.$router.push(`/job-summary/${this.jobId}`);
      } catch (err) {
        this.uiError = "שגיאה בשליחת הדירוג.";
        if (this.store?.toast) this.store.toast.showError(this.uiError);
      } finally {
        this.isSubmittingRating = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
$bg: #07070a;
$panel: rgba(255, 255, 255, 0.06);
$stroke: rgba(255, 106, 0, 0.22);
$stroke2: rgba(255, 106, 0, 0.35);
$orange: #ff6a00;
$orange2: #ff8a2b;
$text: rgba(255, 255, 255, 0.92);
$muted: rgba(255, 255, 255, 0.62);
$danger: #ff4d4d;

.rp {
  min-height: 100vh;
  background: $bg;
  padding: 14px 12px calc(18px + env(safe-area-inset-bottom));
  box-sizing: border-box;
  display: grid;
  place-items: start center;
  overflow: hidden;
  position: relative;
}

.rp__bg {
  position: absolute;
  inset: -40%;
  background: radial-gradient(
      700px 450px at 15% 10%,
      rgba($orange, 0.22),
      transparent 55%
    ),
    radial-gradient(
      650px 420px at 90% 30%,
      rgba($orange2, 0.12),
      transparent 60%
    ),
    radial-gradient(
      520px 360px at 50% 100%,
      rgba(255, 255, 255, 0.06),
      transparent 55%
    );
  filter: blur(18px);
  opacity: 0.9;
  pointer-events: none;
}

.rp__shell {
  width: min(760px, 100%);
  position: relative;
  z-index: 1;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.05),
    rgba(255, 255, 255, 0.03)
  );
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.55);
  overflow: hidden;
}

.rp__head {
  padding: 16px 16px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: linear-gradient(180deg, rgba($orange, 0.1), transparent 55%),
    linear-gradient(90deg, rgba(255, 255, 255, 0.06), transparent);
}

.rp__tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 999px;
  background: rgba($orange, 0.12);
  border: 1px solid rgba($orange, 0.25);
  color: rgba(255, 255, 255, 0.86);
  font-weight: 850;
  font-size: 13px;
}

.rp__dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: linear-gradient(135deg, $orange, $orange2);
  box-shadow: 0 0 0 4px rgba($orange, 0.14);
}

.rp__title {
  margin: 10px 0 4px;
  color: $text;
  font-weight: 1100;
  letter-spacing: -0.3px;
  line-height: 1.15;
  font-size: clamp(22px, 4.8vw, 30px);
}

.rp__sub {
  margin: 0;
  color: $muted;
  font-size: 14px;
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.muted {
  color: rgba(255, 255, 255, 0.55);
}

.rp__body {
  padding: 12px;
}

.card {
  background: $panel;
  border: 1px solid $stroke;
  border-radius: 16px;
  padding: 14px;
}

/* rows */
.row {
  display: flex;
  gap: 10px;
}
.row--between {
  align-items: center;
  justify-content: space-between;
}
.row--top {
  align-items: flex-start;
}

.label {
  color: $text;
  font-weight: 950;
  font-size: 15px;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: $muted;
  max-width: 62%;
}
.pill__num {
  color: rgba(255, 255, 255, 0.95);
  font-weight: 1000;
  font-size: 14px;
}
.pill__txt {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 800;
  font-size: 13px;
}

/* rating wrapper */
.ratingWrap {
  margin: 12px 0 10px;
  display: grid;
  place-items: center;
}
.ratingWrap--loading {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-direction: row-reverse;
}

/* === YOUR STAR CSS (adapted colors + touch targets) === */
.rating {
  display: flex;
  flex-direction: row-reverse;
  gap: 0.35rem;
  transform-style: preserve-3d;
  perspective: 1000px;
  user-select: none;
}

.rating input {
  display: none;
}

.rating label {
  position: relative;
  cursor: pointer;
  display: grid;
  place-items: center;
  gap: 3px;
  transition: transform 0.18s ease;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  padding: 6px; /* bigger touch target */
  border-radius: 14px; /* makes it feel like a button */
}

.rating label:active {
  transform: scale(0.98);
}

.rating label .svgOne {
  stroke: rgba(255, 255, 255, 0.35);
  fill: rgba(255, 106, 0, 0);
  transition: stroke 0.25s ease, fill 0.25s ease;
}

.rating label .svgTwo {
  position: absolute;
  top: 5px;
  fill: $orange;
  stroke: rgba(255, 106, 0, 0);
  opacity: 0;
  transition: opacity 0.25s ease, transform 0.25s ease;
}

// Hover effect - only highlight stars up to hovered star
.rating label:hover .svgOne {
  stroke: $orange;
}

.rating label:hover ~ label .svgOne {
  // Reset stars after hovered one
  stroke: rgba(255, 255, 255, 0.35);
}

// Filled stars - only show filled star for selected rating
.rating label.star--filled .svgOne {
  stroke: transparent;
}

.rating label.star--filled .svgTwo {
  opacity: 1;
}

// Animate only when rating changes (not on hover)
.rating label.star--filled .svgTwo {
  animation: displayStar 0.35s cubic-bezier(0.75, 0.41, 0.82, 1.2);
}

@keyframes displayStar {
  0% {
    transform: rotateX(90deg) rotateY(90deg) translateY(10px);
  }
  100% {
    transform: rotateX(0deg) rotateY(0deg) translateY(0px);
  }
}

.ombre {
  background: radial-gradient(
    ellipse closest-side,
    rgba(0, 0, 0, 0.24),
    rgba(0, 0, 0, 0)
  );
  width: 30px;
  height: 8px;
  opacity: 0;
  transition: opacity 0.25s ease;
}

.rating label:hover.star--filled .ombre,
.rating label.star--filled .ombre {
  opacity: 1;
}

/* focus for keyboard */
.rating label:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba($orange, 0.25);
  background: rgba($orange, 0.1);
  border: 1px solid rgba($orange, 0.3);
}

/* chips: wrap on desktop, horizontal scroll on mobile */
.chips {
  margin: 10px 0 12px;
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

.chip {
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.86);
  padding: 9px 12px;
  border-radius: 999px;
  font-weight: 900;
  font-size: 13px;
  cursor: pointer;
  transition: transform 0.14s ease, border-color 0.14s ease;
  -webkit-tap-highlight-color: transparent;
}

.chip:hover {
  border-color: rgba($orange, 0.3);
  transform: translateY(-1px);
}
.chip:active {
  transform: translateY(0px) scale(0.99);
}

/* review */
.review {
  margin-top: 6px;
}
.counter {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.86);
  font-weight: 950;
  font-size: 13px;
}
.counter--warn {
  border-color: rgba($danger, 0.45);
  background: rgba($danger, 0.1);
}

.field {
  margin-top: 10px;
  border-radius: 14px;
  border: 1px solid $stroke2;
  background: rgba(0, 0, 0, 0.12);
  transition: box-shadow 0.14s ease, border-color 0.14s ease;
  padding: 12px;
}

.field--focus {
  border-color: rgba($orange, 0.65);
  box-shadow: 0 0 0 3px rgba($orange, 0.18);
}

.ta {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: $text;
  font-size: 16px;
  line-height: 1.55;
  resize: vertical;
  min-height: 110px;
}
.ta::placeholder {
  color: rgba(255, 255, 255, 0.45);
}

.hint {
  margin: 10px 2px 0;
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
}

.err {
  margin-top: 12px;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid rgba($danger, 0.45);
  background: rgba($danger, 0.1);
  color: rgba(255, 255, 255, 0.92);
  font-weight: 850;
}

/* CTA bar - clean + mobile friendly */
.ctaBar {
  margin-top: 14px;
  display: grid;
  gap: 8px;
}

.cta {
  width: 100%;
  height: 52px;
  border-radius: 14px;
  border: none;
  cursor: pointer;
  background: linear-gradient(135deg, $orange, $orange2);
  color: white;
  font-weight: 1000;
  font-size: 16px;
  box-shadow: 0 12px 30px rgba($orange, 0.28);
  transition: transform 0.16s ease, box-shadow 0.16s ease, opacity 0.16s ease;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
.cta:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 16px 40px rgba($orange, 0.35);
}
.cta:active:not(:disabled) {
  transform: translateY(0);
}
.cta:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none;
}

.note {
  margin: 0;
  text-align: center;
  color: rgba(255, 255, 255, 0.45);
  font-size: 12.5px;
}

/* skeletons */
.sk {
  border-radius: 12px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.06),
    rgba(255, 255, 255, 0.12),
    rgba(255, 255, 255, 0.06)
  );
  background-size: 200% 100%;
  animation: sh 1.2s ease-in-out infinite;
  border: 1px solid rgba(255, 255, 255, 0.06);
}
.sk--text {
  height: 14px;
}
.sk--star {
  width: 52px;
  height: 52px;
  border-radius: 14px;
}
.sk--textarea {
  height: 120px;
  margin-top: 12px;
  border-radius: 14px;
}
.sk--btn {
  height: 52px;
  margin-top: 12px;
  border-radius: 14px;
}

@keyframes sh {
  0% {
    background-position: 0% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* ===== Mobile-first fixes (the “no mess” part) ===== */
@media (max-width: 520px) {
  .rp__body {
    padding: 10px;
  }
  .card {
    padding: 12px;
  }
  .pill {
    max-width: 58%;
  }
  .rating label {
    padding: 7px;
  } /* bigger tap */
  .rating label .svgTwo {
    top: 6px;
  }
  .chips {
    justify-content: flex-start;
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 6px;
    mask-image: linear-gradient(
      to left,
      transparent 0,
      black 18px,
      black calc(100% - 18px),
      transparent 100%
    );
  }
  .chip {
    flex: 0 0 auto;
  }
}

@media (max-width: 360px) {
  .pill {
    max-width: 54%;
  }
  .chip {
    padding: 8px 10px;
    font-size: 12.5px;
  }
}
</style>
