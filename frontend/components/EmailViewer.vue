<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useApi } from '~/composables/useApi';

const props = defineProps<{
  message: any;
}>();

const emit = defineEmits(['deleted', 'toggled-read']);

const api = useApi();
const activeTab = ref<'html' | 'text' | 'headers' | 'raw'>('html');
const rawContent = ref<string>('');

watch(
  () => props.message?.id,
  async (newId) => {
    if (newId) {
      if (props.message.html_body) {
        activeTab.value = 'html';
      } else {
        activeTab.value = 'text';
      }
      try {
        const rawRes = await fetch(`${api.apiBase}/api/messages/${newId}/raw`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('smtp_access_token')}` },
        });
        rawContent.value = await rawRes.text();
      } catch {
        rawContent.value = props.message.raw_message || '';
      }
    }
  },
  { immediate: true }
);

const formattedDate = computed(() => {
  if (!props.message?.created_at) return '';
  return new Date(props.message.created_at).toLocaleString('pt-BR');
});

const iframeSrcdoc = computed(() => {
  if (!props.message?.html_body) return '';
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 16px; color: #1e293b; line-height: 1.6; }
          a { color: #4f46e5; }
          img { max-width: 100%; height: auto; }
        </style>
      </head>
      <body>
        ${props.message.html_body}
      </body>
    </html>
  `;
});

async function toggleReadStatus() {
  if (!props.message) return;
  try {
    if (props.message.is_read) {
      await api.patch(`/api/messages/${props.message.id}/unread`);
      emit('toggled-read', { id: props.message.id, is_read: false });
    } else {
      await api.patch(`/api/messages/${props.message.id}/read`);
      emit('toggled-read', { id: props.message.id, is_read: true });
    }
  } catch (err: any) {
    alert(err.message);
  }
}

async function deleteMessage() {
  if (!props.message || !confirm('Deseja realmente excluir este e-mail?')) return;
  try {
    await api.delete(`/api/messages/${props.message.id}`);
    emit('deleted', props.message.id);
  } catch (err: any) {
    alert(err.message);
  }
}

function downloadAttachment(attId: number, filename: string) {
  window.open(`${api.apiBase}/api/attachments/${attId}?token=${localStorage.getItem('smtp_access_token')}`, '_blank');
}
</script>

<template>
  <div v-if="message" class="email-viewer glass-card">
    <!-- Header da Mensagem -->
    <div class="message-meta">
      <div class="meta-main">
        <h2 class="subject">{{ message.subject || '(Sem assunto)' }}</h2>
        <div class="date-badge">{{ formattedDate }}</div>
      </div>

      <div class="meta-row">
        <span class="meta-label">Remetente:</span>
        <span class="meta-value text-highlight">{{ message.sender }}</span>
      </div>

      <div class="meta-row">
        <span class="meta-label">Destinatário:</span>
        <span class="meta-value">{{ message.recipient }}</span>
      </div>

      <div class="message-actions">
        <button class="btn btn-secondary btn-sm" @click="toggleReadStatus">
          {{ message.is_read ? '✉️ Marcar como não lida' : '👁️ Marcar como lida' }}
        </button>
        <button class="btn btn-danger btn-sm" @click="deleteMessage">
          🗑️ Excluir E-mail
        </button>
      </div>
    </div>

    <!-- Anexos (se houver) -->
    <div v-if="message.attachments && message.attachments.length > 0" class="attachments-bar">
      <div class="attachments-title">📎 Arquivos Anexados ({{ message.attachments.length }}):</div>
      <div class="attachments-list">
        <div
          v-for="att in message.attachments"
          :key="att.id"
          class="attachment-chip"
          @click="downloadAttachment(att.id, att.filename)"
        >
          <span class="att-icon">📄</span>
          <span class="att-name">{{ att.filename }}</span>
          <span class="att-size">({{ Math.round(att.size / 1024) }} KB)</span>
          <span class="att-action">⬇️ Baixar</span>
        </div>
      </div>
    </div>

    <!-- Tabs do Visualizador -->
    <div class="viewer-tabs">
      <button
        v-if="message.html_body"
        :class="['tab-btn', { active: activeTab === 'html' }]"
        @click="activeTab = 'html'"
      >
        Visualização Formatada
      </button>
      <button
        :class="['tab-btn', { active: activeTab === 'text' }]"
        @click="activeTab = 'text'"
      >
        Texto Simples
      </button>
      <button
        :class="['tab-btn', { active: activeTab === 'headers' }]"
        @click="activeTab = 'headers'"
      >
        Detalhes de Envio
      </button>
      <button
        :class="['tab-btn', { active: activeTab === 'raw' }]"
        @click="activeTab = 'raw'"
      >
        Código Original
      </button>
    </div>

    <!-- Conteúdo da Tab -->
    <div class="tab-content">
      <!-- 1. HTML com Sandbox Seguro -->
      <div v-if="activeTab === 'html'" class="html-container">
        <iframe
          :srcdoc="iframeSrcdoc"
          sandbox="allow-popups allow-popups-to-escape-sandbox"
          class="email-iframe"
          title="Conteúdo do E-mail"
        ></iframe>
      </div>

      <!-- 2. Texto Puro -->
      <div v-else-if="activeTab === 'text'" class="text-container">
        <pre class="text-body">{{ message.text_body || '(Nenhum corpo de texto fornecido)' }}</pre>
      </div>

      <!-- 3. Headers JSON -->
      <div v-else-if="activeTab === 'headers'" class="headers-container">
        <pre class="code-block">{{ JSON.stringify(message.headers, null, 2) }}</pre>
      </div>

      <!-- 4. Raw MIME -->
      <div v-else-if="activeTab === 'raw'" class="raw-container">
        <pre class="code-block">{{ rawContent }}</pre>
      </div>
    </div>
  </div>

  <div v-else class="empty-viewer glass-card">
    <div class="empty-icon">📫</div>
    <h3>Nenhum e-mail selecionado</h3>
    <p>Clique em uma mensagem da lista ao lado para ler o conteúdo, ver anexos e detalhes de entrega.</p>
  </div>
</template>

<style scoped>
.email-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.message-meta {
  padding: 24px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.subject {
  font-size: 1.3rem;
  color: #ffffff;
}

.date-badge {
  font-size: 0.8rem;
  color: var(--text-dim);
  background: rgba(255, 255, 255, 0.05);
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  white-space: nowrap;
}

.meta-row {
  display: flex;
  gap: 8px;
  font-size: 0.9rem;
}

.meta-label {
  color: var(--text-dim);
  width: 90px;
  font-weight: 500;
}

.meta-value {
  color: var(--text-main);
  word-break: break-all;
}

.text-highlight {
  color: #818cf8;
  font-weight: 600;
}

.message-actions {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}

.attachments-bar {
  padding: 12px 24px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.attachments-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-muted);
}

.attachments-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.attachment-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.attachment-chip:hover {
  background: rgba(99, 102, 241, 0.2);
  border-color: var(--accent-primary);
}

.att-size {
  color: var(--text-dim);
}

.viewer-tabs {
  display: flex;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid var(--border-color);
  padding: 0 16px;
}

.tab-btn {
  padding: 12px 18px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-muted);
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: var(--text-main);
}

.tab-btn.active {
  color: #ffffff;
  border-bottom-color: var(--accent-primary);
}

.tab-content {
  flex: 1;
  overflow: auto;
  position: relative;
  background: #ffffff;
}

.html-container {
  width: 100%;
  height: 100%;
  min-height: 450px;
}

.email-iframe {
  width: 100%;
  height: 100%;
  min-height: 450px;
  border: none;
}

.text-container, .headers-container, .raw-container {
  padding: 20px;
  background: #0f172a;
  min-height: 100%;
  height: 100%;
  overflow: auto;
}

.text-body {
  color: #cbd5e1;
  font-family: var(--font-sans);
  font-size: 0.95rem;
  white-space: pre-wrap;
  word-break: break-word;
}

.code-block {
  color: #38bdf8;
  font-family: var(--font-mono);
  font-size: 0.85rem;
  white-space: pre-wrap;
  word-break: break-all;
}

.empty-viewer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 40px;
  color: var(--text-dim);
}

.empty-icon {
  font-size: 3.5rem;
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-viewer h3 {
  color: var(--text-muted);
  margin-bottom: 8px;
}
</style>
