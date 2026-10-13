import { z } from "zod";

/**
 * Environment access, validated with zod.
 *
 * Public values are read with explicit `process.env.X` references so Next.js
 * can inline them into the browser bundle. Server-only values must never be
 * imported from client components.
 */

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.url().default("http://127.0.0.1:3000"),
  NEXT_PUBLIC_ENABLE_APPLE: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
});

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SPOTIFY_CLIENT_ID: z.string().min(1),
  SPOTIFY_CLIENT_SECRET: z.string().min(1),
});

export type PublicEnv = z.infer<typeof publicSchema>;
export type ServerEnv = z.infer<typeof serverSchema>;

function blankToUndefined(v: string | undefined) {
  return v === undefined || v.trim() === "" ? undefined : v;
}

function readPublic() {
  return publicSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: blankToUndefined(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: blankToUndefined(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    NEXT_PUBLIC_SITE_URL: blankToUndefined(process.env.NEXT_PUBLIC_SITE_URL),
    NEXT_PUBLIC_ENABLE_APPLE: blankToUndefined(process.env.NEXT_PUBLIC_ENABLE_APPLE),
  });
}

/** True when Supabase keys are present. Lets the UI show a setup state instead of crashing. */
export function isSupabaseConfigured(): boolean {
  return readPublic().success;
}

/** Validated public env. Throws a readable error if keys are missing. */
export function publicEnv(): PublicEnv {
  const parsed = readPublic();
  if (!parsed.success) {
    throw new Error(
      "Octive: Supabase env vars are missing. Fill NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
    );
  }
  return parsed.data;
}

/** Validated server-only env. Never call from client components. */
export function serverEnv(): ServerEnv {
  const parsed = serverSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: blankToUndefined(process.env.SUPABASE_SERVICE_ROLE_KEY),
    SPOTIFY_CLIENT_ID: blankToUndefined(process.env.SPOTIFY_CLIENT_ID),
    SPOTIFY_CLIENT_SECRET: blankToUndefined(process.env.SPOTIFY_CLIENT_SECRET),
  });
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Octive: missing server env vars: ${missing}. See .env.example.`);
  }
  return parsed.data;
}

/** Feature flags (safe on client and server). */
export const flags = {
  apple: process.env.NEXT_PUBLIC_ENABLE_APPLE === "true",
} as const;
