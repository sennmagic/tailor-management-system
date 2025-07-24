export interface APIResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
  tokens?: {
    access_token?: string;
    refresh_token?: string;
  };
  userData?: any;
}

const API_BASE = "https://tms.sachityadav.com.np/api/v1"

interface FetchAPIOptions<T = unknown> {
  endpoint: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  data?: T | FormData;
  id?: string | number;
  slug?: string;
  revalidateSeconds?: number;
  withAuth?: boolean; // If true, adds Authorization header from access_token cookie (browser only)
}

// Reusable error handler for API responses
export function handleAPIError(error: unknown): never {
  if (error instanceof Error) throw error;
  throw new Error(String(error));
}

// Extract error message from response
function extractAPIErrorMessage(errorText: string): string {
  let userMessage: string = "Something went wrong.";
  try {
    const json = JSON.parse(errorText);
    userMessage = json?.message || json?.error || errorText;
  } catch {
    const pre = errorText.match(/<pre>([\s\S]*?)<\/pre>/i);
    userMessage = pre?.[1]?.trim() || errorText.slice(0, 200).trim();
  }
  // Ensure userMessage is a string
  if (typeof userMessage !== "string") {
    userMessage = JSON.stringify(userMessage);
  }
  const validation = userMessage.match(/Validation failed: ([^:]+: Path `[^`]+` is required\.)/i);
  if (validation) {
    const cleanMsg = validation[1].replace(/: Path `([^`]+)` is required\./, ' is required.');
    userMessage = cleanMsg.charAt(0).toUpperCase() + cleanMsg.slice(1);
  }
  userMessage = userMessage.split('<br>')[0].trim();
  return userMessage;
}

// Helper to get a cookie value in the browser
function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
}

// ✅ Strongly typed fetchAPI with generic return
export const fetchAPI = async <TResponse = any, TData = unknown>({
  endpoint = "",
  method = "GET",
  data,
  id,
  slug,
  revalidateSeconds = 10,
  withAuth = false,
}: FetchAPIOptions<TData>): Promise<TResponse | undefined> => {
  // No cookies or Authorization header
  const urlParts: string[] = [API_BASE, endpoint];
  if (slug) urlParts.push(slug);
  else if (id !== undefined) urlParts.push(String(id));
  const url = urlParts.join("/");

  const headers: Record<string, string> = {};

  if (data && !(data instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  // Add Authorization header if requested and running in browser
  if (withAuth && typeof window !== "undefined") {
    const token = getCookie("refresh_token");
    if (token) {
      headers["Authorization"] = `Bearer  ${token}`;
    }
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: method !== "GET" && data
        ? (data instanceof FormData ? data : JSON.stringify(data))
        : undefined,
      next: { revalidate: revalidateSeconds },
      credentials: 'include', // Still include for browser cookies if needed
    });

    if (!response.ok) {
      const errorText = await response.text();
      const userMessage = extractAPIErrorMessage(errorText);
      throw new Error(userMessage); // Let the component handle the error
    }

    return response.json() as Promise<TResponse>;
  } catch (error: any) {
    throw error; // Let the component handle the error
  }
};



export function withAPIErrorAlert<TArgs extends any[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  showAlert: (msg: string) => void
): (...args: TArgs) => Promise<TResult | undefined> {
  return async (...args: TArgs) => {
    try {
      return await fn(...args);
    } catch (err: any) {
      showAlert(err?.message || "Unknown error");
      return undefined;
    }
  };
}