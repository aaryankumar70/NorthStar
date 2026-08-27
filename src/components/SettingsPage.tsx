import { useEffect, useState } from "react";
import { supabase, type Field, type Profession } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { ArrowLeft, Check, Loader2, Database, AlertCircle, Briefcase, User, RefreshCw, ChevronRight, CheckCircle2 } from "lucide-react";

type SettingsProps = {
  onBack: () => void;
};

export function SettingsPage({ onBack }: SettingsProps) {
  const { user, profile, refreshProfile } = useAuth();
  const [fields, setFields] = useState<Field[]>([]);
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [selectedProfessionId, setSelectedProfessionId] = useState<string | null>(
    profile?.primary_profession_id || null
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [backfilling, setBackfilling] = useState(false);
  const [backfillProgress, setBackfillProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 });
  const [backfillResult, setBackfillResult] = useState<string | null>(null);
  const [backfillError, setBackfillError] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: fieldsData } = await supabase
        .from("fields")
        .select("*")
        .order("display_order");
      setFields(fieldsData as Field[] | null || []);

      const { data: profsData } = await supabase
        .from("professions")
        .select("*")
        .order("display_order");
      setProfessions(profsData as Profession[] | null || []);

      if (profile?.primary_profession_id) {
        const prof = (profsData as Profession[])?.find((p) => p.id === profile.primary_profession_id);
        if (prof) setSelectedFieldId(prof.field_id);
      }
      setLoading(false);
    })();
  }, []);

  const filteredProfessions = selectedFieldId
    ? professions.filter((p) => p.field_id === selectedFieldId)
    : [];

  const professionChanged = selectedProfessionId !== profile?.primary_profession_id;

  const handleSave = async () => {
    if (!user || !selectedProfessionId) return;
    setSaving(true);
    const { error } = await supabase.from("user_profiles").upsert({
      id: user.id,
      primary_profession_id: selectedProfessionId,
      onboarded: true,
      updated_at: new Date().toISOString(),
    });
    if (!error) {
      if (professionChanged) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const headers = {
          Authorization: `Bearer ${anonKey}`,
          "Content-Type": "application/json",
        };
        Promise.allSettled([
          fetch(`${supabaseUrl}/functions/v1/fetch-pulse?profession_id=${selectedProfessionId}`, { headers }),
          fetch(`${supabaseUrl}/functions/v1/fetch-library?profession_id=${selectedProfessionId}`, { headers }),
        ]).then(() =>
          fetch(`${supabaseUrl}/functions/v1/synthesize-insights?profession_id=${selectedProfessionId}`, { headers })
        );
      }
      await refreshProfile();
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onBack();
      }, 1500);
    }
    setSaving(false);
  };

  const handleBackfill = async () => {
    setBackfilling(true);
    setBackfillResult(null);
    setBackfillError(false);
    setBackfillProgress({ current: 0, total: 0, success: 0, failed: 0 });
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const headers = {
        Authorization: `Bearer ${anonKey}`,
        "Content-Type": "application/json",
      };

      const BATCH_SIZE = 5;
      let start = 0;
      let totalSuccess = 0;
      let totalFailed = 0;
      let totalProfessions = 0;
      let hasMore = true;

      while (hasMore) {
        const resp = await fetch(
          `${supabaseUrl}/functions/v1/backfill-all?force=true&start=${start}&batch=${BATCH_SIZE}`,
          { headers }
        );
        const data = await resp.json();
        if (!resp.ok) {
          setBackfillResult(`Error at batch starting ${start}: ${data.error || resp.statusText}`);
          setBackfillError(true);
          break;
        }
        totalSuccess += data.success || 0;
        totalFailed += data.failed || 0;
        totalProfessions = data.total;
        const processed = start + (data.processed || 0);
        setBackfillProgress({ current: processed, total: totalProfessions, success: totalSuccess, failed: totalFailed });
        hasMore = data.hasMore;
        start = data.nextStart;
      }

      setBackfillResult(
        `Complete: ${totalSuccess}/${totalProfessions} professions succeeded, ${totalFailed} failed.`
      );
      setBackfillError(totalFailed > 0);
    } catch (e) {
      setBackfillResult(`Error: ${e.message}`);
      setBackfillError(true);
    }
    setBackfilling(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    );
  }

  const backfillPercent = backfillProgress.total > 0
    ? Math.round((backfillProgress.current / backfillProgress.total) * 100)
    : 0;

  return (
    <div className="min-h-screen px-4 sm:px-6 py-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 slide-up">
          <button
            onClick={onBack}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-700/30 transition-all hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <Logo className="w-6 h-6 text-slate-700 dark:text-slate-200" />
            <span className="text-base font-semibold tracking-tight text-slate-800 dark:text-slate-100">
              Settings
            </span>
          </div>
        </div>

        {/* Profession Card */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8 slide-up" style={{ animationDelay: "0.05s" }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
              <Briefcase className="w-4.5 h-4.5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Primary Profession</h2>
              <p className="text-xs text-slate-400">The profession Northstar tracks for your dashboard</p>
            </div>
          </div>

          {/* Field selection */}
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
            Field
          </label>
          <div className="grid grid-cols-3 gap-3 mb-5">
            {fields.map((field) => (
              <button
                key={field.id}
                onClick={() => {
                  setSelectedFieldId(field.id);
                  setSelectedProfessionId(null);
                }}
                className={`py-3 px-4 rounded-xl text-sm font-medium transition-all border relative ${
                  selectedFieldId === field.id
                    ? "bg-blue-500/10 border-blue-400/50 text-blue-700 dark:text-blue-300 shadow-md shadow-blue-500/10"
                    : "bg-white/30 dark:bg-slate-800/20 border-slate-200/50 dark:border-slate-700/40 text-slate-600 dark:text-slate-300 hover:border-slate-300/60 dark:hover:border-slate-600/50 hover:scale-[1.02]"
                }`}
              >
                {field.name}
                {selectedFieldId === field.id && (
                  <Check className="absolute top-1.5 right-1.5 w-3 h-3 text-blue-500" />
                )}
              </button>
            ))}
          </div>

          {/* Profession selection */}
          {selectedFieldId && (
            <div className="animate-in">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                Profession
              </label>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {filteredProfessions.map((prof) => (
                  <button
                    key={prof.id}
                    onClick={() => setSelectedProfessionId(prof.id)}
                    className={`py-2.5 px-3.5 rounded-lg text-sm transition-all border text-left flex items-center justify-between ${
                      selectedProfessionId === prof.id
                        ? "bg-teal-500/10 border-teal-400/50 text-teal-700 dark:text-teal-300 shadow-sm"
                        : "bg-white/30 dark:bg-slate-800/20 border-slate-200/50 dark:border-slate-700/40 text-slate-600 dark:text-slate-300 hover:border-slate-300/60 dark:hover:border-slate-600/50"
                    }`}
                  >
                    <span>{prof.name}</span>
                    {selectedProfessionId === prof.id && <Check className="w-3.5 h-3.5 text-teal-500 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {professionChanged && selectedProfessionId && (
            <div className="flex items-center gap-2 mb-3 p-2.5 rounded-lg bg-blue-500/8 border border-blue-400/20 animate-in">
              <RefreshCw className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Data for your new profession will be gathered in the background after saving.
              </p>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving || !selectedProfessionId}
            className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:shadow-md active:scale-[0.98] ${
              saved
                ? "bg-teal-500 text-white"
                : "bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-white"
            }`}
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" />
                Saved — returning to dashboard
              </>
            ) : saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>

        {/* Backfill Card */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8 mt-4 slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
              <Database className="w-4.5 h-4.5 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Data Backfill</h2>
              <p className="text-xs text-slate-400">Fetch fresh news, library, and skill analysis for all 38 professions</p>
            </div>
          </div>

          <button
            onClick={handleBackfill}
            disabled={backfilling}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-all hover:shadow-md active:scale-[0.98]"
          >
            {backfilling ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Backfilling...
              </>
            ) : (
              <>
                <Database className="w-4 h-4" />
                Run Full Backfill
              </>
            )}
          </button>

          {/* Progress bar */}
          {backfilling && backfillProgress.total > 0 && (
            <div className="mt-4 animate-in">
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                <span>Processing: {backfillProgress.current} / {backfillProgress.total}</span>
                <span>{backfillPercent}%</span>
              </div>
              <div className="h-1.5 bg-slate-200/40 dark:bg-slate-700/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${backfillPercent}%` }}
                />
              </div>
              <div className="flex gap-4 mt-2 text-xs">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />
                  {backfillProgress.success} succeeded
                </span>
                {backfillProgress.failed > 0 && (
                  <span className="flex items-center gap-1 text-coral-600 dark:text-coral-400">
                    <AlertCircle className="w-3 h-3" />
                    {backfillProgress.failed} failed
                  </span>
                )}
              </div>
            </div>
          )}

          {backfillResult && !backfilling && (
            <div className={`mt-3 flex items-start gap-2 text-xs p-3 rounded-lg animate-in ${
              backfillError
                ? "bg-coral-500/8 border border-coral-400/20 text-coral-600 dark:text-coral-400"
                : "bg-emerald-500/8 border border-emerald-400/20 text-emerald-600 dark:text-emerald-400"
            }`}>
              {backfillError ? <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <Check className="w-4 h-4 shrink-0 mt-0.5" />}
              <span>{backfillResult}</span>
            </div>
          )}
        </div>

        {/* Account Card */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8 mt-4 slide-up" style={{ animationDelay: "0.15s" }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-400/10">
              <User className="w-4.5 h-4.5 text-slate-500" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Account</h2>
              <p className="text-xs text-slate-400">Your sign-in email</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span className="px-3 py-1.5 rounded-lg bg-slate-100/40 dark:bg-slate-800/30 font-mono text-xs">
              {user?.email}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
