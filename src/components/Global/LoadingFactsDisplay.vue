<template>
  <div class="loading-facts">
    <transition name="fade">
      <p v-if="currentFact" :key="currentFactIndex" class="loading-facts__text">
        {{ currentFact }}
      </p>
    </transition>
  </div>
</template>

<script>
import factsData from '@/APIS/IsKnow.json';

export default {
  name: 'LoadingFactsDisplay',
  data() {
    return {
      facts: [],
      currentFactIndex: 0,
      intervalId: null
    };
  },
  computed: {
    currentFact() {
      return this.facts[this.currentFactIndex] || '';
    }
  },
  mounted() {
    // Load facts from JSON
    this.facts = Array.isArray(factsData) ? factsData : [];
    
    if (this.facts.length > 0) {
      // Set initial random fact
      this.currentFactIndex = this.getRandomIndex();
      
      // Start interval to change fact every 4 seconds
      this.intervalId = setInterval(() => {
        this.currentFactIndex = this.getRandomIndex(this.currentFactIndex);
      }, 4000);
    }
  },
  beforeUnmount() {
    // Clean up interval
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  },
  methods: {
    getRandomIndex(excludeIndex = -1) {
      // Get random index, ensuring it's different from the excluded index
      let newIndex;
      do {
        newIndex = Math.floor(Math.random() * this.facts.length);
      } while (newIndex === excludeIndex && this.facts.length > 1);
      return newIndex;
    }
  }
};
</script>

<style lang="scss" scoped>
.loading-facts {
  margin-top: 32px;
  padding: 0 20px;
  text-align: center;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 768px) {
    margin-top: 24px;
    padding: 0 16px;
    min-height: 50px;
  }
}

.loading-facts__text {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.6;
  margin: 0;
  max-width: 600px;
  font-weight: 500;

  @media (max-width: 768px) {
    font-size: 16px;
  }

  @media (max-width: 480px) {
    font-size: 15px;
  }
}

// Fade transition
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.6s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
