import { getChatsByAuthor } from "@/app/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const author = searchParams.get("author");

  if (!author) {
    return Response.json("No author provided", { status: 400 });
  }

  const chats = await getChatsByAuthor({ author });
  return Response.json(chats);
}
