<template>
  <div class="register-page">
    <div class="register-wrapper">
      <!-- צד שמאל - טקסטים מעוצבים -->
      <div class="register-sidebar">
        <div class="sidebar-content">
          <div class="logo-circle-large">H</div>
          <h1 class="sidebar-title">Hendiman</h1>
          <div class="tagline-box">
            <p class="tagline-main">תיקונים קטנים</p>
            <p class="tagline-sub">פתרונות גדולים</p>
          </div>
          <div class="features-list">
            <div class="feature-item">
              <span class="feature-icon">⚡</span>
              <span>הזמנה מהירה ונוחה</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">🔒</span>
              <span>תשלום מאובטח</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">⭐</span>
              <span>הנדימנים מאומתים</span>
            </div>
          </div>
        </div>
      </div>

      <!-- צד ימין - טופס -->
      <div class="register-form-section">
        <div class="register-card">
          <div class="logo-circle">H</div>
          <h1 class="register-title">הרשמה</h1>
          <p class="register-subtitle">הצטרף להנדימן</p>

          <!-- טאבים -->
          <div class="tabs">
            <button
              :class="['tab-button', { active: activeTab === 'client' }]"
              @click="activeTab = 'client'"
            >
              לקוח
            </button>
            <button
              :class="['tab-button', { active: activeTab === 'handyman' }]"
              @click="activeTab = 'handyman'"
            >
              הנדימן
            </button>
          </div>

          <!-- הודעת ברכה למשתמש Google -->
          <div v-if="isGoogleUser && googleUserData" class="google-welcome">
            <font-awesome-icon :icon="['fas', 'check-circle']" />
            <h3>
              ברוך הבא,
              {{ googleUserData.name || googleUserData.username }}!
            </h3>
            <p>אנא השלם את הפרטים החסרים להשלמת ההרשמה</p>
          </div>

          <!-- טופס לקוח -->
          <Transition name="tab-fade" mode="out-in">
            <div v-if="activeTab === 'client'" key="client">
              <form
                @submit.prevent="handleClientRegister"
                class="register-form"
              >
                <!-- תצוגת תמונות למעלה -->
                <!-- תמונת גוגל -->
                <div
                  v-if="
                    isGoogleUser && googleUserData && googleUserData.picture
                  "
                  class="input-group image-section-top"
                >
                  <div class="image-preview google-image-preview profile-image">
                    <img
                      :src="googleUserData.picture"
                      alt="Google Profile"
                      crossorigin="anonymous"
                      referrerpolicy="no-referrer"
                      @error="handleImageError"
                      @load="handleImageLoad"
                    />
                  </div>
                </div>

                <!-- תמונה שהועלתה -->
                <div
                  v-if="clientForm.image"
                  class="input-group image-section-top"
                >
                  <div class="image-preview profile-image">
                    <img :src="clientForm.imagePreview" alt="Preview" />
                  </div>
                </div>

                <!-- העלאת תמונה (אם אין תמונה) -->
                <div
                  v-if="
                    !isGoogleUser || !googleUserData || !googleUserData.picture
                  "
                  class="input-group"
                >
                  <label for="clientImage">תמונה</label>
                  <div class="file-upload-wrapper">
                    <input
                      id="clientImage"
                      type="file"
                      accept="image/*"
                      @change="handleClientImageUpload"
                      class="file-input"
                      :disabled="!!clientForm.image"
                    />
                    <label
                      for="clientImage"
                      class="file-label"
                      :class="{ disabled: clientForm.image }"
                    >
                      <font-awesome-icon :icon="['fas', 'upload']" />
                      {{ clientForm.image ? "תמונה נבחרה" : "בחר תמונה" }}
                    </label>
                  </div>
                </div>

                <div
                  v-if="
                    !isGoogleUser || !googleUserData || !googleUserData.name
                  "
                  class="form-row"
                >
                  <div class="input-group">
                    <label for="clientFirstName">שם פרטי</label>
                    <input
                      id="clientFirstName"
                      v-model="clientForm.firstName"
                      type="text"
                      placeholder="הכנס שם פרטי"
                      :required="
                        !isGoogleUser || !googleUserData || !googleUserData.name
                      "
                    />
                  </div>
                  <div class="input-group">
                    <label for="clientLastName">שם משפחה</label>
                    <input
                      id="clientLastName"
                      v-model="clientForm.lastName"
                      type="text"
                      placeholder="הכנס שם משפחה"
                      :required="
                        !isGoogleUser || !googleUserData || !googleUserData.name
                      "
                    />
                  </div>
                </div>

                <div
                  v-if="
                    !isGoogleUser || !googleUserData || !googleUserData.email
                  "
                  class="input-group"
                >
                  <label for="clientEmail">מייל</label>
                  <input
                    id="clientEmail"
                    v-model="clientForm.email"
                    type="email"
                    placeholder="הכנס כתובת מייל"
                    :required="
                      !isGoogleUser || !googleUserData || !googleUserData.email
                    "
                  />
                </div>

                <div
                  v-if="!isGoogleUser"
                  class="input-group password-input-group"
                >
                  <label for="clientPassword">סיסמה</label>
                  <div class="password-input-wrapper">
                    <input
                      id="clientPassword"
                      v-model="clientForm.password"
                      :type="clientShowPassword ? 'text' : 'password'"
                      placeholder="הכנס סיסמה"
                      required
                    />
                    <button
                      type="button"
                      class="show-password-button"
                      @click="clientShowPassword = !clientShowPassword"
                      :aria-label="
                        clientShowPassword ? 'הסתר סיסמה' : 'הראה סיסמה'
                      "
                    >
                      <font-awesome-icon
                        :icon="
                          clientShowPassword
                            ? ['fas', 'eye-slash']
                            : ['fas', 'eye']
                        "
                      />
                    </button>
                  </div>
                </div>

                <div class="input-group">
                  <label for="clientPhone">פלאפון</label>
                  <input
                    id="clientPhone"
                    v-model="clientForm.phone"
                    type="tel"
                    placeholder="הכנס מספר טלפון"
                    required
                  />
                </div>

                <div class="input-group">
                  <label for="clientAddress">עיר</label>
                  <AddressAutocomplete
                    v-model="clientForm.city"
                    input-id="clientAddress"
                    placeholder="בחר עיר"
                    :required="true"
                  />
                </div>

                <div class="input-group">
                  <label for="clientHowDidYouHear"
                    >איך הגעת אלינו? (רשות)</label
                  >
                  <input
                    id="clientHowDidYouHear"
                    v-model="clientForm.howDidYouHear"
                    type="text"
                    placeholder="איך הגעת אלינו?"
                  />
                </div>

                <button type="submit" class="register-button">הרשמה</button>
              </form>

              <div v-if="!isGoogleUser" class="divider">
                <span>או</span>
              </div>

              <div v-if="!isGoogleUser" class="social-login">
                <button
                  class="social-button google"
                  @click="ConenectWithGoogle"
                >
                  <img src="@/assets/Google.png" alt="Google" />
                  הרשם עם Google
                </button>
                <button
                  class="social-button facebook"
                  @click="ConenectWithFacebook"
                >
                  <img src="@/assets/FaceBook.png" alt="Facebook" />
                  הרשם עם Facebook
                </button>
              </div>
            </div>
          </Transition>

          <!-- טופס הנדימן -->
          <Transition name="tab-fade" mode="out-in">
            <div v-if="activeTab === 'handyman'" key="handyman">
              <div class="price-notice">
                <font-awesome-icon :icon="['fas', 'info-circle']" />
                <span>הרשמה להנדימן 49.90 ₪</span>
              </div>
              <form
                @submit.prevent="handleHandymanRegister"
                class="register-form"
              >
                <!-- תצוגת תמונות למעלה -->
                <!-- תמונת גוגל -->
                <div
                  v-if="
                    isGoogleUser && googleUserData && googleUserData.picture
                  "
                  class="input-group image-section-top"
                >
                  <div class="image-preview google-image-preview profile-image">
                    <img
                      :src="googleUserData.picture"
                      alt="Google Profile"
                      crossorigin="anonymous"
                      referrerpolicy="no-referrer"
                      @error="handleImageError"
                      @load="handleImageLoad"
                    />
                  </div>
                </div>

                <!-- תמונה שהועלתה -->
                <div
                  v-if="handymanForm.image"
                  class="input-group image-section-top"
                >
                  <div class="image-preview profile-image">
                    <img :src="handymanForm.imagePreview" alt="Preview" />
                  </div>
                </div>

                <!-- לוגו שהועלה -->
                <div
                  v-if="handymanForm.logo"
                  class="input-group image-section-top"
                >
                  <div class="image-preview profile-image">
                    <img :src="handymanForm.logoPreview" alt="Logo Preview" />
                  </div>
                </div>

                <!-- העלאת תמונה (אם אין תמונה) -->
                <div
                  v-if="
                    !isGoogleUser || !googleUserData || !googleUserData.picture
                  "
                  class="input-group"
                >
                  <label for="handymanImage">תמונה</label>
                  <div class="file-upload-wrapper">
                    <input
                      id="handymanImage"
                      type="file"
                      accept="image/*"
                      @change="handleHandymanImageUpload"
                      class="file-input"
                      :disabled="!!handymanForm.image"
                    />
                    <label
                      for="handymanImage"
                      class="file-label"
                      :class="{ disabled: handymanForm.image }"
                    >
                      <font-awesome-icon :icon="['fas', 'upload']" />
                      {{ handymanForm.image ? "תמונה נבחרה" : "בחר תמונה" }}
                    </label>
                  </div>
                </div>

                <div
                  v-if="
                    !isGoogleUser || !googleUserData || !googleUserData.name
                  "
                  class="form-row"
                >
                  <div class="input-group">
                    <label for="handymanFirstName">שם פרטי</label>
                    <input
                      id="handymanFirstName"
                      v-model="handymanForm.firstName"
                      type="text"
                      placeholder="הכנס שם פרטי"
                      :required="
                        !isGoogleUser || !googleUserData || !googleUserData.name
                      "
                    />
                  </div>
                  <div class="input-group">
                    <label for="handymanLastName">שם משפחה</label>
                    <input
                      id="handymanLastName"
                      v-model="handymanForm.lastName"
                      type="text"
                      placeholder="הכנס שם משפחה"
                      :required="
                        !isGoogleUser || !googleUserData || !googleUserData.name
                      "
                    />
                  </div>
                </div>

                <div
                  v-if="
                    !isGoogleUser || !googleUserData || !googleUserData.email
                  "
                  class="input-group"
                >
                  <label for="handymanEmail">מייל</label>
                  <input
                    id="handymanEmail"
                    v-model="handymanForm.email"
                    type="email"
                    placeholder="הכנס כתובת מייל"
                    :required="
                      !isGoogleUser || !googleUserData || !googleUserData.email
                    "
                  />
                </div>

                <div
                  v-if="!isGoogleUser"
                  class="input-group password-input-group"
                >
                  <label for="handymanPassword">סיסמה</label>
                  <div class="password-input-wrapper">
                    <input
                      id="handymanPassword"
                      v-model="handymanForm.password"
                      :type="handymanShowPassword ? 'text' : 'password'"
                      placeholder="הכנס סיסמה"
                      required
                    />
                    <button
                      type="button"
                      class="show-password-button"
                      @click="handymanShowPassword = !handymanShowPassword"
                      :aria-label="
                        handymanShowPassword ? 'הסתר סיסמה' : 'הראה סיסמה'
                      "
                    >
                      <font-awesome-icon
                        :icon="
                          handymanShowPassword
                            ? ['fas', 'eye-slash']
                            : ['fas', 'eye']
                        "
                      />
                    </button>
                  </div>
                </div>

                <div class="input-group">
                  <label for="handymanPhone">פלאפון</label>
                  <input
                    id="handymanPhone"
                    v-model="handymanForm.phone"
                    type="tel"
                    placeholder="הכנס מספר טלפון"
                    required
                  />
                </div>

                <div class="input-group">
                  <label for="handymanAddress">עיר</label>
                  <AddressAutocomplete
                    v-model="handymanForm.city"
                    @update:englishName="handymanForm.addressEnglish = $event"
                    input-id="handymanAddress"
                    placeholder="בחר עיר"
                    :required="true"
                  />
                </div>

                <div class="input-group">
                  <label for="handymanHowDidYouHear"
                    >איך הגעת אלינו? (רשות)</label
                  >
                  <input
                    id="handymanHowDidYouHear"
                    v-model="handymanForm.howDidYouHear"
                    type="text"
                    placeholder="איך הגעת אלינו?"
                  />
                </div>

                <div class="input-group">
                  <div class="category-selector-info">
                    <font-awesome-icon :icon="['fas', 'info-circle']" />
                    <span
                      >ניתן לבחור קטגוריה שלימה או תת-קטגוריות ספציפיות</span
                    >
                  </div>
                  <CategorySelector v-model="handymanForm.specialties" />
                </div>

                <div class="input-group">
                  <label for="handymanLogo">לוגו (רשות)</label>
                  <div class="file-upload-wrapper">
                    <input
                      id="handymanLogo"
                      type="file"
                      accept="image/*"
                      @change="handleHandymanLogoUpload"
                      class="file-input"
                      :disabled="!!handymanForm.logo"
                    />
                    <label
                      for="handymanLogo"
                      class="file-label"
                      :class="{ disabled: handymanForm.logo }"
                    >
                      <font-awesome-icon :icon="['fas', 'upload']" />
                      {{ handymanForm.logo ? "לוגו נבחר" : "בחר לוגו" }}
                    </label>
                  </div>
                </div>

                <button type="submit" class="register-button">הרשמה</button>
              </form>

              <div class="divider">
                <span>או</span>
              </div>

              <div class="social-login">
                <button
                  class="social-button google"
                  @click="ConenectWithGoogle"
                >
                  <img src="@/assets/Google.png" alt="Google" />
                  הרשם עם Google
                </button>
                <button
                  class="social-button facebook"
                  @click="ConenectWithFacebook"
                >
                  <img src="@/assets/FaceBook.png" alt="Facebook" />
                  הרשם עם Facebook
                </button>
              </div>
            </div>
          </Transition>

          <p class="login-link">
            כבר יש לך חשבון?
            <router-link :to="{ name: 'logIn' }">התחבר כאן</router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { useToast } from "@/composables/useToast";
import { URL } from "@/Url/url";
import AddressAutocomplete from "@/components/AddressAutocomplete.vue";
import CategorySelector from "@/components/CategorySelector.vue";

export default {
  name: "RegisterView",
  components: {
    AddressAutocomplete,
    CategorySelector,
  },
  data() {
    return {
      activeTab: "client",
      clientShowPassword: false,
      handymanShowPassword: false,
      toast: null,
      isGoogleUser: false,
      googleUserData: null,
      isSubmitting: false, // הגנה מפני שליחה כפולה
      clientForm: {
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        phone: "",
        city: "",
        howDidYouHear: "",
        image: null,
        imagePreview: null,
        imageUrl: null,
        isHandyman: false,
      },
      handymanForm: {
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        phone: "",
        city: "",
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
      },
    };
  },
  created() {
    this.toast = useToast();
    this.handleGoogleCallback();
  },
  watch: {
    "$route.query": {
      handler() {
        if (this.toast) {
          this.handleGoogleCallback();
        }
      },
      immediate: true,
    },
  },
  methods: {
    handleImageError(event) {
      // אם יש שגיאה בטעינת התמונה, נסה ללא crossorigin
      if (event.target.crossOrigin === "anonymous") {
        const imageUrl = event.target.src;
        event.target.crossOrigin = null;
        event.target.src = "";
        // טען מחדש את התמונה ללא crossorigin
        setTimeout(() => {
          event.target.src = imageUrl;
        }, 100);
      }
    },
    handleImageLoad() {
      // תמונה נטענה בהצלחה
    },
    handleGoogleCallback() {
      if (!this.toast) {
        this.toast = useToast();
      }

      const googleAuth =
        this.$route.query.googleAuth ||
        new URLSearchParams(window.location.search).get("googleAuth");

      if (googleAuth === "success") {
        const userData =
          this.$route.query.user ||
          new URLSearchParams(window.location.search).get("user");

        // Get the tab parameter to know which form to show (client/handyman)
        const tab =
          this.$route.query.tab ||
          new URLSearchParams(window.location.search).get("tab") ||
          "client";

        // Set the active tab
        if (tab === "client" || tab === "handyman") {
          this.activeTab = tab;
        }

        if (userData) {
          try {
            const user = JSON.parse(decodeURIComponent(userData));
            this.googleUserData = user;
            this.isGoogleUser = true;

            // Fill in available data from Google to the appropriate form
            const targetForm =
              this.activeTab === "handyman"
                ? this.handymanForm
                : this.clientForm;

            // שמור את הנתונים מגוגל - גם אם השדות מוסתרים
            if (user.name) {
              const nameParts = user.name.split(" ");
              targetForm.firstName = nameParts[0] || "";
              targetForm.lastName = nameParts.slice(1).join(" ") || "";
            }
            if (user.email) {
              targetForm.email = user.email;
            }
            if (user.picture) {
              // You can use the Google picture as default image URL
              targetForm.imageUrl = user.picture;
            }
            // Set Google ID as password for Google users
            if (user.googleId || user._id) {
              targetForm.password = user.googleId || user._id.toString();
            }

            // שמור את הנתונים גם ב-googleUserData למקרה שצריך
            this.googleUserData = {
              ...user,
              firstName: targetForm.firstName,
              lastName: targetForm.lastName,
              email: targetForm.email,
              picture: targetForm.imageUrl,
            };

            this.toast.showSuccess("התחברות עם Google בוצעה בהצלחה!");

            // Clean URL - remove query params but keep tab if needed
            this.$router.replace({
              path: this.$route.path,
              query: {},
            });
          } catch (error) {
            this.toast.showError("שגיאה בעיבוד נתוני המשתמש");
          }
        }
      }
    },
    async handleClientImageUpload(event) {
      const file = event.target.files[0];
      if (file) {
        this.clientForm.image = file;
        const reader = new FileReader();
        reader.onload = (e) => {
          this.clientForm.imagePreview = e.target.result;
        };
        reader.readAsDataURL(file);

        // שליחת התמונה לשרת לקבלת קישור
        try {
          const formData = new FormData();
          formData.append("image", file);

          const uploadUrl = `${URL}/upload-image`;

          const { data } = await axios.post(uploadUrl, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });

          // שמירת הקישור שהתקבל מהשרת
          this.clientForm.imageUrl = data.imageUrl;
        } catch (error) {
          if (this.toast) {
            const errorMessage =
              error.response?.data?.message ||
              (error.response?.status === 403
                ? "אין הרשאה להעלות תמונות. אנא בדוק את הרשאות AWS."
                : error.response?.status === 404
                ? "שרת לא זמין. אנא ודא שהשרת רץ"
                : "שגיאה בהעלאת התמונה");
            this.toast.showError(errorMessage);
          }
        }
      }
    },
    async handleHandymanImageUpload(event) {
      const file = event.target.files[0];
      if (file) {
        this.handymanForm.image = file;
        const reader = new FileReader();
        reader.onload = (e) => {
          this.handymanForm.imagePreview = e.target.result;
        };
        reader.readAsDataURL(file);

        // שליחת התמונה לשרת לקבלת קישור
        try {
          const formData = new FormData();
          formData.append("image", file);

          const uploadUrl = `${URL}/upload-image`;

          const { data } = await axios.post(uploadUrl, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });

          // שמירת הקישור שהתקבל מהשרת
          this.handymanForm.imageUrl = data.imageUrl;
        } catch (error) {
          if (this.toast) {
            const errorMessage =
              error.response?.data?.message ||
              (error.response?.status === 403
                ? "אין הרשאה להעלות תמונות. אנא בדוק את הרשאות AWS."
                : error.response?.status === 404
                ? "שרת לא זמין. אנא ודא שהשרת רץ"
                : "שגיאה בהעלאת התמונה");
            this.toast.showError(errorMessage);
          }
        }
      }
    },
    async handleHandymanLogoUpload(event) {
      const file = event.target.files[0];
      if (file) {
        this.handymanForm.logo = file;
        const reader = new FileReader();
        reader.onload = (e) => {
          this.handymanForm.logoPreview = e.target.result;
        };
        reader.readAsDataURL(file);

        // שליחת הלוגו לשרת לקבלת קישור
        try {
          const formData = new FormData();
          formData.append("image", file);

          const uploadUrl = `${URL}/upload-logo`;

          const { data } = await axios.post(uploadUrl, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });

          // שמירת הקישור שהתקבל מהשרת
          this.handymanForm.logoUrl = data.imageUrl;
        } catch (error) {
          if (this.toast) {
            const errorMessage =
              error.response?.data?.message ||
              (error.response?.status === 403
                ? "אין הרשאה להעלות תמונות. אנא בדוק את הרשאות AWS."
                : error.response?.status === 404
                ? "שרת לא זמין. אנא ודא שהשרת רץ"
                : "שגיאה בהעלאת הלוגו");
            this.toast.showError(errorMessage);
          }
        }
      }
    },
    async handleClientRegister() {
      // הגנה מפני שליחה כפולה
      if (this.isSubmitting) {
        return;
      }

      try {
        this.isSubmitting = true;
        let formData = { ...this.clientForm };

        // אם משתמש מגוגל, ודא שהנתונים מגוגל נשמרים
        if (this.isGoogleUser && this.googleUserData) {
          if (this.googleUserData.firstName && !formData.firstName) {
            formData.firstName = this.googleUserData.firstName;
          }
          if (this.googleUserData.lastName && !formData.lastName) {
            formData.lastName = this.googleUserData.lastName;
          }
          if (this.googleUserData.email && !formData.email) {
            formData.email = this.googleUserData.email;
          }
          if (this.googleUserData.picture && !formData.imageUrl) {
            formData.imageUrl = this.googleUserData.picture;
          }
          if (this.googleUserData.googleId && !formData.password) {
            formData.password = this.googleUserData.googleId;
          }
        }

        // אם יש תמונה אבל עדיין לא imageUrl, צריך להעלות אותה קודם
        if (formData.image && !formData.imageUrl) {
          try {
            const formDataUpload = new FormData();
            formDataUpload.append("image", formData.image);

            const { data } = await axios.post(
              `${URL}/upload-image`,
              formDataUpload,
              {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
              }
            );

            formData.imageUrl = data.imageUrl;
          } catch (uploadError) {
            if (this.toast) {
              const errorMessage =
                uploadError.response?.data?.message ||
                (uploadError.response?.status === 403
                  ? "אין הרשאה להעלות תמונות. אנא בדוק את הרשאות AWS."
                  : uploadError.response?.status === 404
                  ? "שרת לא זמין. אנא ודא שהשרת רץ"
                  : "שגיאה בהעלאת התמונה");
              this.toast.showError(errorMessage);
            }
            return;
          }
        }

        // מחק את ה-image object לפני השליחה (שלח רק URL)
        delete formData.image;
        delete formData.imagePreview;

        const { data } = await axios.post(`${URL}/register-handyman`, formData);
        if (data === true || (data && data.success !== false)) {
          this.toast.showSuccess("הרשמה בוצעה בהצלחה!");
          if (data?.user?._id) {
            this.$router.push({
              name: "Dashboard",
              params: { id: data.user._id },
            });
          } else {
            // If no user data, redirect to login
            this.$router.push({ name: "logIn" });
          }
        } else {
          this.toast.showError(data?.message || "שגיאה בהרשמה");
        }
      } catch (error) {
        const errorMessage = error.response?.data?.message || "שגיאה בהרשמה";
        this.toast.showError(errorMessage);
      } finally {
        this.isSubmitting = false;
      }
    },
    async handleHandymanRegister() {
      // הגנה מפני שליחה כפולה
      if (this.isSubmitting) {
        return;
      }

      try {
        this.isSubmitting = true;
        let formData = null;
        if (this.activeTab === "handyman") {
          formData = { ...this.handymanForm };

          // ודא ש-addressEnglish קיים לפני השליחה
          // אם אין, נסה למצוא אותו מהעיר ישירות מהמאגר
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

                const normalizedCityName = cityName.replace(/\s+/g, " ");
                const normalizedSearch = searchValue.replace(/\s+/g, " ");

                return (
                  normalizedCityName === normalizedSearch ||
                  normalizedCityName.toLowerCase() ===
                    normalizedSearch.toLowerCase() ||
                  normalizedCityName.replace(/['"()]/g, "").trim() ===
                    normalizedSearch.replace(/['"()]/g, "").trim()
                );
              });

              if (foundCity && foundCity.english_name) {
                formData.addressEnglish = foundCity.english_name;
                this.handymanForm.addressEnglish = foundCity.english_name;
              }
            } catch (error) {
              console.error("Error loading cities data:", error);
            }
          }
        } else {
          formData = { ...this.clientForm };
        }

        // אם משתמש מגוגל, ודא שהנתונים מגוגל נשמרים
        if (this.isGoogleUser && this.googleUserData) {
          if (this.googleUserData.firstName && !formData.firstName) {
            formData.firstName = this.googleUserData.firstName;
          }
          if (this.googleUserData.lastName && !formData.lastName) {
            formData.lastName = this.googleUserData.lastName;
          }
          if (this.googleUserData.email && !formData.email) {
            formData.email = this.googleUserData.email;
          }
          if (this.googleUserData.picture && !formData.imageUrl) {
            formData.imageUrl = this.googleUserData.picture;
          }
          if (this.googleUserData.googleId && !formData.password) {
            formData.password = this.googleUserData.googleId;
          }
        }

        // אם יש תמונה אבל עדיין לא imageUrl, צריך להעלות אותה קודם
        if (formData.image && !formData.imageUrl) {
          try {
            const formDataUpload = new FormData();
            formDataUpload.append("image", formData.image);

            const { data } = await axios.post(
              `${URL}/upload-image`,
              formDataUpload,
              {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
              }
            );

            formData.imageUrl = data.imageUrl;
          } catch (uploadError) {
            if (this.toast) {
              const errorMessage =
                uploadError.response?.data?.message ||
                (uploadError.response?.status === 403
                  ? "אין הרשאה להעלות תמונות. אנא בדוק את הרשאות AWS."
                  : uploadError.response?.status === 404
                  ? "שרת לא זמין. אנא ודא שהשרת רץ"
                  : "שגיאה בהעלאת התמונה");
              this.toast.showError(errorMessage);
            }
            return;
          }
        }

        // אם יש לוגו אבל עדיין לא logoUrl, צריך להעלות אותו קודם
        if (formData.logo && !formData.logoUrl) {
          try {
            const formDataUpload = new FormData();
            formDataUpload.append("image", formData.logo);

            const { data } = await axios.post(
              `${URL}/upload-logo`,
              formDataUpload,
              {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
              }
            );

            formData.logoUrl = data.imageUrl;
          } catch (uploadError) {
            if (this.toast) {
              const errorMessage =
                uploadError.response?.data?.message ||
                (uploadError.response?.status === 403
                  ? "אין הרשאה להעלות תמונות. אנא בדוק את הרשאות AWS."
                  : uploadError.response?.status === 404
                  ? "שרת לא זמין. אנא ודא שהשרת רץ"
                  : "שגיאה בהעלאת הלוגו");
              this.toast.showError(errorMessage);
            }
            return;
          }
        }

        // מחק את ה-image וה-logo objects לפני השליחה (שלח רק URLs)
        delete formData.image;
        delete formData.logo;
        delete formData.imagePreview;
        delete formData.logoPreview;

        // ודא ש-specialties הוא מערך של אובייקטים (רק להנדימן)
        if (formData.isHandyman) {
          if (formData.specialties && Array.isArray(formData.specialties)) {
            // ודא שכל האיברים הם אובייקטים עם name, price, typeWork
            formData.specialties = formData.specialties
              .filter((item) => item && (item.name || item.subcategory))
              .map((item) => {
                const isFull =
                  item.isFullCategory === true || item.type === "category";
                const resolvedType = isFull ? "category" : "subCategory";
                // אם זה אובייקט עם name, price, typeWork (הפורמט החדש)
                if (item.name) {
                  return {
                    name: String(item.name).trim(),
                    price: item.price || null,
                    typeWork: item.typeWork || null,
                    isFullCategory: isFull,
                    type: item.type || resolvedType,
                  };
                }
                // אם זה אובייקט ישן עם subcategory, workType
                if (item.subcategory) {
                  return {
                    name: String(item.subcategory).trim(),
                    price: item.price || null,
                    typeWork: item.workType || item.typeWork || null,
                    isFullCategory: false,
                    type: "subCategory",
                  };
                }
                // אם זה string (תאימות לאחור)
                if (typeof item === "string") {
                  return {
                    name: String(item).trim(),
                    price: null,
                    typeWork: null,
                    isFullCategory: false,
                    type: "subCategory",
                  };
                }
                return null;
              })
              .filter((item) => item && item.name && item.name.length > 0);
          } else if (formData.isHandyman) {
            // אם זה הנדימן אבל אין specialties, הגדר כמערך ריק
            formData.specialties = [];
          }
        }

        const { data } = await axios.post(
          `${URL}/register-handyman`,
          formData,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        console.log("📥 Server response:", data);
        if (data === true || (data && data.success !== false)) {
          this.toast.showSuccess("הרשמה בוצעה בהצלחה!");
          if (data?.user?._id) {
            this.$router.push({
              name: "Dashboard",
              params: { id: data.user._id },
            });
          } else {
            // If no user data, redirect to login
            this.$router.push({ name: "logIn" });
          }
        } else {
          console.error("❌ Registration failed:", data);
          this.toast.showError(data?.message || "שגיאה בהרשמה");
        }
      } catch (error) {
        console.error("❌ Registration error:", error);
        console.error("❌ Error response:", error.response);
        const errorMessage = error.response?.data?.message || "שגיאה בהרשמה";
        this.toast.showError(errorMessage);
      } finally {
        this.isSubmitting = false;
      }
    },
    ConenectWithGoogle() {
      // Redirect to Google OAuth with source and tab parameters
      window.location.href = `${URL}/auth/google?source=register&tab=${this.activeTab}`;
    },
    ConenectWithFacebook() {
      this.toast.showError("התחברות עם פייסבוק עדיין לא מיושמת");
    },
  },
};
</script>

<style lang="scss" scoped>
.register-page {
  font-family: "Heebo", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%);
  padding: 20px;
}

.register-wrapper {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: calc(100vh - 40px);
  max-width: 1400px;
  margin: 0 auto;
  gap: 40px;
  align-items: start;
}

/* צד שמאל - טקסטים מעוצבים */
.register-sidebar {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  direction: rtl;
  position: sticky;
  top: 20px;
  align-self: start;
}

.sidebar-content {
  width: 100%;
  max-width: 500px;
}

.logo-circle-large {
  width: 80px;
  height: 80px;
  border-radius: 999px;
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000000;
  font-weight: 700;
  font-size: 36px;
  margin: 0 auto 30px;
  box-shadow: 0 8px 24px rgba(249, 115, 22, 0.4);
}

.sidebar-title {
  color: #f97316;
  font-size: 3rem;
  font-weight: bold;
  text-align: center;
  margin: 0 0 40px 0;
  text-shadow: 0 0 20px rgba(249, 115, 22, 0.5);
  letter-spacing: 2px;
}

.tagline-box {
  background: #111111;
  border: 2px solid #f97316;
  border-radius: 16px;
  padding: 30px;
  margin-bottom: 40px;
  text-align: center;
  box-shadow: 0 8px 24px rgba(249, 115, 22, 0.2);
}

.tagline-main {
  color: #f97316;
  font-size: 2rem;
  font-weight: bold;
  margin: 0 0 10px 0;
  text-shadow: 0 0 15px rgba(249, 115, 22, 0.4);
}

.tagline-sub {
  color: #ffffff;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  opacity: 0.9;
}

.features-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 15px;
  color: #ffffff;
  font-size: 1.1rem;
}

.feature-icon {
  font-size: 1.5rem;
}

/* צד ימין - טופס */
.register-form-section {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 40px;
  direction: rtl;
}

.register-card {
  background: #111111;
  border: 2px solid #f97316;
  border-radius: 14px;
  padding: 25px;
  box-shadow: 0 8px 32px rgba(249, 115, 22, 0.2);
  animation: slideIn 0.5s ease-out;
  width: 100%;
  max-width: 420px;
  overflow: hidden;
  position: relative;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.logo-circle {
  width: 45px;
  height: 45px;
  border-radius: 999px;
  background: #f97316;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000000;
  font-weight: 700;
  font-size: 20px;
  margin: 0 auto 15px;
}

.register-title {
  color: #f97316;
  font-size: 1.75rem;
  font-weight: bold;
  text-align: center;
  margin: 0 0 6px 0;
}

.register-subtitle {
  color: #9ca3af;
  text-align: center;
  margin: 0 0 20px 0;
  font-size: 0.85rem;
}

/* הודעת מחיר */
.price-notice {
  background: rgba(249, 115, 22, 0.1);
  border: 2px solid #f97316;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #f97316;
  font-size: 0.9rem;
  font-weight: 600;
  text-align: right;
  direction: rtl;

  svg,
  font-awesome-icon {
    font-size: 1rem;
    flex-shrink: 0;
  }
}

/* טאבים */
.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  border-bottom: 2px solid #2d2d2d;
}

.tab-button {
  flex: 1;
  background: transparent;
  border: none;
  color: #9ca3af;
  padding: 10px 16px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
  position: relative;
  transform: translateY(0);

  &::before {
    content: "";
    position: absolute;
    bottom: -2px;
    left: 0;
    right: 0;
    height: 3px;
    background: #f97316;
    transform: scaleX(0);
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    transform-origin: center;
  }

  &:hover {
    color: #f97316;
    transform: translateY(-2px);
  }

  &.active {
    color: #f97316;
    border-bottom-color: #f97316;

    &::before {
      transform: scaleX(1);
    }
  }
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 5px;

  label {
    color: #f97316;
    font-weight: 600;
    font-size: 0.8rem;
    text-align: right;
  }

  input,
  textarea {
    background: #1f1f1f;
    border: 2px solid #2d2d2d;
    border-radius: 6px;
    padding: 10px 12px;
    color: #ffffff;
    font-size: 0.9rem;
    transition: all 0.3s ease;
    text-align: right;
    direction: rtl;
    width: 100%;
    box-sizing: border-box;
    max-width: 100%;
    font-family: inherit;

    &::placeholder {
      color: #666;
      font-size: 0.85rem;
    }

    &:focus {
      outline: none;
      border-color: #f97316;
      box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.1);
      background: #2a2a2a;
    }

    &:hover {
      border-color: #f97316;
    }
  }

  textarea {
    resize: vertical;
    min-height: 60px;
  }
}

.password-input-group {
  .password-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .password-input-wrapper input {
    padding-left: 35px;
  }
}

.show-password-button {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  margin: 0;
  position: absolute;
  left: 6px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  width: 28px;
  height: 28px;

  svg,
  font-awesome-icon {
    width: 16px;
    height: 16px;
    font-size: 16px;
  }

  &:hover {
    color: #f97316;
    background: rgba(249, 115, 22, 0.1);
  }

  &:active {
    transform: translateY(-50%) scale(0.95);
  }

  &:focus {
    outline: 2px solid #f97316;
    outline-offset: 2px;
  }
}

/* העלאת קבצים */
.file-upload-wrapper {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.file-input {
  display: none;
}

.file-label {
  background: #1f1f1f;
  border: 2px dashed #2d2d2d;
  border-radius: 6px;
  padding: 10px 12px;
  color: #9ca3af;
  font-size: 0.85rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  &:hover {
    border-color: #f97316;
    color: #f97316;
    background: rgba(249, 115, 22, 0.05);
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: #1a1a1a;
    border-color: #1a1a1a;
    color: #666;

    &:hover {
      border-color: #1a1a1a;
      color: #666;
      background: #1a1a1a;
    }
  }
}

.file-input:disabled + .file-label {
  opacity: 0.5;
  cursor: not-allowed;
  background: #1a1a1a;
  border-color: #1a1a1a;
  color: #666;

  &:hover {
    border-color: #1a1a1a;
    color: #666;
    background: #1a1a1a;
  }
}

.image-preview {
  margin-top: 10px;
  width: 100%;
  max-width: 200px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #f97316;

  img {
    width: 100%;
    height: auto;
    display: block;
  }
}

.image-section-top {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.profile-image {
  width: 120px;
  height: 120px;
  max-width: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #f97316;
  box-shadow: 0 4px 16px rgba(249, 115, 22, 0.4);
  background: #1f1f1f;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    border-radius: 50%;
  }
}

.google-image-preview {
  border: 2px solid #f97316;
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);

  img {
    width: 100%;
    height: auto;
    display: block;
    border-radius: 6px;
  }
}

.register-button {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  color: #000000;
  border: none;
  border-radius: 6px;
  padding: 12px;
  font-size: 0.95rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 8px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(249, 115, 22, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
}

.login-link {
  text-align: center;
  margin-top: 20px;
  color: #9ca3af;
  font-size: 0.9rem;

  a {
    color: #f97316;
    text-decoration: none;
    font-weight: 600;

    &:hover {
      text-decoration: underline;
    }
  }
}

/* Divider */
.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 20px 0;
  color: #9ca3af;
  font-size: 0.85rem;

  &::before,
  &::after {
    content: "";
    flex: 1;
    border-bottom: 1px solid #2d2d2d;
  }

  span {
    padding: 0 12px;
  }
}

/* Social Login */
.social-login {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.social-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: #1f1f1f;
  border: 2px solid #2d2d2d;
  border-radius: 6px;
  padding: 10px 14px;
  color: #ffffff;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  img {
    width: 20px;
    height: 20px;
    border-radius: 4px;
  }

  &:hover {
    border-color: #f97316;
    background: rgba(249, 115, 22, 0.05);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }

  &.google {
    &:hover {
      border-color: #4285f4;
      background: rgba(66, 133, 244, 0.05);
    }
  }

  &.facebook {
    &:hover {
      border-color: #1877f2;
      background: rgba(24, 119, 242, 0.05);
    }
  }
}

/* אנימציות מעבר בין טאבים - רק בתוך הכרטסייה */
.register-card .tab-fade-enter-active {
  transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.register-card .tab-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.55, 0.06, 0.68, 0.19);
}

.register-card .tab-fade-enter-from {
  opacity: 0;
  transform: translateY(30px);
  filter: blur(4px);
}

.register-card .tab-fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
  filter: blur(2px);
}

.register-card .tab-fade-enter-to,
.register-card .tab-fade-leave-from {
  opacity: 1;
  transform: translateY(0);
  filter: blur(0);
}

.google-welcome {
  background: rgba(249, 115, 22, 0.1);
  border: 2px solid #f97316;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  text-align: center;
  direction: rtl;

  svg,
  font-awesome-icon {
    color: #f97316;
    font-size: 1.5rem;
    margin-bottom: 10px;
    display: block;
  }

  h3 {
    color: #f97316;
    font-size: 1.2rem;
    font-weight: bold;
    margin: 8px 0;
  }

  p {
    color: #9ca3af;
    font-size: 0.9rem;
    margin: 0;
  }
}

/* Responsive */
@media (max-width: 968px) {
  .register-wrapper {
    grid-template-columns: 1fr;
  }

  .register-sidebar {
    display: none;
  }

  .register-card {
    padding: 30px 20px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}

.category-selector-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(249, 115, 22, 0.1);
  border: 1px solid rgba(249, 115, 22, 0.3);
  border-radius: 6px;
  margin-bottom: 8px;
  direction: rtl;
  font-size: 0.85rem;
  color: #f97316;

  svg,
  font-awesome-icon {
    color: #f97316;
    font-size: 0.9rem;
  }

  span {
    color: #f97316;
  }
}
</style>
