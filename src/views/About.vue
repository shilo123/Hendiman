<template>
  <div class="about-page" dir="rtl" lang="he">
    <div class="container">
      <!-- Top Bar -->
      <header class="topbar">
        <div class="brand" aria-label="Hendiman brand">
          <div class="logo" aria-hidden="true">H</div>
          <div class="brand-text">
            <h1>הנדימן</h1>
            <p>בעיות קטנות — פתרונות גדולים</p>
          </div>
        </div>

        <nav class="nav" aria-label="ניווט">
          <RouterLink class="navlink" to="/">בית</RouterLink>
          <RouterLink class="navlink active" to="/about">אודות</RouterLink>
          <RouterLink class="navlink" to="/register">הרשמה</RouterLink>
          <RouterLink class="navlink" to="/login">כניסה</RouterLink>
        </nav>
      </header>

      <!-- Hero -->
      <section class="hero" aria-labelledby="about-title">
        <div class="hero-grid">
          <div class="hero-main">
            <div class="kicker">
              <span class="dot"></span>
              שקיפות • מהירות • מקצועיות
            </div>

            <h2 id="about-title">אודות <span>הנדימן</span></h2>

            <p class="subtitle">
              הנדימן היא פלטפורמה שמחברת בין לקוחות לאנשי מקצוע למשימות
              יום-יומיות — מהרכבה קטנה ועד תיקון שדורש יד מקצועית. במקום לחפש
              “מישהו שמכיר מישהו”, לפתוח אינסוף שיחות ולרדוף אחרי זמינות — אתה
              יוצר קריאה מסודרת, מקבל התאמה, וסוגר עבודה בצורה ברורה ונוחה.
            </p>

            <div class="cta-row" role="group" aria-label="פעולות">
              <RouterLink class="btn btn-primary" to="/register"
                >הצטרף עכשיו</RouterLink
              >
              <RouterLink class="btn btn-ghost" to="/login"
                >יש לי משתמש</RouterLink
              >
              <a class="btn btn-ghost" href="#how-it-works">איך זה עובד</a>
            </div>

            <div class="note">
              <strong>חשוב:</strong> שיתוף מיקום (אם מופעל) נעשה רק לצורך שירות
              ותיאום, ובשגרה אנחנו שואפים למינימום מידע. אין “מעקב קבוע” אחרי
              הנדימנים מחוץ לעבודה פעילה.
            </div>
          </div>

          <aside class="card summary" aria-label="סיכום מהיר">
            <p class="mini-title">מה מקבלים פה בפועל</p>

            <div class="stat">
              <div>
                <strong>יצירת קריאה מהירה</strong><br />
                <span>בוחרים/כותבים מה צריך, מצרפים פרטים, ושולחים.</span>
              </div>
              <span class="emoji" aria-hidden="true">⚡</span>
            </div>

            <div class="stat">
              <div>
                <strong>התאמה חכמה עם AI</strong><br />
                <span>המערכת מסדרת קטגוריות ובקשות גם כשכתבת חופשי.</span>
              </div>
              <span class="emoji" aria-hidden="true">🤖</span>
            </div>

            <div class="stat">
              <div>
                <strong>סטטוסים ושקיפות</strong><br />
                <span>“בדרך”, “הגעתי”, “בוצע” — כולם רואים מה קורה.</span>
              </div>
              <span class="emoji" aria-hidden="true">✅</span>
            </div>

            <div class="stat">
              <div>
                <strong>התראות חכמות</strong><br />
                <span>עדכונים חשובים בזמן אמת כדי שלא תפספס.</span>
              </div>
              <span class="emoji" aria-hidden="true">🔔</span>
            </div>
          </aside>
        </div>
      </section>

      <!-- Main -->
      <main class="main">
        <!-- How it works -->
        <section
          id="how-it-works"
          class="card section"
          aria-labelledby="how-title"
        >
          <h3 id="how-title">איך זה עובד</h3>
          <p class="text">
            בהנדימן יש שני צדדים: <strong>לקוח</strong> שמזמין עבודה, ו<strong
              >הנדימן</strong
            >
            (איש מקצוע) שמקבל קריאות ומבצע אותן. כל התהליך בנוי כך שיהיה קל,
            ברור ומהיר — במיוחד במובייל. <br /><br />
            הלקוח יכול לעבוד בשתי דרכים:
            <strong>לבחור קטגוריה</strong> (למי שאוהב סדר), או
            <strong>לכתוב טקסט חופשי</strong> (למי שרוצה תכלס ולרוץ). המערכת
            עוזרת להפוך “דיבור חופשי” למשהו מסודר שאפשר לעבוד איתו.
          </p>

          <div class="steps" aria-label="שלבים">
            <div class="step">
              <div class="badge">1</div>
              <h4>יוצרים קריאה</h4>
              <p>
                הלקוח מתאר מה צריך. אפשר לבחור קטגוריה, ואפשר להוסיף כמה בקשות
                בשדות נפרדים או טקסט חופשי (למשל: “תליית מדף + תיקון דלת + החלפת
                ברז”). כדי לחסוך בלגן, אנחנו מעדיפים פירוט קצר וברור: מה, איפה,
                ומתי.
              </p>
            </div>

            <div class="step">
              <div class="badge">2</div>
              <h4>התאמה והצעות</h4>
              <p>
                אנשי מקצוע רלוונטיים מקבלים את הקריאה. הלקוח רואה מי זמין, ולפי
                הצורך מתקדם לשלב הבא. המטרה: פחות “תתקשר אליי”, יותר תיאום מסודר
                בתוך המערכת.
              </p>
            </div>

            <div class="step">
              <div class="badge">3</div>
              <h4>ביצוע ועדכונים</h4>
              <p>
                בזמן עבודה יש סטטוסים (לדוגמה: “בדרך”, “הגעתי”, “בוצע”). אם
                מופעל שיתוף מיקום — הוא נועד לתת ללקוח שקט נפשי ו-ETA משוער, ולא
                להפוך את ההנדימן ל”מטרה במעקב”.
              </p>
            </div>
          </div>
        </section>

        <!-- Audience + AI -->
        <section class="grid-2">
          <div class="card section" aria-labelledby="audience-title">
            <h3 id="audience-title">למי זה מיועד</h3>
            <p class="text">
              <strong>לקוחות:</strong> מי שצריך פתרון מהיר בבית או בעסק — בלי
              להתחיל לחפש “מומלץ בקבוצה”. זה מתאים במיוחד למי שאין לו זמן להתעסק
              עם טלפונים, הודעות והמתנות. <br /><br />
              <strong>הנדימנים:</strong> אנשי מקצוע שרוצים לקבל עבודות בצורה
              מסודרת לפי תחומי התמחות, ולבנות לעצמם מוניטין דרך עבודה נקייה
              ושקופה.
            </p>

            <div class="pill-row" aria-label="דוגמאות">
              <span class="pill"
                ><strong>בית:</strong> הרכבות, תלייה, תיקונים</span
              >
              <span class="pill"
                ><strong>אינסטלציה:</strong> נזילות, ברזים, סתימות</span
              >
              <span class="pill"
                ><strong>חשמל:</strong> החלפות, נקודות, תקלות</span
              >
              <span class="pill"
                ><strong>עסקים:</strong> תחזוקה שוטפת ומהירה</span
              >
            </div>
          </div>

          <div class="card section" aria-labelledby="ai-title">
            <h3 id="ai-title">איך אנחנו משתמשים ב-AI</h3>
            <p class="text">
              אנשים לא תמיד יודעים לבחור קטגוריה או “לנסח מקצועית”. לכן ה-AI
              שלנו עוזר לקחת תיאור חופשי ולהפוך אותו להזמנה מסודרת:
              <br /><br />
              <strong>1) זיהוי קטגוריות:</strong> אם כתבת “יש לי נזילה ובנוסף
              צריך לתלות מדף” — ה-AI מזהה שזה אינסטלציה + תלייה/הרכבה.
              <br />
              <strong>2) פירוק לבקשות:</strong> מפצל את הטקסט לסעיפים שאפשר
              לעבוד איתם (כל סעיף = משימה).
              <br />
              <strong>3) סיכום נקי:</strong> יוצר תקציר ברור להצגה להנדימן כדי
              לצמצם אי-הבנות.
              <br />
              <strong>4) שאלות הבהרה:</strong> במקום שתיתקע — ה-AI יכול להציע
              שאלות קצרות (“זה קיר בטון או גבס?”, “יש גישה לברז הראשי?”).
              <br /><br />
              המטרה לא “להחליף” אנשים — אלא להפוך את התהליך למהיר ומדויק יותר.
            </p>

            <div class="note">
              <strong>שקיפות:</strong> ה-AI מסייע בסידור והצעות. ההחלטות בפועל
              (מה להזמין, למי, ואיך) נשארות בידיים של המשתמשים.
            </div>
          </div>
        </section>

        <!-- Privacy -->
        <section class="card section" aria-labelledby="privacy-title">
          <h3 id="privacy-title">פרטיות ומיקום</h3>
          <p class="text">
            פרטיות זה לא “בונוס”, זה בסיס. מיקום (כשקיים) נועד בעיקר לתיאום
            והגעה.
            <br /><br />
            <strong>עיקרון פשוט:</strong> שיתוף מיקום רלוונטי רק בזמן עבודה
            פעילה, ורק לצורך שירות (ETA/הגעה). אנחנו שואפים לשמור מינימום מידע,
            ולתת שליטה מלאה.
          </p>

          <div class="pill-row" aria-label="עקרונות פרטיות">
            <span class="pill"
              >שיתוף מיקום: <strong>רק בזמן עבודה</strong></span
            >
            <span class="pill">שמירה: <strong>מינימום מידע</strong></span>
            <span class="pill">שליטה: <strong>כיבוי/הפעלה</strong></span>
            <span class="pill">מטרה: <strong>הגעה ותיאום</strong></span>
          </div>
        </section>

        <!-- FAQ -->
        <section class="card section" aria-labelledby="faq-title">
          <h3 id="faq-title">שאלות נפוצות</h3>

          <div class="faq">
            <details>
              <summary>איך שולחים קריאה עם כמה עבודות?</summary>
              <p class="text">
                או שמוסיפים כמה שדות (כל שדה = משימה), או כותבים טקסט חופשי.
                ה-AI מסדר את זה לקטגוריות וסעיפים, ואז גם הלקוח וגם ההנדימן
                רואים “רשימת משימות” נקייה.
              </p>
            </details>

            <details>
              <summary>איך יודעים שההנדימן בדרך?</summary>
              <p class="text">
                יש סטטוס “בדרך” וזמן הגעה משוער. אם מופעל שיתוף מיקום — הוא נועד
                לשירות בלבד, ולא למעקב מחוץ לעבודה.
              </p>
            </details>

            <details>
              <summary>אפשר להשתמש בלי AI?</summary>
              <p class="text">
                כן. אפשר לבחור קטגוריות ידנית ולכתוב תיאור רגיל. ה-AI הוא “בוסט”
                שמקל — לא חובה.
              </p>
            </details>

            <details>
              <summary>מה קורה אחרי שהעבודה מסתיימת?</summary>
              <p class="text">
                הסטטוס נסגר, ההתראות מפסיקות, ואם יש שיתוף מיקום — הוא מפסיק.
                המטרה היא להשאיר תהליך נקי ולא “לגרור” מידע שלא צריך.
              </p>
            </details>
          </div>
        </section>

        <!-- CTA -->
        <section class="card section" aria-labelledby="cta2-title">
          <h3 id="cta2-title">יאללה, מתחילים?</h3>
          <p class="text">
            אם אתה לקוח — תיצור קריאה ותראה כמה זה פשוט. אם אתה הנדימן — תצטרף
            ותתחיל לקבל פניות רלוונטיות.
          </p>

          <div class="cta-row" role="group" aria-label="קריאה לפעולה">
            <RouterLink class="btn btn-primary" to="/register"
              >הרשמה</RouterLink
            >
            <RouterLink class="btn btn-ghost" to="/login">כניסה</RouterLink>
            <RouterLink class="btn btn-ghost" to="/">חזרה לבית</RouterLink>
          </div>
        </section>
      </main>

      <footer class="footer">
        <div class="small">
          © {{ year }} הנדימן • בעיות קטנות — פתרונות גדולים
          <br />
          <span class="muted">עיצוב: שחור + כתום, עם מחשבה על UX במובייל.</span>
        </div>

        <div class="small links">
          <RouterLink class="navlink" to="/privacy">מדיניות פרטיות</RouterLink>
          <RouterLink class="navlink" to="/terms">תנאי שימוש</RouterLink>
          <RouterLink class="navlink" to="/contact">צור קשר</RouterLink>
        </div>
      </footer>
    </div>
  </div>
</template>

<script>
export default {
  name: "AboutView",
  data() {
    return {
      year: new Date().getFullYear(),
    };
  },
};
</script>

<style scoped>
.about-page {
  min-height: 100vh;
  color: #f3f4f6;
  background: radial-gradient(
      900px 500px at 15% 10%,
      rgba(255, 122, 24, 0.18),
      transparent 55%
    ),
    radial-gradient(
      900px 500px at 85% 20%,
      rgba(255, 154, 60, 0.1),
      transparent 55%
    ),
    linear-gradient(180deg, #0b0b0f, #050507 70%);
}

.container {
  width: min(1120px, 92vw);
  margin: 0 auto;
  padding: 28px 0 80px;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(16, 16, 24, 0.65);
  backdrop-filter: blur(10px);
  border-radius: 18px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 240px;
}

.logo {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: radial-gradient(
      circle at 30% 30%,
      rgba(255, 255, 255, 0.18),
      transparent 40%
    ),
    linear-gradient(135deg, #ff7a18, #ff9a3c);
  box-shadow: 0 10px 22px rgba(255, 122, 24, 0.25);
  display: grid;
  place-items: center;
  font-weight: 900;
  letter-spacing: 0.5px;
  color: #111;
  user-select: none;
}

.brand-text h1 {
  font-size: 16px;
  margin: 0;
  line-height: 1.1;
}
.brand-text p {
  margin: 2px 0 0;
  font-size: 12px;
  color: #b6b8c0;
}

.nav {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.navlink {
  padding: 9px 12px;
  border-radius: 12px;
  border: 1px solid transparent;
  color: #b6b8c0;
  font-size: 13px;
  transition: 0.15s ease;
  text-decoration: none;
}
.navlink:hover {
  border-color: rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  color: #f3f4f6;
}
.navlink.active {
  border-color: rgba(255, 122, 24, 0.35);
  background: rgba(255, 122, 24, 0.08);
  color: #f3f4f6;
}

.hero {
  margin-top: 18px;
  padding: 28px 22px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  background: linear-gradient(
    180deg,
    rgba(16, 16, 24, 0.78),
    rgba(16, 16, 24, 0.45)
  );
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
  position: relative;
  overflow: hidden;
}
.hero::after {
  content: "";
  position: absolute;
  inset: -2px;
  background: radial-gradient(
    700px 320px at 28% 10%,
    rgba(255, 122, 24, 0.22),
    transparent 62%
  );
  pointer-events: none;
}
.hero-grid {
  position: relative;
  display: grid;
  grid-template-columns: 1.25fr 0.75fr;
  gap: 18px;
  align-items: start;
}
@media (max-width: 900px) {
  .hero-grid {
    grid-template-columns: 1fr;
  }
}

.kicker {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  padding: 7px 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  border-radius: 999px;
  color: #b6b8c0;
  font-size: 12px;
  width: fit-content;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff7a18;
  box-shadow: 0 0 0 5px rgba(255, 122, 24, 0.12);
}

.hero h2 {
  margin: 12px 0 10px;
  font-size: 36px;
  line-height: 1.08;
  letter-spacing: -0.4px;
}
.hero h2 span {
  color: #ff7a18;
}
.subtitle {
  margin: 0;
  color: #b6b8c0;
  font-size: 15px;
  line-height: 1.75;
  max-width: 62ch;
}

.cta-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 18px;
}

.btn {
  padding: 11px 14px;
  border-radius: 14px;
  border: 1px solid transparent;
  font-weight: 800;
  font-size: 14px;
  transition: 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
}
.btn-primary {
  background: linear-gradient(135deg, #ff7a18, #ff9a3c);
  color: #111;
  box-shadow: 0 12px 24px rgba(255, 122, 24, 0.18);
}
.btn-primary:hover {
  transform: translateY(-1px);
}
.btn-ghost {
  border-color: rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  color: #f3f4f6;
}
.btn-ghost:hover {
  background: rgba(255, 255, 255, 0.06);
  transform: translateY(-1px);
}

.card {
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(16, 16, 24, 0.55);
  border-radius: 18px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
  padding: 16px;
}

.summary .mini-title {
  margin: 0 0 8px;
  font-size: 13px;
  color: #b6b8c0;
  letter-spacing: 0.2px;
}

.stat {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  margin-top: 10px;
}
.stat strong {
  font-size: 14px;
}
.stat span {
  color: #b6b8c0;
  font-size: 12px;
  line-height: 1.5;
}
.emoji {
  opacity: 0.9;
}

.main {
  margin-top: 18px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

.section {
  padding: 18px;
}

.section h3 {
  margin: 0 0 10px;
  font-size: 18px;
  letter-spacing: -0.2px;
}

.text {
  margin: 0;
  color: #b6b8c0;
  line-height: 1.85;
  font-size: 14px;
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
@media (max-width: 900px) {
  .grid-2 {
    grid-template-columns: 1fr;
  }
}

.steps {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 12px;
}
@media (max-width: 900px) {
  .steps {
    grid-template-columns: 1fr;
  }
}
.step {
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.03);
}
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 10px;
  background: rgba(255, 122, 24, 0.18);
  border: 1px solid rgba(255, 122, 24, 0.35);
  color: #ff9a3c;
  font-weight: 900;
  margin-bottom: 10px;
}
.step h4 {
  margin: 0 0 6px;
  font-size: 15px;
  color: #f3f4f6;
}
.step p {
  margin: 0;
  color: #b6b8c0;
  font-size: 13px;
  line-height: 1.75;
}

.pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}
.pill {
  padding: 8px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  color: #b6b8c0;
  font-size: 12px;
}
.pill strong {
  color: #f3f4f6;
}

.faq {
  margin-top: 12px;
  display: grid;
  gap: 10px;
}
details {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.03);
  padding: 12px 12px;
}
summary {
  cursor: pointer;
  font-weight: 900;
  color: #f3f4f6;
  outline: none;
}
details .text {
  margin-top: 10px;
}

.note {
  margin-top: 10px;
  padding: 12px 12px;
  border-radius: 16px;
  border: 1px dashed rgba(255, 122, 24, 0.35);
  background: rgba(255, 122, 24, 0.06);
  color: #b6b8c0;
  font-size: 12px;
  line-height: 1.7;
}
.note strong {
  color: #f3f4f6;
}

.footer {
  margin-top: 18px;
  padding: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  background: rgba(16, 16, 24, 0.55);
  color: #b6b8c0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.small {
  font-size: 12px;
  line-height: 1.6;
}
.muted {
  color: #b6b8c0;
}
.links {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
</style>
