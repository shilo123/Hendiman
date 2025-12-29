<template>
  <div class="create-call-page" dir="rtl">
    <!-- Loading Screen -->
    <div v-if="isLoading && !foundHandymen.length" class="loading-screen">
      <div class="loadingspinner">
        <div id="square1"></div>
        <div id="square2"></div>
        <div id="square3"></div>
        <div id="square4"></div>
        <div id="square5"></div>
      </div>
      <p class="loading-text">מחפש הנדימנים בעזרת AI</p>

      <!-- Patience Message -->
      <Transition name="patience-message">
        <div v-if="showPatienceMessage" class="patience-message">
          <div class="patience-message__content">
            <span class="patience-message__icon">⏳</span>
            <span class="patience-message__text">{{
              patienceMessageText
            }}</span>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Handymen Results Screen -->
    <div
      v-if="isLoading && foundHandymen.length > 0"
      class="handymen-results-screen"
    >
      <div class="handymen-results-header">
        <h2>הקריאה נוצרה בהצלחה</h2>
        <p class="handymen-results-subtitle">
          הקריאה נשלחה להנדימן והוא יקבל התראה
        </p>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="shell">
      <!-- Top bar -->
      <header class="topbar">
        <button class="topbar__back" type="button" @click="goBack">←</button>
        <div class="topbar__center">
          <div class="topbar__title">הזמנה אישית</div>
        </div>
      </header>

      <!-- Handyman Specialties Display -->
      <section
        v-if="handymanDetails && handymanSpecialties.length > 0"
        class="handyman-specialties-section"
      >
        <div class="handyman-info-card">
          <div class="handyman-info-card__header">
            <h3>תחומי התמחות של {{ handymanDetails.username }}</h3>
          </div>
          <div class="handyman-specialties-list">
            <span
              v-for="(specialty, index) in handymanSpecialties"
              :key="index"
              class="specialty-badge"
            >
              {{ specialty.name }}
            </span>
          </div>
        </div>
      </section>

      <!-- Step Indicator -->
      <div class="step-indicator">
        <div
          class="step-item"
          :class="{ active: currentStep >= 1, completed: currentStep > 1 }"
        >
          <div class="step-number">1</div>
          <div class="step-label">תיאור</div>
        </div>
        <div class="step-line" :class="{ active: currentStep > 1 }"></div>
        <div
          class="step-item"
          :class="{ active: currentStep >= 2, completed: currentStep > 2 }"
        >
          <div class="step-number">2</div>
          <div class="step-label">פרטים</div>
        </div>
        <div class="step-line" :class="{ active: currentStep > 2 }"></div>
        <div
          class="step-item"
          :class="{ active: currentStep >= 3, completed: currentStep > 3 }"
        >
          <div class="step-number">3</div>
          <div class="step-label">תמונות</div>
        </div>
        <div class="step-line" :class="{ active: currentStep > 3 }"></div>
        <div
          class="step-item"
          :class="{ active: currentStep >= 4, completed: currentStep > 4 }"
        >
          <div class="step-number">4</div>
          <div class="step-label">אשראי</div>
        </div>
      </div>

      <!-- Content -->
      <main class="content">
        <!-- STEP 1: Describe what needs to be done -->
        <div
          v-if="currentStep === 1"
          class="step-content step-content--animated"
        >
          <div class="step-container">
            <section class="block">
              <div class="block__head">
                <div class="block__label">תאר בקצרה מה צריך שנעשה?</div>
              </div>

              <input
                class="input-small"
                type="text"
                v-model="call.requests[0]"
                @input="clearError('requests')"
                placeholder="למשל: תליית מדף"
              />

              <div v-if="errors.requests" class="msg msg--err">
                {{ errors.requests }}
              </div>

              <!-- Additional Requests -->
              <div
                v-for="(request, index) in call.requests.slice(1)"
                :key="index"
                class="additional-request"
              >
                <input
                  class="input-small"
                  type="text"
                  v-model="call.requests[index + 1]"
                  :placeholder="`בקשה ${index + 2}`"
                />
                <button
                  type="button"
                  class="remove-request-btn"
                  @click="removeRequest(index + 1)"
                >
                  ✕
                </button>
              </div>

              <button type="button" class="add-request-btn" @click="addRequest">
                ➕ הוסף בקשה נוספת
              </button>
            </section>
          </div>

          <button class="next-btn-animated" type="button" @click="nextStep">
            <svg
              viewBox="0 0 320 512"
              height="1em"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"
              ></path>
            </svg>
            <span>שלב הבא</span>
          </button>
        </div>

        <!-- STEP 2: Expand details + Location -->
        <div
          v-if="currentStep === 2"
          class="step-content step-content--animated"
        >
          <div class="step-container">
            <!-- Loading Categories Card -->
            <section
              v-if="isLoadingCategories"
              class="block block--loading-categories"
            >
              <div class="loading-categories">
                <div class="loading-categories__spinner">
                  <div class="spinner-dot"></div>
                  <div class="spinner-dot"></div>
                  <div class="spinner-dot"></div>
                </div>
                <p class="loading-categories__text">
                  מחפש את התחומים הדרושים לך באמצעות AI
                </p>
              </div>
            </section>

            <!-- Found Categories Card -->
            <section
              v-else-if="foundCategories.length > 0"
              class="block block--found-categories"
            >
              <div class="block__head">
                <div class="block__label">התחומים שנמצאו:</div>
                <button
                  type="button"
                  class="block__refine-btn"
                  @click="refineCategories"
                >
                  זה לא נכון? נסה לדייק יותר
                </button>
              </div>
              <div class="categories-list">
                <div
                  v-for="(category, index) in foundCategories"
                  :key="index"
                  class="category-card"
                >
                  <div class="category-card__header">
                    <span class="category-card__name">
                      {{
                        category.subcategory ||
                        category.category ||
                        `תחום ${index + 1}`
                      }}
                    </span>
                    <span v-if="category.price" class="category-card__price">
                      {{ category.price }} ₪
                    </span>
                  </div>
                  <div class="category-card__details">
                    <span
                      v-if="category.category"
                      class="category-card__category"
                    >
                      קטגוריה: {{ category.category }}
                    </span>
                    <span
                      v-if="category.workType"
                      class="category-card__work-type"
                    >
                      סוג: {{ category.workType }}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section class="block">
              <div class="block__head">
                <div class="block__label">הרחב להנדימן על התקלות</div>
              </div>

              <textarea
                class="textarea"
                v-model="call.desc"
                @input="clearError('desc')"
                rows="6"
                placeholder="תאר בפירוט את הבעיה, מה צריך לתקן, וכל מידע רלוונטי..."
              ></textarea>

              <div v-if="errors.desc" class="msg msg--err">
                {{ errors.desc }}
              </div>
            </section>

            <section class="block block--location">
              <div class="block__head">
                <div class="block__label">מיקום</div>
                <div class="block__req">חובה</div>
              </div>

              <div class="location-content">
                <div v-if="!selectedMapLocation" class="location-input-wrapper">
                  <AddressAutocomplete
                    v-model="call.location"
                    input-id="call-location"
                    :placeholder="
                      usingMyLocation ? 'המיקום שלי' : 'הכנס שם ישוב'
                    "
                    :required="!usingMyLocation && !selectedMapLocation"
                    @update:modelValue="onLocationChange"
                    @update:englishName="onEnglishNameUpdate"
                    @update:selectedCity="onCitySelected"
                  />
                </div>

                <div
                  v-if="
                    call.location &&
                    call.location !== 'המיקום שלי' &&
                    !selectedMapLocation
                  "
                  class="house-number-input"
                >
                  <input
                    type="text"
                    v-model="call.houseNumber"
                    placeholder="מספר בית\בלוק"
                    class="input-small"
                  />
                </div>

                <div v-if="selectedMapLocation" class="selected-location">
                  <span class="selected-location__text"> מיקום נבחר במפה </span>
                  <button
                    type="button"
                    class="selected-location__change"
                    @click="
                      selectedMapLocation = null;
                      call.coordinates = {};
                    "
                  >
                    שנה
                  </button>
                </div>

                <div v-if="!selectedMapLocation" class="location-actions">
                  <button
                    class="location-btn location-btn--map"
                    type="button"
                    @click="openMapPicker"
                  >
                    <span class="location-btn__icon">🗺️</span>
                    <span class="location-btn__text">דקור במפה</span>
                  </button>
                  <button
                    class="location-btn location-btn--gps"
                    type="button"
                    @click="setMyLocation"
                  >
                    <span class="location-btn__icon">📍</span>
                    <span class="location-btn__text">לפי מיקום</span>
                  </button>
                </div>
              </div>

              <div v-if="errors.location" class="msg msg--err">
                {{ errors.location }}
              </div>
            </section>
          </div>

          <div class="step-actions">
            <button class="back-btn" type="button" @click="prevStep">
              חזרה
            </button>
            <button class="next-btn-animated" type="button" @click="nextStep">
              <svg
                viewBox="0 0 320 512"
                height="1em"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"
                ></path>
              </svg>
              <span>שלב הבא</span>
            </button>
          </div>
        </div>

        <!-- STEP 3: Image + Urgent + Work Type + When + Cancel Note + Submit -->
        <div
          v-if="currentStep === 3"
          class="step-content step-content--animated"
        >
          <div class="step-container">
            <section class="block">
              <div class="block__head">
                <div class="block__label">תמונות</div>
                <div class="block__req">חובה</div>
              </div>

              <div class="uploadRow">
                <input
                  :id="`callImage-${call.imageUrls.length}`"
                  type="file"
                  accept="image/*"
                  @change="handleCallImageUpload"
                  class="file-input"
                  :disabled="call.imageUrls.length >= 4"
                />

                <label
                  :for="`callImage-${call.imageUrls.length}`"
                  class="uploadBtn"
                  :class="{
                    'uploadBtn--done': call.imageUrls.length > 0,
                    'uploadBtn--err': errors.image,
                    'uploadBtn--disabled': call.imageUrls.length >= 4,
                  }"
                >
                  <span class="uploadBtn__icon">📷</span>
                  <span class="uploadBtn__txt">
                    {{
                      call.imageUrls.length === 0
                        ? "בחר תמונה"
                        : call.imageUrls.length >= 4
                        ? "הגעת למקסימום (4 תמונות)"
                        : `העלה עוד תמונה (${call.imageUrls.length}/4)`
                    }}
                  </span>
                </label>
              </div>

              <!-- Images Grid -->
              <div
                v-if="
                  call.imageUrls.length > 0 || call.imagePreviews.length > 0
                "
                class="images-grid"
              >
                <div
                  v-for="(img, index) in call.imageUrls.length > 0
                    ? call.imageUrls
                    : call.imagePreviews"
                  :key="index"
                  class="image-item"
                >
                  <img
                    :src="img"
                    :alt="`תמונה ${index + 1}`"
                    class="image-item__img"
                  />
                  <button
                    type="button"
                    class="image-item__remove"
                    @click="removeCallImage(index)"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div v-if="errors.image" class="msg msg--err">
                {{ errors.image }}
              </div>
            </section>

            <section class="block">
              <button
                class="urgentRow"
                :class="{ 'urgentRow--on': call.urgent }"
                type="button"
                @click="onToggleUrgent"
              >
                <span class="urgentRow__left">
                  <span class="toggleDot" />
                  <span class="urgentRow__title">קריאה דחופה</span>
                </span>
                <span class="urgentRow__right">
                  +10 ₪ <span class="chev">›</span>
                </span>
              </button>
            </section>

            <section class="block">
              <div class="twoCols">
                <div class="field">
                  <div class="field__label">סוג עבודה</div>
                  <select class="select" v-model="call.workType">
                    <option value="קלה">קלה</option>
                    <option value="מורכבת">מורכבת</option>
                    <option value="קשה">קשה</option>
                  </select>
                </div>

                <div class="field">
                  <div class="field__label">זמן הגעה</div>
                  <select class="select" v-model="call.when">
                    <option value="asap">כמה שיותר מהר</option>
                    <option value="today">היום</option>
                    <option value="tomorrow">מחר</option>
                    <option value="pick">בחר זמן</option>
                  </select>
                </div>
              </div>
            </section>

            <section class="block block--last">
              <div class="note note--warn">
                <span class="note__icon">⚠️</span>
                <span>קנס על ביטול: <b>250</b> שקלות</span>
              </div>
            </section>
          </div>

          <div class="step-actions">
            <button class="back-btn" type="button" @click="prevStep">
              חזרה
            </button>
            <button class="next-btn-animated" type="button" @click="nextStep">
              <svg
                viewBox="0 0 320 512"
                height="1em"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"
                ></path>
              </svg>
              <span>שלב הבא</span>
            </button>
          </div>
        </div>

        <!-- STEP 4: Credit Card Details -->
        <div
          v-if="currentStep === 4"
          class="step-content step-content--animated"
        >
          <div class="step-container">
            <CreditCardForm
              ref="creditCardForm"
              v-model="creditCard"
              :errors="errors"
              @update:errors="errors = $event"
              @payment-method-created="onPaymentMethodCreated"
              @validation-changed="onCreditCardValidationChanged"
            />
          </div>

          <div class="step-actions">
            <button class="back-btn" type="button" @click="prevStep">
              חזרה
            </button>
            <button
              class="submit-btn"
              type="button"
              @click="onSubmitCall"
              :disabled="isProcessingPayment"
            >
              <span v-if="isProcessingPayment">מעבד תשלום...</span>
              <span v-else>שלח קריאה</span>
            </button>
          </div>
        </div>
      </main>
    </div>

    <!-- Map Picker Modal -->
    <div v-if="showMapPicker" class="map-modal" @click.self="closeMapPicker">
      <div class="map-modal__content">
        <div class="map-modal__header">
          <h3>בחר מיקום במפה</h3>
          <button class="map-modal__close" @click="closeMapPicker">×</button>
        </div>
        <div class="map-modal__map" id="mapPicker"></div>
        <div class="map-modal__footer">
          <button
            class="map-modal__btn map-modal__btn--cancel"
            @click="closeMapPicker"
          >
            ביטול
          </button>
          <button
            class="map-modal__btn map-modal__btn--confirm"
            @click="confirmMapLocation"
          >
            אישור
          </button>
        </div>
      </div>
    </div>

    <!-- Mismatch Modal -->
    <div
      v-if="showMismatchModal"
      class="modal-overlay"
      @click.self="showMismatchModal = false"
    >
      <div class="modal-content">
        <div class="modal-header">
          <h3>תחומי התמחות לא תואמים</h3>
          <button class="modal-close" @click="showMismatchModal = false">
            ×
          </button>
        </div>
        <div class="modal-body">
          <p>התחומים שבחרת לא תואמים את תחומי ההתמחות של ההנדימן.</p>
          <p style="margin-top: 20px; font-weight: 600">
            האם תרצה לעשות קריאה רגילה במקום?
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn btn--secondary" @click="showMismatchModal = false">
            ביטול
          </button>
          <button class="btn btn--primary" @click="goToRegularCall">
            כן, עבור לקריאה רגילה
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AddressAutocomplete from "@/components/AddressAutocomplete.vue";
import CreditCardForm from "@/components/CreditCardForm.vue";
import { URL } from "@/Url/url";
import axios from "axios";
import { useToast } from "@/composables/useToast";
import { useMainStore } from "@/store/index";
import { getCurrentLocation } from "@/utils/geolocation";
import citiesData from "@/APIS/AdressFromIsrael.json";

export default {
  name: "PersonalRequestCall",
  components: {
    AddressAutocomplete,
    CreditCardForm,
  },

  setup() {
    const store = useMainStore();
    return { store };
  },
  data() {
    return {
      toast: null,
      currentStep: 1,
      isLoading: false,
      handymanId: null,
      handymanDetails: null,
      handymanSpecialties: [],
      call: {
        requests: [""],
        desc: "",
        location: "המיקום שלי",
        when: "asap",
        urgent: false,
        images: [],
        imageUrls: [],
        imagePreviews: [],
        coordinates: {},
        workType: "קלה",
      },
      geoCoordinates: null,
      usingMyLocation: false,
      errors: {},
      cities: [],
      locationEnglishName: null,
      selectedCity: null,
      showMapPicker: false,
      mapPicker: null,
      foundHandymen: [],
      mapMarker: null,
      selectedMapLocation: null,
      showPatienceMessage: false,
      patienceMessageInterval: null,
      patienceMessageTimeout: null,
      requestStartTime: null,
      patienceMessageText: "אנחנו מצטערים אך הסבלנות תשתלם",
      isLoadingCategories: false,
      foundCategories: [],
      subcategoryInfoArray: [],
      showMismatchModal: false,
      creditCard: {
        cardNumber: "",
        cardName: "",
        expiryDate: "",
        cvv: "",
      },
      paymentIntentId: null,
      clientSecret: null,
      isProcessingPayment: false,
      isCreditCardValid: false, // Track credit card validation status
    };
  },
  computed: {
    totalPrice() {
      // Calculate total price from all subcategories
      let total = 0;
      if (
        this.subcategoryInfoArray &&
        Array.isArray(this.subcategoryInfoArray)
      ) {
        total = this.subcategoryInfoArray.reduce((sum, subcat) => {
          const price = subcat?.price || 0;
          return (
            sum + (typeof price === "number" ? price : parseFloat(price) || 0)
          );
        }, 0);
      }
      // Add urgent fee (10 ILS) if urgent is selected
      if (this.call.urgent) {
        total += 10;
      }
      return total;
    },
  },
  async created() {
    this.toast = useToast();
    this.handymanId = this.$route.params.handymanId;

    this.cities = Array.isArray(citiesData)
      ? citiesData.filter((city) => {
          if (city.name === "שם_ישוב" || city.שם_ישוב === "שם_ישוב")
            return false;
          return true;
        })
      : [];

    const userCity = this.store?.user?.city;
    if (userCity && userCity.trim()) {
      const cityExists = this.isValidCity(userCity.trim());
      if (cityExists) {
        this.call.location = userCity.trim();
        this.usingMyLocation = false;
      } else {
        this.call.location = "המיקום שלי";
        this.usingMyLocation = true;
      }
    } else {
      this.call.location = "המיקום שלי";
      this.usingMyLocation = true;
    }

    // Load handyman details
    if (this.handymanId) {
      try {
        const response = await axios.get(
          `${URL}/Gethandyman/${this.handymanId}`
        );
        if (response.data.success && response.data.Handyman) {
          this.handymanDetails = response.data.Handyman;
          // Extract only categories (full categories, not subcategories)
          this.handymanSpecialties = (
            response.data.Handyman.specialties || []
          ).filter(
            (s) => s && (s.type === "category" || s.isFullCategory === true)
          );
        }
      } catch (error) {
        this.toast?.showError("שגיאה בטעינת פרטי ההנדימן");
      }
    }

    // Load Stripe for payment processing
    try {
      const response = await fetch(`${URL}/api/stripe/publishable-key`);
      const data = await response.json();
      if (data.publishableKey) {
        this.stripePublishableKey = data.publishableKey;
        this.stripe = await loadStripe(data.publishableKey);
      }
    } catch (error) {
      console.error("Error loading Stripe:", error);
    }
  },

  methods: {
    async getCurrentLocation() {
      return await getCurrentLocation();
    },
    addRequest() {
      this.call.requests.push("");
    },
    removeRequest(index) {
      if (this.call.requests.length > 1) {
        this.call.requests.splice(index, 1);
      }
    },
    async nextStep() {
      if (this.currentStep === 1) {
        const hasValidRequest = this.call.requests.some(
          (req) => req && req.trim().length > 0
        );
        if (!hasValidRequest) {
          this.errors.requests = "יש למלא לפחות בקשה אחת";
          this.toast?.showError("יש למלא לפחות בקשה אחת");
          return;
        }
        this.clearError("requests");

        this.currentStep = 2;
        this.isLoadingCategories = true;
        this.fetchCategoriesFromAI();
        return;
      } else if (this.currentStep === 2) {
        // Validation of categories match is done immediately after receiving them from AI
        // So we don't need to check again here

        if (!this.call.desc || this.call.desc.trim().length < 10) {
          this.errors.desc = "התיאור חייב להכיל לפחות 10 תווים";
          this.toast?.showError("התיאור חייב להכיל לפחות 10 תווים");
          return;
        }
        if (!this.call.location || this.call.location.trim().length === 0) {
          this.errors.location = "יש למלא מיקום";
          this.toast?.showError("יש למלא מיקום");
          return;
        }
        if (
          !this.selectedMapLocation &&
          this.call.location !== "המיקום שלי" &&
          !this.isValidCity(this.call.location)
        ) {
          this.errors.location =
            "ישוב זה לא נמצא במאגר. בחר ישוב מהרשימה או לחץ על 'לפי מיקום'";
          this.toast?.showError(this.errors.location);
          return;
        }
        this.clearError("desc");
        this.clearError("location");
      } else if (this.currentStep === 3) {
        // Validate images
        if (
          this.call.imageUrls.length === 0 &&
          this.call.imagePreviews.length === 0 &&
          this.call.images.length === 0
        ) {
          this.errors.image = "יש להעלות לפחות תמונה אחת";
          this.toast?.showError("יש להעלות לפחות תמונה אחת");
          return;
        }
        this.clearError("image");
      } else if (this.currentStep === 4) {
        // Credit card validation is handled by CreditCardForm component
        // We'll validate when submitting the form
      }

      if (this.currentStep < 4) {
        this.currentStep++;
      }
    },
    validateCategoriesMatch() {
      if (!this.handymanSpecialties || this.handymanSpecialties.length === 0) {
        return true; // If no specialties, allow any category
      }
      if (
        !this.subcategoryInfoArray ||
        this.subcategoryInfoArray.length === 0
      ) {
        return false; // No categories selected
      }

      // Extract category names from handyman specialties
      const handymanCategoryNames = this.handymanSpecialties.map((s) =>
        (s.name || "").trim().toLowerCase()
      );

      // Check if at least one selected category matches handyman specialties
      for (const subcatInfo of this.subcategoryInfoArray) {
        const selectedCategory = (subcatInfo.category || "")
          .trim()
          .toLowerCase();
        if (handymanCategoryNames.includes(selectedCategory)) {
          return true; // At least one match found
        }
      }

      return false; // No matches found
    },
    goToRegularCall() {
      this.showMismatchModal = false;
      const userId = this.$route.params.id;
      this.$router.push({
        name: "CreateCall",
        params: { id: userId },
      });
    },
    prevStep() {
      if (this.currentStep > 1) {
        this.currentStep--;
      }
    },
    setMyLocation() {
      this.call.location = "המיקום שלי";
      this.clearError("location");
      this.usingMyLocation = true;
      this.locationEnglishName = null;
      if (this.geoCoordinates) {
        this.call.coordinates = { ...this.geoCoordinates };
      }
    },
    onLocationChange(value) {
      this.clearError("location");

      if (!value || value.trim() === "" || value !== "המיקום שלי") {
        this.usingMyLocation = false;
        this.call.coordinates = {};

        if (value && value.trim() !== "" && !this.selectedMapLocation) {
          if (!this.isValidCity(value)) {
            this.errors.location =
              "ישוב זה לא נמצא במאגר. בחר ישוב מהרשימה או לחץ על 'לפי מיקום'";
          }
        }
      } else {
        this.usingMyLocation = true;
        if (this.geoCoordinates) {
          this.call.coordinates = { ...this.geoCoordinates };
        }
      }
    },
    onEnglishNameUpdate(englishName) {
      this.locationEnglishName = englishName;
    },
    onCitySelected(city) {
      this.selectedCity = city;
      if (city) {
        this.locationEnglishName =
          city.english_name || city.שם_ישוב_לועזי || null;
      }
    },
    isValidCity(cityName) {
      if (!cityName || cityName.trim() === "" || cityName === "המיקום שלי") {
        return true;
      }

      const searchValue = cityName.trim();
      const normalizedSearch = searchValue.replace(/\s+/g, " ");

      return this.cities.some((city) => {
        const cityNameField = (city.name || city.שם_ישוב || "").trim();
        if (!cityNameField) return false;

        const normalizedCityName = cityNameField.replace(/\s+/g, " ");

        if (normalizedCityName === normalizedSearch) return true;
        if (normalizedCityName.toLowerCase() === normalizedSearch.toLowerCase())
          return true;

        const cleanCity = normalizedCityName.replace(/['"()]/g, "").trim();
        const cleanSearch = normalizedSearch.replace(/['"()]/g, "").trim();
        if (cleanCity === cleanSearch) return true;

        return false;
      });
    },
    goBack() {
      if (this.currentStep > 1) {
        this.prevStep();
      } else {
        this.$router.go(-1);
      }
    },
    onToggleUrgent() {
      this.call.urgent = !this.call.urgent;
    },
    async handleCallImageUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      if (this.call.imageUrls.length >= 4) {
        this.toast?.showError("ניתן להעלות עד 4 תמונות");
        event.target.value = "";
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        this.errors.image = "גודל התמונה חייב להיות קטן מ-5MB";
        event.target.value = "";
        return;
      }

      if (!file.type.startsWith("image/")) {
        this.errors.image = "יש להעלות קובץ תמונה בלבד";
        event.target.value = "";
        return;
      }

      this.clearError("image");

      const reader = new FileReader();
      reader.onload = (e) => {
        this.call.imagePreviews.push(e.target.result);
      };
      reader.readAsDataURL(file);

      this.call.images.push(file);

      try {
        const formData = new FormData();
        formData.append("image", file);

        const uploadUrl = `${URL}/pick-call123`;
        const response = await axios.post(uploadUrl, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 30000,
        });

        if (response.data && response.data.imageUrl) {
          const previewIndex = this.call.imagePreviews.length - 1;
          if (previewIndex >= 0) {
            this.call.imagePreviews.splice(previewIndex, 1);
          }
          this.call.imageUrls.push(response.data.imageUrl);
        }
      } catch (error) {
        this.call.imagePreviews.pop();
        this.call.images.pop();

        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "שגיאה בהעלאת התמונה. נסה שוב.";

        const isCredentialsIssue =
          error.response?.data?.isCredentialsIssue ||
          errorMessage.includes("credentials") ||
          errorMessage.includes("Credential") ||
          errorMessage.includes("AWS") ||
          errorMessage.includes("not configured") ||
          errorMessage.includes("InvalidAccessKeyId") ||
          errorMessage.includes("SignatureDoesNotMatch");

        if (isCredentialsIssue) {
          this.toast.showWarning("התמונה תישמר באופן מקומי (לא הועלתה לענן)");
          this.clearError("image");
        } else {
          this.errors.image = errorMessage;
          this.toast.showError(`שגיאה בהעלאת התמונה: ${errorMessage}`);
        }
      }

      event.target.value = "";
    },
    removeCallImage(index) {
      if (index < this.call.imageUrls.length) {
        this.call.imageUrls.splice(index, 1);
      }
      if (index < this.call.imagePreviews.length) {
        this.call.imagePreviews.splice(index, 1);
      }
      if (index < this.call.images.length) {
        this.call.images.splice(index, 1);
      }
      this.clearError("image");
    },
    clearError(field) {
      if (this.errors[field]) delete this.errors[field];
    },
    formatCardNumber(event) {
      let value = event.target.value.replace(/\s/g, "");
      value = value.replace(/\D/g, "");
      let formattedValue = value.match(/.{1,4}/g)?.join(" ") || value;
      if (formattedValue.length > 19) {
        formattedValue = formattedValue.substring(0, 19);
      }
      this.creditCard.cardNumber = formattedValue;
      this.clearError("cardNumber");
    },
    formatExpiryDate(event) {
      let value = event.target.value.replace(/\D/g, "");
      if (value.length >= 2) {
        value = value.substring(0, 2) + "/" + value.substring(2, 4);
      }
      this.creditCard.expiryDate = value;
      this.clearError("expiryDate");
    },
    formatCVV(event) {
      let value = event.target.value.replace(/\D/g, "");
      if (value.length > 4) {
        value = value.substring(0, 4);
      }
      this.creditCard.cvv = value;
      this.clearError("cvv");
    },
    validateCreditCard() {
      this.errors = {};
      let isValid = true;

      // Validate card number (should be 13-19 digits)
      const cardNumberDigits = this.creditCard.cardNumber.replace(/\s/g, "");
      if (cardNumberDigits.length < 13 || cardNumberDigits.length > 19) {
        this.errors.cardNumber = "מספר כרטיס לא תקין";
        isValid = false;
      }

      // Validate card name
      if (
        !this.creditCard.cardName ||
        this.creditCard.cardName.trim().length < 2
      ) {
        this.errors.cardName = "יש למלא שם על הכרטיס";
        isValid = false;
      }

      // Validate expiry date (MM/YY format)
      const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
      if (!expiryRegex.test(this.creditCard.expiryDate)) {
        this.errors.expiryDate = "תאריך תפוגה לא תקין";
        isValid = false;
      }

      // Validate CVV (should be 3-4 digits)
      if (!this.creditCard.cvv || this.creditCard.cvv.length < 3) {
        this.errors.cvv = "CVV לא תקין";
        isValid = false;
      }

      if (!isValid) {
        this.toast?.showError("יש לתקן את פרטי הכרטיס");
      }

      return isValid;
    },
    openMapPicker() {
      this.showMapPicker = true;
      this.$nextTick(() => {
        this.initMapPicker();
      });
    },
    closeMapPicker() {
      this.showMapPicker = false;
      if (this.mapPicker) {
        this.mapPicker.remove();
        this.mapPicker = null;
        this.mapMarker = null;
      }
    },
    initMapPicker() {
      const loadLeaflet = () => {
        if (typeof window.L !== "undefined") {
          this.createMap();
          return;
        }

        if (!document.querySelector('link[href*="leaflet"]')) {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          link.crossOrigin = "";
          document.head.appendChild(link);
        }

        if (!document.querySelector('script[src*="leaflet"]')) {
          const script = document.createElement("script");
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          script.crossOrigin = "";
          script.onload = () => {
            setTimeout(() => {
              if (typeof window.L !== "undefined") {
                this.createMap();
              } else {
                this.toast?.showError("שגיאה בטעינת המפה. נסה שוב.");
              }
            }, 100);
          };
          script.onerror = () => {
            this.toast?.showError("שגיאה בטעינת המפה. נסה שוב.");
          };
          document.body.appendChild(script);
        } else {
          const checkInterval = setInterval(() => {
            if (typeof window.L !== "undefined") {
              clearInterval(checkInterval);
              this.createMap();
            }
          }, 100);

          setTimeout(() => {
            clearInterval(checkInterval);
            if (typeof window.L === "undefined") {
              this.toast?.showError("שגיאה בטעינת המפה. נסה שוב.");
            }
          }, 5000);
        }
      };

      loadLeaflet();
    },
    createMap() {
      if (typeof window.L === "undefined") {
        this.toast?.showError("שגיאה בטעינת המפה. נסה שוב.");
        return;
      }

      const mapContainer = document.getElementById("mapPicker");
      if (!mapContainer) {
        return;
      }

      if (this.mapPicker) {
        this.mapPicker.remove();
        this.mapPicker = null;
        this.mapMarker = null;
      }

      const defaultLat = this.geoCoordinates?.lat || 32.0853;
      const defaultLng = this.geoCoordinates?.lon || 34.7818;

      try {
        this.mapPicker = window.L.map("mapPicker", {
          center: [defaultLat, defaultLng],
          zoom: 13,
          zoomControl: true,
        });

        window.L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
          }
        ).addTo(this.mapPicker);

        this.mapMarker = window.L.marker([defaultLat, defaultLng], {
          draggable: true,
        }).addTo(this.mapPicker);

        this.mapMarker.on("dragend", () => {
          const position = this.mapMarker.getLatLng();
          this.selectedMapLocation = {
            lat: position.lat,
            lng: position.lng,
          };
        });

        this.mapPicker.on("click", (e) => {
          const { lat, lng } = e.latlng;
          this.mapMarker.setLatLng([lat, lng]);
          this.selectedMapLocation = { lat, lng };
        });

        this.selectedMapLocation = { lat: defaultLat, lng: defaultLng };

        setTimeout(() => {
          if (this.mapPicker) {
            this.mapPicker.invalidateSize();
          }
        }, 100);
      } catch (error) {
        this.toast?.showError("שגיאה ביצירת המפה. נסה שוב.");
      }
    },
    async confirmMapLocation() {
      if (!this.selectedMapLocation) {
        this.toast?.showError("אנא בחר מיקום במפה");
        return;
      }

      const { lat, lng } = this.selectedMapLocation;

      try {
        const response = await axios.get(`${URL}/reverse-geocode`, {
          params: {
            lat: lat,
            lng: lng,
          },
        });

        if (response.data && response.data.success) {
          const cityName = response.data.city || response.data.address || null;

          this.call.location = cityName || "מיקום שנבחר במפה";
          this.locationEnglishName = cityName || null;
          this.call.coordinates = {
            lat: lat,
            lng: lng,
          };
          this.usingMyLocation = false;
          this.selectedMapLocation = { lat, lng };
          this.clearError("location");
        } else {
          this.call.location = "מיקום שנבחר במפה";
          this.locationEnglishName = null;
          this.call.coordinates = {
            lat: lat,
            lng: lng,
          };
          this.usingMyLocation = false;
          this.selectedMapLocation = { lat, lng };
        }

        this.closeMapPicker();
        this.toast?.showSuccess("מיקום נבחר בהצלחה");
      } catch (error) {
        this.call.location = "מיקום שנבחר במפה";
        this.call.coordinates = {
          lat: lat,
          lng: lng,
        };
        this.usingMyLocation = false;
        this.selectedMapLocation = { lat, lng };
        this.clearError("location");
        this.closeMapPicker();
        this.toast?.showSuccess("מיקום נבחר בהצלחה");
      }
    },
    async onSubmitCall() {
      this.errors = {};

      if (
        this.call.imageUrls.length === 0 &&
        this.call.imagePreviews.length === 0 &&
        this.call.images.length === 0
      ) {
        this.errors.image = "יש להעלות לפחות תמונה אחת";
        this.toast?.showError("יש להעלות לפחות תמונה אחת");
        return;
      }

      // Validate categories match again before submit
      if (!this.validateCategoriesMatch()) {
        this.showMismatchModal = true;
        return;
      }

      // Validate credit card if there's a price
      if (this.totalPrice > 0 && !this.validateCreditCard()) {
        return;
      }

      this.isLoading = true;

      try {
        let finalLocation = this.call.location;
        if (this.call.houseNumber && this.call.houseNumber.trim()) {
          finalLocation = `${
            this.call.location
          } ${this.call.houseNumber.trim()}`;
        }

        const callData = {
          requests: this.call.requests.filter((r) => r && r.trim().length > 0),
          desc: this.call.desc,
          location: finalLocation,
          when: this.call.when,
          urgent: this.call.urgent,
          workType: this.call.workType,
          userId: this.$route.params.id || null,
          usingMyLocation: this.usingMyLocation,
          locationEnglishName: this.locationEnglishName || null,
          selectedCity: this.selectedCity || null,
          imageUrls:
            this.call.imageUrls.length > 0
              ? this.call.imageUrls
              : this.call.imagePreviews.length > 0
              ? this.call.imagePreviews
              : [],
          handymanIdSpecial: this.handymanId || null,
        };

        if (this.selectedMapLocation) {
          callData.coordinates = {
            lng: this.selectedMapLocation.lng,
            lat: this.selectedMapLocation.lat,
          };
        } else if (this.usingMyLocation && this.geoCoordinates) {
          callData.coordinates = { ...this.geoCoordinates };
        } else if (
          this.call.coordinates &&
          this.call.coordinates.lat &&
          this.call.coordinates.lng
        ) {
          callData.coordinates = {
            lng: this.call.coordinates.lng,
            lat: this.call.coordinates.lat,
          };
        }

        if (this.usingMyLocation && callData.coordinates) {
          const lng = callData.coordinates.lng ?? callData.coordinates.lon;
          const lat = callData.coordinates.lat;
          if (lng !== undefined && lat !== undefined) {
            callData.coordinates = { lng: Number(lng), lat: Number(lat) };
          }
        } else if (!this.usingMyLocation) {
          delete callData.coordinates;
        }

        callData.subcategoryInfo = this.subcategoryInfoArray;

        // Payment Intent will be created after job creation (when we have the real jobId)
        // We'll redirect to payment page after job is created

        const createCallUrl = `${URL}/create-call-v2`;
        this.requestStartTime = Date.now();
        this.startPatienceMessageInterval();

        const response = await axios.post(createCallUrl, callData, {
          headers: { "Content-Type": "application/json" },
        });
        this.stopPatienceMessageInterval();

        if (response.data.success) {
          this.foundHandymen = [{ _id: this.handymanId }];
          const createdJobId = response.data.jobId || response.data.job?._id;

          // If there's a price, process payment with Stripe
          if (this.totalPrice > 0 && createdJobId) {
            await this.processPayment(createdJobId);
          } else {
            setTimeout(() => {
              this.isLoading = false;
              this.toast.showSuccess("הקריאה נשלחה להנדימן בהצלחה");
              setTimeout(() => {
                this.$router.push({
                  name: "Dashboard",
                  params: { id: this.$route.params.id },
                });
              }, 3000);
            }, 2000);
          }
        } else {
          this.isLoading = false;
          const errorMessage = response.data.message || "שגיאה בשליחת הקריאה";
          this.toast.showError(errorMessage);
        }
      } catch (error) {
        this.stopPatienceMessageInterval();
        this.isLoading = false;
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "שגיאה בשליחת הקריאה. נסה שוב מאוחר יותר.";
        this.toast.showError(`שגיאה בשליחת הקריאה: ${errorMessage}`);
      }
    },
    startPatienceMessageInterval() {
      this.stopPatienceMessageInterval();
      this.patienceMessageText = "אנחנו מצטערים אך הסבלנות תשתלם";
      const updateMessageTimeout = setTimeout(() => {
        if (this.isLoading && !this.foundHandymen.length) {
          this.patienceMessageText = "תנוח אנחנו נעדכן אותך אם מצאנו";
        }
      }, 8000);
      this.patienceMessageInterval = setInterval(() => {
        if (this.isLoading && !this.foundHandymen.length) {
          const elapsed = Date.now() - this.requestStartTime;
          if (elapsed >= 8000) {
            this.patienceMessageText = "תנוח אנחנו נעדכן אותך אם מצאנו";
          }
          this.showPatienceMessage = true;
          setTimeout(() => {
            this.showPatienceMessage = false;
          }, 3000);
        }
      }, 2000);
      this.patienceMessageTimeout = updateMessageTimeout;
    },
    stopPatienceMessageInterval() {
      if (this.patienceMessageInterval) {
        clearInterval(this.patienceMessageInterval);
        this.patienceMessageInterval = null;
      }
      if (this.patienceMessageTimeout) {
        clearTimeout(this.patienceMessageTimeout);
        this.patienceMessageTimeout = null;
      }
      this.showPatienceMessage = false;
      this.patienceMessageText = "אנחנו מצטערים אך הסבלנות תשתלם";
    },
    async fetchCategoriesFromAI() {
      this.foundCategories = [];
      this.subcategoryInfoArray = [];

      try {
        const validRequests = this.call.requests.filter(
          (r) => r && r.trim().length > 0
        );

        const response = await axios.post(
          `${URL}/Get-categor-ofOpenAI`,
          { requests: validRequests },
          {
            headers: { "Content-Type": "application/json" },
          }
        );

        if (response.data.success && response.data.subcategories) {
          this.subcategoryInfoArray = response.data.subcategories;
          this.foundCategories = response.data.subcategories;

          // Check if categories match handyman specialties immediately after receiving them
          if (!this.validateCategoriesMatch()) {
            this.toast?.showError(
              "התחומים שנמצאו לא תואמים להנדימן שבחרת. אנא נסה שוב עם בקשה אחרת."
            );
            this.foundCategories = [];
            this.subcategoryInfoArray = [];
            this.currentStep = 1;
            this.isLoadingCategories = false;
            return;
          }
        } else {
          this.toast?.showError(
            response.data.message || "לא נמצאו תחומים מתאימים"
          );
        }
      } catch (error) {
        this.toast?.showError("שגיאה בחיפוש התחומים. נסה שוב מאוחר יותר.");
      } finally {
        this.isLoadingCategories = false;
      }
    },
    refineCategories() {
      this.foundCategories = [];
      this.subcategoryInfoArray = [];
      this.isLoadingCategories = false;
      this.currentStep = 1;
    },
    async processPayment(jobId) {
      if (!this.stripe) {
        this.isLoading = false;
        this.toast?.showError("מערכת התשלומים לא נטענה. אנא רענן את הדף.");
        return;
      }

      this.isProcessingPayment = true;

      try {
        // Step 1: Create Payment Intent on server
        const createIntentResponse = await fetch(
          `${URL}/api/payments/create-intent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              jobId: jobId,
            }),
          }
        );

        const intentData = await createIntentResponse.json();

        if (!intentData.success || !intentData.clientSecret) {
          this.isLoading = false;
          this.isProcessingPayment = false;
          this.toast?.showError(
            intentData.message || "שגיאה ביצירת כוונת תשלום. אנא נסה שוב."
          );
          return;
        }

        // Step 2: Create payment method
        const cardNumberDigits = this.creditCard.cardNumber.replace(/\s/g, "");
        const [month, year] = this.creditCard.expiryDate.split("/");

        const { error: pmError, paymentMethod } =
          await this.stripe.createPaymentMethod({
            type: "card",
            card: {
              number: cardNumberDigits,
              exp_month: parseInt(month),
              exp_year: parseInt("20" + year),
              cvc: this.creditCard.cvv,
            },
            billing_details: {
              name: this.creditCard.cardName,
            },
          });

        if (pmError || !paymentMethod) {
          this.isLoading = false;
          this.isProcessingPayment = false;
          this.toast?.showError(
            pmError?.message || "שגיאה ביצירת אמצעי תשלום. אנא נסה שוב."
          );
          return;
        }

        // Step 3: Confirm payment with Stripe.js
        const { error, paymentIntent } = await this.stripe.confirmCardPayment(
          intentData.clientSecret,
          {
            payment_method: paymentMethod.id,
          }
        );

        if (error) {
          this.isLoading = false;
          this.isProcessingPayment = false;
          this.toast?.showError(
            error.message || "שגיאה באישור התשלום. אנא נסה שוב."
          );
          return;
        }

        // Step 4: Update server with payment confirmation
        if (paymentIntent && paymentIntent.status === "requires_capture") {
          const confirmResponse = await fetch(`${URL}/api/payments/confirm`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              jobId: jobId,
              paymentIntentId: paymentIntent.id,
              stripeStatus: paymentIntent.status,
            }),
          });

          const confirmData = await confirmResponse.json();

          if (confirmData.success) {
            this.isLoading = false;
            this.isProcessingPayment = false;
            this.toast?.showSuccess(
              "הקריאה נשלחה להנדימן בהצלחה. התשלום אושר בהצלחה! הכסף יועבר לאחר אישור סיום העבודה."
            );
            setTimeout(() => {
              this.$router.push({
                name: "Dashboard",
                params: { id: this.$route.params.id },
              });
            }, 3000);
          } else {
            this.isLoading = false;
            this.isProcessingPayment = false;
            this.toast?.showError(
              confirmData.message ||
                "התשלום אושר אך יש בעיה בעדכון השרת. אנא פנה לתמיכה."
            );
          }
        } else {
          this.isLoading = false;
          this.isProcessingPayment = false;
          this.toast?.showError("מצב תשלום לא צפוי. אנא פנה לתמיכה.");
        }
      } catch (error) {
        console.error("Payment error:", error);
        this.isLoading = false;
        this.isProcessingPayment = false;
        this.toast?.showError("שגיאה בעיבוד התשלום. אנא נסה שוב.");
      }
    },
  },
  beforeUnmount() {
    this.stopPatienceMessageInterval();
  },

  async mounted() {
    try {
      const loc = await this.getCurrentLocation();
      this.geoCoordinates = { lat: loc.lat, lon: loc.lon };
      if (this.usingMyLocation) {
        this.call.coordinates = { ...this.geoCoordinates };
      }
    } catch (err) {
      // Silent fail - location is optional
    }
  },
};
</script>

<style lang="scss" scoped>
$bg: #0b0b0f;
$bg2: #0f1016;
$stroke: rgba(255, 255, 255, 0.1);
$text: rgba(255, 255, 255, 0.92);
$muted: rgba(255, 255, 255, 0.62);
$orange: #ff6a00;
$orange2: #ff8a2b;
$orange3: #ffb36b;
$danger: #ff3b3b;

.create-call-page {
  min-height: 100vh;
  background: linear-gradient(180deg, $bg, $bg2);
}

// Handyman specialties section styles
.handyman-specialties-section {
  margin-bottom: 20px;
}

.handyman-info-card {
  border: 1px solid rgba(255, 106, 0, 0.3);
  border-radius: 16px;
  background: rgba(255, 106, 0, 0.1);
  padding: 16px;
}

.handyman-info-card__header {
  margin-bottom: 12px;

  h3 {
    font-size: 16px;
    font-weight: 1100;
    color: $text;
    margin: 0;
  }
}

.handyman-specialties-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.specialty-badge {
  display: inline-block;
  padding: 8px 14px;
  border-radius: 12px;
  background: rgba(255, 106, 0, 0.2);
  border: 1px solid rgba(255, 106, 0, 0.4);
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  font-weight: 900;
}

.shell {
  max-width: 400px;
  width: 100%;
  margin: 0 auto;
  padding: 14px 14px calc(96px + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 16, 22, 0.95);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.loading-text {
  color: $text;
  font-size: 18px;
  font-weight: 1100;
  margin-top: 20px;
}

.patience-message {
  margin-top: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.patience-message__content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 24px;
  background: linear-gradient(135deg, rgba($orange, 0.15), rgba($orange2, 0.1));
  border: 1px solid rgba($orange, 0.3);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba($orange, 0.2);
  backdrop-filter: blur(8px);
}

.patience-message__icon {
  font-size: 20px;
  animation: pulse 1.5s ease-in-out infinite;
}

.patience-message__text {
  color: $orange3;
  font-size: 15px;
  font-weight: 900;
  letter-spacing: 0.3px;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

.patience-message-enter-active {
  animation: slideInUp 0.4s ease-out;
}

.patience-message-leave-active {
  animation: slideOutDown 0.4s ease-in;
}

.patience-message-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.patience-message-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes slideOutDown {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
}

.loadingspinner {
  --square: 26px;
  --offset: 30px;
  --duration: 2.4s;
  --delay: 0.2s;
  --timing-function: ease-in-out;
  --in-duration: 0.4s;
  --in-delay: 0.1s;
  --in-timing-function: ease-out;
  width: calc(3 * var(--offset) + var(--square));
  height: calc(2 * var(--offset) + var(--square));
  padding: 0px;
  margin-left: auto;
  margin-right: auto;
  margin-top: 10px;
  margin-bottom: 30px;
  position: relative;
}

.loadingspinner div {
  display: inline-block;
  background: darkorange;
  border: none;
  border-radius: 2px;
  width: var(--square);
  height: var(--square);
  position: absolute;
  padding: 0px;
  margin: 0px;
  font-size: 6pt;
  color: black;
}

.loadingspinner #square1 {
  left: calc(0 * var(--offset));
  top: calc(0 * var(--offset));
  animation: square1 var(--duration) var(--delay) var(--timing-function)
      infinite,
    squarefadein var(--in-duration) calc(1 * var(--in-delay))
      var(--in-timing-function) both;
}

.loadingspinner #square2 {
  left: calc(0 * var(--offset));
  top: calc(1 * var(--offset));
  animation: square2 var(--duration) var(--delay) var(--timing-function)
      infinite,
    squarefadein var(--in-duration) calc(1 * var(--in-delay))
      var(--in-timing-function) both;
}

.loadingspinner #square3 {
  left: calc(1 * var(--offset));
  top: calc(1 * var(--offset));
  animation: square3 var(--duration) var(--delay) var(--timing-function)
      infinite,
    squarefadein var(--in-duration) calc(2 * var(--in-delay))
      var(--in-timing-function) both;
}

.loadingspinner #square4 {
  left: calc(2 * var(--offset));
  top: calc(1 * var(--offset));
  animation: square4 var(--duration) var(--delay) var(--timing-function)
      infinite,
    squarefadein var(--in-duration) calc(3 * var(--in-delay))
      var(--in-timing-function) both;
}

.loadingspinner #square5 {
  left: calc(3 * var(--offset));
  top: calc(1 * var(--offset));
  animation: square5 var(--duration) var(--delay) var(--timing-function)
      infinite,
    squarefadein var(--in-duration) calc(4 * var(--in-delay))
      var(--in-timing-function) both;
}

@keyframes square1 {
  0% {
    left: calc(0 * var(--offset));
    top: calc(0 * var(--offset));
  }
  8.333% {
    left: calc(0 * var(--offset));
    top: calc(1 * var(--offset));
  }
  100% {
    left: calc(0 * var(--offset));
    top: calc(1 * var(--offset));
  }
}

@keyframes square2 {
  0% {
    left: calc(0 * var(--offset));
    top: calc(1 * var(--offset));
  }
  8.333% {
    left: calc(0 * var(--offset));
    top: calc(2 * var(--offset));
  }
  16.67% {
    left: calc(1 * var(--offset));
    top: calc(2 * var(--offset));
  }
  25.00% {
    left: calc(1 * var(--offset));
    top: calc(1 * var(--offset));
  }
  83.33% {
    left: calc(1 * var(--offset));
    top: calc(1 * var(--offset));
  }
  91.67% {
    left: calc(1 * var(--offset));
    top: calc(0 * var(--offset));
  }
  100% {
    left: calc(0 * var(--offset));
    top: calc(0 * var(--offset));
  }
}

@keyframes square3 {
  0%,
  100% {
    left: calc(1 * var(--offset));
    top: calc(1 * var(--offset));
  }
  16.67% {
    left: calc(1 * var(--offset));
    top: calc(1 * var(--offset));
  }
  25.00% {
    left: calc(1 * var(--offset));
    top: calc(0 * var(--offset));
  }
  33.33% {
    left: calc(2 * var(--offset));
    top: calc(0 * var(--offset));
  }
  41.67% {
    left: calc(2 * var(--offset));
    top: calc(1 * var(--offset));
  }
  66.67% {
    left: calc(2 * var(--offset));
    top: calc(1 * var(--offset));
  }
  75.00% {
    left: calc(2 * var(--offset));
    top: calc(2 * var(--offset));
  }
  83.33% {
    left: calc(1 * var(--offset));
    top: calc(2 * var(--offset));
  }
  91.67% {
    left: calc(1 * var(--offset));
    top: calc(1 * var(--offset));
  }
}

@keyframes square4 {
  0% {
    left: calc(2 * var(--offset));
    top: calc(1 * var(--offset));
  }
  33.33% {
    left: calc(2 * var(--offset));
    top: calc(1 * var(--offset));
  }
  41.67% {
    left: calc(2 * var(--offset));
    top: calc(2 * var(--offset));
  }
  50.00% {
    left: calc(3 * var(--offset));
    top: calc(2 * var(--offset));
  }
  58.33% {
    left: calc(3 * var(--offset));
    top: calc(1 * var(--offset));
  }
  100% {
    left: calc(3 * var(--offset));
    top: calc(1 * var(--offset));
  }
}

@keyframes square5 {
  0% {
    left: calc(3 * var(--offset));
    top: calc(1 * var(--offset));
  }
  50.00% {
    left: calc(3 * var(--offset));
    top: calc(1 * var(--offset));
  }
  58.33% {
    left: calc(3 * var(--offset));
    top: calc(0 * var(--offset));
  }
  66.67% {
    left: calc(2 * var(--offset));
    top: calc(0 * var(--offset));
  }
  75.00% {
    left: calc(2 * var(--offset));
    top: calc(1 * var(--offset));
  }
  100% {
    left: calc(2 * var(--offset));
    top: calc(1 * var(--offset));
  }
}

@keyframes squarefadein {
  0% {
    transform: scale(0.75);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.handymen-results-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: $bg;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow-y: auto;
}

.handymen-results-header {
  text-align: center;
  margin-bottom: 24px;
  padding-top: 40px;
}

.handymen-results-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: $text;
  margin: 0 0 8px 0;
}

.handymen-results-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

.topbar {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 10px;
  padding: 10px 0 12px;
}

.topbar__back {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  border: 1px solid $stroke;
  background: rgba(255, 255, 255, 0.04);
  color: $text;
  font-weight: 1000;
  cursor: pointer;
}

.topbar__center {
  min-width: 0;
}

.topbar__title {
  font-size: 20px;
  font-weight: 1100;
  color: $text;
  line-height: 1.2;
}

.step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px 0;
  margin-bottom: 20px;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 1100;
  font-size: 16px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: $muted;
  transition: all 0.3s;
}

.step-item.active .step-number {
  border-color: $orange;
  background: rgba($orange, 0.2);
  color: $orange;
}

.step-item.completed .step-number {
  border-color: $orange;
  background: linear-gradient(135deg, $orange, $orange2);
  color: #111;
}

.step-label {
  font-size: 12px;
  font-weight: 900;
  color: $muted;
  transition: all 0.3s;
}

.step-item.active .step-label {
  color: $text;
}

.step-line {
  flex: 1;
  height: 2px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0 10px;
  transition: all 0.3s;
}

.step-line.active {
  background: linear-gradient(90deg, $orange, $orange2);
}

.content {
  display: grid;
  gap: 12px;
  min-height: 0;
}

.step-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: slideIn 0.4s ease-out;
  min-height: 0;
}

.step-content--animated {
  animation: slideIn 0.4s ease-out;
}

.step-container {
  border: 1px solid $stroke;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.03);
  padding: 12px;
  display: grid;
  gap: 12px;
  max-height: calc(100vh - 250px);
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;
}

.step-container::-webkit-scrollbar {
  width: 6px;
}

.step-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.step-container::-webkit-scrollbar-thumb {
  background: rgba($orange, 0.5);
  border-radius: 10px;
}

.step-container::-webkit-scrollbar-thumb:hover {
  background: rgba($orange, 0.7);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.block--loading-categories {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.loading-categories {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.loading-categories__spinner {
  display: flex;
  gap: 8px;
}

.spinner-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: $orange;
  animation: pulse 1.4s ease-in-out infinite;
}

.spinner-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.spinner-dot:nth-child(3) {
  animation-delay: 0.4s;
}

.loading-categories__text {
  color: $text;
  font-weight: 1000;
  font-size: 15px;
  text-align: center;
}

.block--found-categories {
  background: rgba($orange, 0.1);
  border-color: rgba($orange, 0.3);
}

.categories-list {
  display: grid;
  gap: 12px;
  margin-top: 12px;
}

.category-card {
  padding: 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s;
}

.category-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba($orange, 0.4);
}

.category-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.category-card__name {
  color: $text;
  font-weight: 1100;
  font-size: 15px;
  flex: 1;
}

.category-card__price {
  color: $orange;
  font-weight: 1200;
  font-size: 16px;
  background: rgba($orange, 0.15);
  padding: 4px 10px;
  border-radius: 8px;
}

.category-card__details {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
}

.category-card__category,
.category-card__work-type {
  color: rgba(255, 255, 255, 0.7);
  font-weight: 900;
}

.block {
  border: 1px solid $stroke;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.03);
  padding: 12px;
  min-height: 120px;
  display: flex;
  flex-direction: column;
}

.block--last {
  padding-bottom: 14px;
}

.block--credit {
  min-height: auto;

  @media (max-width: 768px) {
    .credit-form {
      max-width: 370px;
      margin: 0 auto;
    }
  }
}

.credit-info {
  margin-bottom: 20px;
  padding: 14px;
  border-radius: 12px;
  background: rgba($orange, 0.1);
  border: 1px solid rgba($orange, 0.3);
}

.credit-info__text {
  margin: 0;
  color: $orange3;
  font-weight: 1100;
  font-size: 14px;
  text-align: center;
}

.credit-form {
  display: grid;
  gap: 16px;
}

.block__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.block__label {
  font-size: 13px;
  font-weight: 1100;
  color: $text;
}

.block__refine-btn {
  font-size: 11px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.7);
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 6px 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  margin-top: 4px;
}

.block__refine-btn:hover {
  color: $orange3;
  border-color: rgba($orange, 0.3);
  background: rgba($orange, 0.1);
}

@media (max-width: 450px) {
  .block__refine-btn {
    font-size: 10px;
    padding: 5px 8px;
  }
}

.block__req {
  font-size: 11px;
  font-weight: 1000;
  color: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba($orange, 0.25);
  background: rgba($orange, 0.1);
  padding: 3px 8px;
  border-radius: 999px;
}

.additional-request {
  position: relative;
  margin-top: 12px;
}

.remove-request-btn {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid rgba($danger, 0.3);
  background: rgba($danger, 0.1);
  color: $danger;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.add-request-btn {
  width: 100%;
  margin-top: 12px;
  padding: 12px;
  border-radius: 14px;
  border: 1px dashed rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.03);
  color: $text;
  font-weight: 1100;
  cursor: pointer;
  transition: all 0.2s;
}

.add-request-btn:hover {
  border-color: rgba($orange, 0.4);
  background: rgba($orange, 0.1);
}

.input-small {
  width: 100%;
  box-sizing: border-box;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.22);
  color: $text;
  padding: 14px 12px;
  font-weight: 900;
  font-size: 16px;
  min-height: 48px;
}

.textarea,
.select {
  width: 100%;
  box-sizing: border-box;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.22);
  color: $text;
  padding: 14px 12px;
  font-weight: 900;
  font-size: 16px;
}

.textarea {
  min-height: 120px;
  resize: vertical;
  line-height: 1.5;
}

.select {
  min-height: 48px;
}

.is-err,
.input-error {
  border-color: rgba($danger, 0.55) !important;
  background: rgba($danger, 0.08) !important;
}

.msg {
  margin-top: 8px;
  font-size: 12px;
  font-weight: 900;
}

.msg--err {
  color: rgba(220, 53, 69, 0.95);
}

.msg--hint {
  color: rgba(255, 255, 255, 0.55);
}

.uploadRow {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.file-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  overflow: hidden;
}

.uploadBtn {
  flex: 1 1 auto;
  min-width: 180px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 12px;
  border-radius: 14px;
  border: 1px solid rgba($orange, 0.22);
  background: rgba($orange, 0.1);
  color: $text;
  cursor: pointer;
  font-weight: 1100;
}

.uploadBtn--done {
  border-color: rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.82);
}

.uploadBtn--err {
  border-color: rgba($danger, 0.55);
  background: rgba($danger, 0.1);
}

.images-grid {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.image-item {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.25);
  aspect-ratio: 1;
}

.image-item__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.image-item__remove {
  position: absolute;
  top: 6px;
  left: 6px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid rgba($danger, 0.3);
  background: rgba($danger, 0.2);
  color: $danger;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: all 0.2s;
}

.image-item__remove:hover {
  background: rgba($danger, 0.4);
  border-color: rgba($danger, 0.5);
  transform: scale(1.1);
}

.uploadBtn--disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.block--location {
  min-height: 200px;
}

.location-content {
  display: grid;
  gap: 12px;
}

.location-input-wrapper {
  width: 100%;
}

.house-number-input {
  width: 100%;
}

.house-number-input .input-small {
  width: 100%;
  padding: 12px 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: $text;
  font-size: 15px;
  font-weight: 500;
  transition: all 0.2s;
}

.house-number-input .input-small:focus {
  outline: none;
  border-color: $orange;
  background: rgba(255, 255, 255, 0.06);
}

.selected-location {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(255, 159, 28, 0.1);
  border: 1px solid rgba(255, 159, 28, 0.3);
}

.selected-location__text {
  color: $text;
  font-weight: 600;
  font-size: 15px;
}

.selected-location__change {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: $text;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.selected-location__change:hover {
  background: rgba(255, 255, 255, 0.15);
}

.location-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 8px;
}

.location-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 16px;
  border-radius: 14px;
  font-weight: 1100;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  min-height: 50px;
}

.location-btn--map {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.9);
}

.location-btn--map:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.location-btn--gps {
  background: linear-gradient(135deg, $orange, $orange2);
  color: #111;
}

.location-btn--gps:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba($orange, 0.4);
}

.location-btn__icon {
  font-size: 18px;
}

.location-btn__text {
  font-weight: 1100;
}

.twoCols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

@media (max-width: 450px) {
  .twoCols {
    grid-template-columns: 1fr;
  }
}

.field__label {
  font-size: 12px;
  font-weight: 1100;
  color: rgba(255, 255, 255, 0.78);
  margin-bottom: 8px;
}

.urgentRow {
  width: 100%;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.18);
  padding: 12px 12px;
  color: $text;
  font-weight: 1100;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.urgentRow__left {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.toggleDot {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  border: 2px solid rgba($orange, 0.7);
  background: transparent;
}

.urgentRow--on {
  border-color: rgba($danger, 0.55);
  background: rgba($danger, 0.12);
}

.urgentRow--on .toggleDot {
  background: $orange;
  box-shadow: 0 0 0 4px rgba($orange, 0.18);
  border-color: rgba($orange, 0.8);
}

.urgentRow__right {
  color: rgba(255, 255, 255, 0.82);
  font-weight: 1100;
  white-space: nowrap;
}

.chev {
  opacity: 0.7;
  margin-right: 4px;
}

.note {
  margin-top: 10px;
  border-radius: 14px;
  padding: 12px 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.18);
  display: flex;
  gap: 10px;
  align-items: center;
  color: rgba(255, 255, 255, 0.86);
  font-weight: 1000;
}

.note--warn {
  border-color: rgba($danger, 0.3);
  background: rgba($danger, 0.1);
}

.note__icon {
  width: 28px;
  height: 28px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.step-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.next-btn-animated {
  --color: 255, 106, 0;
  flex: 1;
  border-radius: 14px;
  transition: 0.3s;
  background-color: rgba(var(--color), 0.2);
  color: rgb(var(--color));
  fill: rgb(var(--color));
  font-weight: 1100;
  font-size: 16px;
  cursor: pointer;
  border: 2px solid rgb(var(--color));
  box-shadow: 0 0 10px rgba(var(--color), 0.4);
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 24px;
  gap: 8px;
}

.next-btn-animated:hover {
  box-shadow: 0 0 0 5px rgba(var(--color), 0.5);
}

.next-btn-animated span {
  transform: scale(0.8);
  transition: 0.3s;
}

.next-btn-animated:hover span {
  transform: scale(1);
}

.next-btn-animated svg {
  font-size: 0;
  transform: scale(0.5) translateX(0%) rotate(180deg);
  transition: 0.3s;
  width: 1em;
  height: 1em;
}

.next-btn-animated:hover svg {
  font-size: 20px;
  transform: scale(1) translateX(-20%) rotate(0deg);
}

.next-btn-animated:active {
  transition: 0s;
  box-shadow: 0 0 0 5px rgb(var(--color));
}

.back-btn,
.submit-btn {
  flex: 1;
  padding: 16px 24px;
  border-radius: 14px;
  font-weight: 1100;
  font-size: 16px;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.submit-btn {
  background: linear-gradient(135deg, $orange, $orange2);
  color: #111;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba($orange, 0.4);
}

.back-btn {
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  border: 1px solid $stroke;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.map-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

.map-modal__content {
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  background: $bg2;
  border-radius: 20px;
  border: 1px solid $stroke;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.map-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid $stroke;
}

.map-modal__header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 1100;
  color: $text;
}

.map-modal__close {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid $stroke;
  background: rgba(255, 255, 255, 0.04);
  color: $text;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.map-modal__close:hover {
  background: rgba(255, 255, 255, 0.08);
}

.map-modal__map {
  width: 100%;
  height: 400px;
  min-height: 300px;
  flex: 1;
  position: relative;
}

.map-modal__footer {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid $stroke;
}

.map-modal__btn {
  flex: 1;
  padding: 14px 20px;
  border-radius: 14px;
  font-weight: 1100;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.map-modal__btn--cancel {
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  border: 1px solid $stroke;
}

.map-modal__btn--cancel:hover {
  background: rgba(255, 255, 255, 0.1);
}

.map-modal__btn--confirm {
  background: linear-gradient(135deg, $orange, $orange2);
  color: #111;
}

.map-modal__btn--confirm:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba($orange, 0.3);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100001;
  padding: 20px;
  animation: fadeIn 0.3s ease;
}

@media (max-width: 768px) {
  .modal-overlay {
    padding: 10px;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.085),
    rgba(255, 255, 255, 0.06)
  );
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.55),
    0 18px 44px rgba(255, 106, 0, 0.18);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
  direction: rtl;
}

@media (max-width: 768px) {
  .modal-content {
    max-width: 100%;
    border-radius: 16px;
    max-height: 95vh;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

@media (max-width: 768px) {
  .modal-header {
    padding: 16px 18px;
  }
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 1100;
  color: $orange3;
  line-height: 1.3;
  flex: 1;
}

@media (max-width: 768px) {
  .modal-header h3 {
    font-size: 16px;
  }
}

.modal-close {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.8);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
  margin-right: 12px;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba($orange, 0.3);
  color: $orange3;
}

@media (max-width: 768px) {
  .modal-close {
    width: 28px;
    height: 28px;
    font-size: 18px;
    margin-right: 8px;
  }
}

.modal-body {
  padding: 20px 24px;
  flex: 1;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .modal-body {
    padding: 16px 18px;
  }
}

.modal-body p {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.5;
}

@media (max-width: 768px) {
  .modal-body p {
    font-size: 13px;
    margin-bottom: 12px;
  }
}

.modal-body p:last-of-type {
  margin-bottom: 0;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

@media (max-width: 768px) {
  .modal-footer {
    padding: 16px 18px;
    gap: 10px;
    flex-direction: column-reverse;
  }
}

.btn {
  flex: 1;
  padding: 14px 20px;
  border-radius: 14px;
  font-weight: 1100;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 768px) {
  .btn {
    padding: 12px 16px;
    font-size: 14px;
  }
}

.btn--primary {
  background: linear-gradient(135deg, $orange, $orange2);
  color: #111;
  box-shadow: 0 6px 20px rgba(255, 106, 0, 0.3);
}

.btn--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(255, 106, 0, 0.4);
}

.btn--primary:active {
  transform: translateY(0);
}

.btn--secondary {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.9);
}

.btn--secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

@media (max-width: 450px) {
  .shell {
    max-width: 100%;
    padding: 10px 10px calc(80px + env(safe-area-inset-bottom));
  }

  .step-container {
    max-height: calc(100vh - 200px);
    padding: 10px;
  }

  .step-indicator {
    padding: 15px 0;
    gap: 6px;
  }

  .step-number {
    width: 36px;
    height: 36px;
    font-size: 14px;
  }

  .step-label {
    font-size: 11px;
  }

  .block {
    padding: 10px;
  }

  .topbar {
    padding: 8px 0 10px;
  }

  .topbar__title {
    font-size: 18px;
  }
}

@media (max-width: 600px) {
  .map-modal {
    padding: 0;
  }

  .map-modal__content {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }

  .map-modal__map {
    height: 50vh;
  }
}
</style>
