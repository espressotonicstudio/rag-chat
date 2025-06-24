import { auth } from "@/app/(auth)/auth";
import { getConfigByApiKey } from "../db";
import { notFound } from "next/navigation";
import { RagAnalyticsDashboard } from "@/components/rag-analytics-dashboard";

export default async function Page() {
  const session = await auth();

  const config = await getConfigByApiKey(session?.user?.apiKey || "");

  if (!config) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Monitor your RAG system performance and user behavior patterns
      </p>

      <RagAnalyticsDashboard />
    </div>
  );
}
