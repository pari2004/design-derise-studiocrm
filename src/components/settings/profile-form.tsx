"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { updateProfile } from "@/app/(app)/settings/actions";

export function ProfileForm({
  defaults,
}: {
  defaults: { name: string; title: string; phone: string; email: string };
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateProfile(fd);
      if (res.ok) { toast.success("Profile updated"); router.refresh(); }
      else toast.error(res.error ?? "Failed");
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label>Full Name</Label>
        <Input name="name" defaultValue={defaults.name} required />
      </div>
      <div className="space-y-1.5">
        <Label>Email</Label>
        <Input defaultValue={defaults.email} disabled />
      </div>
      <div className="space-y-1.5">
        <Label>Job Title</Label>
        <Input name="title" defaultValue={defaults.title} placeholder="e.g. Lead Interior Designer" />
      </div>
      <div className="space-y-1.5">
        <Label>Phone</Label>
        <Input name="phone" defaultValue={defaults.phone} />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" variant="lime" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}Save changes
        </Button>
      </div>
    </form>
  );
}
