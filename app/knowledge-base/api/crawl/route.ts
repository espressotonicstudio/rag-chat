import { auth } from "@/app/(auth)/auth";
import { uploadFile } from "@/lib/files/upload";
import FirecrawlApp from "@mendable/firecrawl-js";
import { waitUntil } from "@vercel/functions";

const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

export async function POST(request: Request) {
  const { url, limit } = await request.json();

  const session = await auth();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const crawl = async () => {
    const res = await app.crawlUrl(url, {
      limit,
      scrapeOptions: {
        formats: ["markdown"],
      },
    });

    if (!res.success) {
      throw new Error(`Failed to crawl: ${res.error}`);
    }

    await Promise.all(
      res.data.map(async (d) => {
        if (!d.markdown) {
          return;
        }

        const filename = d.metadata?.sourceURL
          ?.split("://")[1]
          ?.replace("/", "_");

        await uploadFile(session.user.apiKey, `${filename}.md`, d.markdown);
      })
    );

    return res;
  };

  waitUntil(crawl());

  return new Response(null, {
    status: 200,
  });
}

export async function GET(request: Request) {
  const session = await auth();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Bad Request", { status: 400 });
  }

  const status = await app.checkCrawlStatus(id);

  return status.success
    ? Response.json(status.data)
    : Response.json({ error: "Crawl not found" }, { status: 404 });
}
