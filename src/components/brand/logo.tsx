import { cn } from "@/lib/utils";

/** DesignandDesireStudio monogram — a lime diamond with interlocking D's. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-xl bg-lime shadow-lime",
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-5 w-5 text-charcoal"
        aria-hidden
      >
        <path
          d="M4 4h6a8 8 0 0 1 0 16H4V4Z"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path
          d="M14 4h2a4 4 0 0 1 0 8M14 12v8"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function LogoWordmark({
  className,
  subtitle = true,
}: {
  className?: string;
  subtitle?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <div className="leading-tight">
        <div className="font-display text-[15px] font-bold tracking-tight text-charcoal-text">
          Design<span className="text-taupe">and</span>Desire
          <span className="text-taupe">Studio</span>
        </div>
        {subtitle && (
          <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Workspace
          </div>
        )}
      </div>
    </div>
  );
}
