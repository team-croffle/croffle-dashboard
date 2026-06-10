import { User, UserManager, WebStorageStateStore } from 'oidc-client-ts';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

const OIDC_URL = import.meta.env.VITE_OIDC_URL;
const OIDC_APP_SLUG = import.meta.env.VITE_OIDC_APP_SLUG;
const OIDC_CLIENT_ID = import.meta.env.VITE_OIDC_CLIENT_ID;

const userManager = new UserManager({
  authority: `${OIDC_URL}/application/o/${OIDC_APP_SLUG}`,
  client_id: OIDC_CLIENT_ID,
  redirect_uri: `${window.location.origin}/callback`,
  response_type: 'code',
  scope: 'openid profile email',
  post_logout_redirect_uri: window.location.origin,
  userStore: new WebStorageStateStore({ store: window.localStorage }),
});

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const isAuthReady = ref(false);

  // token exists and is not expired
  const isLoggedIn = computed(() => !!user.value && !user.value.expired);
  const accessToken = computed(() => user.value?.access_token);

  const initAuth = async () => {
    try {
      const currentUser = await userManager.getUser();
      if (currentUser && !currentUser.expired) {
        user.value = currentUser;
      }
    } catch (err) {
      console.error('Auth init failed:', err);
    } finally {
      isAuthReady.value = true;
    }
  };

  // token auto refresh and logout detection subcriptions
  userManager.events.addUserLoaded((loadedUser) => {
    user.value = loadedUser; // state update when token automatically refreshed
  });
  userManager.events.addUserUnloaded(() => {
    user.value = null; // state update when token automatically expired or force logout
  });

  const login = () => userManager.signinRedirect();
  const logout = () => userManager.signoutRedirect();

  const handleCallback = async () => {
    const loadedUser = await userManager.signinCallback();
    if (!loadedUser) {
      throw new Error('Failed to complete sign in');
    }
    user.value = loadedUser;
    // cleanup url param, avoid duplicate signin on reload.
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  return {
    user,
    isLoggedIn,
    isAuthReady,
    accessToken,
    initAuth,
    login,
    logout,
    handleCallback,
  };
});
