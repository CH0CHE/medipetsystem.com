import { NextResponse } from "next/server";
import { CSRF_COOKIE_NAME, generateCsrfToken } from "@/lib/security/csrf";

export async function GET() {
  const token = generateCsrfToken();
  const response = NextResponse.json({ csrfToken: token });
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: process.env.COOKIE_SECURE !== "false",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 4,
  });
  return response;
}
