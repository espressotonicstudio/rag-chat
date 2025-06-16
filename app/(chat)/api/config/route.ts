// Use apiKey to get the config for the chat widget

import { getConfigByApiKey } from "@/app/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const apiKey = searchParams.get("apiKey");

  if (!apiKey) {
    return new Response("No apiKey provided", { status: 400 });
  }

  const user = await getConfigByApiKey(apiKey);

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  return Response.json(user);
}
