<template>
  <div class="create-call-page" dir="rtl">
    <!-- Loading Screen -->
    <div v-if="isLoading && !foundHandymen.length" class="loading-screen">
      <div class="loading-screen__inner">
        <div class="loadingspinner">
          <div id="square1"></div>
          <div id="square2"></div>
          <div id="square3"></div>
          <div id="square4"></div>
          <div id="square5"></div>
        </div>

        <div class="loading-screen__copy">
          <p class="loading-text">מחפש הנדימנים בעזרת AI</p>
          <p class="loading-subtext">ממפה תחומים, מסנן לפי איכות וזמינות…</p>
        </div>

        <!-- Patience Message -->
        <Transition name="patience-message">
          <div v-if="showPatienceMessage" class="patience-message">
            <div class="patience-message__content">
              <span class="patience-message__icon">⏳</span>
              <span class="patience-message__text">{{
                patienceMessageText
              }}</span>
            </div>
          </div>
        </Transition>

        <div class="loading-screen__hint">
          <span class="hint-pill">טיפ: תמונות חדות = התאמה טובה יותר</span>
        </div>
      </div>
    </div>

    <!-- Handymen Results Screen -->
    <div v-if="foundHandymen.length > 0" class="handymen-results-screen">
      <div class="handymen-results-shell">
        <div class="handymen-results-header">
          <button
            class="handymen-results-back"
            type="button"
            @click="goBackToDashboard"
          >
            <span class="handymen-results-back__icon">←</span>
            <span>חזור לדשבורד</span>
          </button>

          <div class="handymen-results-hero">
            <div class="hero-badge">הצלחה</div>
            <h2 class="hero-title">
              נמצאו {{ foundHandymen.length }} הנדימנים שמתאימים לכל התחומים
            </h2>
            <p class="hero-subtitle">הקריאה נוצרה ומחכה לאישור של הנדימן</p>
          </div>
        </div>

        <div class="handymen-list">
          <div
            v-for="(handyman, index) in foundHandymen"
            :key="handyman._id"
            class="handyman-card"
            :style="{ animationDelay: `${index * 0.12}s` }"
          >
            <div class="handyman-card__image">
              <img
                :src="handyman.imageUrl || 'https://via.placeholder.com/80'"
                :alt="handyman.username"
              />
              <div class="handyman-card__ring"></div>
            </div>

            <div class="handyman-card__content">
              <div class="handyman-card__top">
                <h3 class="handyman-card__name">{{ handyman.username }}</h3>
                <span class="handyman-card__chip" v-if="handyman.city">
                  📍 {{ handyman.city }}
                </span>
              </div>

              <div class="handyman-card__meta">
                <div class="handyman-card__rating" v-if="handyman.rating">
                  <span class="star">⭐</span>
                  <span class="val">{{ handyman.rating.toFixed(1) }}</span>
                  <span v-if="handyman.jobDone" class="count">
                    ({{ handyman.jobDone }} עבודות)
                  </span>
                </div>

                <div class="handyman-card__cta">
                  <span class="cta-dot"></span>
                  <span>מוכן להצטרף לקריאה</span>
                </div>
              </div>
            </div>

            <div class="handyman-card__chev">›</div>
          </div>
        </div>

        <div class="handymen-results-footer">
          <div class="footer-note">
            <span class="footer-note__icon">🔒</span>
            <span>התשלום נשמר בטוח עד לסיום העבודה</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="shell">
      <!-- Top bar -->
      <header class="topbar">
        <button
          class="topbar__back"
          type="button"
          @click="goBack"
          aria-label="חזור"
        >
          ←
        </button>

        <div class="topbar__center">
          <div class="topbar__title">צור קריאה</div>
          <div class="topbar__subtitle">תהליך קצר • 4 שלבים • אישור מהיר</div>
        </div>

        <div class="topbar__glow"></div>
      </header>

      <!-- Step Indicator -->
      <div class="step-indicator">
        <div
          class="step-item"
          :class="{ active: currentStep >= 1, completed: currentStep > 1 }"
        >
          <div class="step-number">1</div>
          <div class="step-label">תיאור</div>
        </div>
        <div class="step-line" :class="{ active: currentStep > 1 }"></div>

        <div
          class="step-item"
          :class="{ active: currentStep >= 2, completed: currentStep > 2 }"
        >
          <div class="step-number">2</div>
          <div class="step-label">פרטים</div>
        </div>
        <div class="step-line" :class="{ active: currentStep > 2 }"></div>

        <div
          class="step-item"
          :class="{ active: currentStep >= 3, completed: currentStep > 3 }"
        >
          <div class="step-number">3</div>
          <div class="step-label">תמונות</div>
        </div>
        <div class="step-line" :class="{ active: currentStep > 3 }"></div>

        <div
          class="step-item"
          :class="{ active: currentStep >= 4, completed: currentStep > 4 }"
        >
          <div class="step-number">4</div>
          <div class="step-label">אשראי</div>
        </div>
      </div>

      <!-- Content -->
      <main class="content">
        <!-- STEP 1 -->
        <div
          v-if="currentStep === 1"
          class="step-content step-content--animated"
        >
          <div class="step-container">
            <section class="block block--requests">
              <div class="block__head">
                <div class="block__label">תאר בקצרה מה צריך שנעשה?</div>

                <button
                  type="button"
                  class="manual-select-btn"
                  @click="openManualCategorySelector"
                >
                  ✋ בחר ידנית
                </button>
              </div>

              <div class="field-stack">
                <div class="field-stack__input">
                  <input
                    class="input-small"
                    type="text"
                    v-model="call.requests[0]"
                    @input="clearError('requests')"
                    placeholder="למשל: תליית מדף"
                  />
                </div>

                <div v-if="errors.requests" class="msg msg--err">
                  {{ errors.requests }}
                </div>

                <div class="lux-divider">
                  <span class="lux-divider__line"></span>
                  <span class="lux-divider__txt">אפשר להוסיף עוד</span>
                  <span class="lux-divider__line"></span>
                </div>

                <!-- Additional Requests -->
                <div
                  v-for="(request, index) in call.requests.slice(1)"
                  :key="index"
                  class="additional-request"
                >
                  <input
                    class="input-small"
                    type="text"
                    v-model="call.requests[index + 1]"
                    :placeholder="`בקשה ${index + 2}`"
                  />
                  <button
                    type="button"
                    class="remove-request-btn"
                    @click="removeRequest(index + 1)"
                    aria-label="הסר בקשה"
                  >
                    ✕
                  </button>
                </div>

                <button
                  type="button"
                  class="add-request-btn"
                  @click="addRequest"
                >
                  <span class="add-request-btn__icon">➕</span>
                  <span>הוסף בקשה נוספת</span>
                </button>

                <div class="mini-trust">
                  <span class="mini-trust__dot"></span>
                  <span>נשמור את זה ברור כדי שה־AI יתאים לך הנדימן מדויק</span>
                </div>
              </div>
            </section>
          </div>

          <button
            v-if="!isLoadingLocation"
            class="next-step-btn"
            type="button"
            @click="nextStep"
          >
            <span>שלב הבא</span>
          </button>
        </div>

        <!-- STEP 2 -->
        <div
          v-if="currentStep === 2"
          class="step-content step-content--animated"
        >
          <div class="step-container">
            <!-- Loading Categories -->
            <section
              v-if="isLoadingCategories"
              class="block block--loading-categories"
            >
              <div class="loading-categories">
                <div class="loading-categories__spinner" aria-hidden="true">
                  <div class="spinner-dot"></div>
                  <div class="spinner-dot"></div>
                  <div class="spinner-dot"></div>
                </div>
                <p class="loading-categories__text">
                  מחפש את התחומים הדרושים לך באמצעות AI
                </p>
                <p class="loading-categories__subtext">
                  תוך רגע זה ננעל כמו כפפה
                </p>
              </div>
            </section>

            <!-- Found Categories - Always show if there are categories -->
            <section
              v-if="foundCategories.length > 0"
              class="block block--found-categories"
            >
              <div class="block__head">
                <div class="block__label">התחומים שנמצאו:</div>
                <button
                  type="button"
                  class="block__refine-btn"
                  @click="refineCategories"
                >
                  זה לא נכון? נסה לדייק יותר
                </button>
              </div>

              <div class="categories-list">
                <div
                  v-for="(category, index) in foundCategories"
                  :key="index"
                  class="category-card"
                  :class="{
                    'category-card--quoted': category.price === 'bid',
                  }"
                >
                  <div class="category-card__header">
                    <span class="category-card__name">
                      {{
                        category.originalText ||
                        category.subcategory ||
                        category.category ||
                        `תחום ${index + 1}`
                      }}
                    </span>

                    <span
                      v-if="category.price && category.price !== 'bid'"
                      class="category-card__price"
                    >
                      {{ category.price }} ₪
                    </span>
                    <span
                      v-else-if="category.price === 'bid'"
                      class="category-card__price category-card__price--bid"
                    >
                      הצעת מחיר
                    </span>
                  </div>

                  <div class="category-card__details">
                    <span
                      v-if="category.category"
                      class="category-card__category"
                    >
                      קטגוריה: {{ category.category }}
                    </span>
                    <span
                      v-if="category.workType"
                      class="category-card__work-type"
                    >
                      סוג: {{ category.workType }}
                    </span>
                  </div>

                  <!-- Button to open for quotation on each work card -->
                  <div class="category-card__actions">
                    <button
                      type="button"
                      class="category-card__quote-btn"
                      @click="openWorkForQuotation(index)"
                      v-if="category.price !== 'bid'"
                    >
                      פתח להצעת מחיר
                    </button>
                  </div>

                  <!-- Recommendation message for low confidence (0.6-0.7) -->
                  <div
                    v-if="category.needsRecommendation"
                    class="category-card__recommendation"
                  >
                    <div class="category-card__recommendation-content">
                      <p class="category-card__recommendation-text">
                        לגבי העבודה
                        <strong>"{{ category.originalText }}"</strong>, ייתכן
                        שהיא לא מתאימה בדיוק למה שמצאנו במערכת. כדי לוודא
                        שהעבודה תטופל נכון – אפשר לפתוח את הקריאה להצעת מחיר.
                      </p>
                      <div class="category-card__recommendation-actions">
                        <button
                          type="button"
                          class="category-card__recommendation-btn category-card__recommendation-btn--primary"
                          @click="openWorkForQuotation(index)"
                        >
                          פתח להצעת מחיר
                        </button>
                        <button
                          type="button"
                          class="category-card__recommendation-btn category-card__recommendation-btn--secondary"
                          @click="dismissRecommendation(index)"
                        >
                          המשך עם העבודה שמצאנו
                        </button>
                        <button
                          type="button"
                          class="category-card__recommendation-btn category-card__recommendation-btn--remove"
                          @click="removeWorkByIndex(index)"
                        >
                          הסר עבודה זו
                        </button>
                      </div>
                    </div>
                  </div>

                  <div class="category-card__shine" aria-hidden="true"></div>
                </div>
              </div>
            </section>

            <section class="block">
              <div class="block__head">
                <div class="block__label">הרחב להנדימן על התקלות</div>
                <div class="block__req">מומלץ</div>
              </div>

              <textarea
                class="textarea"
                v-model="call.desc"
                @input="clearError('desc')"
                rows="6"
                placeholder="תאר בפירוט את הבעיה, מה צריך לתקן, וכל מידע רלוונטי..."
              ></textarea>

              <div class="textarea-hint">
                <span class="textarea-hint__dot"></span>
                <span>מפרט טוב = הצעת מחיר מדויקת יותר</span>
              </div>

              <div v-if="errors.desc" class="msg msg--err">
                {{ errors.desc }}
              </div>
            </section>

            <section class="block block--location">
              <div class="block__head">
                <div class="block__label">מיקום</div>
                <div class="block__req">חובה</div>
              </div>

              <div class="location-content">
                <!-- Loading indicator -->
                <div v-if="isLoadingLocation" class="location-loading">
                  <div class="location-loading__spinner">
                    <div class="spinner"></div>
                  </div>
                  <p class="location-loading__text">מאתר מיקום מדויק...</p>
                  <p class="location-loading__subtext">
                    אנא המתן, זה עשוי לקחת מספר שניות
                  </p>
                </div>

                <!-- Autocomplete -->
                <div
                  v-if="
                    !selectedMapLocation &&
                    !isLoadingLocation &&
                    !detectedLocation
                  "
                  class="location-input-wrapper"
                >
                  <div class="location-headline">
                    <span class="location-headline__icon">📌</span>
                    <span class="location-headline__txt"
                      >בחר ישוב או השתמש במיקום</span
                    >
                  </div>

                  <AddressAutocomplete
                    v-model="call.location"
                    input-id="call-location"
                    :placeholder="
                      usingMyLocation ? 'המיקום שלי' : 'הכנס שם ישוב'
                    "
                    :required="!usingMyLocation && !selectedMapLocation"
                    @update:modelValue="onLocationChange"
                    @update:englishName="onEnglishNameUpdate"
                    @update:selectedCity="onCitySelected"
                  />
                </div>

                <!-- House number -->
                <div
                  v-if="
                    call.location &&
                    call.location !== 'המיקום שלי' &&
                    !selectedMapLocation &&
                    !isLoadingLocation &&
                    !detectedLocation
                  "
                  class="house-number-input"
                >
                  <input
                    type="text"
                    v-model="call.houseNumber"
                    placeholder="מספר בית\\בלוק"
                    class="input-small"
                    :class="{ 'input-small--error': errors.houseNumber }"
                  />
                  <div v-if="errors.houseNumber" class="msg msg--err">
                    {{ errors.houseNumber }}
                  </div>
                </div>

                <!-- Selected from map -->
                <div v-if="selectedMapLocation" class="selected-location">
                  <div class="selected-location__content">
                    <span class="selected-location__text">מיקום נבחר במפה</span>
                    <span class="selected-location__badge">MAP</span>
                  </div>

                  <button
                    type="button"
                    class="selected-location__change"
                    @click="
                      selectedMapLocation = null;
                      call.coordinates = {};
                    "
                  >
                    שנה
                  </button>
                </div>

                <!-- Detected location -->
                <div
                  v-if="detectedLocation && usingMyLocation"
                  class="selected-location"
                >
                  <div class="selected-location__content">
                    <span class="selected-location__text">{{
                      detectedLocation
                    }}</span>
                    <span class="selected-location__badge">GPS</span>
                  </div>

                  <button
                    type="button"
                    class="selected-location__change"
                    @click="
                      detectedLocation = null;
                      usingMyLocation = false;
                      call.location = 'המיקום שלי';
                      call.coordinates = {};
                      geoCoordinates = null;
                    "
                  >
                    שנה
                  </button>

                  <button
                    v-if="!isImprovingLocation"
                    type="button"
                    class="improve-location-btn"
                    @click="improveLocation"
                  >
                    <span class="improve-location-btn__icon">🎯</span>
                    <span class="improve-location-btn__text">
                      מיקום לא נכון? תן לנו למצוא את המיקום המדוייק
                    </span>
                  </button>

                  <div v-if="isImprovingLocation" class="location-loading">
                    <div class="location-loading__spinner">
                      <div class="spinner"></div>
                    </div>
                    <p class="location-loading__text">משפר מיקום מדויק...</p>
                    <p class="location-loading__subtext">
                      זה עשוי לקחת עד 15 שניות
                    </p>
                  </div>
                </div>

                <!-- Actions -->
                <div
                  v-if="
                    !selectedMapLocation &&
                    !detectedLocation &&
                    !isLoadingLocation
                  "
                  class="location-actions"
                >
                  <button
                    class="location-btn location-btn--map"
                    type="button"
                    @click="openMapPicker"
                  >
                    <span class="location-btn__icon">🗺️</span>
                    <span class="location-btn__text">דקור במפה</span>
                  </button>

                  <button
                    class="location-btn location-btn--gps"
                    type="button"
                    @click="setMyLocation"
                    :disabled="isLoadingLocation"
                  >
                    <span v-if="isLoadingLocation" class="location-btn__spinner"
                      >⏳</span
                    >
                    <span v-else class="location-btn__icon">📍</span>
                    <span class="location-btn__text">
                      {{
                        isLoadingLocation ? "מאתר מיקום מדויק..." : "לפי מיקום"
                      }}
                    </span>
                  </button>
                </div>
              </div>

              <div v-if="errors.location" class="msg msg--err">
                {{ errors.location }}
              </div>
            </section>
          </div>

          <div v-if="!isLoadingLocation" class="step-actions">
            <button class="back-btn" type="button" @click="prevStep">
              חזרה
            </button>

            <button class="next-step-btn" type="button" @click="nextStep">
              <span>שלב הבא</span>
            </button>
          </div>
        </div>

        <!-- STEP 3 -->
        <div
          v-if="currentStep === 3"
          class="step-content step-content--animated"
        >
          <div class="step-container">
            <section class="block">
              <div class="block__head">
                <div class="block__label">תמונות</div>
                <div class="block__req">חובה</div>
              </div>

              <div class="uploadRow">
                <input
                  :id="`callImage-${call.imageUrls.length}`"
                  type="file"
                  accept="image/*"
                  @change="handleCallImageUpload"
                  class="file-input"
                  :disabled="call.imageUrls.length >= 4 || isUploadingImage"
                />

                <label
                  :for="`callImage-${call.imageUrls.length}`"
                  class="uploadBtn"
                  :class="{
                    'uploadBtn--done': call.imageUrls.length > 0,
                    'uploadBtn--err': errors.image,
                    'uploadBtn--disabled':
                      call.imageUrls.length >= 4 || isUploadingImage,
                    'uploadBtn--loading': isUploadingImage,
                  }"
                >
                  <span
                    v-if="isUploadingImage"
                    class="uploadBtn__spinner"
                  ></span>
                  <span v-else class="uploadBtn__icon">📷</span>

                  <span class="uploadBtn__txt">
                    {{
                      isUploadingImage
                        ? "מעלה תמונה..."
                        : call.imageUrls.length === 0
                        ? "בחר תמונה"
                        : call.imageUrls.length >= 4
                        ? "הגעת למקסימום (4 תמונות)"
                        : `העלה עוד תמונה (${call.imageUrls.length}/4)`
                    }}
                  </span>
                </label>
              </div>

              <div class="upload-hint">אפשר להעלות עד 4 תמונות</div>

              <div
                v-if="
                  call.imageUrls.length > 0 || call.imagePreviews.length > 0
                "
                class="images-grid"
              >
                <div
                  v-for="(img, index) in call.imageUrls.length > 0
                    ? call.imageUrls
                    : call.imagePreviews"
                  :key="index"
                  class="image-item"
                >
                  <img
                    :src="img"
                    :alt="`תמונה ${index + 1}`"
                    class="image-item__img"
                  />
                  <button
                    type="button"
                    class="image-item__remove"
                    @click="removeCallImage(index)"
                  >
                    ✕
                  </button>
                  <div class="image-item__shade" aria-hidden="true"></div>
                </div>
              </div>

              <div v-if="errors.image" class="msg msg--err">
                {{ errors.image }}
              </div>
            </section>

            <section class="block">
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

              <div v-if="call.urgent" class="urgent-note">
                הקריאות שלך יהיו מוצגות מעל קריאות אחרות
              </div>

              <div class="urgent-trust" v-if="call.urgent">
                <span class="urgent-trust__dot"></span>
                <span>נותן עדיפות אצל הנדימנים הזמינים כרגע</span>
              </div>
            </section>

            <section class="block">
              <div class="field">
                <div class="field__label">סוג עבודה</div>
                <select class="select" v-model="call.workType">
                  <option value="קלה">קלה</option>
                  <option value="מורכבת">מורכבת</option>
                  <option value="קשה">קשה</option>
                </select>

                <div class="field-hint">
                  <span class="field-hint__dot"></span>
                  <span>זה עוזר לנו לתמחר נכון ולהתאים איש מקצוע מתאים</span>
                </div>
              </div>
            </section>

            <section class="block block--last">
              <div class="note note--warn">
                <span class="note__icon">⚠️</span>
                <span>
                  קנס על ביטול אחרי שקבלו את העבודה יכול להגיע עד:
                  <b>200</b> שקלות
                </span>
              </div>
            </section>
          </div>

          <div v-if="!isLoadingLocation" class="step-actions">
            <button class="back-btn" type="button" @click="prevStep">
              חזרה
            </button>

            <button class="next-step-btn" type="button" @click="nextStep">
              <span>שלב הבא</span>
            </button>
          </div>
        </div>

        <!-- STEP 4 -->
        <div
          v-if="currentStep === 4"
          class="step-content step-content--animated"
        >
          <div class="step-container">
            <!-- Loading payment method -->
            <div
              v-if="isLoadingPaymentMethod && paymentMethodId"
              class="saved-payment-method-wrapper"
            >
              <div class="payment-method-loading">
                <div class="loading-spinner"></div>
                <p>טוען פרטי כרטיס...</p>
              </div>
            </div>

            <!-- Saved payment method -->
            <div
              v-else-if="savedPaymentMethod && !showChangePaymentMethod"
              class="saved-payment-method-wrapper"
            >
              <div class="pay-hero">
                <div class="pay-hero__badge">תשלום מאובטח</div>
                <div class="pay-hero__title">כמעט סיימנו</div>
                <div class="pay-hero__sub">
                  הכרטיס השמור מוכן — תשלום יתבצע רק אחרי שליחת הקריאה
                </div>
              </div>

              <div class="flip-card">
                <div class="flip-card-inner">
                  <div class="flip-card-front">
                    <p class="heading_8264">
                      {{ getCardBrandName(savedPaymentMethod.card?.brand) }}
                    </p>

                    <svg
                      class="logo"
                      xmlns="http://www.w3.org/2000/svg"
                      x="0px"
                      y="0px"
                      width="36"
                      height="36"
                      viewBox="0 0 48 48"
                    >
                      <path
                        fill="#ff9800"
                        d="M32 10A14 14 0 1 0 32 38A14 14 0 1 0 32 10Z"
                      ></path>
                      <path
                        fill="#d50000"
                        d="M16 10A14 14 0 1 0 16 38A14 14 0 1 0 16 10Z"
                      ></path>
                      <path
                        fill="#ff3d00"
                        d="M18,24c0,4.755,2.376,8.95,6,11.48c3.624-2.53,6-6.725,6-11.48s-2.376-8.95-6-11.48 C20.376,15.05,18,19.245,18,24z"
                      ></path>
                    </svg>

                    <svg
                      version="1.1"
                      class="chip"
                      id="Layer_1"
                      xmlns="http://www.w3.org/2000/svg"
                      xmlns:xlink="http://www.w3.org/1999/xlink"
                      x="0px"
                      y="0px"
                      width="30px"
                      height="30px"
                      viewBox="0 0 50 50"
                      xml:space="preserve"
                    >
                      <image
                        id="image0"
                        width="50"
                        height="50"
                        x="0"
                        y="0"
                        href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAMAAAAp4XiDAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAB6VBMVEUAAACNcTiVeUKVeUOYfEaafEeUeUSYfEWZfEaykleyklaXe0SWekSZZjOYfEWYe0WXfUWXe0WcgEicfkiXe0SVekSXekSWekKYe0a9nF67m12ZfUWUeEaXfESVekOdgEmVeUWWekSniU+VeUKVeUOrjFKYfEWliE6WeESZe0GSe0WYfES7ml2Xe0WXeESUeEOWfEWcf0eWfESXe0SXfEWYekSVeUKXfEWxklawkVaZfEWWekOUekOWekSYfESZe0eXekWYfEWZe0WZe0eVeUSWeETAnmDCoWLJpmbxy4P1zoXwyoLIpWbjvXjivnjgu3bfu3beunWvkFWxkle/nmDivXiWekTnwXvkwHrCoWOuj1SXe0TEo2TDo2PlwHratnKZfEbQrWvPrWuafUfbt3PJp2agg0v0zYX0zYSfgkvKp2frxX7mwHrlv3rsxn/yzIPgvHfduXWXe0XuyIDzzISsjVO1lVm0lFitjVPzzIPqxX7duna0lVncuHTLqGjvyIHeuXXxyYGZfUayk1iyk1e2lln1zYTEomO2llrbtnOafkjFpGSbfkfZtXLhvHfkv3nqxH3mwXujhU3KqWizlFilh06khk2fgkqsjlPHpWXJp2erjVOhg0yWe0SliE+XekShhEvAn2D///+gx8TWAAAARnRSTlMACVCTtsRl7Pv7+vxkBab7pZv5+ZlL/UnU/f3SJCVe+Fx39naA9/75XSMh0/3SSkia+pil/KRj7Pr662JPkrbP7OLQ0JFOijI1MwAAAAFiS0dEorDd34wAAAAJcEhZcwAACxMAAAsTAQCanBgAAAAHdElNRQfnAg0IDx2lsiuJAAACLElEQVRIx2NkGAXkAUYmZhZWPICFmYkRVQcbOwenmzse4MbFzc6DpIGXj8PD04sA8PbhF+CFaxEU8iWkAQT8hEVgOkTF/InR4eUVICYO1SIhCRMLDAoKDvFDVhUaEhwUFAjjSUlDdMiEhcOEItzdI6OiYxA6YqODIt3dI2DcuDBZsBY5eVTr4xMSYcyk5BRUOXkFsBZFJTQnp6alQxgZmVloUkrKYC0qqmji2WE5EEZuWB6alKoKdi35YQUQRkFYPpFaCouKIYzi6EDitJSUlsGY5RWVRGjJLyxNy4ZxqtIqqvOxaVELQwZFZdkIJVU1RSiSalAt6rUwUBdWG1CP6pT6gNqwOrgCdQyHNYR5YQFhDXj8MiK1IAeyN6aORiyBjByVTc0FqBoKWpqwRCVSgilOaY2OaUPw29qjOzqLvTAchpos47u6EZyYnngUSRwpuTe6D+6qaFQdOPNLRzOM1dzhRZyW+CZouHk3dWLXglFcFIflQhj9YWjJGlZcaKAVSvjyPrRQ0oQVKDAQHlYFYUwIm4gqExGmBSkutaVQJeomwViTJqPK6OhCy2Q9sQBk8cY0DxjTJw0lAQWK6cOKfgNhpKK7ZMpUeF3jPa28BCETamiEqJKM+X1gxvWXpoUjVIVPnwErw71nmpgiqiQGBjNzbgs3j1nus+fMndc+Cwm0T52/oNR9lsdCS24ra7Tq1cbWjpXV3sHRCb1idXZ0sGdltXNxRateRwHRAACYHutzk/2I5QAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyMy0wMi0xM1QwODoxNToyOSswMDowMEUnN7UAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjMtMDItMTNUMDg6MTU6MjkrMDA6MDA0eo8JAAAAKHRFWHRkYXRlOnRpbWVzdGFtcAAyMDIzLTAyLTEzVDA4OjE1OjI5KzAwOjAwY2+u1gAAAABJRU5ErkJggg=="
                      ></image>
                    </svg>

                    <svg
                      version="1.1"
                      class="contactless"
                      id="Layer_1"
                      xmlns="http://www.w3.org/2000/svg"
                      xmlns:xlink="http://www.w3.org/1999/xlink"
                      x="0px"
                      y="0px"
                      width="20px"
                      height="20px"
                      viewBox="0 0 50 50"
                      xml:space="preserve"
                    >
                      <image
                        id="image0"
                        width="50"
                        height="50"
                        x="0"
                        y="0"
                        href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAQAAAC0NkA6AAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAAmJLR0QA/4ePzL8AAAAJcEhZcwAACxMAAAsTAQCanBgAAAAHdElNRQfnAg0IEzgIwaKTAAADDklEQVRYw+1XS0iUURQ+f5qPyjQflGRFEEFK76koKGxRbWyVVLSOgsCgwjZBJJYuKogSIoOonUK4q3U0WVBWFPZYiIE6kuArG3VGzK/FfPeMM/MLt99/NuHdfPd888/57jn3nvsQWWj/VcMlvMMd5KRTogqx9iCdIjUUmcGR9ImUYowyP3xNGQJoRLVaZ2DaZf8kyjEJALhI28ELioyiwC+Rc3QZwRYyO/DH51hQgWm6DMIh10KmD4u9O16K49itVoPOAmcGAWWOepXIRScAoJZ2Frro8oN+EyTT6lWkkg6msZfMSR35QTJmjU0g15tIGSJ08ZZMJkJkHpNZgSkyXosS13TkJpZ62mPIJvOSzC1bp8vRhhCakEk7G9/o4gmZdbpsTcKu0m63FbnBP9Qrc15zbkbemfgNDtEOI8NO5L5O9VYyRYgmJayZ9nPaxZrSjW4+F6Uw9yQqIiIZwhp2huQTf6OIvCZyGM6gDJBZbyXifJXr7FZjGXsdxADxI7HUJFB6iWvsIhFpkoiIiGTJfjJfiCuJg2ZEspq9EHGVpYgzKqwJqSAOEwuJQ/pxPvE3cYltJCLdxBLiSKKIE5HxJKcTRNeadxfhDiuYw44zVs1dxKwRk/uCxIiQkxKBsSctRVAge9g1E15EHE6yRUaJecRxcWlukdRIbGFOSZCMWQA/iWauIP3slREHXPyliqBcrrD71AmzZ+rD1Mt2Yr8TZc/UR4/YtFnbijnHi3UrN9vKQ9rPaJf867ZiaqDB+czeKYmd3pNa6fuI75MiC0uXXSR5aEMf7s7a6r/PudVXkjFb/SsrCRfROk0Fx6+H1i9kkTGn/E1vEmt1m089fh+RKdQ5O+xNJPUicUIjO0Dm7HwvErEr0YxeibL1StSh37STafE4I7zcBdRq1DiOkdmlTJVnkQTBTS7X1FYyvfO4piaInKbDCDaT2anLudYXCRFsQBgAcIF2/Okwgvz5+Z4tsw118dzruvIvjhTB+HOuWy8UvovEH6beitBKxDyxm9MmISKCWrzB7bSlaqGlsf0FC0gMjzTg6GgAAAAldEVYdGRhdGU6Y3JlYXRlADIwMjMtMDItMTNUMDg6MTk6NTYrMDA6MDCjlq7LAAAAJXRFWHRkYXRlOm1vZGlmeQAyMDIzLTAyLTEzVDA4OjE5OjU2KzAwOjAw0ssWdwAAACh0RVh0ZGF0ZTp0aW1lc3RhbXAAMjAyMy0wMi0xM1QwODoxOTo1NiswMDowMIXeN6gAAAAASUVORK5CYII="
                      ></image>
                    </svg>

                    <p class="number">
                      {{ savedPaymentMethod.card?.last4 || "****" }} **** ****
                      ****
                    </p>

                    <p class="valid_thru">VALID THRU</p>
                    <p class="date_8264">
                      {{
                        formatExpiryDate(
                          savedPaymentMethod.card?.expMonth,
                          savedPaymentMethod.card?.expYear
                        )
                      }}
                    </p>

                    <p class="name">
                      {{ store?.user?.username?.toUpperCase() || "CARDHOLDER" }}
                    </p>

                    <div class="card-shine" aria-hidden="true"></div>
                  </div>

                  <div class="flip-card-back">
                    <div class="strip"></div>
                    <div class="mstrip"></div>
                    <div class="sstrip">
                      <p class="code">***</p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="payment-method-actions">
                <button
                  class="btn btn--secondary"
                  type="button"
                  @click="changePaymentMethod"
                >
                  שנה אמצעי תשלום
                </button>
              </div>
            </div>

            <!-- Credit Card Form -->
            <CreditCardForm
              v-if="!savedPaymentMethod || showChangePaymentMethod"
              ref="creditCardForm"
              v-model="creditCard"
              :errors="errors"
              :amount="totalPrice"
              currency="ils"
              @update:errors="errors = $event"
              @payment-method-created="onPaymentMethodCreated"
              @validation-changed="onCreditCardValidationChanged"
            />
          </div>

          <div class="step-actions">
            <button class="back-btn" type="button" @click="prevStep">
              חזרה
            </button>

            <button
              class="submit-btn"
              type="button"
              @click="onSubmitCall"
              :disabled="
                isProcessingPayment || (!paymentMethodId && !isCreditCardValid)
              "
            >
              <span v-if="isProcessingPayment">מעבד תשלום...</span>
              <span v-else>שלח קריאה</span>
            </button>
          </div>
        </div>
      </main>
    </div>

    <!-- Map Picker Modal -->
    <div v-if="showMapPicker" class="map-modal" @click.self="closeMapPicker">
      <div class="map-modal__content">
        <div class="map-modal__header">
          <h3>בחר מיקום במפה</h3>
          <button
            class="map-modal__close"
            @click="closeMapPicker"
            aria-label="סגור"
          >
            ×
          </button>
        </div>

        <div class="map-modal__map" id="mapPicker"></div>

        <div class="map-modal__footer">
          <button
            class="map-modal__btn map-modal__btn--cancel"
            @click="closeMapPicker"
          >
            ביטול
          </button>
          <button
            class="map-modal__btn map-modal__btn--confirm"
            @click="confirmMapLocation"
          >
            אישור
          </button>
        </div>
      </div>
    </div>

    <!-- Split Call Modal -->
    <div
      v-if="showSplitCallModal"
      class="modal-overlay"
      @click.self="showSplitCallModal = false"
    >
      <div class="modal-content">
        <div class="modal-header">
          <h3>אין הנדימן אחד שמתמחה במה שאמרת</h3>
          <button
            class="modal-close"
            @click="showSplitCallModal = false"
            aria-label="סגור"
          >
            ×
          </button>
        </div>

        <div class="modal-body">
          <p>אין הנדימן אחד שמתמחה במה שאמרת.</p>
          <p>תרצה לפצל את העבודה?</p>
        </div>

        <div class="modal-footer">
          <button class="btn btn--secondary" @click="handleCancelSplit">
            אני אוותר
          </button>
          <button class="btn btn--primary" @click="handleSplitCall">
            כן פצל
          </button>
        </div>
      </div>
    </div>

    <!-- Manual Category Selector Modal -->
    <div
      v-if="showManualCategorySelector"
      class="modal-overlay"
      @click.self="showManualCategorySelector = false"
    >
      <div class="modal-content modal-content--large">
        <div class="modal-header">
          <h3>בחר תת-קטגוריות ידנית</h3>
          <button
            class="modal-close"
            @click="showManualCategorySelector = false"
            aria-label="סגור"
          >
            ×
          </button>
        </div>

        <div class="modal-body modal-body--scrollable">
          <div
            v-for="category in allCategories"
            :key="category.name"
            class="category-section"
          >
            <h4 class="category-section__title">{{ category.name }}</h4>

            <div class="subcategories-grid">
              <label
                v-for="subcategory in category.subcategories || []"
                :key="subcategory.name"
                class="subcategory-checkbox-label"
              >
                <input
                  type="checkbox"
                  class="subcategory-checkbox"
                  :checked="
                    isSubcategorySelected(category.name, subcategory.name)
                  "
                  @change="toggleSubcategory(category.name, subcategory)"
                />

                <div class="subcategory-info">
                  <span class="subcategory-name">{{ subcategory.name }}</span>
                  <span v-if="subcategory.price" class="subcategory-price">
                    {{ subcategory.price }} ₪
                  </span>
                </div>

                <span class="subcat-pill" v-if="subcategory.workType">
                  {{ subcategory.workType }}
                </span>
              </label>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button
            class="btn btn--secondary"
            @click="showManualCategorySelector = false"
          >
            ביטול
          </button>
          <button class="btn btn--primary" @click="confirmManualSelection">
            אישור
          </button>
        </div>
      </div>
    </div>

    <!-- Partial Match Modal -->
    <div
      v-if="showPartialMatchModal"
      class="modal-overlay"
      @click.self="showPartialMatchModal = false"
    >
      <div class="modal-content">
        <div class="modal-header">
          <h3>לא מצאנו בשבילך הנדימן אחד לתחומים שרצית נסה שוב מאוחר יותר</h3>
          <button
            class="modal-close"
            @click="showPartialMatchModal = false"
            aria-label="סגור"
          >
            ×
          </button>
        </div>

        <div class="modal-body">
          <p style="margin-bottom: 16px">יש הנדימנים אך לא לתחומים שביקשת</p>

          <div class="matched-subcategories-list">
            <p
              v-for="(subcat, index) in partialMatchData.matchedSubcategories"
              :key="index"
              class="subcategory-item"
            >
              <span v-if="index === 0">מצאנו הנדימן לתחום: </span>
              <span v-else>והנדימן לתחום: </span>

              <strong class="subcategory-name-badge">
                {{ getSubcategoryName(subcat) }}
              </strong>
            </p>
          </div>

          <p style="margin-top: 20px; font-weight: 600">
            האם תרצה לפצל את הקריאה?
          </p>
        </div>

        <div class="modal-footer">
          <button
            class="btn btn--secondary"
            @click="showPartialMatchModal = false"
          >
            ביטול
          </button>
          <button class="btn btn--primary" @click="handlePartialMatchApprove">
            כן, פצל
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AddressAutocomplete from "@/components/Global/AddressAutocomplete.vue";
import CreditCardForm from "@/components/CreateCall/CreditCardForm.vue";
import { URL } from "@/Url/url";
import axios from "axios";
import { useToast } from "@/composables/useToast";
import { useMainStore } from "@/store/index";
import { getCurrentLocation } from "@/utils/geolocation";
import citiesData from "@/APIS/AdressFromIsrael.json";
import { loadCategories } from "@/utils/categoriesLoader";
import logger from "@/utils/logger";
import { loadStripe as loadStripeElements } from "@stripe/stripe-js";
import { io } from "socket.io-client";

export default {
  name: "CreateCall",
  components: {
    AddressAutocomplete,
    CreditCardForm,
  },

  setup() {
    const store = useMainStore();
    return { store };
  },
  data() {
    return {
      toast: null,
      currentStep: 1,
      isLoading: false,
      isLoadingLocation: false,
      isImprovingLocation: false, // האם משפרים את המיקום
      detectedLocation: null, // הכתובת שנמצאה מ-reverse geocoding
      call: {
        requests: [""], // Array of requests
        desc: "",
        location: "המיקום שלי",
        urgent: false,
        images: [], // Array of image files
        imageUrls: [], // Array of uploaded image URLs
        imagePreviews: [], // Array of preview URLs
        coordinates: {},
        workType: "קלה",
      },
      geoCoordinates: null,
      usingMyLocation: false,
      errors: {},
      cities: [],
      locationEnglishName: null,
      selectedCity: null,
      showMapPicker: false,
      mapPicker: null,
      foundHandymen: [],
      showSplitCallModal: false,
      showPartialMatchModal: false,
      partialMatchData: {
        handymen: [],
        matchedSubcategories: [],
        allSubcategories: [],
      },
      splitNeededData: {
        handymen: [],
      },
      mapMarker: null,
      selectedMapLocation: null,
      showPatienceMessage: false,
      patienceMessageInterval: null,
      patienceMessageTimeout: null,
      requestStartTime: null,
      patienceMessageText: "אנחנו מצטערים אך הסבלנות תשתלם",
      isLoadingCategories: false,
      foundCategories: [],
      subcategoryInfoArray: [],
      showManualCategorySelector: false,
      allCategories: [],
      manuallySelectedSubcategories: [],
      aiMatchResult: null, // Store AI matching result with confidence
      showQuotationChoiceModal: false, // Modal for choosing between fixed price and quotation
      creditCard: {
        cardNumber: "",
        cardName: "",
        expiryDate: "",
        cvv: "",
      },
      isUploadingImage: false,
      isProcessingPayment: false,
      paymentMethodId: null, // Store payment method ID (token) instead of card details
      isCreditCardValid: false, // Track credit card validation status
      savedPaymentMethod: null, // Saved payment method from DB
      showChangePaymentMethod: false, // Show option to change payment method
      _checkingPaymentMethod: false, // Flag to prevent multiple simultaneous calls
      socket: null, // WebSocket connection for payment method details
      isLoadingPaymentMethod: false, // Loading state for payment method details
    };
  },
  computed: {
    totalPrice() {
      // Calculate total price from all subcategories
      // If any subcategory has price="bid", return 0 (no payment needed for quoted jobs)
      let total = 0;
      if (
        this.subcategoryInfoArray &&
        Array.isArray(this.subcategoryInfoArray)
      ) {
        // Check if any subcategory is quoted
        const hasQuotedSubcategory = this.subcategoryInfoArray.some(
          (subcat) => subcat.price === "bid" || subcat.price === "quoted"
        );
        if (hasQuotedSubcategory) {
          return 0; // No payment for quoted jobs
        }

        total = this.subcategoryInfoArray.reduce((sum, subcat) => {
          const price = subcat?.price || 0;
          return (
            sum + (typeof price === "number" ? price : parseFloat(price) || 0)
          );
        }, 0);
      }
      // Add urgent fee (10 ILS) if urgent is selected
      if (this.call.urgent) {
        total += 10;
      }
      return total;
    },
  },
  async created() {
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

    // Stripe is now handled by CreditCardForm component
  },
  watch: {
    "store.user": {
      handler(newUser) {
        if (newUser && this.currentStep === 4) {
          // Prevent multiple calls
          if (this._checkingPaymentMethod) {
            return;
          }
          this._checkingPaymentMethod = true;
          // User data loaded, check for saved payment method
          this.$nextTick(() => {
            this.checkSavedPaymentMethod().finally(() => {
              this._checkingPaymentMethod = false;
            });
          });
        }
      },
      immediate: false,
    },
    currentStep(newStep) {
      // When step changes to 4, check for saved payment method
      if (newStep === 4) {
        // Prevent multiple calls
        if (this._checkingPaymentMethod) {
          return;
        }
        this._checkingPaymentMethod = true;
        this.$nextTick(() => {
          setTimeout(() => {
            this.checkSavedPaymentMethod().finally(() => {
              this._checkingPaymentMethod = false;
            });
          }, 300);
        });
      }
    },
  },
  methods: {
    async getCurrentLocation() {
      return await getCurrentLocation();
    },
    addRequest() {
      this.call.requests.push("");
    },
    removeRequest(index) {
      if (this.call.requests.length > 1) {
        this.call.requests.splice(index, 1);
      }
    },
    async nextStep() {
      // Validate current step
      if (this.currentStep === 1) {
        const hasValidRequest = this.call.requests.some(
          (req) => req && req.trim().length > 0
        );
        if (!hasValidRequest) {
          this.errors.requests = "יש למלא לפחות בקשה אחת";
          this.toast?.showError("יש למלא לפחות בקשה אחת");
          return;
        }
        this.clearError("requests");

        // Move to step 2 immediately only if no manual selection
        if (this.manuallySelectedSubcategories.length === 0) {
          this.currentStep = 2;
          // Start loading and call AI endpoint in background
          this.isLoadingCategories = true;
          this.fetchCategoriesFromAI();
        } else {
          // Manual selection was used, skip AI
          this.currentStep = 2;
          this.foundCategories = this.manuallySelectedSubcategories;
          this.subcategoryInfoArray = this.manuallySelectedSubcategories;
          this.isLoadingCategories = false;
        }

        return; // Don't continue to the rest of the function
      } else if (this.currentStep === 2) {
        if (!this.call.desc || this.call.desc.trim().length < 10) {
          this.errors.desc = "התיאור חייב להכיל לפחות 10 תווים";
          this.toast?.showError("התיאור חייב להכיל לפחות 10 תווים");
          return;
        }
        if (!this.call.location || this.call.location.trim().length === 0) {
          this.errors.location = "יש למלא מיקום";
          this.toast?.showError("יש למלא מיקום");
          return;
        }
        // Skip city validation if location was selected from map or using my location
        if (
          !this.selectedMapLocation &&
          !this.usingMyLocation &&
          !this.detectedLocation &&
          this.call.location !== "המיקום שלי" &&
          !this.isValidCity(this.call.location)
        ) {
          this.errors.location =
            "ישוב זה לא נמצא במאגר. בחר ישוב מהרשימה או לחץ על 'לפי מיקום'";
          this.toast?.showError(this.errors.location);
          return;
        }

        // Validate house number if using manual location input (not "לפי מיקום" or map)
        if (
          !this.selectedMapLocation &&
          !this.usingMyLocation &&
          !this.detectedLocation &&
          this.call.location !== "המיקום שלי" &&
          (!this.call.houseNumber || this.call.houseNumber.trim().length === 0)
        ) {
          this.errors.houseNumber = "יש למלא מספר בית/בלוק";
          this.toast?.showError("יש למלא מספר בית/בלוק");
          return;
        }

        this.clearError("desc");
        this.clearError("location");
        this.clearError("houseNumber");
      } else if (this.currentStep === 3) {
        // Validate images
        if (
          this.call.imageUrls.length === 0 &&
          this.call.imagePreviews.length === 0 &&
          this.call.images.length === 0
        ) {
          this.errors.image = "יש להעלות לפחות תמונה אחת";
          this.toast?.showError("יש להעלות לפחות תמונה אחת");
          return;
        }
        this.clearError("image");
      } else if (this.currentStep === 4) {
        // Credit card validation is handled by CreditCardForm component
        // We'll validate when submitting the form
      }

      if (this.currentStep < 4) {
        this.currentStep++;

        // When moving to step 4, check if user has saved payment method
        if (this.currentStep === 4) {
          // Prevent multiple calls
          if (this._checkingPaymentMethod) {
            return;
          }
          this._checkingPaymentMethod = true;
          // Wait a bit for store to be ready, then check
          await this.$nextTick();
          // Try multiple times if user is not loaded yet
          let attempts = 0;
          while (attempts < 10 && !this.store?.user) {
            await new Promise((resolve) => setTimeout(resolve, 200));
            attempts++;
          }
          // Always try to check payment method, even if user is not in store
          // (we can get userId from route params)
          try {
            await this.checkSavedPaymentMethod();
          } finally {
            this._checkingPaymentMethod = false;
          }
        }
      }
    },
    prevStep() {
      if (this.currentStep > 1) {
        this.currentStep--;
      }
    },
    async openManualCategorySelector() {
      // Load categories if not already loaded
      if (this.allCategories.length === 0) {
        try {
          const data = await loadCategories();
          this.allCategories = data.categories || [];
        } catch (error) {
          this.toast?.showError(" לא הצלחנו לטעון את הקטגוריות");
          return;
        }
      }
      this.showManualCategorySelector = true;
    },
    isSubcategorySelected(categoryName, subcategoryName) {
      return this.manuallySelectedSubcategories.some(
        (sub) =>
          sub.category === categoryName && sub.subcategory === subcategoryName
      );
    },
    toggleSubcategory(categoryName, subcategory) {
      const index = this.manuallySelectedSubcategories.findIndex(
        (sub) =>
          sub.category === categoryName && sub.subcategory === subcategory.name
      );

      if (index >= 0) {
        // Remove if already selected
        this.manuallySelectedSubcategories.splice(index, 1);
      } else {
        // Add if not selected
        this.manuallySelectedSubcategories.push({
          category: categoryName,
          subcategory: subcategory.name,
          price: subcategory.price || null,
          workType: subcategory.workType || null,
        });
      }
    },
    confirmManualSelection() {
      if (this.manuallySelectedSubcategories.length === 0) {
        this.toast?.showError("אנא בחר לפחות תת-קטגוריה אחת");
        return;
      }
      this.showManualCategorySelector = false;
      // Move to step 2
      this.currentStep = 2;
      this.foundCategories = this.manuallySelectedSubcategories;
      this.subcategoryInfoArray = this.manuallySelectedSubcategories;
      this.isLoadingCategories = false;
      this.toast?.showSuccess(
        `נבחרו ${this.manuallySelectedSubcategories.length} תת-קטגוריות`
      );
    },
    async checkSavedPaymentMethod() {
      try {
        // Try to get userId from multiple sources
        let userId = this.store?.user?._id || this.store?.user?.id;

        // If not in store, try to get from route params (like Dashboard does)
        if (!userId && this.$route?.params?.id) {
          userId = this.$route.params.id;
          // Load user data if not already loaded
          if (!this.store?.user && userId) {
            try {
              await this.store.fetchDashboardData(userId);
              userId = this.store?.user?._id || this.store?.user?.id || userId;
            } catch (error) {}
          }
        }

        if (!userId) {
          this.showChangePaymentMethod = false;
          this.savedPaymentMethod = null;
          return;
        }

        // Import URL dynamically
        const { URL } = await import("@/Url/url");
        const apiUrl = `${URL}/api/users/${userId}/payment-method`;

        try {
          const response = await axios.get(apiUrl, {
            timeout: 15000, // 15 second timeout
          });

          if (response.data && response.data.success) {
            if (response.data.hasPaymentMethod) {
              this.paymentMethodId = response.data.paymentMethodId;
              // Use saved payment method automatically, don't show form
              this.showChangePaymentMethod = false;
              this.isCreditCardValid = true; // Mark as valid since we have saved payment method

              // If we have paymentMethodId, fetch card details via WebSocket
              if (this.paymentMethodId) {
                this.isLoadingPaymentMethod = true;
                await this.fetchPaymentMethodDetailsViaWebSocket(
                  userId,
                  this.paymentMethodId
                );
              } else {
                // Fallback to response data if no paymentMethodId
                this.savedPaymentMethod = response.data;
              }
            } else {
              // No saved payment method, show form to create one
              this.showChangePaymentMethod = false;
              this.savedPaymentMethod = null;
            }
          } else {
            this.savedPaymentMethod = null;
            this.showChangePaymentMethod = false;
          }
        } catch (axiosError) {
          // Handle axios errors specifically
          if (
            axiosError.code === "ECONNREFUSED" ||
            axiosError.code === "ERR_CONNECTION_REFUSED" ||
            axiosError.code === "ECONNABORTED"
          ) {
            this.toast?.showError(" לא הצלחנו להתחבר לשרת. אנא ודא שהשרת רץ.");
          } else if (axiosError.response) {
            // Server responded with error status
            if (axiosError.response.status === 404) {
              this.toast?.showError("השרת לא מצא את המשתמש. אנא נסה שוב.");
            } else if (axiosError.response.status === 500) {
              this.toast?.showError("יש בעיה בשרת. אנא נסה שוב מאוחר יותר.");
            }
          } else if (axiosError.code === "ECONNABORTED") {
            this.toast?.showError("הבקשה לשרת ארכה זמן רב מדי. אנא נסה שוב.");
          }
          // Error checking payment method, show form anyway
          this.showChangePaymentMethod = false;
          this.savedPaymentMethod = null;
        }
      } catch (error) {
        // Error checking payment method, show form anyway
        this.showChangePaymentMethod = false;
        this.savedPaymentMethod = null;
      }
    },
    async fetchPaymentMethodDetailsViaWebSocket(userId, paymentMethodId) {
      return new Promise((resolve, reject) => {
        // Initialize socket if not already initialized
        if (!this.socket) {
          this.socket = io(URL, { transports: ["websocket", "polling"] });
        }

        // Set timeout for the request
        const timeout = setTimeout(() => {
          this.isLoadingPaymentMethod = false;
          // Fallback to default card details if timeout
          this.savedPaymentMethod = {
            paymentMethodId: paymentMethodId,
            card: {
              brand: "card",
              last4: "****",
              expMonth: null,
              expYear: null,
            },
          };
          reject(new Error("Timeout waiting for payment method details"));
        }, 10000); // 10 second timeout

        // Listen for payment method details response
        const responseHandler = (data) => {
          if (data.success && data.paymentMethodId === paymentMethodId) {
            clearTimeout(timeout);
            this.socket.off("payment-method-details", responseHandler);
            this.isLoadingPaymentMethod = false;
            this.savedPaymentMethod = {
              paymentMethodId: data.paymentMethodId,
              card: {
                brand: data.card?.brand || "card",
                last4: data.card?.last4 || "****",
                expMonth: data.card?.expMonth || data.card?.exp_month || null,
                expYear: data.card?.expYear || data.card?.exp_year || null,
              },
            };
            resolve(data);
          }
        };

        this.socket.on("payment-method-details", responseHandler);

        // Emit request for payment method details
        this.socket.emit("get-payment-method-details", {
          userId: userId,
          paymentMethodId: paymentMethodId,
        });
      });
    },
    async savePaymentMethodToDB(paymentMethodId) {
      try {
        const userId = this.store?.user?._id || this.store?.user?.id;
        if (!userId || !paymentMethodId) {
          return;
        }

        const { URL } = await import("@/Url/url");
        const response = await axios.post(
          `${URL}/api/users/${userId}/payment-method`,
          { paymentMethodId }
        );

        if (response.data && response.data.success) {
          this.savedPaymentMethod = response.data;
        }
      } catch (error) {
        // Error saving payment method, but continue anyway
      }
    },
    onPaymentMethodCreated(paymentMethodId) {
      this.paymentMethodId = paymentMethodId;
      // Save payment method to DB
      this.savePaymentMethodToDB(paymentMethodId);
    },
    onCreditCardValidationChanged(isValid) {
      this.isCreditCardValid = isValid;
    },
    changePaymentMethod() {
      // Show form to change payment method
      this.showChangePaymentMethod = true;
      // Keep savedPaymentMethod and paymentMethodId so user can go back
    },
    getCardBrandName(brand) {
      if (!brand) return "CARD";
      const brandMap = {
        visa: "VISA",
        mastercard: "MASTERCARD",
        amex: "AMEX",
        discover: "DISCOVER",
        diners: "DINERS",
        jcb: "JCB",
        unionpay: "UNIONPAY",
      };
      return brandMap[brand.toLowerCase()] || brand.toUpperCase();
    },
    formatExpiryDate(month, year) {
      if (!month || !year) return "** / **";
      const formattedMonth = String(month).padStart(2, "0");
      const formattedYear = String(year).slice(-2);
      return `${formattedMonth} / ${formattedYear}`;
    },
    async processPayment(jobId) {
      if (!this.stripe) {
        this.isLoading = false;
        this.toast?.showError("מערכת התשלומים לא נטענה. אנא רענן את הדף.");
        return;
      }

      this.isProcessingPayment = true;

      try {
        // Step 1: Create Payment Intent on server
        const createIntentResponse = await fetch(
          `${URL}/api/payments/create-intent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              jobId: jobId,
            }),
          }
        );

        const intentData = await createIntentResponse.json();

        if (!intentData.success || !intentData.clientSecret) {
          this.isLoading = false;
          this.isProcessingPayment = false;
          this.toast?.showError(
            intentData.message || " לא הצלחנו ליצור כוונת תשלום. אנא נסה שוב."
          );
          return;
        }

        // Step 2: Create payment method
        const cardNumberDigits = this.creditCard.cardNumber.replace(/\s/g, "");
        const [month, year] = this.creditCard.expiryDate.split("/");

        const { error: pmError, paymentMethod } =
          await this.stripe.createPaymentMethod({
            type: "card",
            card: {
              number: cardNumberDigits,
              exp_month: parseInt(month),
              exp_year: parseInt("20" + year),
              cvc: this.creditCard.cvv,
            },
            billing_details: {
              name: this.creditCard.cardName,
            },
          });

        if (pmError || !paymentMethod) {
          this.isLoading = false;
          this.isProcessingPayment = false;
          this.toast?.showError(
            pmError?.message || " לא הצלחנו ליצור אמצעי תשלום. אנא נסה שוב."
          );
          return;
        }

        // Step 3: Confirm payment with Stripe.js
        const { error, paymentIntent } = await this.stripe.confirmCardPayment(
          intentData.clientSecret,
          {
            payment_method: paymentMethod.id,
          }
        );

        if (error) {
          this.isLoading = false;
          this.isProcessingPayment = false;
          this.toast?.showError(
            error.message || " לא הצלחנו לאשר את התשלום. אנא נסה שוב."
          );
          return;
        }

        // Step 4: Update server with payment confirmation
        if (paymentIntent && paymentIntent.status === "requires_capture") {
          const confirmResponse = await fetch(`${URL}/api/payments/confirm`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              jobId: jobId,
              paymentIntentId: paymentIntent.id,
              stripeStatus: paymentIntent.status,
            }),
          });

          const confirmData = await confirmResponse.json();

          if (confirmData.success) {
            this.isLoading = false;
            this.isProcessingPayment = false;
            this.toast?.showSuccess(
              `נמצאו ${this.foundHandymen.length} הנדימנים מתאימים. התשלום אושר בהצלחה! הכסף יועבר לאחר אישור סיום העבודה.`
            );
          } else {
            this.isLoading = false;
            this.isProcessingPayment = false;
            this.toast?.showError(
              confirmData.message ||
                "התשלום אושר אך יש בעיה בעדכון השרת. אנא פנה לתמיכה."
            );
          }
        } else {
          this.isLoading = false;
          this.isProcessingPayment = false;
          this.toast?.showError("מצב תשלום לא צפוי. אנא פנה לתמיכה.");
        }
      } catch (error) {
        this.isLoading = false;
        this.isProcessingPayment = false;
        this.toast?.showError(" לא הצלחנו לעבד את התשלום. אנא נסה שוב.");
      }
    },
    async setMyLocation() {
      this.clearError("location");
      this.usingMyLocation = true;
      this.locationEnglishName = null;
      this.detectedLocation = null;

      // Show loading state for location
      this.isLoadingLocation = true;

      try {
        // Get improved location with duration for better accuracy (5 seconds)
        const { getImprovedLocation } = await import("@/utils/geolocation");
        const improvedLocation = await getImprovedLocation(5000); // 5 seconds for good accuracy

        if (
          !improvedLocation ||
          !improvedLocation.lat ||
          !improvedLocation.lon
        ) {
          throw new Error("לא הצלחנו לקבל מיקום מדויק");
        }

        this.geoCoordinates = {
          lat: improvedLocation.lat,
          lon: improvedLocation.lon,
        };
        this.call.coordinates = {
          lat: improvedLocation.lat,
          lng: improvedLocation.lon,
        };

        // Log the coordinates we're using

        // Now do reverse geocoding to get the address
        try {
          const response = await axios.get(`${URL}/reverse-geocode`, {
            params: {
              lat: improvedLocation.lat,
              lng: improvedLocation.lon,
            },
          });

          if (response.data && response.data.success) {
            // Use fullAddress if available, otherwise use address or city
            let address =
              response.data.fullAddress ||
              response.data.address ||
              response.data.city ||
              null;
            const city = response.data.city || null;
            const streetNumber = response.data.streetNumber || null;
            const streetName = response.data.streetName || null;

            if (address) {
              // Clean the address - remove Plus Code patterns if present
              let cleanedAddress = address;
              cleanedAddress = cleanedAddress
                .replace(/\s*[A-Z0-9]+\+[A-Z0-9]+\s*/g, "")
                .trim();

              this.detectedLocation = cleanedAddress;
              this.call.location = cleanedAddress;
              this.locationEnglishName = city || null;
              this.clearError("location"); // Clear any validation errors

              // If we have street number separately, we can optionally show it
              // But for now, we'll use the full address from the API
            } else {
              this.detectedLocation = "מיקום שנמצא";
              this.call.location = "מיקום שנמצא";
              this.clearError("location"); // Clear any validation errors
            }
          } else {
            this.detectedLocation = "מיקום שנמצא";
            this.call.location = "מיקום שנמצא";
            this.clearError("location"); // Clear any validation errors
          }
        } catch (geocodeError) {
          logger.error("Error in reverse geocoding:", geocodeError);
          this.detectedLocation = "מיקום שנמצא";
          this.call.location = "מיקום שנמצא";
          this.clearError("location"); // Clear any validation errors
        }
      } catch (error) {
        logger.error("Error getting location:", error);
        this.toast?.showError(
          "לא הצלחנו לקבל את המיקום המדויק. אנא נסה שוב או בחר מיקום ידנית."
        );
        this.usingMyLocation = false;
        this.detectedLocation = null;
        this.call.location = "המיקום שלי";
      } finally {
        this.isLoadingLocation = false;
      }
    },
    async improveLocation() {
      // Show loading state for improving location
      this.isImprovingLocation = true;

      try {
        // Get improved location with longer duration for maximum accuracy (15 seconds)
        const { getImprovedLocation } = await import("@/utils/geolocation");
        const improvedLocation = await getImprovedLocation(15000); // 15 seconds for maximum accuracy

        if (
          !improvedLocation ||
          !improvedLocation.lat ||
          !improvedLocation.lon
        ) {
          throw new Error("לא הצלחנו לקבל מיקום מדויק יותר");
        }

        this.geoCoordinates = {
          lat: improvedLocation.lat,
          lon: improvedLocation.lon,
        };
        this.call.coordinates = {
          lat: improvedLocation.lat,
          lng: improvedLocation.lon,
        };

        // Log the coordinates we're using

        // Now do reverse geocoding to get the address
        try {
          const response = await axios.get(`${URL}/reverse-geocode`, {
            params: {
              lat: improvedLocation.lat,
              lng: improvedLocation.lon,
            },
          });

          if (response.data && response.data.success) {
            // Use fullAddress if available, otherwise use address or city
            let address =
              response.data.fullAddress ||
              response.data.address ||
              response.data.city ||
              null;
            const city = response.data.city || null;

            if (address) {
              // Clean the address - remove Plus Code patterns if present
              let cleanedAddress = address;
              cleanedAddress = cleanedAddress
                .replace(/\s*[A-Z0-9]+\+[A-Z0-9]+\s*/g, "")
                .trim();

              this.detectedLocation = cleanedAddress;
              this.call.location = cleanedAddress;
              this.locationEnglishName = city || null;
              this.clearError("location");
              this.toast?.showSuccess("מיקום עודכן בהצלחה!");
            } else {
              this.detectedLocation = "מיקום שנמצא";
              this.call.location = "מיקום שנמצא";
              this.clearError("location");
              this.toast?.showSuccess("מיקום עודכן בהצלחה!");
            }
          } else {
            this.detectedLocation = "מיקום שנמצא";
            this.call.location = "מיקום שנמצא";
            this.clearError("location");
            this.toast?.showSuccess("מיקום עודכן בהצלחה!");
          }
        } catch (geocodeError) {
          logger.error("Error in reverse geocoding:", geocodeError);
          this.detectedLocation = "מיקום שנמצא";
          this.call.location = "מיקום שנמצא";
          this.clearError("location");
          this.toast?.showSuccess("מיקום עודכן בהצלחה!");
        }
      } catch (error) {
        logger.error("Error improving location:", error);
        this.toast?.showError("לא הצלחנו לשפר את המיקום. אנא נסה שוב.");
      } finally {
        this.isImprovingLocation = false;
      }
    },
    onLocationChange(value) {
      this.clearError("location");

      if (!value || value.trim() === "" || value !== "המיקום שלי") {
        this.usingMyLocation = false;
        this.detectedLocation = null;
        this.call.coordinates = {};

        // Skip city validation if location was selected from map or using my location
        if (
          value &&
          value.trim() !== "" &&
          !this.selectedMapLocation &&
          !this.usingMyLocation &&
          !this.detectedLocation
        ) {
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
      if (this.currentStep > 1) {
        this.prevStep();
      } else {
        this.$router.go(-1);
      }
    },
    goBackToDashboard() {
      this.$router.push({
        name: "Dashboard",
        params: { id: this.$route.params.id },
      });
    },
    onToggleUrgent() {
      this.call.urgent = !this.call.urgent;
    },
    async handleCallImageUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      // Check if we've reached the limit
      if (this.call.imageUrls.length >= 4) {
        this.toast?.showError("ניתן להעלות עד 4 תמונות");
        event.target.value = "";
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        this.errors.image = "גודל התמונה חייב להיות קטן מ-5MB";
        event.target.value = "";
        return;
      }

      if (!file.type.startsWith("image/")) {
        this.errors.image = "יש להעלות קובץ תמונה בלבד";
        event.target.value = "";
        return;
      }

      this.clearError("image");
      this.isUploadingImage = true;

      // Create preview immediately
      const reader = new FileReader();
      reader.onload = (e) => {
        this.call.imagePreviews.push(e.target.result);
      };
      reader.readAsDataURL(file);

      // Add file to images array
      this.call.images.push(file);

      try {
        const formData = new FormData();
        formData.append("image", file);

        const uploadUrl = `${URL}/pick-call123`;
        const response = await axios.post(uploadUrl, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 30000,
        });

        if (response.data && response.data.imageUrl) {
          // Replace preview with actual URL
          const previewIndex = this.call.imagePreviews.length - 1;
          if (previewIndex >= 0) {
            this.call.imagePreviews.splice(previewIndex, 1);
          }
          this.call.imageUrls.push(response.data.imageUrl);
        }
      } catch (error) {
        // Remove the preview and file if upload failed
        this.call.imagePreviews.pop();
        this.call.images.pop();

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
          this.toast.showError(`לא הצלחנו להעלות את התמונה: ${errorMessage}`);
        }
      } finally {
        this.isUploadingImage = false;
      }

      // Reset input
      event.target.value = "";
    },
    removeCallImage(index) {
      // Remove from all arrays
      if (index < this.call.imageUrls.length) {
        this.call.imageUrls.splice(index, 1);
      }
      if (index < this.call.imagePreviews.length) {
        this.call.imagePreviews.splice(index, 1);
      }
      if (index < this.call.images.length) {
        this.call.images.splice(index, 1);
      }
      this.clearError("image");
    },
    clearError(field) {
      if (this.errors[field]) delete this.errors[field];
    },
    openMapPicker() {
      this.showMapPicker = true;
      this.$nextTick(() => {
        this.initMapPicker();
      });
    },
    closeMapPicker() {
      this.showMapPicker = false;
      if (this.mapPicker) {
        this.mapPicker.remove();
        this.mapPicker = null;
        this.mapMarker = null;
      }
    },
    initMapPicker() {
      const loadLeaflet = () => {
        if (typeof window.L !== "undefined") {
          this.createMap();
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
                this.createMap();
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
              this.createMap();
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
    createMap() {
      if (typeof window.L === "undefined") {
        this.toast?.showError("לא הצלחנו לטעון את המפה. נסה שוב.");
        return;
      }

      const mapContainer = document.getElementById("mapPicker");
      if (!mapContainer) {
        return;
      }

      if (this.mapPicker) {
        this.mapPicker.remove();
        this.mapPicker = null;
        this.mapMarker = null;
      }

      const defaultLat = this.geoCoordinates?.lat || 32.0853;
      const defaultLng = this.geoCoordinates?.lon || 34.7818;

      try {
        this.mapPicker = window.L.map("mapPicker", {
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
        ).addTo(this.mapPicker);

        this.mapMarker = window.L.marker([defaultLat, defaultLng], {
          draggable: true,
        }).addTo(this.mapPicker);

        this.mapMarker.on("dragend", () => {
          const position = this.mapMarker.getLatLng();
          this.selectedMapLocation = {
            lat: position.lat,
            lng: position.lng,
          };
        });

        this.mapPicker.on("click", (e) => {
          const { lat, lng } = e.latlng;
          this.mapMarker.setLatLng([lat, lng]);
          this.selectedMapLocation = { lat, lng };
        });

        this.selectedMapLocation = { lat: defaultLat, lng: defaultLng };

        setTimeout(() => {
          if (this.mapPicker) {
            this.mapPicker.invalidateSize();
          }
        }, 100);
      } catch (error) {
        this.toast?.showError(" לא הצלחנו ליצור את המפה. נסה שוב.");
      }
    },
    async confirmMapLocation() {
      if (!this.selectedMapLocation) {
        this.toast?.showError(" אנא בחר מיקום במפה");
        return;
      }

      const { lat, lng } = this.selectedMapLocation;

      try {
        const response = await axios.get(`${URL}/reverse-geocode`, {
          params: {
            lat: lat,
            lng: lng,
          },
        });

        if (response.data && response.data.success) {
          const cityName = response.data.city || response.data.address || null;

          this.call.location = cityName || "מיקום שנבחר במפה";
          this.locationEnglishName = cityName || null;
          this.call.coordinates = {
            lat: lat,
            lng: lng,
          };
          this.usingMyLocation = false;
          this.selectedMapLocation = { lat, lng };
          this.clearError("location");
        } else {
          this.call.location = "מיקום שנבחר במפה";
          this.locationEnglishName = null;
          this.call.coordinates = {
            lat: lat,
            lng: lng,
          };
          this.usingMyLocation = false;
          this.selectedMapLocation = { lat, lng };
        }

        this.closeMapPicker();
        this.toast?.showSuccess("מיקום נבחר בהצלחה");
      } catch (error) {
        this.call.location = "מיקום שנבחר במפה";
        this.call.coordinates = {
          lat: lat,
          lng: lng,
        };
        this.usingMyLocation = false;
        this.selectedMapLocation = { lat, lng };
        this.clearError("location");
        this.closeMapPicker();
        this.toast?.showSuccess("מיקום נבחר בהצלחה");
      }
    },
    async onSubmitCall() {
      this.errors = {};

      // Validate step 3
      if (
        this.call.imageUrls.length === 0 &&
        this.call.imagePreviews.length === 0 &&
        this.call.images.length === 0
      ) {
        this.errors.image = "יש להעלות לפחות תמונה אחת";
        this.toast?.showError("יש להעלות לפחות תמונה אחת");
        return;
      }

      // Show loading
      this.isLoading = true;

      try {
        // Combine location with house number if exists
        let finalLocation = this.call.location;
        if (this.call.houseNumber && this.call.houseNumber.trim()) {
          finalLocation = `${
            this.call.location
          } ${this.call.houseNumber.trim()}`;
        }

        const callData = {
          requests: this.call.requests.filter((r) => r && r.trim().length > 0),
          desc: this.call.desc,
          location: finalLocation,
          urgent: this.call.urgent,
          workType: this.call.workType,
          userId: this.$route.params.id || null,
          usingMyLocation: this.usingMyLocation,
          locationEnglishName: this.locationEnglishName || null,
          selectedCity: this.selectedCity || null,
          imageUrls:
            this.call.imageUrls.length > 0
              ? this.call.imageUrls
              : this.call.imagePreviews.length > 0
              ? this.call.imagePreviews
              : [],
        };

        // Add coordinates to callData if they exist
        if (this.selectedMapLocation) {
          callData.coordinates = {
            lng: this.selectedMapLocation.lng,
            lat: this.selectedMapLocation.lat,
          };
        } else if (this.usingMyLocation && this.call.coordinates) {
          // Use coordinates from call.coordinates (set in setMyLocation)
          if (this.call.coordinates.lat && this.call.coordinates.lng) {
            callData.coordinates = {
              lng: Number(this.call.coordinates.lng),
              lat: Number(this.call.coordinates.lat),
            };
          } else if (this.geoCoordinates) {
            // Fallback to geoCoordinates if call.coordinates is not set
            callData.coordinates = {
              lng: Number(this.geoCoordinates.lon || this.geoCoordinates.lng),
              lat: Number(this.geoCoordinates.lat),
            };
          }
        } else if (
          this.call.coordinates &&
          this.call.coordinates.lat &&
          this.call.coordinates.lng
        ) {
          // Fallback: use coordinates from call.coordinates if selectedMapLocation is not set
          callData.coordinates = {
            lng: Number(this.call.coordinates.lng),
            lat: Number(this.call.coordinates.lat),
          };
        }

        // Ensure coordinates format is correct
        if (this.usingMyLocation && callData.coordinates) {
          const lng = callData.coordinates.lng ?? callData.coordinates.lon;
          const lat = callData.coordinates.lat;
          if (lng !== undefined && lat !== undefined) {
            callData.coordinates = { lng: Number(lng), lat: Number(lat) };
          }
        } else if (!this.usingMyLocation && !this.selectedMapLocation) {
          delete callData.coordinates;
        }

        // Check if this is a quoted job (any subcategory has price="bid")
        const hasQuotedSubcategory = this.subcategoryInfoArray.some(
          (subcat) => subcat.price === "bid" || subcat.price === "quoted"
        );

        // If quoted job, use create-call-quoted endpoint
        if (hasQuotedSubcategory) {
          // Find the quoted subcategory (or first one if multiple)
          const quotedSub =
            this.subcategoryInfoArray.find(
              (sub) => sub.price === "bid" || sub.price === "quoted"
            ) || this.subcategoryInfoArray[0];

          const quotedCallData = {
            userId: this.$route.params.id || null,
            subcategory: quotedSub.subcategory,
            category: quotedSub.category || "כללי",
            desc: this.call.desc || "",
            location: finalLocation,
            imageUrl: callData.imageUrls,
            imageUrls: callData.imageUrls,
            when: this.call.when || "asap",
            urgent: this.call.urgent || false,
            coordinates: callData.coordinates,
            usingMyLocation: this.usingMyLocation,
            locationEnglishName: this.locationEnglishName || null,
            selectedCity: this.selectedCity || null,
          };

          // Start patience message interval
          this.requestStartTime = Date.now();
          this.startPatienceMessageInterval();

          try {
            const response = await axios.post(
              `${URL}/create-call-quoted`,
              quotedCallData,
              {
                headers: { "Content-Type": "application/json" },
              }
            );

            this.stopPatienceMessageInterval();

            if (response.data.success) {
              this.isLoading = false;
              this.toast?.showSuccess(
                "עבודה נוצרה במצב הצעת מחיר! ההנדימנים יוכלו להציע מחירים."
              );
              // Redirect to dashboard after short delay
              setTimeout(() => {
                this.$router.push(`/Dashboard/${this.$route.params.id}`);
              }, 2000);
            } else {
              this.isLoading = false;
              this.toast?.showError(
                response.data.message || "שגיאה ביצירת עבודה"
              );
            }
          } catch (error) {
            this.stopPatienceMessageInterval();
            this.isLoading = false;
            const errorMessage =
              error.response?.data?.message ||
              error.message ||
              "לא הצלחנו ליצור עבודה. נסה שוב מאוחר יותר.";
            this.toast?.showError(errorMessage);
          }

          return; // Exit early for quoted jobs
        }

        // Regular job creation - continue with existing flow
        // Add subcategoryInfo array to callData
        callData.subcategoryInfo = this.subcategoryInfoArray;

        // Create Payment Method with Stripe Elements before sending to server
        // This way we only send the paymentMethodId (token) to server, not card details

        // Create payment method using CreditCardForm component (only if no saved payment method)
        if (this.totalPrice > 0 && !this.paymentMethodId) {
          try {
            // Check if CreditCardForm component is available
            if (!this.$refs.creditCardForm) {
              this.isLoading = false;
              this.toast?.showError(" טופס כרטיס האשראי לא זמין. אנא נסה שוב.");
              return;
            }

            // Use CreditCardForm's createPaymentMethod method
            const paymentMethodId =
              await this.$refs.creditCardForm.createPaymentMethod();

            if (!paymentMethodId) {
              this.isLoading = false;
              this.toast?.showError(
                " לא הצלחנו ליצור אמצעי תשלום. אנא נסה שוב."
              );
              return;
            }

            // Store payment method ID to send to server (not card details!)
            this.paymentMethodId = paymentMethodId;
            callData.paymentMethodId = paymentMethodId;
          } catch (paymentError) {
            this.isLoading = false;
            this.toast?.showError(
              paymentError.message ||
                "לא הצלחנו ליצור אמצעי תשלום. אנא נסה שוב."
            );
            return;
          }
        } else if (this.totalPrice > 0 && this.paymentMethodId) {
          // Use saved payment method
          callData.paymentMethodId = this.paymentMethodId;
        } else {
        }

        // Send to new endpoint
        const createCallUrl = `${URL}/create-call-v2`;

        // Log what we're sending to server

        // Start patience message interval
        this.requestStartTime = Date.now();
        this.startPatienceMessageInterval();

        const response = await axios.post(createCallUrl, callData, {
          headers: { "Content-Type": "application/json" },
          // No timeout - wait indefinitely
        });
        // Stop patience message interval
        this.stopPatienceMessageInterval();

        const scenario = response.data.scenario;

        if (response.data.success && scenario === "all_match") {
          // Handymen found matching all subcategories - job created
          this.foundHandymen = response.data.handymen || [];
          const createdJobId = response.data.jobId || response.data.job?._id;

          // For CreateCall: Payment will be created after handyman accepts the job
          // Don't create payment immediately - wait for handyman to accept
          setTimeout(() => {
            this.isLoading = false;
            this.toast.showSuccess(
              `נמצאו ${this.foundHandymen.length} הנדימנים מתאימים. הקריאה נוצרה ומחכה לאישור. התשלום יתבצע לאחר שההנדימן יקבל את העבודה.`
            );
            // Don't redirect automatically - let user see the handymen list and click "Back" button
          }, 2000);
        } else if (scenario === "no_match") {
          // No handymen match any subcategories
          this.isLoading = false;
          this.toast.showError(
            response.data.message ||
              "מצטערים, אין כרגע הנדימנים שמתמחים בתחומים שאתה צריך"
          );
        } else if (scenario === "partial_match") {
          // Some handymen match some subcategories
          this.isLoading = false;
          this.partialMatchData = {
            handymen: response.data.handymen || [],
            matchedSubcategories: response.data.matchedSubcategories || [],
            allSubcategories: response.data.allSubcategories || [],
          };
          this.showPartialMatchModal = true;
        } else if (scenario === "split_needed") {
          // Handymen match at least one but not all - ask to split
          this.isLoading = false;
          this.splitNeededData = {
            handymen: response.data.handymen || [],
          };
          this.showSplitCallModal = true;
        } else {
          // Fallback or error
          this.isLoading = false;
          const errorMessage = response.data.message || "שגיאה בשליחת הקריאה";
          this.toast.showError(errorMessage);
        }
      } catch (error) {
        // Stop patience message interval
        this.stopPatienceMessageInterval();

        this.isLoading = false;
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "לא הצלחנו לשלוח את הקריאה. נסה שוב מאוחר יותר.";
        this.toast.showError(`לא הצלחנו לשלוח את הקריאה: ${errorMessage}`);
      }
    },
    async handleSplitCall() {
      this.showSplitCallModal = false;
      this.isLoading = true;

      try {
        // Ensure coordinates are up to date before split
        // If usingMyLocation is true, make sure we have valid coordinates with lon/lng
        if (this.usingMyLocation) {
          // Check if geoCoordinates has lon/lng
          const hasValidGeoCoords =
            this.geoCoordinates &&
            this.geoCoordinates.lat !== undefined &&
            (this.geoCoordinates.lon !== undefined ||
              this.geoCoordinates.lng !== undefined);

          // If geoCoordinates is missing or invalid, try to get fresh location
          if (!hasValidGeoCoords) {
            try {
              const loc = await this.getCurrentLocation();
              this.geoCoordinates = { lat: loc.lat, lon: loc.lon };
            } catch (err) {}
          }

          // Update call.coordinates if needed
          if (
            this.geoCoordinates &&
            !this.call.coordinates?.lng &&
            !this.call.coordinates?.lon
          ) {
            this.call.coordinates = { ...this.geoCoordinates };
          }
        }

        // Prepare call data (same as in onSubmitCall and handlePartialMatchApprove)
        const callData = {
          userId: this.$route.params.id,
          desc: this.call.desc || "",
          workType: this.call.workType || "קלה",
          when: this.call.when || "asap",
          urgent: this.call.urgent || false,
          imageUrls:
            this.call.imageUrls.length > 0
              ? this.call.imageUrls
              : this.call.imagePreviews.length > 0
              ? this.call.imagePreviews
              : [],
          location: this.call.location || "מיקום",
          locationEnglishName: this.locationEnglishName,
          selectedCity: this.selectedCity,
          usingMyLocation: this.usingMyLocation,
        };

        // Add coordinates (EXACT same logic as in onSubmitCall)
        if (this.selectedMapLocation) {
          callData.coordinates = {
            lng: this.selectedMapLocation.lng,
            lat: this.selectedMapLocation.lat,
          };
        } else if (this.usingMyLocation && this.geoCoordinates) {
          // Use spread operator exactly like onSubmitCall
          callData.coordinates = { ...this.geoCoordinates };
        } else if (
          this.call.coordinates &&
          this.call.coordinates.lat &&
          (this.call.coordinates.lng || this.call.coordinates.lon)
        ) {
          // Fallback: use coordinates from call.coordinates if selectedMapLocation is not set
          callData.coordinates = {
            lng: this.call.coordinates.lng ?? this.call.coordinates.lon,
            lat: this.call.coordinates.lat,
          };
        }

        // Normalize coordinates (EXACT same logic as in onSubmitCall)
        if (this.usingMyLocation && callData.coordinates) {
          const lng = callData.coordinates.lng ?? callData.coordinates.lon;
          const lat = callData.coordinates.lat;
          if (lng !== undefined && lat !== undefined) {
            callData.coordinates = { lng: Number(lng), lat: Number(lat) };
          } else {
            // Last resort: try to get fresh coordinates from geoCoordinates
            if (this.geoCoordinates) {
              const fallbackLng =
                this.geoCoordinates.lng ?? this.geoCoordinates.lon;
              const fallbackLat = this.geoCoordinates.lat;
              if (fallbackLng !== undefined && fallbackLat !== undefined) {
                callData.coordinates = {
                  lng: Number(fallbackLng),
                  lat: Number(fallbackLat),
                };
              }
            }
          }
        } else if (!this.usingMyLocation) {
          delete callData.coordinates;
        }

        // Final check before sending - ensure coordinates have lng if usingMyLocation
        if (this.usingMyLocation && callData.coordinates) {
          if (!callData.coordinates.lng && callData.coordinates.lon) {
            // Convert lon to lng if needed
            callData.coordinates.lng = callData.coordinates.lon;
            delete callData.coordinates.lon;
          }
          // Final validation - if still missing lng, try one more time from geoCoordinates
          if (!callData.coordinates.lng && this.geoCoordinates) {
            const finalLng = this.geoCoordinates.lng ?? this.geoCoordinates.lon;
            if (finalLng !== undefined) {
              callData.coordinates.lng = Number(finalLng);
            }
          }
        }

        // Build full subcategoryInfo array from subcategoryInfoArray
        // For split call, we want to send ALL subcategories that the user selected
        const fullMatchedSubcategories = [];
        if (
          this.subcategoryInfoArray &&
          Array.isArray(this.subcategoryInfoArray) &&
          this.subcategoryInfoArray.length > 0
        ) {
          // Create a Set to track which subcategories we've already added (to avoid duplicates)
          const addedSubcategories = new Set();

          for (const subcatInfo of this.subcategoryInfoArray) {
            // Create a unique key for this subcategory
            const key = `${subcatInfo.category || ""}_${
              subcatInfo.subcategory || ""
            }`;

            // Skip if we've already added this subcategory (to avoid duplicates)
            if (addedSubcategories.has(key)) {
              continue;
            }

            // Add the full info with all fields (category, subcategory, price, workType)
            const fullSubcatInfo = {
              category: subcatInfo.category,
              subcategory: subcatInfo.subcategory,
              price: subcatInfo.price || null,
              workType: subcatInfo.workType || null,
            };
            fullMatchedSubcategories.push(fullSubcatInfo);
            addedSubcategories.add(key);
          }
        }

        if (fullMatchedSubcategories.length === 0) {
          this.toast.showError("לא מצאנו בשבילך תחומים לפיצול");
          this.isLoading = false;
          return;
        }

        // Add handymen and full matched subcategories for server to process
        callData.handymen = this.splitNeededData.handymen || [];
        callData.matchedSubcategories = fullMatchedSubcategories;

        if (!callData.handymen || callData.handymen.length === 0) {
          this.toast.showError("לא מצאנו בשבילך הנדימנים לפיצול");
          this.isLoading = false;
          return;
        }

        // CRITICAL: Last check before sending - if coordinates missing lng, fix it NOW
        if (this.usingMyLocation && callData.coordinates) {
          if (!callData.coordinates.lng) {
            // Emergency fix: try all possible sources
            if (callData.coordinates.lon) {
              callData.coordinates.lng = Number(callData.coordinates.lon);
              delete callData.coordinates.lon;
            } else if (this.geoCoordinates?.lon) {
              callData.coordinates.lng = Number(this.geoCoordinates.lon);
            } else if (this.geoCoordinates?.lng) {
              callData.coordinates.lng = Number(this.geoCoordinates.lng);
            } else if (this.call.coordinates?.lon) {
              callData.coordinates.lng = Number(this.call.coordinates.lon);
            } else if (this.call.coordinates?.lng) {
              callData.coordinates.lng = Number(this.call.coordinates.lng);
            }
          }
        }

        const response = await axios.post(`${URL}/split-call-v2`, callData, {
          headers: { "Content-Type": "application/json" },
        });

        if (response.data.success) {
          this.toast.showSuccess("הקריאה פוצלה בהצלחה");
          // Clear store jobs to force fresh data load in Dashboard
          if (this.store) {
            this.store.jobs = [];
          }
          setTimeout(() => {
            this.$router.push({
              name: "Dashboard",
              params: { id: this.$route.params.id },
            });
          }, 1000);
        } else {
          this.toast.showError(
            response.data.message || "לא הצלחנו לפצל את הקריאה"
          );
        }
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "שגיאה בפיצול הקריאה. נסה שוב מאוחר יותר.";
        this.toast.showError(errorMessage);
      } finally {
        this.isLoading = false;
      }
    },
    handleCancelSplit() {
      this.showSplitCallModal = false;
      this.toast.showInfo("הקריאה בוטלה");
      setTimeout(() => {
        this.$router.push({
          name: "Dashboard",
          params: { id: this.$route.params.id },
        });
      }, 1000);
    },
    getSubcategoryName(subcat) {
      return subcat.subcategory || subcat.category || "תחום";
    },
    getMatchedSubcategoriesText() {
      if (!this.partialMatchData.matchedSubcategories) return "";
      return this.partialMatchData.matchedSubcategories
        .map((subcat) => this.getSubcategoryName(subcat))
        .join(", ");
    },
    async handlePartialMatchApprove() {
      // Create job with only matched subcategories
      this.showPartialMatchModal = false;
      this.isLoading = true;

      try {
        // Prepare call data (same as in onSubmitCall)
        const callData = {
          userId: this.$route.params.id,
          desc: this.call.desc || "",
          workType: this.call.workType || "קלה",
          when: this.call.when || "asap",
          urgent: this.call.urgent || false,
          imageUrls:
            this.call.imageUrls.length > 0
              ? this.call.imageUrls
              : this.call.imagePreviews.length > 0
              ? this.call.imagePreviews
              : [],
          location: this.call.location || "מיקום",
          locationEnglishName: this.locationEnglishName,
          selectedCity: this.selectedCity,
          usingMyLocation: this.usingMyLocation,
        };

        // Add coordinates (EXACT same logic as in handleSplitCall)
        if (this.selectedMapLocation) {
          callData.coordinates = {
            lng: this.selectedMapLocation.lng,
            lat: this.selectedMapLocation.lat,
          };
        } else if (this.usingMyLocation && this.geoCoordinates) {
          // Use spread operator and normalize lon to lng
          callData.coordinates = { ...this.geoCoordinates };
          // Normalize: convert lon to lng if needed
          if (callData.coordinates.lon && !callData.coordinates.lng) {
            callData.coordinates.lng = callData.coordinates.lon;
            delete callData.coordinates.lon;
          }
          // Ensure lng and lat are numbers
          if (
            callData.coordinates.lng !== undefined &&
            callData.coordinates.lat !== undefined
          ) {
            callData.coordinates = {
              lng: Number(callData.coordinates.lng ?? callData.coordinates.lon),
              lat: Number(callData.coordinates.lat),
            };
          }
        } else if (
          this.call.coordinates &&
          this.call.coordinates.lat &&
          (this.call.coordinates.lng || this.call.coordinates.lon)
        ) {
          callData.coordinates = {
            lng: this.call.coordinates.lng ?? this.call.coordinates.lon,
            lat: this.call.coordinates.lat,
          };
        }

        // Final check before sending
        if (this.usingMyLocation && callData.coordinates) {
          if (!callData.coordinates.lng && callData.coordinates.lon) {
            callData.coordinates.lng = callData.coordinates.lon;
            delete callData.coordinates.lon;
          }
          if (!callData.coordinates.lng && this.geoCoordinates) {
            const finalLng = this.geoCoordinates.lng ?? this.geoCoordinates.lon;
            if (finalLng !== undefined) {
              callData.coordinates.lng = Number(finalLng);
            }
          }
        }

        // Build full subcategoryInfo array from matchedSubcategories
        // Match each matchedSubcategory with the full data from subcategoryInfoArray
        const fullMatchedSubcategories = [];
        if (
          this.partialMatchData.matchedSubcategories &&
          Array.isArray(this.partialMatchData.matchedSubcategories) &&
          this.subcategoryInfoArray &&
          Array.isArray(this.subcategoryInfoArray)
        ) {
          // Create a Set to track which subcategories we've already added (to avoid duplicates)
          const addedSubcategories = new Set();

          for (const matched of this.partialMatchData.matchedSubcategories) {
            // Create a unique key for this subcategory
            const key = `${matched.category || ""}_${
              matched.subcategory || ""
            }`;

            // Skip if we've already added this subcategory (to avoid duplicates)
            if (addedSubcategories.has(key)) {
              continue;
            }

            // Find the full subcategory info from subcategoryInfoArray
            const fullInfo = this.subcategoryInfoArray.find(
              (subcat) =>
                subcat.category === matched.category &&
                subcat.subcategory === matched.subcategory
            );

            if (fullInfo) {
              // Add the full info with all fields (category, subcategory, price, workType)
              const fullSubcatInfo = {
                category: fullInfo.category,
                subcategory: fullInfo.subcategory,
                price: fullInfo.price || null,
                workType: fullInfo.workType || null,
              };
              fullMatchedSubcategories.push(fullSubcatInfo);
              addedSubcategories.add(key);
            } else {
              // If not found in subcategoryInfoArray, use the matched data with null for price/workType
              const fallbackSubcatInfo = {
                category: matched.category,
                subcategory: matched.subcategory,
                price: null,
                workType: null,
              };
              fullMatchedSubcategories.push(fallbackSubcatInfo);
              addedSubcategories.add(key);
            }
          }
        } else {
        }

        // Add handymen and full matched subcategories for server to process
        callData.handymen = this.partialMatchData.handymen || [];
        callData.matchedSubcategories = fullMatchedSubcategories;

        const response = await axios.post(`${URL}/split-call-v2`, callData, {
          headers: { "Content-Type": "application/json" },
        });

        if (response.data.success) {
          this.toast.showSuccess("הקריאה פוצלה בהצלחה");
          // Clear store jobs to force fresh data load in Dashboard
          if (this.store) {
            this.store.jobs = [];
          }
          setTimeout(() => {
            this.$router.push({
              name: "Dashboard",
              params: { id: this.$route.params.id },
            });
          }, 1000);
        } else {
          this.toast.showError(
            response.data.message || "לא הצלחנו לפצל את הקריאה"
          );
        }
      } catch (error) {
        this.toast.showError("לא הצלחנו לפצל את הקריאה. נסה שוב מאוחר יותר.");
      } finally {
        this.isLoading = false;
      }
    },
    startPatienceMessageInterval() {
      // Clear any existing interval
      this.stopPatienceMessageInterval();

      // Reset message text
      this.patienceMessageText = "אנחנו מצטערים אך הסבלנות תשתלם";

      // Check time elapsed and update message after 8 seconds
      const updateMessageTimeout = setTimeout(() => {
        if (this.isLoading && !this.foundHandymen.length) {
          this.patienceMessageText = "תנוח אנחנו נעדכן אותך אם מצאנו";
        }
      }, 8000);

      // Show message every 2 seconds
      this.patienceMessageInterval = setInterval(() => {
        if (this.isLoading && !this.foundHandymen.length) {
          // Calculate elapsed time
          const elapsed = Date.now() - this.requestStartTime;

          // Update message text if more than 8 seconds have passed
          if (elapsed >= 8000) {
            this.patienceMessageText = "תנוח אנחנו נעדכן אותך אם מצאנו";
          }

          // Show message with animation
          this.showPatienceMessage = true;

          // Hide message after 3 seconds
          setTimeout(() => {
            this.showPatienceMessage = false;
          }, 3000);
        }
      }, 2000);

      // Store timeout to clear it if needed
      this.patienceMessageTimeout = updateMessageTimeout;
    },
    stopPatienceMessageInterval() {
      if (this.patienceMessageInterval) {
        clearInterval(this.patienceMessageInterval);
        this.patienceMessageInterval = null;
      }
      if (this.patienceMessageTimeout) {
        clearTimeout(this.patienceMessageTimeout);
        this.patienceMessageTimeout = null;
      }
      this.showPatienceMessage = false;
      this.patienceMessageText = "אנחנו מצטערים אך הסבלנות תשתלם";
    },
    async fetchCategoriesFromAI() {
      // isLoadingCategories is already set in nextStep()
      this.foundCategories = [];
      this.subcategoryInfoArray = [];
      this.aiMatchResult = null; // Reset AI match result

      try {
        // Get all valid requests (filter out empty ones)
        const validRequests = this.call.requests.filter(
          (r) => r && r.trim().length > 0
        );

        console.log(
          "[CreateCall] fetchCategoriesFromAI - מספר בקשות:",
          validRequests.length,
          "בקשות:",
          validRequests
        );

        if (validRequests.length === 0) {
          this.toast?.showError("יש למלא לפחות בקשה אחת");
          this.isLoadingCategories = false;
          return;
        }

        // Call new AI matching endpoint for EACH request separately
        const matchPromises = validRequests.map(async (request) => {
          const trimmedRequest = request.trim();
          console.log("[CreateCall] שולח בקשה ל-AI matching:", trimmedRequest);

          try {
            const response = await axios.post(
              `${URL}/api/ai/match-subcategory`,
              { shortText: trimmedRequest },
              {
                headers: { "Content-Type": "application/json" },
              }
            );
            return {
              originalRequest: trimmedRequest,
              success: response.data.success,
              matchResult: response.data,
            };
          } catch (error) {
            console.error(
              "[CreateCall] שגיאה בקריאה ל-AI matching עבור:",
              trimmedRequest,
              error
            );
            return {
              originalRequest: trimmedRequest,
              success: false,
              error: error.message,
            };
          }
        });

        const results = await Promise.all(matchPromises);
        console.log(
          "[CreateCall] תוצאות AI matching:",
          results.map((r) => ({
            request: r.originalRequest,
            matched: r.matchResult?.matched,
            confidence: r.matchResult?.confidence,
          }))
        );

        // Process results and build subcategoryInfoArray
        const processedCategories = [];
        let firstLowConfidenceMatch = null; // For recommendation (Case B)
        let lowConfidenceIndex = -1; // Index of the work with low confidence

        results.forEach((result, index) => {
          if (!result.success || !result.matchResult) {
            console.warn("[CreateCall] בקשה נכשלה:", result.originalRequest);
            return;
          }

          const matchResult = result.matchResult;

          // Case A: High confidence (>= 0.7) - Fixed price
          if (matchResult.matched && matchResult.confidence >= 0.7) {
            processedCategories.push({
              category: matchResult.category,
              subcategory: matchResult.subcategory,
              price: matchResult.price, // Keep original price from AI
              workType: matchResult.workType || "קבלנות",
              originalText: result.originalRequest, // Keep original text for display
              confidence: matchResult.confidence, // Store confidence for UI
              needsRecommendation: false, // No recommendation needed
            });
          }
          // Case B: Medium confidence (0.6-0.69) - Show recommendation on card, but still display with original price
          else if (
            matchResult.matched &&
            matchResult.confidence >= 0.6 &&
            matchResult.confidence < 0.7
          ) {
            // Store first low confidence match for tracking
            if (!firstLowConfidenceMatch) {
              firstLowConfidenceMatch = {
                matched: true,
                confidence: matchResult.confidence,
                category: matchResult.category,
                subcategory: matchResult.subcategory,
                price: matchResult.price,
                workType: matchResult.workType || "קבלנות",
                originalText: result.originalRequest,
              };
            }
            // Add to categories for display with original price (not "bid") but with recommendation flag
            processedCategories.push({
              category: matchResult.category,
              subcategory: matchResult.subcategory,
              price: matchResult.price, // Keep original price from AI
              workType: matchResult.workType || "קבלנות",
              originalText: result.originalRequest, // Keep original text for display
              confidence: matchResult.confidence, // Store confidence for UI
              needsRecommendation: true, // Show recommendation message on this card
            });
          }
          // Case C: Low confidence/no match (< 0.6) - Quoted
          else {
            processedCategories.push({
              category: matchResult.category || "כללי",
              subcategory: matchResult.subcategory, // Original text
              price: "bid",
              workType: "קבלנות",
              originalText: result.originalRequest, // Keep original text for display
              confidence: matchResult.confidence || 0, // Store confidence for UI
              needsRecommendation: false, // No recommendation, goes directly to quoted
            });
          }
        });

        // Set the results
        this.subcategoryInfoArray = processedCategories;
        // Always show categories now - recommendation will be shown on specific card
        this.foundCategories = processedCategories;
        // Clear aiMatchResult - we don't need it anymore as recommendation is on card
        this.aiMatchResult = null;

        console.log(
          "[CreateCall] סיכום עיבוד:",
          `נמצאו ${processedCategories.length} קטגוריות`,
          firstLowConfidenceMatch
            ? `המלצה: ${firstLowConfidenceMatch.originalText} (confidence: ${firstLowConfidenceMatch.confidence})`
            : "אין המלצות"
        );
      } catch (error) {
        console.error(
          "[CreateCall] שגיאה כללית ב-fetchCategoriesFromAI:",
          error
        );
        logger.error("Error in fetchCategoriesFromAI:", error);
        this.toast?.showError("לא הצלחנו לחפש את התחומים. נסה שוב מאוחר יותר.");
      } finally {
        this.isLoadingCategories = false;
      }
    },
    refineCategories() {
      // Reset categories and go back to step 1
      this.foundCategories = [];
      this.subcategoryInfoArray = [];
      this.isLoadingCategories = false;
      this.aiMatchResult = null;
      this.currentStep = 1;
      // Keep the requests as they were (they're already in call.requests)
    },
    openWorkForQuotation(index) {
      // User clicked "פתח להצעת מחיר" button on a specific work card
      if (this.subcategoryInfoArray[index]) {
        // Update only the specific work to have price="bid" and dismiss recommendation
        this.subcategoryInfoArray[index] = {
          ...this.subcategoryInfoArray[index],
          price: "bid",
          needsRecommendation: false, // Remove recommendation after choosing quotation
        };
        // Update foundCategories as well
        this.foundCategories[index] = {
          ...this.foundCategories[index],
          price: "bid",
          needsRecommendation: false, // Remove recommendation after choosing quotation
        };
      }
    },
    dismissRecommendation(index) {
      // User clicked "המשך עם העבודה שמצאנו" - dismiss the recommendation
      if (this.foundCategories[index]) {
        this.foundCategories[index] = {
          ...this.foundCategories[index],
          needsRecommendation: false,
        };
      }
      if (this.subcategoryInfoArray[index]) {
        this.subcategoryInfoArray[index] = {
          ...this.subcategoryInfoArray[index],
          needsRecommendation: false,
        };
      }
    },
    removeWorkByIndex(index) {
      // User clicked "הסר עבודה זו" - remove the work from both arrays
      this.subcategoryInfoArray.splice(index, 1);
      this.foundCategories = [...this.subcategoryInfoArray];
    },
  },
  beforeUnmount() {
    // Clean up interval when component is destroyed
    this.stopPatienceMessageInterval();
    // Disconnect WebSocket if connected
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  },
  async mounted() {
    try {
      const loc = await this.getCurrentLocation();
      this.geoCoordinates = { lat: loc.lat, lon: loc.lon };
      if (this.usingMyLocation) {
        this.call.coordinates = { ...this.geoCoordinates };
      }
    } catch (err) {
      // Silent fail - location is optional
    }
  },
};
</script>

<style lang="scss" scoped>
/* =========
     Luxury Orange / Black / Gray Theme
     ========= */
$bg: #07070b;
$bg2: #0b0c12;
$card: rgba(255, 255, 255, 0.04);
$card2: rgba(255, 255, 255, 0.06);
$stroke: rgba(255, 255, 255, 0.12);
$stroke2: rgba(255, 255, 255, 0.18);
$text: rgba(255, 255, 255, 0.92);
$muted: rgba(255, 255, 255, 0.62);
$muted2: rgba(255, 255, 255, 0.44);

$orange: #ff6a00;
$orange2: #ff8a2b;
$orange3: #ffb36b;
$danger: #ff3b3b;
$ok: #19d27c;

$shadow: 0 18px 48px rgba(0, 0, 0, 0.55);
$shadowOrange: 0 18px 52px rgba(255, 106, 0, 0.16);

.create-call-page {
  min-height: 100vh;
  background: radial-gradient(
      800px 500px at 20% 0%,
      rgba($orange, 0.14),
      transparent 60%
    ),
    radial-gradient(
      700px 450px at 90% 12%,
      rgba($orange2, 0.1),
      transparent 65%
    ),
    linear-gradient(180deg, $bg, $bg2);
  color: $text;
}

/* =========
     Shell
     ========= */
.shell {
  max-width: 420px;
  width: 100%;
  margin: 0 auto;
  padding: 14px 14px calc(96px + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

/* =========
     Topbar
     ========= */
.topbar {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 12px;
  padding: 12px 0 14px;

  &__back {
    width: 46px;
    height: 46px;
    border-radius: 16px;
    border: 1px solid rgba($orange, 0.25);
    background: rgba($orange, 0.08);
    color: $text;
    font-weight: 1100;
    cursor: pointer;
    transition: transform 0.18s ease, background 0.18s ease,
      border-color 0.18s ease, box-shadow 0.18s ease;

    &:hover {
      transform: translateY(-1px);
      border-color: rgba($orange, 0.45);
      background: rgba($orange, 0.12);
      box-shadow: 0 10px 24px rgba($orange, 0.15);
    }

    &:active {
      transform: translateY(0);
    }
  }

  &__center {
    min-width: 0;
  }

  &__title {
    font-size: 20px;
    font-weight: 1200;
    letter-spacing: 0.2px;
    line-height: 1.2;
    color: $text;
  }

  &__subtitle {
    margin-top: 4px;
    font-size: 12px;
    font-weight: 900;
    color: rgba(255, 255, 255, 0.6);
  }

  &__glow {
    position: absolute;
    inset: -6px -8px auto -8px;
    height: 66px;
    pointer-events: none;
    background: radial-gradient(
      300px 120px at 40% 50%,
      rgba($orange, 0.18),
      transparent 70%
    );
    filter: blur(10px);
    opacity: 0.85;
  }
}

/* =========
     Step Indicator
     ========= */
.step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 18px 0 14px;
  margin-bottom: 12px;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  user-select: none;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-weight: 1200;
  font-size: 16px;
  border: 2px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.05);
  color: $muted;
  transition: all 0.28s ease;
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.25);
}

.step-item.active .step-number {
  border-color: rgba($orange, 0.7);
  background: rgba($orange, 0.18);
  color: $orange3;
  box-shadow: 0 12px 28px rgba($orange, 0.18);
}

.step-item.completed .step-number {
  border-color: rgba($orange, 0.85);
  background: linear-gradient(135deg, $orange, $orange2);
  color: #101015;
  box-shadow: 0 16px 36px rgba($orange, 0.22);
}

.step-label {
  font-size: 12px;
  font-weight: 1000;
  color: rgba(255, 255, 255, 0.58);
  transition: color 0.25s ease;
}

.step-item.active .step-label {
  color: $text;
}

.step-line {
  flex: 1;
  height: 2px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0 10px;
  border-radius: 999px;
  position: relative;
  overflow: hidden;
}

.step-line.active {
  background: linear-gradient(90deg, $orange, $orange2);

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.22),
      transparent
    );
    transform: translateX(-60%);
    animation: shimmer 1.6s ease-in-out infinite;
  }
}

@keyframes shimmer {
  0% {
    transform: translateX(-60%);
  }
  100% {
    transform: translateX(60%);
  }
}

/* =========
     Content / Steps
     ========= */
.content {
  display: grid;
  gap: 12px;
  min-height: 0;
}

.step-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}

.step-content--animated {
  animation: stepIn 0.42s ease-out;
}

@keyframes stepIn {
  from {
    opacity: 0;
    transform: translateX(14px);
    filter: blur(2px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
    filter: blur(0);
  }
}

/* Scroll card container */
.step-container {
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 18px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.045),
    rgba(255, 255, 255, 0.03)
  );
  box-shadow: $shadow;
  padding: 12px;
  display: grid;
  gap: 12px;
  max-height: calc(100vh - 250px);
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;
  backdrop-filter: blur(10px);

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.06);
    border-radius: 10px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba($orange, 0.55);
    border-radius: 10px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: rgba($orange, 0.75);
  }
}

/* =========
     Blocks / Cards
     ========= */
.block {
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.03);
  padding: 12px;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    inset: -1px;
    pointer-events: none;
    background: radial-gradient(
      480px 220px at 10% 0%,
      rgba($orange, 0.14),
      transparent 55%
    );
    opacity: 0.35;
  }

  &--last {
    padding-bottom: 14px;
  }
}

.block__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
  position: relative;
  z-index: 2;
}

.block--requests .block__head {
  align-items: flex-start;
}

.block__label {
  font-size: 13px;
  font-weight: 1200;
  color: $text;
}

.block__req {
  font-size: 11px;
  font-weight: 1100;
  color: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba($orange, 0.28);
  background: rgba($orange, 0.12);
  padding: 3px 10px;
  border-radius: 999px;
}

.block__refine-btn {
  font-size: 11px;
  font-weight: 1000;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 10px;
  padding: 7px 10px;
  cursor: pointer;
  transition: all 0.18s ease;
  white-space: nowrap;

  &:hover {
    color: $orange3;
    border-color: rgba($orange, 0.28);
    background: rgba($orange, 0.1);
    transform: translateY(-1px);
  }
}

/* =========
     Inputs
     ========= */
.input-small,
.textarea,
.select {
  width: 100%;
  box-sizing: border-box;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(0, 0, 0, 0.22);
  color: $text;
  padding: 14px 12px;
  font-weight: 900;
  font-size: 16px;
  position: relative;
  z-index: 2;
  transition: border-color 0.18s ease, background 0.18s ease,
    box-shadow 0.18s ease;

  &:focus {
    outline: none;
    border-color: rgba($orange, 0.6);
    background: rgba(0, 0, 0, 0.28);
    box-shadow: 0 0 0 4px rgba($orange, 0.14);
  }
}

.textarea {
  min-height: 120px;
  resize: vertical;
  line-height: 1.55;
}

.select {
  min-height: 48px;
}

.input-small--error,
.is-err,
.input-error {
  border-color: rgba($danger, 0.65) !important;
  background: rgba($danger, 0.08) !important;
  box-shadow: 0 0 0 4px rgba($danger, 0.12) !important;
}

/* Messages */
.msg {
  margin-top: 8px;
  font-size: 12px;
  font-weight: 900;
  position: relative;
  z-index: 2;

  &--err {
    color: rgba(255, 80, 90, 0.95);
  }
  &--hint {
    color: rgba(255, 255, 255, 0.55);
  }
}

/* Tiny hints */
.textarea-hint,
.field-hint,
.mini-trust,
.urgent-trust {
  margin-top: 10px;
  display: flex;
  gap: 10px;
  align-items: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  font-weight: 900;
  position: relative;
  z-index: 2;

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: rgba($orange, 0.9);
    box-shadow: 0 0 0 4px rgba($orange, 0.14);
    flex-shrink: 0;
  }
}

/* =========
     Requests extras
     ========= */
.field-stack {
  position: relative;
  z-index: 2;
}

.lux-divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 14px 0 8px;

  &__line {
    flex: 1;
    height: 1px;
    background: rgba(255, 255, 255, 0.12);
  }

  &__txt {
    font-size: 11px;
    font-weight: 1000;
    color: rgba(255, 255, 255, 0.55);
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(0, 0, 0, 0.16);
  }
}

.additional-request {
  position: relative;
  margin-top: 12px;
}

.remove-request-btn {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1px solid rgba($danger, 0.35);
  background: rgba($danger, 0.12);
  color: $danger;
  font-size: 16px;
  cursor: pointer;
  display: grid;
  place-items: center;
  z-index: 3;
  transition: transform 0.16s ease, background 0.16s ease,
    border-color 0.16s ease;

  &:hover {
    transform: scale(1.05);
    background: rgba($danger, 0.2);
    border-color: rgba($danger, 0.55);
  }
}

.add-request-btn {
  width: 100%;
  margin-top: 12px;
  padding: 12px;
  border-radius: 14px;
  border: 1px dashed rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.03);
  color: $text;
  font-weight: 1100;
  cursor: pointer;
  transition: all 0.18s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  position: relative;
  z-index: 2;

  &:hover {
    border-color: rgba($orange, 0.4);
    background: rgba($orange, 0.08);
    transform: translateY(-1px);
  }

  &__icon {
    filter: drop-shadow(0 6px 16px rgba($orange, 0.22));
  }
}

/* Manual Select Button */
.manual-select-btn {
  padding: 7px 10px;
  border-radius: 10px;
  border: 1px solid rgba($orange, 0.4);
  background: rgba($orange, 0.12);
  color: $orange3;
  font-weight: 1000;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.18s ease;
  white-space: nowrap;
  flex-shrink: 0;

  &:hover {
    border-color: rgba($orange, 0.6);
    background: rgba($orange, 0.18);
    transform: translateY(-1px);
  }
}

/* =========
     Loading Categories
     ========= */
.block--loading-categories {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;

  &::before {
    opacity: 0.5;
  }
}

.loading-categories {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  position: relative;
  z-index: 2;

  &__spinner {
    display: flex;
    gap: 8px;
  }

  &__text {
    color: $text;
    font-weight: 1200;
    font-size: 15px;
    text-align: center;
  }

  &__subtext {
    margin-top: -8px;
    color: rgba(255, 255, 255, 0.6);
    font-weight: 900;
    font-size: 12px;
    text-align: center;
  }
}

.spinner-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: $orange;
  animation: dotPulse 1.35s ease-in-out infinite;

  &:nth-child(2) {
    animation-delay: 0.2s;
  }
  &:nth-child(3) {
    animation-delay: 0.4s;
  }
}

@keyframes dotPulse {
  0%,
  100% {
    opacity: 0.35;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

/* =========
     Found Categories
     ========= */
.block--found-categories {
  background: linear-gradient(
    180deg,
    rgba($orange, 0.12),
    rgba(255, 255, 255, 0.03)
  );
  border-color: rgba($orange, 0.25);

  &::before {
    opacity: 0.65;
  }
}

.categories-list {
  display: grid;
  gap: 12px;
  margin-top: 12px;
  position: relative;
  z-index: 2;
}

/* AI Recommendation Block */
.block--ai-recommendation {
  margin-bottom: 20px;
}

.ai-recommendation {
  display: flex;
  gap: 14px;
  padding: 18px;
  border-radius: 16px;
  background: rgba(255, 106, 0, 0.12);
  border: 1px solid rgba(255, 106, 0, 0.3);
}

.ai-recommendation__icon {
  font-size: 28px;
  flex-shrink: 0;
  line-height: 1;
}

.ai-recommendation__content {
  flex: 1;
}

.ai-recommendation__title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 1000;
  color: $orange2;
}

.ai-recommendation__text {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.5;

  strong {
    color: $orange2;
    font-weight: 1000;
  }
}

.ai-recommendation__actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.ai-recommendation__btn {
  flex: 1;
  min-width: 140px;
  padding: 12px 18px;
  border-radius: 12px;
  border: none;
  font-size: 14px;
  font-weight: 1000;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;

  &--primary {
    background: linear-gradient(135deg, $orange, $orange2);
    color: #111;
    box-shadow: 0 8px 20px rgba($orange, 0.25);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 28px rgba($orange, 0.35);
    }
  }

  &--secondary {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.18);
    color: rgba(255, 255, 255, 0.9);

    &:hover {
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba($orange, 0.3);
    }
  }

  &--remove {
    background: rgba(255, 59, 59, 0.1);
    border: 1px solid rgba(255, 59, 59, 0.3);
    color: rgba(255, 59, 59, 0.9);

    &:hover {
      background: rgba(255, 59, 59, 0.16);
      border-color: rgba(255, 59, 59, 0.45);
    }
  }
}

.category-card {
  padding: 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  transition: transform 0.18s ease, border-color 0.18s ease,
    background 0.18s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-1px);
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba($orange, 0.38);
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
  }

  &__name {
    color: $text;
    font-weight: 1200;
    font-size: 15px;
    flex: 1;
    min-width: 0;
  }

  &__price {
    color: $orange3;
    font-weight: 1200;
    font-size: 15px;
    background: rgba($orange, 0.14);
    border: 1px solid rgba($orange, 0.26);
    padding: 5px 10px;
    border-radius: 10px;
    white-space: nowrap;

    &--bid {
      background: rgba(255, 106, 0, 0.2);
      border-color: rgba(255, 106, 0, 0.4);
      color: $orange2;
      font-weight: 1000;
    }
  }

  &__details {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 13px;
  }

  &__category,
  &__work-type {
    color: rgba(255, 255, 255, 0.75);
    font-weight: 900;
  }

  &__actions {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  &__quote-btn {
    width: 100%;
    padding: 10px 14px;
    border-radius: 10px;
    border: 1px solid rgba(255, 106, 0, 0.3);
    background: rgba(255, 106, 0, 0.1);
    color: $orange2;
    font-size: 13px;
    font-weight: 1000;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;

    &:hover {
      background: rgba(255, 106, 0, 0.16);
      border-color: rgba(255, 106, 0, 0.45);
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0);
    }
  }

  &__shine {
    content: "";
    position: absolute;
    top: -20%;
    left: -60%;
    width: 60%;
    height: 160%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.18),
      transparent
    );
    transform: rotate(18deg);
    opacity: 0.25;
    pointer-events: none;
  }

  &:hover &__shine {
    animation: cardShine 1.2s ease-in-out;
  }

  &--quoted {
    border-color: rgba($orange, 0.4);
    background: linear-gradient(
      180deg,
      rgba($orange, 0.15),
      rgba($orange, 0.08)
    );
    box-shadow: 0 4px 16px rgba($orange, 0.2);
  }

  @media (max-width: 420px) {
    padding: 12px;
    gap: 10px;

    &__header {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }

    &__name {
      font-size: 14px;
    }

    &__price {
      font-size: 14px;
      padding: 4px 8px;
    }

    &__details {
      font-size: 12px;
      gap: 5px;
    }

    &__quote-btn {
      padding: 9px 12px;
      font-size: 12px;
    }
  }

  @media (max-width: 420px) and (orientation: landscape) {
    &__quote-btn {
      padding: 8px 10px;
      font-size: 11px;
    }
  }

  &__recommendation {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid rgba(255, 106, 0, 0.2);
    background: rgba(255, 106, 0, 0.08);
    border-radius: 10px;
    padding: 12px;
    position: relative;
    z-index: 2;
  }

  &__recommendation-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__recommendation-text {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.85);
    line-height: 1.5;

    strong {
      color: $orange2;
      font-weight: 1000;
    }
  }

  &__recommendation-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  &__recommendation-btn {
    flex: 1;
    min-width: 100px;
    padding: 10px 14px;
    border-radius: 10px;
    border: none;
    font-size: 12px;
    font-weight: 1000;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;

    &--primary {
      background: linear-gradient(135deg, $orange, $orange2);
      color: #111;
      box-shadow: 0 4px 12px rgba($orange, 0.25);

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba($orange, 0.35);
      }
    }

    &--secondary {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.18);
      color: rgba(255, 255, 255, 0.9);

      &:hover {
        background: rgba(255, 255, 255, 0.12);
        border-color: rgba($orange, 0.3);
      }
    }

    &--remove {
      background: rgba(255, 59, 59, 0.1);
      border: 1px solid rgba(255, 59, 59, 0.3);
      color: rgba(255, 59, 59, 0.9);

      &:hover {
        background: rgba(255, 59, 59, 0.16);
        border-color: rgba(255, 59, 59, 0.45);
      }
    }

    @media (max-width: 420px) {
      font-size: 11px;
      padding: 8px 10px;
      min-width: 80px;
    }
  }
}

.no-match-info {
  padding: 20px;
  border-radius: 14px;
  background: rgba($orange, 0.1);
  border: 1px solid rgba($orange, 0.3);
  display: flex;
  gap: 14px;
  align-items: flex-start;

  &__icon {
    font-size: 32px;
    flex-shrink: 0;
  }

  &__content {
    flex: 1;
  }

  &__title {
    margin: 0 0 8px 0;
    font-size: 16px;
    font-weight: 1000;
    color: $orange2;
  }

  &__text {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
    color: $text;
    line-height: 1.5;
  }

  @media (max-width: 420px) {
    padding: 16px;
    gap: 12px;

    &__icon {
      font-size: 28px;
    }

    &__title {
      font-size: 15px;
    }

    &__text {
      font-size: 13px;
    }
  }
}

@keyframes cardShine {
  0% {
    left: -70%;
    opacity: 0.1;
  }
  55% {
    opacity: 0.35;
  }
  100% {
    left: 130%;
    opacity: 0.1;
  }
}

/* =========
     Upload
     ========= */
.uploadRow {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  position: relative;
  z-index: 2;
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
  min-width: 190px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px 12px;
  border-radius: 14px;
  border: 1px solid rgba($orange, 0.26);
  background: linear-gradient(180deg, rgba($orange, 0.14), rgba($orange, 0.08));
  color: $text;
  cursor: pointer;
  font-weight: 1100;
  transition: transform 0.18s ease, box-shadow 0.18s ease,
    border-color 0.18s ease, background 0.18s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: rgba($orange, 0.42);
    box-shadow: 0 14px 32px rgba($orange, 0.14);
  }

  &__txt {
    font-weight: 1100;
  }

  &__icon {
    filter: drop-shadow(0 10px 18px rgba($orange, 0.2));
  }

  &__spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.28);
    border-top-color: rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  &--done {
    border-color: rgba(255, 255, 255, 0.16);
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.82);
  }

  &--err {
    border-color: rgba($danger, 0.6);
    background: rgba($danger, 0.12);
  }

  &--disabled {
    opacity: 0.55;
    cursor: not-allowed;
    pointer-events: none;
    transform: none !important;
    box-shadow: none !important;
  }

  &--loading {
    cursor: wait;
  }
}

.upload-hint {
  margin-top: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.62);
  font-weight: 900;
  text-align: center;
  position: relative;
  z-index: 2;
}

.images-grid {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  position: relative;
  z-index: 2;
}

.image-item {
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(0, 0, 0, 0.25);
  aspect-ratio: 1;
  transition: transform 0.18s ease, border-color 0.18s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: rgba($orange, 0.3);
  }

  &__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transform: scale(1.02);
  }

  &__shade {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(
      220px 220px at 20% 0%,
      rgba($orange, 0.14),
      transparent 60%
    );
    opacity: 0.6;
  }

  &__remove {
    position: absolute;
    top: 8px;
    left: 8px;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: 1px solid rgba($danger, 0.35);
    background: rgba($danger, 0.22);
    color: $danger;
    font-size: 16px;
    cursor: pointer;
    display: grid;
    place-items: center;
    z-index: 3;
    transition: transform 0.16s ease, background 0.16s ease,
      border-color 0.16s ease;

    &:hover {
      transform: scale(1.06);
      background: rgba($danger, 0.35);
      border-color: rgba($danger, 0.6);
    }
  }
}

/* =========
     Location
     ========= */
.block--location {
  min-height: 200px;
}

.location-content {
  display: grid;
  gap: 12px;
  position: relative;
  z-index: 2;
}

.location-headline {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  color: rgba(255, 255, 255, 0.72);
  font-weight: 1000;
  font-size: 12px;

  &__icon {
    filter: drop-shadow(0 10px 18px rgba($orange, 0.18));
  }
}

.location-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 34px 18px;
  min-height: 200px;
  gap: 14px;
}

.location-loading__spinner {
  width: 62px;
  height: 62px;
  position: relative;

  .spinner {
    width: 100%;
    height: 100%;
    border: 4px solid rgba($orange, 0.18);
    border-top-color: $orange;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
}

.location-loading__text {
  font-size: 16px;
  font-weight: 1200;
  color: $text;
  margin: 0;
  text-align: center;
}

.location-loading__subtext {
  font-size: 13px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.62);
  margin: 0;
  text-align: center;
}

.house-number-input .input-small {
  padding: 12px 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  font-size: 15px;
  font-weight: 900;
}

.selected-location {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 14px;
  background: rgba($orange, 0.1);
  border: 1px solid rgba($orange, 0.26);
}

.selected-location__content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.selected-location__text {
  color: $text;
  font-weight: 1000;
  font-size: 15px;
  flex: 1;
  min-width: 0;
}

.selected-location__badge {
  font-size: 10px;
  font-weight: 1200;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba($orange, 0.16);
  color: $orange3;
}

.selected-location__change {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: $text;
  padding: 7px 12px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 900;
  cursor: pointer;
  transition: transform 0.18s ease, background 0.18s ease,
    border-color 0.18s ease;

  &:hover {
    transform: translateY(-1px);
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba($orange, 0.25);
  }
}

.improve-location-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid rgba($orange, 0.36);
  background: rgba($orange, 0.14);
  color: $orange2;
  font-weight: 1000;
  font-size: 13px;
  cursor: pointer;
  transition: transform 0.18s ease, background 0.18s ease,
    border-color 0.18s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    background: rgba($orange, 0.2);
    border-color: rgba($orange, 0.52);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.location-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.location-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 14px;
  font-weight: 1100;
  font-size: 15px;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease,
    border-color 0.18s ease;
  border: none;
  min-height: 52px;

  &__icon,
  &__spinner {
    font-size: 18px;
  }

  &__spinner {
    animation: spin 1s linear infinite;
  }

  &__text {
    white-space: nowrap;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    pointer-events: none;
  }
}

.location-btn--map {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.92);

  &:hover {
    transform: translateY(-1px);
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba($orange, 0.22);
    box-shadow: 0 16px 30px rgba(0, 0, 0, 0.25);
  }
}

.location-btn--gps {
  background: linear-gradient(135deg, $orange, $orange2);
  color: #111;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 18px 34px rgba($orange, 0.22);
  }
}

/* =========
     Urgent Row
     ========= */
.urgentRow {
  width: 100%;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(0, 0, 0, 0.18);
  padding: 12px 12px;
  color: $text;
  font-weight: 1100;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  position: relative;
  z-index: 2;
  transition: transform 0.18s ease, border-color 0.18s ease,
    background 0.18s ease, box-shadow 0.18s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: rgba($orange, 0.25);
    box-shadow: 0 14px 28px rgba(0, 0, 0, 0.25);
  }
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
  border-color: rgba($danger, 0.5);
  background: rgba($danger, 0.12);
  box-shadow: 0 18px 34px rgba($danger, 0.1);

  .toggleDot {
    background: $orange;
    box-shadow: 0 0 0 4px rgba($orange, 0.18);
    border-color: rgba($orange, 0.85);
  }
}

.urgentRow__right {
  color: rgba(255, 255, 255, 0.82);
  font-weight: 1100;
  white-space: nowrap;
}

.chev {
  opacity: 0.7;
  margin-right: 6px;
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
  position: relative;
  z-index: 2;

  &--warn {
    border-color: rgba($danger, 0.3);
    background: rgba($danger, 0.1);
  }
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

/* =========
     Step Actions Buttons
     ========= */
.step-actions {
  display: flex;
  gap: 12px;
  margin-top: 18px;
}

/* Next Step Button — elegant, less "in your face" */
.next-step-btn {
  /* sizing */
  flex: 1;
  width: 100%;
  min-height: 52px;
  padding: 14px 16px;
  border-radius: 14px;

  /* calmer orange */
  background: linear-gradient(
    180deg,
    rgba(255, 106, 0, 0.22),
    rgba(255, 106, 0, 0.12)
  );
  border: 1px solid rgba(255, 106, 0, 0.32);

  /* typography */
  color: rgba(255, 255, 255, 0.9);
  font-weight: 1050;
  font-size: 16px;
  letter-spacing: 0.2px;

  /* feel */
  cursor: pointer;
  transition: transform 0.16s ease, box-shadow 0.16s ease, background 0.16s ease,
    border-color 0.16s ease, color 0.16s ease;
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.35);
  outline: none;

  /* layout */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  /* subtle highlight (not spotlight) */
  position: relative;
  overflow: hidden;

  &::after {
    content: "";
    position: absolute;
    inset: -1px;
    background: radial-gradient(
      420px 140px at 30% 0%,
      rgba(255, 255, 255, 0.12),
      transparent 60%
    );
    opacity: 0.35;
    pointer-events: none;
  }

  &:hover {
    transform: translateY(-1px);
    background: linear-gradient(
      180deg,
      rgba(255, 106, 0, 0.26),
      rgba(255, 106, 0, 0.14)
    );
    border-color: rgba(255, 106, 0, 0.42);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.42);
    color: rgba(255, 255, 255, 0.94);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 10px 22px rgba(0, 0, 0, 0.38);
  }

  /* Focus — minimal, classy (not a big glowing ring) */
  &:focus-visible {
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.42),
      0 0 0 3px rgba(255, 106, 0, 0.14);
    border-color: rgba(255, 106, 0, 0.5);
  }

  /* Disabled */
  &:disabled,
  &.is-disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.28);
    border-color: rgba(255, 255, 255, 0.16);
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.6);

    &::after {
      opacity: 0.12;
    }
  }

  /* optional small icon */
  .icon {
    font-size: 18px;
    opacity: 0.9;
    transform: translateY(0.5px);
  }
}

/* If you want it NOT full-width sometimes */
.next-step-btn--fit {
  width: auto;
  min-width: 180px;
}

/* If you want it to be even calmer on screens with a lot of orange */
.next-step-btn--soft {
  background: linear-gradient(
    180deg,
    rgba(255, 106, 0, 0.16),
    rgba(255, 106, 0, 0.08)
  );
  border-color: rgba(255, 106, 0, 0.26);

  &:hover {
    background: linear-gradient(
      180deg,
      rgba(255, 106, 0, 0.2),
      rgba(255, 106, 0, 0.1)
    );
    border-color: rgba(255, 106, 0, 0.34);
  }
}

.back-btn,
.submit-btn {
  flex: 1;
  padding: 16px 24px;
  border-radius: 14px;
  font-weight: 1100;
  font-size: 16px;
  cursor: pointer;
  border: none;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.submit-btn {
  background: linear-gradient(135deg, $orange, $orange2);
  color: #111;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 20px 34px rgba($orange, 0.22);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
}

.back-btn {
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  border: 1px solid rgba(255, 255, 255, 0.12);

  &:hover {
    transform: translateY(-1px);
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba($orange, 0.2);
  }
}

/* =========
     Loading Screen (AI search)
     ========= */
.loading-screen {
  position: fixed;
  inset: 0;
  background: rgba(10, 11, 16, 0.94);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;

  &__inner {
    width: 100%;
    max-width: 420px;
    border-radius: 22px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.06),
      rgba(255, 255, 255, 0.03)
    );
    box-shadow: $shadow, $shadowOrange;
    padding: 22px 18px;
    display: grid;
    gap: 18px;
    place-items: center;
    position: relative;
    overflow: hidden;

    &::before {
      content: "";
      position: absolute;
      inset: -2px;
      background: radial-gradient(
        520px 220px at 20% 0%,
        rgba($orange, 0.22),
        transparent 60%
      );
      opacity: 0.6;
      pointer-events: none;
    }
  }

  &__copy {
    text-align: center;
    position: relative;
    z-index: 2;
  }

  &__hint {
    position: relative;
    z-index: 2;
  }
}

.loading-text {
  color: $text;
  font-size: 18px;
  font-weight: 1200;
  margin: 0;
}

.loading-subtext {
  margin: 8px 0 0;
  color: rgba(255, 255, 255, 0.62);
  font-size: 13px;
  font-weight: 900;
}

.hint-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid rgba($orange, 0.25);
  background: rgba($orange, 0.1);
  color: $orange3;
  font-size: 12px;
  font-weight: 1000;
}

/* Patience Message */
.patience-message {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  z-index: 2;
}

.patience-message__content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  background: linear-gradient(135deg, rgba($orange, 0.16), rgba($orange2, 0.1));
  border: 1px solid rgba($orange, 0.3);
  border-radius: 14px;
  box-shadow: 0 14px 34px rgba($orange, 0.16);
}

.patience-message__icon {
  font-size: 20px;
  animation: pulseIcon 1.5s ease-in-out infinite;
}

.patience-message__text {
  color: $orange3;
  font-size: 14px;
  font-weight: 1100;
  letter-spacing: 0.2px;
}

@keyframes pulseIcon {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.08);
    opacity: 0.8;
  }
}

.patience-message-enter-active {
  animation: slideInUp 0.35s ease-out;
}
.patience-message-leave-active {
  animation: slideOutDown 0.35s ease-in;
}
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(18px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
@keyframes slideOutDown {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(18px) scale(0.98);
  }
}

/* Loading Spinner (squares) */
.loadingspinner {
  --square: 26px;
  --offset: 30px;
  --duration: 2.4s;
  --delay: 0.2s;
  --timing-function: ease-in-out;
  --in-duration: 0.4s;
  --in-delay: 0.1s;
  --in-timing-function: ease-out;
  width: calc(3 * var(--offset) + var(--square));
  height: calc(2 * var(--offset) + var(--square));
  position: relative;
  margin: 6px auto 10px;
  z-index: 2;
}

.loadingspinner div {
  display: inline-block;
  background: $orange;
  border: none;
  border-radius: 4px;
  width: var(--square);
  height: var(--square);
  position: absolute;
}

.loadingspinner #square1 {
  left: calc(0 * var(--offset));
  top: calc(0 * var(--offset));
  animation: square1 var(--duration) var(--delay) var(--timing-function)
      infinite,
    squarefadein var(--in-duration) calc(1 * var(--in-delay))
      var(--in-timing-function) both;
}

.loadingspinner #square2 {
  left: calc(0 * var(--offset));
  top: calc(1 * var(--offset));
  animation: square2 var(--duration) var(--delay) var(--timing-function)
      infinite,
    squarefadein var(--in-duration) calc(1 * var(--in-delay))
      var(--in-timing-function) both;
}

.loadingspinner #square3 {
  left: calc(1 * var(--offset));
  top: calc(1 * var(--offset));
  animation: square3 var(--duration) var(--delay) var(--timing-function)
      infinite,
    squarefadein var(--in-duration) calc(2 * var(--in-delay))
      var(--in-timing-function) both;
}

.loadingspinner #square4 {
  left: calc(2 * var(--offset));
  top: calc(1 * var(--offset));
  animation: square4 var(--duration) var(--delay) var(--timing-function)
      infinite,
    squarefadein var(--in-duration) calc(3 * var(--in-delay))
      var(--in-timing-function) both;
}

.loadingspinner #square5 {
  left: calc(3 * var(--offset));
  top: calc(1 * var(--offset));
  animation: square5 var(--duration) var(--delay) var(--timing-function)
      infinite,
    squarefadein var(--in-duration) calc(4 * var(--in-delay))
      var(--in-timing-function) both;
}

@keyframes square1 {
  0% {
    left: calc(0 * var(--offset));
    top: calc(0 * var(--offset));
  }
  8.333% {
    left: calc(0 * var(--offset));
    top: calc(1 * var(--offset));
  }
  100% {
    left: calc(0 * var(--offset));
    top: calc(1 * var(--offset));
  }
}

@keyframes square2 {
  0% {
    left: calc(0 * var(--offset));
    top: calc(1 * var(--offset));
  }
  8.333% {
    left: calc(0 * var(--offset));
    top: calc(2 * var(--offset));
  }
  16.67% {
    left: calc(1 * var(--offset));
    top: calc(2 * var(--offset));
  }
  25% {
    left: calc(1 * var(--offset));
    top: calc(1 * var(--offset));
  }
  83.33% {
    left: calc(1 * var(--offset));
    top: calc(1 * var(--offset));
  }
  91.67% {
    left: calc(1 * var(--offset));
    top: calc(0 * var(--offset));
  }
  100% {
    left: calc(0 * var(--offset));
    top: calc(0 * var(--offset));
  }
}

@keyframes square3 {
  0%,
  100% {
    left: calc(1 * var(--offset));
    top: calc(1 * var(--offset));
  }
  16.67% {
    left: calc(1 * var(--offset));
    top: calc(1 * var(--offset));
  }
  25% {
    left: calc(1 * var(--offset));
    top: calc(0 * var(--offset));
  }
  33.33% {
    left: calc(2 * var(--offset));
    top: calc(0 * var(--offset));
  }
  41.67% {
    left: calc(2 * var(--offset));
    top: calc(1 * var(--offset));
  }
  66.67% {
    left: calc(2 * var(--offset));
    top: calc(1 * var(--offset));
  }
  75% {
    left: calc(2 * var(--offset));
    top: calc(2 * var(--offset));
  }
  83.33% {
    left: calc(1 * var(--offset));
    top: calc(2 * var(--offset));
  }
  91.67% {
    left: calc(1 * var(--offset));
    top: calc(1 * var(--offset));
  }
}

@keyframes square4 {
  0% {
    left: calc(2 * var(--offset));
    top: calc(1 * var(--offset));
  }
  33.33% {
    left: calc(2 * var(--offset));
    top: calc(1 * var(--offset));
  }
  41.67% {
    left: calc(2 * var(--offset));
    top: calc(2 * var(--offset));
  }
  50% {
    left: calc(3 * var(--offset));
    top: calc(2 * var(--offset));
  }
  58.33% {
    left: calc(3 * var(--offset));
    top: calc(1 * var(--offset));
  }
  100% {
    left: calc(3 * var(--offset));
    top: calc(1 * var(--offset));
  }
}

@keyframes square5 {
  0% {
    left: calc(3 * var(--offset));
    top: calc(1 * var(--offset));
  }
  50% {
    left: calc(3 * var(--offset));
    top: calc(1 * var(--offset));
  }
  58.33% {
    left: calc(3 * var(--offset));
    top: calc(0 * var(--offset));
  }
  66.67% {
    left: calc(2 * var(--offset));
    top: calc(0 * var(--offset));
  }
  75% {
    left: calc(2 * var(--offset));
    top: calc(1 * var(--offset));
  }
  100% {
    left: calc(2 * var(--offset));
    top: calc(1 * var(--offset));
  }
}

@keyframes squarefadein {
  0% {
    transform: scale(0.75);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* =========
     Handymen Results Screen
     ========= */
.handymen-results-screen {
  position: fixed;
  inset: 0;
  background: radial-gradient(
      800px 500px at 20% 0%,
      rgba($orange, 0.14),
      transparent 60%
    ),
    linear-gradient(180deg, $bg, $bg2);
  z-index: 10000;
  display: flex;
  flex-direction: column;
  padding: 18px;
  overflow-y: auto;
}

.handymen-results-shell {
  max-width: 440px;
  width: 100%;
  margin: 0 auto;
  padding-bottom: 30px;
}

.handymen-results-header {
  text-align: center;
  margin-bottom: 18px;
  padding-top: 44px;
  position: relative;
}

.handymen-results-back {
  position: absolute;
  top: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: $text;
  font-size: 14px;
  cursor: pointer;
  padding: 10px 12px;
  border-radius: 14px;
  transition: transform 0.18s ease, background 0.18s ease,
    border-color 0.18s ease;
  display: inline-flex;
  align-items: center;
  gap: 10px;

  &__icon {
    color: $orange3;
    font-weight: 1200;
  }

  &:hover {
    transform: translateY(-1px);
    background: rgba(255, 255, 255, 0.07);
    border-color: rgba($orange, 0.22);
  }
}

.handymen-results-hero {
  display: grid;
  gap: 10px;
  padding: 14px 12px 6px;
}

.hero-badge {
  justify-self: center;
  padding: 7px 12px;
  border-radius: 999px;
  border: 1px solid rgba($ok, 0.35);
  background: rgba($ok, 0.12);
  color: rgba(210, 255, 232, 0.95);
  font-weight: 1200;
  font-size: 12px;
  letter-spacing: 0.2px;
}

.hero-title {
  font-size: 22px;
  font-weight: 1200;
  color: $text;
  margin: 0;
}

.hero-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  font-weight: 900;
}

.handymen-list {
  display: grid;
  gap: 12px;
  width: 100%;
  margin: 0 auto;
  padding: 10px 0 18px;
}

.handyman-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 18px;
  padding: 14px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  opacity: 0;
  transform: translateY(18px);
  animation: slideUpFadeIn 0.48s ease-out forwards;
  transition: transform 0.18s ease, background 0.18s ease,
    border-color 0.18s ease;
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.35);

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba($orange, 0.28);
    transform: translateY(-2px);
  }

  &__image {
    width: 62px;
    height: 62px;
    border-radius: 16px;
    overflow: hidden;
    flex-shrink: 0;
    border: 2px solid rgba($orange, 0.28);
    position: relative;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transform: scale(1.03);
    }
  }

  &__ring {
    position: absolute;
    inset: -10px;
    border-radius: 22px;
    border: 2px solid rgba($orange, 0.18);
    filter: blur(0.2px);
    opacity: 0.7;
    pointer-events: none;
  }

  &__content {
    min-width: 0;
  }

  &__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 8px;
  }

  &__name {
    font-size: 16px;
    font-weight: 1200;
    color: $text;
    margin: 0;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__chip {
    font-size: 11px;
    font-weight: 1000;
    color: rgba(255, 255, 255, 0.78);
    padding: 6px 10px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.14);
    background: rgba(0, 0, 0, 0.18);
    white-space: nowrap;
  }

  &__meta {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__rating {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.84);
    font-weight: 1000;

    .star {
      font-size: 15px;
    }
    .val {
      color: $orange3;
      font-weight: 1200;
    }
    .count {
      color: rgba(255, 255, 255, 0.62);
      font-weight: 900;
    }
  }

  &__cta {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    color: rgba(255, 255, 255, 0.72);
    font-size: 12px;
    font-weight: 1000;

    .cta-dot {
      width: 8px;
      height: 8px;
      border-radius: 999px;
      background: rgba($orange, 0.9);
      box-shadow: 0 0 0 4px rgba($orange, 0.14);
    }
  }

  &__chev {
    font-size: 26px;
    color: rgba(255, 255, 255, 0.45);
    padding-left: 6px;
  }
}

@keyframes slideUpFadeIn {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.handymen-results-footer {
  margin-top: 6px;
}

.footer-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-radius: 16px;
  border: 1px solid rgba($orange, 0.2);
  background: rgba($orange, 0.08);
  padding: 12px 12px;
  color: rgba(255, 255, 255, 0.78);
  font-weight: 1000;
  font-size: 13px;

  &__icon {
    filter: drop-shadow(0 10px 18px rgba($orange, 0.16));
  }
}

/* =========
     Credit Card - nice header
     ========= */
.pay-hero {
  text-align: center;
  display: grid;
  gap: 6px;
  margin-bottom: 8px;

  &__badge {
    justify-self: center;
    padding: 7px 12px;
    border-radius: 999px;
    border: 1px solid rgba($orange, 0.28);
    background: rgba($orange, 0.12);
    color: $orange3;
    font-weight: 1200;
    font-size: 12px;
  }

  &__title {
    font-size: 18px;
    font-weight: 1200;
    color: $text;
  }

  &__sub {
    font-size: 12px;
    font-weight: 900;
    color: rgba(255, 255, 255, 0.62);
  }
}

/* Payment method wrapper */
.saved-payment-method-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  margin-bottom: 24px;
  padding: 18px 0;
}

.payment-method-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 40px 20px;
  min-height: 200px;

  p {
    color: rgba(255, 255, 255, 0.8);
    font-size: 16px;
    font-weight: 900;
    margin: 0;
  }
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba($orange, 0.18);
  border-top-color: $orange;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* =========
     Flip Card (your existing structure, styled)
     ========= */
.flip-card {
  background-color: transparent;
  width: 100%;
  max-width: 320px;
  height: 200px;
  perspective: 1000px;
  color: white;
}

.flip-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  text-align: center;
  transition: transform 0.8s;
  transform-style: preserve-3d;
}

.flip-card:hover .flip-card-inner {
  transform: rotateY(180deg);
}

.flip-card-front,
.flip-card-back {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-radius: 18px;
  backface-visibility: hidden;
  overflow: hidden;
}

.flip-card-front {
  background: linear-gradient(145deg, #14141a, #0f0f14);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.55), 0 18px 44px rgba($orange, 0.14);
}

.flip-card-back {
  background: linear-gradient(145deg, #14141a, #0f0f14);
  border: 1px solid rgba(255, 255, 255, 0.12);
  transform: rotateY(180deg);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.55);
}

.card-shine {
  position: absolute;
  inset: -40%;
  background: radial-gradient(
    420px 220px at 30% 30%,
    rgba($orange, 0.22),
    transparent 60%
  );
  opacity: 0.55;
  pointer-events: none;
}

.heading_8264 {
  position: absolute;
  letter-spacing: 0.2em;
  font-size: 0.9em;
  top: 2em;
  left: 18.6em;
  font-weight: 900;
  text-transform: uppercase;
  color: $orange;
}

.logo {
  position: absolute;
  top: 6.8em;
  left: 11.7em;
}

.chip {
  position: absolute;
  top: 2.3em;
  left: 1.5em;
}

.contactless {
  position: absolute;
  top: 3.5em;
  left: 12.4em;
}

.number {
  position: absolute;
  font-weight: bold;
  font-size: 1em;
  top: 8.3em;
  left: 1.6em;
  letter-spacing: 0.1em;
  font-family: "Courier New", monospace;
  color: $orange;
}

.valid_thru {
  position: absolute;
  font-weight: bold;
  top: 12.5em;
  font-size: 0.5em;
  left: 3.2em;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.7);
}

.date_8264 {
  position: absolute;
  font-weight: bold;
  font-size: 0.8em;
  top: 13.6em;
  left: 3.2em;
  font-family: "Courier New", monospace;
  color: $orange;
}

.name {
  position: absolute;
  font-weight: bold;
  font-size: 0.8em;
  top: 16.1em;
  left: 2em;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: $orange;
}

.strip {
  position: absolute;
  width: 15em;
  height: 1.5em;
  top: 2.4em;
  background: repeating-linear-gradient(
    45deg,
    #303030,
    #303030 10px,
    #202020 10px,
    #202020 20px
  );
}

.mstrip {
  position: absolute;
  background-color: rgb(255, 255, 255);
  width: 8em;
  height: 0.8em;
  top: 5em;
  left: 0.8em;
  border-radius: 2.5px;
}

.sstrip {
  position: absolute;
  background-color: rgb(255, 255, 255);
  width: 4.1em;
  height: 0.8em;
  top: 5em;
  left: 10em;
  border-radius: 2.5px;
}

.code {
  font-weight: bold;
  text-align: center;
  margin: 0.2em;
  color: black;
  font-size: 0.8em;
}

.payment-method-actions {
  display: flex;
  gap: 12px;

  .btn {
    flex: 1;
    padding: 14px 24px;
    border-radius: 12px;
    font-weight: 1000;
    font-size: 16px;
    cursor: pointer;
    transition: transform 0.18s ease, box-shadow 0.18s ease,
      background 0.18s ease, border-color 0.18s ease;
    border: none;

    &--primary {
      background: linear-gradient(135deg, $orange, $orange2);
      color: #000;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 18px 34px rgba($orange, 0.22);
      }
    }

    &--secondary {
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.92);
      border: 1px solid rgba(255, 255, 255, 0.16);

      &:hover {
        transform: translateY(-1px);
        background: rgba(255, 255, 255, 0.12);
        border-color: rgba($orange, 0.18);
      }
    }
  }

  @media (max-width: 768px) {
    flex-direction: column;
  }
}

/* =========
     Modals
     ========= */
.map-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.86);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

.map-modal__content {
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.07),
    rgba(255, 255, 255, 0.04)
  );
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: $shadow, $shadowOrange;
}

.map-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 1200;
    color: $text;
  }
}

.map-modal__close {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: transform 0.18s ease, background 0.18s ease,
    border-color 0.18s ease;

  &:hover {
    transform: translateY(-1px);
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba($orange, 0.18);
  }
}

.map-modal__map {
  width: 100%;
  height: 400px;
  min-height: 300px;
  flex: 1;
  position: relative;
  background: rgba(0, 0, 0, 0.25);
}

.map-modal__footer {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.map-modal__btn {
  flex: 1;
  padding: 14px 20px;
  border-radius: 14px;
  font-weight: 1100;
  font-size: 15px;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
  border: none;

  &--cancel {
    background: rgba(255, 255, 255, 0.07);
    color: $text;
    border: 1px solid rgba(255, 255, 255, 0.14);

    &:hover {
      transform: translateY(-1px);
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba($orange, 0.18);
    }
  }

  &--confirm {
    background: linear-gradient(135deg, $orange, $orange2);
    color: #111;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 18px 34px rgba($orange, 0.22);
    }
  }
}

/* Modal overlay (Split/Partial/Manual) */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.86);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100001;
  padding: 20px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.085),
    rgba(255, 255, 255, 0.055)
  );
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 22px;
  box-shadow: $shadow, $shadowOrange;
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
  direction: rtl;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(26px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 1200;
    color: $orange3;
    line-height: 1.3;
    flex: 1;
  }
}

.modal-close {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.85);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: transform 0.18s ease, background 0.18s ease,
    border-color 0.18s ease;
  flex-shrink: 0;
  margin-right: 10px;

  &:hover {
    transform: translateY(-1px);
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba($orange, 0.18);
    color: $orange3;
  }
}

.modal-body {
  padding: 18px 20px;
  flex: 1;
  overflow-y: auto;

  p {
    margin: 0 0 14px 0;
    font-size: 14px;
    font-weight: 900;
    color: rgba(255, 255, 255, 0.9);
    line-height: 1.55;

    &:last-of-type {
      margin-bottom: 0;
    }
  }

  .matched-subcategories-list {
    margin: 12px 0 0;

    .subcategory-item {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 900;
      color: rgba(255, 255, 255, 0.9);

      .subcategory-name-badge {
        display: inline-block;
        padding: 7px 10px;
        background: rgba($orange, 0.12);
        border: 1px solid rgba($orange, 0.22);
        border-radius: 10px;
        color: $orange3;
        font-weight: 1100;
        margin-right: 6px;
      }
    }
  }
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 18px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);

  @media (max-width: 768px) {
    flex-direction: column-reverse;
  }
}

.btn {
  flex: 1;
  padding: 14px 20px;
  border-radius: 14px;
  font-weight: 1100;
  font-size: 15px;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease,
    border-color 0.18s ease;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;

  &--primary {
    background: linear-gradient(135deg, $orange, $orange2);
    color: #111;
    box-shadow: 0 14px 28px rgba($orange, 0.18);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 18px 34px rgba($orange, 0.22);
    }
  }

  &--secondary {
    background: rgba(255, 255, 255, 0.07);
    border: 1px solid rgba(255, 255, 255, 0.14);
    color: rgba(255, 255, 255, 0.92);

    &:hover {
      transform: translateY(-1px);
      background: rgba(255, 255, 255, 0.11);
      border-color: rgba($orange, 0.18);
    }
  }
}

/* Manual Category Selector */
.modal-content--large {
  max-width: 640px;
  max-height: 85vh;
}

.modal-body--scrollable {
  max-height: 60vh;
  overflow-y: auto;
  padding: 18px 20px;
}

.category-section {
  margin-bottom: 22px;
}

.category-section__title {
  margin: 0 0 12px 0;
  font-size: 18px;
  font-weight: 1200;
  color: $orange3;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba($orange, 0.25);
}

.subcategories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 10px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.subcategory-checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: transform 0.18s ease, background 0.18s ease,
    border-color 0.18s ease;
  position: relative;

  &:hover {
    transform: translateY(-1px);
    background: rgba($orange, 0.08);
    border-color: rgba($orange, 0.24);
  }
}

.subcategory-checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid $orange;
  border-radius: 6px;
  background-color: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  appearance: none;
  position: relative;

  &:hover {
    border-color: $orange2;
    box-shadow: 0 0 10px rgba($orange, 0.3);
  }

  &:checked {
    border-color: $orange2;
    background-color: rgba($orange, 0.2);
    box-shadow: 0 0 14px rgba($orange, 0.35);

    &::before {
      content: "✓";
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: $orange3;
      font-weight: 1200;
      font-size: 14px;
    }
  }
}

.subcategory-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.subcategory-name {
  font-size: 14px;
  font-weight: 1100;
  color: $text;
}

.subcategory-price {
  font-size: 12px;
  font-weight: 900;
  color: $orange3;
}

.subcat-pill {
  font-size: 10px;
  font-weight: 1100;
  padding: 5px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(0, 0, 0, 0.16);
  color: rgba(255, 255, 255, 0.78);
  white-space: nowrap;
}

/* =========
     Responsive
     ========= */
@media (max-width: 450px) {
  .shell {
    max-width: 100%;
    padding: 10px 10px calc(80px + env(safe-area-inset-bottom));
  }

  .step-container {
    max-height: calc(100vh - 210px);
    padding: 10px;
  }

  .step-indicator {
    padding: 14px 0 10px;
    gap: 6px;
  }

  .step-number {
    width: 36px;
    height: 36px;
    font-size: 14px;
  }

  .step-label {
    font-size: 11px;
  }

  .block {
    padding: 10px;
  }

  .topbar__title {
    font-size: 18px;
  }
}

@media (max-width: 600px) {
  .map-modal {
    padding: 0;
  }

  .map-modal__content {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }

  .map-modal__map {
    height: 50vh;
  }
}
</style>

<style>
/* Global CSS to hide Stripe developer/test buttons and iframes everywhere */
iframe[name*="__privateStripeFrame"],
iframe[name*="privateStripeFrame"],
iframe[src*="stripe.com"][src*="elements-inner"],
iframe[src*="stripe.com"][src*="easel"],
iframe[title*="מסגרת כלים למפתחי פס"],
iframe[title*="Stripe developer tools frame"],
iframe[src*="js.stripe.com"][name*="Stripe"],
iframe[role="presentation"][src*="stripe.com"],
.stripe-test-mode-badge,
[class*="__PrivateStripeElement"],
[class*="privateStripe"],
[id*="__privateStripe"],
[id*="privateStripe"] {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  pointer-events: none !important;
  width: 0 !important;
  height: 0 !important;
  min-width: 0 !important;
  min-height: 0 !important;
  max-width: 0 !important;
  max-height: 0 !important;
  position: absolute !important;
  left: -9999px !important;
  top: -9999px !important;
  right: -9999px !important;
  bottom: -9999px !important;
  z-index: -99999 !important;
  border: none !important;
  margin: 0 !important;
  padding: 0 !important;
  transform: scale(0) !important;
  overflow: hidden !important;
}
</style>
