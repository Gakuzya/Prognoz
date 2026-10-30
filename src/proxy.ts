import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Proxy (в Next.js 16 заменяет middleware.ts):
 * 1. обновляет сессию Supabase и синхронизирует auth-куки;
 * 2. закрывает /dashboard и /api/* от неавторизованных пользователей.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Обновляем куки и в запросе (для Server Components), и в ответе (для браузера)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // ВАЖНО: getUser() валидирует токен на стороне Supabase.
  // getSession() доверять нельзя, он читает только куки.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublicApi = pathname === "/api/chat";
  const isApi = pathname.startsWith("/api") && !isPublicApi;
  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/onboarding") ||
    isApi;

  // Редирект с сохранением обновлённых кук сессии
  const redirectTo = (path: string) => {
    const redirect = NextResponse.redirect(new URL(path, request.url));
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  };

  if (!user && isProtected) {
    // Для API редирект на HTML-страницу бесполезен, отдаём 401
    if (isApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return redirectTo("/login");
  }

  // Авторизованному пользователю страница входа не нужна
  if (user && pathname === "/login") {
    return redirectTo("/dashboard");
  }

  return response;
}

export const config = {
  // Не трогаем статику и изображения
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
