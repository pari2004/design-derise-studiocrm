import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projects, leads, quotations, purchaseOrders, vendors } from "@/db/schema";
import { PageHeader } from "@/components/shared/page-header";
import { ReportsCharts } from "@/components/reports/reports-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatINR, formatINRCompact, percent } from "@/lib/format";
import { LEAD_STATUS } from "@/lib/constants";

export const dynamic = "force-dynamic";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default async function ReportsPage() {
  const [allProjects, allLeads, allInvoices, allPOs, allVendors] = await Promise.all([
    db.select().from(projects),
    db.select().from(leads),
    db.select().from(quotations).where(eq(quotations.type, "invoice")),
    db.select().from(purchaseOrders),
    db.select().from(vendors),
  ]);

  // Monthly revenue (last 8 months) from invoice payments by issue month
  const now = new Date();
  const revenue: { month: string; value: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const value = allInvoices
      .filter((inv) => {
        if (!inv.issueDate) return false;
        const id = new Date(inv.issueDate);
        return `${id.getFullYear()}-${id.getMonth()}` === key;
      })
      .reduce((s, inv) => s + inv.amountPaid, 0);
    revenue.push({ month: MONTHS[d.getMonth()], value });
  }

  // Budget vs actual (top 6 by budget)
  const budgetActual = [...allProjects]
    .sort((a, b) => b.budget - a.budget)
    .slice(0, 6)
    .map((p) => ({ name: p.name.replace(/^The /, ""), Budget: p.budget, Actual: p.budgetConsumed }));

  // Lead funnel by status (in pipeline order)
  const funnelOrder = ["new", "contacted", "consultation_scheduled", "proposal_sent", "negotiation", "won"];
  const funnel = funnelOrder.map((s) => ({
    stage: LEAD_STATUS[s].label,
    count: allLeads.filter((l) => l.status === s).length,
  }));

  // Procurement spend by vendor
  const vendorMap = new Map(allVendors.map((v) => [v.id, v.name]));
  const spendByVendor = new Map<string, number>();
  for (const po of allPOs) {
    const name = po.vendorId ? vendorMap.get(po.vendorId) ?? "Other" : "Other";
    spendByVendor.set(name, (spendByVendor.get(name) ?? 0) + po.amount);
  }
  const vendorSpend = [...spendByVendor.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // Completion
  const completion = [...allProjects]
    .sort((a, b) => b.completion - a.completion)
    .slice(0, 6)
    .map((p) => ({ name: p.name.replace(/^The /, ""), value: p.completion }));

  // Profitability table
  const profitability = [...allProjects]
    .map((p) => ({ name: p.name, contract: p.contractValue, cost: p.budgetConsumed, profit: p.contractValue - p.budgetConsumed, margin: p.contractValue ? ((p.contractValue - p.budgetConsumed) / p.contractValue) * 100 : 0 }))
    .sort((a, b) => b.profit - a.profit);

  const totalRevenue = allInvoices.reduce((s, i) => s + i.amountPaid, 0);
  const convRate = allLeads.length ? (allLeads.filter((l) => l.status === "won").length / allLeads.length) * 100 : 0;
  const totalProcurement = allPOs.reduce((s, p) => s + p.amount, 0);

  const kpis = [
    { label: "Revenue Collected", value: formatINRCompact(totalRevenue) },
    { label: "Lead Conversion", value: percent(convRate) },
    { label: "Procurement Spend", value: formatINRCompact(totalProcurement) },
    { label: "Active Projects", value: allProjects.filter((p) => p.status === "in_progress").length.toString() },
  ];

  return (
    <div>
      <PageHeader
        kicker="Finance"
        title="Reports & Analytics"
        subtitle="Live insights from your real data — revenue, conversion, budgets, procurement and profitability."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} glass className="p-5">
            <p className="text-sm text-muted-foreground">{k.label}</p>
            <p className="mt-1 font-display text-2xl font-bold text-charcoal-text">{k.value}</p>
          </Card>
        ))}
      </div>

      <ReportsCharts
        revenue={revenue}
        budgetActual={budgetActual}
        funnel={funnel}
        vendorSpend={vendorSpend}
        completion={completion}
      />

      <Card glass className="mt-5">
        <CardHeader><CardTitle>Project Profitability</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto scroll-slim">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-xs uppercase text-muted-foreground">
                  <th className="pb-2">Project</th>
                  <th className="pb-2 text-right">Contract</th>
                  <th className="pb-2 text-right">Cost</th>
                  <th className="pb-2 text-right">Gross Profit</th>
                  <th className="pb-2 text-right">Margin</th>
                </tr>
              </thead>
              <tbody>
                {profitability.map((p) => (
                  <tr key={p.name} className="border-b border-border/40">
                    <td className="py-2.5 font-medium text-charcoal-text">{p.name}</td>
                    <td className="py-2.5 text-right text-muted-foreground">{formatINR(p.contract)}</td>
                    <td className="py-2.5 text-right text-muted-foreground">{formatINR(p.cost)}</td>
                    <td className={`py-2.5 text-right font-semibold ${p.profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatINR(p.profit)}</td>
                    <td className="py-2.5 text-right font-medium text-charcoal-text">{percent(p.margin)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
