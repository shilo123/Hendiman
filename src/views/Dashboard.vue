<template>
  <div class="dash" dir="rtl">
    <!-- Loading Overlay -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p class="loading-text">טוען נתונים...</p>
      </div>
    </div>

    <!-- TOP BAR - hidden when chat is active, shown when minimized or no job -->
    <DashboardTopBar
      v-if="!currentAssignedJob || isChatMinimized"
      :me="me"
      :isHendiman="isHendiman"
      :isAvailable="isAvailable"
      :stats="stats"
      :hasActiveJob="!!currentAssignedJob"
      :isChatMinimized="isChatMinimized"
      @open-profile="onOpenProfile"
      @open-handymen-chat="onOpenHandymenChat"
      @open-all-users-chat="onOpenAllUsersChat"
      @view-ratings="onViewRatings"
      @return-to-job="onReturnToJob"
    />

    <!-- MAIN -->
    <main class="grid">
      <!-- Job Chat (when job is assigned) -->
      <component
        :is="isMobile ? 'JobChatMobile' : 'JobChat'"
        v-if="currentAssignedJob && !isChatMinimized"
        :job="currentAssignedJob"
        :jobs="currentAssignedJobs.length > 1 ? currentAssignedJobs : undefined"
        :isHandyman="isHendiman"
        @minimize="isChatMinimized = true"
        @status-updated="onJobStatusUpdated"
        @rating-submitted="onRatingSubmitted"
        @cancel-job="onCancelJob"
      />

      <!-- Regular Dashboard (when no assigned job) -->
      <template v-else>
        <!-- CLIENT: Create Call Button (above jobs - mobile only) -->
        <ClientActions
          v-if="!isHendiman"
          @create-call="onCreateCallCta"
          class="client-actions-top"
        />

        <!-- Return to job button (mobile only - above jobs) -->
        <button
          v-if="isMobile && currentAssignedJob && isChatMinimized"
          class="return-job-mobile"
          :class="{ 'return-job-mobile--handyman': isHendiman }"
          type="button"
          @click="onReturnToJob"
        >
          <span class="return-job-mobile__icon">🔧</span>
          <span class="return-job-mobile__text">חזור לעבודה שלך</span>
        </button>

        <!-- RIGHT SIDE (moved before jobs for client) -->
        <aside class="side" v-if="!isHendiman">
          <!-- CLIENT: Create Call Button (desktop only) -->
          <section v-if="!isHendiman" class="panel client-actions-panel">
            <ClientActions
              @create-call="onCreateCallCta"
              class="client-actions-desktop"
            />
          </section>
          <!-- CLIENT: handymen in area + action buttons -->
          <section class="panel">
            <div class="panel__head">
              <h2 class="h2">
                הנדימנים באזורך
                <span v-if="handymenPagination.total" class="h2__count"
                  >({{ handymenPagination.total }})</span
                >
              </h2>
              <p class="sub">
                הנדימנים הזמינים באזור שלך · לחץ על כפתור לפעולה
              </p>
            </div>

            <HandymenList
              :filteredHandymen="filteredHandymen"
              :pagination="handymenPagination"
              @view-details="onViewHandymanDetails"
              @open-chat="onOpenUserChat"
              @personal-request="onPersonalRequest"
              @next-page="onNextPage"
              @prev-page="onPrevPage"
            />
          </section>
        </aside>

        <!-- HANDYMAN: quick profile & notes (removed from aside, will be at bottom) -->

        <!-- LEFT ~60% JOBS -->
        <JobsSection
          :isHendiman="isHendiman"
          :filteredJobs="pagedJobs"
          :jobsPagination="jobsPagination"
          :handymanCoords="
            isHendiman
              ? store.user?.location?.coordinates
                ? {
                    lng: store.user.location.coordinates[0],
                    lat: store.user.location.coordinates[1],
                  }
                : store.user?.coordinates || null
              : null
          "
          :statusTabsWithCounts="statusTabsWithCounts"
          :activeStatus="activeStatus"
          :handymanFilters="handymanFilters"
          :currentUserId="
            store.user?._id?.toString() || me?._id?.toString() || null
          "
          @refresh="onRefresh"
          @pick-status="onPickStatus"
          @change-km="onChangeKm"
          @reset-km="onResetKm"
          @change-location-type="onChangeLocationType"
          @change-work-type="onChangeWorkType"
          @change-price-range="onChangePriceRange"
          @skip="onSkip"
          @accept="onAccept"
          @view="onView"
          @edit-job="onEditJob"
          @delete-job="onDeleteJob"
          @next-jobs-page="onJobsNextPage"
          @prev-jobs-page="onJobsPrevPage"
        />

        <!-- HANDYMAN: Tools section at the bottom -->
        <aside v-if="isHendiman" class="side side--bottom">
          <section class="panel">
            <div class="panel__head">
              <h2 class="h2">כלים להנדימן</h2>
              <p class="sub">עבודות מופיעות רק לפי ההתמחויות שבחרת בהרשמה</p>
            </div>

            <HandymanTools
              :specialties="me.specialties"
              @edit-profile="onGoProfile"
              @open-chat="onOpenHandymenChat"
            />
          </section>
        </aside>

        <ViewHandymanDetails
          v-if="handymanDetails"
          :handymanDetails="handymanDetails"
          @close="onCloseHandymanDetails"
          @book="onBookHandyman"
          @block="onBlockHandymanFromModal"
        />
        <ViewJob
          v-if="jobDetails"
          :jobDetails="jobDetails"
          :isHendiman="isHendiman"
          :getStatusLabel="getStatusLabel"
          :acceptingJobId="acceptingJobId"
          @close="onCloseJobDetails"
          @accept="onAcceptJobFromModal"
          @skip="onSkipJobFromModal"
        />
        <ProfileSheet
          :visible="showProfileSheet"
          :user="store.user"
          :isHandyman="isHendiman"
          @close="showProfileSheet = false"
          @save="onSaveProfile"
          @logout="onLogout"
        />
        <!-- Job Cancelled Modal -->
        <!-- Client Approval Modal (for client when job is done) -->
        <div
          v-if="showClientApprovalModal && !isHendiman && pendingApprovalJob"
          class="clientApprovalModal"
          dir="rtl"
          @click.self="showClientApprovalModal = false"
        >
          <div class="clientApprovalModal__content">
            <button
              class="clientApprovalModal__close"
              type="button"
              @click="showClientApprovalModal = false"
              aria-label="סגור"
            >
              ✕
            </button>
            <div class="clientApprovalModal__icon">✅</div>
            <h2 class="clientApprovalModal__title">ההנדימן סיים את העבודה</h2>
            <p class="clientApprovalModal__message">
              ההנדימן סימן את העבודה כהושלמה. האם העבודה הושלמה בהצלחה ואתה מאשר
              לשחרר את התשלום?
            </p>
            <div class="clientApprovalModal__actions">
              <button
                class="clientApprovalModal__btn clientApprovalModal__btn--approve"
                type="button"
                @click="handleClientApprove"
              >
                כן, אשר ושחרר תשלום
              </button>
              <button
                class="clientApprovalModal__btn clientApprovalModal__btn--reject"
                type="button"
                @click="handleClientReject"
              >
                לא, יש בעיה
              </button>
            </div>
          </div>
        </div>

        <!-- Onboarding Required Modal (for handyman) -->
        <div
          v-if="showOnboardingModal && isHendiman"
          class="onboardingModal"
          dir="rtl"
          @click.self="showOnboardingModal = false"
        >
          <div class="onboardingModal__content">
            <button
              class="onboardingModal__close"
              type="button"
              @click="showOnboardingModal = false"
              aria-label="סגור"
            >
              ✕
            </button>
            <div class="onboardingModal__icon">💳</div>
            <h2 class="onboardingModal__title">הגדר חשבון תשלומים</h2>
            <p class="onboardingModal__message">
              <span v-if="onboardingUrl">
                הלקוח אישר את סיום העבודה. כדי לקבל את התשלום, עליך להשלים את
                הגדרת חשבון התשלומים ב-Stripe.
              </span>
              <span v-else>
                הלקוח אישר את סיום העבודה והתשלום שוחרר. כדי לקבל את הכסף, עליך
                להגדיר חשבון תשלומים. אנא פנה לתמיכה להשלמת ההגדרה.
              </span>
            </p>
            <div class="onboardingModal__actions">
              <button
                v-if="onboardingUrl"
                class="onboardingModal__btn onboardingModal__btn--primary"
                type="button"
                @click="openOnboardingLink"
              >
                הגדר תשלומים
              </button>
              <button
                class="onboardingModal__btn onboardingModal__btn--secondary"
                type="button"
                @click="showOnboardingModal = false"
              >
                מאוחר יותר
              </button>
            </div>
          </div>
        </div>

        <div v-if="showJobCancelledModal" class="jobCancelledModal" dir="rtl">
          <div
            class="jobCancelledModal__backdrop"
            @click="showJobCancelledModal = false"
          />
          <div class="jobCancelledModal__content">
            <div class="jobCancelledModal__icon">⚠️</div>
            <h2 class="jobCancelledModal__title">העבודה בוטלה</h2>
            <p class="jobCancelledModal__message">
              <span v-if="cancelledBy === 'handyman'">
                מצטערים, אך ההנדימן ביטל את העבודה
              </span>
              <span v-else-if="cancelledBy === 'client'">
                מצטערים, אך הלקוח ביטל את העבודה
              </span>
            </p>
            <button
              class="jobCancelledModal__btn"
              type="button"
              @click="handleJobCancelledClose"
            >
              הבנתי
            </button>
          </div>
        </div>
      </template>
    </main>

    <!-- Mobile Bottom Navigation & CTA -->
    <!-- Removed: Create Call button moved to top -->

    <!-- Delete Job Confirmation Modal -->
    <div
      v-if="showDeleteJobModal"
      class="modal-overlay"
      @click.self="showDeleteJobModal = false"
    >
      <div class="modal modal--delete">
        <div class="modal__header">
          <h2 class="modal__title">מחיקת עבודה</h2>
          <button
            class="modal__close"
            type="button"
            @click="showDeleteJobModal = false"
            aria-label="סגור"
          >
            ✕
          </button>
        </div>
        <div class="modal__body">
          <p class="modal__text">האם אתה בטוח שברצונך למחוק את העבודה הזו?</p>
          <p class="modal__warning">
            אם יש הנדימן ששובץ לעבודה הזו, הוא יקבל הודעה שהעבודה בוטלה.
          </p>
        </div>
        <div class="modal__footer">
          <button
            class="modal__btn modal__btn--cancel"
            type="button"
            @click="showDeleteJobModal = false"
          >
            ביטול
          </button>
          <button
            class="modal__btn modal__btn--delete"
            type="button"
            @click="confirmDeleteJob"
            :disabled="isDeletingJob"
          >
            {{ isDeletingJob ? "מוחק..." : "מחק" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Job Modal -->
    <div
      v-if="showEditJobModal"
      class="modal-overlay"
      @click.self="showEditJobModal = false"
    >
      <div class="modal modal--edit">
        <div class="modal__header">
          <h2 class="modal__title">עריכת עבודה</h2>
          <button
            class="modal__close"
            type="button"
            @click="closeEditJobModal"
            aria-label="סגור"
          >
            ✕
          </button>
        </div>
        <div class="modal__body modal__body--edit">
          <div v-if="isSavingJob" class="modal__loading">
            <div class="spinner"></div>
            <p>שומר שינויים...</p>
          </div>

          <form v-else @submit.prevent="saveJobChanges" class="edit-job-form">
            <!-- Subcategories Section -->
            <div class="form-section">
              <div class="form-section__header">
                <h3 class="form-section__title">תחומים</h3>
                <button
                  type="button"
                  class="btn-small btn-small--secondary"
                  @click="openEditSubcategories"
                >
                  ✏️ ערוך תחומים
                </button>
              </div>
              <div class="subcategories-list">
                <div
                  v-for="(subcat, index) in editJobForm.subcategoryInfo"
                  :key="index"
                  class="subcategory-item"
                >
                  <span class="subcategory-name">{{
                    subcat.subcategory || subcat.category
                  }}</span>
                  <span v-if="subcat.price" class="subcategory-price"
                    >{{ subcat.price }} ₪</span
                  >
                </div>
                <div
                  v-if="editJobForm.subcategoryInfo.length === 0"
                  class="empty-state"
                >
                  אין תחומים
                </div>
              </div>
            </div>

            <!-- Description -->
            <div class="form-section">
              <label class="form-label">תיאור</label>
              <textarea
                v-model="editJobForm.desc"
                class="form-textarea"
                rows="4"
                placeholder="תאר את העבודה..."
              ></textarea>
            </div>

            <!-- Location -->
            <div class="form-section">
              <label class="form-label">מיקום</label>
              <div
                v-if="
                  !editJobForm.selectedMapLocation &&
                  !editJobForm.usingMyLocation
                "
                class="location-input-wrapper"
              >
                <AddressAutocomplete
                  v-model="editJobForm.locationText"
                  input-id="edit-job-location"
                  placeholder="הכנס שם ישוב"
                  :required="
                    !editJobForm.usingMyLocation &&
                    !editJobForm.selectedMapLocation
                  "
                  @update:modelValue="onEditLocationChange"
                  @update:englishName="onEditEnglishNameUpdate"
                  @update:selectedCity="onEditCitySelected"
                />
                <div
                  v-if="
                    editJobForm.locationText &&
                    editJobForm.locationText !== 'המיקום שלי'
                  "
                  class="house-number-input"
                >
                  <input
                    type="text"
                    v-model="editJobForm.houseNumber"
                    placeholder="מספר בית\בלוק"
                    class="form-input"
                  />
                </div>
                <div class="location-buttons">
                  <button
                    class="btn-small btn-small--secondary"
                    type="button"
                    @click="openEditMapPicker"
                  >
                    🗺️ דקור במפה
                  </button>
                  <button
                    class="btn-small btn-small--secondary"
                    type="button"
                    @click="setEditMyLocation"
                  >
                    📍 לפי מיקום
                  </button>
                </div>
              </div>
              <div
                v-else-if="editJobForm.selectedMapLocation"
                class="location-selected"
              >
                <span>📍 מיקום נבחר במפה</span>
                <button
                  type="button"
                  class="btn-small btn-small--secondary"
                  @click="clearEditMapLocation"
                >
                  שנה מיקום
                </button>
              </div>
              <div
                v-else-if="editJobForm.usingMyLocation"
                class="location-selected"
              >
                <span>📍 המיקום שלי</span>
                <button
                  type="button"
                  class="btn-small btn-small--secondary"
                  @click="clearEditMyLocation"
                >
                  שנה מיקום
                </button>
              </div>
              <div v-if="editJobForm.locationError" class="form-error">
                {{ editJobForm.locationError }}
              </div>
            </div>

            <!-- When -->
            <div class="form-section">
              <label class="form-label">מתי</label>
              <select v-model="editJobForm.when" class="form-select">
                <option value="asap">כמה שיותר מהר</option>
                <option value="today">היום</option>
                <option value="other">זמן אחר</option>
              </select>
            </div>

            <!-- Work Type -->
            <div class="form-section">
              <label class="form-label">סוג עבודה</label>
              <select v-model="editJobForm.workType" class="form-select">
                <option value="קלה">קלה</option>
                <option value="מורכבת">מורכבת</option>
                <option value="קשה">קשה</option>
              </select>
            </div>

            <!-- Urgent -->
            <div class="form-section">
              <label class="form-checkbox">
                <input
                  v-model="editJobForm.urgent"
                  type="checkbox"
                  class="form-checkbox__input"
                />
                <span class="form-checkbox__label">דחוף (+10 ₪)</span>
              </label>
            </div>

            <!-- Images -->
            <div class="form-section">
              <label class="form-label">תמונות</label>
              <div class="images-preview">
                <div
                  v-for="(imageUrl, index) in editJobForm.imageUrl"
                  :key="index"
                  class="image-preview-item"
                >
                  <img :src="imageUrl" :alt="`תמונה ${index + 1}`" />
                  <button
                    type="button"
                    class="image-remove-btn"
                    @click="removeEditImage(index)"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <input
                ref="editImageInput"
                type="file"
                accept="image/*"
                multiple
                style="display: none"
                @change="handleEditImageUpload"
              />
              <button
                type="button"
                class="btn-small btn-small--secondary"
                @click="$refs.editImageInput?.click()"
                :disabled="editJobForm.imageUrl.length >= 4"
              >
                + הוסף תמונה
              </button>
              <p class="form-hint">אפשר להעלות עד 4 תמונות</p>
            </div>
          </form>
        </div>
        <div class="modal__footer" v-if="!isSavingJob">
          <button
            class="modal__btn modal__btn--cancel"
            type="button"
            @click="closeEditJobModal"
          >
            ביטול
          </button>
          <button
            class="modal__btn modal__btn--save"
            type="button"
            @click="saveJobChanges"
          >
            שמור שינויים
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Map Picker Modal -->
    <div
      v-if="showEditMapPicker"
      class="modal-overlay"
      @click.self="closeEditMapPicker"
    >
      <div class="modal modal--map">
        <div class="modal__header">
          <h2 class="modal__title">בחר מיקום במפה</h2>
          <button
            class="modal__close"
            type="button"
            @click="closeEditMapPicker"
            aria-label="סגור"
          >
            ✕
          </button>
        </div>
        <div class="modal__body modal__body--map">
          <div id="editMapPicker" class="map-picker"></div>
        </div>
        <div class="modal__footer">
          <button
            class="modal__btn modal__btn--cancel"
            type="button"
            @click="closeEditMapPicker"
          >
            ביטול
          </button>
          <button
            class="modal__btn modal__btn--save"
            type="button"
            @click="confirmEditMapLocation"
          >
            אישור
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useMainStore } from "@/store/index";
import DashboardTopBar from "@/components/Dashboard/DashboardTopBar.vue";
import JobsSection from "@/components/Dashboard/JobsSection.vue";
import HandymenList from "@/components/Dashboard/HandymenList.vue";
import ClientActions from "@/components/Dashboard/ClientActions.vue";
import HandymanTools from "@/components/Dashboard/HandymanTools.vue";
import ViewHandymanDetails from "@/components/Dashboard/ViewHandymanDetails.vue";
import ViewJob from "@/components/Dashboard/ViewJob.vue";
import ProfileSheet from "@/components/ProfileSheet.vue";
import JobChat from "@/components/Dashboard/JobChat.vue";
import JobChatMobile from "@/components/Dashboard/JobChatMobile.vue";
import axios from "axios";
import { URL } from "@/Url/url";
import { useToast } from "@/composables/useToast";
import { getCurrentLocation } from "@/utils/geolocation";
import { io } from "socket.io-client";
import { messaging, VAPID_KEY, getToken, onMessage } from "@/firebase";
import AddressAutocomplete from "@/components/AddressAutocomplete.vue";
import citiesData from "@/APIS/AdressFromIsrael.json";

export default {
  name: "DashboardView",
  components: {
    DashboardTopBar,
    JobsSection,
    HandymenList,
    ClientActions,
    HandymanTools,
    ViewHandymanDetails,
    ViewJob,
    ProfileSheet,
    JobChat,
    JobChatMobile,
    AddressAutocomplete,
  },
  data() {
    return {
      // will come from server
      isHendiman: false,

      isAvailable: true,
      toast: null,
      userCoordinates: null, // שמור את הקואורדינטות כאן

      me: {
        _id: null,
        name: "",
        avatarUrl: "",
        specialties: [],
      },
      jobsPage: 1,
      jobsPageSize: 5,

      statusTabs: [
        { label: "הכל", value: "all" },
        { label: "פתוחות", value: "open" },
        { label: "שובצו", value: "assigned" },
        { label: "בדרך", value: "on_the_way" },
        { label: "בביצוע", value: "in_progress" },
        { label: "הושלמו", value: "done" },
        { label: "בוטלו", value: "cancelled" },
      ],
      activeStatus: "open", // Default to "open" for handyman
      jobDetails: null,
      showProfileSheet: false,
      acceptingJobId: null, // Track which job is being accepted for loading state
      profileForm: {
        name: "",
        phone: "",
        email: "",
        city: "",
        specialties: [],
      },
      socket: null,
      handymanFilters: {
        maxKm: 25,
        locationType: "residence",
        workType: "",
        minPrice: null,
        maxPrice: null,
      }, // "myLocation" or "residence", workType: "", "קלה", "מורכבת", "קשה"
      geoCoordinates: null, // For "myLocation" option
      handymanDetails: null,
      dirFilters: { q: "", minRating: 0, minJobs: 0 },
      activeAssignedJob: null,
      isChatMinimized: false,
      doneJobsCache: [], // Cache for done jobs that need client approval (persists after refresh)
      showJobCancelledModal: false,
      cancelledBy: "handyman", // Track who cancelled: "handyman" or "client"
      showOnboardingModal: false, // Show onboarding popup for handyman
      onboardingUrl: null, // Onboarding URL to display
      showClientApprovalModal: false, // Show approval popup for client
      pendingApprovalJob: null, // Job that needs client approval
      isMobile: window.innerWidth <= 768,
      jobToEdit: null,
      showEditJobModal: false,
      jobToDelete: null,
      showDeleteJobModal: false,
      isDeletingJob: false,
      editJobForm: {
        subcategoryInfo: [],
        desc: "",
        locationText: "",
        houseNumber: "",
        when: "asap",
        workType: "קלה",
        urgent: false,
        imageUrl: [],
        selectedMapLocation: null,
        usingMyLocation: false,
        locationEnglishName: null,
        selectedCity: null,
        locationError: null,
      },
      isSavingJob: false,
      showEditSubcategoriesModal: false,
      showEditMapPicker: false,
      editMapPicker: null,
      editMapMarker: null,
      cities: [],
    };
  },

  setup() {
    const store = useMainStore();
    return { store };
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
  },
  computed: {
    jobs() {
      return this.store.jobs;
    },
    jobsPagination() {
      const total = this.filteredJobs.length;
      const pageCount = Math.max(1, Math.ceil(total / this.jobsPageSize));
      const page = Math.min(this.jobsPage, pageCount);
      return {
        page,
        total,
        pageSize: this.jobsPageSize,
        pageCount,
        hasNext: page < pageCount,
        hasPrev: page > 1,
      };
    },
    handymen() {
      return this.store.handymen;
    },
    stats() {
      return this.store.stats;
    },
    isLoading() {
      return this.store.isLoading;
    },
    handymenPagination() {
      return this.store.handymenPagination;
    },
    filteredJobs() {
      return this.store.filteredJobs(
        this.isHendiman ? this.activeStatus : null,
        this.isHendiman ? this.handymanFilters.maxKm : null,
        this.isHendiman,
        this.isHendiman && this.me?.specialties ? this.me.specialties : null,
        this.isHendiman && this.me?.fullCategories
          ? this.me.fullCategories
          : null,
        this.isHendiman
          ? this.store.user?.location?.coordinates
            ? {
                lng: this.store.user.location.coordinates[0],
                lat: this.store.user.location.coordinates[1],
              }
            : this.store.user?.coordinates || null
          : null
      );
    },
    pagedJobs() {
      let jobsToPage = this.filteredJobs;

      // For clients, sort jobs so client's own jobs appear first
      if (!this.isHendiman) {
        const userId = this.store.user?._id || this.me?._id;
        if (userId) {
          const userIdStr = String(userId);
          jobsToPage = [...this.filteredJobs].sort((a, b) => {
            const aIsClientJob = a.clientId && String(a.clientId) === userIdStr;
            const bIsClientJob = b.clientId && String(b.clientId) === userIdStr;

            // Client's jobs first
            if (aIsClientJob && !bIsClientJob) return -1;
            if (!aIsClientJob && bIsClientJob) return 1;

            // Otherwise maintain original order
            return 0;
          });
        }
      }

      const start = (this.jobsPagination.page - 1) * this.jobsPageSize;
      const end = start + this.jobsPageSize;
      return jobsToPage.slice(start, end);
    },

    filteredHandymen() {
      return this.store.filteredHandymen(this.dirFilters);
    },
    statusTabsWithCounts() {
      // השתמש ב-filteredJobs שכבר מסנן לפי התמחויות ומרחק
      const allFilteredJobs = this.store.filteredJobs(
        null, // לא מסנן לפי סטטוס כאן
        this.isHendiman ? this.handymanFilters.maxKm : null,
        this.isHendiman,
        this.isHendiman && this.me?.specialties ? this.me.specialties : null,
        this.isHendiman && this.me?.fullCategories
          ? this.me.fullCategories
          : null,
        this.isHendiman
          ? this.store.user?.location?.coordinates
            ? {
                lng: this.store.user.location.coordinates[0],
                lat: this.store.user.location.coordinates[1],
              }
            : this.store.user?.coordinates || null
          : null
      );

      return this.statusTabs.map((tab) => {
        let count = 0;
        if (tab.value === "all") {
          count = allFilteredJobs.length;
        } else {
          count = allFilteredJobs.filter((j) => j.status === tab.value).length;
        }
        return { ...tab, count };
      });
    },
    currentAssignedJobs() {
      // Get all active assigned jobs
      const userId = this.store.user?._id || this.me?._id;
      if (!userId) return [];

      // Ensure userId is a string for comparison
      const userIdStr = String(userId);

      // Combine store jobs with cached done jobs (for client approval)
      const allJobs = [
        ...(this.store.jobs || []),
        ...(this.doneJobsCache || []),
      ];
      // Remove duplicates by job ID
      const uniqueJobs = allJobs.filter(
        (job, index, self) =>
          index ===
          self.findIndex(
            (j) => String(j._id || j.id) === String(job._id || job.id)
          )
      );

      const assignedJobs = uniqueJobs.filter((job) => {
        if (this.isHendiman) {
          // עבור הנדימן - בודק אם handymanId תואם (תמיכה במערך)
          // עבור הנדימן: עבודה ב-"done" לא נחשבת כעבודה פעילה (צריך להמתין לדירוג)
          let isHandymanInJob = false;
          if (job.handymanId) {
            if (Array.isArray(job.handymanId)) {
              isHandymanInJob = job.handymanId.some(
                (id) => String(id) === userIdStr
              );
            } else {
              isHandymanInJob = String(job.handymanId) === userIdStr;
            }
          }
          // כל עבודה שלא בסטטוס "open" ולא בסטטוס "done" צריכה להיפתח
          return (
            isHandymanInJob &&
            job.status !== "open" && // לא עבודות פתוחות
            job.status !== "done" // לא עבודות שהושלמו
          );
        } else {
          // עבור לקוח - בודק אם clientId תואם
          // עבור לקוח: עבודה ב-"done" עם clientApproved: false צריכה להיפתח (לאשר)
          return (
            job.clientId &&
            String(job.clientId) === userIdStr &&
            job.handymanId && // רק עבודות ששובצו
            job.status !== "open" && // לא עבודות פתוחות
            (job.status !== "done" || // לא עבודות שהושלמו (או...)
              (job.status === "done" && !job.clientApproved)) // אלא אם כן צריך אישור לקוח
          );
        }
      });

      return assignedJobs;
    },
    currentAssignedJob() {
      // Return activeAssignedJob if set, otherwise return first from currentAssignedJobs
      // activeAssignedJob takes priority to ensure immediate chat opening
      if (
        this.activeAssignedJob &&
        (this.activeAssignedJob._id || this.activeAssignedJob.id)
      ) {
        // עבור הנדימן - לא מציגים עבודות שהושלמו
        if (this.isHendiman && this.activeAssignedJob.status === "done") {
          return null;
        }
        return this.activeAssignedJob;
      }
      if (this.currentAssignedJobs.length > 0) {
        return this.currentAssignedJobs[0];
      }
      return null;
    },
  },

  methods: {
    async getCurrentLocation() {
      return await getCurrentLocation();
    },
    handleResize() {
      this.isMobile = window.innerWidth <= 768;
    },
    async onRefresh() {
      const coords = this.userCoordinates;
      await this.store.fetchDashboardData(this.$route.params.id, coords);
      this.jobsPage = 1;
    },

    async fetchHandymanJobs(userData = null) {
      try {
        // השתמש בקואורדינטות לפי הבחירה של המשתמש
        const user = userData || this.store.user || this.me;
        let coordinates = null;

        if (this.handymanFilters.locationType === "myLocation") {
          // השתמש במיקום הנוכחי של ההנדימן (GPS)
          // אם אין geoCoordinates, נסה לקבל אותו מחדש
          if (!this.geoCoordinates) {
            try {
              const loc = await this.getCurrentLocation();
              this.geoCoordinates = { lat: loc.lat, lon: loc.lon };
            } catch (err) {
              // אם לא מצליח לקבל GPS, נשתמש במקום המגורים
              this.geoCoordinates = null;
            }
          }

          if (this.geoCoordinates) {
            coordinates = {
              lng: this.geoCoordinates.lon || this.geoCoordinates.lng,
              lat: this.geoCoordinates.lat,
            };
          } else {
            // Fallback למקום המגורים אם אין GPS
            coordinates = this.getResidenceCoordinates(user);
          }
        } else {
          // השתמש במקום המגורים של ההנדימן
          coordinates = this.getResidenceCoordinates(user);
        }
        // אם אין קואורדינטות, עדיין נטען עבודות (בלי סינון מרחק)
        await this.store.fetchFilteredJobsForHandyman({
          status: this.activeStatus,
          maxKm: this.handymanFilters.maxKm,
          coordinates: coordinates,
          workType: this.handymanFilters.workType || null,
          minPrice: this.handymanFilters.minPrice || null,
          maxPrice: this.handymanFilters.maxPrice || null,
        });
        // אחרי טעינת העבודות, בדוק אם יש עבודה משובצת
        this.$nextTick(() => {
          this.checkForAssignedJob();
        });
      } catch (error) {
        // גם אם יש שגיאה, נסה לטעון עבודות בלי סינון
        try {
          await this.store.fetchFilteredJobsForHandyman({
            status: this.activeStatus,
            maxKm: null,
            coordinates: null,
          });
        } catch (fallbackError) {}
      }
    },

    onOpenProfile() {
      this.profileForm = {
        name: this.store.user?.username || this.store.user?.name || "",
        phone: this.store.user?.phone || "",
        email: this.store.user?.email || "",
        city: this.store.user?.city || "",
        specialties: this.store.user?.specialties
          ? [...this.store.user.specialties]
          : [],
      };
      this.showProfileSheet = true;
    },

    onOpenHandymenChat() {},

    onOpenAllUsersChat() {},

    onPickStatus(v) {
      this.activeStatus = v;
      this.jobsPage = 1;
      if (this.isHendiman) {
        this.fetchHandymanJobs();
      }
    },

    onChangeKm(value) {
      this.handymanFilters.maxKm = parseInt(value);
      this.jobsPage = 1;
      if (this.isHendiman) {
        this.fetchHandymanJobs();
      }
    },

    onResetKm() {
      this.handymanFilters.maxKm = 25;
      this.jobsPage = 1;
      if (this.isHendiman) {
        this.fetchHandymanJobs();
      }
    },

    async onChangeLocationType(locationType) {
      this.handymanFilters.locationType = locationType;
      this.jobsPage = 1;

      // אם בוחרים "המיקום שלי", קבל את המיקום הנוכחי מה-GPS
      if (locationType === "myLocation" && this.isHendiman) {
        try {
          const loc = await this.getCurrentLocation();
          this.geoCoordinates = { lat: loc.lat, lon: loc.lon };
        } catch (err) {
          // אם לא מצליח לקבל GPS, נשתמש במקום המגורים
          this.geoCoordinates = null;
        }
      }

      if (this.isHendiman) {
        this.fetchHandymanJobs();
      }
    },

    onChangeWorkType(workType) {
      this.handymanFilters.workType = workType;
      this.jobsPage = 1;
      if (this.isHendiman) {
        this.fetchHandymanJobs();
      }
    },
    onChangePriceRange({ minPrice, maxPrice }) {
      this.handymanFilters.minPrice = minPrice;
      this.handymanFilters.maxPrice = maxPrice;
      this.jobsPage = 1;
      if (this.isHendiman) {
        this.fetchHandymanJobs();
      }
    },

    getResidenceCoordinates(user) {
      if (!user) return null;

      if (user.location && user.location.coordinates) {
        return {
          lng: user.location.coordinates[0],
          lat: user.location.coordinates[1],
        };
      } else if (user.coordinates) {
        return {
          lng: user.coordinates.lng,
          lat: user.coordinates.lat,
        };
      } else if (user.Coordinates) {
        return {
          lng: user.Coordinates.lng,
          lat: user.Coordinates.lat,
        };
      }
      return null;
    },

    onOpenJobMenu(job) {},

    onOpenJobChat(job) {},

    onOpenUserChat(userId) {},

    onSkip(job) {
      const handymanId = this.store.user?._id || this.me?.id;
      if (!handymanId) return;
      axios
        .post(`${URL}/jobs/skip`, {
          jobId: job._id || job.id,
          handymanId,
        })
        .then(() => {
          this.fetchHandymanJobs();
        })
        .catch(() => {});
    },

    async onAccept(job) {
      const handymanId = this.store.user?._id || this.me?.id;
      if (!handymanId) return;

      const jobId = job._id || job.id;
      // Set loading state
      this.acceptingJobId = jobId;

      try {
        const { data } = await axios.post(`${URL}/jobs/accept`, {
          jobId: jobId,
          handymanId,
        });

        // Check if handyman needs to complete Stripe onboarding
        if (data.needsOnboarding && data.onboardingUrl) {
          console.log(
            "[Dashboard] Handyman needs onboarding, URL:",
            data.onboardingUrl
          );
          // Store onboarding URL for later use (can be shown in JobChat)
          this.toast?.showInfo(
            "עליך להשלים את הגדרת חשבון התשלומים כדי לקבל תשלומים. לחץ על 'הגדר תשלומים' בצ'אט."
          );
        }

        // Update the job immediately with the new status
        // Make sure to preserve _id and all other fields
        // Handle handymanId and handymanName as arrays
        let handymanIdArray = [];
        let handymanNameArray = [];

        if (job.handymanId) {
          if (Array.isArray(job.handymanId)) {
            handymanIdArray = [...job.handymanId];
          } else {
            handymanIdArray = [job.handymanId];
          }
        }

        if (job.handymanName) {
          if (Array.isArray(job.handymanName)) {
            handymanNameArray = [...job.handymanName];
          } else {
            handymanNameArray = [job.handymanName];
          }
        }

        // Add new handyman if not already in array
        const handymanIdStr = String(handymanId);
        const existingIndex = handymanIdArray.findIndex(
          (id) => String(id) === handymanIdStr
        );

        const handymanName = this.store.user?.username || this.me?.name || "";
        if (existingIndex === -1) {
          handymanIdArray.push(handymanIdStr);
          handymanNameArray.push(handymanName);
        } else {
          handymanNameArray[existingIndex] = handymanName;
        }

        const updatedJob = {
          ...job,
          _id: job._id || jobId,
          id: job.id || jobId,
          status: "assigned",
          handymanId: handymanIdArray,
          handymanName: handymanNameArray,
        };

        // Open chat immediately with the updated job - do this FIRST!
        // Create a fresh copy to ensure reactivity
        this.activeAssignedJob = { ...updatedJob };
        this.isChatMinimized = false;

        // Update the job in store immediately so currentAssignedJobs includes it
        if (this.store.jobs) {
          const jobIndex = this.store.jobs.findIndex(
            (j) => String(j._id || j.id) === String(jobId)
          );
          if (jobIndex !== -1) {
            // Update existing job - direct assignment works with Vue 3 reactivity
            this.store.jobs[jobIndex] = updatedJob;
          } else {
            // Add new job if not found
            this.store.jobs.push(updatedJob);
          }
        } else {
          this.store.setJobs([updatedJob]);
        }

        // Vue reactivity should handle the update automatically
        // Use nextTick to ensure DOM updates after reactivity
        await this.$nextTick();

        // Refresh handyman jobs (same as mounted) - without page refresh
        if (this.isHendiman) {
          try {
            await this.fetchHandymanJobs(this.store.user || this.me);
          } catch (error) {
            // Silent fail - jobs are already updated locally
          }
        }

        // Clear loading state after everything is done
        this.acceptingJobId = null;
      } catch (error) {
        // Clear loading state on error
        this.acceptingJobId = null;
        this.toast?.showError("שגיאה בקבלת העבודה");
      }
    },

    onView(job) {
      this.jobDetails = job;
    },
    onEditJob(job) {
      // Set the job to edit and initialize form
      this.jobToEdit = job;
      this.initializeEditForm(job);
      this.showEditJobModal = true;
    },
    initializeEditForm(job) {
      // Initialize edit form with job data
      this.editJobForm = {
        subcategoryInfo: Array.isArray(job.subcategoryInfo)
          ? [...job.subcategoryInfo]
          : job.subcategoryInfo
          ? [job.subcategoryInfo]
          : [],
        desc: job.desc || "",
        locationText: job.locationText || "",
        houseNumber: job.houseNumber || "",
        when:
          job.when === "asap"
            ? "asap"
            : job.when === "today"
            ? "today"
            : "other",
        workType: job.workType || "קלה",
        urgent: job.urgent || false,
        imageUrl: Array.isArray(job.imageUrl)
          ? [...job.imageUrl]
          : job.imageUrl
          ? [job.imageUrl]
          : [],
        selectedMapLocation: job.coordinates
          ? { lat: job.coordinates.lat, lng: job.coordinates.lng }
          : null,
        usingMyLocation: job.locationText === "המיקום שלי",
        locationEnglishName: job.locationEnglishName || null,
        selectedCity: null,
        locationError: null,
      };
    },
    closeEditJobModal() {
      this.showEditJobModal = false;
      this.jobToEdit = null;
      this.editJobForm = {
        subcategoryInfo: [],
        desc: "",
        locationText: "",
        houseNumber: "",
        when: "asap",
        workType: "קלה",
        urgent: false,
        imageUrl: [],
        selectedMapLocation: null,
        usingMyLocation: false,
        locationEnglishName: null,
        selectedCity: null,
        locationError: null,
      };
    },
    async saveJobChanges() {
      if (!this.jobToEdit) return;

      // Validate location
      if (
        !this.editJobForm.selectedMapLocation &&
        this.editJobForm.locationText &&
        !this.isValidCity(this.editJobForm.locationText) &&
        this.editJobForm.locationText !== "המיקום שלי"
      ) {
        this.editJobForm.locationError =
          "ישוב זה לא נמצא במאגר. בחר ישוב מהרשימה או לחץ על 'לפי מיקום'";
        this.toast?.showError(this.editJobForm.locationError);
        return;
      }

      this.isSavingJob = true;
      try {
        const jobId = this.jobToEdit._id || this.jobToEdit.id;
        // Combine location with house number if exists
        let finalLocationText = this.editJobForm.locationText;
        if (
          this.editJobForm.houseNumber &&
          this.editJobForm.houseNumber.trim() &&
          this.editJobForm.locationText !== "המיקום שלי"
        ) {
          finalLocationText = `${
            this.editJobForm.locationText
          } ${this.editJobForm.houseNumber.trim()}`;
        }

        const updateData = {
          subcategoryInfo: this.editJobForm.subcategoryInfo,
          desc: this.editJobForm.desc,
          locationText: finalLocationText,
          houseNumber: this.editJobForm.houseNumber || "",
          when: this.editJobForm.when,
          workType: this.editJobForm.workType,
          urgent: this.editJobForm.urgent,
          imageUrl: this.editJobForm.imageUrl,
        };

        // Add locationEnglishName if available
        if (this.editJobForm.locationEnglishName) {
          updateData.locationEnglishName = this.editJobForm.locationEnglishName;
        }

        // Add coordinates if map location was selected or if coordinates exist
        if (this.editJobForm.selectedMapLocation) {
          updateData.coordinates = {
            lng: this.editJobForm.selectedMapLocation.lng,
            lat: this.editJobForm.selectedMapLocation.lat,
          };
        } else if (this.editJobForm.coordinates) {
          updateData.coordinates = this.editJobForm.coordinates;
        }

        const response = await axios.put(
          `${URL}/jobs/${jobId}`,
          {
            ...updateData,
            userId: this.store.user?._id || this.me?._id,
          },
          {
            headers: { "Content-Type": "application/json" },
          }
        );

        if (response.data.success) {
          this.toast?.showSuccess("העבודה עודכנה בהצלחה");
          this.closeEditJobModal();
          // Refresh jobs list
          await this.onRefresh();
        } else {
          this.toast?.showError(response.data.message || "שגיאה בעדכון העבודה");
        }
      } catch (error) {
        console.error("Error updating job:", error);
        this.toast?.showError(
          error.response?.data?.message || "שגיאה בעדכון העבודה"
        );
      } finally {
        this.isSavingJob = false;
      }
    },
    removeEditImage(index) {
      this.editJobForm.imageUrl.splice(index, 1);
    },
    async handleEditImageUpload(event) {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) return;

      const remainingSlots = 4 - this.editJobForm.imageUrl.length;
      const filesToUpload = files.slice(0, remainingSlots);

      for (const file of filesToUpload) {
        try {
          const formData = new FormData();
          formData.append("image", file);

          const { data } = await axios.post(`${URL}/upload-image`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });

          if (data.imageUrl) {
            this.editJobForm.imageUrl.push(data.imageUrl);
          }
        } catch (error) {
          this.toast?.showError("שגיאה בהעלאת תמונה");
        }
      }

      // Reset input
      if (event.target) {
        event.target.value = "";
      }
    },
    openEditSubcategories() {
      // TODO: Implement subcategories editor (similar to CreateCall manual selector)
      this.toast?.showInfo("עריכת תחומים - יישום בהמשך");
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
    onEditLocationChange(value) {
      this.editJobForm.locationText = value;
      this.editJobForm.locationError = null;
      // Clear house number if location text changes (user is typing new location)
      if (
        !this.editJobForm.selectedMapLocation &&
        value &&
        value.trim() !== ""
      ) {
        if (!this.isValidCity(value) && value !== "המיקום שלי") {
          this.editJobForm.locationError =
            "ישוב זה לא נמצא במאגר. בחר ישוב מהרשימה או לחץ על 'לפי מיקום'";
        }
      }
      // If location is "המיקום שלי", clear house number
      if (value === "המיקום שלי") {
        this.editJobForm.houseNumber = "";
        this.editJobForm.usingMyLocation = true;
      } else {
        this.editJobForm.usingMyLocation = false;
      }
    },
    onEditEnglishNameUpdate(value) {
      this.editJobForm.locationEnglishName = value;
    },
    onEditCitySelected(city) {
      if (city) {
        this.editJobForm.locationText = city.name || city.שם_ישוב || "";
        this.editJobForm.locationEnglishName =
          city.english_name || city.שם_ישוב_לועזי || null;
        if (city.coordinates) {
          this.editJobForm.coordinates = {
            lat: city.coordinates.lat || city.coordinates[1],
            lng: city.coordinates.lng || city.coordinates[0],
          };
        }
        this.editJobForm.locationError = null;
      }
    },
    clearEditMapLocation() {
      this.editJobForm.selectedMapLocation = null;
      this.editJobForm.locationText = "";
      this.editJobForm.houseNumber = "";
      this.editJobForm.locationEnglishName = null;
      this.editJobForm.coordinates = null;
      this.editJobForm.usingMyLocation = false;
      this.editJobForm.locationError = null;
    },
    setEditMyLocation() {
      this.editJobForm.locationText = "המיקום שלי";
      this.editJobForm.houseNumber = "";
      this.editJobForm.usingMyLocation = true;
      this.editJobForm.selectedMapLocation = null;
      this.editJobForm.locationEnglishName = null;
      this.editJobForm.locationError = null;
      if (this.geoCoordinates) {
        this.editJobForm.coordinates = {
          lat: this.geoCoordinates.lat,
          lng: this.geoCoordinates.lon,
        };
      }
    },
    clearEditMyLocation() {
      this.editJobForm.locationText = "";
      this.editJobForm.houseNumber = "";
      this.editJobForm.usingMyLocation = false;
      this.editJobForm.locationEnglishName = null;
      this.editJobForm.coordinates = null;
      this.editJobForm.locationError = null;
    },
    openEditMapPicker() {
      this.showEditMapPicker = true;
      this.$nextTick(() => {
        this.initEditMapPicker();
      });
    },
    closeEditMapPicker() {
      this.showEditMapPicker = false;
      if (this.editMapPicker) {
        this.editMapPicker.remove();
        this.editMapPicker = null;
        this.editMapMarker = null;
      }
    },
    initEditMapPicker() {
      const loadLeaflet = () => {
        if (typeof window.L !== "undefined") {
          this.createEditMap();
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
                this.createEditMap();
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
              this.createEditMap();
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
    createEditMap() {
      if (typeof window.L === "undefined") {
        this.toast?.showError("שגיאה בטעינת המפה. נסה שוב.");
        return;
      }

      const mapContainer = document.getElementById("editMapPicker");
      if (!mapContainer) {
        return;
      }

      if (this.editMapPicker) {
        this.editMapPicker.remove();
        this.editMapPicker = null;
        this.editMapMarker = null;
      }

      // Use existing job location or default to Tel Aviv
      const defaultLat =
        this.editJobForm.coordinates?.lat ||
        this.editJobForm.selectedMapLocation?.lat ||
        32.0853;
      const defaultLng =
        this.editJobForm.coordinates?.lng ||
        this.editJobForm.selectedMapLocation?.lng ||
        34.7818;

      try {
        this.editMapPicker = window.L.map("editMapPicker", {
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
        ).addTo(this.editMapPicker);

        this.editMapMarker = window.L.marker([defaultLat, defaultLng], {
          draggable: true,
        }).addTo(this.editMapPicker);

        this.editMapMarker.on("dragend", () => {
          const position = this.editMapMarker.getLatLng();
          this.editJobForm.selectedMapLocation = {
            lat: position.lat,
            lng: position.lng,
          };
        });

        this.editMapPicker.on("click", (e) => {
          const { lat, lng } = e.latlng;
          this.editJobForm.selectedMapLocation = { lat, lng };
          if (this.editMapMarker) {
            this.editMapMarker.setLatLng([lat, lng]);
          }
        });
      } catch (error) {
        console.error("Error creating map:", error);
        this.toast?.showError("שגיאה ביצירת המפה. נסה שוב.");
      }
    },
    async confirmEditMapLocation() {
      if (!this.editJobForm.selectedMapLocation) {
        this.toast?.showError("נא לבחור מיקום במפה");
        return;
      }

      try {
        // Reverse geocode to get address
        const { lat, lng } = this.editJobForm.selectedMapLocation;
        const response = await axios.get(`${URL}/reverse-geocode`, {
          params: {
            lat: lat,
            lng: lng,
          },
        });

        if (response.data && response.data.success) {
          this.editJobForm.locationText =
            response.data.fullAddress ||
            response.data.address ||
            response.data.city ||
            "מיקום שנבחר במפה";
          this.editJobForm.locationEnglishName =
            response.data.fullAddress || response.data.city || null;
        }

        this.editJobForm.coordinates = {
          lat: lat,
          lng: lng,
        };

        // Clear house number and usingMyLocation when map location is selected
        this.editJobForm.houseNumber = "";
        this.editJobForm.usingMyLocation = false;
        this.editJobForm.locationError = null;
        this.closeEditMapPicker();
      } catch (error) {
        console.error("Error reverse geocoding:", error);
        // Even if reverse geocoding fails, use coordinates
        this.editJobForm.coordinates = {
          lat: this.editJobForm.selectedMapLocation.lat,
          lng: this.editJobForm.selectedMapLocation.lng,
        };
        // Clear house number and usingMyLocation when map location is selected
        this.editJobForm.houseNumber = "";
        this.editJobForm.usingMyLocation = false;
        this.editJobForm.locationError = null;
        this.closeEditMapPicker();
      }
    },
    onDeleteJob(job) {
      // Set the job to delete and open delete confirmation modal
      this.jobToDelete = job;
      this.showDeleteJobModal = true;
    },
    async confirmDeleteJob() {
      if (!this.jobToDelete) return;

      this.isDeletingJob = true;
      try {
        const jobId = this.jobToDelete._id || this.jobToDelete.id;
        const response = await axios.delete(`${URL}/jobs/${jobId}`, {
          data: {
            userId: this.store.user?._id || this.me?._id,
          },
        });

        if (response.data.success) {
          this.toast?.showSuccess("העבודה נמחקה בהצלחה");
          this.showDeleteJobModal = false;
          this.jobToDelete = null;
          // Refresh jobs list
          await this.onRefresh();
        } else {
          this.toast?.showError(response.data.message || "שגיאה במחיקת העבודה");
        }
      } catch (error) {
        console.error("Error deleting job:", error);
        this.toast?.showError(
          error.response?.data?.message || "שגיאה במחיקת העבודה"
        );
      } finally {
        this.isDeletingJob = false;
      }
    },
    onJobsNextPage() {
      if (this.jobsPagination.hasNext) {
        this.jobsPage = this.jobsPagination.page + 1;
      }
    },
    onJobsPrevPage() {
      if (this.jobsPagination.hasPrev) {
        this.jobsPage = this.jobsPagination.page - 1;
      }
    },
    async onJobStatusUpdated(newStatus) {
      // Update the job in store immediately
      const jobId = this.activeAssignedJob?._id || this.activeAssignedJob?.id;
      if (jobId && this.store.jobs) {
        const jobIndex = this.store.jobs.findIndex(
          (j) => String(j._id || j.id) === String(jobId)
        );
        if (jobIndex !== -1) {
          // Update job in store
          this.store.jobs[jobIndex] = {
            ...this.store.jobs[jobIndex],
            status: newStatus,
          };
        }
      }

      // If job is marked as done and user is handyman, close the chat (even if minimized)
      if (newStatus === "done" && this.isHendiman) {
        this.activeAssignedJob = null;
        this.isChatMinimized = false;
        // Refresh to update job list
        await this.onRefresh();
      }
    },

    async onCancelJob() {
      // Update the job in store - set handymanId and handymanName to null
      const jobId = this.activeAssignedJob?._id || this.activeAssignedJob?.id;
      if (jobId && this.store.jobs) {
        const jobIndex = this.store.jobs.findIndex(
          (j) => String(j._id || j.id) === String(jobId)
        );
        if (jobIndex !== -1) {
          // Update job in store - set handymanId and handymanName to null
          const updatedJob = { ...this.store.jobs[jobIndex] };
          updatedJob.handymanId = null;
          updatedJob.handymanName = null;
          updatedJob.status = "open";
          // In Vue 3, direct assignment works with reactivity
          this.store.jobs[jobIndex] = updatedJob;
        }
      }
      // Clear the assigned job to close the chat
      this.activeAssignedJob = null;
      this.isChatMinimized = false;
      // Refresh jobs list to get updated status
      await this.onRefresh();
    },

    handleJobCancelledClose() {
      this.showJobCancelledModal = false;
    },

    async onRatingSubmitted() {
      // Save jobId before closing
      const jobId = this.activeAssignedJob?._id || this.activeAssignedJob?.id;

      // Update store jobs to mark rating as submitted
      if (this.store.jobs && jobId) {
        const jobIndex = this.store.jobs.findIndex(
          (j) => String(j._id || j.id) === String(jobId)
        );
        if (jobIndex !== -1 && this.store.jobs[jobIndex]) {
          this.store.jobs[jobIndex].ratingSubmitted = true;
        }
      }

      // Refresh after rating to update job data
      await this.onRefresh();
      // Close chat after rating
      this.activeAssignedJob = null;
    },
    // בדוק עבודה משובצת ישירות מנתונים שנטענו (לשימוש ב-mounted)
    checkForAssignedJobFromData(data) {
      const userId = this.store.user?._id || this.me?._id;
      if (!userId || !data) return;

      // בדוק ישירות בנתונים הראשוניים (data.Jobs) שמכילים את כל העבודות
      const allJobs = data.Jobs || [];
      const userIdStr = String(userId);
      const assignedJob = allJobs.find((job) => {
        if (this.isHendiman) {
          // עבור הנדימן - בודק אם handymanId תואם (תמיכה במערך)
          let isHandymanInJob = false;
          if (job.handymanId) {
            if (Array.isArray(job.handymanId)) {
              isHandymanInJob = job.handymanId.some(
                (id) => String(id) === userIdStr
              );
            } else {
              isHandymanInJob = String(job.handymanId) === userIdStr;
            }
          }
          // כל עבודה שלא בסטטוס "open" ולא בסטטוס "done" צריכה להיפתח
          return (
            isHandymanInJob &&
            job.status !== "open" && // לא עבודות פתוחות
            job.status !== "done" // לא עבודות שהושלמו
          );
        } else {
          // עבור לקוח - בודק אם clientId תואם
          // כל עבודה שלא בסטטוס "open" ולא בסטטוס "done" צריכה להיפתח
          return (
            job.clientId &&
            String(job.clientId) === userIdStr &&
            job.handymanId && // רק עבודות ששובצו
            job.status !== "open" && // לא עבודות פתוחות
            job.status !== "done" // לא עבודות שהושלמו
          );
        }
      });

      // Only set activeAssignedJob if it's a valid active job
      // Don't set if it's a done job (even if rating not submitted, it shouldn't auto-open)
      if (assignedJob && !this.activeAssignedJob) {
        // Don't auto-open done jobs - client should open them manually from the list
        if (assignedJob.status !== "done") {
          this.activeAssignedJob = assignedJob;
          this.isChatMinimized = false; // Ensure chat is not minimized when auto-opening
        }
      }
    },
    async checkForAssignedJob() {
      // בדוק ישירות ב-store.jobs אם יש עבודה משובצת
      const userId = this.store.user?._id || this.me?._id;
      if (!userId) return;

      // קודם נבדוק ב-store.jobs הקיים
      let allJobs = this.store.jobs || [];
      const userIdStr = String(userId);
      let assignedJob = allJobs.find((job) => {
        if (this.isHendiman) {
          // עבור הנדימן - בודק אם handymanId תואם (תמיכה במערך)
          let isHandymanInJob = false;
          if (job.handymanId) {
            if (Array.isArray(job.handymanId)) {
              isHandymanInJob = job.handymanId.some(
                (id) => String(id) === userIdStr
              );
            } else {
              isHandymanInJob = String(job.handymanId) === userIdStr;
            }
          }
          // כל עבודה שלא בסטטוס "open" ולא בסטטוס "done" צריכה להיפתח
          return (
            isHandymanInJob &&
            job.status !== "open" && // לא עבודות פתוחות
            job.status !== "done" // לא עבודות שהושלמו
          );
        } else {
          // עבור לקוח - בודק אם clientId תואם
          // כל עבודה שלא בסטטוס "open" ולא בסטטוס "done" צריכה להיפתח
          return (
            job.clientId &&
            String(job.clientId) === userIdStr &&
            job.handymanId && // רק עבודות ששובצו
            job.status !== "open" && // לא עבודות פתוחות
            job.status !== "done" // לא עבודות שהושלמו
          );
        }
      });

      // אם לא מצאנו עבודה משובצת
      if (!assignedJob) {
        // רק אם store.jobs ריק, נטען מחדש
        // אם יש עבודות ב-store אבל הן לא משובצות (כי הן ב-Done עם ratingSubmitted), לא נטען שוב
        if (!allJobs.length) {
          try {
            // רק עבור הנדימן - נטען שוב כי fetchFilteredJobsForHandyman עלול להחליף את store.jobs
            // עבור לקוח - לא נטען שוב כדי לא לגרום ל-loading מיותר
            if (this.isHendiman) {
              const dashboardData = await this.store.fetchDashboardData(
                this.$route.params.id,
                this.userCoordinates
              );
              if (dashboardData && dashboardData.Jobs) {
                allJobs = dashboardData.Jobs || [];
                assignedJob = allJobs.find((job) => {
                  // עבור הנדימן - בודק אם handymanId תואם (תמיכה במערך)
                  // לא מציגים עבודות שהושלמו
                  let isHandymanInJob = false;
                  if (job.handymanId) {
                    if (Array.isArray(job.handymanId)) {
                      isHandymanInJob = job.handymanId.some(
                        (id) => String(id) === userIdStr
                      );
                    } else {
                      isHandymanInJob = String(job.handymanId) === userIdStr;
                    }
                  }
                  return (
                    isHandymanInJob &&
                    (job.status === "assigned" ||
                      job.status === "on_the_way" ||
                      job.status === "in_progress")
                    // עבור הנדימן - לא מציגים עבודות עם status "done"
                  );
                });
              }
            }
          } catch (error) {}
        }
      }

      // Only set activeAssignedJob if it's a valid active job
      // Don't set if it's a done job (even if rating not submitted, it shouldn't auto-open)
      if (assignedJob && !this.activeAssignedJob) {
        // Don't auto-open done jobs - client should open them manually from the list
        if (assignedJob.status !== "done") {
          this.activeAssignedJob = assignedJob;
        }
      }
      // Note: We don't clear activeAssignedJob here to prevent clearing it
      // right after setting it in onAccept
    },
    initWebSocket() {
      // Connect to WebSocket server
      this.socket = io(URL, {
        transports: ["websocket", "polling"],
      });

      this.socket.on("connect", () => {
        console.log("[Dashboard] WebSocket connected");
        // Join user's personal room (for receiving job-accepted events)
        const userId = this.store.user?._id || this.me?.id;
        if (userId) {
          const userIdString = String(userId);
          console.log("[Dashboard] Joining user room:", `user-${userIdString}`);
          this.socket.emit("join-user", userIdString);
        } else {
          console.warn("[Dashboard] No userId found - cannot join user room");
        }

        // Join all jobs that belong to this user
        if (userId && this.store.jobs) {
          console.log(
            `[Dashboard] Joining ${this.store.jobs.length} job room(s)...`
          );
          this.store.jobs.forEach((job) => {
            const jobId = job._id || job.id;
            if (jobId) {
              const jobIdString = String(jobId);
              console.log(
                "[Dashboard] Joining job room:",
                `job-${jobIdString}`
              );
              this.socket.emit("join-job", jobIdString);
            }
          });
        }
      });

      // Listen for job accepted event (for both clients and handymen)
      this.socket.on("job-accepted", async (data) => {
        const jobId = String(data.jobId || "");
        const userId = this.store.user?._id || this.me?.id;

        if (!userId) return;

        if (!this.isHendiman) {
          // For client: check if this is their job
          // Refresh to get updated job data
          await this.onRefresh();
          // Find the accepted job
          const acceptedJob = this.store.jobs?.find(
            (j) => String(j._id || j.id) === jobId
          );
          // Only open chat if this job belongs to the current client
          if (
            acceptedJob &&
            !this.activeAssignedJob &&
            String(acceptedJob.clientId || acceptedJob.client?._id || "") ===
              String(userId)
          ) {
            this.activeAssignedJob = acceptedJob;
            this.isChatMinimized = false; // Ensure chat is not minimized
          }
        } else {
          // For handyman: check if this is their job
          // Refresh to get updated job data
          await this.onRefresh();
          // Find the accepted job
          const acceptedJob = this.store.jobs?.find((j) => {
            const jId = j._id || j.id;
            if (!jId) return false;

            // Check if handymanId matches (support array)
            if (j.handymanId) {
              if (Array.isArray(j.handymanId)) {
                return j.handymanId.some((id) => String(id) === String(userId));
              } else {
                return String(j.handymanId) === String(userId);
              }
            }
            return false;
          });

          // Open chat if this job belongs to the current handyman
          // כל עבודה שלא בסטטוס "open" ולא בסטטוס "done" צריכה להיפתח
          if (
            acceptedJob &&
            !this.activeAssignedJob &&
            acceptedJob.status !== "open" &&
            acceptedJob.status !== "done"
          ) {
            this.activeAssignedJob = acceptedJob;
            this.isChatMinimized = false; // Ensure chat is not minimized
          }
        }
      });

      // Listen for job done event (for clients)
      console.log("[Dashboard] Registering job-done event listener...");
      // Track processed job-done events to prevent duplicate processing
      const processedJobDoneEvents = new Set();
      this.socket.on("job-done", async (data) => {
        console.log("[Dashboard] ✅ Received job-done event:", data);
        const jobId = String(data.jobId || "");

        // Prevent duplicate processing of the same event
        const eventKey = `${jobId}-${Date.now()}`;
        if (processedJobDoneEvents.has(jobId)) {
          console.log(
            "[Dashboard] ⚠️ Duplicate job-done event ignored for jobId:",
            jobId
          );
          return;
        }
        processedJobDoneEvents.add(jobId);

        // Clean up old entries (keep only last 10)
        if (processedJobDoneEvents.size > 10) {
          const firstEntry = Array.from(processedJobDoneEvents)[0];
          processedJobDoneEvents.delete(firstEntry);
        }

        if (!this.isHendiman) {
          // For client: check if this is their job
          const userId = this.store.user?._id || this.me?.id;
          console.log("[Dashboard] Client userId:", userId, "jobId:", jobId);
          if (userId) {
            // Refresh to get updated job data
            console.log("[Dashboard] Refreshing jobs data...");
            await this.onRefresh();

            // Log all jobs after refresh for debugging
            console.log(
              "[Dashboard] Total jobs after refresh:",
              this.store.jobs?.length || 0
            );
            console.log("[Dashboard] Looking for jobId:", jobId);
            if (this.store.jobs && this.store.jobs.length > 0) {
              console.log(
                "[Dashboard] Available job IDs:",
                this.store.jobs.map((j) => String(j._id || j.id))
              );
            }

            // First check cache, then store
            let doneJob = this.doneJobsCache?.find(
              (j) => String(j._id || j.id) === jobId
            );
            if (!doneJob) {
              doneJob = this.store.jobs?.find(
                (j) => String(j._id || j.id) === jobId
              );
            }
            console.log(
              "[Dashboard] Done job found in cache/store:",
              doneJob ? "YES" : "NO"
            );

            // If job not found (because it's filtered out as "done" in GetDataDeshboard), fetch it directly from server
            if (!doneJob) {
              console.log(
                "[Dashboard] Job not found in store (likely filtered as 'done'), fetching directly from server..."
              );
              try {
                const { URL } = await import("@/Url/url");
                const response = await axios.get(`${URL}/jobs/${jobId}`);
                if (
                  response.data &&
                  response.data.success &&
                  response.data.job
                ) {
                  doneJob = response.data.job;
                  console.log(
                    "[Dashboard] ✅ Job fetched directly from server:",
                    {
                      status: doneJob.status,
                      clientApproved: doneJob.clientApproved,
                    }
                  );
                  // Add to store temporarily so it's available
                  if (!this.store.jobs) {
                    this.store.jobs = [];
                  }
                  // Check if job already exists in store before adding
                  const exists = this.store.jobs.some(
                    (j) => String(j._id || j.id) === jobId
                  );
                  if (!exists) {
                    this.store.jobs.push(doneJob);
                    console.log("[Dashboard] Job added to store");
                  }
                  // Also save in component data to persist after refresh
                  if (!this.doneJobsCache) {
                    this.doneJobsCache = [];
                  }
                  const existsInCache = this.doneJobsCache.some(
                    (j) => String(j._id || j.id) === jobId
                  );
                  if (!existsInCache) {
                    this.doneJobsCache.push(doneJob);
                    console.log("[Dashboard] Job added to cache");
                  }
                } else {
                  console.log(
                    "[Dashboard] ❌ Job not found in server response"
                  );
                }
              } catch (fetchError) {
                console.error(
                  "[Dashboard] ❌ Error fetching job directly:",
                  fetchError
                );
              }
            }

            if (doneJob) {
              console.log("[Dashboard] Done job details:", {
                id: doneJob._id || doneJob.id,
                status: doneJob.status,
                clientId: doneJob.clientId,
                clientIdType: typeof doneJob.clientId,
                userId: userId,
                userIdType: typeof userId,
                clientApproved: doneJob.clientApproved,
              });
            } else {
              console.log(
                "[Dashboard] ❌ Job still not found after direct fetch"
              );
            }
            // Only open chat if this job belongs to the current client
            if (
              doneJob &&
              String(doneJob.clientId || doneJob.client?._id || "") ===
                String(userId)
            ) {
              console.log("[Dashboard] Opening chat for done job:", jobId);
              // Open chat to show approval button
              this.activeAssignedJob = doneJob;
              this.isChatMinimized = false;
            } else {
              console.log(
                "[Dashboard] Job does not belong to this client or not found"
              );
            }
          } else {
            console.log(
              "[Dashboard] No userId found - cannot process job-done event"
            );
          }
        }
      });

      // Listen for onboarding required (when client approves and handyman needs onboarding)
      this.socket.on("onboarding-required", async (data) => {
        console.log("[Dashboard] Received onboarding-required event:", data);
        if (this.isHendiman && data.needsOnboarding) {
          console.log("[Dashboard] Showing onboarding modal for handyman");
          this.onboardingUrl = data.onboardingUrl;
          this.showOnboardingModal = true;
        }
      });

      // Listen for job-done event to show approval modal for client
      this.socket.on("job-done", async (data) => {
        console.log("[Dashboard] Received job-done event:", data);
        if (!this.isHendiman) {
          const jobId = String(data.jobId || "");
          console.log("[Dashboard] Client - looking for job:", jobId);
          // Refresh jobs to get latest data
          await this.onRefresh();
          // Check if this job needs approval
          const job = this.store.jobs?.find(
            (j) => String(j._id || j.id) === jobId
          );
          console.log(
            "[Dashboard] Found job after refresh:",
            job ? "YES" : "NO"
          );
          if (job) {
            console.log(
              "[Dashboard] Job status:",
              job.status,
              "clientApproved:",
              job.clientApproved
            );
          }
          if (job && job.status === "done" && !job.clientApproved) {
            console.log("[Dashboard] Showing approval modal for client");
            this.pendingApprovalJob = job;
            this.showClientApprovalModal = true;
          } else if (!job) {
            // If job not found in store, try to fetch it directly
            console.log(
              "[Dashboard] Job not found in store, fetching directly..."
            );
            try {
              const { URL } = await import("@/Url/url");
              const response = await axios.get(`${URL}/jobs/${jobId}`);
              if (response.data && response.data.success && response.data.job) {
                const fetchedJob = response.data.job;
                if (
                  fetchedJob.status === "done" &&
                  !fetchedJob.clientApproved
                ) {
                  console.log(
                    "[Dashboard] Showing approval modal for client (from direct fetch)"
                  );
                  this.pendingApprovalJob = fetchedJob;
                  this.showClientApprovalModal = true;
                }
              }
            } catch (fetchError) {
              console.error("[Dashboard] Error fetching job:", fetchError);
            }
          }
        }
      });

      // Listen for job cancelled event (for both clients and handymen)
      this.socket.on("job-cancelled", async (data) => {
        const jobId = String(data.jobId || "");
        const cancelledBy = data.cancelledBy || "handyman"; // "handyman" or "client"
        const userId = this.store.user?._id || this.me?.id;
        if (userId) {
          // Check if this is the currently assigned job
          const currentJobId =
            this.activeAssignedJob?._id || this.activeAssignedJob?.id;
          if (currentJobId && String(currentJobId) === jobId) {
            // Close the chat
            this.activeAssignedJob = null;
            this.isChatMinimized = false;
            // Show modal with appropriate message
            if (
              (this.isHendiman && cancelledBy === "client") ||
              (!this.isHendiman && cancelledBy === "handyman")
            ) {
              this.cancelledBy = cancelledBy;
              this.showJobCancelledModal = true;
            }
            // Refresh to get updated job data
            await this.onRefresh();
          }
        }
      });

      // Listen for onboarding required (when client approves and handyman needs onboarding)
      this.socket.on("onboarding-required", async (data) => {
        console.log("[Dashboard] Received onboarding-required event:", data);
        console.log("[Dashboard] isHendiman:", this.isHendiman);
        if (this.isHendiman && data.needsOnboarding) {
          console.log("[Dashboard] Showing onboarding modal for handyman");
          // Store onboarding URL and show modal (even if URL is null, show message)
          this.onboardingUrl = data.onboardingUrl;
          this.showOnboardingModal = true;
        }
      });

      // Listen for job-approved event (when client approves job)
      this.socket.on("job-approved", async (data) => {
        console.log("[Dashboard] Received job-approved event:", data);
        if (this.isHendiman) {
          const jobId = String(data.jobId || "");
          // Refresh jobs to get latest data
          await this.onRefresh();
          // Check if this job needs onboarding
          const job = this.store.jobs?.find(
            (j) => String(j._id || j.id) === jobId
          );
          if (
            job &&
            job.status === "done" &&
            job.clientApproved === true &&
            !job.handymanReceivedPayment
          ) {
            console.log(
              "[Dashboard] Handyman - job approved, fetching onboarding link"
            );
            await this.fetchOnboardingLinkForJob(job);
          }
        }
      });
    },
    async fetchOnboardingLinkForJob(job) {
      if (!job || !this.isHendiman) return;

      const handymanId = this.store.user?._id || this.me?.id;
      if (!handymanId) return;

      try {
        const { URL } = await import("@/Url/url");
        const response = await axios.post(
          `${URL}/api/handyman/stripe/onboarding-link`,
          { handymanId: String(handymanId) }
        );
        if (response.data && response.data.success && response.data.url) {
          this.onboardingUrl = response.data.url;
          this.showOnboardingModal = true;
        } else {
          // Even if no URL, show modal with message
          this.onboardingUrl = null;
          this.showOnboardingModal = true;
        }
      } catch (error) {
        console.error("Error fetching onboarding link:", error);
        // Show modal even if error (with message that they need to contact support)
        this.onboardingUrl = null;
        this.showOnboardingModal = true;
      }
    },
    async handleClientApprove() {
      if (!this.pendingApprovalJob) return;

      const jobId = this.pendingApprovalJob._id || this.pendingApprovalJob.id;
      const clientId = this.store.user?._id || this.me?.id;

      if (!jobId || !clientId) {
        this.toast?.showError("שגיאה: חסרים פרטים לאישור העבודה");
        return;
      }

      try {
        const { URL } = await import("@/Url/url");
        const response = await axios.post(`${URL}/api/jobs/approve`, {
          jobId,
          clientId,
        });

        if (response.data && response.data.success) {
          this.toast?.showSuccess("העבודה אושרה והתשלום שוחרר");
          this.showClientApprovalModal = false;
          this.pendingApprovalJob = null;
          // Refresh jobs data
          await this.onRefresh();
        } else {
          this.toast?.showError(
            response.data?.message || "שגיאה באישור העבודה"
          );
        }
      } catch (error) {
        console.error("Error approving job:", error);
        this.toast?.showError(
          error.response?.data?.message || "שגיאה באישור העבודה"
        );
      }
    },
    handleClientReject() {
      this.showClientApprovalModal = false;
      this.pendingApprovalJob = null;
    },
    openOnboardingLink() {
      if (this.onboardingUrl) {
        window.open(this.onboardingUrl, "_blank");
        this.showOnboardingModal = false;
      } else {
        this.toast?.showError(
          "קישור הגדרת תשלומים לא זמין. נסה שוב מאוחר יותר."
        );
      }
    },
    disconnectWebSocket() {
      if (this.socket) {
        // Leave all job rooms
        const userId = this.store.user?._id || this.me?.id;
        if (userId && this.store.jobs) {
          this.store.jobs.forEach((job) => {
            const jobId = job._id || job.id;
            if (jobId) {
              this.socket.emit("leave-job", String(jobId));
            }
          });
        }
        this.socket.disconnect();
        this.socket = null;
      }
    },
    onCreateCallCta() {
      this.$router.push({
        name: "CreateCall",
        params: { id: this.$route.params.id },
      });
    },
    onGoProfile() {
      this.onOpenProfile();
    },
    onViewRatings() {
      this.$router.push({
        name: "HandymanRatings",
        params: { id: this.$route.params.id },
      });
    },

    onReturnToJob() {
      this.isChatMinimized = false;
    },

    async onLogout() {
      try {
        // Clear store data
        this.store.user = null;
        this.store.jobs = [];

        // Redirect to home
        this.$router.push("/");
      } catch (error) {
        // Even if there's an error, redirect to home
        this.$router.push("/");
      }
    },

    async enablePushNotifications() {
      // Check if browser supports notifications
      if (!("Notification" in window) || !("serviceWorker" in navigator)) {
        return;
      }

      // If permission is denied, don't try to get token
      if (Notification.permission === "denied") {
        return;
      }

      try {
        // If permission is default, request it
        if (Notification.permission === "default") {
          const permission = await Notification.requestPermission();
          if (permission !== "granted") {
            return; // User denied permission
          }
        }

        // Wait for service worker to be ready
        let registration = await navigator.serviceWorker.ready;

        // Register or update service worker (force update check)
        registration = await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js",
          { updateViaCache: "none" } // Always check for updates
        );

        // Handle service worker updates and ensure it's active
        if (registration.waiting) {
          // If there's a waiting service worker, skip waiting
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
          // Wait a bit for it to activate
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        if (registration.installing) {
          // Wait for installation and activation to complete
          await new Promise((resolve, reject) => {
            const serviceWorker = registration.installing;
            if (!serviceWorker) {
              resolve();
              return;
            }

            serviceWorker.addEventListener("statechange", function () {
              if (this.state === "activated") {
                resolve();
              } else if (this.state === "redundant") {
                reject(new Error("Service worker installation failed"));
              }
            });
          });
        } else if (registration.active) {
          // If service worker is already active, wait a moment to ensure it's ready
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        // Ensure service worker is ready
        registration = await navigator.serviceWorker.ready;

        // Get FCM token (this will always get the current token, even if it changed)
        if (messaging) {
          try {
            const token = await getToken(messaging, {
              vapidKey: VAPID_KEY,
              serviceWorkerRegistration: registration,
            });

            if (token) {
              // Always update the token on server (even if it's the same or changed)
              await this.saveTokenToServer(token);
            }
          } catch (tokenError) {
            // Token error - might be permission issue or service worker issue
          }

          // Set up message handler for when app is in foreground
          onMessage(messaging, (payload) => {
            // Show notification when app is open
            const notificationTitle =
              payload.notification?.title || "הודעה חדשה";
            const notificationBody =
              payload.notification?.body || "יש לך הודעה חדשה";

            // Show browser notification
            if (
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              new Notification(notificationTitle, {
                body: notificationBody,
                icon: payload.notification?.icon || "/icon-192x192.png",
                badge: "/icon-192x192.png",
                dir: "rtl",
                tag: payload.data?.jobId || "default",
              });
            }
          });
        }
      } catch (error) {
        // Silently fail if notification setup fails
      }
    },

    async saveTokenToServer(token) {
      try {
        const userId = this.store.user?._id || this.me?.id;
        if (!userId) return;

        await axios.post(`${URL}/save-fcm-token`, {
          userId: userId,
          fcmToken: token,
        });
      } catch (error) {}
    },

    onBlockHandyman(id) {},

    onPersonalRequest(id) {
      // Navigate to personal request page with handyman ID
      const userId = this.store.user?._id || this.$route.params.id;
      this.$router.push({
        name: "PersonalRequestCall",
        params: { id: userId, handymanId: id },
      });
    },

    async onSaveProfile(form) {
      const userId = this.store.user?._id;
      if (!userId) {
        this.toast?.showError("שגיאה: לא נמצא מזהה משתמש");
        return;
      }
      try {
        const res = await axios.post(`${URL}/user/update-profile`, {
          userId,
          username: form.name,
          phone: form.phone,
          email: form.email,
          city: form.city,
          specialties: form.specialties,
        });
        if (res.data?.success) {
          // עדכן את המשתמש ב-store
          this.store.user = res.data.user;
          this.me.name = res.data.user?.username || this.me.name;
          this.me.specialties =
            res.data.user?.specialties || this.me.specialties;
          // עדכן גם את שאר השדות
          if (res.data.user?.phone) {
            this.me.phone = res.data.user.phone;
          }
          if (res.data.user?.email) {
            this.me.email = res.data.user.email;
          }
          if (res.data.user?.city) {
            this.me.city = res.data.user.city;
          }
          this.toast?.showSuccess("הפרופיל עודכן בהצלחה");
          this.showProfileSheet = false;
        } else {
          this.toast?.showError("שגיאה בעדכון הפרופיל");
        }
      } catch (error) {
        this.toast?.showError("שגיאה בעדכון הפרופיל");
      }
    },

    async onViewHandymanDetails(id) {
      try {
        const { data } = await axios.get(`${URL}/Gethandyman/${id}`);
        if (data.success) {
          this.handymanDetails = data.Handyman;
        } else {
          this.toast.showError(data.message);
        }
      } catch (error) {
        this.toast.showError("שגיאה בטעינת פרטי ההנדימן");
      }
    },

    onCloseHandymanDetails() {
      this.handymanDetails = null;
    },

    onBookHandyman(handyman) {
      this.onPersonalRequest(handyman._id || handyman.id);
      this.onCloseHandymanDetails();
    },

    onBlockHandymanFromModal(handyman) {
      this.onBlockHandyman(handyman._id || handyman.id);
      this.onCloseHandymanDetails();
    },

    onCloseJobDetails() {
      this.jobDetails = null;
    },

    onAcceptJobFromModal(job) {
      this.onAccept(job);
      this.onCloseJobDetails();
    },

    onSkipJobFromModal(job) {
      this.onSkip(job);
      this.onCloseJobDetails();
    },

    async onNextPage() {
      if (this.handymenPagination.hasNext) {
        // קבל את הקואורדינטות מהמשתמש (תחילה נסה מהמשתנה המקומי, אחרת מה-store)
        // השתמש בקואורדינטות מה-user במסד הנתונים, לא מ-geolocation
        let coordinates = null;
        if (this.store.user) {
          if (
            this.store.user.location &&
            this.store.user.location.coordinates
          ) {
            coordinates = {
              lng: this.store.user.location.coordinates[0],
              lat: this.store.user.location.coordinates[1],
            };
          } else if (this.store.user.coordinates) {
            coordinates = {
              lng: this.store.user.coordinates.lng,
              lat: this.store.user.coordinates.lat,
            };
          }
        }

        await this.store.fetchHandymen(
          this.handymenPagination.page + 1,
          coordinates
        );
      }
    },

    async onPrevPage() {
      if (this.handymenPagination.hasPrev) {
        // השתמש בקואורדינטות מה-user במסד הנתונים, לא מ-geolocation
        let coordinates = null;
        if (this.store.user) {
          if (
            this.store.user.location &&
            this.store.user.location.coordinates
          ) {
            coordinates = {
              lng: this.store.user.location.coordinates[0],
              lat: this.store.user.location.coordinates[1],
            };
          } else if (this.store.user.coordinates) {
            coordinates = {
              lng: this.store.user.coordinates.lng,
              lat: this.store.user.coordinates.lat,
            };
          }
        }

        await this.store.fetchHandymen(
          this.handymenPagination.page - 1,
          coordinates
        );
      }
    },

    getUserCoordinates() {
      // נסה לקבל את הקואורדינטות מהמשתמש
      if (this.store.user) {
        if (this.store.user.location && this.store.user.location.coordinates) {
          return {
            lng: this.store.user.location.coordinates[0],
            lat: this.store.user.location.coordinates[1],
          };
        } else if (this.store.user.Coordinates) {
          return {
            lng: this.store.user.Coordinates.lng,
            lat: this.store.user.Coordinates.lat,
          };
        }
      }
      return null;
    },

    getStatusLabel(status) {
      const labels = {
        open: "פתוחה",
        assigned: "שובצה",
        on_the_way: "בדרך",
        in_progress: "בביצוע",
        done: "הושלמה",
        cancelled: "בוטלה",
      };
      return labels[status] || status;
    },
  },
  async mounted() {
    // Clear activeAssignedJob on mount to ensure fresh state
    this.activeAssignedJob = null;

    // Listen for window resize to update mobile state
    window.addEventListener("resize", this.handleResize);

    // Get current GPS location for handymen (if "myLocation" is selected)
    if (this.isHendiman) {
      try {
        const loc = await this.getCurrentLocation();
        this.geoCoordinates = { lat: loc.lat, lon: loc.lon };
      } catch (err) {
        // Silent fail - location is optional
      }
    }

    try {
      // קבל את הקואורדינטות הנוכחיות של המשתמש
      // נטען את המשתמש פעם אחת בלבד עם הקואורדינטות שלו (אם יש)
      // קודם נטען בלי קואורדינטות כדי לקבל את הקואורדינטות של המשתמש מה-DB
      const initialData = await this.store.fetchDashboardData(
        this.$route.params.id
      );

      // אם המשתמש לא נמצא, החזר ל-דף הבית
      if (!initialData || !initialData.User) {
        this.$router.push("/");
        return;
      }

      // חלץ קואורדינטות מה-User שנטען
      let coordinates = null;
      if (initialData.User) {
        // בדוק אם יש location בפורמט GeoJSON
        if (
          initialData.User.location &&
          initialData.User.location.coordinates
        ) {
          coordinates = {
            lng: initialData.User.location.coordinates[0],
            lat: initialData.User.location.coordinates[1],
          };
        }
        // אם אין location, נסה Coordinates
        else if (initialData.User.Coordinates) {
          coordinates = {
            lng: initialData.User.Coordinates.lng,
            lat: initialData.User.Coordinates.lat,
          };
        }
      }

      // שמור את הקואורדינטות לשימוש מאוחר יותר (pagination)
      this.userCoordinates = coordinates;

      // אם יש קואורדינטות, נטען שוב עם הקואורדינטות כדי לקבל הנדימנים בסביבה
      // אחרת, נשתמש בנתונים הראשוניים שכבר יש לנו
      const data = coordinates
        ? await this.store.fetchDashboardData(
            this.$route.params.id,
            coordinates
          )
        : initialData;

      // עדכן את הנתונים המקומיים מהמשתמש
      // אם המשתמש לא נמצא גם אחרי הבקשה השנייה, החזר ל-דף הבית
      if (!data || !data.User) {
        this.$router.push("/");
        return;
      }

      if (data.User) {
        this.me.name = data.User.username;
        this.me.specialties = data.User.specialties;
        this.me.avatarUrl = data.User.imageUrl;
        this.me.id = data.User._id;
        this.me.phone = data.User.phone;
        this.me.email = data.User.email;
        this.me.city = data.User.city;
        this.isHendiman = data.User.isHandyman;

        // עדכן את הקואורדינטות גם מה-User שנטען (למקרה שהן השתנו)
        if (data.User.location && data.User.location.coordinates) {
          this.userCoordinates = {
            lng: data.User.location.coordinates[0],
            lat: data.User.location.coordinates[1],
          };
        } else if (data.User.Coordinates) {
          this.userCoordinates = {
            lng: data.User.Coordinates.lng,
            lat: data.User.Coordinates.lat,
          };
        }

        // טען handymen עם pagination (רק אם זה לקוח)
        if (!this.isHendiman) {
          // שלח את הקואורדינטות גם ל-fetchHandymen
          await this.store.fetchHandymen(1, this.userCoordinates);
        } else {
          // עבור הנדימן - טען עבודות מסוננות
          await this.fetchHandymanJobs(data.User);
        }

        // בדוק אם יש עבודה משובצת ונפתח את הצ'אט אוטומטית
        // עבור הנדימן ולקוח - בודק אם יש עבודה משובצת
        // חשוב: נבדוק ישירות בנתונים הראשוניים (data.Jobs) שמכילים את כל העבודות
        // ולא רק ב-store.jobs שיכול להכיל רק עבודות מסוננות
        // נשתמש ב-$nextTick כדי לוודאשהנתונים עודכנו ב-store לפני הבדיקה
        await this.$nextTick();
        this.checkForAssignedJobFromData(data);

        // אם לא מצאנו עבודה משובצת, נבדוק שוב אחרי שהנתונים נטענו לגמרי
        if (!this.activeAssignedJob) {
          // נבדוק גם ב-store.jobs (למקרה שהנתונים עודכנו אחרי checkForAssignedJobFromData)
          setTimeout(() => {
            this.checkForAssignedJob();
          }, 500);
        }

        // Check for jobs that need client approval (status: 'done', clientApproved: false)
        if (!this.isHendiman && data?.Jobs) {
          const doneJobsNeedingApproval = data.Jobs.filter(
            (job) => job.status === "done" && !job.clientApproved
          );
          console.log(
            "[Dashboard] Found done jobs needing approval:",
            doneJobsNeedingApproval.length
          );
          if (doneJobsNeedingApproval.length > 0) {
            // Show approval modal for the first job
            console.log(
              "[Dashboard] Showing approval modal for job:",
              doneJobsNeedingApproval[0]._id || doneJobsNeedingApproval[0].id
            );
            this.pendingApprovalJob = doneJobsNeedingApproval[0];
            this.showClientApprovalModal = true;
          }
        }

        // Check for jobs where client approved but handyman needs onboarding (for handyman)
        if (this.isHendiman && data?.Jobs) {
          const approvedJobsNeedingOnboarding = data.Jobs.filter(
            (job) =>
              job.status === "done" &&
              job.clientApproved === true &&
              !job.handymanReceivedPayment
          );
          console.log(
            "[Dashboard] Found approved jobs needing onboarding:",
            approvedJobsNeedingOnboarding.length
          );
          if (approvedJobsNeedingOnboarding.length > 0) {
            // Get onboarding link for the first job
            const job = approvedJobsNeedingOnboarding[0];
            console.log(
              "[Dashboard] Fetching onboarding link for job:",
              job._id || job.id
            );
            await this.fetchOnboardingLinkForJob(job);
          }
        }
      }

      // Initialize WebSocket for real-time updates
      this.initWebSocket();

      // Enable Push Notifications
      this.enablePushNotifications();
    } catch (error) {
      // אם יש שגיאה או שהמשתמש לא נמצא, החזר ל-דף הבית
      this.$router.push("/");
    }
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.handleResize);
    this.disconnectWebSocket();
  },
  watch: {
    // צפה בשינויים ב-jobs כדי לבדוק עבודה משובצת
    "store.jobs": {
      handler(newJobs, oldJobs) {
        // רק אם יש שינוי אמיתי ב-jobs, נבדוק עבודה משובצת
        // נמנע מקריאות מיותרות אם ה-jobs לא השתנו
        if (
          newJobs &&
          newJobs.length > 0 &&
          (!oldJobs || newJobs.length !== oldJobs.length)
        ) {
          this.$nextTick(() => {
            this.checkForAssignedJob();
          });
        }
      },
      immediate: false,
      deep: false, // לא צריך deep watch, רק לבדוק אם המערך השתנה
    },
  },
};
</script>

<style lang="scss" scoped>
/* ====== THEME: BLACK + ORANGE (HENDIMAN) ====== */
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

.dash {
  direction: rtl;
  min-height: 100vh;
  min-height: -webkit-fill-available; // iOS fix
  color: $text;
  padding: 16px;
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

  @media (max-width: 768px) {
    padding: 12px 10px;
    padding-bottom: calc(12px + env(safe-area-inset-bottom)); // iOS safe area
    padding-top: calc(12px + env(safe-area-inset-top)); // iOS safe area
  }
}

/* Styles moved to DashboardTopBar component */

/* GRID */
.grid {
  display: grid;
  grid-template-columns: 1fr 1.6fr; /* ~40/60 - handymen first, then jobs */
  grid-template-rows: 1fr auto; /* Jobs section takes available space, tools at bottom */
  gap: 14px;
  align-items: stretch; // זה יגרום לשני הבלוקים להיות באותו גובה

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto; /* Stack items vertically on smaller screens */
  }

  @media (max-width: 768px) {
    gap: clamp(16px, 4vw, 24px);
    display: flex;
    flex-direction: column;
    padding: clamp(12px, 3vw, 16px);
    padding-bottom: calc(
      80px + env(safe-area-inset-bottom)
    ); // Space for bottom nav
  }
}

/* JOBS */
.jobs {
  border-radius: $r2;
  border: 1px solid $stroke;
  background: linear-gradient(180deg, $card2, rgba(255, 255, 255, 0.04));
  box-shadow: $shadow;
  overflow: hidden;

  @media (max-width: 768px) {
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  &__head {
    padding: 14px;
    display: flex;
    flex-direction: row-reverse;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    background: radial-gradient(
        900px 240px at 20% 0%,
        rgba($orange, 0.14),
        transparent 55%
      ),
      linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.06),
        rgba(255, 255, 255, 0.03)
      );

    @media (max-width: 768px) {
      padding: 8px 6px;
      gap: 6px;
      border-radius: 12px 12px 0 0;
    }
  }
}

.h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 1000;

  @media (max-width: 768px) {
    font-size: 14px;
  }

  &__count {
    color: $orange3;
    font-weight: 1100;
    margin-right: 6px;

    @media (max-width: 768px) {
      margin-right: 4px;
      font-size: 12px;
    }
  }
}

.sub {
  margin: 4px 0 0;
  color: $muted;
  font-weight: 800;
  font-size: 12.5px;

  @media (max-width: 768px) {
    font-size: 9px;
    margin: 2px 0 0;
  }
}

.headActions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.pill {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  border-radius: 999px;
  border: 1px solid rgba($orange, 0.2);
  background: rgba(0, 0, 0, 0.25);
  padding: 9px 10px;
  color: $text;
  font-weight: 900;
  font-size: 12px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);

  &--on {
    background: $orange;
    box-shadow: 0 0 0 4px rgba($orange, 0.22);
  }
}

/* FILTERS */
.filters {
  padding: 12px 14px 0;

  @media (max-width: 768px) {
    padding: 6px 6px 0;
  }

  &__card {
    border-radius: $r;
    border: 1px solid rgba($orange, 0.18);
    background: rgba($orange, 0.08);
    padding: 12px;

    @media (max-width: 768px) {
      padding: 6px;
      border-radius: 10px;
    }
  }

  &__row {
    display: grid;
    grid-template-columns: 1.2fr 0.8fr;
    gap: 12px;

    @media (max-width: 980px) {
      grid-template-columns: 1fr;
    }
  }
}

.field {
  display: grid;
  gap: 8px;

  &--narrow {
    align-content: start;
  }
}

.label {
  font-size: 12px;
  font-weight: 1000;
  color: rgba(255, 255, 255, 0.78);

  @media (max-width: 768px) {
    font-size: 10px;
  }
}

.tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tab {
  border-radius: 999px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba(0, 0, 0, 0.25);
  padding: 10px 20px;
  cursor: pointer;
  display: inline-flex;
  gap: 10px;
  align-items: center;
  transition: transform 120ms ease, box-shadow 120ms ease;
  min-width: fit-content;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 12px 20px rgba($orange, 0.12);
  }

  &:focus {
    @include focusRing;
  }

  &--active {
    background: linear-gradient(135deg, $orange, $orange2);
    border-color: rgba($orange, 0.55);
  }

  &__txt {
    font-size: 12px;
    font-weight: 1000;
    color: $text;
    white-space: nowrap;

    @media (max-width: 768px) {
      font-size: 9px;
    }
  }

  &__count {
    font-size: 12px;
    font-weight: 1000;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.16);
    background: rgba(0, 0, 0, 0.25);
    white-space: nowrap;

    @media (max-width: 768px) {
      font-size: 8px;
      padding: 2px 6px;
    }
  }
}

.rangeBox {
  border-radius: $r;
  border: 1px solid rgba($orange, 0.18);
  background: rgba(0, 0, 0, 0.22);
  padding: 10px;

  &__top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }
}

.badge {
  border-radius: 999px;
  padding: 7px 10px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba($orange, 0.12);
  font-weight: 900;
  font-size: 12px;

  b {
    font-weight: 1100;
    color: $orange3;
  }
}

.range {
  width: 100%;
  accent-color: $orange;
}

.hint {
  margin-top: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.62);
  font-weight: 800;
}

/* JOB CARDS */
.jobs__list {
  padding: 14px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;

  @media (max-width: 768px) {
    padding: 6px 4px;
    gap: 6px;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
  }
}

.job-card {
  border-radius: 20px;
  border: 1px solid rgba($orange, 0.14);
  background: rgba(255, 255, 255, 0.06);
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  transition: transform 120ms ease, box-shadow 120ms ease;

  @media (max-width: 768px) {
    padding: 6px;
    border-radius: 12px;
    gap: 6px;
  }

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 14px 22px rgba($orange, 0.12);
  }

  &__left {
    display: flex;
    gap: 10px;
    align-items: center;
    flex: 1;
    min-width: 0;
  }

  &__tags {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    flex-shrink: 0;

    @media (max-width: 768px) {
      gap: 4px;
    }
  }

  &__meta {
    display: grid;
    gap: 4px;
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-weight: 1100;
    font-size: 14px;
    color: $text;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    @media (max-width: 768px) {
      font-size: 12px;
    }
  }

  &__sub {
    margin-top: 2px;
    color: rgba(255, 255, 255, 0.62);
    font-weight: 900;
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    @media (max-width: 768px) {
      font-size: 9px;
      margin-top: 1px;
    }
  }

  &__price {
    font-weight: 1100;
    color: $orange3;
    font-size: 13px;

    @media (max-width: 768px) {
      font-size: 10px;
    }
  }

  &__actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    flex-shrink: 0;

    @media (max-width: 768px) {
      gap: 4px;
    }
  }
}

.tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  border-radius: 999px;
  padding: 6px 10px;
  font-weight: 1000;
  font-size: 11.5px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba($orange, 0.12);
  color: $text;

  @media (max-width: 768px) {
    padding: 2px 4px;
    font-size: 7px;
    border-radius: 6px;
  }

  &--urgent {
    border-color: rgba($danger, 0.45);
    background: rgba($danger, 0.12);
    color: #ffd4d4;
  }

  &--status {
    border-color: rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.84);
  }

  &--hourly {
    border-color: rgba($orange2, 0.28);
    background: rgba($orange2, 0.14);
  }

  &--fixed {
    border-color: rgba($orange, 0.22);
    background: rgba($orange, 0.12);
  }
}

.iconBtn {
  width: 38px;
  height: 38px;
  border-radius: 14px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba(0, 0, 0, 0.28);
  color: $text;
  cursor: pointer;

  &:hover {
    box-shadow: 0 10px 18px rgba($orange, 0.14);
  }

  &:focus {
    @include focusRing;
  }

  @media (max-width: 768px) {
    width: 24px;
    height: 24px;
    border-radius: 8px;
    font-size: 12px;
  }
}

.job__titleRow {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: baseline;
}

.job__title {
  margin: 0;
  font-size: 15.5px;
  font-weight: 1100;

  @media (max-width: 768px) {
    font-size: 11px;
    line-height: 1.25;
  }
}

.price {
  font-weight: 1200;
  color: $orange3;
  font-size: 14px;

  @media (max-width: 768px) {
    font-size: 9px;
  }

  span {
    font-weight: 900;
    color: rgba(255, 255, 255, 0.7);
    margin-right: 4px;
  }
}

.job__desc {
  margin: 8px 0 0;
  color: rgba(255, 255, 255, 0.78);
  font-weight: 800;
  font-size: 13px;
  line-height: 1.4;

  @media (max-width: 768px) {
    font-size: 9px;
    margin: 3px 0 0;
    line-height: 1.25;
  }
}

.metaGrid {
  margin-top: 10px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;

  @media (max-width: 768px) {
    gap: 3px;
    margin-top: 4px;
  }

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
}

.meta {
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.22);
  padding: 10px;

  @media (max-width: 768px) {
    padding: 4px;
    border-radius: 8px;
  }

  &__k {
    display: block;
    font-size: 12px;
    font-weight: 900;
    color: rgba(255, 255, 255, 0.62);
    margin-bottom: 4px;

    @media (max-width: 768px) {
      font-size: 8px;
      margin-bottom: 2px;
    }
  }

  &__v {
    font-size: 12.5px;
    font-weight: 1000;
    color: rgba(255, 255, 255, 0.9);

    @media (max-width: 768px) {
      font-size: 8px;
      line-height: 1.2;
    }
  }
}

.spacer {
  flex: 1 1 auto;
}

/* SIDE PANEL */
.panel {
  border-radius: $r2;
  border: 1px solid $stroke;
  background: linear-gradient(180deg, $card2, rgba(255, 255, 255, 0.04));
  box-shadow: $shadow;
  padding: 14px;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 100%;

  @media (max-width: 768px) {
    padding: 8px 6px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
    margin-bottom: 8px;
  }
}

.panel__head {
  margin-bottom: 10px;
}

.cta {
  border-radius: $r2;
  border: 1px solid rgba($orange, 0.18);
  background: rgba(0, 0, 0, 0.22);
  padding: 12px;
  width: 100%;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 8px;
    border-radius: 12px;
  }
}

.action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}

.handymen-list {
  display: grid;
  gap: 10px;
  margin-top: 12px;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;

  @media (max-width: 768px) {
    gap: 6px;
  }

  // Scrollbar styling
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba($orange, 0.3);
    border-radius: 10px;

    &:hover {
      background: rgba($orange, 0.5);
    }
  }
}

/* Button: "צור קריאה" (Orange + Black) */
.btn-create-call {
  --orange: #ff7a00;
  --orange-2: #ff9a3c;
  --black: #0b0b0f;
  --black-2: #14141a;

  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  padding: 0.95rem 1.25rem;
  min-height: 48px;
  border-radius: 14px;
  border: 1px solid rgba(255, 122, 0, 0.55);
  color: #fff;
  background: linear-gradient(
    135deg,
    var(--black) 0%,
    var(--black-2) 55%,
    rgba(255, 122, 0, 0.1) 100%
  );
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.45), 0 0 0 0 rgba(255, 122, 0, 0);
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  font-weight: 800;
  letter-spacing: 0.2px;
  text-transform: none;
  transition: transform 0.12s ease, box-shadow 0.18s ease,
    border-color 0.18s ease, background 0.18s ease, filter 0.18s ease;
  position: relative;
  overflow: hidden;
  font-size: 14px;
  border: none;

  .icon {
    width: 18px;
    height: 18px;
    flex: 0 0 auto;
    filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.45));
  }

  &:hover {
    border-color: rgba(255, 122, 0, 0.9);
    background: linear-gradient(
      135deg,
      #0f0f14 0%,
      #1a1a22 55%,
      rgba(255, 122, 0, 0.16) 100%
    );
    box-shadow: 0 14px 32px rgba(0, 0, 0, 0.55),
      0 0 0 6px rgba(255, 122, 0, 0.12);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0px) scale(0.99);
    box-shadow: 0 10px 22px rgba(0, 0, 0, 0.5), 0 0 0 4px rgba(255, 122, 0, 0.1);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 4px rgba(255, 122, 0, 0.25),
      0 16px 40px rgba(0, 0, 0, 0.55);
  }

  &:disabled,
  &.is-disabled {
    cursor: not-allowed;
    opacity: 0.55;
    filter: grayscale(0.2);
    transform: none;
    box-shadow: none;
  }

  // subtle animated shine
  &::after {
    content: "";
    position: absolute;
    inset: -40% -60%;
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.1) 35%,
      rgba(255, 255, 255, 0) 70%
    );
    transform: translateX(-40%) rotate(10deg);
    transition: transform 0.55s ease;
    pointer-events: none;
  }

  &:hover::after {
    transform: translateX(40%) rotate(10deg);
  }

  // optional "urgent" variant
  &.is-urgent {
    border-color: rgba(255, 122, 0, 0.95);
    background: linear-gradient(
      135deg,
      #0b0b0f 0%,
      #1b1208 55%,
      rgba(255, 122, 0, 0.22) 100%
    );
    box-shadow: 0 14px 34px rgba(0, 0, 0, 0.55),
      0 0 0 6px rgba(255, 122, 0, 0.18);
  }

  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
    min-height: 42px; // Smaller on mobile
    font-size: 13px;
    border-radius: 12px;
    gap: 0.5rem;

    .icon {
      width: 16px;
      height: 16px;
    }
  }
}

/* form controls */
.input,
.select,
.textarea {
  width: 100%;
  box-sizing: border-box;
  border-radius: 16px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  padding: 12px 12px;
  font-weight: 900;
  -webkit-appearance: none; // Remove iOS styling
  appearance: none;
  font-size: 16px; // Prevent zoom on iOS

  @media (max-width: 768px) {
    padding: 10px 8px;
    font-size: 16px; // Prevent iOS zoom
    border-radius: 10px;
    min-height: 40px; // Smaller on mobile
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.45);
  }

  &:focus {
    @include focusRing;
    border-color: rgba($orange, 0.45);
  }
}

.textarea {
  resize: vertical;
  min-height: 92px;
}

.preview {
  margin-top: 10px;
  border-radius: 18px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba($orange, 0.1);
  padding: 10px;

  &__row {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    padding: 4px 0;

    span {
      color: rgba(255, 255, 255, 0.7);
      font-weight: 900;
      font-size: 12px;
    }

    b {
      font-weight: 1100;
      color: $orange3;
      font-size: 12.5px;
    }
  }
}

.apiNote {
  margin-top: 6px;
  color: rgba(255, 255, 255, 0.62);
  font-weight: 800;
  font-size: 12px;

  @media (max-width: 768px) {
    font-size: 11px;
    margin-top: 4px;
  }
}

/* File upload styles for call image */
.file-upload-wrapper {
  position: relative;
  width: 100%;
  box-sizing: border-box;
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

  @media (max-width: 768px) {
    padding: 10px 14px;
    font-size: 12px;
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

  @media (max-width: 768px) {
    max-width: 150px;
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

  @media (max-width: 768px) {
    width: 24px;
    height: 24px;
    font-size: 18px;
    top: 6px;
    left: 6px;
  }
}

.row {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 10px;

  &--2 {
    display: grid;
    grid-template-columns: 1fr 1fr;

    @media (max-width: 520px) {
      grid-template-columns: 1fr;
    }
  }
}

.toggle {
  border-radius: 999px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba($orange, 0.1);
  color: $text;
  padding: 10px 12px;
  cursor: pointer;
  font-weight: 1000;

  &--on {
    border-color: rgba($orange, 0.45);
    box-shadow: 0 14px 22px rgba($orange, 0.16);
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

.divider {
  height: 14px;
}

/* directory */
.dir {
  border-radius: $r2;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.22);
  padding: 12px;

  @media (max-width: 768px) {
    padding: 8px;
    border-radius: 12px;
  }
}

.dir__list {
  margin-top: 12px;
  display: grid;
  gap: 10px;

  @media (max-width: 768px) {
    margin-top: 8px;
    gap: 6px;
  }
}

.hcard {
  border-radius: 20px;
  border: 1px solid rgba($orange, 0.14);
  background: rgba(255, 255, 255, 0.06);
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  transition: transform 120ms ease, box-shadow 120ms ease;

  @media (max-width: 768px) {
    padding: 6px;
    border-radius: 12px;
    gap: 6px;
  }

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 14px 22px rgba($orange, 0.12);
  }

  &__left {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  &__av {
    width: 44px;
    height: 44px;
    border-radius: 999px;
    border: 2px solid rgba($orange, 0.28);
    object-fit: cover;

    @media (max-width: 768px) {
      width: 32px;
      height: 32px;
      border-width: 1.5px;
    }
  }

  &__name {
    font-weight: 1100;

    @media (max-width: 768px) {
      font-size: 12px;
    }
  }

  &__sub {
    margin-top: 2px;
    color: rgba(255, 255, 255, 0.62);
    font-weight: 900;
    font-size: 12px;

    @media (max-width: 768px) {
      font-size: 9px;
      margin-top: 1px;
    }
  }

  &__actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;

    @media (max-width: 768px) {
      gap: 4px;
    }
  }
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding: 12px;
  border-radius: 16px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba(255, 255, 255, 0.04);

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 8px;
    padding: 8px;
  }

  &__info {
    color: $muted;
    font-weight: 900;
    font-size: 12px;

    @media (max-width: 768px) {
      font-size: 10px;
    }
  }

  .btn {
    min-width: 100px;

    @media (max-width: 768px) {
      min-width: 80px;
      width: 100%;
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      pointer-events: none;
    }
  }
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 999px;
  padding: 8px 12px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba($orange, 0.1);
  font-weight: 1000;
  font-size: 12px;
  color: $text;
  flex-wrap: wrap;
  margin: 4px;

  @media (max-width: 768px) {
    padding: 4px 8px;
    font-size: 9px;
    gap: 4px;
    margin: 3px;
  }

  &__name {
    color: $text;
    font-weight: 1000;
  }

  &__price {
    color: $orange3;
    font-weight: 1100;
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 999px;
    background: rgba($orange, 0.15);
    border: 1px solid rgba($orange, 0.25);

    @media (max-width: 768px) {
      font-size: 8px;
      padding: 1px 4px;
    }
  }

  &__type {
    font-size: 10px;
    font-weight: 900;
    padding: 2px 6px;
    border-radius: 999px;
    border: 1px solid;

    @media (max-width: 768px) {
      font-size: 7px;
      padding: 1px 4px;
    }

    &--hourly {
      color: $orange2;
      background: rgba($orange2, 0.15);
      border-color: rgba($orange2, 0.25);
    }

    &--fixed {
      color: $orange;
      background: rgba($orange, 0.15);
      border-color: rgba($orange, 0.25);
    }
  }
}

/* buttons */
.btn {
  border-radius: 16px;
  padding: 11px 12px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  cursor: pointer;
  font-weight: 1000;
  transition: transform 120ms ease, box-shadow 120ms ease, background 120ms ease;
  font-size: 13px;

  @media (max-width: 768px) {
    padding: 6px 8px;
    font-size: 10px;
    border-radius: 10px;
    min-height: 32px;
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

  &--ghost {
    background: rgba(0, 0, 0, 0.22);
    border-color: rgba(255, 255, 255, 0.12);
  }

  &--full {
    width: 100%;
    justify-content: center;
  }
}

.mini {
  border-radius: 999px;
  padding: 9px 10px;
  font-weight: 1000;
  font-size: 12px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba($orange, 0.1);
  color: $text;
  cursor: pointer;

  &:focus {
    @include focusRing;
  }

  &--ghost {
    background: rgba(0, 0, 0, 0.22);
    border-color: rgba(255, 255, 255, 0.12);
  }

  &--primary {
    border: none;
    background: linear-gradient(135deg, $orange, $orange2);
    color: #111;
  }

  &--danger {
    border-color: rgba($danger, 0.35);
    background: rgba($danger, 0.14);
    color: #ffd4d4;
  }
}

.link {
  border: none;
  background: transparent;
  color: $orange3;
  font-weight: 1000;
  cursor: pointer;

  &:focus {
    @include focusRing;
    border-radius: 12px;
  }
}

.side {
  display: grid;
  gap: 14px;
  width: 100%;
  box-sizing: border-box;

  &--bottom {
    grid-column: 1 / -1; /* Span all columns on desktop */
    @media (max-width: 980px) {
      grid-column: 1; /* Single column on mobile */
    }
  }
}

/* Loading Overlay */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba($orange, 0.2);
  border-top-color: $orange;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  box-shadow: 0 0 20px rgba($orange, 0.3);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  color: $text;
  font-weight: 900;
  font-size: 16px;
  margin: 0;
  animation: pulse 1.5s ease-in-out infinite;

  @media (max-width: 768px) {
    font-size: 14px;
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

// Additional mobile app-like enhancements
@media (max-width: 768px) {
  // Smooth scrolling
  .dash,
  .jobs__list,
  main {
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
  }

  // Better text rendering on mobile
  * {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }

  // Disable text selection on buttons for better UX
  button,
  .btn,
  .tab,
  .toggle {
    -webkit-user-select: none;
    user-select: none;
    -webkit-touch-callout: none;
  }

  // Better focus states for accessibility
  button:focus-visible,
  .btn:focus-visible,
  input:focus-visible,
  select:focus-visible,
  textarea:focus-visible {
    outline: 2px solid rgba($orange, 0.6);
    outline-offset: 2px;
  }
}

/* Mobile Bottom Navigation & CTA */
.client-actions-top {
  display: none; // Hidden on desktop

  @media (max-width: 768px) {
    display: block;
    position: sticky;
    top: 0;
    z-index: 100;
    background: #0b0b0f;
    padding-top: 10px;
    padding-bottom: 10px;
    backdrop-filter: blur(10px);
    margin-bottom: 12px;
  }
}

.return-job-mobile {
  display: none; // Hidden on desktop

  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 16px;
    margin-bottom: 12px;
    border-radius: 12px;
    border: 1px solid rgba(255, 106, 0, 0.3);
    background: linear-gradient(
      135deg,
      rgba(255, 106, 0, 0.15),
      rgba(255, 138, 43, 0.1)
    );
    color: rgba(255, 138, 43, 1);
    cursor: pointer;
    font-weight: 1000;
    font-size: 13px;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 12px rgba(255, 106, 0, 0.1);
    position: sticky;
    top: 0;
    z-index: 100;
    background: linear-gradient(
      135deg,
      rgba(255, 106, 0, 0.15),
      rgba(255, 138, 43, 0.1)
    );
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  &--handyman {
    border: 2px solid rgba(239, 68, 68, 0.5);
    background: linear-gradient(
      135deg,
      rgba(239, 68, 68, 0.2),
      rgba(220, 38, 38, 0.15)
    );
    color: #ef4444;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);

    &:hover {
      border-color: rgba(239, 68, 68, 0.7);
      background: linear-gradient(
        135deg,
        rgba(239, 68, 68, 0.3),
        rgba(220, 38, 38, 0.25)
      );
      box-shadow: 0 6px 20px rgba(239, 68, 68, 0.35);
    }
  }

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(255, 106, 0, 0.5);
    background: linear-gradient(
      135deg,
      rgba(255, 106, 0, 0.25),
      rgba(255, 138, 43, 0.2)
    );
    box-shadow: 0 6px 20px rgba(255, 106, 0, 0.25);
  }

  &:active {
    transform: translateY(0);
  }
}

.return-job-mobile__icon {
  font-size: 16px;
  transition: transform 0.25s ease;

  .return-job-mobile:hover & {
    transform: rotate(15deg) scale(1.1);
  }
}

.return-job-mobile__text {
  font-weight: 1000;
  white-space: nowrap;
}

.client-actions-panel {
  padding: 16px !important;
  display: block; // Visible on desktop

  @media (max-width: 768px) {
    display: none; // Hidden on mobile
  }
}

.client-actions-desktop {
  display: block; // Visible on desktop
  width: 100%;

  @media (max-width: 768px) {
    display: none; // Hidden on mobile
  }
}

.mobile-nav {
  position: fixed;
  bottom: 0;
  right: 0;
  left: 0;
  display: none;
  gap: 12px;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  background: rgba(11, 11, 15, 0.95);
  backdrop-filter: blur(20px) saturate(180%);
  border-top: 1px solid rgba(255, 122, 0, 0.2);
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.4);
  z-index: 2000;
  align-items: center;
}

.nav-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 56px; // WCAG AA minimum touch target
  padding: 8px 12px;
  border: none;
  border-radius: 16px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.06);
  transition: all 0.2s ease;
  touch-action: manipulation;
  cursor: pointer;
  -webkit-tap-highlight-color: rgba(255, 122, 0, 0.2);

  &:focus-visible {
    outline: 2px solid rgba(255, 122, 0, 0.6);
    outline-offset: 2px;
  }

  &:active {
    transform: scale(0.98);
    background: rgba(255, 255, 255, 0.1);
  }

  &__icon {
    font-size: 20px;
    line-height: 1;
  }

  &__label {
    font-size: clamp(11px, 2.5vw, 12px);
    line-height: 1.2;
  }

  &--primary {
    background: linear-gradient(135deg, #ff6a00, #ff8a2b);
    color: #0b0b0f;
    font-weight: 800;
    box-shadow: 0 4px 12px rgba(255, 106, 0, 0.3);
    min-height: 56px; // Primary CTA: 48-56px range

    &:hover {
      box-shadow: 0 6px 16px rgba(255, 106, 0, 0.4);
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0) scale(0.98);
    }

    .nav-btn__icon {
      font-size: 24px;
    }

    .nav-btn__label {
      font-size: clamp(13px, 3vw, 14px);
      font-weight: 900;
    }
  }
}

@media (max-width: 768px) {
  .mobile-nav {
    display: flex;
  }

  // Removed bottom nav padding since nav is removed
  .grid {
    padding-bottom: calc(20px + env(safe-area-inset-bottom));
  }
}

.jobCancelledModal {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: $font-family;
}

.jobCancelledModal__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
}

.jobCancelledModal__content {
  position: relative;
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.95),
    rgba(15, 16, 22, 0.98)
  );
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 32px;
  max-width: 400px;
  width: calc(100% - 40px);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
  text-align: center;
}

.jobCancelledModal__icon {
  font-size: 64px;
  margin-bottom: 16px;
  line-height: 1;
}

.jobCancelledModal__title {
  font-size: 24px;
  font-weight: 900;
  color: #fff;
  margin: 0 0 12px 0;
}

.jobCancelledModal__message {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 24px 0;
  line-height: 1.5;
}

.jobCancelledModal__btn {
  padding: 12px 32px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #ff6a00, #ff8a2b);
  color: #0b0b0f;
  font-weight: 900;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: $font-family;
}

.jobCancelledModal__btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 106, 0, 0.4);
}

.jobCancelledModal__btn:active {
  transform: translateY(0);
}

// Client Approval Modal Styles
.clientApprovalModal {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: $font-family;
}

.clientApprovalModal__content {
  position: relative;
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.95),
    rgba(15, 16, 22, 0.98)
  );
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 32px;
  max-width: 450px;
  width: calc(100% - 40px);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
  text-align: center;

  @media (max-width: 768px) {
    padding: 24px;
    border-radius: 16px;
    max-width: 100%;
  }
}

.clientApprovalModal__close {
  position: absolute;
  top: 16px;
  left: 16px;
  background: transparent;
  border: 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 24px;
  cursor: pointer;
  padding: 8px;
  line-height: 1;
  transition: color 0.2s;

  &:hover {
    color: rgba(255, 255, 255, 0.9);
  }
}

.clientApprovalModal__icon {
  font-size: 64px;
  margin-bottom: 16px;
  line-height: 1;

  @media (max-width: 768px) {
    font-size: 48px;
    margin-bottom: 12px;
  }
}

.clientApprovalModal__title {
  font-size: 24px;
  font-weight: 900;
  color: #fff;
  margin: 0 0 16px 0;
  line-height: 1.3;

  @media (max-width: 768px) {
    font-size: 20px;
    margin-bottom: 12px;
  }
}

.clientApprovalModal__message {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 24px 0;
  line-height: 1.6;

  @media (max-width: 768px) {
    font-size: 14px;
    margin-bottom: 20px;
  }
}

.clientApprovalModal__actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
  }
}

.clientApprovalModal__btn {
  padding: 14px 28px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 800;
  border: 0;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: $font-family;
  min-width: 140px;

  @media (max-width: 768px) {
    width: 100%;
    padding: 12px 24px;
    font-size: 14px;
  }

  &:active {
    transform: translateY(0);
  }
}

.clientApprovalModal__btn--approve {
  background: linear-gradient(
    135deg,
    rgba($orange, 0.95),
    rgba($orange2, 0.92)
  );
  color: #0b0c10;
  border: 1px solid rgba($orange, 0.55);

  &:hover {
    background: linear-gradient(135deg, rgba($orange, 1), rgba($orange2, 1));
    box-shadow: 0 4px 16px rgba($orange, 0.3);
    transform: translateY(-1px);
  }
}

.clientApprovalModal__btn--reject {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.2);

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
  }
}

// Onboarding Modal Styles
.onboardingModal {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: $font-family;
}

.onboardingModal__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
}

.onboardingModal__content {
  position: relative;
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.95),
    rgba(15, 16, 22, 0.98)
  );
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 32px;
  max-width: 450px;
  width: calc(100% - 40px);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
  text-align: center;

  @media (max-width: 768px) {
    padding: 24px;
    border-radius: 16px;
    max-width: 100%;
  }
}

.onboardingModal__close {
  position: absolute;
  top: 16px;
  left: 16px;
  background: transparent;
  border: 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 24px;
  cursor: pointer;
  padding: 8px;
  line-height: 1;
  transition: color 0.2s;

  &:hover {
    color: rgba(255, 255, 255, 0.9);
  }
}

.onboardingModal__icon {
  font-size: 64px;
  margin-bottom: 16px;
  line-height: 1;

  @media (max-width: 768px) {
    font-size: 48px;
    margin-bottom: 12px;
  }
}

.onboardingModal__title {
  font-size: 24px;
  font-weight: 900;
  color: #fff;
  margin: 0 0 16px 0;
  line-height: 1.3;

  @media (max-width: 768px) {
    font-size: 20px;
    margin-bottom: 12px;
  }
}

.onboardingModal__message {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 24px 0;
  line-height: 1.6;

  @media (max-width: 768px) {
    font-size: 14px;
    margin-bottom: 20px;
  }
}

.onboardingModal__actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
  }
}

.onboardingModal__btn {
  padding: 14px 28px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 800;
  border: 0;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: $font-family;
  min-width: 140px;

  @media (max-width: 768px) {
    width: 100%;
    padding: 12px 24px;
    font-size: 14px;
  }

  &:active {
    transform: translateY(0);
  }
}

.onboardingModal__btn--primary {
  background: linear-gradient(
    135deg,
    rgba($orange, 0.95),
    rgba($orange2, 0.92)
  );
  color: #0b0c10;
  border: 1px solid rgba($orange, 0.55);

  &:hover {
    background: linear-gradient(135deg, rgba($orange, 1), rgba($orange2, 1));
    box-shadow: 0 4px 16px rgba($orange, 0.3);
    transform: translateY(-1px);
  }
}

.onboardingModal__btn--secondary {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.2);

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
  }
}

/* Delete/Edit Job Modals */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100001;
  padding: 20px;
  font-family: $font-family;

  @media (max-width: 768px) {
    padding: 10px;
    align-items: flex-start;
  }
}

.modal {
  background: linear-gradient(180deg, $card2, $card);
  border: 1px solid $stroke;
  border-radius: 16px;
  box-shadow: $shadow;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  color: $text;
  direction: rtl;
  text-align: right;
  overflow: hidden;

  @media (max-width: 768px) {
    max-width: 100%;
    border-radius: 14px;
    max-height: calc(100vh - 20px);
  }
}

.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid $stroke;

  @media (max-width: 768px) {
    padding: 16px 20px;
  }
}

.modal__title {
  font-size: 20px;
  font-weight: 1000;
  color: $text;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 18px;
  }
}

.modal__close {
  background: none;
  border: none;
  font-size: 24px;
  color: $muted;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  transition: all 0.2s ease;

  &:hover {
    color: $text;
    background: rgba(255, 255, 255, 0.1);
  }

  @media (max-width: 768px) {
    font-size: 20px;
    width: 28px;
    height: 28px;
  }
}

.modal__body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;

  @media (max-width: 768px) {
    padding: 20px;
  }
}

.modal__text {
  font-size: 15px;
  color: $text;
  margin: 0 0 16px 0;
  line-height: 1.6;

  @media (max-width: 768px) {
    font-size: 14px;
  }
}

.modal__warning {
  font-size: 13px;
  color: $orange3;
  margin: 0;
  padding: 12px;
  background: rgba($orange, 0.1);
  border: 1px solid rgba($orange, 0.2);
  border-radius: 8px;
  line-height: 1.5;

  @media (max-width: 768px) {
    font-size: 12px;
    padding: 10px;
  }
}

.modal__footer {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid $stroke;
  justify-content: flex-end;

  @media (max-width: 768px) {
    padding: 16px 20px;
    flex-direction: column-reverse;
  }
}

.modal__btn {
  padding: 12px 24px;
  border-radius: 12px;
  border: none;
  font-weight: 900;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: $font-family;
  min-width: 100px;

  @media (max-width: 768px) {
    width: 100%;
    padding: 10px 20px;
    font-size: 13px;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &--cancel {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid $stroke;
    color: $text;

    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.1);
    }
  }

  &--delete {
    background: linear-gradient(135deg, $danger, #ff5252);
    color: #fff;
    box-shadow: 0 4px 12px rgba($danger, 0.3);

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba($danger, 0.4);
    }
  }

  &--save {
    background: linear-gradient(135deg, $orange, $orange2);
    color: #111;
    box-shadow: $shadowO;

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: $shadowO, 0 8px 20px rgba($orange, 0.3);
    }
  }
}

/* Edit Job Modal Styles */
.modal--edit {
  max-width: 600px;

  @media (max-width: 768px) {
    max-width: 100%;
  }
}

.modal__body--edit {
  max-height: calc(90vh - 160px);
  overflow-y: auto;

  @media (max-width: 768px) {
    max-height: calc(100vh - 180px);
  }
}

.edit-job-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.form-section__title {
  font-size: 16px;
  font-weight: 900;
  color: $text;
  margin: 0;
}

.form-label {
  font-size: 14px;
  font-weight: 800;
  color: $text;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  max-width: 100%;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid rgba($orange, 0.25);
  background: rgba(255, 255, 255, 0.05);
  color: $text;
  font-size: 14px;
  font-family: $font-family;
  transition: all 0.2s ease;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: rgba($orange, 0.5);
    background: rgba(255, 255, 255, 0.08);
  }

  @media (max-width: 768px) {
    padding: 10px;
    font-size: 13px;
  }
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.form-select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ff6a00' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: left 12px center;
  padding-right: 12px;
  padding-left: 36px;
  background-color: rgba(255, 255, 255, 0.05);

  option {
    background: rgba(15, 16, 22, 0.98);
    color: $text;
    padding: 10px;
  }

  &:hover {
    border-color: rgba($orange, 0.4);
    background-color: rgba(255, 255, 255, 0.08);
  }

  &:focus {
    border-color: rgba($orange, 0.5);
    background-color: rgba(255, 255, 255, 0.1);
  }
}

.form-checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.form-checkbox__input {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: $orange;
}

.form-checkbox__label {
  font-size: 14px;
  font-weight: 800;
  color: $text;
}

.subcategories-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.subcategory-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba($orange, 0.1);
  border: 1px solid rgba($orange, 0.2);
}

.subcategory-name {
  font-size: 14px;
  font-weight: 800;
  color: $text;
}

.subcategory-price {
  font-size: 14px;
  font-weight: 900;
  color: $orange3;
}

.images-preview {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
  margin-bottom: 10px;
}

.image-preview-item {
  position: relative;
  width: 100%;
  padding-top: 100%;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba($orange, 0.2);
  background: rgba(0, 0, 0, 0.3);
}

.image-preview-item img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-remove-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba($danger, 0.8);
  }
}

.btn-small {
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  font-weight: 800;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: $font-family;

  @media (max-width: 768px) {
    padding: 6px 12px;
    font-size: 12px;
  }

  &--secondary {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba($orange, 0.3);
    color: $text;

    &:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba($orange, 0.5);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

.form-hint {
  font-size: 12px;
  color: $muted;
  margin: 4px 0 0 0;
}

.empty-state {
  padding: 20px;
  text-align: center;
  color: $muted;
  font-size: 14px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px dashed rgba(255, 255, 255, 0.1);
}

.modal__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 16px;
}

.modal__loading .spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba($orange, 0.2);
  border-top-color: $orange;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Map Picker Modal */
.modal--map {
  max-width: 90vw;
  max-height: 90vh;

  @media (max-width: 768px) {
    max-width: 100vw;
    max-height: 100vh;
    border-radius: 0;
  }
}

.modal__body--map {
  padding: 0;
  overflow: hidden;
}

.map-picker {
  width: 100%;
  height: 500px;

  @media (max-width: 768px) {
    height: 400px;
  }
}

.location-input-wrapper {
  width: 100%;
  box-sizing: border-box;
}

.house-number-input {
  margin-top: 12px;
  width: 100%;
}

.house-number-input .form-input {
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

.house-number-input .form-input:focus {
  outline: none;
  border-color: $orange;
  background: rgba(255, 255, 255, 0.06);
}

.location-buttons {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.location-buttons .btn-small {
  flex: 1;
}

.location-selected {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-radius: 10px;
  background: rgba($orange, 0.1);
  border: 1px solid rgba($orange, 0.25);
  gap: 12px;

  span {
    flex: 1;
    font-size: 14px;
    font-weight: 800;
    color: $text;
  }
}

.form-error {
  margin-top: 6px;
  font-size: 12px;
  color: $danger;
  font-weight: 800;
}
</style>
