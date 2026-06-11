import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { Profile, SaveProfileRequest } from './profile.type';
import { directus } from '@/util/directus';
import { createItem, readItems, updateItem } from '@directus/sdk';

const MEMBER_COLLECTION_NAME = import.meta.env.VITE_MEMBER_COLLECTION_NAME;

export const useProfileStore = defineStore('profile', () => {
  const profile = ref<Profile | null>(null);
  const isLoading = ref<boolean>(false);
  const err = ref<string | null>(null);

  const hasProfile = computed(() => profile.value !== null);

  async function fetchProfile() {
    isLoading.value = true;
    err.value = null;

    try {
      await directus.refresh();
      const resp = await directus.request(
        readItems(MEMBER_COLLECTION_NAME, {
          filter: { user_id: { _eq: '$CURRENT_USER' } },
          limit: 1,
        }),
      );

      if (resp.length === 0) {
        err.value = '등록된 프로필이 없습니다.';
        console.log('프로필 없음');
        return;
      }
      profile.value = (resp[0] as Profile) ?? null;
    } catch (e) {
      err.value = String(e);
    } finally {
      isLoading.value = false;
    }
  }

  async function saveProfile(payload: SaveProfileRequest) {
    isLoading.value = true;
    err.value = null;
    try {
      if (profile.value?.id) {
        const updated = await directus.request(
          updateItem(MEMBER_COLLECTION_NAME, profile.value.id, payload),
        );
        profile.value = updated as Profile;
      } else {
        const created = await directus.request(
          createItem(MEMBER_COLLECTION_NAME, {
            ...payload,
            user_id: '$CURRENT_USER',
          }),
        );
        profile.value = created as Profile;
      }
    } catch (e) {
      err.value = '프로필 저장에 실패하였습니다.';
    } finally {
      isLoading.value = false;
    }
  }

  return {
    profile,
    hasProfile,
    isLoading,
    err,
    fetchProfile,
    saveProfile,
  };
});
