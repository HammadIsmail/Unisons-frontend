"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { UserPlus, Clock } from "lucide-react";
import Link from "next/link";
import useAuthStore from "@/store/authStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

interface NetworkSuggestionCardProps {
  userId: string;
  username: string;
  name: string;
  headline: string;
  image?: string;
  connectionStatus?: "none" | "pending" | "connected";
  onConnect: () => void;
  onCancel?: () => void;
  onRemove?: () => void;
  isLoading?: boolean;
}

export default function NetworkSuggestionCard({
  userId,
  username,
  name,
  headline,
  image,
  connectionStatus = "none",
  onConnect,
  onCancel,
  onRemove,
  isLoading
}: NetworkSuggestionCardProps) {
  const { role } = useAuthStore();
  const isPending = connectionStatus === "pending";
  const isConnected = connectionStatus === "connected";

  return (
    <Card className="flex flex-col items-center text-center overflow-hidden border-none shadow-sm bg-white hover:shadow-md transition-all group">
      {/* Banner Placeholder */}
      <div className="h-16 w-full bg-gradient-to-br from-blue-100 to-blue-50 group-hover:from-blue-200 transition-colors" />
      
      <CardContent className="flex flex-col items-center -mt-9 pb-3 px-4 w-full">
        <Avatar className="h-20 w-20 border-4 border-white shadow-sm shrink-0">
          <AvatarImage src={image} className="object-cover" />
          <AvatarFallback className="bg-[#0a66c2] text-white font-bold text-xl">
            {name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="mt-3 w-full">
          <Link
            href={`/profile/${userId}`}
            className="font-bold text-[15px] text-foreground hover:text-[#0a66c2] hover:underline decoration-2 underline-offset-2 line-clamp-1"
          >
            {name}
          </Link>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 h-8 leading-tight px-1">
            {headline}
          </p>
        </div>
      </CardContent>

      <CardFooter className="pt-0 pb-5 px-4 mt-auto w-full">
        {isPending || isConnected ? (
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant={isPending ? "secondary" : "ghost"}
                size="sm"
                className="w-full font-bold text-xs rounded-full h-8"
              >
                {isPending ? (
                  <><Clock className="h-3.5 w-3.5 mr-1.5" /> Pending</>
                ) : (
                  "Connected"
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{isPending ? "Cancel Request" : "Remove Connection"}</DialogTitle>
                <DialogDescription>
                  Are you sure you want to {isPending ? "cancel your connection request to" : "remove"} <span className="font-semibold text-foreground">{name}</span>? {isConnected && "They will no longer be in your network."}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-0 mt-4">
                <DialogClose asChild>
                  <Button variant="outline" size="sm">Back</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={isPending ? onCancel : onRemove}
                  >
                    Confirm
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full font-bold text-xs rounded-full h-8 transition-all active:scale-95 border-[#0a66c2] text-[#0a66c2] hover:bg-blue-50"
            onClick={() => onConnect()}
            disabled={isLoading}
          >
            <UserPlus className="h-3.5 w-3.5 mr-1.5" />
            Connect
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
