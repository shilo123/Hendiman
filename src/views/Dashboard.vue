<template>
  <div class="dash" dir="rtl">
    <!-- Loading Overlay -->
    <HendimanLoader v-if="isLoading" />

    <!-- Handyman header (new design) -->
    <header
      v-if="
        isHendiman &&
        !isLoading &&
        (!currentAssignedJob || isChatMinimized) &&
        !showIncomeDetailModal &&
        isMobile
      "
      class="handyman-header-new"
    >
      <div class="handyman-header-new__left">
        <div class="relative group cursor-pointer" @click="onOpenProfile">
          <div class="handyman-header-new__avatar-glow"></div>
          <img
            v-if="me?.avatarUrl"
            :src="me.avatarUrl"
            alt="User Avatar"
            class="handyman-header-new__avatar"
          />
          <span v-else class="handyman-header-new__avatar-placeholder">👤</span>
          <div
            v-if="isAvailable"
            class="handyman-header-new__status-dot"
          ></div>
        </div>
        <div class="handyman-header-new__info">
          <span class="handyman-header-new__greeting">שלום,</span>
          <h1 class="handyman-header-new__name">
            {{ me?.name || me?.username || "הנדימן" }}
          </h1>
          <div
            class="handyman-header-new__availability"
            :class="{ 'handyman-header-new__availability--available': isAvailable }"
            @click="toggleAvailability"
          >
            <div class="handyman-header-new__availability-toggle">
              <div
                class="handyman-header-new__availability-dot"
                :class="{ 'handyman-header-new__availability-dot--active': isAvailable }"
              ></div>
            </div>
            <span class="handyman-header-new__availability-text">
              {{ isAvailable ? "זמין לעבודה" : "לא זמין" }}
            </span>
          </div>
        </div>
      </div>
      <div class="handyman-header-new__actions">
        <button
          class="handyman-header-new__action-btn handyman-header-new__action-btn--notifications"
          type="button"
          aria-label="התראות"
        >
          <i class="ph ph-bell"></i>
          <span class="handyman-header-new__notification-dot"></span>
        </button>
      </div>
    </header>

    <!-- Client header (new design) -->
    <header
      v-if="
        !isHendiman &&
        !isLoading &&
        (!currentAssignedJob || isChatMinimized) &&
        !showIncomeDetailModal &&
        isMobile
      "
      class="client-header-new"
    >
      <div class="client-header-new__left">
        <div class="relative group cursor-pointer" @click="onOpenProfile">
          <div class="client-header-new__avatar-glow"></div>
          <img
            v-if="me?.avatarUrl"
            :src="me.avatarUrl"
            alt="User Avatar"
            class="client-header-new__avatar"
          />
          <span v-else class="client-header-new__avatar-placeholder">👤</span>
        </div>
        <div class="client-header-new__info">
          <span class="client-header-new__badge">
            לקוח
          </span>
          <h1 class="client-header-new__name">
            {{ me?.name || me?.username || "לקוח" }}
          </h1>
        </div>
      </div>
      <div class="client-header-new__actions">
      <button
          class="client-header-new__action-btn"
        type="button"
          aria-label="חיפוש"
      >
          <i class="ph ph-magnifying-glass"></i>
      </button>
        <button
          class="client-header-new__action-btn client-header-new__action-btn--notifications"
          type="button"
          aria-label="התראות"
        >
          <i class="ph ph-bell"></i>
          <span class="client-header-new__notification-dot"></span>
        </button>
      </div>
    </header>

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
        @job-approved="onJobApproved"
      />

      <!-- Regular Dashboard (when no assigned job) -->
      <template v-else>
        <!-- CLIENT: Create Call Button (above jobs - mobile only) -->
        <ClientActions
          v-if="!isHendiman"
          @create-call="onCreateCallCta"
          @how-it-works="onHowItWorks"
          class="client-actions-top"
        />

        <!-- CLIENT (mobile): handymen carousel with new design -->
        <HandymenList
          v-if="!isHendiman && isMobile"
          :filtered-handymen="filteredHandymen"
          :recent-jobs="recentJobs"
          @view-details="onViewHandymanDetails"
          @personal-request="onPersonalRequest"
          @block-handyman="onBlockHandyman"
          @view-job="onViewJob"
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
        <aside class="side" v-if="!isHendiman && !isMobile">
          <!-- CLIENT: Create Call Button (desktop only) -->
          <section v-if="!isHendiman" class="panel client-actions-panel">
            <ClientActions
              @create-call="onCreateCallCta"
              @how-it-works="onHowItWorks"
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
              @block-handyman="onBlockHandyman"
              @next-page="onNextPage"
              @prev-page="onPrevPage"
            />
          </section>
        </aside>

        <!-- HANDYMAN: quick profile & notes (removed from aside, will be at bottom) -->

        <!-- HANDYMAN: Filters on the right (desktop only) -->
        <aside v-if="isHendiman" class="side side--handyman-filters">
          <section class="panel">
            <div class="panel__head">
              <h2 class="h2">סנן עבודות</h2>
            </div>

            <div class="handyman-filters-desktop">
              <!-- Location Filter -->
              <div class="panel panel--filter-desktop">
                <div class="panel__label">מיקום</div>
                <div class="radio-group radio-group--horizontal">
                  <label class="radio-item radio-item--inline">
                    <input
                      type="radio"
                      name="locationFilterDesktop"
                      value="myLocation"
                      :checked="handymanFilters.locationType === 'myLocation'"
                      @change="onChangeLocationType('myLocation')"
                    />
                    <span class="radio-label">המיקום שלי</span>
                  </label>
                  <label class="radio-item radio-item--inline">
                    <input
                      type="radio"
                      name="locationFilterDesktop"
                      value="residence"
                      :checked="handymanFilters.locationType === 'residence'"
                      @change="onChangeLocationType('residence')"
                    />
                    <span class="radio-label">מקום המגורים שלי</span>
                  </label>
                </div>
              </div>

              <!-- Distance Filter -->
              <div class="panel panel--filter-desktop">
                <div class="panel__label">
                  מרחק (ק"מ)
                  <button
                    class="link link--small"
                    type="button"
                    @click="onResetKm"
                  >
                    איפוס
                  </button>
                </div>
                <div class="range-display">
                  <span class="range-value">עד {{ displayMaxKm }} ק״מ</span>
                </div>
                <input
                  class="range-input"
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  :value="handymanFilters.maxKm"
                  @input="handleKmInput($event.target.value)"
                  @change="handleKmChange($event.target.value)"
                />
              </div>

              <!-- Price Filter -->
              <div class="panel panel--filter-desktop">
                <div class="panel__label">
                  מחיר (₪)
                  <button
                    class="link link--small"
                    type="button"
                    @click="
                      onChangePriceRange({ minPrice: null, maxPrice: null })
                    "
                  >
                    איפוס
                  </button>
                </div>
                <div class="price-range price-range--horizontal">
                  <div class="price-input-group">
                    <label class="price-label">מינימום:</label>
                    <input
                      class="price-input"
                      type="number"
                      min="0"
                      :value="handymanFilters.minPrice"
                      @input="
                        onChangePriceRange({
                          minPrice: $event.target.value
                            ? Number($event.target.value)
                            : null,
                          maxPrice: handymanFilters.maxPrice,
                        })
                      "
                      placeholder="0"
                    />
                  </div>
                  <div class="price-input-group">
                    <label class="price-label">מקסימום:</label>
                    <input
                      class="price-input"
                      type="number"
                      min="0"
                      :value="handymanFilters.maxPrice"
                      @input="
                        onChangePriceRange({
                          minPrice: handymanFilters.minPrice,
                          maxPrice: $event.target.value
                            ? Number($event.target.value)
                            : null,
                        })
                      "
                      placeholder="ללא הגבלה"
                    />
                  </div>
                </div>
              </div>

              <!-- Work Type Filter -->
              <div class="panel panel--filter-desktop">
                <div class="panel__label">סוג קריאה</div>
                <div class="radio-group radio-group--horizontal">
                  <label class="radio-item radio-item--inline">
                    <input
                      type="radio"
                      name="workTypeFilterDesktop"
                      value=""
                      :checked="handymanFilters.workType === ''"
                      @change="onChangeWorkType('')"
                    />
                    <span class="radio-label">הכל</span>
                  </label>
                  <label class="radio-item radio-item--inline">
                    <input
                      type="radio"
                      name="workTypeFilterDesktop"
                      value="קלה"
                      :checked="handymanFilters.workType === 'קלה'"
                      @change="onChangeWorkType('קלה')"
                    />
                    <span class="radio-label">קלה</span>
                  </label>
                  <label class="radio-item radio-item--inline">
                    <input
                      type="radio"
                      name="workTypeFilterDesktop"
                      value="מורכבת"
                      :checked="handymanFilters.workType === 'מורכבת'"
                      @change="onChangeWorkType('מורכבת')"
                    />
                    <span class="radio-label">מורכבת</span>
                  </label>
                  <label class="radio-item radio-item--inline">
                    <input
                      type="radio"
                      name="workTypeFilterDesktop"
                      value="קשה"
                      :checked="handymanFilters.workType === 'קשה'"
                      @change="onChangeWorkType('קשה')"
                    />
                    <span class="radio-label">קשה</span>
                  </label>
                </div>
              </div>
            </div>
          </section>
        </aside>

        <!-- Rating Prompt for Client (when job is done and approved but not rated) -->
        <div
          v-if="
            !isHendiman && pendingRatingJob && !pendingRatingJob.ratingSubmitted
          "
          class="rating-prompt-dashboard"
        >
          <div class="rating-prompt-dashboard__content">
            <h3 class="rating-prompt-dashboard__title">דרג את ההנדימן</h3>
            <p class="rating-prompt-dashboard__subtitle">
              עבודה: {{ getJobDisplayName(pendingRatingJob) }}
            </p>
            <button
              class="rating-prompt-dashboard__button"
              type="button"
              @click="submitPendingRating"
            >
              המשך לדירוג
            </button>
          </div>
        </div>

        <!-- HANDYMAN (mobile): new design -->
        <div
          v-if="isHendiman && isMobile"
          class="handyman-dashboard-new"
        >
          <!-- Urgent Jobs Section -->
          <section
            v-if="urgentJobs.length > 0"
            class="handyman-dashboard-new__section"
          >
            <div class="handyman-dashboard-new__section-header">
              <h2 class="handyman-dashboard-new__section-title">
                קריאה דחופה
              </h2>
              <span class="handyman-dashboard-new__urgent-pulse">
                <span class="handyman-dashboard-new__urgent-pulse-inner"></span>
                <span class="handyman-dashboard-new__urgent-pulse-outer"></span>
              </span>
            </div>

            <div
              v-for="job in urgentJobs"
              :key="job.id || job._id"
              class="handyman-dashboard-new__urgent-card"
            >
              <div class="handyman-dashboard-new__urgent-card-content">
                <div class="handyman-dashboard-new__urgent-card-header">
                  <div class="handyman-dashboard-new__urgent-client-info">
                    <div class="handyman-dashboard-new__urgent-avatar">
                      <img
                        :src="getClientAvatar(job)"
                        :alt="job.clientName"
                        class="handyman-dashboard-new__urgent-avatar-img"
                      />
                    </div>
                    <div>
                      <h3 class="handyman-dashboard-new__urgent-title">
                        {{ getJobTitleForHandyman(job) }}
                      </h3>
                      <p class="handyman-dashboard-new__urgent-subtitle">
                        אצל {{ job.clientName }} • {{ formatJobTimeAgo(job) }}
                      </p>
                    </div>
                  </div>
                  <div class="handyman-dashboard-new__urgent-badge">
                    SOS
                  </div>
                </div>

                <div class="handyman-dashboard-new__urgent-meta">
                  <div class="handyman-dashboard-new__urgent-meta-item">
                    <i class="ph-fill ph-map-pin"></i>
                    <span>{{ getJobLocation(job) }}</span>
                  </div>
                  <div class="handyman-dashboard-new__urgent-meta-separator"></div>
                  <div class="handyman-dashboard-new__urgent-meta-item">
                    <i class="ph-fill ph-navigation-arrow"></i>
                    <span>{{ formatJobDistance(job) }}</span>
                  </div>
                </div>

                <div class="handyman-dashboard-new__urgent-actions">
                  <button
                    type="button"
                    class="handyman-dashboard-new__urgent-btn handyman-dashboard-new__urgent-btn--reject"
                    @click="onRejectJob(job)"
                  >
                    דחה
                  </button>
                  <button
                    type="button"
                    class="handyman-dashboard-new__urgent-btn handyman-dashboard-new__urgent-btn--accept"
                    @click="onAcceptJob(job)"
                  >
                    <i class="ph-fill ph-phone-call"></i>
                    קבל קריאה
                  </button>
                </div>
              </div>
            </div>
          </section>

          <!-- Quoted Jobs Section -->
          <section
            v-if="quotedJobs.length > 0"
            class="handyman-dashboard-new__section"
          >
            <div class="handyman-dashboard-new__section-header">
              <h2 class="handyman-dashboard-new__section-title">
                <span class="handyman-dashboard-new__title-accent"></span>
                עבודות בהצעת מחיר
              </h2>
              <button
                type="button"
                class="handyman-dashboard-new__filter-btn"
                aria-label="סינון"
              >
                <i class="ph ph-sliders-horizontal"></i>
                סינון
              </button>
            </div>

            <div class="handyman-dashboard-new__quoted-jobs">
              <div
                v-for="job in quotedJobs"
                :key="job.id || job._id"
                class="handyman-dashboard-new__quoted-card"
              >
                <div class="handyman-dashboard-new__quoted-card-content">
                  <div class="handyman-dashboard-new__quoted-card-header">
                    <div>
                      <h3 class="handyman-dashboard-new__quoted-title">
                        {{ getJobTitleForHandyman(job) }}
                      </h3>
                      <div class="handyman-dashboard-new__quoted-categories">
                        <span
                          v-for="category in getJobCategories(job)"
                          :key="category"
                          class="handyman-dashboard-new__quoted-category-tag"
                        >
                          {{ category }}
                        </span>
                      </div>
                    </div>
                    <div class="handyman-dashboard-new__quoted-budget">
                      <span class="handyman-dashboard-new__quoted-budget-label">תקציב משוער</span>
                      <span class="handyman-dashboard-new__quoted-budget-value">
                        ₪{{ formatJobBudget(job) }}
                      </span>
                    </div>
                  </div>

                  <div class="handyman-dashboard-new__quoted-client">
                    <img
                      :src="getClientAvatar(job)"
                      :alt="job.clientName"
                      class="handyman-dashboard-new__quoted-client-avatar"
                    />
                    <span class="handyman-dashboard-new__quoted-client-name">
                      {{ job.clientName }}
                    </span>
                    <span class="handyman-dashboard-new__quoted-client-separator">•</span>
                    <span class="handyman-dashboard-new__quoted-client-location">
                      {{ getJobLocation(job) }} ({{ formatJobDistance(job) }})
                    </span>
                  </div>

                  <button
                    type="button"
                    class="handyman-dashboard-new__quoted-btn"
                    @click="onOpenQuotationModal(job)"
                  >
                    <i class="ph-bold ph-paper-plane-right"></i>
                    שלח הצעת מחיר
                  </button>
                </div>
              </div>
            </div>
          </section>

          <!-- Regular Jobs Section -->
          <section class="handyman-dashboard-new__section">
            <h2 class="handyman-dashboard-new__section-title-small">
              עבודות רגילות
              <span class="handyman-dashboard-new__jobs-count">
                {{ regularJobs.length }}
              </span>
            </h2>

            <div class="handyman-dashboard-new__regular-jobs">
              <div
                v-for="job in regularJobs"
                :key="job.id || job._id"
                class="handyman-dashboard-new__regular-card"
                @click="onViewJob(job)"
              >
                <div class="handyman-dashboard-new__regular-icon">
                  <i :class="getJobIconForHandyman(job)"></i>
                </div>
                <div class="handyman-dashboard-new__regular-content">
                  <h4 class="handyman-dashboard-new__regular-title">
                    {{ getJobTitleForHandyman(job) }}
                  </h4>
                  <p class="handyman-dashboard-new__regular-meta">
                    {{ job.clientName }} • {{ formatJobDistance(job) }}
                  </p>
                </div>
                <button
                  type="button"
                  class="handyman-dashboard-new__regular-arrow"
                  @click.stop="onViewJob(job)"
                >
                  <i class="ph-bold ph-caret-left"></i>
                </button>
              </div>
            </div>
          </section>
        </div>

        <!-- LEFT ~60% JOBS (Desktop or fallback) -->
        <JobsSection
          v-if="!isMobile || !isHendiman"
          :isHendiman="isHendiman"
          :isMobile="isMobile"
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
          :hideFiltersOnDesktop="isHendiman && !isMobile"
          :user-name="me?.name || me?.username || ''"
          :user-plan="me?.subscriptionPlanType ? 'תוכנית פרימיום' : ''"
          :user-avatar="me?.avatarUrl || ''"
          :user-city="me?.city || store.user?.city || ''"
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
          @quotation="onQuotation"
          @next-jobs-page="onJobsNextPage"
          @prev-jobs-page="onJobsPrevPage"
          @filter-opened="isFilterModalOpen = true"
          @filter-closed="isFilterModalOpen = false"
          @open-quotation-modal="onOpenQuotationModal"
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

        <HandymanDetailsSheet
          v-if="handymanDetails"
          :handyman="handymanDetails"
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
        <!-- Trial Expired Modal -->
        <div v-if="showTrialExpiredModal" class="trial-expired-modal" dir="rtl">
          <div class="trial-expired-modal__content">
            <div class="trial-expired-modal__header">
              <h2 class="trial-expired-modal__title">תקופת הנסיון שלך נגמרה</h2>
              <p class="trial-expired-modal__subtitle">
                כדי להמשיך להשתמש בפלטפורמה, אנא מלא את פרטי כרטיס האשראי
              </p>
            </div>
            <div
              v-if="trialExpiredRequiresPayment"
              class="trial-expired-modal__body"
            >
              <form @submit.prevent="handleTrialPaymentSubmit">
                <div class="trial-payment-form">
                  <div id="trial-payment-element" class="trial-payment-element">
                    <!-- Stripe Payment Element will mount here -->
                  </div>
                  <div
                    id="trial-payment-errors"
                    class="trial-payment-errors"
                  ></div>
                  <button
                    type="submit"
                    class="trial-payment-submit"
                    :disabled="isProcessingTrialPayment || !isStripeReady"
                  >
                    <span v-if="isProcessingTrialPayment">מעדכן...</span>
                    <span v-else>המשך</span>
                  </button>
                </div>
              </form>
            </div>
            <div v-else class="trial-expired-modal__body">
              <p class="trial-expired-modal__message">
                תקופת הנסיון שלך נגמרה. מעתה נתחיל לחייב אותך לפי המנוי שלך.
              </p>
              <button
                type="button"
                class="trial-payment-submit"
                @click="handleTrialExpiredConfirm"
              >
                הבנתי
              </button>
            </div>
          </div>
        </div>
        <!-- Subscription Required Modal (for handyman without subscription) -->
        <div
          v-if="showSubscriptionModal"
          class="subscription-required-modal"
          dir="rtl"
        >
          <div class="subscription-required-modal__content">
            <div class="subscription-required-modal__header">
              <h2 class="subscription-required-modal__title">
                נדרש מנוי להמשך שימוש
              </h2>
              <p class="subscription-required-modal__subtitle">
                כדי להמשיך להשתמש בפלטפורמה, אנא בחר מנוי או השתמש בגישה חינם
              </p>
            </div>

            <!-- Subscription Plans -->
            <div class="subscription-plans">
              <!-- Annual Plan (Recommended) -->
              <div
                class="subscription-plan subscription-plan--annual"
                :class="{
                  'subscription-plan--selected':
                    selectedSubscriptionPlan === 'annual',
                }"
                @click="selectedSubscriptionPlan = 'annual'"
              >
                <div class="subscription-plan__badge">⭐ מומלץ</div>
                <div class="subscription-plan__header">
                  <div class="subscription-plan__icon">📅</div>
                  <div class="subscription-plan__title">מנוי שנתי</div>
                </div>
                <div class="subscription-plan__price-wrapper">
                  <div class="subscription-plan__price-old">
                    <span class="subscription-plan__price-old-amount"
                      >598.80</span
                    >
                    <span class="subscription-plan__price-old-currency">₪</span>
                  </div>
                  <div class="subscription-plan__price">
                    <span class="subscription-plan__price-amount">499.90</span>
                    <span class="subscription-plan__price-currency">₪</span>
                    <span class="subscription-plan__price-period">/שנה</span>
                  </div>
                </div>
                <div class="subscription-plan__warning">
                  ⚠️ לא ניתן לבטל את המנוי באמצע שנה
                </div>
              </div>

              <!-- Monthly Plan -->
              <div
                class="subscription-plan subscription-plan--monthly"
                :class="{
                  'subscription-plan--selected':
                    selectedSubscriptionPlan === 'monthly',
                }"
                @click="selectedSubscriptionPlan = 'monthly'"
              >
                <div class="subscription-plan__header">
                  <div class="subscription-plan__icon">📆</div>
                  <div class="subscription-plan__title">מנוי חודשי</div>
                </div>
                <div class="subscription-plan__price">
                  <span class="subscription-plan__price-amount">49.90</span>
                  <span class="subscription-plan__price-currency">₪</span>
                  <span class="subscription-plan__price-period">/חודש</span>
                </div>
                <div class="subscription-plan__monthly-note">
                  התשלום יתבצע מדי חודש אוטומטית
                </div>
                <div class="subscription-plan__cancel-note">
                  תוכל לבטל את המנוי בכל עת
                </div>
              </div>
            </div>

            <!-- Payment Form (shown when plan is selected) -->
            <div
              v-if="showSubscriptionPaymentForm"
              class="subscription-payment-form"
            >
              <!-- Amount Display -->
              <div class="subscription-payment-form__amount">
                <label class="subscription-payment-form__label"
                  >סכום לתשלום</label
                >
                <div class="subscription-payment-form__amount-display">
                  {{
                    formatCurrency(
                      selectedSubscriptionPlan === "annual" ? 499.9 : 49.9
                    )
                  }}
                  <span class="subscription-payment-form__period">
                    {{
                      selectedSubscriptionPlan === "annual" ? "/שנה" : "/חודש"
                    }}
                  </span>
                </div>
              </div>

              <!-- Stripe Payment Element (only if fillCreditCardNow is true) -->
              <div
                v-if="fillCreditCardNow"
                class="subscription-payment-form__field"
              >
                <label class="subscription-payment-form__label"
                  >פרטי תשלום</label
                >
                <!-- Container wrapper with relative positioning -->
                <div
                  class="subscription-payment-form__field-wrapper"
                  style="position: relative"
                >
                  <!-- Container - always present in DOM -->
                  <div
                    id="subscription-payment-element"
                    class="subscription-payment-form__stripe-element"
                    :style="{
                      display: isLoadingSubscriptionPayment ? 'none' : 'block',
                    }"
                  >
                    <!-- Stripe Payment Element will mount here when ready -->
                  </div>
                  <!-- Loading State - overlay -->
                  <div
                    v-if="isLoadingSubscriptionPayment"
                    class="subscription-payment-form__loading"
                  >
                    <div
                      class="subscription-payment-form__loading-spinner"
                    ></div>
                    <div class="subscription-payment-form__loading-text">
                      טוען פרטי תשלום...
                    </div>
                  </div>
                </div>
                <div
                  id="subscription-payment-errors"
                  class="subscription-payment-form__error"
                  role="alert"
                ></div>
              </div>

              <!-- Security Notice (only if fillCreditCardNow is true) -->
              <div
                v-if="fillCreditCardNow"
                class="subscription-payment-form__security"
              >
                <div class="subscription-payment-form__security-icon">🔒</div>
                <div class="subscription-payment-form__security-text">
                  התשלום מאובטח ומצפין. פרטי הכרטיס שלך לא נשמרים בשרת שלנו.
                </div>
              </div>

              <!-- Error Message -->
              <div
                v-if="subscriptionError"
                class="subscription-payment-form__error subscription-payment-form__error--submit"
              >
                {{ subscriptionError }}
              </div>

              <!-- Switch: Fill credit card now or after 14 days -->
              <div class="subscription-payment-toggle">
                <label class="subscription-payment-toggle__label">
                  <span class="subscription-payment-toggle__text">
                    {{
                      fillCreditCardNow
                        ? "מלא פרטי אשראי עכשיו"
                        : "מלא פרטי אשראי אחרי 14 יום חינם"
                    }}
                  </span>
                  <input
                    type="checkbox"
                    v-model="fillCreditCardNow"
                    class="subscription-payment-toggle__input"
                    @change="handlePaymentToggleChange"
                  />
                  <span class="subscription-payment-toggle__slider"></span>
                </label>
              </div>

              <!-- Submit Button -->
              <button
                type="button"
                class="subscription-required-modal__btn subscription-required-modal__btn--subscribe"
                @click="handleSubscriptionPayment"
                :disabled="
                  isProcessingSubscription ||
                  (fillCreditCardNow &&
                    (!isSubscriptionStripeReady || !subscriptionClientSecret))
                "
              >
                <span v-if="isProcessingSubscription">מעבד תשלום...</span>
                <span v-else-if="fillCreditCardNow">
                  לתשלום
                  {{
                    selectedSubscriptionPlan === "annual"
                      ? formatCurrency(499.9) + " /שנה"
                      : formatCurrency(49.9) + " /חודש"
                  }}
                </span>
                <span v-else>התחל 14 יום חינם</span>
              </button>
            </div>

            <!-- Actions (shown when payment form is not visible) -->
            <div v-else class="subscription-required-modal__actions">
              <!-- Switch: Fill credit card now or after 14 days (only if showTrialToggle is true) -->
              <div v-if="showTrialToggle" class="subscription-payment-toggle">
                <label class="subscription-payment-toggle__label">
                  <span class="subscription-payment-toggle__text">
                    {{
                      fillCreditCardNow
                        ? "מלא פרטי אשראי עכשיו"
                        : "מלא פרטי אשראי אחרי 14 יום חינם"
                    }}
                  </span>
                  <input
                    type="checkbox"
                    v-model="fillCreditCardNow"
                    class="subscription-payment-toggle__input"
                    @change="handlePaymentToggleChange"
                  />
                  <span class="subscription-payment-toggle__slider"></span>
                </label>
              </div>

              <button
                type="button"
                class="subscription-required-modal__btn subscription-required-modal__btn--subscribe"
                @click="handleSubscribe"
                :disabled="!selectedSubscriptionPlan"
              >
                {{
                  fillCreditCardNow
                    ? `לתשלום ${
                        selectedSubscriptionPlan === "annual"
                          ? "499.90 ₪ /שנה"
                          : "49.90 ₪ /חודש"
                      }`
                    : "התחל 14 יום חינם"
                }}
              </button>
            </div>
          </div>
        </div>

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
                :disabled="isApprovingPayment"
                @click="handleClientApprove"
              >
                <span v-if="!isApprovingPayment">כן, אשר ושחרר תשלום</span>
                <span v-else>מאשר...</span>
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

        <!-- Problem Report Modal -->
        <ProblemReportModal
          :isVisible="showProblemReportModal"
          :job="pendingApprovalJob"
          @close="showProblemReportModal = false"
          @approve="handleApproveFromProblemModal"
        />

        <!-- Income Detail Modal (for handyman) -->
        <IncomeDetailModal
          v-if="isHendiman"
          :isVisible="showIncomeDetailModal"
          :jobInfo="incomeDetailJob"
          :paymentInfo="incomeDetailPayment"
          @close="showIncomeDetailModal = false"
          :key="`income-modal-${
            incomeDetailJob?._id || incomeDetailJob?.id || 'default'
          }`"
        />

        <!-- Client Quotations Modal -->
        <ClientQuotationsModal
          v-if="!isHendiman"
          :visible="showClientQuotationsModal"
          :job="selectedQuotedJob"
          @close="showClientQuotationsModal = false"
          @accepted="onQuotationAccepted"
          @rejected="onQuotationRejected"
          @show-handyman-details="onShowHandymanDetailsFromQuotation"
        />

        <!-- Handyman Quotation Modal -->
        <HandymanQuotationModal
          v-if="isHendiman"
          :visible="showHandymanQuotationModal"
          :job="selectedQuotedJob"
          :handymanId="store.user?._id || me?._id || $route.params.id"
          :handymanName="store.user?.username || me?.name || ''"
          @close="showHandymanQuotationModal = false"
          @submitted="onQuotationSubmitted"
        />

        <!-- Handyman Quotations View Modal -->
        <HandymanQuotationsViewModal
          v-if="isHendiman"
          :visible="showHandymanQuotationsViewModal"
          :jobs="jobs"
          :handymanId="store.user?._id || me?._id || $route.params.id"
          @close="showHandymanQuotationsViewModal = false"
        />

        <!-- Onboarding Required Modal (for handyman) - REMOVED -->

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

    <!-- Block Handyman Confirmation Modal -->
    <div
      v-if="showBlockHandymanModal"
      class="blockHandymanModal"
      dir="rtl"
      @click.self="closeBlockHandymanModal"
    >
      <div class="blockHandymanModal__content">
        <button
          class="blockHandymanModal__close"
          type="button"
          @click="closeBlockHandymanModal"
          aria-label="סגור"
        >
          ✕
        </button>
        <div class="blockHandymanModal__icon">
          {{ isUnblockingHandyman ? "🔓" : "🚫" }}
        </div>
        <h2 class="blockHandymanModal__title">
          {{ isUnblockingHandyman ? "בטל חסימת הנדימן" : "חסום הנדימן" }}
        </h2>
        <p class="blockHandymanModal__message">
          {{
            isUnblockingHandyman
              ? `האם אתה בטוח שאתה רוצה לבטל את החסימה של ${handymanToBlockName}?`
              : `האם אתה בטוח שאתה רוצה לחסום את ${handymanToBlockName}?`
          }}
        </p>
        <div class="blockHandymanModal__actions">
          <button
            class="blockHandymanModal__btn blockHandymanModal__btn--confirm"
            type="button"
            :disabled="isBlockingHandyman"
            @click="confirmBlockHandyman"
          >
            <span v-if="!isBlockingHandyman">
              {{ isUnblockingHandyman ? "כן, בטל חסימה" : "כן, חסום" }}
            </span>
            <span v-else>{{
              isUnblockingHandyman ? "מבטל..." : "חוסם..."
            }}</span>
          </button>
          <button
            class="blockHandymanModal__btn blockHandymanModal__btn--cancel"
            type="button"
            :disabled="isBlockingHandyman"
            @click="closeBlockHandymanModal"
          >
            ביטול
          </button>
        </div>
      </div>
    </div>

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

    <!-- Minimizable Notifications -->
    <!-- Handyman: Waiting for client approval after marking job as done -->
    <MinimizableNotification
      v-if="showHandymanDoneNotification"
      :visible="showHandymanDoneNotification"
      title="ממתין לאישור הלקוח"
      message="מחכים לאישור הלקוח שסיימת את העבודה והכסף יגיע אליך"
      :icon="['fas', 'clock']"
      action-button="הלקוח לא אישר? פנה אלינו"
      @close="showHandymanDoneNotification = false"
      @action="handleContactSupport"
    />

    <!-- Handyman: Client approved and payment released -->
    <MinimizableNotification
      v-if="showHandymanApprovedNotification"
      :visible="showHandymanApprovedNotification"
      title="התשלום אושר"
      message="קיבלת את הכסף חשבונית נשלחה במייל"
      :icon="['fas', 'check-circle']"
      @close="showHandymanApprovedNotification = false"
    />

    <!-- Handyman: Client cancelled the job -->
    <MinimizableNotification
      v-if="showHandymanCancelledNotification"
      :visible="showHandymanCancelledNotification"
      title="עבודה בוטלה"
      message="אנחנו מצטערים אך הלקוח ביטל את העבודה במידת הצורך תקבל פיצוי"
      :icon="['fas', 'exclamation-triangle']"
      @close="showHandymanCancelledNotification = false"
    />

    <!-- Client: Payment transferred -->
    <MinimizableNotification
      v-if="showClientPaymentNotification"
      :visible="showClientPaymentNotification"
      title="התשלום הועבר"
      message="התשלום הועבר חשבונית נשלחה במייל"
      :icon="['fas', 'check-circle']"
      @close="showClientPaymentNotification = false"
    />

    <!-- Mobile client: floating + and bottom nav (screenshot-like UI) -->
    <button
      v-if="
        !isHendiman &&
        isMobile &&
        !isLoading &&
        (!currentAssignedJob || isChatMinimized) &&
        showFabAfterScroll
      "
      class="fab"
      type="button"
      aria-label="צור קריאה"
      @click="onCreateCallCta"
    >
      <span class="fab__plus" aria-hidden="true">+</span>
      <span class="fab__label">צור קריאה</span>
    </button>

    <!-- Client Bottom Navigation (new design) -->
    <nav
      v-if="
        !isHendiman &&
        isMobile &&
        !isLoading &&
        (!currentAssignedJob || isChatMinimized) &&
        !isFilterModalOpen
      "
      class="client-bottom-nav-new"
      aria-label="ניווט"
    >
      <div class="client-bottom-nav-new__container">
        <button
          type="button"
          class="client-bottom-nav-new__item"
          @click="handleNavItemClick({ action: 'openProfile' })"
        >
          <i class="ph ph-user"></i>
          <span class="client-bottom-nav-new__label">חשבון</span>
      </button>
        <button
          type="button"
          class="client-bottom-nav-new__item client-bottom-nav-new__item--with-badge"
          @click="handleNavItemClick({ action: 'openHandymenChat' })"
        >
          <div class="client-bottom-nav-new__icon-wrapper">
            <i class="ph ph-chat-circle-dots"></i>
            <span class="client-bottom-nav-new__badge"></span>
          </div>
          <span class="client-bottom-nav-new__label">צ'אט</span>
      </button>
        <button
          type="button"
          class="client-bottom-nav-new__item client-bottom-nav-new__item--home"
          @click="$router.push('/')"
        >
          <div class="client-bottom-nav-new__home-icon">
            <i class="ph-fill ph-house"></i>
          </div>
          <span class="client-bottom-nav-new__label client-bottom-nav-new__label--home">דף הבית</span>
      </button>
        <button
          type="button"
          class="client-bottom-nav-new__item"
          @click="handleNavItemClick({ action: 'viewHistory' })"
        >
          <i class="ph ph-clock-counter-clockwise"></i>
          <span class="client-bottom-nav-new__label">היסטוריה</span>
        </button>
        <button
          type="button"
          class="client-bottom-nav-new__item"
          @click="handleNavItemClick({ action: 'share' })"
        >
          <i class="ph ph-share-network"></i>
          <span class="client-bottom-nav-new__label">שתף</span>
        </button>
      </div>
    </nav>

    <!-- Handyman Bottom Navigation (new design) -->
    <nav
      v-if="
        isHendiman &&
        isMobile &&
        !isLoading &&
        (!currentAssignedJob || isChatMinimized) &&
        !isFilterModalOpen
      "
      class="handyman-bottom-nav-new"
      aria-label="ניווט"
    >
      <div class="handyman-bottom-nav-new__container">
        <button
          type="button"
          class="handyman-bottom-nav-new__item"
          @click="handleNavItemClick({ action: 'openProfile' })"
        >
          <i class="ph ph-user"></i>
          <span class="handyman-bottom-nav-new__label">פרופיל</span>
        </button>
        <button
          type="button"
          class="handyman-bottom-nav-new__item handyman-bottom-nav-new__item--with-badge"
          @click="handleNavItemClick({ action: 'openHandymenChat' })"
        >
          <div class="handyman-bottom-nav-new__icon-wrapper">
            <i class="ph ph-chat-circle-dots"></i>
            <span class="handyman-bottom-nav-new__badge"></span>
          </div>
          <span class="handyman-bottom-nav-new__label">הודעות</span>
        </button>
        <button
          type="button"
          class="handyman-bottom-nav-new__item handyman-bottom-nav-new__item--home"
          @click="$router.push('/')"
        >
          <div class="handyman-bottom-nav-new__home-icon">
            <i class="ph-fill ph-briefcase"></i>
          </div>
          <span class="handyman-bottom-nav-new__label handyman-bottom-nav-new__label--home">עבודות</span>
        </button>
        <button
          type="button"
          class="handyman-bottom-nav-new__item"
          @click="handleNavItemClick({ action: 'viewCalendar' })"
        >
          <i class="ph ph-calendar-check"></i>
          <span class="handyman-bottom-nav-new__label">יומן</span>
        </button>
        <button
          type="button"
          class="handyman-bottom-nav-new__item"
          @click="handleNavItemClick({ action: 'viewWallet' })"
        >
          <i class="ph ph-wallet"></i>
          <span class="handyman-bottom-nav-new__label">ארנק</span>
        </button>
      </div>
    </nav>
  </div>
</template>

<script>
import { useMainStore } from "@/store/index";
import DashboardTopBar from "@/components/Dashboard/DashboardTopBar.vue";
import JobsSection from "@/components/Dashboard/JobsSection.vue";
import HandymenList from "@/components/Dashboard/HandymenList.vue";
import ClientActions from "@/components/Dashboard/ClientActions.vue";
import HandymanTools from "@/components/Dashboard/HandymanTools.vue";
import HandymanDetailsSheet from "@/components/Dashboard/HandymanDetailsSheet.vue";
import ViewJob from "@/components/Dashboard/ViewJob.vue";
import HandymanQuotationModal from "@/components/Dashboard/HandymanQuotationModal.vue";
import ProfileSheet from "@/components/Dashboard/ProfileSheet.vue";
import JobChat from "@/components/Dashboard/JobChat.vue";
import JobChatMobile from "@/components/Dashboard/JobChatMobile.vue";
import MinimizableNotification from "@/components/Global/MinimizableNotification.vue";
import HendimanLoader from "@/components/Global/HendimanLoader.vue";
import ProblemReportModal from "@/components/Dashboard/ProblemReportModal.vue";
import IncomeDetailModal from "@/components/Dashboard/IncomeDetailModal.vue";
import ClientQuotationsModal from "@/components/Dashboard/ClientQuotationsModal.vue";
import HandymanQuotationsViewModal from "@/components/Dashboard/HandymanQuotationsViewModal.vue";
import logger from "@/utils/logger";
import axios from "axios";
import { URL } from "@/Url/url";
import { useToast } from "@/composables/useToast";
import { getCurrentLocation } from "@/utils/geolocation";
import { io } from "socket.io-client";
// Web push notifications removed - only native apps are supported
import { Capacitor } from "@capacitor/core";
import AddressAutocomplete from "@/components/Global/AddressAutocomplete.vue";
import citiesData from "@/APIS/AdressFromIsrael.json";
import { loadStripe } from "@stripe/stripe-js";

export default {
  name: "DashboardView",
  components: {
    DashboardTopBar,
    JobsSection,
    HandymenList,
    ClientActions,
    HandymanTools,
    HandymanDetailsSheet,
    ViewJob,
    HandymanQuotationModal,
    ProfileSheet,
    JobChat,
    JobChatMobile,
    AddressAutocomplete,
    MinimizableNotification,
    HendimanLoader,
    ProblemReportModal,
    IncomeDetailModal,
    ClientQuotationsModal,
    HandymanQuotationsViewModal,
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
      localMaxKm: null, // For display while dragging the range input
      handymanDetails: null,
      dirFilters: { q: "", minRating: 0, minJobs: 0 },
      activeAssignedJob: null,
      isChatMinimized: false,
      showFabAfterScroll: false,
      pendingActiveJobId: null, // Store active job ID from fast check
      doneJobsCache: [], // Cache for done jobs that need client approval (persists after refresh)
      showJobCancelledModal: false,
      cancelledBy: "handyman", // Track who cancelled: "handyman" or "client"
      showOnboardingModal: false, // Show onboarding popup for handyman
      onboardingUrl: null, // Onboarding URL to display
      showClientApprovalModal: false, // Show approval popup for client
      pendingApprovalJob: null, // Job that needs client approval
      isApprovingPayment: false, // Loading state for payment approval
      showProblemReportModal: false, // Show problem report modal
      showIncomeDetailModal: false, // Show income detail modal for handyman
      incomeDetailJob: null, // Job for income detail
      incomeDetailPayment: null, // Payment info for income detail
      showClientQuotationsModal: false, // Show client quotations modal
      showHandymanQuotationModal: false, // Show handyman quotation modal
      showHandymanQuotationsViewModal: false, // Show handyman quotations view modal
      selectedQuotedJob: null, // Selected job with quotations for client/handyman
      quotationsPollingInterval: null, // Interval for polling quotations
      isMobile: window.innerWidth <= 768,
      // Rating for client
      pendingRatingValue: 0,
      pendingRatingHover: 0,
      pendingRatingReview: "",
      isSubmittingRating: false,
      jobToEdit: null,
      showEditJobModal: false,
      jobToDelete: null,
      // Trial expired modal
      showTrialExpiredModal: false,
      trialExpiredRequiresPayment: false,
      stripe: null,
      elements: null,
      paymentElement: null,
      stripePublishableKey: null,
      isStripeReady: false,
      setupIntentClientSecret: null,
      isProcessingTrialPayment: false,
      showDeleteJobModal: false,
      isDeletingJob: false,
      // Filter modal state
      isFilterModalOpen: false,
      // Subscription required modal
      showSubscriptionModal: false,
      selectedSubscriptionPlan: "annual", // 'annual' or 'monthly'
      showSubscriptionPaymentForm: false,
      fillCreditCardNow: false, // Switch: fill credit card now or after 14 days
      subscriptionStatus: null, // Store subscription status from API
      // Stripe for subscription
      subscriptionStripe: null,
      subscriptionElements: null,
      subscriptionPaymentElement: null,
      subscriptionStripePublishableKey: null,
      isSubscriptionStripeReady: false,
      subscriptionClientSecret: null,
      isProcessingSubscription: false,
      subscriptionError: "",
      isLoadingSubscriptionPayment: false, // Loading state for payment form
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
      // Notification popups
      showHandymanDoneNotification: false,
      showHandymanApprovedNotification: false,
      showClientPaymentNotification: false,
      showHandymanCancelledNotification: false,
      // Block handyman modal
      showBlockHandymanModal: false,
      handymanToBlock: null,
      handymanToBlockName: null,
      isBlockingHandyman: false,
      isUnblockingHandyman: false,
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
    displayMaxKm() {
      // Show local value while dragging, otherwise show the actual value
      return this.localMaxKm !== null
        ? this.localMaxKm
        : this.handymanFilters.maxKm;
    },
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
    showTrialToggle() {
      // Show toggle only if:
      // 1. User is not in trial period (needsBilling is true or subscriptionExpiresAt has passed)
      // 2. User is not FREE
      if (!this.subscriptionStatus) return true; // Default to showing if status not loaded

      // Don't show toggle for FREE users
      if (this.subscriptionStatus.isFree) return false;

      // If subscriptionExpiresAt exists and has passed, don't show toggle (must pay now)
      if (this.subscriptionStatus.subscriptionExpiresAt) {
        const expiresAt = new Date(
          this.subscriptionStatus.subscriptionExpiresAt
        );
        const now = new Date();
        if (now >= expiresAt) {
          return false; // Expired - must pay now, no toggle
        }
      }

      // If needsBilling is true (after trial/expiration), don't show toggle
      if (this.subscriptionStatus.needsBilling) {
        return false; // Must pay now, no toggle
      }

      // If in trial, show toggle
      if (this.subscriptionStatus.isTrial) {
        return true; // In trial - can choose to pay now or later
      }

      // Default: show toggle
      return true;
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
    pendingRatingJob() {
      // Find job that needs rating (for client only)
      if (this.isHendiman) return null;

      const userId = this.store.user?._id || this.me?._id;
      if (!userId) return null;

      const userIdStr = String(userId);
      const allJobs = this.store.jobs || [];

      // Find job that is done, approved, but not rated
      return (
        allJobs.find((job) => {
          return (
            job.clientId &&
            String(job.clientId) === userIdStr &&
            job.status === "done" &&
            job.clientApproved === true &&
            !job.ratingSubmitted
          );
        }) || null
      );
    },
    pendingRatingJob() {
      // Find job that needs rating (for client only)
      if (this.isHendiman) return null;

      const userId = this.store.user?._id || this.me?._id;
      if (!userId) return null;

      const userIdStr = String(userId);
      const allJobs = this.store.jobs || [];

      // Find job that is done, approved, but not rated
      return (
        allJobs.find((job) => {
          return (
            job.clientId &&
            String(job.clientId) === userIdStr &&
            job.status === "done" &&
            job.clientApproved === true &&
            !job.ratingSubmitted
          );
        }) || null
      );
    },
    hasClientPendingQuotations() {
      // Check if client has pending quotations
      if (this.isHendiman) return false;
      const userId = this.store.user?._id || this.me?._id;
      if (!userId) return false;
      const userIdStr = String(userId);
      const allJobs = this.store.jobs || [];
      return allJobs.some((job) => {
        return (
          job.clientId &&
          String(job.clientId) === userIdStr &&
          job.status === "quoted" &&
          Array.isArray(job.quotations) &&
          job.quotations.length > 0 &&
          !job.chosenQuotation
        );
      });
    },
    hasHandymanSubmittedQuotations() {
      // Check if handyman has submitted quotations
      if (!this.isHendiman) return false;
      const userId = this.store.user?._id || this.me?._id;
      if (!userId) return false;
      const userIdStr = String(userId);
      const allJobs = this.store.jobs || [];
      return allJobs.some((job) => {
        return (
          job.status === "quoted" &&
          Array.isArray(job.quotations) &&
          job.quotations.some((q) => String(q.handymanId) === userIdStr)
        );
      });
    },
    bottomNavItems() {
      // Calculate items for bottom nav based on user type and quotations
      const items = [];
      if (!this.isHendiman) {
        // Client nav items
        items.push({ id: 'personal', icon: 'share', text: 'האזור האישי שלי', action: null });
        items.push({ id: 'chat', icon: 'comment', text: 'צ\'אט', action: null, badge: true });
        if (this.hasClientPendingQuotations) {
          items.push({ id: 'quotations', icon: 'attach_money', text: 'ראה הצעות מחיר', action: 'openQuotations', highlight: true });
        }
        items.push({ id: 'account', icon: 'circle-user', text: 'חשבון', action: 'openProfile' });
      } else {
        // Handyman nav items
        items.push({ id: 'personal', icon: 'star', text: 'האזור האישי שלי', action: 'viewRatings' });
        items.push({ id: 'chat', icon: 'comment', text: 'צ\'אט', action: 'openHandymenChat', badge: true });
        if (this.hasHandymanSubmittedQuotations) {
          items.push({ id: 'myQuotations', icon: 'receipt', text: 'ראה הצעות שהצעת', action: 'openMyQuotations', highlight: true });
        }
        items.push({ id: 'account', icon: 'circle-user', text: 'חשבון', action: 'openProfile' });
      }
      return items;
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
          // עבור הנדימן: עבודה ב-"done" או "paid" לא נחשבת כעבודה פעילה
          let isHandymanInJob = false;
          if (job.handymanId) {
            if (Array.isArray(job.handymanId)) {
              isHandymanInJob = job.handymanId.some((id) => {
                // Handle both ObjectId and string - try multiple formats
                let idStr = "";
                if (id) {
                  if (id._id) {
                    idStr = String(id._id);
                  } else if (id.$oid) {
                    idStr = String(id.$oid);
                  } else if (typeof id === "object" && id.toString) {
                    idStr = id.toString();
                  } else {
                    idStr = String(id);
                  }
                }
                return idStr === userIdStr;
              });
            } else {
              // Handle single handymanId (not array)
              let handymanIdStr = "";
              if (job.handymanId) {
                if (job.handymanId._id) {
                  handymanIdStr = String(job.handymanId._id);
                } else if (job.handymanId.$oid) {
                  handymanIdStr = String(job.handymanId.$oid);
                } else if (
                  typeof job.handymanId === "object" &&
                  job.handymanId.toString
                ) {
                  handymanIdStr = job.handymanId.toString();
                } else {
                  handymanIdStr = String(job.handymanId);
                }
              }
              isHandymanInJob = handymanIdStr === userIdStr;
            }
          }
          // כל עבודה שלא בסטטוס "open" או "done" או ביטול צריכה להיפתח
          // בודק רק את הסטטוס - ללא תנאים נוספים של paymentStatus או ratingSubmitted
          const isCancelled =
            job.cancel === true ||
            job.isCancelled === true ||
            job.status === "cancelled";
          const isAssigned =
            isHandymanInJob &&
            job.status !== "open" &&
            job.status !== "done" &&
            !isCancelled;
          if (isAssigned) {
            logger.log(
              `[AssignedJobs] הנדימן משובץ לעבודה: ${
                job._id || job.id
              }, status: ${job.status}`
            );
          }
          return isAssigned;
        } else {
          // עבור לקוח - בודק אם clientId תואם
          // עבור לקוח: עבודה ב-"done" עם clientApproved: false צריכה להיפתח (לאשר)
          // עבור לקוח: עבודה שהתשלום שוחרר (paymentStatus: "paid") לא צריכה להיפתח
          // עבור לקוח: עבודה שדורגה (ratingSubmitted: true) לא צריכה להיפתח
          const isCancelled =
            job.cancel === true ||
            job.isCancelled === true ||
            job.status === "cancelled";
          return (
            job.clientId &&
            String(job.clientId) === userIdStr &&
            job.handymanId && // רק עבודות ששובצו
            job.status !== "open" && // לא עבודות פתוחות
            !isCancelled && // לא עבודות מבוטלות
            job.paymentStatus !== "paid" && // לא עבודות שהתשלום שוחרר
            !job.ratingSubmitted && // לא עבודות שדורגו
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
        // כל עבודה שהסטטוס שלה הוא לא "open" או "done" או עבודה מבוטלת תציג את הצ'אט
        // לא נבדוק paymentStatus או ratingSubmitted - רק status
        const isCancelled =
          this.activeAssignedJob.cancel === true ||
          this.activeAssignedJob.isCancelled === true ||
          this.activeAssignedJob.status === "cancelled";
        if (
          this.activeAssignedJob.status === "open" ||
          this.activeAssignedJob.status === "done" ||
          isCancelled
        ) {
          // אם העבודה סיימה או מבוטלת, נקה את activeAssignedJob כדי לסגור את הצ'אט
          this.activeAssignedJob = null;
          this.isChatMinimized = true;
          return null;
        }
        logger.log(
          `[CurrentAssigned] מחזיר activeAssignedJob: ${
            this.activeAssignedJob._id || this.activeAssignedJob.id
          }, status: ${this.activeAssignedJob.status}`
        );
        return this.activeAssignedJob;
      }
      if (this.currentAssignedJobs.length > 0) {
        const job = this.currentAssignedJobs[0];
        // בדוק גם כאן אם העבודה סיימה או מבוטלת
        const isCancelled =
          job?.cancel === true ||
          job?.isCancelled === true ||
          job?.status === "cancelled";
        if (
          job &&
          (job.status === "open" || job.status === "done" || isCancelled)
        ) {
          return null;
        }
        logger.log(
          `[CurrentAssigned] מחזיר עבודה מ-currentAssignedJobs: ${
            job._id || job.id
          }, status: ${job.status}`
        );
        return job;
      }
      return null;
    },
    recentJobs() {
      // Get recent jobs for activity section
      if (!this.jobs || !Array.isArray(this.jobs)) return [];
      const userId = this.store.user?._id || this.me?._id;
      if (!userId) return [];
      const userIdStr = String(userId);
      return this.jobs
        .filter(job => job.clientId && String(job.clientId) === userIdStr)
        .sort((a, b) => {
          const dateA = new Date(a.updatedAt || a.createdAt || 0);
          const dateB = new Date(b.updatedAt || b.createdAt || 0);
          return dateB - dateA;
        })
        .slice(0, 5); // Show only last 5 jobs
    },
    urgentJobs() {
      if (!this.isHendiman || !this.jobs) return [];
      return this.jobs
        .filter(job => {
          return (
            job.status === "open" &&
            job.urgent === true &&
            !job.handymanId &&
            !this.isJobExpired(job)
          );
        })
        .sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB - dateA;
        })
        .slice(0, 3); // Show max 3 urgent jobs
    },
    quotedJobs() {
      if (!this.isHendiman || !this.jobs) return [];
      const userId = this.store.user?._id || this.me?._id;
      if (!userId) return [];
      const userIdStr = String(userId);
      return this.jobs
        .filter(job => {
          // Jobs that are quoted and this handyman hasn't submitted a quotation yet
          return (
            job.status === "quoted" &&
            Array.isArray(job.quotations) &&
            !job.quotations.some(q => String(q.handymanId) === userIdStr) &&
            !this.isJobExpired(job)
          );
        })
        .sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB - dateA;
        })
        .slice(0, 5); // Show max 5 quoted jobs
    },
    regularJobs() {
      if (!this.isHendiman || !this.jobs) return [];
      return this.jobs
        .filter(job => {
          return (
            job.status === "open" &&
            job.urgent !== true &&
            !job.handymanId &&
            !this.isJobExpired(job) &&
            !this.quotedJobs.some(qj => String(qj._id || qj.id) === String(job._id || job.id))
          );
        })
        .sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB - dateA;
        })
        .slice(0, 10); // Show max 10 regular jobs
    },
  },

  methods: {
    async getCurrentLocation() {
      return await getCurrentLocation();
    },
    handleResize() {
      this.isMobile = window.innerWidth <= 768;
    },
    handleFabScroll() {
      const y =
        window.scrollY ??
        window.pageYOffset ??
        document.documentElement?.scrollTop ??
        document.body?.scrollTop ??
        0;
      this.showFabAfterScroll = y > 10;
    },
    async onRefresh() {
      // שמור את ה-jobId הנוכחי לפני refresh (אם יש)
      const currentJobId =
        this.activeAssignedJob?._id || this.activeAssignedJob?.id;

      const coords = this.userCoordinates;
      const data = await this.store.fetchDashboardData(
        this.$route.params.id,
        coords
      );
      // בדוק אם המשתמש נחסם בזמן שהוא בדף
      if (data && data.User && data.User.isBlocked === true) {
        this.$router.push({
          name: "logIn",
          query: { blocked: "true" },
        });
        return;
      }
      this.jobsPage = 1;

      // אחרי refresh, בדוק אם יש עבודה משובצת ופתח את הצ'אט
      await this.$nextTick();

      // אם היה job פעיל לפני ה-refresh, נסה למצוא אותו מחדש
      if (currentJobId) {
        const job = this.store.jobs?.find(
          (j) => String(j._id || j.id) === String(currentJobId)
        );
        if (job) {
          // אם העבודה סיימה (status: "done" או "open"), סגור את הצ'אט
          if (job.status === "open" || job.status === "done") {
            this.activeAssignedJob = null;
            this.isChatMinimized = true;
            // המשך לבדוק עבודות אחרות
          } else if (job.status !== "open" && job.status !== "done") {
            // העבודה עדיין פעילה - פתח את הצ'אט מחדש
            this.activeAssignedJob = job;
            this.isChatMinimized = false;
            return;
          }
        }
      }

      // אם לא היה job פעיל או שהוא לא נמצא, בדוק עבודה משובצת חדשה
      await this.checkForAssignedJob();
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

    handleNavItemClick(item) {
      if (!item.action) return;
      switch (item.action) {
        case 'openProfile':
          this.onOpenProfile();
          break;
        case 'viewRatings':
          this.onViewRatings();
          break;
        case 'openHandymenChat':
          this.onOpenHandymenChat();
          break;
        case 'openQuotations':
          // Find job with quotations and open modal
          const userId = this.store.user?._id || this.me?._id;
          if (!userId) return;
          const userIdStr = String(userId);
          const allJobs = this.store.jobs || [];
          const jobWithQuotations = allJobs.find((job) => {
            return (
              job.clientId &&
              String(job.clientId) === userIdStr &&
              job.status === "quoted" &&
              Array.isArray(job.quotations) &&
              job.quotations.length > 0 &&
              !job.chosenQuotation
            );
          });
          if (jobWithQuotations) {
            this.selectedQuotedJob = jobWithQuotations;
            this.showClientQuotationsModal = true;
          }
          break;
        case 'openMyQuotations':
          // Open modal to view handyman's quotations
          this.showHandymanQuotationsViewModal = true;
          break;
        case 'viewHistory':
          // Navigate to history/jobs section
          this.$nextTick(() => {
            const jobsSection = document.querySelector('.jobs-section, .grid');
            if (jobsSection) {
              jobsSection.scrollIntoView({ behavior: 'smooth' });
            }
          });
          break;
        case 'share':
          // Share functionality
          if (navigator.share) {
            navigator.share({
              title: 'HENDIMAN',
              text: 'בואו נחבר אתכם להנדימן הטוב ביותר!',
              url: window.location.href,
            }).catch(() => {
              // User cancelled or error
            });
          } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(window.location.href).then(() => {
              this.toast?.showSuccess('הקישור הועתק ללוח');
            }).catch(() => {
              this.toast?.showError('לא ניתן לשתף');
            });
          }
          break;
        case 'viewCalendar':
          // Navigate to calendar or show calendar modal
          this.toast?.showInfo('יומן - תכונה בקרוב');
          break;
        case 'viewWallet':
          // Navigate to wallet/income details
          // Check if there's a job with payment released
          const jobsWithPayment = this.jobs?.filter(j => 
            j.paymentStatus === "paid" || j.handymanReceivedPayment
          );
          if (jobsWithPayment && jobsWithPayment.length > 0) {
            // Show income detail modal for the most recent job
            const latestJob = jobsWithPayment.sort((a, b) => {
              const dateA = new Date(a.updatedAt || a.createdAt || 0);
              const dateB = new Date(b.updatedAt || b.createdAt || 0);
              return dateB - dateA;
            })[0];
            this.incomeDetailJob = latestJob;
            this.showIncomeDetailModal = true;
          } else {
            this.toast?.showInfo('אין תשלומים זמינים');
          }
          break;
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

    handleKmInput(value) {
      // Update local value for display while dragging (no filtering)
      this.localMaxKm = Number(value);
    },
    handleKmChange(value) {
      // Reset local value and apply the change (actual filtering happens here)
      this.localMaxKm = null;
      this.onChangeKm(value);
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

        // Check if error is about needing onboarding
        if (error.response?.data?.needsOnboarding) {
          const onboardingUrl = error.response.data.onboardingUrl;

          if (onboardingUrl) {
            // Onboarding modal removed - just show error message
            this.toast?.showError(
              error.response.data.message ||
                "עליך להשלים את הגדרת חשבון התשלומים לפני קבלת עבודה"
            );
          } else {
            this.toast?.showError(
              error.response.data.message ||
                "עליך להשלים את הגדרת חשבון התשלומים לפני קבלת עבודה"
            );
          }
        } else {
          this.toast?.showError(
            error.response?.data?.message || "שגיאה בקבלת העבודה"
          );
        }
      }
    },

    onQuotation(job) {
      // Open HandymanQuotationModal for quoted job
      this.selectedQuotedJob = job;
      this.showHandymanQuotationModal = true;
    },
    onOpenQuotationModal(job) {
      // Alias for onQuotation - opens HandymanQuotationModal
      this.onQuotation(job);
    },
    onQuotationRejected(data) {
      // Refresh the job data after rejection
      this.toast?.showInfo("הצעת המחיר נדחתה");
      // Re-fetch jobs to update the list
      if (this.store && this.store.fetchDashboardData) {
        const userId = this.store.user?._id || this.$route.params.id;
        this.store.fetchDashboardData(userId);
      }
    },
    async checkPendingQuotations() {
      // Check for pending quotations for this client
      logger.log("[checkPendingQuotations] Starting check...");
      logger.log("[checkPendingQuotations] isHendiman:", this.isHendiman);
      logger.log("[checkPendingQuotations] showClientQuotationsModal:", this.showClientQuotationsModal);
      
      try {
        const userId = this.store.user?._id || this.me?._id || this.$route.params.id;
        logger.log("[checkPendingQuotations] userId sources:", {
          storeUser: this.store.user?._id,
          me: this.me?._id,
          routeParams: this.$route.params.id,
          finalUserId: userId
        });
        
        if (!userId) {
          logger.warn("[checkPendingQuotations] No userId found");
          logger.error("[checkPendingQuotations] ERROR: No userId found!");
          return;
        }
        
        if (this.isHendiman) {
          logger.log("[checkPendingQuotations] User is handyman, skipping");
          return;
        }

        logger.log(`[checkPendingQuotations] Checking for client ${userId}`);

        const { URL } = await import("@/Url/url");
        logger.log(`[checkPendingQuotations] API URL: ${URL}/api/clients/${userId}/pending-quotations`);

        // First, check for expired quoted jobs and expire them
        try {
          await axios.post(`${URL}/api/jobs/check-expired-quoted`);
          logger.log("[checkPendingQuotations] Expired jobs checked");
        } catch (expiredCheckError) {
          // Silent fail - not critical
          logger.error("Error checking expired quoted jobs:", expiredCheckError);
        }

        // Then, check for pending quotations using new endpoint
        logger.log("[checkPendingQuotations] Fetching pending quotations...");
        const response = await axios.get(
          `${URL}/api/clients/${userId}/pending-quotations`
        );

        logger.log("[checkPendingQuotations] Full response:", response);
        logger.log("[checkPendingQuotations] Response data:", response.data);

        if (
          response.data.success &&
          response.data.hasPendingQuotations &&
          response.data.job
        ) {
          const jobWithQuotations = response.data.job;
          logger.log("[checkPendingQuotations] ✅ Found job with quotations:", jobWithQuotations);
          logger.log("[checkPendingQuotations] Job quotations count:", jobWithQuotations.quotations?.length);
          
          if (
            jobWithQuotations.quotations &&
            jobWithQuotations.quotations.length > 0
          ) {
            // Only open if modal is not already open
            if (!this.showClientQuotationsModal) {
              logger.log("[checkPendingQuotations] ✅✅✅ Opening quotations modal!");
              this.selectedQuotedJob = jobWithQuotations;
              this.showClientQuotationsModal = true;
              logger.log("[checkPendingQuotations] Modal state after setting:", {
                showClientQuotationsModal: this.showClientQuotationsModal,
                selectedQuotedJob: this.selectedQuotedJob
              });
            } else {
              logger.log("[checkPendingQuotations] Modal already open, updating job");
              this.selectedQuotedJob = jobWithQuotations;
            }
          } else {
            logger.warn("[checkPendingQuotations] ⚠️ Job found but no quotations:", jobWithQuotations);
          }
        } else {
          logger.log("[checkPendingQuotations] ❌ No pending quotations found. Response:", {
            success: response.data.success,
            hasPendingQuotations: response.data.hasPendingQuotations,
            job: response.data.job
          });
        }
      } catch (quotationsError) {
        logger.error("Error checking pending quotations:", quotationsError);
        logger.error("[checkPendingQuotations] ❌ ERROR:", quotationsError);
        logger.error("[checkPendingQuotations] Error details:", {
          message: quotationsError.message,
          response: quotationsError.response?.data,
          status: quotationsError.response?.status
        });
      }
    },
    onShowHandymanDetailsFromQuotation({ handymanId, handymanName }) {
      // Show handyman details sheet from quotation modal
      if (handymanId) {
        this.onViewHandymanDetails(handymanId);
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
          this.toast?.showError(
            response.data.message || "לא הצלחנו לעדכן את העבודה"
          );
        }
      } catch (error) {
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
          this.toast?.showError("לא הצלחנו להעלות את התמונה");
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
                this.toast?.showError("לא הצלחנו לטעון את המפה. נסה שוב.");
              }
            }, 100);
          };
          script.onerror = () => {
            this.toast?.showError("לא הצלחנו לטעון את המפה. נסה שוב.");
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
              this.toast?.showError("לא הצלחנו לטעון את המפה. נסה שוב.");
            }
          }, 5000);
        }
      };

      loadLeaflet();
    },
    createEditMap() {
      if (typeof window.L === "undefined") {
        this.toast?.showError("לא הצלחנו לטעון את המפה. נסה שוב.");
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
        this.toast?.showError("לא הצלחנו ליצור את המפה. נסה שוב.");
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
          this.toast?.showError(
            response.data.message || "לא הצלחנו למחוק את העבודה"
          );
        }
      } catch (error) {
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
    onQuotationAccepted(data) {
      // Refresh jobs after quotation accepted
      if (this.store && this.store.fetchDashboardData) {
        const userId = this.store.user?._id || this.$route.params.id;
        this.store.fetchDashboardData(userId).then(() => {
          // Check for assigned job after refresh
          this.checkForAssignedJob();
        });
      }
      this.toast?.showSuccess(
        `הצעת המחיר של ${data.handymanName} נבחרה בהצלחה!`
      );
    },
    onQuotationSubmitted(quotation) {
      // Refresh jobs after quotation submitted
      if (this.store && this.store.fetchDashboardData) {
        const userId = this.store.user?._id || this.$route.params.id;
        this.store.fetchDashboardData(userId);
      }
      this.showHandymanQuotationModal = false;
      this.selectedQuotedJob = null;
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

      // If job is marked as done and user is handyman, show notification and close the chat
      if (newStatus === "done" && this.isHendiman) {
        // Show notification popup after 2 seconds delay
        setTimeout(() => {
          this.showHandymanDoneNotification = true;
        }, 2000);
        // Close chat and refresh
        this.activeAssignedJob = null;
        this.isChatMinimized = false;
        // Refresh to update job list
        await this.onRefresh();
      }

      // לא סוגרים את הצ'אט לפי paymentStatus - רק לפי סטטוס העבודה
      // הצ'אט ייסגר רק אם הסטטוס הוא "open", "done" או ביטול (זה מטופל ב-currentAssignedJob computed)
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

      // Close chat after rating (before refresh to prevent reopening)
      this.activeAssignedJob = null;
      this.isChatMinimized = false;

      // Refresh after rating to update job data
      await this.onRefresh();

      // For client: Show payment notification
      if (!this.isHendiman) {
        this.showClientPaymentNotification = true;
      }

      // Clear pending rating
      this.pendingRatingValue = 0;
      this.pendingRatingReview = "";

      // Ensure chat stays closed after refresh (in case checkForAssignedJob tries to reopen it)
      this.$nextTick(() => {
        if (this.activeAssignedJob) {
          const currentJobId = String(
            this.activeAssignedJob._id || this.activeAssignedJob.id || ""
          );
          if (currentJobId === String(jobId || "")) {
            // This is the job that was just rated, close it
            this.activeAssignedJob = null;
            this.isChatMinimized = false;
          }
        }
      });
    },
    getJobDisplayName(job) {
      if (!job) return "עבודה";
      if (
        job.subcategoryInfo &&
        Array.isArray(job.subcategoryInfo) &&
        job.subcategoryInfo.length > 0
      ) {
        return job.subcategoryInfo
          .map((sub) => sub.subcategory || sub.name)
          .join(", ");
      }
      return job.desc || "עבודה";
    },
    submitPendingRating() {
      // Navigate to rating page instead of handling rating here
      if (!this.pendingRatingJob) {
        return;
      }
      const jobId = this.pendingRatingJob._id || this.pendingRatingJob.id;
      if (jobId) {
        this.$router.push(`/rating/${jobId}`);
      }
    },
    // בדוק עבודה משובצת ישירות מנתונים שנטענו (לשימוש ב-mounted)
    checkForAssignedJobFromData(data) {
      const userId = this.store.user?._id || this.me?._id;
      if (!userId || !data) {
        return;
      }

      // בדוק ישירות בנתונים הראשוניים (data.Jobs) שמכילים את כל העבודות
      const allJobs = data.Jobs || [];
      const userIdStr = String(userId);

      const assignedJob = allJobs.find((job) => {
        if (this.isHendiman) {
          // עבור הנדימן - בודק אם handymanId תואם (תמיכה במערך)
          let isHandymanInJob = false;
          if (job.handymanId) {
            if (Array.isArray(job.handymanId)) {
              isHandymanInJob = job.handymanId.some((id) => {
                // Handle both ObjectId and string - try multiple formats
                let idStr = "";
                if (id) {
                  if (id._id) {
                    idStr = String(id._id);
                  } else if (id.$oid) {
                    idStr = String(id.$oid);
                  } else if (typeof id === "object" && id.toString) {
                    idStr = id.toString();
                  } else {
                    idStr = String(id);
                  }
                }
                return idStr === userIdStr;
              });
            } else {
              // Handle single handymanId (not array)
              let handymanIdStr = "";
              if (job.handymanId) {
                if (job.handymanId._id) {
                  handymanIdStr = String(job.handymanId._id);
                } else if (job.handymanId.$oid) {
                  handymanIdStr = String(job.handymanId.$oid);
                } else if (
                  typeof job.handymanId === "object" &&
                  job.handymanId.toString
                ) {
                  handymanIdStr = job.handymanId.toString();
                } else {
                  handymanIdStr = String(job.handymanId);
                }
              }
              isHandymanInJob = handymanIdStr === userIdStr;
            }
          }
          // כל עבודה שלא בסטטוס "open" או "done" או עבודה מבוטלת צריכה להיפתח
          // עבודה מבוטלת = יש לה cancel: true או isCancelled: true או status: "cancelled"
          const isCancelled =
            job.cancel === true ||
            job.isCancelled === true ||
            job.status === "cancelled";
          const isStatusValid =
            job.status !== "open" && job.status !== "done" && !isCancelled;
          return isHandymanInJob && isStatusValid;
        } else {
          // עבור לקוח - בודק אם clientId תואם
          const clientIdStr = job.clientId?._id
            ? String(job.clientId._id)
            : String(job.clientId || "");
          const isClientMatch = clientIdStr === userIdStr;
          const hasHandyman = !!job.handymanId;
          // כל עבודה שלא בסטטוס "open" או "done" או עבודה מבוטלת צריכה להיפתח
          const isCancelled =
            job.cancel === true ||
            job.isCancelled === true ||
            job.status === "cancelled";
          return (
            isClientMatch &&
            hasHandyman &&
            job.status !== "open" &&
            job.status !== "done" &&
            !isCancelled
          );
        }
      });

      // Only set activeAssignedJob if it's a valid active job
      // כל עבודה שהסטטוס שלה הוא לא "open" או "done" תפתח את הצ'אט
      if (assignedJob) {
        // בדוק שוב שהעבודה לא סיימה (למקרה שהסטטוס השתנה)
        if (assignedJob.status === "open" || assignedJob.status === "done") {
          // אם העבודה סיימה, נקה את activeAssignedJob כדי לסגור את הצ'אט
          this.activeAssignedJob = null;
          this.isChatMinimized = true;
          return;
        }
        // שמור את ה-activeAssignedJob רק אם הוא לא כבר מוגדר או שהוא עבודה אחרת
        const shouldSet =
          !this.activeAssignedJob ||
          String(this.activeAssignedJob._id || this.activeAssignedJob.id) !==
            String(assignedJob._id || assignedJob.id);
        if (shouldSet) {
          this.activeAssignedJob = assignedJob;
          this.isChatMinimized = false; // Ensure chat is not minimized when auto-opening
        }
      } else {
        // אם לא נמצאה עבודה משובצת, וודא שהצ'אט סגור אם activeAssignedJob מכיל עבודה עם status "done"
        if (
          this.activeAssignedJob &&
          (this.activeAssignedJob.status === "open" ||
            this.activeAssignedJob.status === "done")
        ) {
          this.activeAssignedJob = null;
          this.isChatMinimized = true;
        }
      }
    },
    async checkForAssignedJob() {
      // בדוק ישירות ב-store.jobs אם יש עבודה משובצת
      const userId = this.store.user?._id || this.me?._id;
      if (!userId) {
        return;
      }

      // קודם נבדוק ב-store.jobs הקיים
      let allJobs = this.store.jobs || [];
      const userIdStr = String(userId);

      let assignedJob = allJobs.find((job) => {
        if (this.isHendiman) {
          // עבור הנדימן - בודק אם handymanId תואם (תמיכה במערך)
          let isHandymanInJob = false;
          if (job.handymanId) {
            if (Array.isArray(job.handymanId)) {
              isHandymanInJob = job.handymanId.some((id) => {
                // Handle both ObjectId and string - try multiple formats
                let idStr = "";
                if (id) {
                  if (id._id) {
                    idStr = String(id._id);
                  } else if (id.$oid) {
                    idStr = String(id.$oid);
                  } else if (typeof id === "object" && id.toString) {
                    idStr = id.toString();
                  } else {
                    idStr = String(id);
                  }
                }
                return idStr === userIdStr;
              });
            } else {
              // Handle single handymanId (not array)
              let handymanIdStr = "";
              if (job.handymanId) {
                if (job.handymanId._id) {
                  handymanIdStr = String(job.handymanId._id);
                } else if (job.handymanId.$oid) {
                  handymanIdStr = String(job.handymanId.$oid);
                } else if (
                  typeof job.handymanId === "object" &&
                  job.handymanId.toString
                ) {
                  handymanIdStr = job.handymanId.toString();
                } else {
                  handymanIdStr = String(job.handymanId);
                }
              }
              isHandymanInJob = handymanIdStr === userIdStr;
            }
          }
          // כל עבודה שלא בסטטוס "open" או "done" או עבודה מבוטלת צריכה להיפתח
          const isCancelled =
            job.cancel === true ||
            job.isCancelled === true ||
            job.status === "cancelled";
          const isAssigned =
            isHandymanInJob &&
            job.status !== "open" &&
            job.status !== "done" &&
            !isCancelled;
          if (isAssigned) {
            logger.log(
              `[CheckAssigned] נמצאה עבודה משובצת: ${
                job._id || job.id
              }, status: ${job.status}`
            );
          }
          return isAssigned;
        } else {
          // עבור לקוח - בודק אם clientId תואם
          const clientIdStr = job.clientId?._id
            ? String(job.clientId._id)
            : String(job.clientId || "");
          // כל עבודה שלא בסטטוס "open" או "done" או ביטול צריכה להיפתח
          const isCancelled =
            job.cancel === true ||
            job.isCancelled === true ||
            job.status === "cancelled";
          return (
            clientIdStr === userIdStr &&
            job.handymanId && // רק עבודות ששובצו
            job.status !== "open" && // לא עבודות פתוחות
            job.status !== "done" && // לא עבודות שהושלמו
            !isCancelled // לא עבודות מבוטלות
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
                      isHandymanInJob = job.handymanId.some((id) => {
                        // Handle both ObjectId and string
                        const idStr = id?._id
                          ? String(id._id)
                          : id?.$oid
                          ? String(id.$oid)
                          : String(id);
                        return idStr === userIdStr;
                      });
                    } else {
                      const handymanIdStr = job.handymanId?._id
                        ? String(job.handymanId._id)
                        : job.handymanId?.$oid
                        ? String(job.handymanId.$oid)
                        : String(job.handymanId);
                      isHandymanInJob = handymanIdStr === userIdStr;
                    }
                  }
                  const isCancelled =
                    job.cancel === true ||
                    job.isCancelled === true ||
                    job.status === "cancelled";
                  return (
                    isHandymanInJob &&
                    job.status !== "open" &&
                    job.status !== "done" &&
                    !isCancelled
                    // עבור הנדימן - לא מציגים עבודות עם status "done" או מבוטלות
                  );
                });
              }
            }
          } catch (error) {
            // Error fetching dashboard data
          }
        }
      }

      // Only set activeAssignedJob if it's a valid active job
      // כל עבודה שהסטטוס שלה הוא לא "open" או "done" או עבודה מבוטלת תפתח את הצ'אט
      if (assignedJob) {
        // בדוק שוב שהעבודה לא סיימה או מבוטלת (למקרה שהסטטוס השתנה)
        const isCancelled =
          assignedJob.cancel === true ||
          assignedJob.isCancelled === true ||
          assignedJob.status === "cancelled";
        if (
          assignedJob.status === "open" ||
          assignedJob.status === "done" ||
          isCancelled
        ) {
          // אם העבודה סיימה או מבוטלת, נקה את activeAssignedJob כדי לסגור את הצ'אט
          this.activeAssignedJob = null;
          this.isChatMinimized = true;
          return;
        }
        // שמור את ה-activeAssignedJob רק אם הוא לא כבר מוגדר או שהוא עבודה אחרת
        const shouldSet =
          !this.activeAssignedJob ||
          String(this.activeAssignedJob._id || this.activeAssignedJob.id) !==
            String(assignedJob._id || assignedJob.id);
        if (shouldSet) {
          this.activeAssignedJob = assignedJob;
          this.isChatMinimized = false;
        }
      }
    },
    initWebSocket() {
      // Connect to WebSocket server
      this.socket = io(URL, {
        transports: ["websocket", "polling"],
      });

      // Listen for new quotations (for clients)
      if (!this.isHendiman) {
        this.socket.on("quotation:new", async (data) => {
          logger.log("[WebSocket] Received quotation:new event:", data);
          try {
            const userId = this.store.user?._id || this.$route.params.id;
            if (!userId) {
              logger.error("[WebSocket] No userId found for quotation:new");
              return;
            }

            const { URL } = await import("@/Url/url");
            
            // Fetch the specific job with quotations
            const quotationsResponse = await axios.get(
              `${URL}/api/clients/${userId}/quoted-jobs-with-quotations`
            );
            
            logger.log("[WebSocket] Quotations response:", quotationsResponse.data);
            
            if (
              quotationsResponse.data.success &&
              quotationsResponse.data.jobs &&
              quotationsResponse.data.jobs.length > 0
            ) {
              // Find the job that has new quotations
              const jobWithQuotations = quotationsResponse.data.jobs.find(
                (j) => String(j._id) === String(data.jobId)
              );
              
              logger.log("[WebSocket] Found job with quotations:", jobWithQuotations);
              
              if (
                jobWithQuotations &&
                jobWithQuotations.quotations &&
                jobWithQuotations.quotations.length > 0
              ) {
                // Open modal if not already open
                logger.log("[WebSocket] Opening quotations modal");
                this.selectedQuotedJob = jobWithQuotations;
                this.showClientQuotationsModal = true;
              } else {
                logger.warn("[WebSocket] Job found but no quotations");
              }
            } else {
              logger.warn("[WebSocket] No jobs with quotations found");
            }
          } catch (error) {
            logger.error("Error handling quotation:new event:", error);
          }
        });

        // Listen for quotation accepted confirmation (for clients)
        this.socket.on("quotation:accepted-by-client", async (data) => {
          this.toast?.showSuccess("הצעת המחיר נבחרה בהצלחה!");
          // Refresh jobs to get updated status
          await this.onRefresh();
        });
      } else {
        // Listen for quotation accepted (for handymen)
        this.socket.on("quotation:accepted", async (data) => {
          this.toast?.showSuccess("הצעת המחיר שלך נבחרה! 🎉");
          // Refresh jobs to get updated status
          await this.onRefresh();
          // Check if this job is now assigned to this handyman
          await this.checkForAssignedJob();
        });
      }

      this.socket.on("connect", () => {
        logger.log("[WebSocket] Connected to server");
        // Join user's personal room (for receiving job-accepted events and quotations)
        const userId = this.store.user?._id || this.me?._id || this.$route.params.id;
        if (userId) {
          const userIdString = String(userId);
          logger.log(`[WebSocket] Joining user room: user-${userIdString}`);
          this.socket.emit("join-user", userIdString);
          
          // For clients, also check for pending quotations immediately after joining
          if (!this.isHendiman) {
            setTimeout(() => {
              this.checkPendingQuotations();
            }, 500);
          }
        }

        // Join all jobs that belong to this user
        if (userId && this.store.jobs) {
          this.store.jobs.forEach((job) => {
            const jobId = job._id || job.id;
            if (jobId) {
              const jobIdString = String(jobId);
              this.socket.emit("join-job", jobIdString);
            }
          });
        }

        // Also join job room when receiving job updates
        this.socket.on("job-updated", async (data) => {
          if (data && data.jobId) {
            const jobIdString = String(data.jobId);
            this.socket.emit("join-job", jobIdString);

            // Check if this update means the user is now assigned to this job
            // Refresh and check for assigned jobs
            await this.checkForAssignedJob();
          }
        });
      });

      // Listen for job accepted event (for both clients and handymen)
      this.socket.on("job-accepted", async (data) => {
        const jobId = String(data.jobId || "");
        const userId = this.store.user?._id || this.me?.id;

        if (!userId || !jobId) {
          return;
        }

        // Refresh to get updated job data
        await this.onRefresh();
        // Wait for next tick to ensure store.jobs is updated
        await this.$nextTick();

        // Try to find the job directly by ID first
        let acceptedJob = this.store.jobs?.find(
          (j) => String(j._id || j.id) === jobId
        );

        // If not found in store.jobs, try to fetch it directly from server
        if (!acceptedJob) {
          try {
            const { URL } = await import("@/Url/url");
            const response = await axios.get(`${URL}/jobs/${jobId}`);
            if (response.data && response.data.success && response.data.job) {
              acceptedJob = response.data.job;
              // Add to store.jobs if not already there
              if (
                this.store.jobs &&
                !this.store.jobs.find((j) => String(j._id || j.id) === jobId)
              ) {
                this.store.jobs.push(acceptedJob);
              }
            }
          } catch (err) {
            // Error fetching job
          }
        }

        // Check if this job belongs to the current user
        if (acceptedJob) {
          const userIdStr = String(userId);
          let belongsToUser = false;

          if (!this.isHendiman) {
            // For client: check if this is their job
            belongsToUser =
              String(acceptedJob.clientId || acceptedJob.client?._id || "") ===
              userIdStr;
          } else {
            // For handyman: check if handymanId matches (support array)
            if (acceptedJob.handymanId) {
              if (Array.isArray(acceptedJob.handymanId)) {
                belongsToUser = acceptedJob.handymanId.some((id) => {
                  // Handle both ObjectId and string - try multiple formats
                  let idStr = "";
                  if (id) {
                    if (id._id) {
                      idStr = String(id._id);
                    } else if (id.$oid) {
                      idStr = String(id.$oid);
                    } else if (typeof id === "object" && id.toString) {
                      idStr = id.toString();
                    } else {
                      idStr = String(id);
                    }
                  }
                  return idStr === userIdStr;
                });
              } else {
                // Handle single handymanId (not array)
                let handymanIdStr = "";
                if (acceptedJob.handymanId) {
                  if (acceptedJob.handymanId._id) {
                    handymanIdStr = String(acceptedJob.handymanId._id);
                  } else if (acceptedJob.handymanId.$oid) {
                    handymanIdStr = String(acceptedJob.handymanId.$oid);
                  } else if (
                    typeof acceptedJob.handymanId === "object" &&
                    acceptedJob.handymanId.toString
                  ) {
                    handymanIdStr = acceptedJob.handymanId.toString();
                  } else {
                    handymanIdStr = String(acceptedJob.handymanId);
                  }
                }
                belongsToUser = handymanIdStr === userIdStr;
              }
            }
          }

          // Open chat if this job belongs to the current user and is not "open" or "done"
          if (
            belongsToUser &&
            acceptedJob.status !== "open" &&
            acceptedJob.status !== "done"
          ) {
            // Always open the chat for the new job, even if there's another active job
            // The user should see the newly assigned job
            this.activeAssignedJob = acceptedJob;
            this.isChatMinimized = false;
          }
        }

        // Also use checkForAssignedJob as fallback to catch any other assigned jobs
        await this.checkForAssignedJob();
      });

      // Listen for job done event (for clients) - show approval modal and navigate to JobSummary
      // Track processed job-done events to prevent duplicate processing
      const processedJobDoneEvents = new Set();
      this.socket.on("job-done", async (data) => {
        const jobId = String(data.jobId || "");

        // Prevent duplicate processing of the same event
        if (processedJobDoneEvents.has(jobId)) {
          return;
        }
        processedJobDoneEvents.add(jobId);

        // Clean up old entries (keep only last 10)
        if (processedJobDoneEvents.size > 10) {
          const firstEntry = Array.from(processedJobDoneEvents)[0];
          processedJobDoneEvents.delete(firstEntry);
        }

        if (!this.isHendiman) {
          // For client: show approval modal immediately when job-done is received
          // Find the job and show approval modal
          const job = this.store.jobs?.find(
            (j) => String(j._id || j.id) === jobId
          );
          if (job) {
            this.pendingApprovalJob = job;
            this.showClientApprovalModal = true;
          } else {
            // If job not in store, fetch it
            try {
              const { URL } = await import("@/Url/url");
              const response = await axios.get(`${URL}/jobs/${jobId}`);
              if (response.data?.success && response.data?.job) {
                this.pendingApprovalJob = response.data.job;
                this.showClientApprovalModal = true;
              }
            } catch (error) {
              logger.error("Error fetching job for approval:", error);
            }
          }

          // Navigate to JobSummary page (only jobId, no userId)
          if (jobId) {
            this.$router.push(`/job-summary/${jobId}`);
          }
        }
      });

      // Listen for onboarding required (when client approves and handyman needs onboarding)
      this.socket.on("onboarding-required", async (data) => {
        if (this.isHendiman && data.needsOnboarding) {
          // Onboarding modal removed - just log the event
          logger.info("Onboarding required but modal removed");
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
        if (this.isHendiman && data.needsOnboarding) {
          // Store onboarding URL and show modal (even if URL is null, show message)
          this.onboardingUrl = data.onboardingUrl;
          this.showOnboardingModal = true;
        }
      });

      // Listen for job-approved event (when client approves job)
      this.socket.on("job-approved", async (data) => {
        const jobId = String(data.jobId || "");
        const paymentStatus = data.paymentStatus;

        // Refresh jobs to get latest data
        await this.onRefresh();

        // לא סוגרים את הצ'אט לפי paymentStatus - רק לפי סטטוס העבודה
        // הצ'אט ייסגר רק אם הסטטוס הוא "open", "done" או ביטול (זה מטופל ב-currentAssignedJob computed)

        if (this.isHendiman) {
          // Show notification that payment was approved and released
          if (paymentStatus === "paid" || data.paymentReleased) {
            this.showHandymanApprovedNotification = true;
            // Hide the "waiting for client approval" notification when payment is released
            this.showHandymanDoneNotification = false;
            // Note: IncomeDetailModal will be shown via "payment-released" event, not here
          }

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
            await this.fetchOnboardingLinkForJob(job);
          }
        }
      });

      // Listen for job-cancelled-by-client event (when client cancels job)
      this.socket.on("job-cancelled-by-client", async (data) => {
        if (this.isHendiman && data.message) {
          this.showHandymanCancelledNotification = true;
          // Refresh jobs to get latest data
          await this.onRefresh();
        }
      });

      // Listen for payment-released event (when client releases payment) - show IncomeDetailModal
      this.socket.on("payment-released", async (data) => {
        logger.log(
          "[Dashboard] Received payment-released event:",
          data,
          "isHendiman:",
          this.isHendiman
        );

        // Check if this is for handyman
        if (!this.isHendiman) {
          return;
        }

        if (!data || !data.jobId || !data.paymentReleased) {
          return;
        }

        const jobId = String(data.jobId || "");
        logger.log(
          "[Dashboard] Processing payment-released for handyman, jobId:",
          jobId
        );

        // Show income detail modal with job and payment info
        if (data.jobInfo && data.paymentInfo) {
          // Both jobInfo and paymentInfo are available
          this.incomeDetailJob = data.jobInfo;
          this.incomeDetailPayment = data.paymentInfo;
          this.showIncomeDetailModal = true;
          logger.log(
            "[Dashboard] IncomeDetailModal shown with jobInfo and paymentInfo",
            {
              showIncomeDetailModal: this.showIncomeDetailModal,
              isHendiman: this.isHendiman,
              hasJobInfo: !!this.incomeDetailJob,
              hasPaymentInfo: !!this.incomeDetailPayment,
            }
          );

          // Force Vue to update
          this.$nextTick(() => {
            logger.log(
              "[Dashboard] After nextTick - showIncomeDetailModal:",
              this.showIncomeDetailModal
            );
          });
        } else if (data.jobInfo) {
          // Only jobInfo available, fetch payment info
          const job = data.jobInfo;
          await this.showIncomeDetail(job);
        } else if (data.jobId) {
          // Only jobId available, fetch both job and payment info
          logger.log(
            "[Dashboard] Fetching job and payment info for jobId:",
            jobId
          );
          try {
            const { URL } = await import("@/Url/url");
            const jobResponse = await axios.get(`${URL}/jobs/${jobId}`);
            if (jobResponse.data?.success && jobResponse.data?.job) {
              await this.showIncomeDetail(jobResponse.data.job);
            } else {
              logger.error("[Dashboard] Failed to fetch job info");
            }
          } catch (error) {
            logger.error("[Dashboard] Error fetching job info:", error);
          }
        } else {
          logger.error(
            "[Dashboard] No jobInfo or jobId in payment-released event"
          );
        }
      });
    },
    async fetchOnboardingLinkForModal() {
      if (!this.isHendiman) return;

      // Use route ID as fallback if store.user._id is not available
      const handymanId =
        this.store.user?._id ||
        this.me?.id ||
        this.me?._id ||
        this.$route.params.id;

      if (!handymanId) {
        this.toast?.showError("לא ניתן לזהות את המשתמש");
        return;
      }

      try {
        const { URL } = await import("@/Url/url");
        const response = await axios.post(
          `${URL}/api/handyman/stripe/onboarding-link`,
          { handymanId: String(handymanId) }
        );

        if (response.data && response.data.success && response.data.url) {
          // REMOVED - Stripe onboarding modal removed
          // Just show error message instead
          this.toast?.showError("הגדרת חשבון תשלומים הוסרה מהמערכת");
        } else {
          const errorMessage =
            response.data?.message ||
            "לא ניתן ליצור קישור הגדרת תשלומים. אנא נסה שוב מאוחר יותר.";
          this.toast?.showError(errorMessage);
        }
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          "שגיאה בטעינת קישור הגדרת תשלומים. אנא נסה שוב מאוחר יותר.";
        this.toast?.showError(errorMessage);
      }
    },
    async fetchOnboardingLinkForJob(job) {
      if (!job || !this.isHendiman) return;

      // Use route ID as fallback if store.user._id is not available
      const handymanId =
        this.store.user?._id ||
        this.me?.id ||
        this.me?._id ||
        this.$route.params.id;
      if (!handymanId) {
        return;
      }

      // First check if onboarding is actually needed
      try {
        const { URL } = await import("@/Url/url");
        const statusResponse = await axios.get(
          `${URL}/api/handyman/${handymanId}/stripe/status`
        );

        if (
          statusResponse.data &&
          statusResponse.data.success &&
          !statusResponse.data.needsOnboarding
        ) {
          // Account is ready, no need to show onboarding modal
          return;
        }
      } catch (statusError) {
        // Error checking onboarding status
        // Continue to show modal if status check fails
      }

      try {
        const { URL } = await import("@/Url/url");
        const response = await axios.post(
          `${URL}/api/handyman/stripe/onboarding-link`,
          { handymanId: String(handymanId) }
        );
        if (response.data && response.data.success && response.data.url) {
          // REMOVED - Stripe onboarding modal removed
          // Just log the event
          logger.info("Onboarding link received but modal removed");
        } else {
          // REMOVED - Stripe onboarding modal removed
          logger.info("No onboarding URL but modal removed");
        }
      } catch (error) {
        // REMOVED - Stripe onboarding modal removed
        logger.info("Error fetching onboarding link but modal removed");
      }
    },
    async checkHandymanOnboardingStatus() {
      // REMOVED - Stripe onboarding modal removed
      return;
    },
    onJobApproved() {
      // Handler for job-approved event from ClientActions
      // This is a placeholder - actual approval is handled in handleClientApprove
      this.onRefresh();
    },
    async handleClientApprove() {
      if (!this.pendingApprovalJob || this.isApprovingPayment) return;

      const jobId = this.pendingApprovalJob._id || this.pendingApprovalJob.id;
      // Use clientId from the job itself (more reliable than store.user)
      const clientId =
        this.pendingApprovalJob.clientId?.toString() ||
        this.pendingApprovalJob.clientId ||
        this.store.user?._id ||
        this.me?.id;

      if (!jobId || !clientId) {
        this.toast?.showError("חסרים פרטים לאישור העבודה");
        return;
      }

      this.isApprovingPayment = true;

      try {
        const { URL } = await import("@/Url/url");
        const response = await axios.post(`${URL}/api/jobs/approve`, {
          jobId,
          clientId,
        });

        if (response.data && response.data.success) {
          this.toast?.showSuccess("העבודה אושרה והתשלום שוחרר");
          this.showClientApprovalModal = false;
          this.showProblemReportModal = false;

          // Don't navigate - if client is on JobSummary, they'll stay there
          // If they're on Dashboard, they can navigate manually if needed
          this.pendingApprovalJob = null;

          // Refresh jobs data
          await this.onRefresh();
        } else {
          this.toast?.showError(
            response.data?.message || "שגיאה באישור העבודה"
          );
        }
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "שגיאה באישור העבודה";

        // If payment method is required, redirect to CreateCall to add a new card
        if (error.response?.data?.requiresPaymentMethod) {
          this.toast?.showError(
            "אמצעי התשלום השמור לא יכול לשמש. אנא הוסף כרטיס אשראי חדש."
          );
          // Redirect to CreateCall page to add a new payment method
          setTimeout(() => {
            const userId =
              this.store?.user?._id ||
              this.store?.user?.id ||
              this.$route.params.id;
            this.$router.push(`/create-call/${userId}`);
          }, 2000);
        } else {
          this.toast?.showError(errorMessage);
        }
      } finally {
        this.isApprovingPayment = false;
      }
    },
    handleClientReject() {
      this.showClientApprovalModal = false;
      // Open problem report modal instead of closing
      this.showProblemReportModal = true;
    },
    handleApproveFromProblemModal() {
      // Close problem modal and approve payment
      this.showProblemReportModal = false;
      this.handleClientApprove();
    },
    async showIncomeDetail(job) {
      try {
        // Get payment info
        const { URL } = await import("@/Url/url");
        const paymentResponse = await axios.get(
          `${URL}/payment/${job._id || job.id}`
        );

        this.incomeDetailJob = job;
        this.incomeDetailPayment = paymentResponse.data?.success
          ? paymentResponse.data.payment
          : null;
        this.showIncomeDetailModal = true;
      } catch (error) {
        // If payment not found, still show modal with job info
        this.incomeDetailJob = job;
        this.incomeDetailPayment = null;
        this.showIncomeDetailModal = true;
      }
    },
    openOnboardingLink() {
      if (this.onboardingUrl) {
        // Save handymanId to localStorage before opening Stripe onboarding
        const handymanId =
          this.store.user?._id ||
          this.me?.id ||
          this.me?._id ||
          this.$route.params.id;
        if (handymanId) {
          localStorage.setItem("userId", String(handymanId));
        }
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
    onHowItWorks() {
      this.$router.push({ name: "About" });
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
      // Check platform directly using Capacitor (not imported values)
      try {
        const isNativePlatform = Capacitor.isNativePlatform();
        const platform = Capacitor.getPlatform();

        // For native apps (Android/iOS), use Capacitor Push Notifications plugin
        if (isNativePlatform) {
          try {
            // Import the plugin
            const { PushNotifications } = await import("@capacitor/push-notifications");
            
            if (!PushNotifications) {
              logger.error("[Push] PushNotifications plugin not available");
              return;
            }

            // Check current permission status
            const permissionStatus = await PushNotifications.checkPermissions();
            
            if (permissionStatus.receive !== 'granted') {
              // Request permission - THIS WILL SHOW THE PERMISSION DIALOG!
              const requestResult = await PushNotifications.requestPermissions();
              
              if (requestResult.receive !== 'granted') {
                logger.warn("[Push] Push notification permissions denied");
                return;
              }
            }

            // Register for push notifications
            await PushNotifications.register();

            // Listen for registration success
            PushNotifications.addListener('registration', async (token) => {
              try {
                if (token.value) {
                  logger.log("[Push] Registration successful, token:", token.value.substring(0, 15) + "...");
                  await this.saveTokenToServer(token.value);
                }
              } catch (error) {
                logger.error("[Push] Error in registration listener:", error);
              }
            });

            // Listen for registration errors
            PushNotifications.addListener('registrationError', (error) => {
              logger.error("[Push] Registration error:", error.error || error.message || "שגיאה");
            });

            // Listen for push notifications when app is open
            PushNotifications.addListener('pushNotificationReceived', (notification) => {
              try {
                // Show in-app notification
                this.toast?.showInfo("🔔 " + (notification.title || notification.body || "התראה חדשה"));
              } catch (error) {
                logger.error("[Push] Error in pushNotificationReceived listener:", error);
              }
            });

            // Listen for push notification taps and action button clicks
            PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
              try {
                const actionId = action.actionId;
                const notificationData = action.notification?.data || {};
                const jobId = notificationData.jobId;

                logger.log("[Push] Action performed:", actionId, "JobId:", jobId);

                // Handle different actions
                if (actionId === "accept") {
                  // Handle accept action
                  if (jobId) {
                    this.$router.push({
                      name: "Dashboard",
                      params: { id: this.store.user?._id || this.me?._id },
                      query: { action: "accept", jobId: jobId }
                    });
                  }
                  this.toast?.showSuccess("✅ פעולה בוצעה: קבלה");
                } else if (actionId === "view") {
                  // Handle view action
                  if (jobId) {
                    this.$router.push({
                      name: "Dashboard",
                      params: { id: this.store.user?._id || this.me?._id },
                      query: { action: "view", jobId: jobId }
                    });
                  }
                  this.toast?.showInfo("👁️ פעולה בוצעה: צפייה");
                } else if (actionId === "skip") {
                  // Handle skip action - just close notification
                  this.toast?.showInfo("⏭️ התראה נדחתה");
                } else {
                  // Default click - navigate to dashboard
                  if (jobId) {
                    this.$router.push({
                      name: "Dashboard",
                      params: { id: this.store.user?._id || this.me?._id },
                      query: { jobId: jobId }
                    });
                  }
                }
              } catch (error) {
                logger.error("[Push] Error in pushNotificationActionPerformed listener:", error);
              }
            });
          } catch (error) {
            logger.error("[Push] Error initializing push notifications:", error);
            // Don't show error to user - just log it
          }
        }
      } catch (error) {
        logger.error("[Push] Fatal error in enablePushNotifications:", error);
        // Don't show error to user - just log it
      }
    },

    async saveTokenToServer(token) {
      try {
        const userId = this.store.user?._id || this.me?.id;
        if (!userId) {
          this.toast?.showError("❌ אין userId - לא ניתן לשמור טוקן");
          return;
        }

        const response = await axios.post(`${URL}/save-fcm-token`, {
          userId: userId,
          fcmToken: token,
        });
        
        if (response.data?.success) {
          this.toast?.showSuccess("✅ טוקן נשמר בשרת!");
        } else {
          this.toast?.showError("❌ השרת לא שמר את הטוקן");
        }
      } catch (error) {
        this.toast?.showError("❌ שגיאה בשמירת טוקן: " + (error.message || ""));
      }
    },

    onBlockHandyman(id, isBlocked) {
      // Find handyman name from filteredHandymen
      const handyman = this.filteredHandymen?.find(
        (h) => String(h._id || h.id) === String(id)
      );
      const handymanName = handyman?.username || "ההנדימן";

      this.handymanToBlock = id;
      this.handymanToBlockName = handymanName;
      this.isUnblockingHandyman = isBlocked === true;
      this.showBlockHandymanModal = true;
    },

    closeBlockHandymanModal() {
      if (this.isBlockingHandyman) return; // Prevent closing during blocking
      this.showBlockHandymanModal = false;
      this.handymanToBlock = null;
      this.handymanToBlockName = null;
      this.isUnblockingHandyman = false;
    },

    async confirmBlockHandyman() {
      if (!this.handymanToBlock || this.isBlockingHandyman) return;

      this.isBlockingHandyman = true;
      try {
        const userId = this.store.user?._id || this.$route.params.id;
        if (!userId || !this.handymanToBlock) {
          this.toast?.showError(
            this.isUnblockingHandyman
              ? "חסרים פרטים לביטול חסימת הנדימן"
              : "חסרים פרטים לחסימת הנדימן"
          );
          return;
        }

        const { URL } = await import("@/Url/url");

        // אם זה ביטול חסימה, שלח action: "unblock"
        const requestBody = {
          userId,
          handymanId: this.handymanToBlock,
        };

        if (this.isUnblockingHandyman) {
          requestBody.action = "unblock";
        }

        const response = await axios.post(
          `${URL}/api/users/block-handyman`,
          requestBody
        );

        if (response.data && response.data.success) {
          this.toast?.showSuccess(
            this.isUnblockingHandyman
              ? "ביטול חסימת הנדימן בוצע בהצלחה"
              : "הנדימן נחסם בהצלחה"
          );
          this.closeBlockHandymanModal();
          // Refresh handymen list
          await this.onRefresh();
        } else {
          this.toast?.showError(
            response.data?.message ||
              (this.isUnblockingHandyman
                ? "שגיאה בביטול חסימת הנדימן"
                : "שגיאה בחסימת הנדימן")
          );
        }
      } catch (error) {
        this.toast?.showError(
          error.response?.data?.message ||
            (this.isUnblockingHandyman
              ? "שגיאה בביטול חסימת הנדימן"
              : "שגיאה בחסימת הנדימן")
        );
      } finally {
        this.isBlockingHandyman = false;
      }
    },

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
        this.toast?.showError(" לא הצלחנו לזהות את המשתמש");
        return;
      }
      try {
        // אם זה עדכון כתובת בלבד (מהמודל של ניהול כתובות)
        if (form.address && !form.name && !form.phone && !form.email && !form.specialties) {
          const res = await axios.post(`${URL}/user/update-profile`, {
            userId,
            city: form.address,
            cityEnglishName: form.cityEnglishName,
          });
          if (res.data?.success) {
            // עדכן את המשתמש ב-store
            if (res.data.user) {
              this.store.user = res.data.user;
            }
            if (res.data.user?.city) {
              this.me.city = res.data.user.city;
            }
            if (res.data.user?.coordinates) {
              this.me.coordinates = res.data.user.coordinates;
            }
            if (res.data.user?.location) {
              this.me.location = res.data.user.location;
            }
            
            // עדכן את הקואורדינטות המקומיות
            let newCoordinates = null;
            if (res.data.user?.location?.coordinates) {
              newCoordinates = {
                lng: res.data.user.location.coordinates[0],
                lat: res.data.user.location.coordinates[1],
              };
            } else if (res.data.user?.coordinates) {
              newCoordinates = {
                lng: res.data.user.coordinates.lng,
                lat: res.data.user.coordinates.lat,
              };
            }
            
            if (newCoordinates) {
              this.userCoordinates = newCoordinates;
            }
            
            // Refresh dashboard data עם הקואורדינטות החדשות
            if (newCoordinates) {
              await this.store.fetchDashboardData(userId, newCoordinates);
            } else {
              await this.store.fetchDashboardData(userId);
            }
            
            // לא נסגור את הפרופיל - רק נעדכן את הנתונים
            return;
          }
        }

        // עדכון פרופיל מלא (ממודל עריכת פרופיל)
        const res = await axios.post(`${URL}/user/update-profile`, {
          userId,
          username: form.name,
          phone: form.phone,
          email: form.email,
          city: form.address || form.city,
          cityEnglishName: form.cityEnglishName,
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
          if (res.data.user?.coordinates) {
            this.me.coordinates = res.data.user.coordinates;
          }
          if (res.data.user?.location) {
            this.me.location = res.data.user.location;
          }
          
          // עדכן את הקואורדינטות המקומיות אם הכתובת השתנתה
          let newCoordinates = null;
          if (res.data.user?.location?.coordinates) {
            newCoordinates = {
              lng: res.data.user.location.coordinates[0],
              lat: res.data.user.location.coordinates[1],
            };
          } else if (res.data.user?.coordinates) {
            newCoordinates = {
              lng: res.data.user.coordinates.lng,
              lat: res.data.user.coordinates.lat,
            };
          }
          
          if (newCoordinates) {
            this.userCoordinates = newCoordinates;
          }
          
          this.toast?.showSuccess("הפרופיל עודכן בהצלחה");
          this.showProfileSheet = false;
          
          // Refresh dashboard data עם הקואורדינטות החדשות (אם יש)
          if (newCoordinates) {
            await this.store.fetchDashboardData(userId, newCoordinates);
          } else {
            await this.store.fetchDashboardData(userId);
          }
        } else {
          this.toast?.showError("לא הצלחנו לעדכן את הפרופיל");
        }
      } catch (error) {
        this.toast?.showError("לא הצלחנו לעדכן את הפרופיל");
      }
    },

    async onViewHandymanDetails(id) {
      try {
        const { data } = await axios.get(`${URL}/Gethandyman/${id}`);
        if (data.success) {
          // Enrich details with isBlocked from the current list (API may not include it)
          const fromList = this.filteredHandymen?.find(
            (h) => String(h._id || h.id) === String(id)
          );

          this.handymanDetails = {
            ...data.Handyman,
            isBlocked: fromList?.isBlocked === true,
          };
        } else {
          this.toast.showError(data.message);
        }
      } catch (error) {
        this.toast.showError("לא הצלחנו לטעון את פרטי ההנדימן");
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
      this.onBlockHandyman(handyman._id || handyman.id, handyman?.isBlocked);
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

        const userId = this.store.user?._id || this.$route.params.id;
        await this.store.fetchHandymen(
          this.handymenPagination.page + 1,
          coordinates,
          userId
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

        const userId = this.store.user?._id || this.$route.params.id;
        await this.store.fetchHandymen(
          this.handymenPagination.page - 1,
          coordinates,
          userId
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
    async checkTrialExpiration(user) {
      if (!user.trialExpiresAt || user.trialExpiresAt === "always") return;

      const now = new Date();
      const trialExpiry = new Date(user.trialExpiresAt);

      if (now > trialExpiry) {
        // Trial expired - check if user has payment method
        const requiresPayment = !user.paymentMethodId;
        this.trialExpiredRequiresPayment = requiresPayment;
        this.showTrialExpiredModal = true;

        if (requiresPayment) {
          // Initialize Stripe Payment Element
          await this.initializeTrialPayment();
        }
      }
    },
    async initializeTrialPayment() {
      try {
        // Get Stripe publishable key
        const { data: keyData } = await axios.get(
          `${URL}/api/stripe/publishable-key`
        );
        this.stripePublishableKey = keyData.publishableKey;

        if (!this.stripePublishableKey) {
          this.toast?.showError("שגיאה בטעינת מערכת התשלום");
          return;
        }

        // Load Stripe
        const { loadStripe } = await import("@stripe/stripe-js");
        this.stripe = await loadStripe(this.stripePublishableKey);

        if (!this.stripe) {
          this.toast?.showError("שגיאה בטעינת מערכת התשלום");
          return;
        }

        // Get Setup Intent client secret
        const userId = this.store.user?._id || this.$route.params.id;
        const { data: setupData } = await axios.post(
          `${URL}/api/trial/create-setup-intent`,
          { userId }
        );

        if (!setupData.success || !setupData.clientSecret) {
          this.toast?.showError("שגיאה ביצירת טופס תשלום");
          return;
        }

        this.setupIntentClientSecret = setupData.clientSecret;

        // Create Elements instance
        this.elements = this.stripe.elements({
          clientSecret: this.setupIntentClientSecret,
        });

        // Create Payment Element
        this.paymentElement = this.elements.create("payment", {
          layout: "tabs",
        });

        // Mount Payment Element
        await this.$nextTick();
        const elementContainer = document.getElementById(
          "trial-payment-element"
        );
        if (elementContainer) {
          this.paymentElement.mount("#trial-payment-element");
          this.isStripeReady = true;
        }
      } catch (error) {
        logger.error("Error initializing trial payment:", error);
        this.toast?.showError("שגיאה בטעינת טופס התשלום");
      }
    },
    async handleTrialPaymentSubmit() {
      if (
        !this.stripe ||
        !this.paymentElement ||
        !this.setupIntentClientSecret
      ) {
        return;
      }

      this.isProcessingTrialPayment = true;
      const errorsElement = document.getElementById("trial-payment-errors");

      try {
        // Confirm Setup Intent
        const { error, setupIntent } = await this.stripe.confirmSetup({
          elements: this.elements,
          confirmParams: {
            return_url: `${window.location.origin}${this.$route.fullPath}`,
          },
          redirect: "if_required",
        });

        if (error) {
          if (errorsElement) {
            errorsElement.textContent = error.message;
          }
          this.isProcessingTrialPayment = false;
          return;
        }

        if (setupIntent.status === "succeeded") {
          // Update user payment method
          const userId = this.store.user?._id || this.$route.params.id;
          const { data } = await axios.post(`${URL}/api/trial/complete`, {
            userId,
            setupIntentId: setupIntent.id,
            paymentMethodId: setupIntent.payment_method,
          });

          if (data.success) {
            this.toast?.showSuccess("פרטי התשלום עודכנו בהצלחה");
            this.showTrialExpiredModal = false;
            // Refresh user data
            await this.store.fetchDashboardData(userId);
          } else {
            this.toast?.showError(data.message || "שגיאה בעדכון פרטי התשלום");
          }
        }
      } catch (error) {
        logger.error("Error processing trial payment:", error);
        if (errorsElement) {
          errorsElement.textContent = "שגיאה בעיבוד התשלום. אנא נסה שוב.";
        }
        this.toast?.showError("שגיאה בעיבוד התשלום");
      } finally {
        this.isProcessingTrialPayment = false;
      }
    },
    async handleTrialExpiredConfirm() {
      // User already has payment method - just confirm
      const userId = this.store.user?._id || this.$route.params.id;
      try {
        const { data } = await axios.post(`${URL}/api/trial/confirm`, {
          userId,
        });

        if (data.success) {
          this.toast?.showSuccess(
            "תקופת הנסיון הסתיימה. מעתה נתחיל לחייב אותך."
          );
          this.showTrialExpiredModal = false;
          // Refresh user data
          await this.store.fetchDashboardData(userId);
        } else {
          this.toast?.showError(data.message || "שגיאה");
        }
      } catch (error) {
        logger.error("Error confirming trial expiration:", error);
        this.toast?.showError("שגיאה");
      }
    },
    async handleTestAccess() {
      // Give handyman free access (trialExpiresAt: "always")
      const userId = this.store.user?._id || this.$route.params.id;
      try {
        const { data } = await axios.post(
          `${URL}/api/handyman/give-test-access`,
          {
            userId,
          }
        );

        if (data.success) {
          this.toast?.showSuccess("גישה חינם ניתנה בהצלחה!");
          this.showSubscriptionModal = false;
          // Refresh user data
          await this.store.fetchDashboardData(userId);
        } else {
          this.toast?.showError(data.message || "שגיאה במתן גישה חינם");
        }
      } catch (error) {
        logger.error("Error giving test access:", error);
        this.toast?.showError("שגיאה במתן גישה חינם");
      }
    },
    async handleSubscribe() {
      // If fillCreditCardNow is true, show payment form and initialize Stripe
      if (this.fillCreditCardNow) {
        this.showSubscriptionPaymentForm = true;
        await this.initializeSubscriptionPayment();
      } else {
        // If fillCreditCardNow is false, register without payment (14 days free trial)
        await this.handleSubscriptionWithoutPayment();
      }
    },
    async handlePaymentToggleChange() {
      // If user toggles to fill credit card now, initialize Stripe
      if (this.fillCreditCardNow && this.showSubscriptionPaymentForm) {
        await this.initializeSubscriptionPayment();
      }
    },
    async handleSubscriptionWithoutPayment() {
      // Register handyman without payment (14 days free trial)
      const userId = this.store.user?._id || this.$route.params.id;
      try {
        const { URL } = await import("@/Url/url");
        const { data } = await axios.post(
          `${URL}/api/subscription/register-without-payment`,
          {
            userId,
            planType: this.selectedSubscriptionPlan,
          }
        );

        if (data && data.success) {
          this.toast?.showSuccess("הרשמה ל14 יום חינם בוצעה בהצלחה!");
          this.showSubscriptionModal = false;
          // Refresh user data
          await this.store.fetchDashboardData(userId);
        } else {
          this.subscriptionError =
            data?.message || "שגיאה בהרשמה. אנא נסה שוב.";
        }
      } catch (error) {
        logger.error("Error registering without payment:", error);
        this.subscriptionError =
          error.response?.data?.message || "שגיאה בהרשמה. אנא נסה שוב.";
      }
    },
    formatCurrency(amount) {
      return new Intl.NumberFormat("he-IL", {
        style: "currency",
        currency: "ILS",
      }).format(amount || 0);
    },
    async initializeSubscriptionPayment() {
      this.isLoadingSubscriptionPayment = true;
      this.subscriptionError = "";

      try {
        // Get Stripe publishable key
        const { data: keyData } = await axios.get(
          `${URL}/api/stripe/publishable-key`
        );
        this.subscriptionStripePublishableKey = keyData.publishableKey;

        if (!this.subscriptionStripePublishableKey) {
          this.subscriptionError = "שגיאה בטעינת מערכת התשלום";
          this.isLoadingSubscriptionPayment = false;
          return;
        }

        // Load Stripe
        this.subscriptionStripe = await loadStripe(
          this.subscriptionStripePublishableKey
        );

        if (!this.subscriptionStripe) {
          this.subscriptionError = "שגיאה בטעינת מערכת התשלום";
          this.isLoadingSubscriptionPayment = false;
          return;
        }

        // Create subscription payment intent
        const userId = this.store.user?._id || this.$route.params.id;
        const { data: subscriptionData } = await axios.post(
          `${URL}/api/subscription/create-for-existing-user`,
          {
            userId,
            planType: this.selectedSubscriptionPlan, // 'annual' or 'monthly'
          }
        );

        if (!subscriptionData.success || !subscriptionData.clientSecret) {
          this.subscriptionError =
            subscriptionData.message || "שגיאה ביצירת מנוי. אנא נסה שוב.";
          this.isLoadingSubscriptionPayment = false;
          return;
        }

        this.subscriptionClientSecret = subscriptionData.clientSecret;

        // Create Elements instance
        this.subscriptionElements = this.subscriptionStripe.elements({
          clientSecret: this.subscriptionClientSecret,
          appearance: {
            theme: "night",
            variables: {
              colorPrimary: "#ff6a00",
              colorBackground: "#0b0b0f",
              colorText: "rgb(255, 255, 255)",
              colorDanger: "#ef4444",
              fontFamily:
                '"Heebo", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
              spacingUnit: "4px",
              borderRadius: "8px",
            },
            rules: {
              ".Input": {
                backgroundColor: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 106, 0, 0.2)",
                color: "rgb(255, 255, 255)",
                fontSize: "15px",
                fontWeight: "800",
              },
              ".Input:focus": {
                border: "1px solid rgba(255, 106, 0, 0.5)",
                boxShadow: "0 0 0 3px rgba(255, 106, 0, 0.18)",
              },
              ".Input--invalid": {
                border: "1px solid #ef4444",
                color: "#ef4444",
              },
            },
          },
          locale: "he",
        });

        // Create Payment Element
        this.subscriptionPaymentElement = this.subscriptionElements.create(
          "payment",
          {
            layout: "tabs",
          }
        );

        // Wait for DOM to be ready
        await this.$nextTick();

        // Find container - it should always exist now
        const elementContainer = document.getElementById(
          "subscription-payment-element"
        );

        if (elementContainer) {
          try {
            this.subscriptionPaymentElement.mount(
              "#subscription-payment-element"
            );
            this.isSubscriptionStripeReady = true;

            // Handle real-time validation errors
            this.subscriptionPaymentElement.on("change", (event) => {
              const displayError = document.getElementById(
                "subscription-payment-errors"
              );
              if (displayError) {
                if (event.error) {
                  displayError.textContent = event.error.message;
                } else {
                  displayError.textContent = "";
                }
              }
            });

            // Hide loading indicator after successful mount
            this.isLoadingSubscriptionPayment = false;
          } catch (mountError) {
            logger.error("Error mounting payment element:", mountError);
            this.subscriptionError = "שגיאה בטעינת שדות התשלום. אנא נסה שוב.";
            this.isLoadingSubscriptionPayment = false;
          }
        } else {
          logger.error("Payment element container not found");
          this.subscriptionError = "שגיאה בטעינת שדות התשלום. אנא רענן את הדף.";
          this.isLoadingSubscriptionPayment = false;
        }
      } catch (error) {
        logger.error("Error initializing subscription payment:", error);
        this.subscriptionError = "שגיאה באתחול מערכת התשלומים. אנא נסה שוב.";
        this.isLoadingSubscriptionPayment = false;
      }
    },
    async handleSubscriptionPayment() {
      if (
        !this.isSubscriptionStripeReady ||
        !this.subscriptionPaymentElement ||
        !this.subscriptionClientSecret
      ) {
        this.subscriptionError = "מערכת התשלומים לא נטענה. אנא רענן את הדף.";
        return;
      }

      this.isProcessingSubscription = true;
      this.subscriptionError = "";

      try {
        // Step 1: Submit the Payment Element first (required by Stripe)
        const { error: submitError } = await this.subscriptionElements.submit();
        if (submitError) {
          this.subscriptionError =
            submitError.message || "שגיאה באימות פרטי התשלום. אנא נסה שוב.";
          return;
        }

        // Step 2: Confirm Payment Intent with Payment Element
        const { error, paymentIntent } =
          await this.subscriptionStripe.confirmPayment({
            elements: this.subscriptionElements,
            clientSecret: this.subscriptionClientSecret,
            confirmParams: {
              return_url: `${window.location.origin}/Dashboard/${
                this.store.user?._id || this.$route.params.id
              }`,
            },
            redirect: "if_required",
          });

        if (error) {
          this.subscriptionError =
            error.message || "שגיאה באישור התשלום. אנא נסה שוב.";
          return;
        }

        if (paymentIntent && paymentIntent.status === "succeeded") {
          // Complete subscription on server
          const userId = this.store.user?._id || this.$route.params.id;
          const { data: completeData } = await axios.post(
            `${URL}/api/subscription/complete-for-existing-user`,
            {
              userId,
              paymentIntentId: paymentIntent.id,
              paymentMethodId: paymentIntent.payment_method,
              planType: this.selectedSubscriptionPlan,
            }
          );

          if (completeData.success) {
            this.toast?.showSuccess("הרשמה למנוי בוצעה בהצלחה! ברוך הבא.");
            this.showSubscriptionModal = false;
            this.showSubscriptionPaymentForm = false;
            // Reset form
            this.subscriptionError = "";
            // Refresh user data
            await this.store.fetchDashboardData(userId);
          } else {
            this.subscriptionError =
              completeData.message ||
              "המנוי אושר אך יש בעיה בעדכון השרת. אנא פנה לתמיכה.";
          }
        } else {
          this.subscriptionError = "מצב מנוי לא צפוי. אנא פנה לתמיכה.";
        }
      } catch (error) {
        logger.error("Error processing subscription payment:", error);
        this.subscriptionError =
          error.message || "שגיאה בחיבור לשרת. אנא נסה שוב.";
      } finally {
        this.isProcessingSubscription = false;
      }
    },
    // Handyman new design methods
    toggleAvailability() {
      this.isAvailable = !this.isAvailable;
      // TODO: Save availability to server
      this.toast?.showInfo(
        this.isAvailable ? "אתה כעת זמין לעבודה" : "אתה כעת לא זמין לעבודה"
      );
    },
    onAcceptJob(job) {
      this.onAccept(job);
    },
    onRejectJob(job) {
      // TODO: Implement reject job functionality
      this.toast?.showInfo("עבודה נדחתה");
    },
    async onViewJob(job) {
      if (!job) {
        this.toast?.showError("לא ניתן לטעון את פרטי העבודה");
        return;
      }

      const jobId = String(job?.id || job?._id || "").trim();
      if (!jobId || jobId === "undefined" || jobId === "null") {
        logger.error("Job missing ID:", job);
        this.toast?.showError("לא ניתן לטעון את פרטי העבודה - חסר מספר עבודה");
        return;
      }

      // Check if job has full details (subcategoryInfo as array with data)
      const hasFullDetails = 
        Array.isArray(job.subcategoryInfo) && 
        job.subcategoryInfo.length > 0 &&
        job.subcategoryInfo[0] &&
        (job.subcategoryInfo[0].subcategory || job.subcategoryInfo[0].category);

      // Always try to fetch from server to ensure we have latest data
      try {
        const response = await axios.get(`${URL}/jobs/${jobId}`);
        if (response.data && response.data.success && response.data.job) {
          this.jobDetails = response.data.job;
        } else if (hasFullDetails) {
          // If fetch failed but we have full details, use them
          this.jobDetails = job;
        } else {
          // No full details and fetch failed
          logger.error("Failed to fetch job details, response:", response.data);
          this.toast?.showError("לא ניתן לטעון את פרטי העבודה מהשרת");
          // Still try to show what we have
          this.jobDetails = job;
        }
      } catch (error) {
        logger.error("Error fetching job details:", error);
        if (hasFullDetails) {
          // If we have full details, use them even if fetch failed
          this.jobDetails = job;
        } else {
          // No details and fetch failed
          this.toast?.showError("לא ניתן לטעון את פרטי העבודה מהשרת");
          this.jobDetails = job;
        }
      }
    },
    getClientAvatar(job) {
      // Return client avatar or default
      return job.clientAvatar || "/img/Hendima-logo.png";
    },
    getJobTitleForHandyman(job) {
      if (job.subcategoryInfo && job.subcategoryInfo.length > 0) {
        return job.subcategoryInfo.map(s => s.subcategory || s.category).join(", ");
      }
      return job.desc || "עבודה";
    },
    formatJobTimeAgo(job) {
      if (!job.createdAt) return "";
      const jobDate = new Date(job.createdAt);
      const now = new Date();
      const diffMs = now - jobDate;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffMins < 1) return "עכשיו";
      if (diffMins < 60) return `לפני ${diffMins} דקות`;
      if (diffHours < 24) return `לפני ${diffHours} שעות`;
      if (diffDays === 1) return "אתמול";
      return `לפני ${diffDays} ימים`;
    },
    getJobLocation(job) {
      return job.locationText || job.city || "מיקום לא זמין";
    },
    formatJobDistance(job) {
      if (job.distance) {
        const dist = Number(job.distance);
        if (Number.isFinite(dist) && dist > 0) {
          if (dist < 1) return `${Math.round(dist * 1000)} מ'`;
          return `${dist.toFixed(1)} ק"מ`;
        }
      }
      return "מרחק לא זמין";
    },
    getJobCategories(job) {
      const categories = [];
      if (job.subcategoryInfo && job.subcategoryInfo.length > 0) {
        job.subcategoryInfo.forEach(sub => {
          if (sub.subcategory) categories.push(sub.subcategory);
          else if (sub.category) categories.push(sub.category);
        });
      }
      return categories.slice(0, 2); // Show max 2 categories
    },
    formatJobBudget(job) {
      // Try to get budget from various sources
      if (job.budget) return Number(job.budget).toLocaleString('he-IL');
      if (job.price) return Number(job.price).toLocaleString('he-IL');
      if (job.subcategoryInfo && job.subcategoryInfo.length > 0) {
        const price = job.subcategoryInfo[0].price;
        if (price && price !== "bid") return Number(price).toLocaleString('he-IL');
      }
      return "מחיר לפי הצעה";
    },
    getJobIconForHandyman(job) {
      return this.getJobIcon(job);
    },
    isJobExpired(job) {
      // Check if job has quotedUntil and if it's expired
      if (job.quotedUntil) {
        const quotedUntil = new Date(job.quotedUntil);
        const now = new Date();
        return now > quotedUntil;
      }
      return false;
    },
  },
  async mounted() {
    // ⚠️ CRITICAL: Enable Push Notifications FIRST, before anything else
    // This ensures it runs even if other code fails
    try {
      logger.log("[Dashboard] Mounted - initializing push notifications first");
      // Don't await - let it run in background
      this.enablePushNotifications().catch((error) => {
        logger.error("[Dashboard] Push notification initialization error:", error);
      });
    } catch (pushError) {
      logger.error("[Dashboard] Push notification initialization error:", pushError);
    }

    // Fast check for active job (runs in parallel with dashboard data loading)
    const userId = this.$route.params.id;
    let activeJobCheckPromise = null;
    if (userId) {
      // Call check-active-job in parallel with fetchDashboardData
      activeJobCheckPromise = this.store
        .checkActiveJob(userId)
        .then((result) => {
          if (result && result.success && result.hasActiveJob && result.jobId) {
            // If we got the full job object, verify user is assigned and use it immediately
            if (
              result.job &&
              result.job.status !== "open" &&
              result.job.status !== "done"
            ) {
              // Verify user is assigned to this job
              const userIdStr = String(userId);
              let isUserAssigned = false;

              if (this.isHendiman) {
                // For handyman - check if handymanId matches (support array)
                if (result.job.handymanId) {
                  if (Array.isArray(result.job.handymanId)) {
                    isUserAssigned = result.job.handymanId.some((id) => {
                      // Handle both ObjectId and string - try multiple formats
                      let idStr = "";
                      if (id) {
                        if (id._id) {
                          idStr = String(id._id);
                        } else if (id.$oid) {
                          idStr = String(id.$oid);
                        } else if (typeof id === "object" && id.toString) {
                          idStr = id.toString();
                        } else {
                          idStr = String(id);
                        }
                      }
                      return idStr === userIdStr;
                    });
                  } else {
                    // Handle single handymanId (not array)
                    let handymanIdStr = "";
                    if (result.job.handymanId) {
                      if (result.job.handymanId._id) {
                        handymanIdStr = String(result.job.handymanId._id);
                      } else if (result.job.handymanId.$oid) {
                        handymanIdStr = String(result.job.handymanId.$oid);
                      } else if (
                        typeof result.job.handymanId === "object" &&
                        result.job.handymanId.toString
                      ) {
                        handymanIdStr = result.job.handymanId.toString();
                      } else {
                        handymanIdStr = String(result.job.handymanId);
                      }
                    }
                    isUserAssigned = handymanIdStr === userIdStr;
                  }
                }
              } else {
                // For client - check if clientId matches
                const clientIdStr = result.job.clientId?._id
                  ? String(result.job.clientId._id)
                  : String(result.job.clientId || "");
                isUserAssigned =
                  clientIdStr === userIdStr && !!result.job.handymanId;
              }

              if (isUserAssigned) {
                this.activeAssignedJob = result.job;
                this.isChatMinimized = false;
                return; // Done - chat is open
              }
            }

            // Otherwise, store the active job ID - will be used after dashboard data loads
            this.pendingActiveJobId = result.jobId;
            // Try to find job immediately if store already has jobs
            this.$nextTick(() => {
              const job = this.store.jobs?.find(
                (j) => String(j._id || j.id) === String(result.jobId)
              );
              if (job && job.status !== "open" && job.status !== "done") {
                // Verify user is assigned to this job
                const userIdStr = String(userId);
                let isUserAssigned = false;

                if (this.isHendiman) {
                  // For handyman - check if handymanId matches (support array)
                  logger.log(
                    "[Dashboard] 🔍 Checking handyman assignment in store.jobs:",
                    "userId:",
                    userIdStr,
                    "handymanId:",
                    job.handymanId
                  );
                  if (job.handymanId) {
                    if (Array.isArray(job.handymanId)) {
                      logger.log(
                        "[Dashboard] 🔍 handymanId is array, checking elements..."
                      );
                      isUserAssigned = job.handymanId.some((id, index) => {
                        // Handle both ObjectId and string - try multiple formats
                        let idStr = "";
                        if (id) {
                          if (id._id) {
                            idStr = String(id._id);
                          } else if (id.$oid) {
                            idStr = String(id.$oid);
                          } else if (typeof id === "object" && id.toString) {
                            idStr = id.toString();
                          } else {
                            idStr = String(id);
                          }
                        }
                        const matches = idStr === userIdStr;
                        logger.log(
                          `[Dashboard] 🔍 Array element ${index}:`,
                          "id:",
                          id,
                          "idStr:",
                          idStr,
                          "userIdStr:",
                          userIdStr,
                          "matches:",
                          matches
                        );
                        return matches;
                      });
                      logger.log(
                        "[Dashboard] 🔍 isUserAssigned from array:",
                        isUserAssigned
                      );
                    } else {
                      // Handle single handymanId (not array)
                      let handymanIdStr = "";
                      if (job.handymanId) {
                        if (job.handymanId._id) {
                          handymanIdStr = String(job.handymanId._id);
                        } else if (job.handymanId.$oid) {
                          handymanIdStr = String(job.handymanId.$oid);
                        } else if (
                          typeof job.handymanId === "object" &&
                          job.handymanId.toString
                        ) {
                          handymanIdStr = job.handymanId.toString();
                        } else {
                          handymanIdStr = String(job.handymanId);
                        }
                      }
                      isUserAssigned = handymanIdStr === userIdStr;
                      logger.log(
                        "[Dashboard] 🔍 Single handymanId comparison:",
                        handymanIdStr,
                        "===",
                        userIdStr,
                        "→",
                        isUserAssigned
                      );
                    }
                  } else {
                    logger.log(
                      "[Dashboard] ⚠️ No handymanId in job from store.jobs"
                    );
                  }
                } else {
                  // For client - check if clientId matches
                  const clientIdStr = job.clientId?._id
                    ? String(job.clientId._id)
                    : String(job.clientId || "");
                  isUserAssigned =
                    clientIdStr === userIdStr && !!job.handymanId;
                }

                if (isUserAssigned) {
                  this.activeAssignedJob = job;
                  this.isChatMinimized = false;
                  this.pendingActiveJobId = null; // Clear since we found it
                }
              }
            });
          }
        })
        .catch((error) => {
          logger.error("[Dashboard] ❌ Error checking active job:", error);
        });
    }
    // Don't clear activeAssignedJob on mount - let checkForAssignedJob handle it
    // this.activeAssignedJob = null;

    // Listen for window resize to update mobile state
    window.addEventListener("resize", this.handleResize);

    // Show the create-call FAB only after the user scrolls down
    this.handleFabScroll();
    window.addEventListener("scroll", this.handleFabScroll, { passive: true });

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
      const routeId = this.$route.params.id;
      if (!routeId) {
        logger.error("[Dashboard] No route ID found");
        this.$router.push("/");
        return;
      }
      const initialData = await this.store.fetchDashboardData(routeId);

      // אם המשתמש לא נמצא, החזר ל-דף הבית
      if (!initialData || !initialData.User) {
        this.$router.push("/");
        return;
      }

      // בדוק אם המשתמש חסום (אחרי הבקשה הראשונה)
      if (initialData.User.isBlocked === true) {
        this.$router.push({
          name: "logIn",
          query: { blocked: "true" },
        });
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

      // בדוק אם המשתמש חסום
      if (data.User.isBlocked === true) {
        this.$router.push({
          name: "logIn",
          query: { blocked: "true" },
        });
        return;
      }

      // בדוק אם הנדימן צריך מנוי פעיל (באמצעות endpoint חדש)
      if (data.User.isHandyman === true) {
        try {
          const userId = this.store.user?._id || this.$route.params.id;
          const { URL } = await import("@/Url/url");
          const statusResponse = await axios.get(
            `${URL}/api/subscription/status?userId=${userId}`
          );

          if (statusResponse.data && statusResponse.data.success) {
            const status = statusResponse.data;
            // Store subscription status for use in computed properties
            this.subscriptionStatus = status;

            // אם המשתמש חינם - אין צורך לעשות כלום
            if (status.isFree) {
              // Free forever - no action needed
            }
            // אם המשתמש בימי נסיון - אין צורך לעשות כלום
            else if (status.isTrial) {
              // Still in trial - no action needed
              // If in trial and showing modal, set fillCreditCardNow to false by default
              if (this.showSubscriptionModal) {
                this.fillCreditCardNow = false;
              }
            }
            // אם צריך חיוב - הצג פופאפ מנוי
            else if (status.needsBilling) {
              this.showSubscriptionModal = true;
              // If needs billing (after expiration), force fillCreditCardNow to true
              this.fillCreditCardNow = true;
            }
            // אם יש מנוי פעיל - אין צורך לעשות כלום
            else if (
              status.hasActiveSubscription &&
              !status.subscriptionCancelled
            ) {
              // Has active subscription - no action needed
            }
          }
        } catch (statusError) {
          // אם יש שגיאה, נשתמש בלוגיקה הישנה כגיבוי
          logger.error("Error checking subscription status:", statusError);
          const hasAccess =
            data.User.trialExpiresAt === "always" || // Free forever
            data.User.hasActiveSubscription === true;

          if (!hasAccess) {
            // הנדימן לא מנוי - הצג פופאפ מנוי
            this.showSubscriptionModal = true;
          }
        }
      }

      if (data.User) {
        this.me.name = data.User.username;
        this.me.specialties = data.User.specialties;
        this.me.avatarUrl = data.User.imageUrl;
        this.me.id = data.User._id;
        this.me.phone = data.User.phone;
        this.me.email = data.User.email;
        this.me.city = data.User.city;
        this.me.subscriptionPlanType = data.User.subscriptionPlanType;
        this.me.subscriptionExpiresAt = data.User.subscriptionExpiresAt;
        this.me.trialExpiresAt = data.User.trialExpiresAt;
        this.me.billingStartDate = data.User.billingStartDate;
        this.isHendiman = data.User.isHandyman;

        // Check for pending quotations (for clients only) - with 1 second delay after isHendiman is set
        if (!this.isHendiman) {
          logger.log("[Dashboard mounted] Scheduling checkPendingQuotations in 1 second");
          logger.log("[Dashboard mounted] isHendiman:", this.isHendiman, "userId:", this.store.user?._id || this.me?._id || this.$route.params.id);
          setTimeout(async () => {
            logger.log("[Dashboard mounted] Timeout fired, calling checkPendingQuotations");
            logger.log("[Dashboard mounted] Calling checkPendingQuotations");
            await this.checkPendingQuotations();
          }, 1000);
        } else {
          logger.log("[Dashboard mounted] User is handyman, skipping checkPendingQuotations");
        }

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
          const userId = this.store.user?._id || this.$route.params.id;
          await this.store.fetchHandymen(1, this.userCoordinates, userId);
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

        // Check if we have a pending active job from the fast check
        if (this.pendingActiveJobId && !this.activeAssignedJob) {
          const pendingJob = this.store.jobs?.find(
            (j) => String(j._id || j.id) === String(this.pendingActiveJobId)
          );

          if (
            pendingJob &&
            pendingJob.status !== "open" &&
            pendingJob.status !== "done"
          ) {
            // Verify user is assigned to this job
            const userId = this.store.user?._id || this.me?._id;
            const userIdStr = String(userId);
            let isUserAssigned = false;

            if (this.isHendiman) {
              // For handyman - check if handymanId matches (support array)
              if (pendingJob.handymanId) {
                if (Array.isArray(pendingJob.handymanId)) {
                  isUserAssigned = pendingJob.handymanId.some((id) => {
                    // Handle both ObjectId and string - try multiple formats
                    let idStr = "";
                    if (id) {
                      if (id._id) {
                        idStr = String(id._id);
                      } else if (id.$oid) {
                        idStr = String(id.$oid);
                      } else if (typeof id === "object" && id.toString) {
                        idStr = id.toString();
                      } else {
                        idStr = String(id);
                      }
                    }
                    return idStr === userIdStr;
                  });
                } else {
                  // Handle single handymanId (not array)
                  let handymanIdStr = "";
                  if (pendingJob.handymanId) {
                    if (pendingJob.handymanId._id) {
                      handymanIdStr = String(pendingJob.handymanId._id);
                    } else if (pendingJob.handymanId.$oid) {
                      handymanIdStr = String(pendingJob.handymanId.$oid);
                    } else if (
                      typeof pendingJob.handymanId === "object" &&
                      pendingJob.handymanId.toString
                    ) {
                      handymanIdStr = pendingJob.handymanId.toString();
                    } else {
                      handymanIdStr = String(pendingJob.handymanId);
                    }
                  }
                  isUserAssigned = handymanIdStr === userIdStr;
                }
              }
            } else {
              // For client - check if clientId matches
              const clientIdStr = pendingJob.clientId?._id
                ? String(pendingJob.clientId._id)
                : String(pendingJob.clientId || "");
              isUserAssigned =
                clientIdStr === userIdStr && !!pendingJob.handymanId;
            }

            if (isUserAssigned) {
              this.activeAssignedJob = pendingJob;
              this.isChatMinimized = false;
              this.pendingActiveJobId = null; // Clear
            } else {
              // Try to fetch the job directly from server as fallback
              if (this.isHendiman) {
                try {
                  const { URL } = await import("@/Url/url");
                  const response = await axios.get(
                    `${URL}/jobs/${this.pendingActiveJobId}`
                  );
                  if (
                    response.data &&
                    response.data.success &&
                    response.data.job
                  ) {
                    const fetchedJob = response.data.job;
                    // Check assignment again with fetched job
                    let isUserAssigned = false;
                    if (fetchedJob.handymanId) {
                      if (Array.isArray(fetchedJob.handymanId)) {
                        isUserAssigned = fetchedJob.handymanId.some((id) => {
                          let idStr = "";
                          if (id) {
                            if (id._id) idStr = String(id._id);
                            else if (id.$oid) idStr = String(id.$oid);
                            else if (typeof id === "object" && id.toString)
                              idStr = id.toString();
                            else idStr = String(id);
                          }
                          return idStr === userIdStr;
                        });
                      } else {
                        let handymanIdStr = "";
                        if (fetchedJob.handymanId._id)
                          handymanIdStr = String(fetchedJob.handymanId._id);
                        else if (fetchedJob.handymanId.$oid)
                          handymanIdStr = String(fetchedJob.handymanId.$oid);
                        else if (
                          typeof fetchedJob.handymanId === "object" &&
                          fetchedJob.handymanId.toString
                        )
                          handymanIdStr = fetchedJob.handymanId.toString();
                        else handymanIdStr = String(fetchedJob.handymanId);
                        isUserAssigned = handymanIdStr === userIdStr;
                      }
                    }
                    if (
                      isUserAssigned &&
                      fetchedJob.status !== "open" &&
                      fetchedJob.status !== "done"
                    ) {
                      const isCancelled =
                        fetchedJob.cancel === true ||
                        fetchedJob.isCancelled === true ||
                        fetchedJob.status === "cancelled";
                      if (!isCancelled) {
                        this.activeAssignedJob = fetchedJob;
                        this.isChatMinimized = false;
                        this.pendingActiveJobId = null;
                      }
                    }
                  }
                } catch (fetchError) {
                  // Error fetching pending job
                }
              }
              if (this.pendingActiveJobId) {
                this.pendingActiveJobId = null; // Clear invalid pending job
              }
            }
          } else if (!pendingJob) {
            // Job not in store.jobs - try to fetch it directly
            try {
              const { URL } = await import("@/Url/url");
              const response = await axios.get(
                `${URL}/jobs/${this.pendingActiveJobId}`
              );
              if (response.data && response.data.success && response.data.job) {
                const fetchedJob = response.data.job;
                const userId = this.store.user?._id || this.me?._id;
                const userIdStr = String(userId);
                let isUserAssigned = false;

                if (this.isHendiman) {
                  if (fetchedJob.handymanId) {
                    if (Array.isArray(fetchedJob.handymanId)) {
                      isUserAssigned = fetchedJob.handymanId.some((id) => {
                        let idStr = "";
                        if (id) {
                          if (id._id) idStr = String(id._id);
                          else if (id.$oid) idStr = String(id.$oid);
                          else if (typeof id === "object" && id.toString)
                            idStr = id.toString();
                          else idStr = String(id);
                        }
                        return idStr === userIdStr;
                      });
                    } else {
                      let handymanIdStr = "";
                      if (fetchedJob.handymanId._id)
                        handymanIdStr = String(fetchedJob.handymanId._id);
                      else if (fetchedJob.handymanId.$oid)
                        handymanIdStr = String(fetchedJob.handymanId.$oid);
                      else if (
                        typeof fetchedJob.handymanId === "object" &&
                        fetchedJob.handymanId.toString
                      )
                        handymanIdStr = fetchedJob.handymanId.toString();
                      else handymanIdStr = String(fetchedJob.handymanId);
                      isUserAssigned = handymanIdStr === userIdStr;
                    }
                  }
                }

                if (
                  isUserAssigned &&
                  fetchedJob.status !== "open" &&
                  fetchedJob.status !== "done"
                ) {
                  const isCancelled =
                    fetchedJob.cancel === true ||
                    fetchedJob.isCancelled === true ||
                    fetchedJob.status === "cancelled";
                  if (!isCancelled) {
                    this.activeAssignedJob = fetchedJob;
                    this.isChatMinimized = false;
                    this.pendingActiveJobId = null;
                  }
                }
              }
            } catch (fetchError) {
              // Error fetching pending job
            }
          }
        }

        // אם לא מצאנו עבודה משובצת, נבדוק שוב אחרי שהנתונים נטענו לגמרי
        if (!this.activeAssignedJob) {
          // נבדוק גם ב-store.jobs (למקרה שהנתונים עודכנו אחרי checkForAssignedJobFromData)
          setTimeout(() => {
            this.checkForAssignedJob();
            // Also check pending active job again after delay
            if (this.pendingActiveJobId && !this.activeAssignedJob) {
              const pendingJob = this.store.jobs?.find(
                (j) => String(j._id || j.id) === String(this.pendingActiveJobId)
              );
              if (
                pendingJob &&
                pendingJob.status !== "open" &&
                pendingJob.status !== "done"
              ) {
                // Verify user is assigned to this job
                const userId = this.store.user?._id || this.me?._id;
                const userIdStr = String(userId);
                let isUserAssigned = false;

                if (this.isHendiman) {
                  // For handyman - check if handymanId matches (support array)
                  if (pendingJob.handymanId) {
                    if (Array.isArray(pendingJob.handymanId)) {
                      isUserAssigned = pendingJob.handymanId.some((id) => {
                        const idStr = id?._id
                          ? String(id._id)
                          : id?.$oid
                          ? String(id.$oid)
                          : String(id);
                        return idStr === userIdStr;
                      });
                    } else {
                      const handymanIdStr = pendingJob.handymanId?._id
                        ? String(pendingJob.handymanId._id)
                        : pendingJob.handymanId?.$oid
                        ? String(pendingJob.handymanId.$oid)
                        : String(pendingJob.handymanId);
                      isUserAssigned = handymanIdStr === userIdStr;
                    }
                  }
                } else {
                  // For client - check if clientId matches
                  const clientIdStr = pendingJob.clientId?._id
                    ? String(pendingJob.clientId._id)
                    : String(pendingJob.clientId || "");
                  isUserAssigned =
                    clientIdStr === userIdStr && !!pendingJob.handymanId;
                }

                if (isUserAssigned) {
                  this.activeAssignedJob = pendingJob;
                  this.isChatMinimized = false;
                  this.pendingActiveJobId = null; // Clear
                } else {
                  this.pendingActiveJobId = null; // Clear invalid pending job
                }
              }
            }
          }, 500);
        }

        // Check if we need to show approval modal for client
        if (!this.isHendiman && data?.Jobs) {
          const fromJobSummary = this.$route.query.fromJobSummary === "true";
          const jobIdFromQuery = this.$route.query.jobId;

          if (fromJobSummary && jobIdFromQuery) {
            // Coming from JobSummary - check specific job
            const job = data.Jobs.find(
              (j) => String(j._id || j.id) === String(jobIdFromQuery)
            );
            if (job) {
              const isDone = job.status === "done";
              // אם העבודה סיימה, סגור את הצ'אט
              if (isDone) {
                this.activeAssignedJob = null;
                this.isChatMinimized = true;
              }
              const needsApproval =
                job.clientApproved === false || job.clientApproved == null;
              const paymentNotReceived = !job.handymanReceivedPayment;
              if (isDone && needsApproval && paymentNotReceived) {
                this.pendingApprovalJob = job;
                this.showClientApprovalModal = true;
                // Remove query parameters after showing modal
                this.$router.replace({
                  path: this.$route.path,
                  query: {},
                });
              }
            } else {
              // Job not found in data, try to fetch it
              try {
                const { URL } = await import("@/Url/url");
                const response = await axios.get(
                  `${URL}/jobs/${jobIdFromQuery}`
                );
                if (
                  response.data &&
                  response.data.success &&
                  response.data.job
                ) {
                  const fetchedJob = response.data.job;
                  const isDone = fetchedJob.status === "done";
                  // אם העבודה סיימה, סגור את הצ'אט
                  if (isDone) {
                    this.activeAssignedJob = null;
                    this.isChatMinimized = true;
                  }
                  const needsApproval =
                    fetchedJob.clientApproved === false ||
                    fetchedJob.clientApproved == null;
                  const paymentNotReceived =
                    !fetchedJob.handymanReceivedPayment;
                  if (isDone && needsApproval && paymentNotReceived) {
                    this.pendingApprovalJob = fetchedJob;
                    this.showClientApprovalModal = true;
                  }
                }
              } catch (fetchError) {
                // Error fetching job, ignore
              }
              // Remove query parameters
              this.$router.replace({
                path: this.$route.path,
                query: {},
              });
            }
          } else {
            // Not coming from JobSummary - check all jobs for any that need approval
            const jobsNeedingApproval = data.Jobs.filter((job) => {
              const isDone = job.status === "done";
              const needsApproval =
                job.clientApproved === false || job.clientApproved == null;
              const paymentNotReceived = !job.handymanReceivedPayment;
              // Show modal if job is done and needs approval AND payment hasn't been received
              return isDone && needsApproval && paymentNotReceived;
            });
            if (
              jobsNeedingApproval.length > 0 &&
              !this.showClientApprovalModal
            ) {
              // Show approval modal for the first job that needs approval
              this.pendingApprovalJob = jobsNeedingApproval[0];
              this.showClientApprovalModal = true;
            }
          }
        }

        // Check for jobs where client approved but handyman needs onboarding (for handyman)
        if (this.isHendiman && data?.Jobs) {
          // Check if any done jobs have paymentStatus "paid" - if so, hide the "waiting for approval" notification
          const paidJobs = data.Jobs.filter(
            (job) =>
              job.status === "done" &&
              (job.paymentStatus === "paid" ||
                job.handymanReceivedPayment === true)
          );
          if (paidJobs.length > 0) {
            this.showHandymanDoneNotification = false;
          }

          const approvedJobsNeedingOnboarding = data.Jobs.filter(
            (job) =>
              job.status === "done" &&
              job.clientApproved === true &&
              !job.handymanReceivedPayment
          );
          if (approvedJobsNeedingOnboarding.length > 0) {
            // First check if account is ready - if so, payment should have been released
            // Only show onboarding modal if account is not ready
            const handymanId =
              this.store.user?._id ||
              this.me?.id ||
              this.me?._id ||
              this.$route.params.id;

            if (handymanId) {
              try {
                const { URL } = await import("@/Url/url");
                const statusResponse = await axios.get(
                  `${URL}/api/handyman/${handymanId}/stripe/status`
                );

                if (
                  statusResponse.data &&
                  statusResponse.data.success &&
                  !statusResponse.data.needsOnboarding
                ) {
                  // Account is ready - payment should have been released, don't show modal
                } else {
                  // Account not ready - show onboarding modal
                  const job = approvedJobsNeedingOnboarding[0];
                  await this.fetchOnboardingLinkForJob(job);
                }
              } catch (statusError) {
                // If status check fails, show modal to be safe
                const job = approvedJobsNeedingOnboarding[0];
                await this.fetchOnboardingLinkForJob(job);
              }
            }
          }
        }

        // Check if handyman needs to complete onboarding (on mount) - REMOVED
      }

      // Initialize WebSocket for real-time updates
      this.initWebSocket();

      // Push notifications already initialized at the start of mounted()

      // Start polling for quotations (fallback if WebSocket fails) - only for clients
      if (!this.isHendiman) {
        this.quotationsPollingInterval = setInterval(() => {
          // Only check if modal is not already open
          if (!this.showClientQuotationsModal) {
            this.checkPendingQuotations();
          }
        }, 10000); // Check every 10 seconds
      }
    } catch (error) {
      // אם יש שגיאה, לוג אותה אבל אל תגרום לקריסה
      logger.error("[Dashboard] ❌ Fatal error in mounted hook:", error);
      if (error?.stack) {
        logger.error("[Dashboard] Error stack:", error.stack);
      }
      // Don't redirect - let the component render with error state
      // The component should handle missing data gracefully
    }
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.handleResize);
    window.removeEventListener("scroll", this.handleFabScroll);
    this.disconnectWebSocket();
    // Clear quotations polling interval
    if (this.quotationsPollingInterval) {
      clearInterval(this.quotationsPollingInterval);
      this.quotationsPollingInterval = null;
    }
  },
  watch: {
    "handymanFilters.maxKm"(newVal) {
      // Reset local value when actual value changes
      if (this.localMaxKm !== null && this.localMaxKm === newVal) {
        this.localMaxKm = null;
      }
    },
    // צפה בשינויים ב-jobs כדי לבדוק עבודה משובצת
    "store.jobs": {
      handler(newJobs, oldJobs) {
        // שמור את ה-jobId הנוכחי לפני בדיקה
        const currentJobId =
          this.activeAssignedJob?._id || this.activeAssignedJob?.id;

        // רק אם יש שינוי אמיתי ב-jobs, נבדוק עבודה משובצת
        // נמנע מקריאות מיותרות אם ה-jobs לא השתנו
        if (newJobs && newJobs.length > 0) {
          this.$nextTick(() => {
            // בדוק עבודה משובצת
            this.checkForAssignedJob();

            // אם היה job פעיל, וודא שהוא עדיין פעיל אחרי ה-update
            if (currentJobId) {
              this.$nextTick(() => {
                const job = newJobs.find(
                  (j) => String(j._id || j.id) === String(currentJobId)
                );
                if (job) {
                  // אם העבודה סיימה (status: "done" או "open"), סגור את הצ'אט
                  if (job.status === "open" || job.status === "done") {
                    this.activeAssignedJob = null;
                    this.isChatMinimized = true;
                  } else if (job.status !== "open" && job.status !== "done") {
                    // העבודה עדיין פעילה - וודא שהצ'אט פתוח
                    if (
                      !this.activeAssignedJob ||
                      String(
                        this.activeAssignedJob._id || this.activeAssignedJob.id
                      ) !== String(currentJobId)
                    ) {
                      this.activeAssignedJob = job;
                      this.isChatMinimized = false;
                    }
                  }
                }
              });
            }
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
  background-color: #030303;
  background-image: linear-gradient(
      45deg,
      rgba(255, 255, 255, 0.01) 25%,
      transparent 25%
    ),
    linear-gradient(-45deg, rgba(255, 255, 255, 0.01) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgba(255, 255, 255, 0.01) 75%),
    linear-gradient(-45deg, transparent 75%, rgba(255, 255, 255, 0.01) 75%),
    radial-gradient(
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
  background-size: 8px 8px, 8px 8px, 8px 8px, 8px 8px, auto, auto, auto;
  background-attachment: fixed;

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
  grid-template-columns: 1fr; /* Jobs centered */
  grid-template-rows: 1fr auto; /* Jobs section takes available space, tools at bottom */
  gap: 14px;
  align-items: stretch; // זה יגרום לשני הבלוקים להיות באותו גובה
  justify-items: center; /* Center jobs section */

  // For handyman on desktop: jobs centered, filters on right
  @media (min-width: 981px) {
    &:has(.side--handyman-filters) {
      grid-template-columns: 1fr 1fr; /* Jobs centered, filters on right */
      grid-template-rows: 1fr auto;
      justify-items: start; /* Jobs start from center */
    }
  }

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto; /* Stack items vertically on smaller screens */
    justify-items: center; /* Center all items */
  }

  @media (max-width: 768px) {
    gap: clamp(16px, 4vw, 24px);
    display: flex;
    flex-direction: column;
    padding: clamp(12px, 3vw, 16px);
    padding-bottom: calc(
      80px + env(safe-area-inset-bottom)
    ); // Space for bottom nav
    align-items: center; /* Center items on mobile */
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
  background: #242424;
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

  &--handyman-filters {
    @media (max-width: 980px) {
      display: none; /* Hide filters aside on mobile/tablet */
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
    position: relative;
    z-index: 100;
    padding: 0;
    margin: 10px auto;
    width: 80%;
    backdrop-filter: none;
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
  padding: 0 !important;
  margin: 0;
  display: block; // Visible on desktop
  background: transparent;
  border: none;

  @media (max-width: 768px) {
    display: none; // Hidden on mobile
  }
}

.client-actions-desktop {
  display: block; // Visible on desktop
  width: 100%;
  margin: 0 auto;

  @media (max-width: 768px) {
    display: none; // Hidden on mobile
  }
}

/* Screenshot-like client header */
.mHdr {
  position: sticky;
  top: 0;
  z-index: 2500;
  direction: ltr;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
  margin: -16px -16px 6px;
  background: rgba(3, 3, 3, 0.9);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  @media (max-width: 768px) {
    margin: calc(-12px - env(safe-area-inset-top)) -10px 6px;
    padding-top: calc(14px + env(safe-area-inset-top));
  }
}

.mHdr__icons {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mHdr__icon {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.75);
  display: grid;
  place-items: center;
  position: relative;
  cursor: pointer;

  &:active {
    transform: scale(0.92);
  }
}

.mHdr__dot {
  position: absolute;
  top: 9px;
  left: 9px;
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: $orange;
  border: 2px solid #030303;
}

.mHdr__center {
  direction: rtl;
  text-align: right;
  margin-left: auto;
  margin-right: auto;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.mHdr__kicker {
  font-size: 10px;
  font-weight: 1000;
  color: rgba(249, 115, 22, 0.75);
  letter-spacing: 2px;
  text-align: right;
  width: 100%;
  direction: rtl;
}

.mHdr__name {
  font-size: 24px;
  font-weight: 1100;
  letter-spacing: -0.4px;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1;
  text-align: right;
  direction: rtl;
  width: 100%;
}

.mHdr__avatar {
  width: 46px;
  height: 46px;
  border-radius: 999px;
  border: 2px solid rgba(249, 115, 22, 0.95);
  background: rgba(255, 255, 255, 0.03);
  padding: 2px;
  overflow: hidden;
  cursor: pointer;

  img {
    width: 100%;
    height: 100%;
    border-radius: 999px;
    object-fit: cover;
    display: block;
  }
}

.mHdr__ph {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.75);
}

/* Mobile client nearby title row */
.clientNearby {
  margin: 6px 0 0;
}

.clientNearby__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 0 8px;
  margin: 10px 0 12px;
}

.clientNearby__title {
  margin: 0;
  font-size: 28px;
  font-weight: 1200;
  letter-spacing: -0.6px;
}

.clientNearby__filter {
  border: none;
  background: transparent;
  color: rgba(249, 115, 22, 0.75);
  font-size: 22px;
  font-weight: 1100;
  line-height: 1;
  cursor: pointer;
}

/* Floating + */
.fab {
  position: fixed;
  right: 24px;
  bottom: calc(58px + 10px + env(safe-area-inset-bottom));
  height: 40px;
  padding: 0 12px;
  border-radius: 999px;
  border: 2px solid rgba(255, 255, 255, 0.18);
  background: linear-gradient(135deg, $orange, $orange2);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.65);
  color: #0b0b0f;
  z-index: 2600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
}

.fab__plus {
  font-size: 22px;
  font-weight: 1200;
  line-height: 1;
}

.fab__label {
  font-size: 13px;
  font-weight: 1100;
  line-height: 1;
  white-space: nowrap;
}

/* Bottom nav */
.mNav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 58px;
  padding: 4px 16px calc(9px + env(safe-area-inset-bottom));
  background: rgba(5, 5, 5, 0.94);
  backdrop-filter: blur(30px);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  gap: 10px;
  z-index: 2500;
}

.mNav__item {
  border: none;
  background: transparent;
  color: rgba(113, 113, 122, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: calc(100% / var(--nav-items-count, 3));
  flex: 0 0 calc(100% / var(--nav-items-count, 3));
  cursor: pointer;
  position: relative;

  &:active {
    transform: scale(0.96);
  }

  &--highlight {
    color: $orange;
    
    .mNav__ic {
      color: $orange;
    }
    
    .mNav__txt {
      color: $orange;
      font-weight: 900;
    }
  }
}

.mNav__ic {
  font-size: 22px;
}

.mNav__txt {
  font-size: 11px;
  font-weight: 900;
}

.mNav__badge {
  position: absolute;
  top: 4px;
  right: 14px;
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: $orange;
  border: 2px solid #030303;
}

@media (max-width: 768px) {
  .grid {
    padding-bottom: calc(76px + env(safe-area-inset-bottom));
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
/* Trial Expired Modal */
.trial-expired-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
  backdrop-filter: blur(8px);
}

.trial-expired-modal__content {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border-radius: 20px;
  padding: 40px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 2px solid rgba($orange, 0.3);
  animation: modalSlideIn 0.3s ease;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.trial-expired-modal__header {
  text-align: center;
  margin-bottom: 30px;
}

.trial-expired-modal__title {
  font-size: 28px;
  font-weight: 900;
  color: $orange2;
  margin: 0 0 10px;
  text-shadow: 0 2px 8px rgba($orange, 0.3);
}

.trial-expired-modal__subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  line-height: 1.5;
}

.trial-expired-modal__body {
  margin-top: 30px;
}

.trial-expired-modal__message {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  margin: 0 0 25px;
  line-height: 1.6;
}

.trial-payment-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.trial-payment-element {
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba($orange, 0.2);
  border-radius: 12px;
  min-height: 100px;
}

.trial-payment-errors {
  color: #ff4444;
  font-size: 14px;
  text-align: center;
  min-height: 20px;
}

.trial-payment-submit {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, $orange 0%, $orange2 100%);
  color: #ffffff;
  border: none;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba($orange, 0.4);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba($orange, 0.5);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

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

// Block Handyman Modal Styles
.blockHandymanModal {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: $font-family;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
}

.blockHandymanModal__content {
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

.blockHandymanModal__close {
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

.blockHandymanModal__icon {
  font-size: 64px;
  margin-bottom: 16px;
  line-height: 1;

  @media (max-width: 768px) {
    font-size: 48px;
    margin-bottom: 12px;
  }
}

.blockHandymanModal__title {
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

.blockHandymanModal__message {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 24px 0;
  line-height: 1.6;

  @media (max-width: 768px) {
    font-size: 14px;
    margin-bottom: 20px;
  }
}

.blockHandymanModal__actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
  }
}

.blockHandymanModal__btn {
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

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
}

.blockHandymanModal__btn--confirm {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: #fff;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #dc2626, #ef4444);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
  }
}

.blockHandymanModal__btn--cancel {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.2);

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
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
  display: inline-block;
  text-decoration: none;
  text-align: center;

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

/* Handyman Filters Desktop */
.handyman-filters-desktop {
  display: grid;
  gap: 12px;

  .panel--filter-desktop {
    display: block;
  }
}

/* Import filter styles from JobsSection (need to duplicate since scoped) */
.panel--filter-desktop {
  border-radius: $r;
  border: 1px solid rgba($orange, 0.18);
  background: rgba($orange, 0.08);
  padding: 12px;

  .panel__label {
    font-size: 12px;
    font-weight: 1000;
    color: rgba(255, 255, 255, 0.78);
    margin-bottom: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .link--small {
    font-size: 11px;
    color: $orange3;
    text-decoration: none;
    cursor: pointer;
    font-weight: 900;

    &:hover {
      color: $orange2;
    }
  }
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.radio-group--horizontal {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 12px;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid rgba($orange, 0.2);
  background: rgba(255, 255, 255, 0.04);
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba($orange, 0.3);
  }

  input[type="radio"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: $orange;
  }
}

.radio-item--inline {
  flex: 1;
  min-width: 120px;
}

.radio-label {
  font-size: 14px;
  font-weight: 900;
  color: $text;
  flex: 1;
  cursor: pointer;
  user-select: none;
}

.range-display {
  margin-bottom: 12px;
  text-align: center;
}

.range-value {
  font-size: 16px;
  font-weight: 1000;
  color: $orange2;
  padding: 8px 16px;
  display: inline-block;
  border-radius: 8px;
  background: rgba($orange, 0.1);
  border: 1px solid rgba($orange, 0.2);
}

.range-input {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.1);
  outline: none;
  -webkit-appearance: none;
  appearance: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: $orange;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  }

  &::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: $orange;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  }
}

.price-range--horizontal {
  display: flex;
  flex-direction: row;
  gap: 16px;

  .price-input-group {
    flex: 1;
  }
}

.price-label {
  display: block;
  font-size: 11px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 6px;
}

.price-input {
  width: 100%;
  box-sizing: border-box;
  border-radius: 10px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  padding: 10px 12px;
  font-weight: 900;
  font-size: 14px;

  &::placeholder {
    color: rgba(255, 255, 255, 0.45);
  }

  &:focus {
    outline: none;
    border-color: rgba($orange, 0.45);
    box-shadow: 0 0 0 3px rgba($orange, 0.1);
  }
}

/* Rating Prompt Dashboard */
.rating-prompt-dashboard {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba($orange, 0.3);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  animation: slideIn 0.3s ease;
}

.rating-prompt-dashboard__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.rating-prompt-dashboard__title {
  font-size: 20px;
  font-weight: 1000;
  color: $orange2;
  margin: 0;
  text-align: center;
}

.rating-prompt-dashboard__subtitle {
  font-size: 14px;
  color: $muted;
  margin: 0;
  text-align: center;
}

.rating-prompt-dashboard__button {
  padding: 12px 32px;
  border-radius: 8px;
  border: 1px solid rgba($orange, 0.3);
  background: linear-gradient(135deg, rgba($orange, 0.2), rgba($orange2, 0.15));
  color: $orange2;
  font-size: 16px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: linear-gradient(
      135deg,
      rgba($orange, 0.3),
      rgba($orange2, 0.25)
    );
    border-color: rgba($orange, 0.5);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba($orange, 0.3);
  }
}

/* Rating Card Dashboard */
.rating-card-dashboard {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba($orange, 0.3);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  animation: slideIn 0.3s ease;
}

.rating-card-dashboard__header {
  margin-bottom: 20px;
}

.rating-card-dashboard__title {
  font-size: 20px;
  font-weight: 1000;
  color: $orange2;
  margin: 0 0 8px 0;
}

.rating-card-dashboard__subtitle {
  font-size: 14px;
  color: $muted;
  margin: 0;
}

.rating-card-dashboard__body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.rating-card-dashboard__stars {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-direction: row-reverse;
}

.rating-star {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px;
  color: rgba(255, 255, 255, 0.3);
  font-size: 32px;
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.1);
  }

  &--active,
  &--filled {
    color: #ffd700;
  }
}

.rating-card-dashboard__review {
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: $text;
  font-size: 14px;
  font-family: $font-family;
  resize: vertical;
  min-height: 80px;

  &:focus {
    outline: none;
    border-color: rgba($orange, 0.5);
    background: rgba(255, 255, 255, 0.08);
  }
}

.rating-card-dashboard__actions {
  display: flex;
  justify-content: flex-end;
}

.rating-card-dashboard__submit {
  padding: 12px 24px;
  border-radius: 8px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba($orange, 0.15);
  color: $orange2;
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: rgba($orange, 0.25);
    border-color: rgba($orange, 0.5);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

/* Subscription Required Modal */
.subscription-required-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
  overflow-y: auto;
}

.subscription-required-modal__content {
  background: rgba(11, 11, 15, 0.98);
  border-radius: 20px;
  padding: 32px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid rgba($orange, 0.2);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
}

.subscription-required-modal__header {
  text-align: center;
  margin-bottom: 24px;
}

.subscription-required-modal__title {
  font-size: 24px;
  font-weight: 1000;
  color: $orange2;
  margin: 0 0 8px 0;
}

.subscription-required-modal__subtitle {
  font-size: 14px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  line-height: 1.5;
}

.subscription-required-modal__actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
}

.subscription-payment-toggle {
  margin-bottom: 12px;
  margin-top: 8px;
}

.subscription-payment-toggle__label {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  cursor: pointer;
  padding: 12px 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba($orange, 0.2);
  transition: all 0.2s ease;
}

.subscription-payment-toggle__label:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba($orange, 0.3);
}

.subscription-payment-toggle__text {
  font-size: 14px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.9);
  flex: 1;
}

.subscription-payment-toggle__input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.subscription-payment-toggle__slider {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.subscription-payment-toggle__slider::before {
  content: "";
  position: absolute;
  top: 2px;
  right: 2px;
  width: 20px;
  height: 20px;
  background: #fff;
  border-radius: 50%;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.subscription-payment-toggle__input:checked
  + .subscription-payment-toggle__slider {
  background: linear-gradient(135deg, $orange, $orange2);
}

.subscription-payment-toggle__input:checked
  + .subscription-payment-toggle__slider::before {
  transform: translateX(-24px);
  background: #0b0b0f;
}

.subscription-required-modal__btn {
  width: 100%;
  padding: 14px 20px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 1000;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  font-family: $font-family;
}

/* Test button removed - no longer needed */

.subscription-required-modal__btn--subscribe {
  background: linear-gradient(135deg, $orange, $orange2);
  color: #0b0c10;
  box-shadow: 0 0 20px rgba($orange, 0.3);
}

.subscription-required-modal__btn--subscribe:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba($orange, 0.4);
}

.subscription-required-modal__btn--subscribe:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Reuse subscription plan styles from Payments.vue */
.subscription-plans {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
    gap: 10px;
  }
}

.subscription-plan {
  position: relative;
  padding: 18px;
  border-radius: 14px;
  border: 2px solid rgba($orange, 0.3);
  background: rgba(255, 255, 255, 0.04);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 10px;

  &:hover {
    border-color: rgba($orange, 0.5);
    background: rgba(255, 255, 255, 0.06);
    transform: translateY(-2px);
  }

  &--selected {
    border-color: $orange;
    background: rgba(255, 106, 0, 0.12);
    box-shadow: 0 4px 20px rgba($orange, 0.3);
  }

  &--annual {
    border-color: rgba($orange, 0.4);
    background: linear-gradient(
      135deg,
      rgba(255, 106, 0, 0.15) 0%,
      rgba(255, 138, 43, 0.08) 100%
    );

    &.subscription-plan--selected {
      border-color: $orange2;
      background: linear-gradient(
        135deg,
        rgba(255, 106, 0, 0.2) 0%,
        rgba(255, 138, 43, 0.12) 100%
      );
      box-shadow: 0 6px 24px rgba($orange, 0.4);
    }
  }
}

.subscription-plan__badge {
  position: absolute;
  top: -8px;
  right: 12px;
  padding: 4px 10px;
  border-radius: 12px;
  background: linear-gradient(135deg, $orange, $orange2);
  color: #0b0b0f;
  font-size: 11px;
  font-weight: 1000;
  box-shadow: 0 2px 8px rgba($orange, 0.4);
  z-index: 1;
}

.subscription-plan__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.subscription-plan__icon {
  font-size: 20px;
}

.subscription-plan__title {
  font-size: 16px;
  font-weight: 1000;
  color: $orange2;
}

.subscription-plan__price-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin: 4px 0;
}

.subscription-plan__price-old {
  display: flex;
  align-items: baseline;
  gap: 2px;
  position: relative;
}

.subscription-plan__price-old-amount {
  font-size: 18px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.5);
  text-decoration: line-through;
  text-decoration-thickness: 2px;
  text-decoration-color: rgba(255, 255, 255, 0.6);
}

.subscription-plan__price-old-currency {
  font-size: 14px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.5);
  text-decoration: line-through;
  text-decoration-thickness: 2px;
  text-decoration-color: rgba(255, 255, 255, 0.6);
}

.subscription-plan__price {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.subscription-plan__price-amount {
  font-size: 28px;
  font-weight: 1000;
  color: $text;
  line-height: 1;
}

.subscription-plan__price-currency {
  font-size: 20px;
  font-weight: 900;
  color: $orange2;
}

.subscription-plan__price-period {
  font-size: 13px;
  font-weight: 700;
  color: $muted;
  margin-right: 2px;
}

.subscription-plan__warning {
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  font-size: 11px;
  font-weight: 700;
  color: #ef4444;
  text-align: center;
  margin-top: 4px;
  line-height: 1.4;
}

.subscription-plan__monthly-note,
.subscription-plan__cancel-note {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  line-height: 1.4;
}

.subscription-plan__cancel-note {
  margin-top: 4px;
  color: rgba(255, 255, 255, 0.6);
}

.trial-notice {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 18px;
  margin-bottom: 16px;
  border-radius: 12px;
  background: linear-gradient(
    135deg,
    rgba(76, 175, 80, 0.15),
    rgba(139, 195, 74, 0.1)
  );
  border: 2px solid rgba(76, 175, 80, 0.4);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
}

.trial-notice__icon {
  font-size: 28px;
  flex-shrink: 0;
}

.trial-notice__content {
  flex: 1;
}

.trial-notice__title {
  font-size: 18px;
  font-weight: 1000;
  color: #4caf50;
  margin-bottom: 6px;
  text-shadow: 0 2px 4px rgba(76, 175, 80, 0.3);
}

.trial-notice__text {
  font-size: 14px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
}

/* Subscription Payment Form */
.subscription-payment-form {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid rgba($orange, 0.2);
}

.subscription-payment-form__amount {
  margin-bottom: 20px;
}

.subscription-payment-form__label {
  font-size: 13px;
  font-weight: 900;
  color: $text;
  margin-bottom: 6px;
  display: block;
}

.subscription-payment-form__amount-display {
  padding: 14px 16px;
  border-radius: 10px;
  background: rgba($orange, 0.15);
  border: 1px solid rgba($orange, 0.3);
  font-size: 22px;
  font-weight: 1000;
  color: $orange2;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.subscription-payment-form__period {
  font-size: 14px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.7);
}

.subscription-payment-form__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 18px;
}

.subscription-payment-form__stripe-element {
  padding: 12px 14px;

  /* Hide Stripe test/developer buttons and iframes */
  button[data-testid*="test"],
  button[aria-label*="test"],
  button[aria-label*="Test"],
  a[href*="test"],
  a[href*="Test"],
  [class*="test"],
  [class*="Test"],
  [id*="test"],
  [id*="Test"],
  iframe[name*="__privateStripeFrame"],
  iframe[name*="privateStripeFrame"],
  iframe[src*="stripe.com"][src*="elements-inner"],
  iframe[title*="מסגרת כלים למפתחי פס"],
  iframe[title*="Stripe developer tools frame"] {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    pointer-events: none !important;
    width: 0 !important;
    height: 0 !important;
  }
  border-radius: 10px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba(255, 255, 255, 0.06);
  transition: all 0.2s ease;
  min-height: 60px;
  position: relative;
}

.subscription-payment-form__stripe-element--loading {
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.subscription-payment-form__stripe-element:focus-within {
  border-color: $orange;
  box-shadow: 0 0 0 3px rgba($orange, 0.2);
  background: rgba(255, 255, 255, 0.08);
}

.subscription-payment-form__loading {
  padding: 24px;
  border-radius: 10px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 120px;
}

.subscription-payment-form__loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba($orange, 0.2);
  border-top-color: $orange;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.subscription-payment-form__loading-text {
  font-size: 14px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
}

.subscription-payment-form__error {
  font-size: 11px;
  font-weight: 700;
  color: #ef4444;
  min-height: 16px;
  line-height: 1.4;
}

.subscription-payment-form__error--submit {
  text-align: center;
  padding: 10px 12px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  margin-top: 4px;
}

.subscription-payment-form__security {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  margin-bottom: 18px;
}

.subscription-payment-form__security-icon {
  font-size: 16px;
  flex-shrink: 0;
  margin-top: 1px;
}

.subscription-payment-form__security-text {
  font-size: 12px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.5;
}

/* ============================================
   NEW HANDYMAN DASHBOARD DESIGN
   ============================================ */

/* Handyman Header New */
.handyman-header-new {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 32px;
  padding: 0 20px;
  position: relative;
  z-index: 10;
}

.handyman-header-new__left {
  display: flex;
  align-items: center;
  gap: 16px;
  text-align: right;
}

.handyman-header-new__avatar-glow {
  position: absolute;
  inset: -2px;
  background: linear-gradient(to bottom right, #FF5F00, transparent);
  border-radius: 50%;
  opacity: 0.7;
  filter: blur(4px);
  transition: opacity 0.3s;
}

.handyman-header-new__left:hover .handyman-header-new__avatar-glow {
  opacity: 1;
}

.handyman-header-new__avatar {
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 2px solid #000;
  object-fit: cover;
  z-index: 1;
}

.handyman-header-new__avatar-placeholder {
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 2px solid #000;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  z-index: 1;
}

.handyman-header-new__status-dot {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 16px;
  height: 16px;
  background: #00E055;
  border: 2px solid #000;
  border-radius: 50%;
  z-index: 2;
}

.handyman-header-new__info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.handyman-header-new__greeting {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 2px;
}

.handyman-header-new__name {
  font-size: 20px;
  font-weight: 900;
  line-height: 1;
  color: #fff;
  letter-spacing: -0.02em;
  margin-bottom: 8px;
}

.handyman-header-new__availability {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(9, 9, 11, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 9999px;
  padding-left: 12px;
  padding-right: 4px;
  padding-top: 4px;
  padding-bottom: 4px;
  backdrop-filter: blur(12px);
  transition: all 0.3s;
  cursor: pointer;
}

.handyman-header-new__availability:hover {
  border-color: rgba(0, 224, 85, 0.3);
}

.handyman-header-new__availability-toggle {
  position: relative;
  width: 32px;
  height: 16px;
  background: rgba(0, 224, 85, 0.2);
  border-radius: 9999px;
  transition: background 0.3s;
}

.handyman-header-new__availability-dot {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 12px;
  height: 12px;
  background: #00E055;
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(0, 224, 85, 0.8);
  transition: transform 0.3s;
}

.handyman-header-new__availability-dot--active {
  transform: translateX(16px);
}

.handyman-header-new__availability-text {
  font-size: 10px;
  font-weight: 700;
  color: #00E055;
  transition: color 0.3s;
}

.handyman-header-new__availability:hover .handyman-header-new__availability-text {
  color: #fff;
}

.handyman-header-new__actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
}

.handyman-header-new__action-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #09090B;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.4);
  transition: all 0.3s;
  cursor: pointer;
  font-size: 20px;
}

.handyman-header-new__action-btn:hover {
  border-color: rgba(255, 95, 0, 0.5);
  color: #FF5F00;
  transform: scale(1.1);
}

.handyman-header-new__action-btn--notifications {
  position: relative;
}

.handyman-header-new__notification-dot {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 6px;
  height: 6px;
  background: #FF5F00;
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(255, 95, 0, 0.8);
}

/* Handyman Dashboard New */
.handyman-dashboard-new {
  position: relative;
  z-index: 10;
  max-width: 100%;
  margin: 0 auto;
  padding: 0 20px;
  padding-top: 0;
  padding-bottom: 32px;
}

.handyman-dashboard-new__section {
  margin-bottom: 32px;
}

.handyman-dashboard-new__section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.handyman-dashboard-new__section-title {
  font-size: 20px;
  font-weight: 900;
  color: #fff;
  letter-spacing: -0.02em;
  display: flex;
  align-items: center;
  gap: 8px;
}

.handyman-dashboard-new__title-accent {
  width: 6px;
  height: 20px;
  background: #FF5F00;
  border-radius: 9999px;
  box-shadow: 0 0 10px rgba(255, 95, 0, 0.8);
}

.handyman-dashboard-new__urgent-pulse {
  position: relative;
  display: flex;
  height: 12px;
  width: 12px;
}

.handyman-dashboard-new__urgent-pulse-inner {
  position: absolute;
  inline-size: 100%;
  block-size: 100%;
  border-radius: 50%;
  background: #FF2A2A;
  box-shadow: 0 0 10px rgba(255, 42, 42, 0.6);
  animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
}

.handyman-dashboard-new__urgent-pulse-outer {
  position: absolute;
  inline-size: 100%;
  block-size: 100%;
  border-radius: 50%;
  background: #FF2A2A;
  opacity: 0.75;
  animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
}

@keyframes ping {
  75%, 100% {
    transform: scale(2);
    opacity: 0;
  }
}

.handyman-dashboard-new__filter-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #09090B;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  transition: all 0.3s;
  cursor: pointer;
}

.handyman-dashboard-new__filter-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 95, 0, 0.4);
  color: #fff;
}

.handyman-dashboard-new__section-title-small {
  font-size: 18px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.4);
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.handyman-dashboard-new__jobs-count {
  font-size: 12px;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.3);
  padding: 2px 8px;
  border-radius: 9999px;
}

/* Urgent Card */
.handyman-dashboard-new__urgent-card {
  position: relative;
  border-radius: 24px;
  background: linear-gradient(145deg, rgba(40, 5, 5, 0.95) 0%, rgba(10, 0, 0, 0.95) 100%);
  overflow: hidden;
  transition: all 0.3s;
  transform: scale(1);
  box-shadow: 0 0 30px -5px rgba(255, 42, 42, 0.2);
}

.handyman-dashboard-new__urgent-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 24px;
  padding: 1px;
  background: linear-gradient(to bottom right, rgba(255, 42, 42, 0.8), rgba(255, 42, 42, 0.1), rgba(0, 0, 0, 0.05));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.handyman-dashboard-new__urgent-card:hover {
  box-shadow: 0 0 30px -5px rgba(255, 42, 42, 0.2);
  transform: scale(1.01);
}

.handyman-dashboard-new__urgent-card-content {
  padding: 20px;
  position: relative;
  z-index: 10;
}

.handyman-dashboard-new__urgent-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.handyman-dashboard-new__urgent-client-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.handyman-dashboard-new__urgent-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  padding: 2px;
  border: 1px solid rgba(255, 0, 0, 0.3);
}

.handyman-dashboard-new__urgent-avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  filter: grayscale(100%);
  opacity: 0.8;
}

.handyman-dashboard-new__urgent-title {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
  margin-bottom: 4px;
}

.handyman-dashboard-new__urgent-subtitle {
  font-size: 12px;
  color: rgba(255, 68, 68, 0.8);
  font-weight: 500;
  margin-top: 2px;
}

.handyman-dashboard-new__urgent-badge {
  background: rgba(255, 0, 0, 0.1);
  border: 1px solid rgba(255, 0, 0, 0.2);
  color: #FF2A2A;
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.handyman-dashboard-new__urgent-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 20px;
  background: rgba(0, 0, 0, 0.2);
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.handyman-dashboard-new__urgent-meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.handyman-dashboard-new__urgent-meta-separator {
  width: 1px;
  height: 12px;
  background: rgba(255, 255, 255, 0.1);
}

.handyman-dashboard-new__urgent-actions {
  display: flex;
  gap: 12px;
}

.handyman-dashboard-new__urgent-btn {
  flex: 1;
  height: 44px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #09090B;
  color: rgba(255, 255, 255, 0.4);
}

.handyman-dashboard-new__urgent-btn--reject:hover {
  border-color: rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
}

.handyman-dashboard-new__urgent-btn--accept {
  flex: 2;
  background: #FF2A2A;
  color: #fff;
  border: none;
  font-weight: 900;
  box-shadow: 0 0 12px rgba(255, 42, 42, 0.4), 0 0 4px rgba(255, 42, 42, 0.2);
}

.handyman-dashboard-new__urgent-btn--accept:hover {
  background: #ff4444;
}

/* Quoted Jobs */
.handyman-dashboard-new__quoted-jobs {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.handyman-dashboard-new__quoted-card {
  position: relative;
  border-radius: 16px;
  background: #050505;
  overflow: hidden;
  transition: all 0.3s;
}

.handyman-dashboard-new__quoted-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 16px;
  padding: 1px;
  background: linear-gradient(to bottom right, rgba(255, 95, 0, 0.6), rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.handyman-dashboard-new__quoted-card:hover {
  box-shadow: 0 0 30px -10px rgba(255, 95, 0, 0.15);
}

.handyman-dashboard-new__quoted-card:hover::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(255, 95, 0, 0.05);
  opacity: 1;
  transition: opacity 0.5s;
  pointer-events: none;
}

.handyman-dashboard-new__quoted-card::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(255, 95, 0, 0.05);
  opacity: 0;
  transition: opacity 0.5s;
  pointer-events: none;
}

.handyman-dashboard-new__quoted-card-content {
  padding: 16px;
  position: relative;
  z-index: 10;
}

.handyman-dashboard-new__quoted-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.handyman-dashboard-new__quoted-title {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 8px;
}

.handyman-dashboard-new__quoted-categories {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.handyman-dashboard-new__quoted-category-tag {
  font-size: 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.4);
  padding: 2px 8px;
  border-radius: 4px;
}

.handyman-dashboard-new__quoted-budget {
  text-align: right;
}

.handyman-dashboard-new__quoted-budget-label {
  display: block;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 4px;
}

.handyman-dashboard-new__quoted-budget-value {
  display: block;
  font-size: 18px;
  font-weight: 900;
  color: #FF5F00;
}

.handyman-dashboard-new__quoted-client {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.3);
  margin-bottom: 12px;
}

.handyman-dashboard-new__quoted-client-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
  filter: grayscale(100%);
  opacity: 0.7;
}

.handyman-dashboard-new__quoted-client-name {
  color: rgba(255, 255, 255, 0.6);
}

.handyman-dashboard-new__quoted-client-separator {
  color: rgba(255, 255, 255, 0.2);
}

.handyman-dashboard-new__quoted-btn {
  width: 100%;
  background: rgba(255, 95, 0, 0.1);
  color: #FF5F00;
  border: 1px solid rgba(255, 95, 0, 0.2);
  padding: 10px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s;
  cursor: pointer;
}

.handyman-dashboard-new__quoted-btn:hover {
  background: #FF5F00;
  color: #000;
  border-color: #FF5F00;
}

/* Regular Jobs */
.handyman-dashboard-new__regular-jobs {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.handyman-dashboard-new__regular-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-radius: 16px;
  background: #09090B;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s;
  cursor: pointer;
}

.handyman-dashboard-new__regular-card:hover {
  border-color: rgba(255, 255, 255, 0.1);
}

.handyman-dashboard-new__regular-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.4);
  font-size: 20px;
}

.handyman-dashboard-new__regular-content {
  display: flex;
  align-items: center;
  gap: 16px;
  text-align: right;
  flex: 1;
}

.handyman-dashboard-new__regular-title {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 4px;
}

.handyman-dashboard-new__regular-meta {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.3);
}

.handyman-dashboard-new__regular-arrow {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.4);
  transition: all 0.3s;
  cursor: pointer;
  border: none;
  font-size: 16px;
}

.handyman-dashboard-new__regular-arrow:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

/* Handyman Bottom Navigation New */
.handyman-bottom-nav-new {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(24px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 24px;
  padding-top: 16px;
  z-index: 50;
}

.handyman-bottom-nav-new__container {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  max-width: 100%;
  margin: 0 auto;
  padding: 0 8px;
}

.handyman-bottom-nav-new__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.5);
  transition: color 0.3s;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-size: 24px;
}

.handyman-bottom-nav-new__item:hover {
  color: #fff;
}

.handyman-bottom-nav-new__item--home {
  margin-top: -32px;
}

.handyman-bottom-nav-new__icon-wrapper {
  position: relative;
}

.handyman-bottom-nav-new__badge {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 8px;
  height: 8px;
  background: #FF5F00;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.handyman-bottom-nav-new__home-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #FF5F00;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000;
  box-shadow: 0 0 20px rgba(255, 95, 0, 0.6);
  border: 4px solid #000;
  transition: all 0.3s;
  font-size: 24px;
}

.handyman-bottom-nav-new__item--home:hover .handyman-bottom-nav-new__home-icon {
  transform: scale(1.1);
  box-shadow: 0 0 30px rgba(255, 95, 0, 0.8);
}

.handyman-bottom-nav-new__label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.handyman-bottom-nav-new__label--home {
  color: #FF5F00;
  margin-top: 8px;
  text-shadow: 0 0 8px rgba(255, 95, 0, 0.5);
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .handyman-dashboard-new {
    padding-left: 20px;
    padding-right: 20px;
  }
  
  .handyman-header-new {
    padding-left: 20px;
    padding-right: 20px;
  }
}

/* ============================================
   NEW CLIENT DASHBOARD DESIGN
   ============================================ */

/* Client Header New */
.client-header-new {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
  padding: 16px 20px;
  position: relative;
  z-index: 10;
  background: #000 !important;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.client-header-new__left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.client-header-new__avatar-wrapper {
  position: relative;
}

.client-header-new__avatar-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 95, 0, 0.4) 0%, transparent 70%);
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    opacity: 0.6;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.1);
  }
}

.client-header-new__avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 95, 0, 0.3);
  position: relative;
  z-index: 1;
}

.client-header-new__avatar-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  border: 2px solid rgba(255, 95, 0, 0.3);
  position: relative;
  z-index: 1;
}

.client-header-new__info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.client-header-new__badge {
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #FF5F00;
  background: rgba(255, 95, 0, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid rgba(255, 95, 0, 0.3);
  display: inline-block;
  width: fit-content;
}

.client-header-new__name {
  font-size: 18px;
  font-weight: 900;
  color: #fff;
  margin: 0;
  line-height: 1.2;
}

.client-header-new__actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
}

.client-header-new__action-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #09090B;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.4);
  transition: all 0.3s;
  cursor: pointer;
  font-size: 20px;
}

.client-header-new__action-btn:hover {
  border-color: rgba(255, 95, 0, 0.5);
  color: #FF5F00;
  transform: scale(1.1);
}

.client-header-new__action-btn--notifications {
  position: relative;
}

.client-header-new__notification-dot {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 6px;
  height: 6px;
  background: #FF5F00;
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(255, 95, 0, 0.8);
}

/* Client Dashboard New */
.client-dashboard-new {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 0;
  padding-top: 0;
  padding-bottom: 100px;
  direction: rtl;
  text-align: right;
}

.client-dashboard-new__section {
  margin-bottom: 32px;
  padding: 0 20px;
  direction: rtl;
  text-align: right;
  width: 100%;
  box-sizing: border-box;
}

.client-dashboard-new__section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  width: 100%;
  direction: rtl;
}

.client-dashboard-new__section-title {
  font-size: 20px;
  font-weight: 900;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  direction: rtl;
}

.client-dashboard-new__title-accent {
  width: 4px;
  height: 20px;
  background: linear-gradient(180deg, #FF5F00 0%, #FF8F00 100%);
  border-radius: 2px;
}

.client-dashboard-new__section-title-small {
  font-size: 16px;
  font-weight: 900;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px 0;
  direction: rtl;
}

.client-dashboard-new__title-accent-small {
  width: 3px;
  height: 16px;
  background: linear-gradient(180deg, #FF5F00 0%, #FF8F00 100%);
  border-radius: 2px;
}

.client-dashboard-new__filter-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
}

.client-dashboard-new__filter-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 95, 0, 0.3);
  color: #FF5F00;
}

.client-dashboard-new__filter-btn i {
  font-size: 14px;
}

/* Handymen Carousel */
.client-dashboard-new__carousel {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding: 8px 0;
  direction: rtl;
  text-align: right;
  width: calc(100% + 40px);
  margin-right: -20px;
  margin-left: -20px;
  padding-right: 20px;
  padding-left: 20px;
}

.client-dashboard-new__carousel::-webkit-scrollbar {
  display: none;
}

.client-dashboard-new__card {
  flex: 0 0 calc(100% - 24px);
  min-width: calc(100% - 24px);
  max-width: calc(100% - 24px);
  scroll-snap-align: start;
  background: #09090B;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 20px;
  transition: all 0.3s;
  direction: rtl;
  text-align: right;
  box-sizing: border-box;
}

.client-dashboard-new__card--blocked {
  opacity: 0.5;
  filter: grayscale(100%);
}

.client-dashboard-new__card-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.client-dashboard-new__card-top {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.client-dashboard-new__card-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.client-dashboard-new__avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}

.client-dashboard-new__avatar-border {
  position: relative;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  padding: 3px;
  background: rgba(255, 255, 255, 0.05);
  transition: all 0.3s;
}

.client-dashboard-new__avatar-border--pro {
  background: linear-gradient(135deg, #FF5F00 0%, #FF8F00 100%);
  box-shadow: 0 0 20px rgba(255, 95, 0, 0.4);
}

.client-dashboard-new__avatar-border--hover:hover {
  background: rgba(255, 95, 0, 0.2);
}

.client-dashboard-new__avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #09090B;
}

.client-dashboard-new__avatar-img--grayscale {
  filter: grayscale(100%);
  opacity: 0.7;
}

.client-dashboard-new__avatar-img--sepia {
  filter: sepia(100%);
  opacity: 0.8;
}

.client-dashboard-new__rating-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  display: flex;
  align-items: center;
  gap: 2px;
  background: #09090B;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 4px 8px;
  z-index: 2;
}

.client-dashboard-new__rating-value {
  font-size: 11px;
  font-weight: 900;
  color: #FFD700;
}

.client-dashboard-new__rating-star {
  font-size: 12px;
  color: #FFD700;
}

.client-dashboard-new__card-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.client-dashboard-new__card-name {
  font-size: 18px;
  font-weight: 900;
  color: #fff;
  margin: 0;
  line-height: 1.2;
}

.client-dashboard-new__card-location {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.client-dashboard-new__card-location i {
  font-size: 14px;
  color: rgba(255, 95, 0, 0.6);
}

.client-dashboard-new__location-separator {
  margin: 0 4px;
  color: rgba(255, 255, 255, 0.3);
}

.client-dashboard-new__card-status {
  display: flex;
  align-items: center;
  gap: 6px;
}

.client-dashboard-new__status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #00E055;
  box-shadow: 0 0 8px rgba(0, 224, 85, 0.6);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}

.client-dashboard-new__status-text {
  font-size: 11px;
  font-weight: 700;
  color: #00E055;
}

.client-dashboard-new__card-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  color: #000;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 900;
  width: fit-content;
  margin-top: 4px;
}

.client-dashboard-new__card-badge i {
  font-size: 12px;
}

.client-dashboard-new__details-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  flex-shrink: 0;
}

.client-dashboard-new__details-btn:hover {
  background: rgba(255, 95, 0, 0.1);
  border-color: rgba(255, 95, 0, 0.3);
  color: #FF5F00;
}

.client-dashboard-new__details-btn i {
  font-size: 14px;
}

.client-dashboard-new__card-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.client-dashboard-new__category-tag {
  padding: 4px 10px;
  background: rgba(255, 95, 0, 0.1);
  border: 1px solid rgba(255, 95, 0, 0.2);
  border-radius: 8px;
  font-size: 10px;
  font-weight: 700;
  color: #FF5F00;
}

.client-dashboard-new__card-actions {
  display: flex;
  gap: 12px;
  margin-top: auto;
}

.client-dashboard-new__action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
}

.client-dashboard-new__action-btn--block {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.client-dashboard-new__action-btn--block:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.client-dashboard-new__action-btn--primary {
  flex: 2;
  background: linear-gradient(135deg, #FF5F00 0%, #FF8F00 100%);
  color: #000;
  box-shadow: 0 4px 12px rgba(255, 95, 0, 0.3);
}

.client-dashboard-new__action-btn--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(255, 95, 0, 0.4);
}

.client-dashboard-new__action-btn i {
  font-size: 16px;
}

/* Carousel Pagination */
.client-dashboard-new__pagination {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  direction: rtl;
}

.client-dashboard-new__pagination-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  transition: all 0.3s;
  cursor: pointer;
}

.client-dashboard-new__pagination-dot--active {
  width: 24px;
  border-radius: 4px;
  background: #FF5F00;
  box-shadow: 0 0 8px rgba(255, 95, 0, 0.6);
}

/* Recent Activity */
.client-dashboard-new__activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  direction: rtl;
  align-items: stretch;
  width: 100%;
}

.client-dashboard-new__activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #09090B;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  transition: all 0.3s;
  cursor: pointer;
  direction: rtl;
  text-align: right;
}

.client-dashboard-new__activity-item:hover {
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);
}

.client-dashboard-new__activity-item--active {
  border-color: rgba(255, 95, 0, 0.3);
  background: rgba(255, 95, 0, 0.05);
}

.client-dashboard-new__activity-item--success {
  border-color: rgba(0, 224, 85, 0.3);
  background: rgba(0, 224, 85, 0.05);
}

.client-dashboard-new__activity-item--primary {
  border-color: rgba(255, 95, 0, 0.3);
  background: rgba(255, 95, 0, 0.05);
}

.client-dashboard-new__activity-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  flex-shrink: 0;
}

.client-dashboard-new__activity-status-text {
  font-size: 10px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.6);
}

.client-dashboard-new__activity-status i {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

.client-dashboard-new__activity-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: right;
  direction: rtl;
}

.client-dashboard-new__activity-title {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  margin: 0;
  line-height: 1.3;
}

.client-dashboard-new__activity-time {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  margin: 0;
}

.client-dashboard-new__activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(255, 95, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FF5F00;
  font-size: 20px;
  flex-shrink: 0;
}

/* Client Bottom Navigation New */
.client-bottom-nav-new {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(24px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 24px;
  padding-top: 16px;
  z-index: 50;
}

.client-bottom-nav-new__container {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  max-width: 100%;
  margin: 0 auto;
  padding: 0 8px;
}

.client-bottom-nav-new__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.5);
  transition: color 0.3s;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-size: 24px;
}

.client-bottom-nav-new__item:hover {
  color: #fff;
}

.client-bottom-nav-new__item--home {
  margin-top: -32px;
}

.client-bottom-nav-new__icon-wrapper {
  position: relative;
}

.client-bottom-nav-new__badge {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 8px;
  height: 8px;
  background: #FF5F00;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.client-bottom-nav-new__home-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #FF5F00;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000;
  box-shadow: 0 0 20px rgba(255, 95, 0, 0.6);
  border: 4px solid #000;
  transition: all 0.3s;
  font-size: 24px;
}

.client-bottom-nav-new__item--home:hover .client-bottom-nav-new__home-icon {
  transform: scale(1.1);
  box-shadow: 0 0 30px rgba(255, 95, 0, 0.8);
}

.client-bottom-nav-new__label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.client-bottom-nav-new__label--home {
  color: #FF5F00;
  margin-top: 8px;
  text-shadow: 0 0 8px rgba(255, 95, 0, 0.5);
}

/* Responsive adjustments for client */
@media (max-width: 640px) {
  .client-dashboard-new {
    padding-left: 20px;
    padding-right: 20px;
  }
  
  .client-header-new {
    padding-left: 20px;
    padding-right: 20px;
  }
}
</style>
