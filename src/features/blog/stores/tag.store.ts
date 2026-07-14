import { directus } from '@/util/directus';
import { createItem, readItems } from '@directus/sdk';
import { defineStore } from 'pinia';
import { ref } from 'vue';

import { mapTag, mapTagToPayload } from '../mappers/tag.mapper';
import type { DirectusTag } from '../types/directus.types';
import type { Tag, TagSaveRequest } from '../types/tag.types';

const TAGS_COLLECTION = import.meta.env.VITE_TAGS_COLLECTION_NAME as string;

export const useTagStore = defineStore('blog_tag', () => {
  const tags = ref<Tag[]>([]);
  const isLoading = ref(false);
  const err = ref<string | null>(null);

  async function fetchTags(blogId: string) {
    isLoading.value = true;
    err.value = null;
    try {
      const resp = await directus.request<DirectusTag[]>(
        readItems(TAGS_COLLECTION, {
          filter: { blog_id: { _eq: blogId } },
          sort: ['name'],
          _ts: Date.now(),
        }),
      );
      tags.value = resp.map(mapTag);
    } catch {
      err.value = '태그를 불러오는데 실패했습니다.';
    } finally {
      isLoading.value = false;
    }
  }

  async function createTag(req: TagSaveRequest): Promise<Tag | null> {
    err.value = null;
    try {
      const resp = await directus.request<DirectusTag>(
        createItem(TAGS_COLLECTION, mapTagToPayload(req)),
      );
      const created = mapTag(resp);
      tags.value.push(created);
      tags.value.sort((a, b) => a.name.localeCompare(b.name));
      return created;
    } catch {
      err.value = '태그 생성에 실패했습니다.';
      return null;
    }
  }

  return {
    tags,
    isLoading,
    err,
    fetchTags,
    createTag,
  };
});
