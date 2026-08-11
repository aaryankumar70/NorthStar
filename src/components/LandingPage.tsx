import { useState } from "react";
import {
  TrendingUp,
  BookOpen,
  Radar,
  Newspaper,
  ArrowRight,
  Check,
  Compass,
} from "lucide-react";
import { Logo, LogoWithWordmark } from "@/components/Logo";

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export function LandingPage({ onGetStarted, onSignIn }: LandingPageProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="app-bg min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <Logo className="w-7 h-7 text-slate-200" />
            <span className="text-lg font-semibold tracking-tight text-slate-100">Northstar</span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-slate-400 transition-colors hover:text-white">
              Features
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-400 transition-colors hover:text-white">
              How it works
            </a>
            <button
              onClick={onSignIn}
              className="text-sm font-medium text-slate-400 transition-colors hover:text-white"
            >
              Sign In
            </button>
            <button
              onClick={onGetStarted}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-all hover:bg-slate-200 hover:shadow-md"
            >
              Get Started
            </button>
          </div>
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 md:hidden"
          >
            <svg className="h-5 w-5 text-slate-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {mobileNavOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
        {mobileNavOpen && (
          <div className="border-t border-slate-800 bg-slate-950/80 px-5 py-4 md:hidden">
            <div className="flex flex-col gap-3">
              <a href="#features" className="text-sm font-medium text-slate-400" onClick={() => setMobileNavOpen(false)}>
                Features
              </a>
              <a href="#how-it-works" className="text-sm font-medium text-slate-400" onClick={() => setMobileNavOpen(false)}>
                How it works
              </a>
              <button onClick={onSignIn} className="text-left text-sm font-medium text-slate-400">
                Sign In
              </button>
              <button
                onClick={() => {
                  setMobileNavOpen(false);
                  onGetStarted();
                }}
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Decorative glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-blue-500/10 opacity-60 blur-3xl" />
          <div className="absolute top-20 -left-32 h-80 w-80 rounded-full bg-emerald-500/8 opacity-50 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-amber-500/6 opacity-40 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-5 pb-24 pt-20 md:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-700/50 bg-slate-800/40 px-3.5 py-1.5">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-medium text-slate-300">AI-powered industry intelligence</span>
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-white md:text-6xl md:leading-[1.1]">
              Stay ahead of your field
              <span className="block bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
                one profession at a time
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-400">
              Northstar tracks the news, research, and tools shaping your profession —
              then distills it into daily insights, rising skills, and fading trends.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                onClick={onGetStarted}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-base font-medium text-slate-900 shadow-lg shadow-white/10 transition-all hover:bg-slate-200 hover:shadow-xl hover:shadow-white/15 sm:w-auto"
              >
                Get Started
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
              </button>
              <a
                href="#features"
                className="flex w-full items-center justify-center rounded-xl border border-slate-700 bg-slate-800/30 px-7 py-3.5 text-base font-medium text-slate-200 transition-all hover:border-slate-600 hover:bg-slate-800/50 sm:w-auto"
              >
                Learn more
              </a>
            </div>

            <p className="mt-4 text-sm text-slate-500">
              Free to use. No credit card required.
            </p>
          </div>

          {/* Hero preview card */}
          <div className="mx-auto mt-16 max-w-4xl">
            <div className="glass-panel overflow-hidden rounded-2xl shadow-2xl shadow-black/20">
              {/* Mock dashboard preview header */}
              <div className="flex items-center gap-2 border-b border-slate-700/40 bg-slate-900/40 px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-slate-600" />
                  <div className="h-3 w-3 rounded-full bg-slate-600" />
                  <div className="h-3 w-3 rounded-full bg-slate-600" />
                </div>
                <div className="ml-3 h-5 flex-1 rounded-md bg-slate-700/30" />
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Compass className="h-4 w-4" />
                  <span className="text-xs font-medium">Dashboard</span>
                </div>
              </div>
              <div className="grid gap-4 p-6 md:grid-cols-3">
                {/* Pulse card */}
                <div className="glass-card rounded-xl p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15">
                      <Newspaper className="h-4 w-4 text-blue-400" />
                    </div>
                    <span className="text-sm font-semibold text-slate-200">Daily Pulse</span>
                  </div>
                  <div className="space-y-2.5">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-2.5">
                        <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-400" />
                        <div className="flex-1 space-y-1">
                          <div className="h-2.5 rounded bg-slate-600/40" style={{ width: `${90 - i * 10}%` }} />
                          <div className="h-2 w-3/4 rounded bg-slate-700/30" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Skill Radar card */}
                <div className="glass-card rounded-xl p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15">
                      <Radar className="h-4 w-4 text-emerald-400" />
                    </div>
                    <span className="text-sm font-semibold text-slate-200">Skill Radar</span>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { label: "AI Integration", trend: "up" },
                      { label: "Cloud-Native", trend: "up" },
                      { label: "Manual Testing", trend: "down" },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">{s.label}</span>
                        <div className={`flex items-center gap-0.5 ${s.trend === "up" ? "text-emerald-400" : "text-coral-400"}`}>
                          <TrendingUp className={`h-3.5 w-3.5 ${s.trend === "down" ? "rotate-180" : ""}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Library card */}
                <div className="glass-card rounded-xl p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15">
                      <BookOpen className="h-4 w-4 text-amber-400" />
                    </div>
                    <span className="text-sm font-semibold text-slate-200">Field Library</span>
                  </div>
                  <div className="space-y-2.5">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-2">
                        <div className="h-8 w-6 shrink-0 rounded bg-slate-600/40" />
                        <div className="flex-1 space-y-1 pt-0.5">
                          <div className="h-2.5 rounded bg-slate-600/40" style={{ width: `${80 - i * 8}%` }} />
                          <div className="h-2 w-1/2 rounded bg-slate-700/30" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-slate-800/50 py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              Everything you need to track your profession
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              Three intelligently connected modules give you a 360-degree view of what's happening in your field.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {/* Daily Pulse */}
            <div className="glass-card group rounded-2xl p-7 transition-all hover:border-slate-600/50 hover:shadow-lg hover:shadow-black/20">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/15 transition-transform group-hover:scale-110">
                <Newspaper className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-100">Daily Pulse</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                A curated stream of the latest news headlines relevant to your specific profession,
                updated daily with AI-generated context on why each story matters.
              </p>
            </div>

            {/* Skill Radar */}
            <div className="glass-card group rounded-2xl p-7 transition-all hover:border-slate-600/50 hover:shadow-lg hover:shadow-black/20">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 transition-transform group-hover:scale-110">
                <Radar className="h-6 w-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-100">Skill Radar</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Identifies which skills are rising in demand and which are fading —
                synthesized from the day's news to give you a forward-looking edge in your career.
              </p>
            </div>

            {/* Field Library */}
            <div className="glass-card group rounded-2xl p-7 transition-all hover:border-slate-600/50 hover:shadow-lg hover:shadow-black/20">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 transition-transform group-hover:scale-110">
                <BookOpen className="h-6 w-6 text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-100">Field Library</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Recommended books, research papers, and tools tailored to your profession —
                sourced from Google Books, arXiv, OpenAlex, and GitHub.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-slate-800/50 bg-slate-900/20 py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              How it works
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              Three simple steps to stay on top of your profession.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Create your account",
                description: "Sign up and pick your profession from 38 roles across IT, finance, and law.",
              },
              {
                step: "02",
                title: "We fetch the signal",
                description: "Northstar pulls news, research, and tools specific to your profession every day.",
              },
              {
                step: "03",
                title: "Get your daily brief",
                description: "Open your dashboard to see what's trending, what skills to learn, and what to read next.",
              },
            ].map((s, i) => (
              <div key={s.step} className="relative">
                {i < 2 && (
                  <div className="absolute top-8 left-full hidden h-px w-full -translate-x-1/2 bg-slate-700/50 md:block" />
                )}
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-700/50 bg-slate-800/40 text-sm font-bold text-slate-200 shadow-sm">
                    {s.step}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-100">{s.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{s.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-slate-800/50 py-24">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            Start tracking your profession today
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg text-slate-400">
            Join Northstar and get a personalized intelligence dashboard for your career.
          </p>

          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <ul className="flex flex-col gap-2 text-left sm:flex-row sm:gap-6">
              {["38 professions", "Daily updates", "Free to use"].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-slate-400">
                  <Check className="h-4 w-4 text-emerald-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={onGetStarted}
            className="group mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-medium text-slate-900 shadow-lg shadow-white/10 transition-all hover:bg-slate-200 hover:shadow-xl hover:shadow-white/15"
          >
            Get Started
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 md:flex-row">
          <LogoWithWordmark />
          <p className="text-sm text-slate-500">
            Your personal industry intelligence dashboard
          </p>
        </div>
      </footer>
    </div>
  );
}
