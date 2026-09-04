"use client";

import { useState } from "react";
import { CalendarDays, Target } from "lucide-react";
import Timer from "@/components/Timer";
import TaskList from "@/components/TaskList";
import ThemeToggle from "@/components/ThemeToggle";
import StudyCalendar from "@/components/StudyCalendar";
import BackgroundRotator from "@/components/BackgroundRotator";
import GoalPlanner from "@/components/GoalPlanner";
import FocusModeButton from "@/components/FocusModeButton";

export default function Home() {
  const [activePanel, setActivePanel] = useState<"calendar" | "roadmap" | null>(null);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-12 lg:p-24">
      <BackgroundRotator />
      <ThemeToggle />
      <FocusModeButton />
      <div className="fixed right-16 top-5 z-20 flex gap-2">
        <button
          type="button"
          onClick={() => setActivePanel(activePanel === "calendar" ? null : "calendar")}
          className={`icon-action flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-md transition-colors ${activePanel === "calendar" ? "border-white bg-white text-black" : "border-white/15 bg-black/35 text-neutral-300 hover:bg-black/55 hover:text-white"}`}
          title="Study calendar"
          aria-label="Open study calendar"
          aria-pressed={activePanel === "calendar"}
        >
          <CalendarDays className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setActivePanel(activePanel === "roadmap" ? null : "roadmap")}
          className={`icon-action flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-md transition-colors ${activePanel === "roadmap" ? "border-white bg-white text-black" : "border-white/15 bg-black/35 text-neutral-300 hover:bg-black/55 hover:text-white"}`}
          title="Study roadmap"
          aria-label="Open study roadmap"
          aria-pressed={activePanel === "roadmap"}
        >
          <Target className="h-4 w-4" />
        </button>
      </div>
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* Left Column: Timer (Settings button is inside Timer) */}
        <div className="lg:col-span-7 flex flex-col">
          <Timer />
        </div>

        {/* Right Column: Tasks */}
        <div className="lg:col-span-5 flex flex-col h-full">
          <div className="surface-panel p-6 flex flex-col h-full min-h-[420px]">
            {/* Header */}
            <div className="pb-5 mb-1 border-b border-[#262626]">
              <h1 className="text-xl font-bold tracking-tight">Focus Tasks</h1>
              <p className="text-xs text-neutral-500 mt-1">Track what you&apos;re working on today</p>
            </div>

            <TaskList />
          </div>
        </div>

      </div>

      <div className="w-full max-w-5xl">
        {activePanel === "calendar" && <StudyCalendar />}
        {activePanel === "roadmap" && <GoalPlanner />}
      </div>

      {/* Footer */}
      <footer className="mt-12 text-xs text-neutral-700 text-center">
        Built with ❤️ for focused learning · Promodo
      </footer>
    </main>
  );
}
