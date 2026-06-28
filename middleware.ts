import { NextRequest, NextResponse } from "next/server";

// Rotas protegidas: agora só o painel admin, em /admin. A raiz (/) e
// /materia/* são o site público, sempre livres. /login e /api ficam
// fora da checagem para não criar loop de redirecionamento.
const PROTECTED_PREFIXES = ["/admin"];
const PUBLIC_PATHS = ["/login", "/api"];

const AUTH_COOKIE_NAME = "admin_session";

function isProtectedPath(pathname: string): boolean {
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return false;
  }
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const session = request.cookies.get(AUTH_COOKIE_NAME);

  if (session?.value === process.env.ADMIN_PASSWORD_HASH) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
