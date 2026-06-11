import { defineStore } from 'pinia';
import type { Tool } from './tools.type';
import { readItems } from '@directus/sdk';
import { ref } from 'vue';
import { directus } from '@/util/directus';

const TOOL_COLLECTION_NAME = import.meta.env.VITE_TOOL_COLLECTION_NAME;

export const useToolListStore = defineStore('tool-list', () => {
  const toolList = ref<Tool[]>([]);
  const isLoading = ref<boolean>(false);
  const err = ref<string | null>(null);

  async function fetchToolList() {
    isLoading.value = true;
    err.value = null;

    try {
      await directus.refresh();
      const resp = await directus.request<Tool[]>(readItems(TOOL_COLLECTION_NAME));
      if (resp.length === 0) {
        err.value = '등록된 툴이 없습니다.';
        console.log('툴 없음');
        return;
      }

      toolList.value = resp ?? [];
    } catch (e) {
      err.value = '툴 목록을 가져오는데 실패하였습니다.';
    } finally {
      isLoading.value = false;
    }
  }

  return {
    toolList,
    isLoading,
    err,
    fetchToolList,
  };
});
