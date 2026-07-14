// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router';

import { useAuthStore } from '@/features/auth/auth.store';
import { useBlogStore } from '@/features/blog/stores/blog.store';

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
      path: '/blog',
      name: 'blog-home',
      component: () => import('@/pages/blog-home-view.vue'),
      meta: { requiresAuth: true, layout: 'default' },
    },
    {
      path: '/blog/:blogSlug',
      name: 'blog-posts',
      component: () => import('@/pages/blog-post-list-view.vue'),
      meta: { requiresAuth: true, layout: 'default', requiresBlogMembership: true },
    },
    {
      path: '/blog/:blogSlug/posts/new',
      name: 'blog-post-new',
      component: () => import('@/pages/blog-post-editor-view.vue'),
      meta: { requiresAuth: true, layout: 'default', requiresBlogMembership: true },
    },
    {
      path: '/blog/:blogSlug/posts/:postSlug/edit',
      name: 'blog-post-edit',
      component: () => import('@/pages/blog-post-editor-view.vue'),
      meta: { requiresAuth: true, layout: 'default', requiresBlogMembership: true },
    },
    {
      path: '/blog/:blogSlug/categories',
      name: 'blog-categories',
      component: () => import('@/pages/blog-category-view.vue'),
      meta: { requiresAuth: true, layout: 'default', requiresBlogMembership: true },
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

  if (to.name === 'callback') return true;

  if (!isAuthReady) {
    await initAuth();
  }

  if (to.meta.requiresAuth && !isLoggedIn) {
    login();
    return false;
  }

  if (to.meta.requiresBlogMembership && to.params.blogSlug) {
    const blogStore = useBlogStore();
    await blogStore.fetchMyBlogs();
    if (!blogStore.getBlogBySlug(to.params.blogSlug as string)) {
      return { name: 'error', params: { statusCode: '403' } };
    }
  }
});

export default router;
