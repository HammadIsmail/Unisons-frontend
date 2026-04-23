"use client";

import { MessageSquare } from "lucide-react";

export default function MessagesRootPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-muted/20 p-8 h-full">
      <div className="w-20 h-20 bg-blue-100 dark:bg-blue-950/40 rounded-full flex items-center justify-center mb-6">
        <MessageSquare className="h-10 w-10 text-blue-600 dark:text-blue-400" />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">Your Messages</h3>
      <p className="text-muted-foreground text-center max-w-sm">
        Select a conversation from the list to start chatting with your network.
      </p>
    </div>
  );
}
