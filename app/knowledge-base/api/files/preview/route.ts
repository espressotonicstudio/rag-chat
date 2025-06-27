import { auth } from "@/app/(auth)/auth";
import { getMarkdownContentFromUrl } from "@/utils/markdown";
import { getPdfContentFromUrl } from "@/utils/pdf";
import { head } from "@vercel/blob";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return new Response("URL parameter is required", { status: 400 });
  }

  let session = await auth();

  if (!session) {
    return Response.redirect("/login");
  }

  const { user } = session;

  if (!user) {
    return Response.redirect("/login");
  }
  console.log("url", url);
  console.log("apiKey", user.apiKey);

  try {
    // Get the blob metadata to get the download URL
    // const blob = await head(`${user.apiKey}/${filename}`);

    // if (!blob) {
    //   return new Response("File not found", { status: 404 });
    // }

    let content = "";
    const fileExtension = url.split(".").pop()?.toLowerCase();

    // Handle PDF files
    if (fileExtension === "pdf") {
      // For PDFs, we'll return the blob URL for viewing in a new tab
      // since PDF content extraction might be complex to display inline
      return Response.redirect(url);
    }

    // Handle markdown files
    if (fileExtension === "md" || fileExtension === "markdown") {
      content = await getMarkdownContentFromUrl(url);
    } else {
      // For other text files, fetch content directly
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch file content: ${response.statusText}`);
      }
      content = await response.text();
    }

    return new Response(content, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Error fetching file content:", error);
    return new Response("Failed to fetch file content", { status: 500 });
  }
}
