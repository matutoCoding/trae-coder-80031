import React, { useState, useEffect } from "react";
import { useExamStore } from "@/store/useExamStore";
import { Plus, Building2, Trash2, Eye, Edit2, MapPin, Armchair } from "lucide-react";
import Modal from "@/components/Modal";
import SeatGrid from "@/components/SeatGrid";
import { generateId } from "@/data/mockData";
import { ExamRoom } from "@/types";

const ExamRooms: React.FC = () => {
  const { examRooms, seats, addExamRoom, deleteExamRoom, initData } = useExamStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingRoom, setViewingRoom] = useState<ExamRoom | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    building: "",
    floor: 1,
    rows: 6,
    cols: 6,
  });

  useEffect(() => {
    initData();
  }, [initData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const room: ExamRoom = {
      ...formData,
      id: generateId(),
      totalSeats: formData.rows * formData.cols,
      createdAt: new Date(),
    };
    addExamRoom(room);
    setIsModalOpen(false);
    setFormData({ name: "", building: "", floor: 1, rows: 6, cols: 6 });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">考场管理</h1>
          <p className="text-slate-500 text-sm mt-1">管理考场资源与座位布局</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-primary text-white rounded-xl font-medium hover:shadow-lg hover:shadow-primary-600/30 transition-all duration-200"
        >
          <Plus size={18} />
          新增考场
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {examRooms.map((room) => {
          const roomSeats = seats.filter((s) => s.roomId === room.id);
          const occupied = roomSeats.filter((s) => s.status === "occupied").length;
          const occupancyRate =
            room.totalSeats > 0
              ? ((occupied / room.totalSeats) * 100).toFixed(0)
              : "0";

          return (
            <div
              key={room.id}
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-600/25">
                  <Building2 size={24} className="text-white" />
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setViewingRoom(room)}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-primary-600 transition-colors"
                    title="查看座位图"
                  >
                    <Eye size={18} />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-accent-600 transition-colors">
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("确定删除该考场吗？")) deleteExamRoom(room.id);
                    }}
                    className="p-2 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-slate-800 mb-1">
                {room.name}
              </h3>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <MapPin size={14} />
                  <span>
                    {room.building} · {room.floor}楼
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Armchair size={14} />
                  <span>
                    {room.rows}排 × {room.cols}列 · {room.totalSeats}个座位
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-500">占用率</span>
                  <span className="font-semibold text-slate-700">
                    {occupied}/{room.totalSeats} ({occupancyRate}%)
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500"
                    style={{ width: `${occupancyRate}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="新增考场"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              考场名称
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              placeholder="如：7号考场"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              所在楼栋
            </label>
            <input
              type="text"
              required
              value={formData.building}
              onChange={(e) =>
                setFormData({ ...formData, building: e.target.value })
              }
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              placeholder="如：教学楼A"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              楼层
            </label>
            <input
              type="number"
              min="1"
              required
              value={formData.floor}
              onChange={(e) =>
                setFormData({ ...formData, floor: Number(e.target.value) })
              }
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                排数
              </label>
              <input
                type="number"
                min="1"
                max="15"
                required
                value={formData.rows}
                onChange={(e) =>
                  setFormData({ ...formData, rows: Number(e.target.value) })
                }
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                列数
              </label>
              <input
                type="number"
                min="1"
                max="15"
                required
                value={formData.cols}
                onChange={(e) =>
                  setFormData({ ...formData, cols: Number(e.target.value) })
                }
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
            </div>
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

      <Modal
        isOpen={!!viewingRoom}
        onClose={() => setViewingRoom(null)}
        title={viewingRoom ? `${viewingRoom.name} - 座位图` : ""}
        size="lg"
      >
        {viewingRoom && (
          <SeatGrid
            seats={seats.filter((s) => s.roomId === viewingRoom.id)}
            rows={viewingRoom.rows}
            cols={viewingRoom.cols}
          />
        )}
      </Modal>
    </div>
  );
};

export default ExamRooms;
