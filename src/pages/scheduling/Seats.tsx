import React, { useState, useEffect } from "react";
import { useExamStore } from "@/store/useExamStore";
import { Lock, Unlock, Search, Filter, Armchair, Building2 } from "lucide-react";
import Modal from "@/components/Modal";
import SeatGrid from "@/components/SeatGrid";
import { Seat } from "@/types";

const Seats: React.FC = () => {
  const {
    examRooms,
    seats,
    lockSeat,
    unlockSeat,
    assignments,
    students,
    initData,
  } = useExamStore();

  const [selectedRoomId, setSelectedRoomId] = useState<string>(
    examRooms[0]?.id || ""
  );
  const [viewingSeat, setViewingSeat] = useState<Seat | null>(null);
  const [lockReason, setLockReason] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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

  const filteredSeats = currentSeats.filter((seat) => {
    const matchesSearch =
      seat.seatNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      searchTerm === "";
    let matchesStatus = statusFilter === "all";
    if (statusFilter === "available") {
      matchesStatus = seat.status === "available" && !seat.isLocked;
    } else if (statusFilter === "occupied") {
      matchesStatus = seat.status === "occupied";
    } else if (statusFilter === "locked") {
      matchesStatus = seat.isLocked;
    } else if (statusFilter === "disabled") {
      matchesStatus = seat.status === "disabled";
    }
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: currentSeats.length,
    available: currentSeats.filter(
      (s) => s.status === "available" && !s.isLocked
    ).length,
    occupied: currentSeats.filter((s) => s.status === "occupied").length,
    locked: currentSeats.filter((s) => s.isLocked).length,
  };

  const handleLockSeat = () => {
    if (viewingSeat && lockReason) {
      lockSeat(viewingSeat.id, lockReason);
      setViewingSeat(null);
      setLockReason("");
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
      <div>
        <h1 className="text-2xl font-bold text-slate-800">考位建档</h1>
        <p className="text-slate-500 text-sm mt-1">考位资源建档管理（全局状态），按考试时间维度查看分配请前往「锁定矩阵」</p>
      </div>

      <div className="bg-gradient-to-r from-accent-50 to-primary-50 rounded-2xl p-4 border border-primary-200/50 flex flex-wrap items-center gap-4 text-xs">
        <div className="text-slate-600">
          <span className="font-medium text-slate-800">说明：</span>
          「已占用」为任意场次有分配的考位，实际互斥以「时间重叠」为粒度。
        </div>
        <div className="flex items-center gap-1.5 text-emerald-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          上午/下午非重叠考试可复用同一座位
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">总考位数</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">空闲可用</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {stats.available}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">已占用</p>
          <p className="text-2xl font-bold text-primary-600 mt-1">
            {stats.occupied}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">已锁定</p>
          <p className="text-2xl font-bold text-warning-600 mt-1">
            {stats.locked}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex items-center gap-3">
              <Building2 size={18} className="text-slate-400" />
              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              >
                {examRooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} ({room.building})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="搜索座位号..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                >
                  <option value="all">全部状态</option>
                  <option value="available">空闲</option>
                  <option value="occupied">已占用</option>
                  <option value="locked">已锁定</option>
                  <option value="disabled">不可用</option>
                </select>
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

        {searchTerm || statusFilter !== "all" ? (
          <div className="p-5 border-t border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">
              筛选结果 ({filteredSeats.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-100">
                    <th className="pb-3 font-medium">座位号</th>
                    <th className="pb-3 font-medium">位置</th>
                    <th className="pb-3 font-medium">状态</th>
                    <th className="pb-3 font-medium">考生</th>
                    <th className="pb-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSeats.map((seat) => {
                    const student = getAssignedStudent(seat.id);
                    return (
                      <tr
                        key={seat.id}
                        className="border-b border-slate-50 last:border-0"
                      >
                        <td className="py-3 font-medium text-slate-800">
                          {seat.seatNo}
                        </td>
                        <td className="py-3 text-slate-600">
                          {seat.rowNum}排 {seat.colNum}列
                        </td>
                        <td className="py-3">
                          {seat.isLocked ? (
                            <span className="px-2 py-0.5 bg-warning-50 text-warning-700 rounded-full text-xs font-medium">
                              已锁定
                            </span>
                          ) : seat.status === "occupied" ? (
                            <span className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full text-xs font-medium">
                              已占用
                            </span>
                          ) : seat.status === "disabled" ? (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                              不可用
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                              空闲
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-slate-600">
                          {student ? `${student.name} (${student.school})` : "-"}
                        </td>
                        <td className="py-3">
                          {seat.isLocked ? (
                            <button
                              onClick={() => unlockSeat(seat.id)}
                              className="text-xs text-warning-600 hover:text-warning-700 font-medium"
                            >
                              解锁
                            </button>
                          ) : seat.status === "available" ? (
                            <button
                              onClick={() => setViewingSeat(seat)}
                              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                            >
                              锁定
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>

      <Modal
        isOpen={!!viewingSeat}
        onClose={() => {
          setViewingSeat(null);
          setLockReason("");
        }}
        title="考位详情"
      >
        {viewingSeat && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-600/25">
                <Armchair size={28} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">
                  {viewingSeat.seatNo}
                </h3>
                <p className="text-sm text-slate-500">
                  {examRooms.find((r) => r.id === viewingSeat.roomId)?.name} ·{" "}
                  {viewingSeat.rowNum}排 {viewingSeat.colNum}列
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-500">状态</p>
                <p className="text-sm font-medium mt-1">
                  {viewingSeat.isLocked
                    ? "已锁定"
                    : viewingSeat.status === "occupied"
                    ? "已占用"
                    : viewingSeat.status === "disabled"
                    ? "不可用"
                    : "空闲可用"}
                </p>
              </div>
              {viewingSeat.isLocked && (
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500">锁定原因</p>
                  <p className="text-sm font-medium mt-1">
                    {viewingSeat.lockReason || "-"}
                  </p>
                </div>
              )}
            </div>

            {getAssignedStudent(viewingSeat.id) && (
              <div className="p-4 bg-primary-50 rounded-xl">
                <p className="text-xs text-primary-600 mb-1">分配考生</p>
                <p className="font-medium text-primary-800">
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
                    placeholder="请输入锁定原因"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleLockSeat}
                    disabled={!lockReason}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-warning-500 text-white rounded-xl text-sm font-medium hover:bg-warning-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Lock size={16} />
                    锁定考位
                  </button>
                </div>
              </div>
            )}

            {viewingSeat.isLocked && (
              <button
                onClick={() => {
                  unlockSeat(viewingSeat.id);
                  setViewingSeat(null);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors"
              >
                <Unlock size={16} />
                解锁考位
              </button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Seats;
