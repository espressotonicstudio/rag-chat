import NextAuth from "next-auth";
import { authConfig } from "@/app/(auth)/auth.config";
import { MiddlewareConfig } from "next/server";
import { logger } from "@/lib/axiom/server";
import { transformMiddlewareRequest } from "@axiomhq/nextjs";
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";

const authMiddleware = NextAuth(authConfig).auth;

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  // Log request with Axiom
  logger.info(...transformMiddlewareRequest(request));

  // Wait for Axiom to flush logs
  event.waitUntil(logger.flush());

  // Execute NextAuth middleware
  // @ts-ignore - NextAuth middleware typing compatibility
  const authResult = await authMiddleware(request, event);

  return authResult || NextResponse.next();
}

export const config: MiddlewareConfig = {
  // matcher: ["/", "/:id", "/api/:path*", "/login", "/register"],
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|frame).*)"],
};
