<template>
  <div class="landing">
    <!-- Header / מיתוג -->
    <header class="landing-header">
      <div class="logo-circle">H</div>
      <div class="branding">
        <h1 class="app-title">Hendiman</h1>
        <p class="app-subtitle">תיקונים קטנים, פתרונות גדולים.</p>
      </div>
    </header>

    <!-- Hero / טקסט מרכזי -->
    <main class="landing-main">
      <section class="hero">
        <h2 class="hero-title">צריך עזרה קטנה בבית?</h2>
        <p class="hero-text">
          הרכבת איקאה, סתימה קטנה, תליית מדפים או כל שטות אחרת שאין לך כוח אליה
          – אנחנו מחברים אותך להנדימן הנכון.
        </p>

        <!-- כפתורי פעולה עיקריים -->
        <div class="cta-buttons">
          <button class="btn primary" @click="goToRegister">
            עוד לא נרשמת? הצטרף אלינו
          </button>

          <button class="btn secondary" @click="goToLogin">
            כבר רשום? התחבר
          </button>
        </div>

        <!-- הפרדה קטנה -->
        <p class="small-hint">
          ההצטרפות בחינם ללקוחות · הנדימנים נרשמים ומקבלים עבודות דרך האפליקציה
        </p>
      </section>

      <!-- יתרונות / "כל המסביב" -->
      <section class="features">
        <div class="feature-card">
          <h3>הזמנה מהירה</h3>
          <p>בחר את סוג העבודה, הגדר מיקום ושעה — והנדימן בדרך אליך.</p>
        </div>

        <div class="feature-card">
          <h3>תשלום מאובטח</h3>
          <p>התשלום מתבצע דרך האפליקקה, בלי כאבי ראש ובלי מזומן.</p>
        </div>

        <div class="feature-card">
          <h3>הנדימנים מאומתים</h3>
          <p>הנדימנים עוברים סינון ודירוגים של משתמשים קודמים.</p>
        </div>

        <div class="feature-card about-card">
          <h3>קצת עלינו</h3>
          <p>
            הנדימן הוא הפלטפורמה שמחברת בין אנשים שצריכים עזרה קטנה בבית
            להנדימנים מקצועיים ואמינים.
          </p>
          <button class="about-button" @click="goToAbout">קצת עלינו</button>
        </div>
      </section>
    </main>

    <!-- פוטר קטן -->
    <footer class="landing-footer">
      <p class="footer-text">
        בלחיצה על "הצטרף אלינו" או "התחבר" אתה מאשר את
        <a href="#" class="footer-link">תנאי השימוש</a>
        ו
        <a href="#" class="footer-link">מדיניות הפרטיות</a>.
      </p>
    </footer>
  </div>
</template>

<script>
export default {
  name: "LandingView",
  methods: {
    goToRegister() {
      this.$router.push({ name: "Register" });
    },
    goToLogin() {
      this.$router.push({ name: "logIn" });
    },
    goToAbout() {
      this.$router.push({ name: "About" });
    },
  },
};
</script>

<style scoped>
.landing {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #0f0f0f;
  color: #f9fafb;
  font-family: "Heebo", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
}

/* Header */
.landing-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  background: #111111;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
}

.logo-circle {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  background: #f97316;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000000;
  font-weight: 700;
  font-size: 20px;
}

.app-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #f97316;
}

.app-subtitle {
  margin: 0;
  font-size: 14px;
  color: #9ca3af;
}

/* Main content */
.landing-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px;
  max-width: 900px;
  margin: 0 auto;
}

/* Hero section */
.hero {
  text-align: center;
  margin-bottom: 32px;
}

.hero-title {
  margin: 12px 0;
  font-size: 26px;
  color: #f97316;
}

.hero-text {
  margin: 0 auto;
  max-width: 500px;
  font-size: 15px;
  color: #d1d5db;
}

/* Buttons */
.cta-buttons {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.btn {
  border: none;
  border-radius: 999px;
  padding: 12px 24px;
  min-width: 260px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.08s ease, box-shadow 0.08s ease,
    background-color 0.15s ease;
}

.btn:active {
  transform: scale(0.98);
  box-shadow: none;
}

.btn.primary {
  background: #f97316;
  color: #000000;
  box-shadow: 0 8px 20px rgba(249, 115, 22, 0.4);
}

.btn.primary:hover {
  background: #ea580c;
}

.btn.secondary {
  background: #1f1f1f;
  color: #f97316;
  border: 1px solid #f97316;
}

.btn.secondary:hover {
  background: #2a2a2a;
}

.small-hint {
  margin-top: 10px;
  font-size: 13px;
  color: #9ca3af;
}

/* Features */
.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-top: 40px;
}

.feature-card {
  background: #111111;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.6);
  text-align: right;
  border: 1px solid #f97316;
}

.feature-card h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #f97316;
}

.feature-card p {
  margin: 0;
  font-size: 14px;
  color: #d1d5db;
}

.about-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-end;
}

.about-button {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  color: #000000;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 8px;
  width: fit-content;
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
}

.about-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(249, 115, 22, 0.4);
  background: linear-gradient(135deg, #ea580c 0%, #f97316 100%);
}

.about-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(249, 115, 22, 0.3);
}

/* Footer */
.landing-footer {
  padding: 12px 16px 16px;
  text-align: center;
  font-size: 12px;
  color: #9ca3af;
  background: #0f0f0f;
}

.footer-link {
  color: #f97316;
  text-decoration: none;
}

.footer-link:hover {
  text-decoration: underline;
}

/* Mobile tweaks */
@media (max-width: 600px) {
  .landing-main {
    padding: 16px;
  }

  .hero-title {
    font-size: 22px;
  }

  .btn {
    width: 100%;
  }
}
</style>
