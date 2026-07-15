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
    postIdx: raw.post_idx,
    title: raw.title,
    slug: raw.slug,
    status: raw.status,
    visibility: raw.visibility,
    publishedAt: raw.published_at,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

export function mapPostToPayload(req: Partial<PostSaveRequest>): Partial<DirectusPostSavePayload> {
  const payload: Partial<DirectusPostSavePayload> = {};
  if (req.title !== undefined) payload.title = req.title;
  if (req.content !== undefined) payload.content = req.content;
  if (req.status !== undefined) payload.status = req.status;
  if (req.visibility !== undefined) payload.visibility = req.visibility;
  if (req.thumbnail !== undefined) payload.thumbnail = req.thumbnail;
  if (req.passwordHash !== undefined) payload.password_hash = req.passwordHash;
  if (req.categories !== undefined) payload.categories = req.categories;
  if (req.tags !== undefined) payload.tags = req.tags;
  if (req.series !== undefined) payload.series = req.series;
  return payload;
}
