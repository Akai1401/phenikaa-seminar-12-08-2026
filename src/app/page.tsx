import { Suspense } from "react";
import { CacheDebugTrace } from "@/app/cache-debug";
import { ItemForm } from "@/app/item-form";
import { ItemsSection } from "@/app/items-section";
import { Card, CardContent } from "@/components/ui/card";
import { searchItems } from "@/lib/items-store";
import { cn } from "@/lib/utils";

export default function Home(props: PageProps<"/">) {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <Dashboard searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Dashboard({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";
  const { data: items, trace } = await searchItems(query);
  const done = items.filter((item) => item.status === "done").length;
  const doing = items.filter((item) => item.status === "doing").length;
  const todo = items.filter((item) => item.status === "todo").length;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,color-mix(in_oklch,var(--accent)_38%,transparent),transparent_34rem),radial-gradient(circle_at_top_right,color-mix(in_oklch,var(--primary)_18%,transparent),transparent_30rem),linear-gradient(180deg,var(--background),var(--muted))]">
      <CacheDebugTrace trace={trace} />
      <div className="border-b bg-background/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
                CRUD dashboard
              </h1>
            </div>
            <div className="grid grid-cols-3 gap-3 lg:w-[360px]">
              <Metric label="Todo" value={todo} tone="danger" />
              <Metric label="Doing" value={doing} tone="warning" />
              <Metric label="Done" value={done} tone="success" />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[400px_1fr] lg:px-8">
        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <ItemForm />
        </aside>
        <ItemsSection items={items} query={query} />
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "danger" | "warning" | "success";
}) {
  const toneClass = {
    danger: "bg-red-100 text-red-900",
    warning: "bg-amber-100 text-amber-900",
    success: "bg-emerald-600 text-white",
  }[tone];

  return (
    <Card size="sm" className={cn("border-0 shadow-sm", toneClass)}>
      <CardContent className="pt-0">
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        <p className="mt-1 text-xs font-medium opacity-80">{label}</p>
      </CardContent>
    </Card>
  );
}

function DashboardFallback() {
  return <main className="min-h-screen bg-muted" aria-busy="true" />;
}
