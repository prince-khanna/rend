export type Theme = "dark" | "light" | "system";

export function applyTheme(theme: Theme) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = theme === "dark" || (theme === "system" && prefersDark);
  if (dark) {
    document.documentElement.classList.remove("theme-light");
  } else {
    document.documentElement.classList.add("theme-light");
  }
}

// Injected into <head> before React hydrates — prevents flash
export const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('rend-theme') || 'dark';
    var dark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (!dark) document.documentElement.classList.add('theme-light');
  } catch(e){}
})();
`;
