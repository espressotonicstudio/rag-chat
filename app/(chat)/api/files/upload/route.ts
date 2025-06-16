import { auth } from "@/app/(auth)/auth";
import { insertChunks } from "@/app/db";
import { getMarkdownContentFromUrl } from "@/utils/markdown";
import { getPdfContentFromUrl } from "@/utils/pdf";
import { google } from "@ai-sdk/google";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { put } from "@vercel/blob";
import { embedMany } from "ai";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get("filename");

  let session = await auth();

  if (!session) {
    return Response.redirect("/login");
  }

  const { user } = session;

  if (!user) {
    return Response.redirect("/login");
  }

  if (request.body === null) {
    return new Response("Request body is empty", { status: 400 });
  }

  const { downloadUrl } = await put(
    `${user.apiKey}/${filename}`,
    request.body,
    {
      access: "public",
    }
  );

  let content = "";

  if (filename?.endsWith(".pdf")) {
    content = await getPdfContentFromUrl(downloadUrl);
  }

  if (filename?.endsWith(".md") || filename?.endsWith(".markdown")) {
    content = await getMarkdownContentFromUrl(downloadUrl);
  }

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
  });
  const chunkedContent = await textSplitter.createDocuments([content]);

  const { embeddings } = await embedMany({
    model: google.textEmbeddingModel("text-embedding-004"),
    values: chunkedContent.map((chunk) => chunk.pageContent),
  });

  await insertChunks({
    chunks: chunkedContent.map((chunk, i) => ({
      id: `${user.apiKey}/${filename}/${i}`,
      filePath: `${user.apiKey}/${filename}`,
      content: chunk.pageContent,
      embedding: embeddings[i],
    })),
  });

  return Response.json({});
}
