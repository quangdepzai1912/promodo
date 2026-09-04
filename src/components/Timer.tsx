"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Settings } from "lucide-react";
import SettingsModal, { PomodoroSettings } from "./SettingsModal";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./AuthProvider";
import { playAlarmSound } from "@/lib/alarmSounds";

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
      playAlarmSound(settings.alarmSound, settings.volume, alarmRef.current);
      setIsActive(false);

      // Auto-switch mode
      if (mode === "pomodoro") {
        window.dispatchEvent(new CustomEvent("promodo-session-completed", { detail: settings.pomodoro }));
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

      <div className="surface-panel relative flex min-h-[390px] flex-col items-center justify-center overflow-hidden p-4 sm:min-h-[420px] sm:p-8 md:p-10">
        {/* Settings button top-right */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="icon-action absolute right-4 top-4 rounded-full p-2 text-neutral-500 transition-colors hover:text-white sm:right-5 sm:top-5"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Mode tabs */}
        <div className="mb-8 flex max-w-full gap-0.5 overflow-x-auto rounded-lg border border-[#262626] bg-[#0a0a0a] p-1 sm:mb-10 sm:gap-1.5">
          {(["pomodoro", "shortBreak", "longBreak"] as Mode[]).map((m) => (
              <button
              key={m}
              onClick={() => switchMode(m)}
                className={`whitespace-nowrap rounded-md px-3 py-2 text-xs font-medium transition-colors sm:px-5 sm:py-1.5 sm:text-sm ${
                mode === m ? "bg-white text-black" : "text-neutral-400 hover:text-white"
              }`}
            >
              {m === "pomodoro" ? "Pomodoro" : m === "shortBreak" ? "Short Break" : "Long Break"}
            </button>
          ))}
        </div>

        {/* Timer display */}
        <div className="pixel-font mb-3 max-w-full overflow-hidden whitespace-nowrap text-[2.2rem] font-bold leading-none text-white tabular-nums sm:text-[3.2rem] md:text-[4.5rem] lg:text-[5.2rem]">
          {formatTime(timeLeft)}
        </div>

        {/* Progress bar */}
        <div className="mb-8 h-px w-full max-w-sm overflow-hidden rounded-full bg-neutral-800 sm:mb-10">
          <div
            className="h-full bg-white transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Controls */}
        <div className="flex w-full max-w-sm gap-2 sm:gap-3">
          <button
            onClick={toggleTimer}
            className={`flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg py-3 text-base font-bold transition-all sm:py-4 sm:text-lg ${
              isActive
                ? "bg-neutral-800 text-white hover:bg-neutral-700"
                : "bg-white text-black hover:bg-neutral-200"
            }`}
          >
            {isActive ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            <span className="pixel-font text-[10px] sm:text-xs">{isActive ? "PAUSE" : "START"}</span>
          </button>

          <button
            onClick={resetTimer}
            className="flex min-h-12 w-14 items-center justify-center rounded-lg border border-[#262626] bg-[#111111] text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white sm:w-16"
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
