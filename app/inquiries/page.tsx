import { auth } from "@/app/(auth)/auth";
import { getConfigByApiKey } from "../db";
import { notFound, redirect } from "next/navigation";
import { Inquiries } from "@/components/inquiries";

export default async function Page() {
  const session = await auth();

  const config = await getConfigByApiKey(session?.user?.apiKey || "");

  if (!config) {
    notFound();
  }

  return <Inquiries apiKey={session?.user?.apiKey} />;
}
