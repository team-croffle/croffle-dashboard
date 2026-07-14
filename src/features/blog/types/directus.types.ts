export interface DirectusBlog {
  id: string;
  slug: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface DirectusBlogMember {
  id: string;
  blog_id: DirectusBlog;
  user_id: string;
  role: 'owner' | 'editor';
}

export interface DirectusPost {
  id: string;
  blog_id: string;
  author_id: string;
  post_idx: number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  thumbnail: string | null;
  status: 'draft' | 'published' | 'archived';
  visibility: 'public' | 'private' | 'protected';
  password: string | null;
  password_hash: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  categories: Array<{ categories_id: DirectusCategory }>;
  tags: Array<{ tags_id: DirectusTag }>;
  series: Array<{ series_id: DirectusSeries }>;
}

export interface DirectusPostSavePayload {
  blog_id?: string;
  title: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
  visibility: 'public' | 'private' | 'protected';
  thumbnail?: string | null;
  password?: string | null;
  categories?: Array<{ categories_id: string }>;
  tags?: Array<{ tags_id: string }>;
  series?: Array<{ series_id: string }>;
}

export interface DirectusCategory {
  id: string;
  blog_id: string;
  parent_id: string | null;
  name: string;
  icon?: string;
  slug: string;
  sort_order: number;
}

export interface DirectusCategorySavePayload {
  blog_id: string;
  name: string;
  parent_id?: string | null;
  icon?: string;
  sort_order?: number;
}

export interface DirectusTag {
  id: string;
  blog_id: string;
  name: string;
  slug: string;
}

export interface DirectusTagSavePayload {
  blog_id: string;
  name: string;
  slug?: string;
}

export interface DirectusSeries {
  id: string;
  blog_id: string;
  name: string;
  slug: string;
  description?: string;
  thumbnail?: string | null;
}

export interface DirectusSeriesSavePayload {
  blog_id: string;
  name: string;
  description?: string;
  thumbnail?: string | null;
}
