import { directus } from '@/util/directus';
import { readItems, updateItem } from '@directus/sdk';
import { type Contact, type ContactStatusUpdateRequest } from './contact.type';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

const CONTACT_COLLECTION_NAME: string = import.meta.env.VITE_CONTACT_COLLECTION_NAME;

export const useContactStore = defineStore('contact_submission', () => {
  const contactList = ref<Contact[]>([]);
  const pendingContactCount = computed<number>(
    () => contactList.value.filter((c) => c.status === 'pending').length,
  );
  const isLoading = ref<boolean>(false);
  const err = ref<string | null>(null);

  async function fetchContact() {
    isLoading.value = true;
    err.value = null;

    try {
      const resp = await directus.request(readItems(CONTACT_COLLECTION_NAME));
      console.log(resp);
      contactList.value = resp as Contact[];
    } catch (error) {
      err.value = '연락처를 가져오는데 실패하였습니다.';
    } finally {
      isLoading.value = false;
    }
  }

  async function updateStatus(payload: ContactStatusUpdateRequest) {
    isLoading.value = true;
    err.value = null;

    try {
      const resp = await directus.request(
        updateItem(CONTACT_COLLECTION_NAME, payload.id, { status: payload.status }),
      );
      contactList.value = contactList.value.map((item) => {
        if (item.id === payload.id) {
          return resp as Contact;
        }
        return item;
      });
    } catch (error) {
      err.value = '연락처를 업데이트 하는데 실패하였습니다.';
    } finally {
      isLoading.value = false;
    }
  }

  return {
    contactList,
    pendingContactCount,
    isLoading,
    err,
    fetchContact,
    updateStatus,
  };
});
