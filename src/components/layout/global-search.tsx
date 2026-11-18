"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

type Result = {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  href: string;
};

const TYPE_LABELS: Record<string, string> = {
  project: "Project",
  client: "Client",
  lead: "Lead",
  vendor: "Vendor",
  material: "Material",
  task: "Task",
  document: "Document",
};

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => clearTimeout(t);
  }, [query]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      router.push(href);
    },
    [router],
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-10 w-full max-w-md items-center gap-2.5 rounded-full border border-border/60 bg-white/60 px-4 text-sm text-muted-foreground transition-colors hover:bg-white/80"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">
          Search clients, projects, materials…
        </span>
        <span className="sm:hidden">Search…</span>
        <kbd className="ml-auto hidden items-center gap-0.5 rounded-md border border-border bg-white/70 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground sm:flex">
          ⌘ K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="lg" className="top-[18%] translate-y-0 p-0">
          <DialogTitle className="sr-only">Global search</DialogTitle>
          <div className="flex items-center gap-3 border-b border-border/60 px-5 py-4">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search leads, clients, projects, vendors, materials…"
              className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground/70"
            />
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>

          <div className="max-h-[50vh] overflow-y-auto p-2 scroll-slim">
            {!query.trim() && (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                Type to search across your entire workspace.
              </p>
            )}
            {query.trim() && !loading && results.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                No results for “{query}”.
              </p>
            )}
            {results.map((r) => (
              <button
                key={`${r.type}-${r.id}`}
                onClick={() => go(r.href)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-sand/40"
              >
                <span className="rounded-md bg-sand/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-charcoal-text">
                  {TYPE_LABELS[r.type] ?? r.type}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-charcoal-text">
                    {r.title}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.subtitle}
                  </p>
                </div>
                <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100" />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
