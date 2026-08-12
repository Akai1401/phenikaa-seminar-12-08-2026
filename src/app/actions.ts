"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import {
  createItem,
  deleteItem,
  ITEMS_CACHE_TAG,
  updateItem,
} from "@/lib/items-store";
import type { ActionState, Item } from "@/lib/types";

const statuses = new Set<Item["status"]>(["todo", "doing", "done"]);

function parseItemForm(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const status = String(formData.get("status") ?? "todo") as Item["status"];
  const errors: Record<string, string> = {};

  if (title.length < 3) errors.title = "Tiêu đề cần ít nhất 3 ký tự.";
  if (description.length < 5) {
    errors.description = "Mô tả cần ít nhất 5 ký tự.";
  }
  if (!statuses.has(status)) errors.status = "Trạng thái không hợp lệ.";

  return { data: { title, description, status }, errors };
}

export async function createItemAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { data, errors } = parseItemForm(formData);

  if (Object.keys(errors).length > 0) {
    return { ok: false, message: "Vui lòng kiểm tra dữ liệu.", errors };
  }

  await createItem(data);
  updateTag(ITEMS_CACHE_TAG);

  return { ok: true, message: "Đã tạo item mới." };
}

export async function updateItemAction(
  id: string,
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { data, errors } = parseItemForm(formData);

  if (Object.keys(errors).length > 0) {
    return { ok: false, message: "Vui lòng kiểm tra dữ liệu.", errors };
  }

  const item = await updateItem(id, data);
  if (!item) return { ok: false, message: "Không tìm thấy item." };

  updateTag(ITEMS_CACHE_TAG);

  return { ok: true, message: "Đã cập nhật item." };
}

export async function deleteItemAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  await deleteItem(id);
  updateTag(ITEMS_CACHE_TAG);
  redirect("/");
}
