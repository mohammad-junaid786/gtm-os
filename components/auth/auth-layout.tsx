import { ReactNode } from "react";
import Image from "next/image";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-background">
      {/* Left side: Image */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-[60%] p-4 xl:p-8 items-center justify-center">
        <div className="relative w-full max-h-full aspect-[2048/1929] bg-muted/30 rounded-2xl overflow-hidden">
          <Image
            src="/images/gtm-os-hero.png"
            alt="GTM OS Hero"
            fill
            sizes="(min-width: 1280px) 60vw, (min-width: 1024px) 55vw, 0vw"
            className="object-contain object-center"
            priority
          />
        </div>
      </div>

      {/* Right side: Content */}
      <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-[400px]">
          {/* Logo container */}
          <div className="flex justify-center mb-8">
            <Image
              src="/logo/gtm-os-logo.svg"
              alt="GTM OS Logo"
              width={64}
              height={64}
              priority
            />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
