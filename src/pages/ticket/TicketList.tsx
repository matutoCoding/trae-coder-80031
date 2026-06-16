import React, { useState, useEffect } from "react";
import { useExamStore } from "@/store/useExamStore";
import {
  TicketCheck,
  Search,
  Filter,
  FileText,
  Download,
  Printer,
  QrCode,
  User,
  Calendar,
  MapPin,
  Building2,
  Clock,
} from "lucide-react";
import Modal from "@/components/Modal";

const TicketList: React.FC = () => {
  const { tickets, exams, initData } = useExamStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [examFilter, setExamFilter] = useState("all");
  const [viewingTicket, setViewingTicket] = useState<string | null>(null);

  useEffect(() => {
    initData();
  }, [initData]);

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.studentName.includes(searchTerm) ||
      t.ticketNo.includes(searchTerm) ||
      t.seatNo.includes(searchTerm) ||
      searchTerm === "";
    const matchesExam = examFilter === "all" || t.examId === examFilter;
    return matchesSearch && matchesExam;
  });

  const getExam = (id: string) => exams.find((e) => e.id === id);
  const viewingTicketData = tickets.find((t) => t.id === viewingTicket);

  const stats = {
    total: tickets.length,
    byExam: exams.map((e) => ({
      exam: e.name,
      count: tickets.filter((t) => t.examId === e.id).length,
    })),
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">准考证列表</h1>
        <p className="text-slate-500 text-sm mt-1">
          查询、打印和下载已生成的准考证
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <TicketCheck size={22} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500">准考证总数</p>
              <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
            </div>
          </div>
        </div>
        {stats.byExam.slice(0, 3).map((s, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                  i === 0
                    ? "bg-gradient-to-br from-accent-500 to-accent-700"
                    : i === 1
                    ? "bg-gradient-to-br from-warning-500 to-warning-700"
                    : "bg-gradient-to-br from-emerald-500 to-emerald-700"
                }`}
              >
                <FileText size={22} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-500 truncate max-w-[120px]">
                  {s.exam}
                </p>
                <p className="text-2xl font-bold text-slate-800">{s.count}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

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
                placeholder="搜索考生姓名、准考证号或座位号..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-slate-400" />
              <select
                value={examFilter}
                onChange={(e) => setExamFilter(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              >
                <option value="all">全部考试</option>
                {exams.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {filteredTickets.length === 0 ? (
          <div className="p-16 text-center">
            <TicketCheck size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-600">
              暂无准考证记录
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              请先在准考证生成页面为考生生成准考证
            </p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      考生信息
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      准考证号
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      考试信息
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      考位
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      生成时间
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTickets.map((ticket) => {
                    const exam = getExam(ticket.examId);
                    return (
                      <tr
                        key={ticket.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                              <User size={16} className="text-white" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">
                                {ticket.studentName}
                              </p>
                              <p className="text-xs text-slate-500">
                                {ticket.idCard}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-mono font-semibold text-primary-600 text-sm">
                            {ticket.ticketNo}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm text-slate-800">
                            {ticket.examName}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                            <Calendar size={10} />
                            {ticket.examDate} {ticket.examTime}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1">
                            <Building2 size={12} className="text-slate-400" />
                            <span className="text-sm text-slate-700">
                              {ticket.examRoomName}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                            <MapPin size={10} />
                            {ticket.building} · {ticket.seatNo}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-500">
                          {new Date(ticket.generatedAt).toLocaleString(
                            "zh-CN",
                            {
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setViewingTicket(ticket.id)}
                              className="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              title="查看详情"
                            >
                              <FileText size={16} />
                            </button>
                            <button
                              className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="打印"
                              onClick={() => {
                                setViewingTicket(ticket.id);
                                setTimeout(() => window.print(), 300);
                              }}
                            >
                              <Printer size={16} />
                            </button>
                            <button
                              className="p-2 text-slate-500 hover:text-accent-600 hover:bg-accent-50 rounded-lg transition-colors"
                              title="下载"
                            >
                              <Download size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-slate-100">
              {filteredTickets.map((ticket) => (
                <div key={ticket.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                        <User size={18} className="text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">
                          {ticket.studentName}
                        </p>
                        <p className="font-mono text-xs text-primary-600">
                          {ticket.ticketNo}
                        </p>
                      </div>
                    </div>
                    <div className="px-2 py-1 bg-primary-50 text-primary-700 rounded text-xs font-medium">
                      {ticket.seatNo}
                    </div>
                  </div>
                  <div className="space-y-1 text-sm text-slate-600 mb-3">
                    <p>
                      <span className="text-slate-500">考试:</span>{" "}
                      {ticket.examName}
                    </p>
                    <p>
                      <span className="text-slate-500">时间:</span>{" "}
                      {ticket.examDate} {ticket.examTime}
                    </p>
                    <p>
                      <span className="text-slate-500">地点:</span>{" "}
                      {ticket.examRoomName} {ticket.building}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewingTicket(ticket.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-primary-50 text-primary-700 rounded-lg text-xs font-medium hover:bg-primary-100 transition-colors"
                    >
                      <FileText size={14} />
                      查看
                    </button>
                    <button
                      onClick={() => {
                        setViewingTicket(ticket.id);
                        setTimeout(() => window.print(), 300);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-100 transition-colors"
                    >
                      <Printer size={14} />
                      打印
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={!!viewingTicket}
        onClose={() => setViewingTicket(null)}
        title="准考证详情"
        size="lg"
      >
        {viewingTicketData && (
          <div className="space-y-4">
            <div
              id="ticket-detail"
              className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 border-2 border-primary-200 shadow-lg"
            >
              <div className="text-center mb-6 pb-4 border-b-2 border-dashed border-slate-200">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <QrCode size={36} className="text-primary-600" />
                  <div>
                    <h2 className="text-2xl font-bold text-primary-700">
                      准考证
                    </h2>
                    <p className="text-xs text-slate-500">
                      Examination Admission Ticket
                    </p>
                  </div>
                  <QrCode size={36} className="text-primary-600" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500">姓名</p>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {viewingTicketData.studentName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">准考证号</p>
                  <p className="font-mono font-semibold text-primary-600 mt-0.5">
                    {viewingTicketData.ticketNo}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">身份证号</p>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {viewingTicketData.idCard}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">所属学校</p>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {viewingTicketData.school || "-"}
                  </p>
                </div>
              </div>

              <div className="my-5 py-4 px-4 bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl">
                <p className="text-xs text-slate-500 mb-2">考试信息</p>
                <p className="font-bold text-lg text-slate-800">
                  {viewingTicketData.examName}
                </p>
                <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-primary-500" />
                    <span className="text-slate-700">
                      {viewingTicketData.examDate}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-primary-500" />
                    <span className="text-slate-700">
                      {viewingTicketData.examTime}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="p-3 bg-slate-50 rounded-lg text-center">
                  <p className="text-xs text-slate-500">考点</p>
                  <p className="font-semibold text-slate-800 mt-1">
                    {viewingTicketData.examRoomName}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg text-center">
                  <p className="text-xs text-slate-500">考场</p>
                  <p className="font-semibold text-slate-800 mt-1">
                    {viewingTicketData.building}
                  </p>
                </div>
                <div className="p-3 bg-primary-100 rounded-lg text-center">
                  <p className="text-xs text-primary-600">座位号</p>
                  <p className="font-bold text-xl text-primary-700 mt-1">
                    {viewingTicketData.seatNo}
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-500 mb-2">考生须知</p>
                <ul className="text-xs text-slate-600 space-y-1">
                  <li>1. 请携带准考证和有效身份证件参加考试</li>
                  <li>2. 请提前30分钟到达考场，开考15分钟后禁止入场</li>
                  <li>3. 请严格遵守考场纪律，违纪者按相关规定处理</li>
                </ul>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                <span>
                  生成时间:{" "}
                  {new Date(
                    viewingTicketData.generatedAt
                  ).toLocaleString("zh-CN")}
                </span>
                <MapPin size={14} />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  const element = document.getElementById("ticket-detail");
                  if (element) {
                    window.print();
                  }
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-primary text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all"
              >
                <Printer size={16} />
                打印准考证
              </button>
              <button
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                <Download size={16} />
                下载PDF
              </button>
              <button
                onClick={() => setViewingTicket(null)}
                className="px-6 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-100 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TicketList;
