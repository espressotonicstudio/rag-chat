import { auth } from "@/app/(auth)/auth";
import {
  deleteChunksByFilePath,
  getConfigByApiKey,
  updateUserFilePaths,
} from "@/app/db";
import { head, del } from "@vercel/blob";

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);

  let session = await auth();

  if (!session) {
    return Response.redirect("/login");
  }

  const { user } = session;

  if (!user || !user.apiKey) {
    return Response.redirect("/login");
  }

  if (request.body === null) {
    return new Response("Request body is empty", { status: 400 });
  }

  const fileurl = searchParams.get("fileurl");

  if (fileurl === null) {
    return new Response("File url not provided", { status: 400 });
  }

  const { pathname } = await head(fileurl);

  if (!pathname.startsWith(user.apiKey)) {
    return new Response("Unauthorized", { status: 400 });
  }

  const config = await getConfigByApiKey(user.apiKey);

  if (!config) {
    return new Response("Unauthorized", { status: 400 });
  }

  await Promise.all([
    del(fileurl),
    deleteChunksByFilePath({ filePath: pathname }),
    updateUserFilePaths(
      user.apiKey,
      config.filePaths?.filter((path) => path !== pathname) || []
    ),
  ]);

  return Response.json({});
}
