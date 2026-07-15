import { directus } from '@/util/directus';
import { readItems, updateItem } from '@directus/sdk';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { mapBlogMember } from '../mappers/blog.mapper';
import type { DirectusBlogMember } from '../types/directus.types';
import type { Blog, BlogMember } from '../types/blog.types';

const BLOGS_COLLECTION = import.meta.env.VITE_BLOGS_COLLECTION_NAME as string;
const BLOG_MEMBERS_COLLECTION = import.meta.env.VITE_BLOG_MEMBERS_COLLECTION_NAME as string;

export const useBlogStore = defineStore('blog', () => {
  const members = ref<BlogMember[]>([]);
  const isLoading = ref(false);
  const err = ref<string | null>(null);

  const myBlogs = computed<Blog[]>(() => members.value.map((m) => m.blog));

  function getBlogBySlug(slug: string): Blog | undefined {
    return myBlogs.value.find((b) => b.slug === slug);
  }

  function getMemberBySlug(slug: string): BlogMember | undefined {
    return members.value.find((m) => m.blog.slug === slug);
  }

  async function fetchMyBlogs() {
    isLoading.value = true;
    err.value = null;

    try {
      const resp = await directus.request<DirectusBlogMember[]>(
        readItems(BLOG_MEMBERS_COLLECTION, {
          filter: { user_id: { _eq: '$CURRENT_USER' } },
          fields: ['id', 'role', 'user_id', 'blog_id.*'],
          _ts: Date.now(),
        }),
      );
      members.value = resp.map(mapBlogMember);
    } catch {
      members.value = [];
      err.value = '블로그 목록을 불러오는데 실패했습니다.';
    } finally {
      isLoading.value = false;
    }
  }

  async function updateBlogDescription(blogId: string, description: string): Promise<boolean> {
    err.value = null;
    try {
      await directus.request(updateItem(BLOGS_COLLECTION, blogId, { description }));
      const member = members.value.find((m) => m.blog.id === blogId);
      if (member) member.blog.description = description;
      return true;
    } catch {
      err.value = '블로그 설명 수정에 실패했습니다.';
      return false;
    }
  }

  return {
    members,
    myBlogs,
    isLoading,
    err,
    getBlogBySlug,
    getMemberBySlug,
    fetchMyBlogs,
    updateBlogDescription,
  };
});
