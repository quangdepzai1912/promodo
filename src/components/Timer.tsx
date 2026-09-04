"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Settings } from "lucide-react";
import SettingsModal, { PomodoroSettings } from "./SettingsModal";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./AuthProvider";

type Mode = "pomodoro" | "shortBreak" | "longBreak";

const defaultSettings: PomodoroSettings = {
  pomodoro: 25,
  shortBreak: 5,
  longBreak: 15,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  volume: 80,
  alarmSound: "bell",
};

export default function Timer() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PomodoroSettings>(defaultSettings);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("pomodoro");
  const [timeLeft, setTimeLeft] = useState(defaultSettings.pomodoro * 60);
  const [isActive, setIsActive] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const alarmRef = useRef<HTMLAudioElement | null>(null);

  const getTimeForMode = useCallback((m: Mode, s: PomodoroSettings) => {
    if (m === "pomodoro") return s.pomodoro * 60;
    if (m === "shortBreak") return s.shortBreak * 60;
    return s.longBreak * 60;
  }, []);

  useEffect(() => {
    if (!user) return;

    const loadSettings = async () => {
      const { data } = await createClient()
        .from("user_settings")
        .select("pomodoro, short_break, long_break, auto_start_breaks, auto_start_pomodoros, volume, alarm_sound")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!data) return;
      const nextSettings: PomodoroSettings = {
        pomodoro: data.pomodoro,
        shortBreak: data.short_break,
        longBreak: data.long_break,
        autoStartBreaks: data.auto_start_breaks,
        autoStartPomodoros: data.auto_start_pomodoros,
        volume: data.volume,
        alarmSound: data.alarm_sound,
      };
      setSettings(nextSettings);
      setTimeLeft(getTimeForMode(mode, nextSettings));
    };
    loadSettings();
  }, [user, mode, getTimeForMode]);

  // Countdown logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0 && isActive) {
      // Play alarm
      if (alarmRef.current) {
        alarmRef.current.volume = settings.volume / 100;
        alarmRef.current.play().catch(() => {});
      }
      setIsActive(false);

      // Auto-switch mode
      if (mode === "pomodoro") {
        const newCount = pomodoroCount + 1;
        setPomodoroCount(newCount);
        const nextMode = newCount % 4 === 0 ? "longBreak" : "shortBreak";
        setMode(nextMode);
        setTimeLeft(getTimeForMode(nextMode, settings));
        if (settings.autoStartBreaks) setIsActive(true);
      } else {
        setMode("pomodoro");
        setTimeLeft(getTimeForMode("pomodoro", settings));
        if (settings.autoStartPomodoros) setIsActive(true);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode, pomodoroCount, settings, getTimeForMode]);

  // Update document title
  useEffect(() => {
    const timeString = formatTime(timeLeft);
    const modeName = mode === "pomodoro" ? "Focus" : "Break";
    document.title = `${timeString} - ${modeName} | Promodo`;
  }, [timeLeft, mode]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(getTimeForMode(mode, settings));
  };

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(getTimeForMode(newMode, settings));
  };

  const handleSaveSettings = async (newSettings: PomodoroSettings) => {
    setSettings(newSettings);
    setIsActive(false);
    setTimeLeft(getTimeForMode(mode, newSettings));
    if (user) {
      await createClient().from("user_settings").upsert({
        user_id: user.id,
        pomodoro: newSettings.pomodoro,
        short_break: newSettings.shortBreak,
        long_break: newSettings.longBreak,
        auto_start_breaks: newSettings.autoStartBreaks,
        auto_start_pomodoros: newSettings.autoStartPomodoros,
        volume: newSettings.volume,
        alarm_sound: newSettings.alarmSound,
      }, { onConflict: "user_id" });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Progress percentage for circular indicator
  const totalTime = getTimeForMode(mode, settings);
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  return (
    <>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
        currentSettings={settings}
      />

      <div className="surface-panel p-10 flex flex-col items-center justify-center min-h-[420px] relative overflow-hidden">
        {/* Settings button top-right */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="absolute top-5 right-5 text-neutral-500 hover:text-white transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Pomodoro counter dots */}
        <div className="flex gap-1.5 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${i < pomodoroCount % 4 ? 'bg-white' : 'bg-neutral-700'}`}
            />
          ))}
        </div>

        {/* Mode tabs */}
        <div className="flex gap-1.5 mb-10 p-1 bg-[#0a0a0a] border border-[#262626] rounded-lg">
          {(["pomodoro", "shortBreak", "longBreak"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`px-5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                mode === m ? "bg-white text-black" : "text-neutral-400 hover:text-white"
              }`}
            >
              {m === "pomodoro" ? "Pomodoro" : m === "shortBreak" ? "Short Break" : "Long Break"}
            </button>
          ))}
        </div>

        {/* Timer display */}
        <div className="text-[8rem] md:text-[10rem] leading-none font-bold tracking-tighter mb-3 text-white tabular-nums">
          {formatTime(timeLeft)}
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-sm h-px bg-neutral-800 mb-10 rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Controls */}
        <div className="flex gap-3 w-full max-w-sm">
          <button
            onClick={toggleTimer}
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-lg text-lg font-bold transition-all ${
              isActive
                ? "bg-neutral-800 text-white hover:bg-neutral-700"
                : "bg-white text-black hover:bg-neutral-200"
            }`}
          >
            {isActive ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            {isActive ? "PAUSE" : "START"}
          </button>

          <button
            onClick={resetTimer}
            className="flex items-center justify-center bg-[#111111] border border-[#262626] hover:bg-neutral-800 text-neutral-400 hover:text-white w-16 rounded-lg transition-colors"
            title="Reset Timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden alarm audio */}
        <audio ref={alarmRef} src="/alarm.mp3" preload="auto" />
      </div>
    </>
  );
}
