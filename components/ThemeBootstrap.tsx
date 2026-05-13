"use client";

import { useEffect } from "react";
import { applyTheme, type Theme } from "@/lib/theme";

export function ThemeBootstrap({ theme }: { theme: Theme }) {
  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem("rend-theme", theme);
  }, [theme]);
  return null;
}
