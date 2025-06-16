import { FilesList } from "@/components/files-list";
import { auth } from "@/app/(auth)/auth";
import { getConfigByApiKey } from "../db";
import { notFound, redirect } from "next/navigation";
import { Chat } from "@/components/chat";
import { generateId } from "ai";

export default async function Admin() {
  const session = await auth();

  if (!session?.user?.apiKey) {
    redirect("/login");
  }

  const config = await getConfigByApiKey(session?.user?.apiKey);

  if (!config) {
    notFound();
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] h-dvh">
      <FilesList
        session={session}
        config={config}
      />
      <iframe
        src={`/?isIframe=true&apiKey=${session?.user?.apiKey}&author=${session?.user?.email}`}
        className="w-full h-full"
      />
    </div>
  );
}
