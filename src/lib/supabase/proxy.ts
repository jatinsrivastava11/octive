import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, publicEnv } from "@/lib/env";

/** Routes that require a signed-in user. Everything else is public. */
const PROTECTED_PREFIXES = ["/home", "/onboarding", "/settings", "/rankings/new", "/diary"];

/**
 * Refreshes the Supabase session cookie on every request and does an
 * optimistic redirect for protected routes. Real authorization is enforced
 * by Row-Level Security in Postgres, not here.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Before keys are configured, let every page render (they show a setup state).
  if (!isSupabaseConfigured()) return response;

  const env = publicEnv();
  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Do not run code between createServerClient and getClaims().
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);

  const path = request.nextUrl.pathname;
  if (!signedIn && PROTECTED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  return response;
}
