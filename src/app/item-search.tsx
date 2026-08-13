"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCacheDebugNavigation } from "@/app/cache-debug";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ItemSearch({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const beginNavigation = useCacheDebugNavigation();
  const [value, setValue] = useState(initialQuery);

  useEffect(() => {
    if (value.trim() === initialQuery) return;
    const timeout = window.setTimeout(() => {
      const query = value.trim();
      const destination = query ? `${pathname}?q=${encodeURIComponent(query)}` : pathname;
      beginNavigation?.(destination);
      router.replace(destination, { scroll: false });
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [beginNavigation, initialQuery, pathname, router, value]);

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input value={value} onChange={(event) => setValue(event.target.value)} placeholder="Tìm trên MongoDB..." aria-label="Tìm kiếm item" className="h-10 bg-background pl-9 pr-10" />
      {value ? <Button type="button" variant="ghost" size="icon-sm" aria-label="Xóa từ khóa tìm kiếm" className="absolute right-1 top-1/2 -translate-y-1/2" onClick={() => setValue("")}><X className="size-4" /></Button> : null}
    </div>
  );
}
