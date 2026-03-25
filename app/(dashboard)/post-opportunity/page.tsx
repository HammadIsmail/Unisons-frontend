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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
      setServerError(
        error.response?.data?.message || "Failed to post. Try again."
      );
    },
  });

  const onSubmit = (data: PostOpportunityInput) => {
    setServerError("");
    mutation.mutate(data);
  };

  return (
    <div className="max-w-2xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Post Opportunity</h1>
        <p className="text-sm text-gray-500 mt-1">
          Broadcast a job, internship, or freelance opportunity to the network
        </p>
      </div>

      {serverError && (
        <Alert variant="destructive" className="mb-5">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* Type */}
        <div className="space-y-1.5">
          <Label>Opportunity Type</Label>
          <div className="grid grid-cols-3 gap-3">
            {(["job", "internship", "freelance"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setValue("type", t, { shouldValidate: true })}
                className={`py-2.5 px-4 rounded-lg border text-sm font-medium capitalize transition ${
                  selectedType === t
                    ? "border-green-700 bg-green-50 text-green-800"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          {errors.type && (
            <p className="text-xs text-red-600">{errors.type.message}</p>
          )}
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <Label htmlFor="title">Job Title</Label>
          <Input
            {...register("title")}
            id="title"
            placeholder="e.g. Frontend Developer"
          />
          {errors.title && (
            <p className="text-xs text-red-600">{errors.title.message}</p>
          )}
        </div>

        {/* Company */}
        <div className="space-y-1.5">
          <Label htmlFor="company_name">Company Name</Label>
          <Input
            {...register("company_name")}
            id="company_name"
            placeholder="e.g. Netsol Technologies"
          />
          {errors.company_name && (
            <p className="text-xs text-red-600">{errors.company_name.message}</p>
          )}
        </div>

        {/* Location + Remote */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="location">Location</Label>
            <Input
              {...register("location")}
              id="location"
              placeholder="e.g. Lahore"
            />
            {errors.location && (
              <p className="text-xs text-red-600">{errors.location.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Remote?</Label>
            <div className="flex items-center gap-3 h-10">
              <button
                type="button"
                onClick={() => setValue("is_remote", !isRemote, { shouldValidate: true })}
                className={`relative w-11 h-6 rounded-full transition ${
                  isRemote ? "bg-green-700" : "bg-gray-200"
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  isRemote ? "translate-x-5" : "translate-x-0"
                }`} />
              </button>
              <span className="text-sm text-gray-600">
                {isRemote ? "Yes" : "No"}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <textarea
            {...register("description")}
            id="description"
            rows={4}
            placeholder="Describe the role, responsibilities, and what the team does..."
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition resize-none"
          />
          {errors.description && (
            <p className="text-xs text-red-600">{errors.description.message}</p>
          )}
        </div>

        {/* Requirements */}
        <div className="space-y-1.5">
          <Label htmlFor="requirements">Requirements</Label>
          <textarea
            {...register("requirements")}
            id="requirements"
            rows={3}
            placeholder="List required qualifications, experience, and skills..."
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition resize-none"
          />
          {errors.requirements && (
            <p className="text-xs text-red-600">{errors.requirements.message}</p>
          )}
        </div>

        {/* Required Skills */}
        <div className="space-y-1.5">
          <Label>Required Skills</Label>
          <p className="text-xs text-gray-400">Select at least one skill</p>
          <div className="flex flex-wrap gap-2 p-3 border border-gray-200 rounded-lg min-h-12">
            {skills?.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => toggleSkill(skill)}
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition ${
                  selectedSkills.includes(skill)
                    ? "bg-green-800 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
          {selectedSkills.length > 0 && (
            <p className="text-xs text-green-700">
              {selectedSkills.length} skill{selectedSkills.length > 1 ? "s" : ""} selected
            </p>
          )}
          {errors.required_skills && (
            <p className="text-xs text-red-600">{errors.required_skills.message}</p>
          )}
        </div>

        {/* Apply Link */}
        <div className="space-y-1.5">
          <Label htmlFor="apply_link">Apply Link</Label>
          <Input
            {...register("apply_link")}
            id="apply_link"
            type="url"
            placeholder="https://company.com/careers/role"
          />
          {errors.apply_link && (
            <p className="text-xs text-red-600">{errors.apply_link.message}</p>
          )}
        </div>

        {/* Deadline */}
        <div className="space-y-1.5">
          <Label htmlFor="deadline">Application Deadline</Label>
          <Input
            {...register("deadline")}
            id="deadline"
            type="date"
            min={new Date().toISOString().split("T")[0]}
          />
          {errors.deadline && (
            <p className="text-xs text-red-600">{errors.deadline.message}</p>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            disabled={isSubmitting || mutation.isPending}
            className="bg-green-800 hover:bg-green-900 flex-1"
          >
            {mutation.isPending ? "Posting..." : "Post to Network"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>

      </form>
    </div>
  );
}