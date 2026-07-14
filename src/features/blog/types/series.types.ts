export interface Series {
  id: string;
  blogId: string;
  name: string;
  slug: string;
  description?: string;
  thumbnail?: string | null;
}

export interface SeriesSaveRequest {
  blogId: string;
  name: string;
  description?: string;
  thumbnail?: string | null;
}
