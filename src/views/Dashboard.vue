<template>
  <div class="dash" dir="rtl">
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
                    v-for="t in statusTabs"
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
          <article v-for="job in filteredJobs" :key="job.id" class="job">
            <div class="job__top">
              <div class="tags">
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

              <button class="iconBtn" type="button" @click="onOpenJobMenu(job)">
                ⋯
              </button>
            </div>

            <div class="job__main">
              <div class="job__titleRow">
                <h3 class="job__title">{{ job.subcategoryName }}</h3>
                <div class="price">{{ job.price }} <span>שקלות</span></div>
              </div>

              <p class="job__desc">{{ job.description }}</p>

              <div class="metaGrid">
                <div class="meta">
                  <span class="meta__k">👤 שם מזמין</span>
                  <b class="meta__v">{{ job.clientName }}</b>
                </div>

                <div class="meta" v-if="job.handymanName">
                  <span class="meta__k">🧑‍🔧 שם מקבל</span>
                  <b class="meta__v">{{ job.handymanName }}</b>
                </div>

                <div class="meta">
                  <span class="meta__k">📍 מיקום</span>
                  <b class="meta__v">{{ job.locationText }}</b>
                </div>

                <div class="meta">
                  <span class="meta__k">🧭 מרחק</span>
                  <b class="meta__v">{{ job.distanceKm }} ק״מ</b>
                </div>

                <div class="meta">
                  <span class="meta__k">⏱️ זמן</span>
                  <b class="meta__v">{{ job.whenLabel }}</b>
                </div>
              </div>
            </div>

            <div class="job__actions">
              <button
                class="btn btn--ghost"
                type="button"
                @click="onOpenJobChat(job)"
              >
                💬 צ׳אט עבודה
              </button>
              <button
                class="btn btn--ghost"
                type="button"
                @click="onOpenUserChat(job.clientId)"
              >
                🗣️ צ׳אט עם המזמין
              </button>
              <button
                v-if="job.handymanId"
                class="btn btn--ghost"
                type="button"
                @click="onOpenUserChat(job.handymanId)"
              >
                🧑‍🔧 צ׳אט עם המקבל
              </button>

              <div class="spacer"></div>

              <template v-if="isHendiman">
                <button
                  class="btn btn--ghost"
                  type="button"
                  @click="onSkip(job)"
                >
                  דלג
                </button>
                <button
                  class="btn btn--primary"
                  type="button"
                  :disabled="job.status !== 'open'"
                  @click="onAccept(job)"
                >
                  קבל
                </button>
              </template>

              <template v-else>
                <button
                  class="btn btn--primary"
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
        <!-- CLIENT: create call + handyman search -->
        <section v-if="!isHendiman" class="panel">
          <div class="panel__head">
            <h2 class="h2">צור קריאה</h2>
            <p class="sub">
              בחר תת־קטגוריה, תיאור, מיקום וזמן. ברירת מחדל: כמה שיותר מהר.
            </p>
          </div>

          <div class="cta">
            <button class="cta__btn" type="button" @click="onCreateCallCta">
              <span class="cta__spark">⚡</span>
              <span class="cta__txt">צור קריאה</span>
              <span class="cta__arrow">→</span>
            </button>

            <div class="field">
              <label class="label">תת־קטגוריה</label>
              <select class="select" v-model="call.subId" @change="onSubChange">
                <option disabled value="">בחר תת־קטגוריה…</option>
                <option v-for="s in subcategories" :key="s.id" :value="s.id">
                  {{ s.name }}
                </option>
              </select>
            </div>

            <div class="preview" v-if="selectedSub">
              <div class="preview__row">
                <span>מחיר</span>
                <b>{{ selectedSub.price }} שקלות</b>
              </div>
              <div class="preview__row">
                <span>סוג עבודה</span>
                <b>{{
                  selectedSub.billingType === "hourly" ? "לשעה" : "קבלנות"
                }}</b>
              </div>
              <div class="apiNote">* מגיע מקובץ ה-API שלך</div>
            </div>

            <div class="field">
              <label class="label">תיאור</label>
              <textarea
                class="textarea"
                v-model="call.desc"
                rows="4"
                placeholder="תאר בקצרה מה הבעיה…"
              ></textarea>
            </div>

            <div class="field">
              <label class="label">מיקום</label>
              <input
                class="input"
                v-model="call.location"
                type="text"
                placeholder="עיר, רחוב, מספר…"
              />
            </div>

            <div class="field">
              <label class="label">זמן הגעה</label>
              <select class="select" v-model="call.when">
                <option value="asap">כמה שיותר מהר</option>
                <option value="today">היום</option>
                <option value="tomorrow">מחר</option>
                <option value="pick">בחר זמן</option>
              </select>
            </div>

            <div class="row">
              <button
                class="toggle"
                :class="{ 'toggle--on': call.urgent }"
                type="button"
                @click="onToggleUrgent"
              >
                🚨 קריאה דחופה
              </button>

              <div class="fine">
                <span class="fine__icon">⚠️</span>
                <span>קנס על ביטול: <b>250 שקלות</b></span>
              </div>
            </div>

            <button
              class="btn btn--primary btn--full"
              type="button"
              @click="onSubmitCall"
            >
              שלח קריאה
            </button>
          </div>

          <div class="divider"></div>

          <div class="panel__head">
            <h2 class="h2">הזמנה אישית</h2>
            <p class="sub">חיפוש לפי שם + פילטר דירוג/מספר עבודות</p>
          </div>

          <div class="dir">
            <div class="dir__filters">
              <div class="field">
                <label class="label">חפש הנדימן</label>
                <input
                  class="input"
                  v-model="dirFilters.q"
                  type="text"
                  placeholder="לדוגמה: דני"
                />
              </div>

              <div class="row row--2">
                <div class="field">
                  <label class="label">מינימום דירוג</label>
                  <select class="select" v-model.number="dirFilters.minRating">
                    <option :value="0">הכל</option>
                    <option :value="3">3+</option>
                    <option :value="4">4+</option>
                    <option :value="4.5">4.5+</option>
                  </select>
                </div>

                <div class="field">
                  <label class="label">מינימום עבודות</label>
                  <select class="select" v-model.number="dirFilters.minJobs">
                    <option :value="0">הכל</option>
                    <option :value="10">10+</option>
                    <option :value="50">50+</option>
                    <option :value="100">100+</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="dir__list">
              <div v-for="h in filteredHandymen" :key="h.id" class="hcard">
                <div class="hcard__left">
                  <img class="hcard__av" :src="h.avatarUrl" alt="handyman" />
                  <div class="hcard__meta">
                    <div class="hcard__name">{{ h.name }}</div>
                    <div class="hcard__sub">
                      ⭐ {{ h.rating }} · {{ h.jobsDone }} עבודות
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
                    class="mini mini--danger"
                    type="button"
                    @click="onBlockHandyman(h.id)"
                  >
                    חסום
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
                <span class="badgeLine__k">תחומי התמחות</span>
                <div class="badgeLine__v">
                  <span
                    class="chip"
                    v-for="subcat in me.specialties"
                    :key="subcat"
                  >
                    {{ subcat }}
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
export default {
  name: "DashboardView",
  data() {
    return {
      // will come from server
      isHendiman: false,

      isAvailable: true,

      stats: { clients: 128, handymen: 42, users: 170 },

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
        { label: "פתוחות", value: "open", count: 6 },
        { label: "שובצו", value: "assigned", count: 2 },
        { label: "בדרך", value: "on_the_way", count: 1 },
        { label: "בביצוע", value: "in_progress", count: 1 },
        { label: "הושלמו", value: "done", count: 9 },
        { label: "בוטלו", value: "cancelled", count: 1 },
      ],
      activeStatus: "open",

      handymanFilters: { maxKm: 10 },

      subcategories: [
        { id: "sc1", name: "פתיחת סתימה", price: 250, billingType: "fixed" },
        { id: "sc2", name: "החלפת ברז", price: 300, billingType: "fixed" },
        { id: "sc3", name: "הרכבת ארון", price: 180, billingType: "hourly" },
        { id: "sc4", name: "החלפת שקע", price: 220, billingType: "fixed" },
      ],

      call: { subId: "", desc: "", location: "", when: "asap", urgent: false },

      dirFilters: { q: "", minRating: 0, minJobs: 0 },

      jobs: [
        {
          id: "j1",
          clientId: "c1",
          clientName: "דניאל כהן",
          handymanId: null,
          handymanName: "",
          status: "open",
          categoryName: "אינסטלציה",
          subcategoryName: "פתיחת סתימה",
          price: 250,
          billingType: "fixed",
          description: "סתימה בכיור מטבח, מים עולים מהר",
          locationText: "ת״א, אבן גבירול 10",
          distanceKm: 3,
          whenLabel: "כמה שיותר מהר",
          isUrgent: true,
        },
        {
          id: "j2",
          clientId: "c2",
          clientName: "רוני לוי",
          handymanId: "h3",
          handymanName: "מוטי הנדימן",
          status: "assigned",
          categoryName: "הרכבות",
          subcategoryName: "הרכבת ארון",
          price: 180,
          billingType: "hourly",
          description: "ארון איקאה 2 דלתות + יישור דלתות",
          locationText: "ר״ג, ביאליק 3",
          distanceKm: 8,
          whenLabel: "היום",
          isUrgent: false,
        },
        {
          id: "j3",
          clientId: "c3",
          clientName: "אורית",
          handymanId: "h2",
          handymanName: "אלירן",
          status: "in_progress",
          categoryName: "חשמל",
          subcategoryName: "החלפת שקע",
          price: 220,
          billingType: "fixed",
          description: "שקע רופף בסלון, צריך להחליף",
          locationText: "חולון, סוקולוב 22",
          distanceKm: 6,
          whenLabel: "מחר",
          isUrgent: false,
        },
      ],

      handymen: [
        {
          id: "h1",
          name: "דני",
          rating: 4.8,
          jobsDone: 132,
          avatarUrl:
            "https://images.unsplash.com/photo-1520975682031-ae1f0f3bd7c1?w=160&h=160&fit=crop",
        },
        {
          id: "h2",
          name: "אלירן",
          rating: 4.4,
          jobsDone: 57,
          avatarUrl:
            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&h=160&fit=crop",
        },
        {
          id: "h3",
          name: "מוטי הנדימן",
          rating: 4.9,
          jobsDone: 210,
          avatarUrl:
            "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=160&h=160&fit=crop",
        },
      ],
    };
  },

  computed: {
    selectedSub() {
      return this.subcategories.find((x) => x.id === this.call.subId) || null;
    },

    filteredJobs() {
      let list = [...this.jobs];

      if (this.isHendiman) {
        list = list.filter((j) => j.status === this.activeStatus);
        list = list.filter((j) => j.distanceKm <= this.handymanFilters.maxKm);
      }

      return list;
    },

    filteredHandymen() {
      let list = [...this.handymen];

      if (this.dirFilters.q) {
        const q = this.dirFilters.q.toLowerCase();
        list = list.filter((h) => h.name.toLowerCase().includes(q));
      }
      if (this.dirFilters.minRating) {
        list = list.filter((h) => h.rating >= this.dirFilters.minRating);
      }
      if (this.dirFilters.minJobs) {
        list = list.filter((h) => h.jobsDone >= this.dirFilters.minJobs);
      }

      return list;
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
      console.log("create call cta");
    },

    onSubChange() {
      console.log("subcategory changed", this.call.subId);
    },

    onToggleUrgent() {
      console.log("toggle urgent");
      this.call.urgent = !this.call.urgent;
    },

    onSubmitCall() {
      console.log("submit call", this.call, "selectedSub", this.selectedSub);
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
  min-height: 100%;
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
}

/* TOP */
.top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.kpi {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;

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
  }

  &__label {
    font-size: 12px;
    font-weight: 900;
    color: $muted;
    transition: color 0.25s ease;
    position: relative;
    z-index: 1;
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
}

.top__chats {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
  margin-left: 70px;
}

.top__right {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
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
}

/* JOBS */
.jobs {
  border-radius: $r2;
  border: 1px solid $stroke;
  background: linear-gradient(180deg, $card2, rgba(255, 255, 255, 0.04));
  box-shadow: $shadow;
  overflow: hidden;

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
  }
}

.h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 1000;
}

.sub {
  margin: 4px 0 0;
  color: $muted;
  font-weight: 800;
  font-size: 12.5px;
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

  &__card {
    border-radius: $r;
    border: 1px solid rgba($orange, 0.18);
    background: rgba($orange, 0.08);
    padding: 12px;
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
  }

  &__count {
    font-size: 12px;
    font-weight: 1000;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.16);
    background: rgba(0, 0, 0, 0.25);
    white-space: nowrap;
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
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
}

.job {
  border-radius: $r2;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: radial-gradient(
      700px 260px at 20% 0%,
      rgba($orange, 0.1),
      transparent 60%
    ),
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.07),
      rgba(255, 255, 255, 0.04)
    );
  box-shadow: $shadow;
  overflow: hidden;
  transition: transform 140ms ease, box-shadow 140ms ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: $shadow, $shadowO;
  }

  &__top {
    padding: 12px 12px 0;
    display: flex;
    justify-content: space-between;
    align-items: start;
    gap: 10px;
  }

  &__main {
    padding: 10px 12px 12px;
  }

  &__actions {
    padding: 12px;
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(0, 0, 0, 0.2);
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
}

.price {
  font-weight: 1200;
  color: $orange3;
  font-size: 14px;

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
}

.metaGrid {
  margin-top: 10px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
}

.meta {
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.22);
  padding: 10px;

  &__k {
    display: block;
    font-size: 12px;
    font-weight: 900;
    color: rgba(255, 255, 255, 0.62);
    margin-bottom: 4px;
  }

  &__v {
    font-size: 12.5px;
    font-weight: 1000;
    color: rgba(255, 255, 255, 0.9);
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
}

.panel__head {
  margin-bottom: 10px;
}

.cta {
  border-radius: $r2;
  border: 1px solid rgba($orange, 0.18);
  background: rgba(0, 0, 0, 0.22);
  padding: 12px;
}

.cta__btn {
  width: 100%;
  border: none;
  cursor: pointer;
  border-radius: 22px;
  padding: 14px 14px;
  color: #111;
  font-weight: 1200;
  background: linear-gradient(135deg, $orange, $orange2);
  box-shadow: $shadowO;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: transform 140ms ease, box-shadow 140ms ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: $shadowO, 0 22px 50px rgba($orange, 0.18);
  }

  &:active {
    transform: translateY(0) scale(0.99);
  }

  &:focus {
    @include focusRing;
  }
}

.cta__spark,
.cta__arrow {
  width: 34px;
  height: 34px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.18);
  border: 1px solid rgba(0, 0, 0, 0.18);
  color: #111;
}

.cta__txt {
  font-size: 14px;
}

/* form controls */
.input,
.select,
.textarea {
  width: 100%;
  border-radius: 16px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  padding: 12px 12px;
  font-weight: 900;

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
}

.dir__list {
  margin-top: 12px;
  display: grid;
  gap: 10px;
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
  }

  &__name {
    font-weight: 1100;
  }

  &__sub {
    margin-top: 2px;
    color: rgba(255, 255, 255, 0.62);
    font-weight: 900;
    font-size: 12px;
  }

  &__actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
}

.chip {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 8px 10px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba($orange, 0.1);
  font-weight: 1000;
  font-size: 12px;
  color: $text;
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
}
</style>
