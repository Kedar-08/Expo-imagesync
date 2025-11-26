/**
 * Shared date and size formatting utilities
 */

export const formatDate = (timestampMs: number): string => {
  const date = new Date(timestampMs);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatDateLong = (timestampMs: number): string => {
  const date = new Date(timestampMs);
  return date.toLocaleDateString() + " " + date.toLocaleTimeString();
};

export const formatFileSize = (bytes?: number | null): string => {
  if (!bytes) return "Unknown";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
};
