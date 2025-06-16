export async function getMarkdownContentFromUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch markdown: ${response.status} ${response.statusText}`
      );
    }

    // Check if the content type suggests it's text-based
    const contentType = response.headers.get("content-type");
    if (
      contentType &&
      !contentType.includes("text/") &&
      !contentType.includes("application/octet-stream")
    ) {
      console.warn(`Content type ${contentType} may not be markdown`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const content = buffer.toString("utf-8");

    // Basic validation that this looks like markdown/text content
    if (content.length === 0) {
      throw new Error("Fetched content is empty");
    }

    return content;
  } catch (error) {
    throw new Error(
      `Error fetching markdown from URL: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// Alternative function for when you specifically want to validate markdown
export async function getValidatedMarkdownFromUrl(
  url: string
): Promise<string> {
  const content = await getMarkdownContentFromUrl(url);

  // Basic markdown validation - check for common markdown patterns
  const hasMarkdownPatterns =
    /^#{1,6}\s|^\*\s|^\d+\.\s|^\[.*\]\(.*\)|^```|^\|.*\|/m.test(content);

  if (!hasMarkdownPatterns) {
    console.warn("Content does not appear to contain markdown formatting");
  }

  return content;
}
