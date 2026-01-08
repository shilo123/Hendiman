<template>
  <div class="create-call-page" dir="rtl">
    <!-- Loading Screen -->
    <div v-if="isLoading && !foundHandymen.length" class="loading-screen">
      <div class="loadingspinner">
        <div id="square1"></div>
        <div id="square2"></div>
        <div id="square3"></div>
        <div id="square4"></div>
        <div id="square5"></div>
      </div>
      <p class="loading-text">מחפש הנדימנים בעזרת AI</p>

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
    </div>

    <!-- Handymen Results Screen -->
    <div v-if="foundHandymen.length > 0" class="handymen-results-screen">
      <div class="handymen-results-header">
        <button
          class="handymen-results-back"
          type="button"
          @click="goBackToDashboard"
        >
          ← חזור לדשבורד
        </button>
        <h2>נמצאו {{ foundHandymen.length }} הנדימנים שמתאימים לכל התחומים</h2>
        <p class="handymen-results-subtitle">
          הקריאה נוצרה ומחכה לאישור של הנדימן
        </p>
      </div>
      <div class="handymen-list">
        <div
          v-for="(handyman, index) in foundHandymen"
          :key="handyman._id"
          class="handyman-card"
          :style="{ animationDelay: `${index * 0.15}s` }"
        >
          <div class="handyman-card__image">
            <img
              :src="handyman.imageUrl || 'https://via.placeholder.com/80'"
              :alt="handyman.username"
            />
          </div>
          <div class="handyman-card__content">
            <h3 class="handyman-card__name">{{ handyman.username }}</h3>
            <div class="handyman-card__info">
              <span v-if="handyman.city" class="handyman-card__city">
                📍 {{ handyman.city }}
              </span>
              <div class="handyman-card__rating" v-if="handyman.rating">
                <span>⭐</span>
                <span>{{ handyman.rating.toFixed(1) }}</span>
                <span v-if="handyman.jobDone"
                  >({{ handyman.jobDone }} עבודות)</span
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="shell">
      <!-- Top bar -->
      <header class="topbar">
        <button class="topbar__back" type="button" @click="goBack">←</button>
        <div class="topbar__center">
          <div class="topbar__title">צור קריאה</div>
        </div>
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
        <!-- STEP 1: Describe what needs to be done -->
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

              <input
                class="input-small"
                type="text"
                v-model="call.requests[0]"
                @input="clearError('requests')"
                placeholder="למשל: תליית מדף"
              />

              <div v-if="errors.requests" class="msg msg--err">
                {{ errors.requests }}
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
                >
                  ✕
                </button>
              </div>

              <button type="button" class="add-request-btn" @click="addRequest">
                ➕ הוסף בקשה נוספת
              </button>
            </section>
          </div>

          <button
            v-if="!isLoadingLocation"
            class="next-btn-animated"
            type="button"
            @click="nextStep"
          >
            <svg
              viewBox="0 0 320 512"
              height="1em"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"
              ></path>
            </svg>
            <span>שלב הבא</span>
          </button>
        </div>

        <!-- STEP 2: Expand details + Location -->
        <div
          v-if="currentStep === 2"
          class="step-content step-content--animated"
        >
          <div class="step-container">
            <!-- Loading Categories Card -->
            <section
              v-if="isLoadingCategories"
              class="block block--loading-categories"
            >
              <div class="loading-categories">
                <div class="loading-categories__spinner">
                  <div class="spinner-dot"></div>
                  <div class="spinner-dot"></div>
                  <div class="spinner-dot"></div>
                </div>
                <p class="loading-categories__text">
                  מחפש את התחומים הדרושים לך באמצעות AI
                </p>
              </div>
            </section>

            <!-- Found Categories Card -->
            <section
              v-else-if="foundCategories.length > 0"
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
                >
                  <div class="category-card__header">
                    <span class="category-card__name">
                      {{
                        category.subcategory ||
                        category.category ||
                        `תחום ${index + 1}`
                      }}
                    </span>
                    <span v-if="category.price" class="category-card__price">
                      {{ category.price }} ₪
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
                </div>
              </div>
            </section>

            <section class="block">
              <div class="block__head">
                <div class="block__label">הרחב להנדימן על התקלות</div>
              </div>

              <textarea
                class="textarea"
                v-model="call.desc"
                @input="clearError('desc')"
                rows="6"
                placeholder="תאר בפירוט את הבעיה, מה צריך לתקן, וכל מידע רלוונטי..."
              ></textarea>

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
                <!-- Loading indicator when searching for location -->
                <div v-if="isLoadingLocation" class="location-loading">
                  <div class="location-loading__spinner">
                    <div class="spinner"></div>
                  </div>
                  <p class="location-loading__text">מאתר מיקום מדויק...</p>
                  <p class="location-loading__subtext">
                    אנא המתן, זה עשוי לקחת מספר שניות
                  </p>
                </div>

                <!-- AddressAutocomplete - hidden when loading or when location is detected -->
                <div
                  v-if="
                    !selectedMapLocation &&
                    !isLoadingLocation &&
                    !detectedLocation
                  "
                  class="location-input-wrapper"
                >
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

                <!-- House number input - hidden when loading or when location is detected -->
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
                    placeholder="מספר בית\בלוק"
                    class="input-small"
                    :class="{ 'input-small--error': errors.houseNumber }"
                  />
                  <div v-if="errors.houseNumber" class="msg msg--err">
                    {{ errors.houseNumber }}
                  </div>
                </div>

                <div v-if="selectedMapLocation" class="selected-location">
                  <span class="selected-location__text"> מיקום נבחר במפה </span>
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

                <div
                  v-if="detectedLocation && usingMyLocation"
                  class="selected-location"
                >
                  <div class="selected-location__content">
                    <span class="selected-location__text">{{
                      detectedLocation
                    }}</span>
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
                  </div>
                  <button
                    v-if="!isImprovingLocation"
                    type="button"
                    class="improve-location-btn"
                    @click="improveLocation"
                  >
                    <span class="improve-location-btn__icon">🎯</span>
                    <span class="improve-location-btn__text"
                      >מיקום לא נכון? תן לנו למצוא את המיקום המדוייק</span
                    >
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
            <button class="next-btn-animated" type="button" @click="nextStep">
              <svg
                viewBox="0 0 320 512"
                height="1em"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"
                ></path>
              </svg>
              <span>שלב הבא</span>
            </button>
          </div>
        </div>

        <!-- STEP 3: Image + Urgent + Work Type + When + Cancel Note + Submit -->
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

              <!-- Images Grid -->
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
            </section>

            <section class="block">
              <div class="field">
                <div class="field__label">סוג עבודה</div>
                <select class="select" v-model="call.workType">
                  <option value="קלה">קלה</option>
                  <option value="מורכבת">מורכבת</option>
                  <option value="קשה">קשה</option>
                </select>
              </div>
            </section>

            <section class="block block--last">
              <div class="note note--warn">
                <span class="note__icon">⚠️</span>
                <span
                  >קנס על ביטול אחרי שקבלו את העבודה יכול להגיע עד:
                  <b>200</b> שקלות</span
                >
              </div>
            </section>
          </div>

          <div v-if="!isLoadingLocation" class="step-actions">
            <button class="back-btn" type="button" @click="prevStep">
              חזרה
            </button>
            <button class="next-btn-animated" type="button" @click="nextStep">
              <svg
                viewBox="0 0 320 512"
                height="1em"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"
                ></path>
              </svg>
              <span>שלב הבא</span>
            </button>
          </div>
        </div>

        <!-- STEP 4: Credit Card Details -->
        <div
          v-if="currentStep === 4"
          class="step-content step-content--animated"
        >
          <div class="step-container">
            <!-- Show loading state when fetching payment method details -->
            <div
              v-if="isLoadingPaymentMethod && paymentMethodId"
              class="saved-payment-method-wrapper"
            >
              <div class="payment-method-loading">
                <div class="loading-spinner"></div>
                <p>טוען פרטי כרטיס...</p>
              </div>
            </div>

            <!-- Show saved payment method option if exists -->
            <div
              v-else-if="savedPaymentMethod && !showChangePaymentMethod"
              class="saved-payment-method-wrapper"
            >
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
                      {{ savedPaymentMethod.card?.last4 || "****" }}
                      **** **** ****
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

            <!-- Show credit card form if no saved payment method or user wants to change -->
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
          <button class="map-modal__close" @click="closeMapPicker">×</button>
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
          <button class="modal-close" @click="showSplitCallModal = false">
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
          <button class="modal-close" @click="showPartialMatchModal = false">
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
              <strong class="subcategory-name-badge">{{
                getSubcategoryName(subcat)
              }}</strong>
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
      let total = 0;
      if (
        this.subcategoryInfoArray &&
        Array.isArray(this.subcategoryInfoArray)
      ) {
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
          console.error("Error in reverse geocoding:", geocodeError);
          this.detectedLocation = "מיקום שנמצא";
          this.call.location = "מיקום שנמצא";
          this.clearError("location"); // Clear any validation errors
        }
      } catch (error) {
        console.error("Error getting location:", error);
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
          console.error("Error in reverse geocoding:", geocodeError);
          this.detectedLocation = "מיקום שנמצא";
          this.call.location = "מיקום שנמצא";
          this.clearError("location");
          this.toast?.showSuccess("מיקום עודכן בהצלחה!");
        }
      } catch (error) {
        console.error("Error improving location:", error);
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

      try {
        const validRequests = this.call.requests.filter(
          (r) => r && r.trim().length > 0
        );

        const response = await axios.post(
          `${URL}/Get-categor-ofOpenAI`,
          { requests: validRequests },
          {
            headers: { "Content-Type": "application/json" },
          }
        );

        if (response.data.success && response.data.subcategories) {
          this.subcategoryInfoArray = response.data.subcategories;
          this.foundCategories = response.data.subcategories;
        } else {
          this.toast?.showError(
            response.data.message || "לא מצאנו בשבילך תחומים מתאימים"
          );
        }
      } catch (error) {
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
      this.currentStep = 1;
      // Keep the requests as they were (they're already in call.requests)
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
$bg: #0b0b0f;
$bg2: #0f1016;
$stroke: rgba(255, 255, 255, 0.1);
$text: rgba(255, 255, 255, 0.92);
$muted: rgba(255, 255, 255, 0.62);
$orange: #ff6a00;
$orange2: #ff8a2b;
$orange3: #ffb36b;
$danger: #ff3b3b;

.create-call-page {
  min-height: 100vh;
  background: linear-gradient(180deg, $bg, $bg2);
}

.shell {
  max-width: 400px;
  width: 100%;
  margin: 0 auto;
  padding: 14px 14px calc(96px + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

/* Loading Screen */
.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 16, 22, 0.95);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.loading-text {
  color: $text;
  font-size: 18px;
  font-weight: 1100;
  margin-top: 20px;
}

/* Patience Message */
.patience-message {
  margin-top: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.patience-message__content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 24px;
  background: linear-gradient(135deg, rgba($orange, 0.15), rgba($orange2, 0.1));
  border: 1px solid rgba($orange, 0.3);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba($orange, 0.2);
  backdrop-filter: blur(8px);
}

.patience-message__icon {
  font-size: 20px;
  animation: pulse 1.5s ease-in-out infinite;
}

.patience-message__text {
  color: $orange3;
  font-size: 15px;
  font-weight: 900;
  letter-spacing: 0.3px;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

/* Patience Message Transitions */
.patience-message-enter-active {
  animation: slideInUp 0.4s ease-out;
}

.patience-message-leave-active {
  animation: slideOutDown 0.4s ease-in;
}

.patience-message-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.patience-message-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
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
    transform: translateY(20px) scale(0.95);
  }
}

/* Loading Spinner */
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
  padding: 0px;
  margin-left: auto;
  margin-right: auto;
  margin-top: 10px;
  margin-bottom: 30px;
  position: relative;
}

.loadingspinner div {
  display: inline-block;
  background: darkorange;
  border: none;
  border-radius: 2px;
  width: var(--square);
  height: var(--square);
  position: absolute;
  padding: 0px;
  margin: 0px;
  font-size: 6pt;
  color: black;
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
  25.00% {
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
  25.00% {
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
  75.00% {
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
  50.00% {
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
  50.00% {
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
  75.00% {
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

/* Handymen Results Screen */
.handymen-results-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: $bg;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow-y: auto;
}

.handymen-results-header {
  text-align: center;
  margin-bottom: 24px;
  padding-top: 40px;
  position: relative;
}

.handymen-results-back {
  position: absolute;
  top: 0;
  right: 0;
  background: transparent;
  border: none;
  color: $text;
  font-size: 16px;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 8px;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.handymen-results-back:hover {
  background: rgba(255, 255, 255, 0.1);
}

.handymen-results-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: $text;
  margin: 0 0 8px 0;
}

.handymen-results-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

.handymen-list {
  display: grid;
  gap: 16px;
  max-width: 400px;
  width: 100%;
  margin: 0 auto;
  padding-bottom: 40px;
}

.handyman-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  opacity: 0;
  transform: translateY(20px);
  animation: slideUpFadeIn 0.5s ease-out forwards;
  transition: all 0.2s;
}

.handyman-card:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 159, 28, 0.3);
  transform: translateY(-2px);
}

@keyframes slideUpFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.handyman-card__image {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
  border: 2px solid rgba(255, 159, 28, 0.3);
}

.handyman-card__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.handyman-card__content {
  flex: 1;
  min-width: 0;
}

.handyman-card__name {
  font-size: 18px;
  font-weight: 700;
  color: $text;
  margin: 0 0 8px 0;
}

.handyman-card__info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.handyman-card__city {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.handyman-card__rating {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 600;
}

.handyman-card__rating span:first-child {
  font-size: 16px;
}

/* Topbar */
.topbar {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 10px;
  padding: 10px 0 12px;
}

.topbar__back {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  border: 1px solid $stroke;
  background: rgba(255, 255, 255, 0.04);
  color: $text;
  font-weight: 1000;
  cursor: pointer;
}

.topbar__center {
  min-width: 0;
}

.topbar__title {
  font-size: 20px;
  font-weight: 1100;
  color: $text;
  line-height: 1.2;
}

/* Step Indicator */
.step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px 0;
  margin-bottom: 20px;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 1100;
  font-size: 16px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: $muted;
  transition: all 0.3s;
}

.step-item.active .step-number {
  border-color: $orange;
  background: rgba($orange, 0.2);
  color: $orange;
}

.step-item.completed .step-number {
  border-color: $orange;
  background: linear-gradient(135deg, $orange, $orange2);
  color: #111;
}

.step-label {
  font-size: 12px;
  font-weight: 900;
  color: $muted;
  transition: all 0.3s;
}

.step-item.active .step-label {
  color: $text;
}

.step-line {
  flex: 1;
  height: 2px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0 10px;
  transition: all 0.3s;
}

.step-line.active {
  background: linear-gradient(90deg, $orange, $orange2);
}

/* Content */
.content {
  display: grid;
  gap: 12px;
  min-height: 0; /* Allow flex children to shrink */
}

.step-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: slideIn 0.4s ease-out;
  min-height: 0; /* Allow flex children to shrink */
}

.step-content--animated {
  animation: slideIn 0.4s ease-out;
}

/* Step Container - wraps all sections in a scrollable card */
.step-container {
  border: 1px solid $stroke;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.03);
  padding: 12px;
  display: grid;
  gap: 12px;
  max-height: calc(100vh - 250px);
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;
}

/* Custom scrollbar for step container */
.step-container::-webkit-scrollbar {
  width: 6px;
}

.step-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.step-container::-webkit-scrollbar-thumb {
  background: rgba($orange, 0.5);
  border-radius: 10px;
}

.step-container::-webkit-scrollbar-thumb:hover {
  background: rgba($orange, 0.7);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Loading Categories */
.block--loading-categories {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.loading-categories {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.loading-categories__spinner {
  display: flex;
  gap: 8px;
}

.spinner-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: $orange;
  animation: pulse 1.4s ease-in-out infinite;
}

.spinner-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.spinner-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

.loading-categories__text {
  color: $text;
  font-weight: 1000;
  font-size: 15px;
  text-align: center;
}

/* Found Categories */
.block--found-categories {
  background: rgba($orange, 0.1);
  border-color: rgba($orange, 0.3);
}

.categories-list {
  display: grid;
  gap: 12px;
  margin-top: 12px;
}

.category-card {
  padding: 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s;
}

.category-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba($orange, 0.4);
}

.category-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.category-card__name {
  color: $text;
  font-weight: 1100;
  font-size: 15px;
  flex: 1;
}

.category-card__price {
  color: $orange;
  font-weight: 1200;
  font-size: 16px;
  background: rgba($orange, 0.15);
  padding: 4px 10px;
  border-radius: 8px;
}

.category-card__details {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
}

.category-card__category,
.category-card__work-type {
  color: rgba(255, 255, 255, 0.7);
  font-weight: 900;
}

.block {
  border: 1px solid $stroke;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.03);
  padding: 12px;
  min-height: 120px; /* Consistent minimum height for all blocks */
  display: flex;
  flex-direction: column;
}

.block--last {
  padding-bottom: 14px;
}

.block__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
  position: relative;
}

.block--requests .block__head {
  align-items: flex-start;
}

.block__label {
  font-size: 13px;
  font-weight: 1100;
  color: $text;
}

.block__refine-btn {
  font-size: 11px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.7);
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 6px 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  margin-top: 4px;

  &:hover {
    color: $orange3;
    border-color: rgba($orange, 0.3);
    background: rgba($orange, 0.1);
  }

  @media (max-width: 450px) {
    font-size: 10px;
    padding: 5px 8px;
  }
}

.block__req {
  font-size: 11px;
  font-weight: 1000;
  color: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba($orange, 0.25);
  background: rgba($orange, 0.1);
  padding: 3px 8px;
  border-radius: 999px;
}

/* Additional Requests */
.additional-request {
  position: relative;
  margin-top: 12px;
}

.remove-request-btn {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid rgba($danger, 0.3);
  background: rgba($danger, 0.1);
  color: $danger;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
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
  transition: all 0.2s;
}

.add-request-btn:hover {
  border-color: rgba($orange, 0.4);
  background: rgba($orange, 0.1);
}

/* Manual Select Button */
.manual-select-btn {
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid rgba($orange, 0.4);
  background: rgba($orange, 0.1);
  color: $orange3;
  font-weight: 900;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
  line-height: 1.2;
}

.manual-select-btn:hover {
  border-color: rgba($orange, 0.6);
  background: rgba($orange, 0.2);
  transform: translateY(-1px);
}

/* Inputs */
.input-small {
  width: 100%;
  box-sizing: border-box;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.22);
  color: $text;
  padding: 14px 12px;
  font-weight: 900;
  font-size: 16px;
  min-height: 48px;
}

.textarea,
.select {
  width: 100%;
  box-sizing: border-box;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.22);
  color: $text;
  padding: 14px 12px;
  font-weight: 900;
  font-size: 16px;
}

.textarea {
  min-height: 120px;
  resize: vertical;
  line-height: 1.5;
}

.select {
  min-height: 48px;
}

.is-err,
.input-error {
  border-color: rgba($danger, 0.55) !important;
  background: rgba($danger, 0.08) !important;
}

/* Messages */
.msg {
  margin-top: 8px;
  font-size: 12px;
  font-weight: 900;
}
.msg--err {
  color: rgba(220, 53, 69, 0.95);
}
.msg--hint {
  color: rgba(255, 255, 255, 0.55);
}

/* Upload */
.uploadRow {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
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
  min-width: 180px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 12px;
  border-radius: 14px;
  border: 1px solid rgba($orange, 0.22);
  background: rgba($orange, 0.1);
  color: $text;
  cursor: pointer;
  font-weight: 1100;
}

.uploadBtn--done {
  border-color: rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.82);
}

.uploadBtn--err {
  border-color: rgba($danger, 0.55);
  background: rgba($danger, 0.1);
}

.miniGhost {
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.18);
  color: rgba(255, 255, 255, 0.88);
  padding: 12px 12px;
  font-weight: 1000;
  cursor: pointer;
}

.images-grid {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.image-item {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.25);
  aspect-ratio: 1;
}

.image-item__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.image-item__remove {
  position: absolute;
  top: 6px;
  left: 6px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid rgba($danger, 0.3);
  background: rgba($danger, 0.2);
  color: $danger;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: all 0.2s;
}

.image-item__remove:hover {
  background: rgba($danger, 0.4);
  border-color: rgba($danger, 0.5);
  transform: scale(1.1);
}

.uploadBtn--disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.uploadBtn--loading {
  cursor: wait;
  position: relative;
}

.uploadBtn--loading .uploadBtn__icon {
  display: none;
}

.uploadBtn__spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.upload-hint {
  margin-top: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 900;
  text-align: center;
}

/* Location Block */
.block--location {
  min-height: 200px; /* Same height as other blocks */
}

.location-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  min-height: 200px;
  gap: 16px;
}

.location-loading__spinner {
  width: 60px;
  height: 60px;
  position: relative;
}

.location-loading__spinner .spinner {
  width: 100%;
  height: 100%;
  border: 4px solid rgba(255, 106, 0, 0.2);
  border-top-color: $orange;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.location-loading__text {
  font-size: 16px;
  font-weight: 1000;
  color: $text;
  margin: 0;
  text-align: center;
}

.location-loading__subtext {
  font-size: 13px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  text-align: center;
}

.location-content {
  display: grid;
  gap: 12px;
}

.location-input-wrapper {
  width: 100%;
}

.house-number-input {
  width: 100%;
}

.house-number-input .input-small {
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

.house-number-input .input-small:focus {
  outline: none;
  border-color: $orange;
  background: rgba(255, 255, 255, 0.06);
}

.selected-location {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(255, 159, 28, 0.1);
  border: 1px solid rgba(255, 159, 28, 0.3);
}

.selected-location__content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.selected-location__text {
  color: $text;
  font-weight: 600;
  font-size: 15px;
  flex: 1;
}

.selected-location__change {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: $text;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.selected-location__change:hover {
  background: rgba(255, 255, 255, 0.15);
}

.improve-location-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid rgba($orange, 0.4);
  background: rgba($orange, 0.15);
  color: $orange2;
  font-weight: 900;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.improve-location-btn:hover:not(:disabled) {
  background: rgba($orange, 0.25);
  border-color: rgba($orange, 0.55);
  transform: translateY(-1px);
}

.improve-location-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.improve-location-btn__icon {
  font-size: 16px;
  line-height: 1;
}

.improve-location-btn__text {
  font-size: 13px;
  font-weight: 900;
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
  gap: 8px;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba($orange, 0.1);
  color: $text;
  font-weight: 900;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: rgba($orange, 0.2);
    border-color: rgba($orange, 0.5);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    pointer-events: none;
  }

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
  margin-top: 8px;
}

.location-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 16px;
  border-radius: 14px;
  font-weight: 1100;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  min-height: 50px;
}

.location-btn--map {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.9);
}

.location-btn--map:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.location-btn--gps {
  background: linear-gradient(135deg, $orange, $orange2);
  color: #111;
}

.location-btn--gps:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba($orange, 0.4);
}

.location-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  pointer-events: none;
}

.location-btn__icon {
  font-size: 18px;
}

.location-btn__spinner {
  font-size: 18px;
  animation: spin 1s linear infinite;
}

.location-btn__text {
  font-weight: 1100;
}

/* Two columns selects */
.twoCols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
@media (max-width: 450px) {
  .twoCols {
    grid-template-columns: 1fr;
  }
}
.field__label {
  font-size: 12px;
  font-weight: 1100;
  color: rgba(255, 255, 255, 0.78);
  margin-bottom: 8px;
}

/* Urgent row */
.urgentRow {
  width: 100%;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.18);
  padding: 12px 12px;
  color: $text;
  font-weight: 1100;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
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
  border-color: rgba($danger, 0.55);
  background: rgba($danger, 0.12);
}
.urgentRow--on .toggleDot {
  background: $orange;
  box-shadow: 0 0 0 4px rgba($orange, 0.18);
  border-color: rgba($orange, 0.8);
}

.urgentRow__right {
  color: rgba(255, 255, 255, 0.82);
  font-weight: 1100;
  white-space: nowrap;
}
.chev {
  opacity: 0.7;
  margin-right: 4px;
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
}
.note--warn {
  border-color: rgba($danger, 0.3);
  background: rgba($danger, 0.1);
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

/* Step Actions */
.step-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.next-btn-animated {
  --color: 255, 106, 0; /* Orange color */
  flex: 1;
  border-radius: 14px;
  transition: 0.3s;
  background-color: rgba(var(--color), 0.2);
  color: rgb(var(--color));
  fill: rgb(var(--color));
  font-weight: 1100;
  font-size: 16px;
  cursor: pointer;
  border: 2px solid rgb(var(--color));
  box-shadow: 0 0 10px rgba(var(--color), 0.4);
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 24px;
  gap: 8px;
}

.next-btn-animated:hover {
  box-shadow: 0 0 0 5px rgba(var(--color), 0.5);
}

.next-btn-animated span {
  transform: scale(0.8);
  transition: 0.3s;
}

.next-btn-animated:hover span {
  transform: scale(1);
}

.next-btn-animated svg {
  font-size: 0;
  transform: scale(0.5) translateX(0%) rotate(180deg);
  transition: 0.3s;
  width: 1em;
  height: 1em;
}

.next-btn-animated:hover svg {
  font-size: 20px;
  transform: scale(1) translateX(-20%) rotate(0deg);
}

.next-btn-animated:active {
  transition: 0s;
  box-shadow: 0 0 0 5px rgb(var(--color));
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
  transition: all 0.2s;
}

.submit-btn {
  background: linear-gradient(135deg, $orange, $orange2);
  color: #111;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba($orange, 0.4);
}

.back-btn {
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  border: 1px solid $stroke;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* Map Picker Modal */
.map-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
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
  background: $bg2;
  border-radius: 20px;
  border: 1px solid $stroke;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.map-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid $stroke;
}

.map-modal__header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 1100;
  color: $text;
}

.map-modal__close {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid $stroke;
  background: rgba(255, 255, 255, 0.04);
  color: $text;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.map-modal__close:hover {
  background: rgba(255, 255, 255, 0.08);
}

.map-modal__map {
  width: 100%;
  height: 400px;
  min-height: 300px;
  flex: 1;
  position: relative;
}

.map-modal__footer {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid $stroke;
}

.map-modal__btn {
  flex: 1;
  padding: 14px 20px;
  border-radius: 14px;
  font-weight: 1100;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.map-modal__btn--cancel {
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  border: 1px solid $stroke;
}

.map-modal__btn--cancel:hover {
  background: rgba(255, 255, 255, 0.1);
}

.map-modal__btn--confirm {
  background: linear-gradient(135deg, $orange, $orange2);
  color: #111;
}

.map-modal__btn--confirm:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba($orange, 0.3);
}

/* Responsive adjustments */
@media (max-width: 450px) {
  .shell {
    max-width: 100%;
    padding: 10px 10px calc(80px + env(safe-area-inset-bottom));
  }

  .step-container {
    max-height: calc(100vh - 200px);
    padding: 10px;
  }

  .step-indicator {
    padding: 15px 0;
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

  .topbar {
    padding: 8px 0 10px;
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

/* Modals (Split Call & Partial Match) */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100001;
  padding: 20px;
  animation: fadeIn 0.3s ease;

  @media (max-width: 768px) {
    padding: 10px;
  }
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
    rgba(255, 255, 255, 0.06)
  );
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.55),
    0 18px 44px rgba(255, 106, 0, 0.18);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
  direction: rtl;

  @media (max-width: 768px) {
    max-width: 100%;
    border-radius: 16px;
    max-height: 95vh;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
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
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  @media (max-width: 768px) {
    padding: 16px 18px;
  }

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 1100;
    color: $orange3;
    line-height: 1.3;
    flex: 1;

    @media (max-width: 768px) {
      font-size: 16px;
    }
  }
}

.modal-close {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.8);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
  margin-right: 12px;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba($orange, 0.3);
    color: $orange3;
  }

  @media (max-width: 768px) {
    width: 28px;
    height: 28px;
    font-size: 18px;
    margin-right: 8px;
  }
}

.modal-body {
  padding: 20px 24px;
  flex: 1;
  overflow-y: auto;

  @media (max-width: 768px) {
    padding: 16px 18px;
  }

  p {
    margin: 0 0 16px 0;
    font-size: 14px;
    font-weight: 900;
    color: rgba(255, 255, 255, 0.9);
    line-height: 1.5;

    @media (max-width: 768px) {
      font-size: 13px;
      margin-bottom: 12px;
    }

    &:last-of-type {
      margin-bottom: 0;
    }
  }

  ul {
    margin: 12px 0 16px 0;
    padding-right: 20px;
    list-style: none;

    @media (max-width: 768px) {
      margin: 10px 0 12px 0;
      padding-right: 16px;
    }

    li {
      padding: 10px 12px;
      margin-bottom: 8px;
      background: rgba($orange, 0.1);
      border: 1px solid rgba($orange, 0.2);
      border-radius: 10px;
      font-size: 13px;
      font-weight: 1000;
      color: $orange3;
      position: relative;
      padding-right: 32px;

      @media (max-width: 768px) {
        padding: 8px 10px;
        padding-right: 28px;
        font-size: 12px;
        margin-bottom: 6px;
      }

      &::before {
        content: "✓";
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        color: $orange;
        font-weight: 1200;
        font-size: 14px;

        @media (max-width: 768px) {
          right: 8px;
          font-size: 12px;
        }
      }

      &:last-child {
        margin-bottom: 0;
      }
    }
  }

  .matched-subcategories-list {
    margin: 12px 0 16px 0;
    padding-right: 0;

    .subcategory-item {
      margin: 0 0 12px 0;
      padding: 0;
      background: transparent;
      border: none;
      font-size: 14px;
      font-weight: 900;
      color: rgba(255, 255, 255, 0.9);
      line-height: 1.5;

      @media (max-width: 768px) {
        font-size: 13px;
        margin-bottom: 10px;
      }

      span {
        color: rgba(255, 255, 255, 0.9);
      }

      .subcategory-name-badge {
        display: inline-block;
        padding: 8px 12px;
        background: rgba($orange, 0.1);
        border: 1px solid rgba($orange, 0.2);
        border-radius: 8px;
        color: $orange3;
        font-weight: 1100;
        margin-right: 6px;

        @media (max-width: 768px) {
          padding: 6px 10px;
          font-size: 13px;
          margin-right: 4px;
        }
      }

      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}

/* Credit Card Form */
.block--credit {
  min-height: auto;

  @media (max-width: 768px) {
    .credit-form {
      max-width: 370px;
      margin: 0 auto;
    }
  }
}

/* Stripe Elements Card Element */
.stripe-card-element {
  padding: 14px 12px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.22);
  min-height: 48px;
  transition: all 0.2s;
}

.stripe-card-element:focus {
  outline: none;
  border-color: $orange;
  background: rgba(255, 255, 255, 0.06);
}

.stripe-card-element--invalid {
  border-color: rgba($danger, 0.55);
  background: rgba($danger, 0.08);
}

.credit-info {
  margin-bottom: 20px;
  padding: 14px;
  border-radius: 12px;
  background: rgba($orange, 0.1);
  border: 1px solid rgba($orange, 0.3);
}

.credit-info__text {
  margin: 0;
  color: $orange3;
  font-weight: 1100;
  font-size: 14px;
  text-align: center;
}

.credit-form {
  display: grid;
  gap: 16px;
}

.saved-payment-method-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
  padding: 20px 0;
}

.payment-method-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 40px 20px;
  min-height: 200px;

  p {
    color: rgba(255, 255, 255, 0.8);
    font-size: 16px;
    font-weight: 800;
    margin: 0;
  }
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255, 106, 0, 0.2);
  border-top-color: #ff6a00;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.flip-card {
  background-color: transparent;
  width: 100%;
  max-width: 320px;
  height: 200px;
  perspective: 1000px;
  color: white;

  @media (max-width: 768px) {
    max-width: 280px;
    height: 175px;
  }
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

  @media (max-width: 768px) {
    font-size: 0.8em;
    top: 1.8em;
    left: 16em;
  }
}

.logo {
  position: absolute;
  top: 6.8em;
  left: 11.7em;

  @media (max-width: 768px) {
    width: 30px;
    height: 30px;
    top: 6em;
    left: 10em;
  }
}

.chip {
  position: absolute;
  top: 2.3em;
  left: 1.5em;

  @media (max-width: 768px) {
    width: 25px;
    height: 25px;
    top: 2em;
    left: 1.2em;
  }
}

.contactless {
  position: absolute;
  top: 3.5em;
  left: 12.4em;

  @media (max-width: 768px) {
    width: 18px;
    height: 18px;
    top: 3.2em;
    left: 11em;
  }
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

  @media (max-width: 768px) {
    font-size: 0.9em;
    top: 7.5em;
    left: 1.4em;
  }
}

.valid_thru {
  position: absolute;
  font-weight: bold;
  top: 12.5em;
  font-size: 0.5em;
  left: 3.2em;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.7);

  @media (max-width: 768px) {
    font-size: 0.45em;
    top: 11.5em;
    left: 2.8em;
  }
}

.date_8264 {
  position: absolute;
  font-weight: bold;
  font-size: 0.8em;
  top: 13.6em;
  left: 3.2em;
  font-family: "Courier New", monospace;
  color: $orange;

  @media (max-width: 768px) {
    font-size: 0.7em;
    top: 12.5em;
    left: 2.8em;
  }
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

  @media (max-width: 768px) {
    font-size: 0.7em;
    top: 15em;
    left: 1.8em;
  }
}

.strip {
  position: absolute;
  background-color: black;
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

  @media (max-width: 768px) {
    width: 13em;
    height: 1.3em;
    top: 2.2em;
  }
}

.mstrip {
  position: absolute;
  background-color: rgb(255, 255, 255);
  width: 8em;
  height: 0.8em;
  top: 5em;
  left: 0.8em;
  border-radius: 2.5px;

  @media (max-width: 768px) {
    width: 7em;
    height: 0.7em;
    top: 4.5em;
    left: 0.7em;
  }
}

.sstrip {
  position: absolute;
  background-color: rgb(255, 255, 255);
  width: 4.1em;
  height: 0.8em;
  top: 5em;
  left: 10em;
  border-radius: 2.5px;

  @media (max-width: 768px) {
    width: 3.6em;
    height: 0.7em;
    top: 4.5em;
    left: 9em;
  }
}

.code {
  font-weight: bold;
  text-align: center;
  margin: 0.2em;
  color: black;
  font-size: 0.8em;
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
  box-shadow: 0 8px 14px 0 rgba(0, 0, 0, 0.2);
  position: absolute;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  height: 100%;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  border-radius: 1rem;
}

.flip-card-front {
  box-shadow: rgba(0, 0, 0, 0.4) 0px 2px 2px,
    rgba(0, 0, 0, 0.3) 0px 7px 13px -3px, rgba(0, 0, 0, 0.2) 0px -1px 0px inset;
  background-color: #171717;
}

.flip-card-back {
  box-shadow: rgba(0, 0, 0, 0.4) 0px 2px 2px,
    rgba(0, 0, 0, 0.3) 0px 7px 13px -3px, rgba(0, 0, 0, 0.2) 0px -1px 0px inset;
  background-color: #171717;
  transform: rotateY(180deg);
}

.payment-method-actions {
  display: flex;
  gap: 12px;

  .btn {
    flex: 1;
    padding: 14px 24px;
    border-radius: 12px;
    font-weight: 700;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;

    &--primary {
      background: $orange;
      color: #000;

      &:hover {
        background: $orange2;
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba($orange, 0.4);
      }
    }

    &--secondary {
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.2);

      &:hover {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.3);
      }
    }
  }

  @media (max-width: 768px) {
    flex-direction: column;
  }
}

/* Stripe Elements Card Element */
.stripe-card-element {
  padding: 14px 12px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.22);
  min-height: 48px;
  transition: all 0.2s;
}

.stripe-card-element:focus {
  outline: none;
  border-color: $orange;
  background: rgba(255, 255, 255, 0.06);
}

.stripe-card-element--invalid {
  border-color: rgba($danger, 0.55);
  background: rgba($danger, 0.08);
}

/* Manual Category Selector Modal */
.modal-content--large {
  max-width: 600px;
  max-height: 85vh;

  @media (max-width: 768px) {
    max-width: 100%;
    max-height: 95vh;
  }
}

.modal-body--scrollable {
  max-height: 60vh;
  overflow-y: auto;
  padding: 20px 24px;

  @media (max-width: 768px) {
    max-height: 65vh;
    padding: 16px 18px;
  }
}

.category-section {
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
}

.category-section__title {
  margin: 0 0 12px 0;
  font-size: 18px;
  font-weight: 1100;
  color: $orange3;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba($orange, 0.3);

  @media (max-width: 768px) {
    font-size: 16px;
  }
}

.subcategories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
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
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba($orange, 0.1);
    border-color: rgba($orange, 0.3);
  }

  @media (max-width: 768px) {
    padding: 10px;
  }
}

.subcategory-checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid $orange;
  border-radius: 5px;
  background-color: transparent;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
  appearance: none;
  position: relative;

  &:hover {
    border-color: $orange2;
    box-shadow: 0 0 8px rgba($orange, 0.4);
  }

  &:checked {
    border-color: $orange2;
    background-color: rgba($orange, 0.2);
    box-shadow: 0 0 12px rgba($orange, 0.5);

    &::before {
      content: "✓";
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: $orange;
      font-weight: bold;
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

  @media (max-width: 768px) {
    font-size: 13px;
  }
}

.subcategory-price {
  font-size: 12px;
  font-weight: 900;
  color: $orange3;
}

.subcategory-checkbox-label:has(.subcategory-checkbox:checked) {
  background: rgba($orange, 0.15);
  border-color: rgba($orange, 0.4);
  box-shadow: 0 0 8px rgba($orange, 0.3);
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);

  @media (max-width: 768px) {
    padding: 16px 18px;
    gap: 10px;
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
  transition: all 0.2s ease;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 768px) {
    padding: 12px 16px;
    font-size: 14px;
  }

  &--primary {
    background: linear-gradient(135deg, $orange, $orange2);
    color: #111;
    box-shadow: 0 6px 20px rgba(255, 106, 0, 0.3);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(255, 106, 0, 0.4);
    }

    &:active {
      transform: translateY(0);
    }
  }

  &--secondary {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: rgba(255, 255, 255, 0.9);

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
    }
  }
}

.urgent-note {
  margin-top: 10px;
  padding: 10px 14px;
  background: rgba(255, 159, 28, 0.1);
  border: 1px solid rgba(255, 159, 28, 0.3);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  font-weight: 600;
  text-align: right;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .urgent-note {
    font-size: 12px;
    padding: 8px 12px;
  }
}
</style>
