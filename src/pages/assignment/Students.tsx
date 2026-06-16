import React, { useState, useEffect } from "react";
import { useExamStore } from "@/store/useExamStore";
import {
  Plus,
  Users,
  Search,
  Upload,
  Trash2,
  Building2,
  Filter,
} from "lucide-react";
import Modal from "@/components/Modal";
import { generateId } from "@/data/mockData";
import { Student } from "@/types";

const Students: React.FC = () => {
  const {
    exams,
    students,
    assignments,
    addStudent,
    addStudentsBatch,
    deleteStudent,
    initData,
  } = useExamStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [examFilter, setExamFilter] = useState("all");
  const [formData, setFormData] = useState({
    name: "",
    idCard: "",
    school: "",
    examId: exams[0]?.id || "",
  });

  useEffect(() => {
    initData();
  }, [initData]);

  useEffect(() => {
    if (exams.length > 0 && !formData.examId) {
      setFormData((prev) => ({ ...prev, examId: exams[0].id }));
    }
  }, [exams, formData.examId]);

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.idCard.includes(searchTerm) ||
      s.school.includes(searchTerm);
    const matchesExam = examFilter === "all" || s.examId === examFilter;
    return matchesSearch && matchesExam;
  });

  const getStudentAssignment = (studentId: string) => {
    return assignments.find(
      (a) => a.studentId === studentId && a.status !== "cancelled"
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const student: Student = {
      ...formData,
      id: generateId(),
    };
    addStudent(student);
    setIsModalOpen(false);
    setFormData({ name: "", idCard: "", school: "", examId: exams[0]?.id || "" });
  };

  const handleImportDemo = () => {
    const demoSchools = ["实验中学", "第一中学", "育才学校", "新华中学"];
    const demoNames = ["王小明", "李华", "张伟", "刘芳", "陈静", "杨帆", "赵磊", "周敏"];
    const newStudents: Student[] = [];
    for (let i = 0; i < 20; i++) {
      newStudents.push({
        id: generateId(),
        name: demoNames[Math.floor(Math.random() * demoNames.length)] + (i + 1),
        idCard: `3201${Math.floor(Math.random() * 1000000000000).toString().padStart(14, "0")}`,
        school: demoSchools[Math.floor(Math.random() * demoSchools.length)],
        examId: exams[Math.floor(Math.random() * exams.length)]?.id || exams[0].id,
      });
    }
    addStudentsBatch(newStudents);
  };

  const schoolStats = () => {
    const map = new Map<string, number>();
    filteredStudents.forEach((s) => {
      map.set(s.school, (map.get(s.school) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">考生管理</h1>
          <p className="text-slate-500 text-sm mt-1">管理考生报名信息与分配状态</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleImportDemo}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
          >
            <Upload size={18} />
            导入演示数据
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-primary text-white rounded-xl font-medium hover:shadow-lg hover:shadow-primary-600/30 transition-all duration-200"
          >
            <Plus size={18} />
            新增考生
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <Users size={22} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500">考生总数</p>
              <p className="text-2xl font-bold text-slate-800">{students.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
            <div>
              <p className="text-sm text-slate-500">已分配</p>
              <p className="text-2xl font-bold text-emerald-600">
                {assignments.filter((a) => a.status !== "cancelled").length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-warning-500 to-warning-700 flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
            <div>
              <p className="text-sm text-slate-500">待分配</p>
              <p className="text-2xl font-bold text-warning-600">
                {
                  students.filter(
                    (s) => !assignments.some((a) => a.studentId === s.id && a.status !== "cancelled")
                  ).length
                }
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center">
              <Building2 size={22} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500">涉及学校</p>
              <p className="text-2xl font-bold text-accent-600">
                {new Set(students.map((s) => s.school)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="搜索姓名、身份证号、学校..."
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

          <div className="overflow-x-auto max-h-[500px] overflow-y-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-sm">
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="px-5 py-3 font-medium">考生信息</th>
                  <th className="px-5 py-3 font-medium">身份证号</th>
                  <th className="px-5 py-3 font-medium">学校</th>
                  <th className="px-5 py-3 font-medium">考试场次</th>
                  <th className="px-5 py-3 font-medium">分配状态</th>
                  <th className="px-5 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => {
                  const assignment = getStudentAssignment(student.id);
                  const exam = exams.find((e) => e.id === student.examId);
                  return (
                    <tr
                      key={student.id}
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-medium">
                            {student.name.charAt(0)}
                          </div>
                          <span className="font-medium text-slate-800">
                            {student.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600 font-mono text-xs">
                        {student.idCard.replace(/(\d{6})\d{8}(\d{4})/, "$1********$2")}
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 bg-accent-50 text-accent-700 rounded-full text-xs font-medium">
                          {student.school}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600 text-xs">
                        {exam?.name || "-"}
                      </td>
                      <td className="px-5 py-4">
                        {assignment ? (
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                            已分配
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-warning-50 text-warning-700 rounded-full text-xs font-medium">
                            待分配
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => {
                            if (confirm("确定删除该考生吗？")) deleteStudent(student.id);
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 h-fit">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">学校分布</h3>
          <div className="space-y-3">
            {schoolStats().map(([school, count]) => {
              const max = Math.max(...schoolStats().map((s) => s[1]));
              const percent = (count / max) * 100;
              return (
                <div key={school}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-slate-600">{school}</span>
                    <span className="font-semibold text-slate-700">{count}人</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-400 to-accent-400 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="新增考生"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              考生姓名
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              placeholder="请输入考生姓名"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              身份证号
            </label>
            <input
              type="text"
              required
              maxLength={18}
              value={formData.idCard}
              onChange={(e) => setFormData({ ...formData, idCard: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              placeholder="请输入身份证号"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              所在学校
            </label>
            <input
              type="text"
              required
              value={formData.school}
              onChange={(e) => setFormData({ ...formData, school: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              placeholder="请输入学校名称"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              选择考试
            </label>
            <select
              required
              value={formData.examId}
              onChange={(e) => setFormData({ ...formData, examId: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            >
              {exams.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
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
              确认添加
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Students;
