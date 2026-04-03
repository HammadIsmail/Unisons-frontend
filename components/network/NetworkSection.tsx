"use client";

import { ReactNode } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface NetworkSectionProps {
  title: string;
  viewAllHref?: string;
  children: ReactNode;
  className?: string;
}

export default function NetworkSection({
  title,
  viewAllHref,
  children,
  className = ""
}: NetworkSectionProps) {
  return (
    <Card className={`border-none shadow-sm bg-white overflow-hidden ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between py-4 px-4 space-y-0">
        <CardTitle className="text-[15px] font-bold text-foreground">
          {title}
        </CardTitle>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-xs font-bold text-muted-foreground hover:text-[#0a66c2] hover:underline flex items-center gap-0.5 transition-colors"
          >
            See all
            <ChevronRight className="h-3 w-3" />
          </Link>
        )}
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {children}
      </CardContent>
    </Card>
  );
}
