"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyAlumniProfile, updateAlumniProfile } from "@/lib/api/alumni.api";
import { getMyStudentProfile, updateStudentProfile } from "@/lib/api/student.api";
import useAuthStore from "@/store/authStore";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  Camera, Loader2, CheckCircle2, User, AtSign, Mail,
  FileText, Phone, Linkedin, Lock, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name?: string) {
  if (!name) return "U";
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function SectionHeader({ icon, title, description }: {
  icon: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground flex-shrink-0">
        {icon}
      </div>
      <div>
        <h2 className="font-semibold text-foreground text-[15px] leading-none">{title}</h2>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </div>
    </div>
  );
}

function ReadOnlyField({ icon, label, value }: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        <span className="text-muted-foreground/50">{icon}</span>
        {label}
      </Label>
      <div className="relative">
        <Input
          value={value}
          readOnly
          className="h-10 text-sm bg-muted/50 text-muted-foreground cursor-not-allowed border-border/40 pr-10"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/30">
          <Lock className="h-3.5 w-3.5" />
        </div>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SettingsSkeleton() {
  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 space-y-4">
      <Skeleton className="h-7 w-28 rounded" />
      <Skeleton className="h-4 w-48 rounded" />
      <Card className="border-border/60">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full flex-shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-9 w-32 rounded-lg" />
              <Skeleton className="h-3.5 w-28 rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-border/60">
        <CardContent className="p-6 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3.5 w-20 rounded" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { role } = useAuthStore();
  const queryClient = useQueryClient();
  const isAlumni = role === "alumni";
  const [successMsg, setSuccessMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  const { data: alumniData, isLoading: alumniLoading } = useQuery({
    queryKey: ["alumni", "me"],
    queryFn: getMyAlumniProfile,
    enabled: isAlumni,
  });

  const { data: studentData, isLoading: studentLoading } = useQuery({
    queryKey: ["student", "me"],
    queryFn: getMyStudentProfile,
    enabled: !isAlumni,
  });

  const profile = isAlumni ? alumniData : studentData;
  const isLoading = isAlumni ? alumniLoading : studentLoading;
  const p = profile as any;

  useEffect(() => {
    if (profile) {
      setBio(p?.bio ?? "");
      setPhone(p?.phone ?? "");
      setLinkedinUrl(p?.linkedin_url ?? "");
    }
  }, [profile]);

  const flash = (msg: string) => {
    toast.success(msg, {
      action: {
        label: "OK",
        onClick: () => {},
      },
    })
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      if (bio) formData.append("bio", bio);
      if (phone) formData.append("phone", phone);
      if (isAlumni && linkedinUrl) formData.append("linkedin_url", linkedinUrl);
      return isAlumni ? updateAlumniProfile(formData) : updateStudentProfile(formData);
    },
    onSuccess: () => {
      flash("Settings saved successfully.");
      queryClient.invalidateQueries({ queryKey: isAlumni ? ["alumni", "me"] : ["student", "me"] });
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("profile_picture", file);
      if (isAlumni) await updateAlumniProfile(formData);
      else await updateStudentProfile(formData);
      flash("Profile picture updated.");
      queryClient.invalidateQueries({ queryKey: isAlumni ? ["alumni", "me"] : ["student", "me"] });
    } catch {
      // silent
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) return <SettingsSkeleton />;

  const bioRemaining = 300 - bio.length;

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 space-y-5 animate-in fade-in slide-in-from-top-4 duration-500">

      {/* ── Page heading ─────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your account information</p>
      </div>

      {/* ── Success toast ─────────────────────────────────────────────────── */}
      {successMsg && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-sm font-medium text-emerald-700 dark:text-emerald-300 animate-in fade-in duration-300">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      {/* ── Avatar card ───────────────────────────────────────────────────── */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <SectionHeader
            icon={<Camera className="h-4 w-4" />}
            title="Profile Picture"
            description="Appears on your profile and across the network"
          />
          <div className="flex items-center gap-5">
            <Avatar className="h-16 w-16 flex-shrink-0 ring-2 ring-border/60 shadow-sm">
              <AvatarImage src={p?.profile_picture} alt={p?.display_name} />
              <AvatarFallback className="bg-blue-600 text-white text-xl font-bold">
                {getInitials(p?.display_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border/60 text-sm font-medium cursor-pointer hover:bg-muted/60 transition-all duration-150 ${uploading ? "opacity-60 pointer-events-none" : ""}`}>
                {uploading
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…</>
                  : <><Camera className="h-3.5 w-3.5" /> Change Photo</>
                }
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </label>
              <p className="text-xs text-muted-foreground mt-1.5">Max 5MB · JPG or PNG</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Account info card ─────────────────────────────────────────────── */}
      <Card className="border-border/60">
        <CardContent className="p-6 space-y-4">
          <SectionHeader
            icon={<User className="h-4 w-4" />}
            title="Account Information"
            description="These fields are set during registration and cannot be changed"
          />

          <ReadOnlyField icon={<User className="h-3.5 w-3.5" />} label="Display Name" value={p?.display_name ?? ""} />
          <ReadOnlyField icon={<AtSign className="h-3.5 w-3.5" />} label="Username" value={`@${p?.username ?? ""}`} />
          <ReadOnlyField icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={p?.email ?? ""} />
        </CardContent>
      </Card>

      {/* ── Editable info card ────────────────────────────────────────────── */}
      <Card className="border-border/60">
        <CardContent className="p-6 space-y-4">
          <SectionHeader
            icon={<FileText className="h-4 w-4" />}
            title="Profile Details"
            description="Update your bio and contact information"
          />

          {/* Bio */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="bio" className="text-sm font-medium text-foreground">Bio</Label>
              <span className={`text-xs tabular-nums transition-colors ${bioRemaining < 30 ? "text-amber-600 dark:text-amber-400 font-medium" : "text-muted-foreground"}`}>
                {bioRemaining} left
              </span>
            </div>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={300}
              placeholder="Tell the network about yourself…"
              className="w-full px-3.5 py-2.5 text-sm border border-border/60 rounded-xl outline-none resize-none bg-background text-foreground placeholder:text-muted-foreground/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all"
            />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-muted-foreground/60" />
              Phone
            </Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+92-300-1234567"
              className="h-10 text-sm border-border/60"
            />
          </div>

          {/* LinkedIn (alumni only) */}
          {isAlumni && (
            <div className="space-y-1.5">
              <Label htmlFor="linkedin" className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Linkedin className="h-3.5 w-3.5 text-muted-foreground/60" />
                LinkedIn URL
              </Label>
              <Input
                id="linkedin"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/yourname"
                className="h-10 text-sm border-border/60"
              />
            </div>
          )}

          <Button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
            className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm shadow-blue-600/20 gap-2"
          >
            {updateMutation.isPending
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
              : "Save Changes"
            }
          </Button>
        </CardContent>
      </Card>

    </div>
  );
}
