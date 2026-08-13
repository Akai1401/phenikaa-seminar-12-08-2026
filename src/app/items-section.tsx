"use client";

import { ArrowUpRight, CheckCircle2, Clock3, RefreshCw } from "lucide-react";
import { CacheDebugLink } from "@/app/cache-debug";
import { DeleteItemButton } from "@/app/delete-item-button";
import { ItemSearch } from "@/app/item-search";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Item } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusLabels = { todo: "Todo", doing: "Doing", done: "Done" } as const;
const statusMeta = {
  todo: { variant: "secondary", icon: Clock3, className: "bg-red-100 text-red-800" },
  doing: { variant: "outline", icon: RefreshCw, className: "border-amber-200 bg-amber-100 text-amber-800" },
  done: { variant: "default", icon: CheckCircle2, className: "bg-emerald-600 text-white" },
} as const;

export function ItemsSection({ items, query }: { items: Item[]; query: string }) {
  return (
    <section className="space-y-6" aria-labelledby="items-heading">
      <Card className="bg-card/90 backdrop-blur">
        <CardHeader>
          <CardTitle id="items-heading" className="text-2xl font-semibold tracking-tight">Items</CardTitle>
          <CardAction><Badge variant="secondary">{items.length} bản ghi</Badge></CardAction>
        </CardHeader>
        <CardContent className="space-y-3">
          <ItemSearch initialQuery={query} />
          {items.length === 0 ? (
            <div className="rounded-xl bg-muted/40 px-6 py-12 text-center">
              <h3 className="text-lg font-semibold tracking-tight">{query ? "Không tìm thấy item phù hợp" : "Chưa có item nào"}</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{query ? "Thử từ khóa khác hoặc xóa bộ lọc tìm kiếm." : "Tạo item đầu tiên bằng form bên trái."}</p>
            </div>
          ) : items.map((item) => {
            const StatusIcon = statusMeta[item.status].icon;
            return (
              <article key={item.id} className="group rounded-xl bg-muted/40 p-4 transition-colors hover:bg-muted/70">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={statusMeta[item.status].variant} className={cn("gap-1.5", statusMeta[item.status].className)}><StatusIcon className="size-3.5" />{statusLabels[item.status]}</Badge>
                      <span className="text-sm text-muted-foreground">{new Date(item.updatedAt).toLocaleString("vi-VN")}</span>
                    </div>
                    <div className="space-y-1"><h3 className="text-lg font-semibold tracking-tight">{item.title}</h3><p className="max-w-3xl text-sm leading-6 text-muted-foreground">{item.description}</p></div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <CacheDebugLink href={`/items/${item.id}`} prefetch className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>Sửa<ArrowUpRight className="size-3.5" /></CacheDebugLink>
                    <DeleteItemButton id={item.id} />
                  </div>
                </div>
              </article>
            );
          })}
        </CardContent>
      </Card>
    </section>
  );
}
