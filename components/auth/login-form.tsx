"use client";

import { useState } from "react";
import { loginAction, registerAction } from "@/lib/actions/auth-actions";
export function LoginForm() {
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    try {
      const result = isRegister
        ? await registerAction(formData)
        : await loginAction(formData);

      if (result?.error) {
        setError(result.error);
      }
    } catch {
      // NEXT_REDIRECT is thrown by successful NextAuth signIn and caught by Next.js
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm p-6 bg-card text-card-foreground rounded-lg border shadow-sm">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {isRegister ? "Create an Account" : "Sign In"}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
          {error}
        </div>
      )}

      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-2 flex flex-col">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input id="email" name="email" type="email" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
        </div>
        <div className="space-y-2 flex flex-col">
          <label htmlFor="password" className="text-sm font-medium">Password</label>
          <input id="password" name="password" type="password" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
        </div>

        <button type="submit" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full" disabled={loading}>
          {loading ? "Please wait..." : isRegister ? "Sign Up" : "Sign In"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm">
        <button
          onClick={() => {
            setIsRegister(!isRegister);
            setError(null);
          }}
          className="text-primary hover:underline font-medium"
        >
          {isRegister
            ? "Already have an account? Sign in"
            : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  );
}
