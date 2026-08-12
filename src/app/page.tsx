import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Clock3, RefreshCw } from "lucide-react";
import { deleteItemAction } from "@/app/actions";
import { ItemForm } from "@/app/item-form";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getItems } from "@/lib/items-store";
import { cn } from "@/lib/utils";

const statusLabels = {
  todo: "Todo",
  doing: "Doing",
  done: "Done",
};

const statusMeta = {
  todo: { variant: "secondary", icon: Clock3, className: "bg-red-100 text-red-800" },
  doing: { variant: "outline", icon: RefreshCw, className: "border-amber-200 bg-amber-100 text-amber-800" },
  done: { variant: "default", icon: CheckCircle2, className: "bg-emerald-600 text-white" },
} as const;

export default async function Home() {
  const items = await getItems();
  const total = items.length;
  const done = items.filter((item) => item.status === "done").length;
  const doing = items.filter((item) => item.status === "doing").length;
  const todo = items.filter((item) => item.status === "todo").length;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,color-mix(in_oklch,var(--accent)_38%,transparent),transparent_34rem),radial-gradient(circle_at_top_right,color-mix(in_oklch,var(--primary)_18%,transparent),transparent_30rem),linear-gradient(180deg,var(--background),var(--muted))]">
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

        <section className="space-y-6" aria-labelledby="items-heading">
          <Card className="bg-card/90 backdrop-blur">
            <CardHeader>
              <CardTitle id="items-heading" className="text-2xl font-semibold tracking-tight">
                Items
              </CardTitle>
              <CardAction>
                <Badge variant="secondary">{total} bản ghi</Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.length === 0 ? (
                <EmptyState />
              ) : (
                items.map((item) => {
                  const StatusIcon = statusMeta[item.status].icon;

                  return (
                    <article
                      key={item.id}
                      className="group rounded-xl bg-muted/40 p-4 transition-colors hover:bg-muted/70"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={statusMeta[item.status].variant} className={cn("gap-1.5", statusMeta[item.status].className)}>
                              <StatusIcon className="size-3.5" />
                              {statusLabels[item.status]}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(item.updatedAt).toLocaleString("vi-VN")}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-lg font-semibold tracking-tight">
                              {item.title}
                            </h3>
                            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                              {item.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <Link
                            href={`/items/${item.id}`}
                            prefetch
                            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                          >
                            Sửa
                            <ArrowUpRight className="size-3.5" />
                          </Link>
                          <form action={deleteItemAction}>
                            <input type="hidden" name="id" value={item.id} />
                            <Button type="submit" variant="destructive" size="sm">
                              Xóa
                            </Button>
                          </form>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </CardContent>
          </Card>
        </section>
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

function EmptyState() {
  return (
    <div className="rounded-xl bg-muted/40 px-6 py-12 text-center">
      <h3 className="text-lg font-semibold tracking-tight">Chưa có item nào</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        Tạo item đầu tiên bằng form bên trái.
      </p>
    </div>
  );
}
