<template>
  <div class="perf" dir="rtl">
    <header class="perf__header">
      <div class="perf__headerInner">
        <button
          type="button"
          class="perf__back"
          @click="$router.push(`/Dashboard/${userId}`)"
          aria-label="חזרה לדשבורד"
        >
          <span class="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 class="perf__title">ביצועים</h1>
        <div class="perf__headerSpacer"></div>
      </div>
    </header>

    <main class="perf__main">
      <div v-if="isLoading" class="perf__loading">טוען נתונים…</div>

      <template v-else>
        <section class="perf__top">
          <div class="perf__card perf__card--big glass">
            <div class="perf__bigGlow" aria-hidden="true"></div>
            <div class="perf__bigLeft">
              <span class="perf__kpiLabel">דירוג ממוצע</span>
              <span class="perf__kpiValue">{{ ratingPercent }}%</span>
              <div
                class="perf__kpiTrend"
                :class="{
                  'perf__kpiTrend--up': ratingDelta >= 0,
                  'perf__kpiTrend--down': ratingDelta < 0,
                }"
              >
                <span class="material-symbols-outlined perf__kpiTrendIcon">
                  {{ ratingDelta >= 0 ? "trending_up" : "trending_down" }}
                </span>
                <span>{{ formatDelta(ratingDelta) }} החודש</span>
              </div>
            </div>

            <div class="perf__bigRight">
              <div class="perf__ring">
                <svg class="perf__ringSvg" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="rgba(255,255,255,0.10)"
                    stroke-width="8"
                  />
                  <circle
                    class="perf__ringArc"
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    :stroke-dasharray="ringCircumference"
                    :stroke-dashoffset="ringDashOffset"
                    stroke-linecap="round"
                    stroke-width="8"
                  />
                </svg>
                <div class="perf__ringIcon">
                  <span class="material-symbols-outlined">star</span>
                </div>
              </div>
            </div>
          </div>

          <div class="perf__card glass perf__card--small">
            <div class="perf__smallLeft">
              <div class="perf__badgeIcon perf__badgeIcon--rose">
                <span class="material-symbols-outlined">reviews</span>
              </div>
              <span class="perf__smallText">ביקורות החודש</span>
            </div>
            <div class="perf__smallRight">
              <span class="perf__smallValue">{{
                stats.reviewsMonthCount || 0
              }}</span>
              <span
                class="perf__pill"
                :class="{
                  'perf__pill--good': (stats.reviewsMonthCount || 0) >= 3,
                  'perf__pill--warn':
                    (stats.reviewsMonthCount || 0) > 0 &&
                    (stats.reviewsMonthCount || 0) < 3,
                  'perf__pill--neutral': (stats.reviewsMonthCount || 0) === 0,
                }"
              >
                {{
                  (stats.reviewsMonthCount || 0) === 0
                    ? "אין עדיין"
                    : (stats.reviewsMonthCount || 0) >= 3
                    ? "מצוין"
                    : "דורש שיפור"
                }}
              </span>
            </div>
          </div>
        </section>

        <section class="perf__card glass perf__earnings">
          <div class="perf__earningsTop">
            <div class="perf__earningsCol">
              <h3 class="perf__earningsLabel">רווחים החודש</h3>
              <div class="perf__earningsVal">
                ₪{{ formatMoney(stats.monthlyEarnings) }}
              </div>
            </div>
            <div class="perf__earningsCol perf__earningsCol--split">
              <h3 class="perf__earningsLabel">רווחים סה"כ</h3>
              <div class="perf__earningsVal">
                ₪{{ formatMoney(stats.totalEarnings) }}
              </div>
            </div>
          </div>

          <div class="perf__sparkWrap">
            <div class="perf__sparkFade" aria-hidden="true"></div>
            <svg
              class="perf__spark"
              viewBox="0 0 100 50"
              preserveAspectRatio="none"
              role="img"
              aria-label="גרף הכנסות"
            >
              <defs>
                <linearGradient id="perfGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#f27f0d" stop-opacity="0.22" />
                  <stop offset="100%" stop-color="#f27f0d" stop-opacity="0" />
                </linearGradient>
              </defs>

              <path
                v-if="sparkAreaPath"
                :d="sparkAreaPath"
                fill="url(#perfGradient)"
              />
              <path
                v-if="sparkLinePath"
                class="perf__sparkLine"
                :d="sparkLinePath"
                fill="none"
                stroke="#f27f0d"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
              />
            </svg>
          </div>
        </section>

        <section class="perf__reviews">
          <div class="perf__sectionHead">
            <h3 class="perf__sectionTitle">ביקורות אחרונות</h3>
            <button
              type="button"
              class="perf__link"
              @click="loadMoreRatings"
              :disabled="!pagination.hasMore || isMoreLoading"
            >
              {{
                pagination.hasMore
                  ? isMoreLoading
                    ? "טוען…"
                    : "ראה הכל"
                  : "זה הכל"
              }}
            </button>
          </div>

          <div v-if="ratings.length === 0" class="perf__empty glass">
            עדיין אין ביקורות.
          </div>

          <div v-else class="perf__reviewsRow hide-scrollbar">
            <article
              v-for="r in ratings"
              :key="r._id"
              class="perf__reviewCard glass"
            >
              <div class="perf__reviewTopBar" aria-hidden="true"></div>

              <div class="perf__reviewHead">
                <div class="perf__reviewUser">
                  <div
                    class="perf__avatar"
                    :style="avatarStyle(r.customerImage)"
                    :aria-label="`תמונה של ${r.customerName || 'לקוח'}`"
                  ></div>
                  <span class="perf__userName">{{
                    r.customerName || "לקוח"
                  }}</span>
                </div>

                <div
                  class="perf__stars"
                  :aria-label="`דירוג ${r.rating || 0} מתוך 5`"
                >
                  <span
                    v-for="i in 5"
                    :key="i"
                    class="material-symbols-outlined perf__star"
                    :class="{
                      'perf__star--on': i <= Math.round(r.rating || 0),
                    }"
                    >star</span
                  >
                </div>
              </div>

              <p class="perf__reviewText">
                {{ r.review ? `"${r.review}"` : '"אין ביקורת טקסטואלית"' }}
              </p>

              <span class="perf__reviewMeta">
                {{ timeAgo(r.createdAt) }}
                <span v-if="r.jobName"> • {{ r.jobName }}</span>
              </span>
            </article>
          </div>
        </section>

        <section class="perf__card glass perf__goal">
          <div class="perf__goalHead">
            <div class="perf__goalIcon">
              <span class="material-symbols-outlined">flag</span>
            </div>

            <div class="perf__goalText">
              <h3 class="perf__goalTitle">יעד חודשי</h3>
              <p class="perf__goalSub">הושלמו {{ goalPercent }}% מהיעד</p>
            </div>

            <div class="perf__goalNums">
              <span class="perf__goalNow">{{ stats.jobDoneMonth || 0 }}</span>
              <span class="perf__goalSep">/</span>
              <span class="perf__goalMax">{{ monthlyTarget }} עבודות</span>
            </div>
          </div>

          <div class="perf__goalBar">
            <div class="perf__goalFill" :style="{ width: `${goalPercent}%` }">
              <div class="perf__goalShimmer" aria-hidden="true"></div>
            </div>
          </div>

          <p class="perf__goalHint">
            נשארו עוד
            {{ Math.max(monthlyTarget - (stats.jobDoneMonth || 0), 0) }} עבודות
            להגעה ליעד
          </p>
        </section>

        <div class="perf__spacer" aria-hidden="true"></div>
      </template>
    </main>
  </div>
</template>

<script>
import axios from "axios";
import { URL } from "@/Url/url";
import { useMainStore } from "@/store/index";

export default {
  name: "HandymanRatings",
  data() {
    return {
      store: null,
      ratings: [],
      isLoading: true,
      isMoreLoading: false,
      pagination: {
        skip: 0,
        limit: 8,
        hasMore: false,
      },
      stats: {
        ratingsCount: 0,
        averageRating: 0,
        reviewsMonthCount: 0,
        averageRatingMonth: 0,
        monthlyEarnings: 0,
        totalEarnings: 0,
        jobDoneTotal: 0,
        jobDoneMonth: 0,
      },
      sparkData: [],
      monthlyTarget: 50,
      prevHtmlDir: null,
      prevHtmlLang: null,
      hadDarkClass: false,
    };
  },
  computed: {
    userId() {
      return this.store?.user?._id || this.$route.params.id;
    },
    averageRating() {
      const s = Number(this.stats?.averageRating || 0);
      if (s > 0) return s;
      if (this.ratings.length === 0) return 0;
      const sum = this.ratings.reduce((acc, r) => acc + (r.rating || 0), 0);
      return sum / this.ratings.length;
    },
    ratingPercent() {
      return Math.round((this.averageRating / 5) * 100);
    },
    ratingDelta() {
      const monthAvg = Number(this.stats?.averageRatingMonth || 0);
      // If we don't have month data, show 0 change.
      if (!monthAvg) return 0;
      // Delta in percent points vs overall average.
      return Math.round(((monthAvg - this.averageRating) / 5) * 1000) / 10;
    },
    ringCircumference() {
      // r=40 -> 2πr
      return 2 * Math.PI * 40;
    },
    ringDashOffset() {
      const p = Math.max(0, Math.min(100, this.ratingPercent));
      return this.ringCircumference * (1 - p / 100);
    },
    goalPercent() {
      const t = Number(this.monthlyTarget || 0) || 0;
      if (t <= 0) return 0;
      const v = Number(this.stats?.jobDoneMonth || 0);
      return Math.max(0, Math.min(100, Math.round((v / t) * 100)));
    },
    sparkLinePath() {
      return this.buildSparkPaths(this.sparkData).line;
    },
    sparkAreaPath() {
      return this.buildSparkPaths(this.sparkData).area;
    },
  },
  async mounted() {
    this.store = useMainStore();
    this.initHtmlRtlDark();
    await this.loadRatings({ reset: true });
    await this.loadSparkData();
    this.initMonthlyTarget();
  },
  beforeUnmount() {
    this.restoreHtmlAttrs();
  },
  methods: {
    initHtmlRtlDark() {
      try {
        const html = document.documentElement;
        this.prevHtmlDir = html.getAttribute("dir");
        this.prevHtmlLang = html.getAttribute("lang");
        this.hadDarkClass = html.classList.contains("dark");
        html.setAttribute("dir", "rtl");
        html.setAttribute("lang", "he");
        html.classList.add("dark");
      } catch (e) {
        // ignore
      }
    },
    restoreHtmlAttrs() {
      try {
        const html = document.documentElement;
        if (this.prevHtmlDir == null) html.removeAttribute("dir");
        else html.setAttribute("dir", this.prevHtmlDir);
        if (this.prevHtmlLang == null) html.removeAttribute("lang");
        else html.setAttribute("lang", this.prevHtmlLang);
        if (!this.hadDarkClass) html.classList.remove("dark");
      } catch (e) {
        // ignore
      }
    },
    initMonthlyTarget() {
      // Try to read from user profile if exists; fallback to 50.
      const u = this.store?.user || {};
      const candidate =
        u.monthlyTarget ||
        u.monthlyGoal ||
        u.goalMonthlyJobs ||
        u.monthlyJobsGoal;
      const n = Number(candidate);
      if (Number.isFinite(n) && n > 0) this.monthlyTarget = Math.round(n);
    },
    async loadRatings({ reset } = { reset: false }) {
      try {
        const skip = reset ? 0 : this.pagination.skip;
        const limit = this.pagination.limit;
        const response = await axios.get(
          `${URL}/ratings/handyman/${this.userId}`,
          {
            params: { skip, limit },
          }
        );
        if (response.data.success) {
          const incomingRatings = response.data.ratings || [];
          this.ratings = reset
            ? incomingRatings
            : [...this.ratings, ...incomingRatings];

          const p = response.data.pagination || {};
          this.pagination.skip =
            (p.skip || skip) + (p.returned || incomingRatings.length || 0);
          this.pagination.hasMore = !!p.hasMore;

          // New server response contains stats; keep backward compatibility.
          const s = response.data.stats || {};
          this.stats = {
            ...this.stats,
            ratingsCount: s.ratingsCount ?? this.ratings.length,
            averageRating: s.averageRating ?? this.stats.averageRating,
            reviewsMonthCount: s.reviewsMonthCount ?? 0,
            averageRatingMonth: s.averageRatingMonth ?? 0,
            monthlyEarnings:
              s.monthlyEarnings ??
              response.data.monthlyEarnings ??
              this.stats.monthlyEarnings,
            totalEarnings:
              s.totalEarnings ??
              response.data.totalEarnings ??
              this.stats.totalEarnings,
            jobDoneTotal:
              s.jobDoneTotal ??
              response.data.jobDone ??
              this.stats.jobDoneTotal,
            jobDoneMonth: s.jobDoneMonth ?? 0,
          };
        }
      } catch (error) {
        // silent (existing app style)
      } finally {
        this.isLoading = false;
      }
    },
    async loadMoreRatings() {
      if (!this.pagination.hasMore || this.isMoreLoading) return;
      this.isMoreLoading = true;
      try {
        await this.loadRatings({ reset: false });
      } catch (error) {
        // ignore
      } finally {
        this.isMoreLoading = false;
      }
    },
    async loadSparkData() {
      try {
        const response = await axios.get(
          `${URL}/handyman/${this.userId}/earnings/chart`,
          { params: { period: "daily" } }
        );
        if (response.data.success) {
          const cd = response.data.chartData || [];
          // Keep last 14 points for a clean sparkline.
          this.sparkData = cd.slice(-14).map((x) => Number(x.earnings || 0));
        }
      } catch (e) {
        // ignore
      }
    },
    buildSparkPaths(values) {
      const arr = Array.isArray(values)
        ? values.filter((v) => Number.isFinite(v))
        : [];
      if (arr.length < 2) return { line: "", area: "" };

      const min = Math.min(...arr);
      const max = Math.max(...arr);
      const span = max - min || 1;

      const points = arr.map((v, i) => {
        const x = (i / (arr.length - 1)) * 100;
        // map to y range [8..40] (lower is higher)
        const y = 40 - ((v - min) / span) * 32;
        return { x, y };
      });

      const line = points
        .map(
          (p, idx) =>
            `${idx === 0 ? "M" : "L"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`
        )
        .join(" ");

      const area = `${line} L100 50 L0 50 Z`;
      return { line, area };
    },
    formatMoney(value) {
      const n = Number(value || 0);
      try {
        return n.toLocaleString("he-IL", { maximumFractionDigits: 0 });
      } catch (e) {
        return String(Math.round(n));
      }
    },
    formatDelta(delta) {
      const d = Number(delta || 0);
      const sign = d > 0 ? "+" : "";
      return `${sign}${d}%`;
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
/* Design tokens (ported from the HTML mock) */
.perf {
  --primary: #f27f0d;
  --bg-dark: #221910;
  --card-dark: #2f2318;
  --surface-dark: #3a2e24;
  --text: rgba(255, 255, 255, 0.95);
  --muted: rgba(255, 255, 255, 0.62);

  min-height: max(884px, 100dvh);
  background: var(--bg-dark);
  color: var(--text);
  font-family: "Inter", "Heebo", system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  padding-bottom: env(safe-area-inset-bottom, 20px);
}

/* Utilities (tailwind-like) */
.glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.hide-scrollbar::-webkit-scrollbar {
  display: none;
}

.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Header */
.perf__header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(34, 25, 16, 0.8);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.perf__headerInner {
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.perf__title {
  margin: 0;
  font-size: 22px;
  font-weight: 900;
  letter-spacing: -0.02em;
}

.perf__back {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text);
  transition: transform 0.18s ease, border-color 0.18s ease,
    background-color 0.18s ease;
}

.perf__back:hover {
  border-color: rgba(242, 127, 13, 0.4);
  background: rgba(242, 127, 13, 0.08);
}

.perf__back:active {
  transform: scale(0.98);
}

.perf__headerSpacer {
  width: 40px;
}

/* Main */
.perf__main {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 18px 24px 0;
}

.perf__loading {
  padding: 40px 0;
  text-align: center;
  color: var(--muted);
  font-weight: 700;
}

/* Top cards */
.perf__top {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.perf__card {
  border-radius: 18px;
  overflow: hidden;
}

.perf__card--big {
  padding: 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  position: relative;
}

.perf__bigGlow {
  position: absolute;
  top: -40px;
  right: -40px;
  width: 150px;
  height: 150px;
  background: rgba(242, 127, 13, 0.2);
  filter: blur(60px);
  border-radius: 999px;
  pointer-events: none;
}

.perf__kpiLabel {
  display: block;
  color: rgba(255, 255, 255, 0.55);
  font-weight: 700;
  font-size: 13px;
}

.perf__kpiValue {
  display: block;
  font-size: 40px;
  font-weight: 900;
  letter-spacing: -0.03em;
}

.perf__kpiTrend {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 12px;
  font-weight: 800;
}

.perf__kpiTrend--up {
  color: #34d399;
}

.perf__kpiTrend--down {
  color: #fb7185;
}

.perf__kpiTrendIcon {
  font-size: 16px;
}

.perf__ring {
  width: 112px;
  height: 112px;
  position: relative;
  display: grid;
  place-items: center;
}

.perf__ringSvg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.perf__ringArc {
  stroke: var(--primary);
  filter: drop-shadow(0 0 4px rgba(242, 127, 13, 0.8));
}

.perf__ringIcon {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
}

.perf__ringIcon .material-symbols-outlined {
  color: var(--primary);
  font-size: 32px;
  filter: drop-shadow(0 10px 24px rgba(0, 0, 0, 0.4));
}

.perf__card--small {
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.perf__smallLeft {
  display: flex;
  align-items: center;
  gap: 12px;
}

.perf__badgeIcon {
  width: 42px;
  height: 42px;
  border-radius: 999px;
  display: grid;
  place-items: center;
}

.perf__badgeIcon--rose {
  background: rgba(244, 63, 94, 0.12);
  color: #fb7185;
}

.perf__smallText {
  color: rgba(255, 255, 255, 0.78);
  font-weight: 800;
}

.perf__smallRight {
  display: flex;
  align-items: center;
  gap: 10px;
}

.perf__smallValue {
  font-size: 24px;
  font-weight: 900;
}

.perf__pill {
  font-size: 11px;
  font-weight: 900;
  padding: 6px 10px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.perf__pill--good {
  color: #34d399;
  background: rgba(52, 211, 153, 0.12);
  border-color: rgba(52, 211, 153, 0.22);
}

.perf__pill--warn {
  color: #fb7185;
  background: rgba(244, 63, 94, 0.12);
  border-color: rgba(244, 63, 94, 0.22);
}

.perf__pill--neutral {
  color: rgba(255, 255, 255, 0.65);
  background: rgba(255, 255, 255, 0.04);
}

/* Earnings + sparkline */
.perf__earnings {
  border-radius: 18px;
}

.perf__earningsTop {
  padding: 22px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.perf__earningsCol--split {
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  padding-right: 18px;
}

.perf__earningsLabel {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6);
}

.perf__earningsVal {
  font-size: 22px;
  font-weight: 900;
  letter-spacing: -0.02em;
}

.perf__sparkWrap {
  height: 112px;
  position: relative;
}

.perf__sparkFade {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(242, 127, 13, 0.1), transparent);
  opacity: 0.55;
}

.perf__spark {
  width: 100%;
  height: 100%;
  display: block;
}

.perf__sparkLine {
  filter: drop-shadow(0 0 6px rgba(242, 127, 13, 0.6));
}

/* Reviews */
.perf__sectionHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.perf__sectionTitle {
  margin: 0;
  font-size: 18px;
  font-weight: 900;
}

.perf__link {
  border: none;
  background: transparent;
  color: var(--primary);
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
  padding: 6px 8px;
}

.perf__link:disabled {
  opacity: 0.6;
  cursor: default;
}

.perf__reviewsRow {
  display: flex;
  gap: 14px;
  overflow-x: auto;
  padding: 0 24px 8px;
  margin: 0 -24px;
}

.perf__reviewCard {
  min-width: 280px;
  padding: 18px;
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
}

.perf__reviewTopBar {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: 4px;
  background: linear-gradient(to left, var(--primary), transparent);
  opacity: 0.55;
}

.perf__reviewHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.perf__reviewUser {
  display: flex;
  align-items: center;
  gap: 10px;
}

.perf__avatar {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  background-color: rgba(255, 255, 255, 0.08);
  background-size: cover;
  background-position: center;
}

.perf__userName {
  font-size: 14px;
  font-weight: 900;
}

.perf__stars {
  display: flex;
  align-items: center;
  gap: 2px;
}

.perf__star {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.22);
}

.perf__star--on {
  color: #fbbf24;
}

.perf__reviewText {
  margin: 0;
  color: rgba(255, 255, 255, 0.82);
  font-size: 14px;
  line-height: 1.55;
}

.perf__reviewMeta {
  color: rgba(255, 255, 255, 0.42);
  font-size: 12px;
  font-weight: 700;
}

.perf__empty {
  padding: 18px;
  border-radius: 18px;
  color: rgba(255, 255, 255, 0.65);
  font-weight: 800;
}

/* Goal */
.perf__goal {
  padding: 22px;
}

.perf__goalHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.perf__goalIcon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(242, 127, 13, 0.2);
  color: var(--primary);
  display: grid;
  place-items: center;
}

.perf__goalTitle {
  margin: 0;
  font-size: 14px;
  font-weight: 900;
}

.perf__goalSub {
  margin: 4px 0 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 700;
}

.perf__goalNums {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  font-weight: 900;
}

.perf__goalNow {
  font-size: 18px;
}

.perf__goalSep {
  color: rgba(255, 255, 255, 0.35);
}

.perf__goalMax {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.perf__goalBar {
  width: 100%;
  height: 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.perf__goalFill {
  height: 100%;
  background: var(--primary);
  border-radius: 999px;
  position: relative;
  box-shadow: 0 0 10px rgba(242, 127, 13, 0.5);
}

@keyframes shimmer {
  100% {
    transform: translateX(-100%);
  }
}

.perf__goalShimmer {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 100%;
  background: linear-gradient(
    to right,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transform: translateX(100%);
  animation: shimmer 2s infinite;
}

.perf__goalHint {
  margin: 12px 0 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.42);
  text-align: center;
  font-weight: 700;
}

.perf__spacer {
  height: 24px;
}

@media (max-width: 420px) {
  .perf__main {
    padding-left: 18px;
    padding-right: 18px;
  }
  .perf__headerInner {
    padding-left: 18px;
    padding-right: 18px;
  }
  .perf__earningsTop {
    padding: 18px;
    gap: 12px;
  }
  .perf__card--big {
    padding: 18px;
  }
  .perf__kpiValue {
    font-size: 34px;
  }
}

.statItem__stars {
  display: flex;
  gap: 4px;
  flex-direction: row-reverse;
}

.statItem__star {
  font-size: 16px;
  color: #ffd700;
}

.statItem__star--empty {
  color: rgba(255, 255, 255, 0.3);
}

.ratingsList {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba($orange, 0.2);
  border-radius: 16px;
  padding: 24px;
}

.ratingsList__title {
  font-size: 18px;
  font-weight: 1000;
  color: $orange2;
  margin-bottom: 20px;
}

.ratingsList__empty {
  text-align: center;
  padding: 40px;
  color: $muted;
}

.ratingsList__items {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ratingItem {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
}

.ratingItem__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.ratingItem__stars {
  display: flex;
  gap: 4px;
  flex-direction: row-reverse;
}

.ratingItem__star {
  font-size: 16px;
  color: #ffd700;
}

.ratingItem__star--empty {
  color: rgba(255, 255, 255, 0.3);
}

.ratingItem__date {
  color: $muted;
  font-size: 12px;
  font-weight: 800;
}

.ratingItem__review {
  color: $text;
  line-height: 1.6;
  margin-bottom: 8px;
}

.ratingItem__review--empty {
  color: $muted;
  font-style: italic;
}

.ratingItem__footer {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
}

.ratingItem__job {
  color: $orange2;
  font-size: 12px;
  font-weight: 900;
}

.ratingItem__customer {
  color: $muted;
  font-size: 12px;
  font-weight: 800;
}

.handymanRatings__footer {
  margin-top: 32px;
  display: flex;
  justify-content: center;
}

.handymanRatings__backBottom {
  padding: 12px 24px;
  border-radius: 12px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  cursor: pointer;
  font-weight: 1000;
  font-size: 14px;
  transition: all 0.2s ease;
}

.handymanRatings__backBottom:hover {
  background: rgba($orange, 0.1);
  border-color: rgba($orange, 0.5);
  transform: translateY(-1px);
}

/* Earnings Chart */
.earningsChart {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba($orange, 0.2);
  border-radius: 16px;
  padding: 24px;
}

.earningsChart__title {
  font-size: 18px;
  font-weight: 1000;
  color: $orange2;
  margin-bottom: 20px;
}

.chart-period-selector {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.period-btn {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba(255, 255, 255, 0.06);
  color: $muted;
  font-size: 13px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: $font-family;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba($orange, 0.5);
  }

  &--active {
    background: rgba($orange, 0.15);
    color: $orange2;
    border-color: rgba($orange, 0.5);
  }
}

.chart-container {
  position: relative;
  height: 300px;
  width: 100%;

  @media (max-width: 400px) {
    height: 250px;
  }
}
</style>
