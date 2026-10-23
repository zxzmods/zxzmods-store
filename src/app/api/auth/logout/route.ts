import { NextResponse } from "next/server";
import { CUSTOMER_COOKIE_NAME } from "@/lib/customerAuth";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Sesión cerrada correctamente" });
  response.cookies.set(CUSTOMER_COOKIE_NAME, "", {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  return response;
}
