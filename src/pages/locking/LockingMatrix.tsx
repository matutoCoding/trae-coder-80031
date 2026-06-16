import React, { useState, useEffect, useMemo } from "react";
import { useExamStore } from "@/store/useExamStore";
import {
  Lock,
  Unlock,
  Building2,
  Armchair,
  Users,
  AlertTriangle,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  Repeat,
} from "lucide-react";
import SeatGrid from "@/components/SeatGrid";
import Modal from "@/components/Modal";
import { Seat } from "@/types";

const LockingMatrix: React.FC = () => {
  const {
    examRooms,
    seats,
    assignments,
    students,
    exams,
    lockSeat,
    unlockSeat,
    getSeatStatusForExam,
    getOverlappingExamIds,
    initData,
  } = useExamStore();

  const [selectedRoomId, setSelectedRoomId] = useState<string>(
    examRooms[0]?.id || ""
  );
  const [selectedExamId, setSelectedExamId] = useState<string>(
    exams[0]?.id || ""
  );
  const [viewingSeat, setViewingSeat] = useState<Seat | null>(null);
  const [lockReason, setLockReason] = useState("");

  useEffect(() => {
    initData();
  }, [initData]);

  useEffect(() => {
    if (examRooms.length > 0 && !selectedRoomId) {
      setSelectedRoomId(examRooms[0].id);
    }
  }, [examRooms, selectedRoomId]);

  useEffect(() => {
    if (exams.length > 0 && !selectedExamId) {
      setSelectedExamId(exams[0].id);
    }
  }, [exams, selectedExamId]);

  const currentRoom = examRooms.find((r) => r.id === selectedRoomId);
  const currentSeats = seats.filter((s) => s.roomId === selectedRoomId);
  const selectedExam = exams.find((e) => e.id === selectedExamId);

  const occupiedOtherSeatIds = useMemo(() => {
    if (!selectedExamId) return new Set<string>();
    const set = new Set<string>();
    currentSeats.forEach((seat) => {
      const st = getSeatStatusForExam(seat.id, selectedExamId);
      if (st.status === "occupied-other") set.add(seat.id);
    });
    return set;
  }, [currentSeats, selectedExamId, getSeatStatusForExam]);

  const stats = useMemo(() => {
    let available = 0;
    let occupiedCurrent = 0;
    let occupiedOther = 0;
    let locked = 0;
    let disabled = 0;
    currentSeats.forEach((seat) => {
      if (!selectedExamId) {
        if (seat.status === "disabled") disabled++;
        else if (seat.isLocked) locked++;
        else if (seat.status === "occupied") occupiedCurrent++;
        else available++;
        return;
      }
      const st = getSeatStatusForExam(seat.id, selectedExamId);
      switch (st.status) {
        case "available":
          available++;
          break;
        case "occupied-current":
          occupiedCurrent++;
          break;
        case "occupied-other":
          occupiedOther++;
          break;
        case "locked":
          locked++;
          break;
        case "disabled":
          disabled++;
          break;
      }
    });
    return { total: currentSeats.length, available, occupiedCurrent, occupiedOther, locked, disabled };
  }, [currentSeats, selectedExamId, getSeatStatusForExam]);

  const overlappingExamsCount = useMemo(() => {
    if (!selectedExamId) return 0;
    return getOverlappingExamIds(selectedExamId).size - 1;
  }, [selectedExamId, getOverlappingExamIds]);

  const handleLockSeat = () => {
    if (viewingSeat && lockReason) {
      lockSeat(viewingSeat.id, lockReason);
      setViewingSeat(null);
      setLockReason("");
    }
  };

  const handleBatchUnlock = () => {
    if (confirm("确定解锁该考场所有手动锁定的考位吗？")) {
      currentSeats
        .filter((s) => s.isLocked && s.lockedBy === "admin")
        .forEach((s) => unlockSeat(s.id));
    }
  };

  const getAssignedStudent = (seatId: string) => {
    const assignment = assignments.find(
      (a) => a.seatId === seatId && a.status !== "cancelled"
    );
    if (!assignment) return null;
    return students.find((s) => s.id === assignment.studentId);
  };

  const getSeatExamStatus = (seatId: string) => {
    if (!selectedExamId) return null;
    return getSeatStatusForExam(seatId, selectedExamId);
  };

  const getSeatStatusLabel = (seat: Seat) => {
    const st = selectedExamId ? getSeatStatusForExam(seat.id, selectedExamId) : null;
    if (st) {
      switch (st.status) {
        case "available":
          return "空闲可用";
        case "occupied-current":
          return "当前考试已分配";
        case "occupied-other": {
          const examName = exams.find((e) => e.id === st.assignment?.examId)?.name;
          return examName ? `被「${examName}」占用` : "被其他场次占用";
        }
        case "locked":
          return "手动锁定";
        case "disabled":
          return "全局禁用";
      }
    }
    return seat.isLocked ? "已锁定" : seat.status === "occupied" ? "已占用" : seat.status === "disabled" ? "不可用" : "空闲可用";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">锁定矩阵</h1>
          <p className="text-slate-500 text-sm mt-1">
            按考试时间维度查看考位状态，支持手动锁定/解锁考位
          </p>
        </div>
        <button
          onClick={handleBatchUnlock}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
        >
          <Unlock size={18} />
          批量解锁
        </button>
      </div>

      {selectedExam && (
        <div className="bg-gradient-to-r from-accent-50 to-primary-50 rounded-2xl p-4 border border-primary-200/50 flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-primary-700 font-medium">
            <Calendar size={16} />
            当前视角: {selectedExam.name}
          </div>
          <div className="text-slate-500">
            {new Date(selectedExam.startTime).toLocaleString("zh-CN")} - {new Date(selectedExam.endTime).toLocaleTimeString("zh-CN", {hour: "2-digit", minute: "2-digit"})}
          </div>
          <div className="px-3 py-1 bg-white rounded-lg text-slate-600 flex items-center gap-1.5">
            <Repeat size={14} />
            时间冲突场次数: <span className="font-semibold text-warning-600">{overlappingExamsCount}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center">
              <Armchair size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500">总考位</p>
              <p className="text-xl font-bold text-slate-800">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
              <CheckCircle2 size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500">空闲可用</p>
              <p className="text-xl font-bold text-emerald-600">{stats.available}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <Users size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500">已分配(本场)</p>
              <p className="text-xl font-bold text-primary-600">{stats.occupiedCurrent}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center">
              <Repeat size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500">可复用(他场)</p>
              <p className="text-xl font-bold text-slate-600">{stats.occupiedOther}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warning-500 to-warning-700 flex items-center justify-center">
              <Lock size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500">锁定/禁用</p>
              <p className="text-xl font-bold text-warning-600">{stats.locked + stats.disabled}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-3">
              <Building2 size={18} className="text-slate-400" />
              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              >
                {examRooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.building})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <Calendar size={18} className="text-slate-400" />
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              >
                <option value="">全局视图(不按考试)</option>
                {exams.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-emerald-50 border-2 border-emerald-200"></div>
              <span className="text-slate-600">空闲可用</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-primary-100 border-2 border-primary-300"></div>
              <span className="text-slate-600">已分配(本场)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-slate-100 border-2 border-slate-300"></div>
              <span className="text-slate-600">可复用(他场占用)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-warning-50 border-2 border-warning-300"></div>
              <span className="text-slate-600">手动锁定</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-slate-200 border-2 border-slate-400 opacity-60"></div>
              <span className="text-slate-600">全局禁用</span>
            </div>
          </div>
        </div>

        {currentRoom && (
          <SeatGrid
            seats={currentSeats}
            rows={currentRoom.rows}
            cols={currentRoom.cols}
            assignments={assignments}
            students={students}
            examId={selectedExamId || undefined}
            occupiedOtherSeatIds={occupiedOtherSeatIds}
            onSeatClick={(seat) => setViewingSeat(seat)}
          />
        )}
      </div>

      <div className="bg-gradient-to-br from-warning-50 to-warning-100/50 rounded-2xl p-5 border border-warning-200">
        <div className="flex items-start gap-3">
          <AlertTriangle size={22} className="text-warning-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-warning-800">互斥锁定说明</h3>
            <ul className="mt-2 space-y-1 text-sm text-warning-700">
              <li>• 考位按<b>考试时间</b>维度锁定，同一时间或时间重叠的考试才互斥占用</li>
              <li>• 上午场分配过的座位，下午场只要时间不重叠就可以继续分配（「可复用」状态）</li>
              <li>• 可手动锁定特殊考位（如备用考位、故障考位等），手动锁定全局生效</li>
              <li>• 分配取消时自动释放锁定，仅释放对应考试时间占用</li>
              <li>• 批量解锁仅释放手动锁定的考位，不影响已分配考位</li>
            </ul>
          </div>
        </div>
      </div>

      <Modal
        isOpen={!!viewingSeat}
        onClose={() => {
          setViewingSeat(null);
          setLockReason("");
        }}
        title="考位锁定管理"
      >
        {viewingSeat && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
              <div
                className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                  (selectedExamId ? getSeatStatusForExam(viewingSeat.id, selectedExamId).status === "locked" : viewingSeat.isLocked)
                    ? "bg-gradient-to-br from-warning-500 to-warning-700"
                    : (selectedExamId ? getSeatStatusForExam(viewingSeat.id, selectedExamId).status === "occupied-current" : viewingSeat.status === "occupied")
                    ? "bg-gradient-to-br from-primary-500 to-primary-700"
                    : (selectedExamId ? getSeatStatusForExam(viewingSeat.id, selectedExamId).status === "occupied-other" : false)
                    ? "bg-gradient-to-br from-slate-400 to-slate-600"
                    : "bg-gradient-to-br from-emerald-500 to-emerald-700"
                }`}
              >
                {(selectedExamId ? getSeatStatusForExam(viewingSeat.id, selectedExamId).status === "locked" : viewingSeat.isLocked) ? (
                  <Lock size={28} className="text-white" />
                ) : (selectedExamId ? getSeatStatusForExam(viewingSeat.id, selectedExamId).status === "occupied-current" || getSeatStatusForExam(viewingSeat.id, selectedExamId).status === "occupied-other" : viewingSeat.status === "occupied") ? (
                  <Users size={28} className="text-white" />
                ) : (
                  <Armchair size={28} className="text-white" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">
                  {viewingSeat.seatNo}
                </h3>
                <p className="text-sm text-slate-500">
                  {examRooms.find((r) => r.id === viewingSeat.roomId)?.name} ·{" "}
                  {viewingSeat.rowNum}排 {viewingSeat.colNum}列
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500">
                  {selectedExamId ? `在「${selectedExam?.name}」中状态` : "全局状态"}
                </p>
                <p className="font-semibold mt-0.5">
                  {getSeatStatusLabel(viewingSeat)}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500">锁定方式</p>
                <p className="font-semibold mt-0.5">
                  {viewingSeat.lockedBy === "system"
                    ? "系统自动锁定"
                    : viewingSeat.lockedBy === "admin"
                    ? "管理员手动锁定"
                    : "未锁定"}
                </p>
              </div>
            </div>

            {viewingSeat.isLocked && (
              <div className="p-4 bg-warning-50 rounded-xl border border-warning-200">
                <p className="text-xs text-warning-600 mb-1">锁定原因</p>
                <p className="font-medium text-warning-800">
                  {viewingSeat.lockReason || "-"}
                </p>
                {viewingSeat.lockedAt && (
                  <p className="text-xs text-warning-600 mt-2">
                    锁定时间:{" "}
                    {new Date(viewingSeat.lockedAt).toLocaleString("zh-CN")}
                  </p>
                )}
              </div>
            )}

            {selectedExamId && getSeatExamStatus(viewingSeat.id)?.status === "occupied-other" && (() => {
              const st = getSeatExamStatus(viewingSeat.id)!;
              const otherExam = exams.find((e) => e.id === st.assignment?.examId);
              const student = students.find((s) => s.id === st.assignment?.studentId);
              return (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                    <Repeat size={12} /> 其他场次占用信息
                  </p>
                  <p className="font-medium text-slate-800">
                    {otherExam?.name || "未知考试"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {otherExam && new Date(otherExam.startTime).toLocaleString("zh-CN")}
                  </p>
                  {student && (
                    <p className="text-xs text-slate-600 mt-1">
                      考生: {student.name} ({student.school})
                    </p>
                  )}
                  <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                    <ShieldCheck size={12} /> 与当前考试时间不冲突，可复用
                  </p>
                </div>
              );
            })()}

            {getAssignedStudent(viewingSeat.id) && (
              <div className="p-4 bg-primary-50 rounded-xl border border-primary-200">
                <p className="text-xs text-primary-600 mb-1">分配考生</p>
                <p className="font-semibold text-primary-800">
                  {getAssignedStudent(viewingSeat.id)?.name}
                </p>
                <p className="text-xs text-primary-600 mt-0.5">
                  {getAssignedStudent(viewingSeat.id)?.school}
                </p>
              </div>
            )}

            {(!selectedExamId || getSeatStatusForExam(viewingSeat.id, selectedExamId).status === "available") &&
              !viewingSeat.isLocked &&
              viewingSeat.status !== "disabled" && (
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    锁定原因
                  </label>
                  <input
                    type="text"
                    value={lockReason}
                    onChange={(e) => setLockReason(e.target.value)}
                    placeholder="请输入锁定原因（如：备用考位、设备故障等）"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
                <button
                  onClick={handleLockSeat}
                  disabled={!lockReason}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-warning-500 text-white rounded-xl text-sm font-medium hover:bg-warning-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Lock size={16} />
                  锁定此考位
                </button>
              </div>
            )}

            {viewingSeat.isLocked && viewingSeat.lockedBy === "admin" && (
              <button
                onClick={() => {
                  unlockSeat(viewingSeat.id);
                  setViewingSeat(null);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors"
              >
                <Unlock size={16} />
                解锁此考位
              </button>
            )}

            {viewingSeat.isLocked && viewingSeat.lockedBy === "system" && (
              <div className="p-3 bg-slate-50 rounded-xl text-center text-sm text-slate-500">
                系统锁定考位，取消分配后自动解锁
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LockingMatrix;
