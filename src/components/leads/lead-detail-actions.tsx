"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, ArrowRightLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeadFormDialog } from "./lead-form-dialog";
import { toast } from "@/components/ui/sonner";
import { convertLead } from "@/app/(app)/leads/actions";
import type { Lead } from "@/db/schema";

export function LeadDetailActions({
  lead,
  designers,
}: {
  lead: Lead;
  designers: { id: string; name: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onConvert() {
    startTransition(async () => {
      const res = await convertLead(lead.id);
      if (res.ok) {
        toast.success("Converted to client & project");
        if (res.id) router.push(`/projects/${res.id}`);
      } else toast.error(res.error ?? "Failed");
    });
  }

  return (
    <div className="flex items-center gap-2">
      <LeadFormDialog
        designers={designers}
        lead={lead}
        trigger={
          <Button variant="secondary">
            <Pencil className="h-4 w-4" /> Edit
          </Button>
        }
      />
      {lead.status !== "won" && (
        <Button variant="lime" onClick={onConvert} disabled={pending}>
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRightLeft className="h-4 w-4" />
          )}
          Convert
        </Button>
      )}
    </div>
  );
}
