export interface Tag {
  id: string;
  blogId: string;
  name: string;
  slug: string;
}

export interface TagSaveRequest {
  blogId: string;
  name: string;
}
