<script setup lang="ts">
  import type { ManageSection } from '@/features/blog/types/manage.types';

  defineProps<{
    modelValue: ManageSection;
  }>();

  const emit = defineEmits<{
    'update:modelValue': [value: ManageSection];
  }>();

  const groups: Array<{
    label: string;
    items: Array<{ id: ManageSection; label: string; icon: string }>;
  }> = [
    {
      label: '일반',
      items: [{ id: 'settings', label: '설정', icon: 'i-lucide-settings' }],
    },
    {
      label: '콘텐츠',
      items: [
        { id: 'posts', label: '글 관리', icon: 'i-lucide-file-text' },
        { id: 'categories', label: '카테고리', icon: 'i-lucide-folder-tree' },
        { id: 'navigation', label: '네비게이션', icon: 'i-lucide-menu' },
        { id: 'content', label: '콘텐츠 설정', icon: 'i-lucide-copyright' },
      ],
    },
    {
      label: '통계',
      items: [{ id: 'stats', label: '통계', icon: 'i-lucide-chart-column' }],
    },
  ];
</script>

<template>
  <nav class="border-default flex w-full flex-col gap-6 border-r pr-4 sm:w-52 sm:shrink-0">
    <div v-for="group in groups" :key="group.label" class="space-y-1">
      <p class="text-muted-foreground px-2 text-xs font-medium tracking-wide uppercase">
        {{ group.label }}
      </p>
      <UButton
        v-for="item in group.items"
        :key="item.id"
        :icon="item.icon"
        :variant="modelValue === item.id ? 'soft' : 'ghost'"
        :color="modelValue === item.id ? 'primary' : 'neutral'"
        size="md"
        class="w-full justify-start"
        @click="emit('update:modelValue', item.id)"
      >
        {{ item.label }}
      </UButton>
    </div>
  </nav>
</template>
