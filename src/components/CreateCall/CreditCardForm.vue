<template>
  <div class="cc">
    <section class="panel">
      <header class="panel__head">
        <div class="panel__title">
          <span class="panel__icon" aria-hidden="true">💳</span>
          <span>פרטי אשראי</span>
        </div>
        <div class="panel__req">חובה</div>
      </header>

      <div class="note">
        <div class="note__dot" aria-hidden="true"></div>
        <p class="note__text">הכסף מגיע להנדימן רק אחרי העבודה</p>
      </div>

      <!-- EXPRESS / WALLETS (Apple Pay / Google Pay) -->
      <div v-if="stripe && elements" class="wallet">
        <div class="wallet__head">
          <div class="wallet__title">תשלום מהיר</div>
          <div class="wallet__sub">Apple Pay / Google Pay (אם זמין במכשיר)</div>
        </div>

        <div v-show="walletReady" class="wallet__btnWrap">
          <div :id="walletElementId" class="wallet__btn"></div>
        </div>

        <div v-if="walletLoading" class="skeleton" aria-hidden="true"></div>

        <div v-if="walletError" class="msg msg--err">
          {{ walletError }}
        </div>

        <div v-if="!walletLoading && !walletReady" class="hint">
          לא זמין במכשיר/דפדפן הזה — אפשר לשלם בכרטיס למטה.
        </div>

        <div class="divider"></div>
      </div>

      <div class="form">
        <!-- Stripe Card Element -->
        <div class="field" v-if="stripe && elements">
          <label class="field__label">פרטי כרטיס אשראי</label>

          <div
            class="stripeWrap"
            :class="{ 'stripeWrap--invalid': !!cardError }"
          >
            <span class="stripeWrap__glow" aria-hidden="true"></span>
            <div :id="cardElementId" class="stripeEl"></div>
          </div>

          <div v-if="cardError" class="msg msg--err">{{ cardError }}</div>
        </div>

        <!-- Fallback manual -->
        <template v-else>
          <div class="field">
            <label class="field__label" :for="`cardNumber-${uniqueId}`"
              >מספר כרטיס אשראי</label
            >
            <div class="inputWrap">
              <span class="inputWrap__icon" aria-hidden="true">1234</span>
              <input
                :id="`cardNumber-${uniqueId}`"
                v-model="creditCard.cardNumber"
                type="text"
                inputmode="numeric"
                autocomplete="cc-number"
                class="input"
                placeholder="1234 5678 9012 3456"
                maxlength="19"
                @input="formatCardNumber"
              />
            </div>
            <div v-if="errors.cardNumber" class="msg msg--err">
              {{ errors.cardNumber }}
            </div>
          </div>

          <div class="field">
            <label class="field__label" :for="`cardName-${uniqueId}`"
              >שם על הכרטיס</label
            >
            <div class="inputWrap">
              <span class="inputWrap__icon" aria-hidden="true">Aa</span>
              <input
                :id="`cardName-${uniqueId}`"
                v-model="creditCard.cardName"
                type="text"
                autocomplete="cc-name"
                class="input"
                placeholder="יוסף כהן"
                @input="clearError('cardName')"
              />
            </div>
            <div v-if="errors.cardName" class="msg msg--err">
              {{ errors.cardName }}
            </div>
          </div>

          <div class="grid2">
            <div class="field">
              <label class="field__label" :for="`expiryDate-${uniqueId}`"
                >תאריך תפוגה</label
              >
              <div class="inputWrap">
                <span class="inputWrap__icon" aria-hidden="true">MM/YY</span>
                <input
                  :id="`expiryDate-${uniqueId}`"
                  v-model="creditCard.expiryDate"
                  type="text"
                  inputmode="numeric"
                  autocomplete="cc-exp"
                  class="input"
                  placeholder="MM/YY"
                  maxlength="5"
                  @input="formatExpiryDate"
                />
              </div>
              <div v-if="errors.expiryDate" class="msg msg--err">
                {{ errors.expiryDate }}
              </div>
            </div>

            <div class="field">
              <label class="field__label" :for="`cvv-${uniqueId}`">CVV</label>
              <div class="inputWrap">
                <span class="inputWrap__icon" aria-hidden="true">•••</span>
                <input
                  :id="`cvv-${uniqueId}`"
                  v-model="creditCard.cvv"
                  type="text"
                  inputmode="numeric"
                  autocomplete="cc-csc"
                  class="input"
                  placeholder="123"
                  maxlength="4"
                  @input="formatCVV"
                />
              </div>
              <div v-if="errors.cvv" class="msg msg--err">{{ errors.cvv }}</div>
            </div>
          </div>
        </template>
      </div>
    </section>
  </div>
</template>

<script>
import { loadStripe } from "@stripe/stripe-js";
import { URL } from "@/Url/url";

/**
 * Apple Pay / Google Pay:
 * - כאן השתמשתי ב-Payment Request Button Element (Apple Pay / Google Pay / Link),
 *   עם canMakePayment כדי להציג רק אם זמין. :contentReference[oaicite:0]{index=0}
 *
 * חשוב: כדי "לשלם" באמת עם ארנקים צריך PaymentIntent/SetupIntent בצד שרת.
 * הקומפוננטה הזאת תוציא לך paymentMethod id (בארנק או בכרטיס),
 * ואתה משלים את האישור מול השרת.
 */
export default {
  name: "CreditCardForm",
  props: {
    modelValue: {
      type: Object,
      default: () => ({
        cardNumber: "",
        cardName: "",
        expiryDate: "",
        cvv: "",
      }),
    },
    errors: {
      type: Object,
      default: () => ({}),
    },

    /** סכום לתשלום מהיר (ארנקים). ביחידות הקטנות: ILS=אגורות, USD=סנטים וכו' */
    amount: { type: Number, default: 0 },
    currency: { type: String, default: "ils" },
    country: { type: String, default: "IL" },
    payLabel: { type: String, default: "תשלום" },
  },
  emits: [
    "update:modelValue",
    "update:errors",
    "payment-method-created",
    "validation-changed",
    "wallet-payment-method", // (paymentMethodId, payerDetails)
  ],
  data() {
    return {
      stripe: null,
      elements: null,

      // Card Element
      cardElement: null,
      cardError: null,
      cardElementId: `card-element-${Math.random().toString(36).substring(7)}`,

      // Wallet / PRB
      paymentRequest: null,
      prButton: null,
      walletReady: false,
      walletLoading: false,
      walletError: null,
      walletElementId: `wallet-element-${Math.random()
        .toString(36)
        .substring(7)}`,
      lastWalletEvent: null,

      creditCard: {
        cardNumber: "",
        cardName: "",
        expiryDate: "",
        cvv: "",
      },
      uniqueId: Math.random().toString(36).substring(7),
    };
  },
  watch: {
    modelValue: {
      handler(newVal) {
        if (newVal) this.creditCard = { ...newVal };
      },
      immediate: true,
      deep: true,
    },
    creditCard: {
      handler(newVal) {
        this.$emit("update:modelValue", { ...newVal });
      },
      deep: true,
    },
    cardError(newVal) {
      this.$emit("validation-changed", !newVal);
    },
    // אם הסכום משתנה – מעדכנים את PaymentRequest
    amount() {
      this.updatePaymentRequestTotal();
    },
    payLabel() {
      this.updatePaymentRequestTotal();
    },
  },

  async mounted() {
    try {
      const response = await fetch(`${URL}/api/stripe/publishable-key`);
      const data = await response.json();

      if (!data.publishableKey) return;

      this.stripe = await loadStripe(data.publishableKey);
      if (!this.stripe) return;

      this.elements = this.stripe.elements();

      this.$nextTick(() => {
        this.initStripeCardElement();
        this.initWalletButton();
      });
    } catch (e) {
      // אם Stripe לא נטען, ניפול ל-manual
      console.error("[CreditCardForm] Stripe load error:", e);
    }
  },

  beforeUnmount() {
    try {
      if (this.cardElement) this.cardElement.unmount();
      if (this.prButton) this.prButton.unmount();
    } catch (e) {
      console.error("[CreditCardForm] unmount error:", e);
    }
  },

  methods: {
    // ---------------------------
    // Stripe Card Element
    // ---------------------------
    initStripeCardElement() {
      if (!this.stripe || !this.elements) return;

      const card = this.elements.create("card", {
        style: {
          base: {
            fontSize: "16px",
            color: "#ffffff",
            fontFamily:
              "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
            "::placeholder": { color: "rgba(255,255,255,.45)" },
            iconColor: "#ff6a00",
          },
          invalid: { color: "#ff3b3b", iconColor: "#ff3b3b" },
        },
      });

      card.mount(`#${this.cardElementId}`);
      this.cardElement = card;

      card.on("change", (event) => {
        this.cardError = event.error ? event.error.message : null;
        this.$emit("validation-changed", !event.error);
      });
    },

    // ---------------------------
    // Wallets: Apple Pay / Google Pay
    // Payment Request Button Element
    // ---------------------------
    async initWalletButton() {
      if (!this.stripe || !this.elements) return;

      // Payment Request API doesn't support IL (Israel)
      // List of supported countries from Stripe documentation
      const supportedCountries = [
        "AE",
        "AT",
        "AU",
        "BE",
        "BG",
        "BR",
        "CA",
        "CH",
        "CI",
        "CR",
        "CY",
        "CZ",
        "DE",
        "DK",
        "DO",
        "EE",
        "ES",
        "FI",
        "FR",
        "GB",
        "GI",
        "GR",
        "GT",
        "HK",
        "HR",
        "HU",
        "ID",
        "IE",
        "IN",
        "IT",
        "JP",
        "LI",
        "LT",
        "LU",
        "LV",
        "MT",
        "MX",
        "MY",
        "NL",
        "NO",
        "NZ",
        "PE",
        "PH",
        "PL",
        "PT",
        "RO",
        "SE",
        "SG",
        "SI",
        "SK",
        "SN",
        "TH",
        "TT",
        "US",
        "UY",
      ];

      // Skip wallet initialization if country is not supported
      if (!supportedCountries.includes(this.country)) {
        console.log(
          `[CreditCardForm] Skipping wallet initialization - country ${this.country} not supported by Payment Request API`
        );
        this.walletReady = false;
        this.walletLoading = false;
        return;
      }

      this.walletLoading = true;
      this.walletError = null;
      this.walletReady = false;

      try {
        // יוצרים PaymentRequest
        this.paymentRequest = this.stripe.paymentRequest({
          country: this.country,
          currency: (this.currency || "ils").toLowerCase(),
          total: {
            label: this.payLabel,
            amount: Math.max(0, Number(this.amount || 0)),
          },
          requestPayerName: true,
          requestPayerEmail: true,
        });

        // בודקים אם יש Apple Pay/Google Pay זמין
        const result = await this.paymentRequest.canMakePayment();
        if (!result) {
          this.walletReady = false;
          return;
        }

        // יוצרים PR Button Element
        this.prButton = this.elements.create("paymentRequestButton", {
          paymentRequest: this.paymentRequest,
          style: {
            paymentRequestButton: {
              type: "default",
              theme: "dark",
              height: "48px",
            },
          },
        });

        // אירוע: המשתמש בחר ארנק והתקבל PaymentMethod
        this.paymentRequest.on("paymentmethod", (ev) => {
          // שמור את ה-event כדי שההורה יוכל להשלים success/fail אחרי אישור שרת
          this.lastWalletEvent = ev;

          // מחזירים ל-parent את ה-paymentMethod id + פרטי משלם
          this.$emit("wallet-payment-method", ev.paymentMethod.id, {
            payerName: ev.payerName,
            payerEmail: ev.payerEmail,
            wallet: ev.walletName || null,
          });

          // אל תסגור את ה-sheet פה אם עוד לא אישרת תשלום בשרת.
          // ההורה יקרא ל-completeWalletPayment('success'/'fail')
        });

        this.prButton.mount(`#${this.walletElementId}`);
        this.walletReady = true;
      } catch (e) {
        console.error("[CreditCardForm] wallet init error:", e);
        this.walletError = "לא הצלחתי לאתחל Apple Pay / Google Pay כרגע.";
        this.walletReady = false;
      } finally {
        this.walletLoading = false;
      }
    },

    updatePaymentRequestTotal() {
      if (!this.paymentRequest) return;
      try {
        this.paymentRequest.update({
          total: {
            label: this.payLabel,
            amount: Math.max(0, Number(this.amount || 0)),
          },
        });
      } catch (e) {
        // לא קריטי
      }
    },

    /**
     * ההורה קורא לזה (דרך ref) אחרי שהוא סיים לאשר בשרת (PaymentIntent/SetupIntent).
     * status: 'success' | 'fail'
     */
    completeWalletPayment(status = "success") {
      try {
        if (this.lastWalletEvent) {
          this.lastWalletEvent.complete(status);
          this.lastWalletEvent = null;
        }
      } catch (e) {
        console.error("[CreditCardForm] complete wallet error:", e);
      }
    },

    // ---------------------------
    // Fallback formatting
    // ---------------------------
    formatCardNumber(event) {
      let value = event.target.value.replace(/\s/g, "");
      value = value.replace(/\D/g, "");
      let formattedValue = value.match(/.{1,4}/g)?.join(" ") || value;
      if (formattedValue.length > 19)
        formattedValue = formattedValue.substring(0, 19);
      this.creditCard.cardNumber = formattedValue;
      this.clearError("cardNumber");
    },
    formatExpiryDate(event) {
      let value = event.target.value.replace(/\D/g, "");
      if (value.length >= 2)
        value = value.substring(0, 2) + "/" + value.substring(2, 4);
      this.creditCard.expiryDate = value;
      this.clearError("expiryDate");
    },
    formatCVV(event) {
      let value = event.target.value.replace(/\D/g, "");
      if (value.length > 4) value = value.substring(0, 4);
      this.creditCard.cvv = value;
      this.clearError("cvv");
    },
    clearError(field) {
      if (this.errors[field]) {
        const newErrors = { ...this.errors };
        delete newErrors[field];
        this.$emit("update:errors", newErrors);
      }
    },

    // ---------------------------
    // Public API like before
    // ---------------------------
    async validate() {
      if (this.cardElement) return !this.cardError;

      const errors = {};
      let isValid = true;

      const digits = this.creditCard.cardNumber.replace(/\s/g, "");
      if (digits.length < 13 || digits.length > 19) {
        errors.cardNumber = "מספר כרטיס לא תקין";
        isValid = false;
      }

      if (
        !this.creditCard.cardName ||
        this.creditCard.cardName.trim().length < 2
      ) {
        errors.cardName = "שם על הכרטיס חובה";
        isValid = false;
      }

      const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
      if (!expiryRegex.test(this.creditCard.expiryDate)) {
        errors.expiryDate = "תאריך תפוגה לא תקין (MM/YY)";
        isValid = false;
      }

      if (this.creditCard.cvv.length < 3 || this.creditCard.cvv.length > 4) {
        errors.cvv = "CVV לא תקין";
        isValid = false;
      }

      this.$emit("update:errors", errors);
      return isValid;
    },

    /**
     * יוצר PaymentMethod לכרטיס (Stripe Elements) כמו שהיה לך.
     * ארנקים (Apple/Google Pay) מגיעים דרך האירוע wallet-payment-method.
     */
    async createPaymentMethod() {
      if (!this.stripe) throw new Error("Stripe not initialized");

      const isValid = await this.validate();
      if (!isValid) throw new Error("Credit card validation failed");

      if (this.cardElement) {
        const { error: pmError, paymentMethod: pm } =
          await this.stripe.createPaymentMethod({
            type: "card",
            card: this.cardElement,
            billing_details: { name: this.creditCard.cardName || "Client" },
          });

        if (pmError)
          throw new Error(pmError.message || "שגיאה ביצירת אמצעי תשלום");
        this.$emit("payment-method-created", pm.id);
        return pm.id;
      }

      // manual fallback (לא מומלץ)
      const cardNumberDigits = this.creditCard.cardNumber.replace(/\s/g, "");
      const [month, year] = this.creditCard.expiryDate.split("/");

      const { error: pmError, paymentMethod: pm } =
        await this.stripe.createPaymentMethod({
          type: "card",
          card: {
            number: cardNumberDigits,
            exp_month: parseInt(month),
            exp_year: parseInt("20" + year),
            cvc: this.creditCard.cvv,
          },
          billing_details: { name: this.creditCard.cardName },
        });

      if (pmError || !pm)
        throw new Error(
          pmError?.message || "שגיאה ביצירת אמצעי תשלום. אנא נסה שוב."
        );
      this.$emit("payment-method-created", pm.id);
      return pm.id;
    },
  },
};
</script>

<style lang="scss" scoped>
$bg: #0b0c0f;
$card: rgba(255, 255, 255, 0.06);
$card2: rgba(0, 0, 0, 0.35);
$line: rgba(255, 255, 255, 0.12);
$text: rgba(255, 255, 255, 0.92);
$muted: rgba(255, 255, 255, 0.65);
$orange: #ff6a00;
$danger: #ff3b3b;

.cc {
  width: 100%;
  direction: rtl;
}

.panel {
  position: relative;
  border-radius: 18px;
  padding: 18px;
  background: radial-gradient(
      1200px 400px at 90% 0%,
      rgba($orange, 0.2),
      transparent 55%
    ),
    radial-gradient(
      900px 300px at 15% 15%,
      rgba(255, 255, 255, 0.06),
      transparent 60%
    ),
    linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(0, 0, 0, 0.25));
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 14px 44px rgba(0, 0, 0, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.panel__title {
  display: flex;
  align-items: center;
  gap: 10px;
  color: $text;
  font-weight: 800;
  letter-spacing: 0.2px;
}

.panel__icon {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: rgba($orange, 0.14);
  border: 1px solid rgba($orange, 0.35);
  box-shadow: 0 8px 24px rgba($orange, 0.14);
}

.panel__req {
  font-size: 12px;
  font-weight: 800;
  color: rgba(0, 0, 0, 0.9);
  background: linear-gradient(135deg, rgba($orange, 1), rgba($orange, 0.75));
  padding: 6px 10px;
  border-radius: 999px;
  box-shadow: 0 10px 28px rgba($orange, 0.25);
}

.note {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 12px;
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.28);
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 16px;
}

.note__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: $orange;
  box-shadow: 0 0 0 6px rgba($orange, 0.14);
}

.note__text {
  margin: 0;
  font-size: 14px;
  font-weight: 650;
  color: $muted;
  line-height: 1.5;
}

.wallet {
  margin-bottom: 14px;
}

.wallet__head {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
}

.wallet__title {
  color: $text;
  font-weight: 800;
  font-size: 14px;
}

.wallet__sub {
  color: rgba(255, 255, 255, 0.55);
  font-size: 12px;
}

.wallet__btnWrap {
  border-radius: 16px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.wallet__btn {
  min-height: 48px;
}

.skeleton {
  height: 58px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.06),
    rgba(255, 255, 255, 0.1),
    rgba(255, 255, 255, 0.06)
  );
  background-size: 200% 100%;
  animation: shimmer 1.1s infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.hint {
  margin-top: 10px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
}

.divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin-top: 14px;
}

.form {
  display: grid;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field__label {
  font-size: 13px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.88);
}

.stripeWrap {
  position: relative;
  border-radius: 16px;
  border: 1px solid $line;
  background: $card2;
  overflow: hidden;
  transition: transform 0.12s ease, border-color 0.12s ease,
    background 0.12s ease;
}

.stripeWrap__glow {
  position: absolute;
  inset: -2px;
  background: radial-gradient(
    500px 140px at 70% 0%,
    rgba($orange, 0.3),
    transparent 60%
  );
  pointer-events: none;
  opacity: 0.75;
}

.stripeEl {
  position: relative;
  padding: 14px 12px;
  min-height: 48px;
}

.stripeWrap:focus-within {
  transform: translateY(-1px);
  border-color: rgba($orange, 0.65);
  background: rgba(255, 255, 255, 0.06);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.5);
}

.stripeWrap--invalid {
  border-color: rgba($danger, 0.65);
  background: rgba($danger, 0.08);
}

.inputWrap {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 10px;
  padding: 12px 12px;
  border-radius: 16px;
  border: 1px solid $line;
  background: $card2;
  transition: transform 0.12s ease, border-color 0.12s ease,
    background 0.12s ease;
}

.inputWrap__icon {
  font-size: 12px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.55);
  padding: 6px 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: #fff;
  font-size: 16px;

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
}

.inputWrap:focus-within {
  transform: translateY(-1px);
  border-color: rgba($orange, 0.65);
  background: rgba(255, 255, 255, 0.06);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.5);
}

.grid2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.msg {
  font-size: 12px;
  margin-top: 2px;
}

.msg--err {
  color: rgba($danger, 0.95);
}

/* mobile */
@media (max-width: 520px) {
  .panel {
    padding: 14px;
    border-radius: 16px;
  }
  .grid2 {
    grid-template-columns: 1fr;
  }
}
</style>
