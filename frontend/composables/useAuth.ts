import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

export interface UserProfile {
  id: number;
  email: string;
  name: string;
  status: string;
  created_at: string;
}

const tokenState = ref<string | null>(null);
const refreshTokenState = ref<string | null>(null);
const userState = ref<UserProfile | null>(null);
const isInitialized = ref(false);

export function useAuth() {
  const router = useRouter();

  function initAuth() {
    if (isInitialized.value) return;
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('smtp_access_token');
      const storedRefresh = localStorage.getItem('smtp_refresh_token');
      const storedUser = localStorage.getItem('smtp_user');

      if (storedToken) tokenState.value = storedToken;
      if (storedRefresh) refreshTokenState.value = storedRefresh;
      if (storedUser) {
        try {
          userState.value = JSON.parse(storedUser);
        } catch {
          userState.value = null;
        }
      }
    }
    isInitialized.value = true;
  }

  function setAuthData(token: string, refreshToken: string, user: UserProfile) {
    tokenState.value = token;
    refreshTokenState.value = refreshToken;
    userState.value = user;

    if (typeof window !== 'undefined') {
      localStorage.setItem('smtp_access_token', token);
      localStorage.setItem('smtp_refresh_token', refreshToken);
      localStorage.setItem('smtp_user', JSON.stringify(user));
    }
  }

  function logout() {
    tokenState.value = null;
    refreshTokenState.value = null;
    userState.value = null;

    if (typeof window !== 'undefined') {
      localStorage.removeItem('smtp_access_token');
      localStorage.removeItem('smtp_refresh_token');
      localStorage.removeItem('smtp_user');
    }

    router.push('/login');
  }

  return {
    initAuth,
    setAuthData,
    logout,
    token: computed(() => tokenState.value),
    refreshToken: computed(() => refreshTokenState.value),
    user: computed(() => userState.value),
    isAuthenticated: computed(() => !!tokenState.value),
  };
}
