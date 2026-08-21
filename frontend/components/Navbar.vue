<script setup lang="ts">
import { useEvents } from '~/composables/useEvents';

defineProps<{
  title?: string;
  subtitle?: string;
}>();

const { isConnected } = useEvents();
</script>

<template>
  <header class="app-header">
    <div class="header-titles">
      <h1>{{ title || 'Painel de Controle' }}</h1>
      <p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
    </div>

    <div class="header-actions">
      <div class="status-indicator" :class="{ online: isConnected }">
        <span class="status-dot"></span>
        <span>{{ isConnected ? 'Conectado em tempo real' : 'Sincronizando...' }}</span>
      </div>

      <slot name="actions"></slot>
    </div>
  </header>
</template>

<style scoped>
.header-titles h1 {
  font-size: 1.35rem;
}

.subtitle {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-top: 2px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-dim);
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--status-warning);
}

.status-indicator.online .status-dot {
  background: var(--status-success);
  box-shadow: 0 0 8px var(--status-success);
}
.status-indicator.online {
  color: var(--text-muted);
}
</style>
