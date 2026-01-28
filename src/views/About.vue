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
          <div class="subtitle">הסיפור שלנו • איך זה עובד • למה אנחנו שונים</div>
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
        <button class="btn ghost" @click="scrollTo('about-trust')">
          אמינות
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
            מזמינים הנדימן עד הבית, רואים מיקום בזמן אמת ו-ETA מדויק, שולחים תמונות של
            התקלה, ויש צ׳אט מקצועי שמתקדם מהר. התשלום מאובטח ומשתחרר רק אחרי שהעבודה הושלמה לשביעות רצונך.
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
              <div class="stat-text">זיהוי עבודה חכם</div>
            </div>
            <div class="stat glass">
              <div class="stat-num">Secure</div>
              <div class="stat-text">תשלום מאובטח Stripe</div>
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
            <div class="f-title">💬 צ׳אט מקצועי</div>
            <div class="f-sub">נפתח אוטומטית אחרי קבלת עבודה</div>
          </div>
          <div class="floating glass f2">
            <div class="f-title">🔒 Stripe</div>
            <div class="f-sub">תשלום מאובטח ומשתחרר רק באישורך</div>
          </div>
        </div>
      </div>
    </section>

    <!-- EXPLAINER (with required id for quick scroll) -->
    <section id="about-explainer" class="section">
      <div class="section-head">
        <h2 class="section-title">איך זה עובד בפועל</h2>
        <p class="section-sub">
          4 שלבים פשוטים — מהבקשה הראשונית ועד שהכל מסודר בבית.
        </p>
      </div>

      <div class="timeline">
        <div class="step glass">
          <div class="step-num">1</div>
          <div class="step-body">
            <div class="step-title">תיאור הבעיה + AI</div>
            <div class="step-text">
              מתארים את הבעיה בטקסט חופשי, מוסיפים תמונות/סרטונים. ה-AI שלנו מזהה אוטומטית את סוג העבודה ומציע מחיר הוגן. אם לא נמצאה התאמה — הקריאה נפתחת להצעות מחיר.
            </div>
          </div>
        </div>

        <div class="step glass">
          <div class="step-num">2</div>
          <div class="step-body">
            <div class="step-title">מיקום ודחיפות</div>
            <div class="step-text">
              בוחרים כתובת (זיהוי אוטומטי או הזנה ידנית), רמת קושי, ואפשרות לסמן כקריאה דחופה. ההנדימנים באזור מקבלים התראה ומגיבים מהר.
            </div>
          </div>
        </div>

        <div class="step glass">
          <div class="step-num">3</div>
          <div class="step-body">
            <div class="step-title">הנדימן בדרך</div>
            <div class="step-text">
              רואים את ההנדימן על המפה בזמן אמת, מקבלים ETA מדויק, ויכולים לתקשר בצ׳אט מקצועי. הכל שקוף ונגיש.
            </div>
          </div>
        </div>

        <div class="step glass">
          <div class="step-num">4</div>
          <div class="step-body">
            <div class="step-title">סיום ותשלום</div>
            <div class="step-text">
              לאחר סיום העבודה, מאשרים את התוצאה ומשחררים את התשלום. הכסף מוחזק בטוחה ב-Stripe עד לאישור — כך כולם מוגנים.
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- TRUST & SCORE -->
    <section id="about-trust" class="section">
      <div class="section-head">
        <h2 class="section-title">מערכת אמינות חכמה</h2>
        <p class="section-sub">
          לכל הנדימן יש ציון פנימי שמבוסס על ביצועים אמיתיים — כדי שתקבלו תמיד שירות מקצועי ואמין.
        </p>
      </div>

      <div class="trust-grid">
        <div class="trust-card glass">
          <div class="trust-icon">📊</div>
          <h3 class="trust-title">ציון הנדימן</h3>
          <p class="trust-text">
            כל הנדימן מקבל ציון מ-0 עד 100 המבוסס על: אחוז השלמת עבודות (30%), הגעה בזמן (25%), דירוג לקוחות (25%), ומעט ביטולים (20%).
          </p>
        </div>

        <div class="trust-card glass">
          <div class="trust-icon">⏱️</div>
          <h3 class="trust-title">מעקב ETA</h3>
          <p class="trust-text">
            המערכת עוקבת אחר זמני ההגעה של ההנדימנים. איחורים נרשמים ומשפיעים על הציון — כך מבטיחים שירות אמין.
          </p>
        </div>

        <div class="trust-card glass">
          <div class="trust-icon">🎯</div>
          <h3 class="trust-title">שיבוץ חכם</h3>
          <p class="trust-text">
            הנדימנים עם ציון גבוה מקבלים עבודות קודם. הנדימנים החדשים מקבלים הזדמנות להוכיח את עצמם.
          </p>
        </div>

        <div class="trust-card glass">
          <div class="trust-icon">⭐</div>
          <h3 class="trust-title">דירוגים אמיתיים</h3>
          <p class="trust-text">
            רק לקוחות שקיבלו שירות בפועל יכולים לדרג. הדירוגים משפיעים ישירות על הציון ועל החשיפה.
          </p>
        </div>
      </div>
    </section>

    <!-- FEATURES / VIDEOS -->
    <section id="about-features" class="section">
      <div class="section-head">
        <h2 class="section-title">הפיצ׳רים שלנו</h2>
        <p class="section-sub">
          כל מה שצריך לחוויית שירות חלקה ומקצועית.
        </p>
      </div>

      <div class="features-grid">
        <article class="feature glass">
          <div class="feature-top">
            <h3 class="feature-title">זיהוי AI חכם</h3>
            <span class="pill-tag">Smart</span>
          </div>
          <p class="feature-text">
            מתארים את הבעיה בטקסט חופשי והמערכת מזהה אוטומטית את סוג העבודה, הקטגוריה והמחיר המומלץ.
          </p>
        </article>

        <article class="feature glass">
          <div class="feature-top">
            <h3 class="feature-title">מיקום בזמן אמת</h3>
            <span class="pill-tag">Live</span>
          </div>
          <p class="feature-text">
            עוקבים אחר ההנדימן על המפה, רואים ETA מדויק ויודעים בדיוק מתי הוא יגיע.
          </p>
        </article>

        <article class="feature glass">
          <div class="feature-top">
            <h3 class="feature-title">צ׳אט + הקלטה קולית</h3>
            <span class="pill-tag">Chat</span>
          </div>
          <p class="feature-text">
            צ׳אט מקצועי עם תמונות, הקלטות קוליות בסגנון WhatsApp — תקשורת מהירה ונוחה.
          </p>
        </article>

        <article class="feature glass">
          <div class="feature-top">
            <h3 class="feature-title">תשלום מאובטח</h3>
            <span class="pill-tag">Secure</span>
          </div>
          <p class="feature-text">
            התשלום נשמר בצורה מאובטחת ב-Stripe ומשתחרר רק לאחר אישור הלקוח — שקט נפשי לשני הצדדים.
          </p>
        </article>

        <article class="feature glass">
          <div class="feature-top">
            <h3 class="feature-title">בחירת הנדימן ספציפי</h3>
            <span class="pill-tag">Special</span>
          </div>
          <p class="feature-text">
            אפשר לבחור הנדימן מסוים שכבר הכרתם ולהזמין אותו ישירות לעבודה.
          </p>
        </article>

        <article class="feature glass">
          <div class="feature-top">
            <h3 class="feature-title">קריאה דחופה</h3>
            <span class="pill-tag">Urgent</span>
          </div>
          <p class="feature-text">
            סימון קריאה כדחופה מקדם אותה ברשימה ומבטיח תגובה מהירה יותר מההנדימנים.
          </p>
        </article>

        <article class="feature glass">
          <div class="feature-top">
            <h3 class="feature-title">עבודה לפי שעה</h3>
            <span class="pill-tag">Hourly</span>
          </div>
          <p class="feature-text">
            עבודות מסוימות מתומחרות לפי שעה. בסיום העבודה הלקוח מזין את מספר השעות והתשלום מחושב בהתאם.
          </p>
        </article>

        <article class="feature glass">
          <div class="feature-top">
            <h3 class="feature-title">הצעות מחיר</h3>
            <span class="pill-tag">Quote</span>
          </div>
          <p class="feature-text">
            כשה-AI לא מצליח לזהות את העבודה, ההנדימנים יכולים להגיש הצעות מחיר והלקוח בוחר.
          </p>
        </article>

        <article class="feature glass">
          <div class="feature-top">
            <h3 class="feature-title">דירוג ותגובות</h3>
            <span class="pill-tag">Trust</span>
          </div>
          <p class="feature-text">
            לאחר כל עבודה אפשר לדרג את ההנדימן ולכתוב תגובה — עוזר להנדימנים הטובים לבלוט.
          </p>
        </article>
      </div>
    </section>

    <!-- FAQ -->
    <section id="about-faq" class="section">
      <div class="section-head">
        <h2 class="section-title">שאלות נפוצות</h2>
        <p class="section-sub">תשובות קצרות וברורות לשאלות הנפוצות ביותר.</p>
      </div>

      <div class="faq">
        <details class="qa glass" open>
          <summary>מתי הכסף משתחרר להנדימן?</summary>
          <p>
            רק אחרי שההנדימן מסיים את העבודה <strong>ורק באישור הלקוח</strong> התשלום משתחרר. הכסף נשמר בצורה מאובטחת עד לאישור.
          </p>
        </details>

        <details class="qa glass">
          <summary>איך הצ׳אט עובד?</summary>
          <p>
            ברגע שהנדימן מקבל את העבודה, הצ׳אט נפתח אוטומטית. אפשר לשלוח הודעות, תמונות והקלטות קוליות — בדיוק כמו WhatsApp.
          </p>
        </details>

        <details class="qa glass">
          <summary>מה קורה אם ה-AI לא מצא התאמה?</summary>
          <p>
            הקריאה נפתחת להצעת מחיר. ההנדימנים באזור יכולים להגיש הצעות ואתם בוחרים את ההצעה המתאימה ביותר.
          </p>
        </details>

        <details class="qa glass">
          <summary>אפשר לבטל עבודה?</summary>
          <p>
            כן. יש אפשרות לבטל עבודה עם הסבר. ביטולים חוזרים משפיעים על הציון של המבטל.
          </p>
        </details>

        <details class="qa glass">
          <summary>מה זה ציון הנדימן?</summary>
          <p>
            ציון פנימי מ-0 עד 100 שמחושב על בסיס: אחוז השלמת עבודות, הגעה בזמן, דירוג לקוחות ומעט ביטולים. ציון גבוה = הנדימן אמין יותר.
          </p>
        </details>

        <details class="qa glass">
          <summary>איך עובד המעקב אחרי ההנדימן?</summary>
          <p>
            מהרגע שההנדימן יוצא לדרך, אפשר לראות אותו על המפה בזמן אמת עם ETA מדויק שמתעדכן לפי התנועה בפועל.
          </p>
        </details>

        <details class="qa glass">
          <summary>מה קורה אם ההנדימן מאחר?</summary>
          <p>
            המערכת עוקבת אחר זמני ההגעה. איחורים נרשמים ומשפיעים על ציון ההנדימן — כך מבטיחים שירות אמין לטווח הארוך.
          </p>
        </details>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer glass">
      <div class="foot-left">
        <div class="foot-title">Hendiman</div>
        <div class="foot-sub">שחור • כתום • אמינות • מקצועיות</div>
      </div>

      <div class="foot-right">
        <button class="btn ghost" @click="scrollTo('about-hero')">
          חזרה למעלה ↑
        </button>
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  name: "AboutView",
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
  font-family: 'Noto Sans Hebrew', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
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
  background: rgba(242, 127, 13, 0.18);
}
.o2 {
  width: 460px;
  height: 460px;
  right: -140px;
  top: 120px;
  background: rgba(242, 127, 13, 0.14);
}
.o3 {
  width: 640px;
  height: 640px;
  left: 20%;
  bottom: -280px;
  background: rgba(242, 127, 13, 0.12);
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
  padding: 12px 16px;
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
    rgba(242, 127, 13, 0.95),
    rgba(242, 127, 13, 0.45)
  );
  box-shadow: 0 20px 50px rgba(242, 127, 13, 0.18);
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
  padding: 10px 14px;
  border-radius: 14px;
  color: rgba(255, 255, 255, 0.92);
  transition: transform 160ms ease, background 160ms ease, border 160ms ease,
    box-shadow 160ms ease;
  user-select: none;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
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
  border-color: rgba(242, 127, 13, 0.2);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
}

.btn.primary {
  background: linear-gradient(
    135deg,
    rgba(242, 127, 13, 0.95),
    rgba(242, 127, 13, 0.55)
  );
  box-shadow: 0 22px 70px rgba(242, 127, 13, 0.18);
  font-weight: 800;
}
.btn.primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 26px 80px rgba(242, 127, 13, 0.24);
}

.btn.glassy {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.btn.glassy:hover {
  border-color: rgba(242, 127, 13, 0.22);
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
  padding: 10px 14px;
  border-radius: 999px;
  font-size: 12px;
  opacity: 0.9;
}
.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: rgba(242, 127, 13, 0.95);
  box-shadow: 0 0 0 6px rgba(242, 127, 13, 0.12);
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
    rgba(242, 127, 13, 0.95),
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
  padding: 12px 14px;
  border-radius: 16px;
}
.stat-num {
  font-weight: 900;
  color: rgba(242, 127, 13, 0.95);
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
      rgba(242, 127, 13, 0.2),
      transparent 50%
    ),
    radial-gradient(circle at 75% 70%, rgba(242, 127, 13, 0.14), transparent 55%),
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
  padding: 10px 12px;
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
  background: rgba(242, 127, 13, 0.95);
  box-shadow: 0 0 0 8px rgba(242, 127, 13, 0.15);
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
    rgba(242, 127, 13, 0),
    rgba(242, 127, 13, 0.95),
    rgba(242, 127, 13, 0)
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
  padding: 12px 14px;
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
  background: rgba(74, 222, 128, 0.16);
  border: 1px solid rgba(74, 222, 128, 0.25);
  color: #4ade80;
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
  padding: 10px 12px;
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
  background: rgba(242, 127, 13, 0.16);
  border: 1px solid rgba(242, 127, 13, 0.22);
}

.floating {
  position: absolute;
  right: 18px;
  padding: 10px 12px;
  border-radius: 16px;
  width: 220px;
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
  font-size: 13px;
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
  padding: 32px 0;
}
.section-head {
  width: min(1180px, calc(100% - 24px));
  margin: 0 auto 18px;
}
.section-title {
  font-weight: 1000;
  letter-spacing: -0.3px;
  margin: 0;
  font-size: 24px;
}
.section-sub {
  margin: 8px 0 0;
  opacity: 0.72;
  font-size: 14px;
  line-height: 1.6;
  max-width: 80ch;
}

/* Timeline */
.timeline {
  width: min(1180px, calc(100% - 24px));
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}
.step {
  border-radius: 18px;
  padding: 16px;
  display: flex;
  gap: 14px;
  transition: transform 180ms ease, border-color 180ms ease;
}
.step:hover {
  transform: translateY(-2px);
  border-color: rgba(242, 127, 13, 0.22);
}
.step-num {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-weight: 1000;
  font-size: 16px;
  color: rgba(242, 127, 13, 0.95);
  background: rgba(242, 127, 13, 0.14);
  border: 1px solid rgba(242, 127, 13, 0.22);
  flex: 0 0 auto;
}
.step-title {
  font-weight: 900;
  font-size: 14px;
}
.step-text {
  margin-top: 6px;
  font-size: 13px;
  opacity: 0.72;
  line-height: 1.6;
}

/* Trust Grid */
.trust-grid {
  width: min(1180px, calc(100% - 24px));
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}
.trust-card {
  border-radius: 18px;
  padding: 20px 16px;
  text-align: center;
  transition: transform 180ms ease, border-color 180ms ease;
}
.trust-card:hover {
  transform: translateY(-2px);
  border-color: rgba(242, 127, 13, 0.22);
}
.trust-icon {
  font-size: 32px;
  margin-bottom: 12px;
}
.trust-title {
  font-weight: 900;
  font-size: 15px;
  margin: 0 0 8px;
}
.trust-text {
  font-size: 12px;
  opacity: 0.72;
  line-height: 1.6;
  margin: 0;
}

/* Features grid */
.features-grid {
  width: min(1180px, calc(100% - 24px));
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}
.feature {
  border-radius: 18px;
  padding: 18px 16px;
  transition: transform 180ms ease, border-color 180ms ease;
}
.feature:hover {
  transform: translateY(-2px);
  border-color: rgba(242, 127, 13, 0.22);
}
.feature-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}
.feature-title {
  margin: 0;
  font-size: 15px;
  font-weight: 950;
}
.pill-tag {
  font-size: 11px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(242, 127, 13, 0.12);
  border: 1px solid rgba(242, 127, 13, 0.2);
  color: rgba(242, 127, 13, 0.95);
  opacity: 0.9;
}
.feature-text {
  margin: 10px 0 0;
  font-size: 13px;
  opacity: 0.72;
  line-height: 1.6;
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
  padding: 14px 16px;
}
.qa summary {
  cursor: pointer;
  font-weight: 900;
  font-size: 14px;
  list-style: none;
}
.qa summary::-webkit-details-marker {
  display: none;
}
.qa p {
  margin: 10px 0 0;
  font-size: 13px;
  opacity: 0.72;
  line-height: 1.6;
}

/* Footer */
.footer {
  width: min(1180px, calc(100% - 24px));
  margin: 24px auto 0;
  border-radius: 18px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  position: relative;
  z-index: 1;
}
.foot-title {
  font-weight: 1000;
  font-size: 16px;
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
  .trust-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .stats-row {
    grid-template-columns: 1fr;
  }
  .actions {
    display: none;
  }
}

@media (max-width: 600px) {
  .trust-grid {
    grid-template-columns: 1fr;
  }
}
</style>
