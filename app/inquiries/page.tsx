import { auth } from "@/app/(auth)/auth";
import { getConfigByApiKey } from "../db";
import { notFound, redirect } from "next/navigation";
import { Inquiries } from "@/components/inquiries";

export default async function Page() {
  const session = await auth();

  if (!session?.user?.apiKey) {
    redirect("/login");
  }

  const config = await getConfigByApiKey(session?.user?.apiKey);

  if (!config) {
    notFound();
  }
  return (
    <div className="rounded-lg overflow-hidden size-full">
      <Inquiries apiKey={session?.user?.apiKey} />
    </div>
  );
}
