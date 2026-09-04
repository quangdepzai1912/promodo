"use client";
import { useState, useEffect, useRef } from "react";
import { X, Volume2 } from "lucide-react";
import { alarmSoundOptions, playAlarmSound } from "@/lib/alarmSounds";

type SettingsProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: PomodoroSettings) => void;
  currentSettings: PomodoroSettings;
};

export type PomodoroSettings = {
  pomodoro: number;
  shortBreak: number;
  longBreak: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  volume: number;
  alarmSound: string;
};

export default function SettingsModal({ isOpen, onClose, onSave, currentSettings }: SettingsProps) {
  const [settings, setSettings] = useState<PomodoroSettings>(currentSettings);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setSettings(currentSettings);
  }, [currentSettings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  const previewSound = () => playAlarmSound(settings.alarmSound, settings.volume, audioRef.current);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-[#111111] border border-[#262626] rounded-xl p-6 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#262626]">
          <h2 className="text-lg font-bold text-white">Settings</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timer section */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-3">Timer (minutes)</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Pomodoro", key: "pomodoro" },
              { label: "Short Break", key: "shortBreak" },
              { label: "Long Break", key: "longBreak" },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="text-xs text-neutral-400 mb-1 block">{label}</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={settings[key as keyof PomodoroSettings] as number}
                  onChange={(e) => setSettings({ ...settings, [key]: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="w-full bg-[#0a0a0a] border border-[#333] text-white text-center text-sm rounded-md py-2 focus:outline-none focus:border-white transition-colors"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Auto-start section */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-3">Auto Start</p>
          <div className="flex flex-col gap-3">
            {[
              { label: "Auto-start breaks", key: "autoStartBreaks" },
              { label: "Auto-start pomodoros", key: "autoStartPomodoros" },
            ].map(({ label, key }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-neutral-300">{label}</span>
                <button
                  onClick={() => setSettings({ ...settings, [key]: !settings[key as keyof PomodoroSettings] })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${settings[key as keyof PomodoroSettings] ? 'bg-white' : 'bg-neutral-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-black rounded-full transition-transform ${settings[key as keyof PomodoroSettings] ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Sound section */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-3">Alarm Sound</p>
          <div className="mb-4 flex items-center gap-3">
            <Volume2 className="h-4 w-4 shrink-0 text-neutral-500" />
            <select
              value={settings.alarmSound}
              onChange={(event) => setSettings({ ...settings, alarmSound: event.target.value })}
              className="min-w-0 flex-1 rounded-md border border-[#333] bg-[#0a0a0a] px-3 py-2 text-sm text-white outline-none focus:border-white"
              aria-label="Alarm sound"
            >
              {alarmSoundOptions.map((sound) => <option key={sound.value} value={sound.value}>{sound.label}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={100}
              value={settings.volume}
              onChange={(e) => setSettings({ ...settings, volume: parseInt(e.target.value) })}
              className="flex-1 accent-white"
            />
            <span className="text-xs text-neutral-400 w-8 text-right">{settings.volume}%</span>
            <button onClick={previewSound} className="text-xs text-neutral-400 hover:text-white border border-[#333] px-3 py-1.5 rounded-md transition-colors">
              Test
            </button>
          </div>
          <audio ref={audioRef} src="/alarm.mp3" />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 text-sm text-neutral-400 hover:text-white transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="px-5 py-2 text-sm font-semibold bg-white text-black rounded-lg hover:bg-neutral-200 transition-colors">
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
