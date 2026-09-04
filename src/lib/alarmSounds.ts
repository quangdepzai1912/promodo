export const alarmSoundOptions = [
  { value: "classic", label: "Classic alarm" },
  { value: "soft-bell", label: "Soft bell" },
  { value: "digital", label: "Digital" },
  { value: "chime", label: "Chime" },
  { value: "wood-block", label: "Wood block" },
  { value: "marimba", label: "Marimba" },
  { value: "morning", label: "Morning tones" },
  { value: "focus", label: "Focus pulse" },
  { value: "minimal", label: "Minimal beep" },
  { value: "triple-tone", label: "Triple tone" },
] as const;

type SoundValue = (typeof alarmSoundOptions)[number]["value"];

const patterns: Record<Exclude<SoundValue, "classic">, number[]> = {
  "soft-bell": [523, 659, 784],
  digital: [880, 880, 880],
  chime: [659, 784, 988],
  "wood-block": [220, 220, 220],
  marimba: [262, 330, 392, 523],
  morning: [392, 494, 587, 784],
  focus: [440, 440, 660],
  minimal: [740],
  "triple-tone": [523, 659, 523],
};

export function playAlarmSound(value: string, volume: number, audioElement: HTMLAudioElement | null) {
  if (value === "classic") {
    if (!audioElement) return;
    audioElement.volume = volume / 100;
    audioElement.currentTime = 0;
    audioElement.play().catch(() => {});
    return;
  }

  const frequencies = patterns[value as Exclude<SoundValue, "classic">] ?? patterns["soft-bell"];
  const AudioContextClass = window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const gain = context.createGain();
  gain.gain.value = Math.max(0.01, volume / 100) * 0.18;
  gain.connect(context.destination);

  frequencies.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    oscillator.type = value === "wood-block" ? "square" : "sine";
    oscillator.frequency.value = frequency;
    const start = context.currentTime + index * 0.22;
    oscillator.connect(gain);
    oscillator.start(start);
    oscillator.stop(start + 0.16);
  });
  window.setTimeout(() => context.close(), frequencies.length * 220 + 500);
}