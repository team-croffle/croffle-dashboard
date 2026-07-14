import type { DirectusBlog, DirectusBlogMember } from '../types/directus.types';
import type { Blog, BlogMember } from '../types/blog.types';

export function mapBlog(raw: DirectusBlog): Blog {
  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    description: raw.description,
    createdAt: raw.created_at,
  };
}

export function mapBlogMember(raw: DirectusBlogMember): BlogMember {
  return {
    id: raw.id,
    blog: mapBlog(raw.blog_id),
    userId: raw.user_id,
    role: raw.role,
  };
}
