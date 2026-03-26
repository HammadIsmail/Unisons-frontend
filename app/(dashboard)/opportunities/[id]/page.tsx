"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOpportunityById, deleteOpportunity } from "@/lib/api/opportunities.api";
import useAuthStore from "@/store/authStore";
import { useRouter, useParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { getInitials } from "@/lib/utils";

export default function OpportunityDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { profile, role } = useAuthStore();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const { data: opp, isLoading } = useQuery({
        queryKey: ["opportunity", id],
        queryFn: () => getOpportunityById(id),
    });

    const deleteMutation = useMutation({
        mutationFn: () => deleteOpportunity(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["opportunities"] });
            router.push("/opportunities");
        },
    });

    const isOwner =
        role === "admin" ||
        (opp?.posted_by?.id && opp.posted_by.id === profile?.id);

    const isExpired = opp?.deadline
        ? new Date(opp.deadline) < new Date()
        : false;

    if (isLoading) {
        return (
            <div className="max-w-3xl mx-auto animate-pulse space-y-4">
                <div className="h-8 bg-gray-100 rounded w-2/3" />
                <div className="h-4 bg-gray-100 rounded w-1/3" />
                <div className="h-40 bg-gray-100 rounded" />
            </div>
        );
    }

    if (!opp) {
        return (
            <div className="max-w-3xl mx-auto text-center py-20">
                <p className="text-gray-400">Opportunity not found.</p>
                <Link href="/opportunities" className="text-green-700 text-sm mt-2 block">
                    ← Back to opportunities
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">

            {/* Back */}
            <Link
                href="/opportunities"
                className="text-sm text-gray-400 hover:text-gray-600 mb-6 block"
            >
                ← Back to opportunities
            </Link>

            {/* Header Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${opp.type === "job"
                                ? "bg-blue-50 text-blue-700"
                                : opp.type === "internship"
                                    ? "bg-green-50 text-green-700"
                                    : "bg-amber-50 text-amber-700"
                                }`}>
                                {opp.type}
                            </span>
                            {opp.is_remote && (
                                <span className="text-xs px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 font-medium">
                                    Remote
                                </span>
                            )}
                            {isExpired && (
                                <span className="text-xs px-2.5 py-1 rounded-full bg-red-50 text-red-600 font-medium">
                                    Expired
                                </span>
                            )}
                        </div>
                        <h1 className="text-2xl font-semibold text-gray-900">{opp.title}</h1>
                        <p className="text-gray-500 mt-1">
                            {opp.company?.name} · {opp.location}
                        </p>
                    </div>

                    {/* Apply Button */}
                    {!isExpired && (

                        <a href={opp.apply_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-5 py-2.5 bg-green-800 hover:bg-green-900 text-white text-sm font-medium rounded-lg transition flex-shrink-0"
                        >
                            Apply Now ↗
                        </a>
                    )}
                </div>

                {/* Deadline */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-6 text-sm text-gray-500 flex-wrap">
                    <span>
                        📅 Deadline:{" "}
                        <span className={isExpired ? "text-red-500 font-medium" : "text-gray-700 font-medium"}>
                            {new Date(opp.deadline).toLocaleDateString("en-PK", {
                                year: "numeric", month: "long", day: "numeric",
                            })}
                        </span>
                    </span>
                    {opp.company?.website && (

                        <a href={`https://${opp.company.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-700 hover:text-green-800"
                        >
                            🌐 {opp.company.website}
                        </a>
                    )}
                </div>
            </div >

            {/* Description */}
            < div className="bg-white rounded-xl border border-gray-200 p-6 mb-4" >
                <h2 className="font-semibold text-gray-900 mb-3">About this role</h2>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {opp.description}
                </p>
            </div >

            {/* Requirements */}
            < div className="bg-white rounded-xl border border-gray-200 p-6 mb-4" >
                <h2 className="font-semibold text-gray-900 mb-3">Requirements</h2>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {opp.requirements}
                </p>
            </div >

            {/* Required Skills */}
            < div className="bg-white rounded-xl border border-gray-200 p-6 mb-4" >
                <h2 className="font-semibold text-gray-900 mb-3">Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                    {opp.required_skills?.map((skill) => (
                        <span
                            key={skill}
                            className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full font-medium"
                        >
                            {skill}
                        </span>
                    ))}
                </div>
            </div >

            {/* Posted By */}
            < div className="bg-white rounded-xl border border-gray-200 p-6 mb-4" >
                <h2 className="font-semibold text-gray-900 mb-3">Posted by</h2>
                <Link
                    href={`/alumni/${opp.posted_by?.username}`}
                    className="flex items-center gap-3 hover:opacity-80 transition"
                >
                    <Avatar className="w-8 h-8">
                        <AvatarImage src={opp.posted_by?.profile_picture} />
                        <AvatarFallback className="bg-green-100 text-green-800 text-xs font-semibold">
                            {opp.posted_by?.display_name ? getInitials(opp.posted_by.display_name) : "U"}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="text-sm font-medium text-gray-900">
                            {opp.posted_by?.display_name}
                        </p>
                        <p className="text-xs text-gray-500">@{opp.posted_by?.username}</p>
                        <p className="text-xs text-gray-500">{opp.posted_by?.role}</p>
                    </div>
                </Link>
            </div >

            {/* Owner Actions */}
            {
                isOwner && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="font-semibold text-gray-900 mb-3">Manage</h2>
                        <div className="flex gap-3">
                            <Link
                                href={`/my-opportunities`}
                                className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition text-gray-700"
                            >
                                Edit in My Posts
                            </Link>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setShowDeleteConfirm(true)}
                            >
                                Delete
                            </Button>
                        </div>

                        {showDeleteConfirm && (
                            <Alert variant="destructive" className="mt-4">
                                <AlertDescription>
                                    <p className="mb-3">
                                        Are you sure? This cannot be undone.
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => deleteMutation.mutate()}
                                            disabled={deleteMutation.isPending}
                                        >
                                            {deleteMutation.isPending ? "Deleting..." : "Yes, delete"}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowDeleteConfirm(false)}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                )
            }

        </div >
    );
}