"use client";

import { useEffect, useMemo, useState } from "react";
import { Award, ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useAuth } from "./AuthProvider";

type StudyDay = {
  date: string;
  minutes: number;
};

const getDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateKey = (key: string) => {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const formatMinutes = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return hours ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;
};

export default function StudyCalendar() {
  const { user } = useAuth();
  const [days, setDays] = useState<StudyDay[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [month, setMonth] = useState(() => new Date());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const supabaseConfigured = isSupabaseConfigured();

  const saveLocalDays = (nextDays: StudyDay[]) => {
    localStorage.setItem("promodo-study-days", JSON.stringify(nextDays));
  };

  useEffect(() => {
    if (!user || !supabaseConfigured) {
      const savedDays = localStorage.getItem("promodo-study-days");
      if (savedDays) {
        try {
          setDays(JSON.parse(savedDays) as StudyDay[]);
        } catch {
          setDays([]);
        }
      }
      return;
    }

    const loadStudyDays = async () => {
      setLoading(true);
      const { data, error } = await createClient()
        .from("study_logs")
        .select("study_date, minutes")
        .eq("user_id", user.id)
        .order("study_date", { ascending: true });
      if (error) {
        setMessage("Study history needs the Supabase study_logs table.");
        const savedDays = localStorage.getItem("promodo-study-days");
        if (savedDays) setDays(JSON.parse(savedDays) as StudyDay[]);
      } else {
        setDays((data ?? []).map((day) => ({ date: day.study_date, minutes: day.minutes })));
      }
      setLoading(false);
    };
    loadStudyDays();
  }, [user, supabaseConfigured]);

  useEffect(() => {
    const handleSessionCompleted = async (event: Event) => {
      const minutes = (event as CustomEvent<number>).detail;
      const date = getDateKey(new Date());
      const currentMinutes = days.find((day) => day.date === date)?.minutes ?? 0;
      const nextMinutes = currentMinutes + minutes;
      const nextDays = [
        ...days.filter((day) => day.date !== date),
        { date, minutes: nextMinutes },
      ].sort((first, second) => first.date.localeCompare(second.date));
      setDays(nextDays);
      saveLocalDays(nextDays);

      if (user && supabaseConfigured) {
        const { error } = await createClient().from("study_logs").upsert({
          user_id: user.id,
          study_date: date,
          minutes: nextMinutes,
        }, { onConflict: "user_id,study_date" });
        if (error) setMessage("Could not sync this study session yet.");
      }
    };
    window.addEventListener("promodo-session-completed", handleSessionCompleted);
    return () => window.removeEventListener("promodo-session-completed", handleSessionCompleted);
  }, [days, user, supabaseConfigured]);

  const minutesByDate = useMemo(() => new Map(days.map((day) => [day.date, day.minutes])), [days]);
  const selectedKey = getDateKey(selectedDate);
  const selectedMinutes = minutesByDate.get(selectedKey) ?? 0;
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const firstWeekday = (monthStart.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const calendarCells = Array.from({ length: Math.ceil((firstWeekday + daysInMonth) / 7) * 7 }, (_, index) => {
    const dayNumber = index - firstWeekday + 1;
    return dayNumber > 0 && dayNumber <= daysInMonth ? new Date(month.getFullYear(), month.getMonth(), dayNumber) : null;
  });

  const studyDates = new Set(days.filter((day) => day.minutes > 0).map((day) => day.date));
  let streak = 0;
  const cursor = new Date();
  if (!studyDates.has(getDateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (studyDates.has(getDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  const nextMilestone = Math.max(10, Math.ceil((streak + 1) / 10) * 10);
  const totalMinutes = days.reduce((total, day) => total + day.minutes, 0);
  const milestoneReached = streak > 0 && streak % 10 === 0;

  const changeMonth = (amount: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + amount, 1));

  return (
    <section className="surface-panel mt-8 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-neutral-500"><Flame className="h-4 w-4 text-orange-400" /> Study streak</p>
          <h2 className="text-2xl font-bold">{streak} {streak === 1 ? "day" : "days"}</h2>
          <p className="mt-1 text-sm text-neutral-500">{formatMinutes(totalMinutes)} studied in total</p>
        </div>
        {milestoneReached ? (
          <div className="flex items-center gap-2 rounded-lg border border-orange-400/40 bg-orange-400/10 px-3 py-2 text-sm text-orange-200"><Award className="h-4 w-4" /> {streak}-day streak achieved!</div>
        ) : (
          <p className="text-sm text-neutral-500">{nextMilestone - streak} days to your next milestone</p>
        )}
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_180px]">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <button onClick={() => changeMonth(-1)} className="rounded-md p-1 text-neutral-500 hover:bg-white/10 hover:text-white" aria-label="Previous month"><ChevronLeft className="h-4 w-4" /></button>
            <h3 className="text-sm font-semibold">{month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h3>
            <button onClick={() => changeMonth(1)} className="rounded-md p-1 text-neutral-500 hover:bg-white/10 hover:text-white" aria-label="Next month"><ChevronRight className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase text-neutral-600">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <span key={day}>{day}</span>)}</div>
          <div className="mt-2 grid grid-cols-7 gap-1">
            {calendarCells.map((date, index) => {
              if (!date) return <span key={`empty-${index}`} className="aspect-square" />;
              const key = getDateKey(date);
              const minutes = minutesByDate.get(key) ?? 0;
              const isSelected = key === selectedKey;
              return <button key={key} onClick={() => setSelectedDate(date)} className={`flex aspect-square flex-col items-center justify-center rounded-md border text-xs transition-colors ${isSelected ? "border-white bg-white text-black" : minutes ? "border-orange-400/40 bg-orange-400/20 text-orange-100" : "border-transparent text-neutral-500 hover:border-white/20 hover:bg-white/5"}`}><span>{date.getDate()}</span>{minutes > 0 && <span className="mt-0.5 text-[9px]">{Math.round(minutes / 60 * 10) / 10}h</span>}</button>;
            })}
          </div>
        </div>
        <div className="border-t border-[#262626] pt-4 md:border-l md:border-t-0 md:pl-5 md:pt-0">
          <p className="text-xs uppercase tracking-widest text-neutral-500">Selected day</p>
          <p className="mt-2 text-sm font-semibold">{selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
          <p className="mt-1 text-2xl font-bold">{formatMinutes(selectedMinutes)}</p>
          <p className="mt-2 text-xs text-neutral-500">Complete a Pomodoro to record study time.</p>
          {loading && <p className="mt-3 text-xs text-neutral-500">Syncing history...</p>}
          {message && <p className="mt-3 text-xs text-amber-200">{message}</p>}
        </div>
      </div>
    </section>
  );
}