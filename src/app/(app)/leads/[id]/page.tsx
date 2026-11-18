import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Ruler,
  IndianRupee,
  Palette,
  Wrench,
  Radio,
  CalendarClock,
} from "lucide-react";
import { db } from "@/db";
import { leads, users } from "@/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, SampleBadge } from "@/components/shared/status-badge";
import { LEAD_STATUS } from "@/lib/constants";
import { formatINR, formatDate, formatNumber, initials } from "@/lib/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LeadDetailActions } from "@/components/leads/lead-detail-actions";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await db.query.leads.findFirst({ where: eq(leads.id, id) });
  if (!lead) notFound();

  const designer = lead.assignedDesignerId
    ? await db.query.users.findFirst({ where: eq(users.id, lead.assignedDesignerId) })
    : null;
  const designers = await db.select({ id: users.id, name: users.name }).from(users);

  const facts = [
    { icon: MapPin, label: "Location", value: lead.location ?? "—" },
    { icon: Ruler, label: "Property Size", value: lead.propertySize ? `${formatNumber(lead.propertySize)} sq ft` : "—" },
    { icon: IndianRupee, label: "Estimated Budget", value: lead.estimatedBudget ? formatINR(lead.estimatedBudget) : "—" },
    { icon: Palette, label: "Preferred Style", value: lead.designStyle ?? "—" },
    { icon: Wrench, label: "Service Required", value: lead.serviceRequired ?? "—" },
    { icon: Radio, label: "Lead Source", value: lead.source ?? "—" },
  ];

  const timeline = [
    { label: "Enquiry received", date: lead.enquiryDate, done: true },
    { label: "Follow-up scheduled", date: lead.followUpDate, done: !!lead.followUpDate },
    { label: "Won — converted to project", date: lead.convertedClientId ? lead.updatedAt : null, done: lead.status === "won" },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/leads"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-charcoal-text"
      >
        <ArrowLeft className="h-4 w-4" /> Back to leads
      </Link>

      <div className="glass mb-6 flex flex-col gap-4 rounded-2xl p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 text-lg">
            <AvatarFallback>{initials(lead.fullName)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-charcoal-text">
                {lead.fullName}
              </h1>
              {lead.isSample && <SampleBadge />}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {lead.phone && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" /> {lead.phone}
                </span>
              )}
              {lead.email && (
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" /> {lead.email}
                </span>
              )}
            </div>
            <div className="mt-2">
              <StatusBadge map={LEAD_STATUS} value={lead.status} />
            </div>
          </div>
        </div>
        <LeadDetailActions lead={lead} designers={designers} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card glass className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Enquiry Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {facts.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.label} className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sand/50">
                    <Icon className="h-4 w-4 text-taupe" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{f.label}</p>
                    <p className="text-sm font-medium text-charcoal-text">{f.value}</p>
                  </div>
                </div>
              );
            })}
            {lead.notes && (
              <div className="sm:col-span-2">
                <p className="mb-1 text-xs text-muted-foreground">Notes</p>
                <p className="rounded-xl bg-white/50 p-3 text-sm text-charcoal-text">
                  {lead.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card glass>
            <CardHeader>
              <CardTitle>Assigned Designer</CardTitle>
            </CardHeader>
            <CardContent>
              {designer ? (
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{initials(designer.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-charcoal-text">
                      {designer.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{designer.title}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Unassigned</p>
              )}
            </CardContent>
          </Card>

          <Card glass>
            <CardHeader>
              <CardTitle>Lead Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="relative space-y-5 border-l border-border/70 pl-5">
                {timeline.map((t, i) => (
                  <li key={i} className="relative">
                    <span
                      className={`absolute -left-[26px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full ${
                        t.done ? "bg-lime" : "bg-sand"
                      }`}
                    >
                      {t.done && <CalendarClock className="h-2.5 w-2.5 text-charcoal" />}
                    </span>
                    <p className="text-sm font-medium text-charcoal-text">{t.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.date ? formatDate(t.date) : "Pending"}
                    </p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
