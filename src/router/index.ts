// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router';

import { useAuthStore } from '@/features/auth/auth.store';
import { useProfileStore } from '@/features/profile/profile.store';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/pages/dashboard-view.vue'),
      meta: { requiresAuth: true, layout: 'default' },
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/pages/profile-view.vue'),
      meta: { requiresAuth: true, layout: 'default' },
    },
    {
      path: '/contacts',
      name: 'contact-submissions',
      component: () => import('@/pages/contact-view.vue'),
      meta: { requiresAuth: true, layout: 'default' },
    },
    {
      path: '/callback',
      name: 'callback',
      component: () => import('@/pages/auth-callback-view.vue'),
      meta: { layout: 'none' },
    },
    {
      path: '/error/:statusCode',
      name: 'error',
      component: () => import('@/pages/error-view.vue'),
      meta: { layout: 'none' },
    },
  ],
});

router.beforeEach(async (to) => {
  const { isAuthReady, isLoggedIn, initAuth, login } = useAuthStore();
  const { hasProfile, fetchProfile } = useProfileStore();

  if (to.name === 'callback') return true;

  if (!isAuthReady) {
    await initAuth();
  }

  if (!hasProfile) {
    await fetchProfile();
  }
  if (to.meta.requiresAuth && !isLoggedIn) {
    login();
    return false;
  }
});

export default router;
