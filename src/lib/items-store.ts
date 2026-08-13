import { cacheLife, cacheTag } from "next/cache";
import { MongoClient, type Collection, type Document } from "mongodb";
import type { Item } from "@/lib/types";

export const ITEMS_CACHE_TAG = "items";

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
    await collection.createIndex({ id: 1 }, { unique: true });
    if ((await collection.estimatedDocumentCount()) === 0) {
      await collection.insertMany(seedItems);
    }
  })();

  await globalThis.__phenikaaMongoSetup;
  return collection;
}

export async function getItems() {
  "use cache";
  cacheLife("minutes");
  cacheTag(ITEMS_CACHE_TAG);

  const collection = await getItemsCollection();
  const documents = await collection
    .find({})
    .sort({ updatedAt: -1 })
    .toArray();

  return documents.map(rowToItem);
}

export async function getItem(id: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(ITEMS_CACHE_TAG);

  const collection = await getItemsCollection();
  const document = await collection.findOne({ id });

  return document ? rowToItem(document) : null;
}

export async function getItemIds() {
  const collection = await getItemsCollection();
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

  await collection.insertOne(item);
  return item;
}

export async function updateItem(
  id: string,
  input: Pick<Item, "title" | "description" | "status">,
) {
  const collection = await getItemsCollection();
  const updatedAt = new Date().toISOString();
  const result = await collection.findOneAndUpdate(
    { id },
    { $set: { ...input, updatedAt } },
    { returnDocument: "after" },
  );

  return result ? rowToItem(result) : null;
}

export async function deleteItem(id: string) {
  const collection = await getItemsCollection();
  const result = await collection.deleteOne({ id });

  return result.deletedCount > 0;
}
