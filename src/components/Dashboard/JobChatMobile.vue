<template>
  <section class="chat" dir="rtl">
    <!-- Header -->
    <header class="chat__header">
      <button
        class="chat__iconBtn"
        type="button"
        @click="$emit('minimize')"
        aria-label="חזור"
      >
        ←
      </button>

      <div class="chat__headInfo">
        <div class="chat__title">
          {{ isHandyman ? clientName : getHandymanName() }}
        </div>
        <div class="chat__subtitle">
          {{ getJobDisplayName(jobInfo) }}
        </div>
      </div>

      <div class="chat__headRight">
        <span class="chat__status" :class="'status--' + chipTone">{{
          statusLabel
        }}</span>

        <!-- View Images Button (for handyman only) -->
        <button
          v-if="isHandyman"
          class="chat__iconBtn chat__iconBtn--images"
          type="button"
          @click.stop="handleViewImages"
          aria-label="עיון בתמונות"
          title="עיון בתמונות"
          :disabled="!hasJobImages"
        >
          📷
        </button>

        <button
          class="chat__iconBtn"
          type="button"
          @click="showMenu = !showMenu"
          aria-label="תפריט"
        >
          ⋯
        </button>
      </div>

      <!-- Menu -->
      <div v-if="showMenu" class="chat__menu" @click.self="showMenu = false">
        <button
          class="chat__menuItem chat__menuItem--danger"
          type="button"
          @click="openCancel()"
        >
          ביטול עבודה
        </button>
        <button class="chat__menuItem" type="button" @click="showMenu = false">
          סגור
        </button>
      </div>
    </header>

    <!-- Tabs (if multiple jobs) -->
    <div v-if="jobs && jobs.length > 1" class="chat__tabs">
      <button
        v-for="(jobItem, index) in jobs"
        :key="jobItem._id || jobItem.id || index"
        class="chat__tab"
        :class="{ 'chat__tab--active': currentJobIndex === index }"
        type="button"
        @click="switchToJob(index)"
      >
        <span class="chat__tabName">
          {{ isHandyman ? jobItem.clientName : getHandymanNameForJob(jobItem) }}
        </span>
        <span v-if="getUnreadCount(jobItem) > 0" class="chat__tabBadge">
          {{ getUnreadCount(jobItem) }}
        </span>
      </button>
    </div>

    <!-- Action bar (one line, scrollable) -->
    <div v-if="showActionBar" class="chat__actions">
      <!-- Handyman: navigation button -->
      <button
        v-if="isHandyman && jobLocation"
        class="chip chip--ghost"
        type="button"
        @click.stop="showNavModal = true"
      >
        🗺️ ניווט
      </button>

      <!-- Handyman: one smart status button instead of 3 blocks -->
      <div v-if="isHandyman && nextStatus" class="status-update-wrapper">
        <button
          class="chip status-update-btn"
          :class="getStatusButtonClass(nextStatus)"
          type="button"
          @click="updateStatus(nextStatus)"
        >
          <span class="status-update-label-inline">עדכון סטטוס ללקוח:</span>
          {{ nextStatusLabel }}
        </button>
      </div>

      <!-- Handyman: price update button -->
      <button
        v-if="isHandyman && showPriceUpdateButton"
        class="chip chip--ghost"
        type="button"
        @click.stop="showPriceUpdateModal = true"
      >
        💰 עדכן מחיר
      </button>

      <!-- Client: location buttons -->
      <template v-if="!isHandyman && showStatusButtons">
        <button class="chip chip--primary" type="button" @click="sendLocation">
          📍 שלח מיקום
        </button>
        <!-- Show "Handyman in real-time" only when handyman is on the way or in progress -->
        <button
          v-if="jobStatus === 'on_the_way' || jobStatus === 'in_progress'"
          class="chip chip--ghost"
          type="button"
          @click.stop="openHandymanRealtimeLocation"
        >
          🗺️ הנדימן בזמן אמת
        </button>
      </template>
    </div>

    <!-- Compact stepper - hidden on mobile -->
    <div class="chat__stepper chat__stepper--desktop">
      <div
        v-for="(step, i) in jobSteps"
        :key="step.status"
        class="step"
        :class="{
          'is-active': isStepActive(step.status),
          'is-done': isStepCompleted(step.status),
        }"
      >
        <div class="step__dot">
          <span v-if="isStepCompleted(step.status)">✓</span>
          <span v-else>{{ i + 1 }}</span>
        </div>
        <div class="step__label">{{ step.label }}</div>
      </div>
    </div>

    <!-- Messages -->
    <div class="chat__messages" ref="messagesContainer">
      <div v-if="!messages.length" class="chat__empty">
        עדיין אין הודעות. תתחילו 🙂
      </div>

      <div
        v-for="(m, i) in messages"
        :key="i"
        class="msg"
        :class="{
          'is-me': m.sender === 'me',
          'is-system': m.sender === 'system' || m.isSystem,
        }"
      >
        <div
          class="bubble"
          :class="{
            'bubble--me': m.sender === 'me',
            'bubble--system': m.sender === 'system' || m.isSystem,
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

          <button
            v-if="m.location"
            type="button"
            class="bubble__loc"
            @click.stop="openLocationModal(m.location)"
          >
            <img
              :src="getLocationMapImage(m.location)"
              class="bubble__locMap"
              alt="מיקום"
              @error="onMapImageError"
            />
            <div class="bubble__locOverlay">📍 מיקום</div>
          </button>

          <div v-if="m.text" class="bubble__text">{{ m.text }}</div>

          <div class="bubble__meta">
            <span class="bubble__time">{{ m.time }}</span>
            <span v-if="m.sender === 'me'" class="bubble__tick">✓✓</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Composer -->
    <div class="composer">
      <button
        class="composer__plus"
        type="button"
        @click="toggleTools"
        aria-label="כלים"
      >
        ＋
      </button>

      <div v-if="imagePreview" class="composer__preview">
        <div class="composer__previewTop">
          <img :src="imagePreview" class="composer__previewImg" alt="תמונה" />
          <button
            class="composer__previewClose"
            type="button"
            @click="cancelImagePreview"
            aria-label="ביטול"
          >
            ✕
          </button>
        </div>
        <input
          ref="imagePreviewTextInput"
          v-model="imagePreviewText"
          class="composer__input"
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
        class="composer__send"
        type="button"
        @click="imagePreview ? sendImageWithText() : sendMessage()"
        :disabled="!imagePreview && !newMessage.trim()"
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

    <!-- Tools bottom sheet -->
    <div v-if="showTools" class="toolsSheet" @click.self="showTools = false">
      <div class="toolsSheet__card">
        <button class="toolsSheet__item" type="button" @click="triggerFile">
          📷 תמונה
        </button>
        <button class="toolsSheet__item" type="button" @click="sendLocation">
          📍 מיקום
        </button>
        <button
          class="toolsSheet__item"
          type="button"
          @click="sendQuick('אני בדרך')"
        >
          🚗 אני בדרך
        </button>
        <button
          class="toolsSheet__item"
          type="button"
          @click="sendQuick('הגעתי')"
        >
          ✅ הגעתי
        </button>
        <button
          class="toolsSheet__close"
          type="button"
          @click="showTools = false"
        >
          סגור
        </button>
      </div>
    </div>

    <!-- Image modal -->
    <div v-if="imageModal" class="modal" @click.self="imageModal = null">
      <div class="modal__card">
        <button class="modal__close" type="button" @click="imageModal = null">
          ✕
        </button>
        <img :src="imageModal" class="modal__img" alt="preview" />
      </div>
    </div>

    <!-- Navigation modal -->
    <div
      v-if="showNavModal"
      class="modal"
      dir="rtl"
      @click.self="showNavModal = false"
    >
      <div class="navModal">
        <div class="navModal__title">איפה לפתוח את המיקום?</div>
        <div class="navModal__actions">
          <a
            :href="getWazeUrl(jobLocation)"
            target="_blank"
            rel="noopener noreferrer"
            class="navModal__btn navModal__btn--waze"
            @click="showNavModal = false"
          >
            <span class="navModal__btnIcon">📍</span>
            <span class="navModal__btnText">ווייז</span>
          </a>
          <a
            :href="getGoogleMapsUrl(jobLocation)"
            target="_blank"
            rel="noopener noreferrer"
            class="navModal__btn navModal__btn--google"
            @click="showNavModal = false"
          >
            <span class="navModal__btnIcon">🗺️</span>
            <span class="navModal__btnText">גוגל מפות</span>
          </a>
          <button
            class="navModal__cancel"
            type="button"
            @click="showNavModal = false"
          >
            ביטול
          </button>
        </div>
      </div>
    </div>

    <!-- Cancel Confirmation Modal (for handyman - simple yes/no) -->
    <div
      v-if="showCancelReasonModal && isHandyman"
      class="modal"
      dir="rtl"
      @click.self="showCancelReasonModal = false"
    >
      <div class="cancelReasonModal">
        <div class="cancelReasonModal__title">ביטול עבודה</div>
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
      class="modal"
      dir="rtl"
      @click.self="showCancelReasonModal = false"
    >
      <div class="cancelReasonModal">
        <div class="cancelReasonModal__title">ביטול עבודה</div>
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
            <button
              v-if="!isHandyman"
              class="cancelReasonModal__option cancelReasonModal__option--delete"
              :class="{
                'cancelReasonModal__option--selected':
                  cancelAction === 'delete' && cancelReasonText.trim(),
              }"
              type="button"
              @click="cancelAction = 'delete'"
              :disabled="!cancelReasonText.trim()"
            >
              <span class="cancelReasonModal__optionIcon">🗑️</span>
              <span class="cancelReasonModal__optionText">מחק עבודה</span>
              <span
                v-if="cancelAction === 'delete' && cancelReasonText.trim()"
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

    <!-- Location modal -->
    <div v-if="locationModal" class="modal" @click.self="locationModal = null">
      <div class="locCard">
        <button
          class="locCard__close"
          type="button"
          @click="locationModal = null"
        >
          ✕
        </button>

        <img
          :src="getLocationMapImage(locationModal)"
          class="locCard__map"
          alt="מיקום"
        />

        <div class="locCard__body">
          <div class="locCard__title">📍 מיקום</div>
          <div class="locCard__coords">{{ formatLocation(locationModal) }}</div>

          <a
            :href="getWazeUrl(locationModal)"
            target="_blank"
            rel="noopener noreferrer"
            class="locCard__btn locCard__btn--waze"
            >ווייז</a
          >

          <a
            :href="getGoogleMapsUrl(locationModal)"
            target="_blank"
            rel="noopener noreferrer"
            class="locCard__btn locCard__btn--gm"
            >גוגל מפות</a
          >
        </div>
      </div>
    </div>

    <!-- Price Update Modal (for handyman) -->
    <div
      v-if="showPriceUpdateModal"
      class="modal"
      dir="rtl"
      @click.self="showPriceUpdateModal = false"
    >
      <div class="priceUpdateModal">
        <div class="priceUpdateModal__header">
          <h3 class="priceUpdateModal__title">עדכון מחיר</h3>
          <button
            class="priceUpdateModal__close"
            type="button"
            @click="showPriceUpdateModal = false"
          >
            ✕
          </button>
        </div>
        <div class="priceUpdateModal__body">
          <!-- Subcategory Selection (if multiple subcategories) -->
          <div
            v-if="
              currentJob?.subcategoryInfo &&
              Array.isArray(currentJob.subcategoryInfo) &&
              currentJob.subcategoryInfo.length > 1
            "
            class="priceUpdateModal__subcategorySelect"
          >
            <label class="priceUpdateModal__label" for="subcategorySelect"
              >בחר עבודה:</label
            >
            <select
              id="subcategorySelect"
              v-model="selectedSubcategoryIndex"
              class="priceUpdateModal__select"
              @change="onSubcategoryChange"
            >
              <option :value="null">בחר עבודה</option>
              <option
                v-for="(subcat, index) in currentJob.subcategoryInfo"
                :key="index"
                :value="index"
              >
                {{ subcat.subcategory }} - {{ subcat.price }} ₪
              </option>
            </select>
          </div>
          <div class="priceUpdateModal__currentPrice">
            <span class="priceUpdateModal__label">מחיר נוכחי:</span>
            <span class="priceUpdateModal__value"
              >{{ selectedSubcategoryPrice || currentJobPrice }} ₪</span
            >
          </div>
          <div class="priceUpdateModal__change">
            <label class="priceUpdateModal__label" for="priceChangePercent"
              >שינוי באחוזים (עד 20%):</label
            >
            <div class="priceUpdateModal__inputGroup">
              <input
                id="priceChangePercent"
                v-model.number="priceChangePercent"
                type="number"
                min="-20"
                max="20"
                step="0.1"
                class="priceUpdateModal__input"
                placeholder="0"
                @input="calculateNewPrice"
              />
              <span class="priceUpdateModal__percent">%</span>
            </div>
            <div class="priceUpdateModal__newPrice">
              <span class="priceUpdateModal__label">מחיר חדש:</span>
              <span class="priceUpdateModal__value priceUpdateModal__value--new"
                >{{ newPrice }} ₪</span
              >
            </div>
            <div
              v-if="priceChangePercent !== 0"
              class="priceUpdateModal__changeAmount"
            >
              <span
                class="priceUpdateModal__changeText"
                :class="{
                  'priceUpdateModal__changeText--increase':
                    priceChangePercent > 0,
                  'priceUpdateModal__changeText--decrease':
                    priceChangePercent < 0,
                }"
              >
                {{
                  priceChangePercent > 0
                    ? `+${priceChangeAmount.toFixed(2)} ₪`
                    : `${priceChangeAmount.toFixed(2)} ₪`
                }}
              </span>
            </div>
          </div>
        </div>
        <div class="priceUpdateModal__footer">
          <button
            class="priceUpdateModal__btn priceUpdateModal__btn--cancel"
            type="button"
            @click="showPriceUpdateModal = false"
          >
            ביטול
          </button>
          <button
            class="priceUpdateModal__btn priceUpdateModal__btn--submit"
            type="button"
            :disabled="
              priceChangePercent === 0 ||
              isUpdatingPrice ||
              (currentJob?.subcategoryInfo &&
                Array.isArray(currentJob.subcategoryInfo) &&
                currentJob.subcategoryInfo.length > 1 &&
                selectedSubcategoryIndex === null)
            "
            @click="submitPriceChange"
          >
            {{ isUpdatingPrice ? "שולח..." : "שלח בקשה" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Price Change Approval Modal (for client) -->
    <div
      v-if="showPriceApprovalModal"
      class="modal"
      dir="rtl"
      @click.self="showPriceApprovalModal = false"
    >
      <div class="priceApprovalModal">
        <div class="priceApprovalModal__header">
          <h3 class="priceApprovalModal__title">בקשת שינוי מחיר</h3>
        </div>
        <div class="priceApprovalModal__body">
          <div class="priceApprovalModal__message">
            <template
              v-if="
                isSplitCall &&
                relatedJobs.length > 1 &&
                pendingPriceChange?.handymanName
              "
            >
              ההנדימן
              <strong>{{ pendingPriceChange.handymanName }}</strong> ביקש
            </template>
            <template v-else> ההנדימן ביקש </template>
            <span
              class="priceApprovalModal__changePercent"
              :class="{
                'priceApprovalModal__changePercent--increase':
                  pendingPriceChange.percent > 0,
                'priceApprovalModal__changePercent--decrease':
                  pendingPriceChange.percent < 0,
              }"
            >
              {{ pendingPriceChange.percent > 0 ? "להעלות" : "להוריד" }}
              {{ Math.abs(pendingPriceChange.percent).toFixed(1) }}%
            </span>
            מהמחיר
            <template v-if="pendingPriceChange?.subcategoryInfo">
              עבור העבודה:
              <strong>{{
                pendingPriceChange.subcategoryInfo.subcategory
              }}</strong>
            </template>
            . האם אתה מאשר?
          </div>
          <div class="priceApprovalModal__details">
            <div class="priceApprovalModal__detailRow">
              <span class="priceApprovalModal__detailLabel">מחיר נוכחי:</span>
              <span class="priceApprovalModal__detailValue"
                >{{ pendingPriceChange.oldPrice }} ₪</span
              >
            </div>
            <div class="priceApprovalModal__detailRow">
              <span class="priceApprovalModal__detailLabel">מחיר חדש:</span>
              <span
                class="priceApprovalModal__detailValue priceApprovalModal__detailValue--new"
                >{{ pendingPriceChange.newPrice }} ₪</span
              >
            </div>
            <div class="priceApprovalModal__detailRow">
              <span class="priceApprovalModal__detailLabel">שינוי:</span>
              <span
                class="priceApprovalModal__detailValue"
                :class="{
                  'priceApprovalModal__detailValue--increase':
                    pendingPriceChange.percent > 0,
                  'priceApprovalModal__detailValue--decrease':
                    pendingPriceChange.percent < 0,
                }"
              >
                {{
                  pendingPriceChange.percent > 0
                    ? `+${pendingPriceChange.changeAmount.toFixed(2)}`
                    : `${pendingPriceChange.changeAmount.toFixed(2)}`
                }}
                ₪
              </span>
            </div>
          </div>
        </div>
        <div class="priceApprovalModal__footer">
          <button
            class="priceApprovalModal__btn priceApprovalModal__btn--reject"
            type="button"
            :disabled="isRespondingToPriceChange"
            @click="rejectPriceChange"
          >
            {{ isRespondingToPriceChange ? "שולח..." : "דחה" }}
          </button>
          <button
            class="priceApprovalModal__btn priceApprovalModal__btn--approve"
            type="button"
            :disabled="isRespondingToPriceChange"
            @click="approvePriceChange"
          >
            {{ isRespondingToPriceChange ? "שולח..." : "אשר" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Image Gallery Modal -->
    <div
      v-if="showImageGallery"
      class="modal image-gallery-modal"
      @click.self="closeImageGallery"
      @touchstart="handleGalleryTouchStart"
      @touchend="handleGalleryTouchEnd"
      style="
        display: flex !important;
        visibility: visible !important;
        opacity: 1 !important;
        z-index: 10200 !important;
      "
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
            v-if="jobImages.length > 0"
            class="image-gallery__track"
            :style="{ transform: `translateX(-${currentImageIndex * 100}%)` }"
          >
            <div
              v-for="(image, index) in jobImages"
              :key="`image-${index}-${image}`"
              class="image-gallery__slide"
            >
              <img
                :src="image"
                :alt="`תמונה ${index + 1}`"
                class="image-gallery__image"
                @error="handleImageError"
                @load="handleImageLoad(image, index)"
                loading="eager"
                crossorigin="anonymous"
              />
            </div>
          </div>
          <div v-else class="image-gallery__empty">
            <p>אין תמונות להצגה</p>
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

    <!-- Handyman Route Modal (for client) -->
    <div
      v-if="showHandymanRouteModal"
      class="modal route-modal"
      @click.self="closeHandymanRouteModal"
    >
      <div class="routeCard">
        <div class="routeCard__header">
          <h3 class="routeCard__title">🗺️ מיקום ההנדימן</h3>
          <button
            class="routeCard__close"
            type="button"
            @click="closeHandymanRouteModal"
          >
            ✕
          </button>
        </div>

        <div class="routeCard__mapWrapper">
          <div ref="routeMapContainer" class="routeCard__map"></div>
          <div v-if="routeLoading" class="routeCard__loading">טוען מפה...</div>
          <div class="routeCard__legend">
            <div class="routeCard__legendItem">
              <span
                class="routeCard__legendDot routeCard__legendDot--start"
              ></span>
              <span class="routeCard__legendText">מיקום ההנדימן</span>
            </div>
            <div class="routeCard__legendItem">
              <span
                class="routeCard__legendDot routeCard__legendDot--end"
              ></span>
              <span class="routeCard__legendText">מיקום העבודה</span>
            </div>
          </div>
        </div>

        <div class="routeCard__body">
          <div class="routeCard__info">
            <div class="routeCard__infoRow">
              <span class="routeCard__infoLabel">מיקום ההנדימן:</span>
              <span class="routeCard__infoValue">{{
                formatLocation(
                  cachedLastHandymanLocation || lastHandymanLocation
                )
              }}</span>
            </div>
            <div class="routeCard__infoRow">
              <span class="routeCard__infoLabel">מיקום העבודה:</span>
              <span class="routeCard__infoValue">{{
                formatLocation(jobLocation)
              }}</span>
            </div>
            <div
              v-if="travelTimeMinutes !== null"
              class="routeCard__infoRow routeCard__infoRow--highlight"
            >
              <span class="routeCard__infoLabel">⏱️ זמן נסיעה משוער:</span>
              <span class="routeCard__infoValue routeCard__infoValue--time">
                {{ travelTimeMinutes }} דקות
              </span>
            </div>
          </div>

          <div class="routeCard__actions">
            <a
              :href="getRouteGoogleMapsUrl()"
              target="_blank"
              rel="noopener noreferrer"
              class="routeCard__btn routeCard__btn--google"
              @click="closeHandymanRouteModal"
            >
              <span class="routeCard__btnIcon">🗺️</span>
              <span class="routeCard__btnText">פתח בגוגל מפות</span>
            </a>
          </div>

          <button
            class="routeCard__backBtn"
            type="button"
            @click="closeHandymanRouteModal"
          >
            ← חזור לצ'אט
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import axios from "axios";
import { io } from "socket.io-client";
import { URL } from "@/Url/url";
import { useToast } from "@/composables/useToast";
import { useMainStore } from "@/store/index";
import mapboxgl from "mapbox-gl";
import { getCurrentLocation } from "@/utils/geolocation";

export default {
  name: "JobChatMobileV2",
  props: {
    job: { type: Object, required: false },
    jobs: { type: Array, required: false }, // Array of jobs for tabs
    isHandyman: { type: Boolean, default: false },
  },
  emits: [
    "close",
    "minimize",
    "status-updated",
    "rating-submitted",
    "cancel-job",
    "price-updated",
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
      imageModal: null,
      showTools: false,
      socket: null,
      localJobStatus: null,
      showCancelConfirmModal: false,
      showCancelReasonModal: false, // Show cancel reason selection modal
      cancelReasonText: "", // Free text reason for cancellation
      cancelAction: "cancel-handyman", // 'cancel-handyman', 'cancel-complete', or 'delete'
      isCancellingJob: false, // Track cancel job state
      imagePreview: null,
      imagePreviewText: "",
      imagePreviewFile: null,
      locationModal: null,

      // new UX state
      showMenu: false,
      showNavModal: false,
      showHandymanRouteModal: false, // Modal for handyman location with route
      currentStatusUpdate: null, // Track current status for active button state

      // Tabs state
      currentJobIndex: 0,
      unreadCounts: {}, // Track unread messages per job
      ratingSubmittedJobs: {}, // Track which jobs have been rated
      messagesCache: {}, // Cache messages per job to prevent losing them when switching tabs
      connectionCheckInterval: null, // Interval for checking connection quality
      isConnectionSlow: false, // Track if connection is slow
      cachedLastHandymanLocation: null, // Cache for last handyman CURRENT/REAL-TIME location (NOT residence from DB)
      handymanStartingLocation: null, // Location where handyman started (when status changed to "on_the_way") - FIXED point
      routeMap: null, // Mapbox map instance
      routeData: null, // Route data from server
      routeLoading: false, // Loading state for route
      travelTimeMinutes: null, // Travel time in minutes
      handymanMarker: null, // Mapbox marker for handyman location

      // Price update state
      // Split call related
      relatedJobs: [],
      isSplitCall: false,
      allRelatedJobsDone: false,
      isLoadingRelatedJobs: false,
      showPriceUpdateModal: false,
      priceChangePercent: 0,
      newPrice: 0,
      priceChangeAmount: 0,
      isUpdatingPrice: false,
      selectedSubcategoryIndex: null, // Index of selected subcategory for price change
      showPriceApprovalModal: false,
      pendingPriceChange: {
        percent: 0,
        oldPrice: 0,
        newPrice: 0,
        changeAmount: 0,
        jobId: null,
      },
      isRespondingToPriceChange: false,
      showImageGallery: false,
      currentImageIndex: 0,
      touchStartX: 0,
      touchEndX: 0,
    };
  },
  computed: {
    // Get current job (from jobs array or single job prop)
    currentJob() {
      if (this.jobs && this.jobs.length > 0) {
        return this.jobs[this.currentJobIndex] || this.jobs[0];
      }
      return this.job;
    },
    jobStatus() {
      return this.localJobStatus || this.currentJob?.status || "open";
    },
    showStatusButtons() {
      return ["assigned", "on_the_way", "in_progress"].includes(this.jobStatus);
    },
    showActionBar() {
      // show chips only when there is something useful
      return (
        (this.isHandyman && this.jobLocation) ||
        (this.isHandyman && !!this.nextStatus) ||
        (this.isHandyman && this.showPriceUpdateButton) ||
        (!this.isHandyman && this.showStatusButtons) ||
        true
      );
    },
    showPriceUpdateButton() {
      // Show price update button only when job is assigned or in progress
      return (
        this.isHandyman &&
        (this.jobStatus === "assigned" ||
          this.jobStatus === "on_the_way" ||
          this.jobStatus === "in_progress")
      );
    },
    currentJobPrice() {
      const job = this.currentJob;
      if (!job) return 0;

      // Handle subcategoryInfo as array
      if (
        job.subcategoryInfo &&
        Array.isArray(job.subcategoryInfo) &&
        job.subcategoryInfo.length > 0
      ) {
        // Sum all prices from subcategoryInfo array
        return job.subcategoryInfo.reduce((sum, subcat) => {
          const price = subcat?.price || 0;
          return (
            sum + (typeof price === "number" ? price : parseFloat(price) || 0)
          );
        }, 0);
      }

      // Handle subcategoryInfo as object
      if (job.subcategoryInfo?.price) {
        return typeof job.subcategoryInfo.price === "number"
          ? job.subcategoryInfo.price
          : parseFloat(job.subcategoryInfo.price) || 0;
      }

      // Fallback to job.price
      if (job.price) {
        return typeof job.price === "number"
          ? job.price
          : parseFloat(job.price) || 0;
      }

      return 0;
    },
    selectedSubcategoryPrice() {
      const job = this.currentJob;
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
    clientName() {
      return this.currentJob?.clientName || "לקוח";
    },
    handymanName() {
      // Handle handymanName as array
      if (
        Array.isArray(this.currentJob?.handymanName) &&
        this.currentJob.handymanName.length > 0
      ) {
        return this.currentJob.handymanName[0]; // Return first handyman name
      }
      return this.currentJob?.handymanName || "הנדימן";
    },
    jobInfo() {
      return this.currentJob;
    },
    jobLocation() {
      const job = this.currentJob;
      // Check if coordinates is an array [lng, lat]
      if (
        job?.coordinates &&
        Array.isArray(job.coordinates) &&
        job.coordinates.length >= 2
      ) {
        return { lng: job.coordinates[0], lat: job.coordinates[1] };
      }
      // Check if coordinates is an object with lng and lat
      if (
        job?.coordinates &&
        typeof job.coordinates === "object" &&
        job.coordinates.lng &&
        job.coordinates.lat
      ) {
        return { lng: job.coordinates.lng, lat: job.coordinates.lat };
      }
      // Check location.coordinates array
      if (
        job?.location?.coordinates &&
        Array.isArray(job.location.coordinates) &&
        job.location.coordinates.length >= 2
      ) {
        return {
          lng: job.location.coordinates[0],
          lat: job.location.coordinates[1],
        };
      }
      // Check jobInfo coordinates
      if (
        this.jobInfo?.coordinates &&
        Array.isArray(this.jobInfo.coordinates) &&
        this.jobInfo.coordinates.length >= 2
      ) {
        return {
          lng: this.jobInfo.coordinates[0],
          lat: this.jobInfo.coordinates[1],
        };
      }
      return null;
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

    // New: one smart next status button
    nextStatus() {
      if (!this.isHandyman) return null;
      if (this.jobStatus === "assigned") return "on_the_way";
      if (this.jobStatus === "on_the_way") return "in_progress";
      if (this.jobStatus === "in_progress") return "done";
      return null;
    },
    nextStatusLabel() {
      const map = {
        on_the_way: "🚗 בדרך",
        in_progress: "📍 הגעתי",
        done: "✅ סיימתי",
      };
      return map[this.nextStatus] || "";
    },

    jobSteps() {
      return [
        { status: "assigned", label: "שובצה" },
        { status: "on_the_way", label: "בדרך" },
        { status: "in_progress", label: "ביצוע" },
        { status: "done", label: "סיום" },
      ];
    },
    ratingSubmitted() {
      const job = this.currentJob;
      const jobId = String(job?._id || job?.id || "");
      return this.ratingSubmittedJobs[jobId] || false;
    },
    lastHandymanLocation() {
      // Find the last location message from handyman
      if (this.isHandyman) return null;

      // Search messages in reverse order to find the latest handyman location
      for (let i = this.messages.length - 1; i >= 0; i--) {
        const msg = this.messages[i];
        // Check if message is from handyman (sender === "other" for client, and has location)
        // When !isHandyman (client), handyman messages have sender === "other"
        if (msg.location && msg.sender === "other") {
          return msg.location;
        }
      }
      return null;
    },
    hasJobImages() {
      const job = this.currentJob;
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
      if (
        job.imageUrl &&
        typeof job.imageUrl === "string" &&
        job.imageUrl.trim() !== ""
      ) {
        return true;
      }

      // Check subcategoryInfo for images
      if (job.subcategoryInfo && Array.isArray(job.subcategoryInfo)) {
        return job.subcategoryInfo.some((subcat) => {
          if (subcat?.imageUrl) {
            if (Array.isArray(subcat.imageUrl) && subcat.imageUrl.length > 0) {
              return true;
            }
            if (
              typeof subcat.imageUrl === "string" &&
              subcat.imageUrl.trim() !== ""
            ) {
              return true;
            }
          }
          return false;
        });
      }

      return false;
    },
    jobImages() {
      const job = this.currentJob;
      if (!job) return [];

      const images = [];

      // Collect from imageUrl array
      if (job.imageUrl) {
        if (Array.isArray(job.imageUrl)) {
          const filtered = job.imageUrl.filter(
            (url) => url && url.trim() !== ""
          );
          images.push(...filtered);
        } else if (
          typeof job.imageUrl === "string" &&
          job.imageUrl.trim() !== ""
        ) {
          images.push(job.imageUrl);
        }
      }

      // Collect from subcategoryInfo
      if (job.subcategoryInfo && Array.isArray(job.subcategoryInfo)) {
        job.subcategoryInfo.forEach((subcat) => {
          if (subcat?.imageUrl) {
            if (Array.isArray(subcat.imageUrl)) {
              const filtered = subcat.imageUrl.filter(
                (url) => url && url.trim() !== ""
              );
              images.push(...filtered);
            } else if (
              typeof subcat.imageUrl === "string" &&
              subcat.imageUrl.trim() !== ""
            ) {
              images.push(subcat.imageUrl);
            }
          }
        });
      }

      // Remove duplicates
      return [...new Set(images)];
    },
  },
  created() {
    this.toast = useToast();
    const job = this.currentJob;
    this.localJobStatus = job?.status || null;
  },
  async mounted() {
    window.addEventListener("click", this.onOutsideTools);
    window.addEventListener("visibilitychange", this.handleVisibilityChange);
    window.addEventListener("beforeunload", this.saveMessagesBeforeUnload);

    // Load messages from sessionStorage first if available for fast display
    const job = this.currentJob;
    const jobId = job?.id || job?._id;
    let hasCachedMessages = false;
    if (jobId) {
      const jobIdStr = String(jobId);
      // Try sessionStorage first
      const storedMessages = this.loadMessagesFromStorage();
      if (storedMessages && storedMessages.length > 0) {
        this.messages = storedMessages;
        this.messagesCache[jobIdStr] = [...storedMessages];
        hasCachedMessages = true;
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      } else if (
        this.messagesCache[jobIdStr] &&
        this.messagesCache[jobIdStr].length > 0
      ) {
        // Fallback to in-memory cache
        this.messages = [...this.messagesCache[jobIdStr]];
        hasCachedMessages = true;
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      }
    }

    this.initWebSocket();
    // Only load from server if we don't have cached messages
    if (!hasCachedMessages) {
      await this.loadMessages();
      this.scrollToBottom();
    } else {
      // We have cached messages, sync from server in background without clearing UI
      this.loadMessages().catch(() => {
        // Silent fail - we already have messages from cache
      });
    }

    // Initialize unread counts for all jobs
    if (this.jobs && this.jobs.length > 1) {
      for (const jobItem of this.jobs) {
        await this.updateUnreadCount(jobItem);
      }
    }

    // Load related jobs if this is a split call
    await this.loadRelatedJobs();

    // Start checking connection quality
    this.startConnectionQualityCheck();
  },
  beforeUnmount() {
    window.removeEventListener("click", this.onOutsideTools);
    window.removeEventListener("visibilitychange", this.handleVisibilityChange);
    window.removeEventListener("beforeunload", this.saveMessagesBeforeUnload);
    this.disconnectWebSocket();

    // Stop connection quality check
    this.stopConnectionQualityCheck();

    // Save messages before unmount
    this.saveMessagesBeforeUnload();
  },
  watch: {
    async showHandymanRouteModal(newVal) {
      if (newVal) {
        // Modal opened - initialize map
        await this.$nextTick();
        await this.initializeRouteMap();
      } else {
        // Modal closed - clean up is handled in closeHandymanRouteModal
      }
    },
    async currentJobIndex(newIndex, oldIndex) {
      // When switching tabs, save current messages to cache and load from cache
      if (oldIndex !== undefined && this.jobs && this.jobs[oldIndex]) {
        const previousJob = this.jobs[oldIndex];
        const previousJobId = String(previousJob._id || previousJob.id || "");
        // Save current messages to cache before switching
        if (previousJobId && this.messages.length > 0) {
          this.messagesCache[previousJobId] = [...this.messages];
        }
      }

      // Update status for new job - ensure it's synced
      const newJobStatus = this.currentJob?.status;
      if (newJobStatus) {
        this.localJobStatus = newJobStatus;
      }

      // Get job ID for new job
      const newJobId = String(
        this.currentJob?._id || this.currentJob?.id || ""
      );

      // Load messages from cache if available, otherwise load from server
      if (newJobId && this.messagesCache[newJobId]) {
        // Load from cache immediately
        this.messages = [...this.messagesCache[newJobId]];
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      } else {
        // No cache, clear messages and load from server
        this.messages = [];
      }

      this.rating = 0;
      this.reviewText = "";
      this.disconnectWebSocket();
      this.initWebSocket();

      // Load messages from server (will update cache)
      // Only load if we don't have cached messages, otherwise sync in background
      if (this.messages.length === 0) {
        await this.loadMessages();
      } else {
        // Sync in background without clearing current messages
        this.loadMessages().catch(() => {
          // Silent fail - we already have messages displayed
        });
      }
    },
    "currentJob.status"(newStatus) {
      // Always update localJobStatus when job status changes
      if (newStatus) {
        this.localJobStatus = newStatus;
      } else if (newStatus === null || newStatus === undefined) {
        // Reset if status is cleared
        this.localJobStatus = null;
      }
    },
    messages: {
      deep: true,
      handler() {
        this.scrollToBottom();
      },
    },
    currentJobPrice() {
      // Recalculate new price when current price changes
      if (this.priceChangePercent !== 0) {
        this.calculateNewPrice();
      } else {
        this.newPrice = this.currentJobPrice;
        this.priceChangeAmount = 0;
      }
    },
    showPriceUpdateModal(newVal) {
      // When modal opens, initialize price calculation
      if (newVal) {
        this.priceChangePercent = 0;
        this.newPrice = this.currentJobPrice;
        this.priceChangeAmount = 0;
      }
    },
  },
  methods: {
    async getCurrentLocation() {
      return await getCurrentLocation();
    },
    switchToJob(index) {
      this.currentJobIndex = index;
    },
    async checkConnectionQuality() {
      // Check if connection is slow by measuring response time
      const startTime = performance.now();
      try {
        // Try to fetch a small resource from the server
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

        await fetch(`${URL}/health-check`, {
          method: "HEAD",
          signal: controller.signal,
          cache: "no-cache",
        });

        clearTimeout(timeoutId);
        const endTime = performance.now();
        const responseTime = endTime - startTime;

        // Consider connection slow if response time is more than 2 seconds
        const wasSlow = this.isConnectionSlow;
        this.isConnectionSlow = responseTime > 2000;

        // Show warning only if connection just became slow (not if it was already slow)
        if (this.isConnectionSlow && !wasSlow && !this.isHandyman) {
          this.toast?.showWarning(
            "החיבור לאינטרנט איטי. ייתכן שההודעות לא יישלחו במהירות.",
            5000
          );
        }
      } catch (error) {
        // If fetch fails, connection might be down or very slow
        const wasSlow = this.isConnectionSlow;
        this.isConnectionSlow = true;

        // Show warning only if connection just became slow (not if it was already slow)
        if (!wasSlow && !this.isHandyman) {
          this.toast?.showWarning(
            "החיבור לאינטרנט חלש. ייתכן שההודעות לא יישלחו.",
            5000
          );
        }
      }
    },
    startConnectionQualityCheck() {
      // Check connection quality every 30 seconds
      this.connectionCheckInterval = setInterval(() => {
        this.checkConnectionQuality();
      }, 30000);

      // Also check immediately on mount
      this.checkConnectionQuality();
    },
    stopConnectionQualityCheck() {
      if (this.connectionCheckInterval) {
        clearInterval(this.connectionCheckInterval);
        this.connectionCheckInterval = null;
      }
    },
    updateMessagesCache() {
      // Helper function to update messages cache for current job
      const jobId = this.currentJob?._id || this.currentJob?.id;
      if (jobId) {
        const jobIdStr = String(jobId);
        this.messagesCache[jobIdStr] = [...this.messages];
        // Also save to sessionStorage for persistence across page refreshes
        try {
          const storageKey = `chat_messages_${jobIdStr}`;
          const messagesToStore = this.messages.map((msg) => ({
            ...msg,
            createdAt: msg.createdAt
              ? msg.createdAt.toISOString()
              : new Date().toISOString(),
          }));
          sessionStorage.setItem(storageKey, JSON.stringify(messagesToStore));
        } catch (e) {
          // Silently fail if sessionStorage is not available
        }
      }
    },
    loadMessagesFromStorage() {
      // Load messages from sessionStorage on mount
      const job = this.currentJob;
      const jobId = job?.id || job?._id;
      if (!jobId) return null;

      const jobIdStr = String(jobId);
      try {
        const storageKey = `chat_messages_${jobIdStr}`;
        const stored = sessionStorage.getItem(storageKey);
        if (stored) {
          const messages = JSON.parse(stored).map((msg) => ({
            ...msg,
            createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
          }));
          return messages;
        }
      } catch (e) {
        // Silently fail if sessionStorage is not available or data is corrupted
      }
      return null;
    },
    getUnreadCount(jobItem) {
      const jobId = String(jobItem._id || jobItem.id || "");
      return this.unreadCounts[jobId] || 0;
    },
    async updateUnreadCount(jobItem) {
      try {
        const jobId = jobItem._id || jobItem.id;
        if (!jobId) return;

        const { data } = await axios.get(`${URL}/jobs/${jobId}/messages`);
        if (data.success && data.messages) {
          const userId = this.store?.user?._id;
          if (!userId) return;

          // Count unread messages (messages not from current user, after last read)
          const unread = data.messages.filter((msg) => {
            const isFromHandyman =
              !!msg.handyman || !!msg.handymanImage || !!msg.handymanLocation;
            const isFromMe = this.isHandyman ? isFromHandyman : !isFromHandyman;
            return !isFromMe;
          }).length;

          const jobIdStr = String(jobId);
          this.unreadCounts[jobIdStr] = unread;
        }
      } catch (e) {
        // Silently fail
      }
    },
    getJobDisplayName(job) {
      if (!job) return "עבודה";
      // Handle subcategoryInfo as array
      if (
        Array.isArray(job.subcategoryInfo) &&
        job.subcategoryInfo.length > 0
      ) {
        if (job.subcategoryInfo.length === 1) {
          // Single job - show name
          return (
            job.subcategoryInfo[0].subcategory ||
            job.subcategoryInfo[0].category ||
            "עבודה"
          );
        } else {
          // Multiple jobs - show count
          return `${job.subcategoryInfo.length} עבודות`;
        }
      }
      // Fallback for old format (object) or no subcategoryInfo
      return (
        job.subcategoryInfo?.name || job.subcategoryInfo?.subcategory || "עבודה"
      );
    },
    getHandymanName() {
      // Handle handymanName as array
      if (
        Array.isArray(this.currentJob?.handymanName) &&
        this.currentJob.handymanName.length > 0
      ) {
        return this.currentJob.handymanName[0]; // Return first handyman name
      }
      return this.currentJob?.handymanName || "הנדימן";
    },
    getHandymanNameForJob(job) {
      // Handle handymanName as array for a specific job
      if (Array.isArray(job?.handymanName) && job.handymanName.length > 0) {
        return job.handymanName[0]; // Return first handyman name
      }
      return job?.handymanName || "הנדימן";
    },
    openCancel() {
      this.showMenu = false;
      this.cancelReasonText = "";
      this.cancelAction = "cancel-handyman";
      this.showCancelReasonModal = true;
    },

    initWebSocket() {
      const job = this.currentJob;
      if (!job?.id && !job?._id) return;

      if (this.socket) {
        this.socket.removeAllListeners();
        this.socket.disconnect();
        this.socket = null;
      }

      const jobId = job.id || job._id;

      this.socket = io(URL, { transports: ["websocket", "polling"] });

      this.socket.on("connect", () => {
        this.socket.emit("join-job", String(jobId));
      });

      this.socket.on("job-status-updated", (data) => {
        const receivedJobId = String(data.jobId || "");
        const currentJobId = String(jobId || "");
        if (receivedJobId === currentJobId) {
          const previousStatus = this.localJobStatus;
          this.localJobStatus = data.status;
          this.$emit("status-updated", data.status);

          // When handyman status changes to "on_the_way", save the starting location
          // This is the FIXED point where handyman started the journey
          if (data.status === "on_the_way" && previousStatus !== "on_the_way") {
            // Get the location from the last handyman location message (when they sent "on_the_way")
            const lastLocation = this.lastHandymanLocation;
            if (lastLocation) {
              this.handymanStartingLocation = {
                lat: lastLocation.lat,
                lng: lastLocation.lng,
              };
            }
          }

          // Add status message to chat for client (not handyman)
          if (!this.isHandyman) {
            const statusMessages = {
              on_the_way: "ההנדימן יצא לדרך",
              in_progress: "עדכון סטטוס: ההנדימן הגיע",
              done: "עדכון סטטוס: ההנדימן סיים את העבודה",
            };
            const statusMessage = statusMessages[data.status];
            if (statusMessage) {
              const systemMessage = {
                sender: "system",
                text: statusMessage,
                time: new Date().toLocaleTimeString("he-IL", {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                createdAt: new Date(),
                isSystem: true,
              };
              this.messages.push(systemMessage);
              this.updateMessagesCache();
              this.scrollToBottom();
            }
          }
        }
      });

      this.socket.on("new-message", (data) => {
        const receivedJobId = String(data.jobId || "");
        const currentJobId = String(jobId || "");
        if (receivedJobId === currentJobId && data.message) {
          this.addMessageToUI(data.message);
        } else if (this.jobs && this.jobs.length > 1) {
          // If message is for another job, update unread count
          const jobItem = this.jobs.find(
            (j) => String(j._id || j.id) === receivedJobId
          );
          if (jobItem) {
            const currentCount = this.getUnreadCount(jobItem);
            this.unreadCounts[receivedJobId] = currentCount + 1;
          }
        }
      });

      this.socket.on("rating-submitted", (data) => {
        const receivedJobId = String(data.jobId || "");
        const currentJobId = String(jobId || "");
        if (receivedJobId === currentJobId) {
          const userId = this.store?.user?._id || this.$route.params.id;
          this.$router.push(
            `/Dashboard/${userId}/job-summary/${receivedJobId}`
          );
        }
      });

      // Listen for real-time handyman CURRENT location updates (NOT residence from DB)
      // This location is the handyman's CURRENT GPS position, sent when they update status or approve location request
      this.socket.on("handyman-location-updated", (data) => {
        const receivedJobId = String(data.jobId || "");
        const currentJobId = String(jobId || "");
        if (receivedJobId === currentJobId && data.location) {
          // Update cached CURRENT location (GPS position, NOT residence)
          this.cachedLastHandymanLocation = {
            lat: data.location.lat,
            lng: data.location.lng,
          };

          // If status just changed to "on_the_way" and we don't have starting location yet,
          // save this as the starting location (FIXED point)
          if (
            !this.isHandyman &&
            this.jobStatus === "on_the_way" &&
            !this.handymanStartingLocation
          ) {
            this.handymanStartingLocation = {
              lat: data.location.lat,
              lng: data.location.lng,
            };
          }

          // Update marker on map if route modal is open (marker is dynamic, route line stays fixed)
          if (this.showHandymanRouteModal && this.routeMap) {
            this.updateHandymanMarkerOnMap(data.location);
          }
        }
      });

      // Listen for price change requests (for client)
      this.socket.on("price-change-request", async (data) => {
        if (this.isHandyman) return; // Only show for clients

        const receivedJobId = String(data.jobId || "");

        // Get current job ID from currentJob computed property (handles tabs)
        const currentJobId = String(
          this.currentJob?._id || this.currentJob?.id || ""
        );

        // Check if this request is for any job that the client has access to
        let shouldShowModal = false;
        let requestingJob = null;

        // First check: Is this for any job in the jobs array (tabs)?
        // This is the most common case for split calls with multiple tabs
        if (this.jobs && Array.isArray(this.jobs) && this.jobs.length > 0) {
          requestingJob = this.jobs.find((j) => {
            const jobId = String(j._id || j.id || "");
            return jobId === receivedJobId && jobId !== "";
          });
          if (requestingJob) {
            shouldShowModal = true;
          }
        }

        // Second check: Is this for the current job? (if not already found)
        if (
          !shouldShowModal &&
          receivedJobId === currentJobId &&
          this.currentJob
        ) {
          shouldShowModal = true;
          requestingJob = this.currentJob;
        }

        // Third check: Is this for the single job prop? (if not already found)
        if (!shouldShowModal && this.job) {
          const jobId = String(this.job._id || this.job.id || "");
          if (jobId === receivedJobId) {
            shouldShowModal = true;
            requestingJob = this.job;
          }
        }

        // Fourth check: Is this a split call and the request is for a related job? (if not already found)
        if (
          !shouldShowModal &&
          this.isSplitCall &&
          this.relatedJobs &&
          Array.isArray(this.relatedJobs) &&
          this.relatedJobs.length > 0
        ) {
          requestingJob = this.relatedJobs.find((rj) => {
            const jobId = String(rj._id || rj.id || "");
            return jobId === receivedJobId && jobId !== "";
          });
          if (requestingJob) {
            shouldShowModal = true;
          }
        }

        if (shouldShowModal) {
          // If we didn't find requestingJob yet, try to find it
          if (!requestingJob) {
            requestingJob =
              this.jobs?.find((j) => String(j._id || j.id) === receivedJobId) ||
              this.currentJob ||
              this.job;
          }

          this.pendingPriceChange = {
            percent: data.percent || data.changePercent,
            oldPrice: data.oldPrice,
            newPrice: data.newPrice,
            changeAmount: data.changeAmount || data.change,
            jobId: receivedJobId,
            handymanId: data.handymanId,
            handymanName:
              data.handymanName || requestingJob?.handymanName || "הנדימן",
            subcategoryIndex:
              data.subcategoryIndex !== undefined
                ? data.subcategoryIndex
                : null,
            subcategoryInfo: data.subcategoryInfo || null,
          };
          this.showPriceApprovalModal = true;

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

          // Add message to the correct job's chat (the one that requested the change)
          if (receivedJobId !== currentJobId && this.jobs) {
            // This is a different job - add message to its cache
            const jobIdStr = receivedJobId;
            if (!this.messagesCache[jobIdStr]) {
              this.messagesCache[jobIdStr] = [];
            }
            this.messagesCache[jobIdStr].push(systemMessage);
          } else {
            // Current job - add to current messages
            this.messages.push(systemMessage);
            this.updateMessagesCache();
            this.scrollToBottom();
          }
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
            // Emit event to parent to refresh job data
            this.$emit("price-updated", {
              jobId: receivedJobId,
              newPrice: data.newPrice,
            });

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
            this.updateMessagesCache();
            this.scrollToBottom();
          } else {
            this.toast?.showWarning("הלקוח דחה את בקשת שינוי המחיר");

            // Add system message for handyman when rejected
            const systemMessage = {
              sender: "system",
              text: "הלקוח דחה את בקשת שינוי המחיר",
              time: new Date().toLocaleTimeString("he-IL", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              createdAt: new Date(),
              isSystem: true,
            };
            this.messages.push(systemMessage);
            this.updateMessagesCache();
            this.scrollToBottom();
          }
        }
      });
    },

    disconnectWebSocket() {
      if (this.socket) {
        const job = this.currentJob;
        const jobId = job?.id || job?._id;
        if (jobId) this.socket.emit("leave-job", jobId);
        this.socket.removeAllListeners();
        this.socket.disconnect();
        this.socket = null;
      }
    },

    async loadMessages() {
      try {
        const job = this.currentJob;
        const jobId = job?.id || job?._id;
        if (!jobId) return;

        const jobIdStr = String(jobId);

        // Reset unread count for current job when loading messages
        this.unreadCounts[jobIdStr] = 0;

        // Save current messages as fallback in case of error
        const currentMessages = [...this.messages];

        // Always load from server to ensure we have the latest messages
        // (cache is only for fast display while switching tabs, not for persistence across refreshes)
        const { data } = await axios.get(`${URL}/jobs/${jobId}/messages`);

        // Check if data exists and has messages array
        if (data && data.success && Array.isArray(data.messages)) {
          const loadedMessages = data.messages.map((msg) => {
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

          // Always update messages from server - replace existing
          this.messages = loadedMessages;

          // Update cache with all messages
          this.messagesCache[jobIdStr] = [...loadedMessages];

          // If status is "on_the_way" or "in_progress" and we don't have starting location yet,
          // try to find the location from the first handyman location message after status changed
          if (
            (this.jobStatus === "on_the_way" ||
              this.jobStatus === "in_progress") &&
            !this.handymanStartingLocation &&
            !this.isHandyman
          ) {
            // Find the first handyman location message (this should be when they started the journey)
            for (const msg of loadedMessages) {
              const isFromHandyman = msg.sender === "other"; // For client, handyman messages have sender "other"
              if (isFromHandyman && msg.location) {
                this.handymanStartingLocation = {
                  lat: msg.location.lat,
                  lng: msg.location.lng,
                };
                break; // Use the first location message from handyman
              }
            }
          }
        } else {
          // If no messages or invalid response, only clear if we don't have cached messages
          if (
            currentMessages.length === 0 &&
            (!this.messagesCache[jobIdStr] ||
              this.messagesCache[jobIdStr].length === 0)
          ) {
            this.messages = [];
            if (jobIdStr) {
              this.messagesCache[jobIdStr] = [];
            }
          }
          // If we have current messages, keep them (don't clear)
        }
      } catch (e) {
        // On error, don't clear messages - keep what we have
        // Only show error if we don't have any messages at all
        if (this.messages.length === 0) {
          this.toast?.showError("אויי חבל, לא הצלחנו לטעון את ההודעות");
          // Try to load from cache as last resort
          const job = this.currentJob;
          const jobId = job?.id || job?._id;
          if (jobId) {
            const jobIdStr = String(jobId);
            const cachedMessages = this.messagesCache[jobIdStr];
            if (cachedMessages && cachedMessages.length > 0) {
              this.messages = [...cachedMessages];
            } else {
              // Try sessionStorage
              const storedMessages = this.loadMessagesFromStorage();
              if (storedMessages && storedMessages.length > 0) {
                this.messages = storedMessages;
                this.messagesCache[jobIdStr] = [...storedMessages];
              }
            }
          }
        }
        // If we already have messages, silently fail (don't clear them)
      }
    },

    addMessageToUI(messageObj) {
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

      // Check if this is an update to an optimistic message (same sender, same content, recent time)
      if (sender === "me") {
        // Find optimistic message with same text and recent time (within 5 seconds)
        const optimisticIndex = this.messages.findIndex((m) => {
          if (m.sender !== "me") return false;
          if (m.tempId || m._tempId) {
            // For text messages
            if (
              text &&
              m.text &&
              !image &&
              !m.image &&
              !location &&
              !m.location
            ) {
              const timeDiff = Math.abs(
                createdAt.getTime() - (m.createdAt?.getTime() || 0)
              );
              return text.trim() === m.text.trim() && timeDiff < 5000;
            }
            // For image messages
            if (image && m.image) {
              const timeDiff = Math.abs(
                createdAt.getTime() - (m.createdAt?.getTime() || 0)
              );
              // Match by tempId (optimistic message) or by time and text match
              if (m.tempId && m.tempId.startsWith("temp-img")) {
                // Match text if both have it, or match if both don't have text
                const textMatch =
                  (!text && !m.text) ||
                  (text && m.text && text.trim() === m.text.trim());
                return textMatch && timeDiff < 5000;
              }
              // Also check if image URLs match (for base64 preview vs server URL)
              // This handles cases where tempId might not be set
              const textMatch =
                (!text && !m.text) ||
                (text && m.text && text.trim() === m.text.trim());
              return textMatch && timeDiff < 5000;
            }
            // For location messages - match by tempId first
            if (location && m.location) {
              // If temp message has tempId, match by it (more reliable)
              if (m._tempId && m._tempId.startsWith("temp-loc-")) {
                // This is a temp location message, allow WebSocket to update it
                const timeDiff = Math.abs(
                  createdAt.getTime() - (m.createdAt?.getTime() || 0)
                );
                return timeDiff < 10000; // Allow 10 seconds window
              }
              // Otherwise match by coordinates (same location within tolerance)
              const latMatch =
                Math.abs((m.location.lat || 0) - (location.lat || 0)) < 0.0001;
              const lngMatch =
                Math.abs((m.location.lng || 0) - (location.lng || 0)) < 0.0001;
              const timeDiff = Math.abs(
                createdAt.getTime() - (m.createdAt?.getTime() || 0)
              );
              return latMatch && lngMatch && timeDiff < 5000;
            }
          }
          return false;
        });

        if (optimisticIndex !== -1) {
          // Replace optimistic message with real one
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

      // Check if message already exists to prevent duplicates
      const exists = this.messages.some((m) => {
        // Skip optimistic messages (they're handled above)
        if (m.tempId || m._tempId || m.uploading) return false;
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
          // Skip temp messages - they should be updated, not blocked as duplicates
          if (m._tempId && m._tempId.startsWith("temp-loc-")) {
            return false; // Don't block temp messages
          }
          // Compare coordinates with tolerance for floating point precision
          const latMatch =
            Math.abs((m.location.lat || 0) - (location.lat || 0)) < 0.0001;
          const lngMatch =
            Math.abs((m.location.lng || 0) - (location.lng || 0)) < 0.0001;
          if (!latMatch || !lngMatch) {
            return false; // Different location, allow both
          }
          // Same coordinates - check time to allow same location sent multiple times
          const timeDiff = Math.abs(
            createdAt.getTime() - (m.createdAt?.getTime() || 0)
          );
          // Only block if same location and within 2 seconds (likely duplicate)
          if (timeDiff < 2000) {
            // If both have text, must match exactly
            if (text && m.text) {
              return text.trim() === m.text.trim();
            }
            return !text && !m.text;
          }
          // Same location but different time - allow (user sent location again)
          return false;
        }

        // Text-only messages - check by text and time (within 2 seconds)
        if (text && m.text && !image && !m.image && !location && !m.location) {
          const timeDiff = Math.abs(
            createdAt.getTime() - (m.createdAt?.getTime() || 0)
          );
          return text.trim() === m.text.trim() && timeDiff < 2000;
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
        this.updateMessagesCache();
        this.scrollToBottom();
      }
    },

    toggleTools(e) {
      e?.stopPropagation?.();
      this.showTools = !this.showTools;
    },
    onOutsideTools(e) {
      const inside = e?.target?.closest?.(".composer");
      if (!inside) this.showTools = false;
      const insideHeader = e?.target?.closest?.(".chat__header");
      if (!insideHeader) this.showMenu = false;
      const insideNavModal = e?.target?.closest?.(".navModal");
      if (!insideNavModal) {
        this.showNavModal = false;
      }
    },
    triggerFile() {
      this.showTools = false;
      this.$refs.fileInput?.click();
    },
    sendQuick(text) {
      this.showTools = false;

      // Map quick messages to status updates for handyman
      if (this.isHandyman) {
        if (text === "אני בדרך") {
          this.updateStatus("on_the_way");
          // Also send as message to notify client
          this.newMessage = text;
          this.sendMessage();
          return;
        } else if (text === "הגעתי") {
          this.updateStatus("in_progress");
          // Also send as message to notify client
          this.newMessage = text;
          this.sendMessage();
          return;
        }
      }

      // For other messages or client, just send as text
      this.newMessage = text;
      this.sendMessage();
    },

    async sendLocation() {
      this.showTools = false;

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
          errorMessage =
            "הגישה למיקום נדחתה. אנא אפשר גישה למיקום בהגדרות הדפדפן.";
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
      const job = this.currentJob;
      const jobId = job?.id || job?._id;
      if (!jobId) return;

      const userId = this.store?.user?._id;
      if (!userId) {
        this.toast?.showError("אויי חבל, לא הצלחנו לזהות את המשתמש");
        return;
      }

      // Create unique message ID
      const messageId = `temp-loc-${Date.now()}-${Math.random()}`;

      // Show optimistic message
      const tempMessage = {
        sender: "me",
        location,
        time: new Date().toLocaleTimeString("he-IL", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        createdAt: new Date(),
        uploading: true,
        _tempId: messageId,
      };

      this.messages.push(tempMessage);
      this.updateMessagesCache();
      this.scrollToBottom();

      try {
        await axios.post(`${URL}/jobs/${jobId}/messages`, {
          location,
          senderId: userId,
          isHandyman: this.isHandyman,
        });

        // Mark as no longer uploading - WebSocket will update it with server data
        const tempIndex = this.messages.findIndex(
          (m) => m._tempId === messageId && m.uploading && m.sender === "me"
        );
        if (tempIndex !== -1) {
          this.messages[tempIndex] = {
            ...this.messages[tempIndex],
            uploading: false,
            _tempId: messageId, // Keep tempId for WebSocket matching
          };
        }
      } catch (e) {
        // Remove optimistic message on error
        const tempIndex = this.messages.findIndex(
          (m) => m._tempId === messageId && m.uploading && m.sender === "me"
        );
        if (tempIndex !== -1) {
          this.messages.splice(tempIndex, 1);
          this.updateMessagesCache();
        }
        this.toast?.showError("אויי חבל, לא הצלחנו לשלוח את המיקום");
      }
    },

    openLocationModal(location) {
      if (!location) return;
      this.locationModal = location;
    },
    openHandymanLocation() {
      if (this.lastHandymanLocation && this.jobLocation) {
        // Open route modal instead of simple location modal
        this.showHandymanRouteModal = true;
      } else if (this.lastHandymanLocation) {
        // Fallback to simple location if no job location
        this.openLocationModal(this.lastHandymanLocation);
      }
    },
    async openHandymanRealtimeLocation() {
      // Get current handyman location (dynamic - latest from messages/WebSocket)
      // This is the CURRENT location that will be displayed as the handyman marker
      let currentHandymanLocation =
        this.cachedLastHandymanLocation || this.lastHandymanLocation;

      // Get starting location (fixed - where handyman started the journey)
      // This is the origin point for the route line
      const startingLocation = this.handymanStartingLocation;

      // Validate job location
      const jobLocation = this.jobLocation;
      const hasValidJobLocation =
        jobLocation &&
        typeof jobLocation.lat === "number" &&
        typeof jobLocation.lng === "number";

      // We need starting location (where handyman started) and job location to draw the route
      // The current handyman location is shown as a marker (dynamic)
      const hasValidStartingLocation =
        startingLocation &&
        typeof startingLocation.lat === "number" &&
        typeof startingLocation.lng === "number";

      if (hasValidStartingLocation && hasValidJobLocation) {
        // We have starting location and job location - show route modal
        // The route line goes from starting location to job location
        // The handyman marker shows current location (if available)
        this.showHandymanRouteModal = true;
      } else {
        this.toast?.showError(
          "מיקום יציאת הדרך של ההנדימן לא זמין. ההנדימן צריך לעדכן סטטוס 'יצא לדרך' כדי לאפשר מעקב."
        );
      }
    },
    closeHandymanRouteModal() {
      this.showHandymanRouteModal = false;
      // Clean up map when closing
      if (this.routeMap) {
        this.routeMap.remove();
        this.routeMap = null;
      }
      if (this.handymanMarker) {
        this.handymanMarker.remove();
        this.handymanMarker = null;
      }
      this.routeData = null;
      this.travelTimeMinutes = null;
    },
    updateHandymanMarkerOnMap(newLocation) {
      if (!this.routeMap || !this.handymanMarker || !newLocation) return;

      // Update marker position - Mapbox expects [lng, lat]
      this.handymanMarker.setLngLat([newLocation.lng, newLocation.lat]);

      // Update cached location
      this.cachedLastHandymanLocation = {
        lat: newLocation.lat,
        lng: newLocation.lng,
      };
    },
    async updateRouteOnMap(newHandymanLocation) {
      if (!this.routeMap || !newHandymanLocation || !this.jobLocation) return;

      try {
        // Fetch updated route
        const routeResponse = await axios.get(`${URL}/route-data`, {
          params: {
            originLat: newHandymanLocation.lat,
            originLng: newHandymanLocation.lng,
            destLat: this.jobLocation.lat,
            destLng: this.jobLocation.lng,
          },
        });

        if (!routeResponse.data.success || !routeResponse.data.route) return;

        // Update route source
        const source = this.routeMap.getSource("route");
        if (source) {
          source.setData({
            type: "Feature",
            properties: {},
            geometry: routeResponse.data.route.geometry,
          });
        }

        // Update travel time
        this.travelTimeMinutes = routeResponse.data.route.durationMinutes;
        this.routeData = routeResponse.data;

        // Update marker position - Mapbox expects [lng, lat]
        if (this.handymanMarker) {
          this.handymanMarker.setLngLat([
            newHandymanLocation.lng,
            newHandymanLocation.lat,
          ]);
        }

        // Fit map to updated route bounds
        const coordinates = routeResponse.data.route.geometry.coordinates;
        if (coordinates && coordinates.length > 0) {
          const bounds = coordinates.reduce((bounds, coord) => {
            return bounds.extend(coord);
          }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

          this.routeMap.fitBounds(bounds, {
            padding: { top: 50, bottom: 50, left: 50, right: 50 },
            maxZoom: 15,
            duration: 1000, // Smooth transition
          });
        }
      } catch (error) {
        // Silent fail - marker still updated
      }
    },
    async initializeRouteMap() {
      try {
        // Get Mapbox token from server
        const tokenResponse = await axios.get(`${URL}/mapbox-token`);
        if (!tokenResponse.data.success || !tokenResponse.data.token) {
          this.toast?.showError("אויי חבל, לא הצלחנו לטעון את המפה");
          return;
        }

        mapboxgl.accessToken = tokenResponse.data.token;

        // Get starting location (fixed - where handyman started) and job location
        // Route line goes from starting location to job location
        const startingLoc = this.handymanStartingLocation;
        if (
          !startingLoc ||
          !this.jobLocation ||
          typeof startingLoc?.lat !== "number" ||
          typeof startingLoc?.lng !== "number" ||
          typeof this.jobLocation?.lat !== "number" ||
          typeof this.jobLocation?.lng !== "number"
        ) {
          this.toast?.showError("אויי חבל, המיקומים לא תקינים");
          return;
        }

        this.routeLoading = true;

        // Fetch route data from server - route from starting location to job location
        const routeResponse = await axios.get(`${URL}/route-data`, {
          params: {
            originLat: startingLoc.lat,
            originLng: startingLoc.lng,
            destLat: this.jobLocation.lat,
            destLng: this.jobLocation.lng,
          },
        });

        if (!routeResponse.data.success) {
          this.toast?.showError("אויי חבל, לא הצלחנו לטעון את המסלול");
          this.routeLoading = false;
          return;
        }

        this.routeData = routeResponse.data;
        this.travelTimeMinutes = routeResponse.data.route.durationMinutes;

        // Wait for DOM to be ready
        await this.$nextTick();

        const mapContainer = this.$refs.routeMapContainer;
        if (!mapContainer) {
          this.routeLoading = false;
          return;
        }

        // Initialize map - Mapbox expects [lng, lat]
        this.routeMap = new mapboxgl.Map({
          container: mapContainer,
          style: "mapbox://styles/mapbox/streets-v12",
          center: [
            routeResponse.data.center.lng,
            routeResponse.data.center.lat,
          ],
          zoom: 13,
        });

        // Wait for map to load
        this.routeMap.on("load", () => {
          // Add route layer
          if (
            this.routeMap.getSource("route") &&
            this.routeMap.getLayer("route")
          ) {
            this.routeMap.removeLayer("route");
            this.routeMap.removeSource("route");
          }

          this.routeMap.addSource("route", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: routeResponse.data.route.geometry,
            },
          });

          this.routeMap.addLayer({
            id: "route",
            type: "line",
            source: "route",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#ff6a00",
              "line-width": 5,
              "line-opacity": 0.9,
            },
          });

          // Add handyman marker (CURRENT location - dynamic)
          // The marker shows the handyman's current position, not the starting point
          if (this.handymanMarker) {
            this.handymanMarker.remove();
          }

          // Get current handyman location (dynamic) - if available, use it for marker
          const currentHandymanLoc =
            this.cachedLastHandymanLocation || this.lastHandymanLocation;
          const handymanMarkerLocation = currentHandymanLoc || startingLoc; // Fallback to starting location if no current location

          // Create custom marker element for better visibility
          const handymanMarkerEl = document.createElement("div");
          handymanMarkerEl.className = "handyman-marker";
          handymanMarkerEl.style.width = "20px";
          handymanMarkerEl.style.height = "20px";
          handymanMarkerEl.style.borderRadius = "50%";
          handymanMarkerEl.style.backgroundColor = "#ff6a00";
          handymanMarkerEl.style.border = "3px solid white";
          handymanMarkerEl.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";
          handymanMarkerEl.style.cursor = "pointer";

          this.handymanMarker = new mapboxgl.Marker({
            element: handymanMarkerEl,
            anchor: "center",
          })
            .setLngLat([handymanMarkerLocation.lng, handymanMarkerLocation.lat])
            .addTo(this.routeMap);

          // Add destination marker (job) - Mapbox expects [lng, lat]
          const jobMarkerEl = document.createElement("div");
          jobMarkerEl.className = "job-marker";
          jobMarkerEl.style.width = "20px";
          jobMarkerEl.style.height = "20px";
          jobMarkerEl.style.borderRadius = "50%";
          jobMarkerEl.style.backgroundColor = "#22c55e";
          jobMarkerEl.style.border = "3px solid white";
          jobMarkerEl.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";
          jobMarkerEl.style.cursor = "pointer";

          new mapboxgl.Marker({
            element: jobMarkerEl,
            anchor: "center",
          })
            .setLngLat([
              routeResponse.data.destination.lng,
              routeResponse.data.destination.lat,
            ])
            .addTo(this.routeMap);

          // Fit map to route bounds
          const coordinates = routeResponse.data.route.geometry.coordinates;
          if (coordinates && coordinates.length > 0) {
            const bounds = coordinates.reduce((bounds, coord) => {
              return bounds.extend(coord);
            }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

            this.routeMap.fitBounds(bounds, {
              padding: { top: 50, bottom: 50, left: 50, right: 50 },
              maxZoom: 15,
            });
          }

          this.routeLoading = false;
        });

        this.routeMap.on("error", () => {
          this.routeLoading = false;
          this.toast?.showError("אויי חבל, לא הצלחנו לטעון את המפה");
        });
      } catch (error) {
        this.routeLoading = false;
        this.toast?.showError("אויי חבל, לא הצלחנו לטעון את המפה");
      }
    },
    getRouteMapImage() {
      // Get route map image from server with both locations
      // Use cached location if available, otherwise use computed
      const handymanLoc =
        this.cachedLastHandymanLocation || this.lastHandymanLocation;
      if (
        !handymanLoc ||
        !this.jobLocation ||
        typeof handymanLoc?.lat !== "number" ||
        typeof handymanLoc?.lng !== "number" ||
        typeof this.jobLocation?.lat !== "number" ||
        typeof this.jobLocation?.lng !== "number"
      ) {
        return "";
      }
      const handyman = handymanLoc;
      const job = this.jobLocation;
      const width = 800;
      const height = 600;
      return `${URL}/route-map-image?originLat=${handyman.lat}&originLng=${handyman.lng}&destLat=${job.lat}&destLng=${job.lng}&width=${width}&height=${height}`;
    },
    getRouteWazeUrl() {
      if (
        !this.jobLocation ||
        typeof this.jobLocation?.lat !== "number" ||
        typeof this.jobLocation?.lng !== "number"
      ) {
        return "#";
      }
      const job = this.jobLocation;
      // Waze route URL
      return `https://www.waze.com/ul?ll=${job.lat},${job.lng}&navigate=yes`;
    },
    getRouteGoogleMapsUrl() {
      // Use cached location if available, otherwise use computed
      const handymanLoc =
        this.cachedLastHandymanLocation || this.lastHandymanLocation;
      if (
        !handymanLoc ||
        !this.jobLocation ||
        typeof handymanLoc?.lat !== "number" ||
        typeof handymanLoc?.lng !== "number" ||
        typeof this.jobLocation?.lat !== "number" ||
        typeof this.jobLocation?.lng !== "number"
      ) {
        return "#";
      }
      const handyman = handymanLoc;
      const job = this.jobLocation;
      // Google Maps route URL with origin and destination
      return `https://www.google.com/maps/dir/?api=1&origin=${handyman.lat},${handyman.lng}&destination=${job.lat},${job.lng}&travelmode=driving`;
    },

    getLocationMapImage(location) {
      if (typeof location === "object" && location.lat && location.lng) {
        const zoom = 15;
        const width = 400;
        const height = 300;
        return `${URL}/location-map-image?lat=${location.lat}&lng=${location.lng}&zoom=${zoom}&width=${width}&height=${height}`;
      }
      return "";
    },

    onMapImageError() {
      // אפשר להשאיר ריק / או להחליף ל-fallback כמו שעשית אצלך
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
      if (
        location &&
        typeof location === "object" &&
        typeof location.lat === "number" &&
        typeof location.lng === "number"
      ) {
        return `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
      }
      return "";
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
      // A step is completed if its order is strictly less than the current status order
      // This means when status is "on_the_way" (2), "assigned" (1) is completed
      return stepOrder < currentOrder;
    },
    isStepActive(stepStatus) {
      // A step is active if it matches the current status exactly
      return stepStatus === this.jobStatus;
    },
    getStatusButtonClass(status) {
      // Base class
      const baseClass = "chip--primary";

      // If this status is currently being updated, return active class
      if (this.currentStatusUpdate === status) {
        const activeClasses = {
          on_the_way: "chip--status-active chip--status-on-the-way",
          in_progress: "chip--status-active chip--status-in-progress",
          done: "chip--status-active chip--status-done",
        };
        return `${baseClass} ${activeClasses[status] || ""}`;
      }

      return baseClass;
    },

    async sendMessage() {
      const t = this.newMessage.trim();
      if (!t) return;

      const job = this.currentJob;
      const jobId = job?.id || job?._id;
      if (!jobId) return;

      const userId = this.store?.user?._id;
      if (!userId) {
        this.toast?.showError("אויי חבל, לא הצלחנו לזהות את המשתמש");
        return;
      }

      // Create temporary ID for optimistic message
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const tempCreatedAt = new Date();

      // Add optimistic message
      this.messages.push({
        sender: "me",
        text: t,
        time: tempCreatedAt.toLocaleTimeString("he-IL", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        createdAt: tempCreatedAt,
        tempId, // Mark as temporary
      });
      this.updateMessagesCache();

      this.newMessage = "";
      this.scrollToBottom();

      try {
        await axios.post(`${URL}/jobs/${jobId}/messages`, {
          text: t,
          senderId: userId,
          isHandyman: this.isHandyman,
        });
        // Message will be updated via WebSocket, but we keep the optimistic one
        // until the real one arrives (addMessageToUI will handle replacement)
      } catch (e) {
        // Remove optimistic message on error
        const index = this.messages.findIndex((m) => m.tempId === tempId);
        if (index !== -1) {
          this.messages.splice(index, 1);
        }
        this.toast?.showError("אויי חבל, לא הצלחנו לשלוח את ההודעה");
      }
    },

    handleFileSelect(e) {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        this.toast?.showError("יש לבחור קובץ תמונה בלבד");
        e.target.value = "";
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        this.toast?.showError("הקובץ גדול מדי. מקסימום 5MB");
        e.target.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        this.imagePreview = ev.target.result;
        this.imagePreviewFile = file;
        this.imagePreviewText = "";
        // Autofocus on the text input after image is loaded
        this.$nextTick(() => {
          if (this.$refs.imagePreviewTextInput) {
            this.$refs.imagePreviewTextInput.focus();
          }
        });
      };
      reader.readAsDataURL(file);

      e.target.value = "";
      this.showTools = false;
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

      // Create temporary ID for optimistic message
      const tempId = `temp-img-${Date.now()}-${Math.random()}`;
      const tempCreatedAt = new Date();

      // Add optimistic message with tempId
      this.messages.push({
        sender: "me",
        image: this.imagePreview,
        text: imageText || null,
        time: tempCreatedAt.toLocaleTimeString("he-IL", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        createdAt: tempCreatedAt,
        tempId, // Mark as temporary
      });
      this.updateMessagesCache();

      this.cancelImagePreview();
      this.scrollToBottom();

      try {
        const formData = new FormData();
        formData.append("image", file);

        const { data } = await axios.post(`${URL}/upload-image`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (data.imageUrl) {
          await this.sendImageMessage(data.imageUrl, imageText);
        }
      } catch (e) {
        // Remove optimistic message on error
        const index = this.messages.findIndex((m) => m.tempId === tempId);
        if (index !== -1) {
          this.messages.splice(index, 1);
        }
        this.toast?.showError("אויי חבל, לא הצלחנו להעלות את התמונה");
      }
    },

    async sendImageMessage(imageUrl, text = null) {
      const job = this.currentJob;
      const jobId = job?.id || job?._id;
      if (!jobId) return;

      const userId = this.store?.user?._id;
      if (!userId) {
        this.toast?.showError("אויי חבל, לא הצלחנו לזהות את המשתמש");
        return;
      }

      try {
        await axios.post(`${URL}/jobs/${jobId}/messages`, {
          imageUrl,
          text: text || undefined,
          senderId: userId,
          isHandyman: this.isHandyman,
        });
      } catch (e) {
        this.toast?.showError("אויי חבל, לא הצלחנו לשלוח את התמונה");
      }
    },

    openImage(src) {
      this.imageModal = src;
    },
    handleViewImages() {
      if (this.hasJobImages && this.jobImages.length > 0) {
        this.showImageGallery = true;
        this.currentImageIndex = 0;
      } else {
        this.toast?.showWarning("אין תמונות להצגה");
      }
    },
    handleImageLoad(image, index) {
      // Image loaded successfully
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
      this.toast?.showError("אויי חבל, לא הצלחנו לטעון את התמונה");
    },

    async updateStatus(newStatus) {
      try {
        const job = this.currentJob;
        const endpoint = `/jobs/${newStatus.replaceAll("_", "-")}`;

        // Get handymanId - handle both array and single value
        let handymanId = job.handymanId;
        if (Array.isArray(handymanId) && handymanId.length > 0) {
          // If it's an array, use the first handyman (or find current user's ID)
          const userId = this.store.user?._id || this.store.user?.id;
          const userIdString = userId?.toString();
          const foundHandyman = handymanId.find(
            (id) => String(id) === userIdString
          );
          handymanId = foundHandyman || handymanId[0];
        }

        // Send status update IMMEDIATELY - don't wait for location
        await axios.post(`${URL}${endpoint}`, {
          jobId: job._id || job.id,
          handymanId: handymanId,
        });

        // Send handyman location in the background (don't await - let it happen async)
        // This way status update is sent immediately to client
        if (this.isHandyman) {
          // Fire and forget - send location in background
          this.getCurrentLocation()
            .then((loc) => {
              const location = {
                lat: loc.lat,
                lng: loc.lon,
                accuracy: loc.accuracy,
              };
              // Send location message to customer
              const jobId = job._id || job.id;
              const userId = this.store?.user?._id;
              if (jobId && userId) {
                axios
                  .post(`${URL}/jobs/${jobId}/messages`, {
                    location,
                    senderId: userId,
                    isHandyman: true,
                  })
                  .catch(() => {
                    // Silent fail - location sending is optional
                  });
              }
            })
            .catch(() => {
              // Silent fail if location is not available
            });
        }

        // Set current status update for active button state
        this.currentStatusUpdate = newStatus;
        // Reset after a short delay
        setTimeout(() => {
          if (this.currentStatusUpdate === newStatus) {
            this.currentStatusUpdate = null;
          }
        }, 2000);

        // Update local status immediately (will be synced via WebSocket too)
        this.localJobStatus = newStatus;

        // Emit event to parent - DO NOT clear messages, they should remain
        this.$emit("status-updated", newStatus);
      } catch (err) {
        this.toast.showError("אויי חבל, לא הצלחנו לעדכן את הסטטוס");
      }
    },

    async submitRating() {
      if (this.rating === 0) {
        this.toast.showError("אנא בחר דירוג");
        return;
      }
      try {
        const job = this.currentJob;
        const customerId = this.store?.user?._id || job?.clientId;
        if (!customerId) {
          this.toast.showError("אויי חבל, לא הצלחנו לזהות את הלקוח");
          return;
        }

        // Get handymanId - handle both array and single value
        let handymanId = job.handymanId;
        if (Array.isArray(handymanId) && handymanId.length > 0) {
          // If it's an array, use the first handyman (usually there's only one for rating)
          handymanId = handymanId[0];
        }

        const response = await axios.post(`${URL}/jobs/rate`, {
          jobId: job._id || job.id,
          handymanId: handymanId,
          customerId,
          rating: this.rating,
          review: this.reviewText,
        });

        // Check if the response indicates success
        if (response.data && response.data.success) {
          this.toast.showSuccess("הדירוג נשלח");
          const jobIdStr = String(job._id || job.id);
          this.ratingSubmittedJobs[jobIdStr] = true;
          this.$emit("rating-submitted", job);
          const userId = this.store?.user?._id || this.$route.params.id;
          this.$router.push(
            `/Dashboard/${userId}/job-summary/${job._id || job.id}`
          );
        } else {
          // If response doesn't indicate success, show error
          this.toast.showError("אויי חבל, לא הצלחנו לשלוח את הדירוג");
        }
      } catch (e) {
        // Check if it's actually a successful response that was caught as error
        if (e.response && e.response.data && e.response.data.success) {
          // Request succeeded despite error (network issue after response)
          this.toast.showSuccess("הדירוג נשלח");
          const jobIdStr = String(job._id || job.id);
          this.ratingSubmittedJobs[jobIdStr] = true;
          this.$emit("rating-submitted", job);
          const userId = this.store?.user?._id || this.$route.params.id;
          this.$router.push(
            `/Dashboard/${userId}/job-summary/${job._id || job.id}`
          );
        } else {
          if (e.response?.data?.message) {
            this.toast.showError(e.response.data.message);
          } else {
            this.toast.showError("אויי חבל, לא הצלחנו לשלוח את הדירוג");
          }
        }
      }
    },

    scrollToBottom() {
      this.$nextTick(() => {
        const el = this.$refs.messagesContainer;
        if (el) el.scrollTop = el.scrollHeight;
      });
    },

    openCancel() {
      this.showMenu = false;
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
        const job = this.currentJob;
        const jobId = job._id || job.id;
        if (!jobId) return;

        const userId = this.store.user?._id || this.store.user?.id;
        if (!userId) {
          this.toast.showError("אויי חבל, לא מצאנו מזהה משתמש");
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
        } else if (this.cancelAction === "delete") {
          // Delete job completely (client only)
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
        } else if (this.cancelAction === "cancel-complete") {
          // Complete cancellation (client only)
          await axios.delete(`${URL}/jobs/${jobId}`, {
            data: {
              userId,
              cancel: {
                personcancel: personCancel,
                "reason-for-cancellation": this.cancelReasonText.trim(),
                "Totally-cancels": true,
                JobId: jobId,
              },
            },
          });

          this.toast.showSuccess("העבודה בוטלה לגמרי");
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
      } catch (e) {
        this.toast.showError(
          e.response?.data?.message || "שגיאה בביטול העבודה"
        );
      } finally {
        this.isCancellingJob = false;
      }
    },
    handleVisibilityChange() {
      // Save messages when page becomes hidden (minimized, tab switch, etc.)
      if (document.hidden) {
        this.saveMessagesBeforeUnload();
      }
    },
    saveMessagesBeforeUnload() {
      // Save all messages to sessionStorage
      const job = this.currentJob;
      const jobId = job?.id || job?._id;
      if (!jobId || !this.messages.length) return;

      const jobIdStr = String(jobId);
      try {
        const storageKey = `chat_messages_${jobIdStr}`;
        const messagesToStore = this.messages.map((msg) => ({
          ...msg,
          createdAt: msg.createdAt
            ? msg.createdAt.toISOString()
            : new Date().toISOString(),
        }));
        sessionStorage.setItem(storageKey, JSON.stringify(messagesToStore));
        // Also update in-memory cache
        this.messagesCache[jobIdStr] = [...this.messages];
      } catch (e) {
        // Silently fail if sessionStorage is not available
      }
    },
    selectedSubcategoryPrice() {
      const job = this.currentJob;
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
    onSubcategoryChange() {
      // Reset price change when subcategory changes
      this.priceChangePercent = 0;
      this.calculateNewPrice();
    },
    calculateNewPrice() {
      // Use selected subcategory price if available, otherwise use total job price
      const basePrice =
        this.selectedSubcategoryPrice !== null
          ? this.selectedSubcategoryPrice
          : this.currentJobPrice;

      if (!basePrice || this.priceChangePercent === 0) {
        this.newPrice = basePrice;
        this.priceChangeAmount = 0;
        return;
      }

      // Limit to -20% to +20%
      const percent = Math.max(-20, Math.min(20, this.priceChangePercent));
      this.priceChangePercent = percent;

      // Calculate new price
      const changeMultiplier = 1 + percent / 100;
      this.newPrice = Math.round(basePrice * changeMultiplier * 100) / 100;
      this.priceChangeAmount = this.newPrice - basePrice;
    },
    async submitPriceChange() {
      if (this.priceChangePercent === 0 || this.isUpdatingPrice) return;

      const job = this.currentJob;
      const jobId = job?.id || job?._id;
      if (!jobId) return;

      // Check if subcategory selection is required
      if (
        job?.subcategoryInfo &&
        Array.isArray(job.subcategoryInfo) &&
        job.subcategoryInfo.length > 1 &&
        (this.selectedSubcategoryIndex === null ||
          this.selectedSubcategoryIndex === undefined)
      ) {
        this.toast?.showError("אויי חבל, אנא בחר עבודה");
        return;
      }

      const userId = this.store?.user?._id;
      if (!userId) {
        this.toast?.showError("אויי חבל, לא הצלחנו לזהות את המשתמש");
        return;
      }

      this.isUpdatingPrice = true;

      try {
        // Determine old price (subcategory price or total job price)
        const oldPrice =
          this.selectedSubcategoryPrice !== null
            ? this.selectedSubcategoryPrice
            : this.currentJobPrice;

        // Send price change request via WebSocket
        if (this.socket && this.socket.connected) {
          this.socket.emit("price-change-request", {
            jobId: String(jobId),
            handymanId: String(userId),
            percent: this.priceChangePercent,
            oldPrice: oldPrice,
            newPrice: this.newPrice,
            changeAmount: this.priceChangeAmount,
            subcategoryIndex:
              this.selectedSubcategoryIndex !== null
                ? this.selectedSubcategoryIndex
                : undefined,
          });

          // Add system message to chat (for handyman - he sees his own request)
          const systemMessage = {
            sender: "system",
            text: `שלחת בקשה ${
              this.priceChangePercent > 0 ? "להעלות" : "להוריד"
            } את המחיר ב-${Math.abs(this.priceChangePercent).toFixed(1)}%`,
            time: new Date().toLocaleTimeString("he-IL", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            createdAt: new Date(),
            isSystem: true,
          };
          this.messages.push(systemMessage);
          this.updateMessagesCache();
          this.scrollToBottom();

          this.toast?.showSuccess("בקשת שינוי המחיר נשלחה ללקוח");
          this.showPriceUpdateModal = false;
          this.priceChangePercent = 0;
          this.newPrice = this.currentJobPrice;
          this.priceChangeAmount = 0;
          this.selectedSubcategoryIndex = null;
        } else {
          this.toast?.showError("אויי חבל, אין חיבור לשרת. אנא נסה שוב.");
        }
      } catch (error) {
        this.toast?.showError("אויי חבל, לא הצלחנו לשלוח את בקשת שינוי המחיר");
      } finally {
        this.isUpdatingPrice = false;
      }
    },
    approvePriceChange() {
      if (this.isRespondingToPriceChange) return;

      this.isRespondingToPriceChange = true;

      try {
        if (this.socket && this.socket.connected) {
          this.socket.emit("price-change-response", {
            jobId: String(this.pendingPriceChange.jobId),
            approved: true,
            percent: this.pendingPriceChange.percent,
            oldPrice: this.pendingPriceChange.oldPrice,
            newPrice: this.pendingPriceChange.newPrice,
          });

          // Add system message (for client - he sees his own approval)
          const systemMessage = {
            sender: "system",
            text: `אישרת את שינוי המחיר. המחיר החדש: ${this.pendingPriceChange.newPrice} ₪`,
            time: new Date().toLocaleTimeString("he-IL", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            createdAt: new Date(),
            isSystem: true,
          };
          this.messages.push(systemMessage);
          this.updateMessagesCache();
          this.scrollToBottom();

          this.toast?.showSuccess("שינוי המחיר אושר");
          this.showPriceApprovalModal = false;
          // Emit event to parent to refresh job data
          this.$emit("price-updated", {
            jobId: String(this.pendingPriceChange.jobId),
            newPrice: this.pendingPriceChange.newPrice,
          });
        } else {
          this.toast?.showError("אויי חבל, אין חיבור לשרת. אנא נסה שוב.");
        }
      } catch (error) {
        this.toast?.showError("אויי חבל, לא הצלחנו לאשר את שינוי המחיר");
      } finally {
        this.isRespondingToPriceChange = false;
      }
    },
    rejectPriceChange() {
      if (this.isRespondingToPriceChange) return;

      this.isRespondingToPriceChange = true;

      try {
        if (this.socket && this.socket.connected) {
          this.socket.emit("price-change-response", {
            jobId: String(this.pendingPriceChange.jobId),
            approved: false,
            percent: this.pendingPriceChange.percent,
            oldPrice: this.pendingPriceChange.oldPrice,
            newPrice: this.pendingPriceChange.newPrice,
          });

          // Add system message (for client - he sees his own rejection)
          const systemMessage = {
            sender: "system",
            text: "דחית את בקשת שינוי המחיר",
            time: new Date().toLocaleTimeString("he-IL", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            createdAt: new Date(),
            isSystem: true,
          };
          this.messages.push(systemMessage);
          this.updateMessagesCache();
          this.scrollToBottom();

          this.toast?.showSuccess("בקשת שינוי המחיר נדחתה");
          this.showPriceApprovalModal = false;
        } else {
          this.toast?.showError("אויי חבל, אין חיבור לשרת. אנא נסה שוב.");
        }
      } catch (error) {
        this.toast?.showError("אויי חבל, לא הצלחנו לדחות את שינוי המחיר");
      } finally {
        this.isRespondingToPriceChange = false;
      }
    },

    async loadRelatedJobs() {
      const job = this.currentJob;
      const jobId = job?._id || job?.id;
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
      const job = this.currentJob;
      if (!this.isSplitCall || !this.relatedJobs.length) {
        return job?.handymanName || "הנדימן";
      }

      // Find which handyman requested the price change
      const currentJobId = String(job?._id || job?.id || "");
      const jobWithPriceChange = this.relatedJobs.find(
        (rj) =>
          String(rj._id) === currentJobId &&
          rj.priceChangeRequest &&
          rj.priceChangeRequest.status === "pending"
      );

      if (jobWithPriceChange && jobWithPriceChange.handymanName) {
        return jobWithPriceChange.handymanName;
      }

      return job?.handymanName || "הנדימן";
    },
  },
};
</script>

<style scoped lang="scss">
$bg: #0b0b0f;
$text: rgba(255, 255, 255, 0.92);
$muted: rgba(255, 255, 255, 0.6);
$orange: #ff6a00;
$orange2: #ff8a2b;

.chat {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: $bg;
  z-index: 100002;
  overflow: hidden;
}

/* Header */
.chat__header {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 10px;
  background: rgba(255, 255, 255, 0.06);
  border-bottom: 1px solid rgba($orange, 0.14);
  flex-shrink: 0;
}

/* Tabs */
.chat__tabs {
  display: flex;
  gap: 0;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba($orange, 0.14);
  flex-shrink: 0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.chat__tabs::-webkit-scrollbar {
  display: none;
}

.chat__tab {
  flex: 1;
  min-width: 0;
  padding: 10px 8px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  font-weight: 900;
  text-align: center;
  border-bottom: 2px solid transparent;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.chat__tab:hover {
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.03);
}

.chat__tab--active {
  color: $orange2;
  border-bottom-color: $orange;
  background: rgba($orange, 0.08);
}

.chat__tabName {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.chat__tabBadge {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: $orange;
  color: #0b0c10;
  font-size: 10px;
  font-weight: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.chat__iconBtn {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.22);
  color: $text;
  font-size: 18px;
  display: grid;
  place-items: center;
}

.chat__headInfo {
  flex: 1;
  min-width: 0;
}

.chat__title {
  font-size: 16px;
  font-weight: 1000;
  color: $text;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat__subtitle {
  margin-top: 2px;
  font-size: 11px;
  font-weight: 800;
  color: $muted;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat__headRight {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  z-index: 5;
}

.chat__status {
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 1000;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.2);
  color: $text;
  white-space: nowrap;
}

.chat__status.status--new {
  border-color: rgba($orange, 0.3);
  color: $orange;
}
.chat__status.status--move {
  border-color: rgba($orange2, 0.38);
  color: $orange2;
}
.chat__status.status--work {
  border-color: rgba(59, 130, 246, 0.45);
  color: #3b82f6;
}
.chat__status.status--done {
  border-color: rgba(16, 185, 129, 0.5);
  color: #10b981;
}

/* Menu */
.chat__menu {
  position: absolute;
  top: 58px;
  left: 10px;
  right: 10px;
  padding: 10px;
  border-radius: 14px;
  background: rgba(15, 16, 20, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 18px 46px rgba(0, 0, 0, 0.55);
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 50;
}

.chat__menuItem {
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  font-weight: 900;
  text-align: center;
}

.chat__menuItem--danger {
  border-color: rgba(239, 68, 68, 0.35);
  color: #ef4444;
  background: rgba(239, 68, 68, 0.12);
}

/* Action chips */
.status-update-wrapper {
  display: flex;
  align-items: center;
}

.status-update-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.status-update-label-inline {
  font-size: 11px;
  opacity: 0.85;
  font-weight: 500;
}

.chat__actions {
  display: flex;
  gap: 8px;
  padding: 10px 10px 8px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  flex-shrink: 0;
}

.chat__actions::-webkit-scrollbar {
  display: none;
}

.chip {
  flex: 0 0 auto;
  padding: 10px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 1000;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.22);
  color: $text;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition: all 0.2s ease;

  &:active {
    transform: scale(0.95);
    opacity: 0.8;
  }
}

.chip--primary {
  border-color: rgba($orange, 0.5);
  background: linear-gradient(
    135deg,
    rgba($orange, 0.95),
    rgba($orange2, 0.92)
  );
  color: #0b0c10;
}

.chip--ghost {
  border-color: rgba($orange, 0.18);
}

/* Active status button styles */
.chip--status-active {
  animation: pulse 0.5s ease-in-out;
  transform: scale(1.02);
}

.chip--status-on-the-way {
  border-color: rgba($orange2, 0.7);
  background: linear-gradient(
    135deg,
    rgba($orange2, 0.98),
    rgba(255, 180, 107, 0.95)
  );
  box-shadow: 0 0 20px rgba($orange2, 0.4);
}

.chip--status-in-progress {
  border-color: rgba(59, 130, 246, 0.7);
  background: linear-gradient(
    135deg,
    rgba(59, 130, 246, 0.98),
    rgba(96, 165, 250, 0.95)
  );
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
}

.chip--status-done {
  border-color: rgba(16, 185, 129, 0.7);
  background: linear-gradient(
    135deg,
    rgba(16, 185, 129, 0.98),
    rgba(52, 211, 153, 0.95)
  );
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

/* Stepper */
.chat__stepper {
  display: flex;
  gap: 10px;
  padding: 10px;
  overflow-x: auto;
  border-bottom: 1px solid rgba($orange, 0.1);
  background: rgba(0, 0, 0, 0.18);
  flex-shrink: 0;
}

.chat__stepper--desktop {
  @media (max-width: 480px) {
    display: none;
  }
}
.chat__stepper::-webkit-scrollbar {
  display: none;
}

.step {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: $text;
  flex: 0 0 auto;
}

.step__dot {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 1000;
  border: 2px solid rgba($orange, 0.22);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.65);
}

.step.is-active .step__dot {
  border-color: rgba($orange, 0.8);
  background: rgba($orange, 0.16);
  color: $orange2;
}

.step.is-done .step__dot {
  border-color: rgba(34, 197, 94, 0.5);
  background: rgba(34, 197, 94, 0.16);
  color: #22c55e;
}

.step__label {
  font-size: 12px;
  font-weight: 900;
  white-space: nowrap;
}

/* Rating */
.chat__rating {
  padding: 12px 10px;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba($orange, 0.14);
  flex-shrink: 0;
}

.chat__ratingTitle {
  color: $orange2;
  font-weight: 1000;
  margin-bottom: 8px;
  font-size: 13px;
}

.chat__stars {
  display: flex;
  flex-direction: row-reverse;
  justify-content: center;
  gap: 4px;
  margin-bottom: 8px;
}
.chat__stars input {
  display: none;
}
.star {
  font-size: 22px;
  opacity: 0.25;
  color: $orange2;
}
.star.is-on {
  opacity: 1;
}

.chat__review {
  width: 100%;
  border-radius: 14px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba(0, 0, 0, 0.16);
  color: $text;
  padding: 10px;
  font-weight: 800;
  font-size: 14px;
  outline: none;
  resize: vertical;
  margin-bottom: 10px;
  font-family: inherit;
}

.chat__rateBtn {
  width: 100%;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid rgba($orange, 0.55);
  background: linear-gradient(135deg, $orange, $orange2);
  color: #0b0c10;
  font-weight: 1100;
}

/* Messages */
.chat__messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  -webkit-overflow-scrolling: touch;
}

.chat__empty {
  margin: auto;
  color: rgba(255, 255, 255, 0.55);
  font-weight: 900;
  font-size: 14px;
}

.msg {
  display: flex;
}
.msg.is-me {
  justify-content: flex-end;
}

.msg.is-system {
  justify-content: center;
  margin: 12px 0;
}

.bubble {
  max-width: 86%;
  padding: 10px 12px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
}

.bubble--me {
  background: linear-gradient(
    135deg,
    rgba($orange, 0.95),
    rgba($orange2, 0.92)
  );
  border-color: rgba($orange, 0.55);
  color: #0b0c10;
}

.bubble--system {
  background: rgba(255, 106, 0, 0.15);
  border-color: rgba(255, 106, 0, 0.3);
  color: rgba(255, 106, 0, 0.9);
  font-size: 12px;
  padding: 8px 12px;
  max-width: 70%;
  text-align: center;
}

.bubble__text {
  font-size: 14px;
  font-weight: 750;
  line-height: 1.5;
}
.bubble__meta {
  margin-top: 6px;
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  opacity: 0.75;
}
.bubble__time,
.bubble__tick {
  font-size: 9px;
  font-weight: 1000;
}

.bubble__imgBtn {
  border: 0;
  background: transparent;
  padding: 0;
  margin-bottom: 8px;
  width: 100%;
}
.bubble__img {
  width: 100%;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  display: block;
}

.bubble__loc {
  width: 100%;
  border: 0;
  background: transparent;
  padding: 0;
  margin-bottom: 8px;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}
.bubble__locMap {
  width: 100%;
  height: 140px;
  object-fit: cover;
  display: block;
  border: 1px solid rgba($orange, 0.18);
  border-radius: 12px;
}
.bubble__locOverlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 10px;
  font-weight: 1000;
  font-size: 12px;
  color: white;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.75),
    rgba(0, 0, 0, 0.25),
    transparent
  );
}

/* Composer */
.composer {
  position: sticky;
  bottom: 0;
  display: flex;
  gap: 8px;
  align-items: flex-end;
  padding: 10px;
  padding-bottom: calc(10px + env(safe-area-inset-bottom));
  border-top: 1px solid rgba($orange, 0.14);
  background: rgba(0, 0, 0, 0.35);
  flex-shrink: 0;
}

.composer__plus {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  border: 1px solid rgba($orange, 0.22);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  font-size: 20px;
  display: grid;
  place-items: center;
}

.composer__input {
  flex: 1;
  height: 42px;
  border-radius: 999px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  padding: 0 14px;
  font-weight: 900;
  outline: none;
  font-size: 16px;
  font-family: inherit;
}

.composer__send {
  height: 42px;
  padding: 0 16px;
  border-radius: 999px;
  border: 1px solid rgba($orange, 0.55);
  background: linear-gradient(135deg, $orange, $orange2);
  color: #0b0c10;
  font-weight: 1100;
  font-size: 13px;
}

.composer__send:disabled {
  opacity: 0.55;
}

.composer__preview {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0; // Allow flex shrinking
}
.composer__previewTop {
  position: relative;
  width: 100%;
  max-width: 220px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba($orange, 0.2);
  flex-shrink: 0; // Don't shrink the image
}
.composer__previewImg {
  width: 100%;
  display: block;
  max-height: 200px;
  object-fit: cover;
}
.composer__previewClose {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-weight: 1000;
}

// Ensure the input inside preview is at least the same size as regular input, but taller
.composer__preview .composer__input {
  flex: 1;
  min-width: 0; // Allow flex shrinking
  width: 100%; // Take full width of parent
  height: 50px; // Taller than regular input (42px)
  min-height: 50px; // Ensure minimum height
}

/* Tools sheet */
.toolsSheet {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  z-index: 10050;
  display: flex;
  align-items: flex-end;
}

.toolsSheet__card {
  width: 100%;
  border-radius: 18px 18px 0 0;
  background: rgba(15, 16, 20, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toolsSheet__item,
.toolsSheet__close {
  width: 100%;
  padding: 14px;
  border-radius: 14px;
  border: 1px solid rgba($orange, 0.16);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  font-weight: 1000;
  text-align: center;
}
.toolsSheet__close {
  border-color: rgba(255, 255, 255, 0.12);
}

/* Modals */
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  z-index: 10100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.modal__card {
  position: relative;
  width: 100%;
  max-width: 520px;
  border-radius: 16px;
  overflow: hidden;
}
.modal__close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-weight: 1000;
  z-index: 2;
}
.modal__img {
  width: 100%;
  display: block;
}

/* Confirm */
.confirm {
  width: 100%;
  max-width: 420px;
  border-radius: 18px;
  background: rgba(15, 16, 20, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 18px;
  text-align: center;
}
.confirm__title {
  color: #fff;
  font-weight: 1000;
  font-size: 18px;
  margin-bottom: 10px;
}
.confirm__text {
  color: rgba(255, 255, 255, 0.75);
  font-weight: 800;
  font-size: 14px;
  margin-bottom: 14px;
}
.confirm__actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.confirm__actions--vertical {
  flex-direction: column;
}

.confirm__btn--cancel-handyman {
  background: rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.4);
  color: #3b82f6;
}

.confirm__btn--cancel-complete {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.4);
  color: #ef4444;
}
.confirm__btn {
  padding: 12px 16px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  font-weight: 1000;
}
.confirm__btn--danger {
  border-color: rgba(239, 68, 68, 0.35);
  background: rgba(239, 68, 68, 0.14);
  color: #ef4444;
}

/* Cancel Reason Modal */
.cancelReasonModal {
  width: 100%;
  max-width: 450px;
  border-radius: 18px;
  background: rgba(15, 16, 20, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 80vh;
  overflow-y: auto;
}

.cancelReasonModal__title {
  color: #fff;
  font-weight: 1000;
  font-size: 18px;
  text-align: center;
  margin: 0 0 16px 0;
}

.cancelReasonModal__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
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
  gap: 10px;
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

/* Navigation Modal */
.navModal {
  background: rgba(15, 16, 20, 0.98);
  border-radius: 20px;
  padding: 24px;
  max-width: 90%;
  width: 320px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.navModal__title {
  font-size: 18px;
  font-weight: 1000;
  color: $text;
  text-align: center;
  margin-bottom: 20px;
}

.navModal__actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.navModal__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px 20px;
  border-radius: 14px;
  border: 1px solid;
  font-size: 16px;
  font-weight: 900;
  text-decoration: none;
  transition: all 0.2s ease;
  text-align: center;
}

.navModal__btn--waze {
  background: rgba(118, 186, 153, 0.15);
  border-color: rgba(118, 186, 153, 0.4);
  color: #76ba99;
}

.navModal__btn--waze:active {
  background: rgba(118, 186, 153, 0.25);
  transform: scale(0.98);
}

.navModal__btn--google {
  background: rgba(66, 133, 244, 0.15);
  border-color: rgba(66, 133, 244, 0.4);
  color: #4285f4;
}

.navModal__btn--google:active {
  background: rgba(66, 133, 244, 0.25);
  transform: scale(0.98);
}

.navModal__btnIcon {
  font-size: 20px;
}

.navModal__btnText {
  font-weight: 900;
}

.navModal__cancel {
  margin-top: 8px;
  padding: 14px 20px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s ease;
}

.navModal__cancel:active {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(0.98);
}

/* Location card */
.locCard {
  width: 100%;
  max-width: 420px;
  border-radius: 18px;
  overflow: hidden;
  background: $bg;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.locCard__close {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.65);
  color: #fff;
  font-weight: 1000;
  z-index: 2;
}
.locCard__map {
  width: 100%;
  height: 220px;
  object-fit: cover;
  display: block;
}
.locCard__body {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.locCard__title {
  color: $orange2;
  font-weight: 1000;
}
.locCard__coords {
  font-family: monospace;
  font-size: 11px;
  opacity: 0.75;
  color: $text;
}
.locCard__btn {
  padding: 12px;
  border-radius: 14px;
  text-decoration: none;
  text-align: center;
  font-weight: 1000;
  border: 1px solid;
}
.locCard__btn--waze {
  background: rgba(118, 186, 153, 0.15);
  border-color: rgba(118, 186, 153, 0.4);
  color: #76ba99;
}
.locCard__btn--gm {
  background: rgba(66, 133, 244, 0.15);
  border-color: rgba(66, 133, 244, 0.4);
  color: #4285f4;
}

/* Route Card Modal */
.route-modal {
  z-index: 10100;
}

.routeCard {
  width: 100%;
  max-width: 420px;
  border-radius: 18px;
  overflow: hidden;
  background: $bg;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.routeCard__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.routeCard__title {
  font-size: 18px;
  font-weight: 1000;
  color: $orange2;
  margin: 0;
}

.routeCard__close {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-weight: 1000;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.routeCard__mapWrapper {
  position: relative;
  width: 100%;
  height: 300px;
  background: rgba(0, 0, 0, 0.2);
}

.routeCard__map {
  width: 100%;
  height: 100%;
  border: none;
}

.routeCard__loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: $text;
  font-weight: 900;
  z-index: 10;
  background: rgba(0, 0, 0, 0.7);
  padding: 12px 20px;
  border-radius: 12px;
}

.routeCard__legend {
  position: absolute;
  bottom: 12px;
  right: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: rgba(0, 0, 0, 0.7);
  padding: 10px;
  border-radius: 12px;
  z-index: 10;
}

.routeCard__legendItem {
  display: flex;
  align-items: center;
  gap: 8px;
}

.routeCard__legendDot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.routeCard__legendDot--start {
  background: #ff6a00;
}

.routeCard__legendDot--end {
  background: #22c55e;
}

.routeCard__legendText {
  font-size: 12px;
  font-weight: 900;
  color: $text;
  white-space: nowrap;
}

.routeCard__body {
  padding: 16px;
}

.routeCard__info {
  margin-bottom: 16px;
}

.routeCard__infoRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.routeCard__infoRow--highlight {
  background: rgba($orange, 0.1);
  padding: 12px;
  border-radius: 12px;
  border-bottom: none;
  margin-top: 8px;
}

.routeCard__infoLabel {
  font-size: 13px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.7);
}

.routeCard__infoValue {
  font-size: 13px;
  font-weight: 1000;
  color: $text;
  font-family: monospace;
}

.routeCard__infoValue--time {
  color: $orange2;
  font-size: 16px;
  font-weight: 1100;
}

.routeCard__actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.routeCard__btn {
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

.routeCard__btn--google {
  background: rgba(66, 133, 244, 0.15);
  border-color: rgba(66, 133, 244, 0.4);
  color: #4285f4;
}

.routeCard__btn--google:hover {
  background: rgba(66, 133, 244, 0.25);
  border-color: rgba(66, 133, 244, 0.6);
}

.routeCard__btnIcon {
  font-size: 18px;
}

.routeCard__btnText {
  font-weight: 900;
}

.routeCard__backBtn {
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  font-weight: 1000;
  cursor: pointer;
  transition: all 0.2s ease;
}

.routeCard__backBtn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.routeCard__backBtn:active {
  transform: scale(0.98);
}

/* Price Update Modal */
.priceUpdateModal {
  width: 100%;
  max-width: 420px;
  border-radius: 18px;
  background: rgba(15, 16, 20, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.priceUpdateModal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.priceUpdateModal__title {
  font-size: 18px;
  font-weight: 1000;
  color: $orange2;
  margin: 0;
}

.priceUpdateModal__close {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-weight: 1000;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.priceUpdateModal__body {
  padding: 18px;
}

.priceUpdateModal__currentPrice {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  margin-bottom: 18px;
}

.priceUpdateModal__label {
  font-size: 14px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.7);
}

.priceUpdateModal__value {
  font-size: 18px;
  font-weight: 1000;
  color: $text;
}

.priceUpdateModal__value--new {
  color: $orange2;
  font-size: 20px;
}

.priceUpdateModal__change {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.priceUpdateModal__inputGroup {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba($orange, 0.2);
  border-radius: 12px;
  padding: 0 14px;
}

.priceUpdateModal__input {
  flex: 1;
  height: 48px;
  border: none;
  background: transparent;
  color: $text;
  font-size: 18px;
  font-weight: 1000;
  outline: none;
  text-align: center;
  font-family: inherit;
}

.priceUpdateModal__input::-webkit-inner-spin-button,
.priceUpdateModal__input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.priceUpdateModal__input[type="number"] {
  -moz-appearance: textfield;
}

.priceUpdateModal__percent {
  font-size: 18px;
  font-weight: 1000;
  color: $orange2;
}

.priceUpdateModal__newPrice {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: rgba($orange, 0.1);
  border-radius: 12px;
  border: 1px solid rgba($orange, 0.2);
}

.priceUpdateModal__changeAmount {
  text-align: center;
  padding: 8px;
}

.priceUpdateModal__changeText {
  font-size: 16px;
  font-weight: 1000;
}

.priceUpdateModal__changeText--increase {
  color: #22c55e;
}

.priceUpdateModal__changeText--decrease {
  color: #ef4444;
}

.priceUpdateModal__footer {
  display: flex;
  gap: 10px;
  padding: 18px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.priceUpdateModal__btn {
  flex: 1;
  padding: 14px;
  border-radius: 12px;
  border: none;
  font-size: 14px;
  font-weight: 1000;
  cursor: pointer;
  transition: all 0.2s ease;
}

.priceUpdateModal__btn--cancel {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: $text;
}

.priceUpdateModal__btn--submit {
  background: linear-gradient(135deg, $orange, $orange2);
  color: #0b0c10;
  box-shadow: 0 0 20px rgba($orange, 0.3);
}

.priceUpdateModal__btn--submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Price Approval Modal */
.priceApprovalModal {
  width: 100%;
  max-width: 420px;
  border-radius: 18px;
  background: rgba(15, 16, 20, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.priceApprovalModal__header {
  padding: 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.priceApprovalModal__title {
  font-size: 18px;
  font-weight: 1000;
  color: $orange2;
  margin: 0;
  text-align: center;
}

.priceApprovalModal__body {
  padding: 18px;
}

.priceApprovalModal__message {
  font-size: 16px;
  font-weight: 900;
  color: $text;
  text-align: center;
  line-height: 1.6;
  margin-bottom: 20px;
}

.priceApprovalModal__changePercent {
  font-weight: 1000;
  font-size: 18px;
}

.priceApprovalModal__changePercent--increase {
  color: #22c55e;
}

.priceApprovalModal__changePercent--decrease {
  color: #ef4444;
}

.priceApprovalModal__details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 14px;
}

.priceApprovalModal__detailRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.priceApprovalModal__detailRow:last-child {
  border-bottom: none;
}

.priceApprovalModal__detailLabel {
  font-size: 14px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.7);
}

.priceApprovalModal__detailValue {
  font-size: 16px;
  font-weight: 1000;
  color: $text;
}

.priceApprovalModal__detailValue--new {
  color: $orange2;
  font-size: 18px;
}

.priceApprovalModal__detailValue--increase {
  color: #22c55e;
}

.priceApprovalModal__detailValue--decrease {
  color: #ef4444;
}

.priceApprovalModal__footer {
  display: flex;
  gap: 10px;
  padding: 18px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.priceApprovalModal__btn {
  flex: 1;
  padding: 14px;
  border-radius: 12px;
  border: none;
  font-size: 14px;
  font-weight: 1000;
  cursor: pointer;
  transition: all 0.2s ease;
}

.priceApprovalModal__btn--reject {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: #ef4444;
}

.priceApprovalModal__btn--approve {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #0b0c10;
  box-shadow: 0 0 20px rgba(34, 197, 94, 0.3);
}

.priceApprovalModal__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Image Gallery Modal */
.image-gallery-modal {
  z-index: 10200 !important;
  background: rgba(0, 0, 0, 0.95) !important;
  display: flex !important;
  visibility: visible !important;
  opacity: 1 !important;
  position: fixed !important;
  inset: 0 !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 0 !important;
}

.image-gallery {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #000;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
  min-height: 0;
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
  padding: 12px 20px;
  border-radius: 12px;
  border: 2px solid rgba($orange, 0.5);
  background: rgba(0, 0, 0, 0.8);
  color: rgba($orange2, 0.9);
  font-weight: 900;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

.image-gallery__close:active {
  background: rgba($orange, 0.2);
  transform: scale(0.95);
}

.image-gallery__close:hover {
  background: rgba($orange, 0.15);
  border-color: rgba($orange, 0.7);
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
  width: 100%;
  height: 100%;
  min-height: 0;
  background: #000;
  flex-shrink: 0;
}

.image-gallery__track {
  display: flex;
  width: 100%;
  height: 100%;
  transition: transform 0.3s ease;
  position: relative;
  flex-shrink: 0;
}

.image-gallery__slide {
  min-width: 100%;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 16px 100px;
  flex-shrink: 0;
  position: relative;
}

.image-gallery__image {
  max-width: 80%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 8px;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  display: block;
  opacity: 1;
  visibility: visible;
  background: transparent;
}

.image-gallery__image[src=""] {
  display: none;
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
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 2px solid rgba($orange, 0.5);
  background: rgba(0, 0, 0, 0.8);
  color: rgba($orange2, 0.9);
  font-size: 26px;
  font-weight: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

.image-gallery__navBtn:active:not(:disabled) {
  background: rgba($orange, 0.2);
  transform: scale(0.9);
}

.image-gallery__navBtn:hover:not(:disabled) {
  background: rgba($orange, 0.15);
  border-color: rgba($orange, 0.7);
  color: rgba($orange2, 1);
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
  background: $orange2;
  width: 24px;
  border-radius: 4px;
}

.chat__iconBtn--images {
  background: rgba($orange, 0.15);
  border-color: rgba($orange, 0.3);
  color: $orange2;
  flex-shrink: 0;
  position: relative;
  z-index: 10;
  pointer-events: auto !important;
  touch-action: manipulation;
  -webkit-tap-highlight-color: rgba($orange, 0.3);
  cursor: pointer;
}

.chat__iconBtn--images:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.chat__iconBtn--images:not(:disabled):active {
  transform: scale(0.95);
  background: rgba($orange, 0.25);
}

.chat__iconBtn--images:not(:disabled):hover {
  background: rgba($orange, 0.2);
}

@media (max-width: 480px) {
  .image-gallery__slide {
    padding: 80px 8px 120px;
  }

  .image-gallery__navBtn {
    width: 48px;
    height: 48px;
    font-size: 22px;
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

.chat__iconBtn--images {
  background: rgba($orange, 0.15);
  border-color: rgba($orange, 0.3);
  color: $orange2;
  flex-shrink: 0;
}

.chat__iconBtn--images:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
