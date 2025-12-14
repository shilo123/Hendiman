<template>
  <div class="dash" dir="rtl">
    <!-- Loading Overlay -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p class="loading-text">טוען נתונים...</p>
      </div>
    </div>

    <!-- TOP BAR -->
    <header class="top">
      <div class="top__left">
        <div class="me" role="button" tabindex="0" @click="onOpenProfile">
          <div class="me__avatar-wrapper">
            <div class="me__avatar-container">
              <img class="me__avatar" :src="me.avatarUrl" alt="avatar" />
              <div class="me__edit-overlay">
                <span class="me__edit-text">ערוך פרופיל</span>
              </div>
            </div>
            <div class="me__status-indicator">
              <span
                class="dot"
                :class="{ 'dot--on': isHendiman ? isAvailable : true }"
              ></span>
              <span class="me__status-text">{{
                isHendiman ? (isAvailable ? "זמין" : "לא זמין") : "מחובר"
              }}</span>
            </div>
          </div>
          <div class="me__meta">
            <div class="me__name">{{ me.name }}</div>
            <div class="me__role">{{ isHendiman ? "הנדימן" : "לקוח" }}</div>
          </div>
          <span class="me__chev">›</span>
        </div>
      </div>

      <div class="top__right">
        <div class="top__chats">
          <button
            class="btn btn--ghost"
            type="button"
            @click="onOpenHandymenChat"
          >
            💬 צ׳אט הנדימנים
          </button>
          <button
            class="btn btn--ghost"
            type="button"
            @click="onOpenAllUsersChat"
          >
            🗣️ צ׳אט כל המשתמשים
          </button>
        </div>

        <div class="kpi">
          <div class="kpi__item">
            <div class="kpi__num">{{ stats.clients }}</div>
            <div class="kpi__label">לקוחות</div>
          </div>
          <div class="kpi__item">
            <div class="kpi__num">{{ stats.handymen }}</div>
            <div class="kpi__label">הנדימנים</div>
          </div>
          <div class="kpi__item kpi__item--hot">
            <div class="kpi__num">{{ stats.users }}</div>
            <div class="kpi__label">משתמשים</div>
          </div>
        </div>
      </div>
    </header>

    <!-- Mobile Navigation Buttons (visible only on mobile) -->
    <!-- http://10.0.0.81:8080 -->
    <!-- MAIN -->
    <main class="grid">
      <!-- LEFT ~60% JOBS -->
      <section class="jobs">
        <div class="jobs__head">
          <div class="headActions">
            <button class="btn btn--primary" type="button" @click="onRefresh">
              ↻ רענן
            </button>
          </div>

          <div>
            <h2 class="h2">עבודות</h2>
            <p class="sub">
              {{
                isHendiman
                  ? "סינון לפי מצב ומרחק · קבל/דלג · צ׳אט לכל עבודה"
                  : "כל הקריאות שלך · צפייה וסטטוסים"
              }}
            </p>
          </div>
        </div>

        <!-- Handyman filters -->
        <div v-if="isHendiman" class="filters">
          <div class="filters__card">
            <div class="filters__row">
              <div class="field">
                <label class="label">מצב קריאה</label>
                <div class="tabs">
                  <button
                    v-for="t in statusTabsWithCounts"
                    :key="t.value"
                    class="tab"
                    :class="{ 'tab--active': activeStatus === t.value }"
                    type="button"
                    @click="onPickStatus(t.value)"
                  >
                    <span class="tab__txt">{{ t.label }}</span>
                    <span class="tab__count">{{ t.count }}</span>
                  </button>
                </div>
              </div>

              <div class="field field--narrow">
                <label class="label">מרחק</label>
                <div class="rangeBox">
                  <div class="rangeBox__top">
                    <span class="badge"
                      >עד <b>{{ handymanFilters.maxKm }}</b> ק״מ</span
                    >
                    <button class="link" type="button" @click="onResetKm">
                      איפוס
                    </button>
                  </div>
                  <input
                    class="range"
                    type="range"
                    min="1"
                    max="30"
                    step="1"
                    v-model.number="handymanFilters.maxKm"
                    @change="onChangeKm"
                  />
                  <div class="hint">
                    * סינון תצוגה. בפועל הקריאות מגיעות לפי אזור פעילות בפרופיל.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Jobs list -->
        <div class="jobs__list">
          <article v-for="job in filteredJobs" :key="job.id" class="job-card">
            <div class="job-card__left">
              <div class="job-card__tags">
                <span v-if="job.isUrgent" class="tag tag--urgent">דחוף</span>
                <span
                  class="tag tag--status"
                  :title="`סטטוס: ${getStatusLabel(job.status)}`"
                >
                  {{ getStatusLabel(job.status) }}
                </span>
                <span
                  class="tag"
                  :class="
                    job.billingType === 'hourly' ? 'tag--hourly' : 'tag--fixed'
                  "
                >
                  {{ job.billingType === "hourly" ? "לשעה" : "קבלנות" }}
                </span>
              </div>

              <div class="job-card__meta">
                <div class="job-card__title">{{ job.subcategoryName }}</div>
                <div class="job-card__sub">
                  👤 {{ job.clientName }} · 📍 {{ job.locationText }} ·
                  {{ job.distanceKm }} ק״מ
                </div>
                <div class="job-card__price">{{ job.price }} שקלות</div>
              </div>
            </div>

            <div class="job-card__actions">
              <template v-if="isHendiman">
                <button
                  class="mini mini--ghost"
                  type="button"
                  @click="onSkip(job)"
                >
                  דלג
                </button>
                <button
                  class="mini mini--primary"
                  type="button"
                  :disabled="job.status !== 'open'"
                  @click="onAccept(job)"
                >
                  קבל
                </button>
              </template>
              <template v-else>
                <button
                  class="mini mini--primary"
                  type="button"
                  @click="onView(job)"
                >
                  צפייה
                </button>
              </template>
            </div>
          </article>
        </div>
      </section>

      <!-- RIGHT SIDE -->
      <aside class="side">
        <!-- CLIENT: handymen in area + action buttons -->
        <section v-if="!isHendiman" class="panel">
          <div class="panel__head">
            <h2 class="h2">הנדימנים באזורך</h2>
            <p class="sub">הנדימנים הזמינים באזור שלך · לחץ על כפתור לפעולה</p>
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <button
              class="btn-create-call"
              type="button"
              @click="onCreateCallCta"
            >
              <span class="icon">⚡</span>
              <span>צור קריאה</span>
            </button>

            <button
              class="btn-create-call"
              type="button"
              @click="onOpenPersonalRequest"
            >
              <span class="icon">👤</span>
              <span>בחר הנדימן</span>
            </button>
          </div>

          <!-- Handymen List -->
          <div class="handymen-list">
            <div v-for="h in filteredHandymen" :key="h.id" class="hcard">
              <div class="hcard__left">
                <img class="hcard__av" :src="h.imageUrl" alt="handyman" />
                <div class="hcard__meta">
                  <div class="hcard__name">{{ h.username }}</div>
                  <div class="hcard__sub">
                    ⭐ {{ h.rating }} · {{ 0 }} עבודות
                  </div>
                </div>
              </div>

              <div class="hcard__actions">
                <button
                  class="mini mini--ghost"
                  type="button"
                  @click="onOpenUserChat(h.id)"
                >
                  צ׳אט
                </button>
                <button
                  class="mini mini--primary"
                  type="button"
                  @click="onPersonalRequest(h.id)"
                >
                  הזמן
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- HANDYMAN: quick profile & notes -->
        <section v-else class="panel">
          <div class="panel__head">
            <h2 class="h2">כלים להנדימן</h2>
            <p class="sub">עבודות מופיעות רק לפי ההתמחויות שבחרת בהרשמה</p>
          </div>

          <div class="quick">
            <div class="quick__row">
              <div class="badgeLine">
                <span class="badgeLine__k">תחומי ההתמחות שלי </span>
                <div class="badgeLine__v">
                  <span
                    class="chip"
                    v-for="(subcat, index) in me.specialties"
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
                @click="onGoProfile"
              >
                ערוך פרופיל (אזור פעילות/זמינות)
              </button>
              <button
                class="btn btn--ghost btn--full"
                type="button"
                @click="onOpenHandymenChat"
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
        </section>
      </aside>
    </main>
  </div>
</template>

<script>
import { useMainStore } from "@/store/index";
export default {
  name: "DashboardView",
  data() {
    return {
      // will come from server
      isHendiman: false,

      isAvailable: true,

      me: {
        id: "u1",
        name: "קלאמזי",
        avatarUrl:
          "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=200&h=200&fit=crop",
        specialties: [
          "פתיחת סתימות",
          "החלפת ברזים",
          "התקנת מאוורר תקרה",
          "החלפת מפסק",
          "הרכבת רהיטי איקאה",
          "הרכבת מיטות",
        ],
      },

      statusTabs: [
        { label: "הכל", value: "all" },
        { label: "פתוחות", value: "open" },
        { label: "שובצו", value: "assigned" },
        { label: "בדרך", value: "on_the_way" },
        { label: "בביצוע", value: "in_progress" },
        { label: "הושלמו", value: "done" },
        { label: "בוטלו", value: "cancelled" },
      ],
      activeStatus: "all",

      handymanFilters: { maxKm: 10 },

      dirFilters: { q: "", minRating: 0, minJobs: 0 },
    };
  },

  setup() {
    const store = useMainStore();
    return { store };
  },
  computed: {
    jobs() {
      return this.store.jobs;
    },
    handymen() {
      return this.store.handymen;
    },
    stats() {
      return this.store.stats;
    },
    isLoading() {
      return this.store.isLoading;
    },
    filteredJobs() {
      return this.store.filteredJobs(
        this.isHendiman ? this.activeStatus : null,
        this.isHendiman ? this.handymanFilters.maxKm : null,
        this.isHendiman
      );
    },

    filteredHandymen() {
      return this.store.filteredHandymen(this.dirFilters);
    },
    statusTabsWithCounts() {
      // חשב את הספירות לכל סטטוס
      const allJobs = this.store.jobs;
      const filteredByKm = this.isHendiman
        ? allJobs.filter((j) => j.distanceKm <= this.handymanFilters.maxKm)
        : allJobs;

      return this.statusTabs.map((tab) => {
        let count = 0;
        if (tab.value === "all") {
          count = filteredByKm.length;
        } else {
          count = filteredByKm.filter((j) => j.status === tab.value).length;
        }
        return { ...tab, count };
      });
    },
  },

  methods: {
    onRefresh() {
      console.log("refresh dashboard");
    },

    onOpenProfile() {
      console.log("open profile");
    },

    onOpenHandymenChat() {
      console.log("open handymen general chat");
    },

    onOpenAllUsersChat() {
      console.log("open all users chat");
    },

    onPickStatus(v) {
      console.log("pick status", v);
      this.activeStatus = v;
    },

    onChangeKm() {
      console.log("change km", this.handymanFilters.maxKm);
    },

    onResetKm() {
      console.log("reset km");
      this.handymanFilters.maxKm = 10;
    },

    onOpenJobMenu(job) {
      console.log("open job menu", job.id);
    },

    onOpenJobChat(job) {
      console.log("open job chat", job.id);
    },

    onOpenUserChat(userId) {
      console.log("open user chat", userId);
    },

    onSkip(job) {
      console.log("skip job", job.id);
    },

    onAccept(job) {
      console.log("accept job", job.id);
    },

    onView(job) {
      console.log("view job", job.id);
    },

    onCreateCallCta() {
      this.$router.push({
        name: "CreateCall",
        params: { id: this.$route.params.id },
      });
    },

    onOpenPersonalRequest() {
      this.$router.push({
        name: "SelectHandyman",
        params: { id: this.$route.params.id },
      });
    },

    onGoProfile() {
      console.log("go profile edit");
    },

    onBlockHandyman(id) {
      console.log("block handyman", id);
    },

    onPersonalRequest(id) {
      console.log("personal request handyman", id);
    },

    getStatusLabel(status) {
      const labels = {
        open: "פתוחה",
        assigned: "שובצה",
        on_the_way: "בדרך",
        in_progress: "בביצוע",
        done: "הושלמה",
        cancelled: "בוטלה",
      };
      return labels[status] || status;
    },
  },
  async mounted() {
    try {
      const data = await this.store.fetchDashboardData(this.$route.params.id);

      // עדכן את הנתונים המקומיים מהמשתמש
      if (data.User) {
        this.me.name = data.User.username;
        this.me.specialties = data.User.specialties;
        this.me.avatarUrl = data.User.imageUrl;
        this.me.id = data.User._id;
        this.me.phone = data.User.phone;
        this.me.email = data.User.email;
        this.me.address = data.User.address;
        this.me.city = data.User.city;
        this.isHendiman = data.User.isHandyman;
      } else {
        this.toast.showError("משתמש לא נמצא");
        this.$router.push({ name: "logIn" });
      }
    } catch (error) {
      console.log("error", error);
    }
  },
};
</script>

<style lang="scss" scoped>
/* ====== THEME: BLACK + ORANGE (HENDIMAN) ====== */
$bg: #0b0b0f;
$bg2: #0f1016;
$card: rgba(255, 255, 255, 0.06);
$card2: rgba(255, 255, 255, 0.085);
$stroke: rgba(255, 255, 255, 0.12);
$text: rgba(255, 255, 255, 0.92);
$muted: rgba(255, 255, 255, 0.62);

$orange: #ff6a00;
$orange2: #ff8a2b;
$orange3: #ffb36b;

$danger: #ff3b3b;

$shadow: 0 18px 40px rgba(0, 0, 0, 0.55);
$shadowO: 0 18px 44px rgba(255, 106, 0, 0.18);

$r: 18px;
$r2: 26px;

@mixin focusRing {
  outline: none;
  box-shadow: 0 0 0 3px rgba($orange, 0.32);
}

.dash {
  direction: rtl;
  min-height: 100vh;
  min-height: -webkit-fill-available; // iOS fix
  color: $text;
  padding: 16px;
  background: radial-gradient(
      900px 520px at 10% -10%,
      rgba($orange, 0.18),
      transparent 55%
    ),
    radial-gradient(
      700px 420px at 95% 10%,
      rgba($orange2, 0.12),
      transparent 55%
    ),
    linear-gradient(180deg, $bg, $bg2);

  @media (max-width: 768px) {
    padding: 12px 10px;
    padding-bottom: calc(12px + env(safe-area-inset-bottom)); // iOS safe area
    padding-top: calc(12px + env(safe-area-inset-top)); // iOS safe area
  }
}

/* TOP */
.top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 14px;

  @media (max-width: 768px) {
    margin-bottom: 6px;
    gap: 4px;
    padding: 6px 8px;
    background: linear-gradient(180deg, $card2, $card);
    border-radius: 12px;
    border: 1px solid $stroke;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    position: sticky;
    top: 0;
    z-index: 100;
    margin-left: calc(-6px - env(safe-area-inset-left));
    margin-right: calc(-6px - env(safe-area-inset-right));
    padding-left: calc(14px + env(safe-area-inset-left));
    padding-right: calc(14px + env(safe-area-inset-right));
  }
}

.kpi {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    gap: 4px;
  }

  &__item {
    background: linear-gradient(180deg, $card2, $card);
    border: 1px solid $stroke;
    border-radius: 999px;
    padding: 10px 12px;
    box-shadow: $shadow;
    display: flex;
    align-items: baseline;
    gap: 10px;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    position: relative;
    overflow: hidden;

    @media (max-width: 768px) {
      padding: 4px 6px;
      gap: 4px;
      border-radius: 12px;
    }

    &::before {
      content: "";
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: rgba($orange, 0.1);
      transform: translate(-50%, -50%);
      transition: width 0.4s ease, height 0.4s ease;
    }

    &:hover {
      transform: translateY(-2px);
      border-color: rgba($orange, 0.4);
      box-shadow: $shadow, 0 8px 20px rgba($orange, 0.2);
      background: linear-gradient(
        180deg,
        rgba($orange, 0.08),
        rgba($orange, 0.04)
      );

      &::before {
        width: 200px;
        height: 200px;
      }

      .kpi__num {
        color: $orange;
        transform: scale(1.05);
      }

      .kpi__label {
        color: rgba(255, 255, 255, 0.8);
      }
    }
  }

  &__num {
    font-size: 18px;
    font-weight: 1000;
    color: $text;
    transition: all 0.25s ease;
    position: relative;
    z-index: 1;

    @media (max-width: 768px) {
      font-size: 11px;
    }
  }

  &__label {
    font-size: 12px;
    font-weight: 900;
    color: $muted;
    transition: color 0.25s ease;
    position: relative;
    z-index: 1;

    @media (max-width: 768px) {
      font-size: 8px;
    }
  }

  &__item--hot {
    border-color: rgba($orange, 0.45);
    box-shadow: $shadow, $shadowO;

    .kpi__num {
      color: $orange3;
    }
  }
}

.top__left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  flex: 1;

  @media (max-width: 768px) {
    gap: 4px;
    flex: 0 0 auto;
  }
}

.top__chats {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
  margin-left: 70px;

  @media (max-width: 768px) {
    display: none; // Hide on mobile
  }
}

.top__right {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;

  @media (max-width: 768px) {
    gap: 6px;
    flex: 1;
    justify-content: flex-end;
  }
}

.me {
  display: flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(180deg, $card2, $card);
  border: 1px solid rgba($orange, 0.22);
  border-radius: 999px;
  padding: 8px 10px;
  box-shadow: $shadow;
  cursor: pointer;
  transition: transform 140ms ease, box-shadow 140ms ease;

  @media (max-width: 768px) {
    padding: 4px 6px;
    gap: 4px;
    border-radius: 12px;
  }

  &:hover {
    transform: translateY(-1px);
    box-shadow: $shadow, $shadowO;
  }
  &:focus {
    @include focusRing;
  }

  &__avatar-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__avatar-container {
    position: relative;
    display: inline-block;
  }

  &__avatar {
    width: 40px;
    height: 40px;
    border-radius: 999px;
    object-fit: cover;
    border: 2px solid rgba($orange, 0.35);
    transition: all 0.25s ease;
    display: block;

    @media (max-width: 768px) {
      width: 28px;
      height: 28px;
      border-width: 1.5px;
    }
  }

  &__status-indicator {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border-radius: 999px;
    border: 1px solid rgba($orange, 0.2);
    background: rgba(0, 0, 0, 0.25);
    padding: 6px 10px;
    color: $text;
    font-weight: 900;
    font-size: 11px;
    white-space: nowrap;

    @media (max-width: 768px) {
      padding: 3px 5px;
      font-size: 8px;
      gap: 3px;
      border-radius: 10px;
    }
  }

  &__status-text {
    line-height: 1;
  }

  &__edit-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 40px;
    height: 40px;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s ease;
    pointer-events: none;
    z-index: 10;
  }

  &__edit-text {
    color: $orange;
    font-weight: 900;
    font-size: 9px;
    text-align: center;
    line-height: 1.2;
    padding: 0 4px;
  }

  &:hover {
    transform: translateY(-1px);
    box-shadow: $shadow, $shadowO;

    .me__avatar-container:hover .me__avatar {
      border-color: rgba($orange, 0.6);
    }

    .me__avatar-container:hover .me__edit-overlay {
      opacity: 1;
      pointer-events: auto;
    }
  }

  &__meta {
    display: grid;
    gap: 2px;

    @media (max-width: 768px) {
      display: none; // Hide name and role on mobile
    }
  }

  &__name {
    font-weight: 1000;
    font-size: 13px;
  }

  &__role {
    font-weight: 900;
    font-size: 12px;
    color: $muted;
  }

  &__chev {
    color: rgba($orange3, 0.9);
    font-weight: 1000;
    font-size: 18px;
    margin-right: 4px;

    @media (max-width: 768px) {
      display: none; // Hide chevron on mobile
    }
  }
}

/* GRID */
.grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr; /* ~60/40 */
  gap: 14px;
  align-items: start;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: 768px) {
    gap: 10px;
    display: flex;
    flex-direction: column-reverse; // Jobs section at bottom on mobile
  }
}

/* JOBS */
.jobs {
  border-radius: $r2;
  border: 1px solid $stroke;
  background: linear-gradient(180deg, $card2, rgba(255, 255, 255, 0.04));
  box-shadow: $shadow;
  overflow: hidden;

  @media (max-width: 768px) {
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  &__head {
    padding: 14px;
    display: flex;
    flex-direction: row-reverse;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    background: radial-gradient(
        900px 240px at 20% 0%,
        rgba($orange, 0.14),
        transparent 55%
      ),
      linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.06),
        rgba(255, 255, 255, 0.03)
      );

    @media (max-width: 768px) {
      padding: 8px 6px;
      gap: 6px;
      border-radius: 12px 12px 0 0;
    }
  }
}

.h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 1000;

  @media (max-width: 768px) {
    font-size: 14px;
  }
}

.sub {
  margin: 4px 0 0;
  color: $muted;
  font-weight: 800;
  font-size: 12.5px;

  @media (max-width: 768px) {
    font-size: 9px;
    margin: 2px 0 0;
  }
}

.headActions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.pill {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  border-radius: 999px;
  border: 1px solid rgba($orange, 0.2);
  background: rgba(0, 0, 0, 0.25);
  padding: 9px 10px;
  color: $text;
  font-weight: 900;
  font-size: 12px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);

  &--on {
    background: $orange;
    box-shadow: 0 0 0 4px rgba($orange, 0.22);
  }
}

/* FILTERS */
.filters {
  padding: 12px 14px 0;

  @media (max-width: 768px) {
    padding: 6px 6px 0;
  }

  &__card {
    border-radius: $r;
    border: 1px solid rgba($orange, 0.18);
    background: rgba($orange, 0.08);
    padding: 12px;

    @media (max-width: 768px) {
      padding: 6px;
      border-radius: 10px;
    }
  }

  &__row {
    display: grid;
    grid-template-columns: 1.2fr 0.8fr;
    gap: 12px;

    @media (max-width: 980px) {
      grid-template-columns: 1fr;
    }
  }
}

.field {
  display: grid;
  gap: 8px;

  &--narrow {
    align-content: start;
  }
}

.label {
  font-size: 12px;
  font-weight: 1000;
  color: rgba(255, 255, 255, 0.78);

  @media (max-width: 768px) {
    font-size: 10px;
  }
}

.tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tab {
  border-radius: 999px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba(0, 0, 0, 0.25);
  padding: 10px 20px;
  cursor: pointer;
  display: inline-flex;
  gap: 10px;
  align-items: center;
  transition: transform 120ms ease, box-shadow 120ms ease;
  min-width: fit-content;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 12px 20px rgba($orange, 0.12);
  }

  &:focus {
    @include focusRing;
  }

  &--active {
    background: linear-gradient(135deg, $orange, $orange2);
    border-color: rgba($orange, 0.55);
  }

  &__txt {
    font-size: 12px;
    font-weight: 1000;
    color: $text;
    white-space: nowrap;

    @media (max-width: 768px) {
      font-size: 9px;
    }
  }

  &__count {
    font-size: 12px;
    font-weight: 1000;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.16);
    background: rgba(0, 0, 0, 0.25);
    white-space: nowrap;

    @media (max-width: 768px) {
      font-size: 8px;
      padding: 2px 6px;
    }
  }
}

.rangeBox {
  border-radius: $r;
  border: 1px solid rgba($orange, 0.18);
  background: rgba(0, 0, 0, 0.22);
  padding: 10px;

  &__top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }
}

.badge {
  border-radius: 999px;
  padding: 7px 10px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba($orange, 0.12);
  font-weight: 900;
  font-size: 12px;

  b {
    font-weight: 1100;
    color: $orange3;
  }
}

.range {
  width: 100%;
  accent-color: $orange;
}

.hint {
  margin-top: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.62);
  font-weight: 800;
}

/* JOB CARDS */
.jobs__list {
  padding: 14px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;

  @media (max-width: 768px) {
    padding: 6px 4px;
    gap: 6px;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
  }
}

.job-card {
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
    flex: 1;
    min-width: 0;
  }

  &__tags {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    flex-shrink: 0;

    @media (max-width: 768px) {
      gap: 4px;
    }
  }

  &__meta {
    display: grid;
    gap: 4px;
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-weight: 1100;
    font-size: 14px;
    color: $text;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    @media (max-width: 768px) {
      font-size: 12px;
    }
  }

  &__sub {
    margin-top: 2px;
    color: rgba(255, 255, 255, 0.62);
    font-weight: 900;
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    @media (max-width: 768px) {
      font-size: 9px;
      margin-top: 1px;
    }
  }

  &__price {
    font-weight: 1100;
    color: $orange3;
    font-size: 13px;

    @media (max-width: 768px) {
      font-size: 10px;
    }
  }

  &__actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    flex-shrink: 0;

    @media (max-width: 768px) {
      gap: 4px;
    }
  }
}

.tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  border-radius: 999px;
  padding: 6px 10px;
  font-weight: 1000;
  font-size: 11.5px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba($orange, 0.12);
  color: $text;

  @media (max-width: 768px) {
    padding: 2px 4px;
    font-size: 7px;
    border-radius: 6px;
  }

  &--urgent {
    border-color: rgba($danger, 0.45);
    background: rgba($danger, 0.12);
    color: #ffd4d4;
  }

  &--status {
    border-color: rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.84);
  }

  &--hourly {
    border-color: rgba($orange2, 0.28);
    background: rgba($orange2, 0.14);
  }

  &--fixed {
    border-color: rgba($orange, 0.22);
    background: rgba($orange, 0.12);
  }
}

.iconBtn {
  width: 38px;
  height: 38px;
  border-radius: 14px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba(0, 0, 0, 0.28);
  color: $text;
  cursor: pointer;

  &:hover {
    box-shadow: 0 10px 18px rgba($orange, 0.14);
  }

  &:focus {
    @include focusRing;
  }

  @media (max-width: 768px) {
    width: 24px;
    height: 24px;
    border-radius: 8px;
    font-size: 12px;
  }
}

.job__titleRow {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: baseline;
}

.job__title {
  margin: 0;
  font-size: 15.5px;
  font-weight: 1100;

  @media (max-width: 768px) {
    font-size: 11px;
    line-height: 1.25;
  }
}

.price {
  font-weight: 1200;
  color: $orange3;
  font-size: 14px;

  @media (max-width: 768px) {
    font-size: 9px;
  }

  span {
    font-weight: 900;
    color: rgba(255, 255, 255, 0.7);
    margin-right: 4px;
  }
}

.job__desc {
  margin: 8px 0 0;
  color: rgba(255, 255, 255, 0.78);
  font-weight: 800;
  font-size: 13px;
  line-height: 1.4;

  @media (max-width: 768px) {
    font-size: 9px;
    margin: 3px 0 0;
    line-height: 1.25;
  }
}

.metaGrid {
  margin-top: 10px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;

  @media (max-width: 768px) {
    gap: 3px;
    margin-top: 4px;
  }

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
}

.meta {
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.22);
  padding: 10px;

  @media (max-width: 768px) {
    padding: 4px;
    border-radius: 8px;
  }

  &__k {
    display: block;
    font-size: 12px;
    font-weight: 900;
    color: rgba(255, 255, 255, 0.62);
    margin-bottom: 4px;

    @media (max-width: 768px) {
      font-size: 8px;
      margin-bottom: 2px;
    }
  }

  &__v {
    font-size: 12.5px;
    font-weight: 1000;
    color: rgba(255, 255, 255, 0.9);

    @media (max-width: 768px) {
      font-size: 8px;
      line-height: 1.2;
    }
  }
}

.spacer {
  flex: 1 1 auto;
}

/* SIDE PANEL */
.panel {
  border-radius: $r2;
  border: 1px solid $stroke;
  background: linear-gradient(180deg, $card2, rgba(255, 255, 255, 0.04));
  box-shadow: $shadow;
  padding: 14px;
  width: 100%;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 8px 6px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
    margin-bottom: 8px;
  }
}

.panel__head {
  margin-bottom: 10px;
}

.cta {
  border-radius: $r2;
  border: 1px solid rgba($orange, 0.18);
  background: rgba(0, 0, 0, 0.22);
  padding: 12px;
  width: 100%;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 8px;
    border-radius: 12px;
  }
}

.action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}

.handymen-list {
  display: grid;
  gap: 10px;
  margin-top: 12px;

  @media (max-width: 768px) {
    gap: 6px;
  }
}

/* Button: "צור קריאה" (Orange + Black) */
.btn-create-call {
  --orange: #ff7a00;
  --orange-2: #ff9a3c;
  --black: #0b0b0f;
  --black-2: #14141a;

  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  padding: 0.95rem 1.25rem;
  min-height: 48px;
  border-radius: 14px;
  border: 1px solid rgba(255, 122, 0, 0.55);
  color: #fff;
  background: linear-gradient(
    135deg,
    var(--black) 0%,
    var(--black-2) 55%,
    rgba(255, 122, 0, 0.1) 100%
  );
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.45), 0 0 0 0 rgba(255, 122, 0, 0);
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  font-weight: 800;
  letter-spacing: 0.2px;
  text-transform: none;
  transition: transform 0.12s ease, box-shadow 0.18s ease,
    border-color 0.18s ease, background 0.18s ease, filter 0.18s ease;
  position: relative;
  overflow: hidden;
  font-size: 14px;
  border: none;

  .icon {
    width: 18px;
    height: 18px;
    flex: 0 0 auto;
    filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.45));
  }

  &:hover {
    border-color: rgba(255, 122, 0, 0.9);
    background: linear-gradient(
      135deg,
      #0f0f14 0%,
      #1a1a22 55%,
      rgba(255, 122, 0, 0.16) 100%
    );
    box-shadow: 0 14px 32px rgba(0, 0, 0, 0.55),
      0 0 0 6px rgba(255, 122, 0, 0.12);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0px) scale(0.99);
    box-shadow: 0 10px 22px rgba(0, 0, 0, 0.5), 0 0 0 4px rgba(255, 122, 0, 0.1);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 4px rgba(255, 122, 0, 0.25),
      0 16px 40px rgba(0, 0, 0, 0.55);
  }

  &:disabled,
  &.is-disabled {
    cursor: not-allowed;
    opacity: 0.55;
    filter: grayscale(0.2);
    transform: none;
    box-shadow: none;
  }

  // subtle animated shine
  &::after {
    content: "";
    position: absolute;
    inset: -40% -60%;
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.1) 35%,
      rgba(255, 255, 255, 0) 70%
    );
    transform: translateX(-40%) rotate(10deg);
    transition: transform 0.55s ease;
    pointer-events: none;
  }

  &:hover::after {
    transform: translateX(40%) rotate(10deg);
  }

  // optional "urgent" variant
  &.is-urgent {
    border-color: rgba(255, 122, 0, 0.95);
    background: linear-gradient(
      135deg,
      #0b0b0f 0%,
      #1b1208 55%,
      rgba(255, 122, 0, 0.22) 100%
    );
    box-shadow: 0 14px 34px rgba(0, 0, 0, 0.55),
      0 0 0 6px rgba(255, 122, 0, 0.18);
  }

  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
    min-height: 42px; // Smaller on mobile
    font-size: 13px;
    border-radius: 12px;
    gap: 0.5rem;

    .icon {
      width: 16px;
      height: 16px;
    }
  }
}

/* form controls */
.input,
.select,
.textarea {
  width: 100%;
  box-sizing: border-box;
  border-radius: 16px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  padding: 12px 12px;
  font-weight: 900;
  -webkit-appearance: none; // Remove iOS styling
  appearance: none;
  font-size: 16px; // Prevent zoom on iOS

  @media (max-width: 768px) {
    padding: 10px 8px;
    font-size: 16px; // Prevent iOS zoom
    border-radius: 10px;
    min-height: 40px; // Smaller on mobile
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.45);
  }

  &:focus {
    @include focusRing;
    border-color: rgba($orange, 0.45);
  }
}

.textarea {
  resize: vertical;
  min-height: 92px;
}

.preview {
  margin-top: 10px;
  border-radius: 18px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba($orange, 0.1);
  padding: 10px;

  &__row {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    padding: 4px 0;

    span {
      color: rgba(255, 255, 255, 0.7);
      font-weight: 900;
      font-size: 12px;
    }

    b {
      font-weight: 1100;
      color: $orange3;
      font-size: 12.5px;
    }
  }
}

.apiNote {
  margin-top: 6px;
  color: rgba(255, 255, 255, 0.62);
  font-weight: 800;
  font-size: 12px;

  @media (max-width: 768px) {
    font-size: 11px;
    margin-top: 4px;
  }
}

/* File upload styles for call image */
.file-upload-wrapper {
  position: relative;
  width: 100%;
  box-sizing: border-box;
}

.file-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  overflow: hidden;
}

.file-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: $r;
  border: 1px solid rgba($orange, 0.18);
  background: rgba($orange, 0.1);
  color: $text;
  font-weight: 900;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  box-sizing: border-box;
  text-align: center;

  &:hover {
    background: rgba($orange, 0.15);
    border-color: rgba($orange, 0.3);
  }

  &.disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    padding: 10px 14px;
    font-size: 12px;
  }
}

.image-preview-small {
  position: relative;
  margin-top: 10px;
  width: 100%;
  max-width: 200px;
  border-radius: $r;
  overflow: hidden;
  border: 1px solid rgba($orange, 0.2);

  img {
    width: 100%;
    height: auto;
    display: block;
  }

  @media (max-width: 768px) {
    max-width: 150px;
  }
}

.remove-image-btn {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 59, 59, 0.9);
    transform: scale(1.1);
  }

  @media (max-width: 768px) {
    width: 24px;
    height: 24px;
    font-size: 18px;
    top: 6px;
    left: 6px;
  }
}

.row {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 10px;

  &--2 {
    display: grid;
    grid-template-columns: 1fr 1fr;

    @media (max-width: 520px) {
      grid-template-columns: 1fr;
    }
  }
}

.toggle {
  border-radius: 999px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba($orange, 0.1);
  color: $text;
  padding: 10px 12px;
  cursor: pointer;
  font-weight: 1000;

  &--on {
    border-color: rgba($orange, 0.45);
    box-shadow: 0 14px 22px rgba($orange, 0.16);
  }

  &:focus {
    @include focusRing;
  }
}

.fine {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  padding: 10px 12px;
  border-radius: 16px;
  border: 1px solid rgba($danger, 0.28);
  background: rgba($danger, 0.1);
  color: rgba(255, 255, 255, 0.88);
  font-weight: 900;

  b {
    color: #ffd4d4;
    font-weight: 1100;
  }

  &__icon {
    width: 26px;
    height: 26px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    background: rgba($danger, 0.16);
    border: 1px solid rgba($danger, 0.18);
  }
}

.divider {
  height: 14px;
}

/* directory */
.dir {
  border-radius: $r2;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.22);
  padding: 12px;

  @media (max-width: 768px) {
    padding: 8px;
    border-radius: 12px;
  }
}

.dir__list {
  margin-top: 12px;
  display: grid;
  gap: 10px;

  @media (max-width: 768px) {
    margin-top: 8px;
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

/* buttons */
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
    box-shadow: $shadowO;
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

  &--danger {
    border-color: rgba($danger, 0.35);
    background: rgba($danger, 0.14);
    color: #ffd4d4;
  }
}

.link {
  border: none;
  background: transparent;
  color: $orange3;
  font-weight: 1000;
  cursor: pointer;

  &:focus {
    @include focusRing;
    border-radius: 12px;
  }
}

.side {
  display: grid;
  gap: 14px;
  width: 100%;
  box-sizing: border-box;
}

/* Loading Overlay */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(
      900px 520px at 10% -10%,
      rgba($orange, 0.18),
      transparent 55%
    ),
    radial-gradient(
      700px 420px at 95% 10%,
      rgba($orange2, 0.12),
      transparent 55%
    ),
    linear-gradient(180deg, $bg, $bg2);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba($orange, 0.2);
  border-top-color: $orange;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  box-shadow: 0 0 20px rgba($orange, 0.3);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  color: $text;
  font-weight: 900;
  font-size: 16px;
  margin: 0;
  animation: pulse 1.5s ease-in-out infinite;

  @media (max-width: 768px) {
    font-size: 14px;
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

// Additional mobile app-like enhancements
@media (max-width: 768px) {
  // Smooth scrolling
  .dash,
  .jobs__list,
  main {
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
  }

  // Better text rendering on mobile
  * {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }

  // Disable text selection on buttons for better UX
  button,
  .btn,
  .tab,
  .toggle {
    -webkit-user-select: none;
    user-select: none;
    -webkit-touch-callout: none;
  }

  // Better focus states for accessibility
  button:focus-visible,
  .btn:focus-visible,
  input:focus-visible,
  select:focus-visible,
  textarea:focus-visible {
    outline: 2px solid rgba($orange, 0.6);
    outline-offset: 2px;
  }
}
</style>
