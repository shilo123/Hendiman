<template>
  <div class="hv" dir="rtl">
    <div class="hv__noise" aria-hidden="true"></div>
    <div class="hv__glow" aria-hidden="true"></div>

    <main class="hv__main">
      <header class="hv__header">
        <button
          type="button"
          class="hv__iconBtn"
          aria-label="תפריט"
          @click="onMenu"
        >
          <span class="material-symbols-outlined hv__icon">menu</span>
        </button>

        <div class="hv__brand" aria-label="Hendiman">
          <h1 class="hv__logo neon-text-glow">HENDIMAN</h1>
        </div>

        <button
          type="button"
          class="hv__iconBtn"
          aria-label="התראות"
          @click="onNotifications"
        >
          <span class="material-symbols-outlined hv__icon">notifications</span>
        </button>
      </header>

      <section class="hv__hero">
        <div class="hv__heroGlow" aria-hidden="true"></div>
        <h2 class="hv__title">
          <span class="hv__titleAccent">צריך עזרה</span>
          בבית?
        </h2>

        <p class="hv__subtitle">
          תיקונים קטנים, פתרונות גדולים.
          <br />
          <span class="hv__subtitleTag">Fast &amp; Reliable</span>
        </p>
      </section>

      <section class="hv__features">
        <div class="glass-panel hv__featurePanel">
          <div class="hv__feature">
            <div class="hv__featureIcon">
              <span class="material-symbols-outlined hv__featureSymbol"
                >bolt</span
              >
            </div>
            <span class="hv__featureLabel">מהיר</span>
          </div>

          <div class="hv__divider" aria-hidden="true"></div>

          <div class="hv__feature">
            <div class="hv__featureIcon">
              <span class="material-symbols-outlined hv__featureSymbol"
                >construction</span
              >
            </div>
            <span class="hv__featureLabel">מקצועי</span>
          </div>

          <div class="hv__divider" aria-hidden="true"></div>

          <div class="hv__feature">
            <div class="hv__featureIcon">
              <span class="material-symbols-outlined hv__featureSymbol"
                >verified_user</span
              >
            </div>
            <span class="hv__featureLabel">אחריות</span>
          </div>
        </div>
      </section>

      <section class="hv__actions">
        <div class="hv__actionsGlow" aria-hidden="true"></div>

        <button type="button" class="hv__primaryBtn" @click="goToRegister">
          <span class="hv__primaryBtnInner">
            <span class="hv__primaryBtnText">הרשמה</span>
            <span class="material-symbols-outlined hv__primaryBtnIcon"
              >arrow_forward</span
            >
          </span>
        </button>

        <button type="button" class="hv__secondaryBtn" @click="goToLogin">
          <span>התחברות</span>
          <span class="material-symbols-outlined hv__secondaryBtnIcon"
            >login</span
          >
        </button>

        <button type="button" class="hv__ghostBtn" @click="goToGuest">
          <span>כניסה כאורח</span>
          <span class="material-symbols-outlined hv__ghostBtnIcon">person</span>
        </button>
      </section>

      <div class="hv__about">
        <button type="button" class="hv__aboutBtn" @click="goToAbout">
          <span class="material-symbols-outlined hv__aboutIcon">info</span>
          <span class="hv__aboutText">מי אנחנו?</span>
        </button>
      </div>
    </main>
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
      // There is currently no guest route / guest backend session.
      // Provide a clear UX action instead of a dead button.
      try {
        window.localStorage.setItem("hendiman_guest_mode", "1");
      } catch (e) {
        // ignore
      }

      // Until a guest flow exists, route to login with an explanation.
      this.$router.push({ name: "logIn", query: { guest: "true" } });
    },
    onMenu() {
      // Placeholder for future drawer.
    },
    onNotifications() {
      // Placeholder for future notifications.
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
  --primary: #f48c25;
  --primary-dark: #d16d0c;
  --primary-bright: #ff9f43;
  --bg-dark: #0a0a0a;
  --surface-dark: #1a1a1a;
  --text: #ffffff;
  --muted: #d1d5db;
  --muted2: #9ca3af;

  position: relative;
  min-height: 100dvh;
  width: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  background: var(--bg-dark);
  color: var(--text);
  font-family: "Heebo", "Rubik", system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  -webkit-overflow-scrolling: touch;
}

.hv__noise {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.1;
  background-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDcwNzA3Ii8+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMxYTFhMWEiLz4KPC9zdmc+");
}

.hv__glow {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-image: radial-gradient(
    circle at 50% 50%,
    rgba(244, 140, 37, 0.15) 0%,
    rgba(10, 10, 10, 0) 70%
  );
}

.hv__main {
  position: relative;
  z-index: 1;
  min-height: 100dvh;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 16px 24px;
  padding-top: max(env(safe-area-inset-top), 20px);
  padding-bottom: max(env(safe-area-inset-bottom, 20px), 32px);
  box-sizing: border-box;
}

.hv__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 8px;
}

.hv__iconBtn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  border-radius: 999px;
  background: transparent;
  border: none;
  color: var(--primary);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.hv__iconBtn:hover {
  background: rgba(255, 255, 255, 0.05);
}

.hv__icon {
  font-size: 30px;
  line-height: 1;
}

.hv__brand {
  display: flex;
  align-items: center;
  justify-content: center;
}

.hv__logo {
  margin: 0;
  font-family: "Inter", "Rubik", "Heebo", system-ui, sans-serif;
  font-weight: 900;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  font-size: 28px;
  color: var(--primary);
}

@keyframes flicker {
  0%,
  19%,
  21%,
  23%,
  25%,
  54%,
  56%,
  100% {
    opacity: 1;
    text-shadow: 0 0 10px var(--primary), 0 0 20px var(--primary),
      0 0 40px var(--primary);
  }
  20%,
  24%,
  55% {
    opacity: 0.82;
    text-shadow: 0 0 5px var(--primary);
  }
}

.neon-text-glow {
  animation: flicker 4s infinite alternate;
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
  gap: 10px;
  margin-top: -32px;
  padding: 16px 0;
}

.hv__heroGlow {
  position: absolute;
  top: 33%;
  left: 50%;
  width: 260px;
  height: 260px;
  transform: translate(-50%, -50%);
  background: rgba(244, 140, 37, 0.1);
  filter: blur(80px);
  border-radius: 999px;
  z-index: -1;
}

.hv__title {
  margin: 0;
  font-weight: 900;
  font-size: clamp(44px, 6vw, 64px);
  line-height: 1.1;
  letter-spacing: -0.02em;
  text-shadow: 0 10px 30px rgba(0, 0, 0, 0.55);
}

.hv__titleAccent {
  display: block;
  margin-bottom: 6px;
  color: var(--primary);
}

.hv__subtitle {
  margin: 0;
  max-width: 320px;
  color: var(--muted);
  font-size: 16px;
  font-weight: 600;
}

.hv__subtitleTag {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--primary);
  font-weight: 900;
  font-family: "Inter", "Heebo", system-ui, sans-serif;
}

.glass-panel {
  background: rgba(26, 26, 26, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(244, 140, 37, 0.2);
}

.hv__features {
  width: 100%;
  margin-bottom: 28px;
  flex-shrink: 0;
}

.hv__featurePanel {
  border-radius: 18px;
  padding: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
}

.hv__feature {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.hv__featureIcon {
  padding: 10px;
  border-radius: 10px;
  border: 1px solid rgba(244, 140, 37, 0.3);
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}

.hv__feature:hover .hv__featureIcon {
  border-color: rgba(244, 140, 37, 0.8);
  box-shadow: 0 0 10px rgba(244, 140, 37, 0.5), 0 0 20px rgba(244, 140, 37, 0.3);
}

.hv__featureSymbol {
  color: var(--primary);
  font-size: 24px;
  line-height: 1;
}

.hv__featureLabel {
  font-size: 12px;
  font-weight: 800;
  color: var(--muted);
}

.hv__divider {
  width: 1px;
  height: 34px;
  background: rgba(255, 255, 255, 0.1);
}

.hv__actions {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 18px;
  flex-shrink: 0;
}

.hv__actionsGlow {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background: rgba(244, 140, 37, 0.05);
  filter: blur(18px);
  z-index: -1;
}

@keyframes pulse-glow {
  0% {
    box-shadow: 0 0 0 0 rgba(244, 140, 37, 0.7);
  }
  70% {
    box-shadow: 0 0 0 15px rgba(244, 140, 37, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(244, 140, 37, 0);
  }
}

@keyframes shimmer {
  0% {
    transform: translateX(-150%) skewX(-15deg);
  }
  100% {
    transform: translateX(200%) skewX(-15deg);
  }
}

.hv__primaryBtn {
  position: relative;
  width: 100%;
  border: none;
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  background: linear-gradient(180deg, var(--primary-bright), var(--primary));
  box-shadow: 0 0 15px rgba(244, 140, 37, 0.7), 0 0 30px rgba(244, 140, 37, 0.4);
  transform: translateZ(0);
  transition: transform 0.18s ease;
  animation: pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.hv__primaryBtn:hover {
  transform: scale(1.01);
}

.hv__primaryBtn:active {
  transform: scale(0.985);
}

.hv__primaryBtn::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.3),
    transparent 40%
  );
  pointer-events: none;
}

.hv__primaryBtn::after {
  content: "";
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.42),
    transparent
  );
  width: 66%;
  transform: translateX(-150%) skewX(-12deg);
  opacity: 0.6;
  animation: shimmer 2.5s infinite linear;
}

.hv__primaryBtnInner {
  position: relative;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000;
  font-weight: 900;
  font-size: 18px;
}

.hv__primaryBtnIcon {
  position: absolute;
  right: 16px;
  font-size: 22px;
  transition: transform 0.2s ease;
}

.hv__primaryBtn:hover .hv__primaryBtnIcon {
  transform: translateX(-4px);
}

.hv__secondaryBtn {
  width: 100%;
  height: 56px;
  border-radius: 14px;
  border: 2px solid rgba(244, 140, 37, 0.5);
  background: rgba(0, 0, 0, 0.4);
  color: #fff;
  font-weight: 800;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: inset 0 0 10px rgba(244, 140, 37, 0.3);
  transition: transform 0.18s ease, background-color 0.18s ease,
    border-color 0.18s ease;
}

.hv__secondaryBtn:hover {
  background: rgba(244, 140, 37, 0.1);
  border-color: rgba(244, 140, 37, 1);
}

.hv__secondaryBtn:active {
  transform: scale(0.985);
}

.hv__secondaryBtnIcon {
  color: var(--primary);
  font-size: 22px;
  transition: transform 0.2s ease;
}

.hv__secondaryBtn:hover .hv__secondaryBtnIcon {
  transform: translateX(-4px);
}

.hv__ghostBtn {
  width: 100%;
  height: 48px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.92);
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: transform 0.18s ease, border-color 0.18s ease,
    background-color 0.18s ease;
}

.hv__ghostBtn:hover {
  border-color: rgba(244, 140, 37, 0.5);
  background: rgba(244, 140, 37, 0.08);
}

.hv__ghostBtn:active {
  transform: scale(0.99);
}

.hv__ghostBtnIcon {
  color: var(--primary);
  font-size: 18px;
}

.hv__about {
  display: flex;
  justify-content: center;
  margin-bottom: max(env(safe-area-inset-bottom, 8px), 8px);
  flex-shrink: 0;
}

.hv__aboutBtn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border-radius: 999px;
  padding: 10px 18px;
  background: var(--surface-dark);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.92);
  cursor: pointer;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
  transition: border-color 0.2s ease, background-color 0.2s ease;
}

.hv__aboutBtn:hover {
  border-color: rgba(244, 140, 37, 0.5);
  background: rgba(26, 26, 26, 0.95);
}

.hv__aboutIcon {
  color: var(--primary);
  font-size: 16px;
}

.hv__aboutText {
  font-size: 14px;
  color: var(--muted);
  font-weight: 700;
}

@media (max-width: 420px) {
  .hv__main {
    padding-left: 18px;
    padding-right: 18px;
    padding-bottom: max(env(safe-area-inset-bottom, 24px), 24px);
  }

  .hv__hero {
    margin-top: -16px;
    padding: 12px 0;
  }

  .hv__title {
    font-size: clamp(36px, 8vw, 56px);
  }

  .hv__features {
    margin-bottom: 20px;
  }

  .hv__actions {
    margin-bottom: 16px;
  }
}

@media (max-height: 700px) {
  .hv__hero {
    margin-top: -16px;
    padding: 8px 0;
  }

  .hv__heroGlow {
    width: 200px;
    height: 200px;
  }

  .hv__title {
    font-size: clamp(32px, 6vw, 48px);
  }

  .hv__features {
    margin-bottom: 16px;
  }

  .hv__actions {
    gap: 10px;
    margin-bottom: 12px;
  }
}
</style>
