<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useApi } from '~/composables/useApi';
import { useAuth } from '~/composables/useAuth';

const router = useRouter();
const api = useApi();
const auth = useAuth();

const email = ref('');
const password = ref('');
const loading = ref(false);
const errorMsg = ref('');

async function handleLogin() {
  errorMsg.value = '';
  loading.value = true;

  try {
    const res = await api.post('/api/auth/login', {
      email: email.value,
      password: password.value,
    });

    if (res.data?.accessToken) {
      auth.setAuthData(res.data.accessToken, res.data.refreshToken, res.data.user);
      router.push('/dashboard');
    }
  } catch (err: any) {
    errorMsg.value = err.message || 'Falha ao realizar login';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card glass-card">
      <div class="auth-header">
        <div class="logo">✉️</div>
        <h2>Acessar Minha Conta</h2>
        <p>Acesse seu painel e acompanhe seus e-mails em tempo real</p>
      </div>

      <div v-if="errorMsg" class="error-banner">
        ⚠️ {{ errorMsg }}
      </div>

      <form @submit.prevent="handleLogin">
        <div class="input-group">
          <label class="input-label">E-mail</label>
          <input
            v-model="email"
            type="email"
            class="input-control"
            placeholder="seu.email@empresa.com"
            required
          />
        </div>

        <div class="input-group">
          <label class="input-label">Senha</label>
          <input
            v-model="password"
            type="password"
            class="input-control"
            placeholder="••••••••"
            required
          />
        </div>

        <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
          {{ loading ? 'Entrando...' : 'Entrar no Painel' }}
        </button>
      </form>

      <div class="auth-footer">
        Não tem uma conta? <NuxtLink to="/register">Cadastre-se aqui</NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.auth-card {
  width: 100%;
  max-width: 440px;
  padding: 36px;
}

.auth-header {
  text-align: center;
  margin-bottom: 28px;
}

.logo {
  font-size: 2.5rem;
  margin-bottom: 12px;
}

.auth-header h2 {
  font-size: 1.5rem;
  margin-bottom: 6px;
}

.auth-header p {
  font-size: 0.88rem;
  color: var(--text-muted);
}

.error-banner {
  background: var(--status-danger-bg);
  color: var(--status-danger);
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 10px 14px;
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  margin-bottom: 18px;
}

.btn-block {
  width: 100%;
  padding: 12px;
  margin-top: 8px;
}

.auth-footer {
  text-align: center;
  margin-top: 24px;
  font-size: 0.88rem;
  color: var(--text-muted);
}
</style>
