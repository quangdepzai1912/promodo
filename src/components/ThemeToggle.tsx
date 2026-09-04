"use client";

import { Moon, Sun } from "lucide-react";
import { useState } from "react";

export default function ThemeToggle() {
  const [isLight, setIsLight] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("promodo-theme") === "light";
  });

  const toggleTheme = () => {
    const nextIsLight = !isLight;
    setIsLight(nextIsLight);
    document.documentElement.classList.toggle("light-theme", nextIsLight);
    localStorage.setItem("promodo-theme", nextIsLight ? "light" : "dark");
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="icon-action theme-toggle fixed right-5 top-5 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/35 text-neutral-300 backdrop-blur-md transition-colors hover:bg-black/55 hover:text-white"
      title={isLight ? "Switch to dark mode" : "Switch to light mode"}
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
    >
      {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
}