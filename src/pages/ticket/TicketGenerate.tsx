import React, { useState, useEffect } from "react";
import { useExamStore } from "@/store/useExamStore";
import {
  TicketCheck,
  Users,
  FileText,
  CheckCircle2,
  Loader2,
  AlertCircle,
  GraduationCap,
  Calendar,
  MapPin,
  Clock,
} from "lucide-react";
import Modal from "@/components/Modal";

const TicketGenerate: React.FC = () => {
  const {
    exams,
    assignments,
    tickets,
    generateTicket,
    generateTicketsBatch,
    initData,
  } = useExamStore();

  const [selectedExamId, setSelectedExamId] = useState<string>(
    exams[0]?.id || ""
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewTicket, setPreviewTicket] = useState<string | null>(null);
  const [result, setResult] = useState<{
    success: number;
    failed: number;
  } | null>(null);

  useEffect(() => {
    initData();
  }, [initData]);

  useEffect(() => {
    if (exams.length > 0 && !selectedExamId) {
      setSelectedExamId(exams[0].id);
    }
  }, [exams, selectedExamId]);

  const selectedExam = exams.find((e) => e.id === selectedExamId);
  const examAssignments = assignments.filter(
    (a) => a.examId === selectedExamId && a.status === "completed"
  );
  const generatedTickets = tickets.filter(
    (t) => t.examId === selectedExamId
  );
  const pendingCount = examAssignments.length - generatedTickets.length;

  const handleBatchGenerate = async () => {
    setIsGenerating(true);
    setResult(null);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const resultData = generateTicketsBatch(selectedExamId);
    setResult(resultData);
    setIsGenerating(false);
  };

  const getTicketPreview = () => {
    if (!previewTicket) return null;
    return tickets.find((t) => t.id === previewTicket);
  };

  const ticketPreview = getTicketPreview();

  const stats = {
    totalAssignments: examAssignments.length,
    generated: generatedTickets.length,
    pending: pendingCount,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">准考证生成</h1>
        <p className="text-slate-500 text-sm mt-1">
          为已分配考位的考生批量生成准考证
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center">
              <Users size={22} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500">待生成考生</p>
              <p className="text-2xl font-bold text-slate-800">
                {stats.pending}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
              <TicketCheck size={22} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500">已生成</p>
              <p className="text-2xl font-bold text-emerald-600">
                {stats.generated}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <FileText size={22} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500">分配总数</p>
              <p className="text-2xl font-bold text-primary-600">
                {stats.totalAssignments}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              选择考试场次
            </label>
            <select
              value={selectedExamId}
              onChange={(e) => {
                setSelectedExamId(e.target.value);
                setResult(null);
              }}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            >
              {exams.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} - {new Date(e.startTime).toLocaleDateString("zh-CN")}
                </option>
              ))}
            </select>
          </div>

          {selectedExam && (
            <div className="flex-1 p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar size={14} />
                {new Date(selectedExam.startTime).toLocaleString("zh-CN")}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                <Clock size={14} />
                时长 {selectedExam.duration} 分钟
              </div>
            </div>
          )}
        </div>

        {result && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
            <CheckCircle2 size={22} className="text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-800">生成完成！</p>
              <p className="text-sm text-emerald-700 mt-0.5">
                成功生成 {result.success} 张准考证
                {result.failed > 0 && `，失败 ${result.failed} 张`}
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleBatchGenerate}
            disabled={isGenerating || pendingCount === 0}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-primary text-white rounded-xl font-medium hover:shadow-lg hover:shadow-primary-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                正在生成中...
              </>
            ) : (
              <>
                <TicketCheck size={20} />
                批量生成准考证 ({pendingCount})
              </>
            )}
          </button>

          {generatedTickets.length > 0 && (
            <button
              onClick={() => setPreviewTicket(generatedTickets[0]?.id || "")}
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
            >
              <FileText size={20} />
              预览准考证
            </button>
          )}
        </div>

        {pendingCount === 0 && generatedTickets.length > 0 && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-sm text-emerald-700">
            <CheckCircle2 size={16} />
            该场次所有考生准考证已生成完毕
          </div>
        )}

        {examAssignments.length === 0 && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-sm text-amber-700">
            <AlertCircle size={16} />
            该考试场次暂无已分配考位的考生，请先完成考位编排
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-2xl p-6 border border-primary-200/50">
        <h3 className="font-semibold text-primary-800 mb-4 flex items-center gap-2">
          <GraduationCap size={20} />
          准考证内容说明
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="p-4 bg-white/80 rounded-xl">
            <p className="font-medium text-slate-800">考生信息</p>
            <p className="text-slate-500 text-xs mt-1">
              姓名、身份证号（脱敏）、所属学校
            </p>
          </div>
          <div className="p-4 bg-white/80 rounded-xl">
            <p className="font-medium text-slate-800">考试信息</p>
            <p className="text-slate-500 text-xs mt-1">
              考试名称、考试科目、考试时间
            </p>
          </div>
          <div className="p-4 bg-white/80 rounded-xl">
            <p className="font-medium text-slate-800">考位信息</p>
            <p className="text-slate-500 text-xs mt-1">
              考点名称、考场名称、座位号、几排几列
            </p>
          </div>
          <div className="p-4 bg-white/80 rounded-xl">
            <p className="font-medium text-slate-800">准考证信息</p>
            <p className="text-slate-500 text-xs mt-1">
              准考证号、生成时间、注意事项
            </p>
          </div>
        </div>
      </div>

      <Modal
        isOpen={!!previewTicket}
        onClose={() => setPreviewTicket(null)}
        title="准考证预览"
        size="lg"
      >
        {ticketPreview && (
          <div className="space-y-4">
            <div
              id="ticket-preview"
              className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 border-2 border-primary-200 shadow-lg"
            >
              <div className="text-center mb-6 pb-4 border-b-2 border-dashed border-slate-200">
                <h2 className="text-2xl font-bold text-primary-700">
                  准考证
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Examination Admission Ticket
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500">姓名</p>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {ticketPreview.studentName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">准考证号</p>
                  <p className="font-semibold text-primary-600 mt-0.5">
                    {ticketPreview.ticketNo}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">身份证号</p>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {ticketPreview.idCard}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">所属学校</p>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {ticketPreview.school || "-"}
                  </p>
                </div>
              </div>

              <div className="my-5 py-4 px-4 bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl">
                <p className="text-xs text-slate-500 mb-2">考试信息</p>
                <p className="font-bold text-lg text-slate-800">
                  {ticketPreview.examName}
                </p>
                <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-primary-500" />
                    <span className="text-slate-700">
                      {ticketPreview.examDate}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-primary-500" />
                    <span className="text-slate-700">
                      {ticketPreview.examTime}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="p-3 bg-slate-50 rounded-lg text-center">
                  <p className="text-xs text-slate-500">考点</p>
                  <p className="font-semibold text-slate-800 mt-1">
                    {ticketPreview.examRoomName}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg text-center">
                  <p className="text-xs text-slate-500">考场</p>
                  <p className="font-semibold text-slate-800 mt-1">
                    {ticketPreview.building}
                  </p>
                </div>
                <div className="p-3 bg-primary-100 rounded-lg text-center">
                  <p className="text-xs text-primary-600">座位号</p>
                  <p className="font-bold text-xl text-primary-700 mt-1">
                    {ticketPreview.seatNo}
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
                  {new Date(ticketPreview.generatedAt).toLocaleString("zh-CN")}
                </span>
                <MapPin size={14} />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  const element = document.getElementById("ticket-preview");
                  if (element) {
                    window.print();
                  }
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-primary text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all"
              >
                <FileText size={16} />
                打印准考证
              </button>
              <button
                onClick={() => setPreviewTicket(null)}
                className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
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

export default TicketGenerate;
