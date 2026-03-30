"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { postOpportunitySchema, PostOpportunityInput } from "@/schemas/opportunity.schemas";
import { postOpportunity } from "@/lib/api/opportunities.api";
import { getAllSkills } from "@/lib/api/alumni.api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import {
  Briefcase,
  GraduationCap,
  Zap,
  MapPin,
  Wifi,
  FileText,
  CheckSquare,
  Tag,
  Link as LinkIcon,
  CalendarClock,
  ImagePlus,
  Loader2,
  AlertCircle,
  X,
  ArrowLeft,
  Building2,
} from "lucide-react";

// ── Field helpers ─────────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1">
      <AlertCircle className="h-3 w-3 flex-shrink-0" />
      {message}
    </p>
  );
}

function SectionLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="h-6 w-6 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
        {icon}
      </div>
      <span className="text-[13px] font-semibold text-foreground">{children}</span>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

const TYPES = [
  { value: "job", label: "Job", icon: <Briefcase className="h-4 w-4" /> },
  { value: "internship", label: "Internship", icon: <GraduationCap className="h-4 w-4" /> },
  { value: "freelance", label: "Freelance", icon: <Zap className="h-4 w-4" /> },
] as const;

export default function PostOpportunityPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [serverError, setServerError] = useState("");

  const { data: skills } = useQuery({
    queryKey: ["skills"],
    queryFn: getAllSkills,
    staleTime: Infinity,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PostOpportunityInput>({
    resolver: zodResolver(postOpportunitySchema),
    defaultValues: { is_remote: false, required_skills: [] },
  });

  const isRemote = watch("is_remote");
  const selectedType = watch("type");

  const toggleSkill = (skill: string) => {
    const updated = selectedSkills.includes(skill)
      ? selectedSkills.filter((s) => s !== skill)
      : [...selectedSkills, skill];
    setSelectedSkills(updated);
    setValue("required_skills", updated, { shouldValidate: true });
  };

  const mutation = useMutation({
    mutationFn: postOpportunity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      router.push("/my-opportunities");
    },
    onError: (error: any) => {
      setServerError(error.response?.data?.message || "Failed to post. Try again.");
    },
  });

  const onSubmit = (data: PostOpportunityInput) => {
    setServerError("");
    mutation.mutate(data);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          Back
        </button>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Post Opportunity</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Broadcast a job, internship, or freelance opportunity to the network
        </p>
      </div>

      {/* Server error */}
      {serverError && (
        <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
          <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-rose-700 dark:text-rose-300">{serverError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* ── Section 1: Basics ────────────────────────────────────────── */}
        <Card className="border-border/60">
          <CardContent className="p-6">
            <SectionLabel icon={<Briefcase className="h-3.5 w-3.5" />}>
              Basic Info
            </SectionLabel>

            {/* Type picker */}
            <div className="space-y-1.5 mb-5">
              <Label className="text-sm font-medium text-foreground">Opportunity Type</Label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {TYPES.map(({ value, label, icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setValue("type", value, { shouldValidate: true })}
                    className={`
                      flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-150
                      ${selectedType === value
                        ? "border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-600/25"
                        : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
                      }
                    `}
                  >
                    {icon}
                    {label}
                  </button>
                ))}
              </div>
              <FieldError
                message={
                  errors.type?.message === 'Invalid option: expected one of "job"|"internship"|"freelance"'
                    ? "Please pick a type"
                    : errors.type?.message
                }
              />
            </div>

            {/* Title */}
            <div className="space-y-1.5 mb-4">
              <Label htmlFor="title" className="text-sm font-medium text-foreground">Job Title</Label>
              <Input
                {...register("title")}
                id="title"
                placeholder="e.g. Frontend Developer"
                className={`h-10 text-sm ${errors.title ? "border-rose-400" : "border-border/60"}`}
              />
              <FieldError message={errors.title?.message} />
            </div>

            {/* Company */}
            <div className="space-y-1.5">
              <Label htmlFor="company_name" className="text-sm font-medium text-foreground">
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground/60" />
                  Company Name
                </span>
              </Label>
              <Input
                {...register("company_name")}
                id="company_name"
                placeholder="e.g. Netsol Technologies"
                className={`h-10 text-sm ${errors.company_name ? "border-rose-400" : "border-border/60"}`}
              />
              <FieldError message={errors.company_name?.message} />
            </div>
          </CardContent>
        </Card>

        {/* ── Section 2: Location ──────────────────────────────────────── */}
        <Card className="border-border/60">
          <CardContent className="p-6">
            <SectionLabel icon={<MapPin className="h-3.5 w-3.5" />}>Location</SectionLabel>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="location" className="text-sm font-medium text-foreground">City</Label>
                <Input
                  {...register("location")}
                  id="location"
                  placeholder="e.g. Lahore"
                  className={`h-10 text-sm ${errors.location ? "border-rose-400" : "border-border/60"}`}
                />
                <FieldError message={errors.location?.message} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-foreground">Remote Work</Label>
                <div className="flex items-center gap-3 h-10">
                  <button
                    type="button"
                    onClick={() => setValue("is_remote", !isRemote, { shouldValidate: true })}
                    role="switch"
                    aria-checked={isRemote}
                    className={`relative w-11 h-6 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${isRemote ? "bg-blue-600" : "bg-muted border border-border/60"
                      }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${isRemote ? "translate-x-5" : "translate-x-0"
                      }`} />
                  </button>
                  <span className={`text-sm font-medium transition-colors ${isRemote ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`}>
                    <span className="flex items-center gap-1.5">
                      {isRemote && <Wifi className="h-3.5 w-3.5" />}
                      {isRemote ? "Remote" : "On-site"}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Section 3: Details ───────────────────────────────────────── */}
        <Card className="border-border/60">
          <CardContent className="p-6 space-y-5">
            <SectionLabel icon={<FileText className="h-3.5 w-3.5" />}>Details</SectionLabel>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-sm font-medium text-foreground">Description</Label>
              <textarea
                {...register("description")}
                id="description"
                rows={4}
                placeholder="Describe the role, responsibilities, and what the team does…"
                className={`w-full px-3.5 py-2.5 text-sm border rounded-xl outline-none resize-none transition-all bg-background text-foreground placeholder:text-muted-foreground/50
                  focus:ring-2 focus:ring-blue-500/15
                  ${errors.description ? "border-rose-400 focus:border-rose-400" : "border-border/60 focus:border-blue-500"}
                `}
              />
              <FieldError message={errors.description?.message} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="requirements" className="text-sm font-medium text-foreground">
                <span className="flex items-center gap-1.5">
                  <CheckSquare className="h-3.5 w-3.5 text-muted-foreground/60" />
                  Requirements
                </span>
              </Label>
              <textarea
                {...register("requirements")}
                id="requirements"
                rows={3}
                placeholder="List required qualifications, experience, and skills…"
                className={`w-full px-3.5 py-2.5 text-sm border rounded-xl outline-none resize-none transition-all bg-background text-foreground placeholder:text-muted-foreground/50
                  focus:ring-2 focus:ring-blue-500/15
                  ${errors.requirements ? "border-rose-400 focus:border-rose-400" : "border-border/60 focus:border-blue-500"}
                `}
              />
              <FieldError message={errors.requirements?.message} />
            </div>
          </CardContent>
        </Card>

        {/* ── Section 4: Skills ───────────────────────────────────────── */}
        <Card className="border-border/60">
          <CardContent className="p-6">
            <SectionLabel icon={<Tag className="h-3.5 w-3.5" />}>Required Skills</SectionLabel>

            <div className={`flex flex-wrap gap-2 p-4 border rounded-xl min-h-[56px] transition-all ${errors.required_skills ? "border-rose-400" : "border-border/60"
              }`}>
              {skills?.map((skill) => {
                const active = selectedSkills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`
                      flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full font-medium transition-all duration-150 border
                      ${active
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-muted/60 text-muted-foreground border-border/60 hover:border-border hover:text-foreground"
                      }
                    `}
                  >
                    {skill}
                    {active && <X className="h-2.5 w-2.5" />}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between mt-2">
              <FieldError message={errors.required_skills?.message as string} />
              {selectedSkills.length > 0 && (
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium ml-auto">
                  {selectedSkills.length} skill{selectedSkills.length !== 1 ? "s" : ""} selected
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Section 5: Apply + Deadline ──────────────────────────────── */}
        <Card className="border-border/60">
          <CardContent className="p-6 space-y-4">
            <SectionLabel icon={<LinkIcon className="h-3.5 w-3.5" />}>Application Details</SectionLabel>

            <div className="space-y-1.5">
              <Label htmlFor="apply_link" className="text-sm font-medium text-foreground">Apply Link</Label>
              <Input
                {...register("apply_link")}
                id="apply_link"
                type="url"
                placeholder="https://company.com/careers/role"
                className={`h-10 text-sm ${errors.apply_link ? "border-rose-400" : "border-border/60"}`}
              />
              <FieldError message={errors.apply_link?.message} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="deadline" className="text-sm font-medium text-foreground">
                <span className="flex items-center gap-1.5">
                  <CalendarClock className="h-3.5 w-3.5 text-muted-foreground/60" />
                  Application Deadline
                </span>
              </Label>
              <Input
                {...register("deadline")}
                id="deadline"
                type="date"
                min={new Date().toISOString().split("T")[0]}
                className={`h-10 text-sm ${errors.deadline ? "border-rose-400" : "border-border/60"}`}
              />
              <FieldError message={errors.deadline?.message} />
            </div>
          </CardContent>
        </Card>

        {/* ── Section 6: Media ─────────────────────────────────────────── */}
        <Card className="border-border/60">
          <CardContent className="p-6">
            <SectionLabel icon={<ImagePlus className="h-3.5 w-3.5" />}>
              Attachments{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </SectionLabel>

            <label className="flex flex-col items-center justify-center gap-2 w-full h-24 border-2 border-dashed border-border/60 rounded-xl cursor-pointer hover:border-blue-500/40 hover:bg-blue-50/30 dark:hover:bg-blue-950/10 transition-all duration-150 group">
              <ImagePlus className="h-5 w-5 text-muted-foreground/40 group-hover:text-blue-500/60 transition-colors" />
              <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                Click to upload images (max 5)
              </span>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  setValue("media" as any, files);
                }}
              />
            </label>
          </CardContent>
        </Card>

        {/* ── Submit row ───────────────────────────────────────────────── */}
        <div className="flex gap-3 pt-1">
          <Button
            type="submit"
            disabled={isSubmitting || mutation.isPending}
            className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm shadow-blue-600/20 gap-2"
          >
            {mutation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Posting…</>
            ) : "Post to Network"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-10 px-5 border-border/60 text-sm"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>

      </form>
    </div>
  );
}
