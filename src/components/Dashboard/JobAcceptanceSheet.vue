<template>
  <div class="hsOverlay" @click.self="$emit('close')">
    <div class="hsSheet hsSheet--confirm" dir="rtl">
      <div class="hsHandleArea">
        <div class="hsHandle"></div>
      </div>
      
      <div class="hsContent">
        <div class="hsIconWrapper">
          <i class="ph-fill ph-warning-circle"></i>
        </div>
        
        <h2 class="hsTitle">האם אתה בטוח שברצונך לקבל את העבודה?</h2>
        
        <div class="hsWarningCard">
          <p class="hsWarningText">
            <i class="ph-bold ph-info"></i>
            שימו לב: קנס על ביטול יכול להגיע עד 200 שקלות.
          </p>
        </div>

        <div class="hsActions">
          <button class="hsBtn hsBtn--primary" :disabled="loading" @click="$emit('confirm')">
            <span v-if="loading">מעבד...</span>
            <span v-else>כן, אני בטוח</span>
          </button>
          <button class="hsBtn hsBtn--secondary" :disabled="loading" @click="$emit('close')">
            ביטול
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'JobAcceptanceSheet',
  props: {
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

.hsIconWrapper {
  font-size: 48px;
  color: #ff7a00;
  margin-bottom: 16px;
}

.hsTitle {
  font-size: 20px;
  font-weight: 800;
  color: white;
  margin-bottom: 24px;
  line-height: 1.3;
}

.hsWarningCard {
  background: rgba(255, 68, 68, 0.1);
  border: 1px solid rgba(255, 68, 68, 0.2);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 32px;
}

.hsWarningText {
  color: #ff4444;
  font-size: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
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
