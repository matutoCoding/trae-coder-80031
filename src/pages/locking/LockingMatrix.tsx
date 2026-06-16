import React, { useState, useEffect } from "react";
import { useExamStore } from "@/store/useExamStore";
import {
  Lock,
  Unlock,
  Building2,
  Armchair,
  Users,
  AlertTriangle,
  ShieldCheck,
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
    lockSeat,
    unlockSeat,
    initData,
  } = useExamStore();

  const [selectedRoomId, setSelectedRoomId] = useState<string>(
    examRooms[0]?.id || ""
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

  const currentRoom = examRooms.find((r) => r.id === selectedRoomId);
  const currentSeats = seats.filter((s) => s.roomId === selectedRoomId);

  const stats = {
    total: currentSeats.length,
    locked: currentSeats.filter((s) => s.isLocked).length,
    occupied: currentSeats.filter((s) => s.status === "occupied").length,
    available: currentSeats.filter(
      (s) => s.status === "available" && !s.isLocked
    ).length,
  };

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
        .filter((s) => s.isLocked && s.lockReason !== "已分配考位")
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">锁定矩阵</h1>
          <p className="text-slate-500 text-sm mt-1">
            查看考位锁定状态，支持手动锁定/解锁考位
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center">
              <Armchair size={22} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500">总考位</p>
              <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-warning-500 to-warning-700 flex items-center justify-center">
              <Lock size={22} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500">已锁定</p>
              <p className="text-2xl font-bold text-warning-600">{stats.locked}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <Users size={22} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500">已占用</p>
              <p className="text-2xl font-bold text-primary-600">{stats.occupied}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
              <ShieldCheck size={22} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500">可用</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.available}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
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

            <div className="flex-1 flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-emerald-50 border-2 border-emerald-200"></div>
                <span className="text-slate-600">空闲可用</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-primary-100 border-2 border-primary-300"></div>
                <span className="text-slate-600">已分配</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-warning-50 border-2 border-warning-300"></div>
                <span className="text-slate-600">已锁定</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-slate-100 border-2 border-slate-200"></div>
                <span className="text-slate-600">不可用</span>
              </div>
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
              <li>• 考位分配成功后系统自动锁定，防止重复分配</li>
              <li>• 可手动锁定特殊考位（如备用考位、故障考位等）</li>
              <li>• 手动锁定需填写锁定原因，便于后续追溯</li>
              <li>• 分配取消时自动释放锁定，考位恢复可用</li>
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
                  viewingSeat.isLocked
                    ? "bg-gradient-to-br from-warning-500 to-warning-700"
                    : viewingSeat.status === "occupied"
                    ? "bg-gradient-to-br from-primary-500 to-primary-700"
                    : "bg-gradient-to-br from-emerald-500 to-emerald-700"
                }`}
              >
                {viewingSeat.isLocked ? (
                  <Lock size={28} className="text-white" />
                ) : viewingSeat.status === "occupied" ? (
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
                <p className="text-xs text-slate-500">状态</p>
                <p className="font-semibold mt-0.5">
                  {viewingSeat.isLocked
                    ? "已锁定"
                    : viewingSeat.status === "occupied"
                    ? "已占用"
                    : viewingSeat.status === "disabled"
                    ? "不可用"
                    : "空闲可用"}
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

            {viewingSeat.status === "available" && !viewingSeat.isLocked && (
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
