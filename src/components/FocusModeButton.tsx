"use client";

import { Maximize2, Minimize2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function FocusModeButton() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const syncFullscreenState = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", syncFullscreenState);
    return () => document.removeEventListener("fullscreenchange", syncFullscreenState);
  }, []);

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await document.documentElement.requestFullscreen();
    }
  };

  return (
    <button
      type="button"
      onClick={toggleFullscreen}
      className="fixed bottom-5 right-5 z-20 flex items-center gap-2 rounded-lg border border-white/15 bg-black/45 px-3 py-2 text-xs font-medium text-neutral-300 shadow-lg backdrop-blur-md transition-colors hover:bg-black/65 hover:text-white"
      title={isFullscreen ? "Exit focus time" : "Enter focus time"}
      aria-label={isFullscreen ? "Exit focus time" : "Enter focus time"}
    >
      {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      <span>Focus time</span>
    </button>
  );
}