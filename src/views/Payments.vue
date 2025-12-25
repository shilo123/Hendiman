<template>
  <div class="payments-page" dir="rtl">
    <div class="payments-container">
      <!-- Header -->
      <div class="payments-header">
        <button
          class="payments-back"
          type="button"
          @click="$router.push(`/Dashboard/${userId}`)"
        >
          ← חזור
        </button>
        <h1 class="payments-title">תשלום</h1>
        <p class="payments-subtitle">הזן פרטי כרטיס אשראי</p>
      </div>

      <!-- Payment Form -->
      <div class="payment-form-wrapper">
        <form class="payment-form" @submit.prevent="handlePayment">
          <!-- Card Number -->
          <div class="form-field">
            <label class="form-label" for="cardNumber">
              מספר כרטיס אשראי
            </label>
            <input
              id="cardNumber"
              v-model="paymentForm.cardNumber"
              type="text"
              class="form-input"
              placeholder="1234 5678 9012 3456"
              maxlength="19"
              required
              @input="formatCardNumber"
            />
            <div v-if="errors.cardNumber" class="form-error">
              {{ errors.cardNumber }}
            </div>
          </div>

          <!-- Card Holder Name -->
          <div class="form-field">
            <label class="form-label" for="cardHolder"> שם בעל הכרטיס </label>
            <input
              id="cardHolder"
              v-model="paymentForm.cardHolder"
              type="text"
              class="form-input"
              placeholder="שם מלא כפי שמופיע על הכרטיס"
              required
              @input="validateCardHolder"
            />
            <div v-if="errors.cardHolder" class="form-error">
              {{ errors.cardHolder }}
            </div>
          </div>

          <!-- Expiry Date and CVV -->
          <div class="form-row">
            <div class="form-field">
              <label class="form-label" for="expiryDate"> תאריך תפוגה </label>
              <input
                id="expiryDate"
                v-model="paymentForm.expiryDate"
                type="text"
                class="form-input"
                placeholder="MM/YY"
                maxlength="5"
                required
                @input="formatExpiryDate"
              />
              <div v-if="errors.expiryDate" class="form-error">
                {{ errors.expiryDate }}
              </div>
            </div>

            <div class="form-field">
              <label class="form-label" for="cvv"> CVV </label>
              <input
                id="cvv"
                v-model="paymentForm.cvv"
                type="text"
                class="form-input"
                placeholder="123"
                maxlength="4"
                required
                @input="validateCVV"
              />
              <div v-if="errors.cvv" class="form-error">
                {{ errors.cvv }}
              </div>
            </div>
          </div>

          <!-- Amount (if needed) -->
          <div v-if="amount" class="form-field">
            <label class="form-label">סכום לתשלום</label>
            <div class="amount-display">
              {{ formatCurrency(amount) }}
            </div>
          </div>

          <!-- Billing Address (optional) -->
          <div class="form-field">
            <label class="form-label" for="billingAddress">
              כתובת לחיוב (אופציונלי)
            </label>
            <input
              id="billingAddress"
              v-model="paymentForm.billingAddress"
              type="text"
              class="form-input"
              placeholder="רחוב ומספר בית"
            />
          </div>

          <!-- City and Zip -->
          <div class="form-row">
            <div class="form-field">
              <label class="form-label" for="city"> עיר </label>
              <input
                id="city"
                v-model="paymentForm.city"
                type="text"
                class="form-input"
                placeholder="עיר"
              />
            </div>

            <div class="form-field">
              <label class="form-label" for="zipCode"> מיקוד </label>
              <input
                id="zipCode"
                v-model="paymentForm.zipCode"
                type="text"
                class="form-input"
                placeholder="מיקוד"
                maxlength="7"
              />
            </div>
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
            :disabled="isProcessing || !isFormValid"
          >
            <span v-if="isProcessing">מעבד תשלום...</span>
            <span v-else>שלם {{ amount ? formatCurrency(amount) : "" }}</span>
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
      paymentForm: {
        cardNumber: "",
        cardHolder: "",
        expiryDate: "",
        cvv: "",
        billingAddress: "",
        city: "",
        zipCode: "",
      },
      errors: {},
      isProcessing: false,
      submitError: "",
    };
  },
  computed: {
    isFormValid() {
      return (
        this.paymentForm.cardNumber.replace(/\s/g, "").length >= 13 &&
        this.paymentForm.cardHolder.trim().length >= 2 &&
        this.paymentForm.expiryDate.length === 5 &&
        this.paymentForm.cvv.length >= 3 &&
        !this.errors.cardNumber &&
        !this.errors.cardHolder &&
        !this.errors.expiryDate &&
        !this.errors.cvv
      );
    },
  },
  created() {
    this.toast = useToast();
  },
  methods: {
    formatCardNumber(event) {
      let value = event.target.value.replace(/\s/g, "");
      value = value.replace(/\D/g, ""); // Remove non-digits

      // Format with spaces every 4 digits
      const formatted = value.match(/.{1,4}/g)?.join(" ") || value;
      this.paymentForm.cardNumber = formatted;

      // Validate card number (basic Luhn check)
      if (value.length >= 13) {
        this.validateCardNumber(value);
      } else {
        this.errors.cardNumber = "";
      }
    },
    validateCardNumber(cardNumber) {
      // Luhn algorithm validation
      let sum = 0;
      let isEven = false;
      for (let i = cardNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cardNumber[i]);
        if (isEven) {
          digit *= 2;
          if (digit > 9) digit -= 9;
        }
        sum += digit;
        isEven = !isEven;
      }

      if (sum % 10 !== 0) {
        this.errors.cardNumber = "מספר כרטיס לא תקין";
        return false;
      }
      this.errors.cardNumber = "";
      return true;
    },
    validateCardHolder() {
      const value = this.paymentForm.cardHolder.trim();
      if (value.length < 2) {
        this.errors.cardHolder = "שם חייב להכיל לפחות 2 תווים";
      } else if (
        !/^[\u0590-\u05FF\s]+$/.test(value) &&
        !/^[a-zA-Z\s]+$/.test(value)
      ) {
        this.errors.cardHolder = "שם יכול להכיל רק אותיות";
      } else {
        this.errors.cardHolder = "";
      }
    },
    formatExpiryDate(event) {
      let value = event.target.value.replace(/\D/g, "");

      if (value.length >= 2) {
        value = value.substring(0, 2) + "/" + value.substring(2, 4);
      }

      this.paymentForm.expiryDate = value;

      // Validate expiry date
      if (value.length === 5) {
        this.validateExpiryDate(value);
      } else {
        this.errors.expiryDate = "";
      }
    },
    validateExpiryDate(expiryDate) {
      const [month, year] = expiryDate.split("/");
      const monthNum = parseInt(month);
      const yearNum = parseInt("20" + year);
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;

      if (monthNum < 1 || monthNum > 12) {
        this.errors.expiryDate = "חודש לא תקין";
      } else if (
        yearNum < currentYear ||
        (yearNum === currentYear && monthNum < currentMonth)
      ) {
        this.errors.expiryDate = "כרטיס פג תוקף";
      } else {
        this.errors.expiryDate = "";
      }
    },
    validateCVV() {
      const value = this.paymentForm.cvv.replace(/\D/g, "");
      this.paymentForm.cvv = value;

      if (value.length < 3) {
        this.errors.cvv = "CVV חייב להכיל לפחות 3 ספרות";
      } else if (value.length > 4) {
        this.errors.cvv = "CVV יכול להכיל עד 4 ספרות";
      } else {
        this.errors.cvv = "";
      }
    },
    formatCurrency(amount) {
      return new Intl.NumberFormat("he-IL", {
        style: "currency",
        currency: "ILS",
      }).format(amount || 0);
    },
    async handlePayment() {
      if (!this.isFormValid) {
        this.submitError = "אנא מלא את כל השדות הנדרשים";
        return;
      }

      this.isProcessing = true;
      this.submitError = "";

      try {
        // Prepare payment data (don't send full card number to server in real app)
        const cardNumberDigits = this.paymentForm.cardNumber.replace(/\s/g, "");
        const [month, year] = this.paymentForm.expiryDate.split("/");

        const paymentData = {
          userId: this.userId,
          jobId: this.jobId,
          amount: this.amount,
          cardLast4: cardNumberDigits.slice(-4), // Only last 4 digits for reference
          cardHolder: this.paymentForm.cardHolder,
          expiryMonth: month,
          expiryYear: year,
          billingAddress: this.paymentForm.billingAddress,
          city: this.paymentForm.city,
          zipCode: this.paymentForm.zipCode,
          // In a real app, you would use a payment gateway (Stripe, PayPal, etc.)
          // and never send full card details to your server
        };

        // Send to server (in production, use payment gateway)
        const response = await fetch(`${URL}/payments/process`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(paymentData),
        });

        const data = await response.json();

        if (data.success) {
          this.toast?.showSuccess("התשלום בוצע בהצלחה!");
          // Redirect to success page or dashboard
          setTimeout(() => {
            this.$router.push(`/Dashboard/${this.userId}`);
          }, 1500);
        } else {
          this.submitError = data.message || "שגיאה בעיבוד התשלום";
        }
      } catch (error) {
        console.error("Payment error:", error);
        this.submitError = "שגיאה בחיבור לשרת. אנא נסה שוב.";
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
$font-family: "Assistant", sans-serif;

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
