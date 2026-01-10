<template>
  <section class="chat" dir="rtl" role="application" aria-label="צ'אט עבודה">
    <!-- Header -->
    <header class="chat__header" role="banner">
      <button
        class="chat__iconBtn"
        type="button"
        @click="$emit('minimize')"
        aria-label="חזור"
      >
        <span class="chat__icon">←</span>
      </button>

      <div class="chat__headInfo">
        <div
          class="chat__title"
          :title="isHandyman ? clientName : getHandymanName()"
        >
          {{ isHandyman ? clientName : getHandymanName() }}
        </div>
        <div class="chat__subtitle" :title="getJobDisplayName(jobInfo)">
          {{ getJobDisplayName(jobInfo) }}
        </div>
      </div>

      <div class="chat__headRight">
        <span class="chat__status" :class="'status--' + chipTone">
          <span
            class="chat__statusDot"
            :class="'dot--' + chipTone"
            aria-hidden="true"
          ></span>
          {{ statusLabel }}
        </span>

        <button
          class="chat__cancelBtn"
          type="button"
          @click="openCancel()"
          aria-label="ביטול עבודה"
        >
          ביטול עבודה
        </button>
      </div>
    </header>

    <!-- Tabs -->
    <div
      v-if="jobs && jobs.length > 1"
      class="chat__tabs"
      role="tablist"
      aria-label="בחירת עבודה"
    >
      <button
        v-for="(jobItem, index) in jobs"
        :key="jobItem._id || jobItem.id || index"
        class="chat__tab"
        :class="{ 'chat__tab--active': currentJobIndex === index }"
        type="button"
        role="tab"
        :aria-selected="currentJobIndex === index ? 'true' : 'false'"
        @click="switchToJob(index)"
      >
        <span class="chat__tabName">
          {{ isHandyman ? jobItem.clientName : getHandymanNameForJob(jobItem) }}
        </span>
        <span
          v-if="getUnreadCount(jobItem) > 0"
          class="chat__tabBadge"
          aria-label="הודעות שלא נקראו"
        >
          {{ getUnreadCount(jobItem) }}
        </span>
      </button>
    </div>

    <!-- Action bar -->
    <div
      v-if="showActionBar || (isHandyman && nextStatus)"
      class="chat__actions"
      role="region"
      aria-label="פעולות מהירות"
    >
      <!-- First row: Three buttons (Navigation, Price Update, Job Images) -->
      <div v-if="showActionBar" class="chat__actionsRow">
        <button
          v-if="isHandyman && jobLocation"
          class="chip chip--ghost"
          type="button"
          @click.stop="showNavModal = true"
        >
          <span class="chip__icon" aria-hidden="true">🗺️</span>
          <span class="chip__text">ניווט</span>
        </button>

        <button
          v-if="isHandyman && showPriceUpdateButton"
          class="chip chip--ghost"
          type="button"
          @click.stop="showPriceUpdateModal = true"
        >
          <span class="chip__icon" aria-hidden="true">💰</span>
          <span class="chip__text">עדכן מחיר</span>
        </button>

        <!-- כפתור תמונות העבודה - גם ללקוח וגם להנדימן -->
        <button
          v-if="jobImages.length > 0"
          class="chip chip--ghost chip--icon-only"
          type="button"
          @click.stop="showJobImagesModal = true"
          aria-label="תמונות העבודה"
          :title="`תמונות (${jobImages.length})`"
        >
          📷
        </button>

        <template v-if="!isHandyman && showStatusButtons">
          <button
            class="chip chip--primary"
            type="button"
            @click="sendLocation"
          >
            <span class="chip__icon" aria-hidden="true">📍</span>
            <span class="chip__text">שלח מיקום</span>
          </button>

          <button
            v-if="jobStatus === 'on_the_way' || jobStatus === 'in_progress'"
            class="chip chip--ghost"
            type="button"
            @click.stop="openHandymanRealtimeLocation"
          >
            <span class="chip__icon" aria-hidden="true">🗺️</span>
            <span class="chip__text">הנדימן בזמן אמת</span>
          </button>
        </template>
      </div>

      <!-- Second row: Status update button (only for handyman, 40% width, right-aligned) -->
      <div v-if="isHandyman && nextStatus" class="chat__statusUpdateRow">
        <button
          class="chip status-update-btn"
          :class="getStatusButtonClass(nextStatus)"
          type="button"
          @click="updateStatus(nextStatus)"
        >
          <span class="status-update-label-inline">עדכון סטטוס ללקוח:</span>
          <span class="status-update-value">{{ nextStatusLabel }}</span>
        </button>
      </div>
    </div>

    <!-- Desktop stepper -->
    <div class="chat__stepper chat__stepper--desktop" aria-label="שלבי עבודה">
      <div
        v-for="(step, i) in jobSteps"
        :key="step.status"
        class="step"
        :class="{
          'is-active': isStepActive(step.status),
          'is-done': isStepCompleted(step.status),
        }"
      >
        <div class="step__dot" aria-hidden="true">
          <span v-if="isStepCompleted(step.status)">✓</span>
          <span v-else>{{ i + 1 }}</span>
        </div>
        <div class="step__label">{{ step.label }}</div>
      </div>
    </div>

    <!-- Rating (client) -->
    <div
      v-if="!isHandyman && jobStatus === 'done' && !ratingSubmitted"
      class="chat__rating"
      role="region"
      aria-label="דירוג הנדימן"
    >
      <div class="chat__ratingTitle">דרג את ההנדימן</div>

      <div class="chat__stars" role="radiogroup" aria-label="בחירת דירוג">
        <template v-for="s in 5" :key="s">
          <input
            :value="s"
            :id="`star-v2-${s}`"
            name="rating-v2"
            type="radio"
            :checked="rating === s"
            @change="rating = s"
          />
          <label
            :for="`star-v2-${s}`"
            :title="`${s} כוכבים`"
            @touchstart="hoverRating = s"
            @touchend="hoverRating = 0"
          >
            <span
              class="star"
              :class="{
                'is-on':
                  (hoverRating > 0 && s <= hoverRating) ||
                  (hoverRating === 0 && rating >= s),
              }"
              aria-hidden="true"
              >★</span
            >
          </label>
        </template>
      </div>

      <textarea
        v-model="reviewText"
        class="chat__review"
        rows="2"
        placeholder="משהו קצר (אופציונלי)"
      />
      <button class="chat__rateBtn" type="button" @click="submitRating">
        שלח דירוג
      </button>
    </div>

    <!-- Messages -->
    <div
      class="chat__messages"
      ref="messagesContainer"
      role="log"
      aria-live="polite"
    >
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
        <div class="bubbleWrap">
          <div
            class="bubble"
            :class="{
              'bubble--me': m.sender === 'me',
              'bubble--system': m.sender === 'system' || m.isSystem,
              'bubble--other':
                m.sender !== 'me' && !(m.sender === 'system' || m.isSystem),
              'bubble--uploading': m.uploading,
            }"
          >
            <div class="bubble__content">
              <button
                v-if="m.image"
                type="button"
                class="bubble__imgBtn"
                @click="openImage(m.image)"
                :aria-label="m.text ? 'פתח תמונה עם כיתוב' : 'פתח תמונה'"
              >
                <img :src="m.image" class="bubble__img" alt="תמונה" />
                <span class="bubble__imgGlow" aria-hidden="true"></span>
              </button>

              <button
                v-if="m.location"
                type="button"
                class="bubble__loc"
                @click.stop="openLocationModal(m.location)"
                aria-label="פתח מיקום"
              >
                <img
                  :src="getLocationMapImage(m.location)"
                  class="bubble__locMap"
                  alt="מיקום"
                  @error="onMapImageError"
                />
                <div class="bubble__locOverlay">
                  <span aria-hidden="true">📍</span> מיקום
                </div>
              </button>

              <div v-if="m.audio" class="bubble__audio">
                <audio
                  :ref="`audio-${i}`"
                  :src="m.audio"
                  preload="metadata"
                  @loadedmetadata="updateAudioDuration(i, $event)"
                ></audio>

                <button
                  class="bubble__audioBtn"
                  type="button"
                  @click="toggleAudioPlayback(i)"
                  :aria-label="m.isPlaying ? 'עצור הקלטה' : 'נגן הקלטה'"
                >
                  <span class="bubble__audioIcon" aria-hidden="true">
                    {{ m.isPlaying ? "⏸" : "▶" }}
                  </span>
                  <div class="bubble__audioWave">
                    <span
                      v-for="(bar, idx) in getWaveformBars(i)"
                      :key="idx"
                      class="bubble__audioWaveBar"
                      :style="{ height: bar + '%' }"
                    ></span>
                  </div>
                  <span class="bubble__audioTime">{{
                    m.audioDuration || "0:00"
                  }}</span>
                </button>
              </div>

              <div v-if="m.text" class="bubble__text">{{ m.text }}</div>
            </div>

            <div class="bubble__meta">
              <span class="bubble__time">{{ m.time }}</span>
              <span
                v-if="m.sender === 'me'"
                class="bubble__tick"
                aria-label="נשלח"
                >✓✓</span
              >
            </div>

            <div
              v-if="m.uploading"
              class="bubble__uploading"
              aria-label="נשלח..."
            >
              שולח…
            </div>
          </div>
        </div>
      </div>

      <!-- Typing indicator -->
      <div v-if="isOtherTyping" class="bubble bubble--other">
        <div class="bubble__content">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>

    <!-- Composer -->
    <div class="composer" role="region" aria-label="שליחת הודעה">
      <button
        class="composer__plus"
        type="button"
        @click="toggleTools"
        aria-label="כלים"
        :aria-expanded="showTools ? 'true' : 'false'"
      >
        ＋
      </button>

      <div
        v-if="imagePreview"
        class="composer__preview"
        role="group"
        aria-label="תצוגה מקדימה לתמונה"
      >
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

      <div
        v-else-if="audioPreview"
        class="composer__preview"
        role="group"
        aria-label="תצוגה מקדימה להקלטה"
      >
        <div class="composer__previewTop">
          <div class="composer__audioPreview">
            <button
              class="composer__audioPlay"
              type="button"
              @click="playAudioPreview"
              aria-label="נגן"
            >
              ▶
            </button>
            <span class="composer__audioTime">{{
              formatRecordingTime(recordingTime)
            }}</span>
          </div>
          <button
            class="composer__previewClose"
            type="button"
            @click="cancelAudioPreview"
            aria-label="ביטול"
          >
            ✕
          </button>
        </div>
      </div>

      <input
        v-else
        v-model="newMessage"
        class="composer__input"
        type="text"
        placeholder="הקלד הודעה…"
        @keyup.enter="sendMessage"
        @input="handleTyping"
        aria-label="הקלד הודעה"
      />

      <button
        v-if="!isRecording && !audioPreview"
        class="composer__record"
        type="button"
        @click="startRecording"
        aria-label="הקלט"
        :disabled="imagePreview"
      >
        🎤
      </button>

      <button
        v-else-if="isRecording"
        class="composer__record composer__record--recording"
        type="button"
        @click="stopRecording"
        aria-label="הפסק הקלטה"
      >
        ⏹
      </button>

      <button
        class="composer__send"
        type="button"
        @click="
          audioPreview
            ? sendAudio()
            : imagePreview
            ? sendImageWithText()
            : sendMessage()
        "
        :disabled="!audioPreview && !imagePreview && !newMessage.trim()"
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
    <div
      v-if="showTools"
      class="toolsSheet"
      @click.self="showTools = false"
      role="dialog"
      aria-label="כלים"
    >
      <div class="toolsSheet__card">
        <div class="toolsSheet__title">כלים</div>

        <button class="toolsSheet__item" type="button" @click="triggerFile">
          <span class="toolsSheet__emoji">📷</span>
          <span class="toolsSheet__txt">תמונה</span>
        </button>

        <button class="toolsSheet__item" type="button" @click="sendLocation">
          <span class="toolsSheet__emoji">📍</span>
          <span class="toolsSheet__txt">מיקום</span>
        </button>

        <button
          class="toolsSheet__item"
          type="button"
          @click="sendQuick('אני בדרך')"
        >
          <span class="toolsSheet__emoji">🚗</span>
          <span class="toolsSheet__txt">אני בדרך</span>
        </button>

        <button
          class="toolsSheet__item"
          type="button"
          @click="sendQuick('הגעתי')"
        >
          <span class="toolsSheet__emoji">✅</span>
          <span class="toolsSheet__txt">הגעתי</span>
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

    <!-- Image modal - z-index גבוה יותר כדי שיהיה מעל הפופאפ של תמונות העבודה -->
    <div
      v-if="imageModal"
      class="modal modal--image"
      @click.self="imageModal = null"
      role="dialog"
      aria-label="תמונה"
    >
      <div class="modal__card">
        <button
          class="modal__close"
          type="button"
          @click="imageModal = null"
          aria-label="סגור"
        >
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
      role="dialog"
      aria-label="פתיחת ניווט"
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

    <!-- Cancel Reason Modal -->
    <div
      v-if="showCancelReasonModal"
      class="modal"
      dir="rtl"
      @click.self="showCancelReasonModal = false"
      role="dialog"
      aria-label="ביטול עבודה"
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
            <span class="cancelReasonModal__warningIcon" aria-hidden="true"
              >⚠️</span
            >
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
              <span class="cancelReasonModal__optionIcon" aria-hidden="true"
                >👤</span
              >
              <span class="cancelReasonModal__optionText"
                >בטל עבור הנדימן הזה</span
              >
              <span
                v-if="
                  cancelAction === 'cancel-handyman' && cancelReasonText.trim()
                "
                class="cancelReasonModal__checkIcon"
                aria-hidden="true"
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
              <span class="cancelReasonModal__optionIcon" aria-hidden="true"
                >🚫</span
              >
              <span class="cancelReasonModal__optionText">בטל עבודה לגמרי</span>
              <span
                v-if="
                  cancelAction === 'cancel-complete' && cancelReasonText.trim()
                "
                class="cancelReasonModal__checkIcon"
                aria-hidden="true"
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
              <span class="cancelReasonModal__optionIcon" aria-hidden="true"
                >🗑️</span
              >
              <span class="cancelReasonModal__optionText">מחק עבודה</span>
              <span
                v-if="cancelAction === 'delete' && cancelReasonText.trim()"
                class="cancelReasonModal__checkIcon"
                aria-hidden="true"
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
    <div
      v-if="locationModal"
      class="modal"
      @click.self="locationModal = null"
      role="dialog"
      aria-label="מיקום"
    >
      <div class="locCard">
        <button
          class="locCard__close"
          type="button"
          @click="locationModal = null"
          aria-label="סגור"
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
      role="dialog"
      aria-label="עדכון מחיר"
    >
      <div class="priceUpdateModal">
        <div class="priceUpdateModal__header">
          <h3 class="priceUpdateModal__title">עדכון מחיר</h3>
          <button
            class="priceUpdateModal__close"
            type="button"
            @click="showPriceUpdateModal = false"
            aria-label="סגור"
          >
            ✕
          </button>
        </div>

        <div class="priceUpdateModal__body">
          <div class="priceUpdateModal__currentPrice">
            <span class="priceUpdateModal__label">מחיר נוכחי:</span>
            <span class="priceUpdateModal__value">{{ currentJobPrice }} ₪</span>
          </div>

          <div class="priceUpdateModal__change">
            <label class="priceUpdateModal__label" for="priceChangePercent">
              שינוי באחוזים (עד 20%):
            </label>

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
              <span
                class="priceUpdateModal__value priceUpdateModal__value--new"
              >
                {{ newPrice }} ₪
              </span>
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
            :disabled="priceChangePercent === 0 || isUpdatingPrice"
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
      role="dialog"
      aria-label="אישור שינוי מחיר"
    >
      <div class="priceApprovalModal">
        <div class="priceApprovalModal__header">
          <h3 class="priceApprovalModal__title">בקשת שינוי מחיר</h3>
        </div>

        <div class="priceApprovalModal__body">
          <div class="priceApprovalModal__message">
            ההנדימן ביקש
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
            מהמחיר. האם אתה מאשר?
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
              >
                {{ pendingPriceChange.newPrice }} ₪
              </span>
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

    <!-- Job Images Modal -->
    <div
      v-if="showJobImagesModal"
      class="modal"
      dir="rtl"
      @click.self="showJobImagesModal = false"
      role="dialog"
      aria-label="תמונות העבודה"
    >
      <div class="jobImagesModal">
        <div class="jobImagesModal__header">
          <h3 class="jobImagesModal__title">תמונות העבודה</h3>
          <button
            class="jobImagesModal__close"
            type="button"
            @click="showJobImagesModal = false"
            aria-label="סגור"
          >
            ✕
          </button>
        </div>

        <div class="jobImagesModal__body">
          <div v-if="jobImages.length === 0" class="jobImagesModal__empty">
            אין תמונות לעבודה זו
          </div>
          <div v-else class="jobImagesModal__grid">
            <button
              v-for="(image, index) in jobImages"
              :key="index"
              class="jobImagesModal__imageBtn"
              type="button"
              @click="openImageFromModal(image)"
            >
              <img
                :src="image"
                class="jobImagesModal__image"
                alt="תמונת עבודה"
              />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Hours Worked Modal -->
    <div
      v-if="showHoursWorkedModal"
      class="modal"
      dir="rtl"
      @click.self="showHoursWorkedModal = false"
      role="dialog"
      aria-label="שעות עבודה"
    >
      <div class="hoursWorkedModal">
        <div class="hoursWorkedModal__header">
          <h3 class="hoursWorkedModal__title">שעות עבודה</h3>
          <button
            class="hoursWorkedModal__close"
            type="button"
            @click="showHoursWorkedModal = false"
            aria-label="סגור"
          >
            ✕
          </button>
        </div>

        <div class="hoursWorkedModal__body">
          <div class="hoursWorkedModal__message">כמה שעות עבדת על העבודה?</div>

          <div class="hoursWorkedModal__field">
            <label class="hoursWorkedModal__label" for="hoursWorked"
              >שעות</label
            >
            <input
              id="hoursWorked"
              v-model.number="hoursWorked"
              type="number"
              min="0.5"
              step="0.5"
              class="hoursWorkedModal__input"
            />
          </div>

          <div class="hoursWorkedModal__priceInfo">
            <div class="hoursWorkedModal__priceRow">
              <span class="hoursWorkedModal__priceLabel">מחיר לשעה:</span>
              <span class="hoursWorkedModal__priceValue"
                >{{ hourlyPrice.toFixed(2) }} ₪</span
              >
            </div>
            <div
              class="hoursWorkedModal__priceRow hoursWorkedModal__priceRow--total"
            >
              <span class="hoursWorkedModal__priceLabel">סה"כ לתשלום:</span>
              <span
                class="hoursWorkedModal__priceValue hoursWorkedModal__priceValue--total"
              >
                {{ (hoursWorked * hourlyPrice).toFixed(2) }} ₪
              </span>
            </div>
          </div>
        </div>

        <div class="hoursWorkedModal__footer">
          <button
            class="hoursWorkedModal__btn hoursWorkedModal__btn--cancel"
            type="button"
            @click="showHoursWorkedModal = false"
          >
            ביטול
          </button>
          <button
            class="hoursWorkedModal__btn hoursWorkedModal__btn--submit"
            type="button"
            :disabled="hoursWorked <= 0 || isSubmittingHours"
            @click="submitHoursWorked"
          >
            {{ isSubmittingHours ? "שולח..." : "אישור" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Handyman Route Modal -->
    <div
      v-if="showHandymanRouteModal"
      class="modal route-modal"
      @click.self="closeHandymanRouteModal"
      role="dialog"
      aria-label="מיקום ההנדימן"
    >
      <div class="routeCard">
        <div class="routeCard__header">
          <h3 class="routeCard__title">🗺️ מיקום ההנדימן</h3>
          <button
            class="routeCard__close"
            type="button"
            @click="closeHandymanRouteModal"
            aria-label="סגור"
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
                aria-hidden="true"
              ></span>
              <span class="routeCard__legendText">מיקום ההנדימן</span>
            </div>
            <div class="routeCard__legendItem">
              <span
                class="routeCard__legendDot routeCard__legendDot--end"
                aria-hidden="true"
              ></span>
              <span class="routeCard__legendText">מיקום העבודה</span>
            </div>
          </div>
        </div>

        <div class="routeCard__body">
          <div class="routeCard__info">
            <div class="routeCard__infoRow">
              <span class="routeCard__infoLabel">מיקום ההנדימן:</span>
              <span class="routeCard__infoValue">
                {{
                  formatLocation(
                    cachedLastHandymanLocation || lastHandymanLocation
                  )
                }}
              </span>
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
import logger from "@/utils/logger";

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
      rating: 0,
      hoverRating: 0,
      reviewText: "",
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
      showPriceUpdateModal: false,
      priceChangePercent: 0,
      newPrice: 0,
      priceChangeAmount: 0,
      isUpdatingPrice: false,
      showPriceApprovalModal: false,
      pendingPriceChange: {
        percent: 0,
        oldPrice: 0,
        newPrice: 0,
        changeAmount: 0,
        jobId: null,
      },
      isRespondingToPriceChange: false,

      // Job images state
      showJobImagesModal: false,

      // Hours worked state (for hourly work)
      showHoursWorkedModal: false,
      hoursWorked: 1,
      isSubmittingHours: false,

      // Audio recording state
      isRecording: false,
      recordingTime: 0,
      recordingInterval: null,
      mediaRecorder: null,
      audioBlob: null,
      audioPreview: null,
      audioChunks: [],
      audioUrlsToDelete: [], // Track audio URLs for cleanup

      // Typing indicator state
      isTyping: false,
      isOtherTyping: false,
      typingTimeout: null,
      typingEmitTimeout: null,
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
      // Status update row is always shown separately for handyman if nextStatus exists
      return (
        (this.isHandyman && this.jobLocation) ||
        (this.isHandyman && this.showPriceUpdateButton) ||
        (!this.isHandyman && this.showStatusButtons) ||
        this.jobImages.length > 0 || // תמונות העבודה - גם ללקוח וגם להנדימן
        (this.isHandyman && !!this.nextStatus) // Status update is in separate row but still needs action bar container
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
    jobImages() {
      const job = this.currentJob;
      if (!job) return [];
      // Handle imageUrls as array or single value
      if (Array.isArray(job.imageUrls)) {
        return job.imageUrls.filter((url) => url && url.trim());
      }
      if (job.imageUrls && typeof job.imageUrls === "string") {
        return [job.imageUrls];
      }
      // Fallback to imageUrl (singular)
      if (job.imageUrl) {
        return Array.isArray(job.imageUrl) ? job.imageUrl : [job.imageUrl];
      }
      return [];
    },
    isHourlyWork() {
      const job = this.currentJob;
      if (!job) return false;
      const subcategoryInfo = job.subcategoryInfo;
      if (Array.isArray(subcategoryInfo)) {
        return subcategoryInfo.some(
          (sub) => sub?.workType === "לשעה" || sub?.workType === "hourly"
        );
      }
      return (
        subcategoryInfo?.workType === "לשעה" ||
        subcategoryInfo?.workType === "hourly"
      );
    },
    hourlyPrice() {
      const job = this.currentJob;
      if (!job) return 0;
      const subcategoryInfo = job.subcategoryInfo;
      if (Array.isArray(subcategoryInfo)) {
        const hourlySub = subcategoryInfo.find(
          (sub) => sub?.workType === "לשעה" || sub?.workType === "hourly"
        );
        return hourlySub?.price || 0;
      }
      if (
        subcategoryInfo?.workType === "לשעה" ||
        subcategoryInfo?.workType === "hourly"
      ) {
        return subcategoryInfo?.price || 0;
      }
      return 0;
    },
    jobImages() {
      const job = this.currentJob;
      if (!job) return [];
      // Handle imageUrls as array or single value
      if (Array.isArray(job.imageUrls)) {
        return job.imageUrls.filter((url) => url && url.trim());
      }
      if (job.imageUrls && typeof job.imageUrls === "string") {
        return [job.imageUrls];
      }
      // Fallback to imageUrl (singular)
      if (job.imageUrl) {
        return Array.isArray(job.imageUrl) ? job.imageUrl : [job.imageUrl];
      }
      return [];
    },
    isHourlyWork() {
      const job = this.currentJob;
      if (!job) return false;
      const subcategoryInfo = job.subcategoryInfo;
      if (Array.isArray(subcategoryInfo)) {
        return subcategoryInfo.some(
          (sub) => sub?.workType === "לשעה" || sub?.workType === "hourly"
        );
      }
      return (
        subcategoryInfo?.workType === "לשעה" ||
        subcategoryInfo?.workType === "hourly"
      );
    },
    hourlyPrice() {
      const job = this.currentJob;
      if (!job) return 0;
      const subcategoryInfo = job.subcategoryInfo;
      if (Array.isArray(subcategoryInfo)) {
        const hourlySub = subcategoryInfo.find(
          (sub) => sub?.workType === "לשעה" || sub?.workType === "hourly"
        );
        return hourlySub?.price || 0;
      }
      if (
        subcategoryInfo?.workType === "לשעה" ||
        subcategoryInfo?.workType === "hourly"
      ) {
        return subcategoryInfo?.price || 0;
      }
      return 0;
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
  },
  created() {
    logger.log("[JobChatMobile] ========== CREATED ==========");
    logger.log("[JobChatMobile] created() - isHandyman:", this.isHandyman);
    logger.log("[JobChatMobile] created() - jobs:", this.jobs);
    logger.log("[JobChatMobile] created() - job:", this.job);

    this.toast = useToast();
    const job = this.currentJob;
    logger.log("[JobChatMobile] created() - currentJob:", job);
    this.localJobStatus = job?.status || null;
    logger.log(
      "[JobChatMobile] created() - localJobStatus:",
      this.localJobStatus
    );
  },
  async mounted() {
    logger.log("[JobChatMobile] ========== MOUNTED START ==========");
    logger.log("[JobChatMobile] isHandyman:", this.isHandyman);
    logger.log("[JobChatMobile] jobs prop:", this.jobs);
    logger.log("[JobChatMobile] job prop:", this.job);
    logger.log("[JobChatMobile] currentJobIndex:", this.currentJobIndex);

    window.addEventListener("click", this.onOutsideTools);
    window.addEventListener("visibilitychange", this.handleVisibilityChange);
    window.addEventListener("beforeunload", this.saveMessagesBeforeUnload);

    // Load messages from sessionStorage first if available for fast display
    const job = this.currentJob;
    logger.log("[JobChatMobile] currentJob computed:", job);

    if (!job) {
      logger.error(
        "[JobChatMobile] ❌ No current job in mounted, waiting and retrying..."
      );
      logger.error("[JobChatMobile] jobs array:", this.jobs);
      logger.error("[JobChatMobile] job prop:", this.job);
      logger.error("[JobChatMobile] currentJobIndex:", this.currentJobIndex);

      // Wait a bit and try again - maybe job is loaded asynchronously
      await new Promise((resolve) => setTimeout(resolve, 500));
      const retryJob = this.currentJob;
      if (!retryJob) {
        logger.error("[JobChatMobile] ❌ Still no job after retry");
        // Don't return - try to continue anyway
      } else {
        logger.log("[JobChatMobile] ✅ Got job after retry:", retryJob);
        // Use retryJob
        const retryJobId = retryJob?.id || retryJob?._id;
        if (retryJobId) {
          const jobIdStr = String(retryJobId);
          let hasCachedMessages = false;

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
            this.messages = [...this.messagesCache[jobIdStr]];
            hasCachedMessages = true;
            this.$nextTick(() => {
              this.scrollToBottom();
            });
          }

          this.initWebSocket();

          if (!hasCachedMessages) {
            this.loadMessages()
              .then(() => {
                this.$nextTick(() => {
                  this.scrollToBottom();
                });
              })
              .catch((error) => {
                logger.error("[JobChatMobile] Error loading messages:", error);
                if (this.messages.length === 0) {
                  this.toast?.showError("שגיאה בטעינת הודעות");
                }
              });
          } else {
            setTimeout(() => {
              this.loadMessages().catch((error) => {
                logger.warn("[JobChatMobile] Background sync failed:", error);
              });
            }, 100);
          }
          return;
        }
      }
    }

    const jobId = job?.id || job?._id;
    logger.log("[JobChatMobile] jobId extracted:", jobId);

    if (!jobId) {
      logger.error(
        "[JobChatMobile] ❌ No jobId in mounted, waiting and retrying..."
      );
      logger.error("[JobChatMobile] job object:", job);

      // Wait a bit and try again
      await new Promise((resolve) => setTimeout(resolve, 500));
      const retryJob = this.currentJob;
      const retryJobId = retryJob?.id || retryJob?._id;
      if (!retryJobId) {
        logger.error("[JobChatMobile] ❌ Still no jobId after retry");
        // Don't return - try to continue anyway with empty messages
      } else {
        logger.log("[JobChatMobile] ✅ Got jobId after retry:", retryJobId);
        const jobIdStr = String(retryJobId);
        let hasCachedMessages = false;

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
          this.messages = [...this.messagesCache[jobIdStr]];
          hasCachedMessages = true;
          this.$nextTick(() => {
            this.scrollToBottom();
          });
        }

        this.initWebSocket();

        if (!hasCachedMessages) {
          this.loadMessages()
            .then(() => {
              this.$nextTick(() => {
                this.scrollToBottom();
              });
            })
            .catch((error) => {
              logger.error("[JobChatMobile] Error loading messages:", error);
              if (this.messages.length === 0) {
                this.toast?.showError("שגיאה בטעינת הודעות");
              }
            });
        } else {
          setTimeout(() => {
            this.loadMessages().catch((error) => {
              logger.warn("[JobChatMobile] Background sync failed:", error);
            });
          }, 100);
        }
        return;
      }
    }

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

    // Initialize WebSocket first (non-blocking)
    this.initWebSocket();

    // Only load from server if we don't have cached messages
    if (!hasCachedMessages) {
      // Load messages in parallel with WebSocket init (non-blocking)
      this.loadMessages()
        .then(() => {
          this.$nextTick(() => {
            this.scrollToBottom();
          });
        })
        .catch((error) => {
          // Log error for debugging
          logger.error("[JobChatMobile] Error loading messages:", error);
          // Show error only if we have no messages at all
          if (this.messages.length === 0) {
            this.toast?.showError("שגיאה בטעינת הודעות");
          }
        });
    } else {
      // We have cached messages, sync from server in background without clearing UI
      // Use setTimeout to defer to next tick for better performance
      setTimeout(() => {
        this.loadMessages().catch((error) => {
          // Silent fail - we already have messages from cache
          logger.warn("[JobChatMobile] Background sync failed:", error);
        });
      }, 100);
    }

    // Initialize unread counts for all jobs
    if (this.jobs && this.jobs.length > 1) {
      for (const jobItem of this.jobs) {
        await this.updateUnreadCount(jobItem);
      }
    }

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

    // Stop recording if active
    if (this.isRecording) {
      this.stopRecording();
    }

    // Clean up preview audio if exists
    if (this.audioPreview) {
      window.URL.revokeObjectURL(this.audioPreview);
    }

    // Save messages before unmount
    this.saveMessagesBeforeUnload();

    // Clean up chat files (images and audio) from S3
    this.cleanupChatFiles();
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
      if (!job?.id && !job?._id) {
        return;
      }

      if (this.socket) {
        this.socket.removeAllListeners();
        this.socket.disconnect();
        this.socket = null;
      }

      const jobId = job.id || job._id;
      const jobIdString = String(jobId);

      this.socket = io(URL, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      // Handle connection success
      this.socket.on("connect", () => {
        this.socket.emit("join-job", jobIdString);
        // Store userId in socket for typing indicator
        const userId = this.store?.user?._id || this.me?._id;
        if (userId) {
          this.socket.userId = String(userId);
        }
      });

      // Handle connection errors
      this.socket.on("connect_error", (error) => {
        this.toast?.showError("שגיאה בחיבור לשרת. מנסה להתחבר מחדש...");
      });

      // Handle disconnection
      this.socket.on("disconnect", (reason) => {
        if (reason === "io server disconnect") {
          // Server disconnected, need to reconnect manually
          this.socket.connect();
        }
      });

      // Handle reconnection
      this.socket.on("reconnect", (attemptNumber) => {
        this.socket.emit("join-job", jobIdString);
      });

      // Handle reconnection attempts
      this.socket.on("reconnect_attempt", () => {
        // Silent reconnect attempt
      });

      // Handle reconnection failure
      this.socket.on("reconnect_failed", () => {
        this.toast?.showError("לא ניתן להתחבר לשרת. אנא רענן את הדף.");
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

      // Listen for typing indicator
      this.socket.on("user-typing", (data) => {
        const receivedJobId = String(data.jobId || "");
        const currentJobId = String(jobId || "");
        if (receivedJobId === currentJobId) {
          // Check if the typing user is the other user (not me)
          const userId = this.store?.user?._id || this.me?._id;
          const typingUserId = String(data.userId || "");
          const currentUserId = String(userId || "");

          if (typingUserId !== currentUserId) {
            this.isOtherTyping = data.isTyping;

            // Auto-hide typing indicator after 5 seconds
            if (this.typingTimeout) {
              clearTimeout(this.typingTimeout);
            }
            if (data.isTyping) {
              this.typingTimeout = setTimeout(() => {
                this.isOtherTyping = false;
              }, 5000);
            }
          }
        }
      });

      // Listen for price change requests (for client)
      this.socket.on("price-change-request", (data) => {
        const receivedJobId = String(data.jobId || "");
        const currentJobId = String(jobId || "");
        if (receivedJobId === currentJobId && !this.isHandyman) {
          this.pendingPriceChange = {
            percent: data.percent,
            oldPrice: data.oldPrice,
            newPrice: data.newPrice,
            changeAmount: data.changeAmount,
            jobId: receivedJobId,
          };
          this.showPriceApprovalModal = true;

          // Add system message for client
          const systemMessage = {
            sender: "system",
            text: `הנדימן ביקש ${
              data.percent > 0 ? "להעלות" : "להוריד"
            } את המחיר ב-${Math.abs(data.percent).toFixed(1)}%`,
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
      if (this.typingTimeout) {
        clearTimeout(this.typingTimeout);
        this.typingTimeout = null;
      }
      if (this.typingEmitTimeout) {
        clearTimeout(this.typingEmitTimeout);
        this.typingEmitTimeout = null;
      }
      this.isOtherTyping = false;

      if (this.socket) {
        const job = this.currentJob;
        const jobId = job?.id || job?._id;
        if (jobId) {
          this.socket.emit("leave-job", jobId);
          // Stop typing indicator
          this.socket.emit("typing", {
            jobId: String(jobId),
            isTyping: false,
          });
        }
        this.socket.removeAllListeners();
        this.socket.disconnect();
        this.socket = null;
      }
    },

    async loadMessages() {
      logger.log("[JobChatMobile] loadMessages() called");
      try {
        const job = this.currentJob;
        logger.log("[JobChatMobile] loadMessages - currentJob:", job);

        if (!job) {
          logger.warn("[JobChatMobile] No current job found in loadMessages");
          return;
        }

        const jobId = job?.id || job?._id;
        logger.log("[JobChatMobile] loadMessages - jobId:", jobId);

        if (!jobId) {
          logger.warn("[JobChatMobile] No jobId found in current job:", job);
          return;
        }

        const jobIdStr = String(jobId);
        logger.log(
          "[JobChatMobile] loadMessages - fetching from:",
          `${URL}/jobs/${jobId}/messages`
        );

        // Reset unread count for current job when loading messages
        this.unreadCounts[jobIdStr] = 0;

        // Save current messages as fallback in case of error
        const currentMessages = [...this.messages];

        // Load from server with timeout to prevent hanging
        let response;
        try {
          response = await Promise.race([
            axios.get(`${URL}/jobs/${jobId}/messages`, {
              timeout: 10000, // 10 second timeout (increased for slower connections)
            }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Request timeout")), 10000)
            ),
          ]);
        } catch (timeoutError) {
          // If timeout, try to use cached messages if available
          const jobIdStr = String(jobId);
          if (
            this.messagesCache[jobIdStr] &&
            this.messagesCache[jobIdStr].length > 0
          ) {
            this.messages = [...this.messagesCache[jobIdStr]];
            return; // Use cached messages
          }
          throw timeoutError; // Re-throw if no cache available
        }

        // Extract data from axios response
        const data = response?.data || response;

        // Check if data exists and has messages array
        if (data && data.success && Array.isArray(data.messages)) {
          const loadedMessages = data.messages.map((msg) => {
            const isFromHandyman =
              !!msg.handyman ||
              !!msg.handymanImage ||
              !!msg.handymanLocation ||
              !!msg.handymanAudio ||
              (!!msg.customerAudio && !msg.handyman);
            const sender = this.isHandyman
              ? isFromHandyman
                ? "me"
                : "other"
              : isFromHandyman
              ? "other"
              : "me";
            const text = msg.handyman || msg.customer || "";
            const image = msg.handymanImage || msg.customerImage || null;
            const audio = msg.handymanAudio || msg.customerAudio || null;
            const audioDurationRaw =
              msg.handymanAudioDuration || msg.customerAudioDuration || null;
            const audioDuration = audioDurationRaw
              ? this.formatRecordingTime(audioDurationRaw)
              : null;
            const location =
              msg.handymanLocation || msg.customerLocation || null;
            const createdAt = msg.createdAt
              ? new Date(msg.createdAt)
              : new Date();

            // Track audio URLs for cleanup
            if (audio && audio.includes("voice-chat123")) {
              this.audioUrlsToDelete.push(audio);
            }

            return {
              sender,
              text,
              image,
              audio,
              location,
              isPlaying: false,
              audioDuration,
              audioDurationRaw, // Keep raw seconds for waveform
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
        // Log error for debugging
        logger.error("[JobChatMobile] Error in loadMessages:", e);

        // On error, don't clear messages - keep what we have
        // Only show error if we don't have any messages at all
        if (this.messages.length === 0) {
          // Try to load from cache as last resort BEFORE showing error
          const job = this.currentJob;
          const jobId = job?.id || job?._id;
          if (jobId) {
            const jobIdStr = String(jobId);
            const cachedMessages = this.messagesCache[jobIdStr];
            if (cachedMessages && cachedMessages.length > 0) {
              this.messages = [...cachedMessages];
              return; // Successfully loaded from cache
            } else {
              // Try sessionStorage
              const storedMessages = this.loadMessagesFromStorage();
              if (storedMessages && storedMessages.length > 0) {
                this.messages = storedMessages;
                this.messagesCache[jobIdStr] = [...storedMessages];
                return; // Successfully loaded from storage
              }
            }
          }
          // Only show error if we truly have no messages
          this.toast?.showError("שגיאה בטעינת הודעות");
        }
        // If we already have messages, silently fail (don't clear them)
      }
    },

    addMessageToUI(messageObj) {
      const isFromHandyman =
        !!messageObj.handyman ||
        !!messageObj.handymanImage ||
        !!messageObj.handymanLocation ||
        !!messageObj.handymanAudio;
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
      const audio =
        messageObj.handymanAudio || messageObj.customerAudio || null;
      const audioDurationRaw =
        messageObj.handymanAudioDuration ||
        messageObj.customerAudioDuration ||
        null;
      const audioDuration = audioDurationRaw
        ? this.formatRecordingTime(audioDurationRaw)
        : null;
      const location =
        messageObj.handymanLocation || messageObj.customerLocation || null;
      const createdAt = messageObj.createdAt
        ? new Date(messageObj.createdAt)
        : new Date();

      // Track audio URLs for cleanup
      if (audio && audio.includes("voice-chat123")) {
        this.audioUrlsToDelete.push(audio);
      }

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
            // For audio messages - match by tempId
            if (audio && m.audio) {
              if (m.tempId && m.tempId.startsWith("temp-audio-")) {
                // This is a temp audio message, allow WebSocket to update it
                const timeDiff = Math.abs(
                  createdAt.getTime() - (m.createdAt?.getTime() || 0)
                );
                return timeDiff < 10000; // Allow 10 seconds window
              }
              // Otherwise match by audio URL and time
              const timeDiff = Math.abs(
                createdAt.getTime() - (m.createdAt?.getTime() || 0)
              );
              return m.audio === audio && timeDiff < 5000;
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
            audio,
            location,
            isPlaying: false,
            audioDuration,
            audioDurationRaw,
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
          audio,
          location,
          isPlaying: false,
          audioDuration,
          audioDurationRaw,
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
        this.toast?.showError("לא ניתן לזהות את המשתמש");
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
        this.toast?.showError("שגיאה בשליחת המיקום");
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

      // Show route modal without validation - allow viewing even if starting location is not available
      // The route line goes from starting location to job location (if available)
      // The handyman marker shows current location (if available)
      this.showHandymanRouteModal = true;
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
          this.toast?.showError("לא ניתן לטעון את המפה");
          return;
        }

        mapboxgl.accessToken = tokenResponse.data.token;
        // Get starting location (fixed - where handyman started) and job location
        // Route line goes from starting location to job location
        const startingLoc = this.handymanStartingLocation;

        // Validate job location (required) - also check if coordinates are strings that can be converted
        if (!this.jobLocation) {
          this.toast?.showError("מיקום העבודה לא זמין");
          this.routeLoading = false;
          return;
        }

        // Convert coordinates to numbers if they are strings
        const jobLat =
          typeof this.jobLocation.lat === "string"
            ? parseFloat(this.jobLocation.lat)
            : this.jobLocation.lat;
        const jobLng =
          typeof this.jobLocation.lng === "string"
            ? parseFloat(this.jobLocation.lng)
            : this.jobLocation.lng;

        if (
          typeof jobLat !== "number" ||
          typeof jobLng !== "number" ||
          isNaN(jobLat) ||
          isNaN(jobLng)
        ) {
          this.toast?.showError("מיקום העבודה לא תקין");
          this.routeLoading = false;
          return;
        }

        this.routeLoading = true;

        // If we have starting location, fetch route. Otherwise, just show map with markers
        // Convert starting location coordinates to numbers if they are strings
        const startLat =
          startingLoc && typeof startingLoc.lat === "string"
            ? parseFloat(startingLoc.lat)
            : startingLoc?.lat;
        const startLng =
          startingLoc && typeof startingLoc.lng === "string"
            ? parseFloat(startingLoc.lng)
            : startingLoc?.lng;

        if (
          startingLoc &&
          typeof startLat === "number" &&
          typeof startLng === "number" &&
          !isNaN(startLat) &&
          !isNaN(startLng)
        ) {
          // Fetch route data from server - route from starting location to job location
          const routeResponse = await axios.get(`${URL}/route-data`, {
            params: {
              originLat: startLat,
              originLng: startLng,
              destLat: jobLat,
              destLng: jobLng,
            },
          });

          if (!routeResponse.data.success) {
            // If route fails, still show map without route
            logger.warn(
              "Failed to fetch route, showing map without route line"
            );
            this.routeData = null;
            this.travelTimeMinutes = null;
          } else {
            this.routeData = routeResponse.data;
            this.travelTimeMinutes = routeResponse.data.route.durationMinutes;
          }
        } else {
          // No starting location - show map without route
          this.routeData = null;
          this.travelTimeMinutes = null;
        }

        // Wait for DOM to be ready
        await this.$nextTick();

        const mapContainer = this.$refs.routeMapContainer;
        if (!mapContainer) {
          this.routeLoading = false;
          return;
        }

        // Determine map center - use route center if available, otherwise use job location
        const mapCenter = this.routeData?.center
          ? [this.routeData.center.lng, this.routeData.center.lat]
          : [jobLng, jobLat];

        // Initialize map - Mapbox expects [lng, lat]
        this.routeMap = new mapboxgl.Map({
          container: mapContainer,
          style: "mapbox://styles/mapbox/streets-v12",
          center: mapCenter,
          zoom: 13,
        });

        // Wait for map to load
        this.routeMap.on("load", () => {
          // Add route layer only if we have route data
          if (
            this.routeData &&
            this.routeData.route &&
            this.routeData.route.geometry
          ) {
            // Remove existing route if any
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
                geometry: this.routeData.route.geometry,
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
          }

          // Add handyman marker (CURRENT location - dynamic)
          // The marker shows the handyman's current position, not the starting point
          if (this.handymanMarker) {
            this.handymanMarker.remove();
          }

          // Get current handyman location (dynamic) - if available, use it for marker
          const currentHandymanLoc =
            this.cachedLastHandymanLocation || this.lastHandymanLocation;
          const handymanMarkerLocation = currentHandymanLoc || startingLoc; // Fallback to starting location if no current location

          // Only add handyman marker if we have a valid location
          if (
            handymanMarkerLocation &&
            typeof handymanMarkerLocation.lat === "number" &&
            typeof handymanMarkerLocation.lng === "number"
          ) {
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
              .setLngLat([
                handymanMarkerLocation.lng,
                handymanMarkerLocation.lat,
              ])
              .addTo(this.routeMap);
          }

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
            .setLngLat([jobLng, jobLat])
            .addTo(this.routeMap);

          // Fit map to route bounds (only if we have route data)
          if (
            this.routeData &&
            this.routeData.route &&
            this.routeData.route.geometry &&
            this.routeData.route.geometry.coordinates
          ) {
            const coordinates = this.routeData.route.geometry.coordinates;
            if (coordinates && coordinates.length > 0) {
              const bounds = coordinates.reduce((bounds, coord) => {
                return bounds.extend(coord);
              }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

              this.routeMap.fitBounds(bounds, {
                padding: { top: 50, bottom: 50, left: 50, right: 50 },
                maxZoom: 15,
              });
            }
          } else {
            // If no route, just fit to job location and handyman location (if available)
            const bounds = new mapboxgl.LngLatBounds(
              [jobLng, jobLat],
              [jobLng, jobLat]
            );

            // Add handyman location to bounds if available
            const currentHandymanLoc =
              this.cachedLastHandymanLocation || this.lastHandymanLocation;
            const handymanMarkerLocation = currentHandymanLoc || startingLoc;
            if (
              handymanMarkerLocation &&
              typeof handymanMarkerLocation.lat === "number" &&
              typeof handymanMarkerLocation.lng === "number"
            ) {
              bounds.extend([
                handymanMarkerLocation.lng,
                handymanMarkerLocation.lat,
              ]);
            }

            this.routeMap.fitBounds(bounds, {
              padding: { top: 50, bottom: 50, left: 50, right: 50 },
              maxZoom: 15,
            });
          }

          this.routeLoading = false;
        });

        this.routeMap.on("error", () => {
          this.routeLoading = false;
          this.toast?.showError("שגיאה בטעינת המפה");
        });
      } catch (error) {
        this.routeLoading = false;
        this.toast?.showError("שגיאה בטעינת המפה");
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
        this.toast?.showError("לא ניתן לזהות את המשתמש");
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
        const response = await axios.post(`${URL}/jobs/${jobId}/messages`, {
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
        this.toast?.showError("שגיאה בשליחת ההודעה");
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
        this.toast?.showError("שגיאה בהעלאת התמונה");
      }
    },

    async sendImageMessage(imageUrl, text = null) {
      const job = this.currentJob;
      const jobId = job?.id || job?._id;
      if (!jobId) return;

      const userId = this.store?.user?._id;
      if (!userId) {
        this.toast?.showError("לא ניתן לזהות את המשתמש");
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
        this.toast?.showError("שגיאה בשליחת התמונה");
      }
    },

    openImage(src) {
      this.imageModal = src;
    },
    openImageFromModal(src) {
      // פתח את התמונה ב-modal נפרד בלי לסגור את הפופאפ של תמונות העבודה
      this.imageModal = src;
      // אל תסגור את showJobImagesModal - הפופאפ יישאר פתוח
    },

    async updateStatus(newStatus) {
      try {
        const job = this.currentJob;

        // If status is "done" and work is hourly, show hours worked modal first
        if (newStatus === "done" && this.isHandyman && this.isHourlyWork) {
          this.showHoursWorkedModal = true;
          return; // Don't update status yet, wait for hours input
        }

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
        this.toast.showError("שגיאה בעדכון הסטטוס");
      }
    },
    addMaterial() {
      this.materials.push({ name: "", quantity: 1, unitPrice: 0 });
    },
    removeMaterial(index) {
      if (this.materials.length > 1) {
        this.materials.splice(index, 1);
      }
    },
    async submitMaterials() {
      if (!this.canSubmitMaterials || this.isSubmittingMaterials) return;

      this.isSubmittingMaterials = true;
      try {
        const job = this.currentJob;
        const jobId = job._id || job.id;
        const handymanId = this.store.user?._id || this.store.user?.id;

        const materialsData = this.materials
          .filter((m) => m.name.trim() && m.quantity > 0 && m.unitPrice > 0)
          .map((m) => ({
            name: m.name.trim(),
            quantity: m.quantity,
            unitPrice: m.unitPrice,
            total: m.quantity * m.unitPrice,
          }));

        const totalPrice = materialsData.reduce((sum, m) => sum + m.total, 0);

        await axios.post(`${URL}/jobs/${jobId}/materials/request`, {
          handymanId,
          materials: materialsData,
          totalPrice,
        });

        this.toast.showSuccess("בקשת החומרים נשלחה ללקוח");
        this.showAddMaterialsModal = false;
        this.materials = [{ name: "", quantity: 1, unitPrice: 0 }];
      } catch (error) {
        this.toast.showError(
          error.response?.data?.message || "שגיאה בשליחת בקשת החומרים"
        );
      } finally {
        this.isSubmittingMaterials = false;
      }
    },
    async approveMaterials() {
      this.isRespondingToMaterials = true;
      try {
        const jobId = this.pendingMaterials.jobId;
        await axios.post(`${URL}/jobs/${jobId}/materials/approve`, {
          approved: true,
        });
        this.toast.showSuccess("החומרים אושרו והמחיר עודכן");
        this.showMaterialsApprovalModal = false;
        this.$emit("price-updated");
      } catch (error) {
        this.toast.showError(
          error.response?.data?.message || "שגיאה באישור החומרים"
        );
      } finally {
        this.isRespondingToMaterials = false;
      }
    },
    async rejectMaterials() {
      this.isRespondingToMaterials = true;
      try {
        const jobId = this.pendingMaterials.jobId;
        await axios.post(`${URL}/jobs/${jobId}/materials/approve`, {
          approved: false,
        });
        this.toast.showSuccess("בקשת החומרים נדחתה");
        this.showMaterialsApprovalModal = false;
      } catch (error) {
        this.toast.showError(
          error.response?.data?.message || "שגיאה בדחיית החומרים"
        );
      } finally {
        this.isRespondingToMaterials = false;
      }
    },
    async submitHoursWorked() {
      if (this.hoursWorked <= 0 || this.isSubmittingHours) return;

      this.isSubmittingHours = true;
      try {
        const job = this.currentJob;
        const jobId = job._id || job.id;
        const handymanId = this.store.user?._id || this.store.user?.id;

        const totalPrice = this.hoursWorked * this.hourlyPrice;

        // First update status to "done"
        await axios.post(`${URL}/jobs/done`, {
          jobId,
          handymanId,
        });

        // Then submit hours worked
        await axios.post(`${URL}/jobs/${jobId}/hours`, {
          handymanId,
          hoursWorked: this.hoursWorked,
          hourlyPrice: this.hourlyPrice,
          totalPrice,
        });

        this.toast.showSuccess("שעות העבודה נשמרו");
        this.showHoursWorkedModal = false;
        this.hoursWorked = 1;
        this.localJobStatus = "done";
        this.$emit("status-updated", "done");
      } catch (error) {
        this.toast.showError(
          error.response?.data?.message || "שגיאה בשמירת שעות העבודה"
        );
      } finally {
        this.isSubmittingHours = false;
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
          this.toast.showError("לא ניתן לזהות את הלקוח");
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
          this.toast.showError("שגיאה בשליחת הדירוג");
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
          this.toast.showError("שגיאה בשליחת הדירוג");
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
      if (!this.cancelReasonText.trim() || this.isCancellingJob) return;

      this.isCancellingJob = true;
      try {
        const job = this.currentJob;
        const jobId = job._id || job.id;
        if (!jobId) return;

        const userId = this.store.user?._id || this.store.user?.id;
        if (!userId) {
          this.toast.showError("שגיאה: לא נמצא מזהה משתמש");
          return;
        }

        // Determine if user is handyman or client
        const isHandyman = this.isHandyman;
        const personCancel = isHandyman ? "handyman" : "customer";

        if (this.cancelAction === "delete") {
          // Delete job completely
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
          // Complete cancellation
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
          // Cancel for this handyman only
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
    calculateNewPrice() {
      const currentPrice = this.currentJobPrice;
      if (!currentPrice || this.priceChangePercent === 0) {
        this.newPrice = currentPrice;
        this.priceChangeAmount = 0;
        return;
      }

      // Limit to -20% to +20%
      const percent = Math.max(-20, Math.min(20, this.priceChangePercent));
      this.priceChangePercent = percent;

      // Calculate new price
      const changeMultiplier = 1 + percent / 100;
      this.newPrice = Math.round(currentPrice * changeMultiplier * 100) / 100;
      this.priceChangeAmount = this.newPrice - currentPrice;
    },
    async submitPriceChange() {
      if (this.priceChangePercent === 0 || this.isUpdatingPrice) return;

      const job = this.currentJob;
      const jobId = job?.id || job?._id;
      if (!jobId) return;

      const userId = this.store?.user?._id;
      if (!userId) {
        this.toast?.showError("לא ניתן לזהות את המשתמש");
        return;
      }

      this.isUpdatingPrice = true;

      try {
        // Send price change request via WebSocket
        if (this.socket && this.socket.connected) {
          this.socket.emit("price-change-request", {
            jobId: String(jobId),
            handymanId: String(userId),
            percent: this.priceChangePercent,
            oldPrice: this.currentJobPrice,
            newPrice: this.newPrice,
            changeAmount: this.priceChangeAmount,
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
        } else {
          this.toast?.showError("אין חיבור לשרת. אנא נסה שוב.");
        }
      } catch (error) {
        this.toast?.showError("שגיאה בשליחת בקשת שינוי המחיר");
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
          this.toast?.showError("אין חיבור לשרת. אנא נסה שוב.");
        }
      } catch (error) {
        this.toast?.showError("שגיאה באישור שינוי המחיר");
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
          this.toast?.showError("אין חיבור לשרת. אנא נסה שוב.");
        }
      } catch (error) {
        this.toast?.showError("שגיאה בדחיית שינוי המחיר");
      } finally {
        this.isRespondingToPriceChange = false;
      }
    },

    // Audio recording methods
    async startRecording() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        this.audioChunks = [];
        this.mediaRecorder = new MediaRecorder(stream, {
          mimeType: "audio/webm;codecs=opus",
        });

        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            this.audioChunks.push(event.data);
          }
        };

        this.mediaRecorder.onstop = () => {
          this.audioBlob = new Blob(this.audioChunks, { type: "audio/webm" });
          this.audioPreview = window.URL.createObjectURL(this.audioBlob);
          stream.getTracks().forEach((track) => track.stop());
        };

        this.mediaRecorder.start();
        this.isRecording = true;
        this.recordingTime = 0;

        this.recordingInterval = setInterval(() => {
          this.recordingTime++;
        }, 1000);
      } catch (error) {
        this.toast?.showError("לא ניתן לגשת למיקרופון. אנא בדוק את ההרשאות.");
      }
    },

    stopRecording() {
      if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
        this.mediaRecorder.stop();
      }
      if (this.recordingInterval) {
        clearInterval(this.recordingInterval);
        this.recordingInterval = null;
      }
      this.isRecording = false;
    },

    cancelAudioPreview() {
      if (this.audioPreview) {
        window.URL.revokeObjectURL(this.audioPreview);
        this.audioPreview = null;
      }
      this.audioBlob = null;
      this.audioChunks = [];
      this.recordingTime = 0;
    },

    playAudioPreview() {
      if (this.audioPreview) {
        const audio = new Audio(this.audioPreview);
        audio.play();
      }
    },

    formatRecordingTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    },

    async sendAudio() {
      if (!this.audioBlob) return;

      const job = this.currentJob;
      const jobId = job?.id || job?._id;
      if (!jobId) return;

      const userId = this.store?.user?._id;
      if (!userId) {
        this.toast?.showError("לא ניתן לזהות את המשתמש");
        return;
      }

      try {
        // Upload audio to S3
        const formData = new FormData();
        formData.append(
          "audio",
          this.audioBlob,
          `recording-${Date.now()}.webm`
        );

        const { data } = await axios.post(`${URL}/upload-audio`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (!data.audioUrl) {
          this.toast?.showError("שגיאה בהעלאת ההקלטה");
          return;
        }

        // Track audio URL for cleanup
        this.audioUrlsToDelete.push(data.audioUrl);

        // Add optimistic message immediately
        const audioDurationFormatted = this.formatRecordingTime(
          this.recordingTime
        );
        const optimisticMessage = {
          sender: "me",
          text: "",
          image: null,
          audio: data.audioUrl,
          location: null,
          isPlaying: false,
          audioDuration: audioDurationFormatted,
          audioDurationRaw: this.recordingTime,
          time: new Date().toLocaleTimeString("he-IL", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          createdAt: new Date(),
          tempId: `temp-audio-${Date.now()}`,
          uploading: true,
        };
        this.messages.push(optimisticMessage);
        this.scrollToBottom();

        // Send audio message with duration
        await axios.post(`${URL}/jobs/${jobId}/messages`, {
          audioUrl: data.audioUrl,
          audioDuration: this.recordingTime, // Send duration in seconds
          senderId: userId,
          isHandyman: this.isHandyman,
        });

        // Remove uploading flag
        const optimisticIndex = this.messages.findIndex(
          (m) => m.tempId === optimisticMessage.tempId
        );
        if (optimisticIndex !== -1) {
          this.messages[optimisticIndex].uploading = false;
          delete this.messages[optimisticIndex].tempId;
        }

        // Clean up preview
        this.cancelAudioPreview();
      } catch (error) {
        this.toast?.showError("שגיאה בשליחת ההקלטה");
      }
    },

    toggleAudioPlayback(messageIndex) {
      const message = this.messages[messageIndex];
      if (!message || !message.audio) return;

      const audioElement =
        this.$refs[`audio-${messageIndex}`]?.[0] ||
        this.$refs[`audio-${messageIndex}`];
      if (!audioElement) return;

      if (message.isPlaying) {
        audioElement.pause();
        message.isPlaying = false;
      } else {
        // Pause all other audio
        this.messages.forEach((msg, idx) => {
          if (idx !== messageIndex && msg.isPlaying) {
            const otherAudio =
              this.$refs[`audio-${idx}`]?.[0] || this.$refs[`audio-${idx}`];
            if (otherAudio) {
              otherAudio.pause();
              msg.isPlaying = false;
            }
          }
        });
        audioElement.play();
        message.isPlaying = true;

        audioElement.onended = () => {
          message.isPlaying = false;
        };
      }
    },

    updateAudioDuration(messageIndex, event) {
      const audioElement = event.target;
      const duration = Math.floor(audioElement.duration);
      const message = this.messages[messageIndex];
      if (message) {
        message.audioDuration = this.formatRecordingTime(duration);
        message.audioDurationRaw = duration;
      }
    },

    getWaveformBars(messageIndex) {
      const message = this.messages[messageIndex];
      if (!message || !message.audioDurationRaw) {
        // Default waveform if no duration
        return Array(40)
          .fill(0)
          .map(() => Math.random() * 30 + 10);
      }
      // Generate waveform bars based on duration
      const barCount = 40;
      const bars = [];
      for (let i = 0; i < barCount; i++) {
        // Create a more realistic waveform pattern
        const height = Math.random() * 40 + 20 + Math.sin(i * 0.5) * 15;
        bars.push(Math.max(10, Math.min(80, height)));
      }
      return bars;
    },

    handleTyping() {
      if (!this.socket || !this.socket.connected) return;

      const job = this.currentJob;
      const jobId = job?.id || job?._id;
      if (!jobId) return;

      // Clear existing timeout
      if (this.typingEmitTimeout) {
        clearTimeout(this.typingEmitTimeout);
      }

      // Emit typing event (don't set local isTyping, only emit to others)
      this.socket.emit("typing", {
        jobId: String(jobId),
        isTyping: true,
      });

      // Stop typing after 3 seconds of inactivity
      this.typingEmitTimeout = setTimeout(() => {
        if (this.socket && this.socket.connected) {
          this.socket.emit("typing", {
            jobId: String(jobId),
            isTyping: false,
          });
        }
      }, 3000);
    },

    async cleanupChatFiles() {
      // Clean up audio files from S3
      const audioBucketName = "voice-chat123";
      const imageBucketName = "hendiman123"; // Default bucket name

      // Collect all image URLs from messages
      const imageUrls = [];
      this.messages.forEach((msg) => {
        if (
          msg.image &&
          (msg.image.includes(imageBucketName) ||
            msg.image.includes("s3.amazonaws.com"))
        ) {
          imageUrls.push(msg.image);
        }
      });

      // Delete all audio files
      for (const audioUrl of this.audioUrlsToDelete) {
        try {
          if (audioUrl && audioUrl.includes(audioBucketName)) {
            await axios.post(`${URL}/delete-audio`, {
              audioUrl,
              bucketName: audioBucketName,
            });
          }
        } catch (error) {
          // Silent fail - continue deleting other files
        }
      }

      // Delete all image files
      for (const imageUrl of imageUrls) {
        try {
          // Extract bucket name from URL
          const urlMatch = imageUrl.match(
            /https:\/\/([^.]+)\.s3\.amazonaws\.com\//
          );
          const bucketNameFromUrl = urlMatch ? urlMatch[1] : imageBucketName;

          if (imageUrl && imageUrl.includes("s3.amazonaws.com")) {
            await axios.post(`${URL}/delete-image`, {
              imageUrl,
              bucketName: bucketNameFromUrl,
            });
          }
        } catch (error) {
          // Silent fail - continue deleting other files
        }
      }

      // Clear arrays
      this.audioUrlsToDelete = [];
    },
  },
};
</script>

<style lang="scss" scoped>
/* JobChatMobileV2 - Premium dark/orange UI
   Notes:
   - No logic changes, only styles.
   - Theme: black / orange / gray
*/

.chat {
  /* Theme tokens */
  --bg: #0b0d10;
  --bg2: #0f1217;
  --panel: rgba(18, 22, 28, 0.92);
  --panel2: rgba(22, 26, 33, 0.92);
  --stroke: rgba(255, 255, 255, 0.08);
  --stroke2: rgba(255, 255, 255, 0.12);
  --text: rgba(255, 255, 255, 0.92);
  --muted: rgba(255, 255, 255, 0.62);
  --muted2: rgba(255, 255, 255, 0.42);
  --orange: #ff6a00;
  --orange2: #ff8a3a;
  --green: #22c55e;
  --red: #ef4444;
  --yellow: #fbbf24;

  --r-xl: 22px;
  --r-lg: 18px;
  --r-md: 14px;
  --r-sm: 12px;

  --shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
  --shadow2: 0 10px 22px rgba(0, 0, 0, 0.35);

  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  background: radial-gradient(
      1200px 600px at 85% -10%,
      rgba(255, 106, 0, 0.18),
      transparent 55%
    ),
    radial-gradient(
      800px 500px at 10% 110%,
      rgba(255, 106, 0, 0.12),
      transparent 55%
    ),
    linear-gradient(180deg, var(--bg), var(--bg2));
  color: var(--text);
  overflow: hidden;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue",
    Arial;
  z-index: 1000;

  * {
    box-sizing: border-box;
  }

  /* subtle animated grain */
  &::before {
    content: "";
    position: absolute;
    inset: -2px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='.18'/%3E%3C/svg%3E");
    opacity: 0.05;
    pointer-events: none;
    mix-blend-mode: overlay;
  }
}

/* HEADER */
.chat__header {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  padding: 14px 14px;
  background: linear-gradient(
    180deg,
    rgba(10, 12, 15, 0.92),
    rgba(10, 12, 15, 0.65)
  );
  backdrop-filter: blur(12px);
  border-bottom: 2px solid var(--stroke);
  flex-wrap: nowrap;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.chat__iconBtn {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  border: 1px solid var(--stroke);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.15s ease, background 0.15s ease,
    border-color 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.07);
    border-color: var(--stroke2);
    transform: translateY(-1px);
  }
  &:active {
    transform: translateY(0);
  }
}

.chat__icon {
  font-size: 18px;
  line-height: 1;
}

.chat__cancelBtn {
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid var(--red);
  background: rgba(239, 68, 68, 0.15);
  color: var(--red);
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  white-space: nowrap;

  &:hover {
    background: rgba(239, 68, 68, 0.25);
    border-color: rgba(239, 68, 68, 0.8);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
    background: rgba(239, 68, 68, 0.2);
  }
}

.chat__headInfo {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  overflow: hidden;
}

.chat__title {
  font-weight: 750;
  font-size: 15px;
  letter-spacing: 0.1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
}

.chat__subtitle {
  font-size: 12px;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 1;
  min-width: 0;

  &::before {
    content: "•";
    margin-left: 6px;
    margin-right: 6px;
    color: var(--muted2);
  }
}

.chat__headRight {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.chat__status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 999px;
  font-size: 12px;
  border: 1px solid var(--stroke);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.25);
}

.chat__statusDot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--orange);
  box-shadow: 0 0 0 4px rgba(255, 106, 0, 0.15);
}

.status--new .chat__statusDot,
.dot--new {
  background: var(--orange);
  box-shadow: 0 0 0 4px rgba(255, 106, 0, 0.14);
}
.status--move .chat__statusDot,
.dot--move {
  background: var(--yellow);
  box-shadow: 0 0 0 4px rgba(251, 191, 36, 0.14);
}
.status--work .chat__statusDot,
.dot--work {
  background: #60a5fa;
  box-shadow: 0 0 0 4px rgba(96, 165, 250, 0.14);
}
.status--done .chat__statusDot,
.dot--done {
  background: var(--green);
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.14);
}

/* MENU (overlay) */
.chat__menu {
  position: fixed;
  inset: 0;
  z-index: 80;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(6px);
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  padding: 70px 14px 14px 14px;
}

.chat__menuCard {
  width: min(320px, 92vw);
  background: linear-gradient(
    180deg,
    rgba(20, 24, 31, 0.95),
    rgba(16, 20, 26, 0.95)
  );
  border: 1px solid var(--stroke);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.chat__menuItem {
  width: 100%;
  padding: 14px 14px;
  background: transparent;
  border: 0;
  color: var(--text);
  font-size: 14px;
  cursor: pointer;
  text-align: right;
  transition: background 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  & + & {
    border-top: 1px solid var(--stroke);
  }

  &--danger {
    color: rgba(255, 255, 255, 0.95);
    background: linear-gradient(
      180deg,
      rgba(239, 68, 68, 0.12),
      rgba(239, 68, 68, 0.06)
    );
  }
}

/* TABS */
.chat__tabs {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 10px 12px;
  border-bottom: 1px solid var(--stroke);
  background: rgba(10, 12, 15, 0.35);
  backdrop-filter: blur(10px);

  &::-webkit-scrollbar {
    height: 8px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.08);
    border-radius: 999px;
  }
}

.chat__tab {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 999px;
  border: 1px solid var(--stroke);
  background: rgba(255, 255, 255, 0.03);
  color: var(--text);
  cursor: pointer;
  transition: transform 0.15s ease, background 0.15s ease,
    border-color 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    transform: translateY(-1px);
    border-color: var(--stroke2);
  }

  &--active {
    border-color: rgba(255, 106, 0, 0.55);
    background: linear-gradient(
      180deg,
      rgba(255, 106, 0, 0.18),
      rgba(255, 255, 255, 0.03)
    );
    box-shadow: 0 10px 22px rgba(255, 106, 0, 0.12);
  }
}

.chat__tabName {
  max-width: 170px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  font-weight: 650;
}

.chat__tabBadge {
  min-width: 22px;
  height: 22px;
  padding: 0 7px;
  border-radius: 999px;
  background: rgba(255, 106, 0, 0.18);
  border: 1px solid rgba(255, 106, 0, 0.35);
  color: var(--text);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}

/* ACTION BAR */
.chat__actions {
  padding: 0;
  background: rgba(10, 12, 15, 0.5);
  backdrop-filter: blur(8px);
  position: sticky;
  top: 0;
  z-index: 25;
  border-bottom: 2px solid var(--stroke);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.chat__actionsRow {
  display: flex;
  gap: 10px;
  flex-wrap: nowrap;
  align-items: center;
  padding: 10px 12px;
}

.chat__statusUpdateRow {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 8px 12px 10px;
  border-top: 1px solid var(--stroke);
}

.chat__statusUpdateRow .status-update-btn {
  width: 40%;
  min-width: 200px;
  max-width: 280px;
  justify-content: space-between;
  margin-right: 0;
  margin-left: auto !important;
}

/* CHIP */
.chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 999px;
  border: 1px solid var(--stroke);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text);
  cursor: pointer;
  font-size: 13px;
  font-weight: 650;
  transition: transform 0.15s ease, background 0.15s ease,
    border-color 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.07);
    border-color: var(--stroke2);
    transform: translateY(-1px);
  }
  &:active {
    transform: translateY(0px);
  }

  &--primary {
    border-color: rgba(255, 106, 0, 0.55);
    background: linear-gradient(
      180deg,
      rgba(255, 106, 0, 0.2),
      rgba(255, 255, 255, 0.03)
    );
    box-shadow: 0 12px 24px rgba(255, 106, 0, 0.12);
  }

  &--ghost {
    background: rgba(255, 255, 255, 0.03);
  }

  &--icon-only {
    width: 42px;
    height: 42px;
    justify-content: center;
    padding: 0;
    font-size: 18px;
  }
}

.chip__icon {
  font-size: 16px;
  line-height: 1;
}
.chip__text {
  line-height: 1;
}

/* Status update button */
.status-update-btn {
  justify-content: space-between;
  gap: 10px;
}

.status-update-label-inline {
  font-size: 12px;
  color: var(--muted);
  font-weight: 600;
}

.status-update-value {
  font-weight: 800;
}

/* Fancy active statuses (optional classes from your method) */
.chip--status-active {
  box-shadow: 0 14px 28px rgba(255, 106, 0, 0.16);
}
.chip--status-on-the-way {
  border-color: rgba(251, 191, 36, 0.5);
}
.chip--status-in-progress {
  border-color: rgba(96, 165, 250, 0.55);
}
.chip--status-done {
  border-color: rgba(34, 197, 94, 0.55);
}

/* STEPPER */
.chat__stepper {
  padding: 8px 12px 12px;
}
.chat__stepper--desktop {
  display: none;
  @media (min-width: 860px) {
    display: flex;
  }
  gap: 10px;
  align-items: center;
  justify-content: center;
}

.step {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 999px;
  border: 1px solid var(--stroke);
  background: rgba(255, 255, 255, 0.03);

  &__dot {
    width: 26px;
    height: 26px;
    border-radius: 999px;
    display: grid;
    place-items: center;
    border: 1px solid var(--stroke2);
    background: rgba(255, 255, 255, 0.04);
    font-weight: 800;
    font-size: 12px;
  }

  &__label {
    font-size: 12px;
    color: var(--muted);
    font-weight: 650;
  }

  &.is-active {
    border-color: rgba(255, 106, 0, 0.55);
    background: linear-gradient(
      180deg,
      rgba(255, 106, 0, 0.12),
      rgba(255, 255, 255, 0.02)
    );

    .step__dot {
      border-color: rgba(255, 106, 0, 0.55);
      background: rgba(255, 106, 0, 0.18);
    }
    .step__label {
      color: rgba(255, 255, 255, 0.85);
    }
  }

  &.is-done {
    border-color: rgba(34, 197, 94, 0.45);

    .step__dot {
      border-color: rgba(34, 197, 94, 0.45);
      background: rgba(34, 197, 94, 0.14);
    }
  }
}

/* RATING */
.chat__rating {
  margin: 10px 12px 0;
  padding: 14px;
  border-radius: var(--r-xl);
  border: 1px solid var(--stroke);
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.04),
    rgba(255, 255, 255, 0.02)
  );
  box-shadow: var(--shadow2);
}

.chat__ratingTitle {
  font-size: 14px;
  font-weight: 800;
  margin-bottom: 10px;
}

.chat__stars {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 10px;

  input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  label {
    cursor: pointer;
    user-select: none;
  }

  .star {
    font-size: 22px;
    color: rgba(255, 255, 255, 0.18);
    filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.35));
    transition: transform 0.12s ease, color 0.12s ease;

    &.is-on {
      color: var(--orange);
      transform: translateY(-1px);
    }
  }
}

.chat__review {
  width: 100%;
  resize: none;
  border-radius: 14px;
  border: 1px solid var(--stroke);
  background: rgba(0, 0, 0, 0.25);
  color: var(--text);
  padding: 10px 12px;
  outline: none;
  margin-bottom: 10px;

  &:focus {
    border-color: rgba(255, 106, 0, 0.55);
    box-shadow: 0 0 0 4px rgba(255, 106, 0, 0.14);
  }
}

.chat__rateBtn {
  width: 100%;
  border: 1px solid rgba(255, 106, 0, 0.55);
  background: linear-gradient(
    180deg,
    rgba(255, 106, 0, 0.22),
    rgba(255, 255, 255, 0.03)
  );
  color: var(--text);
  border-radius: 14px;
  padding: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.15s ease, background 0.15s ease;

  &:hover {
    transform: translateY(-1px);
    background: linear-gradient(
      180deg,
      rgba(255, 106, 0, 0.28),
      rgba(255, 255, 255, 0.04)
    );
  }
  &:active {
    transform: translateY(0);
  }
}

/* MESSAGES */
.chat__messages {
  flex: 1;
  padding: 14px 12px 12px;
  overflow-y: auto;
  scroll-behavior: smooth;

  &::-webkit-scrollbar {
    width: 10px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.08);
    border-radius: 999px;
    border: 2px solid transparent;
    background-clip: content-box;
  }
}

.chat__empty {
  text-align: center;
  color: var(--muted);
  padding: 26px 10px;
  border-radius: var(--r-xl);
  border: 1px dashed rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.02);
}

.msg {
  display: flex;
  margin: 10px 0;

  &.is-me {
    justify-content: flex-start; /* RTL: "me" on left or right? choose right feel */
    /* In RTL, many apps place "me" on left. If you want "me" on right, swap:
       justify-content: flex-end;
    */
    justify-content: flex-end;
  }

  &.is-system {
    justify-content: center;
  }
}

.bubbleWrap {
  max-width: min(560px, 92%);
  width: fit-content;
}

.bubble {
  position: relative;
  border-radius: 18px;
  border: 1px solid var(--stroke);
  background: rgba(255, 255, 255, 0.03);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.25);
  overflow: hidden;

  &--me {
    border-color: rgba(255, 106, 0, 0.45);
    background: linear-gradient(
      180deg,
      rgba(255, 106, 0, 0.16),
      rgba(255, 255, 255, 0.03)
    );
  }

  &--other {
    background: rgba(255, 255, 255, 0.035);
  }

  &--system {
    border-style: dashed;
    border-color: rgba(255, 255, 255, 0.16);
    background: rgba(255, 255, 255, 0.02);
    box-shadow: none;
  }

  &--uploading {
    opacity: 0.9;
  }
}

.bubble__content {
  padding: 10px 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bubble__text {
  font-size: 14px;
  line-height: 1.5;
  color: var(--text);
  white-space: pre-wrap;
  word-break: break-word;
}

.bubble__meta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 0 12px 10px;
  color: var(--muted2);
  font-size: 11px;
}

.bubble__tick {
  color: rgba(255, 255, 255, 0.7);
  font-weight: 800;
}

.bubble__uploading {
  position: absolute;
  bottom: 8px;
  left: 10px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
}

/* IMAGE */
.bubble__imgBtn {
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  position: relative;
  border-radius: 16px;
  overflow: hidden;
}

.bubble__img {
  width: min(320px, 76vw);
  max-height: 280px;
  object-fit: cover;
  display: block;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.bubble__imgGlow {
  position: absolute;
  inset: 0;
  border-radius: 16px;
  pointer-events: none;
  background: radial-gradient(
    220px 160px at 70% 20%,
    rgba(255, 106, 0, 0.2),
    transparent 60%
  );
  opacity: 0.9;
}

/* LOCATION CARD in bubble */
.bubble__loc {
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  position: relative;
  border-radius: 16px;
  overflow: hidden;
}

.bubble__locMap {
  width: min(320px, 76vw);
  height: 180px;
  object-fit: cover;
  display: block;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.bubble__locOverlay {
  position: absolute;
  inset: auto 10px 10px 10px;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  display: inline-flex;
  gap: 8px;
  align-items: center;
  color: rgba(255, 255, 255, 0.92);
  font-size: 13px;
  font-weight: 700;
}

/* AUDIO */
.bubble__audioBtn {
  width: 100%;
  min-width: 200px;
  max-width: 280px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.25);
  color: var(--text);
  padding: 12px 14px;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.32);
    transform: translateY(-1px);
  }
  &:active {
    transform: translateY(0);
  }
}

.bubble__audioIcon {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: rgba(255, 106, 0, 0.14);
  border: 1px solid rgba(255, 106, 0, 0.3);
}

.bubble__audioTime {
  font-weight: 800;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.85);
}

.bubble__audioWave {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 2px;
  height: 24px;
  padding: 0 4px;
}

.bubble__audioWaveBar {
  flex: 1;
  min-width: 2px;
  background: linear-gradient(
    180deg,
    rgba(255, 106, 0, 0.9),
    rgba(255, 106, 0, 0.5)
  );
  border-radius: 2px;
  transition: height 0.1s ease;
  animation: wavePulse 1.5s ease-in-out infinite;
}

@keyframes wavePulse {
  0%,
  100% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
}

/* TYPING INDICATOR */
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  animation: typingBounce 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) {
  animation-delay: 0s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typingBounce {
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.5;
  }
  30% {
    transform: translateY(-8px);
    opacity: 1;
  }
}

/* COMPOSER */
.composer {
  position: sticky;
  bottom: 0;
  z-index: 25;
  padding: 12px 12px 14px;
  background: linear-gradient(
    180deg,
    rgba(10, 12, 15, 0.25),
    rgba(10, 12, 15, 0.88)
  );
  backdrop-filter: blur(12px);
  border-top: 1px solid var(--stroke);
  display: flex;
  gap: 10px;
  align-items: center;
}

.composer__plus,
.composer__record,
.composer__send {
  width: 44px;
  height: 44px;
  border-radius: 16px;
  border: 1px solid var(--stroke);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text);
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: transform 0.15s ease, background 0.15s ease,
    border-color 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.07);
    border-color: var(--stroke2);
    transform: translateY(-1px);
  }
  &:active {
    transform: translateY(0);
  }
  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none;
  }
}

.composer__send {
  width: 64px;
  font-size: 13px;
  font-weight: 800;
  border-color: rgba(255, 106, 0, 0.45);
  background: linear-gradient(
    180deg,
    rgba(255, 106, 0, 0.22),
    rgba(255, 255, 255, 0.03)
  );

  &:hover {
    background: linear-gradient(
      180deg,
      rgba(255, 106, 0, 0.28),
      rgba(255, 255, 255, 0.04)
    );
  }
  &:disabled {
    border-color: var(--stroke);
    background: rgba(255, 255, 255, 0.04);
  }
}

.composer__record--recording {
  border-color: rgba(239, 68, 68, 0.45);
  background: linear-gradient(
    180deg,
    rgba(239, 68, 68, 0.18),
    rgba(255, 255, 255, 0.02)
  );
}

.composer__input {
  flex: 1;
  height: 44px;
  border-radius: 16px;
  border: 1px solid var(--stroke);
  background: rgba(255, 255, 255, 0.03);
  color: var(--text);
  padding: 0 12px;
  outline: none;
  font-size: 14px;

  &:focus {
    border-color: rgba(255, 106, 0, 0.55);
    box-shadow: 0 0 0 4px rgba(255, 106, 0, 0.14);
  }
}

/* preview blocks inside composer */
.composer__preview {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.composer__previewTop {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.composer__previewImg {
  width: 86px;
  height: 56px;
  border-radius: 14px;
  object-fit: cover;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.composer__previewClose {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  border: 1px solid var(--stroke);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text);
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: background 0.15s ease, transform 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.07);
    transform: translateY(-1px);
  }
  &:active {
    transform: translateY(0);
  }
}

.composer__audioPreview {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.25);
  flex: 1;
}

.composer__audioPlay {
  width: 38px;
  height: 38px;
  border-radius: 14px;
  border: 1px solid rgba(255, 106, 0, 0.3);
  background: rgba(255, 106, 0, 0.14);
  color: var(--text);
  cursor: pointer;
  display: grid;
  place-items: center;
}

.composer__audioTime {
  font-weight: 800;
  color: rgba(255, 255, 255, 0.85);
}

/* TOOLS SHEET */
.toolsSheet {
  position: fixed;
  inset: 0;
  z-index: 90;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 12px;
}

.toolsSheet__card {
  width: min(520px, 96vw);
  border-radius: 26px;
  border: 1px solid var(--stroke);
  background: linear-gradient(
    180deg,
    rgba(22, 26, 33, 0.95),
    rgba(16, 20, 26, 0.95)
  );
  box-shadow: var(--shadow);
  padding: 14px;
}

.toolsSheet__title {
  font-size: 13px;
  color: var(--muted);
  font-weight: 700;
  margin-bottom: 10px;
}

.toolsSheet__item {
  width: 100%;
  border-radius: 18px;
  border: 1px solid var(--stroke);
  background: rgba(255, 255, 255, 0.03);
  color: var(--text);
  padding: 12px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 750;
  transition: transform 0.15s ease, background 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    transform: translateY(-1px);
  }

  & + & {
    margin-top: 10px;
  }
}

.toolsSheet__emoji {
  width: 34px;
  height: 34px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: rgba(255, 106, 0, 0.12);
  border: 1px solid rgba(255, 106, 0, 0.26);
}

.toolsSheet__txt {
  font-size: 14px;
}

.toolsSheet__close {
  width: 100%;
  margin-top: 12px;
  border-radius: 18px;
  border: 1px solid var(--stroke);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text);
  padding: 12px;
  cursor: pointer;
  font-weight: 800;
}

/* MODAL (base) */
.modal {
  position: fixed;
  inset: 0;
  z-index: 95;
  background: rgba(0, 0, 0, 0.62);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px;
}

/* Image modal - z-index גבוה יותר כדי שיהיה מעל הפופאפ של תמונות העבודה */
.modal--image {
  z-index: 96;
}

/* Image modal */
.modal__card {
  width: min(720px, 96vw);
  border-radius: 26px;
  border: 1px solid var(--stroke);
  background: rgba(14, 16, 20, 0.95);
  box-shadow: var(--shadow);
  overflow: hidden;
  position: relative;
}

.modal__close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 42px;
  height: 42px;
  border-radius: 16px;
  border: 1px solid var(--stroke);
  background: rgba(255, 255, 255, 0.06);
  color: var(--text);
  cursor: pointer;
  display: grid;
  place-items: center;
}

.modal__img {
  width: 100%;
  max-height: 78vh;
  object-fit: contain;
  display: block;
}

/* NAV MODAL */
.navModal {
  width: min(420px, 96vw);
  border-radius: 26px;
  border: 1px solid var(--stroke);
  background: linear-gradient(
    180deg,
    rgba(22, 26, 33, 0.95),
    rgba(16, 20, 26, 0.95)
  );
  box-shadow: var(--shadow);
  padding: 16px;
}

.navModal__title {
  font-weight: 900;
  font-size: 15px;
  margin-bottom: 12px;
}

.navModal__actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.navModal__btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 12px;
  border-radius: 18px;
  border: 1px solid var(--stroke);
  background: rgba(255, 255, 255, 0.03);
  color: var(--text);
  text-decoration: none;
  font-weight: 800;
  transition: transform 0.15s ease, background 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    transform: translateY(-1px);
  }

  &--waze {
    border-color: rgba(255, 106, 0, 0.4);
    background: rgba(255, 106, 0, 0.1);
  }

  &--google {
    border-color: rgba(96, 165, 250, 0.4);
    background: rgba(96, 165, 250, 0.1);
  }
}

.navModal__btnIcon {
  width: 36px;
  height: 36px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.navModal__cancel {
  padding: 12px;
  border-radius: 18px;
  border: 1px solid var(--stroke);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text);
  cursor: pointer;
  font-weight: 900;
}

/* CANCEL REASON MODAL */
.cancelReasonModal {
  width: min(560px, 96vw);
  border-radius: 26px;
  border: 1px solid var(--stroke);
  background: linear-gradient(
    180deg,
    rgba(22, 26, 33, 0.95),
    rgba(16, 20, 26, 0.95)
  );
  box-shadow: var(--shadow);
  padding: 16px;
}

.cancelReasonModal__title {
  font-weight: 950;
  font-size: 16px;
  margin-bottom: 10px;
}

.cancelReasonModal__label {
  display: block;
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 8px;
  font-weight: 700;
}

.cancelReasonModal__textarea {
  width: 100%;
  resize: none;
  border-radius: 18px;
  border: 1px solid var(--stroke);
  background: rgba(0, 0, 0, 0.25);
  color: var(--text);
  padding: 12px 12px;
  outline: none;

  &:focus {
    border-color: rgba(255, 106, 0, 0.55);
    box-shadow: 0 0 0 4px rgba(255, 106, 0, 0.14);
  }
}

.cancelReasonModal__warning {
  margin: 12px 0;
  padding: 12px;
  border-radius: 18px;
  border: 1px solid rgba(251, 191, 36, 0.3);
  background: rgba(251, 191, 36, 0.1);
  display: flex;
  gap: 10px;
  align-items: center;
}

.cancelReasonModal__warningIcon {
  font-size: 18px;
}
.cancelReasonModal__warningText {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 700;
  font-size: 13px;
}

.cancelReasonModal__options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cancelReasonModal__option {
  width: 100%;
  border-radius: 20px;
  border: 1px solid var(--stroke);
  background: rgba(255, 255, 255, 0.03);
  color: var(--text);
  padding: 12px 12px;
  cursor: pointer;
  display: grid;
  grid-template-columns: 36px 1fr 24px;
  align-items: center;
  gap: 10px;
  transition: transform 0.15s ease, background 0.15s ease,
    border-color 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none;
  }

  &--selected {
    border-color: rgba(255, 106, 0, 0.55);
    background: rgba(255, 106, 0, 0.12);
  }

  &--delete {
    border-color: rgba(239, 68, 68, 0.35);
    background: rgba(239, 68, 68, 0.08);
  }
}

.cancelReasonModal__optionIcon {
  width: 36px;
  height: 36px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.cancelReasonModal__optionText {
  font-weight: 850;
  font-size: 14px;
}

.cancelReasonModal__checkIcon {
  font-weight: 950;
  color: var(--orange);
  text-align: left;
}

.cancelReasonModal__actions {
  margin-top: 14px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.cancelReasonModal__btn {
  padding: 12px;
  border-radius: 18px;
  border: 1px solid var(--stroke);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text);
  cursor: pointer;
  font-weight: 900;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  &--submit {
    border-color: rgba(255, 106, 0, 0.55);
    background: rgba(255, 106, 0, 0.14);
  }

  &--cancel {
    background: rgba(255, 255, 255, 0.03);
  }
}

/* LOCATION MODAL CARD */
.locCard {
  width: min(520px, 96vw);
  border-radius: 26px;
  border: 1px solid var(--stroke);
  background: linear-gradient(
    180deg,
    rgba(22, 26, 33, 0.95),
    rgba(16, 20, 26, 0.95)
  );
  box-shadow: var(--shadow);
  overflow: hidden;
  position: relative;
}

.locCard__close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 42px;
  height: 42px;
  border-radius: 16px;
  border: 1px solid var(--stroke);
  background: rgba(255, 255, 255, 0.06);
  color: var(--text);
  cursor: pointer;
  display: grid;
  place-items: center;
  z-index: 1;
}

.locCard__map {
  width: 100%;
  height: 240px;
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
  font-weight: 950;
  font-size: 15px;
}
.locCard__coords {
  color: var(--muted);
  font-size: 12px;
}

.locCard__btn {
  width: 100%;
  padding: 12px;
  border-radius: 18px;
  border: 1px solid var(--stroke);
  text-decoration: none;
  color: var(--text);
  text-align: center;
  font-weight: 900;
  background: rgba(255, 255, 255, 0.03);

  &--waze {
    border-color: rgba(255, 106, 0, 0.4);
    background: rgba(255, 106, 0, 0.1);
  }
  &--gm {
    border-color: rgba(96, 165, 250, 0.4);
    background: rgba(96, 165, 250, 0.1);
  }
}

/* PRICE UPDATE MODAL */
.priceUpdateModal,
.priceApprovalModal,
.jobImagesModal,
.hoursWorkedModal,
.routeCard {
  width: min(560px, 96vw);
  border-radius: 26px;
  border: 1px solid var(--stroke);
  background: linear-gradient(
    180deg,
    rgba(22, 26, 33, 0.95),
    rgba(16, 20, 26, 0.95)
  );
  box-shadow: var(--shadow);
  overflow: hidden;
}

.priceUpdateModal__header,
.jobImagesModal__header,
.hoursWorkedModal__header,
.routeCard__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 14px;
  border-bottom: 1px solid var(--stroke);
}

.priceUpdateModal__title,
.jobImagesModal__title,
.hoursWorkedModal__title,
.routeCard__title,
.priceApprovalModal__title {
  margin: 0;
  font-size: 15px;
  font-weight: 950;
}

.priceUpdateModal__close,
.jobImagesModal__close,
.hoursWorkedModal__close,
.routeCard__close {
  width: 42px;
  height: 42px;
  border-radius: 16px;
  border: 1px solid var(--stroke);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text);
  cursor: pointer;
}

.priceUpdateModal__body,
.priceApprovalModal__body,
.jobImagesModal__body,
.hoursWorkedModal__body,
.routeCard__body {
  padding: 14px;
}

.priceUpdateModal__currentPrice,
.priceUpdateModal__newPrice {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 10px;
}

.priceUpdateModal__label {
  color: var(--muted);
  font-weight: 700;
  font-size: 12px;
}

.priceUpdateModal__value {
  font-weight: 950;
  font-size: 14px;

  &--new {
    color: rgba(255, 255, 255, 0.95);
  }
}

.priceUpdateModal__inputGroup {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 10px 0;
}

.priceUpdateModal__input {
  flex: 1;
  height: 44px;
  border-radius: 16px;
  border: 1px solid var(--stroke);
  background: rgba(0, 0, 0, 0.25);
  color: var(--text);
  padding: 0 12px;
  outline: none;

  &:focus {
    border-color: rgba(255, 106, 0, 0.55);
    box-shadow: 0 0 0 4px rgba(255, 106, 0, 0.14);
  }
}

.priceUpdateModal__percent {
  color: var(--muted);
  font-weight: 900;
}

.priceUpdateModal__changeAmount {
  margin-top: 8px;
}

.priceUpdateModal__changeText {
  font-weight: 950;

  &--increase {
    color: var(--green);
  }
  &--decrease {
    color: var(--red);
  }
}

.priceUpdateModal__footer,
.priceApprovalModal__footer,
.hoursWorkedModal__footer {
  padding: 12px 14px 14px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  border-top: 1px solid var(--stroke);
}

.priceUpdateModal__btn,
.priceApprovalModal__btn,
.hoursWorkedModal__btn {
  padding: 12px;
  border-radius: 18px;
  border: 1px solid var(--stroke);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text);
  font-weight: 950;
  cursor: pointer;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  &--submit,
  &--approve {
    border-color: rgba(255, 106, 0, 0.55);
    background: rgba(255, 106, 0, 0.14);
  }

  &--reject {
    border-color: rgba(239, 68, 68, 0.45);
    background: rgba(239, 68, 68, 0.12);
  }
}

/* PRICE APPROVAL DETAILS */
.priceApprovalModal__message {
  font-weight: 800;
  line-height: 1.5;
}

.priceApprovalModal__changePercent {
  font-weight: 950;
  padding: 2px 8px;
  border-radius: 999px;
  margin: 0 6px;
  border: 1px solid var(--stroke);
  background: rgba(255, 255, 255, 0.03);

  &--increase {
    border-color: rgba(34, 197, 94, 0.4);
    background: rgba(34, 197, 94, 0.1);
  }

  &--decrease {
    border-color: rgba(239, 68, 68, 0.4);
    background: rgba(239, 68, 68, 0.1);
  }
}

.priceApprovalModal__details {
  margin-top: 12px;
  border-radius: 20px;
  border: 1px solid var(--stroke);
  background: rgba(0, 0, 0, 0.2);
  padding: 12px;
}

.priceApprovalModal__detailRow {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;

  & + & {
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }
}

.priceApprovalModal__detailLabel {
  color: var(--muted);
  font-weight: 750;
  font-size: 12px;
}

.priceApprovalModal__detailValue {
  font-weight: 950;

  &--new {
    color: rgba(255, 255, 255, 0.95);
  }

  &--increase {
    color: var(--green);
  }

  &--decrease {
    color: var(--red);
  }
}

/* JOB IMAGES */
.jobImagesModal__empty {
  color: var(--muted);
  text-align: center;
  padding: 24px 0;
}

.jobImagesModal__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;

  @media (max-width: 420px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.jobImagesModal__imageBtn {
  border: 0;
  background: transparent;
  padding: 0;
  cursor: pointer;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.jobImagesModal__image {
  width: 100%;
  height: 110px;
  object-fit: cover;
  display: block;

  @media (min-width: 560px) {
    height: 140px;
  }
}

/* HOURS WORKED */
.hoursWorkedModal__message {
  font-weight: 850;
  margin-bottom: 12px;
}

.hoursWorkedModal__field {
  display: grid;
  grid-template-columns: 70px 1fr;
  gap: 10px;
  align-items: center;
  margin-bottom: 12px;
}

.hoursWorkedModal__label {
  color: var(--muted);
  font-weight: 800;
  font-size: 12px;
}

.hoursWorkedModal__input {
  height: 44px;
  border-radius: 16px;
  border: 1px solid var(--stroke);
  background: rgba(0, 0, 0, 0.25);
  color: var(--text);
  padding: 0 12px;
  outline: none;

  &:focus {
    border-color: rgba(255, 106, 0, 0.55);
    box-shadow: 0 0 0 4px rgba(255, 106, 0, 0.14);
  }
}

.hoursWorkedModal__priceInfo {
  border-radius: 20px;
  border: 1px solid var(--stroke);
  background: rgba(0, 0, 0, 0.2);
  padding: 12px;
}

.hoursWorkedModal__priceRow {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;

  & + & {
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }

  &--total .hoursWorkedModal__priceValue--total {
    color: var(--orange);
  }
}

.hoursWorkedModal__priceLabel {
  color: var(--muted);
  font-weight: 750;
  font-size: 12px;
}

.hoursWorkedModal__priceValue {
  font-weight: 950;
}

/* ROUTE MODAL */
.route-modal {
  align-items: center;
}

.routeCard {
  width: min(760px, 96vw);
}

.routeCard__mapWrapper {
  position: relative;
  height: min(46vh, 380px);
  border-bottom: 1px solid var(--stroke);
}

.routeCard__map {
  width: 100%;
  height: 100%;
}

.routeCard__loading {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: var(--muted);
  font-weight: 900;
  background: rgba(0, 0, 0, 0.35);
}

.routeCard__legend {
  position: absolute;
  left: 12px;
  bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(8px);
}

.routeCard__legendItem {
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.88);
  font-weight: 800;
  font-size: 12px;
}

.routeCard__legendDot {
  width: 10px;
  height: 10px;
  border-radius: 50%;

  &--start {
    background: var(--orange);
    box-shadow: 0 0 0 4px rgba(255, 106, 0, 0.14);
  }

  &--end {
    background: var(--green);
    box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.14);
  }
}

.routeCard__info {
  border-radius: 20px;
  border: 1px solid var(--stroke);
  background: rgba(0, 0, 0, 0.2);
  padding: 12px;
}

.routeCard__infoRow {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;

  & + & {
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }

  &--highlight {
    .routeCard__infoValue--time {
      color: var(--orange);
    }
  }
}

.routeCard__infoLabel {
  color: var(--muted);
  font-weight: 750;
  font-size: 12px;
}

.routeCard__infoValue {
  font-weight: 950;
}

.routeCard__actions {
  margin-top: 12px;
}

.routeCard__btn {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px;
  border-radius: 18px;
  border: 1px solid rgba(96, 165, 250, 0.4);
  background: rgba(96, 165, 250, 0.1);
  color: var(--text);
  text-decoration: none;
  font-weight: 950;
}

.routeCard__backBtn {
  width: 100%;
  margin-top: 10px;
  padding: 12px;
  border-radius: 18px;
  border: 1px solid var(--stroke);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text);
  cursor: pointer;
  font-weight: 900;
}

/* Mapbox marker classes (you already set inline styles; these are safe defaults) */
.handyman-marker,
.job-marker {
  filter: drop-shadow(0 10px 18px rgba(0, 0, 0, 0.35));
}

/* Mobile tweaks */
@media (max-width: 420px) {
  .chat__status {
    display: none;
  }
  .chat__statusUpdateRow .status-update-btn {
    width: 30%;
    max-width: none;
    margin-right: 0 !important;
    margin-left: auto !important;
  }
}

/* Accessibility focus */
:where(button, a, input, textarea) {
  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 4px rgba(255, 106, 0, 0.16);
    border-color: rgba(255, 106, 0, 0.55);
  }
}
</style>
