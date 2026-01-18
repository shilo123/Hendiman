<template>
  <div class="login" dir="rtl">
    <!-- Background Effects -->
    <div class="login__bg-gradient"></div>
    <!-- Floating particles/embers (Abstract visual noise) -->
    <div class="login__bg-pattern"></div>

    <!-- Main Container -->
    <div class="login__wrap">
      <!-- Hero Section: Logo -->
      <div class="login__hero">
        <!-- Logo Graphic -->
        <div class="login__logoContainer">
          <svg
            class="login__logo"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M20 10 H35 V42 H65 V10 H80 V90 H65 V57 H35 V90 H20 V10 Z" />
          </svg>
          <!-- Inner fire pulse effect -->
          <div class="login__logoAura"></div>
        </div>
        <!-- Headline Text -->
        <div class="login__headline">
          <h1 class="login__title">התחברות</h1>
          <p class="login__subtitle">כוח בידיים שלך</p>
        </div>
      </div>

      <!-- Login Card -->
      <div class="login__card">
        <!-- Blocked User Message -->
        <div v-if="isBlocked" class="blocked-message">
          <span class="material-symbols-outlined">block</span>
          <span>המשתמש הזה חסום על ידי הנהלת הנדימן</span>
        </div>

        <!-- Inputs Form -->
        <form class="login__form" @submit.prevent="handleLogin">
          <!-- Email Input -->
          <div class="input-group">
            <div class="input-wrapper">
              <!-- Leading Icon -->
              <div class="input-icon input-icon--leading">
                <span class="material-symbols-outlined">bolt</span>
              </div>
              <!-- Input Field -->
              <input
                v-model="username"
                class="input-field"
                type="text"
                placeholder="אימייל או נייד"
                required
                autocomplete="username"
              />
            </div>
          </div>

          <!-- Password Input -->
          <div class="input-group">
            <div class="input-wrapper">
              <!-- Leading Icon -->
              <div class="input-icon input-icon--leading">
                <span class="material-symbols-outlined">lock</span>
              </div>
              <!-- Input Field -->
              <input
                v-if="!ifGoogleUser && !ifFacebookUser"
                v-model="password"
                class="input-field"
                :type="showPassword ? 'text' : 'password'"
                placeholder="סיסמה"
                required
                autocomplete="current-password"
              />
              <input
                v-else
                v-model="password"
                class="input-field"
                type="text"
                :placeholder="
                  ifGoogleUser ? 'סיסמה (Google)' : 'סיסמה (Facebook)'
                "
                required
                autocomplete="current-password"
                readonly
              />
              <!-- Trailing Action (Visibility) -->
              <button
                v-if="!ifGoogleUser && !ifFacebookUser"
                type="button"
                class="input-icon input-icon--trailing"
                @click="showPassword = !showPassword"
                :aria-label="showPassword ? 'הסתר סיסמה' : 'הראה סיסמה'"
              >
                <span class="material-symbols-outlined">{{
                  showPassword ? "visibility_off" : "visibility"
                }}</span>
              </button>
            </div>
          </div>

          <!-- Forgot Password Link and Register -->
          <div class="forgot-password-wrapper">
            <div class="forgot-password">
              <a href="#" @click.prevent="handleForgotPassword">
                שכחת סיסמה?
              </a>
            </div>
            <div class="login__footer">
              <p>
                אין לך חשבון?
                <a href="#" @click.prevent="goToRegister">הירשם עכשיו</a>
              </p>
            </div>
          </div>

          <!-- Main Action Button -->
          <button type="submit" class="login-btn">
            כניסה לאזור אישי
          </button>
        </form>

        <!-- Biometric Authentication - Only on Mobile -->
        <div
          v-if="isMobile && hasBiometricCredentials"
          class="biometric-auth"
        >
          <button
            type="button"
            class="biometric-btn"
            @click="handleBiometricLogin"
            :disabled="biometricLoading"
          >
            <span class="material-symbols-outlined">fingerprint</span>
            <span>{{
              biometricLoading ? "מתחבר..." : "התחבר עם טביעת אצבע"
            }}</span>
          </button>
        </div>

        <!-- Social Login Divider -->
        <div class="social-divider">
          <div class="social-divider__line"></div>
          <span class="social-divider__text">או התחבר דרך</span>
          <div class="social-divider__line"></div>
        </div>

        <!-- Social Buttons -->
        <div class="social-buttons">
          <!-- Google -->
          <button
            type="button"
            class="social-btn"
            @click="ConenectWithGoogle"
          >
            <svg class="social-btn__icon" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81z"
              />
            </svg>
          </button>

          <!-- Facebook -->
          <button
            type="button"
            class="social-btn"
            @click="ConenectWithFacebook"
          >
            <svg class="social-btn__icon" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.17 6 13 6c.88 0 1.63.02 2.25.07V8h-1.5c-1 0-1.33.5-1.33 1.47V12h2.5l-.33 3H12.2v6.8c4.56-.93 8-4.96 8-9.8z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { URL } from "@/Url/url";
import { useToast } from "@/composables/useToast";
import {
  startRegistration,
  startAuthentication,
} from "@simplewebauthn/browser";

export default {
  name: "logIn",
  data() {
    return {
      username: "",
      password: "",
      email: "",
      ifGoogleUser: false,
      ifFacebookUser: false,
      toast: null,
      showPassword: false,
      googleId: null,
      facebookId: null,
      isBlocked: false,
      useVideo: false, // שנה ל-true אם יש לך קובץ וידאו
      isMobile: false,
      hasBiometricCredentials: false,
      biometricLoading: false,
      currentUserId: null,
    };
  },
  async created() {
    this.toast = useToast();
    this.checkIfMobile();
    this.handleGoogleCallback();
    this.handleFacebookCallback();
    // בדוק אם המשתמש הועבר לכאן כי הוא חסום
    if (this.$route.query.blocked === "true") {
      this.isBlocked = true;
      this.toast?.showError("המשתמש הזה חסום על ידי הנהלת הנדימן");
    }

    if (this.$route.query.error === "facebook_not_configured") {
      this.toast?.showError("חיבור Facebook לא מוגדר בשרת");
    } else if (this.$route.query.error === "auth_failed") {
      this.toast?.showError("האימות נכשל, נסה שוב");
    }
  },
  watch: {
    "$route.query": {
      handler(newQuery) {
        if (this.toast) this.handleGoogleCallback();
        if (this.toast) this.handleFacebookCallback();
        // בדוק אם המשתמש הועבר לכאן כי הוא חסום
        if (newQuery.blocked === "true") {
          this.isBlocked = true;
          this.toast?.showError("המשתמש הזה חסום על ידי הנהלת הנדימן");
        }
      },
    },
  },
  methods: {
    checkIfMobile() {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      this.isMobile =
        /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          userAgent
        );
    },

    async checkBiometricCredentials() {
      if (!this.isMobile || !this.currentUserId) {
        this.hasBiometricCredentials = false;
        return;
      }

      try {
        const { data } = await axios.post(`${URL}/webauthn/check`, {
          userId: this.currentUserId,
        });
        this.hasBiometricCredentials = data.success && data.hasCredentials;
      } catch (error) {
        this.hasBiometricCredentials = false;
      }
    },

    async handleBiometricLogin() {
      if (!this.currentUserId) {
        // First, try to find user by username/email
        try {
          const { data } = await axios.post(`${URL}/login-user`, {
            username: this.username,
            password: this.password,
          });

          if (data.message === "Success" && data.user && data.user._id) {
            this.currentUserId = data.user._id;
          } else {
            this.toast?.showError("אנא הזן שם משתמש וסיסמה תחילה");
            return;
          }
        } catch (error) {
          this.toast?.showError("אנא הזן שם משתמש וסיסמה תחילה");
          return;
        }
      }

      if (!this.currentUserId) {
        this.toast?.showError("לא ניתן לזהות משתמש");
        return;
      }

      this.biometricLoading = true;

      try {
        // Step 1: Get authentication options
        const { data: optionsData } = await axios.post(
          `${URL}/webauthn/authenticate/start`,
          { userId: this.currentUserId }
        );

        if (!optionsData.success) {
          throw new Error(
            optionsData.message || "Failed to get authentication options"
          );
        }

        // Step 2: Start authentication
        const credential = await startAuthentication(optionsData.options);

        // Step 3: Verify authentication
        const { data: verifyData } = await axios.post(
          `${URL}/webauthn/authenticate/finish`,
          {
            userId: this.currentUserId,
            credential,
          }
        );

        if (verifyData.success && verifyData.user) {
          this.toast.showSuccess("התחברות עם טביעת אצבע בוצעה בהצלחה");
          this.$router.push({
            name: "Dashboard",
            params: { id: verifyData.user._id },
          });
        } else {
          throw new Error(verifyData.message || "Authentication failed");
        }
      } catch (error) {
        if (error.name === "NotAllowedError") {
          this.toast?.showError("האימות בוטל או נכשל");
        } else if (error.name === "InvalidStateError") {
          this.toast?.showError("טביעת האצבע לא רשומה במכשיר זה");
        } else {
          const errorMessage =
            error.response?.data?.message ||
            error.message ||
            "שגיאה באימות טביעת אצבע";
          this.toast?.showError(errorMessage);
        }
      } finally {
        this.biometricLoading = false;
      }
    },

    async handleGoogleCallback() {
      if (!this.toast) this.toast = useToast();

      const googleAuth =
        this.$route.query.googleAuth ||
        new URLSearchParams(window.location.search).get("googleAuth");

      if (googleAuth === "success") {
        const userData =
          this.$route.query.user ||
          new URLSearchParams(window.location.search).get("user");

        if (userData) {
          try {
            this.ifGoogleUser = true;
            this.ifFacebookUser = false;
            this.facebookId = null;
            const user = JSON.parse(decodeURIComponent(userData));
            this.toast.showSuccess("התחברות עם Google בוצעה בהצלחה!");
            this.username = user.username;
            // השתמש ב-googleId כסיסמה, לא במייל
            this.password = user.googleId || user._id?.toString() || user.email;
            this.googleId = user.googleId;
            await this.handleLogin();
          } catch (error) {
            this.toast?.showError("לא הצלחנו לעבד את נתוני המשתמש");
          }
        }
      }
    },

    async handleFacebookCallback() {
      if (!this.toast) this.toast = useToast();

      const facebookAuth =
        this.$route.query.facebookAuth ||
        new URLSearchParams(window.location.search).get("facebookAuth");

      if (facebookAuth === "success") {
        const userData =
          this.$route.query.user ||
          new URLSearchParams(window.location.search).get("user");

        if (userData) {
          try {
            this.ifFacebookUser = true;
            this.ifGoogleUser = false;
            this.googleId = null;
            const user = JSON.parse(decodeURIComponent(userData));
            this.toast.showSuccess("התחברות עם Facebook בוצעה בהצלחה!");
            this.username = user.username || user.email || user.name || "";
            this.password =
              user.facebookId || user.id || user._id?.toString() || user.email;
            this.facebookId = user.facebookId || user.id;
            await this.handleLogin();
          } catch (error) {
            this.toast?.showError("לא הצלחנו לעבד את נתוני המשתמש");
          }
        }
      }
    },

    async handleLogin() {
      try {
        const { data } = await axios.post(`${URL}/login-user`, {
          username: this.username,
          password: this.password,
          ifGoogleUser: this.ifGoogleUser,
          googleId: this.googleId,
          ifFacebookUser: this.ifFacebookUser,
          facebookId: this.facebookId,
        });

        if (data.message === "Success") {
          this.toast.showSuccess("התחברות בוצעה בהצלחה");

          if (this.ifGoogleUser && data.password) {
            this.password = data.password;
          }

          if (this.ifFacebookUser && data.password) {
            this.password = data.password;
          }

          // בדוק אם זה Admin
          if (data.isAdmin) {
            this.$router.push({
              name: "AdminManager",
            });
            return;
          }

          if (data.user && data.user._id) {
            this.currentUserId = data.user._id;
            // Check if user has biometric credentials
            if (this.isMobile) {
              await this.checkBiometricCredentials();
            }
            this.$router.push({
              name: "Dashboard",
              params: { id: data.user._id },
            });
          }
        } else if (data.message === "NoUser") {
          if (this.ifGoogleUser) {
            this.toast.showError(
              "משתמש Google לא נמצא במערכת. אנא הירשם תחילה."
            );
          } else if (this.ifFacebookUser) {
            this.toast.showError(
              "משתמש Facebook לא נמצא במערכת. אנא הירשם תחילה."
            );
          } else {
            this.toast.showError("מייל או שם משתמש לא נכון");
          }
        } else if (data.message === "NoPass") {
          this.toast.showError("סיסמה לא נכונה");
        } else if (data.message === "NoEmail") {
          this.toast.showError("מייל לא נכון");
        } else if (data.message === "Blocked") {
          this.isBlocked = true;
        }
      } catch (error) {
        const errorMessage =
          error.response?.data?.message || error.message || "שגיאה בהתחברות";
        this.toast.showError(errorMessage);

        if (
          error.code === "ECONNREFUSED" ||
          error.message?.includes("Network")
        ) {
          this.toast.showError("לא ניתן להתחבר לשרת. אנא ודא שהשרת רץ");
        }
      }
    },

    ConenectWithGoogle() {
      window.location.href = `${URL}/auth/google?source=login`;
    },

    ConenectWithFacebook() {
      window.location.href = `${URL}/auth/facebook?source=login`;
    },

    goToRegister() {
      this.$router.push({ name: "Register" });
    },

    async handleForgotPassword() {
      try {
        await axios.post(`${URL}/forgot-password`, { username: this.username });
      } catch (e) {
        // בכוונה לא מציגים שגיאה (כמו אצלך)
      }
    },
  },
};
</script>

<style scoped lang="scss">
// Color Variables
$primary: #f27f0d;
$primary-dark: #b35900;
$background-dark: #050505;
$text: rgba(255, 255, 255, 0.92);
$text-muted: rgba(255, 255, 255, 0.62);

// Custom Styles for Glow Effects
@keyframes pulse {
  0%,
  100% {
    opacity: 0.2;
  }
  50% {
    opacity: 0.4;
  }
}

.login {
  min-height: 100dvh;
  position: relative;
  width: 100%;
  padding: 0;
  font-family: "Space Grotesk", "Noto Sans", -apple-system, BlinkMacSystemFont,
    "Segoe UI", Roboto, Arial, sans-serif;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  background: $background-dark;
  color: $text;
  box-sizing: border-box;

  @media (min-width: 640px) {
    align-items: center;
    padding: 24px;
  }
}

// Background Effects
.login__bg-gradient {
  position: fixed;
  inset: 0;
  z-index: 0;
  background: radial-gradient(
    circle at 50% 30%,
    #4a2503 0%,
    #1a0e05 40%,
    #000000 80%
  );
}

.login__bg-pattern {
  position: fixed;
  inset: 0;
  z-index: 0;
  opacity: 0.2;
  background-image: url("https://www.transparenttextures.com/patterns/stardust.png");
  pointer-events: none;
}

// Main Container
.login__wrap {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 448px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  gap: 0;
  box-sizing: border-box;
  min-width: 0;
  padding: 24px 16px;
  padding-top: max(env(safe-area-inset-top, 32px), 32px);
  padding-bottom: max(env(safe-area-inset-bottom, 4px), 4px);
  min-height: 100dvh;

  @media (min-width: 640px) {
    padding: 32px 24px;
    padding-top: 24px;
    padding-bottom: 24px;
    min-height: auto;
    justify-content: flex-start;
    gap: 32px;
  }
}

// Hero Section
.login__hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin-bottom: 32px;
  margin-top: 0;

  @media (max-width: 640px) {
    margin-bottom: 24px;
  }

  @media (min-width: 641px) {
    margin-bottom: 32px;
  }
}

.login__logoContainer {
  position: relative;
  width: 112px;
  height: 112px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  filter: drop-shadow(0 0 15px rgba(242, 127, 13, 0.6))
    drop-shadow(0 0 30px rgba(242, 127, 13, 0.4));

  @media (max-width: 640px) {
    width: 96px;
    height: 96px;
    margin-bottom: 12px;
  }
}

.login__logo {
  width: 100%;
  height: 100%;
  fill: currentColor;
  color: $primary;
}

.login__logoAura {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(242, 127, 13, 0.2);
  filter: blur(24px);
  animation: pulse 2s ease-in-out infinite;
}

.login__headline {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 8px;

  @media (max-width: 640px) {
    gap: 6px;
  }
}

.login__title {
  font-size: 36px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: $text;
  text-shadow: 0 0 10px rgba(242, 127, 13, 0.5),
    0 0 20px rgba(242, 127, 13, 0.3);
  margin: 0;

  @media (max-width: 640px) {
    font-size: clamp(28px, 8vw, 32px);
  }
}

.login__subtitle {
  font-size: 18px;
  color: rgba(242, 127, 13, 0.9);
  font-weight: 500;
  letter-spacing: 0.05em;
  margin: 0;

  @media (max-width: 640px) {
    font-size: clamp(14px, 4vw, 16px);
  }
}

// Login Card
.login__card {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  background: rgba(10, 10, 10, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
  margin-top: auto;
  margin-bottom: 0;

  @media (max-width: 640px) {
    padding: 20px 18px;
    gap: 20px;
    border-radius: 20px;
    margin-bottom: 0;
    margin-top: auto;
    padding-top: 60px;
  }

  @media (max-width: 420px) {
    padding-top: 80px;
  }

  @media (min-width: 641px) {
    padding: 32px;
    margin-bottom: 32px;
    margin-top: 0;
  }
}

// Form
.login__form {
  display: flex;
  flex-direction: column;
  gap: 20px;

  @media (max-width: 640px) {
    gap: 16px;
  }
}

// Input Groups
.input-group {
  position: relative;
}

.input-wrapper {
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  border-radius: 9999px;
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  height: 56px;
  padding: 0 4px;
  overflow: hidden;
  transition: all 0.3s ease;
  min-width: 0;

  @media (max-width: 640px) {
    height: 52px;
  }

  &:focus-within {
    border-color: $primary;
    box-shadow: 0 0 15px rgba(242, 127, 13, 0.3);
  }
}

.input-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: $primary;
  flex-shrink: 0;

  &--leading {
    width: 48px;
    padding-right: 16px;
    padding-left: 4px;
    border-left: 1px solid rgba(255, 255, 255, 0.05);

    @media (max-width: 640px) {
      width: 44px;
      padding-right: 12px;
    }
  }

  &--trailing {
    width: 40px;
    padding-left: 8px;
    padding-right: 8px;
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    transition: color 0.2s ease;
    background: transparent;
  }

  &--trailing:hover {
    color: $text;
  }

  .material-symbols-outlined {
    font-size: 24px;
    font-variation-settings: "FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24;

    @media (max-width: 640px) {
      font-size: 22px;
    }
  }

  &--trailing .material-symbols-outlined {
    font-size: 20px;

    @media (max-width: 640px) {
      font-size: 18px;
    }
  }
}

.input-field {
  flex: 1;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  background: transparent;
  border: none;
  color: $text;
  padding: 0 16px;
  height: 100%;
  font-size: 16px;
  font-weight: 400;
  font-family: inherit;
  outline: none;
  text-align: right;

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  &:read-only {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

// Forgot Password Wrapper
.forgot-password-wrapper {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: -4px;
  gap: 16px;
  flex-wrap: wrap;

  @media (max-width: 420px) {
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
  }
}

// Forgot Password
.forgot-password {
  display: flex;
  justify-content: flex-end;
  margin: 0;

  a {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.4);
    text-decoration: none;
    transition: all 0.2s ease;

    @media (max-width: 640px) {
      font-size: 13px;
    }

    &:hover {
      color: $primary;
      text-decoration: underline;
      text-decoration-color: rgba(242, 127, 13, 0.5);
      text-underline-offset: 4px;
    }
  }
}

// Login Button
.login-btn {
  margin-top: 8px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  height: 56px;
  border-radius: 9999px;
  background: rgba(0, 0, 0, 1);
  border: 2px solid $primary;
  color: $primary;
  font-weight: 700;
  font-size: 18px;
  letter-spacing: 0.05em;
  cursor: pointer;
  box-shadow: 0 0 20px rgba(242, 127, 13, 0.25);
  transition: all 0.3s ease;
  transform: scale(1);
  min-width: 0;

  @media (max-width: 640px) {
    height: 52px;
    font-size: 16px;
    margin-top: 4px;
  }

  &:hover {
    background: $primary;
    color: $text;
    border-color: $primary;
    box-shadow: 0 0 30px rgba(242, 127, 13, 0.6);
  }

  &:active {
    transform: scale(0.95);
  }
}

// Biometric Auth
.biometric-auth {
  margin: 16px 0;

  @media (max-width: 640px) {
    margin: 12px 0;
  }
}

.biometric-btn {
  width: 100%;
  height: 56px;
  border-radius: 9999px;
  background: rgba(0, 0, 0, 0.6);
  border: 2px solid rgba(242, 127, 13, 0.5);
  color: $primary;
  font-weight: 500;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.3s ease;

  @media (max-width: 640px) {
    height: 52px;
    font-size: 14px;
    gap: 8px;
  }

  &:hover:not(:disabled) {
    background: rgba(242, 127, 13, 0.1);
    border-color: rgba(242, 127, 13, 0.7);
    box-shadow: 0 0 20px rgba(242, 127, 13, 0.3);
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .material-symbols-outlined {
    font-size: 20px;

    @media (max-width: 640px) {
      font-size: 18px;
    }
  }
}

// Social Divider
.social-divider {
  position: relative;
  display: flex;
  align-items: center;
  padding: 8px 0;

  @media (max-width: 640px) {
    padding: 6px 0;
  }

  &__line {
    flex-grow: 1;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  &__text {
    flex-shrink: 0;
    margin: 0 16px;
    color: rgba(255, 255, 255, 0.5);
    font-size: 14px;

    @media (max-width: 640px) {
      margin: 0 12px;
      font-size: 13px;
    }
  }
}

// Social Buttons
.social-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.social-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.3);

  @media (max-width: 640px) {
    width: 52px;
    height: 52px;
  }

  &:hover {
    border-color: $primary;
    color: $text;
    box-shadow: 0 0 15px rgba(242, 127, 13, 0.4);
  }

  &__icon {
    width: 24px;
    height: 24px;
    fill: currentColor;

    @media (max-width: 640px) {
      width: 22px;
      height: 22px;
    }
  }
}

// Footer (now inside card)
.login__footer {
  text-align: right;
  width: auto;
  margin: 0;
  padding: 0;
  direction: rtl;

  p {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.4);
    margin: 0;
    line-height: 1.4;
    text-align: right;

    @media (max-width: 640px) {
      font-size: 12px;
      line-height: 1.3;
    }

    a {
      color: $text;
      font-weight: 700;
      text-decoration: none;
      transition: all 0.2s ease;

      &:hover {
        color: $primary;
        text-shadow: 0 0 10px rgba(242, 127, 13, 0.4);
      }
    }
  }
}

// Blocked Message
.blocked-message {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(239, 68, 68, 0.15);
  border: 2px solid rgba(239, 68, 68, 0.5);
  color: #ef4444;
  font-weight: 500;
  font-size: 14px;
  margin-bottom: 16px;
  text-align: right;

  .material-symbols-outlined {
    font-size: 18px;
    flex-shrink: 0;
  }
}

// Responsive
@media (max-width: 640px) {
  .login__wrap {
    padding: 20px 16px;
    padding-top: max(env(safe-area-inset-top, 24px), 24px);
    padding-bottom: max(env(safe-area-inset-bottom, 24px), 24px);
  }

  .login__card {
    margin-bottom: 20px;
  }

  .login__footer {
    margin-bottom: 20px;
  }
}

@media (max-width: 520px) {
  .login__wrap {
    padding: 16px 14px;
    padding-top: max(env(safe-area-inset-top, 20px), 20px);
    padding-bottom: max(env(safe-area-inset-bottom, 20px), 20px);
  }

  .login__logoContainer {
    width: 88px;
    height: 88px;
    margin-bottom: 10px;
  }

  .login__title {
    font-size: clamp(26px, 7vw, 30px);
  }

  .login__subtitle {
    font-size: clamp(13px, 3.5vw, 15px);
  }

  .login__card {
    padding: 18px 16px;
    gap: 18px;
    margin-bottom: 18px;
  }

  .login__form {
    gap: 14px;
  }

  .login-btn {
    height: 50px;
    font-size: 15px;
  }

  .input-wrapper {
    height: 50px;
  }

  .login__footer {
    margin-bottom: 18px;
  }
}

@media (max-width: 420px) {
  .login__wrap {
    padding: 14px 12px;
    padding-top: max(env(safe-area-inset-top, 16px), 16px);
    padding-bottom: max(env(safe-area-inset-bottom, 16px), 16px);
  }

  .login__logoContainer {
    width: 80px;
    height: 80px;
    margin-bottom: 8px;
  }

  .login__title {
    font-size: clamp(24px, 6.5vw, 28px);
  }

  .login__subtitle {
    font-size: clamp(12px, 3vw, 14px);
  }

  .login__card {
    padding: 16px 14px;
    gap: 16px;
    border-radius: 18px;
    margin-bottom: 16px;
  }

  .login__form {
    gap: 12px;
  }

  .login-btn {
    height: 48px;
    font-size: 14px;
  }

  .input-wrapper {
    height: 48px;
  }

  .input-icon--leading {
    width: 40px;
    padding-right: 10px;
  }

  .input-icon .material-symbols-outlined {
    font-size: 20px;
  }

  .input-icon--trailing .material-symbols-outlined {
    font-size: 16px;
  }

  .biometric-btn {
    height: 48px;
    font-size: 12px;
  }

  .social-btn {
    width: 48px;
    height: 48px;
  }

  .social-btn__icon {
    width: 20px;
    height: 20px;
  }

  .login__footer {
    margin-bottom: 16px;
  }

  .login__hero {
    padding-top: 16px;
  }
}
</style>
