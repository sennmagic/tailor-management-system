
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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
const API_BASE = "https://tmsapi.rastriyaposhakghar.com/api/v1";


interface FetchAPIOptions<T = unknown> {
  endpoint: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  data?: T | FormData;
  id?: string | number;
  slug?: string;
  revalidateSeconds?: number;
  withAuth?: boolean;
}

// Reusable error handler
export function handleAPIError(error: unknown): never {
  if (error instanceof Error) throw error;
  throw new Error(String(error));
}

// Extract user-friendly error
function extractAPIErrorMessage(errorText: string): string {
  let userMessage: string = "Something went wrong.";
  try {
    const json = JSON.parse(errorText);
    userMessage = json?.message || json?.error || errorText;
  } catch {
    const pre = errorText.match(/<pre>([\s\S]*?)<\/pre>/i);
    userMessage = pre?.[1]?.trim() || errorText.slice(0, 200).trim();
  }
  if (typeof userMessage !== "string") {
    userMessage = JSON.stringify(userMessage);
  }
  const validation = userMessage.match(/Validation failed: ([^:]+: Path `[^`]+` is required\.)/i);
  if (validation) {
    const cleanMsg = validation[1].replace(/: Path `([^`]+)` is required\./, ' is required.');
    userMessage = cleanMsg.charAt(0).toUpperCase() + cleanMsg.slice(1);
  }
  return userMessage.split('<br>')[0].trim();
}

// Cookie reader
function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
}

// ✅ Unified fetchAPI
export const fetchAPI = async <TResponse = any, TData = unknown>({
  endpoint = "",
  method = "GET",
  data,
  id,
  slug,
  revalidateSeconds = 10,
  withAuth = false,
}: FetchAPIOptions<TData>): Promise<{ data: TResponse | null; error: string | null }> => {

  // 🌐 Build the URL
  const urlParts: string[] = [API_BASE, endpoint];
  if (slug) urlParts.push(slug);
  else if (id !== undefined) urlParts.push(String(id));
  const url = urlParts.join("/");

  const headers: Record<string, string> = {};
  if (data && !(data instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (withAuth && typeof window !== "undefined") {
    const token = getCookie("refresh_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  try {
    console.log('🌐 API Request:', { url, method, headers, data })
    
    const controller = new AbortController()
    // Reduce timeout to 15 seconds for better UX
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout
    
    const response = await fetch(url, {
      method,
      headers,
      body:
        method !== "GET" && data
          ? data instanceof FormData
            ? data
            : JSON.stringify(data)
          : undefined,
      next: { revalidate: revalidateSeconds },
      credentials: "include",
      signal: controller.signal
    });
    
    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text();
      const userMessage = extractAPIErrorMessage(errorText);
      return { data: null, error: userMessage };
    }

    const json = await response.json();
    return { data: json, error: null };
  } catch (error: any) {
    console.error('🌐 API Error:', error)
    
    // Handle different types of network errors
    if (error.name === 'AbortError') {
      return { data: null, error: "Request timed out after 15 seconds" };
    }
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return { data: null, error: "Network error - please check your connection" };
    }
    
    if (error.message?.includes('Failed to fetch')) {
      return { data: null, error: "Unable to connect to server - please check your internet connection" };
    }
    
    return { data: null, error: error?.message || "Network error occurred" };
  }
};

// Optional error-alert wrapper
export function withAPIErrorAlert<TArgs extends any[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  showAlert: (msg: string) => void
): (...args: TArgs) => Promise<TResult | undefined> {
  return async (...args: TArgs) => {
    const result = await fn(...args);
    return result;
  };
}

// ✅ React Query Hook for data fetching with caching
export function useAPI<TResponse = any, TData = unknown>(
  options: FetchAPIOptions<TData> & { 
    enabled?: boolean;
    initialData?: TResponse;
  }
) {
  const { enabled = true, initialData, ...fetchOptions } = options;
  
  const queryKey = ['api', fetchOptions] as const;
  
  const fetcher = async () => {
    const result = await fetchAPI<TResponse, TData>(fetchOptions);
    if (result.error) {
      throw new Error(result.error);
    }
    return result.data!;
  };

  const { data, error, isLoading, refetch } = useQuery<TResponse>({
    queryKey,
    queryFn: fetcher,
    enabled,
    initialData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  return {
    data: data ?? null,
    error: error?.message ?? null,
    isLoading,
    refetch,
  };
}

// ✅ React Query Mutation Hook for mutations (POST, PUT, DELETE)
export function useAPIMutation<TResponse = any, TData = unknown>(
  options: Omit<FetchAPIOptions<TData>, 'method'> & { 
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    onSuccess?: (data: TResponse) => void;
    onError?: (error: string) => void;
  }
) {
  const queryClient = useQueryClient();
  
  const mutation = useMutation<TResponse, Error, TData & { _id?: string }>({
    mutationFn: async (data: TData & { _id?: string }) => {
      const { _id, ...mutationData } = data;
      const result = await fetchAPI<TResponse, TData>({
        ...options,
        data: mutationData as TData,
        id: _id || options.id,
      });
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data!;
    },
    onSuccess: (data: TResponse) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['api'] });
      options.onSuccess?.(data);
    },
    onError: (error: Error) => {
      options.onError?.(error.message);
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error?.message ?? null,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
  };
}

// Test function to check API connectivity
