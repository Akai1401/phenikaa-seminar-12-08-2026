export type Item = {
  id: string;
  title: string;
  description: string;
  status: "todo" | "doing" | "done";
  createdAt: string;
  updatedAt: string;
};

export type ActionState = {
  ok: boolean;
  message: string;
  errors?: Record<string, string>;
  debug?: {
    operation: "create" | "update" | "delete";
    outcome: "validation" | "mongodb" | "database-error" | "not-found";
    itemId?: string;
  };
};
