import { auth } from "@/app/(auth)/auth";
import { uploadFile } from "@/lib/files/upload";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get("filename");

  let session = await auth();

  if (!session) {
    return Response.redirect("/login");
  }

  const { user } = session;

  if (!user) {
    return Response.redirect("/login");
  }

  if (request.body === null) {
    return new Response("Request body is empty", { status: 400 });
  }

  await uploadFile(user.apiKey, filename ?? randomUUID(), request.body);

  return Response.json({});
}
