"use client";

import Link, { type LinkProps } from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  createContext,
  type MouseEventHandler,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type ServerDataSource = "database" | "data-cache";

type ServerTrace = {
  cacheKey: string;
  generationId: string;
  operation: string;
  source: ServerDataSource;
};

type CacheResult = {
  destination: string;
  layer:
    | "client-router-cache"
    | "server-data-cache"
    | "mongodb"
    | "no-database"
    | "database-error";
  message: string;
  timestamp: string;
};

type PendingNavigation = {
  destination: string;
  resourceCount: number;
  startedAt: number;
};

type CacheDebugContextValue = {
  beginNavigation: (destination: string) => void;
  reportServerTrace: (trace: ServerTrace) => void;
  reportAction: (
    debug: NonNullable<import("@/lib/types").ActionState["debug"]>,
  ) => void;
};

const CacheDebugContext = createContext<CacheDebugContextValue | null>(null);

function getResourceEntries() {
  return performance.getEntriesByType(
    "resource",
  ) as PerformanceResourceTiming[];
}

function isRscRequest(entry: PerformanceResourceTiming) {
  return entry.name.includes("_rsc=");
}

export function CacheDebugProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pendingRef = useRef<PendingNavigation | null>(null);
  const serverTraceRef = useRef<ServerTrace | null>(null);
  const [result, setResult] = useState<CacheResult | null>(null);

  const beginNavigation = useCallback((destination: string) => {
    pendingRef.current = {
      destination,
      resourceCount: getResourceEntries().length,
      startedAt: performance.now(),
    };
    serverTraceRef.current = null;
  }, []);

  const reportServerTrace = useCallback((trace: ServerTrace) => {
    serverTraceRef.current = trace;
  }, []);

  const reportAction = useCallback(
    (debug: NonNullable<import("@/lib/types").ActionState["debug"]>) => {
      const operation = debug.operation.toUpperCase();
      const timestamp = new Date().toLocaleTimeString("vi-VN");
      if (debug.outcome === "mongodb") {
        setResult({
          destination: debug.itemId
            ? `${operation} ${debug.itemId}`
            : operation,
          layer: "mongodb",
          message: `Server Action ${debug.operation} đã thực thi MongoDB write và invalidate cache liên quan.`,
          timestamp,
        });
      } else if (debug.outcome === "database-error") {
        setResult({
          destination: debug.itemId
            ? `${operation} ${debug.itemId}`
            : operation,
          layer: "database-error",
          message: `Server Action ${debug.operation} đã gọi database nhưng thất bại.`,
          timestamp,
        });
      } else {
        setResult({
          destination: debug.itemId
            ? `${operation} ${debug.itemId}`
            : operation,
          layer: "no-database",
          message:
            debug.outcome === "validation"
              ? "Validation thất bại trước khi gọi MongoDB."
              : "Không tìm thấy bản ghi; action không thay đổi dữ liệu.",
          timestamp,
        });
      }
    },
    [],
  );

  useEffect(() => {
    const pending = pendingRef.current;
    if (!pending) return;

    const timeout = window.setTimeout(() => {
      const newResources = getResourceEntries().slice(pending.resourceCount);
      const rscRequest = newResources.find(
        (entry) => isRscRequest(entry) && entry.startTime >= pending.startedAt,
      );
      const trace = serverTraceRef.current;
      const timestamp = new Date().toLocaleTimeString("vi-VN");

      if (!rscRequest) {
        setResult({
          destination: pending.destination,
          layer: "client-router-cache",
          message: "Không gửi RSC request và không gọi server/DB.",
          timestamp,
        });
      } else if (trace?.source === "database") {
        setResult({
          destination: pending.destination,
          layer: "mongodb",
          message: `${trace.operation} thực thi MongoDB; cache key ${trace.cacheKey}.`,
          timestamp,
        });
      } else {
        setResult({
          destination: pending.destination,
          layer: "server-data-cache",
          message: trace
            ? `${trace.operation} dùng Server Data Cache; không query MongoDB.`
            : "Có RSC request tới server nhưng không có MongoDB query.",
          timestamp,
        });
      }

      pendingRef.current = null;
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [pathname, searchParams]);

  const labels = {
    "client-router-cache": "CLIENT ROUTER CACHE",
    "server-data-cache": "SERVER DATA CACHE",
    mongodb: "MONGODB QUERY",
    "no-database": "NO DATABASE",
    "database-error": "DATABASE ERROR",
  } as const;
  const colors = {
    "client-router-cache": "bg-blue-600",
    "server-data-cache": "bg-emerald-600",
    mongodb: "bg-amber-600",
    "no-database": "bg-slate-600",
    "database-error": "bg-red-600",
  } as const;

  return (
    <CacheDebugContext.Provider
      value={{ beginNavigation, reportServerTrace, reportAction }}
    >
      {children}
      <aside className="fixed bottom-4 right-4 z-50 w-[min(420px,calc(100vw-2rem))] rounded-xl border bg-background/95 p-4 text-sm shadow-xl backdrop-blur">
        <p className="font-semibold">Cache Debug</p>
        {result ? (
          <div className="mt-2 space-y-1">
            <span
              className={`inline-flex rounded px-2 py-1 text-xs font-semibold text-white ${colors[result.layer]}`}
            >
              {labels[result.layer]}
            </span>
            <p className="break-all text-xs text-muted-foreground">
              {result.destination}
            </p>
            <p>{result.message}</p>
            <p className="text-xs text-muted-foreground">{result.timestamp}</p>
          </div>
        ) : (
          <p className="mt-2 text-muted-foreground">...</p>
        )}
      </aside>
    </CacheDebugContext.Provider>
  );
}

export function CacheDebugTrace({ trace }: { trace: ServerTrace }) {
  const context = useContext(CacheDebugContext);

  useEffect(() => {
    context?.reportServerTrace(trace);
  }, [context, trace]);

  return null;
}

export function CacheDebugLink({
  href,
  onClick,
  ...props
}: LinkProps &
  Omit<React.ComponentProps<"a">, keyof LinkProps> & { href: string }) {
  const context = useContext(CacheDebugContext);
  const handleClick: MouseEventHandler<HTMLAnchorElement> = (event) => {
    onClick?.(event);
    if (!event.defaultPrevented && event.button === 0) {
      context?.beginNavigation(href);
    }
  };

  return <Link href={href} onClick={handleClick} {...props} />;
}

export function useCacheDebugNavigation() {
  const context = useContext(CacheDebugContext);
  return context?.beginNavigation;
}

export function useCacheDebugAction() {
  const context = useContext(CacheDebugContext);
  return context?.reportAction;
}
