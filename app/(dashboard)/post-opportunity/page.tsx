"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postOpportunitySchema, PostOpportunityInput } from "@/schemas/opportunity.schemas";
import { postOpportunity } from "@/lib/api/opportunities.api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

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
    <p className="text-xs text-rose-600 flex items-center gap-1 mt-1">
      <AlertCircle className="h-3 w-3 flex-shrink-0" />
      {message}
    </p>
  );
}

function SectionLabel({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100">
        {icon}
      </div>
      <div>
        <h2 className="text-base font-semibold text-slate-900 leading-tight">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

const TYPES = [
  { value: "job", label: "Job", icon: <Briefcase className="h-4 w-4" /> },
  { value: "internship", label: "Internship", icon: <GraduationCap className="h-4 w-4" /> },
  { value: "freelance", label: "Freelance", icon: <Zap className="h-4 w-4" /> },
] as const;

const inputCls =
  "h-11 text-sm border-slate-200 bg-white focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:border-blue-500";

export default function PostOpportunityPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [serverError, setServerError] = useState("");

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

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    if (selectedSkills.includes(trimmed)) {
      setSkillInput("");
      return;
    }
    const updated = [...selectedSkills, trimmed];
    setSelectedSkills(updated);
    setValue("required_skills", updated, { shouldValidate: true });
    setSkillInput("");
  };

  const removeSkill = (skill: string) => {
    const updated = selectedSkills.filter((s) => s !== skill);
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
    mutation.mutate({
      ...data,
      media: selectedFiles.length > 0 ? selectedFiles : undefined,
    });
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Header */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-6 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back
        </button>

        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium ring-1 ring-blue-100 mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            New listing
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Post Opportunity</h1>
          <p className="text-slate-500 mt-2 text-[15px] leading-relaxed max-w-xl">
            Broadcast a job, internship, or freelance opportunity to the network. Quality roles get
            quality applicants.
          </p>
        </div>

        {/* Server error */}
        {serverError && (
          <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-rose-50 border border-rose-200 mb-5">
            <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-rose-700">{serverError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Section 1 — Basics */}
          <Card className="border-slate-200/70 shadow-sm shadow-slate-200/40">
            <CardContent className="p-7 space-y-6">
              <SectionLabel
                icon={<FileText className="h-4 w-4" />}
                title="Basic Info"
                subtitle="What kind of opportunity is this?"
              />

              <div className="space-y-2">
  <Label className="text-sm font-medium text-slate-700">
    Opportunity Type
  </Label>

  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
    {TYPES.map(({ value, label, icon }) => {
      const active = selectedType === value;

      return (
        <button
          key={value}
          type="button"
          onClick={() =>
            setValue("type", value, { shouldValidate: true })
          }
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-semibold transition-all duration-150 w-full ${
            active
              ? "border-blue-600 bg-white text-blue-600 shadow-md shadow-blue-600/20"
              : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50/40"
          }`}
        >
          {icon}
          <span className="truncate">{label}</span>
        </button>
      );
    })}
  </div>

  <FieldError
    message={
      errors.type?.message ===
      'Invalid option: expected one of "job"|"internship"|"freelance"'
        ? "Please pick a type"
        : errors.type?.message
    }
  />
</div>

              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium text-slate-700">
                  Job Title
                </Label>
                <Input
                  {...register("title")}
                  id="title"
                  placeholder="Senior Frontend Engineer"
                  className={`${inputCls} ${errors.title ? "border-rose-400" : ""}`}
                />
                <FieldError message={errors.title?.message} />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="company_name"
                  className="text-sm font-medium text-slate-700 flex items-center gap-1.5"
                >
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  Company Name
                </Label>
                <Input
                  {...register("company_name")}
                  id="company_name"
                  placeholder="Acme Inc."
                  className={`${inputCls} ${errors.company_name ? "border-rose-400" : ""}`}
                />
                <FieldError message={errors.company_name?.message} />
              </div>
            </CardContent>
          </Card>

          {/* Section 2 — Location */}
          <Card className="border-slate-200/70 shadow-sm shadow-slate-200/40">
            <CardContent className="p-7 space-y-6">
              <SectionLabel
                icon={<MapPin className="h-4 w-4" />}
                title="Location"
                subtitle="Where will this role be based?"
              />

              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-medium text-slate-700">
                    City
                  </Label>
                  <Input
                    {...register("location")}
                    id="location"
                    placeholder="San Francisco"
                    className={`${inputCls} ${errors.location ? "border-rose-400" : ""}`}
                  />
                  <FieldError message={errors.location?.message} />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Remote Work</Label>
                  <div className="flex items-center gap-3 h-11 px-4 rounded-md border border-slate-200 bg-white">
                    <button
                      type="button"
                      onClick={() => setValue("is_remote", !isRemote, { shouldValidate: true })}
                      role="switch"
                      aria-checked={isRemote}
                      className={`relative w-11 h-6 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                        isRemote ? "bg-blue-600" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                          isRemote ? "translate-x-5" : ""
                        }`}
                      />
                    </button>
                    <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                      {isRemote && <Wifi className="h-3.5 w-3.5 text-blue-600" />}
                      {isRemote ? "Remote" : "On-site"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3 — Details */}
          <Card className="border-slate-200/70 shadow-sm shadow-slate-200/40">
            <CardContent className="p-7 space-y-6">
              <SectionLabel
                icon={<FileText className="h-4 w-4" />}
                title="Details"
                subtitle="Describe the role and what's expected."
              />

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-slate-700">
                  Description
                </Label>
                <Textarea
                  {...register("description")}
                  id="description"
                  rows={5}
                  placeholder="We're looking for a passionate engineer to join our growing team…"
                  className={`text-sm border-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:border-blue-500 resize-none ${
                    errors.description ? "border-rose-400" : ""
                  }`}
                />
                <FieldError message={errors.description?.message} />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="requirements"
                  className="text-sm font-medium text-slate-700 flex items-center gap-1.5"
                >
                  <CheckSquare className="h-3.5 w-3.5 text-slate-400" />
                  Requirements
                </Label>
                <Textarea
                  {...register("requirements")}
                  id="requirements"
                  rows={4}
                  placeholder="• 3+ years experience&#10;• Strong portfolio&#10;• Team player"
                  className={`text-sm border-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:border-blue-500 resize-none ${
                    errors.requirements ? "border-rose-400" : ""
                  }`}
                />
                <FieldError message={errors.requirements?.message} />
              </div>
            </CardContent>
          </Card>

          {/* Section 4 — Skills */}
          <Card className="border-slate-200/70 shadow-sm shadow-slate-200/40">
            <CardContent className="p-7">
              <SectionLabel
                icon={<Tag className="h-4 w-4" />}
                title="Required Skills"
                subtitle="Add the tools and skills candidates should have."
              />

              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                    placeholder="Type a skill and press Enter"
                    className={`flex-1 ${inputCls} ${errors.required_skills ? "border-rose-400" : ""}`}
                  />
                  <Button
                    type="button"
                    onClick={addSkill}
                    className="h-11 px-6 bg-white !text-blue-600 border !border-blue-600 !shadow-md cursor-pointer hover:scale-104 font-normal"
                  >
                    Add
                  </Button>
                </div>
                <FieldError message={errors.required_skills?.message as string} />

                <div className="flex flex-wrap gap-2 min-h-[40px] items-center">
                  {selectedSkills.map((skill) => (
                    <div
                      key={skill}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="hover:bg-blue-100 rounded-full p-0.5 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {selectedSkills.length === 0 && (
                    <span className="text-sm text-slate-400">No skills added yet</span>
                  )}
                </div>

                {selectedSkills.length > 0 && (
                  <p className="text-xs text-blue-600 font-medium text-right">
                    {selectedSkills.length} skill{selectedSkills.length !== 1 ? "s" : ""} added
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Section 5 — Apply + Deadline */}
          <Card className="border-slate-200/70 shadow-sm shadow-slate-200/40">
            <CardContent className="p-7 space-y-6">
              <SectionLabel
                icon={<LinkIcon className="h-4 w-4" />}
                title="Application Details"
                subtitle="How and when should candidates apply?"
              />

              <div className="space-y-2">
                <Label htmlFor="apply_link" className="text-sm font-medium text-slate-700">
                  Apply Link
                </Label>
                <Input
                  {...register("apply_link")}
                  id="apply_link"
                  type="url"
                  placeholder="https://company.com/careers/role"
                  className={`${inputCls} ${errors.apply_link ? "border-rose-400" : ""}`}
                />
                <FieldError message={errors.apply_link?.message} />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="deadline"
                  className="text-sm font-medium text-slate-700 flex items-center gap-1.5"
                >
                  <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
                  Application Deadline
                </Label>
                <Input
                  {...register("deadline")}
                  id="deadline"
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  className={`${inputCls} ${errors.deadline ? "border-rose-400" : ""}`}
                />
                <FieldError message={errors.deadline?.message} />
              </div>
            </CardContent>
          </Card>

          {/* Section 6 — Media */}
          <Card className="border-slate-200/70 shadow-sm shadow-slate-200/40">
            <CardContent className="p-7">
              <SectionLabel
                icon={<ImagePlus className="h-4 w-4" />}
                title="Attachments"
                subtitle="Optional — add up to 5 images."
              />

              <label className="flex flex-col items-center justify-center gap-2 w-full h-32 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 transition-all duration-150 group">
                <div className="h-10 w-10 rounded-full bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                  <ImagePlus className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                  <span className="text-blue-600 font-medium">Click to upload</span>
                </span>
                <span className="text-xs text-slate-400">PNG, JPG up to 5MB · max 5 files</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    setSelectedFiles([...selectedFiles, ...files].slice(0, 5));
                    e.target.value = "";
                  }}
                />
              </label>

              {selectedFiles.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                  {selectedFiles.map((file, i) => (
                    <div
                      key={i}
                      className="relative flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                    >
                      <ImagePlus className="h-4 w-4 text-blue-600 shrink-0" />
                      <span className="text-xs truncate font-medium flex-1 text-slate-700">
                        {file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedFiles(selectedFiles.filter((_, idx) => idx !== i))
                        }
                        className="text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-3 pt-2 pb-10">
            <Button
              type="submit"
              disabled={isSubmitting || mutation.isPending}
              className="flex-1 h-12 bg-white !text-blue-600 border !border-blue-600  text-sm shadow-md hover:scale-104 cursor-pointer shadow-blue-600/25 gap-2"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Posting…
                </>
              ) : (
                "Post to Network"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-12 px-6 border-slate-200 text-slate-700 hover:bg-slate-50 text-sm"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
