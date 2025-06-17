import { auth } from "@/app/(auth)/auth";
import { SuggestedQuestionsList } from "@/components/suggested-questions-list";

export default async function Page() {
  const session = await auth();

  return <SuggestedQuestionsList session={session} />;
}
