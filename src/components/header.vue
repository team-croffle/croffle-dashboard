<script setup lang="ts">
  import { computed } from 'vue';

  import { useAuthStore } from '@/features/auth/auth.store';

  const { logout, user } = useAuthStore();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error(e);
    }
  };

  const hasProfile = computed<boolean>(() => !!user);
</script>

<template>
  <UHeader
    class="backdrop-blur-xl backdrop-brightness-104 backdrop-saturate-190"
    :ui="{
      container: 'mx-0 max-w-full',
    }"
  >
    <template #title>
      <div
        class="bg-header-glow pointer-events-none absolute top-0 right-0 left-0 h-px rounded-t-[inherit]"
        aria-hidden="true"
      />

      <div class="flex items-center justify-between px-6">
        <div class="flex items-center gap-2">
          <div
            class="bg-header-brand-bg flex h-8 w-8 items-center justify-center rounded-lg"
            aria-hidden="true"
          >
            <img src="../assets/logo-only-x32.svg" alt="" role="presentation" />
          </div>
          <span class="text-header-brand-text text-xl font-bold">Croffle Dev.</span>
        </div>
      </div>
    </template>

    <template #right>
      <div class="flex items-center gap-2 lg:mr-8">
        <Link
          to="/"
          class="text-muted-foreground hover:text-foreground hover:bg-accent flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors"
        >
          <Home class="h-4 w-4" />
          메인 페이지로
        </Link>
        <div class="bg-border mx-2 h-5 w-px" />
        <button
          class="hover:bg-accent flex items-center gap-3 rounded-lg px-3 py-1.5 transition-colors"
        >
          <span class="hidden text-sm font-medium sm:inline-block">
            {{ hasProfile ? user!.profile.name : 'Member' }}
          </span>
          <UAvatar
            class="border-border h-8 w-8 border"
            :src="user!.profile.picture"
            :alt="user!.profile.name"
          />
        </button>
        <button
          class="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md p-2 transition-colors"
          title="로그아웃"
          @click="handleLogout"
        >
          <UIcon name="i-lucide-log-out" class="h-4 w-4" />
        </button>
        <UColorModeButton />
      </div>
    </template>
  </UHeader>
</template>
