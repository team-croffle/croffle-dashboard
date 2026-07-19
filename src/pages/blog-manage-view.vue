<script setup lang="ts">
  import { storeToRefs } from 'pinia';
  import { computed, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import BlogSettingsPanel from '@/features/blog/components/manage/blog-settings-panel.vue';
  import CategoriesPanel from '@/features/blog/components/manage/categories-panel.vue';
  import ContentSettingsPanel from '@/features/blog/components/manage/content-settings-panel.vue';
  import ManageSidebar from '@/features/blog/components/manage/manage-sidebar.vue';
  import NavigationPanel from '@/features/blog/components/manage/navigation-panel.vue';
  import PostsPanel from '@/features/blog/components/manage/posts-panel.vue';
  import StatsPanel from '@/features/blog/components/manage/stats-panel.vue';
  import { useBlogStore } from '@/features/blog/stores/blog.store';
  import { isManageSection, type ManageSection } from '@/features/blog/types/manage.types';

  const route = useRoute();
  const router = useRouter();
  const blogSlug = computed(() => route.params.blogSlug as string);

  const blogStore = useBlogStore();
  const { isLoading } = storeToRefs(blogStore);
  const { getBlogBySlug } = blogStore;

  const currentBlog = computed(() => getBlogBySlug(blogSlug.value));

  const section = computed<ManageSection>({
    get() {
      const querySection = route.query.section;
      return isManageSection(querySection) ? querySection : 'settings';
    },
    set(value) {
      router.replace({
        name: 'blog-manage',
        params: { blogSlug: blogSlug.value },
        query: { section: value },
      });
    },
  });

  watch(
    () => [blogSlug.value, currentBlog.value] as const,
    ([, blog]) => {
      if (!blog && !isLoading.value) {
        router.replace({ name: 'blog-home' });
      }
    },
    { immediate: true },
  );
</script>

<template>
  <UContainer class="mb-12 max-w-6xl space-y-6">
    <UPageHeader
      :ui="{
        title: 'flex flex-row gap-4 items-center w-full',
      }"
    >
      <template #title>
        <UButton
          variant="ghost"
          color="neutral"
          size="lg"
          icon="i-lucide-chevron-left"
          :to="{ name: 'blog-home' }"
        />
        <h2>{{ currentBlog?.name ?? '블로그 관리' }}</h2>
      </template>
      <template #description>
        <span class="px-4 text-base">블로그 설정과 콘텐츠를 관리합니다.</span>
      </template>
    </UPageHeader>

    <UPageBody>
      <div v-if="isLoading && !currentBlog" class="flex justify-center py-16">
        <UIcon name="i-lucide-loader-circle" class="text-muted size-12 animate-spin" />
      </div>

      <div v-else-if="currentBlog" class="flex flex-col gap-6 sm:flex-row">
        <ManageSidebar v-model="section" />
        <div class="min-w-0 flex-1">
          <BlogSettingsPanel v-if="section === 'settings'" :blog-id="currentBlog.id" />
          <PostsPanel v-else-if="section === 'posts'" :blog-id="currentBlog.id" />
          <CategoriesPanel v-else-if="section === 'categories'" :blog-id="currentBlog.id" />
          <NavigationPanel v-else-if="section === 'navigation'" :blog-id="currentBlog.id" />
          <ContentSettingsPanel v-else-if="section === 'content'" :blog-id="currentBlog.id" />
          <StatsPanel v-else-if="section === 'stats'" />
        </div>
      </div>
    </UPageBody>
  </UContainer>
</template>
