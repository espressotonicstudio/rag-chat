import { auth } from "@/app/(auth)/auth";
import { getConfigByApiKey } from "../db";
import { notFound, redirect } from "next/navigation";
import { FilesList } from "@/components/files-list";

export default async function Page() {
  const session = await auth();

  const config = await getConfigByApiKey(session?.user?.apiKey || "");

  if (!config) {
    notFound();
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-3 h-full">
      <div className="rounded-lg overflow-hidden h-full">
        <FilesList
          session={session}
          config={config}
        />
      </div>
      <div className="rounded-lg overflow-hidden">
        <iframe
          src={`/frame?apiKey=${session?.user?.apiKey}&author=${session?.user?.email}`}
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
