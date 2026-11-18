"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatINR, formatINRCompact, percent } from "@/lib/format";
import { cn } from "@/lib/utils";

type SliderDef = {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  suffix?: string;
  format: (n: number) => string;
};

export function ProjectBudget({
  budget,
  consumed,
  contractValue,
}: {
  budget: number;
  consumed: number;
  contractValue: number;
}) {
  // Derive sensible starting values from the project's real numbers.
  const baseMaterial = Math.round(budget * 0.45);
  const baseLabour = Math.round(budget * 0.22);
  const baseFurniture = Math.round(budget * 0.18);

  const [materialCost, setMaterialCost] = useState(baseMaterial);
  const [labourCost, setLabourCost] = useState(baseLabour);
  const [furnitureCost, setFurnitureCost] = useState(baseFurniture);
  const [materialMarkup, setMaterialMarkup] = useState(25);
  const [furnitureMarkup, setFurnitureMarkup] = useState(40);
  const [contingency, setContingency] = useState(8);
  const [clientCap, setClientCap] = useState(contractValue || Math.round(budget * 1.2));

  const calc = useMemo(() => {
    const directCost = materialCost + labourCost + furnitureCost;
    const contingencyAmt = Math.round(directCost * (contingency / 100));
    const estimatedCost = directCost + contingencyAmt;
    const revenue =
      materialCost * (1 + materialMarkup / 100) +
      furnitureCost * (1 + furnitureMarkup / 100) +
      labourCost * 1.15; // standard labour margin
    const quotedToClient = Math.min(revenue, clientCap);
    const grossProfit = quotedToClient - estimatedCost;
    const margin = quotedToClient > 0 ? (grossProfit / quotedToClient) * 100 : 0;
    const utilization = clientCap > 0 ? (estimatedCost / clientCap) * 100 : 0;
    const overCap = revenue > clientCap;
    return {
      estimatedCost,
      revenue: quotedToClient,
      grossProfit,
      margin,
      utilization,
      remaining: clientCap - estimatedCost,
      overCap,
    };
  }, [
    materialCost, labourCost, furnitureCost, materialMarkup,
    furnitureMarkup, contingency, clientCap,
  ]);

  const sliders: SliderDef[] = [
    { key: "labour", label: "Labour Cost", min: 0, max: Math.max(budget, 2000000), step: 10000, value: labourCost, format: formatINRCompact },
    { key: "material", label: "Material Sourcing", min: 0, max: Math.max(budget, 3000000), step: 10000, value: materialCost, format: formatINRCompact },
    { key: "furniture", label: "Furniture Cost", min: 0, max: Math.max(budget, 2000000), step: 10000, value: furnitureCost, format: formatINRCompact },
    { key: "mmarkup", label: "Material Markup", min: 0, max: 80, step: 1, value: materialMarkup, suffix: "%", format: (n) => `${n}%` },
    { key: "fmarkup", label: "Furniture Markup", min: 0, max: 100, step: 1, value: furnitureMarkup, suffix: "%", format: (n) => `${n}%` },
    { key: "contingency", label: "Contingency", min: 0, max: 25, step: 1, value: contingency, suffix: "%", format: (n) => `${n}%` },
    { key: "cap", label: "Client Budget Cap", min: 0, max: Math.max(contractValue * 1.5, 5000000), step: 50000, value: clientCap, format: formatINRCompact },
  ];

  const setters: Record<string, (n: number) => void> = {
    labour: setLabourCost, material: setMaterialCost, furniture: setFurnitureCost,
    mmarkup: setMaterialMarkup, fmarkup: setFurnitureMarkup, contingency: setContingency, cap: setClientCap,
  };

  return (
    <div className="grid gap-5 lg:grid-cols-5">
      {/* Sliders */}
      <Card glass className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Budget Stress Tester</CardTitle>
          <p className="text-sm text-muted-foreground">
            Drag the controls to model costs, markups and your client cap in real time.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          {sliders.map((s) => (
            <div key={s.key}>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium text-charcoal-text">{s.label}</label>
                <span className="rounded-full bg-charcoal px-2.5 py-0.5 text-xs font-semibold text-cream">
                  {s.format(s.value)}
                </span>
              </div>
              <input
                type="range"
                min={s.min}
                max={s.max}
                step={s.step}
                value={s.value}
                onChange={(e) => setters[s.key](Number(e.target.value))}
                className="dds-range w-full"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Live results */}
      <div className="space-y-4 lg:col-span-2">
        <Card glass className={cn("overflow-hidden", calc.overCap && "ring-2 ring-amber-400")}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>Live Projection</CardTitle>
              <span className="chip chip-lime">● Live</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Metric label="Estimated Cost" value={formatINR(calc.estimatedCost)} />
            <Metric label="Project Revenue" value={formatINR(calc.revenue)} />
            <motion.div
              key={Math.round(calc.grossProfit)}
              initial={{ scale: 0.98 }}
              animate={{ scale: 1 }}
              className={cn(
                "rounded-xl p-3",
                calc.grossProfit >= 0 ? "bg-lime/20" : "bg-red-100",
              )}
            >
              <p className="text-xs text-muted-foreground">Gross Profit</p>
              <p className={cn("font-display text-2xl font-bold", calc.grossProfit >= 0 ? "text-charcoal-text" : "text-red-600")}>
                {formatINR(calc.grossProfit)}
              </p>
              <p className="text-xs font-medium text-muted-foreground">{calc.margin.toFixed(1)}% margin</p>
            </motion.div>

            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Budget Utilization</span>
                <span className="font-semibold text-charcoal-text">{percent(calc.utilization)}</span>
              </div>
              <Progress
                value={Math.min(100, calc.utilization)}
                indicatorClassName={calc.utilization > 100 ? "bg-red-500" : calc.utilization > 85 ? "bg-amber-400" : "bg-lime"}
              />
            </div>

            {calc.overCap && (
              <p className="rounded-lg bg-amber-100 px-3 py-2 text-xs font-medium text-amber-800">
                ⚠ Projected revenue exceeds the client budget cap — pricing is capped at {formatINRCompact(clientCap)}.
              </p>
            )}
          </CardContent>
        </Card>

        <Card glass>
          <CardContent className="grid grid-cols-2 gap-3 p-4">
            <div>
              <p className="text-xs text-muted-foreground">Actual Consumed</p>
              <p className="font-display text-lg font-bold text-charcoal-text">{formatINRCompact(consumed)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Remaining vs Cap</p>
              <p className={cn("font-display text-lg font-bold", calc.remaining >= 0 ? "text-emerald-600" : "text-red-600")}>
                {formatINRCompact(calc.remaining)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white/50 px-3 py-2.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-display text-base font-bold text-charcoal-text">{value}</span>
    </div>
  );
}
