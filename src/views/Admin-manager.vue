<template>
  <div class="admin-manager" dir="rtl">
    <div class="admin-manager__container">
      <div class="admin-manager__header">
        <div class="admin-manager__header-content">
          <h1 class="admin-manager__title">ניהול מערכת</h1>
          <!-- Mobile Menu Button -->
          <button
            class="admin-manager__menu-btn"
            @click="mobileMenuOpen = !mobileMenuOpen"
            aria-label="תפריט"
          >
            <span class="admin-manager__menu-icon" :class="{ 'admin-manager__menu-icon--open': mobileMenuOpen }">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>
        <!-- Mobile Current Tab Title -->
        <div class="admin-manager__mobile-tab-title">
          {{ currentTabLabel }}
        </div>
      </div>

      <!-- Desktop Tabs -->
      <div class="tabs tabs--desktop">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab"
          :class="{ 'tab--active': activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Mobile Menu Overlay -->
      <div
        v-if="mobileMenuOpen"
        class="mobile-menu-overlay"
        @click="mobileMenuOpen = false"
      ></div>

      <!-- Mobile Menu -->
      <div class="mobile-menu" :class="{ 'mobile-menu--open': mobileMenuOpen }">
        <div class="mobile-menu__header">
          <h2 class="mobile-menu__title">תפריט ניהול</h2>
          <button
            class="mobile-menu__close"
            @click="mobileMenuOpen = false"
            aria-label="סגור תפריט"
          >
            ✕
          </button>
        </div>
        <div class="mobile-menu__content">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="mobile-menu__item"
            :class="{ 'mobile-menu__item--active': activeTab === tab.id }"
            @click="selectTab(tab.id)"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Users Tab -->
        <UsersTab v-if="activeTab === 'users'" />

        <!-- Categories Tab -->
        <div v-if="activeTab === 'categories'" class="tab-panel">
          <CategoriesTab />
        </div>

        <!-- Contact Tab -->
        <ContactTab v-if="activeTab === 'contact'" />

        <!-- Payments Tab -->
        <PaymentsTab v-if="activeTab === 'payments'" />

        <!-- Status Tab -->
        <div v-if="activeTab === 'status'" class="tab-panel">
          <StatusTab />
        </div>

        <!-- Jobs Tab -->
        <JobsTab v-if="activeTab === 'jobs'" />

        <!-- Settings Tab -->
        <SettingsTab v-if="activeTab === 'settings'" />

        <!-- Cancellations Tab -->
        <CancellationsTab v-if="activeTab === 'cancellations'" />

        <!-- Expenses Tab -->
        <ExpensesTab v-if="activeTab === 'expenses'" />

        <!-- Free Handyman Registration Tab -->
        <FreeHandymanTab v-if="activeTab === 'free-handyman'" />
      </div>

      <!-- Category Edit Modal -->
      <!-- Collect Fine Modal -->
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { URL } from "@/Url/url";
import { useToast } from "@/composables/useToast";
import ReceiptsTab from "@/components/Admin/ReceiptsTab.vue";
import UsersTab from "@/components/Admin/UsersTab.vue";
import CategoriesTab from "@/components/Admin/CategoriesTab.vue";
import StatusTab from "@/components/Admin/StatusTab.vue";
import JobsTab from "@/components/Admin/JobsTab.vue";
import SettingsTab from "@/components/Admin/SettingsTab.vue";
import logger from "@/utils/logger";
import CancellationsTab from "@/components/Admin/CancellationsTab.vue";
import ExpensesTab from "@/components/Admin/ExpensesTab.vue";
import ContactTab from "@/components/Admin/ContactTab.vue";
import FreeHandymanTab from "@/components/Admin/FreeHandymanTab.vue";
import PaymentsTab from "@/components/Admin/PaymentsTab.vue";

export default {
  name: "AdminManager",
  components: {
    ReceiptsTab,
    UsersTab,
    CategoriesTab,
    StatusTab,
    JobsTab,
    SettingsTab,
    CancellationsTab,
    ExpensesTab,
    ContactTab,
    FreeHandymanTab,
    PaymentsTab,
  },
  data() {
    return {
      activeTab: "users",
      mobileMenuOpen: false,
      tabs: [
        { id: "users", label: "משתמשים" },
        { id: "categories", label: "ניהול קטגוריות" },
        { id: "jobs", label: "עבודות" },
        { id: "contact", label: "פניות" },
        { id: "payments", label: "תשלומים" },
        { id: "expenses", label: "פירוט הוצאות" },
        { id: "status", label: "סטטוסים" },
        { id: "settings", label: "הגדרות" },
        { id: "cancellations", label: "ביטולים" },
        { id: "free-handyman", label: "רישום הנדימן חבר בחינם" },
      ],
      toast: null,
      // Status
    };
  },
  computed: {
    currentTabLabel() {
      const tab = this.tabs.find((t) => t.id === this.activeTab);
      return tab ? tab.label : "ניהול מערכת";
    },
  },
  created() {
    this.toast = useToast();
  },
  computed: {},
  async mounted() {
    if (this.activeTab === "status") {
    }
  },
  methods: {
    getCategorySpecialties(specialties) {
      if (!specialties || !Array.isArray(specialties)) return [];
      return specialties.filter((s) => s.type === "category");
    },
    selectTab(tabId) {
      this.activeTab = tabId;
      this.mobileMenuOpen = false;
    },
  },
};
</script>

<style lang="scss" scoped>
$font-family: "Heebo", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
  "Helvetica Neue", Arial, sans-serif;
$bg: #0b0b0f;
$orange: #ff6a00;
$orange2: #ff8a2b;
$text: rgba(255, 255, 255, 0.92);
$muted: rgba(255, 255, 255, 0.62);

.admin-manager {
  min-height: 100vh;
  background: $bg;
  padding: 20px;
}

.admin-manager__container {
  max-width: 1400px;
  margin: 0 auto;
}

.admin-manager__header {
  margin-bottom: 24px;
}

.admin-manager__header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.admin-manager__title {
  font-size: 28px;
  font-weight: 1100;
  color: $text;
  margin: 0;
}

.admin-manager__menu-btn {
  display: none;
  background: rgba($orange, 0.15);
  border: 1px solid rgba($orange, 0.3);
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: $orange2;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 5px;

  &:hover {
    background: rgba($orange, 0.25);
    border-color: rgba($orange, 0.5);
  }

  @media (max-width: 500px) {
    display: flex;
  }
}

.admin-manager__menu-icon {
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 20px;
  height: 16px;
  position: relative;

  span {
    display: block;
    width: 100%;
    height: 2px;
    background: $orange2;
    border-radius: 2px;
    transition: all 0.3s ease;
  }

  &--open {
    span:nth-child(1) {
      transform: rotate(45deg) translate(6px, 6px);
    }

    span:nth-child(2) {
      opacity: 0;
    }

    span:nth-child(3) {
      transform: rotate(-45deg) translate(6px, -6px);
    }
  }
}

.admin-manager__mobile-tab-title {
  display: none;
  font-size: 18px;
  font-weight: 1000;
  color: $orange2;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba($orange, 0.2);

  @media (max-width: 500px) {
    display: block;
  }
}

/* Tabs */
.tabs {
  display: flex;
  gap: 8px;
  border-bottom: 2px solid rgba($orange, 0.2);
  margin-bottom: 24px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  @media (max-width: 500px) {
    display: none;
  }

  &--desktop {
    @media (max-width: 500px) {
      display: none;
    }
  }
}

.tabs::-webkit-scrollbar {
  height: 4px;
}

.tabs::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.tabs::-webkit-scrollbar-thumb {
  background: rgba($orange, 0.3);
  border-radius: 2px;
}

.tab {
  padding: 12px 20px;
  border: none;
  background: transparent;
  color: $muted;
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all 0.2s ease;
  white-space: nowrap;
  font-family: $font-family;

  &:hover {
    color: $orange2;
  }

  &--active {
    color: $orange2;
    border-bottom-color: $orange;
  }
}

.tab-content {
  min-height: 400px;
}

.tab-panel {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.filter-input,
.filter-select {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  font-size: 14px;
  font-weight: 800;
  font-family: $font-family;
  min-width: 200px;

  &::placeholder {
    color: $muted;
  }

  &:focus {
    outline: none;
    border-color: $orange;
    box-shadow: 0 0 0 3px rgba($orange, 0.2);
  }
}

.filter-select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ff8a2b' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: left 12px center;
  padding-left: 36px;
  background-size: 12px;

  option {
    background: $bg;
    color: $text;
    padding: 8px;
  }

  &:hover {
    border-color: rgba($orange, 0.5);
  }
}

.no-rating {
  color: $muted;
  font-style: italic;
  font-size: 12px;
}

.no-data {
  text-align: center;
  padding: 40px;
  color: $muted;
  font-size: 14px;
}

.job-id {
  font-family: monospace;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  word-break: break-all;
  max-width: 150px;
  display: inline-block;
}

.handyman-id {
  font-family: monospace;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  margin-right: 5px;
  display: inline-block;
}

/* Categories Section */
/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: $muted;
  font-size: 16px;
  font-weight: 800;
}

/* Status Section */
/* Financials Section */
.financials-section {
  animation: fadeIn 0.3s ease;
}

.financials-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;
  flex-wrap: wrap;
}

.financials-title {
  font-size: 20px;
  font-weight: 1000;
  color: $orange2;
}

.refresh-financials-btn {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba($orange, 0.15);
  color: $orange2;
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: $font-family;

  &:hover {
    background: rgba($orange, 0.25);
    border-color: rgba($orange, 0.5);
    transform: translateY(-1px);
  }
}

.financials-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}

.financials-card {
  border-radius: 16px;
  border: 1px solid rgba($orange, 0.2);
  background: rgba(255, 255, 255, 0.04);
  overflow: hidden;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba($orange, 0.3);
  }

  &--expenses {
    border-color: rgba(239, 68, 68, 0.3);
    background: rgba(239, 68, 68, 0.05);
  }

  &--revenue {
    border-color: rgba(16, 185, 129, 0.3);
    background: rgba(16, 185, 129, 0.05);
  }
}

.financials-card__header {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.financials-card__title {
  font-size: 18px;
  font-weight: 1000;
  color: $text;
  margin: 0;
}

.financials-card__body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.financial-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  gap: 12px;

  &:last-child {
    border-bottom: none;
  }

  &--total {
    padding-top: 16px;
    margin-top: 8px;
    border-top: 2px solid rgba(255, 255, 255, 0.15);
    border-bottom: none;
  }
}

.financial-item__actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.financial-action-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 16px;
  background: rgba($orange, 0.15);
  color: $orange2;
  border: 1px solid rgba($orange, 0.3);

  &:hover {
    background: rgba($orange, 0.25);
    border-color: rgba($orange, 0.5);
    transform: translateY(-1px);
  }

  &--add {
    background: rgba($orange, 0.15);
    color: $orange2;
  }
}

.financial-item__label {
  font-size: 14px;
  font-weight: 900;
  color: $muted;
}

.financial-item__value {
  font-size: 16px;
  font-weight: 1000;
  font-family: "Courier New", monospace;

  &--expense {
    color: #ef4444;
  }

  &--revenue {
    color: #10b981;
  }

  &--total-expense {
    font-size: 20px;
    color: #ef4444;
  }

  &--total-revenue {
    font-size: 20px;
    color: #10b981;
  }
}

.financials-summary {
  grid-column: 1 / -1;
}

.summary-card {
  padding: 24px;
  border-radius: 16px;
  border: 2px solid rgba($orange, 0.3);
  background: rgba(255, 255, 255, 0.06);
  text-align: center;
}

.summary-card__label {
  font-size: 14px;
  font-weight: 900;
  color: $muted;
  margin-bottom: 12px;
}

.summary-card__value {
  font-size: 32px;
  font-weight: 1000;
  font-family: "Courier New", monospace;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;

  &--profit {
    color: #10b981;
  }

  &--loss {
    color: #ef4444;
  }
}

.summary-card__indicator {
  font-size: 16px;
  font-weight: 900;
  padding: 4px 12px;
  border-radius: 8px;
  font-family: $font-family;
}

.summary-card__value--profit .summary-card__indicator {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.4);
}

.summary-card__value--loss .summary-card__indicator {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.4);
}

/* Chart Section */
.financials-chart {
  grid-column: 1 / -1;
  margin-top: 24px;
  padding: 24px;
  border-radius: 16px;
  border: 1px solid rgba($orange, 0.2);
  background: rgba(255, 255, 255, 0.04);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;
  flex-wrap: wrap;
}

.chart-title {
  font-size: 18px;
  font-weight: 1000;
  color: $orange2;
  margin: 0;
}

.chart-period-selector {
  display: flex;
  gap: 8px;
}

.period-btn {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba(255, 255, 255, 0.06);
  color: $muted;
  font-size: 13px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: $font-family;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba($orange, 0.5);
  }

  &--active {
    background: rgba($orange, 0.15);
    color: $orange2;
    border-color: rgba($orange, 0.5);
  }
}

.chart-container {
  position: relative;
  height: 400px;
  width: 100%;

  @media (max-width: 768px) {
    height: 300px;
  }
}

.current-value {
  font-size: 14px;
  font-weight: 800;
  color: $muted;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
}

.financial-edit-buttons {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.financial-edit-buttons .btn {
  flex: 1;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

.modal-content {
  background: $bg;
  border-radius: 16px;
  border: 1px solid rgba($orange, 0.2);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba($orange, 0.2);
}

.modal-title {
  font-size: 20px;
  font-weight: 1000;
  color: $orange2;
}

.modal-close {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: $text;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid rgba($orange, 0.2);
}

.form-field {
  margin-bottom: 20px;
  width: 100%;
  box-sizing: border-box;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 900;
  color: $text;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  font-size: 14px;
  font-weight: 800;
  font-family: $font-family;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: $orange;
    box-shadow: 0 0 0 3px rgba($orange, 0.2);
  }

  &[type="textarea"],
  textarea {
    resize: vertical;
    min-height: 80px;
  }
}

// Style select inputs specifically
select.form-input {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ff8a2b' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: left 12px center;
  padding-left: 36px;
  background-size: 12px;
  cursor: pointer;

  option {
    background: $bg;
    color: $text;
    padding: 10px;
    font-weight: 800;
  }

  &:hover {
    border-color: rgba($orange, 0.5);
  }
}

.modal-content--confirm {
  max-width: 450px;
}

.confirm-message {
  font-size: 15px;
  font-weight: 800;
  color: $text;
  line-height: 1.6;
  text-align: center;
  padding: 10px 0;
}

.btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: $font-family;
  border: none;

  &--ghost {
    background: rgba(255, 255, 255, 0.06);
    color: $text;
    border: 1px solid rgba(255, 255, 255, 0.2);

    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }

  &--primary {
    background: rgba($orange, 0.15);
    color: $orange2;
    border: 1px solid rgba($orange, 0.3);

    &:hover:not(:disabled) {
      background: rgba($orange, 0.25);
      border-color: rgba($orange, 0.5);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background: rgba($orange, 0.1);
    }
  }

  &--danger {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.3);

    &:hover {
      background: rgba(239, 68, 68, 0.25);
      border-color: rgba(239, 68, 68, 0.5);
    }
  }
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 40px;
  color: $muted;
  font-size: 14px;
  font-weight: 800;
}

/* Mobile Menu */
.mobile-menu-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 9998;
  backdrop-filter: blur(4px);

  @media (max-width: 500px) {
    display: block;
  }
}

.mobile-menu {
  display: none;
  position: fixed;
  top: 0;
  right: -100%;
  width: 280px;
  max-width: 85vw;
  height: 100vh;
  background: $bg;
  border-left: 1px solid rgba($orange, 0.2);
  z-index: 9999;
  transition: right 0.3s ease;
  overflow-y: auto;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.5);

  @media (max-width: 500px) {
    display: block;
  }

  &--open {
    right: 0;
  }
}

.mobile-menu__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba($orange, 0.2);
  background: rgba($orange, 0.05);
  position: sticky;
  top: 0;
  z-index: 10;
}

.mobile-menu__title {
  font-size: 20px;
  font-weight: 1000;
  color: $orange2;
  margin: 0;
}

.mobile-menu__close {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: $text;
  font-size: 24px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}

.mobile-menu__content {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mobile-menu__item {
  padding: 16px 20px;
  border: none;
  background: rgba(255, 255, 255, 0.04);
  color: $muted;
  font-size: 16px;
  font-weight: 900;
  cursor: pointer;
  border-radius: 12px;
  transition: all 0.2s ease;
  text-align: right;
  font-family: $font-family;
  border: 1px solid transparent;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: $orange2;
  }

  &--active {
    background: rgba($orange, 0.15);
    color: $orange2;
    border-color: rgba($orange, 0.3);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .admin-manager {
    padding: 12px;
  }

  .admin-manager__title {
    font-size: 24px;
  }
}

@media (max-width: 500px) {
  .admin-manager {
    padding: 12px;
  }

  .admin-manager__title {
    font-size: 20px;
  }

  .admin-manager__mobile-tab-title {
    font-size: 16px;
  }

  .users-section__header {
    gap: 12px;
  }

  .users-section__filters {
    flex-direction: column;
  }

  .user-type-tabs {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .user-type-tab {
    padding: 8px 16px;
    font-size: 13px;
  }

  .filter-input,
  .filter-select {
    min-width: 100%;
  }

  .users-table-wrapper {
    font-size: 12px;
  }

  .users-table {
    th,
    td {
      padding: 8px 6px;
      font-size: 11px;
    }
  }
}

/* Settings Section */
.settings-section {
  animation: fadeIn 0.3s ease;
}

.settings-section__header {
  margin-bottom: 24px;
}

.settings-section__title {
  font-size: 20px;
  font-weight: 1000;
  color: $orange2;
}

.settings-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;

  @media (min-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }
}

.settings-card {
  border-radius: 16px;
  border: 1px solid rgba($orange, 0.2);
  background: rgba(255, 255, 255, 0.04);
  overflow: hidden;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba($orange, 0.3);
  }
}

.settings-card__header {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.settings-card__title {
  font-size: 18px;
  font-weight: 1000;
  color: $text;
  margin: 0 0 8px 0;
}

.settings-card__description {
  font-size: 14px;
  font-weight: 800;
  color: $muted;
  margin: 0;
}

.settings-card__body {
  padding: 20px;
  overflow: hidden;
  box-sizing: border-box;
}

.settings-card__actions {
  margin-top: 16px;
  display: flex;
  gap: 12px;
}

.current-fee-display {
  font-size: 14px;
  font-weight: 800;
  color: $muted;
  margin-top: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
}

/* Cancellations Section */

/* Inquiries Section */
.inquiries-section__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 16px;
  flex-wrap: wrap;
}

.inquiries-section__title {
  font-size: 20px;
  font-weight: 1000;
  color: $orange2;
}

.inquiries-section__controls {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.refresh-inquiries-btn {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba($orange, 0.15);
  color: $orange2;
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: $font-family;

  &:hover {
    background: rgba($orange, 0.25);
    border-color: rgba($orange, 0.5);
    transform: translateY(-1px);
  }
}

.inquiries-table-wrapper {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid rgba($orange, 0.2);
  background: rgba(255, 255, 255, 0.04);
}

.inquiries-table {
  width: 100%;
  border-collapse: collapse;

  thead {
    background: rgba($orange, 0.1);
  }

  th {
    padding: 14px 12px;
    text-align: right;
    font-size: 13px;
    font-weight: 1000;
    color: $orange2;
    border-bottom: 1px solid rgba($orange, 0.2);
    white-space: nowrap;
  }

  td {
    padding: 12px;
    text-align: right;
    font-size: 13px;
    font-weight: 800;
    color: $text;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    vertical-align: middle;
  }

  tbody tr {
    transition: background 0.2s ease;

    &:hover {
      background: rgba($orange, 0.05);
    }

    &:last-child td {
      border-bottom: none;
    }
  }
}

.inquiry-date {
  font-weight: 800;
  color: $text;
  font-size: 13px;
}

.inquiry-time {
  font-size: 11px;
  color: $muted;
  margin-top: 4px;
}

.inquiry-title {
  font-weight: 900;
  color: $text;
  font-size: 13px;
}

.inquiry-content {
  color: $text;
  font-size: 12px;
  line-height: 1.4;
  max-width: 300px;
  word-wrap: break-word;
}

.inquiry-content-mention {
  display: inline;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba($orange, 0.2);
  border: 1px solid rgba($orange, 0.4);
  color: $orange2;
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  margin: 0 2px;
  font-family: $font-family;
  vertical-align: baseline;

  &:hover {
    background: rgba($orange, 0.3);
    border-color: rgba($orange, 0.6);
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba($orange, 0.3);
  }
}

.inquiry-user {
  font-weight: 800;
  color: $text;
  font-size: 13px;

  &--anonymous {
    color: $muted;
    font-style: italic;
  }
}

.inquiry-mentions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.inquiry-mention-tag {
  padding: 4px 8px;
  border-radius: 6px;
  background: rgba($orange, 0.15);
  border: 1px solid rgba($orange, 0.3);
  font-size: 11px;
  font-weight: 800;
  color: $orange2;
  white-space: nowrap;
  display: inline-block;

  &--clickable {
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid rgba($orange, 0.3);
    background: rgba($orange, 0.15);

    &:hover {
      background: rgba($orange, 0.25);
      border-color: rgba($orange, 0.5);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba($orange, 0.3);
    }
  }
}

.inquiry-no-mentions {
  color: $muted;
  font-size: 12px;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  border: 1px solid rgba($orange, 0.2);
}

.pagination-btn {
  padding: 10px 20px;
  border-radius: 8px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba($orange, 0.15);
  color: $orange2;
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: $font-family;

  &:hover:not(:disabled) {
    background: rgba($orange, 0.25);
    border-color: rgba($orange, 0.5);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.pagination-info {
  font-size: 14px;
  font-weight: 800;
  color: $text;
  white-space: nowrap;
  font-style: italic;
}

.inquiry-status-badge {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 900;
  display: inline-block;
  border: 1px solid;
  transition: all 0.2s ease;
  white-space: nowrap;

  &--pending {
    background: rgba(255, 193, 7, 0.15);
    color: #ffc107;
    border-color: rgba(255, 193, 7, 0.3);
  }

  &--responded {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
    border-color: rgba(16, 185, 129, 0.3);
  }

  &--resolved {
    background: rgba(59, 130, 246, 0.15);
    color: #3b82f6;
    border-color: rgba(59, 130, 246, 0.3);
  }

  &--deleted {
    background: rgba(107, 114, 128, 0.15);
    color: #6b7280;
    border-color: rgba(107, 114, 128, 0.3);
  }
}

.inquiry-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.inquiry-action-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid;
  background: transparent;
  color: $text;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 16px;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &--push {
    border-color: rgba(59, 130, 246, 0.3);
    background: rgba(59, 130, 246, 0.15);
    color: #3b82f6;

    &:hover:not(:disabled) {
      background: rgba(59, 130, 246, 0.25);
      border-color: rgba(59, 130, 246, 0.5);
    }
  }

  &--email {
    border-color: rgba(234, 67, 53, 0.3);
    background: rgba(234, 67, 53, 0.15);
    color: #ea4335;

    &:hover:not(:disabled) {
      background: rgba(234, 67, 53, 0.25);
      border-color: rgba(234, 67, 53, 0.5);
    }
  }

  &--respond {
    border-color: rgba(16, 185, 129, 0.3);
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;

    &:hover:not(:disabled) {
      background: rgba(16, 185, 129, 0.25);
      border-color: rgba(16, 185, 129, 0.5);
    }
  }

  &--delete {
    border-color: rgba(239, 68, 68, 0.3);
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;

    &:hover:not(:disabled) {
      background: rgba(239, 68, 68, 0.25);
      border-color: rgba(239, 68, 68, 0.5);
    }
  }
}

@media (max-width: 768px) {
  .inquiries-section__header {
    flex-direction: column;
    align-items: stretch;
  }

  .inquiries-section__controls {
    width: 100%;
    flex-direction: column;
  }

  .refresh-inquiries-btn {
    width: 100%;
    justify-content: center;
  }

  .inquiries-table-wrapper {
    font-size: 12px;
  }

  .inquiries-table {
    th,
    td {
      padding: 8px 6px;
      font-size: 11px;
    }
  }

  .inquiry-content {
    max-width: 150px;
  }

  .inquiry-action-btn {
    width: 28px;
    height: 28px;
    font-size: 14px;
  }
}

/* User Details Modal */
.modal-content--large {
  max-width: 700px;
}

.user-details-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.user-details-section {
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
}

.user-details-section__title {
  font-size: 18px;
  font-weight: 1000;
  color: $orange2;
  margin: 0 0 16px 0;
}

.user-details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.user-detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-detail-label {
  font-size: 12px;
  font-weight: 800;
  color: $muted;
}

.user-detail-value {
  font-size: 14px;
  font-weight: 900;
  color: $text;
}

.user-status--active {
  color: #10b981;
}

.user-status--blocked {
  color: #ef4444;
}

.user-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.user-stat-card {
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba($orange, 0.2);
  background: rgba(255, 255, 255, 0.04);
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba($orange, 0.4);
    transform: translateY(-2px);
  }
}

.user-stat-icon {
  font-size: 32px;
  line-height: 1;
  flex-shrink: 0;
}

.user-stat-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-stat-value {
  font-size: 20px;
  font-weight: 1000;
  color: $orange2;
  font-family: "Courier New", monospace;
}

.user-stat-label {
  font-size: 12px;
  font-weight: 800;
  color: $muted;
}

@media (max-width: 768px) {
  .modal-content--large {
    max-width: 95%;
  }

  .user-details-grid,
  .user-stats-grid {
    grid-template-columns: 1fr;
  }

  .user-stat-card {
    padding: 12px;
  }
}

/* Free Handyman Registration Styles */
.free-handyman-section {
  padding: 24px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 16px;
  border: 1px solid rgba($orange, 0.2);
}

.free-handyman-section__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba($orange, 0.3);
}

.free-handyman-section__title {
  font-size: 28px;
  font-weight: 1000;
  color: $orange2;
  margin: 0;
  font-family: $font-family;
}

.free-handyman-section__badge {
  display: flex;
  align-items: center;
}

.badge {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 900;
  display: inline-block;
  border: 2px solid;

  &--free {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
    border-color: rgba(16, 185, 129, 0.4);
  }
}

.free-handyman-form-wrapper {
  max-width: 800px;
  margin: 0 auto;
}

.free-handyman-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
  background: rgba(255, 255, 255, 0.03);
  padding: 32px;
  border-radius: 16px;
  border: 1px solid rgba($orange, 0.15);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 900;
  color: $orange2;
  font-family: $font-family;
}

.form-input {
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba(255, 255, 255, 0.05);
  color: $text;
  font-size: 14px;
  font-weight: 600;
  font-family: $font-family;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: $orange;
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 0 0 3px rgba($orange, 0.1);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
}

.input-with-icon {
  position: relative;
  display: flex;
  align-items: center;

  .form-input {
    padding-right: 48px;
    width: 100%;
  }

  .icon-btn {
    position: absolute;
    right: 12px;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s ease;

    &:hover {
      color: $orange2;
    }
  }
}

.file-upload {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.file-upload__input {
  display: none;
}

.file-upload__btn {
  padding: 12px 20px;
  border-radius: 8px;
  border: 2px dashed rgba($orange, 0.4);
  background: rgba($orange, 0.1);
  color: $orange2;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  transition: all 0.2s ease;
  font-family: $font-family;

  &:hover:not(.disabled) {
    background: rgba($orange, 0.2);
    border-color: rgba($orange, 0.6);
    transform: translateY(-1px);
  }

  &.disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.image-preview {
  margin-top: 12px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba($orange, 0.3);
  max-width: 200px;

  img {
    width: 100%;
    height: auto;
    display: block;
  }
}

.form-actions {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

.btn {
  padding: 14px 32px;
  border-radius: 8px;
  border: none;
  font-size: 16px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: $font-family;

  &--free {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
    }

    &:active:not(:disabled) {
      transform: translateY(0);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

/* Receipts Section Styles */
.receipts-section {
  padding: 24px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 16px;
  border: 1px solid rgba($orange, 0.2);
}

.receipts-section__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba($orange, 0.3);
}

.receipts-section__title {
  font-size: 28px;
  font-weight: 1000;
  color: $orange2;
  margin: 0;
  font-family: $font-family;
}

.refresh-receipts-btn {
  padding: 10px 20px;
  border-radius: 8px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba($orange, 0.15);
  color: $orange2;
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: $font-family;

  &:hover {
    background: rgba($orange, 0.25);
    border-color: rgba($orange, 0.5);
    transform: translateY(-1px);
  }
}

.receipts-table-wrapper {
  overflow-x: auto;
  margin-top: 20px;
}

.receipts-table {
  width: 100%;
  border-collapse: collapse;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  overflow: hidden;

  thead {
    background: rgba($orange, 0.1);
  }

  th {
    padding: 14px 12px;
    text-align: right;
    font-size: 13px;
    font-weight: 1000;
    color: $orange2;
    border-bottom: 1px solid rgba($orange, 0.2);
    white-space: nowrap;
  }

  td {
    padding: 12px;
    text-align: right;
    font-size: 13px;
    font-weight: 800;
    color: $text;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    vertical-align: middle;
  }

  tbody tr {
    transition: background 0.2s ease;

    &:hover {
      background: rgba($orange, 0.05);
    }

    &:last-child td {
      border-bottom: none;
    }
  }
}

.receipt-type-badge {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 900;
  display: inline-block;
  border: 1px solid;
  transition: all 0.2s ease;
  white-space: nowrap;

  &--handyman {
    background: rgba(59, 130, 246, 0.15);
    color: #3b82f6;
    border-color: rgba(59, 130, 246, 0.3);
  }

  &--platform {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
    border-color: rgba(16, 185, 129, 0.3);
  }

  &--subscription {
    background: rgba(139, 92, 246, 0.15);
    color: #8b5cf6;
    border-color: rgba(139, 92, 246, 0.3);
  }
}

.receipt-status-badge {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 900;
  display: inline-block;
  border: 1px solid;
  transition: all 0.2s ease;
  white-space: nowrap;

  &--sent {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
    border-color: rgba(16, 185, 129, 0.3);
  }

  &--pending {
    background: rgba(255, 193, 7, 0.15);
    color: #ffc107;
    border-color: rgba(255, 193, 7, 0.3);
  }

  &--failed {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
    border-color: rgba(239, 68, 68, 0.3);
  }
}

.receipt-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
}

.receipt-error {
  color: #ef4444;
  font-weight: 700;
  margin-top: 4px;
}
/* Jobs Tab Styles */
.jobs-section {
  padding: 24px;
}

.jobs-section__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;
  flex-wrap: wrap;
}

.jobs-section__title {
  font-size: 24px;
  font-weight: 1000;
  color: $orange2;
  margin: 0;
}

.jobs-section__controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.filter-select {
  padding: 10px 16px;
  border-radius: 12px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba(255, 255, 255, 0.06);
  color: $text;
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-select:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba($orange, 0.5);
}

.refresh-jobs-btn {
  padding: 10px 16px;
  border-radius: 12px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba($orange, 0.15);
  color: $orange2;
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s ease;
}

.refresh-jobs-btn:hover {
  background: rgba($orange, 0.25);
  transform: translateY(-1px);
}

.jobs-table-wrapper {
  overflow-x: auto;
  overflow-y: hidden;
  border-radius: 16px;
  border: 1px solid rgba($orange, 0.2);
  background: rgba(255, 255, 255, 0.04);
}

.jobs-table__header-group {
  background: rgba($orange, 0.15);
  border-bottom: 2px solid rgba($orange, 0.3);
}

.jobs-table__group-header {
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 1000;
  color: $orange2;
  text-align: center;
  border: 1px solid rgba($orange, 0.2);
}

.jobs-table {
  width: 100%;
  border-collapse: collapse;
}

.jobs-table thead {
  background: rgba($orange, 0.1);
}

.jobs-table th {
  padding: 16px;
  text-align: right;
  font-size: 14px;
  font-weight: 1000;
  color: $orange2;
  border-bottom: 2px solid rgba($orange, 0.3);
}

.jobs-table td {
  padding: 16px;
  text-align: right;
  font-size: 14px;
  font-weight: 900;
  color: $text;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.jobs-table__row:hover {
  background: rgba(255, 255, 255, 0.06);
}

.job-date {
  font-size: 13px;
  font-weight: 1000;
  color: $text;
}

.job-time {
  font-size: 11px;
  font-weight: 800;
  color: $muted;
  margin-top: 4px;
}

.job-price {
  font-size: 15px;
  font-weight: 1000;
  color: $orange2;
}

.job-status {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 900;
  display: inline-block;
}

.job-status--open {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.4);
}

.job-status--assigned {
  background: rgba(234, 179, 8, 0.2);
  color: #eab308;
  border: 1px solid rgba(234, 179, 8, 0.4);
}

.job-status--on_the_way {
  background: rgba(168, 85, 247, 0.2);
  color: #a855f7;
  border: 1px solid rgba(168, 85, 247, 0.4);
}

.job-status--in_progress {
  background: rgba($orange, 0.2);
  color: $orange2;
  border: 1px solid rgba($orange, 0.4);
}

.job-status--done {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.4);
}

.job-status--cancelled {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.4);
}

.job-view-btn {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid rgba($orange, 0.3);
  background: rgba($orange, 0.15);
  color: $orange2;
  font-size: 13px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s ease;
}

.job-view-btn:hover {
  background: rgba($orange, 0.25);
  transform: translateY(-1px);
}

.job-category {
  font-weight: 900;
  color: $orange2;
}

.job-subcategory {
  font-weight: 1000;
  color: $text;
}

.no-data {
  color: $muted;
  font-style: italic;
}

@media (max-width: 768px) {
  .jobs-table {
    font-size: 12px;
  }

  .jobs-table th,
  .jobs-table td {
    padding: 10px 8px;
  }

  .jobs-section__header {
    flex-direction: column;
    align-items: flex-start;
  }
}

.job-category {
  font-weight: 900;
  color: $orange2;
}

.job-subcategory {
  font-weight: 1000;
  color: $text;
}

/* Job Details Modal */
.job-details-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  z-index: 100000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow-y: auto;
}

.job-details-modal {
  background: rgba(11, 11, 15, 0.98);
  border-radius: 24px;
  border: 1px solid rgba($orange, 0.3);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.9);
  width: 95vw;
  max-width: 1400px;
  max-height: 95vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.job-details-modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  border-bottom: 1px solid rgba($orange, 0.2);
  background: rgba($orange, 0.05);
  flex-shrink: 0;
}

.job-details-modal__title {
  font-size: 28px;
  font-weight: 1100;
  color: $orange2;
  margin: 0;
}

.job-details-modal__close {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: $text;
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
}

.job-details-modal__close:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.job-details-modal__body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.job-details-modal__loading {
  padding: 60px;
  text-align: center;
  font-size: 18px;
  font-weight: 900;
  color: $muted;
}

.job-details-section {
  margin-bottom: 20px;
  padding: 18px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.job-details-section__title {
  font-size: 16px;
  font-weight: 1000;
  color: $orange2;
  margin: 0 0 14px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid rgba($orange, 0.3);
}

.job-details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}

.job-details-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.job-details-item--full {
  grid-column: 1 / -1;
}

.job-details-item--total {
  background: rgba($orange, 0.15);
  border-color: rgba($orange, 0.3);
  margin-top: 8px;
}

.job-details-item__label {
  font-size: 13px;
  font-weight: 900;
  color: $muted;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.job-details-item__value {
  font-size: 16px;
  font-weight: 1000;
  color: $text;
}

.job-details-item__subtext {
  font-size: 12px;
  font-weight: 800;
  color: $muted;
  margin-right: 8px;
}

.job-price {
  color: $orange2;
  font-weight: 1100;
}

.job-price--total {
  font-size: 20px;
  color: $orange;
}

.job-details-images {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.job-details-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 12px;
  border: 2px solid rgba($orange, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
}

.job-details-image:hover {
  transform: scale(1.05);
  border-color: $orange;
  box-shadow: 0 8px 24px rgba($orange, 0.4);
}

.job-details-description {
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 15px;
  font-weight: 900;
  color: $text;
  line-height: 1.6;
  white-space: pre-wrap;
}

/* Image Modal */
.image-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(10px);
  z-index: 100001;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.image-modal {
  position: relative;
  max-width: 95vw;
  max-height: 95vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-modal__close {
  position: absolute;
  top: -50px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  color: $text;
  font-size: 24px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
  z-index: 10;
}

.image-modal__close:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateX(-50%) scale(1.1);
}

.image-modal__img {
  max-width: 100%;
  max-height: 95vh;
  object-fit: contain;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
}

@media (max-width: 768px) {
  .job-details-modal {
    width: 100vw;
    max-width: 100vw;
    max-height: 100vh;
    border-radius: 0;
  }

  .job-details-modal__header {
    padding: 16px 20px;
  }

  .job-details-modal__title {
    font-size: 20px;
  }

  .job-details-modal__body {
    padding: 20px;
  }

  .job-details-grid {
    grid-template-columns: 1fr;
  }

  .job-details-images {
    grid-template-columns: 1fr;
  }
}
</style>
