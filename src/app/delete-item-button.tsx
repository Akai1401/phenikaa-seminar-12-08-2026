"use client";

import { useTransition } from "react";
import { deleteItemAction } from "@/app/actions";
import { useCacheDebugAction } from "@/app/cache-debug";
import { Button } from "@/components/ui/button";

export function DeleteItemButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const reportAction = useCacheDebugAction();

  function handleDelete() {
    startTransition(async () => {
      const state = await deleteItemAction(id);
      if (state.debug) reportAction?.(state.debug);
    });
  }

  return <Button type="button" variant="destructive" size="sm" disabled={pending} onClick={handleDelete}>{pending ? "Đang xóa..." : "Xóa"}</Button>;
}
