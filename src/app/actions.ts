"use server";

import { updateTag } from "next/cache";
import {
  createItem,
  deleteItem,
  getItemCacheTag,
  ITEMS_LIST_CACHE_TAG,
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
    return {
      ok: false,
      message: "Vui lòng kiểm tra dữ liệu.",
      errors,
      debug: { operation: "create", outcome: "validation" },
    };
  }

  try {
    const item = await createItem(data);
    updateTag(ITEMS_LIST_CACHE_TAG);
    return {
      ok: true,
      message: "Đã tạo item mới.",
      debug: { operation: "create", outcome: "mongodb", itemId: item.id },
    };
  } catch {
    return {
      ok: false,
      message: "Không thể tạo item. Vui lòng thử lại.",
      debug: { operation: "create", outcome: "database-error" },
    };
  }
}

export async function updateItemAction(
  id: string,
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { data, errors } = parseItemForm(formData);

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      message: "Vui lòng kiểm tra dữ liệu.",
      errors,
      debug: { operation: "update", outcome: "validation", itemId: id },
    };
  }

  let item;
  try {
    item = await updateItem(id, data);
    updateTag(ITEMS_LIST_CACHE_TAG);
    updateTag(getItemCacheTag(id));
  } catch {
    return {
      ok: false,
      message: "Không thể cập nhật item. Vui lòng thử lại.",
      debug: { operation: "update", outcome: "database-error", itemId: id },
    };
  }

  if (!item) {
    return {
      ok: false,
      message: "Không tìm thấy item.",
      debug: { operation: "update", outcome: "not-found", itemId: id },
    };
  }

  return {
    ok: true,
    message: "Đã cập nhật item.",
    debug: { operation: "update", outcome: "mongodb", itemId: id },
  };
}

export async function deleteItemAction(
  id: string,
): Promise<ActionState> {
  try {
    const deleted = await deleteItem(id);
    if (!deleted) {
      return {
        ok: false,
        message: "Không tìm thấy item.",
        debug: { operation: "delete", outcome: "not-found", itemId: id },
      };
    }
    updateTag(ITEMS_LIST_CACHE_TAG);
    updateTag(getItemCacheTag(id));
    return {
      ok: true,
      message: "Đã xóa item.",
      debug: { operation: "delete", outcome: "mongodb", itemId: id },
    };
  } catch {
    return {
      ok: false,
      message: "Không thể xóa item. Vui lòng thử lại.",
      debug: { operation: "delete", outcome: "database-error", itemId: id },
    };
  }
}
