import { YoutubeTranscript, type TranscriptResponse } from "youtube-transcript";
import { Document } from "@langchain/core/documents";
import { AppError } from "@repo/error";

// Regex matching YouTube URLs
const YOUTUBE_URL_REGEX =
  /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;

const GLOBAL_YOUTUBE_URL_REGEX =
  /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/gi;

// Validate if a URL string is a valid YouTube video URL
export function isYouTubeUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  return YOUTUBE_URL_REGEX.test(url.trim());
}

// Extract 11-character video ID from YouTube URL
export function extractYouTubeVideoId(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  const match = url.trim().match(YOUTUBE_URL_REGEX);
  return match ? (match[1] ?? null) : null;
}

// Extract all unique normalized YouTube watch URLs from arbitrary text
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

// Format milliseconds into human-readable timestamp [HH:MM:SS] or [MM:SS]
export function formatTranscriptTimestamp(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  return hours > 0 ? `[${hours}:${mm}:${ss}]` : `[${mm}:${ss}]`;
}

// Fetch YouTube video metadata via public oEmbed endpoint
export async function fetchYouTubeMetadata(videoId: string): Promise<{
  title: string;
  author: string;
}> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { signal: AbortSignal.timeout(4000) },
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
    // Fallback to video id if oembed fails
  }

  return {
    title: `YouTube Video (${videoId})`,
    author: "YouTube Creator",
  };
}

// Load YouTube video transcript and convert to LangChain Document
export async function loadYouTubeTranscript(
  source: string,
): Promise<Document[]> {
  const videoId = extractYouTubeVideoId(source);
  if (!videoId) {
    throw new AppError("BAD_REQUEST", `Invalid YouTube URL: ${source}`);
  }

  const { title, author } = await fetchYouTubeMetadata(videoId);

  let rawTranscript: TranscriptResponse[] = [];
  try {
    rawTranscript = await YoutubeTranscript.fetchTranscript(videoId);
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(
      `[YouTubeLoader] Failed fetching transcript for ${videoId}:`,
      errMsg,
    );
    throw new AppError(
      "BAD_REQUEST",
      `Unable to load transcript for YouTube video "${title}" (${videoId}). Please ensure the video has closed captions/subtitles available.`,
    );
  }

  if (!rawTranscript || rawTranscript.length === 0) {
    throw new AppError(
      "BAD_REQUEST",
      `No transcript tracks found for YouTube video "${title}" (${videoId}).`,
    );
  }

  // Format into timestamped lines
  const formattedLines = rawTranscript.map((entry) => {
    const ts = formatTranscriptTimestamp(entry.offset);
    return `${ts} ${entry.text.trim()}`;
  });

  const pageContent = [
    `# Video Title: ${title}`,
    `Channel: ${author}`,
    `URL: https://www.youtube.com/watch?v=${videoId}`,
    ``,
    `## Full Video Transcript with Timestamps`,
    ``,
    ...formattedLines,
  ].join("\n");

  return [
    new Document({
      pageContent,
      metadata: {
        source: `https://www.youtube.com/watch?v=${videoId}`,
        videoId,
        title,
        author,
        type: "youtube_transcript",
      },
    }),
  ];
}
