<script setup lang="ts">
  import { storeToRefs } from 'pinia';
  import { onMounted } from 'vue';
  import { useRouter } from 'vue-router';

  import { useBlogStore } from '@/features/blog/stores/blog.store';

  const router = useRouter();
  const blogStore = useBlogStore();
  const { myBlogs, members, isLoading, err } = storeToRefs(blogStore);
  const { fetchMyBlogs } = blogStore;

  onMounted(async () => {
    await fetchMyBlogs();
    if (myBlogs.value.length === 1) {
      router.replace({
        name: 'blog-manage',
        params: { blogSlug: myBlogs.value[0].slug },
        query: { section: 'settings' },
      });
    }
  });

  function getRoleBadgeColor(role: string) {
    return role === 'owner' ? 'primary' : 'neutral';
  }

  function getRoleLabel(role: string) {
    return role === 'owner' ? '오너' : '에디터';
  }
</script>

<template>
  <UContainer class="mb-12 max-w-4xl space-y-6">
    <UPageHeader>
      <template #title>
        <h2>블로그 관리자</h2>
      </template>
      <template #description>소속된 블로그를 선택하세요.</template>
    </UPageHeader>

    <UPageBody>
      <div v-if="isLoading" class="flex justify-center py-16">
        <UIcon name="i-lucide-loader-circle" class="text-muted size-12 animate-spin" />
      </div>

      <UAlert
        v-else-if="err"
        color="error"
        variant="soft"
        :description="err"
        icon="i-lucide-triangle-alert"
      />

      <div v-else-if="myBlogs.length === 0" class="text-muted py-16 text-center text-base">
        {{ '소속된 블로그가 없습니다.' }}
      </div>

      <div v-else class="grid gap-4 sm:grid-cols-2">
        <UCard
          v-for="member in members"
          :key="member.id"
          class="bg-card flex flex-col"
          :ui="{
            footer: 'px-1 sm:px-1',
          }"
        >
          <template #header>
            <div class="flex items-center justify-between gap-2">
              <span class="truncate text-lg font-semibold">{{ member.blog.name }}</span>
              <UBadge :color="getRoleBadgeColor(member.role)" variant="soft" size="md">
                {{ getRoleLabel(member.role) }}
              </UBadge>
            </div>
          </template>

          <div class="min-h-10 text-base">
            <p class="text-muted-foreground">
              {{ member.blog.description || '설명 없음' }}
            </p>
          </div>

          <template #footer>
            <div class="divide-border flex justify-center divide-x">
              <div class="flex-1">
                <UButton
                  size="md"
                  variant="ghost"
                  color="neutral"
                  :to="{ name: 'blog-post-new', params: { blogSlug: member.blog.slug } }"
                  icon="i-lucide-square-pen"
                  class="w-full justify-center"
                >
                  {{ '글 쓰기' }}
                </UButton>
              </div>
              <div class="flex-1">
                <UButton
                  v-if="member.blog.url"
                  size="md"
                  variant="ghost"
                  color="neutral"
                  :to="member.blog.url"
                  target="_blank"
                  external
                  icon="i-lucide-external-link"
                  class="w-full justify-center"
                >
                  {{ '내 블로그' }}
                </UButton>
                <UButton
                  v-else
                  size="md"
                  variant="ghost"
                  color="neutral"
                  disabled
                  icon="i-lucide-link-off"
                  class="w-full justify-center"
                >
                  {{ '링크 없음' }}
                </UButton>
              </div>
              <div class="flex-1">
                <UButton
                  size="md"
                  variant="ghost"
                  color="neutral"
                  :to="{
                    name: 'blog-manage',
                    params: { blogSlug: member.blog.slug },
                    query: { section: 'settings' },
                  }"
                  icon="i-lucide-settings"
                  class="w-full justify-center"
                >
                  {{ '관리' }}
                </UButton>
              </div>
            </div>
          </template>
        </UCard>
      </div>
    </UPageBody>
  </UContainer>
</template>
