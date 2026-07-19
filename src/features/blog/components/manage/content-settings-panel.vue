<script setup lang="ts">
  import { storeToRefs } from 'pinia';
  import { ref, watch } from 'vue';

  import { useBlogSettingsStore } from '@/features/blog/stores/blog-settings.store';
  import type {
    BlogSettingsSaveRequest,
    ChangeContentPolicy,
  } from '@/features/blog/types/blog-settings.types';

  const props = defineProps<{
    blogId: string;
  }>();

  const settingsStore = useBlogSettingsStore();
  const { settings, isLoading, isSaving, err } = storeToRefs(settingsStore);
  const { fetchSettings, saveSettings } = settingsStore;

  const form = ref<BlogSettingsSaveRequest>({
    blogId: '',
    allowCcl: false,
    allowCommercial: false,
    changeContent: 'allow',
  });

  const changeContentOptions: Array<{ value: ChangeContentPolicy; label: string }> = [
    { value: 'allow', label: '변경 허용' },
    { value: 'share_alike', label: '동일 조건 변경 허용 (ShareAlike)' },
    { value: 'no_derivatives', label: '변경 금지 (NoDerivatives)' },
  ];

  const saved = ref(false);

  watch(
    () => props.blogId,
    async (id) => {
      if (!id) return;
      await fetchSettings(id);
      form.value = {
        blogId: id,
        allowCcl: settings.value?.allowCcl ?? false,
        allowCommercial: settings.value?.allowCommercial ?? false,
        changeContent: settings.value?.changeContent ?? 'allow',
      };
      saved.value = false;
    },
    { immediate: true },
  );

  async function submit() {
    saved.value = false;
    const ok = await saveSettings({
      ...form.value,
      blogId: props.blogId,
    });
    if (ok) saved.value = true;
  }
</script>

<template>
  <div class="space-y-4">
    <h3 class="text-xl font-medium">콘텐츠 설정</h3>
    <p class="text-muted-foreground text-sm">CCL 표시 및 이용 조건을 설정합니다.</p>

    <div v-if="isLoading" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-circle" class="text-muted size-8 animate-spin" />
    </div>

    <template v-else>
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
        description="콘텐츠 설정이 저장되었습니다."
        icon="i-lucide-check"
      />

      <div class="max-w-lg space-y-5">
        <UFormField label="CCL 표기" class="text-base">
          <USwitch v-model="form.allowCcl" label="CCL 라이선스 표시" />
        </UFormField>

        <UFormField label="상업적 이용" class="text-base">
          <USwitch
            v-model="form.allowCommercial"
            label="상업적 이용 허용"
            :disabled="!form.allowCcl"
          />
        </UFormField>

        <UFormField label="콘텐츠 변경 조건" class="text-base">
          <USelect
            v-model="form.changeContent"
            :items="changeContentOptions"
            value-key="value"
            label-key="label"
            size="md"
            class="w-full"
            :disabled="!form.allowCcl"
          />
        </UFormField>

        <UButton size="md" :loading="isSaving" @click="submit">저장</UButton>
      </div>
    </template>
  </div>
</template>
