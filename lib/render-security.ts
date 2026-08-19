export const PAGE_IFRAME_SANDBOX = "allow-scripts";
export const PAGE_RENDER_HEADERS = {
  "Content-Security-Policy": "sandbox allow-scripts",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
} as const;
