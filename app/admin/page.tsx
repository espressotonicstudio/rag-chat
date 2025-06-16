import { FilesList } from "@/components/files-list";
import { auth } from "@/app/(auth)/auth";
import { getConfigByApiKey } from "../db";
import { notFound } from "next/navigation";

export default async function Admin() {
  const session = await auth();

  if (!session?.user?.apiKey) {
    notFound();
  }

  const config = await getConfigByApiKey(session?.user?.apiKey);

  if (!config) {
    notFound();
  }

  return (
    <FilesList
      session={session}
      config={config}
    />
  );
}
