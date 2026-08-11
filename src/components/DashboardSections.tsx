import { TrendingUp, TrendingDown, ArrowUpRight, ExternalLink, BookOpen, FileText, Wrench, Compass, Newspaper, Sparkles, Clock, Radar } from "lucide-react";
import type { PulseItem, AscendingSkill, FadingSkill, LibraryItem, CompassPick } from "@/lib/supabase";
import { useState } from "react";

// ===== PULSE =====
export function PulseSection({ items, loading }: { items: PulseItem[]; loading: boolean }) {
  return (
    <section>
      <SectionLabel icon={<Newspaper className="w-3.5 h-3.5" />} label="Pulse" count={loading ? undefined : items.length} />

      {loading ? (
        <SkeletonCards count={4} />
      ) : items.length === 0 ? (
        <EmptyState message="No news collected yet. Try refreshing." icon={<Newspaper className="w-6 h-6" />} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 stagger">
          {items.map((item) => (
            <article
              key={item.id}
              className="glass-card glass-card-hover rounded-xl p-4 group"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <h3 className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-snug flex-1">
                  {item.headline}
                </h3>
                {item.source_url && (
                  <a
                    href={item.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-slate-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors mt-0.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-2">
                {item.summary}
              </p>
              {item.why_it_matters && (
                <div className="flex gap-2 mb-2.5 p-2 rounded-lg bg-blue-500/5 dark:bg-blue-500/8 border border-blue-400/15">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium leading-relaxed">
                    {item.why_it_matters}
                  </p>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="font-medium text-slate-500 dark:text-slate-400">{item.source}</span>
                {item.published_date && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(item.published_date)}
                    </span>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

// ===== SKILL RADAR =====
export function SkillRadarSection({
  ascending,
  fading,
  loading,
}: {
  ascending: AscendingSkill[];
  fading: FadingSkill[];
  loading: boolean;
}) {
  return (
    <section>
      <SectionLabel icon={<Radar className="w-3.5 h-3.5" />} label="Skill Radar" count={loading ? undefined : ascending.length + fading.length} />
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <SkeletonCards count={3} />
          <SkeletonCards count={3} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Ascending */}
          <div>
            <div className="flex items-center gap-1.5 mb-2.5 px-1">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-500/15">
                <TrendingUp className="w-3 h-3 text-teal-500" />
              </div>
              <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">Ascending Skills</span>
              {ascending.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  {ascending.length}
                </span>
              )}
            </div>
            <div className="space-y-2.5 stagger">
              {ascending.length === 0 ? (
                <EmptyState message="No skill analysis yet." icon={<TrendingUp className="w-6 h-6" />} />
              ) : (
                ascending.map((skill, i) => (
                  <div
                    key={skill.id}
                    className="glass-card glass-card-hover rounded-xl p-3.5 border-l-2 border-l-teal-400/50 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-teal-500/5 rounded-bl-full pointer-events-none" />
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] font-bold text-teal-400/50 mt-0.5">#{i + 1}</span>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-slate-800 dark:text-slate-100 mb-0.5">
                          {skill.name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-1">
                          {skill.description}
                        </p>
                        <p className="text-xs text-teal-600 dark:text-teal-400/90 leading-relaxed flex items-start gap-1">
                          <TrendingUp className="w-3 h-3 shrink-0 mt-0.5" />
                          {skill.why_rising}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Fading */}
          <div>
            <div className="flex items-center gap-1.5 mb-2.5 px-1">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-coral-500/15">
                <TrendingDown className="w-3 h-3 text-coral-500" />
              </div>
              <span className="text-xs font-semibold text-coral-600 dark:text-coral-400">Fading Skills</span>
              {fading.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-coral-500/10 text-coral-600 dark:text-coral-400">
                  {fading.length}
                </span>
              )}
            </div>
            <div className="space-y-2.5 stagger">
              {fading.length === 0 ? (
                <EmptyState message="No skill analysis yet." icon={<TrendingDown className="w-6 h-6" />} />
              ) : (
                fading.map((skill) => (
                  <div
                    key={skill.id}
                    className="glass-card glass-card-hover rounded-xl p-3.5 border-l-2 border-l-coral-400/50"
                  >
                    <h4 className="text-sm font-medium text-slate-800 dark:text-slate-100 mb-1">
                      {skill.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-2 flex items-start gap-1">
                      <TrendingDown className="w-3 h-3 shrink-0 mt-0.5 text-coral-400" />
                      {skill.why_fading}
                    </p>
                    <div className="space-y-1 mt-2 pt-2 border-t border-slate-200/30 dark:border-slate-700/30">
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
                        <span className="text-[10px] font-semibold text-slate-400 shrink-0 mt-0.5 uppercase tracking-wide">Still useful</span>
                        <span>{skill.still_useful_for}</span>
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
                        <span className="text-[10px] font-semibold text-teal-500 dark:text-teal-400 shrink-0 mt-0.5 uppercase tracking-wide">Alternative</span>
                        <span className="text-teal-600 dark:text-teal-400/90 font-medium">{skill.modern_alternative}</span>
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ===== FIELD LIBRARY =====
export function FieldLibrarySection({
  items,
  loading,
}: {
  items: LibraryItem[];
  loading: boolean;
}) {
  const [tab, setTab] = useState<"book" | "paper" | "tool">("book");

  const filtered = items.filter((i) => i.type === tab);
  const counts = {
    book: items.filter((i) => i.type === "book").length,
    paper: items.filter((i) => i.type === "paper").length,
    tool: items.filter((i) => i.type === "tool").length,
  };

  const tabIcon = (type: string) => {
    if (type === "book") return <BookOpen className="w-3.5 h-3.5" />;
    if (type === "paper") return <FileText className="w-3.5 h-3.5" />;
    return <Wrench className="w-3.5 h-3.5" />;
  };

  const tabLabel = (t: string) => t === "book" ? "Books" : t === "paper" ? "Papers" : "Tools";

  return (
    <section>
      <SectionLabel icon={<BookOpen className="w-3.5 h-3.5" />} label="Field Library" count={loading ? undefined : items.length} />

      <div className="flex gap-1 p-1 rounded-xl bg-slate-100/50 dark:bg-slate-800/30 mb-3 w-fit border border-slate-200/30 dark:border-slate-700/30">
        {(["book", "paper", "tool"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
              tab === t
                ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            {tabIcon(t)}
            {tabLabel(t)}
            {counts[t] > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                tab === t
                  ? "bg-slate-200/60 dark:bg-slate-600/40 text-slate-600 dark:text-slate-300"
                  : "bg-slate-200/40 dark:bg-slate-700/30 text-slate-400"
              }`}>
                {counts[t]}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonCards count={3} />
      ) : filtered.length === 0 ? (
        <EmptyState message={`No ${tab}s collected yet.`} icon={tabIcon(tab)} />
      ) : (
        <div className="space-y-2 stagger">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="glass-card glass-card-hover rounded-xl p-3.5 flex items-start gap-3 group"
            >
              <div className="shrink-0 mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200/40 dark:bg-slate-700/30 text-slate-400">
                {tabIcon(item.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-slate-800 dark:text-slate-100 mb-0.5">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-400 mb-1">{item.author_or_source}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {item.why_it_matters}
                </p>
              </div>
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-slate-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors mt-1"
                >
                  <ArrowUpRight className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ===== COMPASS PICK =====
export function CompassPickSection({ pick }: { pick: CompassPick | null }) {
  if (!pick) return null;
  return (
    <section>
      <SectionLabel icon={<Compass className="w-3.5 h-3.5" />} label="Compass Pick" />
      <div className="glass-card rounded-xl p-5 border-l-2 border-l-amber-400/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none" />
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/15">
            <Compass className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Compass Pick</span>
          <span className="text-xs text-slate-400 ml-auto px-2 py-0.5 rounded-full bg-slate-200/40 dark:bg-slate-700/30">{pick.week_label}</span>
        </div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1.5">
          {pick.title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {pick.body}
        </p>
      </div>
    </section>
  );
}

// ===== SHARED =====
function SectionLabel({ icon, label, count }: { icon?: React.ReactNode; label: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 mb-3 px-1">
      {icon && <span className="text-slate-400">{icon}</span>}
      <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        {label}
      </h2>
      {count !== undefined && count > 0 && (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200/50 dark:bg-slate-700/40 text-slate-400 font-medium">
          {count}
        </span>
      )}
    </div>
  );
}

function SkeletonCards({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card rounded-xl p-4">
          <div className="h-3.5 w-3/4 rounded mb-2.5 shimmer" />
          <div className="h-2.5 w-full rounded mb-1.5 shimmer" />
          <div className="h-2.5 w-2/3 rounded mb-2.5 shimmer" />
          <div className="flex gap-2">
            <div className="h-2 w-16 rounded shimmer" />
            <div className="h-2 w-12 rounded shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message, icon }: { message: string; icon?: React.ReactNode }) {
  return (
    <div className="glass-card rounded-xl p-8 text-center">
      {icon && (
        <div className="flex justify-center mb-3 text-slate-300 dark:text-slate-600">
          {icon}
        </div>
      )}
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
