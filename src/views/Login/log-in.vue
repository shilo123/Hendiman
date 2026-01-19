<template>
  <div class="login" dir="rtl">
    <!-- Top Half: Vibrant Orange Gradient -->
    <div class="login__top-section">
      <!-- Abstract pattern overlay for texture -->
      <div class="login__pattern-overlay"></div>
      <div class="login__top-content">
        <!-- Logo Icon -->
        <div class="login__logo-icon">
          <span class="material-symbols-outlined">home_repair_service</span>
        </div>
        <!-- Brand Name -->
        <h1 class="login__brand-name">הנדימן</h1>
        <!-- Tagline -->
        <p class="login__tagline">תיקונים קטנים, פתרונות גדולים</p>
      </div>
    </div>

    <!-- Bottom Half: Dark Charcoal Form Area -->
    <div class="login__bottom-section">
      <!-- Blocked User Message -->
      <div v-if="isBlocked" class="blocked-message">
        <span class="material-symbols-outlined">block</span>
        <span>המשתמש הזה חסום על ידי הנהלת הנדימן</span>
      </div>

      <!-- Login Form -->
      <form class="login__form" @submit.prevent="handleLogin">
        <!-- Email/Mobile Input -->
        <div class="input-group">
          <label class="input-label" for="email">אימייל או נייד</label>
          <div class="input-wrapper">
            <span class="input-icon input-icon--leading">
              <span class="material-symbols-outlined">person</span>
            </span>
            <input
              id="email"
              v-model="username"
              class="input-field"
              type="text"
              placeholder="user@example.com"
              required
              autocomplete="username"
            />
          </div>
        </div>

        <!-- Password Input -->
        <div class="input-group">
          <label class="input-label" for="password">סיסמה</label>
          <div class="input-wrapper">
            <span class="input-icon input-icon--leading">
              <span class="material-symbols-outlined">lock</span>
            </span>
            <input
              v-if="!ifGoogleUser && !ifFacebookUser"
              id="password"
              v-model="password"
              class="input-field"
              :type="showPassword ? 'text' : 'password'"
              placeholder="********"
              required
              autocomplete="current-password"
            />
            <input
              v-else
              id="password"
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

        <!-- Forgot Password Link -->
        <div class="forgot-password-wrapper">
          <a href="#" @click.prevent="handleForgotPassword" class="forgot-password-link">
            שכחת סיסמה?
          </a>
        </div>

        <!-- Main Action Button -->
        <button type="submit" class="login-btn">
          <div class="login-btn__gloss"></div>
          <span class="login-btn__content">
            התחברות
            <span class="material-symbols-outlined">arrow_back</span>
          </span>
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
        <span class="social-divider__text">או התחבר באמצעות</span>
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
          <svg class="social-btn__icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
          </svg>
        </button>

        <!-- Facebook -->
        <button
          type="button"
          class="social-btn"
          @click="ConenectWithFacebook"
        >
          <svg class="social-btn__icon social-btn__icon--facebook" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"></path>
          </svg>
        </button>
      </div>

      <!-- Sign Up Prompt -->
      <div class="login__footer">
        <p>
          עדיין אין לך חשבון?
          <a href="#" @click.prevent="goToRegister" class="login__footer-link">
            הרשמה
          </a>
        </p>
      </div>
    </div>

    <!-- Decorative background element for bottom -->
    <div class="login__bg-decoration"></div>
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
$primary-dark: #cc6300;
$background-light: #f8f7f5;
$background-dark: #1a1a1a;
$surface-dark: #2a2a2a;
$text: rgba(255, 255, 255, 0.92);
$text-muted: rgba(255, 255, 255, 0.62);

// Fonts
$font-display: "Manrope", "Noto Sans Hebrew", sans-serif;

.login {
  min-height: max(884px, 100dvh);
  position: relative;
  width: 100%;
  padding: 0;
  font-family: $font-display;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: $background-light;
  color: $text;
  box-sizing: border-box;
}

// Top Half: Vibrant Orange Gradient
.login__top-section {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 45vh;
  min-height: 300px;
  width: 100%;
  background: linear-gradient(to bottom right, #ff9a3d, $primary, $primary-dark);
  padding: 24px;
  text-align: center;

  @media (max-width: 640px) {
    height: 40vh;
    min-height: 250px;
    padding: 20px 16px;
  }
}

.login__pattern-overlay {
  position: absolute;
  inset: 0;
  opacity: 0.1;
  background-image: url("https://www.transparenttextures.com/patterns/cubes.png");
  mix-blend-mode: overlay;
  pointer-events: none;
}

.login__top-content {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;

  @media (max-width: 640px) {
    gap: 12px;
  }
}

.login__logo-icon {
  display: flex;
  height: 80px;
  width: 80px;
  align-items: center;
  justify-content: center;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);

  @media (max-width: 640px) {
    height: 70px;
    width: 70px;
  }

  .material-symbols-outlined {
    font-size: 48px;
    color: white;

    @media (max-width: 640px) {
      font-size: 40px;
    }
  }
}

.login__brand-name {
  font-size: 48px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: white;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  margin: 0;

  @media (max-width: 640px) {
    font-size: clamp(36px, 10vw, 42px);
  }
}

.login__tagline {
  font-size: 18px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;

  @media (max-width: 640px) {
    font-size: clamp(14px, 4vw, 16px);
  }
}

// Bottom Half: Dark Charcoal Form Area
.login__bottom-section {
  position: relative;
  z-index: 20;
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: flex-start;
  background: $background-dark;
  padding: 32px 24px;
  padding-top: 40px;
  border-radius: 3rem 3rem 0 0;
  margin-top: -32px;
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.3);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;

  @media (max-width: 640px) {
    padding: 24px 20px;
    padding-top: 32px;
    margin-top: -24px;
    border-radius: 2rem 2rem 0 0;
  }

  @media (max-width: 420px) {
    padding: 20px 16px;
    padding-top: 28px;
    margin-top: -20px;
  }
}

// Form
.login__form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  padding-top: 16px;

  @media (max-width: 640px) {
    gap: 18px;
    padding-top: 12px;
  }
}

// Input Groups
.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-label {
  font-size: 14px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.7);
  margin-right: 8px;

  @media (max-width: 640px) {
    font-size: 13px;
  }
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  border-radius: 9999px;
  background: $surface-dark;
  border: 1px solid rgba(255, 255, 255, 0.1);
  height: 56px;
  padding: 0;
  overflow: hidden;
  transition: all 0.3s ease;

  @media (max-width: 640px) {
    height: 52px;
  }

  &:focus-within {
    border-color: $primary;
    box-shadow: 0 0 0 1px $primary;
  }
}

.input-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  flex-shrink: 0;
  transition: color 0.3s ease;

  &--leading {
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: rgba(255, 255, 255, 0.4);
    pointer-events: none;

    .material-symbols-outlined {
      font-size: 20px;
    }
  }

  &--trailing {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    background: transparent;
    border: none;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      color: white;
    }

    .material-symbols-outlined {
      font-size: 20px;
    }
  }
}

.input-wrapper:focus-within .input-icon--leading {
  color: $primary;
}

.input-field {
  flex: 1;
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
  background: transparent;
  border: none;
  color: white;
  padding: 0 16px;
  padding-right: 48px;
  padding-left: 48px;
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

  @media (max-width: 640px) {
    font-size: 15px;
    padding-right: 44px;
    padding-left: 44px;
  }
}

// Forgot Password Wrapper
.forgot-password-wrapper {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: -4px;

  @media (max-width: 640px) {
    margin-top: -2px;
  }
}

.forgot-password-link {
  font-size: 14px;
  font-weight: 600;
  color: $primary;
  text-decoration: none;
  transition: color 0.2s ease;

  @media (max-width: 640px) {
    font-size: 13px;
  }

  &:hover {
    color: #ff9a3d;
  }
}

// Login Button
.login-btn {
  position: relative;
  margin-top: 8px;
  width: 100%;
  box-sizing: border-box;
  height: 56px;
  border-radius: 9999px;
  background: black;
  border: none;
  color: $primary;
  font-weight: 700;
  font-size: 18px;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(242, 127, 13, 0.2);
  transition: all 0.3s ease;
  overflow: hidden;

  @media (max-width: 640px) {
    height: 52px;
    font-size: 16px;
    margin-top: 6px;
  }

  &:hover {
    box-shadow: 0 4px 20px rgba(242, 127, 13, 0.3);
  }

  &:active {
    transform: scale(0.98);
  }
}

.login-btn__gloss {
  position: absolute;
  inset: 0;
  top: 0;
  height: 50%;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.1), transparent);
  opacity: 0.5;
  pointer-events: none;
}

.login-btn__content {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 100%;

  .material-symbols-outlined {
    font-size: 20px;
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
  background: $surface-dark;
  border: 1px solid rgba(255, 255, 255, 0.1);
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
    border-color: rgba(242, 127, 13, 0.5);
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
  padding: 32px 0;

  @media (max-width: 640px) {
    padding: 24px 0;
  }

  &__line {
    flex-grow: 1;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  &__text {
    flex-shrink: 0;
    margin: 0 16px;
    color: rgba(255, 255, 255, 0.5);
    font-size: 12px;
    font-weight: 500;

    @media (max-width: 640px) {
      margin: 0 12px;
      font-size: 11px;
    }
  }
}

// Social Buttons
.social-buttons {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-bottom: 16px;

  @media (max-width: 640px) {
    gap: 20px;
    margin-bottom: 12px;
  }
}

.social-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: $surface-dark;
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

  @media (max-width: 640px) {
    width: 44px;
    height: 44px;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.2);
  }

  &__icon {
    width: 24px;
    height: 24px;

    @media (max-width: 640px) {
      width: 22px;
      height: 22px;
    }

    &--facebook {
      fill: #1877F2;
    }
  }
}

// Footer
.login__footer {
  margin-top: auto;
  padding-top: 16px;
  text-align: center;

  @media (max-width: 640px) {
    padding-top: 12px;
  }

  p {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.4);
    margin: 0;
    line-height: 1.5;

    @media (max-width: 640px) {
      font-size: 13px;
    }
  }
}

.login__footer-link {
  font-weight: 700;
  color: white;
  text-decoration: underline;
  text-decoration-color: $primary;
  text-decoration-thickness: 2px;
  text-underline-offset: 4px;
  transition: color 0.2s ease;

  &:hover {
    color: $primary;
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

  @media (max-width: 640px) {
    font-size: 13px;
    padding: 12px 14px;
  }

  .material-symbols-outlined {
    font-size: 18px;
    flex-shrink: 0;

    @media (max-width: 640px) {
      font-size: 16px;
    }
  }
}

// Decorative background element for bottom
.login__bg-decoration {
  pointer-events: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 128px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.4), transparent);
  z-index: 1;
}
</style>

