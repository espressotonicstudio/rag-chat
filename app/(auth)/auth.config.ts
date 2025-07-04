import { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
    newUser: "/knowledge-base",
  },
  providers: [
    // added later in auth.ts since it requires bcrypt which is only compatible with Node.js
    // while this file is also used in non-Node.js environments
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.apiKey = user.apiKey;
      }

      return token;
    },
    async session({ session, token }) {
      session.user.apiKey = token.apiKey as string;
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      let isLoggedIn = !!auth?.user;
      let isOnChat = nextUrl.pathname.startsWith("/frame");
      let isOnRegister = nextUrl.pathname.startsWith("/register");
      let isOnLogin = nextUrl.pathname.startsWith("/login");

      if (isLoggedIn && (isOnLogin || isOnRegister)) {
        return Response.redirect(new URL("/knowledge-base", nextUrl));
      }

      if (isOnRegister || isOnLogin || isOnChat) {
        return true; // Always allow access to register, login, chat, and preview pages
      }

      return isLoggedIn;
    },
  },
} satisfies NextAuthConfig;
