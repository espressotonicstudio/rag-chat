import { FilesList } from "@/components/files-list";
import { auth } from "@/app/(auth)/auth";

export default async function Admin() {
  const session = await auth();
  return <FilesList session={session} />;
}
