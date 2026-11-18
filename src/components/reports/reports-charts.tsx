"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  LabelList,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatINRCompact } from "@/lib/format";

/* Validated categorical colors (dataviz reference palette, light mode).
   Reserved brand lime is used for chrome, not for data marks that must be read. */
const C = {
  blue: "#2a78d6",
  orange: "#eb6834",
  aqua: "#1baf7a",
  yellow: "#eda100",
  grid: "#e7ddcd",
  axis: "#898781",
  ink: "#29251f",
};

const axisProps = {
  tick: { fontSize: 11, fill: C.axis },
  tickLine: false,
  axisLine: { stroke: C.grid },
};

function TooltipBox({ active, payload, label, money }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border/60 bg-cream/95 px-3 py-2 text-xs shadow-glass backdrop-blur-xl">
      <p className="mb-1 font-semibold text-charcoal-text">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="flex items-center gap-2 text-muted-foreground">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} />
          {p.name}: <span className="font-medium text-charcoal-text">{money ? formatINRCompact(p.value) : p.value}</span>
        </p>
      ))}
    </div>
  );
}

export function ReportsCharts({
  revenue,
  budgetActual,
  funnel,
  vendorSpend,
  completion,
}: {
  revenue: { month: string; value: number }[];
  budgetActual: { name: string; Budget: number; Actual: number }[];
  funnel: { stage: string; count: number }[];
  vendorSpend: { name: string; value: number }[];
  completion: { name: string; value: number }[];
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* Monthly Revenue */}
      <Card glass className="lg:col-span-2">
        <CardHeader><CardTitle>Monthly Revenue Collected</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenue} margin={{ top: 10, right: 12, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.blue} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={C.blue} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
              <XAxis dataKey="month" {...axisProps} />
              <YAxis {...axisProps} tickFormatter={(v) => formatINRCompact(v)} width={56} />
              <Tooltip content={<TooltipBox money />} cursor={{ stroke: C.axis, strokeDasharray: "3 3" }} />
              <Area type="monotone" dataKey="value" name="Revenue" stroke={C.blue} strokeWidth={2} fill="url(#revFill)" dot={{ r: 3, fill: C.blue }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Budget vs Actual */}
      <Card glass>
        <CardHeader><CardTitle>Budget vs Actual</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={budgetActual} margin={{ top: 10, right: 8, left: 4, bottom: 0 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
              <XAxis dataKey="name" {...axisProps} interval={0} tickFormatter={(v) => v.length > 10 ? v.slice(0, 10) + "…" : v} />
              <YAxis {...axisProps} tickFormatter={(v) => formatINRCompact(v)} width={56} />
              <Tooltip content={<TooltipBox money />} cursor={{ fill: "rgba(137,135,129,0.08)" }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Budget" fill={C.blue} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Actual" fill={C.orange} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Lead Funnel */}
      <Card glass>
        <CardHeader><CardTitle>Lead Conversion Funnel</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={funnel} layout="vertical" margin={{ top: 4, right: 28, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.grid} horizontal={false} />
              <XAxis type="number" {...axisProps} allowDecimals={false} />
              <YAxis type="category" dataKey="stage" {...axisProps} width={110} />
              <Tooltip content={<TooltipBox />} cursor={{ fill: "rgba(137,135,129,0.08)" }} />
              <Bar dataKey="count" name="Leads" fill={C.blue} radius={[0, 4, 4, 0]}>
                <LabelList dataKey="count" position="right" style={{ fontSize: 11, fill: C.ink }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Procurement spend by vendor */}
      <Card glass>
        <CardHeader><CardTitle>Procurement Spend by Vendor</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={vendorSpend} margin={{ top: 10, right: 8, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
              <XAxis dataKey="name" {...axisProps} interval={0} tickFormatter={(v) => v.length > 8 ? v.slice(0, 8) + "…" : v} />
              <YAxis {...axisProps} tickFormatter={(v) => formatINRCompact(v)} width={56} />
              <Tooltip content={<TooltipBox money />} cursor={{ fill: "rgba(137,135,129,0.08)" }} />
              <Bar dataKey="value" name="Spend" fill={C.aqua} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Project completion */}
      <Card glass>
        <CardHeader><CardTitle>Project Completion</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={completion} layout="vertical" margin={{ top: 4, right: 32, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.grid} horizontal={false} />
              <XAxis type="number" domain={[0, 100]} {...axisProps} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="name" {...axisProps} width={120} tickFormatter={(v) => v.length > 16 ? v.slice(0, 16) + "…" : v} />
              <Tooltip content={<TooltipBox />} cursor={{ fill: "rgba(137,135,129,0.08)" }} />
              <Bar dataKey="value" name="Completion %" radius={[0, 4, 4, 0]}>
                {completion.map((e, i) => (
                  <Cell key={i} fill={e.value >= 90 ? C.aqua : e.value >= 50 ? C.blue : C.yellow} />
                ))}
                <LabelList dataKey="value" position="right" formatter={(v: number) => `${v}%`} style={{ fontSize: 11, fill: C.ink }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
