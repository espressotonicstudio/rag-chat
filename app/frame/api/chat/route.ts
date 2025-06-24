import { customModel } from "@/ai";
import { createMessage, getConfigByApiKey } from "@/app/db";
import { google } from "@ai-sdk/google";
import {
  createDataStream,
  createDataStreamResponse,
  Message,
  smoothStream,
  streamText,
} from "ai";

export async function POST(request: Request) {
  const { id, messages, apiKey, author } = (await request.json()) as {
    id: string;
    messages: Message[];
    apiKey: string;
    author: string;
  };

  const config = await getConfigByApiKey(apiKey);

  if (!config) {
    return new Response("Unauthorized", { status: 401 });
  }

  const stream = createDataStreamResponse({
    execute: (dataStream) => {
      // const lastUserMessageContent = messages.slice(-1)[0].content;

      // const immediateResult = streamText({
      //   model: google("gemini-2.5-flash-lite-preview-06-17"),
      //   system: `
      //   You are current processing the user's request but that will take a few seconds.
      //   Let the user know that you are analyzing their request. Make it sound creative and friendly.
      //   Do not ask for clarification or attempt to answer the question.

      //   End this response with a blank line.
      //   `,
      //   prompt: lastUserMessageContent,
      // });

      // immediateResult.mergeIntoDataStream(dataStream);

      const result = streamText({
        model: customModel,
        system: `
        you are a helpful assistant that can answer questions about the business website based on the documents provided.
        Assume that knowledge from the document is part of your knowledge base.
        Do not make up information that is not in the documents.
        Do not reply with "Based on the documents provided..."
        `,
        messages,
        providerOptions: {
          chatId: {
            value: id,
          },
          apiKey: {
            value: apiKey,
          },
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
        experimental_transform: smoothStream(),
      });

      result.mergeIntoDataStream(dataStream);
    },
  });

  return stream;
}
