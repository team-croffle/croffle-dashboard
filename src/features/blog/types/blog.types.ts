export type BlogRole = 'owner' | 'editor';

export interface Blog {
  id: string;
  slug: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface BlogMember {
  id: string;
  blog: Blog;
  userId: string;
  role: BlogRole;
}
