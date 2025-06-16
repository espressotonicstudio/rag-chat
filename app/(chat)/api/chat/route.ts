import { customModel } from "@/ai";
import { createMessage, getConfigByApiKey } from "@/app/db";
import { streamText } from "ai";

export async function POST(request: Request) {
  const { id, messages, apiKey, author } = await request.json();

  const config = await getConfigByApiKey(apiKey);

  if (!config) {
    return new Response("Unauthorized", { status: 401 });
  }

  const result = streamText({
    model: customModel,
    system:
      "you are a friendly assistant! keep your responses concise and helpful.",
    messages,
    experimental_providerMetadata: {
      apiKey,
      files: {
        selection: config.filePaths || [],
      },
    },
    onFinish: async ({ text }) => {
      await createMessage({
        id,
        messages: [...messages, { role: "assistant", content: text }],
        author,
      });
    },
    experimental_telemetry: {
      isEnabled: true,
      functionId: "stream-text",
    },
  });

  return result.toDataStreamResponse({});
}
