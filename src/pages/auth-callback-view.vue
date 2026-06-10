<script setup lang="ts">
  import { onMounted } from 'vue';
  import { useRouter } from 'vue-router';

  import { useAuthStore } from '@/features/auth/auth.store';

  const router = useRouter();
  const auth = useAuthStore();

  onMounted(async () => {
    try {
      await auth.handleCallback();
      router.replace('/');
    } catch {
      router.replace('/error');
    }
  });
</script>

<template>
  <div></div>
</template>
