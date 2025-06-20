import { google } from "@ai-sdk/google";
import { wrapLanguageModel } from "ai";
import { ragMiddleware } from "./rag-middleware";

export const customModel = wrapLanguageModel({
  model: google("gemini-2.5-flash"),
  middleware: ragMiddleware,
});
