import React from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  gradient?: string;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  trendUp,
  gradient = "from-primary-600 to-primary-700",
  className,
}) => {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-800">{value}</p>
          {trend && (
            <p
              className={cn(
                "text-xs mt-2 flex items-center gap-1",
                trendUp ? "text-emerald-600" : "text-warning-600"
              )}
            >
              {trend}
            </p>
          )}
        </div>
        <div
          className={cn(
            "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg",
            gradient
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
