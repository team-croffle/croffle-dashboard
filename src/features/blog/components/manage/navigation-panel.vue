<script setup lang="ts">
  import { storeToRefs } from 'pinia';
  import { computed, ref, watch } from 'vue';

  import { useNavigationStore } from '@/features/blog/stores/navigation.store';
  import type { Navigation } from '@/features/blog/types/navigation.type';

  interface NavigationForm {
    blogId: string;
    label: string;
    url: string;
    icon: string;
    isCategory: boolean;
    parentId: string | null;
    sortOrder: number;
  }

  function emptyForm(blogId = ''): NavigationForm {
    return {
      blogId,
      label: '',
      url: '',
      icon: '',
      isCategory: false,
      parentId: null,
      sortOrder: 0,
    };
  }

  const props = defineProps<{
    blogId: string;
  }>();

  const navigationStore = useNavigationStore();
  const { items, tree, isLoading, isSaving, err } = storeToRefs(navigationStore);
  const { fetchNavigation, createNavigation, updateNavigation, deleteNavigation } = navigationStore;

  watch(
    () => props.blogId,
    async (id) => {
      if (id) await fetchNavigation(id);
    },
    { immediate: true },
  );

  const newForm = ref<NavigationForm>(emptyForm());
  const showNewForm = ref(false);

  function openNewForm() {
    newForm.value = emptyForm(props.blogId);
    showNewForm.value = true;
  }

  async function submitNew() {
    if (!newForm.value.label.trim()) return;
    const created = await createNavigation({
      blogId: newForm.value.blogId,
      label: newForm.value.label,
      url: newForm.value.url.trim() || null,
      icon: newForm.value.icon.trim() || null,
      isCategory: newForm.value.isCategory,
      parentId: newForm.value.parentId,
      sortOrder: newForm.value.sortOrder,
    });
    if (created) showNewForm.value = false;
  }

  const editingId = ref<string | null>(null);
  const editForm = ref<NavigationForm>(emptyForm());

  function startEdit(item: Navigation) {
    editingId.value = item.id;
    editForm.value = {
      blogId: item.blogId,
      label: item.label,
      url: item.url ?? '',
      icon: item.icon ?? '',
      isCategory: item.isCategory,
      parentId: item.parentId,
      sortOrder: item.sortOrder,
    };
  }

  async function submitEdit(id: string) {
    const banned = new Set([id, ...collectDescendantIds(id, items.value)]);
    if (editForm.value.parentId && banned.has(editForm.value.parentId)) {
      return;
    }

    const ok = await updateNavigation(id, {
      label: editForm.value.label,
      url: editForm.value.url.trim() || null,
      icon: editForm.value.icon.trim() || null,
      isCategory: editForm.value.isCategory,
      parentId: editForm.value.parentId,
      sortOrder: editForm.value.sortOrder,
    });
    if (ok) editingId.value = null;
  }

  function cancelNew() {
    showNewForm.value = false;
  }

  function cancelEdit() {
    editingId.value = null;
  }

  const deletingId = ref<string | null>(null);

  async function handleDelete(id: string) {
    deletingId.value = id;
    await deleteNavigation(id);
    deletingId.value = null;
  }

  function collectDescendantIds(itemId: string, list: Navigation[]): Set<string> {
    const byParent = new Map<string | null, Navigation[]>();
    for (const n of list) {
      const children = byParent.get(n.parentId) ?? [];
      children.push(n);
      byParent.set(n.parentId, children);
    }

    const out = new Set<string>();
    const stack = [itemId];
    while (stack.length) {
      const id = stack.pop()!;
      for (const child of byParent.get(id) ?? []) {
        if (!out.has(child.id)) {
          out.add(child.id);
          stack.push(child.id);
        }
      }
    }
    return out;
  }

  const parentOptions = computed(() => {
    const banned = editingId.value
      ? new Set([editingId.value, ...collectDescendantIds(editingId.value, items.value)])
      : new Set<string>();

    return [
      { id: null, label: '(최상위)' },
      ...items.value.filter((n) => !banned.has(n.id)).map((n) => ({ id: n.id, label: n.label })),
    ];
  });

  function flattenTree(nodes: Navigation[], depth = 0): Array<Navigation & { depth: number }> {
    return nodes.flatMap((node) => [
      { ...node, depth },
      ...flattenTree(node.children ?? [], depth + 1),
    ]);
  }

  const flatTree = computed(() => flattenTree(tree.value));
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-2">
      <h3 class="text-xl font-medium">네비게이션</h3>
      <UButton size="md" icon="i-lucide-plus" @click="openNewForm">항목 추가</UButton>
    </div>

    <UAlert
      v-if="err"
      color="error"
      variant="soft"
      :description="err"
      icon="i-lucide-triangle-alert"
    />

    <UCard v-if="showNewForm">
      <template #header>
        <p class="text-lg font-medium">새 네비게이션 항목</p>
      </template>

      <div class="space-y-3">
        <UFormField label="라벨 *" class="text-base">
          <UInput v-model="newForm.label" placeholder="Home" size="md" class="w-full" />
        </UFormField>
        <UFormField label="URL" class="text-base">
          <UInput
            v-model="newForm.url"
            placeholder="https://... 또는 /path"
            size="md"
            class="w-full"
          />
        </UFormField>
        <UFormField label="아이콘 (Iconify)" class="text-base">
          <div class="flex items-center gap-2">
            <UInput v-model="newForm.icon" placeholder="i-lucide-link" size="md" class="flex-1" />
            <UIcon v-if="newForm.icon" :name="newForm.icon" class="h-5 w-5 shrink-0" />
          </div>
        </UFormField>
        <UFormField label="카테고리 링크" class="text-base">
          <UCheckbox v-model="newForm.isCategory" label="카테고리로 사용" />
        </UFormField>
        <UFormField label="상위 항목" class="text-base">
          <USelect
            v-model="newForm.parentId"
            :items="[
              { id: null, label: '(최상위)' },
              ...items.map((n) => ({ id: n.id, label: n.label })),
            ]"
            value-key="id"
            label-key="label"
            size="md"
            class="w-full"
          />
        </UFormField>
        <UFormField label="정렬 순서" class="text-base">
          <UInput v-model.number="newForm.sortOrder" type="number" size="md" :min="0" />
        </UFormField>
      </div>

      <template #footer>
        <div class="flex gap-4">
          <UButton size="md" class="px-4" :loading="isSaving" @click="submitNew">저장</UButton>
          <UButton size="md" class="px-4" variant="ghost" color="neutral" @click="cancelNew">
            취소
          </UButton>
        </div>
      </template>
    </UCard>

    <div v-if="isLoading" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-circle" class="text-muted size-8 animate-spin" />
    </div>

    <div v-else-if="flatTree.length === 0" class="text-muted py-12 text-center text-sm">
      {{ '네비게이션 항목이 없습니다.' }}
    </div>

    <div v-else class="divide-border divide-y rounded-lg border">
      <div
        v-for="item in flatTree"
        :key="item.id"
        :style="{ paddingLeft: `${item.depth * 20 + 12}px` }"
        class="py-2 pr-3"
      >
        <div v-if="editingId !== item.id" class="flex items-center gap-3">
          <UIcon v-if="item.icon" :name="item.icon" class="text-muted size-5 shrink-0" />
          <div class="min-w-0 flex-1">
            <p class="truncate text-base font-medium">{{ item.label }}</p>
            <p class="text-muted-foreground truncate text-sm">
              {{ item.url || '링크 없음' }}
              <span v-if="item.isCategory" class="ml-2">· 카테고리</span>
            </p>
          </div>
          <span class="text-muted-foreground text-sm">{{ item.sortOrder }}</span>
          <UButton
            size="sm"
            variant="ghost"
            color="neutral"
            icon="i-lucide-pencil"
            @click="startEdit(item)"
          />
          <UButton
            size="sm"
            variant="ghost"
            color="error"
            icon="i-lucide-trash-2"
            :loading="deletingId === item.id"
            @click="handleDelete(item.id)"
          />
        </div>

        <div v-else class="space-y-2 py-1">
          <div class="flex gap-2">
            <UInput v-model="editForm.label" placeholder="라벨" size="md" class="flex-1" />
            <UInput v-model="editForm.url" placeholder="URL" size="md" class="flex-1" />
          </div>
          <div class="flex items-center gap-2">
            <UInput v-model="editForm.icon" placeholder="아이콘" size="md" class="flex-1" />
            <UCheckbox v-model="editForm.isCategory" label="카테고리" />
          </div>
          <div class="flex gap-2">
            <USelect
              v-model="editForm.parentId"
              :items="parentOptions"
              value-key="id"
              label-key="label"
              size="md"
              class="flex-1"
            />
            <UInput
              v-model.number="editForm.sortOrder"
              type="number"
              size="md"
              class="w-20"
              :min="0"
            />
          </div>
          <div class="flex gap-1">
            <UButton size="md" :loading="isSaving" @click="submitEdit(item.id)">저장</UButton>
            <UButton size="md" variant="ghost" color="neutral" @click="cancelEdit">취소</UButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
