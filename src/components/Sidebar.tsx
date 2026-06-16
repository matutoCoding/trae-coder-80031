import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Shuffle,
  Lock,
  Ticket,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavChild {
  path: string;
  label: string;
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  to?: string;
  children?: NavChild[];
}

const iconMap: Record<string, React.ReactNode> = {
  dashboard: <LayoutDashboard size={20} />,
  scheduling: <CalendarDays size={20} />,
  assignment: <Shuffle size={20} />,
  locking: <Lock size={20} />,
  ticket: <Ticket size={20} />,
};

const navConfig = [
  { key: "dashboard", label: "数据概览", icon: "dashboard", path: "/dashboard" },
  {
    key: "scheduling",
    label: "考位排期",
    icon: "scheduling",
    children: [
      { path: "/scheduling/exam-rooms", label: "考场管理" },
      { path: "/scheduling/seats", label: "考位建档" },
      { path: "/scheduling/exams", label: "考试场次" },
    ],
  },
  {
    key: "assignment",
    label: "自动分配",
    icon: "assignment",
    children: [
      { path: "/assignment/students", label: "考生管理" },
      { path: "/assignment/auto", label: "智能编排" },
    ],
  },
  {
    key: "locking",
    label: "互斥锁定",
    icon: "locking",
    children: [
      { path: "/locking/matrix", label: "锁定矩阵" },
      { path: "/locking/conflicts", label: "冲突拦截" },
    ],
  },
  {
    key: "ticket",
    label: "准考管理",
    icon: "ticket",
    children: [
      { path: "/ticket/generate", label: "准考证生成" },
      { path: "/ticket/list", label: "准考证列表" },
    ],
  },
];

const NavItem: React.FC<NavItemProps> = ({ icon, label, to, children }) => {
  const location = useLocation();
  const [expanded, setExpanded] = React.useState(
    children ? children.some((c) => location.pathname.startsWith(c.path)) : false
  );

  if (children) {
    return (
      <div className="mb-1">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-primary-700 transition-all duration-200 group"
        >
          <div className="flex items-center gap-3">
            <span className="text-slate-500 group-hover:text-primary-600 transition-colors">
              {icon}
            </span>
            <span className="font-medium text-sm">{label}</span>
          </div>
          <ChevronRight
            size={16}
            className={cn(
              "text-slate-400 transition-transform duration-200",
              expanded && "rotate-90"
            )}
          />
        </button>
        {expanded && (
          <div className="mt-1 ml-4 pl-4 border-l border-slate-200 space-y-0.5">
            {children.map((child) => (
              <NavLink
                key={child.path}
                to={child.path}
                className={({ isActive }) =>
                  cn(
                    "block px-3 py-2 rounded-md text-sm transition-all duration-200",
                    isActive
                      ? "bg-primary-50 text-primary-700 font-medium"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  )
                }
              >
                {child.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={to || "/"}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all duration-200",
          isActive
            ? "bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-600/25"
            : "text-slate-600 hover:bg-slate-100 hover:text-primary-700"
        )
      }
    >
      <span>{icon}</span>
      <span className="font-medium text-sm">{label}</span>
    </NavLink>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose }) => {
  return (
    <aside
      className={cn(
        "fixed lg:static inset-y-0 left-0 z-40 w-64 h-screen bg-white border-r border-slate-200 flex flex-col shadow-sm transform transition-transform duration-300",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
    >
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg shadow-primary-600/30">
            <Users className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">考试院</h1>
            <p className="text-xs text-slate-500">座位编排系统</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 overflow-y-auto scrollbar-thin">
        {navConfig.map((item) => (
          <NavItem
            key={item.key}
            icon={iconMap[item.icon]}
            label={item.label}
            to={item.path}
            children={item.children as NavChild[]}
          />
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
          <div className="w-9 h-9 rounded-full bg-gradient-accent flex items-center justify-center text-white font-semibold text-sm">
            管
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-700 truncate">管理员</p>
            <p className="text-xs text-slate-500 truncate">admin@exam.gov</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
