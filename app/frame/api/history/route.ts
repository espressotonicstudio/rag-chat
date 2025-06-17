import { getChatsByApiKey } from "@/app/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const apiKey = searchParams.get("apiKey");

  if (!apiKey) {
    return Response.json("No author provided", { status: 400 });
  }

  const chats = await getChatsByApiKey({ apiKey });
  return Response.json(chats);
}
