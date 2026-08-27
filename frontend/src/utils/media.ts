export function mediaUrl(url: string | null | undefined): string {
  if (!url) return "";
  
  // If already a full URL (Cloudinary, Railway, etc.) return as is
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  
  // If relative URL in development
  if (url.startsWith("/media/")) {
    return `http://127.0.0.1:8000${url}`;
  }

  return url;
}