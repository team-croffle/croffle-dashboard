import { directus } from '@/util/directus';
import { createItem, deleteItem, readItems, updateItem } from '@directus/sdk';
import { defineStore } from 'pinia';
import { ref } from 'vue';

import { buildCategoryTree, mapCategory, mapCategoryToPayload } from '../mappers/category.mapper';
import type { DirectusCategory } from '../types/directus.types';
import type { Category, CategorySaveRequest } from '../types/category.types';

const CATEGORIES_COLLECTION = import.meta.env.VITE_CATEGORIES_COLLECTION_NAME as string;

export const useCategoryStore = defineStore('blog_category', () => {
  const categories = ref<Category[]>([]);
  const categoryTree = ref<Category[]>([]);
  const isLoading = ref(false);
  const isSaving = ref(false);
  const err = ref<string | null>(null);

  async function fetchCategories(blogId: string) {
    isLoading.value = true;
    err.value = null;
    try {
      const resp = await directus.request<DirectusCategory[]>(
        readItems(CATEGORIES_COLLECTION, {
          filter: { blog_id: { _eq: blogId } },
          sort: ['sort_order', 'name'],
        }),
      );
      categories.value = resp.map(mapCategory);
      categoryTree.value = buildCategoryTree(categories.value);
    } catch {
      err.value = '카테고리를 불러오는데 실패했습니다.';
    } finally {
      isLoading.value = false;
    }
  }

  async function createCategory(req: CategorySaveRequest): Promise<Category | null> {
    isSaving.value = true;
    err.value = null;
    try {
      const resp = await directus.request<DirectusCategory>(
        createItem(CATEGORIES_COLLECTION, mapCategoryToPayload(req)),
      );
      const created = mapCategory(resp);
      categories.value.push(created);
      categoryTree.value = buildCategoryTree(categories.value);
      return created;
    } catch {
      err.value = '카테고리 생성에 실패했습니다.';
      return null;
    } finally {
      isSaving.value = false;
    }
  }

  async function updateCategory(id: string, req: Partial<CategorySaveRequest>): Promise<boolean> {
    isSaving.value = true;
    err.value = null;
    try {
      const payload: Partial<ReturnType<typeof mapCategoryToPayload>> = {};
      if (req.name !== undefined) payload.name = req.name;
      if (req.icon !== undefined) payload.icon = req.icon;
      if (req.parentId !== undefined) payload.parent_id = req.parentId;
      if (req.sortOrder !== undefined) payload.sort_order = req.sortOrder;

      const resp = await directus.request<DirectusCategory>(
        updateItem(CATEGORIES_COLLECTION, id, payload),
      );
      const updated = mapCategory(resp);
      const idx = categories.value.findIndex((c) => c.id === id);
      if (idx !== -1) categories.value[idx] = updated;
      categoryTree.value = buildCategoryTree(categories.value);
      return true;
    } catch {
      err.value = '카테고리 수정에 실패했습니다.';
      return false;
    } finally {
      isSaving.value = false;
    }
  }

  async function deleteCategory(id: string): Promise<boolean> {
    isSaving.value = true;
    err.value = null;
    try {
      await directus.request(deleteItem(CATEGORIES_COLLECTION, id));
      categories.value = categories.value.filter((c) => c.id !== id);
      categoryTree.value = buildCategoryTree(categories.value);
      return true;
    } catch {
      err.value = '카테고리 삭제에 실패했습니다.';
      return false;
    } finally {
      isSaving.value = false;
    }
  }

  return {
    categories,
    categoryTree,
    isLoading,
    isSaving,
    err,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
});
