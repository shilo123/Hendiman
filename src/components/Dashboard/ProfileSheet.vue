<template>
  <div class="ps" v-if="visible" dir="rtl">
    <div class="ps__backdrop" @click="$emit('close')" />

    <div
      class="ps__panel"
      :class="{ 'ps__panel--handyman': isHandyman }"
      role="dialog"
      aria-modal="true"
    >
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
          </div>

          <div class="grid">
            <label class="field">
              <span class="field__label">שם</span>
              <input
                v-model="form.name"
                class="field__input"
                type="text"
                inputmode="text"
              />
            </label>

            <label class="field">
              <span class="field__label">טלפון</span>
              <input
                v-model="form.phone"
                class="field__input"
                type="tel"
                inputmode="tel"
              />
            </label>

            <label class="field wide">
              <span class="field__label">אימייל</span>
              <input
                v-model="form.email"
                class="field__input"
                type="email"
                inputmode="email"
              />
            </label>

            <div class="field wide">
              <span class="field__label">עיר</span>

              <!-- City picker trigger -->
              <button class="picker" type="button" @click="openCityPicker">
                <span class="picker__value">
                  {{ cityInput?.trim() ? cityInput : "בחר עיר" }}
                </span>
                <span class="picker__chev">▾</span>
              </button>

              <span v-if="cityError" class="field__error">{{ cityError }}</span>
            </div>
          </div>
        </section>

        <!-- Specialties (handyman only) -->
        <section v-if="isHandyman" class="card">
          <div class="card__head card__head--row">
            <h3 class="card__title">תחומי התמחות</h3>
            <button class="linkBtn" type="button" @click="specOpen = !specOpen">
              {{ specOpen ? "הסתר" : "ערוך" }}
            </button>
          </div>

          <div class="chips" v-if="form.specialties?.length">
            <span
              v-for="spec in form.specialties"
              :key="spec.name || spec"
              class="chip"
            >
              {{ spec.name || spec }}
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
                <span>💳</span>
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
                <span>💳</span>
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
                <span>💳</span>
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
                <span>🚪</span>
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
                <span>🗑️</span>
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
          <button class="ps__iconBtn" type="button" @click="closeCityPicker">
            ✕
          </button>
        </div>

        <input
          v-model="citySearch"
          class="pickerModal__search"
          type="text"
          autocomplete="off"
          placeholder="חפש עיר…"
          @input="onCitySearch"
        />

        <div class="pickerModal__list">
          <button
            v-for="c in filteredCities"
            :key="c.name"
            type="button"
            class="pickerModal__item"
            @click="selectCity(c.name)"
          >
            {{ c.name }}
          </button>

          <div v-if="filteredCities.length === 0" class="pickerModal__empty">
            לא נמצאה עיר
          </div>
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
      <div class="cancelSubscriptionModal__content">
        <div class="cancelSubscriptionModal__icon">🚫</div>
        <h2 class="cancelSubscriptionModal__title">ביטול מנוי</h2>
        <p class="cancelSubscriptionModal__message">
          האם אתה בטוח שברצונך לבטל את המנוי?
        </p>
        <div class="cancelSubscriptionModal__actions">
          <button
            class="cancelSubscriptionModal__btn cancelSubscriptionModal__btn--cancel"
            type="button"
            @click="showCancelSubscriptionConfirm = false"
            :disabled="isCancellingSubscription"
          >
            בטל
          </button>
          <button
            class="cancelSubscriptionModal__btn cancelSubscriptionModal__btn--confirm"
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
      <div class="deleteUserModal__content">
        <div class="deleteUserModal__icon">⚠️</div>
        <h2 class="deleteUserModal__title">מחיקת משתמש</h2>
        <p class="deleteUserModal__message">
          האם אתה בטוח שברצונך למחוק את המשתמש? פעולה זו אינה הפיכה.
        </p>
        <div class="deleteUserModal__actions">
          <button
            class="deleteUserModal__btn deleteUserModal__btn--cancel"
            type="button"
            @click="showDeleteConfirm = false"
          >
            בטל
          </button>
          <button
            class="deleteUserModal__btn deleteUserModal__btn--confirm"
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

      if (!q) return list.slice(1, 60); // יותר נוח ברשימה
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

        // Check subscription status
        this.hasActiveSubscription =
          val?.hasActiveSubscription === true ||
          val?.trialExpiresAt === "always";

        // תיקון: חיפוש לפי address (לא val.city)
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
        // Check onboarding status when profile sheet opens
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
    onCitySearch() {
      // לא צריך כלום, computed עושה
    },
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

      // שלח גם שם עיר באנגלית
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
        // Call logout endpoint
        await axios.get(`${URL}/auth/logout`);

        // Emit logout event to parent
        this.$emit("logout");
        this.$emit("close");

        // Redirect to home page
        this.$router.push("/");
      } catch (error) {
        // Even if logout fails on server, still redirect
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
        console.log(
          "[ProfileSheet] Cancelling subscription for userId:",
          userId
        );
        const response = await axios.post(
          `${URL}/api/subscription/cancel`,
          {
            userId: String(userId),
          },
          {
            timeout: 30000, // 30 seconds timeout
          }
        );

        console.log(
          "[ProfileSheet] Cancel subscription response:",
          response.data
        );

        if (response.data && response.data.success) {
          this.showCancelSubscriptionConfirm = false;
          this.toast?.showSuccess("המנוי בוטל בהצלחה");
          // Refresh user data
          this.$emit("refresh-user");
          // Update local state
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
          // Server responded with error
          errorMessage =
            error.response.data?.message ||
            error.response.data?.error ||
            `שגיאת שרת: ${error.response.status}`;
        } else if (error.request) {
          // Request was made but no response received
          errorMessage = "לא התקבלה תשובה מהשרת. אנא נסה שוב מאוחר יותר.";
        } else {
          // Error in request setup
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
      if (!handymanId) {
        return;
      }

      try {
        const response = await axios.get(
          `${URL}/api/handyman/${handymanId}/stripe/status`
        );

        if (response.data && response.data.success) {
          const { needsOnboarding } = response.data;

          // Update hasPaymentAccount based on onboarding status
          this.hasPaymentAccount = !needsOnboarding;

          if (needsOnboarding) {
            // Fetch onboarding link
            await this.fetchOnboardingLink();
          } else {
            // Onboarding is complete, clear URL
            this.onboardingUrl = null;
          }
        }
      } catch (error) {
        this.toast?.showError(
          " לא הצלחנו ליצור קישור הגדרת תשלומים. אנא נסה שוב מאוחר יותר."
        );
        // Don't show error to user - just try to fetch link
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
$orange: #ff6a00;
$orange2: #ff8a2b;

.ps {
  position: fixed;
  inset: 0;
  z-index: 100001; /* Higher than DashboardTopBar (100000) */
  display: flex;
  align-items: flex-end; /* bottom sheet feel */
  justify-content: center;
  font-family: "Heebo", sans-serif;
}

.ps__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.62);
  backdrop-filter: blur(4px);
}

.ps__panel {
  position: relative;
  width: min(720px, 100vw);
  height: min(86vh, 760px);
  background: $panel;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px 18px 0 0;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  color: $text;
  display: flex;
  flex-direction: column;
}

.ps__panel--handyman {
  width: min(860px, 100vw);
}

@media (max-width: 768px) {
  .ps__panel {
    width: 100vw;
    height: 92vh;
    border-radius: 18px 18px 0 0;
  }
}

.ps__handle {
  width: 44px;
  height: 5px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  margin: 10px auto 6px;
}

.ps__header {
  position: sticky;
  top: 0;
  z-index: 5;
  padding: 10px 12px 12px;
  background: linear-gradient(
    180deg,
    rgba(15, 16, 22, 0.98),
    rgba(15, 16, 22, 0.92)
  );
  border-bottom: 1px solid rgba($orange, 0.12);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.ps__iconBtn {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.22);
  color: $text;
  font-size: 16px;
  display: grid;
  place-items: center;
  cursor: pointer;
  flex-shrink: 0;
}

.ps__headText {
  min-width: 0;
  flex: 1;
}

.ps__title {
  margin: 0;
  font-size: 18px;
  font-weight: 1000;
  line-height: 1.1;
}

.ps__sub {
  margin: 4px 0 0;
  font-size: 12px;
  color: $muted;
  font-weight: 800;
}

.ps__chip {
  padding: 8px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 1000;
  border: 1px solid rgba($orange, 0.22);
  color: $orange2;
  background: rgba(255, 255, 255, 0.03);
  white-space: nowrap;
}
.ps__chip--handyman {
  border-color: rgba($orange, 0.35);
  color: $orange;
}

.ps__headerRight {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.ps__cancelSubscriptionBtn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
  font-size: 11px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.ps__cancelSubscriptionBtn:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.5);
  transform: translateY(-1px);
}

.ps__cancelSubscriptionBtn__icon {
  font-size: 14px;
  line-height: 1;
}

.ps__cancelSubscriptionBtn__text {
  font-size: 11px;
  font-weight: 900;
}

@media (max-width: 400px) {
  .ps__cancelSubscriptionBtn {
    padding: 6px 10px;
    font-size: 10px;
  }
  .ps__cancelSubscriptionBtn__text {
    display: none; /* Hide text on very small screens, show only icon */
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
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  padding: 12px;
}

.card--danger {
  border-color: rgba(239, 68, 68, 0.22);
  background: rgba(239, 68, 68, 0.06);
}

.card__head {
  margin-bottom: 10px;
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
  color: rgba(255, 255, 255, 0.92);
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
  color: rgba(255, 255, 255, 0.7);
}

.field__input {
  height: 44px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.18);
  color: $text;
  padding: 0 12px;
  font-weight: 900;
  outline: none;
  font-size: 15px;
}

.field__input:focus {
  border-color: rgba($orange, 0.45);
  box-shadow: 0 0 0 3px rgba($orange, 0.14);
}

.field__error {
  font-size: 12px;
  color: #ff8888;
  font-weight: 800;
}

.picker {
  height: 44px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.18);
  color: $text;
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 1000;
  cursor: pointer;
}

.picker__value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 90%;
}

.picker__chev {
  opacity: 0.7;
}

.linkBtn {
  border: none;
  background: transparent;
  color: $orange2;
  font-weight: 1000;
  cursor: pointer;
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
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.06);
  font-weight: 900;
  font-size: 12px;
}

.chip__x {
  width: 26px;
  height: 26px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.18);
  color: $text;
  cursor: pointer;
}

.specEditor {
  margin-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 10px;
}

.muted {
  color: $muted;
  font-weight: 800;
  font-size: 12px;
}

.logoutBtn {
  width: 100%;
  height: 44px;
  border-radius: 14px;
  border: 1px solid rgba($orange, 0.35);
  background: rgba($orange, 0.12);
  color: $orange;
  font-weight: 1000;
  cursor: pointer;
  transition: all 0.2s ease;
}

.logoutBtn:hover:not(:disabled) {
  background: rgba($orange, 0.18);
  border-color: rgba($orange, 0.45);
}

.logoutBtn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.paymentBtn {
  width: 100%;
  height: 44px;
  border-radius: 14px;
  border: 1px solid rgba($orange, 0.35);
  background: rgba($orange, 0.12);
  color: $orange;
  font-weight: 1000;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-decoration: none;
}

.paymentBtn:hover:not(:disabled) {
  background: rgba($orange, 0.18);
  border-color: rgba($orange, 0.45);
}

.paymentBtn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.paymentBtn span {
  font-size: 18px;
}

.dangerBtn {
  width: 100%;
  height: 44px;
  border-radius: 14px;
  border: 1px solid rgba(239, 68, 68, 0.35);
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
  font-weight: 1000;
  cursor: pointer;
}

/* Actions grid - all buttons in one row */
.card--actions {
  padding: 16px;
  background: linear-gradient(
    135deg,
    rgba(255, 106, 0, 0.05) 0%,
    rgba(255, 138, 43, 0.03) 100%
  );
  border: 1px solid rgba($orange, 0.15);
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
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 0.3px;
}

.action-btn {
  width: 100%;
  min-height: 48px;
  border-radius: 12px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.04) 100%
  );
  color: $text;
  font-weight: 1000;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 8px;
  text-decoration: none;
  flex-direction: row;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: hidden;
}

.action-btn::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.1),
    transparent
  );
  transition: left 0.5s;
}

.action-btn:hover:not(:disabled)::before {
  left: 100%;
}

.action-btn:hover:not(:disabled) {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.12) 0%,
    rgba(255, 255, 255, 0.08) 100%
  );
  border-color: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.action-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.action-btn--payment {
  border-color: rgba($orange, 0.4);
  background: linear-gradient(
    135deg,
    rgba($orange, 0.18) 0%,
    rgba($orange2, 0.12) 100%
  );
  color: $orange2;
  box-shadow: 0 2px 12px rgba($orange, 0.2);
}

.action-btn--payment:hover:not(:disabled) {
  background: linear-gradient(
    135deg,
    rgba($orange, 0.25) 0%,
    rgba($orange2, 0.18) 100%
  );
  border-color: rgba($orange, 0.55);
  box-shadow: 0 4px 20px rgba($orange, 0.35);
}

.action-btn--payment span:first-child,
.action-btn--subscription span:first-child,
.action-btn--logout span:first-child,
.action-btn--danger span:first-child {
  font-size: 16px;
  flex-shrink: 0;
  line-height: 1;
}

.action-btn--payment span:first-child {
  filter: drop-shadow(0 2px 4px rgba($orange, 0.3));
}

.action-btn--subscription {
  border-color: rgba(76, 175, 80, 0.4);
  background: linear-gradient(
    135deg,
    rgba(76, 175, 80, 0.18) 0%,
    rgba(139, 195, 74, 0.12) 100%
  );
  color: #4caf50;
  box-shadow: 0 2px 12px rgba(76, 175, 80, 0.2);
}

.action-btn--subscription:hover:not(:disabled) {
  background: linear-gradient(
    135deg,
    rgba(76, 175, 80, 0.25) 0%,
    rgba(139, 195, 74, 0.18) 100%
  );
  border-color: rgba(76, 175, 80, 0.55);
  box-shadow: 0 4px 20px rgba(76, 175, 80, 0.35);
}

.action-btn--subscription span:first-child {
  filter: drop-shadow(0 2px 4px rgba(76, 175, 80, 0.3));
}

.action-btn--logout {
  border-color: rgba($orange, 0.4);
  background: linear-gradient(
    135deg,
    rgba($orange, 0.15) 0%,
    rgba($orange2, 0.1) 100%
  );
  color: $orange2;
  box-shadow: 0 2px 12px rgba($orange, 0.15);
}

.action-btn--logout:hover:not(:disabled) {
  background: linear-gradient(
    135deg,
    rgba($orange, 0.22) 0%,
    rgba($orange2, 0.15) 100%
  );
  border-color: rgba($orange, 0.55);
  box-shadow: 0 4px 20px rgba($orange, 0.3);
}

.action-btn--danger {
  border-color: rgba(239, 68, 68, 0.4);
  background: linear-gradient(
    135deg,
    rgba(239, 68, 68, 0.18) 0%,
    rgba(220, 38, 38, 0.12) 100%
  );
  color: #ef4444;
  box-shadow: 0 2px 12px rgba(239, 68, 68, 0.2);
}

.action-btn--danger:hover:not(:disabled) {
  background: linear-gradient(
    135deg,
    rgba(239, 68, 68, 0.25) 0%,
    rgba(220, 38, 38, 0.18) 100%
  );
  border-color: rgba(239, 68, 68, 0.55);
  box-shadow: 0 4px 20px rgba(239, 68, 68, 0.35);
}

.action-btn__text {
  font-size: 11px;
  line-height: 1.2;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  font-weight: 900;
}

/* Mobile responsive - 400px and below */
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
    padding: 8px 6px;
    border-radius: 10px;
    font-size: 11px;
  }

  .action-btn__text {
    font-size: 10px;
  }

  .action-item__label {
    font-size: 9px;
  }

  .action-btn--payment span:first-child,
  .action-btn--subscription span:first-child,
  .action-btn--logout span:first-child,
  .action-btn--danger span:first-child {
    font-size: 14px;
  }
}

/* Tablet and small desktop - between 400px and 600px */
@media (min-width: 401px) and (max-width: 600px) {
  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}

/* Desktop - better spacing */
@media (min-width: 601px) {
  .actions-grid {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 14px;
  }

  .action-btn {
    min-height: 52px;
    font-size: 12px;
  }

  .action-btn__text {
    font-size: 11px;
  }
}

/* Sticky footer buttons (mobile friendly) */
.ps__footer {
  position: sticky;
  bottom: 0;
  z-index: 5;
  display: flex;
  gap: 10px;
  padding: 12px;
  background: linear-gradient(
    180deg,
    rgba(15, 16, 22, 0.92),
    rgba(15, 16, 22, 0.98)
  );
  border-top: 1px solid rgba($orange, 0.1);
}

.btn {
  flex: 1;
  height: 44px;
  border-radius: 14px;
  font-weight: 1100;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.btn--ghost {
  background: rgba(255, 255, 255, 0.06);
  color: $text;
}

.btn--primary {
  background: linear-gradient(135deg, $orange, $orange2);
  color: #0b0b0f;
  border-color: rgba($orange, 0.55);
}

/* City picker modal */
.pickerModal {
  position: fixed;
  inset: 0;
  z-index: 100002; /* Higher than ProfileSheet */
  background: rgba(0, 0, 0, 0.72);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0;
}

.pickerModal__card {
  width: 100%;
  max-width: 720px;
  height: min(72vh, 560px);
  background: rgba(15, 16, 22, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 18px 18px 0 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
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

.pickerModal__search {
  margin: 12px;
  height: 44px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.18);
  color: $text;
  padding: 0 12px;
  font-weight: 900;
  outline: none;
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
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: $text;
  font-weight: 900;
  cursor: pointer;
  margin-bottom: 8px;
}

.pickerModal__empty {
  padding: 18px 10px;
  text-align: center;
  color: $muted;
  font-weight: 900;
}

/* Delete modal (שמרתי שלך, רק קצת טאצ' מובייל) */
.deleteUserModal {
  position: fixed;
  inset: 0;
  z-index: 100003; /* Higher than pickerModal */
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  padding: 16px;
}
.deleteUserModal__content {
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.95),
    rgba(15, 16, 22, 0.98)
  );
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 22px;
  width: min(420px, 92vw);
  text-align: center;
}
.deleteUserModal__icon {
  font-size: 44px;
  margin-bottom: 12px;
}
.deleteUserModal__title {
  font-size: 20px;
  font-weight: 1000;
  color: #fff;
  margin: 0 0 12px 0;
}
.deleteUserModal__message {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.82);
  margin: 0 0 18px 0;
  line-height: 1.5;
}
.deleteUserModal__actions {
  display: flex;
  gap: 10px;
}
@media (max-width: 520px) {
  .deleteUserModal__actions {
    flex-direction: column;
  }
}
.deleteUserModal__btn {
  flex: 1;
  height: 44px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  font-weight: 1000;
  cursor: pointer;
}
.deleteUserModal__btn--confirm {
  border-color: rgba(239, 68, 68, 0.35);
  background: rgba(239, 68, 68, 0.16);
  color: #ef4444;
}
.deleteUserModal__btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Cancel Subscription Modal */
.cancelSubscriptionModal {
  position: fixed;
  inset: 0;
  z-index: 100003;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  padding: 16px;
}

.cancelSubscriptionModal__content {
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.95),
    rgba(15, 16, 22, 0.98)
  );
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 20px;
  padding: 22px;
  width: min(420px, 92vw);
  text-align: center;
}

.cancelSubscriptionModal__icon {
  font-size: 44px;
  margin-bottom: 12px;
}

.cancelSubscriptionModal__title {
  font-size: 20px;
  font-weight: 1000;
  color: #fff;
  margin: 0 0 12px 0;
}

.cancelSubscriptionModal__message {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.82);
  margin: 0 0 18px 0;
  line-height: 1.5;
}

.cancelSubscriptionModal__actions {
  display: flex;
  gap: 10px;
}

@media (max-width: 520px) {
  .cancelSubscriptionModal__actions {
    flex-direction: column;
  }
}

.cancelSubscriptionModal__btn {
  flex: 1;
  height: 44px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  font-weight: 1000;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancelSubscriptionModal__btn--confirm {
  border-color: rgba(239, 68, 68, 0.35);
  background: rgba(239, 68, 68, 0.16);
  color: #ef4444;
}

.cancelSubscriptionModal__btn--confirm:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.25);
  border-color: rgba(239, 68, 68, 0.5);
}

.cancelSubscriptionModal__btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
