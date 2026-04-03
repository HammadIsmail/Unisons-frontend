"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface SentRequestCardProps {
  targetName: string;
  targetHeadline: string;
  targetImage?: string | null;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function SentRequestCard({
  targetName,
  targetHeadline,
  targetImage,
  onCancel,
  isLoading
}: SentRequestCardProps) {
  return (
    <Card className="p-4 border-none shadow-sm bg-white hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-14 w-14 border border-border/40 shrink-0">
            <AvatarImage src={targetImage ?? undefined} />
            <AvatarFallback className="bg-muted text-sm font-bold text-muted-foreground">
              {(targetName || "??").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h3 className="font-bold text-[15px] text-foreground truncate hover:underline cursor-pointer">
              {targetName}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {targetHeadline}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isLoading}
            className="text-muted-foreground hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 font-bold text-xs px-4 rounded-full transition-colors"
          >
            Cancel Request
          </Button>
        </div>
      </div>
    </Card>
  );
}
