<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui/runtime/components/DropdownMenu.d.vue.js';
  import { storeToRefs } from 'pinia';
  import { computed, onMounted } from 'vue';

  import { useAuthStore } from '@/features/auth/auth.store';
  import { useProfileStore } from '@/features/profile/profile.store';

  const { logout, user } = useAuthStore();
  const profileStore = useProfileStore();
  const { profile } = storeToRefs(profileStore);
  const { fetchProfile } = profileStore;

  const username = computed(() => {
    if (profile.value) return profile.value.nickname;
    if (!user) return '로딩 중...';
    return `${user?.first_name} ${user?.last_name}`;
  });

  const avatarSrc = computed(() => {
    if (profile.value) return `https://github.com/${profile.value.github_username}.png?v=4`;
    if (!user) return '';
    return user?.last_name;
  });

  async function handleLogout() {
    try {
      await logout();
    } catch (e) {
      console.error(e);
    }
  }

  const profileDropdownItems: DropdownMenuItem[] = [
    {
      label: '프로필 수정',
      icon: 'i-lucide-user',
      to: '/profile',
    },
    {
      label: '로그아웃',
      icon: 'i-lucide-log-out',
      onSelect: handleLogout,
    },
  ];

  onMounted(async () => {
    await fetchProfile();
  });
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
          <span class="text-header-brand-text text-xl font-bold">Croffle Portal</span>
        </div>
      </div>
    </template>

    <template #right>
      <div class="flex items-center gap-2 lg:mr-8">
        <ULink
          to="/"
          class="text-muted-foreground hover:text-foreground hover:bg-accent flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors"
        >
          <UIcon name="i-mdi:home" class="h-4 w-4" />
          {{ '메인 페이지로' }}
        </ULink>
        <ULink
          to="/blog"
          class="text-muted-foreground hover:text-foreground hover:bg-accent flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors"
        >
          <UIcon name="i-lucide-pencil-line" class="h-4 w-4" />
          블로그
        </ULink>
        <USeparator orientation="vertical" class="border-s-primary/20 h-6 border-s" />
        <UDropdownMenu :items="profileDropdownItems">
          <UButton
            variant="ghost"
            class="hover:bg-accent mr-4 flex items-center gap-3 rounded-lg px-3 py-1.5 transition-colors"
          >
            <span class="hidden text-sm font-medium sm:inline-block">
              {{ username }}
            </span>
            <UAvatar class="border-border h-8 w-8 border" :src="avatarSrc" :alt="username" />
          </UButton>
        </UDropdownMenu>
        <UColorModeButton />
      </div>
    </template>
  </UHeader>
</template>
