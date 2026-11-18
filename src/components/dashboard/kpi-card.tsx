"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  ArrowDownRight,
  ArrowUpRight,
  FolderKanban,
  UserPlus,
  Stamp,
  ShoppingCart,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatINRCompact, formatNumber } from "@/lib/format";

const ICONS: Record<string, LucideIcon> = {
  projects: FolderKanban,
  enquiries: UserPlus,
  approval: Stamp,
  procurement: ShoppingCart,
  revenue: TrendingUp,
  wallet: Wallet,
};

const FORMATTERS: Record<string, (n: number) => string> = {
  number: (n) => formatNumber(Math.round(n)),
  inr: (n) => formatINRCompact(n),
};

export type KpiProps = {
  label: string;
  value: number;
  icon: keyof typeof ICONS;
  format?: keyof typeof FORMATTERS;
  delta?: number;
  deltaLabel?: string;
  accent?: boolean;
};

export function KpiCard({
  label,
  value,
  icon,
  format = "number",
  delta,
  deltaLabel = "vs last month",
  accent,
}: KpiProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(0);
  const Icon = ICONS[icon] ?? FolderKanban;
  const fmt = FORMATTERS[format];

  useEffect(() => {
    if (!inView) return;
    const duration = 900;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(value * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  const positive = (delta ?? 0) >= 0;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4 }}
      className={cn(
        "glass glass-hover group relative overflow-hidden rounded-2xl p-5",
        accent && "bg-lime/20",
      )}
    >
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl",
            accent ? "bg-lime text-charcoal" : "bg-charcoal text-cream",
          )}
        >
          <Icon className="h-[18px] w-[18px]" />
        </div>
      </div>
      <div className="mt-3 font-display text-[28px] font-bold leading-none tracking-tight text-charcoal-text">
        {fmt(display)}
      </div>
      {delta !== undefined && (
        <div className="mt-2.5 flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold",
              positive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600",
            )}
          >
            {positive ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {Math.abs(delta)}%
          </span>
          <span className="text-muted-foreground">{deltaLabel}</span>
        </div>
      )}
    </motion.div>
  );
}
