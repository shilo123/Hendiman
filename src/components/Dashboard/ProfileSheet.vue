<template>
  <div class="ps" v-if="visible" dir="rtl">
    <div class="ps__backdrop" @click="$emit('close')" />

    <div
      class="ps__panel"
      :class="{ 'ps__panel--handyman': isHandyman }"
      role="dialog"
      aria-modal="true"
    >
      <!-- Ambient glow -->
      <div class="ps__glow" aria-hidden="true"></div>

      <!-- Handle (mobile) -->
      <div class="ps__handle" />

      <!-- Sticky header -->
      <header class="ps__header">
        <button
          class="ps__iconBtn"
          type="button"
          @click="$emit('close')"
          aria-label="סגור"
        >
          ✕
        </button>

        <div class="ps__headText">
          <h2 class="ps__title">פרופיל משתמש</h2>
          <p class="ps__sub">
            {{ isHandyman ? "פרופיל הנדימן" : "פרופיל לקוח" }}
          </p>
        </div>

        <div class="ps__headerRight">
          <!-- Cancel Subscription Button -->
          <button
            v-if="
              isHandyman &&
              hasActiveSubscription &&
              user?.trialExpiresAt !== 'always'
            "
            class="ps__cancelSubscriptionBtn"
            type="button"
            @click="showCancelSubscriptionConfirm = true"
            aria-label="בטל מנוי"
          >
            <span class="ps__cancelSubscriptionBtn__icon">🚫</span>
            <span class="ps__cancelSubscriptionBtn__text">בטל מנוי</span>
          </button>

          <span class="ps__chip" :class="{ 'ps__chip--handyman': isHandyman }">
            {{ isHandyman ? "הנדימן" : "לקוח" }}
          </span>
        </div>
      </header>

      <!-- Content -->
      <div class="ps__content">
        <!-- Personal details -->
        <section class="card">
          <div class="card__head">
            <h3 class="card__title">פרטים אישיים</h3>
            <span class="card__hint"
              >עדכון הפרטים נשמר רק בלחיצה על “שמור”</span
            >
          </div>

          <div class="grid">
            <label class="field">
              <span class="field__label">שם</span>
              <div class="field__control">
                <span class="field__icon" aria-hidden="true">👤</span>
                <input
                  v-model="form.name"
                  class="field__input"
                  type="text"
                  inputmode="text"
                  placeholder="השם שלך"
                />
              </div>
            </label>

            <label class="field">
              <span class="field__label">טלפון</span>
              <div class="field__control">
                <span class="field__icon" aria-hidden="true">📞</span>
                <input
                  v-model="form.phone"
                  class="field__input"
                  type="tel"
                  inputmode="tel"
                  placeholder="05X-XXXXXXX"
                />
              </div>
            </label>

            <label class="field wide">
              <span class="field__label">אימייל</span>
              <div class="field__control">
                <span class="field__icon" aria-hidden="true">✉️</span>
                <input
                  v-model="form.email"
                  class="field__input"
                  type="email"
                  inputmode="email"
                  placeholder="name@email.com"
                />
              </div>
            </label>

            <div class="field wide">
              <span class="field__label">עיר</span>

              <!-- City picker trigger -->
              <button class="picker" type="button" @click="openCityPicker">
                <span class="picker__left">
                  <span class="picker__icon" aria-hidden="true">📍</span>
                  <span class="picker__value">
                    {{ cityInput?.trim() ? cityInput : "בחר עיר" }}
                  </span>
                </span>
                <span class="picker__chev" aria-hidden="true">▾</span>
              </button>

              <span v-if="cityError" class="field__error">
                {{ cityError }}
              </span>
            </div>
          </div>
        </section>

        <!-- Specialties (handyman only) -->
        <section v-if="isHandyman" class="card">
          <div class="card__head card__head--row">
            <div class="card__headCol">
              <h3 class="card__title">תחומי התמחות</h3>
              <span class="card__hint"
                >ככה המערכת תדע להתאים לך עבודות בול</span
              >
            </div>

            <button class="linkBtn" type="button" @click="specOpen = !specOpen">
              <span class="linkBtn__dot" aria-hidden="true"></span>
              {{ specOpen ? "הסתר" : "ערוך" }}
            </button>
          </div>

          <div class="chips" v-if="form.specialties?.length">
            <span
              v-for="spec in form.specialties"
              :key="spec.name || spec"
              class="chip"
              :title="spec.name || spec"
            >
              <span class="chip__txt">{{ spec.name || spec }}</span>
              <button
                class="chip__x"
                type="button"
                @click="removeSpec(spec)"
                aria-label="הסר"
              >
                ✕
              </button>
            </span>
          </div>

          <div v-else class="muted">לא הוגדרו התמחויות</div>

          <div v-if="specOpen" class="specEditor">
            <CategoryCheckboxSelector v-model="form.specialties" />
          </div>
        </section>

        <!-- Actions section - all buttons in one row -->
        <section class="card card--actions">
          <div class="actions-grid">
            <!-- Payment Account Setup (handyman only) -->
            <div v-if="isHandyman" class="action-item">
              <div class="action-item__label">חשבון תשלומים</div>

              <a
                v-if="onboardingUrl"
                :href="onboardingUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="action-btn action-btn--payment"
              >
                <span class="action-btn__icon" aria-hidden="true">💳</span>
                <span class="action-btn__text">{{
                  hasPaymentAccount ? "שינוי חשבון" : "הגדר חשבון"
                }}</span>
              </a>

              <button
                v-else
                class="action-btn action-btn--payment"
                type="button"
                @click="fetchOnboardingLink"
                :disabled="isLoadingOnboarding"
              >
                <span class="action-btn__icon" aria-hidden="true">💳</span>
                <span class="action-btn__text">{{
                  isLoadingOnboarding
                    ? "טוען..."
                    : hasPaymentAccount
                    ? "שינוי חשבון"
                    : "הגדר חשבון"
                }}</span>
              </button>
            </div>

            <!-- Change Payment Method (for subscription) -->
            <div v-if="isHandyman && hasActiveSubscription" class="action-item">
              <div class="action-item__label">שינוי אשראי למנוי</div>
              <button
                class="action-btn action-btn--subscription"
                type="button"
                @click="goToPaymentSettings"
              >
                <span class="action-btn__icon" aria-hidden="true">💳</span>
                <span class="action-btn__text">שינוי אשראי לחיוב מנוי</span>
              </button>
            </div>

            <!-- Logout -->
            <div class="action-item">
              <div class="action-item__label">התנתקות</div>
              <button
                class="action-btn action-btn--logout"
                type="button"
                @click="handleLogout"
                :disabled="isLoggingOut"
              >
                <span class="action-btn__icon" aria-hidden="true">🚪</span>
                <span class="action-btn__text">{{
                  isLoggingOut ? "מתנתק..." : "התנתק"
                }}</span>
              </button>
            </div>

            <!-- Delete User -->
            <div class="action-item">
              <div class="action-item__label">מחיקה</div>
              <button
                class="action-btn action-btn--danger"
                type="button"
                @click="showDeleteConfirm = true"
              >
                <span class="action-btn__icon" aria-hidden="true">🗑️</span>
                <span class="action-btn__text">מחק משתמש</span>
              </button>
            </div>
          </div>
        </section>
      </div>

      <!-- Sticky footer -->
      <footer class="ps__footer">
        <button class="btn btn--ghost" type="button" @click="$emit('close')">
          בטל
        </button>
        <button class="btn btn--primary" type="button" @click="onSave">
          שמור
        </button>
      </footer>
    </div>

    <!-- City picker modal -->
    <div
      v-if="cityPickerOpen"
      class="pickerModal"
      @click.self="closeCityPicker"
    >
      <div class="pickerModal__card">
        <div class="pickerModal__head">
          <div class="pickerModal__title">בחר עיר</div>
          <button
            class="ps__iconBtn ps__iconBtn--sm"
            type="button"
            @click="closeCityPicker"
          >
            ✕
          </button>
        </div>

        <div class="pickerModal__searchWrap">
          <span class="pickerModal__searchIcon" aria-hidden="true">🔎</span>
          <input
            v-model="citySearch"
            class="pickerModal__search"
            type="text"
            autocomplete="off"
            placeholder="חפש עיר…"
            @input="onCitySearch"
          />
        </div>

        <div class="pickerModal__list">
          <button
            v-for="c in filteredCities"
            :key="c.name"
            type="button"
            class="pickerModal__item"
            @click="selectCity(c.name)"
          >
            <span class="pickerModal__itemIcon" aria-hidden="true">📍</span>
            <span class="pickerModal__itemTxt">{{ c.name }}</span>
            <span class="pickerModal__itemChev" aria-hidden="true">›</span>
          </button>

          <div v-if="filteredCities.length === 0" class="pickerModal__empty">
            לא נמצאה עיר
          </div>
        </div>

        <div class="pickerModal__footer">
          <button class="btn btn--ghost" type="button" @click="closeCityPicker">
            סגור
          </button>
        </div>
      </div>
    </div>

    <!-- Cancel Subscription Confirmation Modal -->
    <div
      v-if="showCancelSubscriptionConfirm"
      class="cancelSubscriptionModal"
      dir="rtl"
      @click.self="showCancelSubscriptionConfirm = false"
    >
      <div class="modal">
        <div class="modal__icon">🚫</div>
        <h2 class="modal__title">ביטול מנוי</h2>
        <p class="modal__message">האם אתה בטוח שברצונך לבטל את המנוי?</p>

        <div class="modal__actions">
          <button
            class="modal__btn modal__btn--ghost"
            type="button"
            @click="showCancelSubscriptionConfirm = false"
            :disabled="isCancellingSubscription"
          >
            בטל
          </button>
          <button
            class="modal__btn modal__btn--danger"
            type="button"
            @click="handleCancelSubscription"
            :disabled="isCancellingSubscription"
          >
            {{ isCancellingSubscription ? "מבטל..." : "כן, בטל מנוי" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete User Confirmation Modal -->
    <div
      v-if="showDeleteConfirm"
      class="deleteUserModal"
      dir="rtl"
      @click.self="showDeleteConfirm = false"
    >
      <div class="modal modal--warn">
        <div class="modal__icon">⚠️</div>
        <h2 class="modal__title">מחיקת משתמש</h2>
        <p class="modal__message">
          האם אתה בטוח שברצונך למחוק את המשתמש? פעולה זו אינה הפיכה.
        </p>

        <div class="modal__actions">
          <button
            class="modal__btn modal__btn--ghost"
            type="button"
            @click="showDeleteConfirm = false"
          >
            בטל
          </button>
          <button
            class="modal__btn modal__btn--danger"
            type="button"
            @click="handleDeleteUser"
            :disabled="isDeleting"
          >
            {{ isDeleting ? "מוחק..." : "כן, מחק" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import cities from "@/APIS/AdressFromIsrael.json";
import CategoryCheckboxSelector from "@/components/Global/CategoryCheckboxSelector.vue";
import axios from "axios";
import { useToast } from "@/composables/useToast";
import { URL } from "@/Url/url";

export default {
  name: "ProfileSheetV2",
  components: { CategoryCheckboxSelector },
  props: {
    visible: { type: Boolean, default: false },
    user: { type: Object, default: () => ({}) },
    isHandyman: { type: Boolean, default: false },
  },
  emits: ["close", "save", "delete-user", "logout"],
  data() {
    return {
      form: this.buildForm(this.user),

      cityInput: this.user?.address || "",
      cityEnglishName: null,
      cityError: "",

      // new picker UX
      cityPickerOpen: false,
      citySearch: "",
      specOpen: false,

      showDeleteConfirm: false,
      isDeleting: false,
      isLoggingOut: false,
      showCancelSubscriptionConfirm: false,
      isCancellingSubscription: false,

      // Payment onboarding
      onboardingUrl: null,
      isLoadingOnboarding: false,
      hasPaymentAccount: false, // Track if user has completed onboarding
      hasActiveSubscription: false, // Track if user has active subscription
      toast: null,
    };
  },
  computed: {
    filteredCities() {
      const q = (this.citySearch || "").trim();
      const list = cities.filter((c) => c.name && typeof c.name === "string");

      if (!q) return list.slice(1, 60);
      return list.filter((c) => c.name.includes(q)).slice(0, 60);
    },
  },
  created() {
    this.toast = useToast();
  },
  watch: {
    user: {
      handler(val) {
        this.form = this.buildForm(val);
        this.cityInput = val?.address || "";

        this.hasActiveSubscription =
          val?.hasActiveSubscription === true ||
          val?.trialExpiresAt === "always";

        if (val?.address) {
          const foundCity = cities.find((c) => c.name === val.address);
          this.cityEnglishName = foundCity
            ? foundCity.english_name || foundCity.שם_ישוב_לועזי || null
            : null;
        } else {
          this.cityEnglishName = null;
        }
      },
      deep: true,
    },
    visible(v) {
      if (!v) {
        this.cityPickerOpen = false;
        this.citySearch = "";
        this.specOpen = false;
        this.cityError = "";
      } else if (v && this.isHandyman) {
        this.checkOnboardingStatus();
      }
    },
  },
  methods: {
    buildForm(user) {
      return {
        name: user?.username || user?.name || "",
        phone: user?.phone || "",
        email: user?.email || "",
        address: user?.address || "",
        specialties: user?.specialties ? [...user.specialties] : [],
      };
    },

    openCityPicker() {
      this.cityPickerOpen = true;
      this.citySearch = this.cityInput || "";
    },
    closeCityPicker() {
      this.cityPickerOpen = false;
      this.citySearch = "";
    },
    onCitySearch() {},
    selectCity(name) {
      this.form.address = name;
      this.cityInput = name;
      this.cityError = "";
      this.cityPickerOpen = false;

      const foundCity = cities.find((c) => c.name === name);
      this.cityEnglishName = foundCity
        ? foundCity.english_name || foundCity.שם_ישוב_לועזי || null
        : null;
    },

    validateCity() {
      const name = (this.cityInput || "").trim();
      if (!name) {
        this.cityError = "בחר עיר";
        return false;
      }

      const foundCity = cities.find((c) => c.name === name);
      if (!foundCity) {
        this.cityError = "יש לבחור עיר מתוך הרשימה";
        return false;
      }

      this.cityEnglishName =
        foundCity.english_name || foundCity.שם_ישוב_לועזי || null;

      this.cityError = "";
      return true;
    },

    removeSpec(spec) {
      this.form.specialties = this.form.specialties.filter(
        (s) => (s.name || s) !== (spec.name || spec)
      );
    },

    onSave() {
      if (!this.validateCity()) return;

      this.form.address = this.cityInput.trim();

      this.$emit("save", {
        ...this.form,
        cityEnglishName: this.cityEnglishName,
      });

      this.$emit("close");
    },

    async handleDeleteUser() {
      const userId = this.user?._id || this.user?.id;
      if (!userId) {
        this.toast?.showError(" לא הצלחנו לזהות את המשתמש");
        return;
      }

      this.isDeleting = true;
      try {
        const response = await axios.delete(`${URL}/users/${userId}`);
        if (response.data.success) {
          this.showDeleteConfirm = false;
          this.$emit("delete-user");
          this.$emit("close");
          this.$router.push("/");
        } else {
          alert(
            response.data.message ||
              "לא הצלחנו למחוק את המשתמש. נסה שוב מאוחר יותר."
          );
        }
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          "לא הצלחנו למחוק את המשתמש. נסה שוב מאוחר יותר.";
        alert(errorMessage);
      } finally {
        this.isDeleting = false;
      }
    },

    async handleLogout() {
      this.isLoggingOut = true;
      try {
        await axios.get(`${URL}/auth/logout`);
        this.$emit("logout");
        this.$emit("close");
        this.$router.push("/");
      } catch (error) {
        this.$emit("logout");
        this.$emit("close");
        this.$router.push("/");
      } finally {
        this.isLoggingOut = false;
      }
    },

    async handleCancelSubscription() {
      const userId = this.user?._id || this.user?.id;
      if (!userId) {
        this.toast?.showError("לא הצלחנו לזהות את המשתמש");
        return;
      }

      this.isCancellingSubscription = true;
      try {
        const response = await axios.post(
          `${URL}/api/subscription/cancel`,
          { userId: String(userId) },
          { timeout: 30000 }
        );

        if (response.data && response.data.success) {
          this.showCancelSubscriptionConfirm = false;
          this.toast?.showSuccess("המנוי בוטל בהצלחה");
          this.$emit("refresh-user");
          this.hasActiveSubscription = false;
        } else {
          const errorMessage = response.data?.message || "שגיאה בביטול המנוי";
          console.error(
            "[ProfileSheet] Cancel subscription failed:",
            errorMessage
          );
          this.toast?.showError(errorMessage);
        }
      } catch (error) {
        console.error("[ProfileSheet] Error cancelling subscription:", error);
        let errorMessage = "שגיאה בביטול המנוי";

        if (error.response) {
          errorMessage =
            error.response.data?.message ||
            error.response.data?.error ||
            `שגיאת שרת: ${error.response.status}`;
        } else if (error.request) {
          errorMessage = "לא התקבלה תשובה מהשרת. אנא נסה שוב מאוחר יותר.";
        } else {
          errorMessage = error.message || "שגיאה בביטול המנוי";
        }

        this.toast?.showError(errorMessage);
      } finally {
        this.isCancellingSubscription = false;
      }
    },

    async checkOnboardingStatus() {
      if (!this.isHandyman) return;

      const handymanId = this.user?._id || this.user?.id;
      if (!handymanId) return;

      try {
        const response = await axios.get(
          `${URL}/api/handyman/${handymanId}/stripe/status`
        );

        if (response.data && response.data.success) {
          const { needsOnboarding } = response.data;
          this.hasPaymentAccount = !needsOnboarding;

          if (needsOnboarding) {
            await this.fetchOnboardingLink();
          } else {
            this.onboardingUrl = null;
          }
        }
      } catch (error) {
        this.toast?.showError(
          " לא הצלחנו ליצור קישור הגדרת תשלומים. אנא נסה שוב מאוחר יותר."
        );
        await this.fetchOnboardingLink();
      }
    },

    async fetchOnboardingLink() {
      if (!this.isHandyman) return;

      const handymanId = this.user?._id || this.user?.id;
      if (!handymanId) return;

      this.isLoadingOnboarding = true;
      try {
        const response = await axios.post(
          `${URL}/api/handyman/stripe/onboarding-link`,
          { handymanId: String(handymanId) }
        );

        if (response.data && response.data.success && response.data.url) {
          this.onboardingUrl = response.data.url;
        } else {
          this.onboardingUrl = null;
          alert(
            " לא הצלחנו ליצור קישור הגדרת תשלומים. אנא נסה שוב מאוחר יותר."
          );
        }
      } catch (error) {
        this.onboardingUrl = null;
        alert(
          "לא הצלחנו לטעון את קישור הגדרת תשלומים. אנא נסה שוב מאוחר יותר."
        );
      } finally {
        this.isLoadingOnboarding = false;
      }
    },

    goToPaymentSettings() {
      const userId = this.user?._id || this.user?.id;
      if (!userId) {
        alert("לא הצלחנו לזהות את המשתמש");
        return;
      }
      this.$emit("close");
      this.$router.push({
        name: "SubscriptionPaymentSettings",
        params: { id: userId },
      });
    },
  },
};
</script>

<style scoped lang="scss">
$bg: #0b0b0f;
$panel: #0f1016;
$text: rgba(255, 255, 255, 0.92);
$muted: rgba(255, 255, 255, 0.6);
$stroke: rgba(255, 255, 255, 0.1);
$stroke2: rgba(255, 255, 255, 0.14);
$orange: #ff6a00;
$orange2: #ff8a2b;
$orange3: #ffb36b;
$danger: #ef4444;
$shadow: 0 24px 70px rgba(0, 0, 0, 0.62);
$shadowO: 0 18px 55px rgba(255, 106, 0, 0.22);

.ps {
  position: fixed;
  inset: 0;
  z-index: 100001;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  font-family: "Heebo", system-ui, -apple-system, Segoe UI, Arial, sans-serif;
}

.ps__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.64);
  backdrop-filter: blur(8px);
}

.ps__panel {
  position: relative;
  width: min(740px, 100vw);
  height: min(86vh, 780px);
  background: radial-gradient(
      900px 260px at 18% 0%,
      rgba($orange, 0.22),
      transparent 60%
    ),
    radial-gradient(
      700px 260px at 85% 18%,
      rgba($orange2, 0.16),
      transparent 58%
    ),
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(0, 0, 0, 0.12)),
    $panel;
  border: 1px solid rgba($orange, 0.18);
  border-bottom: 0;
  border-radius: 20px 20px 0 0;
  box-shadow: $shadow;
  overflow: hidden;
  color: $text;
  display: flex;
  flex-direction: column;
  transform: translateY(0);
  animation: sheetIn 0.28s cubic-bezier(0.2, 0.9, 0.2, 1);
}

.ps__panel--handyman {
  width: min(900px, 100vw);
}

.ps__glow {
  position: absolute;
  inset: -2px;
  pointer-events: none;
  background: radial-gradient(
      1200px 420px at 20% -10%,
      rgba($orange, 0.18),
      transparent 55%
    ),
    radial-gradient(
      900px 380px at 90% 0%,
      rgba($orange2, 0.12),
      transparent 55%
    );
  filter: blur(14px);
  opacity: 0.9;
}

@keyframes sheetIn {
  from {
    opacity: 0;
    transform: translateY(14px) scale(0.995);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (max-width: 768px) {
  .ps__panel {
    width: 100vw;
    height: 92vh;
    border-radius: 18px 18px 0 0;
  }
}

.ps__handle {
  width: 54px;
  height: 6px;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.18),
    rgba($orange, 0.22),
    rgba(255, 255, 255, 0.18)
  );
  margin: 10px auto 8px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.22);
}

.ps__header {
  position: sticky;
  top: 0;
  z-index: 5;
  padding: 10px 12px 12px;
  background: linear-gradient(
    180deg,
    rgba(10, 11, 16, 0.92),
    rgba(10, 11, 16, 0.86)
  );
  border-bottom: 1px solid rgba($orange, 0.14);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  backdrop-filter: blur(10px);
}

.ps__iconBtn {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(0, 0, 0, 0.28);
  color: $text;
  font-size: 16px;
  display: grid;
  place-items: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.15s ease, background 0.2s ease, border-color 0.2s ease;
}

.ps__iconBtn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba($orange, 0.25);
  transform: translateY(-1px);
}

.ps__iconBtn:active {
  transform: translateY(0) scale(0.98);
}

.ps__iconBtn--sm {
  width: 36px;
  height: 36px;
  border-radius: 12px;
}

.ps__iconBtn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba($orange, 0.22);
  border-color: rgba($orange, 0.35);
}

.ps__headText {
  min-width: 0;
  flex: 1;
}

.ps__title {
  margin: 0;
  font-size: 18px;
  font-weight: 1000;
  line-height: 1.15;
  letter-spacing: 0.2px;
}

.ps__sub {
  margin: 4px 0 0;
  font-size: 12px;
  color: $muted;
  font-weight: 900;
}

.ps__headerRight {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.ps__chip {
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 1000;
  border: 1px solid rgba($orange, 0.22);
  color: $orange2;
  background: rgba(255, 255, 255, 0.04);
  white-space: nowrap;
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.22);
}

.ps__chip--handyman {
  border-color: rgba($orange, 0.38);
  color: $orange3;
  background: rgba($orange, 0.08);
}

.ps__cancelSubscriptionBtn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 12px;
  border: 1px solid rgba($danger, 0.32);
  background: rgba($danger, 0.12);
  color: #ff6b6b;
  font-size: 11px;
  font-weight: 1000;
  cursor: pointer;
  transition: transform 0.15s ease, background 0.2s ease, border-color 0.2s ease;
  white-space: nowrap;
}

.ps__cancelSubscriptionBtn:hover {
  background: rgba($danger, 0.2);
  border-color: rgba($danger, 0.5);
  transform: translateY(-1px);
}

.ps__cancelSubscriptionBtn:active {
  transform: translateY(0) scale(0.99);
}

.ps__cancelSubscriptionBtn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba($danger, 0.22);
}

.ps__cancelSubscriptionBtn__icon {
  font-size: 14px;
  line-height: 1;
}
.ps__cancelSubscriptionBtn__text {
  font-size: 11px;
  font-weight: 1000;
}

@media (max-width: 400px) {
  .ps__cancelSubscriptionBtn {
    padding: 7px 10px;
  }
  .ps__cancelSubscriptionBtn__text {
    display: none;
  }
}

.ps__content {
  flex: 1;
  overflow: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  -webkit-overflow-scrolling: touch;
}

.card {
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.09);
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.06),
    rgba(255, 255, 255, 0.03)
  );
  padding: 12px;
  box-shadow: 0 18px 46px rgba(0, 0, 0, 0.22);
}

.card__head {
  margin-bottom: 10px;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.card__headCol {
  display: grid;
  gap: 3px;
}

.card__head--row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.card__title {
  margin: 0;
  font-size: 13px;
  font-weight: 1000;
  color: rgba(255, 255, 255, 0.94);
}

.card__hint {
  color: rgba(255, 255, 255, 0.55);
  font-weight: 900;
  font-size: 11px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

@media (max-width: 520px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

.wide {
  grid-column: 1 / -1;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.field__label {
  font-size: 12px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.72);
}

.field__control {
  position: relative;
  display: flex;
  align-items: center;
}

.field__icon {
  position: absolute;
  right: 12px;
  font-size: 14px;
  opacity: 0.85;
  pointer-events: none;
  filter: drop-shadow(0 6px 16px rgba(0, 0, 0, 0.22));
}

.field__input {
  width: 100%;
  height: 46px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.2);
  color: $text;
  padding: 0 40px 0 12px;
  font-weight: 900;
  outline: none;
  font-size: 15px;
  transition: box-shadow 0.2s ease, border-color 0.2s ease, transform 0.15s ease,
    background 0.2s ease;
}

.field__input::placeholder {
  color: rgba(255, 255, 255, 0.35);
  font-weight: 800;
}

.field__input:focus {
  border-color: rgba($orange, 0.5);
  box-shadow: 0 0 0 3px rgba($orange, 0.14);
  background: rgba(0, 0, 0, 0.26);
}

.field__input:focus-visible {
  outline: none;
}

.field__error {
  font-size: 12px;
  color: #ff8888;
  font-weight: 900;
}

.picker {
  width: 100%;
  height: 46px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.2);
  color: $text;
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 1000;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.2s ease, border-color 0.2s ease,
    background 0.2s ease;
}

.picker__left {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.picker__icon {
  font-size: 14px;
  opacity: 0.9;
}

.picker__value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 92%;
}

.picker__chev {
  opacity: 0.75;
  transition: transform 0.2s ease;
}

.picker:hover {
  border-color: rgba($orange, 0.25);
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.22);
  background: rgba(255, 255, 255, 0.05);
  transform: translateY(-1px);
}

.picker:active {
  transform: translateY(0) scale(0.995);
}

.picker:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba($orange, 0.18);
  border-color: rgba($orange, 0.35);
}

.linkBtn {
  border: 1px solid rgba($orange, 0.22);
  background: rgba($orange, 0.08);
  color: $orange3;
  font-weight: 1000;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: transform 0.15s ease, background 0.2s ease, border-color 0.2s ease;
  white-space: nowrap;
}

.linkBtn__dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: linear-gradient(135deg, $orange, $orange2);
  box-shadow: 0 0 0 4px rgba($orange, 0.12);
}

.linkBtn:hover {
  background: rgba($orange, 0.12);
  border-color: rgba($orange, 0.35);
  transform: translateY(-1px);
}

.linkBtn:active {
  transform: translateY(0) scale(0.99);
}

.linkBtn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba($orange, 0.18);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 999px;
  padding: 8px 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  font-weight: 900;
  font-size: 12px;
  max-width: 100%;
}

.chip__txt {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chip__x {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(0, 0, 0, 0.22);
  color: $text;
  cursor: pointer;
  transition: transform 0.12s ease, background 0.2s ease, border-color 0.2s ease;
}

.chip__x:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba($orange, 0.22);
  transform: translateY(-1px);
}

.chip__x:active {
  transform: translateY(0) scale(0.98);
}

.chip__x:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba($orange, 0.16);
}

.specEditor {
  margin-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 10px;
}

.muted {
  color: $muted;
  font-weight: 900;
  font-size: 12px;
}

/* Actions */
.card--actions {
  padding: 16px;
  background: radial-gradient(
      900px 260px at 30% 0%,
      rgba($orange, 0.14),
      transparent 55%
    ),
    linear-gradient(135deg, rgba(255, 106, 0, 0.06), rgba(255, 138, 43, 0.03));
  border: 1px solid rgba($orange, 0.18);
  border-radius: 18px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.action-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.action-item__label {
  font-size: 11px;
  font-weight: 1000;
  color: rgba(255, 255, 255, 0.68);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 0.3px;
}

.action-btn {
  width: 100%;
  min-height: 50px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.09),
    rgba(255, 255, 255, 0.04)
  );
  color: $text;
  font-weight: 1000;
  font-size: 12px;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.25s ease,
    border-color 0.2s ease, background 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 10px;
  text-decoration: none;
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.22);
  position: relative;
  overflow: hidden;
}

.action-btn::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(
    500px 120px at 20% 0%,
    rgba(255, 255, 255, 0.12),
    transparent 60%
  );
  opacity: 0;
  transition: opacity 0.25s ease;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  border-color: rgba($orange, 0.22);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.34);
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.12),
    rgba(255, 255, 255, 0.06)
  );
}

.action-btn:hover:not(:disabled)::before {
  opacity: 1;
}

.action-btn:active:not(:disabled) {
  transform: translateY(0) scale(0.995);
}

.action-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.action-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba($orange, 0.18), 0 18px 44px rgba(0, 0, 0, 0.34);
}

.action-btn__icon {
  font-size: 16px;
  line-height: 1;
  filter: drop-shadow(0 6px 16px rgba(0, 0, 0, 0.25));
}

.action-btn__text {
  font-size: 11px;
  line-height: 1.2;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  font-weight: 1000;
}

.action-btn--payment {
  border-color: rgba($orange, 0.36);
  background: linear-gradient(
    135deg,
    rgba($orange, 0.18),
    rgba($orange2, 0.12)
  );
  color: $orange3;
  box-shadow: 0 14px 34px rgba($orange, 0.18);
}

.action-btn--payment:hover:not(:disabled) {
  border-color: rgba($orange, 0.55);
  box-shadow: 0 18px 44px rgba($orange, 0.26);
}

.action-btn--subscription {
  border-color: rgba(76, 175, 80, 0.4);
  background: linear-gradient(
    135deg,
    rgba(76, 175, 80, 0.16),
    rgba(139, 195, 74, 0.11)
  );
  color: #8cff9d;
}

.action-btn--logout {
  border-color: rgba($orange2, 0.34);
  background: linear-gradient(135deg, rgba($orange, 0.14), rgba($orange2, 0.1));
  color: $orange3;
}

.action-btn--danger {
  border-color: rgba($danger, 0.42);
  background: linear-gradient(
    135deg,
    rgba($danger, 0.18),
    rgba(220, 38, 38, 0.12)
  );
  color: #ff8a8a;
}

/* Footer */
.ps__footer {
  position: sticky;
  bottom: 0;
  z-index: 5;
  display: flex;
  gap: 10px;
  padding: 12px;
  background: linear-gradient(
    180deg,
    rgba(10, 11, 16, 0.78),
    rgba(10, 11, 16, 0.92)
  );
  border-top: 1px solid rgba($orange, 0.12);
  backdrop-filter: blur(10px);
}

.btn {
  flex: 1;
  height: 46px;
  border-radius: 14px;
  font-weight: 1100;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.12);
  transition: transform 0.15s ease, box-shadow 0.2s ease, border-color 0.2s ease,
    background 0.2s ease;
}

.btn--ghost {
  background: rgba(255, 255, 255, 0.06);
  color: $text;
}

.btn--ghost:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba($orange, 0.18);
  transform: translateY(-1px);
}

.btn--primary {
  background: linear-gradient(135deg, $orange, $orange2);
  color: #0b0b0f;
  border-color: rgba($orange, 0.55);
  box-shadow: $shadowO;
}

.btn--primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 22px 60px rgba($orange, 0.25);
}

.btn:active {
  transform: translateY(0) scale(0.995);
}

.btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba($orange, 0.18);
}

/* City picker modal */
.pickerModal {
  position: fixed;
  inset: 0;
  z-index: 100002;
  background: rgba(0, 0, 0, 0.72);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0;
  backdrop-filter: blur(8px);
}

.pickerModal__card {
  width: 100%;
  max-width: 740px;
  height: min(74vh, 600px);
  background: radial-gradient(
      900px 260px at 20% 0%,
      rgba($orange, 0.18),
      transparent 55%
    ),
    rgba(15, 16, 22, 0.98);
  border: 1px solid rgba($orange, 0.18);
  border-radius: 20px 20px 0 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: $shadow;
  animation: sheetIn 0.28s cubic-bezier(0.2, 0.9, 0.2, 1);
}

.pickerModal__head {
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.pickerModal__title {
  font-weight: 1100;
  font-size: 15px;
  color: $text;
}

.pickerModal__searchWrap {
  margin: 12px;
  position: relative;
}

.pickerModal__searchIcon {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0.85;
}

.pickerModal__search {
  width: 100%;
  height: 46px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.2);
  color: $text;
  padding: 0 44px 0 12px;
  font-weight: 900;
  outline: none;
}

.pickerModal__search:focus {
  border-color: rgba($orange, 0.45);
  box-shadow: 0 0 0 3px rgba($orange, 0.14);
}

.pickerModal__list {
  flex: 1;
  overflow: auto;
  padding: 0 12px 12px;
  -webkit-overflow-scrolling: touch;
}

.pickerModal__item {
  width: 100%;
  text-align: right;
  padding: 14px 12px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.09);
  background: rgba(255, 255, 255, 0.05);
  color: $text;
  font-weight: 1000;
  cursor: pointer;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: transform 0.15s ease, background 0.2s ease, border-color 0.2s ease;
}

.pickerModal__itemIcon {
  opacity: 0.9;
}

.pickerModal__itemTxt {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pickerModal__itemChev {
  opacity: 0.75;
  font-size: 18px;
}

.pickerModal__item:hover {
  background: rgba($orange, 0.12);
  border-color: rgba($orange, 0.22);
  transform: translateY(-1px);
}

.pickerModal__item:active {
  transform: translateY(0) scale(0.995);
}

.pickerModal__item:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba($orange, 0.16);
}

.pickerModal__empty {
  padding: 18px 10px;
  text-align: center;
  color: $muted;
  font-weight: 900;
}

.pickerModal__footer {
  padding: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.25);
}

/* Unified modal look */
.deleteUserModal,
.cancelSubscriptionModal {
  position: fixed;
  inset: 0;
  z-index: 100003;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(8px);
  padding: 16px;
}

.modal {
  background: radial-gradient(
      900px 260px at 20% 0%,
      rgba($orange, 0.16),
      transparent 58%
    ),
    linear-gradient(180deg, rgba(0, 0, 0, 0.92), rgba(15, 16, 22, 0.98));
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 22px;
  padding: 22px;
  width: min(440px, 92vw);
  text-align: center;
  box-shadow: $shadow;
  animation: popIn 0.22s ease-out;
}

.modal--warn {
  border-color: rgba($danger, 0.22);
}

@keyframes popIn {
  from {
    transform: translateY(8px) scale(0.98);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

.modal__icon {
  font-size: 46px;
  margin-bottom: 12px;
  filter: drop-shadow(0 10px 24px rgba(0, 0, 0, 0.35));
}

.modal__title {
  font-size: 20px;
  font-weight: 1000;
  color: #fff;
  margin: 0 0 10px 0;
}

.modal__message {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.84);
  margin: 0 0 18px 0;
  line-height: 1.55;
  font-weight: 800;
}

.modal__actions {
  display: flex;
  gap: 10px;
}

@media (max-width: 520px) {
  .modal__actions {
    flex-direction: column;
  }
}

.modal__btn {
  flex: 1;
  height: 46px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  font-weight: 1000;
  cursor: pointer;
  transition: transform 0.15s ease, background 0.2s ease, border-color 0.2s ease;
}

.modal__btn--ghost:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-1px);
}

.modal__btn--danger {
  border-color: rgba($danger, 0.38);
  background: rgba($danger, 0.16);
  color: #ff8a8a;
}

.modal__btn--danger:hover:not(:disabled) {
  background: rgba($danger, 0.24);
  border-color: rgba($danger, 0.55);
  transform: translateY(-1px);
}

.modal__btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modal__btn:active {
  transform: translateY(0) scale(0.995);
}

.modal__btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba($orange, 0.16);
}

/* Mobile polish */
@media (max-width: 400px) {
  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .card--actions {
    padding: 12px;
  }

  .action-btn {
    min-height: 46px;
    padding: 8px 8px;
    border-radius: 12px;
  }

  .action-btn__text {
    font-size: 10px;
  }

  .action-item__label {
    font-size: 9px;
  }

  .ps__title {
    font-size: 16px;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .ps__panel,
  .pickerModal__card,
  .modal {
    animation: none !important;
  }
  .action-btn,
  .btn,
  .picker,
  .ps__iconBtn,
  .linkBtn,
  .chip__x,
  .pickerModal__item {
    transition: none !important;
  }
}
</style>
