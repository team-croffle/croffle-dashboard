<script setup lang="ts">
  import { storeToRefs } from 'pinia';
  import { onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { useBlogStore } from '@/features/blog/stores/blog.store';
  import type { Blog } from '@/features/blog/types/blog.types';

  const router = useRouter();
  const blogStore = useBlogStore();
  const { myBlogs, members, isLoading, err } = storeToRefs(blogStore);
  const { fetchMyBlogs, updateBlogDescription, getMemberBySlug } = blogStore;

  const editingDescriptionId = ref<string | null>(null);
  const descriptionDraft = ref('');

  onMounted(async () => {
    await fetchMyBlogs();
    if (myBlogs.value.length === 1) {
      router.replace({ name: 'blog-posts', params: { blogSlug: myBlogs.value[0].slug } });
    }
  });

  function getRoleBadgeColor(role: string) {
    return role === 'owner' ? 'primary' : 'neutral';
  }

  function getRoleLabel(role: string) {
    return role === 'owner' ? '오너' : '에디터';
  }

  function startEditDescription(blog: Blog) {
    editingDescriptionId.value = blog.id;
    descriptionDraft.value = blog.description ?? '';
  }

  async function saveDescription(blog: Blog) {
    const ok = await updateBlogDescription(blog.id, descriptionDraft.value);
    if (ok) editingDescriptionId.value = null;
  }

  function cancelEditDescription() {
    editingDescriptionId.value = null;
  }

  function isOwner(blogSlug: string) {
    return getMemberBySlug(blogSlug)?.role === 'owner';
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
        <UCard v-for="member in members" :key="member.id" class="bg-card flex flex-col">
          <template #header>
            <div class="flex items-center justify-between gap-2">
              <span class="truncate text-lg font-semibold">{{ member.blog.name }}</span>
              <UBadge :color="getRoleBadgeColor(member.role)" variant="soft" size="md">
                {{ getRoleLabel(member.role) }}
              </UBadge>
            </div>
          </template>

          <div class="min-h-10 text-base">
            <template v-if="editingDescriptionId === member.blog.id">
              <UTextarea
                v-model="descriptionDraft"
                :rows="3"
                placeholder="블로그 설명을 입력하세요."
                class="w-full"
                :ui="{
                  base: 'text-base md:text-base',
                }"
                autoresize
              />
              <div class="mt-2 flex gap-2">
                <UButton size="sm" @click="saveDescription(member.blog)">{{ '저장' }}</UButton>
                <UButton size="sm" variant="ghost" color="neutral" @click="cancelEditDescription">
                  {{ '취소' }}
                </UButton>
              </div>
            </template>
            <template v-else>
              <div class="flex items-center">
                <p class="text-muted-foreground">
                  {{ member.blog.description || '설명 없음' }}
                </p>
                <UTooltip text="설명 수정">
                  <UButton
                    v-if="isOwner(member.blog.slug)"
                    size="xs"
                    variant="ghost"
                    color="neutral"
                    @click="startEditDescription(member.blog)"
                  >
                    <UIcon name="i-lucide-pencil" class="h-4 w-4" />
                  </UButton>
                </UTooltip>
              </div>
            </template>
          </div>

          <template #footer>
            <div class="divide-border flex justify-center gap-2 divide-x">
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
                  size="md"
                  variant="ghost"
                  color="neutral"
                  :to="{ name: 'blog-posts', params: { blogSlug: member.blog.slug } }"
                  icon="i-lucide-file-text"
                  class="w-full justify-center"
                >
                  {{ '글 관리' }}
                </UButton>
              </div>
              <div class="flex-1">
                <UButton
                  size="md"
                  variant="ghost"
                  color="neutral"
                  :to="{ name: 'blog-categories', params: { blogSlug: member.blog.slug } }"
                  icon="i-lucide-folder-tree"
                  class="w-full justify-center"
                >
                  {{ '카테고리' }}
                </UButton>
              </div>
            </div>
          </template>
        </UCard>
      </div>
    </UPageBody>
  </UContainer>
</template>
