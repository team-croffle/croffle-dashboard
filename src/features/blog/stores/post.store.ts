import { directus } from '@/util/directus';
import {
  createFolder,
  createItem,
  readFolders,
  readItems,
  updateItem,
  uploadFiles,
} from '@directus/sdk';
import { defineStore } from 'pinia';
import { ref, toRaw } from 'vue';

import { mapPost, mapPostListItem, mapPostToPayload } from '../mappers/post.mapper';
import type { DirectusPost, DirectusUploadFileResponse } from '../types/directus.types';
import type { Post, PostListItem, PostSaveRequest } from '../types/post.types';

const POSTS_COLLECTION = import.meta.env.VITE_BLOG_COLLECTION_NAME as string;
// const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL;

const POST_LIST_FIELDS = [
  'id',
  'blog_id',
  'author_id',
  'title',
  'post_idx',
  'slug',
  'status',
  'visibility',
  'published_at',
  'created_at',
  'updated_at',
] as const;

const POST_DETAIL_FIELDS = [
  '*',
  'categories.categories_id.*',
  'tags.tags_id.*',
  'series.series_id.*',
] as const;

export const usePostStore = defineStore('blog_post', () => {
  const posts = ref<PostListItem[]>([]);
  const currentPost = ref<Post | null>(null);
  const isLoading = ref(false);
  const isSaving = ref(false);
  const isUploading = ref(false);
  const isSaved = ref(false);
  const err = ref<string | null>(null);

  function setIsSaved(value: boolean) {
    isSaved.value = value;
    // 3초 후에 isSaved를 false로 설정
    setTimeout(() => {
      isSaved.value = false;
    }, 3000);
  }

  async function fetchPosts(blogId: string) {
    isLoading.value = true;
    err.value = null;
    try {
      const resp = await directus.request<DirectusPost[]>(
        readItems(POSTS_COLLECTION, {
          filter: { blog_id: { _eq: blogId } },
          sort: ['-created_at'],
          fields: [...POST_LIST_FIELDS],
        }),
      );
      posts.value = resp.map(mapPostListItem);
    } catch {
      err.value = '글 목록을 불러오는데 실패했습니다.';
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchPost(blogId: string, postIdx: number) {
    isLoading.value = true;
    err.value = null;
    currentPost.value = null;
    try {
      const resp = await directus.request<DirectusPost[]>(
        readItems(POSTS_COLLECTION, {
          filter: { blog_id: { _eq: blogId }, post_idx: { _eq: postIdx } },
          fields: [...POST_DETAIL_FIELDS],
          limit: 1,
          _ts: Date.now(),
        }),
      );
      currentPost.value = resp[0] ? mapPost(resp[0]) : null;
    } catch {
      err.value = '글을 불러오는데 실패했습니다.';
    } finally {
      isLoading.value = false;
    }
  }

  async function createPost(blogId: string, req: Partial<PostSaveRequest>): Promise<Post | null> {
    isSaving.value = true;
    err.value = null;
    try {
      const payload = { ...mapPostToPayload(req), blog_id: blogId };
      const resp = await directus.request<DirectusPost>(
        createItem(POSTS_COLLECTION, payload, {
          fields: [...POST_DETAIL_FIELDS],
        }),
      );
      const created = mapPost(resp);
      currentPost.value = created;

      posts.value.unshift(created);

      setIsSaved(true);
      return created;
    } catch (error) {
      console.error('createPost error', error);
      err.value = '글 저장에 실패했습니다.';
      return null;
    } finally {
      isSaving.value = false;
    }
  }

  async function updatePost(postId: string, req: Partial<PostSaveRequest>): Promise<Post | null> {
    isSaving.value = true;
    err.value = null;

    try {
      const resp = await directus.request<DirectusPost>(
        updateItem(POSTS_COLLECTION, postId, mapPostToPayload(req), {
          fields: [...POST_DETAIL_FIELDS],
        }),
      );

      const updated = mapPost(resp);
      currentPost.value = updated;
      const idx = posts.value.findIndex((p) => p.id === postId);
      if (idx !== -1) {
        posts.value[idx] = mapPostListItem(resp);
      }

      setIsSaved(true);
      return updated;
    } catch (error) {
      console.error('updatePost error', error);
      err.value = '글 수정에 실패했습니다.';
      return null;
    } finally {
      isSaving.value = false;
    }
  }

  async function getOrCreateFolder(blogSlug: string): Promise<string | null> {
    const existing = await directus.request(readFolders({ filter: { name: { _eq: blogSlug } } }));
    if (existing[0]) {
      return existing[0].id;
    }

    const created = await directus.request(createFolder({ name: blogSlug }));
    return (created as { id: string }).id;
  }

  async function uploadThumbnail(file: File, blogSlug: string): Promise<string | null> {
    isUploading.value = true;
    err.value = null;

    try {
      const folderId = await getOrCreateFolder(blogSlug);
      if (!folderId) {
        err.value = '폴더를 생성하는데 실패했습니다.';
        return null;
      }

      const formData = new FormData();
      formData.append('folder', folderId);
      formData.append('file', toRaw(file));

      const resp = await directus.request<DirectusUploadFileResponse>(uploadFiles(formData));
      return resp.id ?? null;
    } catch {
      err.value = '썸네일 업로드에 실패했습니다.';
      return null;
    } finally {
      isUploading.value = false;
    }
  }

  function clearCurrentPost() {
    currentPost.value = null;
  }

  return {
    posts,
    currentPost,
    isLoading,
    isSaving,
    isUploading,
    isSaved,
    err,
    fetchPosts,
    fetchPost,
    createPost,
    updatePost,
    uploadThumbnail,
    clearCurrentPost,
  };
});
