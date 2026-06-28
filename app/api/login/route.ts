import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

const AUTH_COOKIE_NAME = "admin_session";

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  if (!password) {
    return NextResponse.json({ error: "Senha ausente." }, { status: 400 });
  }

  const expectedHash = process.env.ADMIN_PASSWORD_HASH;

  if (!expectedHash) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD_HASH não configurado no servidor." },
      { status: 500 }
    );
  }

  const submittedHash = hashPassword(password);

  if (submittedHash !== expectedHash) {
    return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(AUTH_COOKIE_NAME, expectedHash, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 dias
    path: "/",
  });

  return response;
}
