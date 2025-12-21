<template>
  <div class="login-page">
    <div class="login-wrapper">
      <!-- צד שמאל - טקסטים מעוצבים -->
      <div class="login-sidebar">
        <div class="sidebar-content">
          <div class="logo-circle-large">H</div>
          <h1 class="sidebar-title">Hendiman</h1>
          <div class="tagline-box">
            <p class="tagline-main">תיקונים קטנים</p>
            <p class="tagline-sub">פתרונות גדולים</p>
          </div>
          <div class="features-list">
            <div class="feature-item">
              <span class="feature-icon">⚡</span>
              <span>הזמנה מהירה ונוחה</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">🔒</span>
              <span>תשלום מאובטח</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">⭐</span>
              <span>הנדימנים מאומתים</span>
            </div>
          </div>
        </div>
      </div>

      <!-- צד ימין - טופס -->
      <div class="login-form-section">
        <div class="login-card">
          <!-- קישור למובייל - מופיע רק במובייל -->
          <p class="register-link register-link--mobile">
            עדיין לא רשום?
            <a href="#" @click.prevent="goToRegister">הרשם כאן</a>
          </p>

          <form @submit.prevent="handleLogin" class="login-form">
            <div class="input-group">
              <label for="username">שם משתמש</label>
              <input
                id="username"
                v-model="username"
                type="text"
                placeholder="הכנס שם משתמש"
                required
              />
            </div>

            <div class="input-group password-input-group">
              <label for="password">סיסמה</label>
              <div v-if="!ifGoogleUser" class="password-input-wrapper">
                <input
                  id="password"
                  v-model="password"
                  placeholder="הכנס סיסמה"
                  required
                  :type="showPassword ? 'text' : 'password'"
                />
                <button
                  type="button"
                  class="show-password-button"
                  @click="showPassword = !showPassword"
                  :aria-label="showPassword ? 'הסתר סיסמה' : 'הראה סיסמה'"
                >
                  <font-awesome-icon
                    :icon="showPassword ? ['fas', 'eye-slash'] : ['fas', 'eye']"
                  />
                </button>
              </div>
              <input
                v-else
                id="password"
                v-model="password"
                type="email"
                placeholder="הכנס כתובת מייל"
                required
              />
            </div>

            <button type="submit" class="login-button">התחבר</button>
          </form>

          <div class="divider">
            <span>או</span>
          </div>

          <div class="social-login">
            <button class="social-button google" @click="ConenectWithGoogle">
              <img src="@/assets/Google.png" alt="Google" />
              התחבר עם Google
            </button>
            <button
              class="social-button facebook"
              @click="ConenectWithFacebook"
            >
              <img src="@/assets/FaceBook.png" alt="Facebook" />
              התחבר עם Facebook
            </button>
          </div>

          <!-- קישור למחשב - מופיע רק במחשב -->
          <p class="register-link register-link--desktop">
            עדיין לא רשום?
            <a href="#" @click.prevent="goToRegister">הרשם כאן</a>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { URL } from "@/Url/url";
import { useToast } from "@/composables/useToast";

export default {
  name: "logIn",
  data() {
    return {
      username: "",
      password: "",
      email: "",
      ifGoogleUser: false,
      toast: null,
      showPassword: false,
    };
  },
  created() {
    this.toast = useToast();
    // Check if returning from Google OAuth
    this.handleGoogleCallback();
  },
  watch: {
    // Watch for route changes (in case user navigates to login with params)
    "$route.query": {
      handler() {
        // Wait for toast to be initialized
        if (this.toast) {
          this.handleGoogleCallback();
        }
      },
    },
  },
  methods: {
    async handleGoogleCallback() {
      // Make sure toast is initialized
      if (!this.toast) {
        this.toast = useToast();
      }

      // Check both route query and URL params
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
            const user = JSON.parse(decodeURIComponent(userData));
            this.toast.showSuccess("התחברות עם Google בוצעה בהצלחה!");
            // כאן תוכל לשמור את המשתמש ב-store או לעשות redirect
            // this.$router.push({ name: "home" });
            // Clean URL - remove query params
            // this.$router.replace({ path: this.$route.path });
            this.username = user.username;
            this.password = user.email; // For Google users, password field contains email
            this.ifGoogleUser = true;
            this.googleId = user.googleId; // Store googleId for login
            // Call handleLogin to get the password (googleId) from server
            await this.handleLogin();
          } catch (error) {
            if (this.toast) {
              this.toast.showError("שגיאה בעיבוד נתוני המשתמש");
            }
          }
        }
      }
    },
    async handleLogin() {
      try {
        // כאן תוכל להוסיף את לוגיקת ההתחברות
        // eslint-disable-next-line no-undef
        const { data } = await axios.post(`${URL}/login-user`, {
          username: this.username,
          password: this.password, // For Google users, password contains email initially, then replaced with googleId
          ifGoogleUser: this.ifGoogleUser,
          googleId: this.googleId, // Send googleId for more reliable lookup
        });

        if (data.message === "Success") {
          this.toast.showSuccess("התחברות בוצעה בהצלחה");
          // If Google user, update the password field with the googleId received from server
          if (this.ifGoogleUser && data.password) {
            this.password = data.password;
          }
          if (data.user && data.user._id) {
            this.$router.push({
              name: "Dashboard",
              params: { id: data.user._id },
            });
          }
        } else if (data.message === "NoUser") {
          this.toast.showError("שם משתמש לא נכון");
        } else if (data.message === "NoPass") {
          this.toast.showError("סיסמה לא נכונה");
        } else if (data.message === "NoEmail") {
          this.toast.showError("מייל לא נכון");
        }
      } catch (error) {
        console.error("Login error:", error);
        const errorMessage =
          error.response?.data?.message || error.message || "שגיאה בהתחברות";
        this.toast.showError(errorMessage);

        // אם זו שגיאת רשת, נסה להציג הודעה יותר מפורטת
        if (
          error.code === "ECONNREFUSED" ||
          error.message?.includes("Network")
        ) {
          console.error("Network error - URL:", URL);
          this.toast.showError("לא ניתן להתחבר לשרת. אנא ודא שהשרת רץ");
        }
      }
    },
    ConenectWithGoogle() {
      // Redirect to Google OAuth with source parameter
      window.location.href = `${URL}/auth/google?source=login`;
    },
    goToRegister() {
      this.$router.push({ name: "Register" });
    },
  },
};
</script>

<style lang="scss" scoped>
.fas {
  font-size: 1.2rem;
  color: #f97316;
}
.fas.fa-eye {
  font-size: 1.2rem;
  color: #f97316;
}
.fas.fa-eye-slash {
  font-size: 1.2rem;
  color: #f97316;
}

.show-password-button {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 6px;
  margin: 0;
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  width: 32px;
  height: 32px;

  svg,
  font-awesome-icon {
    width: 20px;
    height: 20px;
    font-size: 20px;
  }

  &:hover {
    color: #f97316;
    background: rgba(249, 115, 22, 0.1);
  }

  &:active {
    transform: translateY(-50%) scale(0.95);
  }

  &:focus {
    outline: 2px solid #f97316;
    outline-offset: 2px;
  }
}

.login-page {
  font-family: "Heebo", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%);
  padding: 20px;
}

.login-wrapper {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: calc(100vh - 40px);
  max-width: 1400px;
  margin: 0 auto;
  gap: 40px;
  align-items: center;
}

/* צד שמאל - טקסטים מעוצבים */
.login-sidebar {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  direction: rtl;
}

.sidebar-content {
  width: 100%;
  max-width: 500px;
  animation: fadeInLeft 0.6s ease-out;
}

@keyframes fadeInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.logo-circle-large {
  width: 80px;
  height: 80px;
  border-radius: 999px;
  background: #f97316;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000000;
  font-weight: 700;
  font-size: 40px;
  margin: 0 auto 30px;
  box-shadow: 0 8px 24px rgba(249, 115, 22, 0.4);
}

.sidebar-title {
  color: #f97316;
  font-size: 3rem;
  font-weight: bold;
  text-align: center;
  margin: 0 0 40px 0;
  text-shadow: 0 0 20px rgba(249, 115, 22, 0.5);
  letter-spacing: 2px;
}

.tagline-box {
  background: #111111;
  border: 2px solid #f97316;
  border-radius: 16px;
  padding: 30px;
  margin-bottom: 40px;
  text-align: center;
  box-shadow: 0 8px 24px rgba(249, 115, 22, 0.2);
}

.tagline-main {
  color: #f97316;
  font-size: 2rem;
  font-weight: bold;
  margin: 0 0 10px 0;
  text-shadow: 0 0 15px rgba(249, 115, 22, 0.4);
}

.tagline-sub {
  color: #ffffff;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  opacity: 0.9;
}

.features-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 15px;
  background: #111111;
  border: 1px solid #2d2d2d;
  border-radius: 12px;
  padding: 16px 20px;
  color: #ffffff;
  font-size: 1.1rem;
  transition: all 0.3s ease;

  &:hover {
    border-color: #f97316;
    background: #1a1a1a;
    transform: translateX(-5px);
  }
}

.feature-icon {
  font-size: 1.5rem;
  filter: drop-shadow(0 0 8px rgba(249, 115, 22, 0.6));
}

/* צד ימין - טופס */
.login-form-section {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.login-card {
  background: #111111;
  border: 2px solid #f97316;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 8px 32px rgba(249, 115, 22, 0.2);
  animation: slideIn 0.5s ease-out;
  width: 100%;
  max-width: 420px;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.logo-circle {
  width: 50px;
  height: 50px;
  border-radius: 999px;
  background: #f97316;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000000;
  font-weight: 700;
  font-size: 24px;
  margin: 0 auto 20px;
}

.login-title {
  color: #f97316;
  font-size: 2rem;
  font-weight: bold;
  text-align: center;
  margin: 0 0 8px 0;
}

.login-subtitle {
  color: #9ca3af;
  text-align: center;
  margin: 0 0 30px 0;
  font-size: 0.95rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;

  label {
    color: #f97316;
    font-weight: 600;
    font-size: 0.9rem;
    text-align: right;
  }

  input {
    background: #1f1f1f;
    border: 2px solid #2d2d2d;
    border-radius: 8px;
    padding: 14px 16px;
    color: #ffffff;
    font-size: 1rem;
    transition: all 0.3s ease;
    text-align: right;
    direction: rtl;
    width: 100%;
    box-sizing: border-box;
    max-width: 100%;

    &::placeholder {
      color: #666;
    }

    &:focus {
      outline: none;
      border-color: #f97316;
      box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
      background: #2a2a2a;
    }

    &:hover {
      border-color: #f97316;
    }
  }
}

.password-input-group {
  .password-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .password-input-wrapper input {
    padding-left: 45px;
  }
}

.login-button {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  color: #000000;
  border: none;
  border-radius: 8px;
  padding: 16px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 10px;
  box-shadow: 0 4px 15px rgba(249, 115, 22, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(249, 115, 22, 0.4);
    background: linear-gradient(135deg, #ea580c 0%, #f97316 100%);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 10px rgba(249, 115, 22, 0.3);
  }
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 24px 0;
  color: #9ca3af;
  font-size: 0.9rem;

  &::before,
  &::after {
    content: "";
    flex: 1;
    border-bottom: 1px solid #2d2d2d;
  }

  span {
    padding: 0 12px;
  }
}

.social-login {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.social-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: #1f1f1f;
  border: 2px solid #2d2d2d;
  border-radius: 8px;
  padding: 12px 16px;
  color: #ffffff;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  img {
    width: 26px;
    height: 26px;
    border-radius: 6px;
    object-fit: cover;
  }

  &:hover {
    border-color: #f97316;
    background: #2a2a2a;
  }

  &:active {
    transform: scale(0.98);
  }
}

.register-link {
  text-align: center;
  margin-top: 24px;
  color: #9ca3af;
  font-size: 0.9rem;

  a {
    color: #f97316;
    text-decoration: none;
    font-weight: 600;

    &:hover {
      text-decoration: underline;
    }
  }
}

/* קישור למעלה - מופיע רק במובייל */
.register-link--mobile {
  display: none;
  margin-top: 0;
  margin-bottom: 24px;
}

/* קישור למטה - מופיע רק במחשב */
.register-link--desktop {
  display: block;
}

@media (max-width: 1024px) {
  .login-wrapper {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  /* הסתר את ה-sidebar במובייל */
  .login-sidebar {
    display: none;
  }

  /* הצג את הקישור למעלה במובייל */
  .register-link--mobile {
    display: block;
  }

  /* הסתר את הקישור למטה במובייל */
  .register-link--desktop {
    display: none;
  }
}

@media (max-width: 480px) {
  .login-card {
    padding: 30px 20px;
  }

  .login-title {
    font-size: 1.75rem;
  }

  .logo-circle-large {
    width: 60px;
    height: 60px;
    font-size: 30px;
  }

  .sidebar-title {
    font-size: 2rem;
  }

  .tagline-box {
    padding: 20px;
  }

  .tagline-main {
    font-size: 1.3rem;
  }

  .tagline-sub {
    font-size: 1rem;
  }
}
</style>
