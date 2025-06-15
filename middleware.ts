import NextAuth from "next-auth";
import { authConfig } from "@/app/(auth)/auth.config";
import { MiddlewareConfig } from "next/server";

export default NextAuth(authConfig).auth;

export const config: MiddlewareConfig = {
  matcher: ["/", "/:id", "/api/:path*", "/login", "/register"],
};
