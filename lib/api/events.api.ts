import api from "@/lib/api";
import {
  EventListItem,
  EventDetail,
  EventAttendee,
  RSVPStatus,
} from "@/types/api.types";

// ── List Events ───────────────────────────────────
export const getEvents = async (params: {
  type?: string;
  is_online?: boolean;
  status?: "upcoming" | "past";
  limit?: number;
  offset?: number;
}): Promise<EventListItem[]> => {
  const { data } = await api.get("/api/events", { params });
  return data;
};

// ── Get Event Detail ──────────────────────────────
export const getEventById = async (id: string): Promise<EventDetail> => {
  const { data } = await api.get(`/api/events/${id}`);
  return data;
};

// ── Get My Events ─────────────────────────────────
export const getMyEvents = async (): Promise<EventListItem[]> => {
  const { data } = await api.get("/api/events/my-events");
  return data;
};

// ── Create Event ──────────────────────────────────
export const createEvent = async (payload: {
  title: string;
  description: string;
  type: string;
  date: string;
  is_online: boolean;
  location?: string;
  meeting_link?: string;
  max_attendees?: number;
  banner?: File;
}): Promise<{ message: string; eventId: string }> => {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("description", payload.description);
  formData.append("type", payload.type);
  formData.append("date", payload.date);
  formData.append("is_online", String(payload.is_online));
  if (payload.location) formData.append("location", payload.location);
  if (payload.meeting_link) formData.append("meeting_link", payload.meeting_link);
  if (payload.max_attendees)
    formData.append("max_attendees", String(payload.max_attendees));
  if (payload.banner) formData.append("banner", payload.banner);

  const { data } = await api.post("/api/events", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

// ── Update Event ──────────────────────────────────
export const updateEvent = async (
  id: string,
  payload: {
    title?: string;
    description?: string;
    type?: string;
    date?: string;
    is_online?: boolean;
    location?: string;
    meeting_link?: string;
    max_attendees?: number;
    banner?: File;
  }
): Promise<{ message: string }> => {
  const formData = new FormData();
  if (payload.title) formData.append("title", payload.title);
  if (payload.description) formData.append("description", payload.description);
  if (payload.type) formData.append("type", payload.type);
  if (payload.date) formData.append("date", payload.date);
  if (payload.is_online !== undefined)
    formData.append("is_online", String(payload.is_online));
  if (payload.location !== undefined) formData.append("location", payload.location);
  if (payload.meeting_link !== undefined)
    formData.append("meeting_link", payload.meeting_link);
  if (payload.max_attendees !== undefined)
    formData.append("max_attendees", String(payload.max_attendees));
  if (payload.banner) formData.append("banner", payload.banner);

  const { data } = await api.put(`/api/events/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

// ── Delete Event ──────────────────────────────────
export const deleteEvent = async (id: string): Promise<{ message: string }> => {
  const { data } = await api.delete(`/api/events/${id}`);
  return data;
};

// ── RSVP ─────────────────────────────────────────
export const rsvpToEvent = async (
  id: string,
  status: RSVPStatus
): Promise<{ message: string }> => {
  const { data } = await api.post(`/api/events/${id}/rsvp`, { status });
  return data;
};

// ── Cancel RSVP ───────────────────────────────────
export const cancelRsvp = async (id: string): Promise<{ message: string }> => {
  const { data } = await api.delete(`/api/events/${id}/rsvp`);
  return data;
};

// ── Get Attendees ─────────────────────────────────
export const getEventAttendees = async (
  id: string
): Promise<EventAttendee[]> => {
  const { data } = await api.get(`/api/events/${id}/attendees`);
  return data;
};
