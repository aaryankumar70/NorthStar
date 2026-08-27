import { useCallback, useEffect, useState } from "react";
import { supabase, type Profession, type PulseItem, type AscendingSkill, type FadingSkill, type LibraryItem, type CompassPick } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/Header";
import {
  PulseSection,
  SkillRadarSection,
  FieldLibrarySection,
  CompassPickSection,
} from "@/components/DashboardSections";
import { Newspaper, Radar, BookOpen, Compass, ArrowLeft } from "lucide-react";

type DashboardProps = {
  onNavigateSettings: () => void;
};

export function Dashboard({ onNavigateSettings }: DashboardProps) {
  const { profile } = useAuth();
  const [primaryProfession, setPrimaryProfession] = useState<Profession | null>(null);
  const [viewingProfession, setViewingProfession] = useState<Profession | null>(null);
  const [pulse, setPulse] = useState<PulseItem[]>([]);
  const [ascending, setAscending] = useState<AscendingSkill[]>([]);
  const [fading, setFading] = useState<FadingSkill[]>([]);
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [compassPick, setCompassPick] = useState<CompassPick | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState("");
  const [activeSection, setActiveSection] = useState<string>("pulse");

  const currentProfession = viewingProfession || primaryProfession;
  const isPrimary = currentProfession?.id === primaryProfession?.id;

  // Load primary profession from profile
  useEffect(() => {
    if (!profile?.primary_profession_id) return;
    (async () => {
      const { data } = await supabase
        .from("professions")
        .select("*")
        .eq("id", profile.primary_profession_id)
        .maybeSingle();
      if (data) {
        const prof = data as Profession;
        setPrimaryProfession(prof);
        setViewingProfession(null);
      }
    })();
  }, [profile?.primary_profession_id]);

  // Load compass pick (global, not profession-specific)
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("compass_picks")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setCompassPick(data as CompassPick);
    })();
  }, []);

  // Load all data for the current profession
  const loadProfessionData = useCallback(async (professionId: string) => {
    setLoading(true);
    const [pulseRes, ascRes, fadeRes, libRes] = await Promise.all([
      supabase.from("pulse_items").select("*").eq("profession_id", professionId).order("created_at", { ascending: false }).limit(8),
      supabase.from("ascending_skills").select("*").eq("profession_id", professionId).order("created_at", { ascending: false }).limit(4),
      supabase.from("fading_skills").select("*").eq("profession_id", professionId).order("created_at", { ascending: false }).limit(3),
      supabase.from("library_items").select("*").eq("profession_id", professionId).order("fetched_date", { ascending: false }).limit(15),
    ]);

    setPulse((pulseRes.data as PulseItem[]) || []);
    setAscending((ascRes.data as AscendingSkill[]) || []);
    setFading((fadeRes.data as FadingSkill[]) || []);
    setLibrary((libRes.data as LibraryItem[]) || []);
    setLoading(false);
  }, []);

  // Check if a profession has pulse data (news items)
  const hasPulseData = useCallback(async (professionId: string): Promise<boolean> => {
    const { count } = await supabase
      .from("pulse_items")
      .select("id", { count: "exact", head: true })
      .eq("profession_id", professionId);
    return (count || 0) > 0;
  }, []);

  useEffect(() => {
    if (!currentProfession) return;
    loadProfessionData(currentProfession.id);
  }, [currentProfession?.id, loadProfessionData]);

  // Auto-fetch data for a profession via edge functions
  const fetchProfessionData = useCallback(async (professionId: string, statusCallback?: (s: string) => void) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const headers = {
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json",
    };

    statusCallback?.("Gathering news & books...");
    await Promise.allSettled([
      fetch(`${supabaseUrl}/functions/v1/fetch-pulse?profession_id=${professionId}`, { headers }),
      fetch(`${supabaseUrl}/functions/v1/fetch-library?profession_id=${professionId}`, { headers }),
    ]);

    statusCallback?.("Analyzing with AI...");
    await new Promise((r) => setTimeout(r, 2000));
    await fetch(`${supabaseUrl}/functions/v1/synthesize-insights?profession_id=${professionId}`, { headers });

    statusCallback?.("Loading results...");
    await new Promise((r) => setTimeout(r, 2000));
    await loadProfessionData(professionId);
  }, [loadProfessionData]);

  // Refresh: trigger edge functions for current profession, then reload
  const handleRefresh = async () => {
    if (!currentProfession) return;
    setRefreshing(true);
    try {
      await fetchProfessionData(currentProfession.id, setRefreshStatus);
    } catch (err) {
      console.error("Refresh failed:", err);
    }
    setRefreshStatus("");
    setRefreshing(false);
  };

  // Switch profession via header dropdown: auto-fetch only if no data exists (gap-filler)
  const handleProfessionChange = async (prof: Profession) => {
    setViewingProfession(prof);
    const hasPulse = await hasPulseData(prof.id);
    if (!hasPulse) {
      setRefreshing(true);
      try {
        await fetchProfessionData(prof.id, setRefreshStatus);
      } catch (err) {
        console.error("Auto-fetch failed:", err);
      }
      setRefreshStatus("");
      setRefreshing(false);
    }
  };

  if (!currentProfession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading your dashboard...</div>
      </div>
    );
  }

  const today = new Date();
  const greeting = (() => {
    const h = today.getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();
  const dateStr = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const sections = [
    { id: "pulse", label: "Pulse", icon: Newspaper, count: pulse.length },
    { id: "radar", label: "Skill Radar", icon: Radar, count: ascending.length + fading.length },
    { id: "library", label: "Library", icon: BookOpen, count: library.length },
    ...(compassPick ? [{ id: "compass", label: "Compass", icon: Compass, count: 1 }] : []),
  ];

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(`section-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen pb-8">
      <Header
        onNavigateSettings={onNavigateSettings}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        currentProfession={currentProfession}
        onProfessionChange={handleProfessionChange}
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6 pt-4">
        {/* Refresh progress bar */}
        {refreshing && (
          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2.5">
              <div className="w-3.5 h-3.5 border-2 border-slate-300 dark:border-slate-600 border-t-blue-500 rounded-full animate-spin" />
              {refreshStatus || "Working..."}
            </div>
            <div className="h-0.5 bg-slate-200/50 dark:bg-slate-700/30 progress-bar" />
          </div>
        )}

        {/* Preview banner */}
        {!isPrimary && (
          <div className="glass-panel rounded-xl px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between animate-in">
            <span>
              Previewing <strong className="font-medium text-slate-600 dark:text-slate-300">{currentProfession.name}</strong> — your primary profession is unchanged.
            </span>
            <button
              onClick={() => setViewingProfession(null)}
              className="flex items-center gap-1 text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to mine
            </button>
          </div>
        )}

        {/* Greeting */}
        <div className="px-1 slide-up">
          <p className="text-xs text-slate-400 mb-1">{dateStr}</p>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 tracking-tight">
            {greeting}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Here's what's happening in <span className="font-medium text-slate-600 dark:text-slate-300">{currentProfession.name}</span> today
          </p>
        </div>

        {/* Section navigation pills */}
        <div className="sticky top-[72px] z-30 -mx-4 px-4 py-2">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {sections.map((s) => {
              const Icon = s.icon;
              const isActive = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => scrollToSection(s.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md"
                      : "glass-card text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {s.label}
                  {s.count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? "bg-white/20 dark:bg-slate-800/20"
                        : "bg-slate-200/60 dark:bg-slate-700/40"
                    }`}>
                      {s.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sections */}
        <div id="section-pulse" className="scroll-mt-32">
          <PulseSection items={pulse} loading={loading} />
        </div>
        <div id="section-radar" className="scroll-mt-32">
          <SkillRadarSection ascending={ascending} fading={fading} loading={loading} />
        </div>
        <div id="section-library" className="scroll-mt-32">
          <FieldLibrarySection items={library} loading={loading} />
        </div>
        <div id="section-compass" className="scroll-mt-32">
          <CompassPickSection pick={compassPick} />
        </div>
      </main>
    </div>
  );
}
