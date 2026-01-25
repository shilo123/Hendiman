<template>
  <div class="free-handyman-section">
    <div class="free-handyman-section__header">
      <h2 class="free-handyman-section__title">רישום הנדימן חבר בחינם</h2>
      <div class="free-handyman-section__badge">
        <span class="badge badge--free">חינם</span>
      </div>
    </div>

    <div class="free-handyman-form-wrapper">
      <form
        @submit.prevent="handleFreeHandymanRegister"
        class="free-handyman-form"
      >
        <div class="form-row">
          <div class="form-field">
            <label class="form-label" for="freeHandymanFirstName"
              >שם פרטי *</label
            >
            <input
              id="freeHandymanFirstName"
              v-model="freeHandymanForm.firstName"
              type="text"
              class="form-input"
              placeholder="הכנס שם פרטי"
              required
            />
          </div>
          <div class="form-field">
            <label class="form-label" for="freeHandymanLastName"
              >שם משפחה *</label
            >
            <input
              id="freeHandymanLastName"
              v-model="freeHandymanForm.lastName"
              type="text"
              class="form-input"
              placeholder="הכנס שם משפחה"
              required
            />
          </div>
        </div>

        <div class="form-field">
          <label class="form-label" for="freeHandymanEmail">מייל *</label>
          <input
            id="freeHandymanEmail"
            v-model="freeHandymanForm.email"
            type="email"
            class="form-input"
            placeholder="הכנס כתובת מייל"
            required
          />
        </div>

        <div class="form-field">
          <label class="form-label" for="freeHandymanPassword">סיסמה *</label>
          <div class="input-with-icon">
            <input
              id="freeHandymanPassword"
              v-model="freeHandymanForm.password"
              :type="freeHandymanShowPassword ? 'text' : 'password'"
              class="form-input"
              placeholder="הכנס סיסמה"
              required
            />
            <button
              type="button"
              class="icon-btn"
              @click="freeHandymanShowPassword = !freeHandymanShowPassword"
            >
              <font-awesome-icon
                :icon="
                  freeHandymanShowPassword
                    ? ['fas', 'eye-slash']
                    : ['fas', 'eye']
                "
              />
            </button>
          </div>
        </div>

        <div class="form-field">
          <label class="form-label" for="freeHandymanPhone">פלאפון *</label>
          <input
            id="freeHandymanPhone"
            v-model="freeHandymanForm.phone"
            type="tel"
            class="form-input"
            placeholder="הכנס מספר טלפון"
            required
          />
        </div>

        <div class="form-field">
          <label class="form-label" for="freeHandymanAddress">עיר *</label>
          <AddressAutocomplete
            v-model="freeHandymanForm.city"
            @update:englishName="freeHandymanForm.addressEnglish = $event"
            @update:modelValue="freeHandymanForm.address = $event"
            input-id="freeHandymanAddress"
            placeholder="בחר עיר"
            :required="true"
          />
        </div>

        <div class="form-field">
          <label class="form-label" for="freeHandymanHowDidYouHear"
            >איך הגעת אלינו? (רשות)</label
          >
          <input
            id="freeHandymanHowDidYouHear"
            v-model="freeHandymanForm.howDidYouHear"
            type="text"
            class="form-input"
            placeholder="אינסטגרם / חבר / מודעה..."
          />
        </div>

        <div class="form-field">
          <CategoryCheckboxSelector
            v-model="freeHandymanForm.specialties"
            label="תחומי התמחות *"
          />
        </div>

        <div class="form-field">
          <label class="form-label" for="freeHandymanImage">תמונה</label>
          <div class="file-upload">
            <input
              id="freeHandymanImage"
              type="file"
              accept="image/*"
              @change="handleFreeHandymanImageUpload"
              class="file-upload__input"
              :disabled="!!freeHandymanForm.image"
            />
            <label
              for="freeHandymanImage"
              class="file-upload__btn"
              :class="{ disabled: freeHandymanForm.image }"
            >
              <font-awesome-icon :icon="['fas', 'upload']" />
              <span>{{
                freeHandymanForm.image ? "נבחרה תמונה" : "בחר תמונה"
              }}</span>
            </label>
            <div v-if="freeHandymanForm.imagePreview" class="image-preview">
              <img :src="freeHandymanForm.imagePreview" alt="Preview" />
            </div>
          </div>
        </div>

        <div class="form-field">
          <label class="form-label" for="freeHandymanLogo">לוגו (רשות)</label>
          <div class="file-upload">
            <input
              id="freeHandymanLogo"
              type="file"
              accept="image/*"
              @change="handleFreeHandymanLogoUpload"
              class="file-upload__input"
              :disabled="!!freeHandymanForm.logo"
            />
            <label
              for="freeHandymanLogo"
              class="file-upload__btn"
              :class="{ disabled: freeHandymanForm.logo }"
            >
              <font-awesome-icon :icon="['fas', 'upload']" />
              <span>{{
                freeHandymanForm.logo ? "נבחר לוגו" : "בחר לוגו"
              }}</span>
            </label>
            <div v-if="freeHandymanForm.logoPreview" class="image-preview">
              <img :src="freeHandymanForm.logoPreview" alt="Preview" />
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button
            type="submit"
            class="btn btn--free"
            :disabled="isSubmittingFreeHandyman"
          >
            {{ isSubmittingFreeHandyman ? "שולח..." : "רישום הנדימן בחינם" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { URL } from "@/Url/url";
import { useToast } from "@/composables/useToast";
import AddressAutocomplete from "@/components/Global/AddressAutocomplete.vue";
import CategoryCheckboxSelector from "@/components/Global/CategoryCheckboxSelector.vue";
import logger from "@/utils/logger";

export default {
  name: "FreeHandymanTab",
  components: {
    AddressAutocomplete,
    CategoryCheckboxSelector,
  },
  data() {
    return {
      toast: null,
      freeHandymanShowPassword: false,
      isSubmittingFreeHandyman: false,
      freeHandymanForm: {
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        phone: "",
        city: "",
        address: "",
        addressEnglish: "",
        howDidYouHear: "",
        specialties: [],
        image: null,
        imagePreview: null,
        imageUrl: null,
        logo: null,
        logoPreview: null,
        logoUrl: null,
        isHandyman: true,
        trialExpiresAt: "always", // Free forever - replaces handimanFree
      },
    };
  },
  created() {
    this.toast = useToast();
  },
  methods: {
    async handleFreeHandymanImageUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      this.freeHandymanForm.image = file;
      const reader = new FileReader();
      reader.onload = (e) =>
        (this.freeHandymanForm.imagePreview = e.target.result);
      reader.readAsDataURL(file);

      try {
        const formData = new FormData();
        formData.append("image", file);

        const { data } = await axios.post(`${URL}/upload-image`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        this.freeHandymanForm.imageUrl = data.imageUrl;
      } catch (error) {
        const msg =
          error.response?.data?.message ||
          (error.response?.status === 403
            ? "אין הרשאה להעלות תמונות. אנא בדוק הרשאות AWS."
            : error.response?.status === 404
            ? "שרת לא זמין. אנא ודא שהשרת רץ"
            : "לא הצלחנו להעלות את התמונה");
        this.toast?.showError(msg);
      }
    },
    async handleFreeHandymanLogoUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      this.freeHandymanForm.logo = file;
      const reader = new FileReader();
      reader.onload = (e) =>
        (this.freeHandymanForm.logoPreview = e.target.result);
      reader.readAsDataURL(file);

      try {
        const formData = new FormData();
        formData.append("image", file);

        const { data } = await axios.post(`${URL}/upload-logo`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        this.freeHandymanForm.logoUrl = data.imageUrl;
      } catch (error) {
        const msg =
          error.response?.data?.message ||
          (error.response?.status === 403
            ? "אין הרשאה להעלות תמונות. אנא בדוק הרשאות AWS."
            : error.response?.status === 404
            ? "שרת לא זמין. אנא ודא שהשרת רץ"
            : "לא הצלחנו להעלות את הלוגו");
        this.toast?.showError(msg);
      }
    },
    async handleFreeHandymanRegister() {
      if (this.isSubmittingFreeHandyman) return;

      try {
        this.isSubmittingFreeHandyman = true;
        let formData = { ...this.freeHandymanForm };

        // Get English address if needed
        if (!formData.addressEnglish && formData.city) {
          try {
            const citiesData = await import("@/APIS/AdressFromIsrael.json");
            const cities = Array.isArray(citiesData.default)
              ? citiesData.default
              : citiesData;

            const searchValue = formData.city.trim();
            const foundCity = cities.find((city) => {
              const cityName = (city.name || city.שם_ישוב || "").trim();
              if (!cityName) return false;
              const a = cityName.replace(/\s+/g, " ");
              const b = searchValue.replace(/\s+/g, " ");
              return (
                a === b ||
                a.toLowerCase() === b.toLowerCase() ||
                a.replace(/['"()]/g, "").trim() ===
                  b.replace(/['"()]/g, "").trim()
              );
            });

            if (foundCity && foundCity.english_name) {
              formData.addressEnglish = foundCity.english_name;
            }
          } catch (e) {
            // Ignore error
          }
        }

        // Upload image if needed
        if (formData.image && !formData.imageUrl) {
          const upload = new FormData();
          upload.append("image", formData.image);
          const { data } = await axios.post(`${URL}/upload-image`, upload, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          formData.imageUrl = data.imageUrl;
        }

        // Upload logo if needed
        if (formData.logo && !formData.logoUrl) {
          const upload = new FormData();
          upload.append("image", formData.logo);
          const { data } = await axios.post(`${URL}/upload-logo`, upload, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          formData.logoUrl = data.imageUrl;
        }

        // Clean up form data
        delete formData.image;
        delete formData.logo;
        delete formData.imagePreview;
        delete formData.logoPreview;

        // Format specialties
        if (formData.specialties && Array.isArray(formData.specialties)) {
          formData.specialties = formData.specialties
            .filter(
              (item) =>
                item &&
                item.name &&
                (item.isFullCategory === true || item.type === "category")
            )
            .map((item) => item.name);
        }

        // Add trialExpiresAt: "always" for free handymen
        formData.trialExpiresAt = "always"; // Free forever - replaces handimanFree

        // Send registration request
        const { data } = await axios.post(
          `${URL}/register-handyman`,
          formData,
          {
            timeout: 30000,
          }
        );

        if (data === true || (data && data.success !== false)) {
          this.toast?.showSuccess("רישום הנדימן בוצע בהצלחה!");
          // Reset form
          this.freeHandymanForm = {
            firstName: "",
            lastName: "",
            email: "",
            password: "",
            phone: "",
            city: "",
            address: "",
            addressEnglish: "",
            howDidYouHear: "",
            specialties: [],
            image: null,
            imagePreview: null,
            imageUrl: null,
            logo: null,
            logoPreview: null,
            logoUrl: null,
            isHandyman: true,
            trialExpiresAt: "always", // Free forever - replaces handimanFree
          };
        } else {
          this.toast?.showError(data?.message || "לא הצלחנו לרשום את ההנדימן");
        }
      } catch (error) {
        let errorMessage = "לא הצלחנו לרשום את ההנדימן";
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response?.status === 400) {
          errorMessage = "הנתונים שהוזנו לא תקינים. אנא בדוק ונסה שוב.";
        } else if (error.response?.status === 500) {
          errorMessage = "יש בעיה בשרת. אנא נסה שוב מאוחר יותר.";
        } else if (error.message) {
          errorMessage = `לא הצלחנו לרשום את ההנדימן: ${error.message}`;
        }
        this.toast?.showError(errorMessage);
      } finally {
        this.isSubmittingFreeHandyman = false;
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

.free-handyman-section {
  padding: 24px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 16px;
  border: 1px solid rgba($orange, 0.2);
}

.free-handyman-section__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba($orange, 0.3);
}

.free-handyman-section__title {
  font-size: 28px;
  font-weight: 1000;
  color: $orange2;
  margin: 0;
  font-family: $font-family;
}

.free-handyman-section__badge {
  display: flex;
  align-items: center;
}

.badge {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 900;
  display: inline-block;
  border: 2px solid;

  &--free {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
    border-color: rgba(16, 185, 129, 0.4);
  }
}

.free-handyman-form-wrapper {
  max-width: 800px;
  margin: 0 auto;
}

.free-handyman-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
  background: rgba(255, 255, 255, 0.03);
  padding: 32px;
  border-radius: 16px;
  border: 1px solid rgba($orange, 0.15);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 900;
  color: $orange2;
  font-family: $font-family;
}

.form-input {
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba(255, 255, 255, 0.05);
  color: $text;
  font-size: 14px;
  font-weight: 600;
  font-family: $font-family;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: $orange;
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 0 0 3px rgba($orange, 0.1);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
}

.input-with-icon {
  position: relative;
  display: flex;
  align-items: center;

  .form-input {
    padding-right: 48px;
    width: 100%;
  }

  .icon-btn {
    position: absolute;
    right: 12px;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s ease;

    &:hover {
      color: $orange2;
    }
  }
}

.file-upload {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.file-upload__input {
  display: none;
}

.file-upload__btn {
  padding: 12px 20px;
  border-radius: 8px;
  border: 2px dashed rgba($orange, 0.4);
  background: rgba($orange, 0.1);
  color: $orange2;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  transition: all 0.2s ease;
  font-family: $font-family;

  &:hover:not(.disabled) {
    background: rgba($orange, 0.2);
    border-color: rgba($orange, 0.6);
    transform: translateY(-1px);
  }

  &.disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.image-preview {
  margin-top: 12px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba($orange, 0.3);
  max-width: 200px;

  img {
    width: 100%;
    height: auto;
    display: block;
  }
}

.form-actions {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

.btn {
  padding: 14px 32px;
  border-radius: 8px;
  border: none;
  font-size: 16px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: $font-family;

  &--free {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
    }

    &:active:not(:disabled) {
      transform: translateY(0);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

/* Mobile Responsive - max-width 500px */
@media (max-width: 500px) {
  .free-handyman-section {
    padding: 14px;
    border-radius: 12px;
  }

  .free-handyman-section__header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 20px;
    padding-bottom: 12px;
  }

  .free-handyman-section__title {
    font-size: 20px;
  }

  .badge {
    font-size: 12px;
    padding: 6px 12px;
  }

  .free-handyman-form-wrapper {
    max-width: 100%;
  }

  .free-handyman-form {
    padding: 20px;
    border-radius: 12px;
    gap: 18px;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 18px;
  }

  .form-field {
    gap: 8px;
  }

  .form-label {
    font-size: 13px;
  }

  .form-input {
    font-size: 14px;
    padding: 10px 12px;
  }

  .input-with-icon .form-input {
    padding-right: 44px;
  }

  .file-upload__btn {
    padding: 10px 16px;
    font-size: 13px;
  }

  .image-preview {
    max-width: 150px;
  }

  .form-actions {
    margin-top: 12px;
  }

  .btn--free {
    width: 100%;
    padding: 12px 24px;
    font-size: 15px;
  }
}
</style>
