<template>
  <div class="create-call-page" dir="rtl">
    <div class="container">
      <div class="header">
        <button class="back-btn" type="button" @click="goBack">← חזור</button>
        <h1 class="title">צור קריאה</h1>
        <p class="subtitle">
          בחר תת־קטגוריה, תיאור, מיקום וזמן. ברירת מחדל: כמה שיותר מהר.
        </p>
      </div>

      <div class="form-container">
        <div class="field">
          <MobileCategorySelector
            v-model="call.selectedSubcategory"
            label="תחום התמחות"
            placeholder="לחץ לבחירת תחום התמחות דרוש"
            :single="true"
          />
          <span v-if="errors.selectedSubcategory" class="error-message">
            {{ errors.selectedSubcategory }}
          </span>
        </div>

        <div class="preview" v-if="selectedSub">
          <div class="preview__header">
            <div class="preview__icon">✓</div>
            <h3 class="preview__title">{{ call.selectedSubcategory.name }}</h3>
          </div>
          <div class="preview__content">
            <div class="preview__row">
              <div class="preview__label">
                <span class="preview__label-icon">💰</span>
                <span>מחיר</span>
              </div>
              <b class="preview__value">{{ selectedSub.price }} שקלות</b>
            </div>
            <div class="preview__row">
              <div class="preview__label">
                <span class="preview__label-icon">{{
                  selectedSub.billingType === "hourly" ? "⏱️" : "📋"
                }}</span>
                <span>סוג עבודה</span>
              </div>
              <b class="preview__value">{{
                selectedSub.billingType === "hourly" ? "לשעה" : "קבלנות"
              }}</b>
            </div>
          </div>
        </div>

        <div class="field">
          <label class="label">תיאור</label>
          <textarea
            class="textarea"
            :class="{ 'input-error': errors.desc }"
            v-model="call.desc"
            @input="clearError('desc')"
            rows="4"
            placeholder="תאר בקצרה מה הבעיה…"
          ></textarea>
          <span v-if="errors.desc" class="error-message">
            {{ errors.desc }}
          </span>
        </div>

        <div class="field">
          <label class="label">תמונה</label>
          <div class="file-upload-wrapper">
            <input
              id="callImage"
              type="file"
              accept="image/*"
              @change="handleCallImageUpload"
              class="file-input"
              required
            />
            <label
              for="callImage"
              class="file-label"
              :class="{
                disabled: call.imageUrl || call.imagePreview,
                'file-label-error': errors.image,
              }"
            >
              📷
              {{
                call.imageUrl || call.imagePreview ? "תמונה נבחרה" : "בחר תמונה"
              }}
            </label>
            <div
              v-if="call.imageUrl || call.imagePreview"
              class="image-preview-small"
            >
              <img :src="call.imageUrl || call.imagePreview" alt="Preview" />
              <button
                type="button"
                class="remove-image-btn"
                @click="removeCallImage"
              >
                ×
              </button>
            </div>
          </div>
          <span v-if="errors.image" class="error-message">
            {{ errors.image }}
          </span>
        </div>

        <div class="field">
          <label class="label">מיקום</label>
          <div class="location-row">
            <div class="location-input-wrapper">
              <AddressAutocomplete
                v-model="call.location"
                input-id="call-location"
                :placeholder="usingMyLocation ? 'המיקום שלי' : 'הכנס שם ישוב'"
                :required="!usingMyLocation"
                @update:modelValue="onLocationChange"
                @update:englishName="onEnglishNameUpdate"
                @update:selectedCity="onCitySelected"
              />
            </div>
            <button class="loc-btn" type="button" @click="setMyLocation">
              לפי מיקום
            </button>
          </div>
          <span v-if="errors.location" class="error-message">
            {{ errors.location }}
          </span>
        </div>

        <div class="field-row">
          <div class="field">
            <label class="label">זמן הגעה</label>
            <select class="select" v-model="call.when">
              <option value="asap">כמה שיותר מהר</option>
              <option value="today">היום</option>
              <option value="tomorrow">מחר</option>
              <option value="pick">בחר זמן</option>
            </select>
          </div>

          <div class="field">
            <label class="label">סוג עבודה</label>
            <select class="select" v-model="call.workType">
              <option value="קלה">קלה</option>
              <option value="מורכבת">מורכבת</option>
              <option value="קשה">קשה</option>
            </select>
          </div>
        </div>

        <div class="row">
          <button
            class="toggle"
            :class="{ 'toggle--on': call.urgent }"
            type="button"
            @click="onToggleUrgent"
          >
            🚨 {{ call.urgent ? "קריאה דחופה" : " לחץ לקריאה דחופה " }}
          </button>

          <div class="fine">
            <span class="fine__icon">⚠️</span>
            <span>קנס על ביטול: <b>250 שקלות</b></span>
          </div>
        </div>

        <button
          class="btn btn--primary btn--full"
          type="button"
          @click="onSubmitCall"
        >
          שלח קריאה
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import MobileCategorySelector from "@/components/MobileCategorySelector.vue";
import AddressAutocomplete from "@/components/AddressAutocomplete.vue";
import { URL } from "@/Url/url";
import axios from "axios";
import { useToast } from "@/composables/useToast";
import { useMainStore } from "@/store/index";
import citiesData from "@/APIS/AdressFromIsrael.json";

export default {
  name: "CreateCall",
  components: {
    MobileCategorySelector,
    AddressAutocomplete,
  },
  setup() {
    const store = useMainStore();
    return { store };
  },
  data() {
    return {
      toast: null,
      call: {
        selectedSubcategory: null,
        selectedSub: null,
        subId: "",
        desc: "",
        location: "המיקום שלי",
        when: "asap",
        urgent: false,
        image: null,
        imageUrl: "",
        imagePreview: null,
        coordinates: {},
        workType: "קלה",
      },
      geoCoordinates: null,
      usingMyLocation: false,
      errors: {},
      cities: [],
      locationEnglishName: null,
      selectedCity: null, // שמור את הישוב שנבחר מה-JSON
    };
  },
  created() {
    this.toast = useToast();
    // טען את רשימת הישובים
    this.cities = Array.isArray(citiesData)
      ? citiesData.filter((city) => {
          // דלג על שורות כותרת
          if (city.name === "שם_ישוב" || city.שם_ישוב === "שם_ישוב") {
            return false;
          }
          return true;
        })
      : [];

    // ברירת מחדל: עיר/מיקום מהמשתמש אם קיים, אחרת "המיקום שלי"
    const userCity = this.store?.user?.city;
    if (userCity && userCity.trim()) {
      // בדוק אם העיר של המשתמש קיימת ברשימת הישובים
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
  },

  computed: {
    selectedSub() {
      // אם יש תת-קטגוריה נבחרת, החזר את הפרטים שלה
      if (this.call.selectedSubcategory) {
        return {
          name: this.call.selectedSubcategory.name,
          price: this.call.selectedSubcategory.price || 0,
          billingType:
            this.call.selectedSubcategory.typeWork === "לשעה"
              ? "hourly"
              : "fixed",
        };
      }
      return null;
    },
  },
  watch: {
    selectedSub: {
      handler(newValue) {
        this.call.selectedSub = newValue;
      },
      immediate: true,
    },
    "call.selectedSubcategory": {
      handler() {
        this.clearError("selectedSubcategory");
      },
    },
  },
  methods: {
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

      // אם המשתמש מחק את "המיקום שלי" או התחיל להקליד משהו אחר
      if (!value || value.trim() === "" || value !== "המיקום שלי") {
        this.usingMyLocation = false;
        this.call.coordinates = {};

        // ולידציה שהמיקום הוא ישוב תקין (רק אם יש ערך)
        if (value && value.trim() !== "") {
          if (!this.isValidCity(value)) {
            this.errors.location =
              "ישוב זה לא נמצא במאגר. בחר ישוב מהרשימה או לחץ על 'לפי מיקום'";
          }
        }
      } else {
        // אם הערך הוא "המיקום שלי", שמור את המצב
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
        return true; // "המיקום שלי" תמיד תקין
      }

      const searchValue = cityName.trim();
      const normalizedSearch = searchValue.replace(/\s+/g, " ");

      return this.cities.some((city) => {
        const cityNameField = (city.name || city.שם_ישוב || "").trim();
        if (!cityNameField) return false;

        const normalizedCityName = cityNameField.replace(/\s+/g, " ");

        // השוואה מדויקת
        if (normalizedCityName === normalizedSearch) {
          return true;
        }
        // השוואה case-insensitive
        if (
          normalizedCityName.toLowerCase() === normalizedSearch.toLowerCase()
        ) {
          return true;
        }
        // השוואה עם הסרת תווים מיוחדים
        const cleanCity = normalizedCityName.replace(/['"()]/g, "").trim();
        const cleanSearch = normalizedSearch.replace(/['"()]/g, "").trim();
        if (cleanCity === cleanSearch) {
          return true;
        }

        return false;
      });
    },
    goBack() {
      this.$router.go(-1);
    },
    onToggleUrgent() {
      this.call.urgent = !this.call.urgent;
    },
    async handleCallImageUpload(event) {
      const file = event.target.files[0];
      if (file) {
        // בדיקת גודל התמונה (מקסימום 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          this.errors.image = "גודל התמונה חייב להיות קטן מ-5MB";
          const input = document.getElementById("callImage");
          if (input) input.value = "";
          return;
        }

        // בדיקת סוג הקובץ
        if (!file.type.startsWith("image/")) {
          this.errors.image = "יש להעלות קובץ תמונה בלבד";
          const input = document.getElementById("callImage");
          if (input) input.value = "";
          return;
        }

        // ניקוי שגיאה אם הכל תקין
        this.clearError("image");
        this.call.image = file;

        // הצג תצוגה מקדימה מיד
        const reader = new FileReader();
        reader.onload = (e) => {
          this.call.imagePreview = e.target.result;
        };
        reader.readAsDataURL(file);

        // העלה לשרת
        try {
          const formData = new FormData();
          formData.append("image", file);

          const uploadUrl = `${URL}/pick-call123`;
          console.log("Uploading image to:", uploadUrl);
          console.log("File size:", file.size, "bytes");
          console.log("File type:", file.type);

          const response = await axios.post(uploadUrl, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            timeout: 30000, // 30 seconds timeout
          });

          // שמור את ה-URL מהשרת
          if (response.data && response.data.imageUrl) {
            this.call.imageUrl = response.data.imageUrl;
            // console.log("response.data.imageUrl", response.data.imageUrl);
            // הסר את התצוגה המקדימה המקומית אחרי שהתמונה הועלתה
            // this.call.imagePreview = null; // אפשר להשאיר גם את התצוגה המקדימה
          }
        } catch (error) {
          console.error("Error uploading image:", error);
          const errorMessage =
            error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            "שגיאה בהעלאת התמונה. נסה שוב.";

          // אם השגיאה היא בגלל AWS credentials, נשתמש ב-base64 במקום
          if (
            errorMessage.includes("credentials") ||
            errorMessage.includes("Credential") ||
            errorMessage.includes("AWS") ||
            errorMessage.includes("not configured")
          ) {
            console.log("AWS credentials issue - using base64 image instead");
            // נשתמש ב-imagePreview (base64) במקום imageUrl
            // זה יאפשר למשתמש להמשיך גם בלי AWS credentials
            this.toast.showWarning("התמונה תישמר באופן מקומי (לא הועלתה לענן)");
            // לא נציג שגיאה - נמשיך עם base64
            this.clearError("image");
          } else {
            this.errors.image = errorMessage;
            this.toast.showError(`שגיאה בהעלאת התמונה: ${errorMessage}`);
          }
        }
      }
    },
    removeCallImage() {
      this.call.image = null;
      this.call.imageUrl = "";
      this.call.imagePreview = null;
      this.clearError("image");
      const input = document.getElementById("callImage");
      if (input) input.value = "";
    },
    clearError(field) {
      if (this.errors[field]) {
        delete this.errors[field];
      }
    },
    validateForm() {
      this.errors = {};

      // בדיקת תת-קטגוריה
      if (
        !this.call.selectedSubcategory ||
        !this.call.selectedSubcategory.name
      ) {
        this.errors.selectedSubcategory = "יש לבחור תת-קטגוריה";
      }

      // בדיקת תיאור
      if (!this.call.desc || this.call.desc.trim().length === 0) {
        this.errors.desc = "יש למלא תיאור של הבעיה";
      } else if (this.call.desc.trim().length < 10) {
        this.errors.desc = "התיאור חייב להכיל לפחות 10 תווים";
      }

      // בדיקת תמונה
      if (!this.call.imageUrl && !this.call.imagePreview && !this.call.image) {
        this.errors.image = "יש להעלות תמונה";
      }

      // בדיקת מיקום
      if (!this.call.location || this.call.location.trim().length === 0) {
        this.errors.location = "יש למלא מיקום";
      } else if (this.call.location === "המיקום שלי") {
        // "המיקום שלי" תמיד תקין
        // אין צורך לבדוק
      } else if (!this.isValidCity(this.call.location)) {
        this.errors.location =
          "ישוב זה לא נמצא במאגר. בחר ישוב מהרשימה או לחץ על 'לפי מיקום'";
      }

      return Object.keys(this.errors).length === 0;
    },
    async onSubmitCall() {
      // ניקוי שגיאות קודמות
      this.errors = {};

      // בדיקת ולידציה
      const isValid = this.validateForm();

      if (!isValid) {
        this.toast.showError("יש למלא את כל השדות הנדרשים");
        // גלול לשדה הראשון עם שגיאה
        const firstErrorField = document.querySelector(
          ".input-error, .file-label-error"
        );
        if (firstErrorField) {
          firstErrorField.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
        return;
      }

      try {
        // בדיקה שהנתונים תקינים לפני שליחה
        if (!this.call.selectedSubcategory) {
          this.toast.showError("יש לבחור תת-קטגוריה");
          return;
        }

        // אם בחר "המיקום שלי" ואין עדיין קואורדינטות, נסה להציב מה-geoCoordinates
        if (this.usingMyLocation && this.geoCoordinates) {
          this.call.coordinates = { ...this.geoCoordinates };
        }

        // הוסף userId אם קיים ב-route params
        const callData = {
          ...this.call,
          userId: this.$route.params.id || null,
          usingMyLocation: this.usingMyLocation,
          locationEnglishName: this.locationEnglishName || null,
          selectedCity: this.selectedCity || null, // שלח את הישוב המלא מה-JSON
        };

        // אם לא "המיקום שלי", אל תשלח קואורדינטות (השרת ימצא אותן דרך forward geocoding)
        if (!this.usingMyLocation) {
          // מחק את הקואורדינטות לחלוטין כדי שהשרת ימצא אותן דרך forward geocoding
          delete callData.coordinates;
        } else {
          // ודא שקואורדינטות נשמרות כמספרים וללא עיגול
          if (callData.coordinates) {
            const lng = callData.coordinates.lng ?? callData.coordinates.lon;
            const lat = callData.coordinates.lat;
            if (lng !== undefined && lat !== undefined) {
              callData.coordinates = {
                lng: Number(lng),
                lat: Number(lat),
              };
            }
          }
        }

        // הסר שדות שלא צריך לשלוח
        delete callData.image; // לא צריך לשלוח את ה-File object
        // אם אין imageUrl אבל יש imagePreview (base64), נשמור את ה-base64
        // זה מאפשר לעבוד גם בלי AWS credentials
        if (!callData.imageUrl && callData.imagePreview) {
          // נשמור את ה-base64 - השרת יוכל לטפל בו
          // לא נמחק את imagePreview
        } else {
          delete callData.imagePreview; // לא צריך לשלוח את ה-preview אם יש imageUrl
        }

        const createCallUrl = `${URL}/create-call`;
        console.log("Sending call to:", createCallUrl);
        console.log("Call data:", {
          ...callData,
          image: callData.image ? "[File]" : null,
          imagePreview: callData.imagePreview ? "[Preview]" : null,
        });

        const response = await axios.post(createCallUrl, callData, {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 30000, // 30 seconds timeout
        });

        if (response.data.success) {
          this.toast.showSuccess("הקריאה נשלחה בהצלחה!");
          this.$router.push({
            name: "Dashboard",
            params: { id: this.$route.params.id },
          });
        } else {
          const errorMessage = response.data.message || "שגיאה בשליחת הקריאה";
          this.toast.showError(errorMessage);
        }
      } catch (error) {
        console.error("Error creating call:", error);
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "שגיאה בשליחת הקריאה. נסה שוב מאוחר יותר.";
        this.toast.showError(`שגיאה בשליחת הקריאה: ${errorMessage}`);
      }
    },
  },
  async mounted() {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        this.geoCoordinates = {
          lat: latitude,
          lon: longitude, // נשמר גם בשם lon כדי לתמוך בצד השרת
        };
        if (this.usingMyLocation) {
          this.call.coordinates = { ...this.geoCoordinates };
        }
      },
      (err) => {
        console.warn("Geolocation error:", err?.message || err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  },
};
</script>

<style lang="scss" scoped>
$font-family: "Heebo", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
  "Helvetica Neue", Arial, sans-serif;

$bg: #0b0b0f;
$bg2: #0f1016;
$card: rgba(255, 255, 255, 0.06);
$card2: rgba(255, 255, 255, 0.085);
$stroke: rgba(255, 255, 255, 0.12);
$text: rgba(255, 255, 255, 0.92);
$muted: rgba(255, 255, 255, 0.62);

$orange: #ff6a00;
$orange2: #ff8a2b;
$orange3: #ffb36b;

$danger: #ff3b3b;

$shadow: 0 18px 40px rgba(0, 0, 0, 0.55);
$shadowO: 0 18px 44px rgba(255, 106, 0, 0.18);

$r: 18px;
$r2: 26px;

@mixin focusRing {
  outline: none;
  box-shadow: 0 0 0 3px rgba($orange, 0.32);
}

.create-call-page {
  min-height: 100vh;
  background: radial-gradient(
      900px 520px at 10% -10%,
      rgba($orange, 0.18),
      transparent 55%
    ),
    radial-gradient(
      700px 420px at 95% 10%,
      rgba($orange2, 0.12),
      transparent 55%
    ),
    linear-gradient(180deg, $bg, $bg2);
  padding: clamp(12px, 3vw, 20px);
  direction: rtl;
  font-family: $font-family;

  @media (max-width: 768px) {
    padding: clamp(16px, 4vw, 20px);
  }
}

.container {
  max-width: 600px;
  margin: 0 auto;
}

.header {
  margin-bottom: 24px;
}

.back-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba($orange, 0.18);
  border-radius: 12px;
  padding: 10px 16px;
  color: $text;
  font-weight: 900;
  cursor: pointer;
  margin-bottom: 16px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba($orange, 0.1);
    border-color: rgba($orange, 0.3);
  }

  &:focus {
    @include focusRing;
  }
}

.title {
  font-size: clamp(24px, 6vw, 32px);
  font-weight: 1000;
  color: $text;
  margin: 0 0 clamp(8px, 2vw, 12px) 0;
  line-height: 1.2;
}

.subtitle {
  color: $muted;
  font-weight: 800;
  font-size: clamp(13px, 3.5vw, 15px);
  margin: 0;
  line-height: 1.5;
}

.form-container {
  background: linear-gradient(180deg, $card2, rgba(255, 255, 255, 0.04));
  border: 1px solid $stroke;
  border-radius: $r2;
  padding: clamp(16px, 4vw, 24px);
  box-shadow: $shadow;

  @media (max-width: 768px) {
    padding: clamp(20px, 5vw, 24px);
    border-radius: clamp(20px, 5vw, 26px);
  }
}

.field {
  display: grid;
  gap: clamp(8px, 2vw, 12px);
  margin-bottom: clamp(16px, 4vw, 24px);
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .field {
    margin-bottom: 0;
  }
}

.label {
  font-size: clamp(13px, 3vw, 14px);
  font-weight: 1000;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 4px;
  line-height: 1.4;
}

.input,
.textarea {
  width: 100%;
  box-sizing: border-box;
  border-radius: 16px;
  border: 2px solid rgba($orange, 0.18);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  padding: clamp(14px, 3.5vw, 16px);
  font-weight: 900;
  font-size: clamp(16px, 4vw, 18px); // Prevent iOS zoom (min 16px)
  min-height: 48px; // WCAG AA touch target
  transition: all 0.2s ease;
  touch-action: manipulation;

  &::placeholder {
    color: rgba(255, 255, 255, 0.45);
    font-size: clamp(15px, 3.5vw, 16px);
  }

  &:focus {
    @include focusRing;
    border-color: rgba($orange, 0.6);
    background: rgba(255, 255, 255, 0.1);
    outline: 2px solid rgba($orange, 0.4);
    outline-offset: 2px;
  }

  &:hover {
    border-color: rgba($orange, 0.35);
    background: rgba(255, 255, 255, 0.08);
  }

  @media (max-width: 768px) {
    min-height: 52px; // Larger on mobile
    padding: clamp(16px, 4vw, 18px);
  }
}

.select {
  width: 100%;
  box-sizing: border-box;
  border-radius: 16px;
  border: 2px solid rgba($orange, 0.18);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  padding: clamp(14px, 3.5vw, 16px) 40px clamp(14px, 3.5vw, 16px) 12px;
  font-weight: 900;
  font-size: clamp(16px, 4vw, 18px); // Prevent iOS zoom
  min-height: 48px; // WCAG AA touch target
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  touch-action: manipulation;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ff6a00' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: left 12px center;
  background-size: 12px;

  @media (max-width: 768px) {
    min-height: 52px; // Larger on mobile
    padding: clamp(16px, 4vw, 18px) 40px clamp(16px, 4vw, 18px) 12px;
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.45);
  }

  &:focus {
    @include focusRing;
    border-color: rgba($orange, 0.6);
    background-color: rgba(255, 255, 255, 0.1);
    outline: 2px solid rgba($orange, 0.4);
    outline-offset: 2px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ff8a2b' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  }

  &:hover {
    border-color: rgba($orange, 0.28);
    background-color: rgba(255, 255, 255, 0.07);
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ff8a2b' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  }

  option {
    background: $bg2;
    color: $text;
    padding: 10px;
    font-weight: 900;
  }

  option:disabled {
    color: rgba(255, 255, 255, 0.45);
    font-style: italic;
  }
}

.textarea {
  resize: vertical;
  min-height: clamp(100px, 25vw, 120px);
  line-height: 1.5;

  @media (max-width: 768px) {
    min-height: clamp(120px, 30vw, 140px);
  }
}

.preview {
  margin-top: 10px;
  margin-bottom: 20px;
  border-radius: $r2;
  border: 2px solid rgba($orange, 0.3);
  background: linear-gradient(135deg, rgba($orange, 0.15), rgba($orange, 0.08));
  padding: 16px;
  box-shadow: 0 8px 24px rgba($orange, 0.12);
  animation: slideIn 0.3s ease-out;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba($orange, 0.4);
    box-shadow: 0 12px 32px rgba($orange, 0.18);
    transform: translateY(-2px);
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba($orange, 0.2);
  }

  &__icon {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, $orange, $orange2);
    color: #000;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 1000;
    font-size: 18px;
    box-shadow: 0 4px 12px rgba($orange, 0.3);
    flex-shrink: 0;
  }

  &__title {
    font-size: 18px;
    font-weight: 1000;
    color: $text;
    margin: 0;
    flex: 1;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.04);
    transition: all 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.06);
      transform: translateX(-3px);
    }
  }

  &__label {
    display: flex;
    align-items: center;
    gap: 8px;
    color: rgba(255, 255, 255, 0.8);
    font-weight: 900;
    font-size: 14px;
  }

  &__label-icon {
    font-size: 16px;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  }

  &__value {
    font-weight: 1100;
    color: $orange3;
    font-size: 16px;
    text-shadow: 0 2px 8px rgba($orange, 0.3);
  }
}

.error-message {
  display: block;
  margin-top: clamp(6px, 1.5vw, 8px);
  color: rgba(220, 53, 69, 0.95);
  font-size: clamp(12px, 3vw, 13px);
  font-weight: 800;
  line-height: 1.4;
  padding: 4px 0;
  animation: slideIn 0.2s ease-out;

  @media (max-width: 768px) {
    font-size: clamp(13px, 3.5vw, 14px);
  }
}

.input-error {
  border-color: rgba($danger, 0.5) !important;
  background: rgba($danger, 0.05) !important;

  &:focus {
    border-color: rgba($danger, 0.7) !important;
    box-shadow: 0 0 0 3px rgba($danger, 0.2) !important;
  }
}

.file-label-error {
  border-color: rgba($danger, 0.5) !important;
  background: rgba($danger, 0.1) !important;
  color: rgba($danger, 0.9) !important;

  &:hover {
    border-color: rgba($danger, 0.6) !important;
    background: rgba($danger, 0.15) !important;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.apiNote {
  margin-top: 6px;
  color: rgba(255, 255, 255, 0.62);
  font-weight: 800;
  font-size: 12px;
}

.file-upload-wrapper {
  position: relative;
  width: 100%;
  box-sizing: border-box;
}

.location-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  align-items: center;
}

.location-input-wrapper {
  flex: 1;
  min-width: 0;
}

.loc-btn {
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(135deg, #1a1f2e, #23324b);
  color: #ffb36b;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
  }
}

.file-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  overflow: hidden;
}

.file-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: $r;
  border: 1px solid rgba($orange, 0.18);
  background: rgba($orange, 0.1);
  color: $text;
  font-weight: 900;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  box-sizing: border-box;
  text-align: center;

  &:hover {
    background: rgba($orange, 0.15);
    border-color: rgba($orange, 0.3);
  }

  &.disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.image-preview-small {
  position: relative;
  margin-top: 10px;
  width: 100%;
  max-width: 200px;
  border-radius: $r;
  overflow: hidden;
  border: 1px solid rgba($orange, 0.2);

  img {
    width: 100%;
    height: auto;
    display: block;
  }
}

.remove-image-btn {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 59, 59, 0.9);
    transform: scale(1.1);
  }
}

.row {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.toggle {
  border-radius: 999px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba($orange, 0.1);
  color: $text;
  padding: 8px 10px;
  cursor: pointer;
  font-weight: 1000;
  transition: all 0.2s ease;
  font-size: 13px;

  &--on {
    padding: 10px 12px;
    font-size: 14px;
    border-color: rgba($danger, 0.8);
    background: linear-gradient(135deg, rgba($danger, 0.4), rgba($danger, 0.3));
    color: #ffffff;
    box-shadow: 0 14px 22px rgba($danger, 0.4);
  }

  &:hover {
    background: rgba($orange, 0.15);
    border-color: rgba($orange, 0.3);
  }

  &--on:hover {
    background: linear-gradient(135deg, rgba($danger, 0.5), rgba($danger, 0.4));
    border-color: rgba($danger, 0.9);
    box-shadow: 0 16px 24px rgba($danger, 0.5);
  }

  &:focus {
    @include focusRing;
  }
}

.fine {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  padding: 10px 12px;
  border-radius: 16px;
  border: 1px solid rgba($danger, 0.28);
  background: rgba($danger, 0.1);
  color: rgba(255, 255, 255, 0.88);
  font-weight: 900;

  b {
    color: #ffd4d4;
    font-weight: 1100;
  }

  &__icon {
    width: 26px;
    height: 26px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    background: rgba($danger, 0.16);
    border: 1px solid rgba($danger, 0.18);
  }
}

.btn {
  border-radius: 16px;
  padding: clamp(14px, 3.5vw, 18px) clamp(20px, 5vw, 24px);
  border: 2px solid rgba($orange, 0.18);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  cursor: pointer;
  font-weight: 1000;
  transition: transform 120ms ease, box-shadow 120ms ease, background 120ms ease;
  font-size: clamp(15px, 4vw, 16px);
  min-height: 48px; // WCAG AA touch target
  touch-action: manipulation;

  @media (max-width: 768px) {
    min-height: 52px; // Larger on mobile
  }

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 14px 22px rgba($orange, 0.12);
    background: rgba(255, 255, 255, 0.08);
  }

  &:active {
    transform: translateY(0) scale(0.99);
  }

  &:focus {
    @include focusRing;
  }

  &--primary {
    color: #111;
    border: none;
    background: linear-gradient(135deg, $orange, $orange2);
    box-shadow: $shadowO;
  }

  &--full {
    width: 100%;
    justify-content: center;
  }
}
</style>
