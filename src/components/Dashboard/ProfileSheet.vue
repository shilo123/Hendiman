<template>
  <div class="ps" v-if="visible" dir="rtl">
    <div class="ps__backdrop" @click="$emit('close')" />

    <div
      class="ps__panel"
      :class="{ 'ps__panel--handyman': isHandyman }"
      role="dialog"
      aria-modal="true"
    >
      <!-- Handle (mobile) -->
      <div class="ps__handle" />

      <!-- Top App Bar -->
      <header class="ps__topBar">
        <div class="ps__topBarSpacer"></div>
        <h1 class="ps__topBarTitle">הפרופיל שלי</h1>
        <button
          class="ps__topBarSettings"
          type="button"
          @click="showEditModal = true"
          aria-label="ערוך פרופיל"
        >
          <span class="material-symbols-outlined">settings</span>
        </button>
      </header>

      <!-- Main Content -->
      <main class="ps__main">
        <!-- Profile Header -->
        <section class="ps__profileHeader">
          <div class="ps__avatarWrapper">
            <div class="ps__avatarBorder">
              <div
                class="ps__avatar"
                :style="
                  userImageUrl
                    ? { backgroundImage: `url(${userImageUrl})` }
                    : {}
                "
              >
                <span v-if="!userImageUrl" class="ps__avatarPlaceholder">
                  {{ isHandyman ? '🧰' : '👤' }}
                </span>
              </div>
            </div>
            <!-- Rating badge (handyman only) -->
            <div v-if="isHandyman && userRating > 0" class="ps__ratingBadge">
              <span class="material-symbols-outlined ps__ratingIcon icon-filled">
                star
              </span>
              <span class="ps__ratingValue">{{ userRating.toFixed(1) }}</span>
            </div>
          </div>

          <div class="ps__profileInfo">
            <h2 class="ps__profileName">{{ form.name || user?.username || 'ללא שם' }}</h2>
            <div class="ps__profileBadge">
              <span
                v-if="isHandyman && hasActiveSubscription"
                class="material-symbols-outlined ps__verifiedIcon icon-filled"
              >
                verified
              </span>
              <p class="ps__profileBadgeText">
                {{
                  isHandyman
                    ? hasActiveSubscription
                      ? 'מומחה פרימיום'
                      : 'הנדימן'
                    : 'לקוח רשום'
                }}
              </p>
            </div>
            <p class="ps__profileDate">
              חבר בקהילה מאז {{ formatJoinDate(user?.createdAt) }}
            </p>
          </div>
        </section>

        <!-- Stats Grid -->
        <section class="ps__statsGrid">
          <!-- Handyman Stats -->
          <template v-if="isHandyman">
            <div class="ps__statCard">
              <div class="ps__statIconWrapper">
                <span class="material-symbols-outlined ps__statIcon">
                  engineering
                </span>
              </div>
              <p class="ps__statValue">{{ completedJobs }}</p>
              <p class="ps__statLabel">עבודות שהושלמו</p>
            </div>
            <div class="ps__statCard">
              <div class="ps__statIconWrapper">
                <span class="material-symbols-outlined ps__statIcon">
                  timer
                </span>
              </div>
              <p class="ps__statValue">{{ averageResponseTime || '0 דק׳' }}</p>
              <p class="ps__statLabel">זמן תגובה ממוצע</p>
            </div>
          </template>

          <!-- Client Stats -->
          <template v-else>
            <div class="ps__statCard">
              <div class="ps__statIconWrapper">
                <span class="material-symbols-outlined ps__statIcon">
                  shopping_cart
                </span>
              </div>
              <p class="ps__statValue">{{ totalOrders }}</p>
              <p class="ps__statLabel">סה״כ הזמנות</p>
            </div>
            <div class="ps__statCard">
              <div class="ps__statIconWrapper">
                <span
                  class="material-symbols-outlined ps__statIcon icon-filled"
                >
                  favorite
                </span>
              </div>
              <p class="ps__statValue">{{ favoriteHandymen }}</p>
              <p class="ps__statLabel">בעלי מקצוע מועדפים</p>
            </div>
          </template>
        </section>

        <!-- Specialties Section (handyman only) -->
        <section v-if="isHandyman" class="ps__specialties">
          <div class="ps__specialtiesHeader">
            <h3 class="ps__specialtiesTitle">תחומי התמחות</h3>
            <button
              class="ps__specialtiesEditBtn"
              type="button"
              @click="specOpen = !specOpen"
            >
              <span class="material-symbols-outlined ps__editIcon">edit</span>
              <span>{{ specOpen ? 'הסתר' : 'עריכה' }}</span>
            </button>
          </div>

          <div v-if="form.specialties?.length" class="ps__specialtiesChips">
            <div
              v-for="spec in form.specialties"
              :key="spec.name || spec"
              class="ps__specialtyChip"
            >
              <span class="material-symbols-outlined ps__chipIcon">
                {{ getCategoryIcon(spec) }}
              </span>
              <span class="ps__chipText">{{ spec.name || spec }}</span>
            </div>
          </div>
          <div v-else class="ps__specialtiesEmpty">לא הוגדרו התמחויות</div>

          <div v-if="specOpen" class="ps__specEditor">
            <CategoryCheckboxSelector v-model="form.specialties" />
          </div>
        </section>

        <hr class="ps__divider" />

        <!-- Action Menu Stack -->
        <section class="ps__actionsStack">
          <!-- Subscription (handyman only, highlighted) -->
          <button
            v-if="isHandyman && hasActiveSubscription"
            class="ps__actionBtn ps__actionBtn--subscription"
            type="button"
            @click="goToPaymentSettings"
          >
            <div class="ps__actionBtnLeft">
              <div class="ps__actionIconWrapper ps__actionIconWrapper--primary">
                <span class="material-symbols-outlined icon-filled">diamond</span>
              </div>
              <div class="ps__actionTextGroup">
                <span class="ps__actionTitle">המנוי שלי</span>
                <span class="ps__actionSubtitle">פרופיל מקצוען (בתוקף)</span>
              </div>
            </div>
            <span class="material-symbols-outlined ps__actionChevron ltr:rotate-180">
              chevron_left
            </span>
          </button>

          <!-- Payment Methods -->
          <button
            v-if="isHandyman"
            class="ps__actionBtn"
            type="button"
            @click="handlePaymentClick"
          >
            <div class="ps__actionBtnLeft">
              <div class="ps__actionIconWrapper">
                <span class="material-symbols-outlined">credit_card</span>
              </div>
              <span class="ps__actionTitle">אמצעי תשלום</span>
            </div>
            <span class="material-symbols-outlined ps__actionChevron ltr:rotate-180">
              chevron_left
            </span>
          </button>

          <!-- Active Orders (client) / Work History (handyman) -->
          <button
            class="ps__actionBtn"
            type="button"
            @click="handleHistoryClick"
          >
            <div class="ps__actionBtnLeft">
              <div class="ps__actionIconWrapper">
                <span class="material-symbols-outlined">
                  {{ isHandyman ? 'history' : 'pending_actions' }}
                </span>
              </div>
              <span class="ps__actionTitle">
                {{ isHandyman ? 'היסטוריית עבודות' : 'הזמנות פעילות' }}
              </span>
            </div>
            <span class="material-symbols-outlined ps__actionChevron ltr:rotate-180">
              chevron_left
            </span>
          </button>

          <!-- Address Management (client only) -->
          <button
            v-if="!isHandyman"
            class="ps__actionBtn"
            type="button"
            @click="openCityPicker"
          >
            <div class="ps__actionBtnLeft">
              <div class="ps__actionIconWrapper">
                <span class="material-symbols-outlined">home_pin</span>
              </div>
              <span class="ps__actionTitle">ניהול כתובות</span>
            </div>
            <span class="material-symbols-outlined ps__actionChevron ltr:rotate-180">
              chevron_left
            </span>
          </button>

          <!-- Order History (client only) -->
          <button
            v-if="!isHandyman"
            class="ps__actionBtn"
            type="button"
            @click="handleHistoryClick"
          >
            <div class="ps__actionBtnLeft">
              <div class="ps__actionIconWrapper">
                <span class="material-symbols-outlined">history</span>
              </div>
              <span class="ps__actionTitle">היסטוריית הזמנות</span>
            </div>
            <span class="material-symbols-outlined ps__actionChevron ltr:rotate-180">
              chevron_left
            </span>
          </button>
        </section>

        <!-- Logout -->
        <div class="ps__logoutWrapper">
          <button
            class="ps__logoutBtn"
            type="button"
            @click="handleLogout"
            :disabled="isLoggingOut"
          >
            <span class="material-symbols-outlined ps__logoutIcon">logout</span>
            <span class="ps__logoutText">
              {{ isLoggingOut ? 'מתנתק...' : 'התנתק מהמערכת' }}
            </span>
          </button>
        </div>
      </main>
    </div>

    <!-- Edit Profile Modal -->
    <div
      v-if="showEditModal"
      class="ps__editModal"
      dir="rtl"
      @click.self="showEditModal = false"
    >
      <div class="ps__editModalCard">
        <header class="ps__editModalHeader">
          <h2 class="ps__editModalTitle">ערוך פרופיל</h2>
          <button
            class="ps__editModalClose"
            type="button"
            @click="showEditModal = false"
            aria-label="סגור"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </header>

        <div class="ps__editModalContent">
          <div class="ps__editGrid">
            <label class="ps__editField">
              <span class="ps__editLabel">שם</span>
              <div class="ps__editControl">
                <span class="material-symbols-outlined ps__editIcon">person</span>
                <input
                  v-model="form.name"
                  class="ps__editInput"
                  type="text"
                  inputmode="text"
                  placeholder="השם שלך"
                />
              </div>
            </label>

            <label class="ps__editField">
              <span class="ps__editLabel">טלפון</span>
              <div class="ps__editControl">
                <span class="material-symbols-outlined ps__editIcon">phone</span>
                <input
                  v-model="form.phone"
                  class="ps__editInput"
                  type="tel"
                  inputmode="tel"
                  placeholder="05X-XXXXXXX"
                />
              </div>
            </label>

            <label class="ps__editField ps__editField--wide">
              <span class="ps__editLabel">אימייל</span>
              <div class="ps__editControl">
                <span class="material-symbols-outlined ps__editIcon">email</span>
                <input
                  v-model="form.email"
                  class="ps__editInput"
                  type="email"
                  inputmode="email"
                  placeholder="name@email.com"
                />
              </div>
            </label>

            <div class="ps__editField ps__editField--wide">
              <span class="ps__editLabel">עיר</span>
              <button class="ps__editPicker" type="button" @click="openCityPicker">
                <span class="ps__editPickerLeft">
                  <span class="material-symbols-outlined ps__editPickerIcon">
                    location_on
                  </span>
                  <span class="ps__editPickerValue">
                    {{ cityInput?.trim() ? cityInput : 'בחר עיר' }}
                  </span>
                </span>
                <span class="material-symbols-outlined ps__editPickerChev">expand_more</span>
              </button>
              <span v-if="cityError" class="ps__editError">
                {{ cityError }}
              </span>
            </div>
          </div>
        </div>

        <footer class="ps__editModalFooter">
          <button
            class="ps__editBtn ps__editBtn--ghost"
            type="button"
            @click="showEditModal = false"
          >
            בטל
          </button>
          <button
            class="ps__editBtn ps__editBtn--primary"
            type="button"
            @click="onSave"
          >
            שמור
          </button>
        </footer>
      </div>
    </div>

    <!-- City picker modal -->
    <div
      v-if="cityPickerOpen"
      class="pickerModal"
      @click.self="closeCityPicker"
    >
      <div class="pickerModal__card">
        <div class="pickerModal__head">
          <div class="pickerModal__title">בחר עיר</div>
          <button
            class="ps__iconBtn ps__iconBtn--sm"
            type="button"
            @click="closeCityPicker"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="pickerModal__searchWrap">
          <span class="material-symbols-outlined pickerModal__searchIcon">search</span>
          <input
            v-model="citySearch"
            class="pickerModal__search"
            type="text"
            autocomplete="off"
            placeholder="חפש עיר…"
            @input="onCitySearch"
          />
        </div>

        <div class="pickerModal__list">
          <button
            v-for="c in filteredCities"
            :key="c.name"
            type="button"
            class="pickerModal__item"
            @click="selectCity(c.name)"
          >
            <span class="material-symbols-outlined pickerModal__itemIcon">
              location_on
            </span>
            <span class="pickerModal__itemTxt">{{ c.name }}</span>
            <span class="material-symbols-outlined pickerModal__itemChev">
              chevron_left
            </span>
          </button>

          <div v-if="filteredCities.length === 0" class="pickerModal__empty">
            לא נמצאה עיר
          </div>
        </div>

        <div class="pickerModal__footer">
          <button
            class="btn btn--ghost"
            type="button"
            @click="closeCityPicker"
          >
            סגור
          </button>
        </div>
      </div>
    </div>

    <!-- Cancel Subscription Confirmation Modal -->
    <div
      v-if="showCancelSubscriptionConfirm"
      class="cancelSubscriptionModal"
      dir="rtl"
      @click.self="showCancelSubscriptionConfirm = false"
    >
      <div class="modal">
        <div class="modal__icon">🚫</div>
        <h2 class="modal__title">ביטול מנוי</h2>
        <p class="modal__message">האם אתה בטוח שברצונך לבטל את המנוי?</p>

        <div class="modal__actions">
          <button
            class="modal__btn modal__btn--ghost"
            type="button"
            @click="showCancelSubscriptionConfirm = false"
            :disabled="isCancellingSubscription"
          >
            בטל
          </button>
          <button
            class="modal__btn modal__btn--danger"
            type="button"
            @click="handleCancelSubscription"
            :disabled="isCancellingSubscription"
          >
            {{ isCancellingSubscription ? 'מבטל...' : 'כן, בטל מנוי' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete User Confirmation Modal -->
    <div
      v-if="showDeleteConfirm"
      class="deleteUserModal"
      dir="rtl"
      @click.self="showDeleteConfirm = false"
    >
      <div class="modal modal--warn">
        <div class="modal__icon">⚠️</div>
        <h2 class="modal__title">מחיקת משתמש</h2>
        <p class="modal__message">
          האם אתה בטוח שברצונך למחוק את המשתמש? פעולה זו אינה הפיכה.
        </p>

        <div class="modal__actions">
          <button
            class="modal__btn modal__btn--ghost"
            type="button"
            @click="showDeleteConfirm = false"
          >
            בטל
          </button>
          <button
            class="modal__btn modal__btn--danger"
            type="button"
            @click="handleDeleteUser"
            :disabled="isDeleting"
          >
            {{ isDeleting ? 'מוחק...' : 'כן, מחק' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import cities from '@/APIS/AdressFromIsrael.json';
import CategoryCheckboxSelector from '@/components/Global/CategoryCheckboxSelector.vue';
import axios from 'axios';
import { useToast } from '@/composables/useToast';
import { URL } from '@/Url/url';
import logger from '@/utils/logger';

export default {
  name: 'ProfileSheetV2',
  components: { CategoryCheckboxSelector },
  props: {
    visible: { type: Boolean, default: false },
    user: { type: Object, default: () => ({}) },
    isHandyman: { type: Boolean, default: false },
  },
  emits: ['close', 'save', 'delete-user', 'logout', 'refresh-user'],
  data() {
    return {
      form: this.buildForm(this.user),

      cityInput: this.user?.address || '',
      cityEnglishName: null,
      cityError: '',

      cityPickerOpen: false,
      citySearch: '',
      specOpen: false,
      showEditModal: false,

      showDeleteConfirm: false,
      isDeleting: false,
      isLoggingOut: false,
      showCancelSubscriptionConfirm: false,
      isCancellingSubscription: false,

      onboardingUrl: null,
      isLoadingOnboarding: false,
      hasPaymentAccount: false,
      hasActiveSubscription: false,
      toast: null,

      // Statistics
      handymanStats: {
        completedJobs: 0,
        averageResponseTime: null,
        rating: 0,
      },
      clientStats: {
        totalOrders: 0,
        favoriteHandymen: 0,
      },
    };
  },
  computed: {
    filteredCities() {
      const q = (this.citySearch || '').trim();
      const list = cities.filter((c) => c.name && typeof c.name === 'string');

      if (!q) return list.slice(1, 60);
      return list.filter((c) => c.name.includes(q)).slice(0, 60);
    },
    userImageUrl() {
      return (
        this.user?.imageUrl ||
        this.user?.picture ||
        this.user?.avatarUrl ||
        null
      );
    },
    userRating() {
      return this.user?.rating || this.handymanStats?.rating || 0;
    },
    completedJobs() {
      return this.user?.jobDone || this.handymanStats?.completedJobs || 0;
    },
    averageResponseTime() {
      const time = this.handymanStats?.averageResponseTime;
      if (!time) return null;
      return typeof time === 'number' ? `${time} דק׳` : time;
    },
    totalOrders() {
      return this.user?.Ordered || this.clientStats?.totalOrders || 0;
    },
    favoriteHandymen() {
      return this.clientStats?.favoriteHandymen || 0;
    },
  },
  created() {
    this.toast = useToast();
  },
  watch: {
    user: {
      handler(val) {
        this.form = this.buildForm(val);
        this.cityInput = val?.address || '';

        this.hasActiveSubscription =
          val?.hasActiveSubscription === true ||
          val?.trialExpiresAt === 'always';

        if (val?.address) {
          const foundCity = cities.find((c) => c.name === val.address);
          this.cityEnglishName = foundCity
            ? foundCity.english_name || foundCity.שם_ישוב_לועזי || null
            : null;
        } else {
          this.cityEnglishName = null;
        }
      },
      deep: true,
    },
    visible(v) {
      if (!v) {
        this.cityPickerOpen = false;
        this.citySearch = '';
        this.specOpen = false;
        this.cityError = '';
        this.showEditModal = false;
      } else if (v && this.isHandyman) {
        this.checkOnboardingStatus();
        this.loadHandymanStats();
      } else if (v && !this.isHandyman) {
        this.loadClientStats();
      }
    },
  },
  methods: {
    buildForm(user) {
      return {
        name: user?.username || user?.name || '',
        phone: user?.phone || '',
        email: user?.email || '',
        address: user?.address || '',
        specialties: user?.specialties ? [...user.specialties] : [],
      };
    },

    formatJoinDate(date) {
      if (!date) return 'לא ידוע';
      try {
        const d = new Date(date);
        return d.getFullYear();
      } catch {
        return 'לא ידוע';
      }
    },

    getCategoryIcon(spec) {
      const name = (spec.name || spec || '').toLowerCase();
      if (name.includes('אינסטלציה') || name.includes('plumbing'))
        return 'plumbing';
      if (name.includes('חשמל') || name.includes('electric'))
        return 'bolt';
      if (name.includes('הרכבה') || name.includes('assembly'))
        return 'build';
      if (name.includes('צביעה') || name.includes('paint'))
        return 'format_paint';
      return 'construction';
    },

    async loadHandymanStats() {
      const handymanId = this.user?._id || this.user?.id;
      if (!handymanId) return;

      try {
        const response = await axios.get(
          `${URL}/ratings/handyman/${handymanId}`,
          {
            params: { skip: 0, limit: 1 },
          }
        );

        if (response.data && response.data.success) {
          const stats = response.data.stats || {};
          this.handymanStats = {
            completedJobs: stats.jobDoneTotal || this.user?.jobDone || 0,
            averageResponseTime: stats.averageResponseTime || null,
            rating: stats.averageRating || this.user?.rating || 0,
          };
        }
      } catch (error) {
        logger.error('[ProfileSheet] Error loading handyman stats:', error);
      }
    },

    async loadClientStats() {
      const clientId = this.user?._id || this.user?.id;
      if (!clientId) return;

      try {
        // You may need to add an endpoint for client stats
        // For now, use the data from user object
        this.clientStats = {
          totalOrders: this.user?.Ordered || 0,
          favoriteHandymen: this.user?.favoriteHandymen?.length || 0,
        };
      } catch (error) {
        logger.error('[ProfileSheet] Error loading client stats:', error);
      }
    },

    openCityPicker() {
      this.cityPickerOpen = true;
      this.citySearch = this.cityInput || '';
    },
    closeCityPicker() {
      this.cityPickerOpen = false;
      this.citySearch = '';
    },
    onCitySearch() {},
    selectCity(name) {
      this.form.address = name;
      this.cityInput = name;
      this.cityError = '';
      this.cityPickerOpen = false;

      const foundCity = cities.find((c) => c.name === name);
      this.cityEnglishName = foundCity
        ? foundCity.english_name || foundCity.שם_ישוב_לועזי || null
        : null;
    },

    validateCity() {
      const name = (this.cityInput || '').trim();
      if (!name) {
        this.cityError = 'בחר עיר';
        return false;
      }

      const foundCity = cities.find((c) => c.name === name);
      if (!foundCity) {
        this.cityError = 'יש לבחור עיר מתוך הרשימה';
        return false;
      }

      this.cityEnglishName =
        foundCity.english_name || foundCity.שם_ישוב_לועזי || null;

      this.cityError = '';
      return true;
    },

    removeSpec(spec) {
      this.form.specialties = this.form.specialties.filter(
        (s) => (s.name || s) !== (spec.name || spec)
      );
    },

    onSave() {
      if (!this.validateCity()) return;

      this.form.address = this.cityInput.trim();

      this.$emit('save', {
        ...this.form,
        cityEnglishName: this.cityEnglishName,
      });

      this.showEditModal = false;
    },

    handlePaymentClick() {
      if (this.onboardingUrl) {
        window.open(this.onboardingUrl, '_blank');
      } else {
        this.fetchOnboardingLink();
      }
    },

    handleHistoryClick() {
      this.$emit('close');
      // Navigate to history page or emit event
      const userId = this.user?._id || this.user?.id;
      if (userId) {
        this.$router.push(`/Dashboard/${userId}`);
      }
    },

    async handleDeleteUser() {
      const userId = this.user?._id || this.user?.id;
      if (!userId) {
        this.toast?.showError(' לא הצלחנו לזהות את המשתמש');
        return;
      }

      this.isDeleting = true;
      try {
        const response = await axios.delete(`${URL}/users/${userId}`);
        if (response.data.success) {
          this.showDeleteConfirm = false;
          this.$emit('delete-user');
          this.$emit('close');
          this.$router.push('/');
        } else {
          alert(
            response.data.message ||
              'לא הצלחנו למחוק את המשתמש. נסה שוב מאוחר יותר.'
          );
        }
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          'לא הצלחנו למחוק את המשתמש. נסה שוב מאוחר יותר.';
        alert(errorMessage);
      } finally {
        this.isDeleting = false;
      }
    },

    async handleLogout() {
      this.isLoggingOut = true;
      try {
        await axios.get(`${URL}/auth/logout`);
        this.$emit('logout');
        this.$emit('close');
        this.$router.push('/');
      } catch (error) {
        this.$emit('logout');
        this.$emit('close');
        this.$router.push('/');
      } finally {
        this.isLoggingOut = false;
      }
    },

    async handleCancelSubscription() {
      const userId = this.user?._id || this.user?.id;
      if (!userId) {
        this.toast?.showError('לא הצלחנו לזהות את המשתמש');
        return;
      }

      this.isCancellingSubscription = true;
      try {
        const response = await axios.post(
          `${URL}/api/subscription/cancel`,
          { userId: String(userId) },
          { timeout: 30000 }
        );

        if (response.data && response.data.success) {
          this.showCancelSubscriptionConfirm = false;
          this.toast?.showSuccess('המנוי בוטל בהצלחה');
          this.$emit('refresh-user');
          this.hasActiveSubscription = false;
        } else {
          const errorMessage = response.data?.message || 'שגיאה בביטול המנוי';
          logger.error('[ProfileSheet] Cancel subscription failed:', errorMessage);
          this.toast?.showError(errorMessage);
        }
      } catch (error) {
        logger.error('[ProfileSheet] Error cancelling subscription:', error);
        let errorMessage = 'שגיאה בביטול המנוי';

        if (error.response) {
          errorMessage =
            error.response.data?.message ||
            error.response.data?.error ||
            `שגיאת שרת: ${error.response.status}`;
        } else if (error.request) {
          errorMessage = 'לא התקבלה תשובה מהשרת. אנא נסה שוב מאוחר יותר.';
        } else {
          errorMessage = error.message || 'שגיאה בביטול המנוי';
        }

        this.toast?.showError(errorMessage);
      } finally {
        this.isCancellingSubscription = false;
      }
    },

    async checkOnboardingStatus() {
      if (!this.isHandyman) return;

      const handymanId = this.user?._id || this.user?.id;
      if (!handymanId) return;

      try {
        const response = await axios.get(
          `${URL}/api/handyman/${handymanId}/stripe/status`
        );

        if (response.data && response.data.success) {
          const { needsOnboarding } = response.data;
          this.hasPaymentAccount = !needsOnboarding;

          if (needsOnboarding) {
            await this.fetchOnboardingLink();
          } else {
            this.onboardingUrl = null;
          }
        }
      } catch (error) {
        this.toast?.showError(
          ' לא הצלחנו ליצור קישור הגדרת תשלומים. אנא נסה שוב מאוחר יותר.'
        );
        await this.fetchOnboardingLink();
      }
    },

    async fetchOnboardingLink() {
      if (!this.isHandyman) return;

      const handymanId = this.user?._id || this.user?.id;
      if (!handymanId) return;

      this.isLoadingOnboarding = true;
      try {
        const response = await axios.post(
          `${URL}/api/handyman/stripe/onboarding-link`,
          { handymanId: String(handymanId) }
        );

        if (response.data && response.data.success && response.data.url) {
          this.onboardingUrl = response.data.url;
          window.open(this.onboardingUrl, '_blank');
        } else {
          this.onboardingUrl = null;
          alert(
            ' לא הצלחנו ליצור קישור הגדרת תשלומים. אנא נסה שוב מאוחר יותר.'
          );
        }
      } catch (error) {
        this.onboardingUrl = null;
        alert(
          'לא הצלחנו לטעון את קישור הגדרת תשלומים. אנא נסה שוב מאוחר יותר.'
        );
      } finally {
        this.isLoadingOnboarding = false;
      }
    },

    goToPaymentSettings() {
      const userId = this.user?._id || this.user?.id;
      if (!userId) {
        alert('לא הצלחנו לזהות את המשתמש');
        return;
      }
      this.$emit('close');
      this.$router.push({
        name: 'SubscriptionPaymentSettings',
        params: { id: userId },
      });
    },
  },
};
</script>

<style scoped lang="scss">
// Color variables
$primary: #f27f0d;
$primary-light: #ff8a2b;
$primary-dark: #ff6a00;
$background-dark: #221910;
$surface-dark: #2c2219;
$background-light: #f8f7f5;
$surface-light: #ffffff;
$text-dark: #0b0b0f;
$text-light: rgba(255, 255, 255, 0.92);
$muted: rgba(255, 255, 255, 0.6);
$danger: #ef4444;
$stroke: rgba(255, 255, 255, 0.1);

// Material Symbols styling
.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  &.icon-filled {
    font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  }
}

.ps {
  position: fixed;
  inset: 0;
  z-index: 100001;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  font-family: 'Noto Sans Hebrew', 'Space Grotesk', system-ui, sans-serif;
}

.ps__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(8px);
}

.ps__panel {
  position: relative;
  width: 100vw;
  max-width: 448px;
  height: 92vh;
  max-height: 900px;
  background: $background-dark;
  border: 1px solid rgba($primary, 0.18);
  border-bottom: 0;
  border-radius: 20px 20px 0 0;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.62);
  overflow: hidden;
  color: $text-light;
  display: flex;
  flex-direction: column;
  animation: sheetIn 0.28s cubic-bezier(0.2, 0.9, 0.2, 1);
}

@keyframes sheetIn {
  from {
    opacity: 0;
    transform: translateY(14px) scale(0.995);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.ps__handle {
  width: 54px;
  height: 6px;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.18),
    rgba($primary, 0.22),
    rgba(255, 255, 255, 0.18)
  );
  margin: 10px auto 8px;
}

// Top App Bar
.ps__topBar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: $background-dark;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.ps__topBarSpacer {
  width: 40px;
}

.ps__topBarTitle {
  flex: 1;
  text-align: center;
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  color: $text-light;
}

.ps__topBarSettings {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.6);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color 0.2s ease;

  &:hover {
    color: $primary;
  }

  .material-symbols-outlined {
    font-size: 24px;
  }
}

// Main Content
.ps__main {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  -webkit-overflow-scrolling: touch;
}

// Profile Header
.ps__profileHeader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  position: relative;
}

.ps__avatarWrapper {
  position: relative;
}

.ps__avatarBorder {
  width: 128px;
  height: 128px;
  border-radius: 50%;
  padding: 4px;
  border: 2px solid $primary;
  box-shadow: 0 0 20px rgba(242, 127, 13, 0.2);
}

.ps__avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-size: cover;
  background-position: center;
  background-color: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.ps__avatarPlaceholder {
  font-size: 48px;
}

.ps__ratingBadge {
  position: absolute;
  bottom: -8px;
  left: -8px;
  background: $surface-dark;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  padding: 6px 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.ps__ratingIcon {
  font-size: 16px;
  color: $primary;
}

.ps__ratingValue {
  font-size: 14px;
  font-weight: 700;
  color: $text-light;
}

.ps__profileInfo {
  text-align: center;
}

.ps__profileName {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 8px;
  color: $text-light;
}

.ps__profileBadge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
}

.ps__verifiedIcon {
  font-size: 18px;
  color: $primary;
}

.ps__profileBadgeText {
  font-size: 18px;
  font-weight: 500;
  color: $primary;
  margin: 0;
}

.ps__profileDate {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

// Stats Grid
.ps__statsGrid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.ps__statCard {
  background: $surface-dark;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.ps__statIconWrapper {
  background: rgba($primary, 0.1);
  padding: 8px;
  border-radius: 8px;
  margin-bottom: 4px;
}

.ps__statIcon {
  font-size: 24px;
  color: $primary;
}

.ps__statValue {
  font-size: 24px;
  font-weight: 700;
  color: $text-light;
  margin: 4px 0 0;
}

.ps__statLabel {
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

// Specialties
.ps__specialties {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ps__specialtiesHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ps__specialtiesTitle {
  font-size: 18px;
  font-weight: 700;
  color: $text-light;
  margin: 0;
}

.ps__specialtiesEditBtn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba($primary, 0.1);
  color: $primary;
  font-size: 14px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: rgba($primary, 0.2);
  }
}

.ps__editIcon {
  font-size: 16px;
}

.ps__specialtiesChips {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.ps__specialtyChip {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #382b20;
  border: 1px solid rgba($primary, 0.2);
  border-radius: 12px;
  padding: 10px 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.ps__chipIcon {
  font-size: 20px;
  color: $primary;
}

.ps__chipText {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
}

.ps__specialtiesEmpty {
  color: $muted;
  font-weight: 500;
  font-size: 14px;
}

.ps__specEditor {
  margin-top: 8px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.ps__divider {
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin: 4px 0;
}

// Action Menu Stack
.ps__actionsStack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ps__actionBtn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: $surface-dark;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &:hover {
    border-color: rgba($primary, 0.3);
    background: rgba($primary, 0.05);
  }
}

.ps__actionBtn--subscription {
  background: linear-gradient(to right, #1a1a1a, #141414);
  border-color: rgba($primary, 0.3);

  &:hover {
    background: linear-gradient(to right, #222, #1a1a1a);
  }
}

.ps__actionBtnLeft {
  display: flex;
  align-items: center;
  gap: 16px;
}

.ps__actionIconWrapper {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.5);
  transition: color 0.2s ease;

  .ps__actionBtn:hover & {
    color: $primary;
  }

  .material-symbols-outlined {
    font-size: 24px;
  }
}

.ps__actionIconWrapper--primary {
  background: linear-gradient(135deg, $primary, #ff6a00);
  color: white;
  box-shadow: 0 4px 12px rgba($primary, 0.3);
}

.ps__actionTextGroup {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.ps__actionTitle {
  font-size: 16px;
  font-weight: 700;
  color: $text-light;
}

.ps__actionSubtitle {
  font-size: 12px;
  font-weight: 500;
  color: $primary;
}

.ps__actionChevron {
  color: rgba(255, 255, 255, 0.4);
  font-size: 24px;
  transition: color 0.2s ease;

  .ps__actionBtn:hover & {
    color: $primary;
  }
}

// Logout
.ps__logoutWrapper {
  padding: 16px 0;
  display: flex;
  justify-content: center;
}

.ps__logoutBtn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  color: #ef4444;
  background: transparent;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.1);
    color: #ff6b6b;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.ps__logoutIcon {
  font-size: 20px;
}

.ps__logoutText {
  font-size: 14px;
}

// Edit Modal
.ps__editModal {
  position: fixed;
  inset: 0;
  z-index: 100002;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(8px);
  padding: 16px;
}

.ps__editModalCard {
  width: 100%;
  max-width: 440px;
  background: $surface-dark;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 22px;
  overflow: hidden;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.62);
  animation: popIn 0.22s ease-out;
}

@keyframes popIn {
  from {
    transform: translateY(8px) scale(0.98);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

.ps__editModalHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.ps__editModalTitle {
  font-size: 20px;
  font-weight: 700;
  color: $text-light;
  margin: 0;
}

.ps__editModalClose {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: $text-light;
  }

  .material-symbols-outlined {
    font-size: 24px;
  }
}

.ps__editModalContent {
  padding: 22px;
}

.ps__editGrid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.ps__editField {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ps__editField--wide {
  grid-column: 1 / -1;
}

.ps__editLabel {
  font-size: 12px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.72);
}

.ps__editControl {
  position: relative;
  display: flex;
  align-items: center;
}

.ps__editIcon {
  position: absolute;
  right: 12px;
  font-size: 20px;
  color: rgba(255, 255, 255, 0.6);
  pointer-events: none;
}

.ps__editInput {
  width: 100%;
  height: 46px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.2);
  color: $text-light;
  padding: 0 40px 0 12px;
  font-weight: 500;
  font-size: 15px;
  outline: none;
  transition: all 0.2s ease;

  &::placeholder {
    color: rgba(255, 255, 255, 0.35);
  }

  &:focus {
    border-color: rgba($primary, 0.5);
    box-shadow: 0 0 0 3px rgba($primary, 0.14);
    background: rgba(0, 0, 0, 0.26);
  }
}

.ps__editPicker {
  width: 100%;
  height: 46px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.2);
  color: $text-light;
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba($primary, 0.25);
    background: rgba(255, 255, 255, 0.05);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba($primary, 0.18);
    border-color: rgba($primary, 0.35);
  }
}

.ps__editPickerLeft {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.ps__editPickerIcon {
  font-size: 20px;
  opacity: 0.9;
}

.ps__editPickerValue {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 92%;
}

.ps__editPickerChev {
  opacity: 0.75;
  font-size: 24px;
}

.ps__editError {
  font-size: 12px;
  color: #ff8888;
  font-weight: 700;
}

.ps__editModalFooter {
  display: flex;
  gap: 10px;
  padding: 22px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.25);
}

.ps__editBtn {
  flex: 1;
  height: 46px;
  border-radius: 14px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.12);
  transition: all 0.15s ease;
}

.ps__editBtn--ghost {
  background: rgba(255, 255, 255, 0.06);
  color: $text-light;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba($primary, 0.18);
  }
}

.ps__editBtn--primary {
  background: linear-gradient(135deg, $primary, $primary-light);
  color: $text-dark;
  border-color: rgba($primary, 0.55);
  box-shadow: 0 18px 55px rgba(242, 127, 13, 0.22);

  &:hover {
    box-shadow: 0 22px 60px rgba(242, 127, 13, 0.25);
  }
}

// City picker modal (existing styles)
.pickerModal {
  position: fixed;
  inset: 0;
  z-index: 100003;
  background: rgba(0, 0, 0, 0.72);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  backdrop-filter: blur(8px);
}

.pickerModal__card {
  width: 100%;
  max-width: 448px;
  height: min(74vh, 600px);
  background: $surface-dark;
  border: 1px solid rgba($primary, 0.18);
  border-radius: 20px 20px 0 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.62);
  animation: sheetIn 0.28s cubic-bezier(0.2, 0.9, 0.2, 1);
}

.pickerModal__head {
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.pickerModal__title {
  font-weight: 700;
  font-size: 15px;
  color: $text-light;
}

.ps__iconBtn {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(0, 0, 0, 0.28);
  color: $text-light;
  font-size: 16px;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba($primary, 0.25);
  }
}

.ps__iconBtn--sm {
  width: 36px;
  height: 36px;
  border-radius: 12px;
}

.pickerModal__searchWrap {
  margin: 12px;
  position: relative;
}

.pickerModal__searchIcon {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0.85;
  color: rgba(255, 255, 255, 0.6);
}

.pickerModal__search {
  width: 100%;
  height: 46px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.2);
  color: $text-light;
  padding: 0 44px 0 12px;
  font-weight: 500;
  outline: none;

  &:focus {
    border-color: rgba($primary, 0.45);
    box-shadow: 0 0 0 3px rgba($primary, 0.14);
  }
}

.pickerModal__list {
  flex: 1;
  overflow: auto;
  padding: 0 12px 12px;
  -webkit-overflow-scrolling: touch;
}

.pickerModal__item {
  width: 100%;
  text-align: right;
  padding: 14px 12px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.09);
  background: rgba(255, 255, 255, 0.05);
  color: $text-light;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.15s ease;
}

.pickerModal__itemIcon {
  opacity: 0.9;
  color: rgba(255, 255, 255, 0.6);
}

.pickerModal__itemTxt {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pickerModal__itemChev {
  opacity: 0.75;
  font-size: 18px;
  color: rgba(255, 255, 255, 0.4);
}

.pickerModal__item:hover {
  background: rgba($primary, 0.12);
  border-color: rgba($primary, 0.22);
}

.pickerModal__empty {
  padding: 18px 10px;
  text-align: center;
  color: $muted;
  font-weight: 500;
}

.pickerModal__footer {
  padding: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.25);
}

// Unified modal styles
.deleteUserModal,
.cancelSubscriptionModal {
  position: fixed;
  inset: 0;
  z-index: 100004;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(8px);
  padding: 16px;
}

.modal {
  background: $surface-dark;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 22px;
  padding: 22px;
  width: min(440px, 92vw);
  text-align: center;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.62);
  animation: popIn 0.22s ease-out;
}

.modal--warn {
  border-color: rgba($danger, 0.22);
}

.modal__icon {
  font-size: 46px;
  margin-bottom: 12px;
}

.modal__title {
  font-size: 20px;
  font-weight: 700;
  color: $text-light;
  margin: 0 0 10px;
}

.modal__message {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.84);
  margin: 0 0 18px;
  line-height: 1.55;
  font-weight: 500;
}

.modal__actions {
  display: flex;
  gap: 10px;
}

.modal__btn {
  flex: 1;
  height: 46px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.06);
  color: $text-light;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.modal__btn--ghost:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
}

.modal__btn--danger {
  border-color: rgba($danger, 0.38);
  background: rgba($danger, 0.16);
  color: #ff8a8a;

  &:hover:not(:disabled) {
    background: rgba($danger, 0.24);
    border-color: rgba($danger, 0.55);
  }
}

.modal__btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn {
  flex: 1;
  height: 46px;
  border-radius: 14px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.12);
  transition: all 0.15s ease;
}

.btn--ghost {
  background: rgba(255, 255, 255, 0.06);
  color: $text-light;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba($primary, 0.18);
  }
}

// Responsive
@media (max-width: 520px) {
  .ps__editGrid {
    grid-template-columns: 1fr;
  }

  .modal__actions {
    flex-direction: column;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ps__panel,
  .pickerModal__card,
  .modal,
  .ps__editModalCard {
    animation: none !important;
  }
  * {
    transition: none !important;
  }
}
</style>
