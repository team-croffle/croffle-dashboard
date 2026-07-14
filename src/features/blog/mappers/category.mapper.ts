import type { DirectusCategory, DirectusCategorySavePayload } from '../types/directus.types';
import type { Category, CategorySaveRequest } from '../types/category.types';

export function mapCategory(raw: DirectusCategory): Category {
  return {
    id: raw.id,
    blogId: raw.blog_id,
    parentId: raw.parent_id,
    name: raw.name,
    icon: raw.icon,
    slug: raw.slug,
    sortOrder: raw.sort_order,
  };
}

export function mapCategoryToPayload(req: CategorySaveRequest): DirectusCategorySavePayload {
  return {
    blog_id: req.blogId,
    name: req.name,
    parent_id: req.parentId ?? null,
    icon: req.icon,
    sort_order: req.sortOrder ?? 0,
  };
}

export function buildCategoryTree(categories: Category[]): Category[] {
  const map = new Map<string, Category>();
  const roots: Category[] = [];

  categories.forEach((cat) => map.set(cat.id, { ...cat, children: [] }));

  map.forEach((cat) => {
    if (cat.parentId && map.has(cat.parentId)) {
      map.get(cat.parentId)!.children!.push(cat);
    } else {
      roots.push(cat);
    }
  });

  return roots.sort((a, b) => a.sortOrder - b.sortOrder);
}
