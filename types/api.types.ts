import { ReactNode } from "react";

// ── Auth ──────────────────────────────────────────
export interface OTPResponse {
  message: string;
  otp_expires_in: string;
}

export interface VerifyOTPResponse {
  message: string;
  verified_token: string;
}

export interface RegisterResponse {
  message: string;
}

export interface ResetPasswordResponse {
  message: string;
}

// ── Profiles ──────────────────────────────────────
export interface AlumniProfile {
  id: string;
  role: "alumni";
  username: string;
  display_name: string;
  email: string;
  phone: string;
  bio: string;
  profile_picture: string;
  degree: string;
  graduation_year: number;
  roll_number: string;
  linkedin_url: string;
  batch: string;
  current_company: string;
  current_role: string;
  skills: string[];
  connections_count: number;
  account_status: "approved" | "pending" | "rejected";
  work_experiences: WorkExperience[];
  detailed_skills: DetailedSkill[];
}

export interface WorkExperience {
  id: string;
  company_name: string;
  role: string;
  start_date: string;
  end_date?: string;
  is_current: boolean;
  employment_type: "full-time" | "part-time" | "freelance";
}

export interface DetailedSkill {
  id: string;
  skill_name: string;
  category: string;
  proficiency_level: "beginner" | "intermediate" | "expert";
  years_experience?: number;
}

export interface StudentProfile {
  id: string;
  role: "student";
  username: string;
  display_name: string;
  email: string;
  phone: string;
  bio: string;
  profile_picture: string;
  degree: string;
  semester: number;
  roll_number: string;
  batch: string;
  skills: string[];
  account_status: "approved" | "pending" | "rejected";
}

export type UserProfile = AlumniProfile | StudentProfile;

export interface LoginResponse {
  token: string;
  role: "alumni" | "student" | "admin";
  account_status: "approved" | "pending" | "rejected";
  profile: UserProfile;
}

// ── Opportunities ─────────────────────────────────
export interface OpportunityPoster {
  id: string;
  display_name: string;
  role: string;
  username: string;
  profile_picture: string | null;
}

export interface Opportunity {
  id: string;
  title: string;
  type: "job" | "internship" | "freelance";
  company: string;
  location: string;
  is_remote: boolean;
  apply_link: string;
  posted_by: OpportunityPoster;
  posted_at: string;
  deadline: string;
  media: string[];
  required_skills?: string[];
  description?: string;
}
export interface OpportunityDetail {
  id: string;
  title: string;
  type: "job" | "internship" | "freelance";
  description: string;
  requirements: string;
  location: string;
  is_remote: boolean;
  apply_link: string;
  deadline: string;
  status: "open" | "closed";
  media: string[];
  company: {
    name: string;
    industry: string;
    website: string;
  };
  required_skills: string[];
  posted_by: {
    username: string;
    display_name: string;
    profile_picture: string;
    id: string;
    role: string;
  };
}
export interface MyOpportunity {
  type: string;
  id: string;
  title: string;
  company: string;
  status: "open" | "closed";
  posted_at: string;
  deadline: string;
}

export interface PaginatedOpportunities {
  total: number;
  page: number;
  data: Opportunity[];
}

// ── Network ───────────────────────────────────────
export interface Connection {
  id: string;
  display_name: string;
  username: string;
  profile_picture?: string;
  company?: string;
  role?: string;
  connection_type: "batchmate" | "colleague" | "mentor";
}

export interface BatchMate {
  id: string;
  display_name: string;
  username: string;
  profile_picture?: string;
  company?: string | null;
  role?: string | null;
  connection_type?: string | null;
}

export interface Mentor {
  alumni_id: string;
  display_name: string;
  username: string;
  profile_picture?: string;
  domain: string;
  company: string;
  common_skills?: number;
}

export interface CentralityScore {
  alumni_id: string;
  display_name: string;
  connections_count: number;
  centrality_score: number;
}

export interface ConnectionRequest {
  sender_id: string;
  sender_display_name: string;
  display_name?: string;
  sender_username?: string;
  profile_picture?: string;
  connection_type: string;
  requested_at: string;
}

export interface ShortestPath {
  path: string[];
  hops: number;
}

export interface TopCompany {
  company: string;
  alumni_count: number;
}

export interface SkillTrends {
  most_required_in_opportunities: string[];
  most_common_among_alumni: string[];
  gap: string[];
}

export interface BatchAnalysis {
  batch: string;
  total_alumni: number;
  top_companies: string[];
  top_roles: string[];
  avg_connections: number;
}

// ── Admin ─────────────────────────────────────────
export interface PendingAccount {
  id: string;
  display_name: string;
  email: string;
  role: "alumni" | "student";
  registered_at: string;
  student_card_url?: string;
}

export interface AdminStats {
  total_alumni: number;
  total_students: number;
  pending_accounts: number;
  total_opportunities: number;
  total_companies: number;
  most_common_skills: string[];
}

export interface AdminAlumni {
  id: string;
  display_name: string;
  company: string;
  role: string;
}

export interface AdminStudent {
  id: string;
  display_name: string;
  roll_number: string;
  semester: number;
}

export interface PaginatedAdminAlumni {
  total: number;
  page: number;
  data: AdminAlumni[];
}

export interface PaginatedAdminStudents {
  total: number;
  page: number;
  data: AdminStudent[];
}

// ── Notifications ─────────────────────────────────
export type NotificationType =
  | "connection_request"
  | "connection_accepted"
  | "account_approved"
  | "account_rejected"
  | "new_opportunity";

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  created_at: string;
  is_read: boolean;
  sender_username?: string | null;
  sender_display_name?: string | null;
  sender_profile_picture?: string | null;
  reference_link?: string | null;
}

// ── Search ────────────────────────────────────────
export interface AlumniSearchResult {
  profile_picture: string | Blob | undefined;
  id: string;
  display_name: string;
  username: string;
  email: string;
  current_company: string;
  role: string;
  skills: string[];
  batch: string;
}

export interface OpportunitySearchResult {
  id: string;
  title: string;
  type: "job" | "internship" | "freelance";
  company: string;
  location: string;
  is_remote: boolean;
  posted_by: string;
  posted_at: string;
}

export interface UserByUsername {
  id: string;
  username: string;
  display_name: string;
  profile_picture?: string;
  bio?: string;
  role: string;
  degree: string;
  graduation_year?: number;
  linkedin_url?: string;
  company?: string;
  job_role?: string;
  skills: string[];
}

// ── Chat ──────────────────────────────────────────
export interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ParticipantProfile {
  id: string;
  display_name: string;
  profile_picture: string | null;
  username: string;
}

export interface Conversation {
  _id: string;
  participants: string[];
  updatedAt: string;
  lastMessage: {
    content: string;
    createdAt: string;
    isRead?: boolean;
    senderId?: string;
  };
  participantProfile: ParticipantProfile;
}