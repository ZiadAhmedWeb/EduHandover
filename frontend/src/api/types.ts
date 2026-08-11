export type Role = "ADMIN" | "TEACHER" | "PLATFORM_ADMIN";

export interface SchoolInfo {
  id: string;
  name: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  schoolId: string | null;
  joinedAt: string;
  canCreateHandovers: boolean;
  canAcknowledgeHandovers: boolean;
  school: SchoolInfo | null;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface TeacherSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface TeacherInviteResult {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  activationLink?: string;
  classCreated?: boolean;
}

export interface ClassSummary {
  id: string;
  name: string;
  academicYear: string;
  schoolId: string;
  teacherId: string;
  teacher?: TeacherSummary;
  _count?: { students: number };
}

export interface StudentSummary {
  id: string;
  firstName: string;
  lastName: string;
  gradeLevel: string;
  schoolId: string;
  currentClassId: string | null;
  currentClass?: { id: string; name: string; academicYear: string } | null;
  handover: {
    id: string;
    status: "DRAFT" | "SUBMITTED" | "ARCHIVED";
    isAcknowledged: boolean;
    academicYear: string;
    receiver?: { id: string; firstName: string; lastName: string } | null;
  } | null;
}

export interface TagGroup {
  slug: string;
  label: string;
}

export interface TagGroups {
  learningStyles: TagGroup[];
  focusTriggers: TagGroup[];
  behavioralStrengths: TagGroup[];
}

export interface HandoverProfile {
  id: string;
  studentId: string;
  creatorId: string;
  receiverId: string | null;
  academicYear: string;
  learningStyles: string[];
  focusTriggers: string[];
  behavioralTags: string[];
  notes: string | null;
  status: "DRAFT" | "SUBMITTED" | "ARCHIVED";
  isAcknowledged: boolean;
  acknowledgedAt: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    gradeLevel: string;
    currentClass?: { id: string; name: string; academicYear: string } | null;
  };
  creator: TeacherSummary;
  receiver: TeacherSummary | null;
  acknowledgments?: { id: string; teacherId: string; acknowledgedAt: string }[];
}

export interface SchoolInfoResponse {
  id: string;
  name: string;
  _count?: { users: number; classes: number; students: number };
}

export type LeadStatus = "PENDING" | "ACCEPTED" | "DECLINED";

export interface Lead {
  id: string;
  fullName: string;
  workEmail: string;
  schoolName: string;
  studentCount: string;
  message: string | null;
  status: LeadStatus;
  handledById: string | null;
  handledAt: string | null;
  createdAt: string;
  handledBy: { id: string; firstName: string; lastName: string; email: string } | null;
}
