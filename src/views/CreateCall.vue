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
    <div v-else class="shell ccV3">
      <div class="ccPhone">
        <!-- Header (sticky) -->
        <header class="ccHeader">
          <div class="ccHeaderTop">
            <button
              class="ccBack"
              type="button"
              @click="goBack"
              aria-label="חזור"
            >
              <span class="material-symbols-outlined">arrow_forward</span>
            </button>

            <h2 class="ccHeaderTitle">
              <template v-if="currentStep === 1">צור קריאה</template>
              <template v-else-if="currentStep === 2"
                >פרטי הקריאה ומיקום</template
              >
              <template v-else-if="currentStep === 4">תשלום ואישור</template>
              <template v-else>יצירת קריאה</template>
            </h2>

            <div class="ccHeaderSpacer" aria-hidden="true"></div>
          </div>

          <div
            class="ccHeaderProgress"
            :class="`ccHeaderProgress--s${currentStep}`"
            aria-label="התקדמות"
          >
            <div class="ccProgressRowV3">
              <span class="ccProgressPctV3">{{ progressPercent }}%</span>
            </div>

            <div
              class="ccProgressTrackV3"
              role="progressbar"
              :aria-valuenow="progressPercent"
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <div
                class="ccProgressFillV3"
                :style="{ width: progressPercent + '%' }"
              ></div>
            </div>
          </div>
        </header>

        <!-- Content (scroll) -->
        <main class="ccMain custom-scrollbar">
          <!-- STEP 1 -->
          <div v-if="currentStep === 1" class="ccStep ccStep--1">
            <div class="ccPad">
              <div class="ccStepIntro">
                <h3 class="ccH3">תאר בקצרה מה צריך שנעשה?</h3>
              </div>

              <div class="ccRow">
                <button
                  type="button"
                  class="ccPillBtn"
                  @click="openManualCategorySelector"
                >
                  <span class="material-symbols-outlined ccIcon">list</span>
                  <span class="ccPillBtnTxt">בחר ידנית</span>
                </button>
              </div>

              <div class="ccField">
                <p class="ccLabel">תיאור הבקשה</p>
                <input
                  class="ccInput ccInput--tall"
                  type="text"
                  v-model="call.requests[0]"
                  @input="clearError('requests')"
                  placeholder="לדוגמה: תליית מדף"
                  autocomplete="off"
                />
                <div v-if="errors.requests" class="ccErr">
                  {{ errors.requests }}
                </div>
              </div>

              <div
                v-for="(request, index) in call.requests.slice(1)"
                :key="`request-${index + 1}-${call.requests.length}`"
                class="ccExtraReq"
              >
                <input
                  class="ccInput"
                  type="text"
                  v-model="call.requests[index + 1]"
                  :placeholder="`בקשה ${index + 2}`"
                  autocomplete="off"
                />
                <button
                  type="button"
                  class="ccIconBtn"
                  @click="removeRequest(index + 1)"
                  aria-label="הסר בקשה"
                >
                  <span class="material-symbols-outlined">close</span>
                </button>
              </div>

              <button type="button" class="ccAddReq" @click="addRequest">
                <span class="ccAddReqIcon">
                  <span class="material-symbols-outlined">add</span>
                </span>
                <span>הוסף בקשה נוספת</span>
              </button>

              <div class="ccPromo">
                <div class="ccPromoInner">
                  <div class="ccPromoGlow" aria-hidden="true"></div>
                  <span class="material-symbols-outlined ccPromoIcon"
                    >handyman</span
                  >
                  <p class="ccPromoTxt">אנחנו כאן לעזור עם כל תיקון</p>
                </div>
              </div>

              <div class="ccMiniNote">
                נשמור את זה ברור כדי שה־AI יתאים לך הנדימן מדויק
              </div>
            </div>
          </div>

          <!-- STEP 2 -->
          <div v-if="currentStep === 2" class="ccStep ccStep--2">
            <div class="ccPad">
              <!-- Split Notice - Show only if there are both quoted and fixed price jobs -->
              <div
                v-if="hasBothQuotedAndFixedJobs"
                class="ccSplitNotice"
              >
                <div class="ccSplitNotice__icon">📋</div>
                <div class="ccSplitNotice__content">
                  <p class="ccSplitNotice__title">העבודה תתפצל</p>
                  <p class="ccSplitNotice__text">
                    העבודות עם הצעת מחיר יופיעו כעבודות נפרדות, והעבודות עם מחיר קבוע יופיעו ביחד
                  </p>
                </div>
              </div>

              <!-- Loading Categories -->
              <section
                v-if="isLoadingCategories"
                class="ccCard ccCard--loading"
              >
                <div class="loading-categories">
                  <div class="loading-categories__spinner"></div>
                  <div class="loading-categories__text">
                    מחפש את התחומים הדרושים לך באמצעות AI
                  </div>
                  <div class="loading-categories__dots">
                    <span>.</span><span>.</span><span>.</span>
                  </div>
                  <div class="loading-categories__progress-bar">
                    <div class="loading-categories__progress-fill"></div>
                  </div>
                </div>
              </section>

              <!-- Found Categories - Always show if there are categories -->
              <section
                v-if="foundCategories.length > 0"
                class="ccCard ccCard--cats"
              >
                <div class="ccCardHead">
                  <div class="ccCardTitle">
                    <span
                      class="material-symbols-outlined ccIcon ccIcon--primary"
                      >auto_awesome</span
                    >
                    <span>קטגוריות שזוהו</span>
                  </div>
                  <button
                    type="button"
                    class="ccLinkBtn"
                    @click="refineCategories"
                  >
                    בחר מחדש
                  </button>
                </div>

                <div class="ccCats">
                  <div
                    v-for="(category, index) in foundCategories"
                    :key="index"
                    class="ccCatCard"
                    :class="{
                      'ccCatCard--quoted': category.price === 'bid',
                      'ccCatCard--featured': index === 0,
                    }"
                  >
                    <div class="ccCatBody">
                      <div class="ccCatTop">
                        <span class="ccAIBadge">{{
                          category.isManual 
                            ? "ידני" 
                            : (index === 0 ? "AI זיהוי גבוה" : "AI")
                        }}</span>
                        <span class="ccCatName">
                          {{
                            // CRITICAL: Always show what AI found if it exists, otherwise show originalText
                            // Priority order:
                            // 1. category.subcategory (if exists) - this is what AI/server returned
                            // 2. category.ai?.subcategory or category.aiResponse?.subcategory (if exists)
                            // 3. category.originalText (fallback)
                            (() => {
                              // Get values - handle null/undefined properly
                              const originalText = category?.originalText ? String(category.originalText).trim() : "";
                              const subcategory = category?.subcategory ? String(category.subcategory).trim() : "";
                              const aiWork = category?.ai?.subcategory || category?.aiResponse?.subcategory;
                              const aiWorkStr = aiWork ? String(aiWork).trim() : "";
                              
                              // PRIORITY 1: If subcategory exists (even if same as original), use it - it's what AI/server returned
                              if (subcategory) {
                                return subcategory;
                              }
                              
                              // PRIORITY 2: If AI work exists, use it
                              if (aiWorkStr) {
                                return aiWorkStr;
                              }
                              
                              // PRIORITY 3: Fallback to originalText
                              return originalText || category?.category || "עבודה";
                            })()
                          }}
                        </span>
                      </div>

                      <div class="ccCatMeta">
                        <span class="ccCatMetaLbl">קטגוריה:</span>
                        <span class="ccCatMetaVal">{{
                          category.category
                        }}</span>
                      </div>

                      <div
                        v-if="category.needsRecommendation"
                        class="ccCatMeta ccCatMeta--sub"
                      >
                        <span class="ccCatMetaLbl">מה המערכת מצאה:</span>
                        <span class="ccCatMetaVal">{{
                          (() => {
                            // Show what AI found - prioritize ai/aiResponse, then subcategory, then fallback
                            const aiWork = (category.ai?.subcategory || category.aiResponse?.subcategory || "").trim();
                            const subcategory = (category.subcategory || "").trim();
                            const originalText = (category.originalText || "").trim();
                            
                            // If AI work exists and is different from original, show it
                            if (aiWork && aiWork !== originalText) {
                              return aiWork;
                            }
                            
                            // If subcategory exists and is different from original, show it
                            if (subcategory && subcategory !== originalText) {
                              return subcategory;
                            }
                            
                            // If AI work exists (even if same as original), show it
                            if (aiWork) {
                              return aiWork;
                            }
                            
                            // If subcategory exists (even if same as original), show it
                            if (subcategory) {
                              return subcategory;
                            }
                            
                            // Fallback
                            return "לא נמצאה התאמה";
                          })()
                        }}</span>
                      </div>

                      <div class="ccCatPriceRow">
                        <span
                          v-if="category.price && category.price !== 'bid'"
                          class="ccCatPrice"
                          >{{ category.price }} ₪</span
                        >
                        <span
                          v-else-if="category.price === 'bid'"
                          class="ccCatPrice ccCatPrice--bid"
                          >הצעת מחיר</span
                        >
                        
                        <!-- אחוז התאמה - מתחת למחיר (מוצג רק אם לא ידני) -->
                        <div v-if="!category.isManual" class="ccCatMatchPct">
                          <span class="ccCatMatchPct__label">אחוז התאמה:</span>
                          <span class="ccCatMatchPct__value">{{ getConfidencePct(category) }}%</span>
                        </div>
                      </div>
                    </div>

                    <div class="ccCatThumb" aria-hidden="true"></div>

                    <!-- Buttons row -->
                    <div class="ccCatButtonsRow">
                      <button
                        type="button"
                        class="ccCatQuote"
                        @click="openWorkForQuotation(index)"
                        v-if="
                          category.price !== 'bid' &&
                          !category.needsRecommendation
                        "
                      >
                        פתח להצעת מחיר
                      </button>

                      <button
                        type="button"
                        class="ccCatNotRight"
                        @click="openNotRightModal(index)"
                      >
                        זה לא מה שרציתי
                      </button>
                    </div>

                    <!-- Recommendation message for low confidence/uncertain match -->
                    <div
                      v-if="category.needsRecommendation"
                      class="category-card__recommendation"
                    >
                      <div class="category-card__recommendation-content">
                        <div class="category-card__recommendation-head">
                          <div class="category-card__recommendation-icon">
                            <span class="material-symbols-outlined"
                              >warning</span
                            >
                          </div>
                          <div class="category-card__recommendation-title">
                            אנחנו לא בטוחים בהתאמה
                          </div>
                          <div class="category-card__recommendation-badge">
                            {{ getConfidencePct(category) }}%
                          </div>
                        </div>
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
                  </div>
                </div>
              </section>

              <section class="ccCard ccCard--desc">
                <h3 class="ccSectionTitle">הרחב להנדימן על התקלות</h3>
                <div class="ccTextareaWrap">
                  <textarea
                    class="ccTextarea"
                    v-model="call.desc"
                    @input="clearError('desc')"
                    rows="6"
                    maxlength="500"
                    placeholder="תאר את הבעיה בפירוט כדי שנוכל לתת הצעת מחיר מדויקת..."
                  ></textarea>
                  <div class="ccCharCount">
                    {{ (call.desc || "").length }}/500
                  </div>
                </div>
                <div v-if="errors.desc" class="ccErr">{{ errors.desc }}</div>
              </section>

              <section class="ccCard ccCard--location">
                <div class="ccLocHead">
                  <button
                    v-if="!isLoadingLocation && !isEditingLocation"
                    type="button"
                    class="ccManualLocationBtn"
                    @click="isEditingLocation = true"
                  >
                    <span class="material-symbols-outlined">edit</span>
                    <span>בחר ידנית</span>
                  </button>
                  <h3 class="ccSectionTitle">מיקום השירות</h3>
                  <button
                    v-if="!isLoadingLocation && isEditingLocation"
                    type="button"
                    class="ccLinkBtn"
                    @click="isEditingLocation = false"
                  >
                    סגור
                  </button>
                </div>

                <div class="location-content">
                  <!-- Loading indicator -->
                  <div v-if="isLoadingLocation" class="location-loading">
                    <div class="location-loading__container">
                      <!-- גלי רדאר -->
                      <div class="location-loading__radar-waves">
                        <div
                          v-for="i in 3"
                          :key="i"
                          class="location-loading__radar-wave"
                          :style="{
                            animationDelay: `${(i - 1) * 1}s`
                          }"
                        ></div>
                      </div>

                      <!-- מעגל GPS -->
                      <div class="location-loading__gps-circle">
                        <svg width="200" height="200" viewBox="0 0 200 200" class="location-loading__svg">
                          <!-- מעגלים קונצנטריים -->
                          <circle cx="100" cy="100" r="90" fill="none" stroke="#ff6a00" stroke-width="1" opacity="0.2" />
                          <circle cx="100" cy="100" r="70" fill="none" stroke="#ff6a00" stroke-width="1" opacity="0.3" />
                          <circle cx="100" cy="100" r="50" fill="none" stroke="#ff6a00" stroke-width="1" opacity="0.4" />
                          
                          <!-- קווי צלב -->
                          <line x1="100" y1="10" x2="100" y2="40" stroke="#ff6a00" stroke-width="2" opacity="0.6" />
                          <line x1="100" y1="160" x2="100" y2="190" stroke="#ff6a00" stroke-width="2" opacity="0.6" />
                          <line x1="10" y1="100" x2="40" y2="100" stroke="#ff6a00" stroke-width="2" opacity="0.6" />
                          <line x1="160" y1="100" x2="190" y2="100" stroke="#ff6a00" stroke-width="2" opacity="0.6" />
                          
                          <!-- נקודה מרכזית -->
                          <circle cx="100" cy="100" r="8" fill="#ff6a00">
                            <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
                          </circle>
                          
                          <!-- קו סורק מסתובב -->
                          <line x1="100" y1="100" x2="100" y2="30" stroke="#ff6a00" stroke-width="2" opacity="0.8">
                            <animateTransform
                              attributeName="transform"
                              type="rotate"
                              from="0 100 100"
                              to="360 100 100"
                              dur="3s"
                              repeatCount="indefinite"
                            />
                          </line>
                        </svg>
                      </div>

                      <!-- טקסט -->
                      <div class="location-loading__text-container">
                        <h2 class="location-loading__title">מאתר מיקום</h2>
                        
                        <!-- נקודות טעינה -->
                        <div class="location-loading__dots">
                          <div
                            v-for="i in 3"
                            :key="i"
                            class="location-loading__dot"
                            :class="{ 'location-loading__dot--active': pulse === (i - 1) }"
                          ></div>
                        </div>

                        <p class="location-loading__subtext">מקבל נתוני GPS</p>
                      </div>
                    </div>
                  </div>

                  <!-- Location Buttons (3 options) -->
                  <div
                    v-if="!isLoadingLocation && !detectedLocation && !selectedMapLocation && !isEditingLocation"
                    class="ccLocBtnsMain"
                  >
                    <button
                      class="ccLocBtnMain ccLocBtnMain--primary"
                      type="button"
                      @click="setMyLocation"
                      :disabled="isLoadingLocation"
                    >
                      <span class="material-symbols-outlined ccIcon">near_me</span>
                      <span>מיקום נוכחי</span>
                    </button>

                    <button
                      class="ccLocBtnMain"
                      type="button"
                      @click="openMapPicker"
                    >
                      <span class="material-symbols-outlined ccIcon">map</span>
                      <span>מיקום במפה</span>
                    </button>

                    <button
                      class="ccLocBtnMain"
                      type="button"
                      @click="isEditingLocation = true"
                    >
                      <span class="material-symbols-outlined ccIcon">edit_location_alt</span>
                      <span>בחר ידנית</span>
                    </button>
                  </div>

                  <!-- Manual Location Input (only shown when "בחר ידנית" is clicked) -->
                  <div
                    v-if="!isLoadingLocation && isEditingLocation && !detectedLocation && !selectedMapLocation"
                    class="ccLocInput"
                  >
                    <AddressAutocomplete
                      v-model="call.location"
                      input-id="call-location"
                      :placeholder="'הכנס שם ישוב'"
                      :required="!usingMyLocation && !selectedMapLocation"
                      @update:modelValue="onLocationChange"
                      @update:englishName="onEnglishNameUpdate"
                      @update:selectedCity="onCitySelected"
                      @focus="onLocationInputFocus"
                      @blur="onLocationInputBlur"
                    />
                    
                    <!-- House number -->
                    <div
                      v-if="call.location && call.location.length > 0"
                      class="house-number-input"
                    >
                      <input
                        type="text"
                        v-model="call.houseNumber"
                        @input="onHouseNumberInput"
                        @focus="onHouseNumberFocus"
                        @blur="onHouseNumberBlur"
                        placeholder="מספר בית / בלוק"
                        class="ccInput"
                        :class="{ 'ccInput--error': errors.houseNumber }"
                      />
                      <div v-if="errors.houseNumber" class="ccErr">
                        {{ errors.houseNumber }}
                      </div>
                    </div>
                  </div>

                  <!-- Selected Location Preview (shown when location is set) -->
                  <div
                    v-if="!isLoadingLocation && (detectedLocation || selectedMapLocation || (call.location && !isEditingLocation))"
                    class="ccLocPreview"
                  >
                    <div class="ccLocMap">
                      <iframe
                        class="ccLocMapFrame"
                        :src="locationEmbedUrl"
                        loading="lazy"
                        referrerpolicy="no-referrer-when-downgrade"
                        title="תצוגת מפה"
                      ></iframe>
                      <div class="ccLocMapOverlay">
                        <div class="ccLocPill">
                          <span
                            class="material-symbols-outlined ccIcon ccIcon--primary"
                            >location_on</span
                          >
                          <span class="ccLocPillTxt">
                            {{ locationLabelText }}
                          </span>
                        </div>
                      </div>
                    </div>

                    <!-- Change location button -->
                    <button
                      class="ccLocChangeBtn"
                      type="button"
                      @click="resetLocation"
                    >
                      <span class="material-symbols-outlined ccIcon">refresh</span>
                      <span>שנה מיקום</span>
                    </button>
                  </div>
                </div>

                <div v-if="errors.location" class="msg msg--err">
                  {{ errors.location }}
                </div>
              </section>
            </div>
          </div>

          <!-- STEP 3 -->
          <div v-if="currentStep === 3" class="ccStep ccStep--3">
            <div class="ccPad">
              <div class="ccStepIntro">
                <h3 class="ccH3">שלב 3: תמונות ודחיפות</h3>
                <p class="ccSub">עזור לנו להבין טוב יותר את המשימה</p>
              </div>

              <section class="ccCard">
                <div class="ccCardHead">
                  <h3 class="ccSectionTitle">תמונות של התקלה</h3>
                  <span class="ccReqTag">חובה</span>
                </div>

                <div class="ccUpload">
                  <input
                    :id="`callImage-${call.imageUrls.length}`"
                    type="file"
                    accept="image/*"
                    @change="handleCallImageUpload"
                    class="ccFileInput"
                    :disabled="call.imageUrls.length >= 4 || isUploadingImage"
                  />

                  <label
                    :for="`callImage-${call.imageUrls.length}`"
                    class="ccUploadDrop"
                    :class="{
                      'is-disabled':
                        call.imageUrls.length >= 4 || isUploadingImage,
                      'is-error': errors.image,
                    }"
                  >
                    <div class="ccUploadIconWrap">
                      <span class="material-symbols-outlined ccUploadIcon"
                        >add_a_photo</span
                      >
                    </div>
                    <div class="ccUploadCopy">
                      <p class="ccUploadTitle">
                        העלאת תמונות ({{ call.imageUrls.length }}/4)
                      </p>
                      <p class="ccUploadHint">
                        מומלץ לצלם את התקלה מכמה זוויות
                      </p>
                    </div>
                  </label>
                </div>

                <div
                  v-if="
                    call.imageUrls.length > 0 || call.imagePreviews.length > 0
                  "
                  class="ccImgGrid"
                >
                  <div
                    v-for="(img, index) in call.imageUrls.length > 0
                      ? call.imageUrls
                      : call.imagePreviews"
                    :key="index"
                    class="ccImg"
                  >
                    <img
                      :src="img"
                      :alt="`תמונה ${index + 1}`"
                      class="ccImgEl"
                    />
                    <button
                      type="button"
                      class="ccImgRm"
                      @click="removeCallImage(index)"
                    >
                      <span class="material-symbols-outlined">close</span>
                    </button>
                  </div>
                </div>

                <div v-if="errors.image" class="ccErr">{{ errors.image }}</div>
              </section>

              <section class="ccCard">
                <button
                  class="ccUrgent"
                  :class="{ 'is-on': call.urgent }"
                  type="button"
                  @click="onToggleUrgent"
                >
                  <div class="ccUrgentLeft">
                    <div class="ccUrgentIcon">
                      <span class="material-symbols-outlined">bolt</span>
                    </div>
                    <div class="ccUrgentCopy">
                      <div class="ccUrgentTop">
                        <span class="ccUrgentTitle">קריאה דחופה</span>
                        <span class="ccUrgentTag">+10 ₪</span>
                      </div>
                      <div class="ccUrgentSub">
                        הקריאה שלך תהיה מוצגת מעל קריאות אחרות
                      </div>
                    </div>
                  </div>

                  <div class="ccSwitch" :class="{ 'is-on': call.urgent }">
                    <div class="ccSwitchKnob"></div>
                  </div>
                </button>
              </section>

              <div class="ccWarn">
                <span class="material-symbols-outlined ccIcon ccIcon--primary"
                  >warning</span
                >
                <p>
                  קנס על ביטול אחרי שקבלו את העבודה יכול להגיע עד:
                  <strong>200</strong> שקלים.
                </p>
              </div>
            </div>
          </div>

          <!-- STEP 4 -->
          <div v-if="currentStep === 4" class="ccStep ccStep--4">
            <div class="ccPad">
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
                class="ccPay"
              >
                <div class="ccPayIntro">
                  <h3 class="ccH3 ccCenter">סיכום הזמנה</h3>
                  <p class="ccSub ccCenter">שלב אחרון לאישור הקריאה</p>
                </div>

                <div class="ccCardPreview">
                  <div class="ccCardPreviewTop">
                    <div class="ccCardBadge">PREMIUM ACCESS</div>
                    <span class="material-symbols-outlined ccCardTap"
                      >contactless</span
                    >
                  </div>

                  <div class="ccCardPreviewMid" dir="ltr">
                    <div class="ccCardDigits">
                      •••• •••• ••••
                      {{ savedPaymentMethod.card?.last4 || "••••" }}
                    </div>
                  </div>

                  <div class="ccCardPreviewBottom" dir="ltr">
                    <div class="ccCardCol">
                      <div class="ccCardMeta">CARD HOLDER</div>
                      <div class="ccCardVal">
                        {{
                          store?.user?.username?.toUpperCase() || "CARDHOLDER"
                        }}
                      </div>
                    </div>
                    <div class="ccCardCol">
                      <div class="ccCardMeta">EXPIRES</div>
                      <div class="ccCardVal">
                        {{
                          formatExpiryDate(
                            savedPaymentMethod.card?.expMonth,
                            savedPaymentMethod.card?.expYear
                          )
                        }}
                      </div>
                    </div>
                  </div>

                  <div class="ccCardGlow" aria-hidden="true"></div>
                </div>

                <button
                  class="ccChangePay"
                  type="button"
                  @click="changePaymentMethod"
                >
                  <span class="material-symbols-outlined ccIcon ccIcon--primary"
                    >credit_card</span
                  >
                  <span>החלף אמצעי תשלום</span>
                </button>
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

              <div class="ccPriceBox" v-if="totalPrice > 0">
                <div
                  v-for="(subcat, idx) in subcategoryInfoArray || []"
                  :key="idx"
                  class="ccPriceRow"
                >
                  <span class="ccPriceLabel">
                    {{ subcat?.subcategory || subcat?.name || "עבודה" }}
                  </span>
                  <span class="ccPriceVal"
                    >₪ {{ Number(subcat?.price || 0).toFixed(2) }}</span
                  >
                </div>
                <div v-if="call.urgent" class="ccPriceRow">
                  <span class="ccPriceLabel">דחיפות</span>
                  <span class="ccPriceVal">₪ 10.00</span>
                </div>

                <div class="ccPriceDivider"></div>

                <div class="ccPriceRow ccPriceRow--total">
                  <span class="ccTotalLabel">סה"כ לתשלום</span>
                  <span class="ccTotalVal"
                    >₪ {{ Number(totalPrice || 0).toFixed(2) }}</span
                  >
                </div>
              </div>

              <div class="ccSecure">
                <span class="material-symbols-outlined">lock</span>
                <span>תשלום מאובטח בתקן PCI-DSS</span>
              </div>
            </div>
          </div>
        </main>

        <!-- Footer (sticky) -->
        <footer class="ccFooter">
          <!-- Step 1 footer -->
          <div v-if="currentStep === 1" class="ccFooterRow">
            <button class="ccPrimaryBtn" type="button" @click="nextStep">
              המשך לשלב הבא
            </button>
          </div>

          <!-- Step 2 footer -->
          <div
            v-else-if="currentStep === 2"
            class="ccFooterRow ccFooterRow--two"
          >
            <button 
              class="ccPrimaryBtn" 
              type="button" 
              @click="nextStep"
              :disabled="isLoadingLocation"
            >
              המשך לשלב הבא
            </button>
            <button class="ccGhostBtn" type="button" @click="prevStep">
              ביטול
            </button>
          </div>

          <!-- Step 3 footer -->
          <div
            v-else-if="currentStep === 3"
            class="ccFooterRow ccFooterRow--two"
          >
            <button 
              class="ccPrimaryBtn" 
              type="button" 
              @click="nextStep"
              :disabled="isUploadingImage"
            >
              המשך לשלב הבא
            </button>
            <button class="ccOutlineBtn" type="button" @click="prevStep">
              חזרה
            </button>
          </div>

          <!-- Step 4 footer -->
          <div v-else class="ccFooterRow">
            <button
              class="ccPrimaryBtn"
              type="button"
              @click="onSubmitCall"
              :disabled="
                isProcessingPayment || (!paymentMethodId && !isCreditCardValid)
              "
            >
              <span v-if="isProcessingPayment">מעבד תשלום...</span>
              <span v-else>{{
                totalPrice > 0 ? "אישור ותשלום" : "שלח קריאה"
              }}</span>
              <span
                v-if="!isProcessingPayment"
                class="material-symbols-outlined ccBtnIcon"
                >arrow_back</span
              >
            </button>

            <button class="ccOutlineBtn" type="button" @click="prevStep">
              חזרה
            </button>
          </div>
        </footer>
      </div>
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
          <!-- Search and Filter -->
          <div class="manual-search-section">
            <div class="manual-search-row">
              <input
                type="text"
                class="manual-search-input"
                v-model="manualSearchQuery"
                placeholder="חפש עבודה או קטגוריה..."
                autofocus
              />
              <select
                class="manual-search-select"
                v-model="manualSearchType"
              >
                <option value="category">לפי קטגוריה</option>
                <option value="work">לפי עבודה</option>
              </select>
            </div>
          </div>

          <!-- Categories List -->
          <div
            v-for="category in filteredCategories"
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
                <!-- Radio for step 2 (replacing work item) -->
                <input
                  v-if="isReplacingWorkItem"
                  type="radio"
                  name="selectedSubcategory"
                  class="subcategory-radio"
                  :checked="
                    isSubcategorySelected(category.name, subcategory.name)
                  "
                  @change="selectSingleSubcategory(category.name, subcategory)"
                />
                <!-- Checkbox for step 1 (normal manual selection) -->
                <input
                  v-else
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
          
          <!-- No results message -->
          <div v-if="filteredCategories.length === 0" class="no-results">
            <p>לא נמצאו תוצאות</p>
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

    <!-- Not Right Modal - בחירה מחדש -->
    <div
      v-if="showNotRightModal"
      class="modal-overlay"
      @click.self="showNotRightModal = false"
    >
      <div class="modal-content">
        <div class="modal-header">
          <h3>זה לא מה שרציתי</h3>
          <button
            class="modal-close"
            @click="showNotRightModal = false"
            aria-label="סגור"
          >
            ×
          </button>
        </div>

        <div class="modal-body">
          <p style="margin-bottom: 20px; color: rgba(255, 255, 255, 0.8);">
            איך תרצה להמשיך?
          </p>
          
          <div class="not-right-options">
            <button
              type="button"
              class="not-right-option-btn"
              @click="openManualSelectionForNotRight"
            >
              <span class="not-right-option-icon">📋</span>
              <span class="not-right-option-text">
                <strong>בחירה ידנית מהרשימה</strong>
                <small>בחר עבודה מהקטלוג שלנו</small>
              </span>
            </button>
            
            <button
              type="button"
              class="not-right-option-btn"
              @click="openQuotationModalForNotRight"
            >
              <span class="not-right-option-icon">💰</span>
              <span class="not-right-option-text">
                <strong>עבודה בהצעת מחיר</strong>
                <small>הזן שם עבודה מותאם אישית</small>
              </span>
            </button>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn--secondary" @click="showNotRightModal = false">
            ביטול
          </button>
        </div>
      </div>
    </div>

    <!-- Quotation Modal - עבודה בהצעת מחיר -->
    <div
      v-if="showQuotationNameModal"
      class="modal-overlay"
      @click.self="showQuotationNameModal = false"
    >
      <div class="modal-content">
        <div class="modal-header">
          <h3>עבודה בהצעת מחיר</h3>
          <button
            class="modal-close"
            @click="showQuotationNameModal = false"
            aria-label="סגור"
          >
            ×
          </button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label for="quotationJobName" class="form-label">שם העבודה:</label>
            <input
              id="quotationJobName"
              type="text"
              class="form-input"
              v-model="quotationModalJobName"
              placeholder="הזן את שם העבודה"
              @keyup.enter="confirmQuotationJob"
              autofocus
            />
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn--secondary" @click="showQuotationNameModal = false">
            ביטול
          </button>
          <button class="btn btn--primary" @click="confirmQuotationJob">
            אישור
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
      isEditingLocation: false,
      isImprovingLocation: false, // האם משפרים את המיקום
      detectedLocation: null, // הכתובת שנמצאה מ-reverse geocoding
      locationInputTimeout: null, // Timer for auto-closing inputs after 2 seconds of no typing
      isLocationInputFocused: false, // Track if location input has focus
      isHouseNumberInputFocused: false, // Track if house number input has focus
      pulse: 0, // For loading animation dots
      pulseInterval: null, // Interval for pulse animation
      call: {
        requests: [""], // Array of requests
        desc: "",
        location: "", // Will be set in created() hook to user's city
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
      showNotRightModal: false, // Modal for "זה לא מה שרציתי"
      notRightModalIndex: -1, // Index of the work item being edited
      showQuotationNameModal: false, // Modal for entering quotation job name
      quotationModalJobName: "", // Temporary job name in the quotation modal
      isReplacingWorkItem: false, // Flag to indicate we're replacing an existing work item
      replacingWorkIndex: -1, // Index of work item being replaced
      manualSearchQuery: "", // Search query for manual selection
      manualSearchType: "category", // "category" or "work" - search by category or by work name
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
      socket: null, // WebSocket connection for payment method details
      isLoadingPaymentMethod: false, // Loading state for payment method details
    };
  },
  computed: {
    totalSteps() {
      return 4;
    },
    progressPercent() {
      const total = Number(this.totalSteps) || 4;
      const step = Math.min(Math.max(Number(this.currentStep) || 0, 0), total);
      return Math.round((step / total) * 100);
    },
    filteredCategories() {
      // Filter categories based on search query and search type
      if (!this.manualSearchQuery.trim()) {
        return this.allCategories;
      }
      
      const query = this.manualSearchQuery.trim().toLowerCase();
      
      return this.allCategories
        .map((category) => {
          // Filter subcategories based on search type
          let filteredSubcategories = category.subcategories || [];
          
          if (this.manualSearchType === "category") {
            // Search by category name
            const categoryMatches = category.name.toLowerCase().includes(query);
            if (categoryMatches) {
              // If category matches, show all subcategories
              return { ...category, subcategories: filteredSubcategories };
            }
            // If category doesn't match, return null (will be filtered out)
            return null;
          } else {
            // Search by work name (subcategory name)
            filteredSubcategories = filteredSubcategories.filter((sub) =>
              sub.name.toLowerCase().includes(query)
            );
            if (filteredSubcategories.length > 0) {
              return { ...category, subcategories: filteredSubcategories };
            }
            return null;
          }
        })
        .filter((cat) => cat !== null);
    },
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
    locationLabelText() {
      if (this.detectedLocation && this.usingMyLocation)
        return this.detectedLocation;
      return this.call.location || "";
    },
    locationEmbedUrl() {
      const latRaw = this.call?.coordinates?.lat;
      const lngRaw = this.call?.coordinates?.lng;
      const lat = typeof latRaw === "number" ? latRaw : parseFloat(latRaw);
      const lng = typeof lngRaw === "number" ? lngRaw : parseFloat(lngRaw);
      const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

      const query = hasCoords
        ? `${lat},${lng}`
        : (this.locationLabelText || "").trim();

      if (!query || query === "המיקום שלי") {
        // If no query but we have coordinates, use them
        if (hasCoords) {
          return `https://www.google.com/maps?q=${lat},${lng}&z=16&output=embed`;
        }
        return null;
      }
      return `https://www.google.com/maps?q=${encodeURIComponent(
        query
      )}&z=16&output=embed`;
    },
    hasBothQuotedAndFixedJobs() {
      // Check if there are both quoted jobs (price === 'bid') and fixed price jobs
      if (!this.subcategoryInfoArray || this.subcategoryInfoArray.length === 0) {
        return false;
      }
      
      const hasQuoted = this.subcategoryInfoArray.some(
        (subcat) => subcat.price === "bid" || subcat.price === "quoted"
      );
      
      const hasFixed = this.subcategoryInfoArray.some(
        (subcat) => subcat.price && subcat.price !== "bid" && subcat.price !== "quoted" && typeof subcat.price === "number"
      );
      
      return hasQuoted && hasFixed;
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

    // Set default location to user's city (residence location)
    const userCity = this.store?.user?.city;
    if (userCity && userCity.trim()) {
      // Use user's city as default location (their residence)
      this.call.location = userCity.trim();
      this.usingMyLocation = false;
    } else {
      // If no user city, default to empty (let user fill manually)
      // Don't use "המיקום שלי" as default - that should be a button action
      this.call.location = "";
      this.usingMyLocation = false;
    }

    // Stripe is now handled by CreditCardForm component
  },
  watch: {
    "store.user": {
      handler(newUser) {
        if (newUser && this.currentStep === 4) {
          // User data loaded, check for saved payment method
          this.$nextTick(() => {
            if (newUser.hasPaymentMethod) {
              this.loadSavedPaymentMethod();
            } else {
              this.showChangePaymentMethod = false;
              this.savedPaymentMethod = null;
              this.paymentMethodId = null;
              this.isCreditCardValid = false;
            }
          });
        }
      },
      immediate: false,
    },
    currentStep(newStep) {
      // When step changes to 4, check for saved payment method
      if (newStep === 4) {
        this.$nextTick(() => {
          // Check payment method from store.user.hasPaymentMethod
          if (this.store?.user?.hasPaymentMethod) {
            this.loadSavedPaymentMethod();
          } else {
            this.showChangePaymentMethod = false;
            this.savedPaymentMethod = null;
            this.paymentMethodId = null;
            this.isCreditCardValid = false;
          }
        });
      }
    },
  },
  methods: {
    async getCurrentLocation() {
      return await getCurrentLocation();
    },
    addRequest() {
      const newIndex = this.call.requests.length;
      this.call.requests.push("");
      
      // Focus on the new input after it's rendered
      this.$nextTick(() => {
        const allInputs = this.$el.querySelectorAll('.ccExtraReq .ccInput');
        if (allInputs && allInputs[newIndex - 1]) {
          allInputs[newIndex - 1].focus();
        }
      });
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
        const hasValidDesc = this.call.desc && this.call.desc.trim().length > 0;
        
        // Check if either requests or desc is filled (for mobile app compatibility)
        if (!hasValidRequest && !hasValidDesc) {
          this.errors.requests = "חייב לכתוב לפחות בקשה אחת";
          this.toast?.showError("חייב לכתוב לפחות בקשה אחת");
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
          // Wait a bit for store to be ready, then check
          await this.$nextTick();
          // Try multiple times if user is not loaded yet
          let attempts = 0;
          while (attempts < 10 && !this.store?.user) {
            await new Promise((resolve) => setTimeout(resolve, 200));
            attempts++;
          }
          // Check payment method from store.user.hasPaymentMethod
          // If user is not loaded, try to load it
          if (!this.store?.user && this.$route?.params?.id) {
            try {
              await this.store.fetchDashboardData(this.$route.params.id);
            } catch (error) {
              // Error loading user, continue anyway
            }
          }
          
          // Use hasPaymentMethod from store.user
          if (this.store?.user?.hasPaymentMethod) {
            // User has payment method - load it
            await this.loadSavedPaymentMethod();
          } else {
            // No payment method - show form
            this.showChangePaymentMethod = false;
            this.savedPaymentMethod = null;
            this.paymentMethodId = null;
            this.isCreditCardValid = false;
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
      const isSelected = this.manuallySelectedSubcategories.some(
        (sub) =>
          sub && sub.category === categoryName && sub.subcategory === subcategoryName
      );
      return isSelected;
    },
    toggleSubcategory(categoryName, subcategory) {
      // For step 1: Allow multiple selections (checkbox behavior)
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
          isManual: true, // Mark as manually selected
          originalText: subcategory.name,
        });
      }
    },
    selectSingleSubcategory(categoryName, subcategory) {
      // For step 2: Only one can be selected (radio behavior)
      // Clear all previous selections (only one can be selected)
      this.manuallySelectedSubcategories = [];
      
      // Add the selected one
      this.manuallySelectedSubcategories.push({
        category: categoryName,
        subcategory: subcategory.name,
        price: subcategory.price || null,
        workType: subcategory.workType || null,
        isManual: true, // Mark as manually selected
        originalText: subcategory.name,
      });
    },
    confirmManualSelection() {
      if (this.manuallySelectedSubcategories.length === 0) {
        this.toast?.showError("אנא בחר לפחות תת-קטגוריה אחת");
        return;
      }
      
      // Check if we're replacing an existing work item (from step 2)
      if (this.isReplacingWorkItem && this.replacingWorkIndex >= 0) {
        // Replace the work item at the specified index with the selected subcategory
        // In step 2, only one can be selected (radio)
        if (this.manuallySelectedSubcategories.length > 0) {
          const selectedWork = {
            ...this.manuallySelectedSubcategories[0],
            isManual: true,
            originalText: this.manuallySelectedSubcategories[0].subcategory,
          };
          
          if (this.foundCategories[this.replacingWorkIndex]) {
            this.foundCategories[this.replacingWorkIndex] = selectedWork;
          }
          if (this.subcategoryInfoArray[this.replacingWorkIndex]) {
            this.subcategoryInfoArray[this.replacingWorkIndex] = selectedWork;
          }
          
          this.toast?.showSuccess("העבודה עודכנה בהצלחה");
        }
        
        // Reset replacement mode
        this.isReplacingWorkItem = false;
        this.replacingWorkIndex = -1;
        this.manuallySelectedSubcategories = [];
        this.manualSearchQuery = ""; // Clear search
        this.manualSearchType = "category"; // Reset search type
        this.showManualCategorySelector = false;
        return;
      }
      
      // Normal flow from step 1 - add all selected subcategories (can be multiple)
      this.showManualCategorySelector = false;
      // Move to step 2
      this.currentStep = 2;
      this.foundCategories = this.manuallySelectedSubcategories;
      this.subcategoryInfoArray = this.manuallySelectedSubcategories;
      this.isLoadingCategories = false;
      this.manualSearchQuery = ""; // Clear search
      this.manualSearchType = "category"; // Reset search type
      this.toast?.showSuccess(
        `נבחרו ${this.manuallySelectedSubcategories.length} תת-קטגוריות`
      );
    },
    async loadSavedPaymentMethod() {
      try {
        // Try to get userId from multiple sources
        let userId = this.store?.user?._id || this.store?.user?.id;

        if (!userId && this.$route?.params?.id) {
          userId = this.$route.params.id;
        }

        if (!userId) {
          this.showChangePaymentMethod = false;
          this.savedPaymentMethod = null;
          return;
        }

        // Check if user has payment method (from store.user.hasPaymentMethod)
        if (!this.store?.user?.hasPaymentMethod) {
          // No payment method, show form
          this.showChangePaymentMethod = false;
          this.savedPaymentMethod = null;
          this.paymentMethodId = null;
          this.isCreditCardValid = false;
          return;
        }

        // User has payment method - start loading and fetch card details from Stripe
        this.showChangePaymentMethod = false;
        this.isCreditCardValid = true;
        this.isLoadingPaymentMethod = true;

        // Import URL dynamically
        const { URL } = await import("@/Url/url");
        const apiUrl = `${URL}/api/users/${userId}/payment-method`;

        try {
          const response = await axios.get(apiUrl, {
            timeout: 15000, // 15 second timeout
          });

          if (response.data && response.data.success && response.data.hasPaymentMethod) {
            // Set saved payment method from response (card details from Stripe)
            this.paymentMethodId = response.data.paymentMethodId;
            this.savedPaymentMethod = {
              paymentMethodId: response.data.paymentMethodId,
              card: response.data.card || {
                brand: "card",
                last4: "****",
                expMonth: null,
                expYear: null,
              },
            };
          } else {
            // Error - show form
            this.showChangePaymentMethod = false;
            this.savedPaymentMethod = null;
            this.paymentMethodId = null;
            this.isCreditCardValid = false;
          }
        } catch (error) {
          // Error loading payment method details from Stripe, show form
          this.toast?.showError("שגיאה בטעינת פרטי כרטיס האשראי. אנא נסה שוב.");
          this.showChangePaymentMethod = false;
          this.savedPaymentMethod = null;
          this.paymentMethodId = null;
          this.isCreditCardValid = false;
        } finally {
          this.isLoadingPaymentMethod = false;
        }
      } catch (error) {
        // Error loading payment method, show form
        this.showChangePaymentMethod = false;
        this.savedPaymentMethod = null;
        this.isLoadingPaymentMethod = false;
      }
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
      this.isEditingLocation = true;

      // Show loading state for location
      this.isLoadingLocation = true;

      try {
        // Simple location finding - just 5 seconds
        const { getImprovedLocation } = await import("@/utils/geolocation");
        const improvedLocation = await getImprovedLocation(5000); // 5 seconds

        if (
          !improvedLocation ||
          !improvedLocation.lat ||
          !improvedLocation.lon
        ) {
          throw new Error("לא הצלחנו לקבל מיקום מדויק");
        }

        // Store coordinates
        this.geoCoordinates = {
          lat: improvedLocation.lat,
          lon: improvedLocation.lon,
        };
        this.call.coordinates = {
          lat: improvedLocation.lat,
          lng: improvedLocation.lon,
        };

        // Now do reverse geocoding to get the city name from coordinates
        try {
          const response = await axios.get(`${URL}/reverse-geocode`, {
            params: {
              lat: improvedLocation.lat,
              lng: improvedLocation.lon,
            },
          });

          if (response.data && response.data.success) {
            // Use city name if available, otherwise use address or fullAddress
            const cityName = response.data.city;
            const address = response.data.address || response.data.fullAddress;
            const fullAddress = response.data.fullAddress;
            const streetNumber = response.data.streetNumber || response.data.houseNumber || response.data.number;
            
            // Build location string with city and street number
            let locationString = "";
            if (cityName) {
              locationString = cityName;
              // Add street number if available
              if (streetNumber) {
                locationString = `${cityName} ${streetNumber}`;
              }
              this.call.location = locationString;
              this.detectedLocation = locationString;
            } else if (fullAddress) {
              // Try to extract city name from fullAddress if it contains a comma
              const parts = fullAddress.split(',').map(p => p.trim());
              if (parts.length > 1) {
                // Last part is usually the city
                const potentialCity = parts[parts.length - 1];
                locationString = potentialCity;
                // Add street number if available
                if (streetNumber) {
                  locationString = `${potentialCity} ${streetNumber}`;
                }
                this.call.location = locationString;
                this.detectedLocation = locationString;
              } else {
                // Use full address
                this.call.location = fullAddress;
                this.detectedLocation = fullAddress;
              }
            } else if (address) {
              // Fallback to address if no city found
              locationString = address;
              // Add street number if available
              if (streetNumber) {
                locationString = `${address} ${streetNumber}`;
              }
              this.call.location = locationString;
              this.detectedLocation = locationString;
            } else {
              // Fallback if no address data
              this.detectedLocation = "מיקום נוכחי";
              this.call.location = "מיקום נוכחי";
            }
            
            // Set house number if available from reverse geocoding
            if (streetNumber && !this.call.houseNumber) {
              this.call.houseNumber = streetNumber;
            }
            
            this.toast?.showSuccess("מיקום נמצא בהצלחה");
          } else {
            // Fallback if reverse geocoding fails
            this.detectedLocation = "מיקום נוכחי";
            this.call.location = "מיקום נוכחי";
            this.toast?.showSuccess("מיקום נמצא בהצלחה");
          }
        } catch (geocodeError) {
          // Fallback if reverse geocoding fails
          this.detectedLocation = "מיקום נוכחי";
          this.call.location = "מיקום נוכחי";
          this.toast?.showSuccess("מיקום נמצא בהצלחה");
        }

        this.clearError("location");
        this.isEditingLocation = false;

      } catch (error) {
        console.error("[CreateCall] Location error:", error);
        this.toast?.showError(
          error.message || "לא הצלחנו לקבל את המיקום. אנא נסה שוב או בחר מיקום ידנית."
        );
        this.usingMyLocation = false;
        this.detectedLocation = null;
        this.call.location = "";
      } finally {
        this.isLoadingLocation = false;
      }
    },
    
    // Reset location to allow selecting a new one
    resetLocation() {
      this.detectedLocation = null;
      this.selectedMapLocation = null;
      this.call.location = "";
      this.call.houseNumber = "";
      this.usingMyLocation = false;
      this.isEditingLocation = false;
      this.geoCoordinates = null;
      this.clearError("location");
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

      // Only start timer if input doesn't have focus
      if (!this.isLocationInputFocused) {
        // Reset and restart the auto-close timer (2 seconds of no typing)
        if (this.locationInputTimeout) {
          clearTimeout(this.locationInputTimeout);
        }
        this.locationInputTimeout = setTimeout(() => {
          if (this.isEditingLocation && !this.isLocationInputFocused && !this.isHouseNumberInputFocused) {
            this.isEditingLocation = false;
          }
        }, 2000);
      }

      if (!value || value.trim() === "" || value !== "המיקום שלי") {
        this.usingMyLocation = false;
        this.detectedLocation = null;
        this.call.coordinates = {};
        this.selectedMapLocation = null;

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
        // Don't close editing mode automatically - let user fill house number first
        // isEditingLocation will be set to false when user clicks "סגור" button or after 2 seconds of no typing
      }
    },
    toggleLocationEdit() {
      // Clear timer when manually toggling edit mode
      if (this.locationInputTimeout) {
        clearTimeout(this.locationInputTimeout);
        this.locationInputTimeout = null;
      }
      this.isEditingLocation = !this.isEditingLocation;
    },
    onHouseNumberInput() {
      // Only start timer if input doesn't have focus
      if (!this.isHouseNumberInputFocused) {
        // Reset and restart the auto-close timer (2 seconds of no typing)
        if (this.locationInputTimeout) {
          clearTimeout(this.locationInputTimeout);
        }
        this.locationInputTimeout = setTimeout(() => {
          if (this.isEditingLocation && !this.isLocationInputFocused && !this.isHouseNumberInputFocused) {
            this.isEditingLocation = false;
          }
        }, 2000);
      }
      this.clearError("houseNumber");
    },
    onLocationInputFocus() {
      // Clear timer when input gets focus
      this.isLocationInputFocused = true;
      if (this.locationInputTimeout) {
        clearTimeout(this.locationInputTimeout);
        this.locationInputTimeout = null;
      }
    },
    onLocationInputBlur() {
      // Start timer when input loses focus (2 seconds of no typing)
      this.isLocationInputFocused = false;
      if (this.locationInputTimeout) {
        clearTimeout(this.locationInputTimeout);
      }
      this.locationInputTimeout = setTimeout(() => {
        if (this.isEditingLocation && !this.isLocationInputFocused && !this.isHouseNumberInputFocused) {
          this.isEditingLocation = false;
        }
      }, 2000);
    },
    onHouseNumberFocus() {
      // Clear timer when input gets focus
      this.isHouseNumberInputFocused = true;
      if (this.locationInputTimeout) {
        clearTimeout(this.locationInputTimeout);
        this.locationInputTimeout = null;
      }
    },
    onHouseNumberBlur() {
      // Start timer when input loses focus (2 seconds of no typing)
      this.isHouseNumberInputFocused = false;
      if (this.locationInputTimeout) {
        clearTimeout(this.locationInputTimeout);
      }
      this.locationInputTimeout = setTimeout(() => {
        if (this.isEditingLocation && !this.isLocationInputFocused && !this.isHouseNumberInputFocused) {
          this.isEditingLocation = false;
        }
      }, 2000);
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
          this.isEditingLocation = false;
        } else {
          this.call.location = "מיקום שנבחר במפה";
          this.locationEnglishName = null;
          this.call.coordinates = {
            lat: lat,
            lng: lng,
          };
          this.usingMyLocation = false;
          this.selectedMapLocation = { lat, lng };
          this.isEditingLocation = false;
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
        this.isEditingLocation = false;
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

        const submitSubcategoryInfo = (this.subcategoryInfoArray || []).map(
          (subcat) => ({
            category: subcat.category,
            subcategory: subcat.subcategory,
            price: subcat.price ?? null,
            workType: subcat.workType ?? null,
          })
        );

        // Split jobs: quoted jobs (bid) are separate, fixed price jobs are together
        const quotedJobs = submitSubcategoryInfo.filter(
          (subcat) => subcat.price === "bid" || subcat.price === "quoted"
        );
        const fixedPriceJobs = submitSubcategoryInfo.filter(
          (subcat) => subcat.price && subcat.price !== "bid" && subcat.price !== "quoted" && typeof subcat.price === "number"
        );

        // If there are quoted jobs, create each one separately
        if (quotedJobs.length > 0) {
          // Start patience message interval
          this.requestStartTime = Date.now();
          this.startPatienceMessageInterval();

          try {
            // Create each quoted job separately
            const quotedPromises = quotedJobs.map(async (quotedSub) => {
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

              return axios.post(
                `${URL}/create-call-quoted`,
                quotedCallData,
                {
                  headers: { "Content-Type": "application/json" },
                }
              );
            });

            // Wait for all quoted jobs to be created
            const quotedResponses = await Promise.all(quotedPromises);
            const allQuotedSuccess = quotedResponses.every(
              (response) => response.data.success
            );

            this.stopPatienceMessageInterval();

            if (allQuotedSuccess && fixedPriceJobs.length === 0) {
              // Only quoted jobs, all succeeded - redirect
              this.isLoading = false;
              const quotedCount = quotedJobs.length;
              this.toast?.showSuccess(
                `${quotedCount} ${quotedCount === 1 ? "עבודה נוצרה" : "עבודות נוצרו"} במצב הצעת מחיר! ההנדימנים יוכלו להציע מחירים.`
              );
              setTimeout(() => {
                this.$router.push(`/Dashboard/${this.$route.params.id}`);
              }, 2000);
              return; // Exit early if only quoted jobs
            } else if (!allQuotedSuccess) {
              // Some quoted jobs failed
              this.isLoading = false;
              this.toast?.showError(
                "חלק מהעבודות עם הצעת מחיר לא נוצרו. נסה שוב."
              );
              return;
            }
            // If there are also fixed price jobs, continue to create them
          } catch (error) {
            this.stopPatienceMessageInterval();
            this.isLoading = false;
            const errorMessage =
              error.response?.data?.message ||
              error.message ||
              "לא הצלחנו ליצור את העבודות עם הצעת מחיר. נסה שוב מאוחר יותר.";
            this.toast?.showError(errorMessage);
            return;
          }
        }

        // If there are fixed price jobs, create them together
        if (fixedPriceJobs.length > 0) {
          // Continue with regular job creation for fixed price jobs
          // Add only fixed price subcategoryInfo array to callData
          callData.subcategoryInfo = fixedPriceJobs;
        } else {
          // No fixed price jobs, only quoted jobs (already created above)
          return;
        }

        // Continue with regular job creation flow for fixed price jobs
        // (subcategoryInfo was already set above if there are fixed price jobs)

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

      logger.log(`[CreateCall] 🚀 fetchCategoriesFromAI called - currentStep: ${this.currentStep}, isLoadingCategories: ${this.isLoadingCategories}`);
      
      try {
        // Get all valid requests (filter out empty ones)
        const validRequests = this.call.requests.filter(
          (r) => r && r.trim().length > 0
        );

        logger.log(`[CreateCall] 🚀 fetchCategoriesFromAI - validRequests: ${validRequests.length}`, { validRequests });

        if (validRequests.length === 0) {
          this.toast?.showError("יש למלא לפחות בקשה אחת");
          this.isLoadingCategories = false;
          return;
        }

        // Call new AI matching endpoint for EACH request separately
        const matchPromises = validRequests.map(async (request) => {
          const trimmedRequest = request.trim();
          try {
            logger.log(
              `[CreateCall] Sending AI match request for: "${trimmedRequest}"`
            );
            
            const response = await axios.post(
              `${URL}/api/ai/match-subcategory`,
              { shortText: trimmedRequest },
              {
                headers: { "Content-Type": "application/json" },
              }
            );
            
            // Log what we received from server
            logger.log(
              `[CreateCall] Received response from server for "${trimmedRequest}":`,
              {
                success: response.data.success,
                matched: response.data.matched,
                confidence: response.data.confidence,
                category: response.data.category,
                subcategory: response.data.subcategory,
                canonicalSubcategory: response.data.canonicalSubcategory,
                price: response.data.price,
                workType: response.data.workType,
                fullResponse: response.data,
              }
            );
            
            return {
              originalRequest: trimmedRequest,
              success: response.data.success,
              matchResult: response.data,
            };
          } catch (error) {
            logger.error(
              `[CreateCall] Error in AI match request for "${trimmedRequest}":`,
              { error: error.message, stack: error.stack }
            );
            return {
              originalRequest: trimmedRequest,
              success: false,
              error: error.message,
            };
          }
        });

        const results = await Promise.all(matchPromises);

        const toText = (value, depth = 0) => {
          if (typeof value === "string") return value;
          if (typeof value === "number") return String(value);
          if (Array.isArray(value)) return toText(value[0], depth + 1);
          if (value && typeof value === "object") {
            if (depth >= 4) return "";
            const candidate =
              value.name ||
              value.title ||
              value.label ||
              value.hebrewName ||
              value.subcategory ||
              value.category ||
              "";
            return toText(candidate, depth + 1);
          }
          return "";
        };

        const toConfidence = (value) => {
          if (value === null || value === undefined) return 0;
          let n;
          if (typeof value === "string") {
            const cleaned = value.trim().replace("%", "").replace(",", ".");
            n = Number(cleaned);
          } else {
            n = Number(value);
          }
          if (!Number.isFinite(n)) return 0;
          // Accept both [0..1] and [0..100] formats
          if (n > 1 && n <= 100) n = n / 100;
          if (n < 0) n = 0;
          if (n > 1) n = 1;
          return n;
        };

        // Process results and build subcategoryInfoArray
        const processedCategories = [];
        let firstLowConfidenceMatch = null; // For recommendation (Case B)
        let lowConfidenceIndex = -1; // Index of the work with low confidence

        results.forEach((result, index) => {
          if (!result.success || !result.matchResult) {
            logger.warn(
              `[CreateCall] Skipping result ${index}:`,
              { success: result.success, matchResult: result.matchResult }
            );
            return;
          }

          const matchResult = result.matchResult;
          const categoryName = toText(matchResult.category) || "כללי";
          
          // Extract AI subcategory - always use what AI found if available
          // Priority: canonicalSubcategory > subcategory (if different from original)
          // IMPORTANT: Even if matched=false, if canonicalSubcategory exists, AI found something!
          let subcategoryName = "";
          
          // Extract AI subcategory - always prefer what AI returned
          // Priority: canonicalSubcategory > subcategory (from matchResult)
          // IMPORTANT: Even if subcategory equals originalText, if matched=true, it's what AI found!
          if (matchResult.canonicalSubcategory) {
            // canonicalSubcategory is always what AI found
            subcategoryName = toText(matchResult.canonicalSubcategory);
          } 
          else if (matchResult.subcategory) {
            const aiSubcategory = toText(matchResult.subcategory);
            // If matched=true, subcategory is what AI found (even if same as original)
            // If matched=false, only use if different from original (to avoid using user input)
            // IMPORTANT: If subcategory is null/empty, it means AI didn't find anything - don't use it
            if (aiSubcategory && aiSubcategory.trim() !== '') {
              if (matchResult.matched) {
                // When matched=true, subcategory is what AI found - always use it
                subcategoryName = aiSubcategory;
              } else if (aiSubcategory.trim() !== result.originalRequest.trim()) {
                // When matched=false, only use if different from original
                subcategoryName = aiSubcategory;
              }
            }
          }
          
          // If subcategoryName is still empty here, it means:
          // - matched=false AND no canonicalSubcategory AND subcategory equals originalText
          // In this case, we'll use originalText in the display logic below

          const confidenceValue = toConfidence(
            matchResult.confidence ?? matchResult.fullResponse?.confidence
          );
          const matchedValue = Boolean(
            matchResult.matched ?? matchResult.fullResponse?.matched
          );


          const aiSelection = {
            category: categoryName,
            subcategory: subcategoryName,
            price: matchResult.price ?? null,
            workType: matchResult.workType || "קבלנות",
            matched: matchedValue,
            confidence: confidenceValue,
          };
          
          // Log for debugging - check if AI subcategory is extracted correctly
          logger.log(
            `[CreateCall] 🔍 Extracted AI data for "${result.originalRequest}":`,
            {
              matched: matchedValue,
              confidence: confidenceValue,
              categoryName,
              subcategoryName: subcategoryName || "⚠️ EMPTY",
              originalRequest: result.originalRequest,
              matchResultCanonical: matchResult.canonicalSubcategory || "⚠️ NULL",
              matchResultSubcategory: matchResult.subcategory || "⚠️ NULL",
              matchResultMatched: matchResult.matched,
              matchResultConfidence: matchResult.confidence,
              aiSelection: {
                ...aiSelection,
                subcategory: aiSelection.subcategory || "⚠️ EMPTY",
              },
              willGoToCaseA: matchedValue && confidenceValue >= 0.7,
              willGoToCaseB: confidenceValue >= 0.5 && confidenceValue < 0.7,
              willGoToCaseC: !(matchedValue && confidenceValue >= 0.7) && !(confidenceValue >= 0.5 && confidenceValue < 0.7),
            }
          );

          // Case A: High confidence (>= 0.7) - Fixed price
          if (matchedValue && confidenceValue >= 0.7) {
            // CRITICAL: subcategoryName contains what AI found (canonicalSubcategory or subcategory from AI)
            // Always use subcategoryName if available, otherwise fallback to matchResult.subcategory
            const displaySubcategory = subcategoryName || toText(matchResult.subcategory) || result.originalRequest;
            
            const categoryObj = {
              category: categoryName,
              subcategory: displaySubcategory, // This is what AI found - will be displayed
              price: matchResult.price ?? null,
              workType: matchResult.workType || "קבלנות",
              originalText: result.originalRequest, // Keep original text for quotation option
              confidence: confidenceValue, // Store confidence for UI - CRITICAL: Must be stored here!
              needsRecommendation: false, // No recommendation needed
              showAiSelection: true,
              ai: {
                ...aiSelection,
                confidence: confidenceValue, // Ensure confidence is in ai object too
              },
              aiResponse: {
                ...aiSelection,
                confidence: confidenceValue, // Ensure confidence is in aiResponse object too
              },
            };
            
            logger.log(`[CreateCall] Case A - Created categoryObj:`, {
              subcategoryName,
              matchResultSubcategory: matchResult.subcategory,
              displaySubcategory,
              categoryObjSubcategory: categoryObj.subcategory,
              originalText: result.originalRequest,
            });
            
            processedCategories.push(categoryObj);
          }
          // Case B: Medium confidence (0.5-0.69) - Show recommendation on card, but still display AI work by default
          // This includes cases where matched=false but confidence >= 0.5 (AI found something but not 100% sure)
          else if (confidenceValue >= 0.5 && confidenceValue < 0.7) {
            // Store first low confidence match for tracking
            if (!firstLowConfidenceMatch) {
              firstLowConfidenceMatch = {
                matched: true,
                confidence: confidenceValue,
                category: categoryName,
                subcategory: subcategoryName,
                price: matchResult.price,
                workType: matchResult.workType || "קבלנות",
                originalText: result.originalRequest,
              };
            }
            // IMPORTANT: Always show AI subcategory as default display - this is what AI found
            // subcategoryName should contain the AI work (canonicalSubcategory or subcategory from AI)
            // If subcategoryName is empty, check matchResult.subcategory - if it exists and is different from original, use it
            // Otherwise, use originalText (but this should rarely happen if AI found something)
            let displaySubcategory = subcategoryName;
            if (!displaySubcategory && matchResult.subcategory) {
              const serverSubcategory = toText(matchResult.subcategory);
              // Only use if it's different from original (to avoid showing user input when AI didn't find anything)
              if (serverSubcategory && serverSubcategory.trim() !== result.originalRequest.trim()) {
                displaySubcategory = serverSubcategory;
                // Update aiSelection to include this work
                aiSelection.subcategory = serverSubcategory;
              }
            }
            // Fallback to originalText only if no AI work found
            if (!displaySubcategory) {
              displaySubcategory = result.originalRequest;
            }
            
            logger.log(
              `[CreateCall] Case B - Building categoryObj for "${result.originalRequest}":`,
              {
                confidence: confidenceValue,
                subcategoryName,
                matchResultSubcategory: matchResult.subcategory,
                displaySubcategory,
                originalRequest: result.originalRequest,
                aiSelectionSubcategory: aiSelection.subcategory,
              }
            );
            
            const categoryObj = {
              category: categoryName,
              subcategory: displaySubcategory, // Default: Show AI subcategory (what AI found)
              price: matchResult.price ?? null,
              workType: matchResult.workType || "קבלנות",
              originalText: result.originalRequest, // Keep original text for quotation option
              confidence: confidenceValue, // Store confidence for UI - CRITICAL: Must be stored here!
              needsRecommendation: true, // Show recommendation message on this card
              showAiSelection: false, // But still show AI subcategory in display
              ai: {
                ...aiSelection,
                confidence: confidenceValue, // Ensure confidence is in ai object too
              },
              aiResponse: {
                ...aiSelection,
                confidence: confidenceValue, // Ensure confidence is in aiResponse object too
              },
            };
            processedCategories.push(categoryObj);
          }
          // Case C: Low confidence/no match (< 0.7) - require user decision (3 buttons)
          // BUT ALSO: confidence >= 0.5 but < 0.7 or matched=false (AI found something but not confident enough)
          else {
            // IMPORTANT: Case C handling
            // If matched=false AND confidence=0, there's no AI work to show - use originalText
            // But if confidence > 0 (even if matched=false), the server might have found something
            // Priority: subcategoryName (from canonicalSubcategory) > matchResult.subcategory (if different from original) > originalText
            
            // CRITICAL: If we have subcategoryName (from AI), use it as display AND put it in aiSelection
            // Otherwise, check if matchResult.subcategory is different from original - if so, it might be from AI
            // IMPORTANT: If no AI work found, set displaySubcategory to null (not originalText) so template knows there's no AI work
            let displaySubcategory = null; // Default to null (means no AI work)
            
            logger.log(
              `[CreateCall] 🔍 Case C - Before determining displaySubcategory for "${result.originalRequest}":`,
              {
                subcategoryName: subcategoryName || "⚠️ EMPTY",
                matchResultSubcategory: matchResult.subcategory || "⚠️ NULL",
                matchResultCanonical: matchResult.canonicalSubcategory || "⚠️ NULL",
                originalRequest: result.originalRequest,
                matched: matchedValue,
                confidence: confidenceValue,
                aiSelectionBeforeUpdate: JSON.parse(JSON.stringify(aiSelection)),
              }
            );
            
            // Update aiSelection if we found AI work
            if (subcategoryName) {
              // subcategoryName was extracted from AI - use it
              displaySubcategory = subcategoryName;
              // Update aiSelection to include the AI work
              aiSelection.subcategory = subcategoryName;
              logger.log(`[CreateCall] ✅ Case C - Using subcategoryName: "${displaySubcategory}", updated aiSelection.subcategory`);
            } else if (matchResult.subcategory) {
              const serverSubcategory = toText(matchResult.subcategory);
              // If server returned something different from original, it might be from AI processing
              // Even if matched=false, if confidence > 0, the server processed it
              if (serverSubcategory && serverSubcategory.trim() !== result.originalRequest.trim()) {
                // Server returned something different - use it and put in aiSelection
                displaySubcategory = serverSubcategory;
                aiSelection.subcategory = serverSubcategory;
                logger.log(`[CreateCall] ✅ Case C - Using matchResult.subcategory (different from original): "${displaySubcategory}", updated aiSelection.subcategory`);
              } else {
                // Server returned originalText or same as original - no AI work found
                // Keep displaySubcategory as null - template will use originalText
                // Keep aiSelection.subcategory empty - no AI work found
                logger.log(`[CreateCall] ⚠️ Case C - matchResult.subcategory equals originalText, no AI work found. displaySubcategory=null, aiSelection.subcategory remains empty`);
              }
            } else {
              // No subcategory from server - no AI work found
              // Keep displaySubcategory as null - template will use originalText
              logger.log(`[CreateCall] ⚠️ Case C - No matchResult.subcategory, displaySubcategory=null (template will use originalText), aiSelection.subcategory remains empty`);
            }
            
            logger.log(`[CreateCall] 🔍 Case C - After determining displaySubcategory:`, {
              displaySubcategory,
              aiSelectionAfterUpdate: JSON.parse(JSON.stringify(aiSelection)),
            });
            
            // IMPORTANT: Case C should ALWAYS show recommendation (3 buttons) because:
            // - If matched=false, AI didn't find a match - user needs to decide
            // - If confidence < 0.6, AI is not confident - user needs to decide
            // - Even if confidence=0, we still want to show the 3 buttons so user can choose
            // The only exception: if confidence >= 0.7 and matched=true, that's Case A (handled above)
            const shouldShowRecommendation = true; // ALWAYS show recommendation in Case C
            
            const categoryObj = {
              category: categoryName || "כללי",
              // IMPORTANT: If displaySubcategory is null, it means no AI work - template will use originalText
              // If displaySubcategory exists, it's what AI found (even if same as original)
              subcategory: displaySubcategory || null, // null if no AI work, otherwise AI's subcategory
              price: matchResult.price ?? null,
              workType: "קבלנות",
              originalText: result.originalRequest, // Keep original text for quotation option
              confidence: confidenceValue, // Store confidence for UI - CRITICAL: Must be stored here!
              needsRecommendation: shouldShowRecommendation, // ALWAYS true in Case C - show 3 buttons
              showAiSelection: false,
              ai: {
                ...aiSelection,
                confidence: confidenceValue, // Ensure confidence is in ai object too
              },
              aiResponse: {
                ...aiSelection,
                confidence: confidenceValue, // Ensure confidence is in aiResponse object too
              },
            };
            
            logger.log(
              `[CreateCall] Case C - Created categoryObj for "${result.originalRequest}":`,
              {
                categoryObj: JSON.parse(JSON.stringify(categoryObj)), // Deep copy for logging
                displaySubcategory,
                originalText: result.originalRequest,
                categoryObjSubcategory: categoryObj.subcategory,
                categoryObjOriginalText: categoryObj.originalText,
                categoryObjAiSubcategory: categoryObj.ai?.subcategory,
                categoryObjAiResponseSubcategory: categoryObj.aiResponse?.subcategory,
                subcategoryEqualsOriginal: categoryObj.subcategory === categoryObj.originalText,
                aiSubcategoryEmpty: !categoryObj.ai?.subcategory || categoryObj.ai.subcategory === "",
                aiResponseSubcategoryEmpty: !categoryObj.aiResponse?.subcategory || categoryObj.aiResponse.subcategory === "",
              }
            );
            
            processedCategories.push(categoryObj);
          }
        });

        // Log final processed categories with detailed info
        logger.log(
          `[CreateCall] Final processedCategories array:`,
          processedCategories.map((cat, idx) => ({
            index: idx,
            category: cat.category,
            subcategory: cat.subcategory,
            originalText: cat.originalText,
            confidence: cat.confidence,
            needsRecommendation: cat.needsRecommendation,
            showAiSelection: cat.showAiSelection,
            subcategoryEqualsOriginal: cat.subcategory === cat.originalText,
            subcategoryValue: cat.subcategory,
            originalTextValue: cat.originalText,
            fullCategory: cat,
          }))
        );
        
        // Set the results - CRITICAL POINT: This is where data is assigned
        logger.log(`[CreateCall] ⚠️ BEFORE ASSIGNMENT - About to set foundCategories:`, {
          processedCategoriesCount: processedCategories.length,
          processedCategoriesDetails: processedCategories.map((cat, idx) => ({
            index: idx,
            subcategory: cat.subcategory,
            originalText: cat.originalText,
            aiSubcategory: cat.ai?.subcategory || "EMPTY",
            aiResponseSubcategory: cat.aiResponse?.subcategory || "EMPTY",
            confidence: cat.confidence,
            needsRecommendation: cat.needsRecommendation,
            subcategoryEqualsOriginal: cat.subcategory === cat.originalText,
          })),
        });
        
        this.subcategoryInfoArray = processedCategories;
        // Always show categories now - recommendation will be shown on specific card
        this.foundCategories = processedCategories;
        
        // Log IMMEDIATELY AFTER ASSIGNMENT
        logger.log(
          `[CreateCall] ⚠️ IMMEDIATELY AFTER ASSIGNMENT - foundCategories:`,
          {
            foundCategoriesLength: this.foundCategories.length,
            allCategoriesDetails: this.foundCategories.map((cat, idx) => ({
              index: idx,
              subcategory: cat.subcategory,
              originalText: cat.originalText,
              aiSubcategory: cat.ai?.subcategory || "EMPTY",
              aiResponseSubcategory: cat.aiResponse?.subcategory || "EMPTY",
              confidence: cat.confidence,
              needsRecommendation: cat.needsRecommendation,
              subcategoryEqualsOriginal: cat.subcategory === cat.originalText,
            })),
          }
        );
        
        // Also log after nextTick to see if Vue reactivity changed anything
        this.$nextTick(() => {
          logger.log(
            `[CreateCall] ⚠️ AFTER VUE REACTIVITY (nextTick) - foundCategories:`,
            {
              foundCategoriesLength: this.foundCategories.length,
              currentStep: this.currentStep,
              shouldShowBlock: this.currentStep === 2 && this.foundCategories.length > 0,
              isLoadingCategories: this.isLoadingCategories,
              allCategoriesDetails: this.foundCategories.map((cat, idx) => ({
                index: idx,
                subcategory: cat.subcategory,
                originalText: cat.originalText,
                aiSubcategory: cat.ai?.subcategory || "EMPTY",
                aiResponseSubcategory: cat.aiResponse?.subcategory || "EMPTY",
                confidence: cat.confidence,
                needsRecommendation: cat.needsRecommendation,
                subcategoryEqualsOriginal: cat.subcategory === cat.originalText,
              })),
            }
          );
        });
        
        // Clear aiMatchResult - we don't need it anymore as recommendation is on card
        this.aiMatchResult = null;
      } catch (error) {
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
      const applyQuotationChoice = (item) => {
        if (!item) return item;

        // Keep AI snapshot (so user can still choose "continue" later)
        const ai = item.ai || item.aiResponse;

        return {
          ...item,
          // Quotation flow should show the original request text as the title
          showAiSelection: false,
          // Per requirement: category should become "כללי" when opening quotation
          // And subcategory should be originalText for quotation
          category: "כללי",
          subcategory: item.originalText || item.subcategory,
          price: "bid",
          needsRecommendation: false,
          ai: item.ai || ai,
          aiResponse: item.aiResponse || ai,
        };
      };

      if (this.subcategoryInfoArray[index]) {
        this.subcategoryInfoArray[index] = applyQuotationChoice(
          this.subcategoryInfoArray[index]
        );
      }
      if (this.foundCategories[index]) {
        this.foundCategories[index] = applyQuotationChoice(
          this.foundCategories[index]
        );
      }
    },
    dismissRecommendation(index) {
      // User clicked "המשך עם העבודה שמצאנו" - restore AI selection and dismiss the recommendation
      const toText = (value, depth = 0) => {
        if (typeof value === "string") return value;
        if (typeof value === "number") return String(value);
        if (Array.isArray(value)) return toText(value[0], depth + 1);
        if (value && typeof value === "object") {
          if (depth >= 4) return "";
          const candidate =
            value.name ||
            value.title ||
            value.label ||
            value.hebrewName ||
            value.subcategory ||
            value.category ||
            "";
          return toText(candidate, depth + 1);
        }
        return "";
      };

      const pickAiSelection = (item) => {
        // Supports both new shape (ai/aiResponse=aiSelection) and legacy shape (aiResponse.fullResponse)
        const raw =
          item?.ai ||
          item?.aiResponse ||
          item?.aiResponse?.fullResponse ||
          item?.aiResponse?.aiResponse ||
          item?.fullAIResponse;
        if (!raw) return null;

        const category = toText(raw.category);
        const subcategory = toText(raw.canonicalSubcategory || raw.subcategory);

        return {
          category: category || "כללי",
          subcategory,
          price: raw.price ?? null,
          workType: raw.workType || "קבלנות",
        };
      };

      const applyContinueChoice = (item) => {
        if (!item) return item;

        const aiSel = pickAiSelection(item);
        const aiSnapshot = item.ai || item.aiResponse || aiSel;

        const safeCategory = toText(aiSel?.category || item.category) || "כללי";
        const safeSubcategory = toText(
          aiSel?.subcategory || item.subcategory || item.originalText
        );

        return {
          ...item,
          // Always normalize display fields to primitives so the UI can never render an object
          category: safeCategory,
          subcategory: safeSubcategory,
          ...(aiSel
            ? {
                price: aiSel.price ?? item.price,
                workType: aiSel.workType || item.workType,
              }
            : {}),
          needsRecommendation: false,
          showAiSelection: true,
          ai: item.ai || aiSnapshot,
          aiResponse: item.aiResponse || aiSnapshot,
        };
      };

      if (this.foundCategories[index]) {
        this.foundCategories[index] = applyContinueChoice(
          this.foundCategories[index]
        );
      }
      if (this.subcategoryInfoArray[index]) {
        this.subcategoryInfoArray[index] = applyContinueChoice(
          this.subcategoryInfoArray[index]
        );
      }
    },

    openNotRightModal(index) {
      // Open modal for choosing between manual selection or quotation
      this.notRightModalIndex = index;
      this.showNotRightModal = true;
    },
    async openManualSelectionForNotRight() {
      // Close the "not right" modal
      this.showNotRightModal = false;
      
      // Load categories if not already loaded
      if (this.allCategories.length === 0) {
        try {
          const data = await loadCategories();
          this.allCategories = data.categories || [];
        } catch (error) {
          this.toast?.showError("לא הצלחנו לטעון את הקטגוריות");
          return;
        }
      }
      
      // Store that we're in "replace mode"
      this.isReplacingWorkItem = true;
      this.replacingWorkIndex = this.notRightModalIndex;
      // Clear previous selections
      this.manuallySelectedSubcategories = [];
      
      // Open manual category selector - when user selects, we'll replace the item at notRightModalIndex
      this.showManualCategorySelector = true;
    },
    openQuotationModalForNotRight() {
      // Close the "not right" modal and open quotation name modal
      const category = this.foundCategories[this.notRightModalIndex];
      // Initialize with current subcategory or originalText
      this.quotationModalJobName = category?.subcategory || category?.originalText || "";
      this.showNotRightModal = false;
      this.showQuotationNameModal = true;
    },
    confirmQuotationJob() {
      // Update the job with the new name and set price to "bid"
      if (this.notRightModalIndex >= 0 && this.quotationModalJobName.trim()) {
        const index = this.notRightModalIndex;
        const newJobName = this.quotationModalJobName.trim();
        
        // Update both arrays
        if (this.foundCategories[index]) {
          this.foundCategories[index] = {
            ...this.foundCategories[index],
            subcategory: newJobName,
            originalText: newJobName, // Also update originalText
            price: "bid",
            needsRecommendation: false,
            isManual: true, // Mark as manual
          };
        }
        
        if (this.subcategoryInfoArray[index]) {
          this.subcategoryInfoArray[index] = {
            ...this.subcategoryInfoArray[index],
            subcategory: newJobName,
            originalText: newJobName,
            price: "bid",
            needsRecommendation: false,
            isManual: true, // Mark as manual
          };
        }
        
        this.showQuotationNameModal = false;
        this.notRightModalIndex = -1;
        this.quotationModalJobName = "";
      }
    },
    getConfidencePct(category) {
      // Try confidencePct first (from server) - already in percentage format
      if (category?.confidencePct !== undefined && category?.confidencePct !== null) {
        return Math.round(category.confidencePct);
      }
      if (category?.ai?.confidencePct !== undefined && category?.ai?.confidencePct !== null) {
        return Math.round(category.ai.confidencePct);
      }
      if (category?.aiResponse?.confidencePct !== undefined && category?.aiResponse?.confidencePct !== null) {
        return Math.round(category.aiResponse.confidencePct);
      }
      
      // Fallback to confidence (0-1 range) and convert to percentage
      const raw =
        category?.confidence ??
        category?.ai?.confidence ??
        category?.aiResponse?.confidence ??
        category?.aiResponse?.fullResponse?.confidence ??
        category?.fullAIResponse?.confidence;

      // IMPORTANT: raw can be 0 (which is a valid confidence value), so check for null/undefined only
      // If raw is 0, it means confidence is 0%, not missing!
      if (raw === null || raw === undefined) {
        logger.warn(
          `[CreateCall] getConfidencePct - No confidence found for category:`,
          {
            categoryName: category?.subcategory || category?.originalText,
            hasConfidence: category?.confidence !== null && category?.confidence !== undefined,
            confidenceValue: category?.confidence,
            hasAi: !!category?.ai,
            aiConfidence: category?.ai?.confidence,
            hasAiResponse: !!category?.aiResponse,
            aiResponseConfidence: category?.aiResponse?.confidence,
            categoryKeys: category ? Object.keys(category) : [],
          }
        );
        return 0;
      }

      let n;
      if (typeof raw === "string") {
        const cleaned = raw.trim().replace("%", "").replace(",", ".");
        n = Number(cleaned);
      } else {
        n = Number(raw);
      }
      
      if (!Number.isFinite(n)) {
        logger.warn(
          `[CreateCall] getConfidencePct - Invalid confidence value:`,
          { raw, n, categoryName: category?.subcategory || category?.originalText }
        );
        return 0;
      }
      
      // Handle both [0..1] and [0..100] formats
      // If value is between 1 and 100, convert to 0-1 range
      if (n > 1 && n <= 100) n = n / 100;
      if (n < 0) n = 0;
      if (n > 1) n = 1;
      
      // Convert to percentage (0.75 -> 75)
      const result = Math.round(n * 100);
      
      // Log for debugging when result seems wrong
      if (result === 0 && raw !== null && raw !== undefined && raw !== 0) {
        logger.warn(
          `[CreateCall] getConfidencePct - Result is 0 but raw was not 0:`,
          { raw, n, result, categoryName: category?.subcategory || category?.originalText }
        );
      }
      
      return result;
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
    // Clear location input timeout
    if (this.locationInputTimeout) {
      clearTimeout(this.locationInputTimeout);
      this.locationInputTimeout = null;
    }
    // Clear pulse interval
    if (this.pulseInterval) {
      clearInterval(this.pulseInterval);
      this.pulseInterval = null;
    }
    // Disconnect WebSocket if connected
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  },
  async mounted() {
    // Start pulse animation interval
    this.pulseInterval = setInterval(() => {
      this.pulse = (this.pulse + 1) % 3;
    }, 600);

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
  background: #000;
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
     CreateCall V3 – Phone UI (matches provided Tailwind mocks)
     ========= */
.shell.ccV3 {
  max-width: none;
  padding: 0;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #000;
}

.ccPhone {
  width: 100%;
  max-width: 430px;
  height: 100dvh;
  max-height: 932px;
  background: #0a0a0a;
  border-left: 1px solid rgba(39, 39, 42, 0.5);
  border-right: 1px solid rgba(39, 39, 42, 0.5);
  box-shadow: 0 30px 90px rgba(0, 0, 0, 0.75);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  font-family: Inter, Heebo, system-ui, -apple-system, Segoe UI, Arial,
    sans-serif;
}

.material-symbols-outlined {
  font-variation-settings: "FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 10px;
}

.ccHeader {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(10, 10, 10, 0.92);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid rgba(46, 46, 46, 1);
}

.ccHeaderTop {
  display: grid;
  grid-template-columns: 48px 1fr 48px;
  align-items: center;
  padding: 16px 16px 10px;
}

.ccBack {
  width: 48px;
  height: 48px;
  border-radius: 999px;
  border: none;
  background: transparent;
  color: #fff;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: opacity 0.15s ease, transform 0.15s ease, background 0.15s ease;
  justify-self: start;

  &:hover {
    background: rgba(26, 26, 26, 0.7);
  }

  &:active {
    opacity: 0.7;
    transform: scale(0.98);
  }
}

.ccHeaderTitle {
  text-align: center;
  justify-self: center;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.015em;
  color: #fff;
  margin: 0;
}

.ccHeaderSpacer {
  width: 48px;
  height: 48px;
}

.ccHeaderProgress {
  padding: 0 24px 16px;
  margin-top: 12px;
}

.ccProgressRowV3 {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.ccProgressStepV3 {
  font-size: 13px;
  font-weight: 800;
  color: #fff;
}

.ccProgressPctV3 {
  font-size: 13px;
  font-weight: 900;
  color: #ff8c00;
  letter-spacing: -0.01em;
}

.ccProgressTrackV3 {
  width: 100%;
  height: 10px;
  background: rgba(39, 39, 42, 0.9);
  border-radius: 999px;
  overflow: hidden;
}

.ccHeaderProgress--s2 .ccProgressTrackV3 {
  height: 6px;
}

.ccHeaderProgress--s3 .ccProgressTrackV3,
.ccHeaderProgress--s4 .ccProgressTrackV3 {
  height: 8px;
}

.ccProgressFillV3 {
  height: 100%;
  background: #ff8c00;
  border-radius: 999px;
  box-shadow: 0 0 12px rgba(255, 140, 0, 0.5);
}

.ccMiniStepper {
  margin-top: 14px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 6px;
}

.ccMiniStepperLine {
  position: absolute;
  inset-inline: 0;
  top: 50%;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-50%);
}

.ccMiniStepperLineActive {
  position: absolute;
  right: 0;
  top: 50%;
  height: 1px;
  background: #ff8c00;
  transform: translateY(-50%);
}

.ccMiniStep {
  position: relative;
  z-index: 1;
}

.ccMiniDot {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-size: 10px;
  font-weight: 900;
  background: #161616;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.4);
}

.ccMiniStep.is-done .ccMiniDot {
  background: #ff8c00;
  border-color: #ff8c00;
  color: #000;
}

.ccMiniStep.is-active .ccMiniDot {
  width: 32px;
  height: 32px;
  background: #ff8c00;
  border: 4px solid #0a0a0a;
  color: #000;
  box-shadow: 0 0 10px rgba(255, 140, 0, 0.5);
}

.ccMain {
  flex: 1;
  overflow-y: auto;
  padding: 0 24px;
  -webkit-overflow-scrolling: touch;
}

.ccPad {
  padding-bottom: 140px;
}

.ccStep--2 .ccPad,
.ccStep--4 .ccPad {
  padding-top: 14px;
}

.ccStepIntro {
  padding-top: 24px;
  padding-bottom: 8px;
}

.ccH3 {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #fff;
  line-height: 1.2;
}

.ccSub {
  margin: 6px 0 0;
  font-size: 13px;
  color: rgba(161, 161, 170, 1);
  font-weight: 600;
}

.ccSplitNotice {
  margin-bottom: 20px;
  padding: 16px 18px;
  border-radius: 16px;
  background: linear-gradient(
    135deg,
    rgba(255, 106, 0, 0.12) 0%,
    rgba(255, 140, 0, 0.08) 100%
  );
  border: 1px solid rgba(255, 106, 0, 0.2);
  display: flex;
  align-items: flex-start;
  gap: 14px;
  direction: rtl;
  text-align: right;
}

.ccSplitNotice__icon {
  font-size: 24px;
  flex-shrink: 0;
  line-height: 1;
}

.ccSplitNotice__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ccSplitNotice__title {
  margin: 0;
  font-size: 15px;
  font-weight: 900;
  color: #ff6a00;
  line-height: 1.3;
}

.ccSplitNotice__text {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.5;
}

.ccRow {
  display: flex;
  justify-content: flex-start;
  padding: 10px 0;
}

.ccPillBtn {
  height: 40px;
  padding: 0 18px;
  border-radius: 999px;
  border: 1px solid rgba(63, 63, 70, 1);
  background: rgba(24, 24, 27, 1);
  color: #ff8c00;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: border-color 0.15s ease, transform 0.15s ease,
    background 0.15s ease, opacity 0.15s ease;

  &:hover {
    border-color: rgba(255, 140, 0, 0.5);
  }

  &:active {
    transform: scale(0.98);
  }
}

.ccIcon {
  font-size: 18px;
}

.ccField {
  margin-top: 10px;
}

.ccLabel {
  margin: 0 0 8px;
  padding: 0 4px;
  font-size: 13px;
  font-weight: 800;
  color: rgba(161, 161, 170, 1);
}

.ccInput,
.ccTextarea,
.ccSelect {
  width: 100%;
  box-sizing: border-box;
  border-radius: 18px;
  border: 1px solid rgba(39, 39, 42, 1);
  background: rgba(26, 26, 26, 1);
  color: #fff;
  outline: none;
  transition: box-shadow 0.15s ease, border-color 0.15s ease,
    background 0.15s ease;

  &::placeholder {
    color: rgba(82, 82, 91, 1);
  }

  &:focus {
    border-color: rgba(255, 140, 0, 0.7);
    box-shadow: 0 0 0 4px rgba(255, 140, 0, 0.2);
  }
}

.ccInput {
  padding: 16px 18px;
  font-size: 16px;
  font-weight: 500;
}

.ccInput--tall {
  height: 64px;
  font-size: 18px;
}

.ccExtraReq {
  margin-top: 10px;
  display: flex;
  gap: 10px;
  align-items: center;
}

.ccIconBtn {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  border: 1px solid rgba(39, 39, 42, 1);
  background: rgba(26, 26, 26, 1);
  color: rgba(244, 63, 94, 1);
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: transform 0.15s ease, opacity 0.15s ease;

  &:active {
    transform: scale(0.98);
    opacity: 0.85;
  }
}

.ccAddReq {
  margin-top: 16px;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  border: none;
  background: transparent;
  color: #ff8c00;
  font-weight: 800;
  font-size: 15px;
  cursor: pointer;
  transition: opacity 0.15s ease, transform 0.15s ease;

  &:hover {
    opacity: 0.9;
  }

  &:active {
    transform: scale(0.98);
  }
}

.ccAddReqIcon {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: rgba(255, 140, 0, 0.15);
}

.ccPromo {
  margin-top: 48px;
  border-radius: 24px;
  border: 1px solid rgba(63, 63, 70, 0.5);
  background: radial-gradient(
      120px 120px at 30% 30%,
      rgba(255, 140, 0, 0.22),
      transparent 70%
    ),
    linear-gradient(135deg, rgba(255, 140, 0, 0.08), transparent);
  height: 176px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.ccPromoInner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: rgba(161, 161, 170, 1);
}

.ccPromoGlow {
  position: absolute;
  inset: auto;
  width: 180px;
  height: 180px;
  border-radius: 999px;
  background: rgba(255, 140, 0, 0.2);
  filter: blur(34px);
  opacity: 0.3;
}

.ccPromoIcon {
  font-size: 56px;
  color: rgba(255, 140, 0, 0.4);
  position: relative;
}

.ccPromoTxt {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  opacity: 0.9;
}

.ccMiniNote {
  margin-top: 14px;
  font-size: 12px;
  color: rgba(113, 113, 122, 1);
}

.ccErr {
  margin-top: 8px;
  font-size: 12px;
  font-weight: 800;
  color: rgba(244, 63, 94, 1);
}

.ccCard {
  margin-top: 18px;
  border-radius: 20px;
  border: 1px solid rgba(46, 46, 46, 1);
  background: rgba(26, 26, 26, 1);
  padding: 16px;
}

.ccCard--loading {
  background: #000000;
  border: 3px solid #ff6b00;
  border-radius: 20px;
  padding: 0;
  box-shadow: 0 10px 40px rgba(255, 107, 0, 0.3);
}

.ccCardHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.ccCardTitle {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 800;
  color: #fff;
}

.ccIcon--primary {
  color: #ff8c00;
}

.ccLinkBtn {
  border: none;
  background: transparent;
  color: #ff8c00;
  font-weight: 800;
  font-size: 13px;
  cursor: pointer;
}

.ccCats {
  display: grid;
  gap: 12px;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden; /* Prevent cards from overflowing */
}

.ccCatCard {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  border-radius: 18px;
  border: 1px solid rgba(46, 46, 46, 1);
  background: rgba(26, 26, 26, 1);
  padding: 14px;
  opacity: 0.9;
  width: 100%;
  box-sizing: border-box;
  max-width: 100%; /* Prevent overflow */
  overflow: hidden; /* Prevent content from overflowing */
}

.ccCatCard--featured {
  border: 2px solid #ff8c00;
  box-shadow: 0 10px 30px rgba(255, 140, 0, 0.12);
  opacity: 1;
}

.ccCatBody {
  flex: 1 1 auto;
  min-width: 0;
  max-width: 100%; /* Prevent overflow */
  overflow: hidden; /* Prevent content from overflowing */
}

.ccCatTop {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0; /* Allow flex shrinking */
  flex-wrap: wrap; /* Allow wrapping if needed */
  width: 100%;
  box-sizing: border-box;
}

.ccAIBadge {
  font-size: 10px;
  font-weight: 900;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(255, 140, 0, 0.2);
  color: #ff8c00;
  white-space: nowrap;
}

.ccCatName {
  font-size: 16px;
  font-weight: 900;
  color: #fff;
  line-height: 1.2;
  flex: 1 1 auto;
  min-width: 0;
  max-width: 100%; /* Prevent overflow */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word; /* Break long words if needed */
}

.ccCatMeta {
  margin-top: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.72);
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.ccCatMeta--sub {
  margin-top: 4px;
  color: rgba(255, 255, 255, 0.62);
}

.ccCatMetaLbl {
  font-weight: 900;
  color: rgba(255, 255, 255, 0.7);
}

.ccCatMetaVal {
  font-weight: 900;
  color: rgba(255, 140, 0, 0.9);
}

.ccCatPriceRow {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.ccCatPrice {
  color: #ff8c00;
  font-weight: 900;
  font-size: 13px;
}

.ccCatPrice--bid {
  color: rgba(255, 140, 0, 0.75);
}

.ccCatMatchPct {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 4px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.55);
  line-height: 1.2;
}

.ccCatMatchPct__label {
  font-weight: 500;
}

.ccCatMatchPct__value {
  font-weight: 700;
  color: rgba(255, 255, 255, 0.65);
}

.ccCatButtonsRow {
  margin-top: 8px;
  display: flex;
  gap: 8px;
  width: 100%;
  align-items: stretch;
  flex-wrap: wrap;
}

.ccCatQuote {
  flex: 1;
  min-width: 0; /* Allow flex shrinking */
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
  border-radius: 14px;
  padding: 10px 12px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
}

.ccCatQuote:hover {
  background: rgba(255, 255, 255, 0.08);
}

.ccCatNotRight {
  flex: 1;
  min-width: 0; /* Allow flex shrinking */
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  border-radius: 14px;
  padding: 10px 12px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ccCatNotRight:hover {
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.8);
}

.ccCatThumb {
  width: 80px;
  height: 80px;
  flex: 0 0 80px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: radial-gradient(
      50px 50px at 30% 30%,
      rgba(255, 140, 0, 0.18),
      transparent 70%
    ),
    linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.04),
      rgba(255, 255, 255, 0.02)
    );
}

.ccSectionTitle {
  margin: 0;
  font-size: 16px;
  font-weight: 900;
  color: #fff;
}

.ccTextareaWrap {
  position: relative;
}

.ccTextarea {
  min-height: 120px;
  resize: none;
  padding: 16px;
  font-size: 13px;
  line-height: 1.5;
}

.ccCharCount {
  position: absolute;
  bottom: 10px;
  left: 12px;
  font-size: 10px;
  color: rgba(113, 113, 122, 1);
  font-weight: 800;
}

.ccLocHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  position: relative;
}

.ccManualLocationBtn {
  position: absolute;
  top: -8px;
  left: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 11px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10;

  .material-symbols-outlined {
    font-size: 14px;
  }

  &:hover {
    color: rgba(255, 140, 0, 0.9);
    border-color: rgba(255, 140, 0, 0.4);
    background: rgba(255, 140, 0, 0.1);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
}

.ccLocMap {
  height: 176px;
  border-radius: 18px;
  border: 1px solid rgba(46, 46, 46, 1);
  overflow: hidden;
  position: relative;
  background: rgba(26, 26, 26, 1);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.02);
}

.ccLocMapBg {
  position: absolute;
  inset: 0;
  background: radial-gradient(
      200px 140px at 55% 35%,
      rgba(255, 255, 255, 0.07),
      transparent 70%
    ),
    linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(0, 0, 0, 0.1));
  opacity: 0.75;
  filter: grayscale(1) invert(1) contrast(1.25);
}

.ccLocMapFrame {
  display: block;
  width: 100%;
  height: 176px;
  border: 0;
  background: rgba(0, 0, 0, 0.35);
}

.ccLocMapOverlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
}

.ccLocPill {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border-radius: 999px;
  padding: 10px 16px;
  border: 1px solid rgba(255, 140, 0, 0.5);
  background: rgba(26, 26, 26, 1);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
}

.ccLocPillTxt {
  font-size: 13px;
  font-weight: 900;
  color: #fff;
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Main Location Buttons (3 options) */
.ccLocBtnsMain {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.ccLocBtnMain {
  height: 60px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(26, 26, 26, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  cursor: pointer;
  color: #fff;
  font-weight: 800;
  font-size: 16px;
  transition: all 0.2s ease;

  .ccIcon {
    font-size: 24px;
    color: #ff8c00;
  }

  &:hover {
    border-color: rgba(255, 140, 0, 0.5);
    background: rgba(255, 140, 0, 0.08);
  }

  &:active {
    transform: scale(0.98);
  }
  
  &--primary {
    background: linear-gradient(135deg, #ff8c00 0%, #ff6a00 100%);
    border: none;
    color: #000;
    
    .ccIcon {
      color: #000;
    }
    
    &:hover {
      background: linear-gradient(135deg, #ffa033 0%, #ff8020 100%);
    }
  }
}

/* Change location button */
.ccLocChangeBtn {
  margin-top: 12px;
  height: 48px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 700;
  font-size: 14px;
  transition: all 0.2s ease;
  width: 100%;

  .ccIcon {
    font-size: 20px;
    color: #ff8c00;
  }

  &:hover {
    border-color: rgba(255, 140, 0, 0.5);
    color: #fff;
  }
}

.ccLocBtns {
  margin-top: 12px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.ccLocBtn {
  height: 54px;
  border-radius: 14px;
  border: 1px solid rgba(46, 46, 46, 1);
  background: rgba(26, 26, 26, 1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  color: #fff;
  font-weight: 900;
  font-size: 13px;
  transition: border-color 0.15s ease, transform 0.15s ease;

  &:hover {
    border-color: rgba(255, 140, 0, 0.45);
  }

  &:active {
    transform: scale(0.98);
  }
}

.ccReqTag {
  font-size: 11px;
  font-weight: 900;
  padding: 4px 10px;
  border-radius: 10px;
  background: rgba(255, 140, 0, 0.1);
  color: #ff8c00;
}

.ccUploadDrop {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 18px;
  border: 2px dashed rgba(255, 255, 255, 0.1);
  background: rgba(22, 22, 22, 1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  cursor: pointer;
  transition: border-color 0.15s ease, transform 0.15s ease,
    background 0.15s ease;
  overflow: hidden;

  &:hover {
    border-color: rgba(255, 140, 0, 0.5);
    background: rgba(255, 255, 255, 0.02);
  }

  &:active {
    transform: scale(0.98);
  }
}

.ccFileInput {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.ccImgGrid {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.ccImg {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(22, 22, 22, 1);
  aspect-ratio: 1 / 1;
}

.ccImgEl {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.ccImgRm {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 34px;
  height: 34px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  display: grid;
  place-items: center;
  cursor: pointer;
}

.ccUploadIconWrap {
  width: 76px;
  height: 76px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: rgba(255, 140, 0, 0.1);
}

.ccUploadIcon {
  font-size: 48px;
  color: #ff8c00;
}

.ccUploadCopy {
  text-align: center;
}

.ccUploadTitle {
  margin: 0;
  font-size: 15px;
  font-weight: 900;
  color: #fff;
}

.ccUploadHint {
  margin: 6px 0 0;
  font-size: 11px;
  color: rgba(161, 161, 170, 1);
  font-weight: 600;
}

.ccUrgent {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 18px;
  background: rgba(22, 22, 22, 1);
  padding: 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  cursor: pointer;
  transition: box-shadow 0.2s ease, border-color 0.2s ease, transform 0.15s ease;

  &.is-on {
    box-shadow: 0 0 20px rgba(255, 140, 0, 0.35);
    border-color: rgba(255, 140, 0, 0.9);
  }

  &:active {
    transform: scale(0.99);
  }
}

.ccUrgentLeft {
  display: flex;
  align-items: center;
  gap: 14px;
}

.ccUrgentIcon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: rgba(255, 140, 0, 0.2);
  color: #ff8c00;
}

.ccUrgentTitle {
  font-weight: 900;
  color: #fff;
}

.ccUrgentTop {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ccUrgentTag {
  font-size: 11px;
  font-weight: 900;
  padding: 2px 10px;
  border-radius: 999px;
  background: #ff8c00;
  color: #000;
}

.ccUrgentSub {
  margin-top: 2px;
  font-size: 11px;
  color: rgba(161, 161, 170, 1);
  font-weight: 600;
}

.ccSwitch {
  width: 51px;
  height: 31px;
  border-radius: 999px;
  padding: 2px;
  background: rgba(255, 255, 255, 0.1);
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.25);
  display: flex;
  align-items: center;
  justify-content: flex-start;
  transition: background 0.2s ease;
}

.ccSwitch .ccSwitchKnob {
  width: 27px;
  height: 27px;
  border-radius: 999px;
  background: #fff;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.35);
  transform: translateX(0);
  transition: transform 0.2s ease;
}

.ccSwitch.is-on {
  background: #ff8c00;
}

.ccSwitch.is-on .ccSwitchKnob {
  transform: translateX(-20px);
}

.ccSelectWrap {
  position: relative;
}

.ccSelect {
  appearance: none;
  padding: 16px 16px 16px 44px;
  font-weight: 800;
  font-size: 13px;
}

.ccSelectChevron {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #ff8c00;
}

.ccWarn {
  margin-top: 18px;
  border-radius: 18px;
  border: 1px solid rgba(255, 140, 0, 0.2);
  background: rgba(255, 140, 0, 0.05);
  padding: 14px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: rgba(228, 228, 231, 1);

  p {
    margin: 0;
    font-size: 13px;
    line-height: 1.55;
  }
}

.ccPayIntro {
  text-align: center;
  margin-bottom: 18px;
}

.ccCenter {
  text-align: center;
}

.ccCardPreview {
  border-radius: 24px;
  padding: 18px;
  border: 1px solid rgba(255, 140, 0, 0.3);
  background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
  position: relative;
  overflow: hidden;
  box-shadow: 0 0 30px rgba(255, 122, 0, 0.1);
}

.ccCardPreview::before {
  content: "";
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle at center,
    rgba(255, 122, 0, 0.08) 0%,
    transparent 70%
  );
  pointer-events: none;
}

.ccCardPreviewTop {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.ccCardBadge {
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.18em;
  color: #ff8c00;
}

.ccCardTap {
  font-size: 30px;
  color: rgba(255, 140, 0, 0.8);
}

.ccCardPreviewMid {
  position: relative;
  z-index: 1;
  margin-top: 26px;
}

.ccCardDigits {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
  font-size: 22px;
  letter-spacing: 0.2em;
  color: rgba(255, 255, 255, 0.9);
}

.ccCardPreviewBottom {
  position: relative;
  z-index: 1;
  margin-top: 18px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
}

.ccCardMeta {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.35);
}

.ccCardVal {
  margin-top: 4px;
  font-size: 12px;
  font-weight: 800;
  color: #fff;
}

.ccCardGlow {
  position: absolute;
  right: -40px;
  bottom: -40px;
  width: 140px;
  height: 140px;
  background: rgba(255, 140, 0, 0.18);
  filter: blur(28px);
  border-radius: 999px;
}

.ccChangePay {
  margin-top: 18px;
  width: 100%;
  height: 56px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-weight: 900;
  cursor: pointer;
}

.ccPriceBox {
  margin-top: 18px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(22, 22, 22, 1);
  padding: 18px;
}

.ccPriceRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 10px;
  color: rgba(161, 161, 170, 1);
  font-weight: 700;
}

.ccPriceRow:first-child {
  margin-top: 0;
}

.ccPriceVal {
  color: #fff;
  font-weight: 900;
}

.ccPriceDivider {
  margin: 14px 0;
  height: 1px;
  background: rgba(255, 255, 255, 0.05);
}

.ccPriceRow--total {
  color: #fff;
}

.ccTotalVal {
  color: #ff8c00;
  font-size: 22px;
  font-weight: 900;
}

.ccSecure {
  margin-top: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: rgba(113, 113, 122, 1);
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.ccFooter {
  position: sticky;
  bottom: 0;
  z-index: 50;
  background: rgba(10, 10, 10, 0.95);
  backdrop-filter: blur(18px);
  border-top: 1px solid rgba(46, 46, 46, 1);
  padding: 18px 24px calc(22px + env(safe-area-inset-bottom));
}

.ccFooterRow {
  display: flex;
  gap: 12px;
  align-items: center;
}

.ccFooterRow--two {
  justify-content: space-between;
}

.ccPrimaryBtn {
  flex: 1;
  height: 64px;
  border: none;
  border-radius: 18px;
  background: #ff8c00;
  color: #000;
  font-size: 18px;
  font-weight: 900;
  letter-spacing: -0.015em;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(255, 140, 0, 0.35);
  transition: transform 0.15s ease, opacity 0.15s ease, filter 0.15s ease;

  &:active {
    transform: scale(0.97);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
}

.ccGhostBtn {
  flex: 1;
  height: 64px;
  border: none;
  background: transparent;
  color: rgba(161, 161, 170, 1);
  font-weight: 900;
  cursor: pointer;
}

.ccOutlineBtn {
  flex: 0.45;
  height: 64px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  color: #fff;
  font-weight: 900;
  cursor: pointer;
}

.ccBtnIcon {
  margin-right: 10px;
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
  text-align: center;
  padding: 40px 30px;

  @media (max-width: 480px) {
    padding: 30px 20px;
  }

  &__spinner {
    width: 60px;
    height: 60px;
    margin: 0 auto 20px;
    border: 4px solid #2d2d2d;
    border-top: 4px solid #ff6b00;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  &__text {
    color: #ff6b00;
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 30px;
    line-height: 1.5;

    @media (max-width: 480px) {
      font-size: 18px;
    }
  }

  &__dots {
    color: #ff6b00;
    font-size: 30px;
    letter-spacing: 5px;
    margin-bottom: 25px;

    span {
      animation: blink 1.4s infinite;

      &:nth-child(2) {
        animation-delay: 0.2s;
      }

      &:nth-child(3) {
        animation-delay: 0.4s;
      }
    }
  }

  &__progress-bar {
    width: 100%;
    height: 6px;
    background: #2d2d2d;
    border-radius: 3px;
    overflow: hidden;
    margin-top: 0;
  }

  &__progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #ff6b00, #ffaa00);
    border-radius: 3px;
    animation: progress 2s ease-in-out infinite;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes blink {
  0%,
  80%,
  100% {
    opacity: 0;
  }
  40% {
    opacity: 1;
  }
}

@keyframes progress {
  0% {
    width: 0%;
  }
  50% {
    width: 70%;
  }
  100% {
    width: 100%;
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
    width: 100%;
    flex: 1 1 100%;
    order: 3;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid rgba(255, 106, 0, 0.2);
    background: rgba(255, 106, 0, 0.1);
    border-radius: 10px;
    padding: 12px;
    position: relative;
    z-index: 2;
  }

  &__recommendation-head {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__recommendation-icon {
    width: 30px;
    height: 30px;
    border-radius: 999px;
    display: grid;
    place-items: center;
    background: rgba(255, 140, 0, 0.18);
    border: 1px solid rgba(255, 140, 0, 0.25);
    color: $orange2;

    .material-symbols-outlined {
      font-size: 18px;
      line-height: 1;
    }
  }

  &__recommendation-title {
    font-size: 13px;
    font-weight: 1000;
    color: rgba(255, 255, 255, 0.92);
    letter-spacing: -0.01em;
  }

  &__recommendation-badge {
    margin-left: auto;
    font-size: 11px;
    font-weight: 1000;
    padding: 4px 10px;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: rgba(255, 255, 255, 0.85);
    white-space: nowrap;
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
    flex-wrap: nowrap;
  }

  &__recommendation-btn {
    flex: 1;
    min-width: 0;
    padding: 10px 10px;
    border-radius: 10px;
    border: none;
    font-size: 11px;
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
  padding: 60px 18px;
  min-height: 400px;
  background-color: #07070b;
  position: relative;
}

.location-loading__container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
}

.location-loading__radar-waves {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.location-loading__radar-wave {
  position: absolute;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  border: 2px solid #ff6a00;
  opacity: 0;
  animation: radar 3s ease-out infinite;
}

@keyframes radar {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

.location-loading__gps-circle {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
}

.location-loading__svg {
  transform: rotate(0deg);
}

.location-loading__text-container {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
}

.location-loading__title {
  font-size: 30px;
  font-weight: 1200;
  color: #ff6a00;
  margin: 0;
  line-height: 1.2;
}

.location-loading__dots {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.location-loading__dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  transform: scale(1);
}

.location-loading__dot--active {
  background-color: #ff6a00;
  transform: scale(1.3);
}

.location-loading__subtext {
  font-size: 14px;
  font-weight: 900;
  color: rgba(255, 106, 0, 0.6);
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

/* Card Search Loader (Payment Method Verification) */
.card-search-loader {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  margin-bottom: 24px;
}

.card-search-loader__container {
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 2px solid #ff6a00;
  background-color: #07070b;
  max-width: 400px;
  width: 100%;
  direction: rtl;
}

.card-search-loader__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.card-search-loader__card-wrapper {
  position: relative;
  width: 80px;
  height: 56px;
}

.card-search-loader__scan-line {
  position: absolute;
  left: 0;
  width: 100%;
  height: 1px;
  background-color: #ff6a00;
  opacity: 0.6;
  box-shadow: 0 0 10px #ff6a00;
  transition: top 0.03s linear;
}

.card-search-loader__card {
  position: relative;
  border-radius: 8px;
  padding: 16px;
  width: 80px;
  height: 56px;
  border: 2px solid #ff6a00;
  background-color: #07070b;
}

.card-search-loader__stripes {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.card-search-loader__stripe {
  height: 4px;
  border-radius: 2px;
  background-color: #ff6a00;
}

.card-search-loader__stripe--1 {
  width: 48px;
}

.card-search-loader__stripe--2 {
  width: 32px;
  opacity: 0.6;
}

.card-search-loader__stripe--3 {
  width: 40px;
  opacity: 0.4;
}

.card-search-loader__chip {
  position: absolute;
  bottom: 8px;
  left: 8px;
  width: 16px;
  height: 12px;
  border-radius: 2px;
  border: 1px solid #ff6a00;
  opacity: 0.8;
}

.card-search-loader__spinner {
  position: relative;
  width: 32px;
  height: 32px;
}

.card-search-loader__spinner-ring {
  position: absolute;
  inset: 0;
  border: 4px solid #ff6a00;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.card-search-loader__text {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-search-loader__title {
  font-size: 16px;
  font-weight: 600;
  color: #ff6a00;
  margin: 0;
}

.card-search-loader__subtitle {
  font-size: 12px;
  margin: 0;
  margin-top: 4px;
  opacity: 0.6;
  color: #ff6a00;
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
  overflow: hidden; /* Changed from overflow-y: auto to prevent cutting */
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
  overflow-x: hidden;
  min-height: 0; /* Allow flex shrinking */

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
  max-width: 90vw;
  max-height: 85vh;
  overflow: hidden; /* Prevent content from being cut */
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

.subcategory-checkbox,
.subcategory-radio {
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
}

.subcategory-checkbox:checked {
  border-color: $orange2;
  background-color: $orange;
  box-shadow: 0 0 14px rgba($orange, 0.35);

  &::before {
    content: "✓";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #000;
    font-weight: 1200;
    font-size: 14px;
    z-index: 1;
  }
}

.subcategory-radio {
  border-radius: 50%;
  
  &:checked {
    border-color: $orange2;
    box-shadow: 0 0 14px rgba($orange, 0.35);
    
    &::after {
      content: "";
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: $orange;
      z-index: 1;
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

/* =========
     UI v2 (Dark + Orange) — styling only
     ========= */
$ccPrimary: #ff7a00;
$ccBg: #0a0a0a;
$ccSurface: #1a1a1a;
$ccBorder: rgba(255, 255, 255, 0.1);
$ccText: rgba(255, 255, 255, 0.96);
$ccMuted: rgba(161, 161, 170, 0.95);

.create-call-page {
  background: radial-gradient(
      900px 520px at 15% 0%,
      rgba($ccPrimary, 0.12),
      transparent 60%
    ),
    radial-gradient(
      720px 460px at 90% 10%,
      rgba($ccPrimary, 0.08),
      transparent 62%
    ),
    $ccBg;
  color: $ccText;
}

.shell {
  max-width: 430px;
  padding: 0;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(10, 10, 10, 0.84);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  padding: 14px 16px 10px;
  overflow: hidden;
}

.topbar__glow {
  opacity: 0.55;
}

.topbar__back {
  width: 44px;
  height: 44px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: $ccText;
}

.topbar__back:active {
  transform: scale(0.98);
}

.topbar__title {
  font-weight: 1100;
  letter-spacing: -0.02em;
}

.topbar__subtitle {
  color: rgba(255, 255, 255, 0.55);
}

.ccProgress {
  padding: 14px 16px 10px;
}

.ccProgressRow {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.ccProgressStep {
  font-size: 12px;
  font-weight: 1000;
  color: rgba(255, 255, 255, 0.85);
}

.ccProgressPct {
  font-size: 13px;
  font-weight: 1200;
  color: $ccPrimary;
  letter-spacing: -0.01em;
}

.ccProgressTrack {
  margin-top: 10px;
  height: 10px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.ccProgressFill {
  height: 100%;
  background: $ccPrimary;
  border-radius: 999px;
  box-shadow: 0 0 14px rgba($ccPrimary, 0.45);
  transition: width 0.35s cubic-bezier(0.2, 0.9, 0.25, 1);
}

.step-indicator {
  padding: 6px 16px 12px;
  margin-top: 0;
  gap: 10px;
}

.step-item {
  flex: 0 0 auto;
}

.step-line {
  flex: 1;
  height: 2px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
}

.step-line.active {
  background: rgba($ccPrimary, 0.9);
  box-shadow: 0 0 10px rgba($ccPrimary, 0.25);
}

.step-number {
  width: 30px;
  height: 30px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 12px;
}

.step-item.active .step-number {
  background: rgba($ccPrimary, 0.18);
  border-color: rgba($ccPrimary, 0.55);
  color: $ccPrimary;
  box-shadow: 0 0 14px rgba($ccPrimary, 0.18);
}

.step-item.completed .step-number {
  background: rgba($ccPrimary, 0.9);
  border-color: rgba($ccPrimary, 0.9);
  color: #0a0a0a;
}

.step-label {
  color: rgba(255, 255, 255, 0.55);
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px calc(120px + env(safe-area-inset-bottom));
}

.step-container {
  max-height: none;
  padding: 0;
}

.block {
  background: $ccSurface;
  border: 1px solid $ccBorder;
  border-radius: 22px;
  padding: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
}

.block__label {
  font-size: 18px;
  font-weight: 1100;
  letter-spacing: -0.015em;
}

.block__req {
  border-radius: 999px;
  padding: 6px 10px;
  background: rgba($ccPrimary, 0.12);
  border: 1px solid rgba($ccPrimary, 0.2);
  color: $ccPrimary;
  font-weight: 1000;
}

.input-small,
.textarea,
select {
  background: rgba(255, 255, 255, 0.04) !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  border-radius: 18px !important;
  color: $ccText !important;
}

.input-small:focus,
.textarea:focus,
select:focus {
  outline: none !important;
  border-color: rgba($ccPrimary, 0.55) !important;
  box-shadow: 0 0 0 4px rgba($ccPrimary, 0.18) !important;
}

.manual-select-btn {
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: $ccPrimary;
  font-weight: 1000;
}

.manual-select-btn:active {
  transform: scale(0.98);
}

.add-request-btn {
  border-radius: 999px;
  background: transparent;
  border: none;
  color: $ccPrimary;
  font-weight: 1100;
}

.category-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 18px;
}

.category-card--quoted {
  border-color: rgba($ccPrimary, 0.25);
  box-shadow: 0 10px 26px rgba($ccPrimary, 0.08);
}

.category-card__price--bid {
  color: $ccPrimary;
}

.category-card__quote-btn,
.block__refine-btn {
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.9);
  font-weight: 1000;
}

.category-card__quote-btn:hover,
.block__refine-btn:hover {
  border-color: rgba($ccPrimary, 0.35);
}

.step-actions {
  position: sticky;
  bottom: 0;
  z-index: 20;
  margin-top: 14px;
  padding: 16px;
  background: rgba(10, 10, 10, 0.9);
  backdrop-filter: blur(14px);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 18px 18px 0 0;
}

.next-step-btn,
.next-btn-animated {
  width: 100%;
  height: 56px;
  border-radius: 18px;
  background: $ccPrimary;
  color: #0a0a0a;
  font-weight: 1200;
  letter-spacing: -0.01em;
  box-shadow: 0 10px 26px rgba($ccPrimary, 0.22);
}

.next-step-btn:active,
.next-btn-animated:active {
  transform: scale(0.985);
}

.back-btn {
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.8);
  font-weight: 1000;
}

.map-modal__content,
.split-call-modal__content,
.quotation-modal__content {
  background: $ccBg;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

/* =========
     Form Input in Modal
     ========= */
.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: -0.01em;
}

.form-input {
  width: 100%;
  box-sizing: border-box;
  padding: 16px 18px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(26, 26, 26, 1);
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  outline: none;
  transition: all 0.2s ease;
  direction: rtl;
  text-align: right;

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
    font-weight: 400;
  }

  &:focus {
    border-color: rgba(255, 140, 0, 0.7);
    background: rgba(26, 26, 26, 0.95);
    box-shadow: 0 0 0 4px rgba(255, 140, 0, 0.2);
  }

  &:hover:not(:focus) {
    border-color: rgba(255, 255, 255, 0.2);
    background: rgba(26, 26, 26, 0.9);
  }
}

/* =========
     Not Right Modal Options
     ========= */
.not-right-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.not-right-option-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 20px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(26, 26, 26, 0.6);
  color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: right;
  direction: rtl;

  &:hover {
    border-color: rgba(255, 140, 0, 0.5);
    background: rgba(26, 26, 26, 0.8);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
}

.not-right-option-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.not-right-option-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: right;

  strong {
    font-size: 16px;
    font-weight: 800;
    color: rgba(255, 255, 255, 0.95);
    letter-spacing: -0.01em;
  }

  small {
    font-size: 13px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.6);
  }
}
</style>

<style>
/* הסתר רק את באדג' הטסט של Stripe */
.stripe-test-mode-badge {
  display: none !important;
}

/* =========
     Manual Search Section
     ========= */
.manual-search-section {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0; /* Prevent shrinking */
}

.manual-search-row {
  display: flex;
  gap: 12px;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
}

.manual-search-input {
  flex: 1;
  min-width: 0; /* Allow flex shrinking */
  padding: 12px 14px; /* Reduced padding */
  border-radius: 16px; /* Slightly smaller */
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(26, 26, 26, 1);
  color: #fff;
  font-size: 14px; /* Slightly smaller font */
  font-weight: 500;
  outline: none;
  transition: all 0.2s ease;
  direction: rtl;
  text-align: right;
  box-sizing: border-box;

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
    font-weight: 400;
    font-size: 13px;
  }

  &:focus {
    border-color: rgba(255, 140, 0, 0.7);
    background: rgba(26, 26, 26, 0.95);
    box-shadow: 0 0 0 3px rgba(255, 140, 0, 0.2); /* Smaller shadow */
  }

  &:hover:not(:focus) {
    border-color: rgba(255, 255, 255, 0.2);
    background: rgba(26, 26, 26, 0.9);
  }
}

.manual-search-select {
  flex-shrink: 0;
  padding: 12px 14px; /* Reduced padding */
  border-radius: 16px; /* Slightly smaller */
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(26, 26, 26, 1);
  color: #fff;
  font-size: 14px; /* Slightly smaller font */
  font-weight: 600;
  outline: none;
  cursor: pointer;
  transition: all 0.2s ease;
  direction: rtl;
  min-width: 120px; /* Reduced from 140px */
  max-width: 120px; /* Added max-width */
  box-sizing: border-box;

  &:focus {
    border-color: rgba(255, 140, 0, 0.7);
    background: rgba(26, 26, 26, 0.95);
    box-shadow: 0 0 0 3px rgba(255, 140, 0, 0.2); /* Smaller shadow */
  }

  &:hover:not(:focus) {
    border-color: rgba(255, 255, 255, 0.2);
    background: rgba(26, 26, 26, 0.9);
  }

  option {
    background: rgba(26, 26, 26, 1);
    color: #fff;
    padding: 10px;
  }
}

.no-results {
  text-align: center;
  padding: 40px 20px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 15px;
  font-weight: 600;
}
</style>
