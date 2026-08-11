import { useEffect, useState } from "react";
import { supabase, type Field, type Profession } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { ChevronRight, Check, Loader2, ArrowRight } from "lucide-react";

export function Onboarding() {
  const { user, refreshProfile } = useAuth();
  const [fields, setFields] = useState<Field[]>([]);
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [selectedProfession, setSelectedProfession] = useState<Profession | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchStatus, setFetchStatus] = useState("");

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
      setLoading(false);
    })();
  }, []);

  const handleFieldSelect = (field: Field) => {
    setSelectedField(field);
    setSelectedProfession(null);
  };

  const handleConfirm = async () => {
    if (!user || !selectedProfession) return;
    setSaving(true);
    const { error } = await supabase.from("user_profiles").upsert({
      id: user.id,
      primary_profession_id: selectedProfession.id,
      onboarded: true,
      updated_at: new Date().toISOString(),
    });
    if (!error) {
      setSaving(false);
      setFetching(true);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const headers = {
        Authorization: `Bearer ${anonKey}`,
        "Content-Type": "application/json",
      };

      setFetchStatus("Gathering news & books...");
      Promise.allSettled([
        fetch(`${supabaseUrl}/functions/v1/fetch-pulse?profession_id=${selectedProfession.id}`, { headers }),
        fetch(`${supabaseUrl}/functions/v1/fetch-library?profession_id=${selectedProfession.id}`, { headers }),
      ]).then(() => {
        setFetchStatus("Analyzing with AI...");
        fetch(`${supabaseUrl}/functions/v1/synthesize-insights?profession_id=${selectedProfession.id}`, { headers })
          .then(() => {
            setFetchStatus("Finishing up...");
            setTimeout(() => refreshProfile(), 1000);
          });
      });
    } else {
      setSaving(false);
    }
  };

  const filteredProfessions = selectedField
    ? professions.filter((p) => p.field_id === selectedField.id)
    : [];

  const step = !selectedField ? 1 : !selectedProfession ? 2 : 3;
  const progress = (step / 3) * 100;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    );
  }

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center scale-in">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-slate-200/40 dark:border-slate-700/40" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Logo className="w-7 h-7 text-slate-600 dark:text-slate-300" />
            </div>
          </div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
            Setting up your dashboard
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{fetchStatus}</p>
          <div className="h-1 bg-slate-200/40 dark:bg-slate-700/30 rounded-full overflow-hidden progress-bar mx-auto max-w-[200px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl slide-up">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <Logo className="w-7 h-7 text-slate-700 dark:text-slate-200" />
          <span className="text-lg font-semibold tracking-tight text-slate-800 dark:text-slate-100">
            Northstar
          </span>
        </div>

        <div className="glass-panel rounded-2xl p-8">
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-1">
            Welcome to Northstar
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
            Tell us your field so we can track what's changing for you.
          </p>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              {["Field", "Profession", "Confirm"].map((label, i) => (
                <div key={label} className="flex items-center gap-2 flex-1">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    step > i + 1
                      ? "bg-teal-500 text-white"
                      : step === i + 1
                      ? "bg-blue-500 text-white scale-110 shadow-md shadow-blue-500/30"
                      : "bg-slate-200/60 dark:bg-slate-700/40 text-slate-400"
                  }`}>
                    {step > i + 1 ? <Check className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  {i < 2 && (
                    <div className="flex-1 h-0.5 rounded-full mx-1 overflow-hidden bg-slate-200/40 dark:bg-slate-700/30">
                      <div
                        className="h-full bg-blue-500 transition-all duration-500"
                        style={{ width: step > i + 1 ? "100%" : "0%" }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between px-0 text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              <span>Choose Field</span>
              <span className="ml-1">Choose Profession</span>
              <span>Confirm</span>
            </div>
          </div>

          {/* Step 1: Field selection */}
          <div className="space-y-2.5 mb-6">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
              Your Field
            </label>
            <div className="grid grid-cols-3 gap-3">
              {fields.map((field, i) => (
                <button
                  key={field.id}
                  onClick={() => handleFieldSelect(field)}
                  className={`py-4 px-4 rounded-xl text-sm font-medium transition-all border slide-up relative overflow-hidden ${
                    selectedField?.id === field.id
                      ? "bg-blue-500/10 border-blue-400/50 text-blue-700 dark:text-blue-300 shadow-md shadow-blue-500/10"
                      : "bg-white/30 dark:bg-slate-800/20 border-slate-200/50 dark:border-slate-700/40 text-slate-600 dark:text-slate-300 hover:border-slate-300/60 dark:hover:border-slate-600/50 hover:scale-[1.02]"
                  }`}
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  {selectedField?.id === field.id && (
                    <div className="absolute top-1.5 right-1.5">
                      <Check className="w-3 h-3 text-blue-500" />
                    </div>
                  )}
                  {field.name}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Profession selection */}
          {selectedField && (
            <div className="space-y-2.5 mb-6 animate-in">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                Your Profession
              </label>
              <div className="grid grid-cols-2 gap-2">
                {filteredProfessions.map((prof, i) => (
                  <button
                    key={prof.id}
                    onClick={() => setSelectedProfession(prof)}
                    className={`py-3 px-3.5 rounded-lg text-sm transition-all border text-left slide-up ${
                      selectedProfession?.id === prof.id
                        ? "bg-teal-500/10 border-teal-400/50 text-teal-700 dark:text-teal-300 shadow-md shadow-teal-500/10"
                        : "bg-white/30 dark:bg-slate-800/20 border-slate-200/50 dark:border-slate-700/40 text-slate-600 dark:text-slate-300 hover:border-slate-300/60 dark:hover:border-slate-600/50 hover:scale-[1.01]"
                    }`}
                    style={{ animationDelay: `${i * 0.03}s` }}
                  >
                    <div className="flex items-center justify-between">
                      <span>{prof.name}</span>
                      {selectedProfession?.id === prof.id && <Check className="w-3.5 h-3.5 text-teal-500 shrink-0" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {selectedProfession && (
            <div className="space-y-4 animate-in">
              <div className="flex items-center gap-2.5 p-3.5 rounded-lg bg-teal-500/8 border border-teal-400/20">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-500/15">
                  <Check className="w-4 h-4 text-teal-500" />
                </div>
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  You selected <strong className="font-semibold">{selectedProfession.name}</strong> in <strong className="font-semibold">{selectedField?.name}</strong>
                </span>
              </div>
              <button
                onClick={handleConfirm}
                disabled={saving}
                className="w-full py-2.5 rounded-lg bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-medium hover:bg-slate-700 dark:hover:bg-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:shadow-md active:scale-[0.98]"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Start exploring
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
