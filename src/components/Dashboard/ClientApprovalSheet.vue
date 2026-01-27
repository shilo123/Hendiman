<template>
  <div class="hsOverlay" @click.self="$emit('reject')">
    <div class="hsSheet" dir="rtl">
      <div class="hsHandleArea">
        <div class="hsHandle"></div>
      </div>
      
      <div class="hsContent">
        <div class="hsHandymanInfo">
          <div class="hsAvatar">
            <img :src="handyman?.avatar || '/img/Hendima-logo.png'" :alt="handyman?.username">
          </div>
          <h2 class="hsTitle">הנדימן {{ handyman?.username }} מעוניין לקבל את העבודה שלך</h2>
          <p class="hsSubtitle">האם אתה מאשר להתחיל?</p>
        </div>

        <div class="hsActions">
          <button class="hsBtn hsBtn--primary" :disabled="loading" @click="$emit('approve')">
            <span v-if="loading">מעבד...</span>
            <span v-else>כן, אני מאשר</span>
          </button>
          <button class="hsBtn hsBtn--secondary" :disabled="loading" @click="$emit('reject')">
            לא, חזור לחיפוש
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ClientApprovalSheet',
  props: {
    handyman: Object,
    job: Object,
    loading: Boolean
  }
}
</script>

<style scoped>
.hsOverlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  z-index: 10000;
  display: flex;
  align-items: flex-end;
}

.hsSheet {
  width: 100%;
  background: #0b0b0f;
  border-radius: 24px 24px 0 0;
  padding: 12px 20px 40px;
  animation: slideUp 0.3s ease-out;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.hsHandleArea {
  display: flex;
  justify-content: center;
  padding: 8px 0 20px;
}

.hsHandle {
  width: 40px;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.hsContent {
  text-align: center;
}

.hsHandymanInfo {
  margin-bottom: 32px;
}

.hsAvatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin: 0 auto 16px;
  padding: 3px;
  background: linear-gradient(135deg, #ff7a00, #ff9500);
}

.hsAvatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  background: #0b0b0f;
}

.hsTitle {
  font-size: 20px;
  font-weight: 800;
  color: white;
  margin-bottom: 8px;
  line-height: 1.3;
}

.hsSubtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

.hsActions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hsBtn {
  width: 100%;
  height: 56px;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.hsBtn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.hsBtn--primary {
  background: linear-gradient(135deg, #ff7a00, #ff9500);
  color: #0b0b0f;
}

.hsBtn--secondary {
  background: rgba(255, 255, 255, 0.05);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
</style>
