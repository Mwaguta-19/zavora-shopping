export function mediaUrl(url: string | null | undefined): string {
  if (!url) return "";
  
  // If already a full Cloudinary URL — use as is
  if (url.includes("cloudinary.com")) return url;
  
  // If Railway URL — use as is
  if (url.includes("railway.app")) return url;
  
  // If local development — strip domain
  if (url.includes("127.0.0.1:8000")) {
    return url.replace("http://127.0.0.1:8000", "");
  }

  // If relative URL — return as is
  return url;
}