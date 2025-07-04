import { auth } from "@/app/(auth)/auth";
import { getConfigByApiKey, updateUserFilePaths } from "@/app/db";

export async function PATCH(request: Request) {
  const { operation, filePaths } = await request.json();

  if (!operation || !filePaths) {
    return Response.json("Missing operation or filePath", { status: 400 });
  }

  const session = await auth();

  if (!session) {
    return Response.json("Unauthorized", { status: 401 });
  }

  const { user } = session;

  if (!user || !user.apiKey) {
    return Response.json("Unauthorized", { status: 401 });
  }

  const config = await getConfigByApiKey(user.apiKey);

  if (!config) {
    return Response.json("Unauthorized", { status: 401 });
  }

  let updatedFilePaths: string[] = [];
  // Handle remove operation
  if (operation === "remove") {
    updatedFilePaths =
      config.filePaths?.filter((path) => !filePaths.includes(path)) || [];
  } else if (operation === "add") {
    updatedFilePaths = [...(config.filePaths || []), ...filePaths];
  }

  await updateUserFilePaths(user.apiKey, updatedFilePaths);

  return Response.json({
    filePaths: updatedFilePaths,
  });
}
