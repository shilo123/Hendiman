<template>
  <div class="about-page" dir="rtl">
    <!-- Ambient background -->
    <div class="bg-orbs" aria-hidden="true">
      <span class="orb o1"></span>
      <span class="orb o2"></span>
      <span class="orb o3"></span>
      <span class="grid"></span>
    </div>

    <!-- Top nav / quick scroll -->
    <header class="topbar glass">
      <div class="brand">
        <div class="logo">H</div>
        <div class="brand-text">
          <div class="title">Hendiman</div>
          <div class="subtitle">הסיפור שלנו • איך זה עובד • למה זה מטורף</div>
        </div>
      </div>

      <div class="actions">
        <button class="btn ghost" @click="scrollTo('about-hero')">התחלה</button>
        <button class="btn ghost" @click="scrollTo('about-explainer')">
          איך זה עובד
        </button>
        <button class="btn ghost" @click="scrollTo('about-features')">
          פיצ׳רים
        </button>
        <button class="btn ghost" @click="scrollTo('about-faq')">שאלות</button>
      </div>
    </header>

    <!-- HERO -->
    <section id="about-hero" class="hero">
      <div class="hero-inner">
        <div class="hero-left">
          <div class="kicker glass">
            <span class="dot"></span>
            כמו Gett — רק לבית שלך
          </div>

          <h1 class="hero-title">
            כשצריך לתקן משהו בבית —
            <span class="accent">מזמינים Hendiman</span>
          </h1>

          <p class="hero-desc">
            מזמינים הנדימן עד הבית, רואים מיקום בזמן אמת ו-ETA, שולחים תמונות של
            התקלה, ויש צ׳אט שמתקדם מהר ובצורה מקצועית.
          </p>

          <div class="hero-cta">
            <button class="btn primary" @click="scrollTo('about-explainer')">
              בוא תראה איך זה עובד
              <span class="arrow">→</span>
            </button>
            <button class="btn glassy" @click="scrollTo('about-features')">
              כל הפיצ׳רים
            </button>
          </div>

          <div class="stats-row">
            <div class="stat glass">
              <div class="stat-num">Live</div>
              <div class="stat-text">מיקום בזמן אמת</div>
            </div>
            <div class="stat glass">
              <div class="stat-num">AI</div>
              <div class="stat-text">זיהוי עבודה מפלט חופשי</div>
            </div>
            <div class="stat glass">
              <div class="stat-num">Secure</div>
              <div class="stat-text">שחרור תשלום רק באישור לקוח</div>
            </div>
          </div>
        </div>

        <div class="hero-right">
          <div class="phone glass">
            <div class="phone-top">
              <span class="pill"></span>
              <div class="dots"><span></span><span></span><span></span></div>
            </div>

            <div class="screen">
              <div class="map">
                <div class="map-badge glass">
                  <div class="badge-title">הנדימן בדרך</div>
                  <div class="badge-sub">ETA: 8 דקות • מרחק: 1.2 ק״מ</div>
                </div>

                <div class="pin p1"></div>
                <div class="pin p2"></div>

                <div class="route"></div>
              </div>

              <div class="card glass">
                <div class="card-row">
                  <div class="avatar"></div>
                  <div class="card-col">
                    <div class="card-title">דניאל — הנדימן</div>
                    <div class="card-sub">⭐ 4.9 • 312 עבודות</div>
                  </div>
                  <div class="tag">זמין</div>
                </div>

                <div class="chip-row">
                  <span class="chip">הרכבה</span>
                  <span class="chip">סתימה</span>
                  <span class="chip">תיקון</span>
                </div>

                <div class="divider"></div>

                <div class="mini-chat">
                  <div class="msg left glass">שלחתי תמונות, זו תקלה קטנה</div>
                  <div class="msg right">קיבלתי. מגיע עוד 8 דקות 👌</div>
                </div>
              </div>
            </div>
          </div>

          <div class="floating glass f1">
            <div class="f-title">צ׳אט מקצועי</div>
            <div class="f-sub">נפתח אוטומטית אחרי קבלת עבודה</div>
          </div>
          <div class="floating glass f2">
            <div class="f-title">Stripe</div>
            <div class="f-sub">תשלום מוחזק ומשתחרר רק באישור לקוח</div>
          </div>
        </div>
      </div>
    </section>

    <!-- EXPLAINER (with required id for quick scroll) -->
    <section id="about-explainer" class="section">
      <div class="section-head">
        <h2 class="section-title">איך זה עובד בפועל</h2>
        <p class="section-sub">
          4 שלבים פשוטים — מהפלט הקצר ועד שהכל מסודר בבית.
        </p>
      </div>

      <div class="timeline">
        <div class="step glass">
          <div class="step-num">1</div>
          <div class="step-body">
            <div class="step-title">פלט קצר + AI</div>
            <div class="step-text">
              המשתמש מקליד פלט קצר וה-AI מחפש אובייקט עבודה ומחיר. אם לא נמצא /
              לא מדויק — פותחים להצעת מחיר.
            </div>
          </div>
        </div>

        <div class="step glass">
          <div class="step-num">2</div>
          <div class="step-body">
            <div class="step-title">תיאור ומיקום</div>
            <div class="step-text">
              המשתמש מוסיף תיאור מלא ומיקום, כדי להתאים את ההנדימנים הנכונים.
            </div>
          </div>
        </div>

        <div class="step glass">
          <div class="step-num">3</div>
          <div class="step-body">
            <div class="step-title">תמונות/וידאו + קושי + דחוף</div>
            <div class="step-text">
              מוסיפים תמונות/סרטונים, בוחרים קלה/מורכבת/קשה, ואפשר לסמן קריאה
              דחופה (+10 שקלות).
            </div>
          </div>
        </div>

        <div class="step glass">
          <div class="step-num">4</div>
          <div class="step-body">
            <div class="step-title">תשלום ואישור שחרור</div>
            <div class="step-text">
              התשלום נגבה באמצעות Stripe ומוחזק במערכת. רק אחרי סיום עבודה
              ואישור הלקוח — התשלום משתחרר להנדימן.
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FEATURES / VIDEOS -->
    <section id="about-features" class="section">
      <div class="section-head">
        <h2 class="section-title">מה רואים בתוך האפליקקה</h2>
        <p class="section-sub">
          הסברים טקסטואליים + סרטון לכל נושא (מוכן לשים את הקישורים שלך).
        </p>
      </div>

      <div class="features-grid">
        <article class="feature glass">
          <div class="feature-top">
            <h3 class="feature-title">איך יוצרים קריאה</h3>
            <span class="pill-tag">Step-by-step</span>
          </div>
          <p class="feature-text">
            יצירת קריאה בארבעה שלבים: פלט קצר (AI), תיאור ומיקום, מדיה וקושי,
            תשלום.
          </p>

          <div class="video-wrap">
            <video
              class="video"
              controls
              preload="metadata"
              :poster="posters.create"
            >
              <source src="" type="video/mp4" />
              הדפדפן לא תומך בוידאו.
            </video>
            <div class="video-hint">הדבק כאן קישור/קובץ mp4</div>
          </div>
        </article>

        <article class="feature glass">
          <div class="feature-top">
            <h3 class="feature-title">בחירת הנדימן ספציפי</h3>
            <span class="pill-tag">Special</span>
          </div>
          <p class="feature-text">
            אפשר לבחור הנדימן ספציפי (ספיישל) ואז מוצג הנדימן אחד בלבד לקריאה.
          </p>

          <div class="video-wrap">
            <video
              class="video"
              controls
              preload="metadata"
              :poster="posters.pickOne"
            >
              <source src="" type="video/mp4" />
              הדפדפן לא תומך בוידאו.
            </video>
            <div class="video-hint">הדבק כאן קישור/קובץ mp4</div>
          </div>
        </article>

        <article class="feature glass">
          <div class="feature-top">
            <h3 class="feature-title">בחירת הצעת מחיר</h3>
            <span class="pill-tag">Quote</span>
          </div>
          <p class="feature-text">
            אם ה-AI לא מצא התאמה לקטגוריות/מחיר — הקריאה נפתחת להצעת מחיר מצד
            ההנדימן.
          </p>

          <div class="video-wrap">
            <video
              class="video"
              controls
              preload="metadata"
              :poster="posters.quote"
            >
              <source src="" type="video/mp4" />
              הדפדפן לא תומך בוידאו.
            </video>
            <div class="video-hint">הדבק כאן קישור/קובץ mp4</div>
          </div>
        </article>

        <article class="feature glass">
          <div class="feature-top">
            <h3 class="feature-title">חסימה</h3>
            <span class="pill-tag">Safety</span>
          </div>
          <p class="feature-text">
            ניתן לחסום משתמשים שמפרים את תנאי השימוש (ניהול מערכת).
          </p>

          <div class="video-wrap">
            <video
              class="video"
              controls
              preload="metadata"
              :poster="posters.block"
            >
              <source src="" type="video/mp4" />
              הדפדפן לא תומך בוידאו.
            </video>
            <div class="video-hint">הדבק כאן קישור/קובץ mp4</div>
          </div>
        </article>

        <article class="feature glass">
          <div class="feature-top">
            <h3 class="feature-title">דירוג ותגובות</h3>
            <span class="pill-tag">Trust</span>
          </div>
          <p class="feature-text">
            לאחר סיום עבודה ניתן לדרג את ההנדימן ולכתוב תגובה.
          </p>

          <div class="video-wrap">
            <video
              class="video"
              controls
              preload="metadata"
              :poster="posters.rating"
            >
              <source src="" type="video/mp4" />
              הדפדפן לא תומך בוידאו.
            </video>
            <div class="video-hint">הדבק כאן קישור/קובץ mp4</div>
          </div>
        </article>

        <article class="feature glass">
          <div class="feature-top">
            <h3 class="feature-title">קריאה דחופה</h3>
            <span class="pill-tag">Boost</span>
          </div>
          <p class="feature-text">
            המשתמש יכול לסמן קריאה דחופה בעלות 10 שקלות כדי שתוצג מעל קריאות
            אחרות.
          </p>

          <div class="video-wrap">
            <video
              class="video"
              controls
              preload="metadata"
              :poster="posters.urgent"
            >
              <source src="" type="video/mp4" />
              הדפדפן לא תומך בוידאו.
            </video>
            <div class="video-hint">הדבק כאן קישור/קובץ mp4</div>
          </div>
        </article>
      </div>
    </section>

    <!-- FAQ -->
    <section id="about-faq" class="section">
      <div class="section-head">
        <h2 class="section-title">שאלות נפוצות</h2>
        <p class="section-sub">בלי חפירות — תשובות קצרות וברורות.</p>
      </div>

      <div class="faq">
        <details class="qa glass" open>
          <summary>מתי הכסף משתחרר להנדימן?</summary>
          <p>
            רק אחרי שההנדימן מסיים את העבודה ורק באישור הלקוח התשלום משתחרר.
          </p>
        </details>

        <details class="qa glass">
          <summary>איך נפתח הצ׳אט?</summary>
          <p>
            ברגע שהנדימן מקבל את העבודה — הצ׳אט נפתח אוטומטית בין הלקוח להנדימן.
          </p>
        </details>

        <details class="qa glass">
          <summary>מה קורה אם ה-AI לא מצא התאמה?</summary>
          <p>הקריאה נפתחת להצעת מחיר על ידי ההנדימן.</p>
        </details>

        <details class="qa glass">
          <summary>אפשר לבטל עבודה?</summary>
          <p>
            כן. בביטול יש אפשרות טקסט חופשי, וההנהלה מחליטה האם לגבות קנס עד 200
            שקלות.
          </p>
        </details>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer glass">
      <div class="foot-left">
        <div class="foot-title">Hendiman</div>
        <div class="foot-sub">שחור • כתום • אפור • חד • נקי</div>
      </div>

      <div class="foot-right">
        <button class="btn ghost" @click="scrollTo('about-hero')">
          חזרה למעלה
        </button>
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  name: "AboutView",
  data() {
    return {
      posters: {
        create:
          "data:image/svg+xml;charset=UTF-8," +
          encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675">
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stop-color="#0b0b10"/>
                  <stop offset="1" stop-color="#1a1a24"/>
                </linearGradient>
              </defs>
              <rect width="1200" height="675" fill="url(#g)"/>
              <circle cx="220" cy="180" r="120" fill="rgba(255,140,0,0.22)"/>
              <circle cx="980" cy="520" r="180" fill="rgba(255,140,0,0.14)"/>
              <text x="70" y="370" font-size="58" fill="rgba(255,255,255,0.92)" font-family="Arial">איך יוצרים קריאה</text>
              <text x="70" y="430" font-size="28" fill="rgba(255,255,255,0.62)" font-family="Arial">וידאו דמו • MP4</text>
            </svg>
          `),
        pickOne:
          "data:image/svg+xml;charset=UTF-8," +
          encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675">
              <rect width="1200" height="675" fill="#0b0b10"/>
              <rect x="0" y="0" width="1200" height="675" fill="rgba(255,140,0,0.10)"/>
              <text x="70" y="370" font-size="58" fill="rgba(255,255,255,0.92)" font-family="Arial">בחירת הנדימן ספציפי</text>
              <text x="70" y="430" font-size="28" fill="rgba(255,255,255,0.62)" font-family="Arial">וידאו דמו • MP4</text>
            </svg>
          `),
        quote:
          "data:image/svg+xml;charset=UTF-8," +
          encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675">
              <defs>
                <radialGradient id="r" cx="30%" cy="30%" r="80%">
                  <stop offset="0" stop-color="rgba(255,140,0,0.25)"/>
                  <stop offset="1" stop-color="#0b0b10"/>
                </radialGradient>
              </defs>
              <rect width="1200" height="675" fill="url(#r)"/>
              <text x="70" y="370" font-size="58" fill="rgba(255,255,255,0.92)" font-family="Arial">בחירת הצעת מחיר</text>
              <text x="70" y="430" font-size="28" fill="rgba(255,255,255,0.62)" font-family="Arial">וידאו דמו • MP4</text>
            </svg>
          `),
        block:
          "data:image/svg+xml;charset=UTF-8," +
          encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675">
              <rect width="1200" height="675" fill="#0b0b10"/>
              <circle cx="600" cy="340" r="230" fill="rgba(255,140,0,0.16)"/>
              <text x="70" y="370" font-size="58" fill="rgba(255,255,255,0.92)" font-family="Arial">חסימה</text>
              <text x="70" y="430" font-size="28" fill="rgba(255,255,255,0.62)" font-family="Arial">וידאו דמו • MP4</text>
            </svg>
          `),
        rating:
          "data:image/svg+xml;charset=UTF-8," +
          encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675">
              <rect width="1200" height="675" fill="#0b0b10"/>
              <text x="70" y="370" font-size="58" fill="rgba(255,255,255,0.92)" font-family="Arial">דירוג ותגובות</text>
              <text x="70" y="430" font-size="28" fill="rgba(255,255,255,0.62)" font-family="Arial">וידאו דמו • MP4</text>
              <text x="70" y="500" font-size="40" fill="rgba(255,140,0,0.95)" font-family="Arial">★★★★★</text>
            </svg>
          `),
        urgent:
          "data:image/svg+xml;charset=UTF-8," +
          encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675">
              <defs>
                <linearGradient id="g2" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stop-color="#0b0b10"/>
                  <stop offset="1" stop-color="rgba(255,140,0,0.18)"/>
                </linearGradient>
              </defs>
              <rect width="1200" height="675" fill="url(#g2)"/>
              <text x="70" y="370" font-size="58" fill="rgba(255,255,255,0.92)" font-family="Arial">קריאה דחופה</text>
              <text x="70" y="430" font-size="28" fill="rgba(255,255,255,0.62)" font-family="Arial">וידאו דמו • MP4</text>
            </svg>
          `),
      },
    };
  },
  methods: {
    scrollTo(id) {
      const el = document.getElementById(id);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    },
  },
};
</script>

<style scoped>
/* ============ Theme ============ */
.about-page {
  min-height: 100vh;
  color: rgba(255, 255, 255, 0.92);
  background: #07070b;
  position: relative;
  overflow-x: hidden;
  padding-bottom: 30px;
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
}

/* Background orbs + grid */
.bg-orbs {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}
.orb {
  position: absolute;
  filter: blur(60px);
  border-radius: 999px;
  opacity: 0.9;
  transform: translateZ(0);
}
.o1 {
  width: 520px;
  height: 520px;
  left: -120px;
  top: -140px;
  background: rgba(255, 140, 0, 0.18);
}
.o2 {
  width: 460px;
  height: 460px;
  right: -140px;
  top: 120px;
  background: rgba(255, 140, 0, 0.14);
}
.o3 {
  width: 640px;
  height: 640px;
  left: 20%;
  bottom: -280px;
  background: rgba(255, 140, 0, 0.12);
}
.grid {
  position: absolute;
  inset: 0;
  opacity: 0.18;
  background-image: linear-gradient(
      rgba(255, 255, 255, 0.06) 1px,
      transparent 1px
    ),
    linear-gradient(90deg, rgba(255, 255, 255, 0.06) 1px, transparent 1px);
  background-size: 42px 42px;
  mask-image: radial-gradient(
    circle at 50% 30%,
    rgba(0, 0, 0, 1),
    rgba(0, 0, 0, 0)
  );
}

/* Glass utility */
.glass {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

/* Top bar */
.topbar {
  position: sticky;
  top: 10px;
  margin: 14px auto 0;
  width: min(1180px, calc(100% - 24px));
  z-index: 10;
  border-radius: 18px;
  padding: 12px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}
.logo {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-weight: 900;
  letter-spacing: 0.5px;
  background: linear-gradient(
    135deg,
    rgba(255, 140, 0, 0.95),
    rgba(255, 140, 0, 0.35)
  );
  box-shadow: 0 20px 50px rgba(255, 140, 0, 0.18);
}
.brand-text .title {
  font-weight: 800;
  font-size: 16px;
}
.brand-text .subtitle {
  font-size: 12px;
  opacity: 0.7;
  margin-top: 2px;
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

/* Buttons */
.btn {
  border: 0;
  outline: none;
  cursor: pointer;
  padding: 10px 12px;
  border-radius: 14px;
  color: rgba(255, 255, 255, 0.92);
  transition: transform 160ms ease, background 160ms ease, border 160ms ease,
    box-shadow 160ms ease;
  user-select: none;
}
.btn:active {
  transform: translateY(1px) scale(0.99);
}

.btn.ghost {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.btn.ghost:hover {
  background: rgba(255, 255, 255, 0.07);
  border-color: rgba(255, 140, 0, 0.2);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
}

.btn.primary {
  background: linear-gradient(
    135deg,
    rgba(255, 140, 0, 0.95),
    rgba(255, 140, 0, 0.45)
  );
  box-shadow: 0 22px 70px rgba(255, 140, 0, 0.18);
  font-weight: 800;
}
.btn.primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 26px 80px rgba(255, 140, 0, 0.24);
}

.btn.glassy {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.btn.glassy:hover {
  border-color: rgba(255, 140, 0, 0.22);
  transform: translateY(-1px);
}

.arrow {
  margin-right: 8px;
  opacity: 0.95;
}

/* Hero */
.hero {
  position: relative;
  z-index: 1;
  padding: 46px 0 26px;
}
.hero-inner {
  width: min(1180px, calc(100% - 24px));
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 22px;
  align-items: center;
}
.kicker {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 999px;
  font-size: 12px;
  opacity: 0.9;
}
.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: rgba(255, 140, 0, 0.95);
  box-shadow: 0 0 0 6px rgba(255, 140, 0, 0.12);
}

.hero-title {
  font-size: clamp(30px, 4vw, 52px);
  line-height: 1.05;
  margin: 14px 0 10px;
  font-weight: 900;
  letter-spacing: -0.6px;
}
.accent {
  background: linear-gradient(
    135deg,
    rgba(255, 140, 0, 0.95),
    rgba(255, 255, 255, 0.88)
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.hero-desc {
  font-size: 14px;
  opacity: 0.78;
  max-width: 58ch;
  line-height: 1.65;
}
.hero-cta {
  display: flex;
  gap: 10px;
  margin-top: 16px;
  flex-wrap: wrap;
}
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 16px;
}
.stat {
  padding: 12px 12px;
  border-radius: 16px;
}
.stat-num {
  font-weight: 900;
  color: rgba(255, 140, 0, 0.95);
  font-size: 16px;
}
.stat-text {
  font-size: 12px;
  opacity: 0.72;
  margin-top: 4px;
}

/* Phone mock */
.phone {
  border-radius: 26px;
  padding: 12px;
  position: relative;
  overflow: hidden;
}
.phone-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 6px 10px;
}
.pill {
  width: 120px;
  height: 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
}
.dots {
  display: flex;
  gap: 6px;
  opacity: 0.65;
}
.dots span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
}

.screen {
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.32);
}
.map {
  position: relative;
  height: 210px;
  background: radial-gradient(
      circle at 30% 30%,
      rgba(255, 140, 0, 0.2),
      transparent 50%
    ),
    radial-gradient(circle at 75% 70%, rgba(255, 140, 0, 0.14), transparent 55%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(0, 0, 0, 0));
  overflow: hidden;
}
.map::after {
  content: "";
  position: absolute;
  inset: 0;
  background-image: linear-gradient(
      rgba(255, 255, 255, 0.06) 1px,
      transparent 1px
    ),
    linear-gradient(90deg, rgba(255, 255, 255, 0.06) 1px, transparent 1px);
  background-size: 28px 28px;
  opacity: 0.28;
  mask-image: radial-gradient(
    circle at 55% 40%,
    rgba(0, 0, 0, 1),
    rgba(0, 0, 0, 0)
  );
}
.map-badge {
  position: absolute;
  right: 12px;
  top: 12px;
  border-radius: 14px;
  padding: 10px 10px;
}
.badge-title {
  font-weight: 900;
  font-size: 12px;
}
.badge-sub {
  font-size: 11px;
  opacity: 0.75;
  margin-top: 2px;
}

.pin {
  position: absolute;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: rgba(255, 140, 0, 0.95);
  box-shadow: 0 0 0 8px rgba(255, 140, 0, 0.15);
  z-index: 2;
  animation: pulse 1.9s ease-in-out infinite;
}
.p1 {
  left: 22%;
  top: 58%;
}
.p2 {
  left: 68%;
  top: 34%;
  animation-delay: 0.35s;
}

.route {
  position: absolute;
  left: 28%;
  top: 52%;
  width: 260px;
  height: 2px;
  background: linear-gradient(
    90deg,
    rgba(255, 140, 0, 0),
    rgba(255, 140, 0, 0.95),
    rgba(255, 140, 0, 0)
  );
  transform: rotate(-18deg);
  opacity: 0.85;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.95;
  }
  50% {
    transform: scale(1.12);
    opacity: 0.75;
  }
}

.card {
  padding: 12px 12px;
}
.card-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.card-col {
  flex: 1;
  min-width: 0;
}
.card-title {
  font-weight: 900;
  font-size: 13px;
}
.card-sub {
  font-size: 11px;
  opacity: 0.7;
  margin-top: 2px;
}

.tag {
  font-size: 11px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 140, 0, 0.16);
  border: 1px solid rgba(255, 140, 0, 0.25);
}

.chip-row {
  display: flex;
  gap: 6px;
  margin-top: 10px;
  flex-wrap: wrap;
}
.chip {
  font-size: 11px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  opacity: 0.9;
}
.divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 10px 0;
}

.mini-chat {
  display: grid;
  gap: 8px;
}
.msg {
  font-size: 12px;
  padding: 10px 10px;
  border-radius: 14px;
  line-height: 1.35;
}
.msg.left {
  justify-self: start;
  max-width: 78%;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.msg.right {
  justify-self: end;
  max-width: 78%;
  background: rgba(255, 140, 0, 0.16);
  border: 1px solid rgba(255, 140, 0, 0.22);
}

.floating {
  position: absolute;
  right: 18px;
  padding: 10px 10px;
  border-radius: 16px;
  width: 210px;
  z-index: 2;
  animation: floaty 4.4s ease-in-out infinite;
}
.f1 {
  top: 82px;
  transform: translateX(10px);
}
.f2 {
  bottom: 26px;
  transform: translateX(-4px);
  animation-delay: 0.7s;
}
.f-title {
  font-weight: 900;
  font-size: 12px;
}
.f-sub {
  font-size: 11px;
  opacity: 0.72;
  margin-top: 3px;
}
@keyframes floaty {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

/* Sections */
.section {
  position: relative;
  z-index: 1;
  padding: 28px 0;
}
.section-head {
  width: min(1180px, calc(100% - 24px));
  margin: 0 auto 14px;
}
.section-title {
  font-weight: 1000;
  letter-spacing: -0.3px;
  margin: 0;
  font-size: 22px;
}
.section-sub {
  margin: 8px 0 0;
  opacity: 0.72;
  font-size: 13px;
  line-height: 1.6;
  max-width: 80ch;
}

/* Timeline */
.timeline {
  width: min(1180px, calc(100% - 24px));
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.step {
  border-radius: 18px;
  padding: 14px 14px;
  display: flex;
  gap: 12px;
  transition: transform 180ms ease, border-color 180ms ease;
}
.step:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 140, 0, 0.22);
}
.step-num {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-weight: 1000;
  color: rgba(255, 140, 0, 0.95);
  background: rgba(255, 140, 0, 0.14);
  border: 1px solid rgba(255, 140, 0, 0.22);
  flex: 0 0 auto;
}
.step-title {
  font-weight: 900;
  font-size: 13px;
}
.step-text {
  margin-top: 6px;
  font-size: 12px;
  opacity: 0.72;
  line-height: 1.6;
}

/* Features grid */
.features-grid {
  width: min(1180px, calc(100% - 24px));
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.feature {
  border-radius: 18px;
  padding: 14px 14px;
  transition: transform 180ms ease, border-color 180ms ease;
}
.feature:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 140, 0, 0.22);
}
.feature-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}
.feature-title {
  margin: 0;
  font-size: 14px;
  font-weight: 950;
}
.pill-tag {
  font-size: 11px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  opacity: 0.9;
}
.feature-text {
  margin: 10px 0 12px;
  font-size: 12px;
  opacity: 0.72;
  line-height: 1.6;
}

/* Video */
.video-wrap {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.25);
}
.video {
  width: 100%;
  display: block;
  aspect-ratio: 16 / 9;
  background: rgba(0, 0, 0, 0.25);
}
.video-hint {
  position: absolute;
  left: 10px;
  bottom: 10px;
  font-size: 11px;
  padding: 8px 10px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.1);
  opacity: 0.85;
}

/* FAQ */
.faq {
  width: min(1180px, calc(100% - 24px));
  margin: 0 auto;
  display: grid;
  gap: 10px;
}
.qa {
  border-radius: 18px;
  padding: 12px 14px;
}
.qa summary {
  cursor: pointer;
  font-weight: 900;
  font-size: 13px;
  list-style: none;
}
.qa summary::-webkit-details-marker {
  display: none;
}
.qa p {
  margin: 10px 0 0;
  font-size: 12px;
  opacity: 0.72;
  line-height: 1.6;
}

/* Footer */
.footer {
  width: min(1180px, calc(100% - 24px));
  margin: 18px auto 0;
  border-radius: 18px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  position: relative;
  z-index: 1;
}
.foot-title {
  font-weight: 1000;
}
.foot-sub {
  opacity: 0.7;
  font-size: 12px;
  margin-top: 2px;
}

/* Responsive */
@media (max-width: 980px) {
  .hero-inner {
    grid-template-columns: 1fr;
  }
  .floating {
    display: none;
  }
  .timeline {
    grid-template-columns: 1fr;
  }
  .features-grid {
    grid-template-columns: 1fr;
  }
  .stats-row {
    grid-template-columns: 1fr;
  }
  .actions {
    display: none;
  }
}
</style>
