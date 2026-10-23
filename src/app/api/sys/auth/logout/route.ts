import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/stealthAuth";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out from terminal" });

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  return response;
}
