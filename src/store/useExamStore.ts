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

  getOverlappingExamIds: (examId: string) => Set<string>;
  isSeatOccupiedAtExam: (seatId: string, examId: string) => Assignment | undefined;
  isSeatLockedAtExam: (seatId: string, examId: string) => boolean;
  getAvailableSeatsForExam: (examId: string) => Seat[];
  getSeatStatusForExam: (
    seatId: string,
    examId: string
  ) => {
    status: "available" | "occupied-current" | "occupied-other" | "locked" | "disabled";
    assignment?: Assignment;
  };
  getRoomOccupancyForExam: (examId: string) => Map<string, number>;

  runAutoAllocation: (examId: string) => AllocationResult;
  confirmAssignment: (assignmentId: string) => void;
  confirmAllAssignments: (examId: string) => number;
  cancelAssignment: (assignmentId: string) => void;

  generateTicket: (assignmentId: string) => Ticket;
  generateTicketsBatch: (examId: string) => TicketBatchResult;

  updateAllocationConfig: (config: Partial<AllocationConfig>) => void;

  getSeatsByRoom: (roomId: string) => Seat[];
  getStudentsByExam: (examId: string) => Student[];
  getAssignmentsByExam: (examId: string) => Assignment[];
  resolveConflict: (conflictId: string) => void;
}

const STORAGE_KEY = "exam_seat_allocation_data_v2";

const isExamTimeOverlap = (examA: Exam, examB: Exam): boolean => {
  if (examA.id === examB.id) return false;
  const startA = new Date(examA.startTime).getTime();
  const endA = new Date(examA.endTime).getTime();
  const startB = new Date(examB.startTime).getTime();
  const endB = new Date(examB.endTime).getTime();
  return startA < endB && startB < endA;
};

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
  occupiedSeatIds: Set<string>,
  lockedSeatIds: Set<string>
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
        !occupiedSeatIds.has(s.id) &&
        !lockedSeatIds.has(s.id) &&
        s.status !== "disabled"
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
        examRooms: state.examRooms.map((r) =>
          r.id === id ? { ...r, ...room } : r
        ),
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
            ? {
                ...s,
                isLocked: false,
                lockReason: undefined,
                lockedAt: undefined,
                lockedBy: undefined,
              }
            : s
        ),
      };
      saveToStorage(updated);
      return updated;
    }),

  getOverlappingExamIds: (examId) => {
    const state = get();
    const targetExam = state.exams.find((e) => e.id === examId);
    if (!targetExam) return new Set<string>();
    const overlappingIds = new Set<string>();
    state.exams.forEach((e) => {
      if (isExamTimeOverlap(targetExam, e)) {
        overlappingIds.add(e.id);
      }
    });
    overlappingIds.add(examId);
    return overlappingIds;
  },

  isSeatOccupiedAtExam: (seatId, examId) => {
    const state = get();
    const overlappingExamIds = state.getOverlappingExamIds(examId);
    return state.assignments.find(
      (a) =>
        a.seatId === seatId &&
        overlappingExamIds.has(a.examId) &&
        a.status !== "cancelled"
    );
  },

  isSeatLockedAtExam: (seatId, examId) => {
    const state = get();
    const seat = state.seats.find((s) => s.id === seatId);
    if (!seat) return true;
    if (seat.status === "disabled") return true;
    if (seat.isLocked && seat.lockedBy === "admin") return true;
    return false;
  },

  getAvailableSeatsForExam: (examId) => {
    const state = get();
    return state.seats.filter((s) => {
      if (s.status === "disabled") return false;
      if (s.isLocked && s.lockedBy === "admin") return false;
      if (state.isSeatOccupiedAtExam(s.id, examId)) return false;
      return true;
    });
  },

  getSeatStatusForExam: (seatId, examId) => {
    const state = get();
    const seat = state.seats.find((s) => s.id === seatId);
    if (!seat) return { status: "disabled" as const };
    if (seat.status === "disabled") return { status: "disabled" as const };
    if (seat.isLocked && seat.lockedBy === "admin")
      return { status: "locked" as const };

    const overlappingExamIds = state.getOverlappingExamIds(examId);
    const assignment = state.assignments.find(
      (a) =>
        a.seatId === seatId &&
        overlappingExamIds.has(a.examId) &&
        a.status !== "cancelled"
    );
    if (assignment) {
      if (assignment.examId === examId) {
        return { status: "occupied-current" as const, assignment };
      }
      return { status: "occupied-other" as const, assignment };
    }
    return { status: "available" as const };
  },

  getRoomOccupancyForExam: (examId) => {
    const state = get();
    const examAssignments = state.assignments.filter(
      (a) => a.examId === examId && a.status !== "cancelled"
    );
    const occupancy = new Map<string, number>();
    state.examRooms.forEach((r) => occupancy.set(r.id, 0));
    examAssignments.forEach((a) => {
      const seat = state.seats.find((s) => s.id === a.seatId);
      if (seat) {
        const current = occupancy.get(seat.roomId) || 0;
        occupancy.set(seat.roomId, current + 1);
      }
    });
    return occupancy;
  },

  runAutoAllocation: (examId) => {
    const state = get();
    const config = state.allocationConfig;
    const exam = state.exams.find((e) => e.id === examId);

    const examStudents = state.students.filter(
      (s) => s.examId === examId && !s.assignedSeatId
    );
    const currentExamAssignments = state.assignments.filter(
      (a) => a.examId === examId && a.status !== "cancelled"
    );
    const assignedStudentIds = new Set(
      currentExamAssignments.map((a) => a.studentId)
    );

    const unassignedStudents = examStudents.filter(
      (s) => !assignedStudentIds.has(s.id)
    );

    const availableSeats = state.getAvailableSeatsForExam(examId);

    const newAssignments: Assignment[] = [];
    const newConflicts: ConflictLog[] = [];
    const rooms = state.examRooms;

    const roomOccupancy = state.getRoomOccupancyForExam(examId);

    const totalAvailable = availableSeats.length;
    const totalRooms = rooms.length;
    const totalToAssign = unassignedStudents.length + currentExamAssignments.length;
    const targetPerRoom = totalRooms > 0 ? Math.ceil(totalToAssign / totalRooms) : 0;

    const seatsMap = new Map(state.seats.map((s) => [s.id, s]));

    let workingAssignments = [...currentExamAssignments];
    let workingAvailableSeats = [...availableSeats];

    const occupiedSeatIdsForExam = new Set<string>();
    currentExamAssignments.forEach((a) => occupiedSeatIdsForExam.add(a.seatId));

    const lockedSeatIds = new Set<string>();
    state.seats.forEach((s) => {
      if (s.status === "disabled" || (s.isLocked && s.lockedBy === "admin")) {
        lockedSeatIds.add(s.id);
      }
    });

    for (const student of unassignedStudents) {
      let candidateSeats = [...workingAvailableSeats];

      if (config.loadBalance) {
        candidateSeats = candidateSeats.filter((seat) => {
          const currentOcc = roomOccupancy.get(seat.roomId) || 0;
          return currentOcc < targetPerRoom;
        });
        if (candidateSeats.length === 0) {
          candidateSeats = [...workingAvailableSeats];
        }
      }

      candidateSeats.sort((a, b) => {
        const occA = roomOccupancy.get(a.roomId) || 0;
        const occB = roomOccupancy.get(b.roomId) || 0;
        if (occA !== occB) return occA - occB;

        if (config.preferContiguous || config.avoidFragmentation) {
          const scoreA = calculateContiguityScore(
            a,
            workingAvailableSeats,
            occupiedSeatIdsForExam,
            lockedSeatIds
          );
          const scoreB = calculateContiguityScore(
            b,
            workingAvailableSeats,
            occupiedSeatIdsForExam,
            lockedSeatIds
          );
          if (scoreA !== scoreB) return scoreB - scoreA;
        }

        if (a.rowNum !== b.rowNum) return a.rowNum - b.rowNum;
        return a.colNum - b.colNum;
      });

      let selectedSeat: Seat | undefined;

      for (const seat of candidateSeats) {
        if (
          config.avoidSameSchool &&
          isSameSchoolNearby(
            seat,
            student,
            workingAssignments,
            state.students,
            state.seats
          )
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
        workingAvailableSeats = workingAvailableSeats.filter(
          (s) => s.id !== selectedSeat!.id
        );
        occupiedSeatIdsForExam.add(selectedSeat.id);

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
    workingAvailableSeats.forEach((seat) => {
      const score = calculateContiguityScore(
        seat,
        workingAvailableSeats,
        occupiedSeatIdsForExam,
        lockedSeatIds
      );
      if (score === 0) fragmentedCount++;
    });

    set((prevState) => {
      const updated = {
        ...prevState,
        assignments: [...prevState.assignments, ...newAssignments],
        conflicts: [...prevState.conflicts, ...newConflicts],
        students: prevState.students.map((s) => {
          const assignment = newAssignments.find(
            (a) => a.studentId === s.id
          );
          return assignment
            ? { ...s, assignedSeatId: assignment.seatId }
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

  confirmAllAssignments: (examId) => {
    let count = 0;
    set((state) => {
      const updated = {
        ...state,
        assignments: state.assignments.map((a) => {
          if (a.examId === examId && a.status === "pending") {
            count++;
            return { ...a, status: "confirmed" as const };
          }
          return a;
        }),
      };
      saveToStorage(updated);
      return updated;
    });
    return count;
  },

  cancelAssignment: (assignmentId) =>
    set((state) => {
      const assignment = state.assignments.find((a) => a.id === assignmentId);
      const updated = {
        ...state,
        assignments: state.assignments.map((a) =>
          a.id === assignmentId ? { ...a, status: "cancelled" as const } : a
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
    const ticketNo = `ZK${Date.now()}${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(4, "0")}`;

    const ticket: Ticket = {
      id: generateId(),
      assignmentId,
      examId: assignment.examId,
      studentId: assignment.studentId,
      studentName: student?.name || "",
      idCard: student?.idCard || "",
      school: student?.school || "",
      examName: exam?.name || "",
      examDate: exam
        ? new Date(exam.startTime).toLocaleDateString("zh-CN")
        : "",
      examTime: exam
        ? `${new Date(exam.startTime).toLocaleTimeString("zh-CN", {
            hour: "2-digit",
            minute: "2-digit",
          })}-${new Date(exam.endTime).toLocaleTimeString("zh-CN", {
            hour: "2-digit",
            minute: "2-digit",
          })}`
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
      (a) => a.examId === examId && a.status === "confirmed"
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
        examDate: exam
          ? new Date(exam.startTime).toLocaleDateString("zh-CN")
          : "",
        examTime: exam
          ? `${new Date(exam.startTime).toLocaleTimeString("zh-CN", {
              hour: "2-digit",
              minute: "2-digit",
            })}-${new Date(exam.endTime).toLocaleTimeString("zh-CN", {
              hour: "2-digit",
              minute: "2-digit",
            })}`
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
