<template>
  <div class="create-call-page" dir="rtl">
    <div class="container">
      <div class="header">
        <button class="back-btn" type="button" @click="goBack">← חזור</button>
        <h1 class="title">צור קריאה</h1>
        <p class="subtitle">
          בחר תת־קטגוריה, תיאור, מיקום וזמן. ברירת מחדל: כמה שיותר מהר.
        </p>
      </div>

      <div class="form-container">
        <div class="field">
          <label class="label">תת־קטגוריה</label>
          <select class="select" v-model="call.subId" @change="onSubChange">
            <option disabled value="">בחר תת־קטגוריה…</option>
            <option v-for="s in subcategories" :key="s.id" :value="s.id">
              {{ s.name }}
            </option>
          </select>
        </div>

        <div class="preview" v-if="selectedSub">
          <div class="preview__row">
            <span>מחיר</span>
            <b>{{ selectedSub.price }} שקלות</b>
          </div>
          <div class="preview__row">
            <span>סוג עבודה</span>
            <b>{{
              selectedSub.billingType === "hourly" ? "לשעה" : "קבלנות"
            }}</b>
          </div>
          <div class="apiNote">* מגיע מקובץ ה-API שלך</div>
        </div>

        <div class="field">
          <label class="label">תיאור</label>
          <textarea
            class="textarea"
            v-model="call.desc"
            rows="4"
            placeholder="תאר בקצרה מה הבעיה…"
          ></textarea>
        </div>

        <div class="field">
          <label class="label">תמונה</label>
          <div class="file-upload-wrapper">
            <input
              id="callImage"
              type="file"
              accept="image/*"
              @change="handleCallImageUpload"
              class="file-input"
              required
            />
            <label
              for="callImage"
              class="file-label"
              :class="{ disabled: call.imageUrl || call.imagePreview }"
            >
              📷
              {{
                call.imageUrl || call.imagePreview ? "תמונה נבחרה" : "בחר תמונה"
              }}
            </label>
            <div v-if="call.imagePreview" class="image-preview-small">
              <img :src="call.imagePreview" alt="Preview" />
              <button
                type="button"
                class="remove-image-btn"
                @click="removeCallImage"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        <div class="field">
          <label class="label">מיקום</label>
          <input
            class="input"
            v-model="call.location"
            type="text"
            placeholder="עיר, רחוב, מספר…"
          />
        </div>

        <div class="field">
          <label class="label">זמן הגעה</label>
          <select class="select" v-model="call.when">
            <option value="asap">כמה שיותר מהר</option>
            <option value="today">היום</option>
            <option value="tomorrow">מחר</option>
            <option value="pick">בחר זמן</option>
          </select>
        </div>

        <div class="row">
          <button
            class="toggle"
            :class="{ 'toggle--on': call.urgent }"
            type="button"
            @click="onToggleUrgent"
          >
            🚨 קריאה דחופה
          </button>

          <div class="fine">
            <span class="fine__icon">⚠️</span>
            <span>קנס על ביטול: <b>250 שקלות</b></span>
          </div>
        </div>

        <button
          class="btn btn--primary btn--full"
          type="button"
          @click="onSubmitCall"
        >
          שלח קריאה
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "CreateCall",
  data() {
    return {
      subcategories: [
        { id: "sc1", name: "פתיחת סתימה", price: 250, billingType: "fixed" },
        { id: "sc2", name: "החלפת ברז", price: 300, billingType: "fixed" },
        { id: "sc3", name: "הרכבת ארון", price: 180, billingType: "hourly" },
        { id: "sc4", name: "החלפת שקע", price: 220, billingType: "fixed" },
      ],

      call: {
        subId: "",
        desc: "",
        location: "",
        when: "asap",
        urgent: false,
        image: null,
        imageUrl: "",
        imagePreview: null,
      },
    };
  },
  computed: {
    selectedSub() {
      return this.subcategories.find((x) => x.id === this.call.subId) || null;
    },
  },
  methods: {
    goBack() {
      this.$router.go(-1);
    },
    onSubChange() {
      console.log("subcategory changed", this.call.subId);
    },
    onToggleUrgent() {
      console.log("toggle urgent");
      this.call.urgent = !this.call.urgent;
    },
    handleCallImageUpload(event) {
      const file = event.target.files[0];
      if (file) {
        this.call.image = file;
        const reader = new FileReader();
        reader.onload = (e) => {
          this.call.imagePreview = e.target.result;
        };
        reader.readAsDataURL(file);
        // TODO: Upload to server and set call.imageUrl
      }
    },
    removeCallImage() {
      this.call.image = null;
      this.call.imageUrl = "";
      this.call.imagePreview = null;
      const input = document.getElementById("callImage");
      if (input) input.value = "";
    },
    onSubmitCall() {
      console.log("submit call", this.call, "selectedSub", this.selectedSub);
      // TODO: Submit to server and redirect
      this.$router.push({
        name: "Dashboard",
        params: { id: this.$route.params.id },
      });
    },
  },
};
</script>

<style lang="scss" scoped>
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

.create-call-page {
  min-height: 100vh;
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
  padding: 20px;
  direction: rtl;
}

.container {
  max-width: 600px;
  margin: 0 auto;
}

.header {
  margin-bottom: 24px;
}

.back-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba($orange, 0.18);
  border-radius: 12px;
  padding: 10px 16px;
  color: $text;
  font-weight: 900;
  cursor: pointer;
  margin-bottom: 16px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba($orange, 0.1);
    border-color: rgba($orange, 0.3);
  }

  &:focus {
    @include focusRing;
  }
}

.title {
  font-size: 28px;
  font-weight: 1000;
  color: $text;
  margin: 0 0 8px 0;
}

.subtitle {
  color: $muted;
  font-weight: 800;
  font-size: 14px;
  margin: 0;
}

.form-container {
  background: linear-gradient(180deg, $card2, rgba(255, 255, 255, 0.04));
  border: 1px solid $stroke;
  border-radius: $r2;
  padding: 24px;
  box-shadow: $shadow;
}

.field {
  display: grid;
  gap: 8px;
  margin-bottom: 20px;
}

.label {
  font-size: 12px;
  font-weight: 1000;
  color: rgba(255, 255, 255, 0.78);
}

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
  -webkit-appearance: none;
  appearance: none;
  font-size: 16px;

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
  margin-bottom: 20px;
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
}

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
}

.row {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 20px;
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

.btn {
  border-radius: 16px;
  padding: 14px 20px;
  border: 1px solid rgba($orange, 0.18);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  cursor: pointer;
  font-weight: 1000;
  transition: transform 120ms ease, box-shadow 120ms ease, background 120ms ease;
  font-size: 15px;

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

  &--full {
    width: 100%;
    justify-content: center;
  }
}
</style>
