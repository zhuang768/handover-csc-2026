export class ApiError extends Error {
  code: string;
  fields: string[];
  status: number;
  constructor(code: string, fields: string[] = [], status = 0) {
    super(code);
    this.name = "ApiError";
    this.code = code;
    this.fields = fields;
    this.status = status;
  }
}

// Client requests share one counter so update protection also covers writes
// started outside the currently visible form (notifications and read receipts).
let pendingWrites = 0;
const writeListeners = new Set<() => void>();
export const getPendingWriteCount = () => pendingWrites;
export function subscribePendingWrites(listener: () => void) {
  writeListeners.add(listener);
  return () => {
    writeListeners.delete(listener);
  };
}
function notifyWrites() {
  for (const listener of writeListeners) listener();
}

export async function api<T>(
  path: string,
  body?: unknown,
  method?: string,
): Promise<T> {
  const requestMethod = (
    method ?? (body === undefined ? "GET" : "POST")
  ).toUpperCase();
  const writing = requestMethod !== "GET" && requestMethod !== "HEAD";
  if (writing) pendingWrites++;
  try {
    if (writing) notifyWrites();
    const response = await fetch(path, {
      method: requestMethod,
      credentials: "same-origin",
      headers:
        body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = (await response
      .json()
      .catch(() => ({ error: "NETWORK_ERROR" }))) as {
      error?: string;
      fields?: string[];
    };
    if (!response.ok)
      throw new ApiError(
        data.error ?? "NETWORK_ERROR",
        data.fields ?? [],
        response.status,
      );
    return data as T;
  } finally {
    if (writing) {
      pendingWrites--;
      notifyWrites();
    }
  }
}
