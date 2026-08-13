import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { ItemForm } from "@/app/item-form";
import { CacheDebugLink, CacheDebugTrace } from "@/app/cache-debug";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getItem, getItemIds } from "@/lib/items-store";
import { cn } from "@/lib/utils";

type EditItemPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  return getItemIds();
}

export default function EditItemPage({ params }: EditItemPageProps) {
  return (
    <Suspense fallback={<DetailFallback />}>
      <EditItemContent params={params} />
    </Suspense>
  );
}

async function EditItemContent({ params }: EditItemPageProps) {
  const { id } = await params;
  const { data: item, trace } = await getItem(id);

  if (!item) notFound();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,color-mix(in_oklch,var(--accent)_38%,transparent),transparent_32rem),radial-gradient(circle_at_top_right,color-mix(in_oklch,var(--primary)_18%,transparent),transparent_28rem),linear-gradient(180deg,var(--background),var(--muted))]">
      <CacheDebugTrace trace={trace} />
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <CacheDebugLink
          href="/"
          prefetch
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <ArrowLeft className="size-3.5" />
          Về danh sách
        </CacheDebugLink>

        <Card className="bg-card/90 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-3xl font-semibold tracking-tight">
              Cập nhật item
            </CardTitle>
          </CardHeader>
        </Card>

        <ItemForm item={item} />
      </div>
    </main>
  );
}

function DetailFallback() {
  return <main className="min-h-screen bg-muted" aria-busy="true" />;
}
