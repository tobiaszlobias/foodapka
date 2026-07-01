import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();

  // /app je veřejné — přihlášení se vyžaduje až pro konkrétní funkce uvnitř.
  // Přihlášený user na auth stránkách → rovnou do app
  if (user && (url.pathname === "/login" || url.pathname === "/signup")) {
    url.pathname = "/app";
    return NextResponse.redirect(url);
  }

  // Pokud uživatel vstoupí do aplikace, poznačíme si to do cookies (na 1 rok)
  if (user && url.pathname.startsWith("/app")) {
    supabaseResponse.cookies.set("has_visited_app", "true", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: false,
      sameSite: "lax",
    });
  }

  return supabaseResponse;
}
