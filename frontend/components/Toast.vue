<script setup lang="ts">
import { useEvents } from '~/composables/useEvents';

const { toasts } = useEvents();
</script>

<template>
  <div class="toast-container">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="['toast-item', `toast-${toast.type}`]"
      >
        <div class="toast-header">
          <span class="toast-icon">✉️</span>
          <strong>{{ toast.title }}</strong>
        </div>
        <div class="toast-body">{{ toast.body }}</div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 999;
  pointer-events: none;
}

.toast-item {
  pointer-events: auto;
  min-width: 320px;
  max-width: 420px;
  background: rgba(19, 27, 46, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--radius-md);
  padding: 14px 18px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  color: var(--text-main);
  animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-success {
  border-left: 4px solid var(--status-success);
}
.toast-danger {
  border-left: 4px solid var(--status-danger);
}
.toast-warning {
  border-left: 4px solid var(--status-warning);
}
.toast-info {
  border-left: 4px solid var(--status-info);
}

.toast-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  margin-bottom: 4px;
}

.toast-body {
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1.4;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
