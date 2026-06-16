import React, { useState, useEffect } from "react";
import { useExamStore } from "@/store/useExamStore";
import { Plus, Calendar, Clock, Users, Trash2, Edit2 } from "lucide-react";
import Modal from "@/components/Modal";
import { generateId } from "@/data/mockData";
import { Exam } from "@/types";

const Exams: React.FC = () => {
  const { exams, students, addExam, deleteExam, initData } = useExamStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    startTime: "",
    duration: 120,
  });

  useEffect(() => {
    initData();
  }, [initData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const start = new Date(formData.startTime);
    const end = new Date(start.getTime() + formData.duration * 60000);
    const exam: Exam = {
      id: generateId(),
      name: formData.name,
      subject: formData.subject,
      startTime: start,
      endTime: end,
      duration: formData.duration,
      status: "upcoming",
    };
    addExam(exam);
    setIsModalOpen(false);
    setFormData({ name: "", subject: "", startTime: "", duration: 120 });
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusConfig = {
    upcoming: {
      label: "即将开始",
      class: "bg-accent-50 text-accent-700 border-accent-200",
      dot: "bg-accent-500",
    },
    ongoing: {
      label: "进行中",
      class: "bg-emerald-50 text-emerald-700 border-emerald-200",
      dot: "bg-emerald-500",
    },
    completed: {
      label: "已结束",
      class: "bg-slate-50 text-slate-600 border-slate-200",
      dot: "bg-slate-400",
    },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">考试场次</h1>
          <p className="text-slate-500 text-sm mt-1">管理考试时间与场次安排</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-primary text-white rounded-xl font-medium hover:shadow-lg hover:shadow-primary-600/30 transition-all duration-200"
        >
          <Plus size={18} />
          新增考试
        </button>
      </div>

      <div className="space-y-4">
        {exams.map((exam) => {
          const examStudents = students.filter((s) => s.examId === exam.id);
          const config = statusConfig[exam.status];

          return (
            <div
              key={exam.id}
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-200"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                      exam.status === "ongoing"
                        ? "bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-600/30 animate-pulse-slow"
                        : "bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-600/25"
                    }`}
                  >
                    <Calendar size={26} className="text-white" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-slate-800">
                        {exam.name}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.class}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                        {config.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock size={14} />
                        {formatDate(exam.startTime)} - {formatDate(exam.endTime)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded text-xs font-medium">
                          {exam.subject}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        时长 {exam.duration} 分钟
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-center px-4 py-2 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-1 text-slate-500">
                      <Users size={14} />
                      <span className="text-xs">已报名</span>
                    </div>
                    <p className="text-xl font-bold text-slate-800 mt-0.5">
                      {examStudents.length}
                    </p>
                  </div>

                  <div className="flex gap-1">
                    <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-primary-600 transition-colors">
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("确定删除该考试场次吗？")) deleteExam(exam.id);
                      }}
                      className="p-2 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="新增考试场次"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              考试名称
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              placeholder="如：2026年夏季学业水平考试"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              考试科目
            </label>
            <input
              type="text"
              required
              value={formData.subject}
              onChange={(e) =>
                setFormData({ ...formData, subject: e.target.value })
              }
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              placeholder="如：语文、数学"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              开始时间
            </label>
            <input
              type="datetime-local"
              required
              value={formData.startTime}
              onChange={(e) =>
                setFormData({ ...formData, startTime: e.target.value })
              }
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              考试时长（分钟）
            </label>
            <input
              type="number"
              min="30"
              step="30"
              required
              value={formData.duration}
              onChange={(e) =>
                setFormData({ ...formData, duration: Number(e.target.value) })
              }
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-medium transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-primary text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all"
            >
              确认创建
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Exams;
