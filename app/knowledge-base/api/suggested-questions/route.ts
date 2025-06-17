import { auth } from "@/app/(auth)/auth";
import {
  getSuggestedQuestionsByApiKey,
  createSuggestedQuestion,
} from "@/app/db";

export async function GET() {
  const session = await auth();

  if (!session?.user?.apiKey) {
    return Response.json("Unauthorized", { status: 401 });
  }

  const questions = await getSuggestedQuestionsByApiKey({
    apiKey: session.user.apiKey,
  });

  return Response.json(questions);
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.apiKey) {
    return Response.json("Unauthorized", { status: 401 });
  }

  const { question } = await request.json();

  if (!question || typeof question !== "string") {
    return Response.json("Question is required", { status: 400 });
  }

  await createSuggestedQuestion({
    question,
    apiKey: session.user.apiKey,
  });

  return Response.json({ success: true });
}
