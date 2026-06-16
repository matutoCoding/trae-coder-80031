import React, { useState, useEffect, useMemo } from "react";
import { useExamStore } from "@/store/useExamStore";
import {
  Shuffle,
  Play,
  Check,
  X,
  AlertTriangle,
  Building2,
  Users,
  Armchair,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  School,
  BarChart3,
} from "lucide-react";
import SeatGrid from "@/components/SeatGrid";
import Modal from "@/components/Modal";
import { AllocationResult, Seat as SeatType } from "@/types";

const AutoAllocation: React.FC = () => {
  const {
    exams,
    examRooms,
    seats,
    students,
    assignments,
    allocationConfig,
    runAutoAllocation,
    confirmAssignment,
    confirmAllAssignments,
    cancelAssignment,
    updateAllocationConfig,
    initData,
    getOverlappingExamIds,
    getAvailableSeatsForExam,
    getRoomOccupancyForExam,
  } = useExamStore();

  const [selectedExamId, setSelectedExamId] = useState(exams[0]?.id || "");
  const [lastResult, setLastResult] = useState<AllocationResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [viewingSeat, setViewingSeat] = useState<SeatType | null>(null);

  useEffect(() => {
    initData();
  }, [initData]);

  useEffect(() => {
    if (exams.length > 0 && !selectedExamId) {
      setSelectedExamId(exams[0].id);
    }
    if (examRooms.length > 0 && !selectedRoomId) {
      setSelectedRoomId(examRooms[0].id);
    }
  }, [exams, examRooms, selectedExamId, selectedRoomId]);

  const currentExam = exams.find((e) => e.id === selectedExamId);
  const currentRoom = examRooms.find((r) => r.id === selectedRoomId);
  const examStudents = students.filter((s) => s.examId === selectedExamId);
  const examAssignments = assignments.filter(
    (a) => a.examId === selectedExamId && a.status !== "cancelled"
  );
  const unassignedStudents = examStudents.filter(
    (s) => !examAssignments.some((a) => a.studentId === s.id)
  );
  const confirmedCount = examAssignments.filter(
    (a) => a.status === "confirmed"
  ).length;
  const pendingCount = examAssignments.filter(
    (a) => a.status === "pending"
  ).length;

  const availableSeats = useMemo(
    () => (selectedExamId ? getAvailableSeatsForExam(selectedExamId) : []),
    [selectedExamId, assignments, seats, exams]
  );

  const overlappingExamIds = useMemo(
    () => (selectedExamId ? getOverlappingExamIds(selectedExamId) : new Set()),
    [selectedExamId, exams, assignments]
  );

  const occupiedOtherSeatIds = useMemo(() => {
    const ids = new Set<string>();
    assignments.forEach((a) => {
      if (
        a.status !== "cancelled" &&
        a.examId !== selectedExamId &&
        overlappingExamIds.has(a.examId)
      ) {
        ids.add(a.seatId);
      }
    });
    return ids;
  }, [assignments, overlappingExamIds, selectedExamId]);

  const roomOccupancy = useMemo(
    () => (selectedExamId ? getRoomOccupancyForExam(selectedExamId) : new Map()),
    [selectedExamId, assignments, seats]
  );

  const maxOccupancy = Math.max(...Array.from(roomOccupancy.values()), 0);
  const minOccupancy = Math.min(
    ...Array.from(roomOccupancy.values()).filter((v) => v > 0),
    0
  );

  const handleRunAllocation = () => {
    const result = runAutoAllocation(selectedExamId);
    setLastResult(result);
    setShowResult(true);
  };

  const handleConfirmAll = () => {
    if (lastResult && lastResult.assignments.length > 0) {
      const count = confirmAllAssignments(selectedExamId);
      setLastResult(null);
      setShowResult(false);
    } else {
      if (confirm("确认将该考试所有待确认的分配全部生效？")) {
        confirmAllAssignments(selectedExamId);
      }
    }
  };

  const configOptions = [
    {
      key: "loadBalance",
      label: "负载均衡",
      desc: "各考场人数尽量均等，优先分配人数少的考场",
      icon: <BarChart3 size={18} />,
    },
    {
      key: "avoidFragmentation",
      label: "碎片避免",
      desc: "优先选择连续空闲区域，减少零散碎片考位",
      icon: <Sparkles size={18} />,
    },
    {
      key: "preferContiguous",
      label: "连续优先",
      desc: "在同一考场内优先分配连续的座位",
      icon: <Armchair size={18} />,
    },
    {
      key: "avoidSameSchool",
      label: "同校避开",
      desc: "同校考生不安排相邻座位",
      icon: <School size={18} />,
    },
  ];

  const getStudent = (id: string) => students.find((s) => s.id === id);
  const getSeat = (id: string) => seats.find((s) => s.id === id);
  const getRoom = (id: string) => examRooms.find((r) => r.id === id);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">智能编排</h1>
          <p className="text-slate-500 text-sm mt-1">
            系统自动择优分配考位，负载均衡优先，碎片避免、同校避开
          </p>
        </div>
        {pendingCount > 0 && (
          <button
            onClick={handleConfirmAll}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors"
          >
            <CheckCircle2 size={18} />
            确认全部待确认 ({pendingCount})
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  选择考试场次
                </label>
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                >
                  {exams.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} -{" "}
                      {new Date(e.startTime).toLocaleDateString("zh-CN", {
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:pt-5">
                <button
                  onClick={handleRunAllocation}
                  disabled={unassignedStudents.length === 0}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-primary-600/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play size={18} />
                  开始智能分配
                </button>
              </div>
            </div>

            {currentExam && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-5 pt-5 border-t border-slate-100">
                <div className="text-center p-3 bg-slate-50 rounded-xl">
                  <Users size={18} className="mx-auto mb-1 text-primary-500" />
                  <p className="text-xs text-slate-500">考生总数</p>
                  <p className="text-lg font-bold text-slate-800">
                    {examStudents.length}
                  </p>
                </div>
                <div className="text-center p-3 bg-emerald-50 rounded-xl">
                  <CheckCircle2
                    size={18}
                    className="mx-auto mb-1 text-emerald-500"
                  />
                  <p className="text-xs text-slate-500">已确认</p>
                  <p className="text-lg font-bold text-emerald-600">
                    {confirmedCount}
                  </p>
                </div>
                <div className="text-center p-3 bg-primary-50 rounded-xl">
                  <Armchair size={18} className="mx-auto mb-1 text-primary-500" />
                  <p className="text-xs text-slate-500">待确认</p>
                  <p className="text-lg font-bold text-primary-600">
                    {pendingCount}
                  </p>
                </div>
                <div className="text-center p-3 bg-warning-50 rounded-xl">
                  <AlertTriangle
                    size={18}
                    className="mx-auto mb-1 text-warning-500"
                  />
                  <p className="text-xs text-slate-500">待分配</p>
                  <p className="text-lg font-bold text-warning-600">
                    {unassignedStudents.length}
                  </p>
                </div>
                <div className="text-center p-3 bg-accent-50 rounded-xl">
                  <Sparkles size={18} className="mx-auto mb-1 text-accent-500" />
                  <p className="text-xs text-slate-500">可用考位</p>
                  <p className="text-lg font-bold text-accent-600">
                    {availableSeats.length}
                  </p>
                </div>
              </div>
            )}

            {examRooms.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                  <BarChart3 size={12} /> 各考场分配人数
                  {maxOccupancy > 0 && (
                    <span className="ml-auto">
                      均衡差: {maxOccupancy - minOccupancy}人
                    </span>
                  )}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {examRooms.map((room) => {
                    const occ = roomOccupancy.get(room.id) || 0;
                    const total = seats.filter(
                      (s) => s.roomId === room.id && s.status !== "disabled"
                    ).length;
                    const percent = total > 0 ? (occ / total) * 100 : 0;
                    return (
                      <div
                        key={room.id}
                        className="p-2 bg-slate-50 rounded-lg"
                      >
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="font-medium text-slate-700 truncate max-w-[100px]">
                            {room.name}
                          </span>
                          <span className="text-slate-500">
                            {occ}/{total}
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              percent > 80
                                ? "bg-warning-500"
                                : percent > 50
                                ? "bg-primary-500"
                                : "bg-emerald-500"
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">座位分配预览</h3>
              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              >
                {examRooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            {currentRoom && (
              <SeatGrid
                seats={seats.filter((s) => s.roomId === currentRoom.id)}
                rows={currentRoom.rows}
                cols={currentRoom.cols}
                assignments={assignments.filter(
                  (a) => a.status !== "cancelled"
                )}
                students={students}
                onSeatClick={(seat) => setViewingSeat(seat)}
                examId={selectedExamId}
                occupiedOtherSeatIds={occupiedOtherSeatIds}
              />
            )}
          </div>

          {examAssignments.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800">分配记录</h3>
              </div>
              <div className="overflow-x-auto max-h-80 overflow-y-auto scrollbar-thin">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-sm">
                    <tr className="text-left text-slate-500 border-b border-slate-100">
                      <th className="px-5 py-3 font-medium">考生</th>
                      <th className="px-5 py-3 font-medium">学校</th>
                      <th className="px-5 py-3 font-medium">考场</th>
                      <th className="px-5 py-3 font-medium">座位</th>
                      <th className="px-5 py-3 font-medium">状态</th>
                      <th className="px-5 py-3 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {examAssignments.map((a) => {
                      const student = getStudent(a.studentId);
                      const seat = getSeat(a.seatId);
                      const room = seat ? getRoom(seat.roomId) : null;
                      return (
                        <tr
                          key={a.id}
                          className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50"
                        >
                          <td className="px-5 py-3 font-medium text-slate-800">
                            {student?.name}
                          </td>
                          <td className="px-5 py-3">
                            <span className="px-2 py-0.5 bg-accent-50 text-accent-700 rounded text-xs">
                              {student?.school}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-slate-600">
                            {room?.name}
                          </td>
                          <td className="px-5 py-3 text-slate-600">
                            {seat?.seatNo}
                          </td>
                          <td className="px-5 py-3">
                            {a.status === "confirmed" ? (
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-xs font-medium">
                                已确认
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded text-xs font-medium">
                                待确认
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            {a.status === "pending" && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => confirmAssignment(a.id)}
                                  className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
                                >
                                  <Check size={16} />
                                </button>
                                <button
                                  onClick={() => cancelAssignment(a.id)}
                                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            )}
                            {a.status === "confirmed" && (
                              <button
                                onClick={() => cancelAssignment(a.id)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors text-xs"
                              >
                                取消
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck size={20} className="text-primary-600" />
              <h3 className="font-semibold text-slate-800">分配策略</h3>
            </div>
            <div className="space-y-3">
              {configOptions.map((opt) => (
                <label
                  key={opt.key}
                  className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={
                      allocationConfig[
                        opt.key as keyof typeof allocationConfig
                      ]
                    }
                    onChange={(e) =>
                      updateAllocationConfig({
                        [opt.key]: e.target.checked,
                      })
                    }
                    className="mt-1 w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600">{opt.icon}</span>
                      <span className="font-medium text-slate-800 text-sm">
                        {opt.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary-600 to-accent-600 rounded-2xl p-5 text-white">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Shuffle size={18} />
              分配提示
            </h3>
            <ul className="space-y-2 text-sm text-white/90">
              <li className="flex items-start gap-2">
                <Check size={16} className="mt-0.5 flex-shrink-0" />
                <span>负载均衡优先，各考场人数尽量接近</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={16} className="mt-0.5 flex-shrink-0" />
                <span>不同考试时间的考位可复用，时间重叠才互斥</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={16} className="mt-0.5 flex-shrink-0" />
                <span>同校考生自动错开相邻座位</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={16} className="mt-0.5 flex-shrink-0" />
                <span>确认后才能在准考证生成页生成准考证</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-3">资源概览</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">可用考位</span>
                <span className="font-semibold text-slate-800">
                  {availableSeats.length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">考场数量</span>
                <span className="font-semibold text-slate-800">
                  {examRooms.length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">时间冲突场次</span>
                <span className="font-semibold text-slate-800">
                  {Math.max(0, overlappingExamIds.size - 1)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">覆盖率</span>
                <span className="font-semibold text-slate-800">
                  {examStudents.length > 0
                    ? Math.min(
                        100,
                        Math.round(
                          (examAssignments.length / examStudents.length) * 100
                        )
                      )
                    : 0}
                  %
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showResult}
        onClose={() => setShowResult(false)}
        title="分配结果"
        size="lg"
      >
        {lastResult && (
          <div className="space-y-5">
            <div
              className={`p-5 rounded-2xl ${
                lastResult.success
                  ? "bg-emerald-50 border border-emerald-200"
                  : "bg-warning-50 border border-warning-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    lastResult.success
                      ? "bg-emerald-500"
                      : "bg-warning-500"
                  }`}
                >
                  {lastResult.success ? (
                    <CheckCircle2 size={24} className="text-white" />
                  ) : (
                    <AlertTriangle size={24} className="text-white" />
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-lg text-slate-800">
                    {lastResult.message}
                  </h4>
                  <p className="text-sm text-slate-500 mt-0.5">
                    碎片考位数: {lastResult.fragmentedSeats}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-emerald-50 rounded-xl text-center">
                <p className="text-xs text-emerald-600">成功分配</p>
                <p className="text-2xl font-bold text-emerald-700 mt-1">
                  {lastResult.assignments.length}
                </p>
              </div>
              <div className="p-4 bg-warning-50 rounded-xl text-center">
                <p className="text-xs text-warning-600">冲突数量</p>
                <p className="text-2xl font-bold text-warning-700 mt-1">
                  {lastResult.conflicts.length}
                </p>
              </div>
              <div className="p-4 bg-primary-50 rounded-xl text-center">
                <p className="text-xs text-primary-600">碎片考位</p>
                <p className="text-2xl font-bold text-primary-700 mt-1">
                  {lastResult.fragmentedSeats}
                </p>
              </div>
            </div>

            {lastResult.conflicts.length > 0 && (
              <div>
                <h5 className="font-medium text-slate-700 mb-2">冲突记录</h5>
                <div className="bg-slate-50 rounded-xl p-3 space-y-2 max-h-40 overflow-y-auto scrollbar-thin">
                  {lastResult.conflicts.map((c) => {
                    const s = students.find((st) => st.id === c.studentId);
                    return (
                      <div
                        key={c.id}
                        className="flex items-center justify-between text-sm p-2 bg-white rounded-lg"
                      >
                        <span className="text-slate-700">
                          {s?.name || "未知考生"}
                        </span>
                        <span className="text-warning-600 text-xs">
                          {c.reason}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-3">
              <button
                onClick={() => setShowResult(false)}
                className="flex-1 px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-medium transition-colors"
              >
                稍后确认
              </button>
              {lastResult.assignments.length > 0 && (
                <button
                  onClick={handleConfirmAll}
                  className="flex-1 px-5 py-2.5 bg-gradient-primary text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all"
                >
                  全部确认并生效
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!viewingSeat}
        onClose={() => setViewingSeat(null)}
        title="考位详情"
      >
        {viewingSeat && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-sm text-slate-500">座位号</p>
              <p className="text-xl font-bold text-slate-800 mt-1">
                {viewingSeat.seatNo}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-slate-500 text-xs">考场</p>
                <p className="font-medium text-slate-800 mt-0.5">
                  {getRoom(viewingSeat.roomId)?.name}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-slate-500 text-xs">位置</p>
                <p className="font-medium text-slate-800 mt-0.5">
                  {viewingSeat.rowNum}排 {viewingSeat.colNum}列
                </p>
              </div>
            </div>

            {selectedExamId && (
              <div className="p-4 bg-primary-50 rounded-xl border border-primary-100">
                <p className="text-xs text-primary-600 mb-2">
                  当前考试场次状态
                </p>
                {(() => {
                  const assignment = examAssignments.find(
                    (a) => a.seatId === viewingSeat.id
                  );
                  const isOtherOccupied = occupiedOtherSeatIds.has(
                    viewingSeat.id
                  );
                  if (viewingSeat.status === "disabled")
                    return <p className="font-medium text-slate-500">不可用</p>;
                  if (viewingSeat.isLocked && viewingSeat.lockedBy === "admin")
                    return (
                      <p className="font-medium text-warning-600">
                        已手动锁定: {viewingSeat.lockReason}
                      </p>
                    );
                  if (assignment) {
                    const stu = getStudent(assignment.studentId);
                    return (
                      <div>
                        <p className="font-semibold text-primary-700">
                          已分配给 {stu?.name}
                        </p>
                        <p className="text-xs text-primary-600 mt-0.5">
                          {stu?.school} · 状态:{" "}
                          {assignment.status === "confirmed"
                            ? "已确认"
                            : "待确认"}
                        </p>
                      </div>
                    );
                  }
                  if (isOtherOccupied)
                    return (
                      <p className="font-medium text-slate-600">
                        被其他时间重叠场次占用
                      </p>
                    );
                  return (
                    <p className="font-semibold text-emerald-600">空闲可用</p>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AutoAllocation;
