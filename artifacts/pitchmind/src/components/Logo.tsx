export function Logo({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg bg-foreground text-background ${className ?? ""}`}
      style={{ width: size, height: size }}
      aria-label="PitchMind logo"
    >
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        width={size * 0.65}
        height={size * 0.65}
      >
        <path
          d="M6 24 L6 8 L14 8 C18.4183 8 22 11.5817 22 16 L22 16 C22 18.0 20.5 19.5 18.5 19.5 L13 19.5 L13 24"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="24" cy="9" r="3" fill="hsl(16 95% 55%)" />
      </svg>
    </span>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2 ${className ?? ""}`}
    >
      <Logo size={28} />
      <span className="font-display text-lg font-semibold tracking-tight">
        PitchMind
        <span className="text-primary">.</span>
      </span>
    </span>
  );
}
