import type { Metadata } from "next";
import { DM_Sans, DM_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const display = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
});

const mono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
});

export const metadata: Metadata = {
  title: { default: "GTM OS", template: "%s · GTM OS" },
  description: "Open-source go-to-market operating system.",
};

/**
 * Root layout — responsible for global application concerns only:
 *   - html/body structure
 *   - Google Fonts
 *   - Global CSS
 *
 * The application shell (AppShell) is mounted in the product-scoped layout
 * at app/w/[workspaceSlug]/[productSlug]/layout.tsx, not here.
 * This ensures the shell is only rendered when a resolved product context
 * is available.
 *
 * Pre-product-context routes (/, /accounts, etc.) render without AppShell.
 */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <body className="font-sans antialiased text-foreground bg-background">
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
