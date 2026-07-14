import type { DirectusPost, DirectusPostSavePayload } from '../types/directus.types';
import type { Post, PostListItem, PostSaveRequest } from '../types/post.types';
import { mapCategory } from './category.mapper';
import { mapTag } from './tag.mapper';
import { mapSeries } from './series.mapper';

export function mapPost(raw: DirectusPost): Post {
  return {
    id: raw.id,
    blogId: raw.blog_id,
    authorId: raw.author_id,
    postIdx: raw.post_idx,
    title: raw.title,
    slug: raw.slug,
    summary: raw.summary,
    content: raw.content,
    thumbnail: raw.thumbnail,
    status: raw.status,
    visibility: raw.visibility,
    publishedAt: raw.published_at,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    categories: raw.categories?.map((j) => mapCategory(j.categories_id)) ?? [],
    tags: raw.tags?.map((j) => mapTag(j.tags_id)) ?? [],
    series: raw.series?.map((j) => mapSeries(j.series_id)) ?? [],
  };
}

export function mapPostListItem(raw: DirectusPost): PostListItem {
  return {
    id: raw.id,
    blogId: raw.blog_id,
    title: raw.title,
    slug: raw.slug,
    status: raw.status,
    visibility: raw.visibility,
    publishedAt: raw.published_at,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

export function mapPostToPayload(req: PostSaveRequest): DirectusPostSavePayload {
  return {
    title: req.title,
    content: req.content,
    status: req.status,
    visibility: req.visibility,
    thumbnail: req.thumbnail,
    password: req.password ?? null,
    categories: req.categories,
    tags: req.tags,
    series: req.series,
  };
}
