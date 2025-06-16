import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    apiKey: string;
  }

  interface Session {
    user: {
      apiKey: string;
    } & DefaultSession["user"];
  }
}
