<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '~/composables/useAuth';
import { useApi } from '~/composables/useApi';
import Sidebar from '~/components/Sidebar.vue';
import Navbar from '~/components/Navbar.vue';

const router = useRouter();
const auth = useAuth();
const api = useApi();

const name = ref('');
const email = ref('');
const currentPassword = ref('');
const newPassword = ref('');
const saveLoading = ref(false);
const successMsg = ref('');
const errorMsg = ref('');

async function loadProfile() {
  try {
    const res = await api.get('/api/user');
    if (res.data) {
      name.value = res.data.name;
      email.value = res.data.email;
    }
  } catch (err: any) {
    console.error(err);
  }
}

async function handleUpdateProfile() {
  successMsg.value = '';
  errorMsg.value = '';
  saveLoading.value = true;

  try {
    const payload: any = { name: name.value };
    if (newPassword.value) {
      payload.currentPassword = currentPassword.value;
      payload.newPassword = newPassword.value;
    }

    const res = await api.patch('/api/user', payload);
    if (res.data) {
      successMsg.value = 'Dados atualizados com sucesso!';
      currentPassword.value = '';
      newPassword.value = '';
      if (auth.user.value) {
        auth.user.value.name = res.data.name;
      }
    }
  } catch (err: any) {
    errorMsg.value = err.message || 'Erro ao atualizar dados';
  } finally {
    saveLoading.value = false;
  }
}

onMounted(() => {
  auth.initAuth();
  if (!auth.isAuthenticated.value) {
    router.push('/login');
    return;
  }
  loadProfile();
});
</script>

<template>
  <div class="app-layout">
    <Sidebar />
    <div class="app-content">
      <Navbar title="Minha Conta" subtitle="Gerencie seus dados de acesso e veja como conectar seus sistemas" />

      <main class="app-main">
        <div class="settings-grid">
          <!-- Card de Perfil -->
          <div class="glass-card settings-card">
            <h3>👤 Meus Dados de Acesso</h3>
            <p class="section-desc">Atualize seu nome ou modifique sua senha de login.</p>

            <div v-if="successMsg" class="alert alert-success">✓ {{ successMsg }}</div>
            <div v-if="errorMsg" class="alert alert-danger">⚠️ {{ errorMsg }}</div>

            <form @submit.prevent="handleUpdateProfile">
              <div class="input-group">
                <label class="input-label">Nome Completo</label>
                <input v-model="name" type="text" class="input-control" required />
              </div>

              <div class="input-group">
                <label class="input-label">E-mail de Login</label>
                <input v-model="email" type="email" class="input-control" disabled style="opacity: 0.6;" />
              </div>

              <hr class="divider" />

              <h4 style="margin-bottom: 12px; font-size: 1rem;">Alterar Minha Senha</h4>

              <div class="input-group">
                <label class="input-label">Senha Atual</label>
                <input v-model="currentPassword" type="password" class="input-control" placeholder="••••••••" />
              </div>

              <div class="input-group">
                <label class="input-label">Nova Senha</label>
                <input v-model="newPassword" type="password" class="input-control" placeholder="Mínimo 8 caracteres" minlength="8" />
              </div>

              <button type="submit" class="btn btn-primary" :disabled="saveLoading">
                {{ saveLoading ? 'Salvando...' : 'Salvar Alterações' }}
              </button>
            </form>
          </div>

          <!-- Card de Instruções de Integração -->
          <div class="glass-card settings-card">
            <h3>🔌 Como Conectar em Seus Sistemas</h3>
            <p class="section-desc">Copie os modelos abaixo para configurar o envio de e-mails no seu site ou aplicativo:</p>

            <div class="guide-item">
              <h4>Exemplo: Node.js / JavaScript</h4>
              <pre class="code-box">const transporter = nodemailer.createTransport({
  host: 'mail.asgardcp.com.br',
  port: 25,
  secure: false
});</pre>
            </div>

            <div class="guide-item">
              <h4>Exemplo: PHP / Laravel (.env)</h4>
              <pre class="code-box">MAIL_MAILER=smtp
MAIL_HOST=mail.asgardcp.com.br
MAIL_PORT=25
MAIL_ENCRYPTION=null</pre>
            </div>

            <div class="guide-item">
              <h4>Exemplo: Python / Django</h4>
              <pre class="code-box">EMAIL_HOST = 'mail.asgardcp.com.br'
EMAIL_PORT = 25
EMAIL_USE_TLS = False</pre>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 24px;
}

.settings-card {
  padding: 28px;
}

.section-desc {
  font-size: 0.88rem;
  color: var(--text-muted);
  margin-bottom: 20px;
}

.divider {
  border: 0;
  border-top: 1px solid var(--border-color);
  margin: 24px 0;
}

.alert {
  padding: 12px 16px;
  border-radius: var(--radius-md);
  margin-bottom: 20px;
  font-size: 0.88rem;
}
.alert-success {
  background: var(--status-success-bg);
  color: var(--status-success);
  border: 1px solid rgba(16, 185, 129, 0.3);
}
.alert-danger {
  background: var(--status-danger-bg);
  color: var(--status-danger);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.guide-item {
  margin-bottom: 20px;
}

.guide-item h4 {
  font-size: 0.9rem;
  color: var(--text-main);
  margin-bottom: 8px;
}

.code-box {
  background: #0f172a;
  border: 1px solid var(--border-color);
  padding: 12px 16px;
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: #38bdf8;
  overflow-x: auto;
}
</style>
