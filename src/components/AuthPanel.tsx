"use client";

import { FormEvent, useState } from "react";
import { LogIn, LogOut, UserPlus } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useAuth } from "./AuthProvider";

export default function AuthPanel() {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;

  if (!isSupabaseConfigured()) {
    return null;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    const supabase = createClient();
    const result = mode === "signIn"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (result.error) {
      setMessage(result.error.message);
    } else if (mode === "signUp" && !result.data.session) {
      setMessage("Check your email to confirm your account.");
    }
    setSubmitting(false);
  };

  const signOut = async () => {
    await createClient().auth.signOut();
  };

  if (user) {
    return (
      <div className="absolute top-5 left-5 flex items-center gap-3 text-xs text-neutral-400">
        <span className="max-w-40 truncate">{user.email}</span>
        <button onClick={signOut} className="flex items-center gap-1.5 hover:text-white transition-colors" title="Sign out">
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    );
  }

  return (
    <details className="absolute top-5 left-5 z-10 text-xs">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 text-neutral-400 hover:text-white">
        {mode === "signIn" ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
        {mode === "signIn" ? "Sign in" : "Create account"}
      </summary>
      <form onSubmit={handleSubmit} className="absolute left-0 top-8 w-64 rounded-lg border border-[#333] bg-[#111] p-4 shadow-2xl">
        <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" className="mb-2 w-full rounded-md border border-[#333] bg-[#0a0a0a] px-3 py-2 text-white outline-none focus:border-white" />
        <input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" className="mb-3 w-full rounded-md border border-[#333] bg-[#0a0a0a] px-3 py-2 text-white outline-none focus:border-white" />
        <button disabled={submitting} className="w-full rounded-md bg-white py-2 font-medium text-black disabled:opacity-50">
          {submitting ? "Please wait..." : mode === "signIn" ? "Sign in" : "Create account"}
        </button>
        <button type="button" onClick={() => setMode(mode === "signIn" ? "signUp" : "signIn")} className="mt-3 text-neutral-400 hover:text-white">
          {mode === "signIn" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
        {message && <p className="mt-2 text-red-300">{message}</p>}
      </form>
    </details>
  );
}