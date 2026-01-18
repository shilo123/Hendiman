<template>
  <div class="register-page" dir="rtl">
    <!-- רקע וידאו או GIF -->
    <video
      v-if="useVideo"
      class="register-page__bg-video"
      autoplay
      muted
      loop
      playsinline
    >
      <source src="/img/backgroundApp.mp4" type="video/mp4" />
      <source src="/img/backgroundApp.webm" type="video/webm" />
    </video>
    <div class="register-page__bg-image" v-else></div>
    <div class="register-shell">
      <!-- Sidebar (רק בדסקטופ) -->
      <aside class="register-sidebar">
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
      </aside>

      <!-- Form -->
      <main class="register-main">
        <section class="register-card" aria-label="טופס הרשמה">
          <!-- Header קטן למובייל (במקום ה-sidebar) -->
          <div class="mobile-brand">
            <div class="logo-circle">H</div>
            <div class="mobile-brand__text">
              <div class="mobile-brand__title">Hendiman</div>
              <div class="mobile-brand__subtitle">
                בעיות קטנות · פתרונות גדולים
              </div>
            </div>
          </div>

          <!-- Tabs sticky בתוך הכרטיס -->
          <div class="tabs">
            <button
              type="button"
              class="tab"
              :class="{ active: activeTab === 'client' }"
              @click="activeTab = 'client'"
            >
              לקוח
            </button>
            <button
              type="button"
              class="tab"
              :class="{ active: activeTab === 'handyman' }"
              @click="activeTab = 'handyman'"
            >
              הנדימן
            </button>
            <!-- כפתור דמו - רק בפיתוח -->
            <button
              v-if="isDevelopment"
              type="button"
              class="tab tab--demo"
              @click="fillDemoData"
              title="מלא פרטי דמו"
            >
              🧪 דמו
            </button>
          </div>

          <!-- Blocked User Message -->
          <div v-if="isBlocked" class="blocked-message">
            <font-awesome-icon :icon="['fas', 'ban']" />
            <span>המשתמש הזה חסום על ידי הנהלת הנדימן</span>
          </div>

          <!-- Google welcome -->
          <div v-if="isGoogleUser && googleUserData" class="notice notice--ok">
            <font-awesome-icon :icon="['fas', 'check-circle']" />
            <div class="notice__text">
              <div class="notice__title">
                ברוך הבא, {{ googleUserData.name || googleUserData.username }}!
              </div>
              <div class="notice__sub">רק נשלים כמה פרטים ונגמר הסיפור</div>
            </div>
          </div>

          <!-- Facebook welcome -->
          <div
            v-if="isFacebookUser && facebookUserData"
            class="notice notice--ok"
          >
            <font-awesome-icon :icon="['fas', 'check-circle']" />
            <div class="notice__text">
              <div class="notice__title">
                ברוך הבא,
                {{ facebookUserData.name || facebookUserData.username }}!
              </div>
              <div class="notice__sub">רק נשלים כמה פרטים ונגמר הסיפור</div>
            </div>
          </div>

          <!-- Client -->
          <Transition name="tab-fade" mode="out-in">
            <div v-if="activeTab === 'client'" key="client" class="tab-body">
              <form @submit.prevent="handleClientRegister" class="form">
                <!-- תמונת פרופיל -->
                <div class="profile-top">
                  <div
                    v-if="
                      isGoogleUser && googleUserData && googleUserData.picture
                    "
                    class="avatar"
                  >
                    <img
                      :src="googleUserData.picture"
                      alt="Google Profile"
                      crossorigin="anonymous"
                      referrerpolicy="no-referrer"
                      @error="handleImageError"
                      @load="handleImageLoad"
                    />
                  </div>

                  <div
                    v-else-if="
                      isFacebookUser &&
                      facebookUserData &&
                      facebookUserData.picture
                    "
                    class="avatar"
                  >
                    <img
                      :src="facebookUserData.picture"
                      alt="Facebook Profile"
                      crossorigin="anonymous"
                      referrerpolicy="no-referrer"
                      @error="handleImageError"
                      @load="handleImageLoad"
                    />
                  </div>

                  <div v-else-if="clientForm.image" class="avatar">
                    <img :src="clientForm.imagePreview" alt="Preview" />
                  </div>

                  <div v-else-if="clientForm.imageUrl" class="avatar">
                    <img :src="clientForm.imageUrl" alt="Profile" />
                  </div>

                  <div v-else class="avatar avatar--empty">
                    <span>📷</span>
                  </div>
                </div>
                (!isGoogleUser || !googleUserData || !googleUserData.picture) &&
                (!isFacebookUser || !facebookUserData ||
                !facebookUserData.picture)
                <!-- העלאת תמונה (רק אם אין תמונת גוגל) -->
                <div
                  v-if="
                    !isGoogleUser || !googleUserData || !googleUserData.picture
                  "
                  class="field"
                >
                  <label class="label" for="clientImage">תמונה</label>
                  <div class="file">
                    <input
                      id="clientImage"
                      type="file"
                      accept="image/*"
                      @change="handleClientImageUpload"
                      class="file__input"
                      :disabled="!!clientForm.image"
                    />
                    <label
                      for="clientImage"
                      class="file__btn"
                      :class="{ disabled: clientForm.image }"
                    >
                      <font-awesome-icon :icon="['fas', 'upload']" />
                      <span>{{
                        clientForm.image ? "נבחרה תמונה" : "בחר תמונה"
                      }}</span>
                    </label>
                  </div>
                </div>

                <!-- שם פרטי/משפחה (גריד רספונסיבי) -->
                <div
                  v-if="
                    !isGoogleUser || !googleUserData || !googleUserData.name
                  "
                  class="grid2"
                >
                  <div class="field">
                    <label class="label" for="clientFirstName">שם פרטי</label>
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
                  <div class="field">
                    <label class="label" for="clientLastName">שם משפחה</label>
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
                  class="field"
                >
                  <label class="label" for="clientEmail">מייל</label>
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

                <div v-if="!isGoogleUser" class="field">
                  <label class="label" for="clientPassword">סיסמה</label>
                  <div class="input-with-icon">
                    <input
                      id="clientPassword"
                      v-model="clientForm.password"
                      :type="clientShowPassword ? 'text' : 'password'"
                      placeholder="הכנס סיסמה"
                      required
                    />
                    <button
                      type="button"
                      class="icon"
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

                <div class="field">
                  <label class="label" for="clientPhone">פלאפון</label>
                  <input
                    id="clientPhone"
                    v-model="clientForm.phone"
                    type="tel"
                    placeholder="הכנס מספר טלפון"
                    required
                  />
                </div>

                <div class="field">
                  <label class="label" for="clientAddress">עיר</label>
                  <AddressAutocomplete
                    v-model="clientForm.city"
                    @update:modelValue="clientForm.address = $event"
                    input-id="clientAddress"
                    placeholder="בחר עיר"
                    :required="true"
                  />
                </div>

                <div class="field">
                  <label class="label" for="clientHowDidYouHear"
                    >איך הגעת אלינו? (רשות)</label
                  >
                  <input
                    id="clientHowDidYouHear"
                    v-model="clientForm.howDidYouHear"
                    type="text"
                    placeholder="אינסטגרם / חבר / מודעה..."
                  />
                </div>

                <button
                  type="submit"
                  class="btn btn--primary"
                  :disabled="isSubmitting"
                >
                  {{ isSubmitting ? "שולח..." : "הרשמה" }}
                </button>
              </form>

              <div v-if="!isGoogleUser" class="divider"><span>או</span></div>

              <div v-if="!isGoogleUser" class="social">
                <button
                  class="btn btn--social"
                  type="button"
                  @click="ConenectWithGoogle"
                >
                  <img src="@/assets/Google.png" alt="Google" />
                  הרשם עם Google
                </button>
                <button
                  class="btn btn--social"
                  type="button"
                  @click="ConenectWithFacebook"
                >
                  <img src="@/assets/FaceBook.png" alt="Facebook" />
                  הרשם עם Facebook
                </button>
              </div>
            </div>
          </Transition>

          <!-- Handyman -->
          <Transition name="tab-fade" mode="out-in">
            <div
              v-if="activeTab === 'handyman'"
              key="handyman"
              class="tab-body"
            >
              <div class="notice notice--info">
                <font-awesome-icon :icon="['fas', 'info-circle']" />
                <div class="notice__text">
                  <div class="notice__title">
                    <template v-if="handymenCount < 100">
                      100 נרשמים ראשונים חינם
                    </template>
                    <template v-else> הרשמה להנדימן 49.90 ₪ </template>
                  </div>
                  <div class="notice__sub">
                    <template v-if="handymenCount < 100">
                      עד כה נרשמו {{ handymenCount }}\100
                    </template>
                    <template v-else>
                      אחרי זה תוכל לקבל עבודות דרך האפליקקה
                    </template>
                  </div>
                </div>
              </div>

              <form @submit.prevent="handleHandymanRegister" class="form">
                <div class="profile-top">
                  <div
                    v-if="
                      isGoogleUser && googleUserData && googleUserData.picture
                    "
                    class="avatar"
                  >
                    <img
                      :src="googleUserData.picture"
                      alt="Google Profile"
                      crossorigin="anonymous"
                      referrerpolicy="no-referrer"
                      @error="handleImageError"
                      @load="handleImageLoad"
                    />
                  </div>

                  <div
                    v-else-if="
                      isFacebookUser &&
                      facebookUserData &&
                      facebookUserData.picture
                    "
                    class="avatar"
                  >
                    <img
                      :src="facebookUserData.picture"
                      alt="Facebook Profile"
                      crossorigin="anonymous"
                      referrerpolicy="no-referrer"
                      @error="handleImageError"
                      @load="handleImageLoad"
                    />
                  </div>

                  <div v-else-if="handymanForm.image" class="avatar">
                    <img :src="handymanForm.imagePreview" alt="Preview" />
                  </div>

                  <div v-else-if="handymanForm.imageUrl" class="avatar">
                    <img :src="handymanForm.imageUrl" alt="Profile" />
                  </div>

                  <div v-else class="avatar avatar--empty">
                    <span>🧰</span>
                  </div>
                </div>
                (!isGoogleUser || !googleUserData || !googleUserData.picture) &&
                (!isFacebookUser || !facebookUserData ||
                !facebookUserData.picture)
                <div
                  v-if="
                    !isGoogleUser || !googleUserData || !googleUserData.picture
                  "
                  class="field"
                >
                  <label class="label" for="handymanImage">תמונה</label>
                  <div class="file">
                    <input
                      id="handymanImage"
                      type="file"
                      accept="image/*"
                      @change="handleHandymanImageUpload"
                      class="file__input"
                      :disabled="!!handymanForm.image"
                    />
                    <label
                      for="handymanImage"
                      class="file__btn"
                      :class="{ disabled: handymanForm.image }"
                    >
                      <font-awesome-icon :icon="['fas', 'upload']" />
                      <span>{{
                        handymanForm.image ? "נבחרה תמונה" : "בחר תמונה"
                      }}</span>
                    </label>
                  </div>
                </div>

                <div
                  v-if="
                    !isGoogleUser || !googleUserData || !googleUserData.name
                  "
                  class="grid2"
                >
                  <div class="field">
                    <label class="label" for="handymanFirstName">שם פרטי</label>
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
                  <div class="field">
                    <label class="label" for="handymanLastName">שם משפחה</label>
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
                  class="field"
                >
                  <label class="label" for="handymanEmail">מייל</label>
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

                <div v-if="!isGoogleUser" class="field">
                  <label class="label" for="handymanPassword">סיסמה</label>
                  <div class="input-with-icon">
                    <input
                      id="handymanPassword"
                      v-model="handymanForm.password"
                      :type="handymanShowPassword ? 'text' : 'password'"
                      placeholder="הכנס סיסמה"
                      required
                    />
                    <button
                      type="button"
                      class="icon"
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

                <div class="field">
                  <label class="label" for="handymanPhone">פלאפון</label>
                  <input
                    id="handymanPhone"
                    v-model="handymanForm.phone"
                    type="tel"
                    placeholder="הכנס מספר טלפון"
                    required
                  />
                </div>

                <div class="field">
                  <label class="label" for="handymanAddress">עיר</label>
                  <AddressAutocomplete
                    v-model="handymanForm.city"
                    @update:englishName="handymanForm.addressEnglish = $event"
                    @update:modelValue="handymanForm.address = $event"
                    input-id="handymanAddress"
                    placeholder="בחר עיר"
                    :required="true"
                  />
                </div>

                <div class="field">
                  <label class="label" for="handymanHowDidYouHear"
                    >איך הגעת אלינו? (רשות)</label
                  >
                  <input
                    id="handymanHowDidYouHear"
                    v-model="handymanForm.howDidYouHear"
                    type="text"
                    placeholder="אינסטגרם / חבר / מודעה..."
                  />
                </div>

                <div class="field">
                  <CategoryCheckboxSelector
                    v-model="handymanForm.specialties"
                    label="תחומי התמחות"
                  />
                </div>
                <div class="field">
                  <label class="label" for="handymanLogo">לוגו (רשות)</label>
                  <div class="file">
                    <input
                      id="handymanLogo"
                      type="file"
                      accept="image/*"
                      @change="handleHandymanLogoUpload"
                      class="file__input"
                      :disabled="!!handymanForm.logo"
                    />
                    <label
                      for="handymanLogo"
                      class="file__btn"
                      :class="{ disabled: handymanForm.logo }"
                    >
                      <font-awesome-icon :icon="['fas', 'upload']" />
                      <span>{{
                        handymanForm.logo ? "נבחר לוגו" : "בחר לוגו"
                      }}</span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  class="btn btn--primary"
                  :disabled="isSubmitting"
                >
                  {{
                    isSubmitting
                      ? "שולח..."
                      : handymenCount >= 100
                      ? "המשך לתשלום"
                      : "הרשמה"
                  }}
                </button>
              </form>

              <div class="divider"><span>או</span></div>

              <div class="social">
                <button
                  class="btn btn--social"
                  type="button"
                  @click="ConenectWithGoogle"
                >
                  <img src="@/assets/Google.png" alt="Google" />
                  הרשם עם Google
                </button>
              </div>
            </div>
          </Transition>

          <p class="login-link">
            כבר יש לך חשבון?
            <router-link :to="{ name: 'logIn' }">התחבר כאן</router-link>
          </p>
        </section>
      </main>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { useToast } from "@/composables/useToast";
import { URL } from "@/Url/url";
import AddressAutocomplete from "@/components/Global/AddressAutocomplete.vue";
import CategoryCheckboxSelector from "@/components/Global/CategoryCheckboxSelector.vue";
export default {
  name: "RegisterView",
  components: {
    AddressAutocomplete,
    CategoryCheckboxSelector,
  },
  data() {
    return {
      activeTab: "client",
      clientShowPassword: false,
      handymanShowPassword: false,
      toast: null,
      isGoogleUser: false,
      googleUserData: null,
      isFacebookUser: false,
      facebookUserData: null,
      isSubmitting: false,
      handymenCount: 0,
      isBlocked: false,
      clientForm: {
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        phone: "",
        city: "",
        address: "",
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
      },
    };
  },
  computed: {
    isDevelopment() {
      return process.env.NODE_ENV === "development";
    },
  },
  created() {
    this.toast = useToast();
    this.handleGoogleCallback();
    this.handleFacebookCallback();
    this.fetchHandymenCount();
  },
  watch: {
    "$route.query": {
      handler() {
        if (this.toast) this.handleGoogleCallback();
        if (this.toast) this.handleFacebookCallback();
      },
      immediate: true,
    },
  },
  methods: {
    handleImageError(event) {
      if (event.target.crossOrigin === "anonymous") {
        const imageUrl = event.target.src;
        event.target.crossOrigin = null;
        event.target.src = "";
        setTimeout(() => {
          event.target.src = imageUrl;
        }, 100);
      }
    },
    handleImageLoad() {},

    async handleGoogleCallback() {
      if (!this.toast) this.toast = useToast();

      const googleAuth =
        this.$route.query.googleAuth ||
        new URLSearchParams(window.location.search).get("googleAuth");

      if (googleAuth === "success") {
        const userData =
          this.$route.query.user ||
          new URLSearchParams(window.location.search).get("user");

        const tab =
          this.$route.query.tab ||
          new URLSearchParams(window.location.search).get("tab") ||
          "client";

        if (tab === "client" || tab === "handyman") this.activeTab = tab;

        if (userData) {
          try {
            const user = JSON.parse(decodeURIComponent(userData));
            this.googleUserData = user;
            this.isGoogleUser = true;
            this.isFacebookUser = false;
            this.facebookUserData = null;

            const targetForm =
              this.activeTab === "handyman"
                ? this.handymanForm
                : this.clientForm;

            if (user.name) {
              const nameParts = user.name.split(" ");
              targetForm.firstName = nameParts[0] || "";
              targetForm.lastName = nameParts.slice(1).join(" ") || "";
            }
            if (user.email) targetForm.email = user.email;

            // העלה את התמונה מ-Google ל-S3
            if (user.picture) {
              try {
                const { data } = await axios.post(
                  `${URL}/upload-image-from-url`,
                  {
                    imageUrl: user.picture,
                  }
                );
                if (data.imageUrl) {
                  targetForm.imageUrl = data.imageUrl;
                } else {
                  // Fallback: use original URL if upload fails
                  targetForm.imageUrl = user.picture;
                }
              } catch (error) {
                // Fallback: use original URL if upload fails
                targetForm.imageUrl = user.picture;
              }
            }

            if (user.googleId || user._id) {
              targetForm.password = user.googleId || user._id.toString();
            }

            this.googleUserData = {
              ...user,
              firstName: targetForm.firstName,
              lastName: targetForm.lastName,
              email: targetForm.email,
              picture: targetForm.imageUrl,
            };

            this.toast.showSuccess("התחברות עם Google בוצעה בהצלחה!");

            this.$router.replace({
              path: this.$route.path,
              query: {},
            });
          } catch (error) {
            this.toast.showError("לא הצלחנו לעבד את נתוני המשתמש");
          }
        }
      }
    },

    async handleFacebookCallback() {
      if (!this.toast) this.toast = useToast();

      const facebookAuth =
        this.$route.query.facebookAuth ||
        new URLSearchParams(window.location.search).get("facebookAuth");

      if (facebookAuth === "success") {
        const userData =
          this.$route.query.user ||
          new URLSearchParams(window.location.search).get("user");

        const tab =
          this.$route.query.tab ||
          new URLSearchParams(window.location.search).get("tab") ||
          "client";

        if (tab === "client" || tab === "handyman") this.activeTab = tab;

        if (userData) {
          try {
            const user = JSON.parse(decodeURIComponent(userData));
            this.facebookUserData = user;
            this.isFacebookUser = true;
            this.isGoogleUser = false;
            this.googleUserData = null;

            const targetForm =
              this.activeTab === "handyman"
                ? this.handymanForm
                : this.clientForm;

            if (user.firstName && !targetForm.firstName)
              targetForm.firstName = user.firstName;
            if (user.lastName && !targetForm.lastName)
              targetForm.lastName = user.lastName;

            if (!targetForm.firstName && user.name) {
              const nameParts = user.name.split(" ");
              targetForm.firstName = nameParts[0] || "";
              targetForm.lastName = nameParts.slice(1).join(" ") || "";
            }

            if (user.email && !targetForm.email) targetForm.email = user.email;

            // Location may not be provided by Facebook for all apps/users
            const fbLocation = user.location || user.city || "";
            if (fbLocation && !targetForm.city) targetForm.city = fbLocation;
            if (fbLocation && !targetForm.address)
              targetForm.address = fbLocation;

            // העלה את התמונה מ-Facebook ל-S3
            if (user.picture) {
              try {
                const { data } = await axios.post(
                  `${URL}/upload-image-from-url`,
                  {
                    imageUrl: user.picture,
                  }
                );
                if (data.imageUrl) {
                  targetForm.imageUrl = data.imageUrl;
                } else {
                  targetForm.imageUrl = user.picture;
                }
              } catch (error) {
                targetForm.imageUrl = user.picture;
              }
            }

            const fbId = user.facebookId || user.id;
            if (fbId) {
              if (!targetForm.password) targetForm.password = fbId;
            }

            this.facebookUserData = {
              ...user,
              firstName: targetForm.firstName,
              lastName: targetForm.lastName,
              email: targetForm.email,
              picture: targetForm.imageUrl || user.picture,
              facebookId: fbId,
              location: targetForm.city || fbLocation,
            };

            const missingFields = [];
            if (!targetForm.firstName) missingFields.push("שם פרטי");
            if (!targetForm.lastName) missingFields.push("שם משפחה");
            if (!targetForm.email) missingFields.push("מייל");
            if (!targetForm.city) missingFields.push("עיר / מקום מגורים");

            this.toast.showSuccess("התחברות עם Facebook בוצעה בהצלחה!");
            if (missingFields.length) {
              this.toast.showError(
                `חסרים פרטים להשלמת הרשמה: ${missingFields.join(", ")}`
              );
            }

            this.$router.replace({
              path: this.$route.path,
              query: {},
            });
          } catch (error) {
            this.toast.showError("לא הצלחנו לעבד את נתוני המשתמש");
          }
        }
      }
    },

    async handleClientImageUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      this.clientForm.image = file;
      const reader = new FileReader();
      reader.onload = (e) => (this.clientForm.imagePreview = e.target.result);
      reader.readAsDataURL(file);

      try {
        const formData = new FormData();
        formData.append("image", file);

        const { data } = await axios.post(`${URL}/upload-image`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        this.clientForm.imageUrl = data.imageUrl;
      } catch (error) {
        const msg =
          error.response?.data?.message ||
          (error.response?.status === 403
            ? "אין הרשאה להעלות תמונות. אנא בדוק הרשאות AWS."
            : error.response?.status === 404
            ? "שרת לא זמין. אנא ודא שהשרת רץ"
            : "שגיאה בהעלאת התמונה");
        this.toast?.showError(msg);
      }
    },

    async handleHandymanImageUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      this.handymanForm.image = file;
      const reader = new FileReader();
      reader.onload = (e) => (this.handymanForm.imagePreview = e.target.result);
      reader.readAsDataURL(file);

      try {
        const formData = new FormData();
        formData.append("image", file);

        const { data } = await axios.post(`${URL}/upload-image`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        this.handymanForm.imageUrl = data.imageUrl;
      } catch (error) {
        const msg =
          error.response?.data?.message ||
          (error.response?.status === 403
            ? "אין הרשאה להעלות תמונות. אנא בדוק הרשאות AWS."
            : error.response?.status === 404
            ? "שרת לא זמין. אנא ודא שהשרת רץ"
            : "שגיאה בהעלאת התמונה");
        this.toast?.showError(msg);
      }
    },

    async handleHandymanLogoUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      this.handymanForm.logo = file;
      const reader = new FileReader();
      reader.onload = (e) => (this.handymanForm.logoPreview = e.target.result);
      reader.readAsDataURL(file);

      try {
        const formData = new FormData();
        formData.append("image", file);

        const { data } = await axios.post(`${URL}/upload-logo`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        this.handymanForm.logoUrl = data.imageUrl;
      } catch (error) {
        const msg =
          error.response?.data?.message ||
          (error.response?.status === 403
            ? "אין הרשאה להעלות תמונות. אנא בדוק הרשאות AWS."
            : error.response?.status === 404
            ? "שרת לא זמין. אנא ודא שהשרת רץ"
            : "שגיאה בהעלאת הלוגו");
        this.toast?.showError(msg);
      }
    },

    async handleClientRegister() {
      if (this.isSubmitting) return;

      try {
        this.isSubmitting = true;
        let formData = { ...this.clientForm };

        if (this.isGoogleUser && this.googleUserData) {
          if (this.googleUserData.firstName && !formData.firstName)
            formData.firstName = this.googleUserData.firstName;
          if (this.googleUserData.lastName && !formData.lastName)
            formData.lastName = this.googleUserData.lastName;
          if (this.googleUserData.email && !formData.email)
            formData.email = this.googleUserData.email;
          if (this.googleUserData.picture && !formData.imageUrl)
            formData.imageUrl = this.googleUserData.picture;
          if (this.googleUserData.googleId) {
            if (!formData.password)
              formData.password = this.googleUserData.googleId;
            // שלח את ה-googleId כפרמטר נפרד
            formData.googleId = this.googleUserData.googleId;
          }
        }

        if (this.isFacebookUser && this.facebookUserData) {
          if (this.facebookUserData.firstName && !formData.firstName)
            formData.firstName = this.facebookUserData.firstName;
          if (this.facebookUserData.lastName && !formData.lastName)
            formData.lastName = this.facebookUserData.lastName;
          if (this.facebookUserData.email && !formData.email)
            formData.email = this.facebookUserData.email;
          if (this.facebookUserData.picture && !formData.imageUrl)
            formData.imageUrl = this.facebookUserData.picture;
          const fbId =
            this.facebookUserData.facebookId || this.facebookUserData.id;
          if (fbId) {
            if (!formData.password) formData.password = fbId;
            formData.facebookId = fbId;
          }
          const fbLocation =
            this.facebookUserData.location || this.facebookUserData.city;
          if (fbLocation && !formData.city) formData.city = fbLocation;
          if (fbLocation && !formData.address) formData.address = fbLocation;
        }

        if (formData.image && !formData.imageUrl) {
          const upload = new FormData();
          upload.append("image", formData.image);
          const { data } = await axios.post(`${URL}/upload-image`, upload, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          formData.imageUrl = data.imageUrl;
        }

        delete formData.image;
        delete formData.imagePreview;

        const { data } = await axios.post(
          `${URL}/register-handyman`,
          formData,
          {
            timeout: 30000, // 30 seconds timeout
          }
        );
        if (data === true || (data && data.success !== false)) {
          this.toast.showSuccess("הרשמה בוצעה בהצלחה!");
          if (data?.user?._id) {
            this.$router.push({
              name: "Dashboard",
              params: { id: data.user._id },
            });
          } else {
            this.$router.push({ name: "logIn" });
          }
        } else {
          this.toast.showError(data?.message || "לא הצלחנו להרשם");
        }
      } catch (error) {
        // בדיקה אם המשתמש חסום
        if (
          error.response?.status === 403 &&
          error.response?.data?.message === "Blocked"
        ) {
          this.isBlocked = true;
          return;
        }
        // טיפול בשגיאות שונות - הודעות שגיאה יוצגו למשך 6 שניות
        if (
          error.code === "ECONNABORTED" ||
          error.message?.includes("timeout")
        ) {
          this.toast.showError("הזמן הקצוב להרשמה פג. אנא נסה שוב.", 6000);
        } else if (error.response?.data?.message) {
          // הודעת שגיאה מהשרת
          this.toast.showError(error.response.data.message, 6000);
        } else if (error.response?.status === 400) {
          this.toast.showError(
            "הנתונים שהוזנו לא תקינים. אנא בדוק ונסה שוב.",
            6000
          );
        } else if (error.response?.status === 500) {
          this.toast.showError("יש בעיה בשרת. אנא נסה שוב מאוחר יותר.", 6000);
        } else if (error.message) {
          this.toast.showError(`לא הצלחנו להרשם: ${error.message}`, 6000);
        } else {
          this.toast.showError("לא הצלחנו להרשם. אנא נסה שוב.", 6000);
        }
      } finally {
        this.isSubmitting = false;
      }
    },

    async handleHandymanRegister() {
      if (this.isSubmitting) return;

      try {
        this.isSubmitting = true;
        let formData = { ...this.handymanForm };

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
              this.handymanForm.addressEnglish = foundCity.english_name;
            }
          } catch (e) {}
        }

        if (this.isGoogleUser && this.googleUserData) {
          if (this.googleUserData.firstName && !formData.firstName)
            formData.firstName = this.googleUserData.firstName;
          if (this.googleUserData.lastName && !formData.lastName)
            formData.lastName = this.googleUserData.lastName;
          if (this.googleUserData.email && !formData.email)
            formData.email = this.googleUserData.email;
          if (this.googleUserData.picture && !formData.imageUrl)
            formData.imageUrl = this.googleUserData.picture;
          if (this.googleUserData.googleId) {
            if (!formData.password)
              formData.password = this.googleUserData.googleId;
            // שלח את ה-googleId כפרמטר נפרד
            formData.googleId = this.googleUserData.googleId;
          }
        }

        if (this.isFacebookUser && this.facebookUserData) {
          if (this.facebookUserData.firstName && !formData.firstName)
            formData.firstName = this.facebookUserData.firstName;
          if (this.facebookUserData.lastName && !formData.lastName)
            formData.lastName = this.facebookUserData.lastName;
          if (this.facebookUserData.email && !formData.email)
            formData.email = this.facebookUserData.email;
          if (this.facebookUserData.picture && !formData.imageUrl)
            formData.imageUrl = this.facebookUserData.picture;
          const fbId =
            this.facebookUserData.facebookId || this.facebookUserData.id;
          if (fbId) {
            if (!formData.password) formData.password = fbId;
            formData.facebookId = fbId;
          }
          const fbLocation =
            this.facebookUserData.location || this.facebookUserData.city;
          if (fbLocation && !formData.city) formData.city = fbLocation;
          if (fbLocation && !formData.address) formData.address = fbLocation;
        }

        if (formData.image && !formData.imageUrl) {
          const upload = new FormData();
          upload.append("image", formData.image);
          const { data } = await axios.post(`${URL}/upload-image`, upload, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          formData.imageUrl = data.imageUrl;
        }

        if (formData.logo && !formData.logoUrl) {
          const upload = new FormData();
          upload.append("image", formData.logo);
          const { data } = await axios.post(`${URL}/upload-logo`, upload, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          formData.logoUrl = data.imageUrl;
        }

        delete formData.image;
        delete formData.logo;
        delete formData.imagePreview;
        delete formData.logoPreview;

        if (formData.isHandyman) {
          if (formData.specialties && Array.isArray(formData.specialties)) {
            // Filter and format specialties - only full categories
            formData.specialties = formData.specialties
              .filter(
                (item) =>
                  item &&
                  item.name &&
                  (item.isFullCategory === true || item.type === "category")
              )
              .map((item) => ({
                name: item.name,
                category: "",
                price: null,
                typeWork: null,
                isFullCategory: true,
                type: "category",
              }));

            // Also create fullCategories array for easier querying
            formData.fullCategories = formData.specialties.map(
              (item) => item.name
            );
          } else {
            formData.specialties = [];
            formData.fullCategories = [];
          }
        }

        // אם יש יותר מ-100 הנדימנים, שמור את הנתונים ב-localStorage והעבר לתשלום
        if (this.handymenCount >= 100) {
          // שמור את נתוני ההרשמה ב-localStorage
          const registrationData = {
            ...formData,
            timestamp: Date.now(),
          };
          localStorage.setItem(
            "pendingHandymanRegistration",
            JSON.stringify(registrationData)
          );

          // העבר לדף תשלום
          this.$router.push({
            name: "Payments",
            params: { id: "pending" },
            query: {
              subscription: "true",
              type: "handyman-registration",
            },
          });
          return;
        }

        // אם פחות מ-100, המשך עם הרשמה רגילה
        const { data } = await axios.post(
          `${URL}/register-handyman`,
          formData,
          {
            headers: { "Content-Type": "application/json" },
            timeout: 30000, // 30 seconds timeout
          }
        );

        if (data === true || (data && data.success !== false)) {
          this.toast.showSuccess("הרשמה בוצעה בהצלחה!");
          if (data?.user?._id) {
            this.$router.push({
              name: "Dashboard",
              params: { id: data.user._id },
            });
          } else {
            this.$router.push({ name: "logIn" });
          }
        } else {
          this.toast.showError(data?.message || "לא הצלחנו להרשם");
        }
      } catch (error) {
        // בדיקה אם המשתמש חסום
        if (
          error.response?.status === 403 &&
          error.response?.data?.message === "Blocked"
        ) {
          this.isBlocked = true;
          return;
        }
        // טיפול בשגיאות שונות - הודעות שגיאה יוצגו למשך 6 שניות
        if (
          error.code === "ECONNABORTED" ||
          error.message?.includes("timeout")
        ) {
          this.toast.showError("הזמן הקצוב להרשמה פג. אנא נסה שוב.", 6000);
        } else if (error.response?.data?.message) {
          // הודעת שגיאה מהשרת
          this.toast.showError(error.response.data.message, 6000);
        } else if (error.response?.status === 400) {
          this.toast.showError(
            "הנתונים שהוזנו לא תקינים. אנא בדוק ונסה שוב.",
            6000
          );
        } else if (error.response?.status === 500) {
          this.toast.showError("יש בעיה בשרת. אנא נסה שוב מאוחר יותר.", 6000);
        } else if (error.message) {
          this.toast.showError(`לא הצלחנו להרשם: ${error.message}`, 6000);
        } else {
          this.toast.showError("לא הצלחנו להרשם. אנא נסה שוב.", 6000);
        }
      } finally {
        this.isSubmitting = false;
      }
    },

    ConenectWithGoogle() {
      window.location.href = `${URL}/auth/google?source=register&tab=${this.activeTab}`;
    },

    ConenectWithFacebook() {
      window.location.href = `${URL}/auth/facebook?source=register&tab=${this.activeTab}`;
    },

    async fetchHandymenCount() {
      try {
        const { data } = await axios.get(`${URL}/handymen-count`);
        if (data && data.success) {
          this.handymenCount = data.count || 0;
        }
      } catch (error) {
        // Silently fail - default to showing paid registration message
        this.handymenCount = 100;
      }
    },
    fillDemoData() {
      // Generate random suffix for unique emails
      const randomSuffix = Math.floor(Math.random() * 10000);

      if (this.activeTab === "client") {
        // Fill client form with demo data
        this.clientForm.firstName = "יוסי";
        this.clientForm.lastName = "כהן";
        this.clientForm.email = `demo.client.${randomSuffix}@example.com`;
        this.clientForm.password = "demo123456";
        this.clientForm.phone = "0501234567";
        this.clientForm.city = "תל אביב";
        this.clientForm.address = "תל אביב";
        this.clientForm.howDidYouHear = "חבר המליץ";
        this.toast?.showSuccess("פרטי דמו מולאו לטופס לקוח");
      } else {
        // Fill handyman form with demo data
        this.handymanForm.firstName = "דוד";
        this.handymanForm.lastName = "לוי";
        this.handymanForm.email = `demo.handyman.${randomSuffix}@example.com`;
        this.handymanForm.password = "demo123456";
        this.handymanForm.phone = "0507654321";
        this.handymanForm.city = "ירושלים";
        this.handymanForm.address = "ירושלים";
        this.handymanForm.addressEnglish = "Jerusalem";
        this.handymanForm.howDidYouHear = "אינסטגרם";
        // Add some demo specialties
        this.handymanForm.specialties = [
          { name: "אינסטלציה", isFullCategory: true, type: "category" },
          { name: "חשמל", isFullCategory: true, type: "category" },
        ];
        this.toast?.showSuccess("פרטי דמו מולאו לטופס הנדימן");
      }
    },
  },
};
</script>

<style scoped lang="scss">
/* Mobile-first: בלי “כרטיס צר” */
.register-page {
  min-height: 100vh;
  position: relative;
  padding: 14px;
  font-family: "Heebo", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    Arial, sans-serif;
  overflow: hidden;
}

.register-page__bg-video,
.register-page__bg-image {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -1;
  pointer-events: none;
}

.register-page__bg-image {
  background-image: url("~@/../public/img/backgroundApp.webp");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  filter: brightness(0.5);
}

.register-page__bg-image::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1;
}

.register-page__bg-video {
  filter: brightness(0.5);
}

.register-shell {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
  align-items: start;
}

.register-sidebar {
  display: none;
}

.register-main {
  display: flex;
  justify-content: center;
}

/* הכרטיס עכשיו רחב במובייל */
.register-card {
  width: 100%;
  max-width: 560px; /* במקום 420 */
  background: rgba(15, 16, 22, 0.92);
  border: 1px solid rgba(255, 106, 0, 0.35);
  border-radius: 18px;
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.55);
  padding: 16px;
  overflow: hidden;
}

.mobile-brand {
  display: flex;
  gap: 12px;
  align-items: center;
  padding-bottom: 12px;
  margin-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.logo-circle {
  width: 44px;
  height: 44px;
  border-radius: 999px;
  background: linear-gradient(135deg, #ff6a00, #ff8a2b);
  display: grid;
  place-items: center;
  color: #0b0b0f;
  font-weight: 1000;
}

.mobile-brand__title {
  color: rgba(255, 255, 255, 0.92);
  font-weight: 1000;
  font-size: 16px;
}
.mobile-brand__subtitle {
  margin-top: 2px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 800;
  font-size: 12px;
}

.tabs {
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  width: 100%;
  gap: 8px;
  padding: 8px;
  margin: -12px -12px 16px -12px;
  background: linear-gradient(135deg, #1a1a1a, #0f0f0f);
  border-radius: 16px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08),
    0 10px 30px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 106, 0, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.tab {
  position: relative;
  flex: 1;
  border: none;
  background: transparent;
  padding: 14px 20px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
  color: #a0a0a0;
  letter-spacing: 0.5px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      135deg,
      rgba(255, 159, 28, 0.1),
      rgba(255, 106, 0, 0.05)
    );
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 0;
  }

  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%) scaleX(0);
    width: 80%;
    height: 2px;
    background: linear-gradient(90deg, transparent, #ff9f1c, transparent);
    transition: transform 0.3s ease;
    z-index: 1;
  }

  &:hover {
    color: #ff9f1c;
    background: rgba(255, 159, 28, 0.12);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 159, 28, 0.2);

    &::before {
      opacity: 1;
    }

    &::after {
      transform: translateX(-50%) scaleX(1);
    }
  }

  &.active {
    color: #0f0f0f;
    background: linear-gradient(135deg, #ff9f1c, #ff6a00);
    box-shadow: 0 8px 24px rgba(255, 122, 0, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.3), 0 0 20px rgba(255, 159, 28, 0.3);
    transform: translateY(-2px);
    font-weight: 900;

    &::before {
      opacity: 0;
    }

    &::after {
      display: none;
    }
  }

  &:active {
    transform: translateY(0);
  }

  &.active:active {
    transform: translateY(-1px);
  }
}

.tab--demo {
  flex: 0 0 auto;
  min-width: 60px;
  padding: 14px 12px;
  font-size: 14px;
  background: rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(139, 92, 246, 0.3);
  color: #8b5cf6;

  &:hover {
    background: rgba(139, 92, 246, 0.25);
    border-color: rgba(139, 92, 246, 0.5);
    color: #a78bfa;
  }

  &:active {
    transform: scale(0.95);
  }
}

.notice {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  border-radius: 14px;
  margin: 10px 0 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.05);
}
.notice--ok {
  border-color: rgba(34, 197, 94, 0.35);
  background: rgba(34, 197, 94, 0.08);
}
.notice--info {
  border-color: rgba(255, 106, 0, 0.28);
  background: rgba(255, 106, 0, 0.08);
}
.notice__title {
  font-weight: 1000;
  color: rgba(255, 255, 255, 0.92);
  font-size: 14px;
}
.notice__sub {
  margin-top: 2px;
  color: rgba(255, 255, 255, 0.62);
  font-weight: 800;
  font-size: 12px;
}

.tab-body {
  padding-top: 4px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.profile-top {
  display: flex;
  justify-content: center;
  padding: 6px 0 2px;
}

.avatar {
  width: 92px;
  height: 92px;
  border-radius: 999px;
  border: 2px solid rgba(255, 106, 0, 0.55);
  overflow: hidden;
  box-shadow: 0 10px 26px rgba(255, 106, 0, 0.22);
  background: rgba(255, 255, 255, 0.06);
  display: grid;
  place-items: center;
}
.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.avatar--empty {
  border-style: dashed;
  color: rgba(255, 255, 255, 0.7);
  font-size: 22px;
}

.grid2 {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.label {
  color: rgba(255, 106, 0, 0.95);
  font-weight: 900;
  font-size: 12px;
}

input {
  height: 46px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.92);
  padding: 0 14px;
  font-weight: 800;
  outline: none;
  width: 100%;
  box-sizing: border-box;
}
input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}
input:focus {
  border-color: rgba(255, 106, 0, 0.55);
  box-shadow: 0 0 0 3px rgba(255, 106, 0, 0.16);
}

.input-with-icon {
  position: relative;
}
.input-with-icon input {
  padding-left: 44px;
}
.icon {
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.28);
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
}
.icon:active {
  transform: translateY(-50%) scale(0.96);
}

.file {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.file__input {
  display: none;
}
.file__btn {
  height: 46px;
  border-radius: 14px;
  border: 1px dashed rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-weight: 900;
  cursor: pointer;
  transition: 0.2s ease;
}
.file__btn:hover {
  border-color: rgba(255, 106, 0, 0.6);
  color: rgba(255, 106, 0, 0.95);
}
.file__btn.disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.mini-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(255, 106, 0, 0.08);
  border: 1px solid rgba(255, 106, 0, 0.22);
  color: rgba(255, 106, 0, 0.95);
  font-weight: 900;
  font-size: 12px;
}

.btn {
  border: none;
  border-radius: 14px;
  cursor: pointer;
  font-weight: 1000;
  transition: 0.2s ease;
}
.btn:active {
  transform: scale(0.98);
}

.btn--primary {
  height: 48px;
  width: 100%;
  background: linear-gradient(135deg, #ff6a00, #ff8a2b);
  color: #0b0b0f;
  box-shadow: 0 10px 24px rgba(255, 106, 0, 0.22);
}
.btn--primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 14px 0;
  color: rgba(255, 255, 255, 0.55);
  font-weight: 900;
  font-size: 12px;
}
.divider::before,
.divider::after {
  content: "";
  height: 1px;
  flex: 1;
  background: rgba(255, 255, 255, 0.12);
}

.social {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.btn--social {
  height: 48px;
  width: 100%;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.btn--social img {
  width: 22px;
  height: 22px;
  border-radius: 6px;
}

.login-link {
  text-align: center;
  margin-top: 14px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 800;
  font-size: 13px;
}
.login-link a {
  color: rgba(255, 106, 0, 0.95);
  text-decoration: none;
  font-weight: 1000;
}
.login-link a:hover {
  text-decoration: underline;
}

/* Anim */
.register-card .tab-fade-enter-active {
  transition: all 0.25s ease;
}
.register-card .tab-fade-leave-active {
  transition: all 0.18s ease;
}
.register-card .tab-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.register-card .tab-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* Desktop */
@media (min-width: 1024px) {
  .register-page {
    padding: 22px;
  }

  .register-shell {
    grid-template-columns: 1fr 1.2fr;
    gap: 26px;
  }

  .register-sidebar {
    display: block;
    position: sticky;
    top: 22px;
    align-self: start;
    background: rgba(15, 16, 22, 0.55);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 18px;
    padding: 22px;
  }

  .sidebar-content {
    max-width: 460px;
    margin: 0 auto;
  }

  .logo-circle-large {
    width: 84px;
    height: 84px;
    border-radius: 999px;
    background: linear-gradient(135deg, #ff6a00, #ff8a2b);
    display: grid;
    place-items: center;
    color: #0b0b0f;
    font-weight: 1000;
    font-size: 40px;
    margin: 0 auto 18px;
    box-shadow: 0 12px 30px rgba(255, 106, 0, 0.25);
  }

  .sidebar-title {
    text-align: center;
    color: rgba(255, 106, 0, 0.95);
    font-size: 42px;
    font-weight: 1000;
    margin: 0 0 16px;
  }

  .tagline-box {
    border: 1px solid rgba(255, 106, 0, 0.35);
    border-radius: 18px;
    padding: 18px;
    background: rgba(0, 0, 0, 0.25);
    margin-bottom: 16px;
    text-align: center;
  }

  .tagline-main {
    margin: 0;
    color: rgba(255, 106, 0, 0.95);
    font-weight: 1000;
    font-size: 24px;
  }

  .tagline-sub {
    margin: 6px 0 0;
    color: rgba(255, 255, 255, 0.85);
    font-weight: 900;
    font-size: 18px;
  }

  .features-list {
    display: grid;
    gap: 10px;
  }
  .feature-item {
    display: flex;
    align-items: center;
    gap: 10px;
    color: rgba(255, 255, 255, 0.88);
    font-weight: 900;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    padding: 12px;
  }
  .feature-icon {
    filter: drop-shadow(0 0 10px rgba(255, 106, 0, 0.35));
  }

  .mobile-brand {
    display: none;
  }

  .grid2 {
    grid-template-columns: 1fr 1fr;
  }

  .register-card {
    max-width: 640px;
    padding: 18px 18px 16px;
  }
}

// Desktop category selector - hidden on mobile (up to 400px)
.desktop-category-selector {
  display: block;

  @media (max-width: 400px) {
    display: none;
  }
}

.blocked-message {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(239, 68, 68, 0.15);
  border: 2px solid rgba(239, 68, 68, 0.5);
  color: #ef4444;
  font-weight: 900;
  font-size: 14px;
  margin-bottom: 16px;
  text-align: right;
}

.blocked-message svg {
  font-size: 18px;
  flex-shrink: 0;
}
</style>
