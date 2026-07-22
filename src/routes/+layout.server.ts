import type { LayoutServerLoad } from './$types';
import { mapProfile } from '$lib/services/mappers';

export const load: LayoutServerLoad = async ({ cookies, locals }) => {
  const { session, user } = await locals.safeGetSession();
  let profile = null;

  if (user) {
    const { data } = await locals.supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    profile = data ? mapProfile(data) : null;
  }

  return {
    cookies: cookies.getAll(),
    session,
    user,
    profile
  };
};
