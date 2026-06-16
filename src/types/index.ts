export interface ExamRoom {
  id: string;
  name: string;
  building: string;
  floor: number;
  rows: number;
  cols: number;
  totalSeats: number;
  createdAt: Date;
}

export interface Seat {
  id: string;
  roomId: string;
  seatNo: string;
  rowNum: number;
  colNum: number;
  status: "available" | "occupied" | "disabled";
  isLocked: boolean;
  lockReason?: string;
  lockedBy?: string;
  lockedAt?: Date;
}

export interface Exam {
  id: string;
  name: string;
  subject: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  status: "upcoming" | "ongoing" | "completed";
}

export interface Student {
  id: string;
  name: string;
  idCard: string;
  school: string;
  examId: string;
  assignedSeatId?: string;
}

export interface Assignment {
  id: string;
  examId: string;
  studentId: string;
  seatId: string;
  assignedAt: Date;
  status: "pending" | "confirmed" | "completed" | "cancelled";
}

export interface Ticket {
  id: string;
  assignmentId: string;
  examId: string;
  studentId: string;
  studentName: string;
  idCard: string;
  school: string;
  examName: string;
  examDate: string;
  examTime: string;
  examRoomName: string;
  building: string;
  seatNo: string;
  ticketNo: string;
  qrCode: string;
  generatedAt: Date;
}

export interface AllocationConfig {
  avoidFragmentation: boolean;
  loadBalance: boolean;
  avoidSameSchool: boolean;
  preferContiguous: boolean;
}

export interface ConflictLog {
  id: string;
  examId: string;
  studentId: string;
  seatId: string;
  reason: string;
  timestamp: Date;
  resolved: boolean;
}

export interface TicketBatchResult {
  tickets: Ticket[];
  success: number;
  failed: number;
}

export interface AllocationResult {
  success: boolean;
  assignments: Assignment[];
  conflicts: ConflictLog[];
  fragmentedSeats: number;
  message?: string;
}

export type ModuleKey =
  | "dashboard"
  | "scheduling"
  | "assignment"
  | "locking"
  | "ticket";

export interface NavItem {
  key: ModuleKey;
  label: string;
  icon: string;
  children?: { path: string; label: string }[];
}
