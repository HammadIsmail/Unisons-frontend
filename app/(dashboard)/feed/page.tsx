"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getOpportunities } from "@/lib/api/opportunities.api";
import useAuthStore from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Plus, 
  Image as ImageIcon, 
  Video, 
  Calendar, 
  FileText,
  Loader2,
  SearchX,
  Wifi,
  Briefcase,
  GraduationCap,
  Zap,
  Building2,
  MapPin,
  CalendarClock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const TYPE_META: Record<string, {
  label: string;
  icon: React.ReactNode;
  badge: string;
  iconBg: string;
}> = {
  job: {
    label: "Job",
    icon: <Briefcase className="h-3 w-3" />,
    badge: "bg-blue-50 text-blue-700 border-blue-100",
    iconBg: "bg-blue-500/10 text-blue-600",
  },
  internship: {
    label: "Internship",
    icon: <GraduationCap className="h-3 w-3" />,
    badge: "bg-emerald-50 text-emerald-700 border-emerald-100",
    iconBg: "bg-emerald-500/10 text-emerald-600",
  },
  freelance: {
    label: "Freelance",
    icon: <Zap className="h-3 w-3" />,
    badge: "bg-amber-50 text-amber-700 border-amber-100",
    iconBg: "bg-amber-500/10 text-amber-600",
  },
};

function formatDeadline(date: string) {
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const formatted = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  if (diffDays < 0) return { label: "Expired", urgent: true };
  if (diffDays <= 3) return { label: `${formatted} (${diffDays}d left)`, urgent: true };
  return { label: formatted, urgent: false };
}

export default function FeedPage() {
  const { profile, role } = useAuthStore();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["feed", { page }],
    queryFn: () => getOpportunities({ page, limit: 10 }),
  });

  return (
    <div className="space-y-4">
      {/* Start a Post / Opportunity Box */}
      {role === "alumni" && (
        <Card className="border-none shadow-sm overflow-hidden">
          <CardContent className="p-4 space-y-4">
          <div className="flex gap-3">
            <Avatar className="h-12 w-12 border border-border/50">
              <AvatarImage src={profile?.profile_picture} />
              <AvatarFallback className="bg-[#0a66c2] text-white">
                {profile?.display_name?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Link 
              href="/post-opportunity" 
              className="flex-1 bg-muted/40 hover:bg-muted/60 transition-colors rounded-full px-4 flex items-center text-sm font-medium text-muted-foreground border border-border/50"
            >
              Start a post or post an opportunity...
            </Link>
          </div>
          
          <div className="flex items-center justify-between pt-1">
            <button className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50 rounded-lg transition-colors group">
              <ImageIcon className="h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-muted-foreground">Media</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50 rounded-lg transition-colors group">
              <Video className="h-5 w-5 text-emerald-500 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-muted-foreground">Video</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50 rounded-lg transition-colors group">
              <Calendar className="h-5 w-5 text-amber-500 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-muted-foreground">Event</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50 rounded-lg transition-colors group">
              <FileText className="h-5 w-5 text-rose-500 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-muted-foreground">Article</span>
            </button>
          </div>
          </CardContent>
        </Card>
      )}

      {/* Feed Content */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#0a66c2]" />
            <p className="text-sm font-medium text-muted-foreground">Loading your feed...</p>
          </div>
        ) : data?.data?.length ? (
          <AnimatePresence mode="popLayout">
            {data.data.map((opp, index) => {
              const meta = TYPE_META[opp.type] || TYPE_META.job;
              const deadline = formatDeadline(opp.deadline);
              
              return (
                <motion.div
                  key={opp.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-none shadow-sm hover:shadow-md transition-shadow group overflow-hidden">
                    <CardContent className="p-0">
                      {/* Post Header */}
                      <div className="p-4 flex items-start justify-between">
                        <div className="flex gap-3">
                          <Avatar className="h-10 w-10 border border-border/50">
                            <AvatarImage src={opp.posted_by?.profile_picture ?? undefined} />
                            <AvatarFallback className="bg-blue-100 text-blue-700 font-bold text-xs">
                              {opp.posted_by?.display_name?.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <h4 className="text-sm font-bold text-foreground leading-tight hover:text-[#0a66c2] transition-colors cursor-pointer capitalize">
                              {opp.posted_by?.display_name}
                            </h4>
                            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                              @{opp.posted_by?.username} · Alumni
                            </p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.badge} uppercase tracking-wider`}>
                          {meta.icon}
                          {meta.label}
                        </span>
                      </div>

                      {/* Post Content */}
                      <Link href={`/opportunities/${opp.id}`} className="block px-4 pb-4 space-y-3">
                        <h3 className="text-md font-bold text-foreground leading-snug group-hover:text-[#0a66c2] transition-colors">
                          {opp.title}
                        </h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Building2 className="h-3.5 w-3.5 text-blue-500/70" />
                            <span className="font-medium text-foreground/80">{opp.company || "Direct Hire"}</span>
                          </div>
                          {opp.location && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5 text-emerald-500/70" />
                              <span className="truncate">{opp.location}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CalendarClock className="h-3.5 w-3.5 text-amber-500/70" />
                            <span className={deadline.urgent ? "text-red-500 font-bold" : ""}>
                              Deadline: {deadline.label}
                            </span>
                          </div>
                          {opp.is_remote && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Wifi className="h-3.5 w-3.5 text-violet-500/70" />
                              <span className="text-violet-600 font-semibold bg-violet-50 px-1.5 rounded">Remote</span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {opp.required_skills?.slice(0, 3).map((s: string) => (
                            <span key={s} className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border/40">
                              {s}
                            </span>
                          ))}
                          {opp.required_skills && opp.required_skills.length > 3 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground/60">
                              +{opp.required_skills.length - 3} more
                            </span>
                          )}
                        </div>
                      </Link>

                    
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        ) : (
          <Card className="border-dashed border-2 py-12 flex flex-col items-center text-center">
            <SearchX className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-bold text-foreground">No opportunities yet</h3>
            <p className="text-sm text-muted-foreground max-w-[280px]">
              Be the first to share an opportunity with the community!
            </p>
            <Button className="mt-6 bg-[#0a66c2] hover:bg-[#004182] font-bold rounded-full" asChild>
              <Link href="/post-opportunity">
                <Plus className="h-4 w-4 mr-2" />
                Post Opportunity
              </Link>
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
