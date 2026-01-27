<template>
  <div class="hv" dir="rtl">
    <div class="hv__noise" aria-hidden="true"></div>
    <div class="hv__glow" aria-hidden="true"></div>

    <main class="hv__main">
      <header class="hv__header">
        <div class="hv__brand" aria-label="Hendiman">
          <h1 class="hv__logo">HENDIMAN</h1>
          <div class="hv__logoLine"></div>
        </div>
      </header>

      <section class="hv__hero">
        <div class="hv__heroIconWrapper">
          <div class="hv__heroIconGlow" aria-hidden="true"></div>
          <div class="hv__heroIcon">
            <span class="material-symbols-outlined hv__heroIconSymbol">handyman</span>
          </div>
        </div>

        <h2 class="hv__title">
          <span class="hv__titleAccent">צריך עזרה</span>
          <span class="hv__titleText">בבית?</span>
        </h2>

        <p class="hv__subtitle">
          הזמן איש מקצוע אמין בקליק אחד ותיהנה משקט נפשי
        </p>
      </section>

      <section class="hv__features">
        <div class="glass-panel hv__featurePanel">
          <div class="hv__feature">
            <div class="hv__featureIcon">
              <span class="material-symbols-outlined hv__featureSymbol">bolt</span>
            </div>
            <div class="hv__featureText">
              <span class="hv__featureLabel">מהיר</span>
              <span class="hv__featureSubtext">הגעה מידית</span>
            </div>
          </div>

          <div class="hv__divider" aria-hidden="true"></div>

          <div class="hv__feature">
            <div class="hv__featureIcon">
              <span class="material-symbols-outlined hv__featureSymbol">build</span>
            </div>
            <div class="hv__featureText">
              <span class="hv__featureLabel">מקצועי</span>
              <span class="hv__featureSubtext">מומחים בלבד</span>
            </div>
          </div>

          <div class="hv__divider" aria-hidden="true"></div>

          <div class="hv__feature">
            <div class="hv__featureIcon">
              <span class="material-symbols-outlined hv__featureSymbol">verified_user</span>
            </div>
            <div class="hv__featureText">
              <span class="hv__featureLabel">אחריות</span>
              <span class="hv__featureSubtext">ביטוח מלא</span>
            </div>
          </div>
        </div>
      </section>

      <section class="hv__actions">
        <button type="button" class="hv__primaryBtn" @click="goToRegister">
          <span>הרשמה</span>
          <span class="material-symbols-outlined hv__primaryBtnIcon">arrow_back</span>
          <div class="hv__primaryBtnShine"></div>
        </button>

        <button type="button" class="hv__secondaryBtn" @click="goToLogin">
          <span class="material-symbols-outlined hv__secondaryBtnIcon">login</span>
          <span>התחברות</span>
        </button>

        <button type="button" class="hv__ghostBtn" @click="goToGuest">
          המשך כאורח
        </button>
      </section>
    </main>

    <div class="hv__safeArea"></div>
  </div>
</template>

<script>
export default {
  name: "HomeView",
  data() {
    return {
      prevHtmlDir: null,
      prevHtmlLang: null,
      hadDarkClass: false,
    };
  },
  mounted() {
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
  beforeUnmount() {
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
    goToGuest() {
      // Navigate to Dashboard as guest
      this.$router.push({ 
        name: "Dashboard", 
        params: { id: "אורח" } 
      });
    },
  },
};
</script>

<style scoped>
/* Hide scrollbars (mobile-like) */
::-webkit-scrollbar {
  display: none;
}

.hv {
  --primary: #f27f0d;
  --primary-hover: #d96e05;
  --bg-dark: #1a1612;
  --surface-dark: #2a241e;
  --text: #ffffff;
  --muted: rgba(255, 255, 255, 0.6);
  --muted-dark: rgba(255, 255, 255, 0.4);

  position: relative;
  min-height: 100dvh;
  width: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  background: var(--bg-dark);
  color: var(--text);
  font-family: "Manrope", "Heebo", "Rubik", system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  -webkit-overflow-scrolling: touch;
}

.hv__noise {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  mix-blend-mode: overlay;
  background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuB_HGnkMyGAKP27h-1g1ne-VTmcwSa-4ZaAWGy-kysC8HhBI-ExXGBnKWekHlWkK4ZfZcoCpf4VUVAfu8FSR-_YaeL7mZBz38Qlk3x9oEDV_jOEqz15Oq8UZWyjwcsHSV0es8_iVeahvN7ZWonSu5FVcHPGsgucWI7aTeSFrnR3NsnLk8xPE0RxfxABwCYsRaPw2mWRuilGIsbbaW3ewhHGkjDPNZkJSfWKrRjo1ukcunKvCLaI-ZZ_29_vGzp81UDGhofd5Y8O3aU");
}

.hv__glow {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background-image: radial-gradient(
    circle at 50% 0%,
    rgba(242, 127, 13, 0.15) 0%,
    rgba(26, 22, 18, 0) 50%
  );
}

.hv__main {
  position: relative;
  z-index: 10;
  min-height: 100dvh;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0 24px;
  padding-top: max(env(safe-area-inset-top), 56px);
  padding-bottom: max(env(safe-area-inset-bottom, 32px), 32px);
  box-sizing: border-box;
}

.hv__header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: 16px;
}

.hv__iconBtn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  border: none;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.2s ease;
}

.hv__iconBtn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text);
}

.hv__iconBtn:active {
  transform: scale(0.95);
}

.hv__icon {
  font-size: 24px;
  line-height: 1;
}

.hv__brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.hv__logo {
  margin: 0;
  font-family: "Manrope", "Inter", "Rubik", "Heebo", system-ui, sans-serif;
  font-weight: 800;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  font-size: 20px;
  color: var(--text);
  text-shadow: 0 0 20px rgba(242, 127, 13, 0.3);
}

.hv__logoLine {
  width: 16px;
  height: 2px;
  margin: 4px auto 0;
  background: var(--primary);
  box-shadow: 0 0 8px rgba(242, 127, 13, 0.8);
}

.hv__hero {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 16px;
  margin-top: 16px;
  padding: 16px 0;
}

.hv__heroIconWrapper {
  position: relative;
  margin-bottom: 32px;
}

.hv__heroIconGlow {
  position: absolute;
  inset: -16px;
  background: rgba(242, 127, 13, 0.2);
  filter: blur(48px);
  border-radius: 999px;
  opacity: 0.3;
}

.hv__heroIcon {
  position: relative;
  width: 128px;
  height: 128px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.1), transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.hv__heroIconSymbol {
  font-size: 64px;
  color: var(--primary);
  filter: drop-shadow(0 0 15px rgba(242, 127, 13, 0.6));
}

.hv__title {
  margin: 0;
  font-weight: 700;
  font-size: 40px;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: var(--text);
}

.hv__titleAccent {
  display: block;
  margin-bottom: 8px;
  color: var(--primary);
  text-shadow: 0 0 20px rgba(242, 127, 13, 0.3);
}

.hv__titleText {
  display: block;
}

.hv__subtitle {
  margin: 16px 0 0;
  max-width: 280px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
}

.glass-panel {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
}

.hv__features {
  width: 100%;
  margin: 40px 0 32px;
  flex-shrink: 0;
}

.hv__featurePanel {
  border-radius: 16px;
  padding: 24px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  position: relative;
}

.hv__feature {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-align: center;
}

.hv__featureIcon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--surface-dark);
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
}

.hv__featureSymbol {
  color: var(--primary);
  font-size: 24px;
  line-height: 1;
}

.hv__featureText {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hv__featureLabel {
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
}

.hv__featureSubtext {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
}

.hv__divider {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 1px;
  height: 60%;
  background: rgba(255, 255, 255, 0.1);
}

.hv__divider:nth-of-type(2) {
  left: 33.333%;
}

.hv__divider:nth-of-type(4) {
  left: 66.666%;
}

.hv__actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: auto;
  flex-shrink: 0;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
    opacity: 0;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    transform: translateX(100%);
    opacity: 0;
  }
}

.hv__primaryBtn {
  position: relative;
  width: 100%;
  height: 56px;
  border: none;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  background: var(--primary);
  color: var(--bg-dark);
  font-weight: 700;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  box-shadow: 0 0 20px rgba(242, 127, 13, 0.3);
  transition: all 0.2s ease;
}

.hv__primaryBtn:hover {
  background: var(--primary-hover);
  box-shadow: 0 0 30px rgba(242, 127, 13, 0.5);
}

.hv__primaryBtn:active {
  transform: scale(0.98);
}

.hv__primaryBtnShine {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transform: translateX(-100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.hv__primaryBtn:hover .hv__primaryBtnShine {
  animation: shimmer 1s infinite;
  opacity: 1;
}

.hv__primaryBtnIcon {
  font-size: 20px;
}

.hv__secondaryBtn {
  width: 100%;
  height: 56px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: var(--text);
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition: all 0.2s ease;
}

.hv__secondaryBtn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.15);
}

.hv__secondaryBtn:active {
  transform: scale(0.98);
}

.hv__secondaryBtnIcon {
  color: var(--primary);
  font-size: 20px;
}

.hv__ghostBtn {
  width: 100%;
  margin-top: 8px;
  padding: 12px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.4);
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: color 0.2s ease;
}

.hv__ghostBtn:hover {
  color: var(--primary);
}

.hv__safeArea {
  height: 24px;
  width: 100%;
}

@media (max-width: 420px) {
  .hv__main {
    padding-left: 18px;
    padding-right: 18px;
  }

  .hv__hero {
    margin-top: 8px;
    padding: 12px 0;
  }

  .hv__heroIcon {
    width: 112px;
    height: 112px;
  }

  .hv__heroIconSymbol {
    font-size: 56px;
  }

  .hv__title {
    font-size: 36px;
  }

  .hv__features {
    margin: 32px 0 24px;
  }

  .hv__featurePanel {
    padding: 20px 16px;
    gap: 12px;
  }

  .hv__featureIcon {
    width: 44px;
    height: 44px;
  }

  .hv__featureSymbol {
    font-size: 20px;
  }

  .hv__featureLabel {
    font-size: 13px;
  }

  .hv__featureSubtext {
    font-size: 9px;
  }
}

@media (max-height: 700px) {
  .hv__hero {
    margin-top: 4px;
    padding: 8px 0;
  }

  .hv__heroIconWrapper {
    margin-bottom: 24px;
  }

  .hv__heroIcon {
    width: 96px;
    height: 96px;
  }

  .hv__heroIconSymbol {
    font-size: 48px;
  }

  .hv__title {
    font-size: 32px;
  }

  .hv__features {
    margin: 24px 0 20px;
  }

  .hv__actions {
    gap: 12px;
  }
}
</style>
