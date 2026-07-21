import { directus } from '@/util/directus';
import { createItem, readItems } from '@directus/sdk';
import { defineStore } from 'pinia';
import { ref } from 'vue';

import { mapTag, mapTagToPayload } from '../mappers/tag.mapper';
import type { DirectusTag } from '../types/directus.types';
import type { Tag, TagSaveRequest } from '../types/tag.types';

function getDirectusErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;

  const extensions = (error as { extensions?: unknown }).extensions;
  if (extensions && typeof extensions === 'object') {
    const code = (extensions as { code?: unknown }).code;
    if (typeof code === 'string') return code;
  }

  const errors = (error as { errors?: unknown }).errors;
  if (!Array.isArray(errors)) return undefined;

  const firstError = errors[0];
  if (!firstError || typeof firstError !== 'object') return undefined;

  const firstExtensions = (firstError as { extensions?: unknown }).extensions;
  if (!firstExtensions || typeof firstExtensions !== 'object') return undefined;

  const code = (firstExtensions as { code?: unknown }).code;
  return typeof code === 'string' ? code : undefined;
}

const TAG_SEARCH_LIMIT = 30;

export const useTagStore = defineStore('blog_tag', () => {
  const tags = ref<Tag[]>([]);
  const isSearching = ref(false);
  const err = ref<string | null>(null);

  // 늦게 도착한 이전 검색 응답이 최신 결과를 덮어쓰지 않도록 순번을 관리한다.
  let searchSeq = 0;

  function mergeTag(tag: Tag) {
    const index = tags.value.findIndex((item) => item.id === tag.id);
    if (index === -1) {
      tags.value.push(tag);
    } else {
      tags.value[index] = tag;
    }
    tags.value.sort((a, b) => a.name.localeCompare(b.name));
  }

  async function findTagByName(blogId: string, name: string): Promise<Tag | null> {
    const resp = await directus.request<DirectusTag[]>(
      readItems('tags', {
        filter: {
          blog_id: { _eq: blogId },
          name: { _eq: name },
        },
        limit: 1,
      }),
    );

    const found = resp[0] ? mapTag(resp[0]) : null;
    if (found) mergeTag(found);
    return found;
  }

  async function searchTags(blogId: string, keyword: string) {
    const seq = ++searchSeq;
    isSearching.value = true;
    err.value = null;

    const trimmed = keyword.trim();
    const filter: Record<string, unknown> = { blog_id: { _eq: blogId } };
    if (trimmed) {
      filter.name = { _icontains: trimmed };
    }

    try {
      const resp = await directus.request<DirectusTag[]>(
        readItems('tags', {
          filter,
          sort: ['name'],
          limit: TAG_SEARCH_LIMIT,
        }),
      );
      if (seq !== searchSeq) return;
      tags.value = resp.map(mapTag);
    } catch {
      if (seq !== searchSeq) return;
      err.value = '태그를 불러오는데 실패했습니다.';
    } finally {
      if (seq === searchSeq) isSearching.value = false;
    }
  }

  async function createTag(req: TagSaveRequest): Promise<Tag | null> {
    err.value = null;
    try {
      const resp = await directus.request<DirectusTag>(createItem('tags', mapTagToPayload(req)));
      const created = mapTag(resp);
      mergeTag(created);
      return created;
    } catch (error) {
      if (getDirectusErrorCode(error) === 'RECORD_NOT_UNIQUE') {
        try {
          return await findTagByName(req.blogId, req.name);
        } catch {
          err.value = '기존 태그를 불러오는데 실패했습니다.';
          return null;
        }
      }

      err.value = '태그 생성에 실패했습니다.';
      return null;
    }
  }

  return {
    tags,
    isSearching,
    err,
    searchTags,
    createTag,
  };
});
