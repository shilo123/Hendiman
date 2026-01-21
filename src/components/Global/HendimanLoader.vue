<template>
  <div class="hendiman-loader" dir="rtl">
    <!-- לוגו / כותרת -->
    <div class="hendiman-loader__header">
      <h1 class="hendiman-loader__title" dir="ltr">
        <span
          v-for="(letter, index) in 'Hendiman'.split('')"
          :key="index"
          class="hendiman-loader__letter"
          :style="{
            animationDelay: `${index * 0.1}s`
          }"
        >
          {{ letter }}
        </span>
      </h1>
    </div>

    <!-- אנימציית כלים -->
    <div class="hendiman-loader__tools">
      <!-- מעגל חיצוני -->
      <div class="hendiman-loader__circle">
        <!-- ספינר מסתובב -->
        <div class="hendiman-loader__spinner" />
        
        <!-- אייקון כלים במרכז -->
        <div class="hendiman-loader__icon">
          <svg 
            width="48" 
            height="48" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="#ff6a00" 
            stroke-width="2"
            class="hendiman-loader__icon-svg"
          >
            <!-- מפתח ברגים -->
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        </div>
      </div>

      <!-- נקודות מסביב -->
      <div
        v-for="i in 4"
        :key="i"
        class="hendiman-loader__dot"
        :style="{
          animationDelay: `${(i - 1) * 0.5}s`
        }"
      />
    </div>

    <!-- כרטיס "הידעת" -->
    <div 
      class="hendiman-loader__tip-card"
      :class="{ 'hendiman-loader__tip-card--fade-out': !fadeIn }"
    >
      <div class="hendiman-loader__tip-content">
        <!-- אייקון נורה -->
        <div class="hendiman-loader__tip-icon">
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="#ff6a00" 
            stroke-width="2.5"
          >
            <path d="M9 18h6" />
            <path d="M10 22h4" />
            <path d="M12 2a6 6 0 0 0-6 6c0 2.4 1.4 4.5 3.5 5.5.3.2.5.5.5.9V17h4v-2.6c0-.4.2-.7.5-.9 2.1-1 3.5-3.1 3.5-5.5a6 6 0 0 0-6-6z" />
          </svg>
        </div>

        <!-- תוכן -->
        <div class="hendiman-loader__tip-text">
          <h3 class="hendiman-loader__tip-title">
            💡 הידעת?
          </h3>
          <p class="hendiman-loader__tip-message">
            {{ currentTipText }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import tipsData from '@/APIS/IsKnow.json';
import { useMainStore } from '@/store/index';

export default {
  name: 'HendimanLoader',
  setup() {
    const store = useMainStore();
    return { store };
  },
  data() {
    return {
      currentTip: 0,
      fadeIn: true,
      tips: [],
      intervalId: null,
    };
  },
  mounted() {
    // Determine which tips to use based on user type
    this.loadTips();
    
    // Set initial random tip
    if (this.tips.length > 0) {
      this.currentTip = Math.floor(Math.random() * this.tips.length);
    }

    // First tip should be visible for 7 seconds, then start interval
    setTimeout(() => {
      // Start interval to change tip every 7 seconds with fade animation
      this.intervalId = setInterval(() => {
        this.fadeIn = false;
        
        setTimeout(() => {
          this.currentTip = (this.currentTip + 1) % this.tips.length;
          this.fadeIn = true;
        }, 500);
      }, 7000);
    }, 7000);
  },
  beforeUnmount() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  },
  computed: {
    currentTipText() {
      if (this.tips.length === 0) return '';
      return this.tips[this.currentTip] || '';
    },
  },
  methods: {
    loadTips() {
      try {
        // Determine user type
        const user = this.store?.user;
        let tipKey = 'another'; // default

        if (user?.isHandyman) {
          tipKey = 'Handiman';
        } else  {
          tipKey = 'customer';
        }

        // Load tips from JSON
        this.tips = tipsData[tipKey] || tipsData.another || [];
        
        // If tips are empty, use fallback
        if (this.tips.length === 0) {
          this.tips = [
            'אנחנו עובדים על השירות הכי טוב עבורך',
            'תכף נסיים...',
          ];
        }
      } catch (error) {
        console.error('Failed to load tips:', error);
        this.tips = [
          'אנחנו עובדים על השירות הכי טוב עבורך',
          'תכף נסיים...',
        ];
      }
    },
  },
  watch: {
    // Watch for store user changes to reload tips
    'store.user': {
      handler(newUser) {
        if (newUser) {
          this.loadTips();
        }
      },
      immediate: true,
    },
  },
};
</script>

<style scoped lang="scss">
.hendiman-loader {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background-color: #07070b;
  direction: rtl;
  box-sizing: border-box;
  overflow: hidden;
  z-index: 999999999;
}

.hendiman-loader__header {
  margin-bottom: 48px;
  text-align: center;
}

.hendiman-loader__title {
  font-size: 48px;
  font-weight: 900;
  margin: 0;
  display: flex;
  justify-content: center;
}

.hendiman-loader__letter {
  display: inline-block;
  color: #ff6a00;
  animation: wave 2s ease-in-out infinite, glow 2s ease-in-out infinite;
  text-shadow: 0 0 10px rgba(255, 106, 0, 0.5),
               0 0 20px rgba(255, 106, 0, 0.3),
               0 0 30px rgba(255, 106, 0, 0.2);
}

.hendiman-loader__tools {
  position: relative;
  margin-bottom: 64px;
  width: 128px;
  height: 128px;
}

.hendiman-loader__circle {
  width: 128px;
  height: 128px;
  border-radius: 50%;
  border: 4px solid #ff6a00;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.hendiman-loader__spinner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 4px solid #ff6a00;
  border-top-color: transparent;
  border-right-color: transparent;
  animation: spin 1s linear infinite;
}

.hendiman-loader__icon {
  position: relative;
  z-index: 10;
}

.hendiman-loader__icon-svg {
  animation: pulse 2s ease-in-out infinite;
}

.hendiman-loader__dot {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #ff6a00;
  top: 50%;
  left: 50%;
  
  @for $i from 1 through 4 {
    &:nth-child(#{$i}) {
      --rotation: #{($i - 1) * 90}deg;
      transform: rotate(#{($i - 1) * 90}deg) translateY(-70px);
      animation: dotPulse 2s ease-in-out infinite #{(($i - 1) * 0.5)}s;
    }
  }
}

.hendiman-loader__tip-card {
  max-width: 448px;
  width: 100%;
  border-radius: 16px;
  padding: 24px;
  border: 2px solid #ff6a00;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  background-color: #0f0f15;
  transition: opacity 0.5s ease;
  opacity: 1;

  &--fade-out {
    opacity: 0;
  }
}

.hendiman-loader__tip-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.hendiman-loader__tip-icon {
  margin-top: 4px;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 106, 0, 0.2);
}

.hendiman-loader__tip-text {
  flex: 1;
}

.hendiman-loader__tip-title {
  font-size: 14px;
  font-weight: 900;
  margin: 0 0 8px;
  color: #ff6a00;
}

.hendiman-loader__tip-message {
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
  color: #ff6a00;
  opacity: 0.9;
}

@keyframes wave {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes glow {
  0%, 100% {
    text-shadow: 0 0 10px rgba(255, 106, 0, 0.5),
                 0 0 20px rgba(255, 106, 0, 0.3),
                 0 0 30px rgba(255, 106, 0, 0.2);
    opacity: 1;
  }
  50% {
    text-shadow: 0 0 20px rgba(255, 106, 0, 0.8),
                 0 0 30px rgba(255, 106, 0, 0.6),
                 0 0 40px rgba(255, 106, 0, 0.4),
                 0 0 50px rgba(255, 106, 0, 0.3);
    opacity: 1;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

@keyframes dotPulse {
  0%, 100% {
    opacity: 0.3;
    transform: rotate(var(--rotation)) translateY(-70px) scale(0.8);
  }
  50% {
    opacity: 1;
    transform: rotate(var(--rotation)) translateY(-70px) scale(1.2);
  }
}

// Responsive adjustments
@media (max-width: 480px) {
  .hendiman-loader__title {
    font-size: 36px;
  }

  .hendiman-loader__tools {
    width: 96px;
    height: 96px;
    margin-bottom: 48px;
  }

  .hendiman-loader__circle {
    width: 96px;
    height: 96px;
  }

  .hendiman-loader__icon svg {
    width: 36px;
    height: 36px;
  }

  .hendiman-loader__dot {
    @for $i from 1 through 4 {
      &:nth-child(#{$i}) {
        transform: rotate(#{($i - 1) * 90}deg) translateY(-50px);
      }
    }
  }

  @keyframes dotPulse {
    0%, 100% {
      opacity: 0.3;
      transform: rotate(var(--rotation)) translateY(-50px) scale(0.8);
    }
    50% {
      opacity: 1;
      transform: rotate(var(--rotation)) translateY(-50px) scale(1.2);
    }
  }
}
</style>

