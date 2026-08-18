export function mediaUrl(url: string | null | undefined): string {
  if (!url) return "";
  return url.replace("http://127.0.0.1:8000", "");
}
