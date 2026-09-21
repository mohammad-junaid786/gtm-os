"use client";

import { useState } from "react";
import { loginAction, registerAction } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";

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
    <div className="w-full max-w-[360px] mx-auto py-12">
      <div className="mb-10 flex justify-center">
        <div className="flex h-10 w-10 items-center justify-center rounded bg-primary">
          <span className="text-xl font-bold leading-none text-primary-foreground tracking-tight">G</span>
        </div>
      </div>
      
      <div className="space-y-1.5 mb-8 text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          {isRegister ? "Create an account" : "Sign in to GTM OS"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isRegister ? "Enter your email below to create your account" : "Enter your email below to login to your account"}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 text-red-600 border border-red-100 rounded text-sm text-center">
          {error}
        </div>
      )}

      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-2 flex flex-col">
          <label htmlFor="email" className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Email</label>
          <input 
            id="email" 
            name="email" 
            type="email" 
            autoComplete="email"
            required 
            className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" 
            placeholder="m@example.com"
          />
        </div>
        <div className="space-y-2 flex flex-col">
          <label htmlFor="password" className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Password</label>
          <input 
            id="password" 
            name="password" 
            type="password" 
            autoComplete="current-password"
            required 
            className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" 
          />
        </div>

        <Button type="submit" className="w-full mt-2" disabled={loading}>
          {loading ? "Please wait..." : isRegister ? "Sign Up" : "Sign In"}
        </Button>
      </form>

      <div className="mt-8 text-center text-sm">
        <button
          type="button"
          onClick={() => {
            setIsRegister(!isRegister);
            setError(null);
          }}
          className="text-muted-foreground hover:text-foreground font-medium underline underline-offset-4"
        >
          {isRegister
            ? "Already have an account? Sign in"
            : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  );
}
