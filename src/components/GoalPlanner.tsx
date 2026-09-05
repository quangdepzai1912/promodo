"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronUp, Plus, Target, Trash2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

type PlanDay = {
  day: number;
  date: string;
  title: string;
  notes: string;
  completed: boolean;
};

type Goal = {
  id: string;
  title: string;
  startDate: string;
  days: PlanDay[];
};

const STORAGE_KEY = "promodo-goals";

const dateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const readGoals = (): Goal[] => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as Goal[];
  } catch {
    return [];
  }
};

export default function GoalPlanner() {
  const { t } = useLanguage();
  const [goals, setGoals] = useState<Goal[]>(readGoals);
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [totalDays, setTotalDays] = useState(7);
  const [openDay, setOpenDay] = useState(1);

  const persist = (nextGoals: Goal[]) => {
    setGoals(nextGoals);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextGoals));
  };

  const createGoal = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    const start = new Date();
    const days = Array.from({ length: totalDays }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return { day: index + 1, date: dateKey(date), title: "", notes: "", completed: false };
    });
    persist([{ id: Date.now().toString(), title: title.trim(), startDate: dateKey(start), days }, ...goals]);
    setTitle("");
    setTotalDays(7);
    setIsCreating(false);
    setOpenDay(1);
  };

  const updateDay = (goalId: string, dayNumber: number, changes: Partial<PlanDay>) => {
    persist(goals.map((goal) => goal.id === goalId
      ? { ...goal, days: goal.days.map((day) => day.day === dayNumber ? { ...day, ...changes } : day) }
      : goal));
  };

  const deleteGoal = (goalId: string) => persist(goals.filter((goal) => goal.id !== goalId));

  return (
    <section className="surface-panel mt-4 p-4 sm:mt-8 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-neutral-500"><Target className="h-4 w-4 text-emerald-400" /> Goals & daily plan</p>
          <h2 className="pixel-heading text-xl font-bold sm:text-2xl">{t("studyRoadmap")}</h2>
          <p className="mt-1 text-sm text-neutral-500">{t("roadmapDescription")}</p>
        </div>
        {!isCreating && <button onClick={() => setIsCreating(true)} className="flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-neutral-200"><Plus className="h-4 w-4" /> {t("newGoal")}</button>}
      </div>

      {isCreating && (
        <form onSubmit={createGoal} className="mt-6 grid gap-3 rounded-lg border border-[#333] bg-[#0a0a0a] p-4 md:grid-cols-[1fr_130px_auto] md:items-end">
          <label className="text-xs text-neutral-400">{t("goalPrompt")}
            <input required autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Learn JavaScript fundamentals" className="mt-2 w-full rounded-md border border-[#333] bg-transparent px-3 py-2 text-sm text-white outline-none focus:border-white" />
          </label>
          <label className="text-xs text-neutral-400">{t("days")}
            <input required type="number" min={1} max={90} value={totalDays} onChange={(event) => setTotalDays(Number(event.target.value))} className="mt-2 w-full rounded-md border border-[#333] bg-transparent px-3 py-2 text-sm text-white outline-none focus:border-white" />
          </label>
          <div className="flex gap-2"><button type="button" onClick={() => setIsCreating(false)} className="rounded-md px-3 py-2 text-sm text-neutral-400 hover:text-white">{t("cancel")}</button><button type="submit" className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-black">{t("save")}</button></div>
        </form>
      )}

      {goals.length === 0 && !isCreating && <div className="mt-6 rounded-lg border border-dashed border-[#333] p-8 text-center text-sm text-neutral-500">{t("createFirstGoal")}</div>}

      <div className="mt-6 space-y-5">
        {goals.map((goal) => {
          const completed = goal.days.filter((day) => day.completed).length;
          const progress = Math.round((completed / goal.days.length) * 100);
          return <article key={goal.id} className="border-t border-[#262626] pt-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1"><div className="flex items-center gap-3"><h3 className="truncate text-lg font-semibold">{goal.title}</h3><span className="shrink-0 text-xs text-neutral-500">{completed}/{goal.days.length} days</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-800"><div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${progress}%` }} /></div></div>
              <button onClick={() => deleteGoal(goal.id)} className="text-neutral-600 hover:text-red-400" title={t("deleteGoal")} aria-label={`${t("deleteGoal")} ${goal.title}`}><Trash2 className="h-4 w-4" /></button>
            </div>
            <div className="mt-4 space-y-2">
              {goal.days.map((day) => <div key={day.day} className={`rounded-lg border ${day.completed ? "border-emerald-400/30 bg-emerald-400/5" : "border-[#262626] bg-[#0a0a0a]"}`}>
                <div className="flex items-center gap-3 p-3"><button onClick={() => updateDay(goal.id, day.day, { completed: !day.completed })} className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${day.completed ? "border-emerald-400 bg-emerald-400 text-black" : "border-neutral-600"}`} aria-label={`Mark day ${day.day} complete`}>{day.completed && <Check className="h-3.5 w-3.5" />}</button><button onClick={() => setOpenDay(openDay === day.day ? 0 : day.day)} className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left"><span><span className="mr-2 text-xs font-semibold uppercase tracking-widest text-neutral-500">Day {day.day}</span><span className={day.completed ? "text-neutral-400 line-through" : "text-neutral-200"}>{day.title || "Add today&apos;s focus"}</span><span className="ml-2 text-xs text-neutral-600">{new Date(`${day.date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span></span>{openDay === day.day ? <ChevronUp className="h-4 w-4 shrink-0 text-neutral-500" /> : <ChevronDown className="h-4 w-4 shrink-0 text-neutral-500" />}</button></div>
                {openDay === day.day && <div className="grid gap-3 border-t border-[#262626] p-3 md:grid-cols-2"><label className="text-xs text-neutral-500">{t("dailyFocus")}<input value={day.title} onChange={(event) => updateDay(goal.id, day.day, { title: event.target.value })} placeholder={t("focusPlaceholder")} className="mt-1 w-full rounded-md border border-[#333] bg-transparent px-3 py-2 text-sm text-white outline-none focus:border-white" /></label><label className="text-xs text-neutral-500">{t("studyNotes")}<textarea value={day.notes} onChange={(event) => updateDay(goal.id, day.day, { notes: event.target.value })} placeholder={t("notesPlaceholder")} rows={2} className="mt-1 w-full resize-none rounded-md border border-[#333] bg-transparent px-3 py-2 text-sm text-white outline-none focus:border-white" /></label></div>}
              </div>)}
            </div>
          </article>;
        })}
      </div>
    </section>
  );
}