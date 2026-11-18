import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { ROLE_LABELS, type Role } from "@/lib/roles";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ProfileForm } from "@/components/settings/profile-form";
import { SampleBadge } from "@/components/shared/status-badge";
import { initials } from "@/lib/format";
import { Shield, Check } from "lucide-react";

export const dynamic = "force-dynamic";

const PERMISSIONS: Record<Role, string[]> = {
  admin: ["Full application access", "User & role management", "Financial overview", "System configuration"],
  project_manager: ["Manage assigned projects", "Tasks & timelines", "Coordinate procurement", "View clients & leads"],
  designer: ["Manage moodboards", "Upload design concepts", "Client approvals", "View materials"],
  procurement_manager: ["Manage vendors", "Manage materials", "Purchase orders", "View projects"],
  finance_manager: ["Manage budgets & expenses", "Quotations & invoices", "View clients", "Financial reports"],
};

export default async function SettingsPage() {
  const me = await getCurrentUser();
  const team = await db.select().from(users).orderBy(users.name);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader kicker="System" title="Settings" subtitle="Manage your profile, team and workspace preferences." />

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="team">Team ({team.length})</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card glass>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 text-lg">
                  {me?.avatarUrl && <AvatarImage src={me.avatarUrl} alt={me.name} />}
                  <AvatarFallback>{initials(me?.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{me?.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{me && ROLE_LABELS[me.role]}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {me && (
                <ProfileForm
                  defaults={{ name: me.name, title: me.title ?? "", phone: "", email: me.email }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((u) => (
              <Card key={u.id} glass className="p-5">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    {u.avatarUrl && <AvatarImage src={u.avatarUrl} alt={u.name} />}
                    <AvatarFallback>{initials(u.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate font-semibold text-charcoal-text">{u.name}</p>
                      {u.isSample && <SampleBadge />}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{u.title}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <Badge variant="secondary">{ROLE_LABELS[u.role]}</Badge>
                  <span className="truncate text-xs text-muted-foreground">{u.email}</span>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="roles">
          <div className="grid gap-4 md:grid-cols-2">
            {(Object.keys(PERMISSIONS) as Role[]).map((role) => (
              <Card key={role} glass className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-charcoal text-cream"><Shield className="h-4 w-4" /></div>
                  <h3 className="font-display font-semibold text-charcoal-text">{ROLE_LABELS[role]}</h3>
                </div>
                <ul className="space-y-1.5">
                  {PERMISSIONS[role].map((p) => (
                    <li key={p} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-lime-dark" /> {p}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="workspace">
          <Card glass>
            <CardHeader><CardTitle>Workspace</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <Row label="Workspace Name" value="DesignandDesireStudio Workspace" />
              <Row label="Industry" value="Interior Design & Architecture" />
              <Row label="Currency" value="Indian Rupee (₹)" />
              <Row label="Default GST Rate" value="18%" />
              <Row label="Base Location" value="Bengaluru, India" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/40 pb-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-charcoal-text">{value}</span>
    </div>
  );
}
