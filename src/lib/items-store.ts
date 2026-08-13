import { cacheLife, cacheTag } from "next/cache";
import { MongoClient, ObjectId, type Collection, type Document } from "mongodb";
import type { Item } from "@/lib/types";

export const ITEMS_LIST_CACHE_TAG = "items:list";

export function getItemCacheTag(id: string) {
  return `items:${id}`;
}

function getItemsSearchCacheTag(query: string) {
  return `items:search:${query}`;
}

export type ServerDataTrace = {
  cacheKey: string;
  generationId: string;
  operation: string;
  source: "database" | "data-cache";
};

type CachedResult<T> = { data: T; generationId: string };

type ItemDocument = Document & {
  id: string;
  title: string;
  description: string;
  status: Item["status"];
  createdAt: string;
  updatedAt: string;
};

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

const mongoUri = process.env.MONGODB_URI ?? process.env.MONGODB_URL;
const databaseName = process.env.MONGODB_DB ?? "phenikaa_demo";

if (!mongoUri) {
  throw new Error(
    "Missing MONGODB_URI. Add your MongoDB Atlas connection string to the environment.",
  );
}

const connectionString = mongoUri;

declare global {
  var __phenikaaMongoClient: MongoClient | undefined;
  var __phenikaaMongoSetup: Promise<void> | undefined;
  var __phenikaaDatabaseGenerations: Set<string> | undefined;
}

function createDatabaseGeneration() {
  const generationId = new ObjectId().toHexString();
  globalThis.__phenikaaDatabaseGenerations ??= new Set<string>();
  globalThis.__phenikaaDatabaseGenerations.add(generationId);
  return generationId;
}

function logMongoOperation(
  operation: string,
  details: Record<string, unknown> = {},
) {
  console.info("[MongoDB] EXECUTE", {
    database: databaseName,
    collection: "items",
    operation,
    ...details,
  });
}

function getClient() {
  globalThis.__phenikaaMongoClient ??= new MongoClient(connectionString);
  return globalThis.__phenikaaMongoClient;
}

function rowToItem(document: ItemDocument): Item {
  return {
    id: document.id,
    title: document.title,
    description: document.description,
    status: document.status,
    createdAt: new Date(document.createdAt).toISOString(),
    updatedAt: new Date(document.updatedAt).toISOString(),
  };
}

async function getItemsCollection(): Promise<Collection<ItemDocument>> {
  const client = getClient();
  await client.connect();
  const collection = client.db(databaseName).collection<ItemDocument>("items");

  globalThis.__phenikaaMongoSetup ??= (async () => {
    logMongoOperation("createIndex", { index: { id: 1 }, unique: true });
    await collection.createIndex({ id: 1 }, { unique: true });

    logMongoOperation("estimatedDocumentCount");
    if ((await collection.estimatedDocumentCount()) === 0) {
      logMongoOperation("insertMany", { reason: "seed", count: seedItems.length });
      await collection.insertMany(seedItems);
    }
  })();

  await globalThis.__phenikaaMongoSetup;
  return collection;
}

async function getCachedItems(): Promise<CachedResult<Item[]>> {
  "use cache";
  cacheLife("minutes");
  cacheTag(ITEMS_LIST_CACHE_TAG);

  const collection = await getItemsCollection();
  logMongoOperation("find", { filter: {}, sort: { updatedAt: -1 } });
  const documents = await collection
    .find({})
    .sort({ updatedAt: -1 })
    .toArray();

  return {
    data: documents.map(rowToItem),
    generationId: createDatabaseGeneration(),
  };
}

async function getCachedSearchItems(query: string): Promise<CachedResult<Item[]>> {
  "use cache";
  cacheLife("minutes");
  cacheTag(ITEMS_LIST_CACHE_TAG, getItemsSearchCacheTag(query));

  const collection = await getItemsCollection();
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const filter = {
    $or: [
      { title: { $regex: escapedQuery, $options: "i" } },
      { description: { $regex: escapedQuery, $options: "i" } },
      { status: { $regex: escapedQuery, $options: "i" } },
    ],
  };
  logMongoOperation("find", { filter, sort: { updatedAt: -1 } });
  const documents = await collection
    .find(filter)
    .sort({ updatedAt: -1 })
    .toArray();

  return {
    data: documents.map(rowToItem),
    generationId: createDatabaseGeneration(),
  };
}

async function getCachedItem(id: string): Promise<CachedResult<Item | null>> {
  "use cache";
  cacheLife("minutes");
  cacheTag(getItemCacheTag(id));

  const collection = await getItemsCollection();
  logMongoOperation("findOne", { filter: { id } });
  const document = await collection.findOne({ id });

  return {
    data: document ? rowToItem(document) : null,
    generationId: createDatabaseGeneration(),
  };
}

async function readWithTrace<T>(
  operation: string,
  cacheKey: string,
  read: () => Promise<CachedResult<T>>,
) {
  const result = await read();
  globalThis.__phenikaaDatabaseGenerations ??= new Set<string>();
  const source = globalThis.__phenikaaDatabaseGenerations.delete(
    result.generationId,
  )
    ? "database"
    : "data-cache";

  return {
    data: result.data,
    trace: {
      cacheKey,
      generationId: result.generationId,
      operation,
      source,
    } satisfies ServerDataTrace,
  };
}

export function getItems() {
  return readWithTrace("getItems", ITEMS_LIST_CACHE_TAG, getCachedItems);
}

export function searchItems(query: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase("vi-VN");
  if (!normalizedQuery) return getItems();

  return readWithTrace(
    `searchItems(${normalizedQuery})`,
    getItemsSearchCacheTag(normalizedQuery),
    () => getCachedSearchItems(normalizedQuery),
  );
}

export function getItem(id: string) {
  return readWithTrace(`getItem(${id})`, getItemCacheTag(id), () =>
    getCachedItem(id),
  );
}

export async function getItemIds() {
  const collection = await getItemsCollection();
  logMongoOperation("find", { filter: {}, projection: { id: 1 } });
  const documents = await collection.find({}, { projection: { id: 1 } }).toArray();
  return documents.map((item) => ({ id: item.id }));
}

export async function createItem(input: Pick<Item, "title" | "description" | "status">) {
  const collection = await getItemsCollection();
  const now = new Date().toISOString();
  const item: Item = {
    id: crypto.randomUUID(),
    ...input,
    createdAt: now,
    updatedAt: now,
  };

  logMongoOperation("insertOne", { id: item.id });
  await collection.insertOne(item);
  return item;
}

export async function updateItem(
  id: string,
  input: Pick<Item, "title" | "description" | "status">,
) {
  const collection = await getItemsCollection();
  const updatedAt = new Date().toISOString();
  logMongoOperation("findOneAndUpdate", { filter: { id } });
  const result = await collection.findOneAndUpdate(
    { id },
    { $set: { ...input, updatedAt } },
    { returnDocument: "after" },
  );

  return result ? rowToItem(result) : null;
}

export async function deleteItem(id: string) {
  const collection = await getItemsCollection();
  logMongoOperation("deleteOne", { filter: { id } });
  const result = await collection.deleteOne({ id });

  return result.deletedCount > 0;
}
