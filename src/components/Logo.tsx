export function Logo({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Outer compass ring */}
      <circle cx="16" cy="16" r="13" opacity="0.35" />
      {/* North star — four-point star */}
      <path d="M16 4 L18.5 13.5 L28 16 L18.5 18.5 L16 28 L13.5 18.5 L4 16 L13.5 13.5 Z" fill="currentColor" stroke="none" opacity="0.9" />
      {/* Center dot */}
      <circle cx="16" cy="16" r="1.5" fill="white" stroke="none" />
    </svg>
  );
}

export function LogoWithWordmark({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <Logo className="w-7 h-7 text-slate-700 dark:text-slate-200" />
      <span className="text-lg font-semibold tracking-tight text-slate-800 dark:text-slate-100">
        Northstar
      </span>
    </div>
  );
}
