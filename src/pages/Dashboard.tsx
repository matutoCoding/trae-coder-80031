import React, { useEffect } from "react";
import { useExamStore } from "@/store/useExamStore";
import StatCard from "@/components/StatCard";
import {
  Building2,
  Armchair,
  Users,
  FileCheck,
  Clock,
  AlertTriangle,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard: React.FC = () => {
  const {
    examRooms,
    seats,
    students,
    assignments,
    exams,
    conflicts,
    tickets,
    initData,
  } = useExamStore();

  useEffect(() => {
    initData();
  }, [initData]);

  const totalSeats = seats.length;
  const occupiedSeats = seats.filter((s) => s.status === "occupied").length;
  const lockedSeats = seats.filter((s) => s.isLocked).length;
  const availableSeats = seats.filter(
    (s) => s.status === "available" && !s.isLocked
  ).length;
  const occupancyRate = totalSeats > 0 ? ((occupiedSeats / totalSeats) * 100).toFixed(1) : "0";
  const unresolvedConflicts = conflicts.filter((c) => !c.resolved).length;
  const upcomingExams = exams.filter((e) => e.status === "upcoming");

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">数据概览</h1>
        <p className="text-slate-500 text-sm mt-1">
          实时监控考位分配状态与系统运行情况
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="考场数量"
          value={examRooms.length}
          icon={<Building2 size={22} />}
          gradient="from-primary-600 to-primary-700"
          trend="共6个考场，264个考位"
        />
        <StatCard
          title="已分配考位"
          value={`${occupiedSeats}/${totalSeats}`}
          icon={<Armchair size={22} />}
          gradient="from-accent-600 to-accent-700"
          trend={`占用率 ${occupancyRate}%`}
          trendUp={Number(occupancyRate) < 80}
        />
        <StatCard
          title="考生总数"
          value={students.length}
          icon={<Users size={22} />}
          gradient="from-warning-600 to-warning-700"
          trend={`已分配 ${assignments.filter(a => a.status !== 'cancelled').length} 人`}
        />
        <StatCard
          title="已发准考证"
          value={tickets.length}
          icon={<FileCheck size={22} />}
          gradient="from-emerald-600 to-emerald-700"
          trend="批量生成中..."
          trendUp
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-slate-800">考位占用情况</h2>
            <Link
              to="/scheduling/seats"
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              查看详情 <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-emerald-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-emerald-700">{availableSeats}</p>
              <p className="text-sm text-emerald-600 mt-1">空闲考位</p>
            </div>
            <div className="bg-primary-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-primary-700">{occupiedSeats}</p>
              <p className="text-sm text-primary-600 mt-1">已占用</p>
            </div>
            <div className="bg-warning-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-warning-700">{lockedSeats}</p>
              <p className="text-sm text-warning-600 mt-1">已锁定</p>
            </div>
          </div>
          <div className="mt-6">
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500"
                style={{ width: `${occupancyRate}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-2 text-right">
              总体使用率 {occupancyRate}%
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-slate-800">系统告警</h2>
            {unresolvedConflicts > 0 && (
              <span className="px-2.5 py-1 bg-warning-100 text-warning-700 text-xs font-medium rounded-full">
                {unresolvedConflicts} 条待处理
              </span>
            )}
          </div>
          <div className="space-y-3">
            {unresolvedConflicts > 0 ? (
              <Link
                to="/locking/conflicts"
                className="flex items-start gap-3 p-3 bg-warning-50 rounded-xl hover:bg-warning-100 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-warning-500 flex items-center justify-center text-white flex-shrink-0">
                  <AlertTriangle size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">分配冲突</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {unresolvedConflicts} 个考位存在冲突，需要人工处理
                  </p>
                </div>
              </Link>
            ) : (
              <div className="text-center py-6 text-slate-400">
                <AlertTriangle size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无告警信息</p>
              </div>
            )}
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
              <div className="w-9 h-9 rounded-lg bg-slate-500 flex items-center justify-center text-white flex-shrink-0">
                <Clock size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800">系统状态</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  编排服务运行正常
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-slate-800">近期考试场次</h2>
          <Link
            to="/scheduling/exams"
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            全部场次 <ChevronRight size={16} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-slate-500 border-b border-slate-100">
                <th className="pb-3 font-medium">考试名称</th>
                <th className="pb-3 font-medium">科目</th>
                <th className="pb-3 font-medium">时间</th>
                <th className="pb-3 font-medium">状态</th>
                <th className="pb-3 font-medium">报名人数</th>
              </tr>
            </thead>
            <tbody>
              {exams.slice(0, 5).map((exam) => {
                const examStudents = students.filter(
                  (s) => s.examId === exam.id
                );
                const statusColors = {
                  upcoming: "bg-accent-50 text-accent-700",
                  ongoing: "bg-emerald-50 text-emerald-700",
                  completed: "bg-slate-100 text-slate-600",
                };
                const statusLabels = {
                  upcoming: "即将开始",
                  ongoing: "进行中",
                  completed: "已结束",
                };
                return (
                  <tr
                    key={exam.id}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50"
                  >
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center">
                          <Calendar size={18} className="text-primary-600" />
                        </div>
                        <span className="font-medium text-slate-800">
                          {exam.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 text-slate-600">{exam.subject}</td>
                    <td className="py-4 text-slate-600 text-sm">
                      {new Date(exam.startTime).toLocaleString("zh-CN", {
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[exam.status]}`}
                      >
                        {statusLabels[exam.status]}
                      </span>
                    </td>
                    <td className="py-4 text-slate-600">
                      {examStudents.length} 人
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
