import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Proxy (в Next.js 16 заменяет middleware.ts):
 * 1. Обновляет сессию Supabase и синхронизирует auth-куки;
 * 2. Обеспечивает бесшовный переход между Первой страницей (Витриной /) и Второй страницей (ИИ-Терминалом /dashboard),
 *    поддерживая как авторизованных пользователей Supabase, так и мгновенный Демо/Гостевой PRO-режим.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      });

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { pathname } = request.nextUrl;

      // Авторизованному пользователю страница входа не нужна — сразу в ИИ-Штаб
      if (user && pathname === "/login") {
        const redirect = NextResponse.redirect(new URL("/dashboard", request.url));
        response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
        return redirect;
      }
    }
  } catch {
    // В случае отсутствия сети или ключей продолжаем работу в автономном режиме
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
