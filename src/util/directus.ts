// lib/directus.ts
import { createDirectus, rest, authentication, readMe } from '@directus/sdk';

const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL;

export const directus = createDirectus(DIRECTUS_URL)
  .with(authentication('session', { credentials: 'include', autoRefresh: true })) // session mode
  .with(rest({ credentials: 'include' }));

export async function getMe() {
  try {
    return await directus.request(readMe({ fields: ['id', 'email'] }));
  } catch {
    return null;
  }
}
