import { create } from "zustand";
import {
  ExamRoom,
  Seat,
  Exam,
  Student,
  Assignment,
  Ticket,
  TicketBatchResult,
  ConflictLog,
  AllocationConfig,
  AllocationResult,
} from "@/types";
import { initMockData, generateId, generateSeatsForRoom } from "@/data/mockData";

interface ExamStore {
  examRooms: ExamRoom[];
  seats: Seat[];
  exams: Exam[];
  students: Student[];
  assignments: Assignment[];
  tickets: Ticket[];
  conflicts: ConflictLog[];
  allocationConfig: AllocationConfig;

  initData: () => void;

  addExamRoom: (room: ExamRoom) => void;
  updateExamRoom: (id: string, room: Partial<ExamRoom>) => void;
  deleteExamRoom: (id: string) => void;

  addExam: (exam: Exam) => void;
  updateExam: (id: string, exam: Partial<Exam>) => void;
  deleteExam: (id: string) => void;

  addStudent: (student: Student) => void;
  addStudentsBatch: (students: Student[]) => void;
  updateStudent: (id: string, student: Partial<Student>) => void;
  deleteStudent: (id: string) => void;

  lockSeat: (seatId: string, reason: string) => void;
  unlockSeat: (seatId: string) => void;

  runAutoAllocation: (examId: string) => AllocationResult;
  confirmAssignment: (assignmentId: string) => void;
  cancelAssignment: (assignmentId: string) => void;

  generateTicket: (assignmentId: string) => Ticket;
  generateTicketsBatch: (examId: string) => TicketBatchResult;

  updateAllocationConfig: (config: Partial<AllocationConfig>) => void;

  getSeatsByRoom: (roomId: string) => Seat[];
  getStudentsByExam: (examId: string) => Student[];
  getAssignmentsByExam: (examId: string) => Assignment[];
  resolveConflict: (conflictId: string) => void;
}

const STORAGE_KEY = "exam_seat_allocation_data";

const loadFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return {
        ...data,
        examRooms: data.examRooms,
        seats: data.seats,
        exams: data.exams,
        students: data.students,
        assignments: data.assignments,
        tickets: data.tickets,
        conflicts: data.conflicts,
      };
    }
  } catch (e) {
    console.error("Failed to load from storage", e);
  }
  return null;
};

const saveToStorage = (state: Partial<ExamStore>) => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        examRooms: state.examRooms,
        seats: state.seats,
        exams: state.exams,
        students: state.students,
        assignments: state.assignments,
        tickets: state.tickets,
        conflicts: state.conflicts,
      })
    );
  } catch (e) {
    console.error("Failed to save to storage", e);
  }
};

const calculateContiguityScore = (
  seat: Seat,
  allSeats: Seat[],
  seatsMap: Map<string, Seat>
): number => {
  let score = 0;
  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  directions.forEach(([dr, dc]) => {
    const neighbor = allSeats.find(
      (s) =>
        s.roomId === seat.roomId &&
        s.rowNum === seat.rowNum + dr &&
        s.colNum === seat.colNum + dc &&
        s.status === "available" &&
        !s.isLocked
    );
    if (neighbor) score++;
  });
  return score;
};

const isSameSchoolNearby = (
    seat: Seat,
    student: Student,
    assignments: Assignment[],
    students: Student[],
    seats: Seat[]
  ): boolean => {
  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  for (const [dr, dc] of directions) {
    const neighborSeat = seats.find(
      (s) =>
        s.roomId === seat.roomId &&
        s.rowNum === seat.rowNum + dr &&
        s.colNum === seat.colNum + dc
    );
    if (neighborSeat) {
      const neighborAssignment = assignments.find(
        (a) => a.seatId === neighborSeat.id && a.status !== "cancelled"
      );
      if (neighborAssignment) {
        const neighborStudent = students.find(
          (s) => s.id === neighborAssignment.studentId
        );
        if (neighborStudent && neighborStudent.school === student.school) {
          return true;
        }
      }
    }
  }
  return false;
};

export const useExamStore = create<ExamStore>((set, get) => ({
  examRooms: [],
  seats: [],
  exams: [],
  students: [],
  assignments: [],
  tickets: [],
  conflicts: [],
  allocationConfig: {
    avoidFragmentation: true,
    loadBalance: true,
    avoidSameSchool: true,
    preferContiguous: true,
  },

  initData: () => {
    const existing = loadFromStorage();
    if (existing && existing.examRooms.length > 0) {
      set(existing);
    } else {
      const mock = initMockData();
      set(mock);
      saveToStorage(mock as unknown as ExamStore);
    }
  },

  addExamRoom: (room) => {
    const newSeats = generateSeatsForRoom(room);
    const newState = {
      examRooms: [...get().examRooms, room],
      seats: [...get().seats, ...newSeats],
    };
    set(newState);
    saveToStorage({ ...get(), ...newState });
  },

  updateExamRoom: (id, room) =>
    set((state) => {
      const updated = {
        ...state,
        examRooms: state.examRooms.map((r) => (r.id === id ? { ...r, ...room } : r)),
      };
      saveToStorage(updated);
      return updated;
    }),

  deleteExamRoom: (id) =>
    set((state) => {
      const updated = {
        ...state,
        examRooms: state.examRooms.filter((r) => r.id !== id),
        seats: state.seats.filter((s) => s.roomId !== id),
      };
      saveToStorage(updated);
      return updated;
    }),

  addExam: (exam) =>
    set((state) => {
      const updated = { ...state, exams: [...state.exams, exam] };
      saveToStorage(updated);
      return updated;
    }),

  updateExam: (id, exam) =>
    set((state) => {
      const updated = {
        ...state,
        exams: state.exams.map((e) => (e.id === id ? { ...e, ...exam } : e)),
      };
      saveToStorage(updated);
      return updated;
    }),

  deleteExam: (id) =>
    set((state) => {
      const updated = {
        ...state,
        exams: state.exams.filter((e) => e.id !== id),
        students: state.students.filter((s) => s.examId !== id),
      };
      saveToStorage(updated);
      return updated;
    }),

  addStudent: (student) =>
    set((state) => {
      const updated = { ...state, students: [...state.students, student] };
      saveToStorage(updated);
      return updated;
    }),

  addStudentsBatch: (newStudents) =>
    set((state) => {
      const updated = {
        ...state,
        students: [...state.students, ...newStudents],
      };
      saveToStorage(updated);
      return updated;
    }),

  updateStudent: (id, student) =>
    set((state) => {
      const updated = {
        ...state,
        students: state.students.map((s) =>
          s.id === id ? { ...s, ...student } : s
        ),
      };
      saveToStorage(updated);
      return updated;
    }),

  deleteStudent: (id) =>
    set((state) => {
      const updated = {
        ...state,
        students: state.students.filter((s) => s.id !== id),
      };
      saveToStorage(updated);
      return updated;
    }),

  lockSeat: (seatId, reason) =>
    set((state) => {
      const updated = {
        ...state,
        seats: state.seats.map((s) =>
          s.id === seatId
            ? {
                ...s,
                isLocked: true,
                lockReason: reason,
                lockedAt: new Date(),
                lockedBy: "admin",
              }
            : s
        ),
      };
      saveToStorage(updated);
      return updated;
    }),

  unlockSeat: (seatId) =>
    set((state) => {
      const updated = {
        ...state,
        seats: state.seats.map((s) =>
          s.id === seatId
            ? { ...s, isLocked: false, lockReason: undefined, lockedAt: undefined, lockedBy: undefined }
            : s
        ),
      };
      saveToStorage(updated);
      return updated;
    }),

  runAutoAllocation: (examId) => {
    const state = get();
    const config = state.allocationConfig;
    const examStudents = state.students.filter((s) => s.examId === examId && !s.assignedSeatId);
    const examAssignments = state.assignments.filter(
      (a) => a.examId === examId && a.status !== "cancelled"
    );
    const assignedSeatIds = new Set(examAssignments.map((a) => a.seatId));
    const assignedStudentIds = new Set(examAssignments.map((a) => a.studentId));

    const availableSeats = state.seats.filter(
      (s) =>
        s.status === "available" && !s.isLocked && !assignedSeatIds.has(s.id)
    );

    const unassignedStudents = examStudents.filter(
      (s) => !assignedStudentIds.has(s.id)
    );

    const newAssignments: Assignment[] = [];
    const newConflicts: ConflictLog[] = [];
    const rooms = state.examRooms;
    const roomOccupancy = new Map<string, number>();

    rooms.forEach((r) => {
      const count = state.seats.filter(
        (s) => s.roomId === r.id && assignedSeatIds.has(s.id)
      ).length;
      roomOccupancy.set(r.id, count);
    });

    const seatsMap = new Map(state.seats.map((s) => [s.id, s]));

    let workingAssignments = [...examAssignments];
    let workingSeats = [...availableSeats];

    for (const student of unassignedStudents) {
      let candidateSeats = [...workingSeats];

      if (config.loadBalance) {
        candidateSeats.sort((a, b) => {
          const occA = roomOccupancy.get(a.roomId) || 0;
          const occB = roomOccupancy.get(b.roomId) || 0;
          return occA - occB;
        });
      }

      if (config.preferContiguous || config.avoidFragmentation) {
        candidateSeats.sort((a, b) => {
          const scoreA = calculateContiguityScore(a, workingSeats, seatsMap);
          const scoreB = calculateContiguityScore(b, workingSeats, seatsMap);
          return scoreB - scoreA;
        });
      }

      let selectedSeat: Seat | undefined;

      for (const seat of candidateSeats) {
        if (
          config.avoidSameSchool &&
          isSameSchoolNearby(seat, student, workingAssignments, state.students, state.seats)
        ) {
          continue;
        }
        selectedSeat = seat;
        break;
      }

      if (!selectedSeat && candidateSeats.length > 0) {
        selectedSeat = candidateSeats[0];
      }

      if (selectedSeat) {
        const assignment: Assignment = {
          id: generateId(),
          examId,
          studentId: student.id,
          seatId: selectedSeat.id,
          assignedAt: new Date(),
          status: "pending" as const,
        };

        newAssignments.push(assignment);
        workingAssignments.push(assignment);
        workingSeats = workingSeats.filter((s) => s.id !== selectedSeat!.id);
        
        const currentOcc = roomOccupancy.get(selectedSeat.roomId) || 0;
        roomOccupancy.set(selectedSeat.roomId, currentOcc + 1);
      } else {
        newConflicts.push({
          id: generateId(),
          examId,
          studentId: student.id,
          seatId: "",
          reason: "无可用考位",
          timestamp: new Date(),
          resolved: false,
        });
      }
    }

    let fragmentedCount = 0;
    workingSeats.forEach((seat) => {
      const score = calculateContiguityScore(seat, workingSeats, seatsMap);
      if (score === 0) fragmentedCount++;
    });

    set((prevState) => {
      const updated = {
        ...prevState,
        assignments: [...prevState.assignments, ...newAssignments],
        conflicts: [...prevState.conflicts, ...newConflicts],
        students: prevState.students.map((s) => {
          const assignment = newAssignments.find((a) => a.studentId === s.id);
          return assignment ? { ...s, assignedSeatId: assignment.seatId } : s;
        }),
        seats: prevState.seats.map((s) => {
          const assigned = newAssignments.find((a) => a.seatId === s.id);
          return assigned
            ? {
                ...s,
                isLocked: true,
                status: "occupied" as const,
                lockReason: "已分配考位",
                lockedAt: new Date(),
                lockedBy: "system",
              }
            : s;
        }),
      };
      saveToStorage(updated);
      return updated;
    });

    return {
      success: newConflicts.length === 0,
      assignments: newAssignments,
      conflicts: newConflicts,
      fragmentedSeats: fragmentedCount,
      message:
        newConflicts.length === 0
          ? `成功分配 ${newAssignments.length} 个考位`
          : `分配完成：成功 ${newAssignments.length} 个，冲突 ${newConflicts.length} 个`,
    };
  },

  confirmAssignment: (assignmentId) =>
    set((state) => {
      const updated = {
        ...state,
        assignments: state.assignments.map((a) =>
          a.id === assignmentId ? { ...a, status: "confirmed" as const } : a
        ),
      };
      saveToStorage(updated);
      return updated;
    }),

  cancelAssignment: (assignmentId) =>
    set((state) => {
      const assignment = state.assignments.find((a) => a.id === assignmentId);
      const updated = {
        ...state,
        assignments: state.assignments.map((a) =>
          a.id === assignmentId ? { ...a, status: "cancelled" as const } : a
        ),
        seats: state.seats.map((s) =>
          assignment && s.id === assignment.seatId
            ? {
                ...s,
                isLocked: false,
                status: "available" as const,
                lockReason: undefined,
                lockedAt: undefined,
                lockedBy: undefined,
              }
            : s
        ),
        students: state.students.map((s) =>
          assignment && s.id === assignment.studentId
            ? { ...s, assignedSeatId: undefined }
            : s
        ),
      };
      saveToStorage(updated);
      return updated;
    }),

  generateTicket: (assignmentId) => {
    const state = get();
    const assignment = state.assignments.find((a) => a.id === assignmentId);
    if (!assignment) return {} as Ticket;

    const student = state.students.find((s) => s.id === assignment.studentId);
    const exam = state.exams.find((e) => e.id === assignment.examId);
    const seat = state.seats.find((s) => s.id === assignment.seatId);
    const room = state.examRooms.find((r) => r.id === seat?.roomId);
    const ticketNo = `ZK${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(4, "0")}`;

    const ticket: Ticket = {
      id: generateId(),
      assignmentId,
      examId: assignment.examId,
      studentId: assignment.studentId,
      studentName: student?.name || "",
      idCard: student?.idCard || "",
      school: student?.school || "",
      examName: exam?.name || "",
      examDate: exam ? new Date(exam.startTime).toLocaleDateString("zh-CN") : "",
      examTime: exam
        ? `${new Date(exam.startTime).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}-${new Date(exam.endTime).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`
        : "",
      examRoomName: room?.name || "",
      building: room?.building || "",
      seatNo: seat?.seatNo || "",
      ticketNo,
      qrCode: `ticket:${assignmentId}`,
      generatedAt: new Date(),
    };

    set((prevState) => {
      const updated = { ...prevState, tickets: [...prevState.tickets, ticket] };
      saveToStorage(updated);
      return updated;
    });

    return ticket;
  },

  generateTicketsBatch: (examId) => {
    const state = get();
    const examAssignments = state.assignments.filter(
      (a) => a.examId === examId && a.status !== "cancelled"
    );
    const existingAssignmentIds = new Set(
      state.tickets.map((t) => t.assignmentId)
    );
    const pendingAssignments = examAssignments.filter(
      (a) => !existingAssignmentIds.has(a.id)
    );

    const newTickets: Ticket[] = pendingAssignments.map((a, index) => {
      const student = state.students.find((s) => s.id === a.studentId);
      const exam = state.exams.find((e) => e.id === a.examId);
      const seat = state.seats.find((s) => s.id === a.seatId);
      const room = state.examRooms.find((r) => r.id === seat?.roomId);
      const ticketNo = `ZK${Date.now()}${(index + 1).toString().padStart(4, "0")}`;

      return {
        id: generateId(),
        assignmentId: a.id,
        examId: a.examId,
        studentId: a.studentId,
        studentName: student?.name || "",
        idCard: student?.idCard || "",
        school: student?.school || "",
        examName: exam?.name || "",
        examDate: exam ? new Date(exam.startTime).toLocaleDateString("zh-CN") : "",
        examTime: exam
          ? `${new Date(exam.startTime).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}-${new Date(exam.endTime).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`
          : "",
        examRoomName: room?.name || "",
        building: room?.building || "",
        seatNo: seat?.seatNo || "",
        ticketNo,
        qrCode: `ticket:${a.id}`,
        generatedAt: new Date(),
      };
    });

    set((prevState) => {
      const updated = {
        ...prevState,
        tickets: [...prevState.tickets, ...newTickets],
      };
      saveToStorage(updated);
      return updated;
    });

    return {
      tickets: newTickets,
      success: newTickets.length,
      failed: pendingAssignments.length - newTickets.length,
    };
  },

  updateAllocationConfig: (config) =>
    set((state) => ({
      allocationConfig: { ...state.allocationConfig, ...config },
    })),

  getSeatsByRoom: (roomId) => get().seats.filter((s) => s.roomId === roomId),

  getStudentsByExam: (examId) =>
    get().students.filter((s) => s.examId === examId),

  getAssignmentsByExam: (examId) =>
    get().assignments.filter((a) => a.examId === examId),

  resolveConflict: (conflictId) =>
    set((state) => {
      const updated = {
        ...state,
        conflicts: state.conflicts.map((c) =>
          c.id === conflictId ? { ...c, resolved: true } : c
        ),
      };
      saveToStorage(updated);
      return updated;
    }),
}));
