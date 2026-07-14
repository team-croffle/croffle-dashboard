import type { DirectusSeries, DirectusSeriesSavePayload } from '../types/directus.types';
import type { Series, SeriesSaveRequest } from '../types/series.types';

export function mapSeries(raw: DirectusSeries): Series {
  return {
    id: raw.id,
    blogId: raw.blog_id,
    name: raw.name,
    slug: raw.slug,
    description: raw.description,
    thumbnail: raw.thumbnail ?? null,
  };
}

export function mapSeriesToPayload(req: SeriesSaveRequest): DirectusSeriesSavePayload {
  return {
    blog_id: req.blogId,
    name: req.name,
    description: req.description,
    thumbnail: req.thumbnail ?? null,
  };
}
