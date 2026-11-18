import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { BadgeVariant } from "@/lib/constants";

export function StatusBadge({
  map,
  value,
  fallback,
  ...props
}: {
  map: Record<string, { label: string; variant: BadgeVariant }>;
  value: string | null | undefined;
  fallback?: string;
} & Omit<BadgeProps, "variant">) {
  const entry = value ? map[value] : undefined;
  if (!entry) {
    return (
      <Badge variant="muted" {...props}>
        {fallback ?? value ?? "—"}
      </Badge>
    );
  }
  return (
    <Badge variant={entry.variant} {...props}>
      {entry.label}
    </Badge>
  );
}

export function SampleBadge() {
  return (
    <span
      title="Sample data — for demonstration"
      className="inline-flex items-center rounded-full border border-dashed border-taupe/60 bg-white/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-taupe"
    >
      Sample
    </span>
  );
}
