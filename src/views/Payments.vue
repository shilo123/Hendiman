<template>
  <div class="payments-page" dir="rtl">
    <div class="payments-container">
      <div class="payments-header">
        <button class="payments-back" type="button" @click="handleBack">
          ← חזור
        </button>
        <h1 class="payments-title">
          {{ isSubscription ? "הרשמה למנוי חודשי" : "תשלום" }}
        </h1>
        <p class="payments-subtitle">
          {{
            isSubscription
              ? "בחר אמצעי תשלום (כרטיס / Google Pay / Apple Pay אם זמין)"
              : "בחר אמצעי תשלום"
          }}
        </p>
      </div>

      <div class="payment-form-wrapper">
        <form class="payment-form" @submit.prevent="handleSubmit">
          <div v-if="currentAmount || amount" class="form-field">
            <label class="form-label">סכום לתשלום</label>
            <div class="amount-display">
              {{ formatCurrency(currentAmount || amount) }}
              <span v-if="isSubscription" class="amount-display__period"
                >/חודש</span
              >
            </div>
          </div>

          <div v-if="loading" class="wallet-loading">טוען מערכת תשלום...</div>

          <div v-if="!loading" class="form-field">
            <label class="form-label">אמצעי תשלום</label>
            <div id="payment-element" class="stripe-element-container"></div>
            <div class="wallet-hint">
              אם Google Pay / Apple Pay זמין אצלך, הוא יופיע כאן אוטומטית.
            </div>
          </div>

          <button
            class="payment-submit-btn"
            type="submit"
            :disabled="processing || !ready"
          >
            <span v-if="processing">{{
              isSubscription ? "מעבד הרשמה..." : "מעבד תשלום..."
            }}</span>
            <span v-else>{{ isSubscription ? "הרשם למנוי" : "שלם" }}</span>
          </button>

          <div v-if="errorMsg" class="form-error form-error--submit">
            {{ errorMsg }}
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { URL } from "@/Url/url";
import { useToast } from "@/composables/useToast";
import { loadStripe } from "@stripe/stripe-js";

export default {
  name: "Payments",
  props: {
    id: { type: String, required: true },
    amount: { type: Number, default: null },
    jobId: { type: String, default: null },
  },
  data() {
    return {
      toast: null,
      stripe: null,
      elements: null,
      paymentElement: null,
      clientSecret: null,

      userId: this.id,
      currentJobId: null,
      currentAmount: null,
      isSubscription: false,

      loading: true,
      ready: false,
      processing: false,
      errorMsg: "",
    };
  },
  async created() {
    this.toast = useToast();

    const hasPendingRegistration = this.getPendingRegistrationData() !== null;
    this.isSubscription =
      this.$route.query.subscription === "true" || hasPendingRegistration;

    if (hasPendingRegistration && !this.$route.query.subscription) {
      this.$router.replace({
        ...this.$route,
        query: { ...this.$route.query, subscription: "true" },
      });
    }

    this.currentJobId = this.$route.query.jobId || this.jobId || null;
    this.currentAmount = this.$route.query.amount
      ? parseFloat(this.$route.query.amount)
      : this.amount || null;

    if (!this.currentAmount && this.isSubscription) {
      try {
        const r = await fetch(`${URL}/api/subscription/amount`);
        const d = await r.json();
        if (d.success && d.amount) this.currentAmount = d.amount;
      } catch (e) {}
    }

    await this.initStripe();
  },
  beforeUnmount() {
    try {
      if (this.paymentElement) this.paymentElement.unmount();
    } catch (e) {}
  },
  methods: {
    handleBack() {
      if (this.isSubscription && this.userId === "pending") {
        this.$router.push({ name: "Register" });
      } else {
        this.$router.push(`/Dashboard/${this.userId}`);
      }
    },
    formatCurrency(amount) {
      return new Intl.NumberFormat("he-IL", {
        style: "currency",
        currency: "ILS",
      }).format(amount || 0);
    },
    getPendingRegistrationData() {
      try {
        const data = localStorage.getItem("pendingHandymanRegistration");
        return data ? JSON.parse(data) : null;
      } catch {
        return null;
      }
    },

    async initStripe() {
      this.loading = true;
      this.errorMsg = "";

      try {
        // 1) key
        const keyRes = await fetch(`${URL}/api/stripe/publishable-key`);
        const keyData = await keyRes.json();
        if (!keyData.publishableKey) throw new Error("Missing publishableKey");

        this.stripe = await loadStripe(keyData.publishableKey);
        if (!this.stripe) throw new Error("Stripe init failed");

        // 2) clientSecret from server (PaymentIntent / Subscription intent)
        const secret = await this.fetchClientSecret();
        this.clientSecret = secret;

        // 3) mount Payment Element
        this.elements = this.stripe.elements({
          clientSecret: this.clientSecret,
        });
        this.paymentElement = this.elements.create("payment");
        this.paymentElement.mount("#payment-element");

        this.ready = true;
      } catch (e) {
        this.errorMsg = e?.message || "שגיאה בטעינת מערכת התשלום";
      } finally {
        this.loading = false;
      }
    },

    async fetchClientSecret() {
      // תשלום רגיל
      if (!this.isSubscription) {
        if (!this.currentJobId) throw new Error("חסר jobId");

        const res = await fetch(`${URL}/api/payments/create-intent`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId: this.currentJobId }),
        });
        const data = await res.json();
        if (!data.success || !data.clientSecret)
          throw new Error(data.message || "אין clientSecret");
        return data.clientSecret;
      }

      // מנוי
      const res = await fetch(`${URL}/api/subscription/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationData: this.getPendingRegistrationData(),
        }),
      });
      const data = await res.json();
      if (!data.success || !data.clientSecret)
        throw new Error(data.message || "אין clientSecret למנוי");
      return data.clientSecret;
    },

    async handleSubmit() {
      if (!this.stripe || !this.elements || !this.clientSecret) return;

      this.processing = true;
      this.errorMsg = "";

      try {
        // confirmPayment עובד גם לכרטיס וגם ל-wallets דרך Payment Element
        const { error, paymentIntent } = await this.stripe.confirmPayment({
          elements: this.elements,
          confirmParams: {
            // Stripe יטפל ב-redirect אם צריך (3DS / wallets)
            return_url: window.location.origin + `/Dashboard/${this.userId}`,
          },
          redirect: "if_required",
        });

        if (error) throw new Error(error.message || "שגיאה באישור התשלום");

        // במנוי: אחרי שה-payment / setup הצליח, תעשה complete
        if (this.isSubscription) {
          const completeRes = await fetch(`${URL}/api/subscription/complete`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentIntentId: paymentIntent?.id }),
          });
          const completeData = await completeRes.json();
          if (!completeData.success)
            throw new Error(completeData.message || "שגיאה בהשלמת ההרשמה");

          localStorage.removeItem("pendingHandymanRegistration");
          this.toast?.showSuccess("הרשמה למנוי בוצעה בהצלחה!");
          this.$router.push(`/Dashboard/${completeData.userId || this.userId}`);
          return;
        }

        this.toast?.showSuccess("תשלום בוצע בהצלחה!");
        this.$router.push(`/Dashboard/${this.userId}`);
      } catch (e) {
        this.errorMsg = e?.message || "שגיאה בעיבוד התשלום";
      } finally {
        this.processing = false;
      }
    },
  },
};
</script>

<style scoped lang="scss">
$bg: #0b0b0f;
$text: rgba(255, 255, 255, 0.92);
$muted: rgba(255, 255, 255, 0.6);
$orange: #ff6a00;
$orange2: #ff8a2b;
$font-family: "Heebo", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
  Arial, sans-serif;

.payments-page {
  min-height: 100vh;
  background: $bg;
  padding: 16px;
  color: $text;
  font-family: $font-family;
}

.payments-container {
  max-width: 520px;
  margin: 0 auto;
}

.payments-header {
  margin-bottom: 24px;
}

.payments-back {
  margin-bottom: 12px;
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: $font-family;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba($orange, 0.5);
  }
}

.payments-title {
  font-size: 24px;
  font-weight: 1000;
  color: $orange2;
  margin: 0 0 6px 0;
  text-align: center;
}

.payments-subtitle {
  font-size: 14px;
  font-weight: 600;
  color: $muted;
  margin: 0;
  text-align: center;
}

.subscription-notice {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  margin-bottom: 20px;
  border-radius: 12px;
  background: rgba(255, 106, 0, 0.1);
  border: 1px solid rgba(255, 106, 0, 0.3);
}

.subscription-notice__icon {
  font-size: 24px;
  flex-shrink: 0;
}

.subscription-notice__content {
  flex: 1;
}

.subscription-notice__title {
  font-size: 16px;
  font-weight: 1000;
  color: $orange2;
  margin-bottom: 4px;
}

.subscription-notice__text {
  font-size: 13px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.5;
}

.subscription-notice__resume {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  font-style: italic;
}

.payment-form-wrapper {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba($orange, 0.2);
  border-radius: 16px;
  padding: 24px;
}

.payment-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-label {
  font-size: 13px;
  font-weight: 900;
  color: $text;
}

.stripe-element-container {
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba(255, 255, 255, 0.06);
  transition: all 0.2s ease;

  &:focus-within {
    border-color: $orange;
    box-shadow: 0 0 0 3px rgba($orange, 0.2);
    background: rgba(255, 255, 255, 0.08);
  }
}

.form-input {
  width: 100%;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  font-size: 15px;
  font-weight: 800;
  font-family: $font-family;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: $orange;
    box-shadow: 0 0 0 3px rgba($orange, 0.2);
    background: rgba(255, 255, 255, 0.08);
  }

  &::placeholder {
    color: $muted;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.form-error {
  font-size: 11px;
  font-weight: 700;
  color: #ef4444;
  min-height: 16px;
  line-height: 1.4;

  &--submit {
    text-align: center;
    padding: 10px 12px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 8px;
    margin-top: 4px;
  }
}

.amount-display {
  padding: 14px 16px;
  border-radius: 10px;
  background: rgba($orange, 0.15);
  border: 1px solid rgba($orange, 0.3);
  font-size: 22px;
  font-weight: 1000;
  color: $orange2;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.amount-display__period {
  font-size: 14px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.7);
}

.security-notice {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.security-notice__icon {
  font-size: 16px;
  flex-shrink: 0;
  margin-top: 1px;
}

.security-notice__text {
  font-size: 12px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.5;
}

.payment-submit-btn {
  width: 100%;
  padding: 14px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, $orange, $orange2);
  color: #0b0c10;
  font-size: 16px;
  font-weight: 1000;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: $font-family;
  margin-top: 4px;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba($orange, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

@media (max-width: 768px) {
  .payments-page {
    padding: 12px;
  }

  .payments-header {
    margin-bottom: 20px;
  }

  .payments-title {
    font-size: 22px;
  }

  .payments-subtitle {
    font-size: 13px;
  }

  .payment-form-wrapper {
    padding: 20px;
    border-radius: 14px;
  }

  .payment-form {
    gap: 16px;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

@media (max-width: 400px) {
  .payments-page {
    padding: 10px;
  }

  .payments-header {
    margin-bottom: 18px;
  }

  .payments-title {
    font-size: 20px;
    margin-bottom: 4px;
  }

  .payments-subtitle {
    font-size: 12px;
  }

  .payment-form-wrapper {
    padding: 16px;
    border-radius: 12px;
  }

  .payment-form {
    gap: 14px;
  }

  .form-row {
    gap: 14px;
  }

  .form-label {
    font-size: 12px;
  }

  .form-input {
    padding: 10px 12px;
    font-size: 14px;
    border-radius: 8px;
  }

  .amount-display {
    font-size: 20px;
    padding: 12px 14px;
  }

  .security-notice {
    padding: 10px 12px;
    gap: 8px;
  }

  .security-notice__text {
    font-size: 11px;
  }

  .payment-submit-btn {
    padding: 12px;
    font-size: 15px;
  }
}

/* Wallet Section Styles */
.wallet-section {
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba($orange, 0.2);
}

.wallet-header {
  margin-bottom: 16px;
}

.wallet-title {
  font-size: 16px;
  font-weight: 900;
  color: $orange2;
  margin-bottom: 4px;
}

.wallet-subtitle {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 600;
}

.wallet-button-wrapper {
  margin-bottom: 12px;
}

.wallet-button {
  width: 100%;
}

.wallet-loading {
  padding: 16px;
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  font-weight: 600;
}

.wallet-error {
  padding: 12px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #ef4444;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 12px;
}

.wallet-hint {
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 12px;
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 20px 0;
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
  font-weight: 600;

  &::before,
  &::after {
    content: "";
    flex: 1;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  &::before {
    margin-left: 10px;
  }

  &::after {
    margin-right: 10px;
  }

  span {
    padding: 0 10px;
  }
}
</style>
