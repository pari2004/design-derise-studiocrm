"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Phone,
  Mail,
  MapPin,
  FolderKanban,
  Users,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge, SampleBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ClientFormDialog } from "./client-form-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { toast } from "@/components/ui/sonner";
import { CLIENT_STATUS } from "@/lib/constants";
import { formatINRCompact, initials } from "@/lib/format";
import { deleteClient } from "@/app/(app)/clients/actions";
import type { Client } from "@/db/schema";

type Row = Client & { projectCount: number };

export function ClientsClient({ clients }: { clients: Row[] }) {
  const [q, setQ] = useState("");
  const [, startTransition] = useTransition();
  const router = useRouter();

  const filtered = useMemo(
    () =>
      clients.filter((c) =>
        `${c.name} ${c.email ?? ""} ${c.city ?? ""} ${c.propertyType ?? ""}`
          .toLowerCase()
          .includes(q.toLowerCase()),
      ),
    [clients, q],
  );

  function onDelete(id: string) {
    startTransition(async () => {
      const res = await deleteClient(id);
      if (res.ok) toast.success("Client deleted");
      else toast.error(res.error ?? "Failed");
      router.refresh();
    });
  }

  return (
    <>
      <div className="mb-5 max-w-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search clients…"
            className="pl-9"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients yet"
          description="Add your first client or convert a lead to get started."
          action={<ClientFormDialog />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Card key={c.id} glass className="glass-hover group p-5">
              <div className="flex items-start justify-between">
                <Link href={`/clients/${c.id}`} className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    {c.avatarUrl && <AvatarImage src={c.avatarUrl} alt={c.name} />}
                    <AvatarFallback>{initials(c.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-display font-semibold text-charcoal-text group-hover:underline">
                        {c.name}
                      </p>
                      {c.isSample && <SampleBadge />}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {c.propertyType ?? "—"}
                    </p>
                  </div>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <ClientFormDialog
                      client={c}
                      trigger={
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <Pencil className="h-4 w-4" /> Edit
                        </DropdownMenuItem>
                      }
                    />
                    <ConfirmDialog
                      title="Delete this client?"
                      description={`"${c.name}" will be permanently removed.`}
                      onConfirm={() => onDelete(c.id)}
                      trigger={
                        <DropdownMenuItem destructive onSelect={(e) => e.preventDefault()}>
                          <Trash2 className="h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      }
                    />
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                {c.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5" /> {c.phone}
                  </p>
                )}
                {c.email && (
                  <p className="flex items-center gap-2 truncate">
                    <Mail className="h-3.5 w-3.5 shrink-0" /> {c.email}
                  </p>
                )}
                {c.city && (
                  <p className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5" /> {c.city}
                  </p>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
                <StatusBadge map={CLIENT_STATUS} value={c.status} />
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <FolderKanban className="h-3.5 w-3.5" /> {c.projectCount} projects
                  </span>
                  {c.budgetPreference ? (
                    <span className="font-medium text-charcoal-text">
                      {formatINRCompact(c.budgetPreference)}
                    </span>
                  ) : null}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
