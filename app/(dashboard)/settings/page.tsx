"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyAlumniProfile, updateAlumniProfile } from "@/lib/api/alumni.api";
import { getMyStudentProfile, updateStudentProfile } from "@/lib/api/student.api";
import { uploadImage } from "@/lib/api/upload.api";
import useAuthStore from "@/store/authStore";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useEffect } from "react";

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

    useEffect(() => {
        if (profile) {
            setBio((profile as any)?.bio ?? "");
            setPhone((profile as any)?.phone ?? "");
            setLinkedinUrl((profile as any)?.linkedin_url ?? "");
        }
    }, [profile]);

    const updateMutation = useMutation({
        mutationFn: async () => {
            const formData = new FormData();
            if (bio) formData.append("bio", bio);
            if (phone) formData.append("phone", phone);
            if (isAlumni && linkedinUrl) formData.append("linkedin_url", linkedinUrl);
            return isAlumni
                ? updateAlumniProfile(formData)
                : updateStudentProfile(formData);
        },
        onSuccess: () => {
            setSuccessMsg("Settings saved successfully.");
            queryClient.invalidateQueries({
                queryKey: isAlumni ? ["alumni", "me"] : ["student", "me"],
            });
        },
    });

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
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
            setUploading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-xl mx-auto animate-pulse space-y-4">
                <div className="h-8 bg-gray-100 rounded w-1/3" />
                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-10 bg-gray-100 rounded" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto">

            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Manage your account information
                </p>
            </div>

            {successMsg && (
                <Alert className="mb-4 border-green-200 bg-green-50">
                    <AlertDescription className="text-green-800">{successMsg}</AlertDescription>
                </Alert>
            )}

            {/* Avatar */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
                <h2 className="font-semibold text-gray-900 mb-4">Profile Picture</h2>
                <div className="flex items-center gap-4">
                    {(profile as any)?.profile_picture ? (
                        <img
                            src={(profile as any).profile_picture}
                            alt="Profile"
                            className="w-16 h-16 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-bold text-xl">
                            {(profile as any)?.display_name?.charAt(0) ?? "U"}
                        </div>
                    )}
                    <div>
                        <label className="cursor-pointer px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition inline-block">
                            {uploading ? "Uploading..." : "Change Photo"}
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                                disabled={uploading}
                            />
                        </label>
                        <p className="text-xs text-gray-400 mt-1">Max 5MB. JPG, PNG.</p>
                    </div>
                </div>
            </div>

            {/* Profile Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Profile Information</h2>
                <div className="space-y-4">

                    {/* Read-only fields */}
                    <div className="space-y-1.5">
                        <Label className="text-xs text-gray-500">Display Name</Label>
                        <Input
                            value={(profile as any)?.display_name ?? ""}
                            readOnly
                            className="bg-gray-50 text-gray-500 cursor-not-allowed"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs text-gray-500">Username</Label>
                        <Input
                            value={`@${(profile as any)?.username ?? ""}`}
                            readOnly
                            className="bg-gray-50 text-gray-500 cursor-not-allowed"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs text-gray-500">Email</Label>
                        <Input
                            value={(profile as any)?.email ?? ""}
                            readOnly
                            className="bg-gray-50 text-gray-500 cursor-not-allowed"
                        />
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                        <p className="text-xs text-gray-400 mb-3">Editable fields</p>
                    </div>

                    {/* Editable fields */}
                    <div className="space-y-1.5">
                        <Label htmlFor="bio">Bio</Label>
                        <textarea
                            id="bio"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            rows={3}
                            maxLength={300}
                            placeholder="Tell the network about yourself..."
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-600 resize-none"
                        />
                        <p className="text-xs text-gray-400 text-right">{bio.length}/300</p>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                            id="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+92-300-1234567"
                        />
                    </div>

                    {isAlumni && (
                        <div className="space-y-1.5">
                            <Label htmlFor="linkedin">LinkedIn URL</Label>
                            <Input
                                id="linkedin"
                                value={linkedinUrl}
                                onChange={(e) => setLinkedinUrl(e.target.value)}
                                placeholder="https://linkedin.com/in/yourname"
                            />
                        </div>
                    )}

                    <Button
                        onClick={() => updateMutation.mutate()}
                        disabled={updateMutation.isPending}
                        className="w-full bg-green-800 hover:bg-green-900"
                    >
                        {updateMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>

        </div>
    );
}