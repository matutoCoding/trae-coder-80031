import React, { useState, useEffect } from "react";
import { useExamStore } from "@/store/useExamStore";
import {
  AlertTriangle,
  Check,
  Clock,
  User,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

const Conflicts: React.FC = () => {
  const {
    conflicts,
    students,
    exams,
    seats,
    assignments,
    resolveConflict,
    cancelAssignment,
    initData,
  } = useExamStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    initData();
  }, [initData]);

  const filteredConflicts = conflicts.filter((c) => {
    const student = students.find((s) => s.id === c.studentId);
    const matchesSearch =
      student?.name.includes(searchTerm) ||
      c.reason.includes(searchTerm) ||
      searchTerm === "";
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "resolved" && c.resolved) ||
      (statusFilter === "pending" && !c.resolved);
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: conflicts.length,
    pending: conflicts.filter((c) => !c.resolved).length,
    resolved: conflicts.filter((c) => c.resolved).length,
  };

  const getStudent = (id: string) => students.find((s) => s.id === id);
  const getExam = (id: string) => exams.find((e) => e.id === id);

  const detectDuplicateAssignments = () => {
    const seatMap = new Map<string, string[]>();
    assignments
      .filter((a) => a.status !== "cancelled")
      .forEach((a) => {
        const existing = seatMap.get(a.seatId) || [];
        existing.push(a.studentId);
        seatMap.set(a.seatId, existing);
      });

    const duplicates: Array<{
      seatId: string;
      studentIds: string[];
    }> = [];
    seatMap.forEach((studentIds, seatId) => {
      if (studentIds.length > 1) {
        duplicates.push({ seatId, studentIds });
      }
    });
    return duplicates;
  };

  const duplicateAssignments = detectDuplicateAssignments();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">冲突拦截</h1>
          <p className="text-slate-500 text-sm mt-1">
            查看和处理分配过程中的冲突记录，防止重复撮合
          </p>
        </div>
        <button
          onClick={() => {
            if (confirm("检测是否存在重复分配？")) {
              // 模拟检测
              alert(
                duplicateAssignments.length > 0
                  ? `检测到 ${duplicateAssignments.length} 个重复分配！`
                  : "未检测到重复分配，系统运行正常"
              );
            }
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-primary text-white rounded-xl font-medium hover:shadow-lg hover:shadow-primary-600/30 transition-all"
        >
          <RefreshCw size={18} />
          冲突检测
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center">
              <AlertTriangle size={22} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500">冲突总数</p>
              <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-warning-500 to-warning-700 flex items-center justify-center">
              <Clock size={22} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500">待处理</p>
              <p className="text-2xl font-bold text-warning-600">{stats.pending}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
              <CheckCircle2 size={22} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500">已解决</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.resolved}</p>
            </div>
          </div>
        </div>
      </div>

      {duplicateAssignments.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <XCircle size={22} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-800">
                检测到 {duplicateAssignments.length} 个重复分配！
              </h3>
              <p className="text-sm text-red-700 mt-1">
                以下考位被分配给多名考生，请及时处理：
              </p>
              <div className="mt-3 space-y-2">
                {duplicateAssignments.map((dup) => {
                  const seat = seats.find((s) => s.id === dup.seatId);
                  return (
                    <div
                      key={dup.seatId}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200"
                    >
                      <div>
                        <p className="font-medium text-slate-800">
                          {seat?.seatNo || "未知考位"}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          涉及考生:{" "}
                          {dup.studentIds
                            .map((sid) => getStudent(sid)?.name)
                            .join(", ")}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm("取消此考位的所有分配？")) {
                            assignments
                              .filter(
                                (a) =>
                                  a.seatId === dup.seatId &&
                                  a.status !== "cancelled"
                              )
                              .forEach((a) => cancelAssignment(a.id));
                          }
                        }}
                        className="px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 transition-colors"
                      >
                        全部取消
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="搜索考生或冲突原因..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              >
                <option value="all">全部状态</option>
                <option value="pending">待处理</option>
                <option value="resolved">已解决</option>
              </select>
            </div>
          </div>
        </div>

        {filteredConflicts.length === 0 ? (
          <div className="p-16 text-center">
            <CheckCircle2 size={48} className="mx-auto text-emerald-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-700">
              暂无冲突记录
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              系统分配运行正常，所有考位互斥锁定生效
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredConflicts.map((conflict) => {
              const student = getStudent(conflict.studentId);
              const exam = getExam(conflict.examId);

              return (
                <div
                  key={conflict.id}
                  className={`p-5 hover:bg-slate-50/50 transition-colors ${
                    conflict.resolved ? "opacity-70" : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        conflict.resolved
                          ? "bg-emerald-100"
                          : "bg-warning-100"
                      }`}
                    >
                      {conflict.resolved ? (
                        <Check size={20} className="text-emerald-600" />
                      ) : (
                        <AlertTriangle size={20} className="text-warning-600" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <User size={14} />
                          {student?.name || "未知考生"}
                        </span>
                        {student?.school && (
                          <span className="px-2 py-0.5 bg-accent-50 text-accent-700 rounded text-xs">
                            {student.school}
                          </span>
                        )}
                        {conflict.resolved ? (
                          <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                            已解决
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-warning-50 text-warning-700 rounded-full text-xs font-medium">
                            待处理
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-2">
                        <span>{exam?.name || "未知考试"}</span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(conflict.timestamp).toLocaleString(
                            "zh-CN"
                          )}
                        </span>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm text-slate-600">
                          <span className="font-medium text-slate-700">
                            冲突原因:{" "}
                          </span>
                          {conflict.reason}
                        </p>
                      </div>

                      {!conflict.resolved && (
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => resolveConflict(conflict.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white text-xs font-medium rounded-lg hover:bg-emerald-600 transition-colors"
                          >
                            <Check size={14} />
                            标记已解决
                          </button>
                          <button className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors">
                            人工干预
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-2xl p-5 border border-primary-200/50">
        <h3 className="font-semibold text-primary-800 mb-3 flex items-center gap-2">
          <ShieldCheck size={20} />
          互斥锁定保障机制
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white/80 rounded-xl backdrop-blur-sm">
            <p className="font-medium text-slate-800 text-sm">分配前校验</p>
            <p className="text-xs text-slate-500 mt-1">
              分配前检查考位锁定状态和考生分配记录
            </p>
          </div>
          <div className="p-4 bg-white/80 rounded-xl backdrop-blur-sm">
            <p className="font-medium text-slate-800 text-sm">实时锁定</p>
            <p className="text-xs text-slate-500 mt-1">
              分配成功立即锁定，防止并发重复分配
            </p>
          </div>
          <div className="p-4 bg-white/80 rounded-xl backdrop-blur-sm">
            <p className="font-medium text-slate-800 text-sm">定期巡检</p>
            <p className="text-xs text-slate-500 mt-1">
              系统定时检测重复分配，确保数据一致性
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Conflicts;
