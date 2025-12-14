<template>
  <div class="select-handyman-page" dir="rtl">
    <div class="container">
      <div class="header">
        <button class="back-btn" type="button" @click="goBack">← חזור</button>
        <h1 class="title">בחר הנדימן</h1>
        <p class="subtitle">חיפוש לפי שם + פילטר דירוג/מספר עבודות</p>
      </div>

      <div class="form-container">
        <div class="dir">
          <div class="dir__filters">
            <div class="field">
              <label class="label">חפש הנדימן</label>
              <input
                class="input"
                v-model="dirFilters.q"
                type="text"
                placeholder="לדוגמה: דני"
              />
            </div>

            <div class="row row--2">
              <div class="field">
                <label class="label">מינימום דירוג</label>
                <select class="select" v-model.number="dirFilters.minRating">
                  <option :value="0">הכל</option>
                  <option :value="3">3+</option>
                  <option :value="4">4+</option>
                  <option :value="4.5">4.5+</option>
                </select>
              </div>

              <div class="field">
                <label class="label">מינימום עבודות</label>
                <select class="select" v-model.number="dirFilters.minJobs">
                  <option :value="0">הכל</option>
                  <option :value="10">10+</option>
                  <option :value="50">50+</option>
                  <option :value="100">100+</option>
                </select>
              </div>
            </div>
          </div>

          <div class="dir__list">
            <div v-for="h in filteredHandymen" :key="h.id" class="hcard">
              <div class="hcard__left">
                <img class="hcard__av" :src="h.avatarUrl" alt="handyman" />
                <div class="hcard__meta">
                  <div class="hcard__name">{{ h.name }}</div>
                  <div class="hcard__sub">
                    ⭐ {{ h.rating }} · {{ h.jobsDone }} עבודות
                  </div>
                </div>
              </div>

              <div class="hcard__actions">
                <button
                  class="mini mini--ghost"
                  type="button"
                  @click="onOpenUserChat(h.id)"
                >
                  צ׳אט
                </button>
                <button
                  class="mini mini--danger"
                  type="button"
                  @click="onBlockHandyman(h.id)"
                >
                  חסום
                </button>
                <button
                  class="mini mini--primary"
                  type="button"
                  @click="onPersonalRequest(h.id)"
                >
                  הזמן
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "SelectHandyman",
  data() {
    return {
      dirFilters: { q: "", minRating: 0, minJobs: 0 },

      handymen: [
        {
          id: "h1",
          name: "דני",
          rating: 4.8,
          jobsDone: 132,
          avatarUrl:
            "https://images.unsplash.com/photo-1520975682031-ae1f0f3bd7c1?w=160&h=160&fit=crop",
        },
        {
          id: "h2",
          name: "אלירן",
          rating: 4.4,
          jobsDone: 57,
          avatarUrl:
            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&h=160&fit=crop",
        },
        {
          id: "h3",
          name: "מוטי הנדימן",
          rating: 4.9,
          jobsDone: 210,
          avatarUrl:
            "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=160&h=160&fit=crop",
        },
      ],
    };
  },
  computed: {
    filteredHandymen() {
      let list = [...this.handymen];

      if (this.dirFilters.q) {
        const q = this.dirFilters.q.toLowerCase();
        list = list.filter((h) => h.name.toLowerCase().includes(q));
      }
      if (this.dirFilters.minRating) {
        list = list.filter((h) => h.rating >= this.dirFilters.minRating);
      }
      if (this.dirFilters.minJobs) {
        list = list.filter((h) => h.jobsDone >= this.dirFilters.minJobs);
      }

      return list;
    },
  },
  methods: {
    goBack() {
      this.$router.go(-1);
    },
    onOpenUserChat(userId) {
      console.log("open user chat", userId);
    },
    onBlockHandyman(id) {
      console.log("block handyman", id);
    },
    onPersonalRequest(id) {
      console.log("personal request handyman", id);
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

.select-handyman-page {
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
  max-width: 800px;
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

.dir {
  border-radius: $r2;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.22);
  padding: 12px;
}

.dir__filters {
  margin-bottom: 20px;
}

.field {
  display: grid;
  gap: 8px;
  margin-bottom: 16px;
}

.label {
  font-size: 12px;
  font-weight: 1000;
  color: rgba(255, 255, 255, 0.78);
}

.input,
.select {
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

.row {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;

  &--2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
}

.dir__list {
  margin-top: 12px;
  display: grid;
  gap: 10px;
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
  }

  &__name {
    font-weight: 1100;
  }

  &__sub {
    margin-top: 2px;
    color: rgba(255, 255, 255, 0.62);
    font-weight: 900;
    font-size: 12px;
  }

  &__actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
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
</style>
