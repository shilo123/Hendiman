<template>
  <div class="subscription-payment-settings" dir="rtl">
    <div class="settings-container">
      <!-- Header -->
      <div class="settings-header">
        <button class="settings-back" type="button" @click="handleBack">
          ← חזור
        </button>
        <h1 class="settings-title">שינוי פרטי תשלום למנוי</h1>
        <p class="settings-subtitle">
          עדכן את פרטי כרטיס האשראי לחיוב המנוי החודשי
        </p>
      </div>

      <!-- Current Subscription Info -->
      <div v-if="subscriptionInfo" class="subscription-info">
        <div class="subscription-info__icon">📅</div>
        <div class="subscription-info__content">
          <div class="subscription-info__title">מנוי פעיל</div>
          <div class="subscription-info__text">
            התשלום הבא: {{ formatDate(subscriptionInfo.nextPaymentDate) }} -
            {{ formatCurrency(subscriptionInfo.amount) }}
          </div>
        </div>
      </div>

      <!-- Payment Form -->
      <div class="payment-form-wrapper">
        <form class="payment-form" @submit.prevent="handleUpdatePayment">
          <!-- Stripe Payment Element -->
          <div class="form-field">
            <label class="form-label">פרטי תשלום חדשים</label>
            <div id="card-element" class="stripe-element-container">
              <!-- Stripe Payment Element will mount here -->
            </div>
            <div id="card-errors" class="form-error" role="alert"></div>
          </div>

          <!-- Security Notice -->
          <div class="security-notice">
            <div class="security-notice__icon">🔒</div>
            <div class="security-notice__text">
              התשלום מאובטח ומצפין. פרטי הכרטיס שלך לא נשמרים בשרת שלנו.
            </div>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            class="payment-submit-btn"
            :disabled="isProcessing || !isStripeReady"
          >
            <span v-if="isProcessing">מעדכן פרטי תשלום...</span>
            <span v-else>עדכן פרטי תשלום</span>
          </button>

          <!-- Error Message -->
          <div v-if="submitError" class="form-error form-error--submit">
            {{ submitError }}
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
  name: "SubscriptionPaymentSettings",
  props: {
    id: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      toast: null,
      userId: this.id,
      stripe: null,
      elements: null,
      paymentElement: null,
      stripePublishableKey: null,
      isProcessing: false,
      submitError: "",
      isStripeReady: false,
      setupIntentClientSecret: null,
      subscriptionInfo: null,
    };
  },
  async created() {
    this.toast = useToast();

    // Fetch subscription info
    await this.fetchSubscriptionInfo();

    // Get Stripe publishable key from server
    try {
      const response = await fetch(`${URL}/api/stripe/publishable-key`);
      const data = await response.json();
      if (data.publishableKey) {
        this.stripePublishableKey = data.publishableKey;
        this.stripe = await loadStripe(data.publishableKey);

        if (this.stripe) {
          // Initialize Payment Element after getting setup intent
          await this.initializePaymentElement();
        }
      }
    } catch (error) {
      this.submitError = "שגיאה בטעינת מערכת התשלומים. אנא נסה שוב.";
    }
  },
  beforeUnmount() {
    if (this.paymentElement) {
      this.paymentElement.unmount();
    }
  },
  methods: {
    handleBack() {
      this.$router.push(`/Dashboard/${this.userId}`);
    },
    async fetchSubscriptionInfo() {
      try {
        const response = await fetch(
          `${URL}/api/subscription/info?userId=${this.userId}`
        );
        const data = await response.json();
        if (data.success && data.subscription) {
          this.subscriptionInfo = data.subscription;
        }
      } catch (error) {
        console.error("Error fetching subscription info:", error);
      }
    },
    async initializePaymentElement() {
      if (!this.stripe) return;

      try {
        // Step 1: Create Setup Intent for updating payment method
        const createSetupIntentResponse = await fetch(
          `${URL}/api/subscription/create-setup-intent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: this.userId,
            }),
          }
        );

        const setupIntentData = await createSetupIntentResponse.json();
        if (!setupIntentData.success || !setupIntentData.clientSecret) {
          this.submitError =
            setupIntentData.message || "שגיאה ביצירת כוונת הגדרה. אנא נסה שוב.";
          return;
        }
        this.setupIntentClientSecret = setupIntentData.clientSecret;

        // Step 2: Create Elements instance with clientSecret
        const elementsOptions = {
          clientSecret: this.setupIntentClientSecret,
          appearance: {
            theme: "night",
            variables: {
              colorPrimary: "#ff6a00",
              colorBackground: "#0b0b0f",
              colorText: "rgba(255, 255, 255, 0.92)",
              colorDanger: "#ef4444",
              fontFamily:
                '"Heebo", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
              spacingUnit: "4px",
              borderRadius: "8px",
            },
            rules: {
              ".Input": {
                backgroundColor: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 106, 0, 0.2)",
                color: "rgba(255, 255, 255, 0.92)",
                fontSize: "15px",
                fontWeight: "800",
              },
              ".Input:focus": {
                border: "1px solid rgba(255, 106, 0, 0.5)",
                boxShadow: "0 0 0 3px rgba(255, 106, 0, 0.18)",
              },
              ".Input--invalid": {
                border: "1px solid #ef4444",
                color: "#ef4444",
              },
            },
          },
          locale: "he",
        };

        this.elements = this.stripe.elements(elementsOptions);

        // Step 3: Create Payment Element
        this.paymentElement = this.elements.create("payment", {
          layout: "tabs",
        });

        // Step 4: Mount Payment Element
        const paymentElementContainer = document.getElementById("card-element");
        if (paymentElementContainer) {
          this.paymentElement.mount("#card-element");
          this.isStripeReady = true;

          // Handle real-time validation errors
          this.paymentElement.on("change", (event) => {
            const displayError = document.getElementById("card-errors");
            if (event.error) {
              displayError.textContent = event.error.message;
            } else {
              displayError.textContent = "";
            }
          });
        }
      } catch (error) {
        this.submitError = "שגיאה באתחול מערכת התשלומים. אנא נסה שוב.";
        console.error("Error initializing Payment Element:", error);
      }
    },
    formatCurrency(amount) {
      return new Intl.NumberFormat("he-IL", {
        style: "currency",
        currency: "ILS",
      }).format(amount || 0);
    },
    formatDate(dateString) {
      if (!dateString) return "";
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("he-IL", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(date);
    },
    async handleUpdatePayment() {
      if (
        !this.isStripeReady ||
        !this.paymentElement ||
        !this.setupIntentClientSecret
      ) {
        this.submitError = "מערכת התשלומים לא נטענה. אנא רענן את הדף.";
        return;
      }

      this.isProcessing = true;
      this.submitError = "";

      try {
        // Step 1: Submit the Payment Element first (required by Stripe)
        const { error: submitError } = await this.elements.submit();
        if (submitError) {
          this.submitError =
            submitError.message || "שגיאה באימות פרטי התשלום. אנא נסה שוב.";
          return;
        }

        // Step 2: Confirm Setup Intent with Payment Element
        const { error, setupIntent } = await this.stripe.confirmSetup({
          elements: this.elements,
          clientSecret: this.setupIntentClientSecret,
          redirect: "if_required",
        });

        if (error) {
          this.submitError =
            error.message || "שגיאה באישור פרטי התשלום. אנא נסה שוב.";
          return;
        }

        if (setupIntent && setupIntent.status === "succeeded") {
          // Step 3: Update subscription payment method on server
          const updateResponse = await fetch(
            `${URL}/api/subscription/update-payment-method`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                userId: this.userId,
                paymentMethodId: setupIntent.payment_method,
              }),
            }
          );

          const updateData = await updateResponse.json();

          if (updateData.success) {
            this.toast?.showSuccess(
              "פרטי התשלום עודכנו בהצלחה! התשלום הבא יתבצע עם הכרטיס החדש."
            );

            // Refresh subscription info
            await this.fetchSubscriptionInfo();

            // Redirect to dashboard after a short delay
            setTimeout(() => {
              this.$router.push(`/Dashboard/${this.userId}`);
            }, 2000);
          } else {
            this.submitError =
              updateData.message ||
              "פרטי התשלום אושרו אך יש בעיה בעדכון השרת. אנא פנה לתמיכה.";
          }
        } else {
          this.submitError = "מצב הגדרה לא צפוי. אנא פנה לתמיכה.";
        }
      } catch (error) {
        this.submitError = error.message || "שגיאה בחיבור לשרת. אנא נסה שוב.";
      } finally {
        this.isProcessing = false;
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

.subscription-payment-settings {
  min-height: 100vh;
  background: $bg;
  padding: 16px;
  color: $text;
  font-family: $font-family;
}

.settings-container {
  max-width: 520px;
  margin: 0 auto;
}

.settings-header {
  margin-bottom: 24px;
}

.settings-back {
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

.settings-title {
  font-size: 24px;
  font-weight: 1000;
  color: $orange2;
  margin: 0 0 6px 0;
  text-align: center;
}

.settings-subtitle {
  font-size: 14px;
  font-weight: 600;
  color: $muted;
  margin: 0;
  text-align: center;
}

.subscription-info {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  margin-bottom: 20px;
  border-radius: 12px;
  background: rgba(255, 106, 0, 0.1);
  border: 1px solid rgba(255, 106, 0, 0.3);
}

.subscription-info__icon {
  font-size: 24px;
  flex-shrink: 0;
}

.subscription-info__content {
  flex: 1;
}

.subscription-info__title {
  font-size: 16px;
  font-weight: 1000;
  color: $orange2;
  margin-bottom: 4px;
}

.subscription-info__text {
  font-size: 13px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.5;
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
  .subscription-payment-settings {
    padding: 12px;
  }

  .settings-header {
    margin-bottom: 20px;
  }

  .settings-title {
    font-size: 22px;
  }

  .settings-subtitle {
    font-size: 13px;
  }

  .payment-form-wrapper {
    padding: 20px;
    border-radius: 14px;
  }

  .payment-form {
    gap: 16px;
  }
}

@media (max-width: 400px) {
  .subscription-payment-settings {
    padding: 10px;
  }

  .settings-header {
    margin-bottom: 18px;
  }

  .settings-title {
    font-size: 20px;
    margin-bottom: 4px;
  }

  .settings-subtitle {
    font-size: 12px;
  }

  .payment-form-wrapper {
    padding: 16px;
    border-radius: 12px;
  }

  .payment-form {
    gap: 14px;
  }
}
</style>
