import { db } from "@/db";
import { projects, quotations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ProjectBudget } from "@/components/projects/project-budget";
import { formatINR, formatINRCompact, percent } from "@/lib/format";
import { TrendingUp, Wallet, Receipt, PiggyBank } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const [allProjects, allInvoices] = await Promise.all([
    db.select().from(projects),
    db.select().from(quotations).where(eq(quotations.type, "invoice")),
  ]);

  const contractTotal = allProjects.reduce((s, p) => s + p.contractValue, 0);
  const budgetTotal = allProjects.reduce((s, p) => s + p.budget, 0);
  const consumedTotal = allProjects.reduce((s, p) => s + p.budgetConsumed, 0);
  const billed = allInvoices.reduce((s, i) => s + i.total, 0);
  const collected = allInvoices.reduce((s, i) => s + i.amountPaid, 0);
  const outstanding = billed - collected;
  const grossProfit = contractTotal - consumedTotal;

  const kpis = [
    { label: "Revenue (Contracts)", value: contractTotal, icon: TrendingUp, accent: true },
    { label: "Collected", value: collected, icon: Receipt },
    { label: "Outstanding", value: outstanding, icon: Wallet },
    { label: "Gross Profit", value: grossProfit, icon: PiggyBank },
  ];

  return (
    <div>
      <PageHeader
        kicker="Finance"
        title="Finance & Budgets"
        subtitle="Monitor revenue, expenses and margins — and stress-test any project budget live."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label} glass className={`p-5 ${k.accent ? "bg-lime/20" : ""}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{k.label}</span>
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${k.accent ? "bg-lime text-charcoal" : "bg-charcoal text-cream"}`}><Icon className="h-[18px] w-[18px]" /></div>
              </div>
              <p className="mt-3 font-display text-2xl font-bold text-charcoal-text">{formatINRCompact(k.value)}</p>
            </Card>
          );
        })}
      </div>

      <div className="mb-6 grid gap-5 lg:grid-cols-2">
        <Card glass>
          <CardHeader><CardTitle>Budget vs Actual by Project</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {allProjects.slice(0, 6).map((p) => {
              const util = p.budget ? (p.budgetConsumed / p.budget) * 100 : 0;
              return (
                <div key={p.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="truncate font-medium text-charcoal-text">{p.name}</span>
                    <span className="text-muted-foreground">{formatINRCompact(p.budgetConsumed)} / {formatINRCompact(p.budget)}</span>
                  </div>
                  <Progress value={util} indicatorClassName={util > 100 ? "bg-red-500" : util > 85 ? "bg-amber-400" : "bg-lime"} />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card glass>
          <CardHeader><CardTitle>Overall Position</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Line label="Total Contract Value" value={formatINR(contractTotal)} />
            <Line label="Total Budget" value={formatINR(budgetTotal)} />
            <Line label="Total Consumed" value={formatINR(consumedTotal)} />
            <Line label="Billed to Clients" value={formatINR(billed)} />
            <Line label="Collected" value={formatINR(collected)} accent />
            <Line label="Outstanding" value={formatINR(outstanding)} danger />
            <div className="mt-2 rounded-xl bg-lime/20 p-3">
              <p className="text-xs text-muted-foreground">Overall Gross Margin</p>
              <p className="font-display text-2xl font-bold text-charcoal-text">
                {contractTotal ? percent((grossProfit / contractTotal) * 100) : "0%"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <h2 className="mb-3 font-display text-xl font-bold text-charcoal-text">Project Budget Stress Tester</h2>
      <ProjectBudget budget={budgetTotal} consumed={consumedTotal} contractValue={contractTotal} />
    </div>
  );
}

function Line({ label, value, accent, danger }: { label: string; value: string; accent?: boolean; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold ${danger ? "text-red-600" : accent ? "text-emerald-600" : "text-charcoal-text"}`}>{value}</span>
    </div>
  );
}
