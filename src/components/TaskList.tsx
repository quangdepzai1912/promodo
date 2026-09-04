"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, Plus, Trash2 } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useAuth } from "./AuthProvider";

type Task = {
  id: string;
  title: string;
  completed: boolean;
  pomodoros: number;
};

const defaultTasks: Task[] = [
  { id: "demo-1", title: "Design UI Mockups", completed: false, pomodoros: 3 },
  { id: "demo-2", title: "Reply to emails", completed: true, pomodoros: 1 },
];

export default function TaskList() {
  const { user, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (typeof window === "undefined") return defaultTasks;
    const savedTasks = window.localStorage.getItem("promodo-tasks");
    if (!savedTasks) return defaultTasks;
    try {
      return JSON.parse(savedTasks) as Task[];
    } catch {
      return defaultTasks;
    }
  });
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const supabaseConfigured = isSupabaseConfigured();

  useEffect(() => {
    if (!user || !supabaseConfigured) return;

    const loadTasks = async () => {
      setLoading(true);
      const { data, error: loadError } = await createClient()
        .from("tasks")
        .select("id, title, completed, pomodoros")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      if (loadError) setError(loadError.message);
      else setTasks(data ?? []);
      setLoading(false);
    };

    loadTasks();
  }, [user, supabaseConfigured]);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    if (supabaseConfigured && user) {
      const { data, error: insertError } = await createClient()
        .from("tasks")
        .insert({ user_id: user.id, title: newTaskTitle.trim(), pomodoros: 1 })
        .select("id, title, completed, pomodoros")
        .single();
      if (insertError || !data) {
        setError(insertError?.message ?? "Could not add task.");
        return;
      }
      setTasks((currentTasks) => [...currentTasks, data]);
    } else {
      const newTask: Task = {
        id: Date.now().toString(),
        title: newTaskTitle.trim(),
        completed: false,
        pomodoros: 1,
      };
      setTasks((currentTasks) => {
        const nextTasks = [...currentTasks, newTask];
        localStorage.setItem("promodo-tasks", JSON.stringify(nextTasks));
        return nextTasks;
      });
    }
    setNewTaskTitle("");
    setIsAdding(false);
  };

  const toggleTask = async (task: Task) => {
    const completed = !task.completed;
    setTasks((currentTasks) => currentTasks.map((item) => item.id === task.id ? { ...item, completed } : item));
    if (supabaseConfigured && user) {
      const { error: updateError } = await createClient().from("tasks").update({ completed }).eq("id", task.id).eq("user_id", user?.id);
      if (updateError) setError(updateError.message);
    } else {
      setTasks((currentTasks) => {
        localStorage.setItem("promodo-tasks", JSON.stringify(currentTasks));
        return currentTasks;
      });
    }
  };

  const deleteTask = async (id: string) => {
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== id));
    if (supabaseConfigured && user) {
      const { error: deleteError } = await createClient().from("tasks").delete().eq("id", id).eq("user_id", user?.id);
      if (deleteError) setError(deleteError.message);
    } else {
      setTasks((currentTasks) => {
        localStorage.setItem("promodo-tasks", JSON.stringify(currentTasks));
        return currentTasks;
      });
    }
  };

  if (authLoading) return <p className="mt-4 text-sm text-neutral-500">Loading...</p>;
  return (
    <div className="flex-1 flex flex-col gap-3 mt-4">
      {error && <p className="text-xs text-red-300">{error}</p>}
      {loading && <p className="text-sm text-neutral-500">Loading tasks...</p>}
      {tasks.map(task => (
        <div 
          key={task.id} 
          className={`group flex items-center gap-4 bg-[#0a0a0a] p-3.5 rounded-lg border border-[#262626] hover:border-neutral-600 transition-colors ${task.completed ? 'opacity-50' : 'cursor-pointer'}`}
        >
          <button onClick={() => toggleTask(task)} className="flex-shrink-0 focus:outline-none">
            {task.completed ? (
               <div className="w-5 h-5 rounded-[4px] bg-white flex items-center justify-center">
                 <CheckCircle2 className="w-3.5 h-3.5 text-black" />
               </div>
            ) : (
               <div className="w-5 h-5 rounded-[4px] border-2 border-neutral-600 group-hover:border-white transition-colors" />
            )}
          </button>
          
          <span className={`font-medium text-sm ${task.completed ? 'text-neutral-400 line-through' : 'text-neutral-200'}`} onClick={() => toggleTask(task)}>
            {task.title}
          </span>
          
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs font-mono text-neutral-500">{task.completed ? task.pomodoros : `0/${task.pomodoros}`}</span>
            <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400 transition-all focus:outline-none">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}

      {isAdding ? (
        <form onSubmit={addTask} className="mt-2 bg-[#0a0a0a] p-4 rounded-lg border border-[#262626]">
          <input 
            type="text" 
            autoFocus
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="What are you working on?"
            className="w-full bg-transparent border-none outline-none text-white text-sm mb-4"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium bg-white text-black rounded-md hover:bg-neutral-200">Save</button>
          </div>
        </form>
      ) : (
        <button 
          onClick={() => setIsAdding(true)}
          className="mt-2 w-full py-3.5 bg-transparent hover:bg-white/5 border border-dashed border-[#333] rounded-lg text-neutral-400 text-sm font-medium hover:text-white transition-colors flex justify-center items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add New Task
        </button>
      )}
    </div>
  );
}
