import { directus } from '@/util/directus';
import { createItem, readItems, updateItem, uploadFiles } from '@directus/sdk';
import { defineStore } from 'pinia';
import { ref } from 'vue';

import { mapPost, mapPostListItem, mapPostToPayload } from '../mappers/post.mapper';
import type { DirectusPost } from '../types/directus.types';
import type { Post, PostListItem, PostSaveRequest } from '../types/post.types';

const POSTS_COLLECTION = import.meta.env.VITE_BLOG_COLLECTION_NAME as string;

const POST_LIST_FIELDS = [
  'id',
  'blog_id',
  'title',
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
  const err = ref<string | null>(null);

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

  async function fetchPost(slug: string) {
    isLoading.value = true;
    err.value = null;
    currentPost.value = null;
    try {
      const resp = await directus.request<DirectusPost[]>(
        readItems(POSTS_COLLECTION, {
          filter: { slug: { _eq: slug } },
          fields: [...POST_DETAIL_FIELDS],
          limit: 1,
        }),
      );
      currentPost.value = resp[0] ? mapPost(resp[0]) : null;
    } catch {
      err.value = '글을 불러오는데 실패했습니다.';
    } finally {
      isLoading.value = false;
    }
  }

  async function createPost(blogId: string, req: PostSaveRequest): Promise<Post | null> {
    isSaving.value = true;
    err.value = null;
    try {
      const payload = { ...mapPostToPayload(req), blog_id: blogId };
      const resp = await directus.request<DirectusPost>(createItem(POSTS_COLLECTION, payload));
      const created = mapPost(resp);
      currentPost.value = created;
      return created;
    } catch {
      err.value = '글 저장에 실패했습니다.';
      return null;
    } finally {
      isSaving.value = false;
    }
  }

  async function updatePost(postId: string, req: PostSaveRequest): Promise<Post | null> {
    isSaving.value = true;
    err.value = null;
    try {
      const resp = await directus.request<DirectusPost>(
        updateItem(POSTS_COLLECTION, postId, mapPostToPayload(req)),
      );
      const updated = mapPost(resp);
      currentPost.value = updated;
      const idx = posts.value.findIndex((p) => p.id === postId);
      if (idx !== -1) posts.value[idx] = mapPostListItem(resp);
      return updated;
    } catch {
      err.value = '글 수정에 실패했습니다.';
      return null;
    } finally {
      isSaving.value = false;
    }
  }

  async function uploadThumbnail(file: File): Promise<string | null> {
    isUploading.value = true;
    err.value = null;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const resp = await directus.request(uploadFiles(formData));
      return (resp as { id: string }).id ?? null;
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
    err,
    fetchPosts,
    fetchPost,
    createPost,
    updatePost,
    uploadThumbnail,
    clearCurrentPost,
  };
});
