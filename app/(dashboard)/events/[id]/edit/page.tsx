"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { updateEventSchema, UpdateEventInput } from "@/schemas/event.schemas";
import { getEventById, updateEvent } from "@/lib/api/events.api";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";
import {
  Users, Video, Network, GraduationCap, Handshake,
  CalendarClock, MapPin, Wifi, ImagePlus, Loader2,
  AlertCircle, X, ArrowLeft, FileText, Hash,
} from "lucide-react";

const TiptapEditor = dynamic(() => import("@/components/features/TiptapEditor"), {
  ssr: false,
  loading: () => <div className="h-40 rounded-xl border border-slate-200 bg-slate-50 animate-pulse" />,
});

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-xs text-rose-600 flex items-center gap-1 mt-1">
      <AlertCircle className="h-3 w-3 flex-shrink-0" />{message}
    </p>
  );
}

function SectionLabel({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100">{icon}</div>
      <div>
        <h2 className="text-base font-semibold text-slate-900 leading-tight">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

const EVENT_TYPES = [
  { value: "reunion",     label: "Reunion",    icon: <Users className="h-4 w-4" /> },
  { value: "webinar",    label: "Webinar",    icon: <Video className="h-4 w-4" /> },
  { value: "workshop",   label: "Workshop",   icon: <GraduationCap className="h-4 w-4" /> },
  { value: "networking", label: "Networking", icon: <Network className="h-4 w-4" /> },
  { value: "other",      label: "Other",      icon: <Handshake className="h-4 w-4" /> },
] as const;

const inputCls = "h-11 text-sm border-slate-200 bg-white focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:border-blue-500";

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [serverError, setServerError] = useState("");
  const [formReady, setFormReady] = useState(false);

  const { data: event, isLoading } = useQuery({
    queryKey: ["event", id],
    queryFn: () => getEventById(id),
  });

  const { register, handleSubmit, setValue, watch, control, reset, formState: { errors, isSubmitting } } =
    useForm<UpdateEventInput>({ resolver: zodResolver(updateEventSchema) });

  useEffect(() => {
    if (!event) return;
    const localDate = new Date(event.date).toISOString().slice(0, 16);
    reset({
      title: event.title,
      description: event.description,
      type: event.type,
      date: localDate,
      is_online: event.is_online,
      location: event.location ?? "",
      meeting_link: event.meeting_link ?? "",
      max_attendees: event.max_attendees ?? undefined,
    });
    if (event.banner_url) setBannerPreview(event.banner_url);
    setFormReady(true);
  }, [event, reset]);

  const selectedType = watch("type");
  const isOnline = watch("is_online");

  const mutation = useMutation({
    mutationFn: (data: UpdateEventInput) =>
      updateEvent(id, { ...data, meeting_link: data.meeting_link || undefined, location: data.location || undefined, banner: bannerFile ?? undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", id] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      router.push(`/events/${id}`);
    },
    onError: (err: any) => setServerError(err.response?.data?.message || "Failed to update. Try again."),
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-5">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-6 group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />Back
        </button>

        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium ring-1 ring-amber-100 mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />Editing
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Edit Event</h1>
          <p className="text-slate-500 mt-2 text-[15px]">Update the details for your event.</p>
        </div>

        {serverError && (
          <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-rose-50 border border-rose-200 mb-5">
            <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-rose-700">{serverError}</p>
          </div>
        )}

        {formReady && (
          <form onSubmit={handleSubmit((d) => { setServerError(""); mutation.mutate(d); })} className="space-y-5">
            {/* Type + Title */}
            <Card className="border-slate-200/70 shadow-sm">
              <CardContent className="p-7 space-y-6">
                <SectionLabel icon={<Hash className="h-4 w-4" />} title="Event Type" />
                <div className="space-y-2">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {EVENT_TYPES.map(({ value, label, icon }) => (
                      <button key={value} type="button"
                        onClick={() => setValue("type", value, { shouldValidate: true })}
                        className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-semibold transition-all w-full ${
                          selectedType === value
                            ? "border-blue-600 bg-white text-blue-600 shadow-md shadow-blue-600/20"
                            : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700"
                        }`}
                      >{icon}<span className="truncate">{label}</span></button>
                    ))}
                  </div>
                  <FieldError message={errors.type?.message} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium text-slate-700">Event Title</Label>
                  <Input {...register("title")} id="title" className={`${inputCls} ${errors.title ? "border-rose-400" : ""}`} />
                  <FieldError message={errors.title?.message} />
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card className="border-slate-200/70 shadow-sm">
              <CardContent className="p-7 space-y-4">
                <SectionLabel icon={<FileText className="h-4 w-4" />} title="Description" subtitle="Rich text supported." />
                <Controller name="description" control={control} render={({ field }) => (
                  <TiptapEditor value={field.value ?? ""} onChange={field.onChange} placeholder="Describe the event…" hasError={!!errors.description} />
                )} />
                <FieldError message={errors.description?.message} />
              </CardContent>
            </Card>

            {/* Date & Format */}
            <Card className="border-slate-200/70 shadow-sm">
              <CardContent className="p-7 space-y-6">
                <SectionLabel icon={<CalendarClock className="h-4 w-4" />} title="Date & Format" />
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-sm font-medium text-slate-700">Date & Time</Label>
                  <Input {...register("date")} id="date" type="datetime-local" className={`${inputCls} ${errors.date ? "border-rose-400" : ""}`} />
                  <FieldError message={errors.date?.message} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Format</Label>
                  <div className="flex items-center gap-3 h-11 px-4 rounded-md border border-slate-200 bg-white">
                    <button type="button" role="switch" aria-checked={!!isOnline}
                      onClick={() => setValue("is_online", !isOnline, { shouldValidate: true })}
                      className={`relative w-11 h-6 rounded-full transition-all duration-200 ${isOnline ? "bg-blue-600" : "bg-slate-200"}`}>
                      <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${isOnline ? "translate-x-5" : ""}`} />
                    </button>
                    <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                      {isOnline ? <><Wifi className="h-3.5 w-3.5 text-blue-600" />Online</> : <><MapPin className="h-3.5 w-3.5 text-slate-400" />In-person</>}
                    </span>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-sm font-medium text-slate-700">
                      {isOnline ? "Platform" : "Venue"} <span className="text-slate-400 font-normal">(optional)</span>
                    </Label>
                    <Input {...register("location")} id="location" placeholder={isOnline ? "Zoom, Meet…" : "UET Campus"} className={inputCls} />
                  </div>
                  {isOnline && (
                    <div className="space-y-2">
                      <Label htmlFor="meeting_link" className="text-sm font-medium text-slate-700">
                        Meeting Link <span className="text-slate-400 font-normal">(optional)</span>
                      </Label>
                      <Input {...register("meeting_link")} id="meeting_link" type="url" placeholder="https://meet.google.com/…" className={`${inputCls} ${errors.meeting_link ? "border-rose-400" : ""}`} />
                      <FieldError message={errors.meeting_link?.message} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Capacity */}
            <Card className="border-slate-200/70 shadow-sm">
              <CardContent className="p-7 space-y-4">
                <SectionLabel icon={<Users className="h-4 w-4" />} title="Capacity" />
                <div className="space-y-2">
                  <Label htmlFor="max_attendees" className="text-sm font-medium text-slate-700">
                    Max Attendees <span className="text-slate-400 font-normal">(optional)</span>
                  </Label>
                  <Input id="max_attendees" type="number" min={1} defaultValue={event?.max_attendees ?? ""}
                    placeholder="e.g. 100" className={`${inputCls} max-w-xs ${errors.max_attendees ? "border-rose-400" : ""}`}
                    onChange={(e) => setValue("max_attendees", e.target.value ? parseInt(e.target.value, 10) : undefined, { shouldValidate: true })} />
                  <FieldError message={errors.max_attendees?.message} />
                </div>
              </CardContent>
            </Card>

            {/* Banner */}
            <Card className="border-slate-200/70 shadow-sm">
              <CardContent className="p-7">
                <SectionLabel icon={<ImagePlus className="h-4 w-4" />} title="Banner Image" subtitle="Upload a new banner to replace the current one." />
                {bannerPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200">
                    <img src={bannerPreview} alt="Banner" className="w-full h-48 object-cover" />
                    <button type="button" onClick={() => { setBannerFile(null); setBannerPreview(null); }}
                      className="absolute top-2 right-2 h-7 w-7 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center">
                      <X className="h-3.5 w-3.5" />
                    </button>
                    {!bannerFile && <div className="absolute bottom-2 left-2 text-xs bg-black/60 text-white px-2 py-1 rounded-lg">Current banner</div>}
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-2 w-full h-36 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 transition-all group">
                    <div className="h-10 w-10 rounded-full bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center">
                      <ImagePlus className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="text-sm text-slate-600"><span className="text-blue-600 font-medium">Click to upload</span> new banner</span>
                    <span className="text-xs text-slate-400">PNG, JPG, WebP up to 5MB</span>
                    <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; setBannerFile(f); setBannerPreview(URL.createObjectURL(f)); e.target.value = ""; }} />
                  </label>
                )}
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex gap-3 pt-2 pb-10">
              <Button type="submit" disabled={isSubmitting || mutation.isPending}
                className="flex-1 h-12 bg-white !text-blue-600 border !border-blue-600 text-sm shadow-md hover:scale-[1.02] cursor-pointer gap-2">
                {mutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</> : "Save Changes"}
              </Button>
              <Button type="button" variant="outline" className="h-12 px-6 border-slate-200 text-slate-700 hover:bg-slate-50 text-sm" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
