<script setup lang="ts">
  import { storeToRefs } from 'pinia';
  import { computed, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import { useBlogStore } from '@/features/blog/stores/blog.store';
  import { usePostStore } from '@/features/blog/stores/post.store';
  import type { PostStatus, PostVisibility } from '@/features/blog/types/post.types';

  const route = useRoute();
  const router = useRouter();
  const blogSlug = computed(() => route.params.blogSlug as string);

  const blogStore = useBlogStore();
  const { getBlogBySlug } = blogStore;

  const postStore = usePostStore();
  const { posts, isLoading, err } = storeToRefs(postStore);
  const { fetchPosts } = postStore;

  const currentBlog = computed(() => getBlogBySlug(blogSlug.value));

  watch(
    blogSlug,
    async () => {
      if (currentBlog.value) {
        await fetchPosts(currentBlog.value.id);
      } else {
        router.replace({ name: 'blog-home' });
      }
    },
    { immediate: true },
  );

  const statusConfig: Record<
    PostStatus,
    {
      label: string;
      color: 'neutral' | 'success' | 'warning' | 'primary' | 'secondary' | 'info' | 'error';
    }
  > = {
    draft: { label: '임시저장', color: 'neutral' },
    published: { label: '발행됨', color: 'success' },
    archived: { label: '보관됨', color: 'warning' },
  };

  const visibilityConfig: Record<PostVisibility, { label: string; icon: string }> = {
    public: { label: '공개', icon: 'i-lucide-globe' },
    private: { label: '비공개', icon: 'i-lucide-lock' },
    protected: { label: '비번', icon: 'i-lucide-shield' },
  };

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
</script>

<template>
  <UContainer class="mb-12 max-w-4xl space-y-6">
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
        <h2>{{ currentBlog?.name ?? '블로그' }}</h2>
      </template>
      <template #description>
        <div class="flex w-full items-center justify-between gap-2 px-4">
          <span class="text-xl font-medium">블로그 글 목록</span>
          <div class="flex gap-2">
            <UButton
              variant="outline"
              color="neutral"
              size="md"
              icon="i-lucide-folder-tree"
              :to="{ name: 'blog-categories', params: { blogSlug } }"
            >
              {{ '카테고리' }}
            </UButton>
            <UButton
              size="md"
              icon="i-lucide-plus"
              :to="{ name: 'blog-post-new', params: { blogSlug } }"
            >
              {{ '새 글 작성' }}
            </UButton>
          </div>
        </div>
      </template>
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

      <div v-else-if="posts.length === 0" class="text-muted py-16 text-center text-base">
        {{ '아직 작성된 글이 없습니다.' }}
        <UButton
          class="mx-auto mt-4 block w-fit"
          size="md"
          :to="{
            name: 'blog-post-new',
            params: {
              blogSlug,
            },
          }"
        >
          첫 글 작성하기
        </UButton>
      </div>

      <div v-else class="divide-default flex flex-col divide-y">
        <RouterLink
          v-for="post in posts"
          :key="post.id"
          :to="{
            name: 'blog-post-edit',
            params: {
              blogSlug,
              postIdx: post.postIdx,
            },
          }"
          class="hover:bg-accent/40 flex items-center gap-4 px-2 py-4 transition-colors"
        >
          <div class="min-w-0 flex-1">
            <p class="truncate text-lg font-medium">
              {{ post.title }}
            </p>
            <p class="text-muted-foreground mt-0.5 text-sm">
              {{ formatDate(post.publishedAt ?? post.createdAt) }}
            </p>
          </div>

          <div class="flex shrink-0 items-center gap-2">
            <UBadge :color="statusConfig[post.status].color" variant="soft" size="md">
              {{ statusConfig[post.status].label }}
            </UBadge>
            <UTooltip :text="visibilityConfig[post.visibility].label">
              <UIcon :name="visibilityConfig[post.visibility].icon" class="text-muted size-5" />
            </UTooltip>
            <UIcon name="i-lucide-chevron-right" class="text-muted size-5" />
          </div>
        </RouterLink>
      </div>
    </UPageBody>
  </UContainer>
</template>
