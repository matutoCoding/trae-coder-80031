import React from "react";
import { Seat, Student, Assignment } from "@/types";
import { cn } from "@/lib/utils";
import { Lock, User, X, AlertTriangle } from "lucide-react";

interface SeatGridProps {
  seats: Seat[];
  rows: number;
  cols: number;
  assignments?: Assignment[];
  students?: Student[];
  onSeatClick?: (seat: Seat) => void;
  showLabels?: boolean;
  examId?: string;
  occupiedOtherSeatIds?: Set<string>;
}

const SeatGrid: React.FC<SeatGridProps> = ({
  seats,
  rows,
  cols,
  assignments = [],
  students = [],
  onSeatClick,
  showLabels = true,
  examId,
  occupiedOtherSeatIds,
}) => {
  const getSeatAt = (row: number, col: number) =>
    seats.find((s) => s.rowNum === row && s.colNum === col);

  const getSeatStatus = (seat: Seat | undefined) => {
    if (!seat) return "empty";
    if (seat.status === "disabled") return "disabled";
    if (seat.isLocked && seat.lockedBy === "admin") return "locked";
    if (examId) {
      const assignment = assignments.find(
        (a) =>
          a.seatId === seat.id &&
          a.status !== "cancelled" &&
          a.examId === examId
      );
      if (assignment) return "occupied";
      if (occupiedOtherSeatIds && occupiedOtherSeatIds.has(seat.id)) {
        return "occupied-other";
      }
      return "available";
    }
    const assignment = assignments.find(
      (a) => a.seatId === seat.id && a.status !== "cancelled"
    );
    if (assignment) return "occupied";
    return "available";
  };

  const getStudentForSeat = (seatId: string) => {
    const assignment = assignments.find(
      (a) => a.seatId === seatId && a.status !== "cancelled"
    );
    if (!assignment) return null;
    return students.find((s) => s.id === assignment.studentId);
  };

  const statusStyles: Record<string, string> = {
    available:
      "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 cursor-pointer",
    occupied:
      "bg-primary-100 border-primary-300 text-primary-800 cursor-pointer",
    "occupied-other":
      "bg-slate-200 border-slate-300 text-slate-500 cursor-not-allowed",
    locked:
      "bg-warning-50 border-warning-300 text-warning-700 cursor-pointer",
    disabled:
      "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed",
    empty: "bg-transparent border-transparent",
  };

  const statusLabels: Record<string, string> = {
    available: "空闲可用",
    occupied: "已分配(本场)",
    "occupied-other": "被其他场次占用",
    locked: "已锁定",
    disabled: "不可用",
    empty: "",
  };

  return (
    <div className="p-4">
      <div className="text-center mb-6">
        <div className="inline-block px-12 py-2 bg-slate-800 text-white text-sm rounded-lg font-medium">
          讲 台
        </div>
      </div>

      <div
        className="seat-grid mx-auto"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          maxWidth: `${cols * 56}px`,
        }}
      >
        {Array.from({ length: rows }, (_, r) =>
          Array.from({ length: cols }, (_, c) => {
            const seat = getSeatAt(r + 1, c + 1);
            const status = getSeatStatus(seat);
            const student = seat ? getStudentForSeat(seat.id) : null;
            const isClickable =
              seat &&
              onSeatClick &&
              status !== "empty" &&
              status !== "disabled" &&
              status !== "occupied-other";

            return (
              <div
                key={`${r}-${c}`}
                className={cn(
                  "relative w-12 h-12 rounded-lg border-2 flex items-center justify-center text-xs font-medium transition-all duration-200",
                  statusStyles[status],
                  isClickable
                    ? "hover:scale-105 hover:shadow-md"
                    : ""
                )}
                onClick={() => seat && isClickable && onSeatClick(seat)}
                title={
                  seat
                    ? `${seat.seatNo}${
                        status === "occupied-other"
                          ? ` - ${statusLabels[status]}`
                          : student
                          ? ` - ${student.name} (${student.school})`
                          : status !== "empty" && status !== "available"
                          ? ` - ${statusLabels[status]}`
                          : ""
                      }`
                    : ""
                }
              >
                {seat && status !== "empty" && (
                  <>
                    {status === "locked" && (
                      <Lock
                        size={14}
                        className="absolute top-0.5 right-0.5"
                      />
                    )}
                    {status === "occupied" && (
                      <User
                        size={14}
                        className="absolute top-0.5 right-0.5 text-primary-600"
                      />
                    )}
                    {status === "occupied-other" && (
                      <AlertTriangle
                        size={14}
                        className="absolute top-0.5 right-0.5 text-slate-400"
                      />
                    )}
                    {status === "disabled" && <X size={14} />}
                    {showLabels && status !== "disabled" && (
                      <span className="text-[10px] font-semibold">
                        {seat.rowNum}-{seat.colNum}
                      </span>
                    )}
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-emerald-50 border-2 border-emerald-200"></div>
          <span>空闲</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-primary-100 border-2 border-primary-300"></div>
          <span>已分配</span>
        </div>
        {examId && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-slate-200 border-2 border-slate-300"></div>
            <span>其他场次占用</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-warning-50 border-2 border-warning-300"></div>
          <span>已锁定</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-slate-100 border-2 border-slate-200"></div>
          <span>不可用</span>
        </div>
      </div>
    </div>
  );
};

export default SeatGrid;
