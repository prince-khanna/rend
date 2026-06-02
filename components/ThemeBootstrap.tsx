"use client";

import { useEffect } from "react";
import { applyTheme, type Theme } from "@/lib/theme";

export function ThemeBootstrap({ theme }: { theme: Theme }) {
  useEffect(() => {
    const stored = localStorage.getItem("rend-theme") as Theme | null;
    if (stored) {
      // User has a local preference — always honour it over the server prop
      applyTheme(stored);
    } else {
      // First visit or cleared storage — use server value and persist it
      applyTheme(theme);
      localStorage.setItem("rend-theme", theme);
    }
  }, [theme]);
  return null;
}
