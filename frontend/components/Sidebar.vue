<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useAuth } from '~/composables/useAuth';

const route = useRoute();
const { user, logout } = useAuth();

const navItems = [
  { name: 'Visão Geral', path: '/dashboard', icon: '📊' },
  { name: 'Meus Domínios', path: '/domains', icon: '🌐' },
  { name: 'Caixas de Entrada', path: '/mailboxes', icon: '📬' },
  { name: 'Chaves de Integração', path: '/api-keys', icon: '🔑' },
  { name: 'Documentação da API', path: '/docs', icon: '📚' },
  { name: 'Minha Conta', path: '/settings', icon: '⚙️' },
];

function isActive(path: string) {
  if (path === '/dashboard' && route.path === '/dashboard') return true;
  if (path !== '/dashboard' && route.path.startsWith(path)) return true;
  return false;
}
</script>

<template>
  <aside class="app-sidebar">
    <div class="brand">
      <div class="logo-icon">✉️</div>
      <div class="logo-text">
        <h2>Central de E-mails</h2>
        <span class="badge badge-info">Ambiente Seguro</span>
      </div>
    </div>

    <nav class="nav-menu">
      <NuxtLink
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        :class="['nav-link', { active: isActive(item.path) }]"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        <span>{{ item.name }}</span>
      </NuxtLink>
    </nav>

    <div class="user-footer">
      <div class="user-info">
        <div class="avatar">{{ user?.name ? user.name[0].toUpperCase() : 'U' }}</div>
        <div class="user-details">
          <div class="user-name">{{ user?.name || 'Usuário' }}</div>
          <div class="user-email">{{ user?.email }}</div>
        </div>
      </div>
      <button class="btn btn-secondary btn-sm logout-btn" @click="logout" title="Sair da conta">
        🚪 Sair
      </button>
    </div>
  </aside>
</template>

<style scoped>
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 24px;
}

.logo-icon {
  font-size: 1.8rem;
  background: var(--accent-gradient-subtle);
  border: 1px solid rgba(99, 102, 241, 0.3);
  padding: 6px;
  border-radius: var(--radius-md);
}

.logo-text h2 {
  font-size: 1.1rem;
  background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  color: var(--text-muted);
  border-radius: var(--radius-md);
  font-weight: 500;
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

.nav-link:hover {
  color: var(--text-main);
  background: rgba(255, 255, 255, 0.05);
}

.nav-link.active {
  color: #ffffff;
  background: var(--accent-primary);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.user-footer {
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--accent-gradient);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.user-details {
  min-width: 0;
}

.user-name {
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  font-size: 0.75rem;
  color: var(--text-dim);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.logout-btn {
  padding: 6px 10px;
  font-size: 0.75rem;
}
</style>
