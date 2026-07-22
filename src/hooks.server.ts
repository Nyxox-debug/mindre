import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import { createServerClient } from '@supabase/ssr';
import { redirect, type Handle } from '@sveltejs/kit';
import type { Database } from '$lib/supabase/database.types';

const PUBLIC_ROUTES = new Set(['/login', '/auth/callback']);

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createServerClient<Database>(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => event.cookies.getAll(),
        setAll: (cookiesToSet, headers) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            event.cookies.set(name, value, { ...options, path: '/' });
          });
          if (headers && Object.keys(headers).length > 0) event.setHeaders(headers);
        }
      }
    }
  );

  event.locals.safeGetSession = async () => {
    const {
      data: { session }
    } = await event.locals.supabase.auth.getSession();

    if (!session) return { session: null, user: null };

    const {
      data: { user },
      error
    } = await event.locals.supabase.auth.getUser();

    if (error || !user) return { session: null, user: null };
    return { session, user };
  };

  if (event.route.id) {
    const { user } = await event.locals.safeGetSession();
    const pathname = event.url.pathname;
    const isPublic = PUBLIC_ROUTES.has(pathname);

    if (!user && !isPublic) {
      const next = `${pathname}${event.url.search}`;
      redirect(303, `/login?next=${encodeURIComponent(next)}`);
    }

    if (user && pathname === '/login') redirect(303, '/');
  }

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range' || name === 'x-supabase-api-version';
    }
  });
};
