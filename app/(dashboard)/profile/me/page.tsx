"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyAlumniProfile, updateAlumniProfile, addSkill,
  addWorkExperience, deleteWorkExperience,
  addEducation, deleteEducation, updateEducation,
} from "@/lib/api/alumni.api";
import { getMyStudentProfile, updateStudentProfile, addStudentSkill, requestProfileUpgrade } from "@/lib/api/student.api";
import { getMyPartnerProfile, updatePartnerProfile } from "@/lib/api/partner.api";
import { getMyOpportunities } from "@/lib/api/opportunities.api";
import useAuthStore from "@/store/authStore";
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateAlumniProfileSchema, updateStudentProfileSchema, updatePartnerProfileSchema, addSkillSchema,
  AddSkillInput,
} from "@/schemas/profile.schemas";
import { addWorkExperienceSchema, AddWorkExperienceInput } from "@/schemas/workExperience.schemas";
import { addEducationSchema, AddEducationInput } from "@/schemas/education.schemas";
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
  Pencil, Plus, X, Trash2, Camera, Loader2,
  Linkedin, Phone, Network, Tag, Briefcase, GraduationCap,
  Building2, CalendarDays, AlertCircle, Check,
  Activity, ArrowRight, ChevronRight,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { deleteSkill } from "@/lib/api/skill.api";

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
    <div className="flex items-center justify-between mb-5">
      <h2 className="font-bold text-foreground text-base tracking-tight flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        {title}
      </h2>
      {action}
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-0 space-y-0">
      <Skeleton className="h-56 w-full rounded-none" />
      <div className="bg-background px-6 pb-6">
        <div className="flex items-end justify-between -mt-12 mb-4">
          <Skeleton className="h-24 w-24 rounded-full" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
        <Skeleton className="h-7 w-48 rounded mb-2" />
        <Skeleton className="h-4 w-28 rounded mb-3" />
        <div className="flex gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-20 rounded" />)}
        </div>
      </div>
    </div>
  );
}

// ── Stat Item ─────────────────────────────────────────────────────────────────

function StatItem({
  icon,
  value,
  label,
  small = false,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  small?: boolean;
}) {
  return (
    <div className="flex flex-col items-center px-3 py-2">
      <span className={`text-muted-foreground ${small ? "mb-0.5" : "mb-1"}`}>{icon}</span>
      <span className={`font-bold text-foreground ${small ? "text-sm" : "text-base"}`}>{value}</span>
      <span className={`text-muted-foreground ${small ? "text-[10px]" : "text-xs"}`}>{label}</span>
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
  const [showAddEducation, setShowAddEducation] = useState(false);
  const [editingEducation, setEditingEducation] = useState<any>(null);
  const [skillInput, setSkillInput] = useState("");
  const [skillCategory, setSkillCategory] = useState("");
  const [skillProficiency, setSkillProficiency] = useState<"beginner" | "intermediate" | "expert">("intermediate");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageHash, setImageHash] = useState(Date.now());
  const skillInputRef = useRef<HTMLInputElement>(null);
  const [upgradeYear, setUpgradeYear] = useState<string>("");

  const isAlumniRole = role === "alumni";
  const isPartnerRole = role === "partner";
  const isStudentRole = role === "student";
  const isAlumni = isAlumniRole || isPartnerRole;
  const isReady = role !== undefined && role !== null;

  const { data: alumniProfile, isLoading: alumniLoading } = useQuery({
    queryKey: ["alumni", "me"],
    queryFn: getMyAlumniProfile,
    enabled: isReady && isAlumniRole,
  });

  const { data: partnerProfile, isLoading: partnerLoading } = useQuery({
    queryKey: ["partner", "me"],
    queryFn: getMyPartnerProfile,
    enabled: isReady && isPartnerRole,
  });

  const { data: studentProfile, isLoading: studentLoading } = useQuery({
    queryKey: ["student", "me"],
    queryFn: getMyStudentProfile,
    enabled: isReady && isStudentRole,
  });

  const profile = isPartnerRole ? partnerProfile : isAlumniRole ? alumniProfile : studentProfile;
  const isLoading = isPartnerRole ? partnerLoading : isAlumniRole ? alumniLoading : studentLoading;
  const p = profile as any;

  useEffect(() => {
    if (profile) {
      updateProfile(profile as any);
    }
  }, [profile, updateProfile]);

  const { data: myOpportunities } = useQuery({
    queryKey: ["opportunities", "me"],
    queryFn: getMyOpportunities,
    enabled: isAlumni,
  });

  const profileForm = useForm<any>({
    resolver: zodResolver(isPartnerRole ? updatePartnerProfileSchema : isAlumniRole ? updateAlumniProfileSchema : updateStudentProfileSchema),
    values: {
      ...(!isPartnerRole && { display_name: p?.display_name ?? "" }),
      bio: profile?.bio ?? "",
      phone: (profile as any)?.phone ?? "",
      ...(isStudentRole && { semester: p?.semester ?? undefined }),
      ...(isPartnerRole && { affiliation: p?.affiliation ?? "", job_title: p?.job_title ?? "" }),
      ...((isAlumniRole || isPartnerRole) && { linkedin_url: (profile as any)?.linkedin_url ?? "" }),
    },
  });

  const workForm = useForm<AddWorkExperienceInput>({
    resolver: zodResolver(addWorkExperienceSchema),
    defaultValues: { is_current: false },
  });
  const isCurrentJob = workForm.watch("is_current");

  const educationForm = useForm<AddEducationInput>({
    resolver: zodResolver(addEducationSchema),
    defaultValues: { is_current: false },
  });
  const isCurrentEducation = educationForm.watch("is_current");

  const flash = (msg: string) => {
    toast.success(msg, { action: { label: "OK", onClick: () => { } } });
  };

  const profileMutation = useMutation({
    mutationFn: async (data: any) => {
      const formData = new FormData();
      if (!isPartnerRole && data.display_name?.trim()) formData.append("display_name", data.display_name.trim());
      if (data.bio?.trim()) formData.append("bio", data.bio.trim());
      if (data.phone?.trim()) formData.append("phone", data.phone.trim());
      if (isStudentRole && data.semester) formData.append("semester", String(data.semester));
      if (isPartnerRole && data.affiliation?.trim()) formData.append("affiliation", data.affiliation.trim());
      if (isPartnerRole && data.job_title?.trim()) formData.append("job_title", data.job_title.trim());
      if ((isAlumniRole || isPartnerRole) && data.linkedin_url?.trim()) formData.append("linkedin_url", data.linkedin_url.trim());
      return isPartnerRole ? updatePartnerProfile(formData) : isAlumniRole ? updateAlumniProfile(formData) : updateStudentProfile(formData);
    },
    onSuccess: () => {
      setEditMode(false);
      flash("Profile updated successfully.");
      queryClient.invalidateQueries({ queryKey: isPartnerRole ? ["partner", "me"] : isAlumniRole ? ["alumni", "me"] : ["student", "me"] });
    },
  });

  const skillMutation = useMutation({
    mutationFn: (data: any) => isAlumni ? addSkill(data) : addStudentSkill(data),
    onSuccess: () => {
      setShowAddSkill(false);
      setSkillInput("");
      setSkillCategory("");
      setSkillProficiency("intermediate");
      flash("Skill added.");
      queryClient.invalidateQueries({ queryKey: isAlumni ? ["alumni", "me"] : ["student", "me"] });
    },
  });

  const deleteSkillMutation = useMutation({
    mutationFn: deleteSkill,
    onSuccess: () => {
      flash("Skill deleted successfully.");

      queryClient.invalidateQueries({
        queryKey: isAlumni ? ["alumni", "me"] : ["student", "me"],
      });
    },
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
    onSuccess: () => {
      flash("Work experience deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ["alumni", "me"] })
    }
  });

  const educationMutation = useMutation({
    mutationFn: addEducation,
    onSuccess: () => {
      setShowAddEducation(false);
      educationForm.reset();
      flash("Education added.");
      queryClient.invalidateQueries({ queryKey: ["alumni", "me"] });
    },
  });

  const updateEducationMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateEducation(id, data),
    onSuccess: () => {
      setShowAddEducation(false);
      setEditingEducation(null);
      educationForm.reset();
      flash("Education updated.");
      queryClient.invalidateQueries({ queryKey: ["alumni", "me"] });
    },
  });

  const deleteEducationMutation = useMutation({
    mutationFn: deleteEducation,
    onSuccess: () => {
      flash("Education deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ["alumni", "me"] })
    }
  });

  const upgradeRequestMutation = useMutation({
    mutationFn: requestProfileUpgrade,
    onSuccess: (res) => {
      setUpgradeYear("");
      toast.success(res.message ?? "Profile upgrade request submitted successfully.", {
        action: { label: "OK", onClick: () => { } },
      });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Failed to submit upgrade request.");
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("profile_picture", file);
      if (isPartnerRole) await updatePartnerProfile(formData);
      else if (isAlumniRole) await updateAlumniProfile(formData);
      else await updateStudentProfile(formData);
      flash("Profile picture updated.");
      queryClient.invalidateQueries({ queryKey: isPartnerRole ? ["partner", "me"] : isAlumniRole ? ["alumni", "me"] : ["student", "me"] });
      setImageHash(Date.now());
    } finally {
      setUploadingImage(false);
    }
  };

  const handleBackDropUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("backDropImage", file);
      if (isPartnerRole) await updatePartnerProfile(formData);
      else if (isAlumniRole) await updateAlumniProfile(formData);
      else await updateStudentProfile(formData);
      flash("Backdrop picture updated.");
      queryClient.invalidateQueries({ queryKey: isPartnerRole ? ["partner", "me"] : isAlumniRole ? ["alumni", "me"] : ["student", "me"] });
      setImageHash(Date.now());
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddSkill = () => {
    if (!skillInput.trim()) return;
    skillMutation.mutate({
      skill_name: skillInput.trim(),
      category: skillCategory.trim() || undefined,
      proficiency_level: skillProficiency,
    });
  };

  if (isLoading) return <ProfileSkeleton />;

  const getImageUrl = (url?: string) => {
    if (!url) return url;
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}t=${imageHash}`;
  };

  type ProficiencyLevel = "beginner" | "intermediate" | "expert";
  const PROFICIENCY_COLORS: Record<ProficiencyLevel, string> = {
    expert: "bg-blue-600 text-white",
    intermediate: "bg-blue-100 text-blue-700 border border-blue-300",
    beginner: "bg-gray-100 text-gray-600 border border-gray-300",
  };
  // ── Shared stat blocks (desktop & mobile sizes) ───────────────────────────

  const alumniStats = (small = false) => (
    <>
      <StatItem icon={<Network className={small ? "h-4 w-4" : "h-5 w-5"} />} value={p?.connections_count ?? 0} label="Connections" small={small} />
      <div className={`bg-border/40 ${small ? "w-px h-10" : "w-px h-12"}`} />
      <StatItem icon={<Briefcase className={small ? "h-4 w-4" : "h-5 w-5"} />} value={myOpportunities?.length ?? 0} label="Opportunities" small={small} />
      <div className={`bg-border/40 ${small ? "w-px h-10" : "w-px h-12"}`} />
      <StatItem icon={<Tag className={small ? "h-4 w-4" : "h-5 w-5"} />} value={p?.detailed_skills?.length ?? p?.skills?.length ?? 0} label="Skills" small={small} />
    </>
  );

  const studentStats = (small = false) => (
    <>
      <StatItem icon={<GraduationCap className={small ? "h-4 w-4" : "h-5 w-5"} />} value={`Sem ${p?.semester ?? "—"}`} label="Semester" small={small} />
      <div className={`bg-border/40 ${small ? "w-px h-10" : "w-px h-12"}`} />
      <StatItem icon={<Tag className={small ? "h-4 w-4" : "h-5 w-5"} />} value={p?.detailed_skills?.length ?? p?.skills?.length ?? 0} label="Skills" small={small} />
    </>
  );

  const editButton = (
    <Button
      variant={editMode ? "outline" : "default"}
      size="sm"
      onClick={() => setEditMode(!editMode)}
      className={`h-9 gap-1.5 cursor-pointer !text-blue-600 bg-white text-sm border border-1 !border-blue-600 ${!editMode ? "bg-indigo-600 hover:scale-102 shadow-sm shadow-indigo-600/20" : ""}`}
    >
      {editMode ? <><X className="h-4 w-4" /> Cancel</> : <><Pencil className="h-4 w-4" /> Edit Profile</>}
    </Button>
  );

  const nameBlock = (mobile = false) => (
    <div className={`flex flex-col items-center mt-4 text-center ${mobile ? "" : ""}`}>
      <h1 className={`font-bold text-foreground tracking-tight ${mobile ? "text-xl" : "text-2xl"}`}>{p?.display_name}</h1>
      <p className="text-sm text-gray-400 mt-0.5">@{p?.username}</p>
      {isAlumni && (p?.current_role || p?.current_company) && (
        <p className="text-sm text-muted-foreground mt-0.5">
          {[p.current_role, p.current_company].filter(Boolean).join(" · ")}
        </p>
      )}
      <p className="text-sm text-muted-foreground mt-0.5">
        {role === "partner"
          ? [p?.job_title, p?.affiliation].filter(Boolean).join(" · ")
          : [profile?.degree, profile?.batch, isAlumni
            ? `Class of ${p?.graduation_year}`
            : `Semester ${p?.semester}`
          ].filter(Boolean).join(" · ")
        }
      </p>
    </div>
  );

  return (
    <div className="w-full mx-auto animate-in fade-in duration-500">
      <div className="relative h-52 sm:h-64 overflow-visible bg-gradient-to-br from-indigo-500/30 via-violet-400/20 to-purple-300/10">

        {/* Clipped background — image stays inside cover bounds */}
        <div className="absolute inset-0 overflow-hidden">
          {p?.backDropImage && (
            <img
              src={getImageUrl(p.backDropImage)}
              alt="Cover"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>

        {/* Cover upload */}
        <label className={`absolute top-4 right-4 z-10 h-9 w-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-black/50 transition-colors ${uploadingImage ? "opacity-60 pointer-events-none" : ""}`}>
          {uploadingImage
            ? <Loader2 className="h-4 w-4 animate-spin text-white" />
            : <Camera className="h-4 w-4 text-white" />}
          <input type="file" accept="image/*" className="hidden" onChange={handleBackDropUpload} disabled={uploadingImage} />
        </label>

        {/* Avatar — centered, overlaps into profile bar below */}
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 z-20">
          <div className="relative">
            <Avatar className="h-24 w-24 ring-4 ring-background shadow-lg">
              <AvatarImage src={getImageUrl(p?.profile_picture)} alt={p?.display_name} />
              <AvatarFallback className="bg-indigo-600 text-white text-3xl font-bold">
                {getInitials(p?.display_name)}
              </AvatarFallback>
            </Avatar>
            <label className={`absolute -bottom-1 -right-1 z-30 h-7 w-7 rounded-full bg-background border-2 border-background shadow-md flex items-center justify-center cursor-pointer hover:bg-muted transition-colors ${uploadingImage ? "opacity-60 pointer-events-none" : ""}`}>
              {uploadingImage
                ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                : <Camera className="h-3.5 w-3.5 text-muted-foreground" />}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
            </label>
          </div>
        </div>
      </div>

      {/* ── Profile bar ─────────────────────────────────────────────────────── */}
      <div className="bg-background border-b border-border/60">

        {/* ── DESKTOP (sm+) ── */}
        <div className="hidden sm:grid grid-cols-3 items-center px-6 pt-14 pb-3">

          {/* col-1: Stats — LEFT aligned inside their column */}
          <div className="flex items-center gap-1 justify-start">
            {isAlumni ? alumniStats() : studentStats()}
          </div>

          {/* col-2: Name — CENTER of the screen */}
          {nameBlock()}

          {/* col-3: Actions — RIGHT aligned inside their column */}
          <div className="flex items-center gap-2 justify-end">
            {isAlumni && p?.linkedin_url && (
              <a
                href={p.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 rounded-full border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 flex items-center justify-center hover:bg-blue-100 transition-colors"
              >
                <Linkedin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </a>
            )}
            {editButton}
          </div>
        </div>

        {/* ── MOBILE (<sm) — stack vertically, everything centered ── */}
        <div className="sm:hidden flex flex-col items-center px-4 pt-14 pb-3 gap-3">
          {nameBlock(true)}
          <div className="flex items-center gap-1">
            {isAlumni ? alumniStats(true) : studentStats(true)}
          </div>
          <div className="flex items-center gap-2">
            {isAlumni && p?.linkedin_url && (
              <a
                href={p.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 rounded-full border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 flex items-center justify-center hover:bg-blue-100 transition-colors"
              >
                <Linkedin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </a>
            )}
            {editButton}
          </div>
        </div>

        {/* Tab nav */}
        <div className="flex items-center gap-6 px-4 sm:px-6 mt-1">
          <button className="py-3 text-md text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400">
            Profile
          </button>
          {isAlumni && (
            <Link href="/my-opportunities" className="py-3 text-md font-md text-muted-foreground hover:text-foreground transition-colors border-b-2 border-transparent">
              Opportunities
            </Link>
          )}
          <Link href="/network" className="py-3 text-md font-md text-muted-foreground hover:text-foreground transition-colors border-b-2 border-transparent">
            Network
          </Link>
        </div>
      </div>

      {/* ── Body: two-column on md+ ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4 px-4 sm:px-6 py-5">

        {/* ── LEFT SIDEBAR ────────────────────────────────────────────────────── */}
        <div className="space-y-4">

          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-5">
              <h2 className="font-bold text-foreground text-base mb-3">Introduction</h2>

              {!editMode && profile?.bio ? (
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{profile.bio}</p>
              ) : !editMode ? (
                <p className="text-sm text-muted-foreground mb-4 italic">No bio yet.</p>
              ) : null}

              {!editMode && (
                <div className="space-y-2.5">
                  {isAlumni && p?.current_company && (
                    <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4 flex-shrink-0" />
                      <span>{p.current_company}</span>
                    </div>
                  )}
                  {p?.phone && (
                    <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <span>{p.phone}</span>
                    </div>
                  )}
                  {isAlumni && p?.linkedin_url && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <Linkedin className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <a href={p.linkedin_url} target="_blank" rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline truncate">
                        LinkedIn Profile
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <GraduationCap className="h-4 w-4 flex-shrink-0" />
                    <span>{[profile?.degree, profile?.batch].filter(Boolean).join(", ")}</span>
                  </div>
                  {role === "partner" && p?.affiliation && (
                    <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4 flex-shrink-0" />
                      <span>{p.affiliation}</span>
                    </div>
                  )}
                  {role === "partner" && p?.job_title && (
                    <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <Briefcase className="h-4 w-4 flex-shrink-0" />
                      <span>{p.job_title}</span>
                    </div>
                  )}
                  {!isAlumni && p?.semester && (
                    <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <CalendarDays className="h-4 w-4 flex-shrink-0" />
                      <span>Semester {p.semester}</span>
                    </div>
                  )}
                  {p?.email && (
                    <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span>{p.email}</span>
                    </div>
                  )}
                </div>
              )}

              {editMode && (
                <form
                  onSubmit={profileForm.handleSubmit((data) => profileMutation.mutate(data))}
                  className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200"
                >
                  {!isPartnerRole && (
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Display Name</Label>
                      <Input {...profileForm.register("display_name")} placeholder="Your name" className="h-9 text-sm border-border/60" />
                      <FieldError message={profileForm.formState.errors.display_name?.message as string} />
                    </div>
                  )}
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bio</Label>
                    <textarea
                      {...profileForm.register("bio")}
                      rows={3}
                      placeholder="Tell the network about yourself…"
                      className="w-full px-3 py-2 text-sm border border-border/60 rounded-lg outline-none resize-none bg-background text-foreground placeholder:text-muted-foreground/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition-all"
                    />
                  </div>
                  {isPartnerRole && (
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Affiliation</Label>
                      <Input {...profileForm.register("affiliation")} placeholder="Company name" className="h-9 text-sm border-border/60" />
                      <FieldError message={profileForm.formState.errors.affiliation?.message as string} />
                    </div>
                  )}
                  {isPartnerRole && (
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Job Title</Label>
                      <Input {...profileForm.register("job_title")} placeholder="Your role" className="h-9 text-sm border-border/60" />
                      <FieldError message={profileForm.formState.errors.job_title?.message as string} />
                    </div>
                  )}
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone</Label>
                    <Input {...profileForm.register("phone")} placeholder="+92-300-1234567" className="h-9 text-sm border-border/60" />
                  </div>
                  {isStudentRole && (
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Semester</Label>
                      <Select
                        defaultValue={p?.semester ? String(p.semester) : undefined}
                        onValueChange={(val) => profileForm.setValue("semester", Number(val))}
                      >
                        <SelectTrigger className="h-9 text-sm border-border/60">
                          <SelectValue placeholder="Select semester" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                            <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {isAlumni && (
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">LinkedIn URL</Label>
                      <Input {...(profileForm.register as any)("linkedin_url")} placeholder="https://linkedin.com/in/..." className="h-9 text-sm border-border/60" />
                    </div>
                  )}
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Email
                    </Label>
                    <Input
                      value={p?.email || ""}
                      disabled
                      className="h-9 text-sm border-border/60 bg-muted/40 text-black cursor-not-allowed"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={profileMutation.isPending}
                    className="w-full h-9 text-sm bg-white hover:scale-102 border border-1 !border-blue-600 !text-blue-600 shadow-sm shadow-blue-600/20"
                  >
                    {profileMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : "Save Changes"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Education — alumni and partner */}
          {isAlumni && (
            <Card className="border-border/60 shadow-sm">
              <CardContent className="p-5">
                <SectionHeader
                  icon={<GraduationCap className="h-4 w-4" />}
                  title="Education"
                  action={
                    <button
                      onClick={() => {
                        if (showAddEducation) {
                          setShowAddEducation(false);
                          setEditingEducation(null);
                          educationForm.reset();
                        } else {
                          setEditingEducation(null);
                          educationForm.reset();
                          setShowAddEducation(true);
                        }
                      }}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      {showAddEducation ? <><X className="h-3.5 w-3.5" /> Cancel</> : <><Plus className="h-3.5 w-3.5" /> Add</>}
                    </button>
                  }
                />

                {showAddEducation && (
                  <form
                    onSubmit={educationForm.handleSubmit((data) => {
                      if (editingEducation) {
                        updateEducationMutation.mutate({ id: editingEducation.id, data });
                      } else {
                        educationMutation.mutate(data);
                      }
                    })}
                    className="mb-4 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200 border border-border/40 rounded-xl"
                  >
                    {editingEducation && (
                      <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Editing Education</p>
                    )}
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">University</Label>
                      <Input {...educationForm.register("university")} placeholder="University name" className="h-9 text-sm border-border/60" />
                      <FieldError message={educationForm.formState.errors.university?.message as string} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Degree</Label>
                        <Input {...educationForm.register("degree")} placeholder="e.g. BSc" className="h-9 text-sm border-border/60" />
                        <FieldError message={educationForm.formState.errors.degree?.message as string} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Field of Study</Label>
                        <Input {...educationForm.register("field_of_study")} placeholder="e.g. Computer Science" className="h-9 text-sm border-border/60" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Start Date</Label>
                        <Input {...educationForm.register("start_date")} type="date" className="h-9 text-sm border-border/60" />
                        <FieldError message={educationForm.formState.errors.start_date?.message as string} />
                      </div>
                      {!isCurrentEducation && (
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">End Date</Label>
                          <Input {...educationForm.register("end_date")} type="date" className="h-9 text-sm border-border/60" />
                          <FieldError message={educationForm.formState.errors.end_date?.message as string} />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="is_current_edu"
                        {...educationForm.register("is_current")}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <Label htmlFor="is_current_edu" className="text-sm cursor-pointer text-foreground">
                        I am currently studying here
                      </Label>
                    </div>
                    <Button
                      type="submit"
                      disabled={educationMutation.isPending || updateEducationMutation.isPending}
                      size="sm"
                      className="w-full h-9 !bg-white !text-blue-600 !border cursor-pointer !border-blue-600 hover:bg-blue-50"
                    >
                      {(educationMutation.isPending || updateEducationMutation.isPending)
                        ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Saving…</>
                        : editingEducation ? "Update Education" : "Save Education"}
                    </Button>
                  </form>
                )}

                {p?.education?.length > 0 ? (
                  <div className="space-y-4">
                    {p.education.map((edu: any, i: number) => (
                      <div key={edu.id || i} className="group relative pl-4 border-l-2 border-border/60 pb-4 last:pb-0">
                        <div className="absolute w-2 h-2 bg-blue-500 rounded-full -left-[5px] top-1.5 ring-4 ring-background" />
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-foreground text-sm">{edu.degree} {edu.field_of_study && `in ${edu.field_of_study}`}</h3>
                            <p className="text-sm text-muted-foreground font-medium">{edu.university}</p>
                            <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                              <CalendarDays className="h-3.5 w-3.5" />
                              <span>
                                {new Date(edu.start_date).getFullYear()} – {edu.is_current ? "Present" : edu.end_date ? new Date(edu.end_date).getFullYear() : ""}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                              onClick={() => {
                                setEditingEducation(edu);
                                educationForm.reset({
                                  university: edu.university ?? "",
                                  degree: edu.degree ?? "",
                                  field_of_study: edu.field_of_study ?? "",
                                  start_date: edu.start_date ? edu.start_date.slice(0, 10) : "",
                                  end_date: edu.end_date ? edu.end_date.slice(0, 10) : "",
                                  is_current: edu.is_current ?? false,
                                });
                                setShowAddEducation(true);
                              }}
                              className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-md transition-all"
                              title="Edit education"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => deleteEducationMutation.mutate(edu.id)}
                              disabled={deleteEducationMutation.isPending}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-md transition-all disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No education added yet.</p>
                )}
              </CardContent>
            </Card>
          )}

        </div>

        {/* ── RIGHT MAIN CONTENT ───────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Skills card */}
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-5">
              <SectionHeader
                icon={<Tag className="h-4 w-4" />}
                title="Skills"
                action={
                  <button
                    onClick={() => setShowAddSkill(!showAddSkill)}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    {showAddSkill ? <><X className="h-3.5 w-3.5" /> Cancel</> : <><Plus className="h-3.5 w-3.5" /> Add Skill</>}
                  </button>
                }
              />

              {showAddSkill && (
                <div className="mb-4 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-1 space-y-1">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Skill Name</Label>
                      <Input
                        ref={skillInputRef}
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddSkill(); } }}
                        placeholder="e.g. React, Python…"
                        className="h-9 text-sm border-border/60"
                        autoFocus
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</Label>
                      <Input
                        value={skillCategory}
                        onChange={(e) => setSkillCategory(e.target.value)}
                        placeholder="e.g. Programming"
                        className="h-9 text-sm border-border/60"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Proficiency</Label>
                      <Select value={skillProficiency} onValueChange={(v) => setSkillProficiency(v as any)}>
                        <SelectTrigger className="h-9 text-sm border-border/60">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="expert">Expert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    onClick={handleAddSkill}
                    disabled={skillMutation.isPending || !skillInput.trim()}
                    size="sm"
                    className="h-9 gap-1.5 cursor-pointer !text-blue-600 bg-white text-sm border border-1 !border-blue-600"
                  >
                    {skillMutation.isPending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Adding…</> : "Add Skill"}
                  </Button>
                </div>
              )}

              {p?.detailed_skills?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {p.detailed_skills.map((s: {
                    id: string;
                    skill_name?: string;
                    name?: string;
                    skill?: string;
                    proficiency_level: ProficiencyLevel;
                  }) => (
                    <div
                      key={s.id}
                      className={`inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-t-full rounded-tr-full rounded-br-full rounded-bl-none border text-xs font-semibold transition-all ${PROFICIENCY_COLORS[s.proficiency_level] ?? PROFICIENCY_COLORS.beginner}`}
                    >
                      <span>{s.skill_name || s.name || s.skill}</span>
                      <button
                        onClick={() => deleteSkillMutation.mutate(s.id)}
                        disabled={deleteSkillMutation.isPending}
                        className="h-4 w-4 rounded-full flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex-shrink-0 disabled:opacity-100"
                        aria-label="Remove skill"
                      >
                        {deleteSkillMutation.isPending ? (
                          <Loader2 className="h-2.5 w-2.5 animate-spin" />
                        ) : (
                          <X className="h-2.5 w-2.5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              ) : profile?.skills?.length ? (
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((s: string) => (
                    <span key={s} className="inline-flex items-center pl-3 pr-2 py-1.5 rounded-full text-xs font-semibold bg-muted text-foreground border border-border/60">
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No skills added yet. Click "Add Skill" to get started.</p>
              )}
            </CardContent>
          </Card>

          {/* Work Experience — alumni only */}
          {isAlumni && (
            <Card className="border-border/60 shadow-sm">
              <CardContent className="p-5">
                <SectionHeader
                  icon={<Briefcase className="h-4 w-4" />}
                  title="Work Experience"
                  action={
                    <button
                      onClick={() => setShowAddWork(!showAddWork)}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors"                    >
                      {showAddWork ? <><X className="h-3.5 w-3.5" /> Cancel</> : <><Plus className="h-3.5 w-3.5" /> Add</>}
                    </button>
                  }
                />

                {showAddWork && (
                  <form
                    onSubmit={workForm.handleSubmit((data) => workMutation.mutate(data))}
                    className="mb-4 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Company</Label>
                        <Input {...workForm.register("company_name")} placeholder="Company name" className="h-9 text-sm border-border/60" />
                        <FieldError message={workForm.formState.errors.company_name?.message} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Role</Label>
                        <Input {...workForm.register("role")} placeholder="Job title" className="h-9 text-sm border-border/60" />
                        <FieldError message={workForm.formState.errors.role?.message} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Start Date</Label>
                        <Input {...workForm.register("start_date")} type="date" className="h-9 text-sm border-border/60" />
                      </div>
                      {!isCurrentJob && (
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">End Date</Label>
                          <Input {...workForm.register("end_date")} type="date" className="h-9 text-sm border-border/60" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
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
                    <button
                      type="button"
                      onClick={() => workForm.setValue("is_current", !isCurrentJob)}
                      className="flex items-center gap-2 group"
                    >
                      <div className={`h-4 w-4 rounded flex items-center justify-center border transition-all ${isCurrentJob ? "bg-indigo-600 border-indigo-600" : "border-border/60 group-hover:border-border"}`}>
                        {isCurrentJob && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                        I currently work here
                      </span>
                    </button>
                    <Button type="submit" size="sm" disabled={workMutation.isPending} className="h-9 gap-1.5 cursor-pointer !text-blue-600 bg-white text-sm border border-1 !border-blue-600">
                      {workMutation.isPending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Adding…</> : "Add Experience"}
                    </Button>
                  </form>
                )}

                {p?.work_experiences?.length > 0 ? (
                  <div className="space-y-4">
                    {p.work_experiences.map((w: any, idx: number) => (
                      <div key={w.id}>
                        {idx > 0 && <Separator className="opacity-40 mb-4" />}
                        <div className="flex items-start justify-between gap-3 group">
                          <div className="flex gap-3">
                            <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center flex-shrink-0 mt-0.5 border border-indigo-100 dark:border-indigo-900">
                              <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-bold text-foreground">{w.role}</p>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-muted text-muted-foreground border-border/60 capitalize">
                                  {w.employment_type}
                                </span>
                                {w.is_current && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                                    Current
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-0.5">{w.company_name}</p>
                              <p className="text-xs text-muted-foreground/60 mt-1 flex items-center gap-1">
                                <CalendarDays className="h-3 w-3" />
                                {w.start_date ? new Date(w.start_date).toLocaleDateString() : "—"} — {w.is_current ? "Present" : (w.end_date ? new Date(w.end_date).toLocaleDateString() : "—")}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => deleteWorkMutation.mutate(w.id)}
                            disabled={deleteWorkMutation.isPending}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all flex-shrink-0 mt-0.5 disabled:opacity-100"
                          >
                            {deleteWorkMutation.isPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
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

          {/* Recent Opportunities — alumni only */}
          {isAlumni && myOpportunities && myOpportunities.length > 0 && (
            <Card className="border-border/60 shadow-sm">
              <CardContent className="p-5">
                <SectionHeader
                  icon={<Activity className="h-4 w-4" />}
                  title="Recent Activity"
                  action={
                    <Link href="/my-opportunities" className="text-xs font-semibold text-indigo-600 flex items-center gap-1 hover:underline">
                      See all <ArrowRight className="h-3 w-3" />
                    </Link>
                  }
                />
                <div className="space-y-3">
                  {myOpportunities.slice(0, 3).map((opp: any) => (
                    <Link key={opp.id} href={`/opportunities/${opp.id}`}>
                      <div className="flex items-start justify-between p-3 rounded-xl border border-border/40 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all group">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold text-foreground group-hover:text-indigo-600 transition-colors truncate">{opp.title}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{opp.company}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${opp.status === "open" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-muted text-muted-foreground border-border/40"
                              }`}>
                              {opp.status}
                            </span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <CalendarDays className="h-2.5 w-2.5" />
                              {opp.posted_at ? new Date(opp.posted_at).toLocaleDateString() : "—"}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-indigo-600 transition-colors ml-2 flex-shrink-0 mt-1" />
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Request Profile Upgrade — student only */}
          {!isAlumni && (
            <Card className="border-amber-200 dark:border-amber-800 shadow-sm bg-amber-50/40 dark:bg-amber-950/10">
              <CardContent className="p-5">
                <SectionHeader
                  icon={<GraduationCap className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                  title="Request Profile Upgrade"
                />
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  Already graduated? Submit a request to upgrade your profile from
                  <span className="font-semibold text-blue-600"> Student </span>
                  to
                  <span className="font-semibold text-blue-600"> Alumni</span>.
                  An admin will review and approve your request.
                </p>
                <div className="flex items-end gap-3">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Graduation Year
                    </Label>
                    <Input
                      id="upgrade-graduation-year"
                      type="number"
                      min={1990}
                      max={new Date().getFullYear() + 5}
                      placeholder={`e.g. ${new Date().getFullYear()}`}
                      value={upgradeYear}
                      onChange={(e) => setUpgradeYear(e.target.value)}
                      className="h-9 text-sm border-amber-200 dark:border-amber-800 focus:border-amber-400"
                      disabled={upgradeRequestMutation.isPending}
                    />
                  </div>
                  <Button
                    id="submit-upgrade-request"
                    onClick={() => {
                      const year = parseInt(upgradeYear, 10);
                      if (!upgradeYear || isNaN(year)) {
                        toast.error("Please enter a valid graduation year.");
                        return;
                      }
                      upgradeRequestMutation.mutate({ graduation_year: year });
                    }}
                    disabled={upgradeRequestMutation.isPending || !upgradeYear.trim()}
                    className="h-9 gap-1.5 cursor-pointer bg-white hover:scale-103 !text-blue-600 !border !border-blue-600 font-normal flex-shrink-0"
                  >
                    {upgradeRequestMutation.isPending ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
                    ) : (
                      <><GraduationCap className="h-4 w-4" /> Request Upgrade</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}