import React from "react";
import { Bell, Search, Settings, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  className?: string;
  onMenuToggle?: () => void;
}

const Header: React.FC<HeaderProps> = ({ className, onMenuToggle }) => {
  return (
    <header
      className={cn(
        "h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40",
        className
      )}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <Menu size={20} className="text-slate-600" />
        </button>
        <div className="relative hidden md:block">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="搜索考场、考生、考位..."
            className="w-72 pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <Settings size={20} className="text-slate-600" />
        </button>
        <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <Bell size={20} className="text-slate-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-warning-500 rounded-full"></span>
        </button>
        <div className="ml-2 pl-4 border-l border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-semibold">
              管
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-slate-700">管理员</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
