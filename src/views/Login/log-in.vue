<template>
  <div class="login" dir="rtl">
    <!-- Background Effects -->
    <div class="login__noise-overlay"></div>
    <div class="login__radial-gradient"></div>

    <!-- Main Content -->
    <main class="login__main">
      <!-- Top Section with H Logo -->
      <div class="login__top-section">
        <div class="login__logo-letter">H</div>
        <h1 class="login__title">התחברות</h1>
        <p class="login__tagline">כוח בידיים שלך</p>
      </div>
    </main>

    <!-- Form Section -->
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
          <div class="input-wrapper">
            <div class="input-icon-wrapper">
              <span class="material-icons-round">bolt</span>
            </div>
            <input
              id="email"
              v-model="username"
              class="input-field"
              type="text"
              placeholder="אימייל או נייד"
              required
              autocomplete="off"
              autocapitalize="off"
              autocorrect="off"
              spellcheck="false"
              @compositionend="onUsernameCompositionEnd"
              @blur="onUsernameBlur"
            />
          </div>
        </div>

        <!-- Password Input -->
        <div class="input-group">
          <div class="input-wrapper">
            <div class="input-icon-wrapper">
              <span class="material-icons-round">lock_outline</span>
            </div>
            <input
              v-if="!ifGoogleUser && !ifFacebookUser"
              id="password"
              v-model="password"
              class="input-field"
              :type="showPassword ? 'text' : 'password'"
              placeholder="סיסמה"
              required
              autocomplete="off"
              autocapitalize="off"
              autocorrect="off"
              spellcheck="false"
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
              autocomplete="off"
              readonly
            />
            <button
              v-if="!ifGoogleUser && !ifFacebookUser"
              type="button"
              class="input-toggle-password"
              @click="showPassword = !showPassword"
              :aria-label="showPassword ? 'הסתר סיסמה' : 'הראה סיסמה'"
            >
              <span class="material-icons-round">{{
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
          כניסה לאזור אישי
        </button>
      </form>

      <!-- Biometric Authentication - Only on Native App (not web) -->
      <div
        v-if="isNativeApp && hasBiometricCredentials"
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
        <div class="social-divider__line social-divider__line--left"></div>
        <span class="social-divider__text">או התחבר דרך</span>
        <div class="social-divider__line social-divider__line--right"></div>
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

        <!-- Biometric (only in native app) -->
        <button
          v-if="isNativeApp && hasBiometricCredentials"
          type="button"
          class="social-btn social-btn--biometric"
          @click="handleBiometricLogin"
          :disabled="biometricLoading"
        >
          <span class="material-symbols-outlined social-btn__icon--biometric">fingerprint</span>
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
  </div>
</template>

<script>
import axios from "axios";
import { URL } from "@/Url/url";
import { useToast } from "@/composables/useToast";
import { Capacitor } from "@capacitor/core";
import {
  startRegistration,
  startAuthentication,
} from "@simplewebauthn/browser";

// Conditional imports for native-only plugins
// Using dynamic imports to avoid build errors when plugins aren't installed
let Preferences = null;
let Biometric = null;

// Helper function to load native plugins dynamically at runtime
// This prevents webpack from trying to bundle them during build
const loadNativePlugins = async () => {
  if (typeof window === "undefined" || !Capacitor.isNativePlatform()) {
    return;
  }
  
  try {
    // Load Preferences plugin using dynamic import
    if (!Preferences) {
      try {
        const PrefsModule = await import(/* webpackIgnore: true */ "@capacitor/preferences");
        Preferences = PrefsModule.Preferences;
      } catch (e) {
        // Plugin not available - will handle gracefully
        console.log("Preferences plugin not available");
      }
    }
    
    // Try to load biometric plugin - it might not exist
    // If it doesn't exist, we'll use WebAuthn as fallback
    if (!Biometric) {
      try {
        const BiometricModule = await import(/* webpackIgnore: true */ "@capacitor-community/biometric");
        Biometric = BiometricModule.Biometric;
      } catch (e) {
        // Plugin not installed or not available - will use WebAuthn
        console.log("Biometric plugin not available, will use WebAuthn fallback");
      }
    }
  } catch (error) {
    // Silently fail - plugins will be null and code will handle it gracefully
    console.log("Native plugins check failed:", error.message);
  }
};

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
      isNativeApp: false,
      hasBiometricCredentials: false,
      biometricLoading: false,
      currentUserId: null,
      // For Android IME handling
      lastUsernameValue: "",
    };
  },
  async created() {
    this.toast = useToast();
    this.checkIfMobile();
    this.handleGoogleCallback();
    this.handleFacebookCallback();
    
    // Check for saved biometric credentials in native app
    if (Capacitor.isNativePlatform()) {
      await this.checkNativeBiometricSupport();
    }
    
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
      // Check if running in Capacitor app (Android/iOS)
      const isNative = Capacitor.isNativePlatform();
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isMobileDevice =
        /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          userAgent
        );
      this.isMobile = isNative || isMobileDevice;
      // Only set isNativeApp to true if actually running in native app (not web)
      this.isNativeApp = isNative;
    },

    // Handle Android IME composition end event
    onUsernameCompositionEnd(event) {
      // When IME composition ends, ensure the value is captured
      this.username = event.target.value;
      this.lastUsernameValue = this.username;
    },

    // Handle blur event to preserve username value
    onUsernameBlur(event) {
      // On Android, when moving to password field, the value might get truncated
      // This ensures we keep the correct value
      const currentValue = event.target.value;
      if (currentValue && currentValue.length > 0) {
        this.username = currentValue;
        this.lastUsernameValue = currentValue;
      } else if (this.lastUsernameValue) {
        // If the value was cleared incorrectly, restore it
        this.username = this.lastUsernameValue;
        event.target.value = this.lastUsernameValue;
      }
    },

    async checkNativeBiometricSupport() {
      // Check if native biometric is available
      try {
        if (!Capacitor.isNativePlatform()) {
          this.hasBiometricCredentials = false;
          return;
        }

        // Load plugins if not already loaded
        if (!Preferences || !Biometric) {
          await loadNativePlugins();
        }

        if (!Biometric || !Preferences) {
          console.log('[checkNativeBiometricSupport] Biometric or Preferences plugin not available');
          this.hasBiometricCredentials = false;
          return;
        }

        // Check if we have saved credentials first (before checking biometry)
        const savedUsername = await Preferences.get({ key: 'biometric_username' });
        const savedUserId = await Preferences.get({ key: 'biometric_userId' });

        if (!savedUsername.value || !savedUserId.value) {
          console.log('[checkNativeBiometricSupport] No saved credentials found');
          this.hasBiometricCredentials = false;
          return;
        }

        // Now check if biometric is available
        const available = await Biometric.checkBiometry({
          reason: 'אנא זהה את עצמך',
          title: 'אימות ביומטרי',
          subtitle: 'השתמש בטביעת אצבע להתחברות',
          description: 'אנא השתמש בטביעת האצבע שלך כדי להתחבר',
        });

        console.log('[checkNativeBiometricSupport] Biometric available:', available.isAvailable);

        this.hasBiometricCredentials = available.isAvailable;
        
        if (this.hasBiometricCredentials) {
          // Auto-fill username if available
          this.username = savedUsername.value;
          console.log('[checkNativeBiometricSupport] Biometric credentials found, button will be shown');
        }
      } catch (error) {
        console.error('[checkNativeBiometricSupport] Error:', error);
        this.hasBiometricCredentials = false;
      }
    },

    async checkBiometricCredentials() {
      // Only check for biometric in native apps, not in web
      if (!this.isNativeApp || !this.currentUserId) {
        this.hasBiometricCredentials = false;
        return;
      }

      // For native apps only, use Capacitor Biometric
      await this.checkNativeBiometricSupport();
    },

    async handleBiometricLogin() {
      // For native apps, use Capacitor Biometric
      if (Capacitor.isNativePlatform()) {
        await this.handleNativeBiometricLogin();
        return;
      }

      // For web, use WebAuthn
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
        // In Capacitor app, WebAuthn should work if browser supports it
        // Android WebView supports WebAuthn in recent versions
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
        } else if (error.name === "NotSupportedError") {
          this.toast?.showError("המכשיר שלך לא תומך בטביעת אצבע");
        } else if (error.response?.status === 500 || error.response?.status === 400) {
          const errorMessage =
            error.response?.data?.message ||
            "שגיאה בשרת, אנא נסה שוב";
          this.toast?.showError(errorMessage);
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

    async handleNativeBiometricLogin() {
      // Load plugins if not already loaded
      if (!Preferences || !Biometric) {
        await loadNativePlugins();
      }

      if (!Preferences || !Biometric) {
        this.toast?.showError("טביעת אצבע לא זמינה במכשיר זה");
        return;
      }

      this.biometricLoading = true;

      try {
        // Get saved username and userId
        const savedUsername = await Preferences.get({ key: 'biometric_username' });
        const savedUserId = await Preferences.get({ key: 'biometric_userId' });

        if (!savedUsername.value || !savedUserId.value) {
          this.toast?.showError("לא נמצאו פרטי התחברות שמורים");
          this.biometricLoading = false;
          return;
        }

        // Authenticate with biometric
        const result = await Biometric.authenticate({
          reason: 'אנא זהה את עצמך להתחברות',
          title: 'אימות ביומטרי',
          subtitle: 'התחברות מהירה',
          description: 'השתמש בטביעת האצבע שלך כדי להתחבר',
          negativeButtonText: 'ביטול',
        });

        if (!result.succeeded) {
          this.toast?.showError("האימות בוטל");
          this.biometricLoading = false;
          return;
        }

        // Use saved credentials to login
        const username = savedUsername.value;
        const userId = savedUserId.value;
        const savedPassword = await Preferences.get({ key: 'biometric_password' });

        if (!savedPassword.value) {
          // No saved password, user needs to login normally first
          this.toast?.showError("אנא התחבר פעם אחת עם שם משתמש וסיסמה כדי להפעיל טביעת אצבע");
          await Preferences.remove({ key: 'biometric_username' });
          await Preferences.remove({ key: 'biometric_userId' });
          this.hasBiometricCredentials = false;
          return;
        }

        // Login with saved credentials
        try {
          const { data } = await axios.post(`${URL}/login-user`, {
            username: username,
            password: savedPassword.value,
          });

          if (data.message === "Success" && data.user) {
            this.toast.showSuccess("התחברות עם טביעת אצבע בוצעה בהצלחה");
            
            // Update saved password if changed
            if (data.password) {
              await Preferences.set({ 
                key: 'biometric_password', 
                value: data.password 
              });
            }
            
            // Save auth token if provided
            if (data.token) {
              await Preferences.set({ 
                key: 'auth_token', 
                value: data.token 
              });
            }
            
            this.$router.push({
              name: "Dashboard",
              params: { id: data.user._id },
            });
          } else {
            // Login failed, clear saved credentials
            await Preferences.remove({ key: 'biometric_username' });
            await Preferences.remove({ key: 'biometric_userId' });
            await Preferences.remove({ key: 'biometric_password' });
            this.hasBiometricCredentials = false;
            this.toast?.showError("שגיאה בהתחברות. אנא התחבר עם שם משתמש וסיסמה");
          }
        } catch (error) {
          // Login failed, clear saved credentials
          await Preferences.remove({ key: 'biometric_username' });
          await Preferences.remove({ key: 'biometric_userId' });
          await Preferences.remove({ key: 'biometric_password' });
          this.hasBiometricCredentials = false;
          this.toast?.showError("שגיאה בהתחברות. אנא התחבר עם שם משתמש וסיסמה");
        }
      } catch (error) {
        if (error.code === 'USER_CANCEL' || error.message?.includes('cancel')) {
          // User cancelled - don't show error
        } else if (error.code === 'BIOMETRIC_NOT_AVAILABLE') {
          this.toast?.showError("טביעת אצבע לא זמינה במכשיר זה");
        } else if (error.code === 'BIOMETRIC_NOT_ENROLLED') {
          this.toast?.showError("לא רשומה טביעת אצבע במכשיר. אנא הוסף טביעת אצבע בהגדרות המכשיר");
        } else {
          this.toast?.showError("שגיאה באימות טביעת אצבע. נסה שוב");
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
            
            // Save credentials for biometric login in native app only (not web)
            // Do this in background without blocking the navigation
            if (this.isNativeApp) {
              // Run async without awaiting to not block navigation
              (async () => {
                try {
                  // Load plugins if not already loaded
                  if (!Preferences || !Biometric) {
                    await loadNativePlugins();
                  }

                  if (!Biometric || !Preferences) {
                    return; // Plugins not available
                  }

                  // Check if biometric is available
                  const available = await Biometric.checkBiometry({
                    reason: 'שמירת פרטי התחברות',
                    title: 'אימות ביומטרי',
                    subtitle: 'הפעלת התחברות מהירה',
                    description: 'האם תרצה להפעיל התחברות מהירה עם טביעת אצבע?',
                  });

                  if (available.isAvailable && !this.ifGoogleUser && !this.ifFacebookUser) {
                    // Save username and userId for biometric login
                    await Preferences.set({ 
                      key: 'biometric_username', 
                      value: this.username 
                    });
                    await Preferences.set({ 
                      key: 'biometric_userId', 
                      value: data.user._id 
                    });
                    
                    // Save password securely (encrypted by Capacitor Preferences)
                    // We'll use this for future biometric logins
                    await Preferences.set({ 
                      key: 'biometric_password', 
                      value: this.password 
                    });
                    
                    // Save auth token if provided by server
                    if (data.token) {
                      await Preferences.set({ 
                        key: 'auth_token', 
                        value: data.token 
                      });
                    }
                    
                    this.hasBiometricCredentials = true;
                  }
                } catch (error) {
                  // Silently fail - biometric not available or user declined
                  console.log('Biometric setup failed:', error);
                }
              })();
            }
            
            // Navigate immediately without waiting for biometric setup
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
// Color Variables - Dark Mode Only
$primary: #F27C0E;
$primary-hover: #D96B00;
$background-dark: #0F0C08;
$surface-dark: #161616;
$input-dark: #050505;
$text-primary: rgba(255, 255, 255, 0.92);
$text-muted: rgba(255, 255, 255, 0.4);
$text-secondary: rgba(255, 255, 255, 0.6);
$border-color: rgba(255, 255, 255, 0.1);

// Fonts
$font-display: "Heebo", "Noto Sans Hebrew", sans-serif;

.login {
  min-height: max(884px, 100dvh);
  position: relative;
  width: 100%;
  max-width: 100vw;
  padding: 0;
  margin: 0;
  font-family: $font-display;
  overflow-x: hidden;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  background: $background-dark;
  color: $text-primary;
  box-sizing: border-box;
  transition: background-color 0.3s;
}

// Background Effects
.login__noise-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: 0.3;
  z-index: 0;
  background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuALvVpouoeckKl4c6gg4_4XnyhstIYTdZiGw_aBPhK0qgnfUbwW19DDj8yFVBIHq9e9e8YE-JspZN8tGYP1m_S0tbN1nK3BtP7mgnwR00gc7O5NCFO_WdkY144h-krP86_LJjFkjdsW9ZTvBJrQWGLVU8RSSRQD4oIs6C_rbSvKIyHC4eixoPJm6Bg0LJqkk6Ce7HJnmGUDNhBnR92mRwzJwWk3Prx7AOBSb-LpY6qdDhfXVa4udxx3of8c6pERxZnGTnGNm0yms8o');
  mix-blend-mode: overlay;
}

.login__radial-gradient {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  opacity: 0.2;
  background: radial-gradient(circle at 50% 30%, $primary, transparent 60%);
}

// Main Content Area
.login__main {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  width: 100%;
  max-width: 448px;
  margin: 0 auto;
  padding: 48px 24px 0;
  padding-top: max(env(safe-area-inset-top, 48px), 48px);
  box-sizing: border-box;
}

// Top Section with H Logo
.login__top-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 40px;
  margin-bottom: auto;
  text-align: center;
  gap: 8px;
}

.login__logo-letter {
  font-size: 120px;
  font-weight: 900;
  line-height: 1;
  color: $primary;
  text-shadow: 0 0 20px rgba(242, 124, 14, 0.5);
  user-select: none;
  
  @media (max-width: 640px) {
    font-size: 100px;
  }
}

.login__title {
  font-size: 36px;
  font-weight: 900;
  color: $text-primary;
  text-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
  letter-spacing: 0.05em;
  margin: 0;
  
  @media (max-width: 640px) {
    font-size: 32px;
  }
}

.login__tagline {
  font-size: 18px;
  font-weight: 500;
  color: $primary;
  letter-spacing: 0.05em;
  opacity: 0.9;
  margin: 0;
  
  @media (max-width: 640px) {
    font-size: 16px;
  }
}

// Bottom Section with Form
.login__bottom-section {
  position: relative;
  z-index: 20;
  width: 100%;
  max-width: 448px;
  margin: 0 auto;
  background: $surface-dark;
  border-radius: 35px 35px 0 0;
  padding: 32px;
  padding-bottom: max(env(safe-area-inset-bottom, 40px), 40px);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.5);
  border-top: 1px solid $border-color;
  transition: background-color 0.3s;
  box-sizing: border-box;
  margin-top: auto;

  @media (max-width: 640px) {
    padding: 24px 20px;
    padding-bottom: max(env(safe-area-inset-bottom, 32px), 32px);
    border-radius: 28px 28px 0 0;
  }

  @media (max-width: 420px) {
    padding: 20px 16px;
    padding-bottom: max(env(safe-area-inset-bottom, 28px), 28px);
  }
}

// Form
.login__form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;

  @media (max-width: 640px) {
    gap: 18px;
  }
}

// Input Groups
.input-group {
  position: relative;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
}

.input-icon-wrapper {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-right: 16px;
  padding-left: 12px;
  pointer-events: none;
  z-index: 10;
  height: 100%;
  border-left: 1px solid rgba(255, 255, 255, 0.1);

  .material-icons-round {
    font-size: 24px;
    color: $primary;
  }
}

.input-field {
  flex: 1;
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
  display: block;
  padding: 16px;
  padding-right: 64px;
  padding-left: 16px;
  font-size: 16px;
  background: $input-dark;
  border: 1px solid transparent;
  border-radius: 12px;
  color: $text-primary;
  font-family: inherit;
  outline: none;
  text-align: right;
  transition: all 0.2s;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.3);

  &::placeholder {
    color: $text-muted;
  }

  &:focus {
    border-color: $primary;
    box-shadow: 0 0 0 1px $primary, inset 0 1px 2px rgba(0, 0, 0, 0.3);
  }

  &:read-only {
    opacity: 0.7;
    cursor: not-allowed;
  }

  @media (max-width: 640px) {
    font-size: 15px;
    padding: 14px;
    padding-right: 60px;
  }
}

.input-toggle-password {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-left: 16px;
  padding-right: 12px;
  background: transparent;
  border: none;
  color: $text-muted;
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: $text-secondary;
  }

  .material-icons-round {
    font-size: 20px;
  }
}

// Forgot Password Wrapper
.forgot-password-wrapper {
  display: flex;
  justify-content: flex-end;
  align-items: center;

  @media (max-width: 640px) {
    justify-content: flex-start;
  }
}

.forgot-password-link {
  font-size: 14px;
  font-weight: 500;
  color: $text-muted;
  text-decoration: none;
  transition: color 0.2s;

  &:hover {
    color: $primary;
  }

  @media (max-width: 640px) {
    font-size: 13px;
  }
}

// Login Button
.login-btn {
  width: 100%;
  padding: 16px 24px;
  border-radius: 9999px;
  border: 2px solid $primary;
  background: transparent;
  color: $primary;
  font-weight: 700;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 0 15px rgba(242, 124, 14, 0.15);
  margin-top: 16px;

  &:hover {
    background: $primary;
    color: $background-dark;
    box-shadow: 0 0 25px rgba(242, 124, 14, 0.4);
  }

  &:active {
    transform: scale(0.98);
  }

  @media (max-width: 640px) {
    font-size: 16px;
    padding: 14px 20px;
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
  border: 1px solid $border-color;
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
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 32px;
  opacity: 0.6;

  @media (max-width: 640px) {
    margin-top: 24px;
  }

  &__line {
    flex-grow: 1;
    height: 1px;

    &--left {
      background: linear-gradient(to left, transparent, rgba(255, 255, 255, 0.2));
    }

    &--right {
      background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.2));
    }
  }

  &__text {
    flex-shrink: 0;
    white-space: nowrap;
    padding: 0 8px;
    color: $text-muted;
    font-size: 14px;

    @media (max-width: 640px) {
      font-size: 12px;
      padding: 0 6px;
    }
  }
}

// Social Buttons (keeping existing style, as not shown in new design)
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
  border: 1px solid $border-color;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);

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

    &--biometric {
      font-size: 24px;
      color: $primary;
    }
  }

  &--biometric {
    &:hover {
      background: rgba(242, 124, 14, 0.1);
      border-color: rgba(242, 124, 14, 0.5);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
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
    color: $text-muted;
    margin: 0;
    line-height: 1.5;

    @media (max-width: 640px) {
      font-size: 13px;
    }
  }
}

.login__footer-link {
  font-weight: 700;
  color: $text-primary;
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

  .material-symbols-outlined,
  .material-icons-round {
    font-size: 18px;
    flex-shrink: 0;

    @media (max-width: 640px) {
      font-size: 16px;
    }
  }
}

// Spacer after divider
.login__bottom-section > div:last-child {
  height: 24px;
}

// Additional spacing for biometric button if present
.biometric-auth {
  margin-top: 16px;
  
  @media (max-width: 640px) {
    margin-top: 12px;
  }
}
</style>

