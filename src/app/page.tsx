import Timer from "@/components/Timer";
import TaskList from "@/components/TaskList";
import ThemeToggle from "@/components/ThemeToggle";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-12 lg:p-24">
      <ThemeToggle />
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

      {/* Footer */}
      <footer className="mt-12 text-xs text-neutral-700 text-center">
        Built with ❤️ for focused learning · Promodo
      </footer>
    </main>
  );
}
