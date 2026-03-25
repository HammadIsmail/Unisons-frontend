"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyAlumniProfile, updateAlumniProfile, addSkill, deleteSkill, addWorkExperience, deleteWorkExperience } from "@/lib/api/alumni.api";
import { getMyStudentProfile, updateStudentProfile, addStudentSkill } from "@/lib/api/student.api";
import useAuthStore from "@/store/authStore";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateAlumniProfileSchema, updateStudentProfileSchema, addSkillSchema, UpdateAlumniProfileInput, UpdateStudentProfileInput, AddSkillInput } from "@/schemas/profile.schemas";
import { addWorkExperienceSchema, AddWorkExperienceInput } from "@/schemas/workExperience.schemas";
import { getAllSkills } from "@/lib/api/alumni.api";
import { uploadImage } from "@/lib/api/upload.api";
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

export default function MyProfilePage() {
    const { role, profile: authProfile, updateProfile } = useAuthStore();
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

    const { data: allSkills } = useQuery({
        queryKey: ["skills"],
        queryFn: getAllSkills,
        staleTime: Infinity,
    });

    // ── Profile update form ──
    const profileForm = useForm<any>({
        resolver: zodResolver(isAlumni ? updateAlumniProfileSchema : updateStudentProfileSchema),
        values: {
            bio: profile?.bio ?? "",
            phone: (profile as any)?.phone ?? "",
            ...(isAlumni && {
                linkedin_url: (profile as any)?.linkedin_url ?? "",
            }),
        },
    });

    // ── Skill form ──
    const skillForm = useForm<AddSkillInput>({
        resolver: zodResolver(addSkillSchema),
    });

    // ── Work experience form ──
    const workForm = useForm<AddWorkExperienceInput>({
        resolver: zodResolver(addWorkExperienceSchema),
        defaultValues: { is_current: false },
    });

    const isCurrentJob = workForm.watch("is_current");

    // ── Mutations ──
    const profileMutation = useMutation({
        mutationFn: async (data: any) => {
            const formData = new FormData();
            Object.entries(data).forEach(([k, v]) => {
                if (v !== undefined && v !== "") formData.append(k, String(v));
            });
            return isAlumni
                ? updateAlumniProfile(formData)
                : updateStudentProfile(formData);
        },
        onSuccess: () => {
            setEditMode(false);
            setSuccessMsg("Profile updated successfully.");
            queryClient.invalidateQueries({
                queryKey: isAlumni ? ["alumni", "me"] : ["student", "me"],
            });
        },
    });

    const skillMutation = useMutation({
        mutationFn: (data: any) =>
            isAlumni ? addSkill(data) : addStudentSkill(data),
        onSuccess: () => {
            setShowAddSkill(false);
            skillForm.reset();
            setSuccessMsg("Skill added.");
            queryClient.invalidateQueries({
                queryKey: isAlumni ? ["alumni", "me"] : ["student", "me"],
            });
        },
    });

    const deleteSkillMutation = useMutation({
        mutationFn: deleteSkill,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["alumni", "me"] });
        },
    });

    const workMutation = useMutation({
        mutationFn: addWorkExperience,
        onSuccess: () => {
            setShowAddWork(false);
            workForm.reset();
            setSuccessMsg("Work experience added.");
            queryClient.invalidateQueries({ queryKey: ["alumni", "me"] });
        },
    });

    const deleteWorkMutation = useMutation({
        mutationFn: deleteWorkExperience,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["alumni", "me"] });
        },
    });

    // ── Image upload ──
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingImage(true);
        try {
            const result = await uploadImage(file);
            const formData = new FormData();
            formData.append("profile_picture", result.url);
            if (isAlumni) {
                await updateAlumniProfile(formData);
            } else {
                await updateStudentProfile(formData);
            }
            setSuccessMsg("Profile picture updated.");
            queryClient.invalidateQueries({
                queryKey: isAlumni ? ["alumni", "me"] : ["student", "me"],
            });
        } catch {
            setSuccessMsg("");
        } finally {
            setUploadingImage(false);
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex gap-4 items-center">
                        <div className="w-20 h-20 rounded-full bg-gray-100" />
                        <div className="space-y-2 flex-1">
                            <div className="h-5 bg-gray-100 rounded w-1/3" />
                            <div className="h-4 bg-gray-100 rounded w-1/2" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-4">

            {successMsg && (
                <Alert className="border-green-200 bg-green-50">
                    <AlertDescription className="text-green-800">{successMsg}</AlertDescription>
                </Alert>
            )}

            {/* Profile Header Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">

                    {/* Avatar + Info */}
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            {(profile as any)?.profile_picture ? (
                                <img
                                    src={(profile as any).profile_picture}
                                    alt="Profile"
                                    className="w-20 h-20 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-bold text-2xl">
                                    {(profile as any)?.display_name?.charAt(0) ?? "U"}
                                </div>
                            )}
                            <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-50 shadow-sm">
                                <span className="text-xs">📷</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                    disabled={uploadingImage}
                                />
                            </label>
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">
                                {(profile as any)?.display_name}
                            </h1>
                            <p className="text-sm text-gray-400">
                                @{(profile as any)?.username}
                            </p>
                            {isAlumni && (
                                <p className="text-sm text-gray-500 mt-0.5">
                                    {(profile as any)?.current_role} · {(profile as any)?.current_company}
                                </p>
                            )}
                            <p className="text-xs text-gray-400 mt-0.5">
                                {profile?.degree} · {profile?.batch}
                                {isAlumni
                                    ? ` · Class of ${(profile as any)?.graduation_year}`
                                    : ` · Semester ${(profile as any)?.semester}`}
                            </p>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditMode(!editMode)}
                    >
                        {editMode ? "Cancel" : "Edit Profile"}
                    </Button>
                </div>

                {/* Edit Form */}
                {editMode && (
                    <form
                        onSubmit={profileForm.handleSubmit((data) => profileMutation.mutate(data))}
                        className="mt-5 pt-5 border-t border-gray-100 space-y-4"
                    >
                        <div className="space-y-1.5">
                            <Label htmlFor="bio">Bio</Label>
                            <textarea
                                {...profileForm.register("bio")}
                                id="bio"
                                rows={3}
                                placeholder="Tell the network about yourself..."
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-600 resize-none"
                            />
                            {profileForm.formState.errors.bio?.message && (
                                <p className="text-xs text-red-600">
                                    {profileForm.formState.errors.bio?.message as string}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                {...profileForm.register("phone")}
                                id="phone"
                                placeholder="+92-300-1234567"
                            />
                        </div>

                        {isAlumni && (
                            <div className="space-y-1.5">
                                <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                                <Input
                                    {...(profileForm.register as any)("linkedin_url")}
                                    id="linkedin_url"
                                    placeholder="https://linkedin.com/in/yourname"
                                />
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={profileMutation.isPending}
                            className="bg-green-800 hover:bg-green-900"
                        >
                            {profileMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                    </form>
                )}

                {/* Read-only bio */}
                {!editMode && profile?.bio && (
                    <p className="mt-4 text-sm text-gray-600 leading-relaxed">
                        {profile.bio}
                    </p>
                )}

                {/* Contact info */}
                {!editMode && (
                    <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-400">
                        {profile?.phone && <span>📞 {profile.phone}</span>}
                        {isAlumni && (profile as any)?.linkedin_url && (

                            <a href={(profile as any).linkedin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800"
                            >
                                LinkedIn ↗
                            </a>
                        )}
                        {isAlumni && (
                            <span>🔗 {(profile as any)?.connections_count ?? 0} connections</span>
                        )}
                    </div>
                )}
            </div>

            {/* Skills Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-gray-900">Skills</h2>
                    <button
                        onClick={() => setShowAddSkill(!showAddSkill)}
                        className="text-xs text-green-700 hover:text-green-800 font-medium"
                    >
                        {showAddSkill ? "Cancel" : "+ Add Skill"}
                    </button>
                </div>

                {/* Add skill form */}
                {showAddSkill && (
                    <form
                        onSubmit={skillForm.handleSubmit((data) => skillMutation.mutate(data))}
                        className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3"
                    >
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs">Skill Name</Label>
                                <Select
                                    onValueChange={(val) =>
                                        skillForm.setValue("skill_name", val, { shouldValidate: true })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select skill" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allSkills?.map((s) => (
                                            <SelectItem key={s} value={s}>{s}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {skillForm.formState.errors.skill_name && (
                                    <p className="text-xs text-red-600">
                                        {skillForm.formState.errors.skill_name.message}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Category</Label>
                                <Input
                                    {...skillForm.register("category")}
                                    placeholder="e.g. Programming"
                                    className="h-9 text-sm"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Proficiency</Label>
                            <Select
                                onValueChange={(val) =>
                                    skillForm.setValue("proficiency_level", val as any, { shouldValidate: true })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select level" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="beginner">Beginner</SelectItem>
                                    <SelectItem value="intermediate">Intermediate</SelectItem>
                                    <SelectItem value="expert">Expert</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={skillMutation.isPending}
                            className="bg-green-800 hover:bg-green-900"
                        >
                            {skillMutation.isPending ? "Adding..." : "Add Skill"}
                        </Button>
                    </form>
                )}

                {/* Skills display */}
                {(profile as any)?.detailed_skills?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {(profile as any).detailed_skills.map((s: any) => (
                            <div
                                key={s.id}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full group"
                            >
                                <span className="text-xs font-medium text-gray-700">
                                    {s.skill_name}
                                </span>
                                <span className={`text-xs ${s.proficiency_level === "expert"
                                        ? "text-green-600"
                                        : s.proficiency_level === "intermediate"
                                            ? "text-blue-600"
                                            : "text-gray-400"
                                    }`}>
                                    · {s.proficiency_level}
                                </span>
                                {isAlumni && (
                                    <button
                                        onClick={() => deleteSkillMutation.mutate(s.id)}
                                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-xs ml-1 transition"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                ) : profile?.skills?.length ? (
                    <div className="flex flex-wrap gap-2">
                        {profile.skills.map((s: string) => (
                            <span
                                key={s}
                                className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full font-medium"
                            >
                                {s}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-400">No skills added yet.</p>
                )}
            </div>

            {/* Work Experience — alumni only */}
            {isAlumni && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-gray-900">Work Experience</h2>
                        <button
                            onClick={() => setShowAddWork(!showAddWork)}
                            className="text-xs text-green-700 hover:text-green-800 font-medium"
                        >
                            {showAddWork ? "Cancel" : "+ Add"}
                        </button>
                    </div>

                    {/* Add work form */}
                    {showAddWork && (
                        <form
                            onSubmit={workForm.handleSubmit((data) => workMutation.mutate(data))}
                            className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3"
                        >
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs">Company</Label>
                                    <Input
                                        {...workForm.register("company_name")}
                                        placeholder="Company name"
                                        className="h-9 text-sm"
                                    />
                                    {workForm.formState.errors.company_name && (
                                        <p className="text-xs text-red-600">
                                            {workForm.formState.errors.company_name.message}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Role</Label>
                                    <Input
                                        {...workForm.register("role")}
                                        placeholder="Job title"
                                        className="h-9 text-sm"
                                    />
                                    {workForm.formState.errors.role && (
                                        <p className="text-xs text-red-600">
                                            {workForm.formState.errors.role.message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs">Start Date</Label>
                                    <Input
                                        {...workForm.register("start_date")}
                                        type="date"
                                        className="h-9 text-sm"
                                    />
                                </div>
                                {!isCurrentJob && (
                                    <div className="space-y-1">
                                        <Label className="text-xs">End Date</Label>
                                        <Input
                                            {...workForm.register("end_date")}
                                            type="date"
                                            className="h-9 text-sm"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs">Employment Type</Label>
                                <Select
                                    onValueChange={(val) =>
                                        workForm.setValue("employment_type", val as any, { shouldValidate: true })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="full-time">Full-time</SelectItem>
                                        <SelectItem value="part-time">Part-time</SelectItem>
                                        <SelectItem value="freelance">Freelance</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                                <input
                                    type="checkbox"
                                    {...workForm.register("is_current")}
                                    className="rounded"
                                />
                                I currently work here
                            </label>

                            <Button
                                type="submit"
                                size="sm"
                                disabled={workMutation.isPending}
                                className="bg-green-800 hover:bg-green-900"
                            >
                                {workMutation.isPending ? "Adding..." : "Add Experience"}
                            </Button>
                        </form>
                    )}

                    {/* Work experience list */}
                    {(profile as any)?.work_experiences?.length > 0 ? (
                        <div className="space-y-3">
                            {(profile as any).work_experiences.map((w: any) => (
                                <div
                                    key={w.id}
                                    className="flex items-start justify-between gap-3 p-3 border border-gray-100 rounded-lg"
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium text-gray-900">{w.role}</p>
                                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                                                {w.employment_type}
                                            </span>
                                            {w.is_current && (
                                                <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded-full">
                                                    Current
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600">{w.company_name}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {w.start_date?.split("T")[0]} —{" "}
                                            {w.is_current ? "Present" : w.end_date?.split("T")[0]}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => deleteWorkMutation.mutate(w.id)}
                                        disabled={deleteWorkMutation.isPending}
                                        className="text-xs text-red-400 hover:text-red-600 flex-shrink-0"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400">No work experience added yet.</p>
                    )}
                </div>
            )}

        </div>
    );
}