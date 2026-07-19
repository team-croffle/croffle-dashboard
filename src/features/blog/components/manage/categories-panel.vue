<script setup lang="ts">
  import { storeToRefs } from 'pinia';
  import { computed, ref, watch } from 'vue';

  import { useCategoryStore } from '@/features/blog/stores/category.store';
  import type { Category, CategorySaveRequest } from '@/features/blog/types/category.types';

  const props = defineProps<{
    blogId: string;
  }>();

  const categoryStore = useCategoryStore();
  const { categories, categoryTree, isLoading, isSaving, err } = storeToRefs(categoryStore);
  const { fetchCategories, createCategory, updateCategory, deleteCategory } = categoryStore;

  watch(
    () => props.blogId,
    async (id) => {
      if (id) await fetchCategories(id);
    },
    { immediate: true },
  );

  const newForm = ref<CategorySaveRequest>({
    blogId: '',
    name: '',
    parentId: null,
    icon: '',
    sortOrder: 0,
  });
  const showNewForm = ref(false);

  function openNewForm() {
    newForm.value = {
      blogId: props.blogId,
      name: '',
      parentId: null,
      icon: '',
      sortOrder: 0,
    };
    showNewForm.value = true;
  }

  async function submitNew() {
    if (!newForm.value.name.trim()) return;
    const created = await createCategory(newForm.value);
    if (created) showNewForm.value = false;
  }

  const editingId = ref<string | null>(null);
  const selectedCategory = ref<Category | null>(null);
  const editForm = ref<Partial<CategorySaveRequest>>({});

  function startEdit(cat: Category) {
    editingId.value = cat.id;
    selectedCategory.value = cat;
    editForm.value = {
      name: cat.name,
      icon: cat.icon ?? '',
      parentId: cat.parentId,
      sortOrder: cat.sortOrder,
    };
  }

  function buildEditPayload(data: Partial<CategorySaveRequest>): Partial<CategorySaveRequest> {
    return {
      name: data.name !== selectedCategory.value?.name ? data.name : undefined,
      icon: data.icon !== selectedCategory.value?.icon ? data.icon : undefined,
      parentId: data.parentId !== selectedCategory.value?.parentId ? data.parentId : undefined,
      sortOrder: data.sortOrder !== selectedCategory.value?.sortOrder ? data.sortOrder : undefined,
    };
  }

  async function submitEdit(id: string) {
    const banned = new Set([id, ...collectDescendantIds(id, categories.value)]);
    if (editForm.value.parentId && banned.has(editForm.value.parentId)) {
      return;
    }

    const ok = await updateCategory(id, buildEditPayload(editForm.value));
    if (ok) editingId.value = null;
  }

  function cancelEdit() {
    editingId.value = null;
  }

  const deletingId = ref<string | null>(null);

  async function handleDelete(id: string) {
    deletingId.value = id;
    await deleteCategory(id);
    deletingId.value = null;
  }

  function collectDescendantIds(catId: string, cats: Category[]): Set<string> {
    const byParent = new Map<string | null, Category[]>();
    for (const c of cats) {
      const list = byParent.get(c.parentId) ?? [];
      list.push(c);
      byParent.set(c.parentId, list);
    }

    const out = new Set<string>();
    const stack = [catId];
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
      ? new Set([editingId.value, ...collectDescendantIds(editingId.value, categories.value)])
      : new Set<string>();

    return [
      { id: null, label: '(최상위)' },
      ...categories.value
        .filter((c) => !banned.has(c.id))
        .map((c) => ({ id: c.id, label: c.name })),
    ];
  });

  function flattenTree(cats: Category[], depth = 0): Array<Category & { depth: number }> {
    return cats.flatMap((cat) => [
      { ...cat, depth },
      ...flattenTree(cat.children ?? [], depth + 1),
    ]);
  }

  function cancelNew() {
    showNewForm.value = false;
  }

  const flatTree = computed(() => flattenTree(categoryTree.value));
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-2">
      <h3 class="text-xl font-medium">카테고리</h3>
      <UButton size="md" icon="i-lucide-plus" @click="openNewForm">카테고리 추가</UButton>
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
        <p class="text-lg font-medium">새 카테고리</p>
      </template>

      <div class="space-y-3">
        <UFormField label="이름 *" class="text-base">
          <UInput v-model="newForm.name" placeholder="카테고리 이름" size="md" class="w-full" />
        </UFormField>
        <UFormField label="아이콘 (Iconify)" class="text-base">
          <div class="flex items-center gap-2">
            <UInput v-model="newForm.icon" placeholder="i-lucide-folder" size="md" class="flex-1" />
            <UIcon v-if="newForm.icon" :name="newForm.icon" class="h-5 w-5 shrink-0" />
          </div>
        </UFormField>
        <UFormField label="상위 카테고리" class="text-base">
          <USelect
            v-model="newForm.parentId"
            :items="[
              { id: null, label: '(최상위)' },
              ...categories.map((c) => ({ id: c.id, label: c.name })),
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
      {{ '카테고리가 없습니다.' }}
    </div>

    <div v-else class="divide-border divide-y rounded-lg border">
      <div class="py-2 pr-4 pl-3">
        <div class="flex items-center gap-3">
          <UIcon name="mdi:dot" class="text-muted size-5 shrink-0" />
          <span class="flex-1 text-base font-medium">카테고리 명</span>
          <span class="text-muted-foreground text-sm">idx</span>
          <span class="text-muted-foreground text-sm">수정</span>
          <span class="text-muted-foreground text-sm">삭제</span>
        </div>
      </div>
      <div
        v-for="cat in flatTree"
        :key="cat.id"
        :style="{ paddingLeft: `${cat.depth * 20 + 12}px` }"
        class="py-2 pr-3"
      >
        <div v-if="editingId !== cat.id" class="flex items-center gap-3">
          <UIcon v-if="cat.icon" :name="cat.icon" class="text-muted size-5 shrink-0" />
          <span class="flex-1 text-base font-medium">{{ cat.name }}</span>
          <span class="text-muted-foreground text-sm">{{ cat.sortOrder }}</span>
          <UButton
            size="sm"
            variant="ghost"
            color="neutral"
            icon="i-lucide-pencil"
            @click="startEdit(cat)"
          />
          <UButton
            size="sm"
            variant="ghost"
            color="error"
            icon="i-lucide-trash-2"
            :loading="deletingId === cat.id"
            @click="handleDelete(cat.id)"
          />
        </div>

        <div v-else class="space-y-2 py-1">
          <div class="flex gap-2">
            <UInput v-model="editForm.name" placeholder="카테고리 이름" size="md" class="flex-1" />
            <div class="flex items-center gap-1">
              <UInput
                v-model="editForm.icon"
                placeholder="i-lucide-folder"
                size="md"
                class="w-40"
              />
              <UIcon v-if="editForm.icon" :name="editForm.icon" class="size-5" />
            </div>
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
            <UButton size="md" :loading="isSaving" @click="submitEdit(cat.id)">저장</UButton>
            <UButton size="md" variant="ghost" color="neutral" @click="cancelEdit">취소</UButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
