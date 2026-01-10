<template>
  <div class="settings-section">
    <div class="settings-section__header">
      <h2 class="settings-section__title">הגדרות מערכת</h2>
    </div>

    <div class="settings-content">
      <div class="settings-card">
        <div class="settings-card__header">
          <h3 class="settings-card__title">אחוז עמלה</h3>
          <p class="settings-card__description">
            אחוז העמלה שהמערכת גובה מכל תשלום
          </p>
        </div>
        <div class="settings-card__body">
          <div class="form-field">
            <label class="form-label">אחוז עמלה (%)</label>
            <input
              v-model.number="platformFee"
              type="number"
              step="0.1"
              min="0"
              max="100"
              class="form-input"
              placeholder="לדוגמה: 7"
            />
            <div class="current-fee-display">
              ערך נוכחי: {{ currentPlatformFee }}%
            </div>
          </div>
          <div class="settings-card__actions">
            <button
              class="btn btn--primary"
              @click="updatePlatformFee"
              :disabled="isUpdatingFee || platformFee === currentPlatformFee"
            >
              <span v-if="isUpdatingFee">מעדכן...</span>
              <span v-else>עדכן עמלה</span>
            </button>
          </div>
        </div>
      </div>

      <div class="settings-card">
        <div class="settings-card__header">
          <h3 class="settings-card__title">אחוז מע"מ</h3>
          <p class="settings-card__description">
            אחוז המע"מ (מס ערך מוסף) שמחושב על כל תשלום
          </p>
        </div>
        <div class="settings-card__body">
          <div class="form-field">
            <label class="form-label">אחוז מע"מ (%)</label>
            <input
              v-model.number="maamPercent"
              type="number"
              step="0.1"
              min="0"
              max="100"
              class="form-input"
              placeholder="לדוגמה: 18"
            />
            <div class="current-fee-display">
              ערך נוכחי: {{ currentMaamPercent }}%
            </div>
          </div>
          <div class="settings-card__actions">
            <button
              class="btn btn--primary"
              @click="updateMaamPercent"
              :disabled="isUpdatingMaam || maamPercent === currentMaamPercent"
            >
              <span v-if="isUpdatingMaam">מעדכן...</span>
              <span v-else>עדכן מע"מ</span>
            </button>
          </div>
        </div>
      </div>

      <div class="settings-card">
        <div class="settings-card__header">
          <h3 class="settings-card__title">מנוי חודשי</h3>
          <p class="settings-card__description">סכום המנוי החודשי להנדימנים</p>
        </div>
        <div class="settings-card__body">
          <div class="form-field">
            <label class="form-label">סכום מנוי חודשי (₪)</label>
            <input
              v-model.number="monthlySubscription"
              type="number"
              step="0.1"
              min="0"
              class="form-input"
              placeholder="לדוגמה: 49.9"
            />
            <div class="current-fee-display">
              ערך נוכחי: {{ currentMonthlySubscription }} ₪
            </div>
          </div>
          <div class="settings-card__actions">
            <button
              class="btn btn--primary"
              @click="updateMonthlySubscription"
              :disabled="
                isUpdatingMonthlySubscription ||
                monthlySubscription === currentMonthlySubscription
              "
            >
              <span v-if="isUpdatingMonthlySubscription">מעדכן...</span>
              <span v-else>עדכן מנוי חודשי</span>
            </button>
          </div>
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
  name: "SettingsTab",
  data() {
    return {
      platformFee: 7,
      currentPlatformFee: 7,
      isUpdatingFee: false,
      maamPercent: 18,
      currentMaamPercent: 18,
      isUpdatingMaam: false,
      monthlySubscription: 49.9,
      currentMonthlySubscription: 49.9,
      isUpdatingMonthlySubscription: false,
      toast: null,
    };
  },
  created() {
    this.toast = useToast();
    this.loadPlatformFee();
    this.loadMaamPercent();
    this.loadMonthlySubscription();
  },
  methods: {
    async loadPlatformFee() {
      try {
        const response = await axios.get(`${URL}/admin/fee`);
        if (response.data.success) {
          this.currentPlatformFee = response.data.fee;
          this.platformFee = response.data.fee;
        }
      } catch (error) {
        this.toast?.showError(" לא הצלחנו לטעון את אחוז העמלה");
      }
    },
    async updatePlatformFee() {
      if (this.platformFee === null || this.platformFee === undefined) {
        this.toast?.showError("יש להזין אחוז עמלה תקין");
        return;
      }

      if (this.platformFee < 0 || this.platformFee > 100) {
        this.toast?.showError("אחוז העמלה חייב להיות בין 0 ל-100");
        return;
      }

      this.isUpdatingFee = true;
      try {
        const response = await axios.post(`${URL}/admin/fee`, {
          fee: this.platformFee,
        });

        if (response.data.success) {
          this.currentPlatformFee = response.data.fee;
          this.toast?.showSuccess("אחוז העמלה עודכן בהצלחה");
        } else {
          this.toast?.showError(
            response.data.message || " לא הצלחנו לעדכן את אחוז העמלה"
          );
        }
      } catch (error) {
        this.toast?.showError(
          error.response?.data?.message || " לא הצלחנו לעדכן את אחוז העמלה"
        );
      } finally {
        this.isUpdatingFee = false;
      }
    },
    async loadMaamPercent() {
      try {
        const response = await axios.get(`${URL}/admin/maam`);
        if (response.data.success) {
          this.currentMaamPercent = response.data.maam;
          this.maamPercent = response.data.maam;
        }
      } catch (error) {
        this.toast?.showError(' לא הצלחנו לטעון את אחוז המע"מ');
      }
    },
    async updateMaamPercent() {
      if (this.maamPercent === null || this.maamPercent === undefined) {
        this.toast?.showError('יש להזין אחוז מע"מ תקין');
        return;
      }

      if (this.maamPercent < 0 || this.maamPercent > 100) {
        this.toast?.showError('אחוז המע"מ חייב להיות בין 0 ל-100');
        return;
      }

      this.isUpdatingMaam = true;
      try {
        const response = await axios.post(`${URL}/admin/maam`, {
          maam: this.maamPercent,
        });

        if (response.data.success) {
          this.currentMaamPercent = response.data.maam;
          this.toast?.showSuccess('אחוז המע"מ עודכן בהצלחה');
        } else {
          this.toast?.showError(
            response.data.message || ' לא הצלחנו לעדכן את אחוז המע"מ'
          );
        }
      } catch (error) {
        this.toast?.showError(
          error.response?.data?.message || ' לא הצלחנו לעדכן את אחוז המע"מ'
        );
      } finally {
        this.isUpdatingMaam = false;
      }
    },
    async loadMonthlySubscription() {
      try {
        const response = await axios.get(`${URL}/admin/monthly-subscription`);
        if (response.data.success) {
          this.currentMonthlySubscription = response.data.amount;
          this.monthlySubscription = response.data.amount;
        }
      } catch (error) {
        this.toast?.showError("לא הצלחנו לטעון את סכום המנוי החודשי");
      }
    },
    async updateMonthlySubscription() {
      if (
        this.monthlySubscription === null ||
        this.monthlySubscription === undefined
      ) {
        this.toast?.showError("יש להזין סכום מנוי חודשי תקין");
        return;
      }

      if (this.monthlySubscription < 0) {
        this.toast?.showError("סכום המנוי החודשי חייב להיות מספר חיובי");
        return;
      }

      this.isUpdatingMonthlySubscription = true;
      try {
        const response = await axios.post(`${URL}/admin/monthly-subscription`, {
          amount: this.monthlySubscription,
        });

        if (response.data.success) {
          this.currentMonthlySubscription = response.data.amount;
          this.toast?.showSuccess("סכום המנוי החודשי עודכן בהצלחה");
        } else {
          this.toast?.showError(
            response.data.message || " לא הצלחנו לעדכן את סכום המנוי החודשי"
          );
        }
      } catch (error) {
        this.toast?.showError(
          error.response?.data?.message ||
            " לא הצלחנו לעדכן את סכום המנוי החודשי"
        );
      } finally {
        this.isUpdatingMonthlySubscription = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
$font-family: "Heebo", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
  "Helvetica Neue", Arial, sans-serif;
$bg: #0b0b0f;
$orange: #ff6a00;
$orange2: #ff8a2b;
$text: rgba(255, 255, 255, 0.92);
$muted: rgba(255, 255, 255, 0.62);

.settings-section {
  animation: fadeIn 0.3s ease;
}

.settings-section__header {
  margin-bottom: 24px;
}

.settings-section__title {
  font-size: 20px;
  font-weight: 1000;
  color: $orange2;
}

.settings-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;

  @media (min-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }
}

.settings-card {
  border-radius: 16px;
  border: 1px solid rgba($orange, 0.2);
  background: rgba(255, 255, 255, 0.04);
  overflow: hidden;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba($orange, 0.3);
  }
}

.settings-card__header {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.settings-card__title {
  font-size: 18px;
  font-weight: 1000;
  color: $text;
  margin: 0 0 8px 0;
}

.settings-card__description {
  font-size: 14px;
  font-weight: 800;
  color: $muted;
  margin: 0;
}

.settings-card__body {
  padding: 20px;
  overflow: hidden;
  box-sizing: border-box;
}

.settings-card__actions {
  margin-top: 16px;
  display: flex;
  gap: 12px;
}

.form-field {
  margin-bottom: 20px;
  width: 100%;
  box-sizing: border-box;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 900;
  color: $text;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  font-size: 14px;
  font-weight: 800;
  font-family: $font-family;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: $orange;
    box-shadow: 0 0 0 3px rgba($orange, 0.2);
  }
}

.current-fee-display {
  font-size: 14px;
  font-weight: 800;
  color: $muted;
  margin-top: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
}

.btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: $font-family;
  border: none;

  &--primary {
    background: rgba($orange, 0.15);
    color: $orange2;
    border: 1px solid rgba($orange, 0.3);

    &:hover:not(:disabled) {
      background: rgba($orange, 0.25);
      border-color: rgba($orange, 0.5);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background: rgba($orange, 0.1);
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
