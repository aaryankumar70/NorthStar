import { useEffect, useRef, useState } from "react";
import { supabase, type Field, type Profession } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { RefreshCw, Settings, LogOut, ChevronDown, Check, Compass } from "lucide-react";

type HeaderProps = {
  onNavigateSettings: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  currentProfession: Profession | null;
  onProfessionChange: (prof: Profession) => void;
};

export function Header({
  onNavigateSettings,
  onRefresh,
  refreshing,
  currentProfession,
  onProfessionChange,
}: HeaderProps) {
  const { signOut } = useAuth();
  const [fields, setFields] = useState<Field[]>([]);
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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
    })();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const currentField = professions.find((p) => p.id === currentProfession?.id)?.field_id;
  const selectedFieldObj = fields.find((f) => f.id === currentField);

  return (
    <header className="sticky top-0 z-50 px-4 sm:px-6 py-3">
      <div className="glass-panel rounded-2xl px-4 sm:px-5 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="relative">
            <Logo className="w-6 h-6 text-slate-700 dark:text-slate-200" />
          </div>
          <span className="text-base font-semibold tracking-tight text-slate-800 dark:text-slate-100 hidden sm:inline">
            Northstar
          </span>
        </div>

        {/* Switch field dropdown */}
        <div className="relative flex-1 max-w-xs" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center justify-between gap-2 px-3.5 py-2 rounded-lg bg-white/40 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/40 text-sm text-slate-700 dark:text-slate-200 hover:border-slate-300/60 dark:hover:border-slate-600/50 transition-all group"
          >
            <span className="truncate flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {currentProfession ? (
                <>
                  <span className="text-slate-400 text-xs hidden sm:inline">{selectedFieldObj?.name} ·</span>
                  <span className="font-medium">{currentProfession.name}</span>
                </>
              ) : (
                "Select profession"
              )}
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute top-full mt-1.5 left-0 right-0 glass-panel rounded-xl py-2 max-h-96 overflow-y-auto z-50 shadow-lg scale-in origin-top">
              {fields.map((field) => (
                <div key={field.id}>
                  <div className="px-3.5 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="h-px flex-1 bg-slate-200/40 dark:bg-slate-700/30" />
                    {field.name}
                    <span className="h-px flex-1 bg-slate-200/40 dark:bg-slate-700/30" />
                  </div>
                  {professions
                    .filter((p) => p.field_id === field.id)
                    .map((prof) => (
                      <button
                        key={prof.id}
                        onClick={() => {
                          onProfessionChange(prof);
                          setDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2 text-sm transition-colors text-left group ${
                          currentProfession?.id === prof.id
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-700/30"
                        }`}
                      >
                        <span className="truncate">{prof.name}</span>
                        {currentProfession?.id === prof.id ? (
                          <Check className="w-3.5 h-3.5 text-blue-500 shrink-0 ml-2" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0 ml-2 -rotate-90 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </button>
                    ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-700/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 transition-transform ${refreshing ? "animate-spin" : ""}`} />
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-700/30 transition-all hover:scale-105 active:scale-95"
              title="Menu"
            >
              <Settings className={`w-4 h-4 transition-transform duration-300 ${menuOpen ? "rotate-90" : ""}`} />
            </button>
            {menuOpen && (
              <div className="absolute top-full mt-1.5 right-0 glass-panel rounded-xl py-1.5 min-w-[160px] z-50 shadow-lg scale-in origin-top-right">
                <button
                  onClick={() => {
                    onNavigateSettings();
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  Settings
                </button>
                <div className="h-px bg-slate-200/30 dark:bg-slate-700/30 my-1 mx-2" />
                <button
                  onClick={signOut}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-coral-600 dark:text-coral-400 hover:bg-coral-500/8 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
