"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { MapPin, CalendarClock, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { PROJECT_STAGES, PROJECT_STATUS } from "@/lib/constants";
import { formatINRCompact, formatDateShort, initials, percent } from "@/lib/format";
import { Progress } from "@/components/ui/progress";
import { StatusBadge, SampleBadge } from "@/components/shared/status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/components/ui/sonner";
import { updateProjectStage } from "@/app/(app)/pipeline/actions";

export type PipelineCard = {
  id: string;
  name: string;
  clientName: string | null;
  projectType: string | null;
  location: string | null;
  coverImage: string | null;
  contractValue: number;
  budget: number;
  budgetConsumed: number;
  completion: number;
  status: string;
  stage: string;
  nextDeadline: string | null;
  pmName: string | null;
  pmAvatar: string | null;
  isSample: boolean;
};

export function KanbanBoard({ initial }: { initial: PipelineCard[] }) {
  const [cards, setCards] = useState(initial);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function onDrop(stage: string) {
    const id = dragId;
    setOverStage(null);
    setDragId(null);
    if (!id) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.stage === stage) return;

    const prevStage = card.stage;
    setCards((cs) => cs.map((c) => (c.id === id ? { ...c, stage } : c)));

    startTransition(async () => {
      const res = await updateProjectStage(id, stage);
      if (!res.ok) {
        setCards((cs) =>
          cs.map((c) => (c.id === id ? { ...c, stage: prevStage } : c)),
        );
        toast.error(res.error ?? "Could not move project");
      } else {
        const label = PROJECT_STAGES.find((s) => s.value === stage)?.label;
        toast.success(`${card.name} → ${label}`);
      }
    });
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scroll-slim">
      {PROJECT_STAGES.map((stage) => {
        const items = cards.filter((c) => c.stage === stage.value);
        const isOver = overStage === stage.value;
        return (
          <div
            key={stage.value}
            onDragOver={(e) => {
              e.preventDefault();
              setOverStage(stage.value);
            }}
            onDragLeave={() => setOverStage((s) => (s === stage.value ? null : s))}
            onDrop={() => onDrop(stage.value)}
            className={cn(
              "flex w-[300px] shrink-0 flex-col rounded-2xl border bg-white/45 backdrop-blur-md transition-colors",
              isOver ? "border-lime bg-lime/10" : "border-white/50",
            )}
          >
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-charcoal" />
                <h3 className="text-sm font-semibold text-charcoal-text">
                  {stage.label}
                </h3>
              </div>
              <span className="rounded-full bg-sand/60 px-2 py-0.5 text-xs font-semibold text-charcoal-text">
                {items.length}
              </span>
            </div>

            <div className="flex flex-1 flex-col gap-3 px-3 pb-3">
              {items.length === 0 && (
                <div className="rounded-xl border border-dashed border-border/70 py-8 text-center text-xs text-muted-foreground">
                  Drop projects here
                </div>
              )}
              {items.map((card) => (
                <motion.div
                  layout
                  key={card.id}
                  draggable
                  onDragStart={() => setDragId(card.id)}
                  onDragEnd={() => setDragId(null)}
                  className={cn(
                    "group cursor-grab overflow-hidden rounded-xl border border-white/60 bg-cream/90 shadow-soft transition-all active:cursor-grabbing",
                    dragId === card.id && "opacity-50",
                  )}
                >
                  <div className="relative h-28 w-full overflow-hidden">
                    {card.coverImage ? (
                      <Image
                        src={card.coverImage}
                        alt={card.name}
                        fill
                        sizes="300px"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-sand" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 to-transparent" />
                    <div className="absolute left-2 top-2 flex items-center gap-1.5">
                      <StatusBadge map={PROJECT_STATUS} value={card.status} />
                      {card.isSample && <SampleBadge />}
                    </div>
                    <GripVertical className="absolute right-2 top-2 h-4 w-4 text-white/70 opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="absolute bottom-2 left-2.5 right-2.5">
                      <Link
                        href={`/projects/${card.id}`}
                        className="line-clamp-1 font-display text-sm font-semibold text-cream hover:underline"
                      >
                        {card.name}
                      </Link>
                      <p className="line-clamp-1 text-[11px] text-cream/80">
                        {card.clientName ?? "—"} · {card.projectType ?? ""}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5 p-3">
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {card.location ?? "—"}
                    </div>

                    <div>
                      <div className="mb-1 flex items-center justify-between text-[11px]">
                        <span className="font-medium text-charcoal-text">
                          {formatINRCompact(card.budgetConsumed)} of{" "}
                          {formatINRCompact(card.budget)}
                        </span>
                        <span className="font-semibold text-charcoal-text">
                          {percent(card.completion)}
                        </span>
                      </div>
                      <Progress value={card.completion} />
                    </div>

                    <div className="flex items-center justify-between pt-0.5">
                      <div className="flex items-center gap-1.5">
                        <Avatar className="h-6 w-6 ring-2 ring-white">
                          {card.pmAvatar && (
                            <AvatarImage src={card.pmAvatar} alt={card.pmName ?? ""} />
                          )}
                          <AvatarFallback className="text-[9px]">
                            {initials(card.pmName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-[11px] text-muted-foreground">
                          {card.pmName ?? "Unassigned"}
                        </span>
                      </div>
                      {card.nextDeadline && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sand/50 px-2 py-0.5 text-[10px] font-medium text-charcoal-text">
                          <CalendarClock className="h-3 w-3" />
                          {formatDateShort(card.nextDeadline)}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
