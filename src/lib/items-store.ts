import { readFile } from "node:fs/promises";
import path from "node:path";
import { cacheLife, cacheTag } from "next/cache";
import type { Item } from "@/lib/types";

const DATA_FILE = path.join(process.cwd(), "data", "items.json");
export const ITEMS_CACHE_TAG = "items";

declare global {
  var __phenikaaItems: Item[] | undefined;
}

const seedItems: Item[] = [
  {
    id: "next-server-actions",
    title: "Tìm hiểu Server Actions",
    description:
      "CRUD chạy trực tiếp trên server bằng form action, không cần tự viết API route.",
    status: "doing",
    createdAt: "2026-08-12T07:00:00.000Z",
    updatedAt: "2026-08-12T07:00:00.000Z",
  },
  {
    id: "server-cache",
    title: "Bật server side cache",
    description:
      "Danh sách và chi tiết item được cache bằng use cache, cacheLife và cacheTag.",
    status: "todo",
    createdAt: "2026-08-12T07:05:00.000Z",
    updatedAt: "2026-08-12T07:05:00.000Z",
  },
  {
    id: "router-cache",
    title: "Kiểm tra client router cache",
    description:
      "next.config.ts cấu hình staleTimes để cache payload khi điều hướng/prefetch.",
    status: "done",
    createdAt: "2026-08-12T07:10:00.000Z",
    updatedAt: "2026-08-12T07:10:00.000Z",
  },
];

async function loadInitialItems() {
  try {
    const content = await readFile(DATA_FILE, "utf8");
    return JSON.parse(content) as Item[];
  } catch {
    return seedItems;
  }
}

async function getMutableItems() {
  if (!globalThis.__phenikaaItems) {
    globalThis.__phenikaaItems = await loadInitialItems();
  }

  return globalThis.__phenikaaItems;
}

async function replaceItems(items: Item[]) {
  globalThis.__phenikaaItems = items;
}

export async function getItems() {
  "use cache";
  cacheLife("minutes");
  cacheTag(ITEMS_CACHE_TAG);

  const items = await getMutableItems();
  return items.toSorted((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  );
}

export async function getItem(id: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(ITEMS_CACHE_TAG);

  const items = await getMutableItems();
  return items.find((item) => item.id === id) ?? null;
}

export async function getItemIds() {
  const items = await getMutableItems();
  return items.map((item) => ({ id: item.id }));
}

export async function createItem(input: Pick<Item, "title" | "description" | "status">) {
  const items = await getMutableItems();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const item: Item = { id, ...input, createdAt: now, updatedAt: now };

  await replaceItems([item, ...items]);
  return item;
}

export async function updateItem(
  id: string,
  input: Pick<Item, "title" | "description" | "status">,
) {
  const items = await getMutableItems();
  const now = new Date().toISOString();
  let updatedItem: Item | null = null;

  const nextItems = items.map((item) => {
    if (item.id !== id) return item;
    updatedItem = { ...item, ...input, updatedAt: now };
    return updatedItem;
  });

  if (!updatedItem) return null;

  await replaceItems(nextItems);
  return updatedItem;
}

export async function deleteItem(id: string) {
  const items = await getMutableItems();
  const nextItems = items.filter((item) => item.id !== id);

  if (nextItems.length === items.length) return false;

  await replaceItems(nextItems);
  return true;
}
