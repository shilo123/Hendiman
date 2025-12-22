<template>
  <div class="login" dir="rtl">
    <div class="login__wrap">
      <!-- Desktop/Tablet sidebar -->
      <aside class="login__side">
        <div class="side">
          <div class="side__logo">H</div>
          <h1 class="side__title">Hendiman</h1>

          <div class="side__tag">
            <div class="side__tagMain">תיקונים קטנים</div>
            <div class="side__tagSub">פתרונות גדולים</div>
          </div>

          <div class="side__features">
            <div class="feat">
              <span class="feat__i">⚡</span> הזמנה מהירה ונוחה
            </div>
            <div class="feat"><span class="feat__i">🔒</span> תשלום מאובטח</div>
            <div class="feat">
              <span class="feat__i">⭐</span> הנדימנים מאומתים
            </div>
          </div>
        </div>
      </aside>

      <!-- Form -->
      <main class="login__main">
        <div class="card">
          <!-- Mobile header -->
          <div class="card__mobileHead">
            <div class="card__mobileLogo">H</div>
            <div class="card__mobileText">
              <div class="card__mobileTitle">Hendiman</div>
              <div class="card__mobileSub">תיקונים קטנים · פתרונות גדולים</div>
            </div>
          </div>

          <p class="registerTop">
            עדיין לא רשום?
            <a href="#" @click.prevent="goToRegister">הרשם כאן</a>
          </p>

          <form class="form" @submit.prevent="handleLogin">
            <label class="field">
              <span class="field__label">שם משתמש</span>
              <input
                v-model="username"
                class="field__input"
                type="text"
                placeholder="הכנס שם משתמש"
                required
                autocomplete="username"
              />
            </label>

            <label class="field">
              <span class="field__label">סיסמה</span>

              <div v-if="!ifGoogleUser" class="pass">
                <input
                  v-model="password"
                  class="field__input pass__input"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="הכנס סיסמה"
                  required
                  autocomplete="current-password"
                />
                <button
                  type="button"
                  class="pass__toggle"
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
                v-model="password"
                class="field__input"
                type="text"
                placeholder="סיסמה (Google)"
                required
                autocomplete="current-password"
                readonly
              />
            </label>

            <button type="submit" class="btn btn--primary">התחבר</button>
          </form>

          <!-- forgot password as <a> -->
          <a href="#" class="forgotLink" @click.prevent="handleForgotPassword">
            שכחתי סיסמה
          </a>

          <div class="divider"><span>או</span></div>

          <div class="social">
            <button
              type="button"
              class="social__btn"
              @click="ConenectWithGoogle"
            >
              <img src="@/assets/Google.png" alt="Google" />
              התחבר עם Google
            </button>

            <button
              type="button"
              class="social__btn"
              @click="ConenectWithFacebook"
            >
              <img src="@/assets/FaceBook.png" alt="Facebook" />
              התחבר עם Facebook
            </button>
          </div>

          <p class="registerBottom">
            עדיין לא רשום?
            <a href="#" @click.prevent="goToRegister">הרשם כאן</a>
          </p>
        </div>
      </main>
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
      googleId: null,
    };
  },
  created() {
    this.toast = useToast();
    this.handleGoogleCallback();
  },
  watch: {
    "$route.query": {
      handler() {
        if (this.toast) this.handleGoogleCallback();
      },
    },
  },
  methods: {
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
            const user = JSON.parse(decodeURIComponent(userData));
            this.toast.showSuccess("התחברות עם Google בוצעה בהצלחה!");
            this.username = user.username;
            // השתמש ב-googleId כסיסמה, לא במייל
            this.password = user.googleId || user._id?.toString() || user.email;
            this.googleId = user.googleId;
            await this.handleLogin();
          } catch (error) {
            this.toast?.showError("שגיאה בעיבוד נתוני המשתמש");
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
        });

        if (data.message === "Success") {
          this.toast.showSuccess("התחברות בוצעה בהצלחה");

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
          if (this.ifGoogleUser) {
            this.toast.showError(
              "משתמש Google לא נמצא במערכת. אנא הירשם תחילה."
            );
          } else {
            this.toast.showError("שם משתמש לא נכון");
          }
        } else if (data.message === "NoPass") {
          this.toast.showError("סיסמה לא נכונה");
        } else if (data.message === "NoEmail") {
          this.toast.showError("מייל לא נכון");
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

    // לא היה לך בפונקציה – שמרתי את הקריאה כדי שלא יישבר
    ConenectWithFacebook() {
      // אם יש לך endpoint לפייסבוק תשים פה
      // window.location.href = `${URL}/auth/facebook?source=login`;
      this.toast?.showError("פייסבוק עדיין לא מחובר בצד שרת");
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
$bg1: #0f0f0f;
$bg2: #1a1a1a;
$panel: #111111;
$text: rgba(255, 255, 255, 0.92);
$muted: rgba(255, 255, 255, 0.62);
$orange: #ff6a00;
$orange2: #ff8a2b;

.login {
  min-height: 100vh;
  background: radial-gradient(
      1200px 700px at 50% -100px,
      rgba(255, 106, 0, 0.18),
      transparent 60%
    ),
    linear-gradient(135deg, $bg1 0%, $bg2 100%);
  padding: 16px;
  font-family: "Heebo", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    Arial, sans-serif;
}

.login__wrap {
  max-width: 1200px;
  margin: 0 auto;
  min-height: calc(100vh - 32px);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px;
  align-items: center;
}

.login__side {
  display: flex;
  justify-content: center;
}

.side {
  width: 100%;
  max-width: 520px;
  padding: 18px;
}

.side__logo {
  width: 78px;
  height: 78px;
  border-radius: 999px;
  background: $orange;
  color: #0b0b0f;
  display: grid;
  place-items: center;
  font-weight: 900;
  font-size: 40px;
  margin: 0 auto 18px;
  box-shadow: 0 10px 26px rgba(255, 106, 0, 0.35);
}

.side__title {
  margin: 0 0 18px;
  text-align: center;
  color: $orange;
  font-size: 44px;
  font-weight: 900;
  letter-spacing: 1px;
  text-shadow: 0 0 18px rgba(255, 106, 0, 0.35);
}

.side__tag {
  border: 2px solid rgba(255, 106, 0, 0.85);
  background: rgba(17, 17, 17, 0.9);
  border-radius: 16px;
  padding: 22px;
  text-align: center;
  box-shadow: 0 10px 26px rgba(255, 106, 0, 0.18);
}

.side__tagMain {
  color: $orange;
  font-weight: 900;
  font-size: 30px;
}
.side__tagSub {
  margin-top: 6px;
  color: rgba(255, 255, 255, 0.92);
  font-weight: 800;
  font-size: 20px;
}

.side__features {
  margin-top: 18px;
  display: grid;
  gap: 12px;
}

.feat {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(17, 17, 17, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 14px 16px;
  color: rgba(255, 255, 255, 0.92);
  font-weight: 700;
}
.feat__i {
  font-size: 18px;
  filter: drop-shadow(0 0 8px rgba(255, 106, 0, 0.35));
}

.login__main {
  display: flex;
  justify-content: center;
}

.card {
  width: 100%;
  max-width: 520px; /* הרחבתי! */
  background: rgba(17, 17, 17, 0.92);
  border: 2px solid rgba(255, 106, 0, 0.85);
  border-radius: 18px;
  padding: 22px;
  box-shadow: 0 16px 46px rgba(255, 106, 0, 0.12);
}

.card__mobileHead {
  display: none;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}
.card__mobileLogo {
  width: 48px;
  height: 48px;
  border-radius: 999px;
  background: $orange;
  color: #0b0b0f;
  display: grid;
  place-items: center;
  font-weight: 1000;
  font-size: 24px;
  flex-shrink: 0;
}
.card__mobileTitle {
  color: $orange;
  font-weight: 1000;
  font-size: 18px;
  line-height: 1.1;
}
.card__mobileSub {
  margin-top: 3px;
  color: $muted;
  font-weight: 800;
  font-size: 12px;
}

.registerTop,
.registerBottom {
  text-align: center;
  color: $muted;
  font-weight: 700;
  margin: 0 0 14px;
  font-size: 14px;
}
.registerBottom {
  margin-top: 16px;
  margin-bottom: 0;
}

.registerTop a,
.registerBottom a {
  color: $orange;
  text-decoration: none;
  font-weight: 900;
}
.registerTop a:hover,
.registerBottom a:hover {
  text-decoration: underline;
}

.form {
  display: grid;
  gap: 14px;
}

.field {
  display: grid;
  gap: 8px;
}
.field__label {
  color: $orange;
  font-weight: 900;
  font-size: 13px;
}
.field__input {
  width: 100%;
  box-sizing: border-box;
  height: 48px; /* יותר נוח במובייל */
  padding: 0 14px;
  border-radius: 12px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  background: rgba(31, 31, 31, 0.95);
  color: rgba(255, 255, 255, 0.95);
  font-size: 16px; /* 16 כדי למנוע zoom באייפון */
  font-weight: 800;
  outline: none;
  text-align: right;
}
.field__input:focus {
  border-color: rgba(255, 106, 0, 0.75);
  box-shadow: 0 0 0 3px rgba(255, 106, 0, 0.14);
  background: rgba(42, 42, 42, 0.95);
}

.pass {
  position: relative;
}
.pass__input {
  padding-left: 52px;
}
.pass__toggle {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 38px;
  height: 38px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.18);
  cursor: pointer;
  display: grid;
  place-items: center;
}

.btn {
  height: 50px;
  border-radius: 14px;
  border: none;
  cursor: pointer;
  font-weight: 1000;
  font-size: 16px;
}
.btn--primary {
  background: linear-gradient(135deg, $orange 0%, #ea580c 100%);
  color: #0b0b0f;
  box-shadow: 0 10px 24px rgba(255, 106, 0, 0.22);
}
.btn--primary:active {
  transform: scale(0.99);
}

.forgotLink {
  display: block;
  text-align: center;
  margin-top: 10px;
  color: rgba(255, 106, 0, 0.85);
  text-decoration: none;
  font-weight: 900;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 106, 0, 0.28);
}
.forgotLink:hover {
  background: rgba(255, 106, 0, 0.1);
  border-color: rgba(255, 106, 0, 0.45);
  color: rgba(255, 106, 0, 1);
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 18px 0;
  color: rgba(255, 255, 255, 0.55);
  font-weight: 900;
}
.divider::before,
.divider::after {
  content: "";
  flex: 1;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}
.divider span {
  padding: 0 10px;
}

.social {
  display: grid;
  gap: 10px;
}
.social__btn {
  height: 48px;
  border-radius: 14px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  background: rgba(31, 31, 31, 0.95);
  color: rgba(255, 255, 255, 0.92);
  font-weight: 900;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.social__btn img {
  width: 24px;
  height: 24px;
  border-radius: 6px;
}

@media (max-width: 1024px) {
  .login__wrap {
    grid-template-columns: 1fr;
    gap: 14px;
  }
  .login__side {
    display: none;
  }
  .card__mobileHead {
    display: flex;
  }
  .card {
    max-width: 640px; /* במובייל/טאבלט זה מרגיש רחב */
  }
}

@media (max-width: 520px) {
  .login {
    padding: 12px;
  }
  .card {
    max-width: none; /* הכי חשוב: שלא יישאר צר */
    width: 100%;
    padding: 18px 16px;
  }
  .registerTop {
    margin-bottom: 10px;
  }
}
</style>
