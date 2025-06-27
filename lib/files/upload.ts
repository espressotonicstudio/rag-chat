import { auth } from "@/app/(auth)/auth";
import { insertChunks } from "@/app/db";
import { getMarkdownContentFromUrl } from "@/utils/markdown";
import { getPdfContentFromUrl } from "@/utils/pdf";
import { google } from "@ai-sdk/google";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { put } from "@vercel/blob";
import { embedMany } from "ai";
import { Readable } from "node:stream";

export async function uploadFile(
  apiKey: string,
  filename: string,
  contents:
    | string
    | Readable
    | Buffer
    | Blob
    | ArrayBuffer
    | ReadableStream
    | File
) {
  let session = await auth();

  if (!session) {
    return Response.redirect("/login");
  }

  const { user } = session;

  if (!user) {
    return Response.redirect("/login");
  }

  if (contents === null) {
    return new Response("Request body is empty", { status: 400 });
  }

  const { downloadUrl } = await put(`${apiKey}/${filename}`, contents, {
    access: "public",
  });

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
      id: `${apiKey}/${filename}/${i}`,
      filePath: `${apiKey}/${filename}`,
      content: chunk.pageContent,
      embedding: embeddings[i],
    })),
  });

  return {
    success: true,
  };
}
