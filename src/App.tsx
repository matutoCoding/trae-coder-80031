import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Dashboard from "@/pages/Dashboard";
import ExamRooms from "@/pages/scheduling/ExamRooms";
import Seats from "@/pages/scheduling/Seats";
import Exams from "@/pages/scheduling/Exams";
import Students from "@/pages/assignment/Students";
import AutoAllocation from "@/pages/assignment/AutoAllocation";
import LockingMatrix from "@/pages/locking/LockingMatrix";
import Conflicts from "@/pages/locking/Conflicts";
import TicketGenerate from "@/pages/ticket/TicketGenerate";
import TicketList from "@/pages/ticket/TicketList";
import { useExamStore } from "@/store/useExamStore";

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { initData } = useExamStore();

  useEffect(() => {
    initData();
  }, [initData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <Header onMenuToggle={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/scheduling/exam-rooms" element={<ExamRooms />} />
            <Route path="/scheduling/seats" element={<Seats />} />
            <Route path="/scheduling/exams" element={<Exams />} />
            <Route path="/assignment/students" element={<Students />} />
            <Route
              path="/assignment/auto"
              element={<AutoAllocation />}
            />
            <Route
              path="/locking/matrix"
              element={<LockingMatrix />}
            />
            <Route path="/locking/conflicts" element={<Conflicts />} />
            <Route
              path="/ticket/generate"
              element={<TicketGenerate />}
            />
            <Route path="/ticket/list" element={<TicketList />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/*" element={<AppLayout />} />
      </Routes>
    </Router>
  );
}
