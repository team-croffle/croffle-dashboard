import type { DirectusTag, DirectusTagSavePayload } from '../types/directus.types';
import type { Tag, TagSaveRequest } from '../types/tag.types';

export function mapTag(raw: DirectusTag): Tag {
  return {
    id: raw.id,
    blogId: raw.blog_id,
    name: raw.name,
    slug: raw.slug,
  };
}

export function mapTagToPayload(req: TagSaveRequest): DirectusTagSavePayload {
  return {
    blog_id: req.blogId,
    name: req.name,
  };
}
