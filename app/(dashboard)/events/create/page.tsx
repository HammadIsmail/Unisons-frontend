"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createEventSchema, CreateEventInput } from "@/schemas/event.schemas";
import { createEvent } from "@/lib/api/events.api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import dynamic from "next/dynamic";

import {
  Users,
  Video,
  Network,
  GraduationCap,
  Handshake,
  CalendarClock,
  MapPin,
  Wifi,
  ImagePlus,
  Loader2,
  AlertCircle,
  X,
  ArrowLeft,
  FileText,
  Hash,
} from "lucide-react";

// Dynamically import Tiptap to avoid SSR issues
const TiptapEditor = dynamic(() => import("@/components/features/TiptapEditor"), {
  ssr: false,
  loading: () => (
    <div className="h-40 rounded-xl border border-slate-200 bg-slate-50 animate-pulse" />
  ),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── Constants ─────────────────────────────────────────────────────────────────

const EVENT_TYPES = [
  { value: "reunion", label: "Reunion", icon: <Users className="h-4 w-4" /> },
  { value: "webinar", label: "Webinar", icon: <Video className="h-4 w-4" /> },
  { value: "workshop", label: "Workshop", icon: <GraduationCap className="h-4 w-4" /> },
  { value: "networking", label: "Networking", icon: <Network className="h-4 w-4" /> },
  { value: "other", label: "Other", icon: <Handshake className="h-4 w-4" /> },
] as const;

const inputCls =
  "h-11 text-sm border-slate-200 bg-white focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:border-blue-500";

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CreateEventPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateEventInput>({
    resolver: zodResolver(createEventSchema),
    defaultValues: { is_online: false },
  });

  const selectedType = watch("type");
  const isOnline = watch("is_online");

  const mutation = useMutation({
    mutationFn: createEvent,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      router.push(`/events/${res.eventId}`);
    },
    onError: (err: any) => {
      setServerError(err.response?.data?.message || "Failed to create event. Try again.");
    },
  });

  const onSubmit = (data: CreateEventInput) => {
    setServerError("");
    mutation.mutate({
      ...data,
      meeting_link: data.meeting_link || undefined,
      location: data.location || undefined,
      banner: bannerFile ?? undefined,
    });
  };

  const handleBanner = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-6 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back
        </button>

        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium ring-1 ring-blue-100 mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            New Event
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Create Event</h1>
          <p className="text-slate-500 mt-2 text-[15px] leading-relaxed max-w-xl">
            Host a reunion, webinar, workshop, or networking session for the alumni community.
          </p>
        </div>

        {serverError && (
          <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-rose-50 border border-rose-200 mb-5">
            <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-rose-700">{serverError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Section 1 — Event Type */}
          <Card className="border-slate-200/70 shadow-sm shadow-slate-200/40">
            <CardContent className="p-7 space-y-6">
              <SectionLabel
                icon={<Hash className="h-4 w-4" />}
                title="Event Type"
                subtitle="What kind of event is this?"
              />
              <div className="space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {EVENT_TYPES.map(({ value, label, icon }) => {
                    const active = selectedType === value;
                    return (
                      <button
                        key={value}
                        id={label}
                        type="button"
                        onClick={() => setValue("type", value, { shouldValidate: true })}
                        className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-semibold transition-all duration-150 w-full ${active
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
                <FieldError message={errors.type?.message} />
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium text-slate-700">
                  Event Title
                </Label>
                <Input
                  {...register("title")}
                  id="title"
                  placeholder="Alumni Grand Reunion 2025"
                  className={`${inputCls} ${errors.title ? "border-rose-400" : ""}`}
                />
                <FieldError message={errors.title?.message} />
              </div>
            </CardContent>
          </Card>

          {/* Section 2 — Description */}
          <Card className="border-slate-200/70 shadow-sm shadow-slate-200/40">
            <CardContent className="p-7 space-y-4">
              <SectionLabel
                icon={<FileText className="h-4 w-4" />}
                title="Description"
                subtitle="Tell attendees what to expect. Rich text is supported."
              />
              <div className="space-y-2">
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TiptapEditor
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="Describe the event, agenda, what to bring…"
                      hasError={!!errors.description}
                    />
                  )}
                />
                <FieldError message={errors.description?.message} />
              </div>
            </CardContent>
          </Card>

          {/* Section 3 — Date & Format */}
          <Card className="border-slate-200/70 shadow-sm shadow-slate-200/40">
            <CardContent className="p-7 space-y-6">
              <SectionLabel
                icon={<CalendarClock className="h-4 w-4" />}
                title="Date & Format"
                subtitle="When is it, and where will it happen?"
              />

              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-medium text-slate-700">
                  Date & Time
                </Label>
                <Input
                  {...register("date")}
                  id="date"
                  type="datetime-local"
                  min={new Date().toISOString().slice(0, 16)}
                  className={`${inputCls} ${errors.date ? "border-rose-400" : ""}`}
                />
                <FieldError message={errors.date?.message} />
              </div>

              {/* Online toggle */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Event Format</Label>
                <div className="flex items-center gap-3 h-11 px-4 rounded-md border border-slate-200 bg-white">
                  <button
                    type="button"
                    onClick={() => setValue("is_online", !isOnline, { shouldValidate: true })}
                    role="switch"
                    aria-checked={isOnline}
                    className={`relative w-11 h-6 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${isOnline ? "bg-blue-600" : "bg-slate-200"
                      }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${isOnline ? "translate-x-5" : ""
                        }`}
                    />
                  </button>
                  <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                    {isOnline ? (
                      <><Wifi className="h-3.5 w-3.5 text-blue-600" /> Online Event</>
                    ) : (
                      <><MapPin className="h-3.5 w-3.5 text-slate-400" /> In-person Event</>
                    )}
                  </span>
                </div>
              </div>

              {/* Location or meeting link */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-medium text-slate-700">
                    {isOnline ? "Platform Name" : "Venue / Location"}
                    <span className="text-slate-400 font-normal ml-1">(optional)</span>
                  </Label>
                  <Input
                    {...register("location")}
                    id="location"
                    placeholder={isOnline ? "Zoom, Google Meet…" : "UET Campus, Lahore"}
                    className={inputCls}
                  />
                </div>
                {isOnline && (
                  <div className="space-y-2">
                    <Label htmlFor="meeting_link" className="text-sm font-medium text-slate-700">
                      Meeting Link
                      <span className="text-slate-400 font-normal ml-1">(optional)</span>
                    </Label>
                    <Input
                      {...register("meeting_link")}
                      id="meeting_link"
                      type="url"
                      placeholder="https://meet.google.com/…"
                      className={`${inputCls} ${errors.meeting_link ? "border-rose-400" : ""}`}
                    />
                    <FieldError message={errors.meeting_link?.message} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Section 4 — Capacity */}
          <Card className="border-slate-200/70 shadow-sm shadow-slate-200/40">
            <CardContent className="p-7 space-y-4">
              <SectionLabel
                icon={<Users className="h-4 w-4" />}
                title="Capacity"
                subtitle="Optionally set a maximum number of attendees."
              />
              <div className="space-y-2">
                <Label htmlFor="max_attendees" className="text-sm font-medium text-slate-700">
                  Max Attendees
                  <span className="text-slate-400 font-normal ml-1">(optional)</span>
                </Label>
                <Input
                  id="max_attendees"
                  type="number"
                  min={1}
                  placeholder="e.g. 100"
                  className={`${inputCls} max-w-xs ${errors.max_attendees ? "border-rose-400" : ""}`}
                  onChange={(e) => {
                    const val = e.target.value;
                    setValue(
                      "max_attendees",
                      val ? parseInt(val, 10) : undefined,
                      { shouldValidate: true }
                    );
                  }}
                />
                <FieldError message={errors.max_attendees?.message} />
              </div>
            </CardContent>
          </Card>

          {/* Section 5 — Banner */}
          <Card className="border-slate-200/70 shadow-sm shadow-slate-200/40">
            <CardContent className="p-7">
              <SectionLabel
                icon={<ImagePlus className="h-4 w-4" />}
                title="Event Banner"
                subtitle="Optional — a banner image makes your event stand out."
              />

              {bannerPreview ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-200">
                  <img
                    src={bannerPreview}
                    alt="Banner preview"
                    className="w-full h-48 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => { setBannerFile(null); setBannerPreview(null); }}
                    className="absolute top-2 right-2 h-7 w-7 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 w-full h-36 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 transition-all duration-150 group">
                  <div className="h-10 w-10 rounded-full bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                    <ImagePlus className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                    <span className="text-blue-600 font-medium">Click to upload</span> banner
                  </span>
                  <span className="text-xs text-slate-400">PNG, JPG, WebP up to 5MB</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleBanner}
                  />
                </label>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-3 pt-2 pb-10">
            <Button
              type="submit"
              disabled={isSubmitting || mutation.isPending}
              className="flex-1 h-12 bg-white !text-blue-600 border !border-blue-600 text-sm shadow-md hover:scale-[1.02] cursor-pointer shadow-blue-600/25 gap-2"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Creating…
                </>
              ) : (
                "Create Event"
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
