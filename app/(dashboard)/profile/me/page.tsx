"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyAlumniProfile, updateAlumniProfile, addSkill, deleteSkill,
  addWorkExperience, deleteWorkExperience, getAllSkills,
} from "@/lib/api/alumni.api";
import { getMyStudentProfile, updateStudentProfile, addStudentSkill } from "@/lib/api/student.api";
import { getMyNetwork } from "@/lib/api/connections.api";
import { getMyOpportunities } from "@/lib/api/opportunities.api";
import useAuthStore from "@/store/authStore";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateAlumniProfileSchema, updateStudentProfileSchema, addSkillSchema,
  AddSkillInput,
} from "@/schemas/profile.schemas";
import { addWorkExperienceSchema, AddWorkExperienceInput } from "@/schemas/workExperience.schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

import {
  Pencil, Plus, X, Trash2, CheckCircle2, Camera, Loader2,
  Linkedin, Phone, Network, Tag, Briefcase, GraduationCap,
  Building2, CalendarDays, AlertCircle, Check,
  Activity, ArrowRight, ChevronRight, Users,
} from "lucide-react";
import { toast } from "sonner";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name?: string) {
  if (!name) return "U";
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1">
      <AlertCircle className="h-3 w-3 flex-shrink-0" />
      {message}
    </p>
  );
}

function SectionHeader({
  icon,
  title,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
          {icon}
        </div>
        <h2 className="font-semibold text-foreground text-[15px]">{title}</h2>
      </div>
      {action}
    </div>
  );
}

const PROFICIENCY_META: Record<string, { badge: string }> = {
  expert: { badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800" },
  intermediate: { badge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800" },
  beginner: { badge: "bg-muted text-muted-foreground border-border/60" },
};

// ── Loading skeleton ──────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-4">
      <Card className="border-border/60 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-blue-600/20 to-violet-600/10" />
        <CardContent className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-5">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-xl" />
          </div>
          <Skeleton className="h-6 w-40 rounded mb-1.5" />
          <Skeleton className="h-4 w-24 rounded mb-3" />
          <Skeleton className="h-4 w-56 rounded" />
        </CardContent>
      </Card>
      <Card className="border-border/60">
        <CardContent className="p-6 space-y-3">
          <Skeleton className="h-5 w-24 rounded" />
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-7 w-20 rounded-full" />)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function MyProfilePage() {
  const { role, updateProfile } = useAuthStore();
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [showAddWork, setShowAddWork] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const isAlumni = role === "alumni";

  const { data: alumniProfile, isLoading: alumniLoading } = useQuery({
    queryKey: ["alumni", "me"],
    queryFn: getMyAlumniProfile,
    enabled: isAlumni,
  });

  const { data: studentProfile, isLoading: studentLoading } = useQuery({
    queryKey: ["student", "me"],
    queryFn: getMyStudentProfile,
    enabled: !isAlumni,
  });

  const profile = isAlumni ? alumniProfile : studentProfile;
  const isLoading = isAlumni ? alumniLoading : studentLoading;
  const p = profile as any;

  useEffect(() => {
    if (profile) {
      updateProfile(profile as any);
    }
  }, [profile, updateProfile]);

  const { data: allSkills } = useQuery({
    queryKey: ["skills"],
    queryFn: getAllSkills,
    staleTime: Infinity,
  });

  const { data: myOpportunities } = useQuery({
    queryKey: ["opportunities", "me"],
    queryFn: getMyOpportunities,
    enabled: isAlumni,
  });

  const { data: network, isLoading: isNetworkLoading } = useQuery({
    queryKey: ["network", profile?.role],
    queryFn: () => getMyNetwork(profile?.role as "alumni" | "student"),
    enabled: !!profile?.role,
  });

  const profileForm = useForm<any>({
    resolver: zodResolver(isAlumni ? updateAlumniProfileSchema : updateStudentProfileSchema),
    values: {
      display_name: p?.display_name ?? "",
      bio: profile?.bio ?? "",
      phone: (profile as any)?.phone ?? "",
      ...(isAlumni && { linkedin_url: (profile as any)?.linkedin_url ?? "" }),
    },
  });

  const skillForm = useForm<AddSkillInput>({ resolver: zodResolver(addSkillSchema) });
  const workForm = useForm<AddWorkExperienceInput>({
    resolver: zodResolver(addWorkExperienceSchema),
    defaultValues: { is_current: false },
  });
  const isCurrentJob = workForm.watch("is_current");

  const flash = (msg: string) => {
    toast.success(msg, {
      action: {
        label: "OK",
        onClick: () => {},
      },
    })
  };

  const profileMutation = useMutation({
    mutationFn: async (data: any) => {
      const formData = new FormData();
      if (data.display_name?.trim()) formData.append("display_name", data.display_name.trim());
      if (data.bio?.trim()) formData.append("bio", data.bio.trim());
      if (data.phone?.trim()) formData.append("phone", data.phone.trim());
      if (isAlumni && data.linkedin_url?.trim()) formData.append("linkedin_url", data.linkedin_url.trim());
      return isAlumni ? updateAlumniProfile(formData) : updateStudentProfile(formData);
    },
    onSuccess: () => {
      setEditMode(false);
      flash("Profile updated successfully.");
      queryClient.invalidateQueries({ queryKey: isAlumni ? ["alumni", "me"] : ["student", "me"] });
    },
  });

  const skillMutation = useMutation({
    mutationFn: (data: any) => isAlumni ? addSkill(data) : addStudentSkill(data),
    onSuccess: () => {
      setShowAddSkill(false);
      skillForm.reset();
      flash("Skill added.");
      queryClient.invalidateQueries({ queryKey: isAlumni ? ["alumni", "me"] : ["student", "me"] });
    },
  });

  const deleteSkillMutation = useMutation({
    mutationFn: deleteSkill,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alumni", "me"] }),
  });

  const workMutation = useMutation({
    mutationFn: addWorkExperience,
    onSuccess: () => {
      setShowAddWork(false);
      workForm.reset();
      flash("Work experience added.");
      queryClient.invalidateQueries({ queryKey: ["alumni", "me"] });
    },
  });

  const deleteWorkMutation = useMutation({
    mutationFn: deleteWorkExperience,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alumni", "me"] }),
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("profile_picture", file);
      if (isAlumni) await updateAlumniProfile(formData);
      else await updateStudentProfile(formData);
      flash("Profile picture updated.");
      queryClient.invalidateQueries({ queryKey: isAlumni ? ["alumni", "me"] : ["student", "me"] });
    } finally {
      setUploadingImage(false);
    }
  };

  if (isLoading) return <ProfileSkeleton />;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Success toast ────────────────────────────────────────────────── */}
      {successMsg && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-sm font-medium text-emerald-700 dark:text-emerald-300 animate-in fade-in duration-300">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      {/* ── Profile hero card ────────────────────────────────────────────── */}
      <Card className="border-border/60 overflow-hidden">
        <div className="h-24 bg-gradient-to-br from-blue-600/25 via-violet-500/10 to-transparent" />

        <CardContent className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-5 gap-3 flex-wrap">

            {/* Avatar with upload overlay */}
            <div className="relative flex-shrink-0">
              <Avatar className="h-20 w-20 ring-4 ring-background shadow-md">
                <AvatarImage src={p?.profile_picture} alt={p?.display_name} />
                <AvatarFallback className="bg-blue-600 text-white text-2xl font-bold">
                  {getInitials(p?.display_name)}
                </AvatarFallback>
              </Avatar>
              <label className={`absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-background border border-border/60 shadow-sm flex items-center justify-center cursor-pointer hover:bg-muted transition-colors ${uploadingImage ? "opacity-60 pointer-events-none" : ""}`}>
                {uploadingImage
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  : <Camera className="h-3.5 w-3.5 text-muted-foreground" />
                }
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
              </label>
            </div>

            {/* Edit toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditMode(!editMode)}
              className="h-8 gap-1.5 text-xs border-border/60 mb-1"
            >
              {editMode
                ? <><X className="h-3.5 w-3.5" /> Cancel</>
                : <><Pencil className="h-3.5 w-3.5" /> Edit Profile</>
              }
            </Button>
          </div>

          {/* Name + handle */}
          <h1 className="text-xl font-bold tracking-tight text-foreground">{p?.display_name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">@{p?.username}</p>

          {/* Role + company (alumni) */}
          {isAlumni && (p?.current_role || p?.current_company) && (
            <p className="flex items-center gap-1.5 text-sm text-foreground mt-2">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              {[p.current_role, p.current_company].filter(Boolean).join(" · ")}
            </p>
          )}

          {/* Degree + batch */}
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
            <GraduationCap className="h-3.5 w-3.5" />
            {[profile?.degree, profile?.batch, isAlumni ? `Class of ${p?.graduation_year}` : `Semester ${p?.semester}`]
              .filter(Boolean).join(" · ")}
          </p>

          {/* Read-only bio */}
          {!editMode && profile?.bio && (
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
          )}

          {/* Contact row */}
          {!editMode && (
            <div className="mt-3 flex flex-wrap gap-4">
              {p?.phone && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  {p.phone}
                </span>
              )}
              {isAlumni && p?.linkedin_url && (
                <a
                  href={p.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <Linkedin className="h-3 w-3" />
                  LinkedIn
                </a>
              )}
              {isAlumni && (
                <Link
                  href="/network?tab=connections"
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-blue-600 transition-colors"
                >
                  <Network className="h-3 w-3" />
                  {p?.connections_count ?? 0} connections
                </Link>
              )}
            </div>
          )}

          {/* Edit form */}
          {editMode && (
            <form
              onSubmit={profileForm.handleSubmit((data) => profileMutation.mutate(data))}
              className="mt-5 pt-5 border-t border-border/60 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <div className="space-y-1.5">
                <Label htmlFor="display_name" className="text-sm font-medium text-foreground">Display Name</Label>
                <Input
                  {...profileForm.register("display_name")}
                  id="display_name"
                  placeholder="Your professional name"
                  className="h-10 text-sm border-border/60"
                />
                <FieldError message={profileForm.formState.errors.display_name?.message as string} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bio" className="text-sm font-medium text-foreground">Bio</Label>
                <textarea
                  {...profileForm.register("bio")}
                  id="bio"
                  rows={3}
                  placeholder="Tell the network about yourself…"
                  className="w-full px-3.5 py-2.5 text-sm border border-border/60 rounded-xl outline-none resize-none bg-background text-foreground placeholder:text-muted-foreground/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all"
                />
                <FieldError message={profileForm.formState.errors.bio?.message as string} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm font-medium text-foreground">Phone</Label>
                <Input {...profileForm.register("phone")} id="phone" placeholder="+92-300-1234567" className="h-10 text-sm border-border/60" />
              </div>

              {isAlumni && (
                <div className="space-y-1.5">
                  <Label htmlFor="linkedin_url" className="text-sm font-medium text-foreground">LinkedIn URL</Label>
                  <Input {...(profileForm.register as any)("linkedin_url")} id="linkedin_url" placeholder="https://linkedin.com/in/yourname" className="h-10 text-sm border-border/60" />
                </div>
              )}

              <Button
                type="submit"
                disabled={profileMutation.isPending}
                className="h-9 gap-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20"
              >
                {profileMutation.isPending
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                  : "Save Changes"
                }
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* ── Skills card ──────────────────────────────────────────────────── */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <SectionHeader
            icon={<Tag className="h-3.5 w-3.5" />}
            title="Skills"
            action={
              <button
                onClick={() => setShowAddSkill(!showAddSkill)}
                className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                {showAddSkill ? <><X className="h-3.5 w-3.5" /> Cancel</> : <><Plus className="h-3.5 w-3.5" /> Add Skill</>}
              </button>
            }
          />

          {/* Add skill form */}
          {showAddSkill && (
            <div className="mb-4 p-4 bg-muted/40 border border-border/60 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Skill</Label>
                  <Select onValueChange={(val) => skillForm.setValue("skill_name", val, { shouldValidate: true })}>
                    <SelectTrigger className="h-9 text-sm border-border/60">
                      <SelectValue placeholder="Select skill" />
                    </SelectTrigger>
                    <SelectContent>
                      {allSkills?.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FieldError message={skillForm.formState.errors.skill_name?.message} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</Label>
                  <Input {...skillForm.register("category")} placeholder="e.g. Programming" className="h-9 text-sm border-border/60" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Proficiency</Label>
                <Select onValueChange={(val) => skillForm.setValue("proficiency_level", val as any, { shouldValidate: true })}>
                  <SelectTrigger className="h-9 text-sm border-border/60">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <form onSubmit={skillForm.handleSubmit((data) => skillMutation.mutate(data))}>
                <Button type="submit" size="sm" disabled={skillMutation.isPending} className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20">
                  {skillMutation.isPending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Adding…</> : "Add Skill"}
                </Button>
              </form>
            </div>
          )}

          {/* Skills display */}
          {p?.detailed_skills?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {p.detailed_skills.map((s: any) => {
                const meta = PROFICIENCY_META[s.proficiency_level] ?? PROFICIENCY_META.beginner;
                return (
                  <div key={s.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-muted/40 group">
                    <span className="text-xs font-medium text-foreground">{s.skill_name}</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${meta.badge}`}>
                      {s.proficiency_level}
                    </span>
                    {isAlumni && (
                      <button
                        onClick={() => deleteSkillMutation.mutate(s.id)}
                        disabled={deleteSkillMutation.isPending}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground/50 hover:text-rose-500 transition-all ml-0.5"
                        aria-label="Remove skill"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : profile?.skills?.length ? (
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((s: string) => (
                <span key={s} className="text-xs px-3 py-1.5 rounded-full font-medium bg-muted text-foreground border border-border/60">
                  {s}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No skills added yet.</p>
          )}
        </CardContent>
      </Card>

      {/* ── Work Experience — alumni only ─────────────────────────────────── */}
      {isAlumni && (
        <Card className="border-border/60">
          <CardContent className="p-6">
            <SectionHeader
              icon={<Briefcase className="h-3.5 w-3.5" />}
              title="Work Experience"
              action={
                <button
                  onClick={() => setShowAddWork(!showAddWork)}
                  className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  {showAddWork ? <><X className="h-3.5 w-3.5" /> Cancel</> : <><Plus className="h-3.5 w-3.5" /> Add</>}
                </button>
              }
            />

            {/* Add work form */}
            {showAddWork && (
              <form
                onSubmit={workForm.handleSubmit((data) => workMutation.mutate(data))}
                className="mb-5 p-4 bg-muted/40 border border-border/60 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Company</Label>
                    <Input {...workForm.register("company_name")} placeholder="Company name" className="h-9 text-sm border-border/60" />
                    <FieldError message={workForm.formState.errors.company_name?.message} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Role</Label>
                    <Input {...workForm.register("role")} placeholder="Job title" className="h-9 text-sm border-border/60" />
                    <FieldError message={workForm.formState.errors.role?.message} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Start Date</Label>
                    <Input {...workForm.register("start_date")} type="date" className="h-9 text-sm border-border/60" />
                  </div>
                  {!isCurrentJob && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">End Date</Label>
                      <Input {...workForm.register("end_date")} type="date" className="h-9 text-sm border-border/60" />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Employment Type</Label>
                  <Select onValueChange={(val) => workForm.setValue("employment_type", val as any, { shouldValidate: true })}>
                    <SelectTrigger className="h-9 text-sm border-border/60">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="freelance">Freelance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Current job toggle */}
                <button
                  type="button"
                  onClick={() => workForm.setValue("is_current", !isCurrentJob)}
                  className="flex items-center gap-2 group"
                >
                  <div className={`h-4 w-4 rounded flex items-center justify-center border transition-all ${isCurrentJob
                      ? "bg-blue-600 border-blue-600"
                      : "border-border/60 group-hover:border-border"
                    }`}>
                    {isCurrentJob && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                    I currently work here
                  </span>
                </button>

                <Button type="submit" size="sm" disabled={workMutation.isPending} className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20">
                  {workMutation.isPending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Adding…</> : "Add Experience"}
                </Button>
              </form>
            )}

            {/* Work experience list */}
            {p?.work_experiences?.length > 0 ? (
              <div className="space-y-3">
                {p.work_experiences.map((w: any, idx: number) => (
                  <div key={w.id}>
                    {idx > 0 && <Separator className="opacity-50 mb-3" />}
                    <div className="flex items-start justify-between gap-3 group">
                      <div className="flex gap-3">
                        {/* Company icon */}
                        <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-foreground">{w.role}</p>
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-muted text-muted-foreground border-border/60 capitalize">
                              {w.employment_type}
                            </span>
                            {w.is_current && (
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                                Current
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">{w.company_name}</p>
                          <p className="text-xs text-muted-foreground/60 mt-0.5 flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            {w.start_date ? new Date(w.start_date).toLocaleDateString() : "—"} — {w.is_current ? "Present" : (w.end_date ? new Date(w.end_date).toLocaleDateString() : "—")}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => deleteWorkMutation.mutate(w.id)}
                        disabled={deleteWorkMutation.isPending}
                        className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-muted-foreground hover:text-rose-500 transition-all flex-shrink-0 mt-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No work experience added yet.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Activity / Posts — alumni only ─────────────────────────────────── */}
      {isAlumni && myOpportunities && myOpportunities.length > 0 && (
        <Card className="border-border/60">
          <CardContent className="p-6">
            <SectionHeader
              icon={<Activity className="h-3.5 w-3.5" />}
              title="Recent Activity"
              action={
                <Link href="/my-opportunities" className="text-xs font-medium text-blue-600 flex items-center gap-1 hover:underline">
                  See all <ArrowRight className="h-3 w-3" />
                </Link>
              }
            />
            <div className="space-y-4">
              {myOpportunities.slice(0, 3).map((opp: any) => (
                <div key={opp.id} className="group">
                  <Link href={`/opportunities/${opp.id}`} className="block">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-foreground group-hover:text-blue-600 transition-colors truncate">{opp.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{opp.company}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                            opp.status === "open" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-muted text-muted-foreground border-border/40"
                          }`}>
                            {opp.status}
                          </span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <CalendarDays className="h-2.5 w-2.5" />
                            Posted {opp.posted_at ? new Date(opp.posted_at).toLocaleDateString() : "—"}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors ml-2 flex-shrink-0" />
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── My Mentors — student only ─────────────────────────────────────── */}
      {!isAlumni && network && network.length > 0 && (
        <Card className="border-border/60">
          <CardContent className="p-6">
            <SectionHeader
              icon={<Users className="h-3.5 w-3.5" />}
              title="My Mentors"
              action={
                <Link href="/network?tab=connections" className="text-xs font-medium text-blue-600 flex items-center gap-1 hover:underline">
                   View Network <ArrowRight className="h-3 w-3" />
                </Link>
              }
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {network.map((mentor: any) => (
                <div key={mentor.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/40 hover:border-blue-500/30 hover:shadow-sm transition-all duration-200">
                  <Avatar className="h-10 w-10 border border-border/60">
                    <AvatarImage src={mentor.profile_picture} />
                    <AvatarFallback className="bg-blue-600 text-white text-xs font-bold">{getInitials(mentor.display_name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate leading-none mb-1">{mentor.display_name}</p>
                    <p className="text-[11px] text-muted-foreground truncate leading-none">{mentor.role} · {mentor.company}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
