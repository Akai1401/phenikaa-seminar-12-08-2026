"use client";

import { useActionState, useEffect } from "react";
import { Save } from "lucide-react";
import { createItemAction, updateItemAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ActionState, Item } from "@/lib/types";
import { useCacheDebugAction } from "@/app/cache-debug";

const initialState: ActionState = { ok: false, message: "" };

type ItemFormProps = {
  item?: Item;
};

export function ItemForm({ item }: ItemFormProps) {
  const action = item ? updateItemAction.bind(null, item.id) : createItemAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const reportAction = useCacheDebugAction();

  useEffect(() => {
    if (state.debug) reportAction?.(state.debug);
  }, [reportAction, state.debug]);

  return (
    <Card className="bg-card/90 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-xl font-semibold tracking-tight">
          {item ? "Cập nhật item" : "Tạo item mới"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Tiêu đề</Label>
            <Input
              id="title"
              name="title"
              type="text"
              defaultValue={item?.title}
              placeholder="Chuẩn bị demo CRUD"
              aria-invalid={Boolean(state.errors?.title)}
              className="h-10 bg-background"
            />
            {state.errors?.title ? (
              <p className="text-sm text-destructive">{state.errors.title}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={item?.description}
              placeholder="Mô tả ngắn về item"
              rows={4}
              aria-invalid={Boolean(state.errors?.description)}
              className="bg-background"
            />
            {state.errors?.description ? (
              <p className="text-sm text-destructive">
                {state.errors.description}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Trạng thái</Label>
            <Select name="status" defaultValue={item?.status ?? "todo"}>
              <SelectTrigger id="status" className="h-10 w-full bg-background">
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">Todo</SelectItem>
                <SelectItem value="doing">Doing</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
            {state.errors?.status ? (
              <p className="text-sm text-destructive">{state.errors.status}</p>
            ) : null}
          </div>

          {state.message ? (
            <div
              className={
                state.ok
                  ? "rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground"
                  : "rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
              }
            >
              {state.message}
            </div>
          ) : null}

          <div>
            <Button type="submit" disabled={pending} className="shadow-sm">
              <Save className="size-4" />
              {pending ? "Đang lưu..." : item ? "Cập nhật" : "Tạo mới"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
