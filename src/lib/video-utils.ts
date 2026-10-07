/**
 * Converts standard video URLs (YouTube, Vimeo, etc.) to their embeddable iframe source URLs.
 *
 * @param url Raw video URL string (or null/undefined)
 * @returns Embed URL string or null if unparseable/missing
 */
export function getEmbedUrl(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (trimmed.includes("youtube.com/embed/")) return trimmed;
  if (trimmed.includes("youtube.com/watch")) {
    const videoId = trimmed.split("v=")[1]?.split("&")[0];
    return videoId
      ? `https://www.youtube.com/embed/${videoId}`
      : trimmed.replace("watch?v=", "embed/");
  }
  if (trimmed.includes("youtu.be/")) {
    const videoId = trimmed.split("youtu.be/")[1]?.split("?")[0];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : trimmed;
  }
  if (trimmed.includes("vimeo.com/")) {
    const videoId = trimmed.split("vimeo.com/")[1]?.split("?")[0];
    return videoId ? `https://player.vimeo.com/video/${videoId}` : trimmed;
  }
  return null;
}
