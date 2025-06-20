import { getChatById } from "@/app/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const apiKey = searchParams.get("apiKey");
  const id = searchParams.get("id");

  if (!apiKey) {
    return Response.json("No author provided", { status: 400 });
  }

  if (!id) {
    return Response.json("No id provided", { status: 400 });
  }

  const chat = await getChatById({ id });
  return Response.json(chat);
}
