// YouTube URL regex
const YOUTUBE_URL_REGEX =
  /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;

const GLOBAL_YOUTUBE_URL_REGEX =
  /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/gi;

// Validate if string is a valid YouTube video URL
export function isYouTubeUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  return YOUTUBE_URL_REGEX.test(url.trim());
}

// Extract 11-char video ID from YouTube URL
export function extractYouTubeVideoId(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  const match = url.trim().match(YOUTUBE_URL_REGEX);
  return match ? (match[1] ?? null) : null;
}

// Extract all unique normalized YouTube URLs from text
export function extractYouTubeUrls(text: string): string[] {
  if (!text || typeof text !== "string") return [];
  const matches = [...text.matchAll(GLOBAL_YOUTUBE_URL_REGEX)];
  const uniqueIds = new Set<string>();
  const urls: string[] = [];

  for (const match of matches) {
    const videoId = match[1];
    if (videoId && !uniqueIds.has(videoId)) {
      uniqueIds.add(videoId);
      urls.push(`https://www.youtube.com/watch?v=${videoId}`);
    }
  }

  return urls;
}

// Get YouTube video thumbnail URL
export function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

// Fetch YouTube video details via oEmbed
export async function fetchYouTubeVideoDetails(videoId: string): Promise<{
  title: string;
  author: string;
}> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
    );
    if (res.ok) {
      const data = (await res.json()) as {
        title?: string;
        author_name?: string;
      };
      return {
        title: data?.title?.trim() || `YouTube Video (${videoId})`,
        author: data?.author_name?.trim() || "YouTube Creator",
      };
    }
  } catch {
    // Best effort fallback
  }

  return {
    title: `YouTube Video (${videoId})`,
    author: "YouTube Creator",
  };
}
