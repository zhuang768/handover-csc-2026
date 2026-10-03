export class ApiError extends Error {
  constructor(
    public code: string,
    public fields: string[] = [],
  ) {
    super(code);
    this.name = "ApiError";
  }
}
export async function api<T>(
  path: string,
  body?: unknown,
  method?: string,
): Promise<T> {
  const response = await fetch(path, {
    method: method ?? (body === undefined ? "GET" : "POST"),
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
    throw new ApiError(data.error ?? "NETWORK_ERROR", data.fields ?? []);
  return data as T;
}
