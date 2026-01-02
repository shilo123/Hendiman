<template>
  <section class="lux" dir="rtl">
    <!-- Top bar -->
    <header class="luxTop">
      <div class="luxTop__left">
        <div class="luxTop__title">צ'אט עבודה</div>
        <div class="luxTop__meta">
          <span class="luxTop__name">{{
            isHandyman ? clientName : getHandymanName()
          }}</span>
          <span class="luxTop__sep">•</span>
          <span class="luxTop__sub">{{ getJobDisplayName() || "עבודה" }}</span>
        </div>
      </div>

      <div class="luxTop__right">
        <span class="statusPill" :class="'statusPill--' + chipTone">
          <span class="statusPill__dot"></span>
          {{ statusLabel }}
        </span>

        <!-- Navigation buttons for handyman -->
        <div v-if="isHandyman" class="luxTop__nav">
          <!-- View Images Button -->
          <button
            v-if="hasJobImages"
            class="navBtn navBtn--images"
            type="button"
            @click="showImageGallery = true"
            title="עיון בתמונות"
            aria-label="עיון בתמונות"
          >
            <span class="navBtn__text">עיון בתמונות</span>
            <span class="navBtn__icon">📷</span>
          </button>
          <!-- Navigation to job location -->
          <template v-if="jobLocation">
            <a
              :href="getWazeUrl(jobLocation)"
              target="_blank"
              rel="noopener noreferrer"
              class="navBtn navBtn--waze"
              title="נווט בווייז"
              aria-label="נווט בווייז"
            >
              <span class="navBtn__text">לניווט בוויז</span>
              <span class="navBtn__icon">📍</span>
            </a>
            <a
              :href="getGoogleMapsUrl(jobLocation)"
              target="_blank"
              rel="noopener noreferrer"
              class="navBtn navBtn--google"
              title="נווט בגוגל מפות"
              aria-label="נווט בגוגל מפות"
            >
              <span class="navBtn__text">לניווט בגוגל</span>
              <span class="navBtn__icon">🗺️</span>
            </a>
          </template>
        </div>

        <!-- Cancel job button (for both handyman and client) -->
        <button
          class="cancelJobBtn"
          type="button"
          @click="openCancelJob"
          aria-label="ביטול עבודה"
          title="בטל עבודה"
        >
          בטל עבודה
        </button>

        <button
          class="iconBtn iconBtn--minimize"
          type="button"
          @click="$emit('minimize')"
          aria-label="מזער"
          title="מזער"
        >
          ➖
        </button>
      </div>
    </header>

    <!-- Layout -->
    <div class="luxGrid">
      <!-- Side card -->
      <aside class="sideCard">
        <div class="sideCard__hero">
          <div class="sideCard__badge">קריאה</div>
          <div class="sideCard__headline">
            {{ getJobDisplayName() || "עבודה" }}
          </div>
          <div class="sideCard__desc">
            סטטוס: <b>{{ statusLabel }}</b>
          </div>
        </div>

        <div class="sideCard__body">
          <div class="infoRow">
            <div class="infoRow__k">לקוח</div>
            <div class="infoRow__v">{{ clientName }}</div>
          </div>
          <div class="infoRow">
            <div class="infoRow__k">הנדימן</div>
            <div class="infoRow__v">{{ handymanName }}</div>
          </div>
          <div class="infoRow" v-if="jobInfo?.price">
            <div class="infoRow__k">מחיר</div>
            <div class="infoRow__v">
              <span class="money">{{ jobInfo.price }}</span>
            </div>
          </div>

          <!-- Stripe Onboarding Button (for handyman) -->
          <div v-if="isHandyman && needsOnboarding" class="onboardingCard">
            <div class="onboardingCard__content">
              <div class="onboardingCard__icon">💳</div>
              <div class="onboardingCard__title">הגדר חשבון תשלומים</div>
              <div class="onboardingCard__message">
                כדי לקבל תשלומים, עליך להשלים את הגדרת חשבון התשלומים ב-Stripe
              </div>
              <button
                class="onboardingCard__btn"
                type="button"
                @click="handleOpenOnboarding"
                :disabled="isLoadingOnboarding"
              >
                {{ isLoadingOnboarding ? "טוען..." : "הגדר תשלומים" }}
              </button>
            </div>
          </div>

          <!-- Stripe Onboarding Button (for handyman) -->
          <div v-if="isHandyman && needsOnboarding" class="onboardingCard">
            <div class="onboardingCard__content">
              <div class="onboardingCard__icon">💳</div>
              <div class="onboardingCard__title">הגדר חשבון תשלומים</div>
              <div class="onboardingCard__message">
                כדי לקבל תשלומים, עליך להשלים את הגדרת חשבון התשלומים ב-Stripe
              </div>
              <button
                class="onboardingCard__btn"
                type="button"
                @click="handleOpenOnboarding"
                :disabled="isLoadingOnboarding || !onboardingUrl"
              >
                {{ isLoadingOnboarding ? "טוען..." : "הגדר תשלומים" }}
              </button>
            </div>
          </div>

          <div class="divider"></div>

          <!-- Step timeline (different style) -->
          <div class="timeline">
            <div
              v-for="(step, i) in jobSteps"
              :key="step.status"
              class="tlItem"
              :class="{
                'is-active': step.status === jobStatus,
                'is-done': isStepCompleted(step.status),
              }"
            >
              <div class="tlItem__rail">
                <div class="tlItem__node">
                  <span v-if="isStepCompleted(step.status)">✓</span>
                  <span v-else>{{ i + 1 }}</span>
                </div>
                <div
                  v-if="i !== jobSteps.length - 1"
                  class="tlItem__line"
                ></div>
              </div>
              <div class="tlItem__txt">
                <div class="tlItem__label">{{ step.label }}</div>
                <div class="tlItem__hint">{{ stepHint(step.status) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Handyman status control (segmented) -->
        <div v-if="isHandyman && showStatusButtons" class="segWrap">
          <div class="seg">
            <button
              class="seg__btn"
              :class="{ 'is-on': jobStatus === 'assigned' }"
              type="button"
              @click="updateStatus('on_the_way')"
              v-if="jobStatus === 'assigned'"
            >
              🚗 בדרך
            </button>

            <button
              class="seg__btn"
              :class="{ 'is-on': jobStatus === 'on_the_way' }"
              type="button"
              @click="updateStatus('in_progress')"
              v-if="jobStatus === 'on_the_way'"
            >
              📍 הגעתי
            </button>

            <button
              class="seg__btn"
              :class="{ 'is-on': jobStatus === 'in_progress' }"
              type="button"
              @click="updateStatus('done')"
              v-if="jobStatus === 'in_progress'"
            >
              ✅ סיימתי
            </button>
          </div>
          <div class="segTip">עדכון סטטוס שולח התראה ללקוח</div>
        </div>

        <!-- Price change button (for handyman) -->
        <div
          v-if="
            isHandyman &&
            (jobStatus === 'assigned' ||
              jobStatus === 'on_the_way' ||
              jobStatus === 'in_progress')
          "
          class="segWrap"
        >
          <button
            class="seg__btn seg__btn--full seg__btn--price"
            type="button"
            @click="showPriceChangeModal = true"
          >
            💰 העלאה/הורדה במחיר
          </button>
          <div class="segTip">ניתן לשנות את המחיר עד 20%</div>
        </div>

        <!-- Client location button -->
        <div v-if="!isHandyman && showStatusButtons" class="segWrap">
          <button
            class="seg__btn seg__btn--full"
            type="button"
            @click="sendLocation"
          >
            📍 שלח מיקום
          </button>
          <div class="segTip">שליחת המיקום שלך להנדימן</div>
        </div>
      </aside>

      <!-- Chat panel -->
      <main class="chatPanel">
        <!-- Approval button (for client when job is done but not approved) -->
        <div
          v-if="
            !isHandyman &&
            jobStatus === 'done' &&
            !(jobInfo?.clientApproved || job?.clientApproved)
          "
          class="approvalCard"
        >
          <div class="approvalCard__content">
            <div class="approvalCard__icon">✅</div>
            <div class="approvalCard__title">ההנדימן סיים את העבודה</div>
            <div class="approvalCard__message">
              אנא אשר שהעבודה הושלמה בהצלחה כדי לשחרר את התשלום
            </div>
            <button
              class="approvalCard__btn"
              type="button"
              @click="handleApproveJob"
              :disabled="isApproving"
            >
              {{ isApproving ? "מאשר..." : "אשר סיום עבודה ושחרר תשלום" }}
            </button>
          </div>
        </div>

        <!-- Messages -->
        <div class="msgs" ref="messagesContainer">
          <div v-if="!messages.length" class="empty">
            עדיין אין הודעות. תתחילו 🙂
          </div>

          <div
            v-for="(m, i) in messages"
            :key="i"
            class="msgRow"
            :class="{
              'is-me': m.sender === 'me',
              'is-other': m.sender === 'other',
            }"
          >
            <div
              class="bubble"
              :class="{
                'bubble--img': !!m.image,
                'bubble--location': !!m.location,
              }"
            >
              <button
                v-if="m.image"
                type="button"
                class="bubble__imgBtn"
                @click="openImage(m.image)"
              >
                <img :src="m.image" class="bubble__img" alt="תמונה" />
              </button>

              <div v-if="m.location" class="bubble__location">
                <button
                  type="button"
                  class="bubble__locationPreview"
                  @click.stop="openLocationModal(m.location)"
                >
                  <img
                    :src="getLocationMapImage(m.location)"
                    alt="מיקום"
                    class="bubble__locationMap"
                    @error="onMapImageError"
                  />
                  <div class="bubble__locationOverlay">
                    <span class="bubble__locationIcon">📍</span>
                    <span class="bubble__locationText">מיקום שלי</span>
                  </div>
                </button>
              </div>

              <div v-if="m.text" class="bubble__text">{{ m.text }}</div>

              <div class="bubble__meta">
                <span class="bubble__time">{{ m.time }}</span>
                <span v-if="m.sender === 'me'" class="bubble__tick">✓✓</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Composer (WhatsApp-ish but premium) -->
        <div class="composer">
          <button
            class="pillBtn"
            type="button"
            @click="toggleTools"
            aria-label="כלים"
          >
            <span class="pillBtn__plus">＋</span>
          </button>

          <div v-if="showTools" class="tools" @click.self="showTools = false">
            <button class="tool" type="button" @click="triggerFile">
              <span class="tool__ic">📷</span>
              <span class="tool__t">תמונה</span>
            </button>
            <button class="tool" type="button" @click="sendLocation">
              <span class="tool__ic">📍</span>
              <span class="tool__t">מיקום</span>
            </button>
            <button class="tool" type="button" @click="sendQuick('אני בדרך')">
              <span class="tool__ic">🚗</span>
              <span class="tool__t">אני בדרך</span>
            </button>
            <button class="tool" type="button" @click="sendQuick('הגעתי')">
              <span class="tool__ic">✅</span>
              <span class="tool__t">הגעתי</span>
            </button>
          </div>

          <!-- Image preview with text input (WhatsApp style) -->
          <div v-if="imagePreview" class="imagePreview">
            <div class="imagePreview__preview">
              <img :src="imagePreview" alt="תמונה" class="imagePreview__img" />
              <button
                class="imagePreview__close"
                type="button"
                @click="cancelImagePreview"
                aria-label="ביטול"
              >
                ✕
              </button>
            </div>
            <input
              v-model="imagePreviewText"
              class="composer__input imagePreview__input"
              type="text"
              placeholder="הוסף כיתוב לתמונה…"
              @keyup.enter="sendImageWithText"
            />
          </div>

          <input
            v-else
            v-model="newMessage"
            class="composer__input"
            type="text"
            placeholder="הקלד הודעה…"
            @keyup.enter="sendMessage"
          />

          <button
            v-if="imagePreview"
            class="sendCta"
            type="button"
            @click="sendImageWithText"
          >
            שלח
          </button>
          <button
            v-else
            class="sendCta"
            type="button"
            @click="sendMessage"
            :disabled="!newMessage.trim()"
          >
            שלח
          </button>

          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            @change="handleFileSelect"
            style="display: none"
          />
        </div>
      </main>
    </div>

    <!-- Image Gallery Modal -->
    <div
      v-if="showImageGallery"
      class="modal image-gallery-modal"
      @click.self="closeImageGallery"
      @touchstart="handleGalleryTouchStart"
      @touchend="handleGalleryTouchEnd"
    >
      <div class="image-gallery">
        <div class="image-gallery__header">
          <button
            class="image-gallery__close"
            type="button"
            @click="closeImageGallery"
            aria-label="חזור"
          >
            ← חזור
          </button>
          <div class="image-gallery__counter">
            {{ currentImageIndex + 1 }} / {{ jobImages.length }}
          </div>
        </div>

        <div class="image-gallery__container" ref="galleryContainer">
          <div
            class="image-gallery__track"
            :style="{ transform: `translateX(-${currentImageIndex * 100}%)` }"
          >
            <div
              v-for="(image, index) in jobImages"
              :key="index"
              class="image-gallery__slide"
            >
              <img
                :src="image"
                :alt="`תמונה ${index + 1}`"
                class="image-gallery__image"
                @error="handleImageError"
              />
            </div>
          </div>
        </div>

        <div class="image-gallery__controls">
          <button
            class="image-gallery__navBtn image-gallery__navBtn--prev"
            type="button"
            @click="previousImage"
            :disabled="currentImageIndex === 0"
            aria-label="תמונה קודמת"
          >
            ←
          </button>
          <button
            class="image-gallery__navBtn image-gallery__navBtn--next"
            type="button"
            @click="nextImage"
            :disabled="currentImageIndex === jobImages.length - 1"
            aria-label="תמונה הבאה"
          >
            →
          </button>
        </div>

        <div class="image-gallery__dots">
          <button
            v-for="(image, index) in jobImages"
            :key="index"
            class="image-gallery__dot"
            :class="{
              'image-gallery__dot--active': currentImageIndex === index,
            }"
            type="button"
            @click="goToImage(index)"
            :aria-label="`עבור לתמונה ${index + 1}`"
          ></button>
        </div>
      </div>
    </div>

    <!-- Image modal -->
    <div v-if="imageModal" class="imgModal" @click.self="imageModal = null">
      <div class="imgModal__card">
        <button class="imgModal__x" type="button" @click="imageModal = null">
          ✕
        </button>
        <img :src="imageModal" class="imgModal__img" alt="preview" />
      </div>
    </div>

    <!-- Onboarding Required Modal (for handyman) -->
    <div
      v-if="showOnboardingModal && isHandyman"
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
          הלקוח אישר את סיום העבודה. כדי לקבל את התשלום, עליך להשלים את הגדרת
          חשבון התשלומים ב-Stripe.
        </p>
        <div class="onboardingModal__actions">
          <button
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

    <!-- Price Change Modal (for handyman) -->
    <div
      v-if="showPriceChangeModal"
      class="priceChangeModal"
      dir="rtl"
      @click.self="showPriceChangeModal = false"
    >
      <div class="priceChangeModal__content">
        <button
          class="priceChangeModal__close"
          type="button"
          @click="showPriceChangeModal = false"
          aria-label="סגור"
        >
          ✕
        </button>
        <h2 class="priceChangeModal__title">שינוי מחיר</h2>
        <!-- Subcategory Selection (if multiple subcategories) -->
        <div
          v-if="
            job?.subcategoryInfo &&
            Array.isArray(job.subcategoryInfo) &&
            job.subcategoryInfo.length > 1
          "
          class="priceChangeModal__subcategorySelect"
        >
          <label class="priceChangeModal__label" for="subcategorySelectJobChat"
            >בחר עבודה:</label
          >
          <select
            id="subcategorySelectJobChat"
            v-model="selectedSubcategoryIndex"
            class="priceChangeModal__select"
            @change="onSubcategoryChangeJobChat"
          >
            <option :value="null">בחר עבודה</option>
            <option
              v-for="(subcat, index) in job.subcategoryInfo"
              :key="index"
              :value="index"
            >
              {{ subcat.subcategory }} - {{ subcat.price }} ₪
            </option>
          </select>
        </div>
        <p class="priceChangeModal__message">
          המחיר הנוכחי:
          <strong
            >{{ selectedSubcategoryPriceJobChat || currentPrice }} ₪</strong
          >
        </p>
        <p class="priceChangeModal__hint">
          ניתן לשנות את המחיר עד 20% (עד {{ maxPriceChange }} ₪)
        </p>
        <div class="priceChangeModal__inputGroup">
          <label class="priceChangeModal__label">מחיר חדש (₪)</label>
          <input
            v-model.number="newPrice"
            type="number"
            class="priceChangeModal__input"
            :min="minAllowedPrice"
            :max="maxAllowedPrice"
            step="1"
            placeholder="הכנס מחיר חדש"
          />
          <div class="priceChangeModal__changeInfo">
            <span v-if="priceChange > 0" class="priceChangeModal__increase">
              +{{ priceChange }} ₪ ({{ priceChangePercent }}%)
            </span>
            <span
              v-else-if="priceChange < 0"
              class="priceChangeModal__decrease"
            >
              {{ priceChange }} ₪ ({{ priceChangePercent }}%)
            </span>
            <span v-else class="priceChangeModal__noChange"> ללא שינוי </span>
          </div>
        </div>
        <div class="priceChangeModal__actions">
          <button
            class="priceChangeModal__btn priceChangeModal__btn--cancel"
            type="button"
            @click="showPriceChangeModal = false"
          >
            ביטול
          </button>
          <button
            class="priceChangeModal__btn priceChangeModal__btn--submit"
            type="button"
            @click="requestPriceChange"
            :disabled="
              !isPriceChangeValid ||
              isRequestingPriceChange ||
              (job?.subcategoryInfo &&
                Array.isArray(job.subcategoryInfo) &&
                job.subcategoryInfo.length > 1 &&
                selectedSubcategoryIndex === null)
            "
          >
            {{ isRequestingPriceChange ? "שולח..." : "שלח בקשה" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Price Change Request Modal (for client) -->
    <div
      v-if="showPriceChangeRequestModal"
      class="priceChangeRequestModal"
      dir="rtl"
      @click.self="showPriceChangeRequestModal = false"
    >
      <div class="priceChangeRequestModal__content">
        <h2 class="priceChangeRequestModal__title">בקשת שינוי מחיר</h2>
        <p class="priceChangeRequestModal__message">
          <template
            v-if="
              isSplitCall &&
              relatedJobs.length > 1 &&
              priceChangeRequest?.handymanName
            "
          >
            ההנדימן <strong>{{ priceChangeRequest.handymanName }}</strong> מבקש
            לשנות את מחיר העבודה
            <template v-if="priceChangeRequest?.subcategoryInfo">
              עבור:
              <strong>{{
                priceChangeRequest.subcategoryInfo.subcategory
              }}</strong>
            </template>
            :
          </template>
          <template v-else>
            ההנדימן מבקש לשנות את מחיר העבודה
            <template v-if="priceChangeRequest?.subcategoryInfo">
              עבור:
              <strong>{{
                priceChangeRequest.subcategoryInfo.subcategory
              }}</strong>
            </template>
            :
          </template>
        </p>
        <div class="priceChangeRequestModal__priceInfo">
          <div class="priceChangeRequestModal__priceRow">
            <span>מחיר נוכחי:</span>
            <strong>{{ priceChangeRequest.oldPrice }} ₪</strong>
          </div>
          <div class="priceChangeRequestModal__priceRow">
            <span>מחיר חדש:</span>
            <strong>{{ priceChangeRequest.newPrice }} ₪</strong>
          </div>
          <div
            class="priceChangeRequestModal__priceRow priceChangeRequestModal__priceRow--change"
          >
            <span>שינוי:</span>
            <strong
              :class="priceChangeRequest.change > 0 ? 'increase' : 'decrease'"
            >
              {{ priceChangeRequest.change > 0 ? "+" : ""
              }}{{ priceChangeRequest.change }} ₪ ({{
                priceChangeRequest.changePercent
              }}%)
            </strong>
          </div>
        </div>
        <div class="priceChangeRequestModal__actions">
          <button
            class="priceChangeRequestModal__btn priceChangeRequestModal__btn--reject"
            type="button"
            @click="respondToPriceChange(false)"
            :disabled="isRespondingToPriceChange"
          >
            דחה
          </button>
          <button
            class="priceChangeRequestModal__btn priceChangeRequestModal__btn--accept"
            type="button"
            @click="respondToPriceChange(true)"
            :disabled="isRespondingToPriceChange"
          >
            {{ isRespondingToPriceChange ? "מעבד..." : "אשר" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Cancel Confirmation Modal (for handyman - simple yes/no) -->
    <div
      v-if="showCancelReasonModal && isHandyman"
      class="cancelReasonModal"
      dir="rtl"
      @click.self="showCancelReasonModal = false"
    >
      <div class="cancelReasonModal__content">
        <h2 class="cancelReasonModal__title">ביטול עבודה</h2>
        <div class="cancelReasonModal__form">
          <div class="cancelReasonModal__message">
            האם אתה בטוח שברצונך לבטל את העבודה?
          </div>
        </div>
        <div class="cancelReasonModal__actions">
          <button
            class="cancelReasonModal__btn cancelReasonModal__btn--cancel"
            type="button"
            @click="closeCancelReasonModal"
          >
            לא
          </button>
          <button
            class="cancelReasonModal__btn cancelReasonModal__btn--submit"
            type="button"
            :disabled="isCancellingJob"
            @click="submitCancelJob"
          >
            {{ isCancellingJob ? "מבטל..." : "כן, בטל" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Cancel Reason Modal (for client - with reasons) -->
    <div
      v-if="showCancelReasonModal && !isHandyman"
      class="cancelReasonModal"
      dir="rtl"
      @click.self="showCancelReasonModal = false"
    >
      <div class="cancelReasonModal__content">
        <h2 class="cancelReasonModal__title">ביטול עבודה</h2>
        <div class="cancelReasonModal__form">
          <div class="cancelReasonModal__field">
            <label class="cancelReasonModal__label">סיבת הביטול</label>
            <textarea
              v-model="cancelReasonText"
              class="cancelReasonModal__textarea"
              placeholder="הסבר את סיבת הביטול..."
              rows="4"
            ></textarea>
          </div>
          <div class="cancelReasonModal__warning">
            <span class="cancelReasonModal__warningIcon">⚠️</span>
            <span class="cancelReasonModal__warningText">
              שים לב: ביטול לא מוצדק יוביל לקנס של עד 200 ₪
            </span>
          </div>
          <div class="cancelReasonModal__options">
            <button
              class="cancelReasonModal__option"
              :class="{
                'cancelReasonModal__option--selected':
                  cancelAction === 'cancel-handyman' && cancelReasonText.trim(),
              }"
              type="button"
              @click="cancelAction = 'cancel-handyman'"
              :disabled="!cancelReasonText.trim()"
            >
              <span class="cancelReasonModal__optionIcon">👤</span>
              <span class="cancelReasonModal__optionText"
                >בטל עבור הנדימן הזה</span
              >
              <span
                v-if="
                  cancelAction === 'cancel-handyman' && cancelReasonText.trim()
                "
                class="cancelReasonModal__checkIcon"
                >✓</span
              >
            </button>
            <button
              class="cancelReasonModal__option"
              :class="{
                'cancelReasonModal__option--selected':
                  cancelAction === 'cancel-complete' && cancelReasonText.trim(),
              }"
              type="button"
              @click="cancelAction = 'cancel-complete'"
              :disabled="!cancelReasonText.trim()"
            >
              <span class="cancelReasonModal__optionIcon">🚫</span>
              <span class="cancelReasonModal__optionText">בטל עבודה לגמרי</span>
              <span
                v-if="
                  cancelAction === 'cancel-complete' && cancelReasonText.trim()
                "
                class="cancelReasonModal__checkIcon"
                >✓</span
              >
            </button>
          </div>
        </div>
        <div class="cancelReasonModal__actions">
          <button
            class="cancelReasonModal__btn cancelReasonModal__btn--cancel"
            type="button"
            @click="closeCancelReasonModal"
          >
            ביטול
          </button>
          <button
            class="cancelReasonModal__btn cancelReasonModal__btn--submit"
            type="button"
            :disabled="!cancelReasonText.trim() || isCancellingJob"
            @click="submitCancelJob"
          >
            {{ isCancellingJob ? "מבטל..." : "אשר ביטול" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Location modal (WhatsApp style) -->
    <div
      v-if="locationModal"
      class="locationModal"
      @click.self="locationModal = null"
    >
      <div class="locationModal__card">
        <button
          class="locationModal__x"
          type="button"
          @click="locationModal = null"
        >
          ✕
        </button>
        <div class="locationModal__map">
          <img
            :src="getLocationMapImage(locationModal)"
            alt="מיקום"
            class="locationModal__mapImg"
          />
        </div>
        <div class="locationModal__content">
          <div class="locationModal__header">
            <span class="locationModal__icon">📍</span>
            <span class="locationModal__title">מיקום שלי</span>
          </div>
          <div class="locationModal__coords">
            {{ formatLocation(locationModal) }}
          </div>
          <div class="locationModal__actions">
            <a
              :href="getWazeUrl(locationModal)"
              target="_blank"
              rel="noopener noreferrer"
              class="locationModal__btn locationModal__btn--waze"
            >
              <span class="locationModal__btnIcon">📍</span>
              <span>ווייז</span>
            </a>
            <a
              :href="getGoogleMapsUrl(locationModal)"
              target="_blank"
              rel="noopener noreferrer"
              class="locationModal__btn locationModal__btn--google"
            >
              <span class="locationModal__btnIcon">🗺️</span>
              <span>גוגל מפות</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import axios from "axios";
import { URL } from "@/Url/url";
import { io } from "socket.io-client";
import { useToast } from "@/composables/useToast";
import { useMainStore } from "@/store/index";
import { getCurrentLocation } from "@/utils/geolocation";

export default {
  name: "JobChatLux",
  props: {
    job: { type: Object, required: true },
    isHandyman: { type: Boolean, default: false },
  },
  emits: [
    "close",
    "minimize",
    "status-updated",
    "rating-submitted",
    "cancel-job",
  ],
  setup() {
    const store = useMainStore();
    return { store };
  },
  data() {
    return {
      toast: null,
      newMessage: "",
      messages: [],
      rating: 0,
      hoverRating: 0, // Track which star is being hovered
      reviewText: "",
      ratingSubmitted: false,
      imageModal: null,
      showTools: false,
      socket: null,
      localJobStatus: null, // Local copy of job status for real-time updates
      showCancelConfirmModal: false,
      imagePreview: null, // Preview of image before sending
      imagePreviewText: "", // Text to send with image
      imagePreviewFile: null, // The file to upload
      locationModal: null, // Location to show in modal
      isApproving: false, // Track approval request state
      showOnboardingModal: false, // Show onboarding popup
      onboardingUrl: null, // Onboarding URL to display
      showPriceChangeModal: false, // Show price change modal for handyman
      selectedSubcategoryIndex: null, // Index of selected subcategory for price change
      newPrice: null, // New price input
      showPriceChangeRequestModal: false, // Show price change request modal for client
      priceChangeRequest: null, // Price change request data
      isRequestingPriceChange: false, // Track price change request state
      isRespondingToPriceChange: false, // Track price change response state
      showCancelReasonModal: false, // Show cancel reason selection modal
      cancelReasonText: "", // Free text reason for cancellation
      cancelAction: "cancel-handyman", // 'cancel-handyman', 'cancel-complete', or 'delete'
      isCancellingJob: false, // Track cancel job state
      // Image gallery
      showImageGallery: false,
      currentImageIndex: 0,
      touchStartX: 0,
      touchEndX: 0,
      // Split call related
      relatedJobs: [],
      isSplitCall: false,
      allRelatedJobsDone: false,
      isLoadingRelatedJobs: false,
    };
  },
  computed: {
    jobStatus() {
      // Use local status if available (from WebSocket), otherwise use prop
      return (
        this.localJobStatus ||
        this.job?.status ||
        this.jobInfo?.status ||
        "open"
      );
    },
    showStatusButtons() {
      return ["assigned", "on_the_way", "in_progress"].includes(this.jobStatus);
    },
    clientName() {
      return this.job?.clientName || "לקוח";
    },
    handymanName() {
      // Handle handymanName as array
      if (
        Array.isArray(this.job?.handymanName) &&
        this.job.handymanName.length > 0
      ) {
        return this.job.handymanName[0]; // Return first handyman name
      }
      return this.job?.handymanName || "הנדימן";
    },
    jobInfo() {
      return this.job;
    },
    jobLocation() {
      // Get job location from coordinates or location field
      if (this.job?.coordinates && Array.isArray(this.job.coordinates)) {
        return {
          lng: this.job.coordinates[0],
          lat: this.job.coordinates[1],
        };
      }
      if (
        this.job?.location?.coordinates &&
        Array.isArray(this.job.location.coordinates)
      ) {
        return {
          lng: this.job.location.coordinates[0],
          lat: this.job.location.coordinates[1],
        };
      }
      if (
        this.jobInfo?.coordinates &&
        Array.isArray(this.jobInfo.coordinates)
      ) {
        return {
          lng: this.jobInfo.coordinates[0],
          lat: this.jobInfo.coordinates[1],
        };
      }
      return null;
    },
    hasJobImages() {
      const job = this.jobInfo;
      if (!job) return false;

      // Check imageUrl array
      if (
        job.imageUrl &&
        Array.isArray(job.imageUrl) &&
        job.imageUrl.length > 0
      ) {
        return true;
      }

      // Check imageUrl as string
      if (job.imageUrl && typeof job.imageUrl === "string") {
        return true;
      }

      // Check subcategoryInfo for images
      if (job.subcategoryInfo && Array.isArray(job.subcategoryInfo)) {
        return job.subcategoryInfo.some(
          (subcat) =>
            subcat?.imageUrl &&
            (Array.isArray(subcat.imageUrl) ? subcat.imageUrl.length > 0 : true)
        );
      }

      return false;
    },
    jobImages() {
      const job = this.jobInfo;
      if (!job) return [];

      const images = [];

      // Collect from imageUrl array
      if (job.imageUrl) {
        if (Array.isArray(job.imageUrl)) {
          images.push(...job.imageUrl.filter((url) => url));
        } else if (typeof job.imageUrl === "string") {
          images.push(job.imageUrl);
        }
      }

      // Collect from subcategoryInfo
      if (job.subcategoryInfo && Array.isArray(job.subcategoryInfo)) {
        job.subcategoryInfo.forEach((subcat) => {
          if (subcat?.imageUrl) {
            if (Array.isArray(subcat.imageUrl)) {
              images.push(...subcat.imageUrl.filter((url) => url));
            } else if (typeof subcat.imageUrl === "string") {
              images.push(subcat.imageUrl);
            }
          }
        });
      }

      // Remove duplicates
      return [...new Set(images)];
    },
    jobSteps() {
      return [
        { status: "assigned", label: "שובצה" },
        { status: "on_the_way", label: "בדרך" },
        { status: "in_progress", label: "בביצוע" },
        { status: "done", label: "הושלמה" },
      ];
    },
    statusLabel() {
      const map = {
        assigned: "שובצה",
        on_the_way: "בדרך",
        in_progress: "בביצוע",
        done: "הושלמה",
        open: "פתוחה",
      };
      return map[this.jobStatus] || this.jobStatus;
    },
    chipTone() {
      if (this.jobStatus === "done") return "done";
      if (this.jobStatus === "in_progress") return "work";
      if (this.jobStatus === "on_the_way") return "move";
      return "new";
    },
    currentPrice() {
      return this.jobInfo?.price || this.job?.price || 0;
    },
    selectedSubcategoryPriceJobChat() {
      const job = this.job || this.jobInfo;
      if (
        !job?.subcategoryInfo ||
        !Array.isArray(job.subcategoryInfo) ||
        job.subcategoryInfo.length <= 1
      ) {
        return null; // Not applicable if single or no subcategory
      }
      if (
        this.selectedSubcategoryIndex === null ||
        this.selectedSubcategoryIndex === undefined
      ) {
        return null;
      }
      const subcat = job.subcategoryInfo[this.selectedSubcategoryIndex];
      if (!subcat) return null;
      return typeof subcat.price === "number"
        ? subcat.price
        : parseFloat(subcat.price) || 0;
    },
    maxPriceChange() {
      const basePrice =
        this.selectedSubcategoryPriceJobChat !== null
          ? this.selectedSubcategoryPriceJobChat
          : this.currentPrice;
      return Math.round(basePrice * 0.2);
    },
    minAllowedPrice() {
      const basePrice =
        this.selectedSubcategoryPriceJobChat !== null
          ? this.selectedSubcategoryPriceJobChat
          : this.currentPrice;
      return Math.round(basePrice * 0.8);
    },
    maxAllowedPrice() {
      const basePrice =
        this.selectedSubcategoryPriceJobChat !== null
          ? this.selectedSubcategoryPriceJobChat
          : this.currentPrice;
      return Math.round(basePrice * 1.2);
    },
    priceChange() {
      const basePrice =
        this.selectedSubcategoryPriceJobChat !== null
          ? this.selectedSubcategoryPriceJobChat
          : this.currentPrice;
      if (!this.newPrice || this.newPrice === basePrice) return 0;
      return this.newPrice - basePrice;
    },
    priceChangePercent() {
      const basePrice =
        this.selectedSubcategoryPriceJobChat !== null
          ? this.selectedSubcategoryPriceJobChat
          : this.currentPrice;
      if (!basePrice || basePrice === 0) return 0;
      return Math.round((this.priceChange / basePrice) * 100);
    },
    isPriceChangeValid() {
      if (!this.newPrice) return false;
      const change = Math.abs(this.priceChange);
      const maxChange = this.maxPriceChange;
      return (
        change <= maxChange &&
        this.newPrice >= this.minAllowedPrice &&
        this.newPrice <= this.maxAllowedPrice
      );
    },
  },
  created() {
    this.toast = useToast();
    // Initialize local job status
    this.localJobStatus = this.job?.status || null;
  },
  async mounted() {
    // Initialize ratingSubmitted from job data
    if (this.job?.ratingSubmitted !== undefined) {
      this.ratingSubmitted = this.job.ratingSubmitted;
    } else if (this.jobInfo?.ratingSubmitted !== undefined) {
      this.ratingSubmitted = this.jobInfo.ratingSubmitted;
    }
    window.addEventListener("click", this.onOutsideTools);
    this.initWebSocket();
    await this.loadMessages();
    this.scrollToBottom();
    // Load related jobs if this is a split call
    await this.loadRelatedJobs();
  },
  beforeUnmount() {
    window.removeEventListener("click", this.onOutsideTools);
    this.disconnectWebSocket();
  },
  watch: {
    // Watch for job prop changes - reload messages when job changes
    job: {
      immediate: false,
      deep: true,
      async handler(newJob, oldJob) {
        // Only reload if job ID actually changed (not just status update)
        const newJobId = String(newJob?.id || newJob?._id || "");
        const oldJobId = String(oldJob?.id || oldJob?._id || "");

        // Update ratingSubmitted from job data
        if (newJob?.ratingSubmitted !== undefined) {
          this.ratingSubmitted = newJob.ratingSubmitted;
        }
        if (newJobId && newJobId !== oldJobId) {
          // Job changed - reload messages and reconnect WebSocket
          this.messages = []; // Clear old messages
          this.localJobStatus = newJob?.status || null;

          // Disconnect old WebSocket
          this.disconnectWebSocket();

          // Reconnect with new job
          this.initWebSocket();
          await this.loadMessages();
          this.scrollToBottom();
        } else if (newJob?.status !== oldJob?.status) {
          // Only status changed - update local status
          this.localJobStatus = newJob?.status || null;
        }
      },
    },
    // Watch for job status changes
    "job.status"(newStatus) {
      if (newStatus && !this.localJobStatus) {
        this.localJobStatus = newStatus;
      }
    },
    messages: {
      deep: true,
      handler() {
        this.scrollToBottom();
      },
    },
  },
  methods: {
    initWebSocket() {
      if (!this.job?.id && !this.job?._id) return;

      // Disconnect existing socket if any (prevent duplicate connections)
      if (this.socket) {
        this.socket.removeAllListeners(); // Remove all listeners
        this.socket.disconnect();
        this.socket = null;
      }

      const jobId = this.job.id || this.job._id;

      // Connect to WebSocket server
      this.socket = io(URL, {
        transports: ["websocket", "polling"],
      });

      this.socket.on("connect", () => {
        // Join the job room
        this.socket.emit("join-job", String(jobId));
      });

      this.socket.on("disconnect", () => {
        // Handle disconnect if needed
      });

      // Listen for job status updates
      this.socket.on("job-status-updated", (data) => {
        // Compare jobId as strings to handle ObjectId vs string
        const receivedJobId = String(data.jobId || "");
        const currentJobId = String(jobId || "");
        if (receivedJobId === currentJobId) {
          this.localJobStatus = data.status;
          // Emit event to parent component to update the job
          this.$emit("status-updated", data.status);
        }
      });

      // Listen for price change requests (for client)
      this.socket.on("price-change-request", async (data) => {
        const receivedJobId = String(data.jobId || "");
        const currentJobId = String(jobId || "");

        // Check if this request is for the current job or a related job in split call
        let shouldShowModal = false;

        if (receivedJobId === currentJobId && !this.isHandyman) {
          // Request is for current job
          shouldShowModal = true;
        } else if (!this.isHandyman) {
          // Check if this is a split call and the request is for a related job
          if (this.isSplitCall && this.relatedJobs.length > 0) {
            const isRelatedJob = this.relatedJobs.some(
              (rj) => String(rj._id) === receivedJobId
            );
            if (isRelatedJob) {
              shouldShowModal = true;
            }
          }
        }

        if (shouldShowModal) {
          // Get the job that requested the price change
          const requestingJob = this.relatedJobs?.find(
            (rj) => String(rj._id) === receivedJobId
          );

          this.priceChangeRequest = {
            oldPrice: data.oldPrice,
            newPrice: data.newPrice,
            change: data.change || data.newPrice - data.oldPrice,
            changePercent: data.changePercent || data.percent,
            handymanId: data.handymanId,
            handymanName:
              data.handymanName ||
              requestingJob?.handymanName ||
              this.getHandymanName(),
            jobId: receivedJobId, // Store the jobId that requested the change
            subcategoryIndex:
              data.subcategoryIndex !== undefined
                ? data.subcategoryIndex
                : null,
            subcategoryInfo: data.subcategoryInfo || null,
          };
          this.showPriceChangeRequestModal = true;

          // Add system message for client
          const handymanNameText =
            this.isSplitCall && this.relatedJobs.length > 1 && data.handymanName
              ? `${data.handymanName} ביקש`
              : "הנדימן ביקש";
          const systemMessage = {
            sender: "system",
            text: `${handymanNameText} ${
              data.percent > 0 || data.changePercent > 0 ? "להעלות" : "להוריד"
            } את המחיר ב-${Math.abs(
              data.percent || data.changePercent || 0
            ).toFixed(1)}%`,
            time: new Date().toLocaleTimeString("he-IL", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            createdAt: new Date(),
            isSystem: true,
          };
          this.messages.push(systemMessage);
          this.scrollToBottom();
        }
      });

      // Listen for price change response (for handyman)
      this.socket.on("price-change-response", (data) => {
        const receivedJobId = String(data.jobId || "");
        const currentJobId = String(jobId || "");
        if (receivedJobId === currentJobId && this.isHandyman) {
          if (data.approved) {
            this.toast?.showSuccess(
              `המחיר עודכן בהצלחה. המחיר החדש: ${data.newPrice} ₪`
            );
            this.jobInfo.price = data.newPrice;
            this.job.price = data.newPrice;

            // Add system message for handyman
            const systemMessage = {
              sender: "system",
              text: `הלקוח אישר את שינוי המחיר. המחיר החדש: ${data.newPrice} ₪`,
              time: new Date().toLocaleTimeString("he-IL", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              createdAt: new Date(),
              isSystem: true,
            };
            this.messages.push(systemMessage);
            this.scrollToBottom();
          } else {
            this.toast?.showWarning("הלקוח דחה את בקשת שינוי המחיר");
          }
        }
      });

      // Listen for new messages - only once, prevent duplicates
      this.socket.on("new-message", (data) => {
        const receivedJobId = String(data.jobId || "");
        const currentJobId = String(jobId || "");
        if (receivedJobId === currentJobId && data.message) {
          this.addMessageToUI(data.message);
        }
      });

      // Listen for rating submitted
      this.socket.on("rating-submitted", (data) => {
        const receivedJobId = String(data.jobId || "");
        const currentJobId = String(jobId || "");
        if (receivedJobId === currentJobId) {
          // Navigate to job summary page
          const userId = this.store?.user?._id || this.$route.params.id;
          this.$router.push(
            `/Dashboard/${userId}/job-summary/${receivedJobId}`
          );
        }
      });

      // Listen for onboarding required (when client approves and handyman needs onboarding)
      this.socket.on("onboarding-required", (data) => {
        const receivedJobId = String(data.jobId || "");
        const currentJobId = String(jobId || "");
        if (receivedJobId === currentJobId && this.isHandyman) {
          this.onboardingUrl = data.onboardingUrl;
          this.showOnboardingModal = true;
        }
      });

      this.socket.on("error", () => {
        // WebSocket error - silent fail
      });
    },

    disconnectWebSocket() {
      if (this.socket) {
        const jobId = this.job?.id || this.job?._id;
        if (jobId) {
          this.socket.emit("leave-job", jobId);
        }
        // Remove all listeners before disconnecting to prevent memory leaks
        this.socket.removeAllListeners();
        this.socket.disconnect();
        this.socket = null;
      }
    },

    getJobDisplayName() {
      if (!this.jobInfo) return "עבודה";
      // Handle subcategoryInfo as array
      if (
        Array.isArray(this.jobInfo.subcategoryInfo) &&
        this.jobInfo.subcategoryInfo.length > 0
      ) {
        if (this.jobInfo.subcategoryInfo.length === 1) {
          // Single job - show name
          return (
            this.jobInfo.subcategoryInfo[0].subcategory ||
            this.jobInfo.subcategoryInfo[0].category ||
            "עבודה"
          );
        } else {
          // Multiple jobs - show count
          return `${this.jobInfo.subcategoryInfo.length} עבודות`;
        }
      }
      // Fallback for old format (object) or no subcategoryInfo
      return (
        this.jobInfo.subcategoryInfo?.name ||
        this.jobInfo.subcategoryInfo?.subcategory ||
        "עבודה"
      );
    },
    getHandymanName() {
      // Handle handymanName as array
      if (
        Array.isArray(this.job?.handymanName) &&
        this.job.handymanName.length > 0
      ) {
        return this.job.handymanName[0]; // Return first handyman name
      }
      return this.job?.handymanName || "הנדימן";
    },
    async loadMessages() {
      try {
        const jobId = this.job?.id || this.job?._id;
        if (!jobId) return;

        const { data } = await axios.get(`${URL}/jobs/${jobId}/messages`);
        if (data.success && data.messages) {
          // Convert DB messages to UI format
          this.messages = data.messages.map((msg) => {
            const isFromHandyman =
              !!msg.handyman || !!msg.handymanImage || !!msg.handymanLocation;
            const sender = this.isHandyman
              ? isFromHandyman
                ? "me"
                : "other"
              : isFromHandyman
              ? "other"
              : "me";
            const text = msg.handyman || msg.customer || "";
            const image = msg.handymanImage || msg.customerImage || null;
            const location =
              msg.handymanLocation || msg.customerLocation || null;
            const createdAt = msg.createdAt
              ? new Date(msg.createdAt)
              : new Date();
            return {
              sender,
              text,
              image,
              location,
              time: createdAt.toLocaleTimeString("he-IL", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              createdAt,
            };
          });
        }
      } catch (error) {
        this.toast?.showError(" לא הצלחנו לטעון את ההודעות");
      }
    },

    addMessageToUI(messageObj) {
      // Determine sender: if handyman sent, for handyman it's "me", for customer it's "other"
      const isFromHandyman =
        !!messageObj.handyman ||
        !!messageObj.handymanImage ||
        !!messageObj.handymanLocation;
      const sender = this.isHandyman
        ? isFromHandyman
          ? "me"
          : "other"
        : isFromHandyman
        ? "other"
        : "me";

      const text = messageObj.handyman || messageObj.customer || "";
      const image =
        messageObj.handymanImage || messageObj.customerImage || null;
      const location =
        messageObj.handymanLocation || messageObj.customerLocation || null;
      const createdAt = messageObj.createdAt
        ? new Date(messageObj.createdAt)
        : new Date();

      // Check if message already exists (avoid duplicates)
      // First priority: Check for optimistic messages (uploading) that should be updated
      if (image || location) {
        const optimisticIndex = this.messages.findIndex((m) => {
          if (m.sender !== sender || !m.uploading) return false;

          // For optimistic messages with location, match by location coordinates
          if (location && m.location) {
            // Compare coordinates with tolerance for floating point precision
            const latMatch =
              Math.abs((m.location.lat || 0) - (location.lat || 0)) < 0.0001;
            const lngMatch =
              Math.abs((m.location.lng || 0) - (location.lng || 0)) < 0.0001;
            return latMatch && lngMatch;
          }

          // For optimistic messages with image, match by text
          if (image && m.image) {
            const textMatches =
              (!m.text && !text) ||
              (m.text && text && m.text.trim() === text.trim());
            return textMatches;
          }

          return false;
        });

        if (optimisticIndex !== -1) {
          // Update existing optimistic message with real data from server
          this.messages[optimisticIndex] = {
            sender,
            text,
            image,
            location,
            time: createdAt.toLocaleTimeString("he-IL", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            createdAt,
          };
          this.scrollToBottom();
          return; // Don't add duplicate
        }
      }

      // Second: Check for exact duplicate by content
      const exists = this.messages.some((m) => {
        // Skip optimistic messages (they're handled above)
        if (m.uploading) return false;
        if (m.sender !== sender) return false;

        // Exact match on image URL
        if (image && m.image) {
          if (m.image !== image) return false;
          // If both have text, must match exactly
          if (text && m.text) {
            return text.trim() === m.text.trim();
          }
          // If neither has text, match on image only
          return !text && !m.text;
        }

        // Exact match on location
        if (location && m.location) {
          // Compare coordinates with tolerance for floating point precision
          const latMatch =
            Math.abs((m.location.lat || 0) - (location.lat || 0)) < 0.0001;
          const lngMatch =
            Math.abs((m.location.lng || 0) - (location.lng || 0)) < 0.0001;
          if (!latMatch || !lngMatch) {
            return false;
          }
          // If both have text, must match exactly
          if (text && m.text) {
            return text.trim() === m.text.trim();
          }
          return !text && !m.text;
        }

        // Text-only messages
        if (text && m.text && !image && !m.image && !location && !m.location) {
          return text.trim() === m.text.trim();
        }

        return false;
      });

      if (!exists) {
        this.messages.push({
          sender,
          text,
          image,
          location,
          time: createdAt.toLocaleTimeString("he-IL", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          createdAt,
        });
        this.scrollToBottom();
      }
    },

    stepHint(s) {
      const h = {
        assigned: "הקריאה שובצה להנדימן",
        on_the_way: "בדרך אל הלקוח",
        in_progress: "מתבצעת עבודה בשטח",
        done: "העבודה הסתיימה",
      };
      return h[s] || "";
    },
    async getCurrentLocation() {
      return await getCurrentLocation();
    },
    isStepCompleted(stepStatus) {
      const statusOrder = {
        assigned: 1,
        on_the_way: 2,
        in_progress: 3,
        done: 4,
      };
      const currentOrder = statusOrder[this.jobStatus] || 0;
      const stepOrder = statusOrder[stepStatus] || 0;
      return stepOrder < currentOrder;
    },

    toggleTools(e) {
      e?.stopPropagation?.();
      this.showTools = !this.showTools;
    },

    onOutsideTools(e) {
      const inside = e?.target?.closest?.(".composer");
      if (!inside) this.showTools = false;
    },

    triggerFile() {
      this.showTools = false;
      this.$refs.fileInput?.click();
    },

    sendQuick(text) {
      this.showTools = false;
      this.newMessage = text;
      this.sendMessage();
    },

    async sendLocation() {
      this.showTools = false;

      // Show loading
      this.toast?.showSuccess("מאתר את המיקום שלך...");

      try {
        const loc = await this.getCurrentLocation();
        const location = {
          lat: loc.lat,
          lng: loc.lon,
          accuracy: loc.accuracy,
        };
        await this.sendLocationMessage(location);
      } catch (error) {
        let errorMessage = "שגיאה בקבלת המיקום";
        if (error.code === 1) {
          errorMessage = "הגישה למיקום נדחתה";
        } else if (error.code === 2) {
          errorMessage = "המיקום לא זמין";
        } else if (error.code === 3) {
          errorMessage = "פג הזמן לקבלת המיקום";
        } else if (error.message === "Geolocation not supported") {
          errorMessage = "הדפדפן שלך לא תומך במיקום";
        }
        this.toast?.showError(errorMessage);
      }
    },

    async sendLocationMessage(location) {
      const jobId = this.job?.id || this.job?._id;
      if (!jobId) return;

      const userId = this.store?.user?._id;
      if (!userId) {
        this.toast?.showError(" לא הצלחנו לזהות את המשתמש");
        return;
      }

      // Create unique message ID
      const messageId = Date.now() + Math.random();

      // Show optimistic message
      const tempMessage = {
        sender: "me",
        location: location,
        time: new Date().toLocaleTimeString("he-IL", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        createdAt: new Date(),
        uploading: true,
        _tempId: messageId,
      };
      this.messages.push(tempMessage);
      this.scrollToBottom();

      try {
        // Send to server
        await axios.post(`${URL}/jobs/${jobId}/messages`, {
          location: location,
          senderId: userId,
          isHandyman: this.isHandyman,
        });

        // Update optimistic message - mark as no longer uploading
        // The WebSocket will handle the actual update with server data
        const tempIndex = this.messages.findIndex(
          (m) => m._tempId === messageId && m.uploading && m.sender === "me"
        );
        if (tempIndex !== -1) {
          // Keep the message but mark it for WebSocket update
          // The _tempId will help match it when WebSocket message arrives
          this.messages[tempIndex] = {
            ...this.messages[tempIndex],
            uploading: false,
            _tempId: messageId,
          };
        }
      } catch (error) {
        // Remove optimistic message on error
        const tempIndex = this.messages.findIndex(
          (m) => m._tempId === messageId && m.uploading && m.sender === "me"
        );
        if (tempIndex !== -1) {
          this.messages.splice(tempIndex, 1);
        }
        this.toast?.showError(" לא הצלחנו לשלוח את המיקום");
      }
    },

    openLocationModal(location) {
      if (!location) return;
      this.locationModal = location;
    },

    getLocationMapImage(location) {
      if (typeof location === "object" && location.lat && location.lng) {
        // Use server endpoint that uses Mapbox Static Images API
        const zoom = 15;
        const width = 400;
        const height = 300;
        return `${URL}/location-map-image?lat=${location.lat}&lng=${location.lng}&zoom=${zoom}&width=${width}&height=${height}`;
      }
      return "";
    },

    onMapImageError(event) {
      // Fallback to OpenStreetMap if Mapbox fails
      if (this.locationModal || event.target.dataset.location) {
        const location =
          this.locationModal ||
          JSON.parse(event.target.dataset.location || "{}");
        if (location.lat && location.lng) {
          event.target.src = `https://www.openstreetmap.org/export/embed.html?bbox=${
            location.lng - 0.01
          },${location.lat - 0.01},${location.lng + 0.01},${
            location.lat + 0.01
          }&layer=mapnik&marker=${location.lat},${location.lng}`;
        }
      }
    },

    getLocationUrl(location) {
      if (typeof location === "object" && location.lat && location.lng) {
        return `https://www.google.com/maps?q=${location.lat},${location.lng}`;
      }
      return "#";
    },

    getWazeUrl(location) {
      if (typeof location === "object" && location.lat && location.lng) {
        return `https://www.waze.com/ul?ll=${location.lat},${location.lng}&navigate=yes`;
      }
      return "#";
    },

    getGoogleMapsUrl(location) {
      if (typeof location === "object" && location.lat && location.lng) {
        return `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}&travelmode=driving`;
      }
      return "#";
    },

    formatLocation(location) {
      if (typeof location === "object" && location.lat && location.lng) {
        return `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
      }
      return "";
    },

    async sendMessage() {
      const t = this.newMessage.trim();
      if (!t) return;

      const jobId = this.job?.id || this.job?._id;
      if (!jobId) return;

      // Get current user ID from store
      const userId = this.store?.user?._id;
      if (!userId) {
        this.toast?.showError(" לא הצלחנו לזהות את המשתמש");
        return;
      }

      // Optimistically add message to UI
      const tempMessage = {
        sender: "me",
        text: t,
        time: new Date().toLocaleTimeString("he-IL", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        createdAt: new Date(),
      };
      this.messages.push(tempMessage);
      this.newMessage = "";
      this.scrollToBottom();

      try {
        // Send to server
        await axios.post(`${URL}/jobs/${jobId}/messages`, {
          text: t,
          senderId: userId,
          isHandyman: this.isHandyman,
        });

        // Message will be added via WebSocket, but we already added it optimistically
        // The WebSocket handler will check for duplicates
      } catch (error) {
        // Remove the optimistic message on error
        const index = this.messages.findIndex(
          (m) =>
            m.text === t &&
            m.sender === "me" &&
            m.createdAt === tempMessage.createdAt
        );
        if (index !== -1) {
          this.messages.splice(index, 1);
        }
        this.toast?.showError(" לא הצלחנו לשלוח את ההודעה");
      }
    },

    handleFileSelect(e) {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith("image/")) {
        this.toast?.showError("יש לבחור קובץ תמונה בלבד");
        e.target.value = "";
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.toast?.showError("הקובץ גדול מדי. מקסימום 5MB");
        e.target.value = "";
        return;
      }

      // Show preview (WhatsApp style) - user can add text before sending
      const reader = new FileReader();
      reader.onload = (ev) => {
        this.imagePreview = ev.target.result;
        this.imagePreviewFile = file;
        this.imagePreviewText = ""; // Clear any previous text
      };
      reader.readAsDataURL(file);

      e.target.value = "";
    },

    cancelImagePreview() {
      this.imagePreview = null;
      this.imagePreviewFile = null;
      this.imagePreviewText = "";
    },

    async sendImageWithText() {
      if (!this.imagePreviewFile) return;

      const file = this.imagePreviewFile;
      const imageText = this.imagePreviewText.trim();

      // Create unique message ID to prevent duplicates
      const messageId = Date.now() + Math.random();

      // Show optimistic message immediately
      const tempMessage = {
        sender: "me",
        image: this.imagePreview, // Preview URL
        text: imageText || null,
        time: new Date().toLocaleTimeString("he-IL", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        createdAt: new Date(),
        uploading: true,
        _tempId: messageId, // Unique ID to prevent socket duplicates
      };
      this.messages.push(tempMessage);
      this.scrollToBottom();

      // Clear preview
      this.cancelImagePreview();

      try {
        // Upload to server
        const formData = new FormData();
        formData.append("image", file);

        const { data } = await axios.post(`${URL}/upload-image`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        if (data.imageUrl) {
          // Find the temp message and update it with the real URL
          const tempIndex = this.messages.findIndex(
            (m) => m._tempId === messageId && m.uploading && m.sender === "me"
          );
          if (tempIndex !== -1) {
            // Send the image message to server with text
            await this.sendImageMessage(data.imageUrl, imageText);
            // Update the message with the real URL and remove uploading flag
            this.messages[tempIndex] = {
              ...this.messages[tempIndex],
              image: data.imageUrl,
              uploading: false,
              _tempId: messageId, // Keep ID to prevent socket duplicate
            };
          }
        }
      } catch (error) {
        // Remove the temp message on error
        const tempIndex = this.messages.findIndex(
          (m) => m._tempId === messageId && m.uploading && m.sender === "me"
        );
        if (tempIndex !== -1) {
          this.messages.splice(tempIndex, 1);
        }
        this.toast?.showError(" לא הצלחנו להעלות את התמונה");
      }
    },

    async sendImageMessage(imageUrl, text = null) {
      const jobId = this.job?.id || this.job?._id;
      if (!jobId) return;

      // Get current user ID from store
      const userId = this.store?.user?._id;
      if (!userId) {
        this.toast?.showError(" לא הצלחנו לזהות את המשתמש");
        return;
      }

      try {
        // Send to server with text if provided
        await axios.post(`${URL}/jobs/${jobId}/messages`, {
          imageUrl: imageUrl,
          text: text || undefined, // Send text only if it exists
          senderId: userId,
          isHandyman: this.isHandyman,
        });

        // Message will be added via WebSocket, but we already added it optimistically
        // The duplicate check in addMessageToUI will prevent showing it twice
      } catch (error) {
        this.toast?.showError(" לא הצלחנו לשלוח את התמונה");
      }
    },

    openImage(src) {
      this.imageModal = src;
    },
    closeImageGallery() {
      this.showImageGallery = false;
      this.currentImageIndex = 0;
    },
    nextImage() {
      if (this.currentImageIndex < this.jobImages.length - 1) {
        this.currentImageIndex++;
      }
    },
    previousImage() {
      if (this.currentImageIndex > 0) {
        this.currentImageIndex--;
      }
    },
    goToImage(index) {
      if (index >= 0 && index < this.jobImages.length) {
        this.currentImageIndex = index;
      }
    },
    handleGalleryTouchStart(e) {
      this.touchStartX = e.touches[0].clientX;
    },
    handleGalleryTouchEnd(e) {
      this.touchEndX = e.changedTouches[0].clientX;
      this.handleGallerySwipe();
    },
    handleGallerySwipe() {
      const swipeThreshold = 50; // Minimum distance for swipe
      const diff = this.touchStartX - this.touchEndX;

      if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
          // Swipe left - next image
          this.nextImage();
        } else {
          // Swipe right - previous image
          this.previousImage();
        }
      }
    },
    handleImageError(e) {
      // Handle image load error
      e.target.style.display = "none";
    },
    async checkOnboardingStatus() {
      if (!this.isHandyman) return;

      const handymanId = this.store.user?._id || this.store.user?.id;
      if (!handymanId) return;

      try {
        const response = await axios.get(
          `${URL}/api/handyman/${handymanId}/stripe/status`
        );
        if (response.data && response.data.success) {
          this.needsOnboarding = response.data.needsOnboarding || false;

          // If needs onboarding, get the onboarding URL
          if (this.needsOnboarding) {
            await this.fetchOnboardingLink();
          }
        }
      } catch (error) {
        // Error checking onboarding status
      }
    },
    async fetchOnboardingLink() {
      if (!this.isHandyman) return;

      const handymanId = this.store.user?._id || this.store.user?.id;
      if (!handymanId) return;

      this.isLoadingOnboarding = true;
      try {
        const response = await axios.post(
          `${URL}/api/handyman/stripe/onboarding-link`,
          { handymanId: String(handymanId) }
        );
        if (response.data && response.data.success && response.data.url) {
          this.onboardingUrl = response.data.url;
        }
      } catch (error) {
        this.toast?.showError(" לא הצלחנו לקבל את קישור הגדרת תשלומים");
      } finally {
        this.isLoadingOnboarding = false;
      }
    },
    handleOpenOnboarding() {
      if (this.onboardingUrl) {
        window.open(this.onboardingUrl, "_blank");
      } else {
        this.toast?.showError(
          "קישור הגדרת תשלומים לא זמין. נסה שוב מאוחר יותר."
        );
      }
    },
    handleOpenOnboarding() {
      if (this.onboardingUrl) {
        window.open(this.onboardingUrl, "_blank");
      } else {
        this.toast?.showError(
          "קישור הגדרת תשלומים לא זמין. נסה שוב מאוחר יותר."
        );
      }
    },
    async updateStatus(newStatus) {
      try {
        const endpoint = `/jobs/${newStatus.replaceAll("_", "-")}`;
        await axios.post(`${URL}${endpoint}`, {
          jobId: this.job._id || this.job.id,
          handymanId: this.job.handymanId,
        });
        this.$emit("status-updated", newStatus);
      } catch (err) {
        this.toast.showError(" לא הצלחנו לעדכן את הסטטוס");
      }
    },

    async submitRating() {
      if (this.rating === 0) {
        this.toast.showError("אנא בחר דירוג");
        return;
      }
      try {
        // Get current user ID (customer)
        const customerId = this.store?.user?._id || this.job?.clientId;
        if (!customerId) {
          this.toast.showError(" לא הצלחנו לזהות את הלקוח");
          return;
        }

        const requestData = {
          jobId: this.job._id || this.job.id,
          handymanId: this.job.handymanId,
          customerId: customerId,
          rating: this.rating,
          review: this.reviewText,
        };

        const response = await axios.post(`${URL}/jobs/rate`, requestData);

        // Check if the response indicates success
        if (response.data && response.data.success) {
          this.toast.showSuccess("הדירוג נשלח");
          this.ratingSubmitted = true;
          this.$emit("rating-submitted");
          // Navigate directly to dashboard (not to job summary)
          const userId = this.store?.user?._id || this.$route.params.id;
          this.$router.push(`/Dashboard/${userId}`);
        } else {
          this.toast.showError(
            response.data?.message || ", לא הצלחנו לשלוח את הדירוג"
          );
        }
      } catch (err) {
        if (err.response?.data?.message) {
          this.toast.showError(err.response.data.message);
        } else if (err.response?.data?.success) {
          // Request succeeded despite error (network issue after response)
          this.toast.showSuccess("הדירוג נשלח");
          this.ratingSubmitted = true;
          this.$emit("rating-submitted");
          const userId = this.store?.user?._id || this.$route.params.id;
          this.$router.push(`/Dashboard/${userId}`);
        } else {
          this.toast.showError(" לא הצלחנו לשלוח את הדירוג");
        }
      }
    },

    scrollToBottom() {
      this.$nextTick(() => {
        const el = this.$refs.messagesContainer;
        if (el) el.scrollTop = el.scrollHeight;
      });
    },

    async loadRelatedJobs() {
      const jobId = this.job?._id || this.job?.id;
      if (!jobId) return;

      this.isLoadingRelatedJobs = true;
      try {
        const response = await axios.get(`${URL}/api/jobs/${jobId}/related`);
        if (response.data?.success) {
          this.isSplitCall = response.data.isSplitCall;
          this.relatedJobs = response.data.relatedJobs || [];
          this.allRelatedJobsDone = response.data.allJobsDone || false;
        }
      } catch (error) {
        // Silent fail - not critical
      } finally {
        this.isLoadingRelatedJobs = false;
      }
    },

    getHandymanNameForPriceChange() {
      if (!this.isSplitCall || !this.relatedJobs.length) {
        return this.getHandymanName();
      }

      // Find which handyman requested the price change
      const currentJobId = String(this.job?._id || this.job?.id || "");
      const jobWithPriceChange = this.relatedJobs.find(
        (rj) =>
          String(rj._id) === currentJobId &&
          rj.priceChangeRequest &&
          rj.priceChangeRequest.status === "pending"
      );

      if (jobWithPriceChange && jobWithPriceChange.handymanName) {
        return jobWithPriceChange.handymanName;
      }

      return this.getHandymanName();
    },

    async handleApproveJob() {
      if (this.isApproving) {
        return;
      }

      const jobId = this.job._id || this.job.id;
      const clientId =
        this.job?.clientId?.toString() ||
        this.job?.clientId ||
        this.jobInfo?.clientId?.toString() ||
        this.jobInfo?.clientId ||
        this.store.user?._id ||
        this.store.user?.id;

      if (!jobId || !clientId) {
        this.toast?.showError("  חסרים פרטים לאישור העבודה");
        return;
      }

      this.isApproving = true;
      try {
        const response = await axios.post(`${URL}/api/jobs/approve`, {
          jobId,
          clientId,
        });

        if (response.data && response.data.success) {
          this.toast?.showSuccess("העבודה אושרה והתשלום שוחרר");
          // Update local job state
          if (this.jobInfo) {
            this.jobInfo.clientApproved = true;
            this.jobInfo.paymentStatus = "paid";
          }
          this.$emit("job-approved", {
            jobId,
            paymentStatus: "paid",
            paymentReleased: true,
          });
        } else {
          this.toast?.showError(
            response.data?.message || "שגיאה באישור העבודה"
          );
        }
      } catch (error) {
        this.toast?.showError(
          error.response?.data?.message || "שגיאה באישור העבודה"
        );
      } finally {
        this.isApproving = false;
      }
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

    async handleCancelJob() {
      this.openCancelJob();
    },
    openCancelJob() {
      this.cancelReasonText = "";
      this.cancelAction = "cancel-handyman";
      this.showCancelReasonModal = true;
    },
    closeCancelReasonModal() {
      this.showCancelReasonModal = false;
      this.cancelReasonText = "";
      this.cancelAction = "cancel-handyman";
    },
    async submitCancelJob() {
      // For handyman, no reason required. For client, require reason.
      if (
        !this.isHandyman &&
        (!this.cancelReasonText.trim() || this.isCancellingJob)
      )
        return;
      if (this.isHandyman && this.isCancellingJob) return;

      this.isCancellingJob = true;
      try {
        const jobId = this.job._id || this.job.id;
        if (!jobId) return;

        const userId = this.store.user?._id || this.store.user?.id;
        if (!userId) {
          this.toast.showError(" לא מצאנו מזהה משתמש");
          return;
        }

        // Determine if user is handyman or client
        const isHandyman = this.isHandyman;
        const personCancel = isHandyman ? "handyman" : "customer";

        if (isHandyman) {
          // For handyman: simple cancellation - job returns to open status
          await axios.post(`${URL}/jobs/cancel`, {
            jobId,
            userId,
            cancel: {
              personcancel: personCancel,
              "reason-for-cancellation": "",
              "Totally-cancels": false,
              JobId: jobId,
            },
          });

          this.toast.showSuccess("העבודה בוטלה");
        } else if (this.cancelAction === "cancel-complete") {
          // Complete cancellation - delete job from DB (client only)
          await axios.delete(`${URL}/jobs/${jobId}/delete`, {
            data: {
              userId,
              cancel: {
                personcancel: personCancel,
                "reason-for-cancellation": this.cancelReasonText.trim(),
                "Totally-cancels": true,
                JobId: jobId,
                isDeleted: true,
              },
            },
          });

          this.toast.showSuccess("העבודה נמחקה");
        } else {
          // Cancel for this handyman only (client only)
          await axios.post(`${URL}/jobs/cancel`, {
            jobId,
            userId,
            cancel: {
              personcancel: personCancel,
              "reason-for-cancellation": this.cancelReasonText.trim(),
              "Totally-cancels": false,
              JobId: jobId,
            },
          });

          this.toast.showSuccess("העבודה בוטלה להנדימן הזה");
        }

        this.closeCancelReasonModal();
        this.$emit("cancel-job");
      } catch (error) {
        this.toast.showError(
          error.response?.data?.message || "שגיאה בביטול העבודה"
        );
      } finally {
        this.isCancellingJob = false;
      }
    },
    onSubcategoryChangeJobChat() {
      // Reset price when subcategory changes
      this.newPrice = null;
    },
    async requestPriceChange() {
      if (!this.isPriceChangeValid || this.isRequestingPriceChange) return;

      // Check if subcategory selection is required
      const job = this.job || this.jobInfo;
      if (
        job?.subcategoryInfo &&
        Array.isArray(job.subcategoryInfo) &&
        job.subcategoryInfo.length > 1 &&
        (this.selectedSubcategoryIndex === null ||
          this.selectedSubcategoryIndex === undefined)
      ) {
        this.toast?.showError(" אנא בחר עבודה");
        return;
      }

      this.isRequestingPriceChange = true;
      try {
        const jobId = this.job._id || this.job.id;
        if (!jobId) return;

        const handymanId = this.store.user?._id || this.store.user?.id;
        if (!handymanId) {
          this.toast?.showError(" לא מצאנו מזהה משתמש");
          return;
        }

        // Determine old price (subcategory price or total job price)
        const oldPrice =
          this.selectedSubcategoryPriceJobChat !== null
            ? this.selectedSubcategoryPriceJobChat
            : this.jobInfo?.price || this.job?.price || 0;

        await axios.post(`${URL}/api/jobs/price-change-request`, {
          jobId,
          handymanId,
          newPrice: this.newPrice,
          subcategoryIndex:
            this.selectedSubcategoryIndex !== null
              ? this.selectedSubcategoryIndex
              : undefined,
        });

        // Calculate percent change for message (using oldPrice already calculated above)
        const percentChange =
          oldPrice > 0 ? ((this.newPrice - oldPrice) / oldPrice) * 100 : 0;

        // Add system message (for handyman - he sees his own request)
        const systemMessage = {
          sender: "system",
          text: `שלחת בקשה ${
            percentChange > 0 ? "להעלות" : "להוריד"
          } את המחיר ב-${Math.abs(percentChange).toFixed(1)}%`,
          time: new Date().toLocaleTimeString("he-IL", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          createdAt: new Date(),
          isSystem: true,
        };
        this.messages.push(systemMessage);
        this.scrollToBottom();

        this.toast?.showSuccess("בקשת שינוי מחיר נשלחה ללקוח");
        this.showPriceChangeModal = false;
        this.newPrice = null;
        this.selectedSubcategoryIndex = null;
      } catch (error) {
        this.toast?.showError(
          error.response?.data?.message || "שגיאה בשליחת בקשת שינוי מחיר"
        );
      } finally {
        this.isRequestingPriceChange = false;
      }
    },
    async respondToPriceChange(accepted) {
      if (this.isRespondingToPriceChange) return;

      this.isRespondingToPriceChange = true;
      try {
        // Use jobId from the price change request if available (for split calls)
        // Otherwise use current job ID
        const jobId =
          this.priceChangeRequest?.jobId || this.job._id || this.job.id;
        if (!jobId) return;

        const clientId = this.store.user?._id || this.store.user?.id;
        if (!clientId) {
          this.toast?.showError(" לא מצאנו מזהה משתמש");
          return;
        }

        await axios.post(`${URL}/api/jobs/price-change-response`, {
          jobId,
          clientId,
          accepted,
        });

        if (accepted) {
          this.toast?.showSuccess("שינוי המחיר אושר");

          // Update price for the job that requested the change
          // If it's a different job (split call), update it in relatedJobs
          if (
            this.priceChangeRequest?.jobId &&
            this.priceChangeRequest.jobId !==
              String(this.job._id || this.job.id)
          ) {
            // This is a different job - update it in relatedJobs
            const relatedJob = this.relatedJobs?.find(
              (rj) => String(rj._id) === this.priceChangeRequest.jobId
            );
            if (relatedJob) {
              relatedJob.price = this.priceChangeRequest.newPrice;
            }
          } else {
            // Current job - update normally
            if (this.jobInfo) {
              this.jobInfo.price = this.priceChangeRequest.newPrice;
            }
            if (this.job) {
              this.job.price = this.priceChangeRequest.newPrice;
            }
          }

          // Add system message (for client - he sees his own approval)
          const systemMessage = {
            sender: "system",
            text: `אישרת את שינוי המחיר. המחיר החדש: ${this.priceChangeRequest.newPrice} ₪`,
            time: new Date().toLocaleTimeString("he-IL", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            createdAt: new Date(),
            isSystem: true,
          };
          this.messages.push(systemMessage);
          this.scrollToBottom();
        } else {
          this.toast?.showSuccess("שינוי המחיר נדחה");
        }

        this.showPriceChangeRequestModal = false;
        this.priceChangeRequest = null;
      } catch (error) {
        this.toast?.showError(
          error.response?.data?.message || "שגיאה בתגובה לבקשת שינוי מחיר"
        );
      } finally {
        this.isRespondingToPriceChange = false;
      }
    },
  },
};
</script>

<style scoped lang="scss">
/* black/gray/orange – “lux” style */
$bg: #08090c;
$panel: rgba(255, 255, 255, 0.06);
$panel2: rgba(255, 255, 255, 0.085);
$stroke: rgba(255, 255, 255, 0.12);
$text: rgba(255, 255, 255, 0.92);
$muted: rgba(255, 255, 255, 0.6);
$orange: #ff6a00;
$orange2: #ff8a2b;

.lux {
  grid-column: 1 / -1;
  justify-self: center;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  border-radius: 26px;
  overflow: hidden;
  border: 1px solid rgba($orange, 0.18);
  background: radial-gradient(
      900px 420px at 10% 0%,
      rgba($orange, 0.12),
      transparent 55%
    ),
    radial-gradient(
      1100px 520px at 90% 10%,
      rgba(255, 255, 255, 0.06),
      transparent 60%
    ),
    linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(0, 0, 0, 0.28));
  box-shadow: 0 22px 60px rgba(0, 0, 0, 0.62);
  min-height: 640px;
  max-height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    max-width: 100%;
    border-radius: 0;
    min-height: 100vh;
    max-height: 100vh;
  }
}

.luxTop {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 18px;
  border-bottom: 1px solid rgba($orange, 0.14);
  background: linear-gradient(180deg, $panel2, $panel);

  @media (max-width: 768px) {
    padding: 12px 10px;
    flex-wrap: wrap;
    gap: 8px;
  }
}
.luxTop__title {
  font-size: 20px;
  font-weight: 1100;
  color: $text;

  @media (max-width: 768px) {
    font-size: 16px;
  }
}
.luxTop__meta {
  margin-top: 6px;
  font-size: 12px;
  font-weight: 800;
  color: $muted;
  display: flex;
  gap: 8px;

  @media (max-width: 768px) {
    font-size: 10px;
    margin-top: 4px;
    gap: 4px;
  }
}
.luxTop__left {
  flex: 1;
  min-width: 0;

  @media (max-width: 768px) {
    width: 100%;
    order: 1;
  }
}
.luxTop__name {
  color: rgba(255, 255, 255, 0.82);
}
.luxTop__sep {
  opacity: 0.7;
}
.luxTop__right {
  display: flex;
  align-items: center;
  gap: 10px;

  @media (max-width: 768px) {
    gap: 6px;
    flex-wrap: wrap;
    order: 2;
    width: 100%;
    justify-content: flex-end;
  }
}

.luxTop__nav {
  display: flex;
  align-items: center;
  gap: 8px;

  @media (max-width: 768px) {
    gap: 4px;
    order: 3;
    width: 100%;
    justify-content: flex-end;
    margin-top: 4px;
  }
}

.navBtn {
  min-width: 38px;
  height: 38px;
  padding: 0 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.24);
  color: $text;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 900;
  text-decoration: none;
  transition: all 0.2s ease;
  white-space: nowrap;

  @media (max-width: 768px) {
    min-width: auto;
    height: 32px;
    padding: 0 8px;
    font-size: 11px;
    gap: 4px;
  }
}

.navBtn__icon {
  font-size: 16px;
  flex-shrink: 0;

  @media (max-width: 768px) {
    font-size: 12px;
  }
}

.navBtn__text {
  font-size: 12px;
  font-weight: 900;

  @media (max-width: 768px) {
    font-size: 9px;
  }
}

.navBtn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.navBtn--waze {
  border-color: rgba(118, 186, 153, 0.4);
  background: rgba(118, 186, 153, 0.15);
  color: #76ba99;
}

.navBtn--waze:hover {
  background: rgba(118, 186, 153, 0.25);
  border-color: rgba(118, 186, 153, 0.6);
}

.navBtn--waze .navBtn__text {
  color: #76ba99;
}

.navBtn--google {
  border-color: rgba(66, 133, 244, 0.4);
  background: rgba(66, 133, 244, 0.15);
  color: #4285f4;
}

.navBtn--google:hover {
  background: rgba(66, 133, 244, 0.25);
  border-color: rgba(66, 133, 244, 0.6);
}

.navBtn--google .navBtn__text {
  color: #4285f4;
}

.iconBtn {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.24);
  color: $text;
  cursor: pointer;

  @media (max-width: 768px) {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    font-size: 14px;
  }
}
.iconBtn:hover {
  border-color: rgba($orange, 0.35);
  box-shadow: 0 10px 24px rgba($orange, 0.12);
}

// .iconBtn--minimize {
//   margin-right: 50px;
// }

.cancelJobBtn {
  padding: 8px 16px;
  border-radius: 12px;
  border: 1px solid rgba(239, 68, 68, 0.4);
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  cursor: pointer;
  font-size: 13px;
  font-weight: 900;
  transition: all 0.2s ease;
  white-space: nowrap;

  @media (max-width: 768px) {
    padding: 6px 10px;
    font-size: 10px;
    border-radius: 10px;
  }
}

.cancelJobBtn:hover {
  background: rgba(239, 68, 68, 0.25);
  border-color: rgba(239, 68, 68, 0.6);
  transform: translateY(-1px);
}

.cancelConfirmModal {
  position: fixed;
  inset: 0;
  z-index: 100002;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Heebo", sans-serif;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
}

.cancelConfirmModal__content {
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

.cancelConfirmModal__title {
  font-size: 22px;
  font-weight: 900;
  color: #fff;
  margin: 0 0 16px 0;
}

.cancelConfirmModal__message {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 24px 0;
  line-height: 1.5;
}

.cancelConfirmModal__actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.cancelConfirmModal__btn {
  padding: 12px 24px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  font-weight: 900;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: "Heebo", sans-serif;
  min-width: 100px;
}

.cancelConfirmModal__btn--no {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.9);
  border-color: rgba(255, 255, 255, 0.2);
}

.cancelConfirmModal__btn--no:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.cancelConfirmModal__btn--yes {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.4);
}

.cancelConfirmModal__btn--yes:hover {
  background: rgba(239, 68, 68, 0.3);
  border-color: rgba(239, 68, 68, 0.6);
  transform: translateY(-1px);
}

.cancelConfirmModal__btn:active {
  transform: translateY(0);
}

// Onboarding Modal Styles
.onboardingModal {
  position: fixed;
  inset: 0;
  z-index: 100002;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Heebo", sans-serif;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
}

.onboardingModal__content {
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
  position: relative;

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
  font-family: "Heebo", sans-serif;
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

.statusPill {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.2);
  color: $text;
  font-size: 12px;
  font-weight: 1000;

  @media (max-width: 768px) {
    padding: 6px 8px;
    font-size: 10px;
    gap: 6px;
  }
}
.statusPill__dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.3);
  box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.06);
}
.statusPill--new {
  border-color: rgba($orange, 0.3);
}
.statusPill--new .statusPill__dot {
  background: $orange;
  box-shadow: 0 0 0 4px rgba($orange, 0.12);
}
.statusPill--move {
  border-color: rgba($orange2, 0.38);
}
.statusPill--move .statusPill__dot {
  background: $orange2;
  box-shadow: 0 0 0 4px rgba($orange2, 0.12);
}
.statusPill--work {
  border-color: rgba(59, 130, 246, 0.45);
}
.statusPill--work .statusPill__dot {
  background: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
}
.statusPill--done {
  border-color: rgba(16, 185, 129, 0.5);
}
.statusPill--done .statusPill__dot {
  background: #10b981;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.12);
}

.luxGrid {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 340px 1fr;
}
@media (max-width: 980px) {
  .luxGrid {
    grid-template-columns: 1fr;
  }
  .sideCard {
    display: none;
  }
}

.sideCard {
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.18), rgba(0, 0, 0, 0.34));
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
}
.sideCard__hero {
  border-radius: 18px;
  padding: 14px 14px;
  background: radial-gradient(
      500px 220px at 30% 0%,
      rgba($orange, 0.18),
      transparent 55%
    ),
    rgba(255, 255, 255, 0.06);
  border: 1px solid rgba($orange, 0.16);
}
.sideCard__badge {
  display: inline-flex;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 1000;
  color: #0b0c10;
  background: linear-gradient(135deg, $orange, $orange2);
}
.sideCard__headline {
  margin-top: 10px;
  font-size: 16px;
  font-weight: 1100;
  color: $text;
}
.sideCard__desc {
  margin-top: 6px;
  font-size: 12px;
  font-weight: 800;
  color: $muted;
}
.sideCard__body {
  border-radius: 18px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: auto;
}
.infoRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
}
.infoRow__k {
  color: rgba(255, 255, 255, 0.55);
  font-weight: 900;
  font-size: 12px;
}
.infoRow__v {
  color: $text;
  font-weight: 1000;
  font-size: 12px;
}
.money {
  color: $orange;
}
.divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 10px 0 12px;
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.tlItem {
  display: flex;
  gap: 10px;
}
.tlItem__rail {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.tlItem__node {
  width: 30px;
  height: 30px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.7);
  font-weight: 1000;
}
.tlItem__line {
  width: 2px;
  flex: 1;
  background: rgba(255, 255, 255, 0.08);
  margin-top: 6px;
  border-radius: 10px;
}
.tlItem__txt {
  padding-top: 2px;
}
.tlItem__label {
  color: $text;
  font-weight: 1000;
  font-size: 12px;
}
.tlItem__hint {
  margin-top: 3px;
  color: rgba(255, 255, 255, 0.55);
  font-weight: 800;
  font-size: 11px;
}
.tlItem.is-active .tlItem__node {
  background: linear-gradient(135deg, $orange, $orange2);
  border-color: rgba($orange, 0.55);
  color: #0b0c10;
  box-shadow: 0 0 16px rgba($orange, 0.25);
}
.tlItem.is-done .tlItem__node {
  background: linear-gradient(135deg, #10b981, #059669);
  border-color: rgba(16, 185, 129, 0.55);
  color: #fff;
}

.segWrap {
  margin-top: auto;
  border-radius: 18px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.seg {
  display: flex;
  gap: 10px;
}
.seg__btn {
  flex: 1;
  padding: 15px 30px;
  border-radius: 30px;
  border: 2px solid rgba($orange, 0.25);
  background-color: rgba(0, 0, 0, 0.28);
  color: $text;
  font-size: 1.1rem;
  font-weight: 1100;
  cursor: pointer;
  transition: all 0.4s ease;
  outline: none;
  position: relative;
  overflow: hidden;

  @media (max-width: 768px) {
    padding: 12px 16px;
    font-size: 0.9rem;
    border-radius: 20px;
    border-width: 1.5px;
  }
}

.seg__btn::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(
    circle,
    rgba($orange, 0.25) 0%,
    rgba($orange, 0) 70%
  );
  transform: scale(0);
  transition: transform 0.5s ease;
}

.seg__btn:hover::after {
  transform: scale(4);
}

.seg__btn:hover {
  border-color: rgba($orange, 0.5);
  background: rgba($orange, 0.08);
}

.seg__btn.is-on {
  border-color: rgba($orange, 0.6);
  background: linear-gradient(135deg, rgba($orange, 0.2), rgba($orange2, 0.15));
  color: rgba(255, 255, 255, 0.98);
  box-shadow: 0 4px 16px rgba($orange, 0.3);
}

.seg__btn.is-on::after {
  background: radial-gradient(
    circle,
    rgba($orange2, 0.3) 0%,
    rgba($orange, 0) 70%
  );
}

.seg__btn--full {
  width: 100%;
  flex: none;
}

.seg__btn--nav {
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.segTip {
  margin-top: 10px;
  font-size: 11px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.55);

  @media (max-width: 768px) {
    font-size: 9px;
    margin-top: 6px;
  }
}

/* Chat Panel */
.chatPanel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  position: relative;
}

.onboardingCard {
  background: rgba(14, 14, 18, 0.95);
  border: 2px solid rgba(249, 115, 22, 0.3);
  border-radius: 20px;
  padding: 24px;
  margin: 14px;
  text-align: center;
}

.onboardingCard__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.onboardingCard__icon {
  font-size: 40px;
  margin-bottom: 4px;
}

.onboardingCard__title {
  font-size: 18px;
  font-weight: 700;
  color: $text;
  margin-bottom: 4px;
}

.onboardingCard__message {
  font-size: 14px;
  color: rgba($text, 0.7);
  line-height: 1.5;
  margin-bottom: 4px;
}

.onboardingCard__btn {
  background: linear-gradient(135deg, $orange 0%, darken($orange, 10%) 100%);
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 700;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 4px;
  min-width: 200px;
}

.onboardingCard__btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba($orange, 0.4);
}

.onboardingCard__btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.approvalCard {
  background: rgba(14, 14, 18, 0.95);
  border: 2px solid rgba(249, 115, 22, 0.3);
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 24px;
  text-align: center;
}

.approvalCard__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.approvalCard__icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.approvalCard__title {
  font-size: 22px;
  font-weight: 700;
  color: $text;
  margin-bottom: 8px;
}

.approvalCard__message {
  font-size: 16px;
  color: rgba($text, 0.7);
  line-height: 1.6;
  margin-bottom: 8px;
}

.approvalCard__warning {
  font-size: 15px;
  color: rgba(255, 193, 7, 0.95);
  line-height: 1.6;
  margin-bottom: 12px;
  padding: 12px 16px;
  background: rgba(255, 193, 7, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(255, 193, 7, 0.3);
  font-weight: 500;
}

.approvalCard__btn {
  background: linear-gradient(135deg, $orange 0%, darken($orange, 10%) 100%);
  border: none;
  border-radius: 14px;
  padding: 16px 32px;
  font-size: 16px;
  font-weight: 700;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 8px;
  min-width: 240px;
}

.approvalCard__btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba($orange, 0.4);
}

.approvalCard__btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.rateCard {
  margin: 14px 14px 0 14px;
  padding: 14px;
  border-radius: 18px;
  background: radial-gradient(
      700px 260px at 50% 0%,
      rgba($orange, 0.16),
      transparent 60%
    ),
    rgba(255, 255, 255, 0.06);
  border: 1px solid rgba($orange, 0.16);

  @media (max-width: 768px) {
    margin: 10px 10px 0 10px;
    padding: 12px;
    border-radius: 14px;
  }
}
.rateCard__title {
  color: $orange;
  font-weight: 1100;
  font-size: 14px;

  @media (max-width: 768px) {
    font-size: 12px;
  }
}
.rating {
  display: flex;
  flex-direction: row-reverse;
  gap: 0.3rem;
  justify-content: center;
  margin: 10px 0;
  transform-style: preserve-3d;
  perspective: 1000px;
}

.rating input {
  display: none;
}

.rating label .svgOne {
  stroke: rgba(255, 255, 255, 0.3);
  fill: rgba(255, 106, 0, 0);
  transition: stroke 0.5s ease, fill 0.5s ease;
  color: rgba(255, 255, 255, 0.3);
}

.rating label .svgTwo {
  position: absolute;
  top: -1px;
  fill: $orange;
  stroke: rgba(255, 106, 0, 0);
  opacity: 0;
  transition: stroke 0.5s ease, fill 0.5s ease, opacity 0.5s ease;
  color: $orange;
}

.rating label {
  position: relative;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 3px;
  transition: all 0.5s ease;
}

/* כוכבים שנבחרו או שעליהם עוברים */
.rating label:hover .svgOne {
  stroke: $orange;
  color: $orange;
}

/* כשנבחר כוכב, כל הכוכבים עד הכוכב שנבחר (כולל) נצבעים */
.rating input:checked ~ label .svgOne {
  stroke: rgba(255, 106, 0, 0);
  color: rgba(255, 106, 0, 0);
}

.rating label .svgTwo.is-filled {
  transform: rotateX(0deg) rotateY(0deg) translateY(0px);
  opacity: 1;
  animation: displayStar 0.5s cubic-bezier(0.75, 0.41, 0.82, 1.2);
}

.rating label .ombre.is-visible {
  opacity: 1;
}

@keyframes displayStar {
  0% {
    transform: rotateX(100deg) rotateY(100deg) translateY(10px);
  }
  100% {
    transform: rotateX(0deg) rotateY(0deg) translateY(0px);
  }
}

.ombre {
  background: radial-gradient(
    ellipse closest-side,
    rgba($orange, 0.4),
    rgba(255, 106, 0, 0)
  );
  width: 30px;
  height: 8px;
  opacity: 0;
  transition: opacity 0.6s ease 0.2s;
}

/* כוכבים שנבחרו או שעליהם עוברים */
.rating label:hover .ombre,
.rating label:hover ~ label .ombre {
  opacity: 0.3;
}

.rating input:checked ~ label .ombre {
  opacity: 1;
}

/* אנימציה של רעד רק ב-hover */
.rating label:hover .svgTwo:hover {
  animation: chackStar 0.6s ease-out, displayStar none 1s;
}

@keyframes chackStar {
  0% {
    transform: rotate(0deg);
  }
  20% {
    transform: rotate(-20deg);
  }
  50% {
    transform: rotate(20deg);
  }
  80% {
    transform: rotate(-20deg);
  }
  100% {
    transform: rotate(0deg);
  }
}
.rateCard__txt {
  width: 100%;
  border-radius: 16px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba(0, 0, 0, 0.16);
  color: $text;
  padding: 12px 12px;
  font-weight: 800;
  outline: none;
  resize: vertical;
}
.cta {
  margin-top: 10px;
  width: 100%;
  position: relative;
  height: 3.5em;
  border: 3px ridge $orange;
  outline: none;
  background-color: transparent;
  color: $text;
  transition: 1s;
  border-radius: 0.3em;
  font-size: 16px;
  font-weight: 1100;
  cursor: pointer;
}

.cta::after {
  content: "";
  position: absolute;
  top: -10px;
  left: 3%;
  width: 95%;
  height: 40%;
  background-color: $bg;
  transition: 0.5s;
  transform-origin: center;
}

.cta::before {
  content: "";
  transform-origin: center;
  position: absolute;
  top: 80%;
  left: 3%;
  width: 95%;
  height: 40%;
  background-color: $bg;
  transition: 0.5s;
}

.cta:hover::before,
.cta:hover::after {
  transform: scale(0);
}

.cta:hover {
  box-shadow: inset 0px 0px 25px $orange;
}

.msgs {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 16px 16px 8px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  @media (max-width: 768px) {
    padding: 12px 10px 8px 10px;
    gap: 10px;
  }
}
.empty {
  margin: auto;
  color: rgba(255, 255, 255, 0.55);
  font-weight: 900;
}

.msgRow {
  display: flex;
  justify-content: flex-start;
}

.bubble {
  max-width: 70%;
  padding: 12px 12px 10px 12px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.06);
  color: $text;

  @media (max-width: 768px) {
    max-width: 85%;
    padding: 10px 10px 8px 10px;
    border-radius: 16px;
  }
}
.msgRow.is-me .bubble {
  background: linear-gradient(
    135deg,
    rgba($orange, 0.95),
    rgba($orange2, 0.92)
  );
  border-color: rgba($orange, 0.55);
  color: #0b0c10;
}
.msgRow.is-other .bubble {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
  color: $text;
}
.bubble__text {
  font-size: 14px;
  font-weight: 750;
  line-height: 1.55;

  @media (max-width: 768px) {
    font-size: 13px;
    line-height: 1.5;
  }
}
.bubble__meta {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
}
.bubble__time {
  font-size: 10px;
  font-weight: 1000;
  opacity: 0.65;
}
.bubble__tick {
  font-size: 10px;
  font-weight: 1100;
  opacity: 0.75;
}

.bubble__imgBtn {
  border: 0;
  background: transparent;
  padding: 0;
  margin-bottom: 8px;
  cursor: pointer;
  width: 100%;
  display: block;
}
.bubble__img {
  width: 100%;
  max-width: 380px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  display: block;

  @media (max-width: 768px) {
    max-width: 100%;
    border-radius: 12px;
  }
}

.bubble__location {
  margin-bottom: 8px;
  width: 100%;
  max-width: 100% !important;
  min-width: 350px;

  @media (max-width: 768px) {
    min-width: 100%;
    max-width: 100% !important;
  }
}

.bubble--location {
  max-width: 85% !important;
  padding-bottom: 0;

  @media (max-width: 768px) {
    max-width: 95% !important;
  }
}

.bubble__locationPreview {
  position: relative;
  width: 100%;
  border: 0;
  background: transparent;
  padding: 0;
  cursor: pointer;
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.2s ease;
}

.bubble__locationPreview:hover {
  transform: scale(1.02);
}

.bubble__locationMap {
  width: 100%;
  height: 180px;
  object-fit: cover;
  display: block;
  border-radius: 12px;
  border: 1px solid rgba($orange, 0.2);

  @media (max-width: 768px) {
    height: 150px;
    border-radius: 10px;
  }
}

.bubble__locationOverlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.7) 0%,
    rgba(0, 0, 0, 0.4) 50%,
    transparent 100%
  );
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  pointer-events: none; /* Allow clicks to pass through */
}

.bubble__locationIcon {
  font-size: 18px;
}

.bubble__locationText {
  font-size: 14px;
  font-weight: 900;
  color: white;
}

/* Location Modal (WhatsApp style) */
.locationModal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100002;
  padding: 16px;
  animation: fadeIn 0.2s ease;
}

.locationModal__card {
  background: $bg;
  border-radius: 20px;
  width: 100%;
  max-width: 400px;
  overflow: hidden;
  position: relative;
  animation: slideUp 0.3s ease;
}

.locationModal__x {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 900;
  z-index: 10;
  transition: background 0.2s ease;
}

.locationModal__x:hover {
  background: rgba(0, 0, 0, 0.8);
}

.locationModal__map {
  width: 100%;
  height: 250px;
  position: relative;
}

.locationModal__mapImg {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.locationModal__content {
  padding: 16px;
}

.locationModal__header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.locationModal__icon {
  font-size: 22px;
}

.locationModal__title {
  font-size: 16px;
  font-weight: 1000;
  color: $orange2;
}

.locationModal__coords {
  font-size: 11px;
  font-weight: 700;
  opacity: 0.7;
  font-family: monospace;
  margin-bottom: 16px;
  word-break: break-all;
}

.locationModal__actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.locationModal__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 900;
  text-decoration: none;
  transition: all 0.2s ease;
  border: 1px solid;
}

.locationModal__btn--waze {
  background: rgba(118, 186, 153, 0.15);
  border-color: rgba(118, 186, 153, 0.4);
  color: #76ba99;
}

.locationModal__btn--waze:hover {
  background: rgba(118, 186, 153, 0.25);
  border-color: rgba(118, 186, 153, 0.6);
  transform: translateY(-1px);
}

.locationModal__btn--google {
  background: rgba(66, 133, 244, 0.15);
  border-color: rgba(66, 133, 244, 0.4);
  color: #4285f4;
}

.locationModal__btn--google:hover {
  background: rgba(66, 133, 244, 0.25);
  border-color: rgba(66, 133, 244, 0.6);
  transform: translateY(-1px);
}

.locationModal__btnIcon {
  font-size: 18px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Composer */
.composer {
  position: sticky;
  bottom: 0;
  padding: 12px 12px;
  border-top: 1px solid rgba($orange, 0.14);
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  gap: 10px;
  align-items: center;

  @media (max-width: 768px) {
    padding: 10px 8px;
    gap: 6px;
    padding-bottom: calc(10px + env(safe-area-inset-bottom));
  }
}
.pillBtn {
  width: 46px;
  height: 46px;
  border-radius: 16px;
  border: 1px solid rgba($orange, 0.22);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  cursor: pointer;

  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
    border-radius: 12px;
  }
}
.pillBtn:hover {
  border-color: rgba($orange, 0.42);
  background: rgba($orange, 0.1);
}
.pillBtn__plus {
  font-size: 22px;
  font-weight: 1100;

  @media (max-width: 768px) {
    font-size: 18px;
  }
}

.tools {
  position: absolute;
  bottom: 70px;
  right: 12px;
  display: flex;
  gap: 10px;
  padding: 10px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(15, 16, 20, 0.92);
  box-shadow: 0 18px 46px rgba(0, 0, 0, 0.55);

  @media (max-width: 768px) {
    bottom: 60px;
    right: 8px;
    gap: 6px;
    padding: 8px;
    border-radius: 14px;
  }
}
.tool {
  width: 96px;
  border-radius: 16px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  cursor: pointer;
  padding: 10px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  font-weight: 1000;

  @media (max-width: 768px) {
    width: 70px;
    padding: 8px 6px;
    border-radius: 12px;
    gap: 4px;
  }
}
.tool:hover {
  border-color: rgba($orange, 0.45);
  box-shadow: 0 10px 22px rgba($orange, 0.1);
}
.tool__ic {
  font-size: 18px;

  @media (max-width: 768px) {
    font-size: 16px;
  }
}
.tool__t {
  font-size: 11px;
  opacity: 0.9;

  @media (max-width: 768px) {
    font-size: 9px;
  }
}

.composer__input {
  flex: 1;
  height: 46px;
  border-radius: 999px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  padding: 0 16px;
  font-weight: 900;
  outline: none;
  font-size: 15px;

  @media (max-width: 768px) {
    height: 40px;
    padding: 0 12px;
    font-size: 16px; // Prevent iOS zoom
  }
}
.composer__input:focus {
  border-color: rgba($orange, 0.45);
  box-shadow: 0 0 0 3px rgba($orange, 0.18);
}

.sendCta {
  height: 46px;
  padding: 0 18px;
  border-radius: 999px;
  border: 1px solid rgba($orange, 0.55);
  background: linear-gradient(135deg, $orange, $orange2);
  color: #0b0c10;
  font-weight: 1100;
  cursor: pointer;
  font-size: 14px;

  @media (max-width: 768px) {
    height: 40px;
    padding: 0 14px;
    font-size: 12px;
  }
}
.sendCta:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* Image Preview (WhatsApp style) */
.imagePreview {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}

.imagePreview__preview {
  position: relative;
  width: 100%;
  max-width: 200px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba($orange, 0.2);
}

.imagePreview__img {
  width: 100%;
  height: auto;
  display: block;
  max-height: 200px;
  object-fit: cover;
}

.imagePreview__close {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 900;
  transition: background 0.2s ease;
}

.imagePreview__close:hover {
  background: rgba(0, 0, 0, 0.8);
}

.imagePreview__input {
  margin-top: 0;
}

/* Modal */
.imgModal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: grid;
  place-items: center;
  padding: 18px;
  z-index: 9999;
}
.imgModal__card {
  width: min(980px, 96vw);
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid rgba($orange, 0.2);
  background: rgba(14, 14, 18, 0.92);
  position: relative;
}
.imgModal__x {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.35);
  color: $text;
  cursor: pointer;
  font-weight: 1100;
}
.imgModal__img {
  width: 100%;
  height: auto;
  display: block;
}

/* Price Change Modal */
.priceChangeModal {
  position: fixed;
  inset: 0;
  z-index: 100002;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Heebo", sans-serif;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
}

.priceChangeModal__content {
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
  position: relative;
}

.priceChangeModal__close {
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
}

.priceChangeModal__close:hover {
  color: rgba(255, 255, 255, 0.9);
}

.priceChangeModal__title {
  font-size: 22px;
  font-weight: 900;
  color: #fff;
  margin: 0 0 16px 0;
}

.priceChangeModal__message {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 8px 0;
}

.priceChangeModal__hint {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 24px 0;
}

.priceChangeModal__inputGroup {
  margin: 24px 0;
  text-align: right;
}

.priceChangeModal__label {
  display: block;
  font-size: 14px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 8px;
}

.priceChangeModal__input {
  width: 100%;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  font-size: 16px;
  font-weight: 900;
  outline: none;
  transition: all 0.2s;
}

.priceChangeModal__input:focus {
  border-color: rgba($orange, 0.45);
  box-shadow: 0 0 0 3px rgba($orange, 0.18);
}

.priceChangeModal__changeInfo {
  margin-top: 12px;
  font-size: 14px;
  font-weight: 800;
}

.priceChangeModal__increase {
  color: #10b981;
}

.priceChangeModal__decrease {
  color: #ef4444;
}

.priceChangeModal__noChange {
  color: rgba(255, 255, 255, 0.6);
}

.priceChangeModal__actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 24px;
}

.priceChangeModal__btn {
  padding: 12px 24px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  font-weight: 900;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: "Heebo", sans-serif;
  min-width: 100px;
}

.priceChangeModal__btn--cancel {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.9);
  border-color: rgba(255, 255, 255, 0.2);
}

.priceChangeModal__btn--cancel:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
}

.priceChangeModal__btn--submit {
  background: linear-gradient(
    135deg,
    rgba($orange, 0.95),
    rgba($orange2, 0.92)
  );
  color: #0b0c10;
  border-color: rgba($orange, 0.55);
}

.priceChangeModal__btn--submit:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba($orange, 1), rgba($orange2, 1));
  box-shadow: 0 4px 16px rgba($orange, 0.3);
}

.priceChangeModal__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Price Change Request Modal (for client) */
.priceChangeRequestModal {
  position: fixed;
  inset: 0;
  z-index: 100002;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Heebo", sans-serif;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
}

.priceChangeRequestModal__content {
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
}

.priceChangeRequestModal__title {
  font-size: 22px;
  font-weight: 900;
  color: #fff;
  margin: 0 0 16px 0;
}

.priceChangeRequestModal__message {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 24px 0;
}

.priceChangeRequestModal__priceInfo {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  margin: 24px 0;
  text-align: right;
}

.priceChangeRequestModal__priceRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.priceChangeRequestModal__priceRow--change {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 8px;
  padding-top: 12px;
  font-weight: 900;
}

.priceChangeRequestModal__priceRow .increase {
  color: #10b981;
}

.priceChangeRequestModal__priceRow .decrease {
  color: #ef4444;
}

.priceChangeRequestModal__actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 24px;
}

.priceChangeRequestModal__btn {
  padding: 12px 24px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  font-weight: 900;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: "Heebo", sans-serif;
  min-width: 100px;
}

.priceChangeRequestModal__btn--reject {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.4);
}

.priceChangeRequestModal__btn--reject:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.3);
  border-color: rgba(239, 68, 68, 0.6);
}

.priceChangeRequestModal__btn--accept {
  background: linear-gradient(
    135deg,
    rgba($orange, 0.95),
    rgba($orange2, 0.92)
  );
  color: #0b0c10;
  border-color: rgba($orange, 0.55);
}

.priceChangeRequestModal__btn--accept:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba($orange, 1), rgba($orange2, 1));
  box-shadow: 0 4px 16px rgba($orange, 0.3);
}

.priceChangeRequestModal__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cancelConfirmModal__actions--vertical {
  flex-direction: column;
}

.cancelConfirmModal__btn--cancel-handyman {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
  border-color: rgba(59, 130, 246, 0.4);
}

.cancelConfirmModal__btn--cancel-handyman:hover {
  background: rgba(59, 130, 246, 0.3);
  border-color: rgba(59, 130, 246, 0.6);
}

.cancelConfirmModal__btn--cancel-complete {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.4);
}

.cancelConfirmModal__btn--cancel-complete:hover {
  background: rgba(239, 68, 68, 0.3);
  border-color: rgba(239, 68, 68, 0.6);
}

/* Cancel Reason Modal */
.cancelReasonModal {
  position: fixed;
  inset: 0;
  z-index: 100003;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Heebo", sans-serif;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
}

.cancelReasonModal__content {
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.95),
    rgba(15, 16, 22, 0.98)
  );
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 24px;
  max-width: 500px;
  width: calc(100% - 40px);
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.cancelReasonModal__title {
  font-size: 20px;
  font-weight: 900;
  color: #fff;
  margin: 0;
  text-align: center;
}

.cancelReasonModal__form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.cancelReasonModal__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  min-width: 0;
  overflow: hidden;
}

.cancelReasonModal__label {
  font-size: 14px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.9);
  text-align: right;
}

.cancelReasonModal__message {
  font-size: 16px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
  padding: 20px 0;
  line-height: 1.5;
}

.cancelReasonModal__textarea {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  padding: 12px;
  border-radius: 12px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.9);
  font-weight: 800;
  font-size: 14px;
  font-family: "Heebo", sans-serif;
  resize: vertical;
  min-height: 100px;
  text-align: right;
  direction: rtl;
  transition: all 0.2s ease;
  overflow-wrap: break-word;
  word-wrap: break-word;
  word-break: break-word;
  overflow-x: hidden;
  white-space: pre-wrap;
}

.cancelReasonModal__textarea:focus {
  outline: none;
  border-color: rgba(255, 106, 0, 0.4);
  background: rgba(255, 255, 255, 0.08);
}

.cancelReasonModal__textarea::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.cancelReasonModal__options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cancelReasonModal__option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.9);
  font-weight: 800;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: right;
  position: relative;
}

.cancelReasonModal__option:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateX(-2px);
}

.cancelReasonModal__option:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cancelReasonModal__option--selected {
  background: rgba(255, 106, 0, 0.25);
  border-color: #ff6a00;
  border-width: 3px;
  color: #ff6a00;
  box-shadow: 0 0 0 2px rgba(255, 106, 0, 0.2),
    0 4px 12px rgba(255, 106, 0, 0.3);
  transform: scale(1.02);
  font-weight: 900;
}

.cancelReasonModal__option--delete {
  border-color: rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.cancelReasonModal__option--delete:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.5);
}

.cancelReasonModal__option--delete.cancelReasonModal__option--selected {
  background: rgba(239, 68, 68, 0.3);
  border-color: #ef4444;
  border-width: 3px;
  color: #ef4444;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2),
    0 4px 12px rgba(239, 68, 68, 0.4);
  transform: scale(1.02);
  font-weight: 900;
}

.cancelReasonModal__optionIcon {
  font-size: 20px;
  flex-shrink: 0;
}

.cancelReasonModal__optionText {
  flex: 1;
  text-align: right;
}

.cancelReasonModal__checkIcon {
  font-size: 18px;
  font-weight: 900;
  color: inherit;
  margin-right: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  flex-shrink: 0;
}

.cancelReasonModal__warning {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: rgba(255, 193, 7, 0.15);
  border: 2px solid rgba(255, 193, 7, 0.4);
  border-radius: 12px;
  margin-bottom: 8px;
}

.cancelReasonModal__warningIcon {
  font-size: 20px;
  flex-shrink: 0;
}

.cancelReasonModal__warningText {
  font-size: 13px;
  font-weight: 800;
  color: #ffc107;
  text-align: right;
  flex: 1;
  line-height: 1.4;
}

.cancelReasonModal__actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.cancelReasonModal__btn {
  flex: 1;
  padding: 14px 20px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  font-weight: 900;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: "Heebo", sans-serif;
}

.cancelReasonModal__btn--cancel {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.9);
  border-color: rgba(255, 255, 255, 0.2);
}

.cancelReasonModal__btn--cancel:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
}

.cancelReasonModal__btn--submit {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: #fff;
  border-color: rgba(239, 68, 68, 0.5);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.cancelReasonModal__btn--submit:hover:not(:disabled) {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
  transform: translateY(-1px);
}

.cancelReasonModal__btn--submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.seg__btn--price {
  background: linear-gradient(135deg, rgba($orange, 0.2), rgba($orange2, 0.15));
  border-color: rgba($orange, 0.4);
  color: $orange;
}

.seg__btn--price:hover {
  background: linear-gradient(135deg, rgba($orange, 0.3), rgba($orange2, 0.25));
  border-color: rgba($orange, 0.6);
}

/* Image Gallery Modal */
.image-gallery-modal {
  z-index: 10200;
  background: rgba(0, 0, 0, 0.95);
}

.image-gallery {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #000;
  position: relative;
}

.image-gallery__header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0));
  z-index: 10;
}

.image-gallery__close {
  padding: 10px 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-weight: 900;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.image-gallery__close:active {
  background: rgba(0, 0, 0, 0.8);
  transform: scale(0.95);
}

.image-gallery__counter {
  padding: 8px 16px;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-weight: 900;
  font-size: 14px;
}

.image-gallery__container {
  flex: 1;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: pan-y;
}

.image-gallery__track {
  display: flex;
  width: 100%;
  height: 100%;
  transition: transform 0.3s ease;
}

.image-gallery__slide {
  min-width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 16px 100px;
}

.image-gallery__image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}

.image-gallery__controls {
  position: absolute;
  bottom: 80px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  z-index: 10;
}

.image-gallery__navBtn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 24px;
  font-weight: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.image-gallery__navBtn:active:not(:disabled) {
  background: rgba(0, 0, 0, 0.8);
  transform: scale(0.9);
}

.image-gallery__navBtn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.image-gallery__dots {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 24px;
  z-index: 10;
}

.image-gallery__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
}

.image-gallery__dot--active {
  background: #ff6a00;
  width: 24px;
  border-radius: 4px;
}

.navBtn--images {
  background: rgba(255, 106, 0, 0.15);
  border-color: rgba(255, 106, 0, 0.3);
  color: #ff8a2b;
}

@media (max-width: 768px) {
  .image-gallery__slide {
    padding: 80px 8px 120px;
  }

  .image-gallery__navBtn {
    width: 44px;
    height: 44px;
    font-size: 20px;
  }

  .image-gallery__controls {
    bottom: 100px;
    padding: 0 8px;
  }

  .image-gallery__dots {
    bottom: 16px;
    padding: 10px 12px;
    gap: 6px;
  }

  .image-gallery__dot {
    width: 6px;
    height: 6px;
  }

  .image-gallery__dot--active {
    width: 20px;
  }
}
</style>
