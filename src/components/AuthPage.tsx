import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Logo, LogoWithWordmark } from "@/components/Logo";
import { ArrowLeft, Mail, Lock, Loader2, TrendingUp, Radar, BookOpen } from "lucide-react";

interface AuthPageProps {
  initialMode?: "signin" | "signup";
  onBack?: () => void;
}

export function AuthPage({ initialMode = "signin", onBack }: AuthPageProps) {
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left branded panel */}
      <div className="hidden lg:flex flex-col justify-between w-[44%] relative overflow-hidden p-10 bg-slate-900">
        {/* Decorative glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-blue-500/15 blur-3xl" />
          <div className="absolute bottom-10 -left-20 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute top-1/2 right-1/3 h-60 w-60 rounded-full bg-amber-500/8 blur-3xl" />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-2.5">
          <Logo className="w-7 h-7 text-slate-200" />
          <span className="text-lg font-semibold tracking-tight text-slate-100">Northstar</span>
        </div>

        {/* Middle content */}
        <div className="relative">
          <h2 className="text-3xl font-bold text-white leading-tight mb-3">
            Your personal compass for professional intelligence
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm mb-8">
            Track the news, skills, and tools shaping your profession — all in one beautifully simple dashboard.
          </p>

          <div className="space-y-3">
            {[
              { icon: TrendingUp, label: "Daily news pulse tailored to your role", color: "text-blue-400", bg: "bg-blue-500/15" },
              { icon: Radar, label: "AI-powered skill radar: what's rising, what's fading", color: "text-emerald-400", bg: "bg-emerald-500/15" },
              { icon: BookOpen, label: "Curated books, papers, and tools for your field", color: "text-amber-400", bg: "bg-amber-500/15" },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex items-center gap-3 slide-up" style={{ animationDelay: `${0.15 + i * 0.1}s` }}>
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${item.bg}`}>
                    <Icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <span className="text-sm text-slate-300">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom badge */}
        <div className="relative">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            AI-powered · 38 professions · Updated daily
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-4 relative">
        {onBack && (
          <button
            onClick={onBack}
            className="absolute top-6 left-6 flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </button>
        )}

        <div className="w-full max-w-sm scale-in">
          {/* Mobile logo */}
          <div className="flex justify-center mb-6 lg:hidden">
            <LogoWithWordmark />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 mb-1.5">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            {mode === "signup" ? "Start tracking your profession in minutes." : "Sign in to your dashboard."}
          </p>

          {/* Tab switcher */}
          <div className="flex gap-1 p-1 rounded-xl bg-slate-100/60 dark:bg-slate-800/40 mb-5">
            <button
              onClick={() => setMode("signin")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                mode === "signin"
                  ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                mode === "signup"
                  ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-800/30 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-transparent transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-800/30 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-transparent transition-all"
                  placeholder="At least 6 characters"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-coral-500/8 border border-coral-400/20 scale-in">
                <span className="text-xs text-coral-600 dark:text-coral-400 leading-relaxed">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-medium hover:bg-slate-700 dark:hover:bg-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:shadow-md active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Please wait...
                </>
              ) : mode === "signin" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-400">
            {mode === "signup" ? "Already have an account? " : "Don't have an account? "}
            <button
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              className="text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
            >
              {mode === "signup" ? "Sign in" : "Sign up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
