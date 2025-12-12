<template>
  <div class="dashboard" dir="rtl">
    <!-- TOP BAR -->
    <header class="topbar">
      <div class="topbar__left">
        <div class="brand">
          <img class="brand__img" :src="brandImg" alt="HENDIMAN" />
          <div class="brand__text">
            <div class="brand__title">HENDIMAN</div>
            <div class="brand__subtitle">כתום · שחור · עבודה נקייה</div>
          </div>
        </div>
      </div>

      <div class="topbar__center">
        <div class="pill">
          <span class="pill__label">שם:</span>
          <span class="pill__value">{{ user.fullName }}</span>
        </div>
        <div class="pill">
          <span class="pill__label">טלפון:</span>
          <span class="pill__value">{{ user.phone }}</span>
        </div>
      </div>

      <div class="topbar__right">
        <div class="stats">
          <div class="stat">
            <div class="stat__k">מחוברים עכשיו</div>
            <div class="stat__v">{{ live.online }}</div>
          </div>
          <div class="stat">
            <div class="stat__k">הנדימנים</div>
            <div class="stat__v">{{ live.handymen }}</div>
          </div>
          <div class="stat">
            <div class="stat__k">לקוחות</div>
            <div class="stat__v">{{ live.clients }}</div>
          </div>
        </div>

        <div class="icons">
          <button class="iconBtn" title="התראות">🔔</button>
          <button class="iconBtn" title="צ׳אט" @click="toggleChat()">💬</button>
          <button class="iconBtn" title="פרופיל">👤</button>
        </div>
      </div>
    </header>

    <!-- HERO -->
    <section class="hero">
      <div class="hero__card">
        <div class="hero__content">
          <h1 class="hero__title">
            {{
              isHendiman ? "ברוך הבא! בוא נביא עבודה 💪" : "מה צריך לתקן היום?"
            }}
          </h1>

          <p class="hero__desc">
            {{
              isHendiman
                ? "הפעל מצב פעיל כדי להופיע ללקוחות באזור שלך"
                : "תיאור קצר · תמונות · זמן הגעה — ואתה מסודר"
            }}
          </p>

          <div class="hero__actions">
            <template v-if="!isHendiman">
              <button class="btn btn--primary">+ פתח הזמנה</button>
              <button class="btn btn--ghost">קטגוריות שירות</button>
            </template>

            <template v-else>
              <div class="availability">
                <span class="availability__label">מקבל עבודות:</span>
                <label class="toggle">
                  <input type="checkbox" v-model="isAvailable" />
                  <span class="toggle__track"></span>
                </label>
                <span class="availability__state" :class="{ on: isAvailable }">
                  {{ isAvailable ? "פעיל" : "כבוי" }}
                </span>
              </div>
              <button class="btn btn--primary">רענן הצעות</button>
            </template>
          </div>
        </div>

        <div class="hero__aside">
          <div class="miniCard">
            <div class="miniCard__t">סטטוס</div>
            <div class="miniCard__v">
              {{
                isHendiman
                  ? isAvailable
                    ? "מופיע ללקוחות"
                    : "לא מופיע"
                  : "מוכן להזמין"
              }}
            </div>
          </div>

          <div class="miniCard">
            <div class="miniCard__t">
              {{ isHendiman ? "היום" : "הזמנות פעילות" }}
            </div>
            <div class="miniCard__v">
              {{ isHendiman ? "2 עבודות" : "1 הזמנה" }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CONTENT: RTL אבל מבנה מפורש -->
    <main class="content">
      <!-- LEFT COLUMN - פרופיל + סטטיסטיקות -->
      <aside class="panel panel--stats">
        <div class="profile">
          <div class="profile__avatar">{{ userInitial }}</div>
          <div class="profile__info">
            <div class="profile__name">{{ user.fullName }}</div>
            <div class="profile__sub">{{ user.city }}</div>
          </div>
          <button class="btn btn--ghost btn--sm">עריכת פרופיל</button>
        </div>

        <div class="kpis">
          <div class="kpi">
            <div class="kpi__k">⭐ דירוג</div>
            <div class="kpi__v">{{ isHendiman ? "4.8" : "—" }}</div>
            <div class="kpi__s">
              {{ isHendiman ? "מבוסס 124 ביקורות" : "רק להנדימן" }}
            </div>
          </div>

          <div class="kpi">
            <div class="kpi__k">🧰 עבודות החודש</div>
            <div class="kpi__v">{{ isHendiman ? "18" : "3" }}</div>
            <div class="kpi__s">
              {{ isHendiman ? "קצב טוב 👌" : "היסטוריית הזמנות" }}
            </div>
          </div>

          <div class="kpi">
            <div class="kpi__k">💬 צ׳אטים פתוחים</div>
            <div class="kpi__v">{{ chat.unread }}</div>
            <div class="kpi__s">לחץ לפתיחה בפינה</div>
          </div>
        </div>

        <div class="quick">
          <div class="quick__title">קיצורי דרך</div>
          <div class="quick__grid">
            <button class="quickBtn">היסטוריה</button>
            <button class="quickBtn">תשלומים</button>
            <button class="quickBtn">התראות</button>
            <button class="quickBtn">הגדרות</button>
          </div>
        </div>
      </aside>

      <!-- RIGHT COLUMN - עבודות חדשות לידך -->
      <section class="panel panel--jobs">
        <div class="panel__head">
          <h2 class="panel__title">
            {{ isHendiman ? "עבודות חדשות לידך" : "הזמנות חדשות מומלצות" }}
          </h2>
          <div class="panel__tools">
            <button class="chip">הכי קרוב</button>
            <button class="chip chip--muted">הכי חדש</button>
          </div>
        </div>

        <div class="jobs">
          <div class="jobCard" v-for="job in sampleJobs" :key="job.id">
            <div class="jobCard__top">
              <span class="badge">{{ job.category }}</span>
              <span class="jobCard__price">₪ {{ job.price }}</span>
            </div>

            <div class="jobCard__title">{{ job.title }}</div>
            <div class="jobCard__meta">
              <span>📍 {{ job.city }}</span>
              <span>🕒 {{ job.time }}</span>
            </div>

            <div class="jobCard__desc">{{ job.desc }}</div>

            <div class="jobCard__actions" v-if="isHendiman">
              <button class="btn btn--primary btn--sm">קבל</button>
              <button
                class="btn btn--ghost btn--sm"
                @click="openJobChat(job.id)"
              >
                💬 צ׳אט
              </button>
              <button class="btn btn--ghost btn--sm">דלג</button>
            </div>

            <div class="jobCard__actions" v-else>
              <button class="btn btn--primary btn--sm">פתח כמו זה</button>
              <button
                class="btn btn--ghost btn--sm"
                @click="openJobChat(job.id)"
              >
                💬 צ׳אט
              </button>
              <button class="btn btn--ghost btn--sm">שמור</button>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- GENERAL CHAT PANEL -->
    <section class="panel panel--general-chat">
      <div class="panel__head">
        <h2 class="panel__title">💬 צ׳אט כללי - הנדימן</h2>
        <button class="btn btn--ghost btn--sm" @click="toggleGeneralChat()">
          {{ generalChat.open ? "הסתר" : "הצג" }}
        </button>
      </div>

      <div v-if="generalChat.open" class="general-chat__body">
        <div class="general-chat__messages">
          <div
            class="msg msg--general"
            v-for="(msg, idx) in generalChat.messages"
            :key="idx"
          >
            <div class="msg__author">{{ msg.author }}</div>
            <div class="msg__bubble">{{ msg.text }}</div>
            <div class="msg__time">{{ msg.time }}</div>
          </div>
        </div>

        <div class="general-chat__input">
          <input
            type="text"
            v-model="generalChat.newMessage"
            placeholder="כתוב הודעה לצ׳אט הכללי..."
            @keyup.enter="sendGeneralMessage"
          />
          <button class="sendBtn" @click="sendGeneralMessage">שלח</button>
        </div>
      </div>
    </section>

    <!-- CHAT CUBE (floating) -->
    <div class="chatCube" :class="{ open: chat.open }">
      <button class="chatCube__fab" @click="toggleChat()">
        <span class="chatCube__fabIcon">💬</span>
        <span class="chatCube__fabText">צ׳אט</span>
        <span v-if="chat.unread > 0" class="chatCube__dot">{{
          chat.unread
        }}</span>
      </button>

      <div v-if="chat.open" class="chatCube__box">
        <div class="chatCube__head">
          <div class="chatCube__title">צ׳אט מהיר</div>
          <button class="chatCube__close" @click="toggleChat()">✕</button>
        </div>

        <div class="chatCube__body">
          <div class="msg msg--them">
            <div class="msg__bubble">אחי אפשר תמונה של התקלה?</div>
            <div class="msg__time">12:41</div>
          </div>
          <div class="msg msg--me">
            <div class="msg__bubble">כן שולח עכשיו</div>
            <div class="msg__time">12:42</div>
          </div>
        </div>

        <div class="chatCube__input">
          <input type="text" placeholder="כתוב הודעה..." />
          <button class="sendBtn">שלח</button>
        </div>
      </div>
    </div>

    <!-- JOB-SPECIFIC CHAT MODALS -->
    <div
      v-for="[jobId, jobChat] in openJobChats"
      :key="jobId"
      class="job-chat-modal"
    >
      <div class="job-chat-modal__overlay" @click="closeJobChat(jobId)"></div>
      <div class="job-chat-modal__box">
        <div class="job-chat-modal__head">
          <div class="job-chat-modal__title">
            💬 צ׳אט - {{ getJobTitle(Number(jobId)) }}
          </div>
          <button class="job-chat-modal__close" @click="closeJobChat(jobId)">
            ✕
          </button>
        </div>

        <div class="job-chat-modal__body">
          <div
            class="msg msg--job"
            v-for="(msg, idx) in jobChat.messages"
            :key="idx"
          >
            <div class="msg__author">{{ msg.author }}</div>
            <div class="msg__bubble">{{ msg.text }}</div>
            <div class="msg__time">{{ msg.time }}</div>
          </div>
          <div v-if="jobChat.messages.length === 0" class="job-chat-empty">
            אין הודעות עדיין. התחל את השיחה!
          </div>
        </div>

        <div class="job-chat-modal__input">
          <input
            type="text"
            v-model="jobChat.newMessage"
            placeholder="כתוב הודעה..."
            @keyup.enter="sendJobMessage(Number(jobId), jobChat.newMessage)"
          />
          <button
            class="sendBtn"
            @click="sendJobMessage(Number(jobId), jobChat.newMessage)"
          >
            שלח
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "DashboardView",
  data() {
    return {
      // מגיע מה-DB
      isHendiman: true,
      isAvailable: true,

      user: {
        fullName: "עומר כהן",
        phone: "052-123-4567",
        city: "תל אביב",
      },

      // דמה - תחבר ל-API לייב
      live: {
        online: 128,
        handymen: 42,
        clients: 86,
      },

      chat: {
        open: false,
        unread: 3,
      },

      generalChat: {
        open: true,
        newMessage: "",
        messages: [
          {
            author: "דני הנדימן",
            text: "מישהו יודע איפה אפשר לקנות חלקי חילוף לאינסטלציה?",
            time: "14:30",
          },
          {
            author: "שרה הנדימנית",
            text: "יש לי מקום מעולה ברמת גן, אשלח לך",
            time: "14:32",
          },
          {
            author: "מיכאל הנדימן",
            text: "גם אני רוצה את הפרטים",
            time: "14:35",
          },
          {
            author: "רון הנדימן",
            text: "מה מחיר טיפוסי לתיקון שקע חשמלי?",
            time: "14:40",
          },
          {
            author: "יעל הנדימנית",
            text: "תלוי במיקום ובמורכבות, אבל בדרך כלל 150-250",
            time: "14:42",
          },
          {
            author: "עומר הנדימן",
            text: "יש למישהו המלצות על כלי עבודה טובים?",
            time: "14:45",
          },
        ],
      },

      jobChats: {}, // { jobId: { open: false, messages: [], newMessage: '' } }

      sampleJobs: [
        {
          id: 1,
          category: "אינסטלציה",
          title: "נזילה מתחת לכיור",
          city: "רמת גן",
          time: "היום 18:30",
          price: 220,
          desc: "נראה שיש נזילה בסיפון. יש גישה נוחה.",
        },
        {
          id: 2,
          category: "חשמל",
          title: "שקע לא עובד בסלון",
          city: "גבעתיים",
          time: "מחר 10:00",
          price: 180,
          desc: "שקע אחד הפסיק לעבוד. שאר הבית תקין.",
        },
        {
          id: 3,
          category: "הרכבות",
          title: "הרכבת שידת איקאה",
          city: "תל אביב",
          time: "מחר 20:00",
          price: 150,
          desc: "דגם MALM, כל החלקים קיימים, צריך הרכבה נקייה.",
        },
      ],
    };
  },
  computed: {
    brandImg() {
      // הנתיב שנתת - שים את הקובץ תחת public/hendiman123/...
      return "https://hendiman-pic-logo.s3.amazonaws.com/logo-1765542586785-115108108.png";
    },
    userInitial() {
      return (this.user.fullName || "H").trim().charAt(0);
    },
    openJobChats() {
      // מחזיר מערך של [jobId, jobChat] רק עבור צ'אטים פתוחים
      return Object.entries(this.jobChats).filter(
        ([, jobChat]) => jobChat.open
      );
    },
  },
  methods: {
    toggleChat() {
      this.chat.open = !this.chat.open;
      if (this.chat.open) this.chat.unread = 0;
    },
    toggleGeneralChat() {
      this.generalChat.open = !this.generalChat.open;
    },
    sendGeneralMessage() {
      if (!this.generalChat.newMessage.trim()) return;

      this.generalChat.messages.push({
        author: this.user.fullName,
        text: this.generalChat.newMessage,
        time: new Date().toLocaleTimeString("he-IL", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });

      this.generalChat.newMessage = "";
    },
    openJobChat(jobId) {
      // פתיחת צ'אט ספציפי להזמנה עם נתוני דמו
      if (!this.jobChats[jobId]) {
        const job = this.sampleJobs.find((j) => j.id === jobId);
        const isHendiman = this.isHendiman;

        // נתוני דמו לצ'אט
        const mockMessages = isHendiman
          ? [
              {
                author: "לקוח",
                text: `שלום, אני מעוניין בעבודה: ${job ? job.title : "הזמנה"}`,
                time: "12:30",
              },
              {
                author: this.user.fullName,
                text: "שלום, אני מעוניין לקבל את העבודה. אפשר פרטים נוספים?",
                time: "12:35",
              },
            ]
          : [
              {
                author: "הנדימן",
                text: `שלום, אני מעוניין בעבודה: ${job ? job.title : "הזמנה"}`,
                time: "12:30",
              },
              {
                author: this.user.fullName,
                text: "שלום, יש לי שאלות לגבי העבודה. אפשר תמונה?",
                time: "12:35",
              },
            ];

        this.$set(this.jobChats, jobId, {
          open: true,
          messages: mockMessages,
          newMessage: "",
        });
      } else {
        this.jobChats[jobId].open = true;
      }
    },
    closeJobChat(jobId) {
      if (this.jobChats[jobId]) {
        this.jobChats[jobId].open = false;
      }
    },
    sendJobMessage(jobId, message) {
      if (!message.trim() || !this.jobChats[jobId]) return;

      if (!this.jobChats[jobId].messages) {
        this.$set(this.jobChats[jobId], "messages", []);
      }

      this.jobChats[jobId].messages.push({
        author: this.user.fullName,
        text: message,
        time: new Date().toLocaleTimeString("he-IL", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });

      // נקה את השדה
      this.jobChats[jobId].newMessage = "";
    },
    getJobTitle(jobId) {
      const job = this.sampleJobs.find((j) => j.id === jobId);
      return job ? job.title : "הזמנה";
    },
  },
};
</script>

<style lang="scss" scoped>
$bg: #0b0b0d;
$panel: #121216;
$panel2: #16161d;
$line: rgba(255, 255, 255, 0.08);
$text: rgba(255, 255, 255, 0.92);
$muted: rgba(255, 255, 255, 0.6);
$muted2: rgba(255, 255, 255, 0.42);
$orange: #ff8c00;
$orange2: rgba(255, 140, 0, 0.16);
body {
  background-color: $line;
}
.dashboard {
  background: radial-gradient(
      1200px 600px at 20% 0%,
      $orange2 0%,
      transparent 55%
    ),
    radial-gradient(
      900px 500px at 90% 10%,
      rgba(255, 255, 255, 0.06) 0%,
      transparent 50%
    ),
    $bg;
  min-height: 100vh;
  color: $text;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
}

/* TOP BAR */
.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: grid;
  grid-template-columns: 1.2fr 1.2fr 1.6fr;
  gap: 12px;
  align-items: center;
  padding: 14px 18px;
  background: rgba(12, 12, 15, 0.75);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid $line;

  &__left,
  &__center,
  &__right {
    display: flex;
    align-items: center;
  }
  &__center {
    justify-content: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  &__right {
    justify-content: flex-start;
    gap: 12px;
  }
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;

  &__img {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    object-fit: cover;
    border: 1px solid $line;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  }

  &__title {
    font-weight: 900;
    letter-spacing: 1px;
    color: $orange;
    line-height: 1;
  }

  &__subtitle {
    color: $muted2;
    font-size: 12px;
    margin-top: 2px;
  }
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid $line;

  &__label {
    color: $muted2;
    font-size: 12px;
  }
  &__value {
    color: $text;
    font-size: 13px;
    font-weight: 700;
  }
}

.stats {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;

  .stat {
    padding: 8px 10px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid $line;
    min-width: 92px;

    &__k {
      font-size: 11px;
      color: $muted2;
    }
    &__v {
      font-size: 16px;
      font-weight: 900;
      color: $text;
    }
  }
}

.icons {
  display: flex;
  gap: 8px;
}

.iconBtn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid $line;
  color: $text;
  cursor: pointer;
  transition: transform 0.12s ease, border-color 0.12s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: rgba(255, 140, 0, 0.35);
  }
}

/* HERO */
.hero {
  padding: 18px;

  &__card {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    padding: 18px;
    border-radius: 18px;
    background: linear-gradient(
        180deg,
        rgba(255, 140, 0, 0.1) 0%,
        rgba(255, 255, 255, 0.02) 55%
      ),
      $panel;
    border: 1px solid $line;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
  }

  &__title {
    margin: 0 0 6px;
    font-size: 22px;
  }
  &__desc {
    margin: 0 0 14px;
    color: $muted;
  }

  &__actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;
  }

  &__aside {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    justify-content: flex-start;
    width: 100%;
  }
}

.miniCard {
  flex: 1;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid $line;
  border-radius: 16px;
  padding: 16px 18px;
  min-width: 300px;

  &__t {
    color: $muted2;
    font-size: 12px;
  }
  &__v {
    margin-top: 8px;
    font-weight: 900;
    font-size: 16px;
  }
}

/* BUTTONS */
.btn {
  border: 1px solid $line;
  background: rgba(255, 255, 255, 0.03);
  color: $text;
  border-radius: 14px;
  padding: 10px 14px;
  cursor: pointer;
  transition: transform 0.12s ease, border-color 0.12s ease,
    background 0.12s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: rgba(255, 140, 0, 0.35);
  }

  &--primary {
    background: linear-gradient(
      180deg,
      rgba(255, 140, 0, 0.95) 0%,
      rgba(255, 140, 0, 0.78) 100%
    );
    border-color: rgba(255, 140, 0, 0.55);
    color: #0b0b0d;
    font-weight: 900;
  }

  &--ghost {
    background: transparent;
    border-color: rgba(255, 140, 0, 0.25);
    color: $orange;
    font-weight: 800;
  }

  &--sm {
    padding: 8px 10px;
    border-radius: 12px;
    font-size: 13px;
  }
}

/* TOGGLE */
.availability {
  display: inline-flex;
  align-items: center;
  gap: 10px;

  &__label {
    color: $muted2;
    font-size: 13px;
  }
  &__state {
    font-weight: 900;
    color: $muted2;
    &.on {
      color: $orange;
    }
  }
}

.toggle {
  display: inline-flex;
  align-items: center;

  input {
    display: none;
  }

  .toggle__track {
    width: 56px;
    height: 30px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid $line;
    position: relative;
    cursor: pointer;

    &:after {
      content: "";
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.92);
      position: absolute;
      top: 2px;
      right: 2px; /* RTL friendly */
      transition: transform 0.18s ease, background 0.18s ease;
    }
  }

  input:checked + .toggle__track {
    background: rgba(255, 140, 0, 0.35);
    border-color: rgba(255, 140, 0, 0.45);

    &:after {
      transform: translateX(-26px); /* moves to left */
      background: #0b0b0d;
    }
  }
}

/* CONTENT LAYOUT
   - dir rtl, אבל אנחנו מכריחים: jobs בשמאל, stats בימין */
.content {
  display: grid;
  grid-template-columns: 1fr 1.35fr; /* RIGHT first (stats), LEFT second (jobs) visually in RTL */
  gap: 14px;
  padding: 0 18px 90px;

  .panel {
    background: $panel2;
    border: 1px solid $line;
    border-radius: 18px;
    padding: 16px;
    box-shadow: 0 18px 44px rgba(0, 0, 0, 0.28);

    &__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 12px;
    }

    &__title {
      margin: 0;
      font-size: 16px;
      font-weight: 900;
    }
    &__tools {
      display: flex;
      gap: 8px;
    }
  }

  /* IMPORTANT: force positions */
  .panel--stats {
    grid-column: 1;
  } /* right side */
  .panel--jobs {
    grid-column: 2;
  } /* left side */
}

.chip {
  padding: 7px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 140, 0, 0.25);
  background: rgba(255, 140, 0, 0.08);
  color: $orange;
  cursor: pointer;
  font-weight: 800;
  font-size: 12px;

  &--muted {
    border-color: $line;
    background: rgba(255, 255, 255, 0.03);
    color: $muted;
  }
}

/* JOBS */
.jobs {
  display: grid;
  gap: 10px;
}

.jobCard {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid $line;
  border-radius: 16px;
  padding: 12px;
  transition: transform 0.12s ease, border-color 0.12s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: rgba(255, 140, 0, 0.35);
  }

  &__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  &__price {
    font-weight: 900;
    color: $orange;
  }

  &__title {
    font-weight: 900;
    margin-bottom: 6px;
  }

  &__meta {
    display: flex;
    gap: 10px;
    color: $muted2;
    font-size: 12px;
    margin-bottom: 8px;
    flex-wrap: wrap;
  }

  &__desc {
    color: $muted;
    font-size: 13px;
    line-height: 1.45;
    margin-bottom: 10px;
  }

  &__actions {
    display: flex;
    gap: 8px;
  }
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 140, 0, 0.12);
  border: 1px solid rgba(255, 140, 0, 0.25);
  color: $orange;
  font-weight: 900;
  font-size: 12px;
}

/* STATS PANEL */
.profile {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid $line;
  border-radius: 16px;
  padding: 12px;
  margin-bottom: 12px;

  &__avatar {
    width: 44px;
    height: 44px;
    border-radius: 16px;
    background: linear-gradient(
      180deg,
      rgba(255, 140, 0, 0.92) 0%,
      rgba(255, 140, 0, 0.65) 100%
    );
    color: #0b0b0d;
    display: grid;
    place-items: center;
    font-weight: 900;
    font-size: 18px;
  }

  &__name {
    font-weight: 900;
  }
  &__sub {
    color: $muted2;
    font-size: 12px;
    margin-top: 2px;
  }
}

.kpis {
  display: grid;
  gap: 10px;
  margin-bottom: 12px;
}

.kpi {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid $line;
  border-radius: 16px;
  padding: 12px;

  &__k {
    color: $muted2;
    font-size: 12px;
  }
  &__v {
    margin-top: 6px;
    font-weight: 900;
    font-size: 20px;
    color: $text;
  }
  &__s {
    margin-top: 4px;
    color: $muted;
    font-size: 12px;
  }
}

.quick {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid $line;
  border-radius: 16px;
  padding: 12px;

  &__title {
    font-weight: 900;
    margin-bottom: 10px;
  }
  &__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
}

.quickBtn {
  padding: 10px 10px;
  border-radius: 14px;
  border: 1px solid $line;
  background: rgba(0, 0, 0, 0.12);
  color: $text;
  cursor: pointer;
  transition: transform 0.12s ease, border-color 0.12s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: rgba(255, 140, 0, 0.35);
  }
}

/* CHAT CUBE */
.chatCube {
  position: fixed;
  bottom: 16px;
  left: 16px; /* פינה */
  z-index: 30;

  &__fab {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    border-radius: 18px;
    border: 1px solid rgba(255, 140, 0, 0.35);
    background: rgba(255, 140, 0, 0.12);
    color: $text;
    cursor: pointer;
    box-shadow: 0 20px 55px rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(10px);
  }

  &__fabIcon {
    font-size: 18px;
  }
  &__fabText {
    font-weight: 900;
  }

  &__dot {
    position: absolute;
    top: -8px;
    left: -8px;
    width: 22px;
    height: 22px;
    border-radius: 999px;
    background: $orange;
    color: #0b0b0d;
    display: grid;
    place-items: center;
    font-size: 12px;
    font-weight: 900;
    border: 1px solid rgba(0, 0, 0, 0.25);
  }

  &__box {
    width: 320px;
    margin-top: 10px;
    border-radius: 18px;
    border: 1px solid $line;
    background: rgba(14, 14, 18, 0.92);
    backdrop-filter: blur(12px);
    box-shadow: 0 24px 70px rgba(0, 0, 0, 0.55);
    overflow: hidden;
  }

  &__head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 12px;
    border-bottom: 1px solid $line;
  }

  &__title {
    font-weight: 900;
    color: $orange;
  }
  &__close {
    border: 1px solid $line;
    background: rgba(255, 255, 255, 0.03);
    color: $text;
    border-radius: 12px;
    width: 34px;
    height: 34px;
    cursor: pointer;
  }

  &__body {
    padding: 12px;
    height: 190px;
    overflow: auto;
    display: grid;
    gap: 10px;
  }

  &__input {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;
    padding: 10px;
    border-top: 1px solid $line;

    input {
      border-radius: 14px;
      border: 1px solid $line;
      background: rgba(255, 255, 255, 0.03);
      color: $text;
      padding: 10px 12px;
      outline: none;
    }
  }
}

.msg {
  display: grid;
  gap: 4px;

  &__bubble {
    padding: 10px 12px;
    border-radius: 16px;
    border: 1px solid $line;
    max-width: 85%;
    line-height: 1.35;
  }

  &__time {
    color: $muted2;
    font-size: 11px;
  }

  &--them .msg__bubble {
    background: rgba(255, 255, 255, 0.03);
    justify-self: start;
  }

  &--me .msg__bubble {
    background: rgba(255, 140, 0, 0.12);
    border-color: rgba(255, 140, 0, 0.22);
    justify-self: end;
  }

  &--me .msg__time {
    justify-self: end;
  }
}

.sendBtn {
  border-radius: 14px;
  border: 1px solid rgba(255, 140, 0, 0.45);
  background: rgba(255, 140, 0, 0.85);
  color: #0b0b0d;
  font-weight: 900;
  padding: 10px 12px;
  cursor: pointer;
}

/* GENERAL CHAT PANEL */
.panel--general-chat {
  margin: 0 18px 90px;
  background: $panel2;
  border: 1px solid $line;
  border-radius: 18px;
  padding: 16px;
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.28);
}

.general-chat__body {
  margin-top: 12px;
}

.general-chat__messages {
  max-height: 350px;
  overflow-y: auto;
  margin-bottom: 12px;
  display: grid;
  gap: 10px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  border: 1px solid $line;
}

.msg--general {
  display: grid;
  gap: 4px;

  .msg__author {
    font-size: 11px;
    color: $muted2;
    font-weight: 700;
  }
}

.general-chat__input {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;

  input {
    border-radius: 14px;
    border: 1px solid $line;
    background: rgba(255, 255, 255, 0.03);
    color: $text;
    padding: 10px 12px;
    outline: none;
  }
}

/* JOB CHAT MODAL */
.job-chat-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  display: grid;
  place-items: center;

  &__overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(4px);
  }

  &__box {
    position: relative;
    width: 90%;
    max-width: 500px;
    max-height: 80vh;
    background: $panel2;
    border: 1px solid $line;
    border-radius: 18px;
    box-shadow: 0 24px 70px rgba(0, 0, 0, 0.55);
    display: grid;
    grid-template-rows: auto 1fr auto;
    overflow: hidden;
  }

  &__head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid $line;
  }

  &__title {
    font-weight: 900;
    color: $orange;
  }

  &__close {
    border: 1px solid $line;
    background: rgba(255, 255, 255, 0.03);
    color: $text;
    border-radius: 12px;
    width: 34px;
    height: 34px;
    cursor: pointer;
  }

  &__body {
    padding: 12px;
    overflow-y: auto;
    display: grid;
    gap: 10px;
    min-height: 200px;
    max-height: 400px;
  }

  &__input {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;
    padding: 12px;
    border-top: 1px solid $line;

    input {
      border-radius: 14px;
      border: 1px solid $line;
      background: rgba(255, 255, 255, 0.03);
      color: $text;
      padding: 10px 12px;
      outline: none;
    }
  }
}

.msg--job {
  display: grid;
  gap: 4px;

  .msg__author {
    font-size: 11px;
    color: $muted2;
    font-weight: 700;
  }
}

.job-chat-empty {
  text-align: center;
  color: $muted2;
  padding: 40px 20px;
  font-size: 14px;
}

/* RESPONSIVE */
@media (max-width: 980px) {
  .topbar {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .topbar__center {
    justify-content: flex-start;
  }
  .hero__card {
    grid-template-columns: 1fr;
  }
  .content {
    grid-template-columns: 1fr;
    .panel--stats {
      grid-column: auto;
    }
    .panel--jobs {
      grid-column: auto;
    }
  }
}
</style>
