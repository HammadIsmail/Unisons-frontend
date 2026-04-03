import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/layout/Providers";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "UNISON — Alumni Network",
  description: "Connecting UET alumni and students through a professional network.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)} data-scroll-behavior="smooth">
      <body>
        <Providers>
          {children}
          <Toaster position="top-center"/>
        </Providers>
      </body>
    </html>
  );
}