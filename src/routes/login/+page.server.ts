import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => ({
  next: url.searchParams.get('next') ?? '/',
  authError: url.searchParams.get('error')
});
