export interface Category {
  id: string;
  blogId: string;
  parentId: string | null;
  name: string;
  icon?: string;
  slug: string;
  sortOrder: number;
  children?: Category[];
}

export interface CategorySaveRequest {
  blogId: string;
  name: string;
  parentId?: string | null;
  icon?: string;
  sortOrder?: number;
}
