import type { Category } from './category.types';
import type { Tag } from './tag.types';
import type { Series } from './series.types';

export type PostStatus = 'draft' | 'published' | 'archived';
export type PostVisibility = 'public' | 'private' | 'protected';

export interface Post {
  id: string;
  blogId: string;
  authorId: string;
  postIdx: number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  thumbnail: string | null;
  status: PostStatus;
  visibility: PostVisibility;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  categories: Category[];
  tags: Tag[];
  series: Series[];
}

export interface PostListItem {
  id: string;
  blogId: string;
  title: string;
  slug: string;
  status: PostStatus;
  visibility: PostVisibility;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PostSaveRequest {
  title: string;
  content: string;
  status: PostStatus;
  visibility: PostVisibility;
  thumbnail?: string | null;
  password?: string | null;
  categories?: Array<{ categories_id: string }>;
  tags?: Array<{ tags_id: string }>;
  series?: Array<{ series_id: string }>;
}
