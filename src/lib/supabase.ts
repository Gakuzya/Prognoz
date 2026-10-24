import { createBrowserClient, createServerClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Клиент для браузера (Client Components).
 * Использует только публичный anon-ключ; доступ к данным ограничивается RLS.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

/**
 * Серверный клиент (Server Components, Route Handlers, Server Actions).
 * Читает и пишет auth-куки через `cookies()` из next/headers.
 *
 * `next/headers` импортируется динамически внутри функции, чтобы этот файл
 * можно было безопасно импортировать и из Client Components
 * (для createSupabaseBrowserClient).
 */
export async function createSupabaseServerClient() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Вызов из Server Component: куки менять нельзя.
          // Безопасно игнорируем, если сессию обновляет middleware.
        }
      },
    },
  });
}
