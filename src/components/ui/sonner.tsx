"use client";
import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            "group rounded-xl border border-border/60 bg-cream/95 text-charcoal-text shadow-glass backdrop-blur-xl",
          description: "text-muted-foreground",
          actionButton: "bg-charcoal text-cream rounded-full",
          cancelButton: "bg-sand text-charcoal-text rounded-full",
        },
      }}
    />
  );
}

export { toast } from "sonner";
