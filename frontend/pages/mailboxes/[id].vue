<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuth } from '~/composables/useAuth';
import { useApi } from '~/composables/useApi';
import { useEvents } from '~/composables/useEvents';
import Sidebar from '~/components/Sidebar.vue';
import Navbar from '~/components/Navbar.vue';
import EmailViewer from '~/components/EmailViewer.vue';

const route = useRoute();
const router = useRouter();
const auth = useAuth();
const api = useApi();
const { connectSse, disconnect } = useEvents();

const mailboxId = computed(() => parseInt(route.params.id as string, 10));
const mailbox = ref<any>(null);
const messages = ref<any[]>([]);
const selectedMessage = ref<any>(null);
const loading = ref(true);
const searchQuery = ref('');
let pollInterval: any = null;

async function loadMailboxData(isSilent = false) {
  if (!isSilent) loading.value = true;
  try {
    const [mbRes, msgRes] = await Promise.all([
      api.get(`/api/mailboxes/${mailboxId.value}`),
      api.get(`/api/messages/mailbox/${mailboxId.value}?limit=100`),
    ]);

    if (mbRes.data) mailbox.value = mbRes.data;
    if (msgRes.messages) {
      const prevLength = messages.value.length;
      messages.value = msgRes.messages;

      // Se houver query param ?msg=id, seleciona ela diretamente
      const queryMsgId = route.query.msg ? parseInt(route.query.msg as string, 10) : null;
      if (queryMsgId && !selectedMessage.value) {
        await selectMessage(queryMsgId);
      } else if (messages.value.length > 0 && !selectedMessage.value) {
        await selectMessage(messages.value[0].id);
      } else if (messages.value.length > prevLength && prevLength === 0) {
        // Se a lista estava vazia e chegou novo e-mail, seleciona o primeiro
        await selectMessage(messages.value[0].id);
      }
    }
  } catch (err: any) {
    console.error('Erro ao carregar dados da caixa postal:', err);
  } finally {
    if (!isSilent) loading.value = false;
  }
}

async function selectMessage(id: number) {
  try {
    const res = await api.get(`/api/messages/${id}`);
    if (res.data) {
      selectedMessage.value = res.data;
      // Atualiza estado local de lido
      const found = messages.value.find((m) => m.id === id);
      if (found && !found.is_read) {
        found.is_read = 1;
        await api.patch(`/api/messages/${id}/read`);
      }
    }
  } catch (err: any) {
    console.error('Erro ao carregar mensagem:', err);
  }
}

function handleMessageDeleted(id: number) {
  messages.value = messages.value.filter((m) => m.id !== id);
  if (selectedMessage.value?.id === id) {
    selectedMessage.value = messages.value.length > 0 ? messages.value[0] : null;
    if (selectedMessage.value) {
      selectMessage(selectedMessage.value.id);
    }
  }
}

function handleToggleRead(data: { id: number; is_read: boolean }) {
  const found = messages.value.find((m) => m.id === data.id);
  if (found) {
    found.is_read = data.is_read ? 1 : 0;
  }
  if (selectedMessage.value?.id === data.id) {
    selectedMessage.value.is_read = data.is_read;
  }
}

const filteredMessages = computed(() => {
  if (!searchQuery.value.trim()) return messages.value;
  const q = searchQuery.value.toLowerCase();
  return messages.value.filter(
    (m) =>
      (m.subject && m.subject.toLowerCase().includes(q)) ||
      (m.sender && m.sender.toLowerCase().includes(q))
  );
});

onMounted(() => {
  auth.initAuth();
  if (!auth.isAuthenticated.value) {
    router.push('/login');
    return;
  }

  loadMailboxData();

  // 1. Conecta via Server-Sent Events para atualização instantânea
  connectSse((payload) => {
    loadMailboxData(true);
  });

  // 2. Polling ativo a cada 3 segundos como sincronização contínua
  pollInterval = setInterval(() => {
    loadMailboxData(true);
  }, 3000);
});

onUnmounted(() => {
  disconnect();
  if (pollInterval) {
    clearInterval(pollInterval);
  }
});
</script>

<template>
  <div class="app-layout">
    <Sidebar />
    <div class="app-content">
      <Navbar
        :title="mailbox?.email || 'Inbox'"
        :subtitle="`Caixa Postal Sandbox com sincronização em tempo real ativa`"
      >
        <template #actions>
          <button class="btn btn-secondary btn-sm" style="margin-right: 8px;" @click="loadMailboxData(false)">
            🔄 Atualizar
          </button>
          <NuxtLink to="/mailboxes" class="btn btn-secondary btn-sm">
            ← Voltar para Caixas
          </NuxtLink>
        </template>
      </Navbar>

      <main class="inbox-layout">
        <!-- Coluna da Esquerda: Lista de Mensagens -->
        <div class="inbox-list-pane glass-card">
          <div class="list-header">
            <input
              v-model="searchQuery"
              type="text"
              class="input-control search-input"
              placeholder="🔍 Buscar remetente ou assunto..."
            />
          </div>

          <div v-if="loading" class="list-loading">
            Carregando mensagens...
          </div>

          <div v-else-if="filteredMessages.length === 0" class="list-empty">
            <div class="empty-icon">📭</div>
            <p>Nenhuma mensagem nesta caixa.</p>
            <small>Envie um e-mail para <code>{{ mailbox?.email }}</code></small>
          </div>

          <div v-else class="messages-list">
            <div
              v-for="msg in filteredMessages"
              :key="msg.id"
              :class="['message-item', { active: selectedMessage?.id === msg.id, unread: !msg.is_read }]"
              @click="selectMessage(msg.id)"
            >
              <div class="item-top">
                <span class="sender-name">{{ msg.sender }}</span>
                <span class="msg-date">{{ new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }}</span>
              </div>
              <div class="item-subject">{{ msg.subject || '(Sem assunto)' }}</div>
              <div class="item-footer">
                <span v-if="msg.attachments_count > 0" class="badge badge-info att-badge">
                  📎 {{ msg.attachments_count }}
                </span>
                <span :class="['status-dot', msg.is_read ? 'read-dot' : 'unread-dot']"></span>
              </div>
            </div>
          </div>
        </div>

        <!-- Coluna da Direita: Visualizador de Mensagem -->
        <div class="inbox-viewer-pane">
          <EmailViewer
            :message="selectedMessage"
            @deleted="handleMessageDeleted"
            @toggled-read="handleToggleRead"
          />
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.inbox-layout {
  display: flex;
  height: calc(100vh - 70px);
  gap: 20px;
  padding: 20px 32px 32px;
  overflow: hidden;
}

.inbox-list-pane {
  width: 380px;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
}

.list-header {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
}

.search-input {
  font-size: 0.85rem;
  padding: 8px 12px;
}

.messages-list {
  flex: 1;
  overflow-y: auto;
}

.message-item {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
}

.message-item:hover {
  background: rgba(255, 255, 255, 0.03);
}

.message-item.active {
  background: rgba(99, 102, 241, 0.15);
  border-left: 3px solid var(--accent-primary);
}

.item-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.sender-name {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 230px;
}

.msg-date {
  font-size: 0.75rem;
  color: var(--text-dim);
}

.item-subject {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 6px;
}

.message-item.unread .item-subject {
  font-weight: 700;
  color: #ffffff;
}

.message-item.unread .sender-name {
  color: #818cf8;
  font-weight: 600;
}

.item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.att-badge {
  font-size: 0.7rem;
  padding: 2px 6px;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.unread-dot {
  background: var(--accent-primary);
  box-shadow: 0 0 6px var(--accent-primary);
}

.read-dot {
  background: transparent;
}

.inbox-viewer-pane {
  flex: 1;
  min-width: 0;
  height: 100%;
}

.list-empty, .list-loading {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-dim);
}
</style>
