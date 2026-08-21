import { ref, onUnmounted } from 'vue';
import { useAuth } from './useAuth';
import { useRuntimeConfig } from '#app';

export interface ToastMessage {
  id: string;
  title: string;
  body: string;
  type: 'info' | 'success' | 'warning' | 'danger';
}

const toasts = ref<ToastMessage[]>([]);
const isConnected = ref(false);

export function useEvents() {
  const auth = useAuth();
  const config = useRuntimeConfig();
  let eventSource: EventSource | null = null;
  let reconnectTimer: any = null;

  function showToast(title: string, body: string, type: ToastMessage['type'] = 'info') {
    const id = `${Date.now()}-${Math.random()}`;
    toasts.value.push({ id, title, body, type });
    setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== id);
    }, 5000);
  }

  function connectSse(onEvent?: (payload: any) => void) {
    if (typeof window === 'undefined') return;
    auth.initAuth();
    if (!auth.token.value) return;

    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }

    let apiBase = config.public.apiBase || '';
    if (typeof window !== 'undefined') {
      if (window.location.port === '' || window.location.port === '80' || window.location.port === '443') {
        apiBase = '';
      } else if (apiBase.includes('localhost') && window.location.hostname !== 'localhost') {
        apiBase = `${window.location.protocol}//${window.location.hostname}:4000`;
      }
    }
    const sseUrl = `${apiBase}/api/events?token=${encodeURIComponent(auth.token.value)}`;

    try {
      eventSource = new EventSource(sseUrl);

      eventSource.addEventListener('connected', () => {
        isConnected.value = true;
      });

      const handleMessageReceived = (dataStr: string) => {
        try {
          const payload = JSON.parse(dataStr);
          const msg = payload.data || payload;
          if (msg.sender) {
            showToast('Novo e-mail recebido!', `De: ${msg.sender} | Assunto: ${msg.subject || '(sem assunto)'}`, 'success');
          }
          if (onEvent) onEvent(payload);
        } catch (err) {
          console.error('Erro ao processar SSE:', err);
        }
      };

      eventSource.addEventListener('message.received', (e: MessageEvent) => {
        handleMessageReceived(e.data);
      });

      eventSource.onmessage = (e: MessageEvent) => {
        handleMessageReceived(e.data);
      };

      eventSource.addEventListener('message.deleted', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          if (onEvent) onEvent(payload);
        } catch {}
      });

      eventSource.addEventListener('message.read', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          if (onEvent) onEvent(payload);
        } catch {}
      });

      eventSource.onerror = () => {
        isConnected.value = false;
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        // Auto-reconexão após 4s
        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(() => {
          connectSse(onEvent);
        }, 4000);
      };
    } catch (err) {
      console.warn('Falha ao instanciar EventSource:', err);
    }
  }

  function disconnect() {
    clearTimeout(reconnectTimer);
    if (eventSource) {
      eventSource.close();
      eventSource = null;
      isConnected.value = false;
    }
  }

  onUnmounted(() => {
    disconnect();
  });

  return {
    connectSse,
    disconnect,
    showToast,
    toasts,
    isConnected,
  };
}
