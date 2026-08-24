/**
 * Utility to resolve relative image paths across different environments,
 * specifically handling local development vs. subpath hosting on GitHub Pages.
 */
export function resolveImageUrl(url: string | undefined): string {
  if (!url) return "";
  
  if (
    url.startsWith("data:") || 
    url.startsWith("http://") || 
    url.startsWith("https://") ||
    url.startsWith("blob:")
  ) {
    return url;
  }
  
  // Clean leading slash for uniform resolution
  const cleanUrl = url.startsWith("/") ? url.substring(1) : url;
  
  // Detect if running on GitHub Pages
  if (
    typeof window !== "undefined" && 
    window.location.hostname.endsWith(".github.io")
  ) {
    const owner = window.location.hostname.split(".")[0];
    const repo = window.location.pathname.split("/")[1] || "";
    if (repo && repo !== "index.html") {
      return `/${repo}/${cleanUrl}`;
    }
  }
  
  // Fallback to baseUrl
  const baseUrl = (import.meta as any).env?.BASE_URL || "/";
  const cleanBase = baseUrl.endsWith("/") ? baseUrl : baseUrl + "/";
  return `${cleanBase}${cleanUrl}`;
}
