import type React from "react";

interface StatusBadgeProps {
  status: "active" | "inactive";
  children: React.ReactNode;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  children,
}) => {
  const baseClasses =
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
  const statusClasses =
    status === "active"
      ? "bg-green-100 text-green-800"
      : "bg-gray-100 text-gray-800";

  return <span className={`${baseClasses} ${statusClasses}`}>{children}</span>;
};
