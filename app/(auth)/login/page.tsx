"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { fetchAPI } from "@/lib/apiService";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const username = formData.get("username");
    const password = formData.get("password");

    const { data, error } = await fetchAPI({
      endpoint: "employees/login",
      method: "POST",
      data: { username, password },
      revalidateSeconds: 0,
    });

    if (error) {
      setError(error);
      setIsLoading(false);
      return;
    }

    if (data) {
      console.log('Login successful:', data);
      
      // Check if tokens are in the response
      if (data.tokens) {
        // Set cookies manually if needed
        if (data.tokens.access_token) {
          document.cookie = `access_token=${data.tokens.access_token}; path=/; max-age=3600; secure; samesite=strict`;
        }
        if (data.tokens.refresh_token) {
          document.cookie = `refresh_token=${data.tokens.refresh_token}; path=/; max-age=86400; secure; samesite=strict`;
        }
      }
      
      // Redirect to dashboard
      router.push("/");
    }
    
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleLogin} className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md shadow-md bg-white p-8 rounded">
        <h2 className="text-2xl font-bold text-center mb-4">Login</h2>
        {error && <Alert variant="destructive">{error}</Alert>}
        <div className="mb-4">
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
          <Input id="username" name="username" type="text" required className="w-full" />
        </div>
        <div className="mb-6">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
          <Input id="password" name="password" type="password" required className="w-full" />
        </div>
        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </div>
    </form>
  );
}