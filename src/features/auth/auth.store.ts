import { directus } from '@/util/directus';
import { readMe } from '@directus/sdk';

import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL;
const DIRECTUS_OIDC_PROVIDER = import.meta.env.VITE_DIRECTUS_OIDC_PROVIDER;

export const useAuthStore = defineStore('auth', () => {
  const user = ref<Record<string, any> | null>(null);
  const isAuthReady = ref(false);

  // token exists and is not expired
  const isLoggedIn = computed(() => !!user.value);

  async function initAuth() {
    try {
      await directus.refresh();
      const me = await directus.request(readMe());
      user.value = me;
    } catch (err) {
      console.error('Auth init failed:', err);
    } finally {
      isAuthReady.value = true;
    }
  }

  function login() {
    const redirectUrl = `${window.location.origin}/callback`;
    window.location.href = `${DIRECTUS_URL}/auth/login/${DIRECTUS_OIDC_PROVIDER}?redirect=${encodeURIComponent(redirectUrl)}`;
  }

  async function handleCallback() {
    try {
      await directus.refresh();
      const me = await directus.request(readMe());
      user.value = me;
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err) {
      throw new Error('Auth failed');
    }
  }

  async function logout() {
    try {
      await directus.logout();
    } finally {
      user.value = null;
      window.location.href = 'https://croffledev.kr';
    }
  }

  return {
    user,
    isLoggedIn,
    isAuthReady,
    initAuth,
    login,
    logout,
    handleCallback,
  };
});
