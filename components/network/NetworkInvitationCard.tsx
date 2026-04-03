"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { motion } from "framer-motion";

interface NetworkInvitationCardProps {
  senderName: string;
  senderHeadline: string;
  senderImage?: string;
  onAccept: () => void;
  onIgnore: () => void;
  isLoading?: boolean;
}

export default function NetworkInvitationCard({
  senderName,
  senderHeadline,
  senderImage,
  onAccept,
  onIgnore,
  isLoading
}: NetworkInvitationCardProps) {
  return (
    <Card className="p-4 border-none shadow-sm bg-white hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-14 w-14 border border-border/40 shrink-0">
            <AvatarImage src={senderImage} />
            <AvatarFallback className="bg-blue-50 text-sm font-bold text-[#0a66c2]">
              {(senderName || "??").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h3 className="font-bold text-[15px] text-foreground truncate hover:underline cursor-pointer">
              {senderName}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {senderHeadline}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onIgnore}
            disabled={isLoading}
            className="text-muted-foreground hover:text-foreground font-bold text-xs px-3"
          >
            Ignore
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onAccept}
            disabled={isLoading}
            className="border-[#0a66c2] text-[#0a66c2] hover:bg-blue-50 font-bold text-xs px-4 rounded-full"
          >
            Accept
          </Button>
        </div>
      </div>
    </Card>
  );
}
