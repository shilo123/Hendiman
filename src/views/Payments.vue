<template>
  <div class="payments-page" dir="rtl">
    <div class="payments-container">
      <!-- Header -->
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
              ? "הזן פרטי כרטיס אשראי להרשמה למנוי חודשי"
              : "הזן פרטי כרטיס אשראי"
          }}
        </p>
      </div>

      <!-- Subscription Notice -->
      <div v-if="isSubscription" class="subscription-notice">
        <div class="subscription-notice__icon">📅</div>
        <div class="subscription-notice__content">
          <div class="subscription-notice__title">מנוי חודשי</div>
          <div class="subscription-notice__text">
            התשלום יתבצע מדי חודש אוטומטית. תוכל לבטל את המנוי בכל עת.
            <span v-if="getPendingRegistrationData()" class="subscription-notice__resume">
              <br />אתה ממשיך תהליך הרשמה.
            </span>
          </div>
        </div>
      </div>

      <!-- Payment Form -->
      <div class="payment-form-wrapper">
        <form class="payment-form" @submit.prevent="handlePayment">
          <!-- Amount Display -->
          <div v-if="currentAmount || amount" class="form-field">
            <label class="form-label">סכום לתשלום</label>
            <div class="amount-display">
              {{ formatCurrency(currentAmount || amount) }}
              <span v-if="isSubscription" class="amount-display__period"
                >/חודש</span
              >
            </div>
          </div>

          <!-- Stripe Elements Container -->
          <div class="form-field">
            <label class="form-label">פרטי כרטיס אשראי</label>
            <div id="card-element" class="stripe-element-container">
              <!-- Stripe Elements will mount here -->
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
            <span v-if="isProcessing">
              {{ isSubscription ? "מעבד הרשמה..." : "מעבד תשלום..." }}
            </span>
            <span v-else>
              {{ isSubscription ? "הרשם למנוי" : "שלם" }}
              {{
                currentAmount || amount
                  ? ` ${formatCurrency(currentAmount || amount)}`
                  : ""
              }}
              <span v-if="isSubscription && (currentAmount || amount)"
                >/חודש</span
              >
            </span>
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
  name: "Payments",
  props: {
    id: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      default: null,
    },
    jobId: {
      type: String,
      default: null,
    },
  },
  data() {
    return {
      toast: null,
      userId: this.id,
      stripe: null,
      elements: null,
      cardElement: null,
      stripePublishableKey: null,
      currentJobId: null,
      currentAmount: null,
      isSubscription: false,
      paymentForm: {},
      isProcessing: false,
      submitError: "",
      isStripeReady: false,
    };
  },
  async created() {
    this.toast = useToast();

    // Check if this is a subscription payment
    // Check both query param and localStorage for pending registration
    const hasPendingRegistration = this.getPendingRegistrationData() !== null;
    this.isSubscription =
      this.$route.query.subscription === "true" || hasPendingRegistration;

    // If we have pending registration but no subscription query param, update the route
    if (hasPendingRegistration && !this.$route.query.subscription) {
      this.$router.replace({
        ...this.$route,
        query: { ...this.$route.query, subscription: "true" },
      });
    }

    // Get jobId and amount from query params if not provided as props
    if (this.$route.query.jobId) {
      this.currentJobId = this.$route.query.jobId;
    } else if (this.jobId) {
      this.currentJobId = this.jobId;
    }

    if (this.$route.query.amount) {
      this.currentAmount = parseFloat(this.$route.query.amount);
    } else if (this.amount) {
      this.currentAmount = this.amount;
    } else if (this.isSubscription) {
      // Fetch subscription amount from server
      try {
        const response = await fetch(`${URL}/api/subscription/amount`);
        const data = await response.json();
        if (data.success && data.amount) {
          this.currentAmount = data.amount;
        }
      } catch (error) {
        console.error("Error fetching subscription amount:", error);
      }
    }

    // Get Stripe publishable key from server
    try {
      const response = await fetch(`${URL}/api/stripe/publishable-key`);
      const data = await response.json();
      if (data.publishableKey) {
        this.stripePublishableKey = data.publishableKey;
        this.stripe = await loadStripe(data.publishableKey);

        if (this.stripe) {
          this.elements = this.stripe.elements();
          this.setupCardElement();
        }
      }
    } catch (error) {
      console.error("Error loading Stripe:", error);
      this.submitError = "שגיאה בטעינת מערכת התשלומים. אנא נסה שוב.";
    }
  },
  beforeUnmount() {
    if (this.cardElement) {
      this.cardElement.unmount();
    }
  },
  methods: {
    handleBack() {
      if (this.isSubscription && this.userId === "pending") {
        this.$router.push({ name: "Register" });
      } else {
        this.$router.push(`/Dashboard/${this.userId}`);
      }
    },
    setupCardElement() {
      if (!this.elements) return;

      // Create card element
      this.cardElement = this.elements.create("card", {
        style: {
          base: {
            color: "rgba(255, 255, 255, 0.92)",
            fontFamily:
              '"Heebo", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
            fontSmoothing: "antialiased",
            fontSize: "15px",
            fontWeight: "800",
            "::placeholder": {
              color: "rgba(255, 255, 255, 0.4)",
            },
          },
          invalid: {
            color: "#ef4444",
            iconColor: "#ef4444",
          },
        },
      });

      // Mount card element
      const cardElementContainer = document.getElementById("card-element");
      if (cardElementContainer) {
        this.cardElement.mount("#card-element");
        this.isStripeReady = true;

        // Handle real-time validation errors
        this.cardElement.on("change", (event) => {
          const displayError = document.getElementById("card-errors");
          if (event.error) {
            displayError.textContent = event.error.message;
          } else {
            displayError.textContent = "";
          }
        });
      }
    },
    formatCurrency(amount) {
      return new Intl.NumberFormat("he-IL", {
        style: "currency",
        currency: "ILS",
      }).format(amount || 0);
    },
    async handlePayment() {
      if (!this.isStripeReady || !this.cardElement) {
        this.submitError = "מערכת התשלומים לא נטענה. אנא רענן את הדף.";
        return;
      }

      this.isProcessing = true;
      this.submitError = "";

      try {
        if (this.isSubscription) {
          await this.handleSubscriptionPayment();
        } else {
          await this.handleRegularPayment();
        }
      } catch (error) {
        console.error("Payment error:", error);
        this.submitError = "שגיאה בחיבור לשרת. אנא נסה שוב.";
      } finally {
        this.isProcessing = false;
      }
    },
    async handleSubscriptionPayment() {
      // Step 1: Create subscription on server
      const createSubscriptionResponse = await fetch(
        `${URL}/api/subscription/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            registrationData: this.getPendingRegistrationData(),
          }),
        }
      );

      const subscriptionData = await createSubscriptionResponse.json();

      if (!subscriptionData.success || !subscriptionData.clientSecret) {
        this.submitError =
          subscriptionData.message || "שגיאה ביצירת מנוי. אנא נסה שוב.";
        return;
      }

      // Step 2: Create payment method from card element
      const { error: pmError, paymentMethod } =
        await this.stripe.createPaymentMethod({
          type: "card",
          card: this.cardElement,
        });

      if (pmError || !paymentMethod) {
        this.submitError =
          pmError?.message || "שגיאה ביצירת אמצעי תשלום. אנא נסה שוב.";
        return;
      }

      // Step 3: Confirm setup intent with payment method
      const { error, setupIntent } = await this.stripe.confirmCardSetup(
        subscriptionData.clientSecret,
        {
          payment_method: paymentMethod.id,
        }
      );

      if (error) {
        this.submitError = error.message || "שגיאה באישור המנוי. אנא נסה שוב.";
        return;
      }

      if (setupIntent && setupIntent.status === "succeeded") {
        // Step 4: Complete registration on server
        const completeResponse = await fetch(
          `${URL}/api/subscription/complete`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              setupIntentId: setupIntent.id,
              paymentMethodId: paymentMethod.id,
            }),
          }
        );

        const completeData = await completeResponse.json();

        if (completeData.success) {
          // Clear pending registration
          localStorage.removeItem("pendingHandymanRegistration");

          this.toast?.showSuccess(
            "הרשמה למנוי בוצעה בהצלחה! ברוך הבא להנדימן."
          );

          // Redirect to dashboard
          setTimeout(() => {
            if (completeData.user?._id) {
              this.$router.push({
                name: "Dashboard",
                params: { id: completeData.user._id },
              });
            } else {
              this.$router.push({ name: "logIn" });
            }
          }, 2000);
        } else {
          this.submitError =
            completeData.message ||
            "המנוי אושר אך יש בעיה בעדכון השרת. אנא פנה לתמיכה.";
        }
      } else {
        this.submitError = "מצב מנוי לא צפוי. אנא פנה לתמיכה.";
      }
    },
    async handleRegularPayment() {
      const jobIdToUse = this.currentJobId;
      if (!jobIdToUse) {
        this.submitError = "מספר עבודה לא נמצא. אנא חזור לדשבורד.";
        return;
      }

      // Step 1: Create Payment Intent on server
      const createIntentResponse = await fetch(
        `${URL}/api/payments/create-intent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jobId: jobIdToUse,
          }),
        }
      );

      const intentData = await createIntentResponse.json();

      if (!intentData.success || !intentData.clientSecret) {
        this.submitError =
          intentData.message || "שגיאה ביצירת כוונת תשלום. אנא נסה שוב.";
        return;
      }

      // Step 2: Confirm payment with Stripe Elements
      const { error, paymentIntent } = await this.stripe.confirmCardPayment(
        intentData.clientSecret,
        {
          payment_method: {
            card: this.cardElement,
          },
        }
      );

      if (error) {
        this.submitError = error.message || "שגיאה באישור התשלום. אנא נסה שוב.";
        return;
      }

      // Step 3: Update server with payment confirmation
      if (paymentIntent && paymentIntent.status === "requires_capture") {
        const confirmResponse = await fetch(`${URL}/api/payments/confirm`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jobId: jobIdToUse,
            paymentIntentId: paymentIntent.id,
            stripeStatus: paymentIntent.status,
          }),
        });

        const confirmData = await confirmResponse.json();

        if (confirmData.success) {
          this.toast?.showSuccess(
            "התשלום אושר בהצלחה! הכסף יועבר לאחר אישור סיום העבודה."
          );
          // Redirect to dashboard
          setTimeout(() => {
            this.$router.push(`/Dashboard/${this.userId}`);
          }, 2000);
        } else {
          this.submitError =
            confirmData.message ||
            "התשלום אושר אך יש בעיה בעדכון השרת. אנא פנה לתמיכה.";
        }
      } else {
        this.submitError = "מצב תשלום לא צפוי. אנא פנה לתמיכה.";
      }
    },
    getPendingRegistrationData() {
      try {
        const data = localStorage.getItem("pendingHandymanRegistration");
        if (data) {
          return JSON.parse(data);
        }
      } catch (error) {
        console.error("Error reading pending registration:", error);
      }
      return null;
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
</style>
