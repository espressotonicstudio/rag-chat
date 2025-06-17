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
    system: `
    you are a helpful assistant that can answer questions about the business website based on the documents provided.
    Assume that knowledge from the document is part of your knowledge base.
    Do not make up information that is not in the documents.
    Do not reply with "Based on the documents provided..."
    `,
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
        apiKey,
      });
    },
    experimental_telemetry: {
      isEnabled: true,
      functionId: "stream-text",
    },
  });

  return result.toDataStreamResponse({});
}
