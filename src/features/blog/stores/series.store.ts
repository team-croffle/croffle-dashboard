import { directus } from '@/util/directus';
import { createItem, readItems } from '@directus/sdk';
import { defineStore } from 'pinia';
import { ref } from 'vue';

import { mapSeries, mapSeriesToPayload } from '../mappers/series.mapper';
import type { DirectusSeries } from '../types/directus.types';
import type { Series, SeriesSaveRequest } from '../types/series.types';

const SERIES_COLLECTION = import.meta.env.VITE_SERIES_COLLECTION_NAME as string;

export const useSeriesStore = defineStore('blog_series', () => {
  const seriesList = ref<Series[]>([]);
  const isLoading = ref(false);
  const err = ref<string | null>(null);

  async function fetchSeries(blogId: string) {
    isLoading.value = true;
    err.value = null;
    try {
      const resp = await directus.request<DirectusSeries[]>(
        readItems(SERIES_COLLECTION, {
          filter: { blog_id: { _eq: blogId } },
          sort: ['name'],
        }),
      );
      seriesList.value = resp.map(mapSeries);
    } catch {
      err.value = '시리즈를 불러오는데 실패했습니다.';
    } finally {
      isLoading.value = false;
    }
  }

  async function createSeries(req: SeriesSaveRequest): Promise<Series | null> {
    err.value = null;
    try {
      const resp = await directus.request<DirectusSeries>(
        createItem(SERIES_COLLECTION, mapSeriesToPayload(req)),
      );
      const created = mapSeries(resp);
      seriesList.value.push(created);
      return created;
    } catch {
      err.value = '시리즈 생성에 실패했습니다.';
      return null;
    }
  }

  return {
    seriesList,
    isLoading,
    err,
    fetchSeries,
    createSeries,
  };
});
