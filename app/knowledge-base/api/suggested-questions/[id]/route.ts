import { auth } from "@/app/(auth)/auth";
import { updateSuggestedQuestion, deleteSuggestedQuestion } from "@/app/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.apiKey) {
    return Response.json("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const { question } = await request.json();

  if (!question || typeof question !== "string") {
    return Response.json("Question is required", { status: 400 });
  }

  await updateSuggestedQuestion({ id, question });

  return Response.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.apiKey) {
    return Response.json("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  await deleteSuggestedQuestion({ id });

  return Response.json({ success: true });
}
