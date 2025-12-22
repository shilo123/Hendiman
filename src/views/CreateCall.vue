<template>
  <div class="create-call-page" dir="rtl">
    <div class="shell">
      <!-- Top bar -->
      <header class="topbar">
        <button class="topbar__back" type="button" @click="goBack">←</button>

        <div class="topbar__center">
          <div class="topbar__title">צור קריאה</div>
          <div class="topbar__sub">בחר תת־קטגוריה, תיאור, מיקום וזמן</div>
        </div>

        <!-- <div class="topbar__step">
          <span class="stepPill">{{ progressText }}</span>
        </div> -->
      </header>

      <!-- Content -->
      <main class="content">
        <!-- SECTION: category -->
        <section class="block">
          <div class="block__head">
            <div class="block__label">תחום התמחות</div>
            <div class="block__req">חובה</div>
          </div>

          <div class="control">
            <MobileCategorySelector
              v-model="call.selectedSubcategory"
              label=""
              placeholder="לחץ לבחירת תחום התמחות דרוש"
              :single="true"
            />
          </div>

          <div v-if="errors.selectedSubcategory" class="msg msg--err">
            {{ errors.selectedSubcategory }}
          </div>

          <div v-if="selectedSub" class="summary">
            <div class="summary__row">
              <div class="summary__name">
                <span class="okDot">✓</span>
                <span class="summary__txt">{{
                  call.selectedSubcategory.name
                }}</span>
              </div>
              <div class="summary__price">{{ selectedSub.price }} ₪</div>
            </div>

            <div class="summary__row summary__row--meta">
              <span class="tag">
                {{ selectedSub.billingType === "hourly" ? "לשעה" : "קבלנות" }}
              </span>
              <span class="tag tag--ghost">סוג חיוב</span>
            </div>
          </div>
        </section>

        <!-- SECTION: desc -->
        <section class="block">
          <div class="block__head">
            <div class="block__label">תיאור</div>
            <div class="block__req">חובה</div>
          </div>

          <textarea
            class="textarea"
            :class="{ 'is-err': errors.desc }"
            v-model="call.desc"
            @input="clearError('desc')"
            rows="4"
            placeholder="תאר בקצרה מה הבעיה…"
          ></textarea>

          <div v-if="errors.desc" class="msg msg--err">{{ errors.desc }}</div>
          <div class="msg msg--hint">מומלץ לפחות 10 תווים.</div>
        </section>

        <!-- SECTION: image -->
        <section class="block">
          <div class="block__head">
            <div class="block__label">תמונה</div>
            <div class="block__req">חובה</div>
          </div>

          <div class="uploadRow">
            <input
              id="callImage"
              type="file"
              accept="image/*"
              @change="handleCallImageUpload"
              class="file-input"
            />

            <label
              for="callImage"
              class="uploadBtn"
              :class="{
                'uploadBtn--done': call.imageUrl || call.imagePreview,
                'uploadBtn--err': errors.image,
              }"
            >
              <span class="uploadBtn__icon">📷</span>
              <span class="uploadBtn__txt">
                {{
                  call.imageUrl || call.imagePreview
                    ? "תמונה נבחרה"
                    : "בחר תמונה"
                }}
              </span>
            </label>

            <button
              v-if="call.imageUrl || call.imagePreview"
              type="button"
              class="miniGhost"
              @click="removeCallImage"
            >
              הסר
            </button>
          </div>

          <div v-if="call.imageUrl || call.imagePreview" class="thumb">
            <img :src="call.imageUrl || call.imagePreview" alt="Preview" />
          </div>

          <div v-if="errors.image" class="msg msg--err">{{ errors.image }}</div>
        </section>

        <!-- SECTION: location -->
        <section class="block">
          <div class="block__head">
            <div class="block__label">מיקום</div>
            <div class="block__req">חובה</div>
          </div>

          <div class="locGrid">
            <div class="locGrid__input">
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

            <div class="locGrid__actions">
              <button class="ghostBtn" type="button" @click="$emit('open-map')">
                🗺️ דקור במפה
              </button>
              <button class="solidBtn" type="button" @click="setMyLocation">
                📍 לפי מיקום
              </button>
            </div>
          </div>

          <div v-if="errors.location" class="msg msg--err">
            {{ errors.location }}
          </div>
        </section>

        <!-- SECTION: selects -->
        <section class="block">
          <div class="twoCols">
            <div class="field">
              <div class="field__label">זמן הגעה</div>
              <select class="select" v-model="call.when">
                <option value="asap">כמה שיותר מהר</option>
                <option value="today">היום</option>
                <option value="tomorrow">מחר</option>
                <option value="pick">בחר זמן</option>
              </select>
            </div>

            <div class="field">
              <div class="field__label">סוג עבודה</div>
              <select class="select" v-model="call.workType">
                <option value="קלה">קלה</option>
                <option value="מורכבת">מורכבת</option>
                <option value="קשה">קשה</option>
              </select>
            </div>
          </div>
        </section>

        <!-- SECTION: urgent + fine -->
        <section class="block block--last">
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

          <div class="note note--warn">
            <span class="note__icon">⚠️</span>
            <span>קנס על ביטול: <b>250</b> שקלות</span>
          </div>
        </section>

        <!-- Spacer so footer won't cover -->
        <div class="spacer" />
      </main>

      <!-- Sticky footer -->
      <footer class="footer">
        <button class="cta animated-button" type="button" @click="onSubmitCall">
          <span>שלח קריאה</span>
          <span></span>
        </button>
      </footer>
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
  emits: ["open-map"],

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
      selectedCity: null,
    };
  },
  created() {
    this.toast = useToast();

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
  },

  computed: {
    selectedSub() {
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

    // progress bar-ish text (pure UI)
    progressText() {
      let n = 0;
      if (this.call.selectedSubcategory) n++;
      if (this.call.desc && this.call.desc.trim().length >= 10) n++;
      if (this.call.location && this.call.location.trim().length > 0) n++;
      if (this.call.imageUrl || this.call.imagePreview || this.call.image) n++;
      return `${n}/4`;
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

      if (!value || value.trim() === "" || value !== "המיקום שלי") {
        this.usingMyLocation = false;
        this.call.coordinates = {};

        if (value && value.trim() !== "") {
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
      this.$router.go(-1);
    },
    onToggleUrgent() {
      this.call.urgent = !this.call.urgent;
    },
    async handleCallImageUpload(event) {
      const file = event.target.files[0];
      if (file) {
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
          this.errors.image = "גודל התמונה חייב להיות קטן מ-5MB";
          const input = document.getElementById("callImage");
          if (input) input.value = "";
          return;
        }

        if (!file.type.startsWith("image/")) {
          this.errors.image = "יש להעלות קובץ תמונה בלבד";
          const input = document.getElementById("callImage");
          if (input) input.value = "";
          return;
        }

        this.clearError("image");
        this.call.image = file;

        const reader = new FileReader();
        reader.onload = (e) => {
          this.call.imagePreview = e.target.result;
        };
        reader.readAsDataURL(file);

        try {
          const formData = new FormData();
          formData.append("image", file);

          const uploadUrl = `${URL}/pick-call123`;
          const response = await axios.post(uploadUrl, formData, {
            headers: { "Content-Type": "multipart/form-data" },
            timeout: 30000,
          });

          if (response.data && response.data.imageUrl) {
            this.call.imageUrl = response.data.imageUrl;
          }
        } catch (error) {
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
      if (this.errors[field]) delete this.errors[field];
    },
    validateForm() {
      this.errors = {};

      if (
        !this.call.selectedSubcategory ||
        !this.call.selectedSubcategory.name
      ) {
        this.errors.selectedSubcategory = "יש לבחור תת-קטגוריה";
      }

      if (!this.call.desc || this.call.desc.trim().length === 0) {
        this.errors.desc = "יש למלא תיאור של הבעיה";
      } else if (this.call.desc.trim().length < 10) {
        this.errors.desc = "התיאור חייב להכיל לפחות 10 תווים";
      }

      if (!this.call.imageUrl && !this.call.imagePreview && !this.call.image) {
        this.errors.image = "יש להעלות תמונה";
      }

      if (!this.call.location || this.call.location.trim().length === 0) {
        this.errors.location = "יש למלא מיקום";
      } else if (this.call.location === "המיקום שלי") {
        // ok
      } else if (!this.isValidCity(this.call.location)) {
        this.errors.location =
          "ישוב זה לא נמצא במאגר. בחר ישוב מהרשימה או לחץ על 'לפי מיקום'";
      }

      return Object.keys(this.errors).length === 0;
    },
    async onSubmitCall() {
      this.errors = {};

      const isValid = this.validateForm();
      if (!isValid) {
        this.toast.showError("יש למלא את כל השדות הנדרשים");
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
        if (!this.call.selectedSubcategory) {
          this.toast.showError("יש לבחור תת-קטגוריה");
          return;
        }

        if (this.usingMyLocation && this.geoCoordinates) {
          this.call.coordinates = { ...this.geoCoordinates };
        }

        const callData = {
          ...this.call,
          userId: this.$route.params.id || null,
          usingMyLocation: this.usingMyLocation,
          locationEnglishName: this.locationEnglishName || null,
          selectedCity: this.selectedCity || null,
        };

        if (!this.usingMyLocation) {
          delete callData.coordinates;
        } else {
          if (callData.coordinates) {
            const lng = callData.coordinates.lng ?? callData.coordinates.lon;
            const lat = callData.coordinates.lat;
            if (lng !== undefined && lat !== undefined) {
              callData.coordinates = { lng: Number(lng), lat: Number(lat) };
            }
          }
        }

        delete callData.image;
        if (!callData.imageUrl && callData.imagePreview) {
          // keep base64
        } else {
          delete callData.imagePreview;
        }

        const createCallUrl = `${URL}/create-call`;
        const response = await axios.post(createCallUrl, callData, {
          headers: { "Content-Type": "application/json" },
          timeout: 30000,
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
        this.geoCoordinates = { lat: latitude, lon: longitude };
        if (this.usingMyLocation) {
          this.call.coordinates = { ...this.geoCoordinates };
        }
      },
      (err) => {
        console.warn("Geolocation error:", err?.message || err);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
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
$danger: #ff3b3b;

.create-call-page {
  min-height: 100vh;
  background: linear-gradient(180deg, $bg, $bg2);
}

.shell {
  max-width: 640px;
  margin: 0 auto;
  padding: 14px 14px calc(96px + env(safe-area-inset-bottom));
}

/* Topbar — clean, app-like */
.topbar {
  display: grid;
  grid-template-columns: auto 1fr auto;
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

.topbar__sub {
  margin-top: 4px;
  font-size: 12px;
  font-weight: 800;
  color: $muted;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stepPill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 54px;
  height: 34px;
  border-radius: 999px;
  border: 1px solid rgba($orange, 0.35);
  background: rgba($orange, 0.12);
  color: rgba(255, 255, 255, 0.88);
  font-weight: 1100;
  font-size: 12px;
}

/* Blocks — minimal, flat */
.content {
  display: grid;
  gap: 12px;
}

.block {
  border: 1px solid $stroke;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.03);
  padding: 12px;
}

.block--last {
  padding-bottom: 14px;
}

.block__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.block__label {
  font-size: 13px;
  font-weight: 1100;
  color: $text;
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

/* Summary (selected subcategory) */
.summary {
  margin-top: 10px;
  border-radius: 14px;
  border: 1px solid rgba($orange, 0.25);
  background: rgba($orange, 0.08);
  padding: 10px;
}

.summary__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.summary__row--meta {
  margin-top: 8px;
  justify-content: flex-start;
  gap: 8px;
  flex-wrap: wrap;
}

.summary__name {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.okDot {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, $orange, $orange2);
  color: #111;
  font-weight: 1200;
  flex: 0 0 auto;
}

.summary__txt {
  min-width: 0;
  font-weight: 1100;
  color: $text;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.summary__price {
  font-weight: 1200;
  color: $orange2;
  white-space: nowrap;
}

.tag {
  border-radius: 999px;
  padding: 4px 10px;
  font-weight: 1100;
  font-size: 11px;
  border: 1px solid rgba($orange, 0.22);
  background: rgba($orange, 0.1);
  color: $text;
}
.tag--ghost {
  border-color: rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.18);
  color: rgba(255, 255, 255, 0.78);
}

/* Inputs */
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
  font-size: 16px; /* prevent iOS zoom */
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

/* Messages */
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

/* Upload */
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

.miniGhost {
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.18);
  color: rgba(255, 255, 255, 0.88);
  padding: 12px 12px;
  font-weight: 1000;
  cursor: pointer;
}

.thumb {
  margin-top: 10px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.25);
}
.thumb img {
  width: 100%;
  display: block;
  height: auto;
}

/* Location layout */
.locGrid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.locGrid__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

/* On wider screens keep it on one row */
@media (min-width: 560px) {
  .locGrid {
    grid-template-columns: 1fr auto;
    align-items: start;
  }
  .locGrid__actions {
    grid-template-columns: auto auto;
  }
}

.ghostBtn,
.solidBtn {
  border-radius: 14px;
  padding: 12px 12px;
  font-weight: 1100;
  cursor: pointer;
  white-space: nowrap;
}

.ghostBtn {
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.18);
  color: rgba(255, 255, 255, 0.9);
}

.solidBtn {
  border: none;
  background: linear-gradient(135deg, $orange, $orange2);
  color: #111;
}

/* Two columns selects */
.twoCols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
@media (max-width: 520px) {
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

/* Urgent row */
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

/* Notes */
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

/* Sticky CTA */
.footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 12px 14px calc(12px + env(safe-area-inset-bottom));
  background: rgba(11, 11, 15, 0.72);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.cta {
  max-width: 640px;
  margin: 0 auto;
  width: 100%;
}

/* Animated button style */
.animated-button {
  position: relative;
  display: inline-block;
  width: 100%;
  padding: 16px 24px;
  border: none;
  font-size: 16px;
  background-color: rgba(11, 11, 15, 0.95);
  border-radius: 100px;
  font-weight: 1200;
  color: rgba(255, 255, 255, 0.4);
  box-shadow: 0 0 0 2px rgba(255, 106, 0, 0.2);
  cursor: pointer;
  overflow: hidden;
  transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
}

.animated-button span:last-child {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  background-color: $orange;
  border-radius: 50%;
  opacity: 0;
  transition: all 0.8s cubic-bezier(0.23, 1, 0.32, 1);
}

.animated-button span:first-child {
  position: relative;
  z-index: 1;
}

.animated-button:hover {
  box-shadow: 0 0 0 5px rgba(255, 106, 0, 0.38);
  color: #ffffff;
}

.animated-button:active {
  scale: 0.95;
}

.animated-button:hover span:last-child {
  width: 150px;
  height: 150px;
  opacity: 1;
}

.spacer {
  height: 8px;
}

/* Keep your original error classes compatibility */
.error-message {
  margin-top: 8px;
  color: rgba(220, 53, 69, 0.95);
  font-size: 12px;
  font-weight: 900;
}
.file-label-error {
  border-color: rgba($danger, 0.55) !important;
  background: rgba($danger, 0.1) !important;
}
</style>
