"use server";

import { signIn, signOut } from "@/lib/auth";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { AuthError } from "next-auth";
import { resolveUserDefaultRoute } from "@/lib/routing/default-route";

const AuthSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Determine redirect URL before signing in because signIn() throws a redirect
  let redirectUrl = "/onboarding";
  try {
    const db = getDb();
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser.length > 0) {
      redirectUrl = await resolveUserDefaultRoute(existingUser[0].id);
    }
  } catch (err) {
    console.error("Failed to resolve route before login:", err);
  }

  try {
    await signIn("credentials", { email, password, redirectTo: redirectUrl });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials." };
        default:
          return { error: "Something went wrong." };
      }
    }
    // This will re-throw the NEXT_REDIRECT error so the redirect actually happens
    throw error;
  }
}

export async function registerAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const parsed = AuthSchema.safeParse({ email, password });
  if (!parsed.success) {
    return { error: "Invalid email or password (min 6 chars)." };
  }

  const db = getDb();
  const existingUser = await db.select().from(users).where(eq(users.email, email));
  if (existingUser.length > 0) {
    return { error: "User already exists." };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.insert(users).values({
    email,
    password: hashedPassword,
  });

  // After registration, sign them in and redirect to onboarding (new users have no workspaces)
  try {
    await signIn("credentials", { email, password, redirectTo: "/onboarding" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Something went wrong during sign in." };
    }
    // Re-throw NEXT_REDIRECT
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
