<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '~/composables/useAuth';
import { useApi } from '~/composables/useApi';
import { useEvents } from '~/composables/useEvents';
import Sidebar from '~/components/Sidebar.vue';
import Navbar from '~/components/Navbar.vue';

const router = useRouter();
const auth = useAuth();
const api = useApi();
const { connectSse, disconnect } = useEvents();

const stats = ref({
  domainsCount: 0,
  mailboxesCount: 0,
  totalMessages: 0,
  unreadMessages: 0,
});

const recentMessages = ref<any[]>([]);
const loading = ref(true);
const serverHost = ref('179.199.136.14');
let pollInterval: any = null;

async function loadDashboardData(isSilent = false) {
  if (!isSilent) loading.value = true;
  try {
    const [statsRes, messagesRes] = await Promise.all([
      api.get('/api/messages/stats'),
      api.get('/api/messages/recent?limit=8'),
    ]);

    if (statsRes.data) stats.value = statsRes.data;
    if (messagesRes.data) recentMessages.value = messagesRes.data;
  } catch (err: any) {
    console.error('Erro ao carregar dados do dashboard:', err);
  } finally {
    if (!isSilent) loading.value = false;
  }
}

onMounted(() => {
  if (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost') {
    serverHost.value = window.location.hostname;
  }
  auth.initAuth();
  if (!auth.isAuthenticated.value) {
    router.push('/login');
    return;
  }

  loadDashboardData();
  connectSse(() => {
    loadDashboardData(true);
  });

  pollInterval = setInterval(() => {
    loadDashboardData(true);
  }, 4000);
});

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval);
  disconnect();
});
</script>

<template>
  <div class="app-layout">
    <Sidebar />
    <div class="app-content">
      <Navbar title="Dashboard Geral" subtitle="Visão em tempo real do Sandbox SMTP e caixas virtuais" />

      <main class="app-main">
        <!-- Métricas Rápidas -->
        <div class="stats-grid">
          <div class="stat-card glass-card">
            <div class="stat-icon icon-indigo">🌐</div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.domainsCount }}</div>
              <div class="stat-label">Domínios Configurados</div>
            </div>
          </div>

          <div class="stat-card glass-card">
            <div class="stat-icon icon-purple">📬</div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.mailboxesCount }}</div>
              <div class="stat-label">Caixas Postais Ativas</div>
            </div>
          </div>

          <div class="stat-card glass-card">
            <div class="stat-icon icon-blue">✉️</div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalMessages }}</div>
              <div class="stat-label">Total de Mensagens</div>
            </div>
          </div>

          <div class="stat-card glass-card">
            <div class="stat-icon icon-pink">🔔</div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.unreadMessages }}</div>
              <div class="stat-label">Mensagens Não Lidas</div>
            </div>
          </div>
        </div>

        <!-- Guia Rápido de Configuração SMTP -->
        <div class="quickstart-banner glass-card">
          <div class="quickstart-header">
            <h3>⚡ Dados para Configurar em Seus Sistemas</h3>
            <span class="badge badge-success">Servidor Ativo</span>
          </div>
          <p class="quickstart-desc">
            Para testar envios a partir de sites, lojas virtuais ou sistemas, utilize estas configurações:
          </p>
          <div class="config-chips">
            <div class="config-chip"><b>Servidor de Envio:</b> {{ serverHost }}</div>
            <div class="config-chip"><b>Portas Aceitas:</b> 25 ou 587</div>
            <div class="config-chip"><b>Autenticação:</b> Livre para testes</div>
            <div class="config-chip"><b>Segurança:</b> STARTTLS Opcional</div>
          </div>
        </div>

        <!-- E-mails Recebidos Recentemente -->
        <div class="recent-section glass-card">
          <div class="section-header">
            <h3>📥 E-mails Recebidos Recentemente</h3>
            <NuxtLink to="/mailboxes" class="btn btn-secondary btn-sm">Ver Todas as Caixas</NuxtLink>
          </div>

          <div v-if="loading" class="loading-state">
            Carregando mensagens...
          </div>

          <div v-else-if="recentMessages.length === 0" class="empty-state">
            <div class="empty-emoji">📬</div>
            <p>Nenhum e-mail recebido ainda.</p>
            <small>Crie uma caixa de entrada e envie uma mensagem para vê-la chegar aqui na mesma hora.</small>
          </div>

          <div v-else class="messages-table-wrapper">
            <table class="messages-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Remetente</th>
                  <th>Caixa de Destino</th>
                  <th>Assunto</th>
                  <th>Tamanho</th>
                  <th>Horário</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="msg in recentMessages" :key="msg.id" :class="{ unread: !msg.is_read }">
                  <td>
                    <span :class="['status-dot', msg.is_read ? 'read-dot' : 'unread-dot']"></span>
                  </td>
                  <td class="cell-sender">{{ msg.sender }}</td>
                  <td class="cell-recipient">
                    <span class="badge badge-info">{{ msg.mailbox_email || msg.recipient }}</span>
                  </td>
                  <td class="cell-subject">{{ msg.subject || '(Sem assunto)' }}</td>
                  <td class="cell-size">{{ Math.round(msg.size / 1024) }} KB</td>
                  <td class="cell-date">{{ new Date(msg.created_at).toLocaleTimeString('pt-BR') }}</td>
                  <td>
                    <NuxtLink :to="`/mailboxes/${msg.mailbox_id}?msg=${msg.id}`" class="btn btn-primary btn-sm">
                      Abrir E-mail
                    </NuxtLink>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 18px;
}

.stat-icon {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
}

.icon-indigo { background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.3); }
.icon-purple { background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3); }
.icon-blue   { background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.3); }
.icon-pink   { background: rgba(236, 72, 153, 0.15); border: 1px solid rgba(236, 72, 153, 0.3); }

.stat-value {
  font-size: 1.8rem;
  font-weight: 800;
  color: #ffffff;
  line-height: 1.1;
}

.stat-label {
  font-size: 0.82rem;
  color: var(--text-dim);
  margin-top: 4px;
}

.quickstart-banner {
  padding: 24px;
  margin-bottom: 24px;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%);
}

.quickstart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.quickstart-desc {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-bottom: 16px;
}

.config-chips {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.config-chip {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-color);
  padding: 6px 14px;
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  font-family: var(--font-mono);
  color: #38bdf8;
}

.config-chip b {
  color: var(--text-muted);
  font-family: var(--font-sans);
}

.recent-section {
  padding: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.messages-table-wrapper {
  overflow-x: auto;
}

.messages-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.9rem;
}

.messages-table th {
  padding: 12px 16px;
  color: var(--text-dim);
  font-weight: 600;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--border-color);
}

.messages-table td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-muted);
}

.messages-table tr:hover td {
  background: rgba(255, 255, 255, 0.02);
}

.messages-table tr.unread td {
  color: var(--text-main);
  font-weight: 600;
}

.cell-sender {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cell-subject {
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #ffffff;
}

.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.unread-dot {
  background: var(--accent-primary);
  box-shadow: 0 0 8px var(--accent-primary);
}

.read-dot {
  background: var(--text-dim);
  opacity: 0.4;
}

.empty-state {
  text-align: center;
  padding: 48px;
  color: var(--text-dim);
}

.empty-emoji {
  font-size: 3rem;
  margin-bottom: 12px;
}
</style>
