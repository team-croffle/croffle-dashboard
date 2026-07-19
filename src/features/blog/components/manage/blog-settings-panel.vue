<script setup lang="ts">
  import { storeToRefs } from 'pinia';
  import { computed, ref, watch } from 'vue';

  import { useBlogStore } from '@/features/blog/stores/blog.store';

  const props = defineProps<{
    blogId: string;
  }>();

  const blogStore = useBlogStore();
  const { members, err, isLoading } = storeToRefs(blogStore);
  const { updateBlog } = blogStore;

  const blog = computed(() => members.value.find((m) => m.blog.id === props.blogId)?.blog);

  const name = ref('');
  const description = ref('');
  const isSaving = ref(false);
  const saved = ref(false);

  watch(
    blog,
    (value) => {
      if (!value) return;
      name.value = value.name;
      description.value = value.description ?? '';
      saved.value = false;
    },
    { immediate: true },
  );

  async function submit() {
    if (!name.value.trim()) return;
    isSaving.value = true;
    saved.value = false;
    const ok = await updateBlog(props.blogId, {
      name: name.value.trim(),
      description: description.value,
    });
    isSaving.value = false;
    if (ok) saved.value = true;
  }
</script>

<template>
  <div class="space-y-4">
    <h3 class="text-xl font-medium">블로그 설정</h3>
    <p class="text-muted-foreground text-sm">블로그 이름과 설명을 수정합니다.</p>

    <div v-if="isLoading && !blog" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-circle" class="text-muted size-8 animate-spin" />
    </div>

    <template v-else-if="blog">
      <UAlert
        v-if="err"
        color="error"
        variant="soft"
        :description="err"
        icon="i-lucide-triangle-alert"
      />

      <UAlert
        v-if="saved"
        color="success"
        variant="soft"
        description="블로그 설정이 저장되었습니다."
        icon="i-lucide-check"
      />

      <div class="max-w-lg space-y-4">
        <UFormField label="블로그 이름 *" class="text-base">
          <UInput v-model="name" placeholder="블로그 이름" size="md" class="w-full" />
        </UFormField>
        <UFormField label="설명" class="text-base">
          <UTextarea
            v-model="description"
            :rows="4"
            placeholder="블로그 설명을 입력하세요."
            class="w-full"
            autoresize
          />
        </UFormField>
        <UButton size="md" :loading="isSaving" @click="submit">저장</UButton>
      </div>
    </template>
  </div>
</template>
