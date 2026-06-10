// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import DashboardView from '@/pages/DashboardView.vue';
import { useAuthStore } from '@/features/auth/auth.store';
import AuthCallbackView from '@/pages/AuthCallbackView.vue';
import ErrorView from '@/pages/ErrorView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
      meta: { requireAuth: true },
    },
    {
      path: '/callback',
      name: 'callback',
      component: AuthCallbackView,
    },
    {
      path: '/error',
      name: 'error',
      component: ErrorView,
    },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  if (!auth.isAuthReady) await auth.initAuth();

  if (to.meta.requireAuth && !auth.isLoggedIn) {
    auth.login();
    return false;
  }
});

export default router;
