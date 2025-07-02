import { analyzeChat } from "@/ai/post-support-analysis";
import {
  createChatAnalysis,
  getChatAnalysisByChatId,
  updateChatStatus,
} from "@/app/db";

export async function POST(request: Request) {
  const { id } = await request.json();

  if (!id) {
    return Response.json({ error: "Missing id" }, { status: 400 });
  }

  const analysis = await analyzeChat(id);

  await createChatAnalysis({
    analysis: {
      chatId: id,
      ...analysis,
    },
  });

  return new Response(null, { status: 200 });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "Missing id" }, { status: 400 });
  }

  const analysis = await getChatAnalysisByChatId({ chatId: id });

  if (!analysis) {
    return Response.json(null, { status: 200 });
  }

  return Response.json(analysis, { status: 200 });
}
