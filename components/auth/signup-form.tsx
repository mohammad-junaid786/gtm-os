"use client";

import { useState } from "react";
import { registerAction } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function SignupForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    try {
      const result = await registerAction(formData);

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
    <div className="w-full text-center">
      <div className="space-y-2 mb-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          Sign Up to GTM OS
        </h1>
        <p className="text-muted-foreground">
          Enter your details to create your account.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 text-red-600 border border-red-100 rounded-md text-sm text-center">
          {error}
        </div>
      )}

      <form action={handleSubmit} className="space-y-4 text-left">
        <div className="space-y-2 flex flex-col">
          <label htmlFor="email" className="text-sm font-semibold text-foreground">Email</label>
          <input 
            id="email" 
            name="email" 
            type="email" 
            autoComplete="email"
            required 
            className="flex h-11 w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" 
            placeholder="Example@email.com"
          />
        </div>
        <div className="space-y-2 flex flex-col">
          <label htmlFor="password" className="text-sm font-semibold text-foreground">Password</label>
          <input 
            id="password" 
            name="password" 
            type="password" 
            autoComplete="new-password"
            required 
            className="flex h-11 w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" 
            placeholder="At Least 8 Characters"
          />
        </div>

        <Button type="submit" size="lg" className="w-full mt-2 bg-[#0055FF] hover:bg-[#0055FF]/90 text-white font-medium" disabled={loading}>
          {loading ? "Signing up..." : "Sign Up"}
        </Button>
      </form>

      <div className="mt-8 text-center text-sm">
        <span className="text-muted-foreground">Already have an account? </span>
        <Link
          href="/login"
          className="text-[#0055FF] hover:text-[#0055FF]/80 font-medium hover:underline underline-offset-4"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}
