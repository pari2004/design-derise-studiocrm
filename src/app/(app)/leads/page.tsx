import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { leads, users } from "@/db/schema";
import { PageHeader } from "@/components/shared/page-header";
import { LeadsClient } from "@/components/leads/leads-client";
import { LeadFormDialog } from "@/components/leads/lead-form-dialog";
import { Card } from "@/components/ui/card";
import { TrendingUp, UserPlus, Target, Trophy } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const sp = await searchParams;
  const [rows, designers] = await Promise.all([
    db
      .select({ lead: leads, designerName: users.name })
      .from(leads)
      .leftJoin(users, eq(leads.assignedDesignerId, users.id))
      .orderBy(desc(leads.enquiryDate)),
    db.select({ id: users.id, name: users.name }).from(users),
  ]);

  const data = rows.map((r) => ({ ...r.lead, designerName: r.designerName }));
  const total = data.length;
  const converted = data.filter((l) => l.status === "won").length;
  const active = data.filter(
    (l) => !["won", "lost", "archived"].includes(l.status),
  ).length;
  const conversionRate = total ? Math.round((converted / total) * 100) : 0;

  const stats = [
    { label: "Total Leads", value: total, icon: UserPlus },
    { label: "Active Pipeline", value: active, icon: Target },
    { label: "Won", value: converted, icon: Trophy },
    { label: "Conversion Rate", value: `${conversionRate}%`, icon: TrendingUp },
  ];

  return (
    <div>
      <PageHeader
        kicker="Sales"
        title="Leads & Enquiries"
        subtitle="Capture, qualify and convert incoming enquiries into live projects."
      >
        <LeadFormDialog designers={designers} />
      </PageHeader>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} glass className="flex items-center gap-3 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-charcoal text-cream">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-charcoal-text">
                  {s.value}
                </p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </Card>
          );
        })}
      </div>

      <LeadsClient leads={data} designers={designers} openNew={sp.new === "1"} />
    </div>
  );
}
