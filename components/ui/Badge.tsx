import { HTMLAttributes } from "react";
import { RequestStatus, Severity } from "@prisma/client";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "status" | "severity";
  status?: RequestStatus;
  severity?: Severity;
}

export default function Badge({
  variant = "default",
  status,
  severity,
  children,
  className = "",
  ...props
}: BadgeProps) {
  const baseStyles =
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";

  // Status badge colors
  const statusStyles = {
    PENDING: "bg-yellow-100 text-yellow-800",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    RESOLVED: "bg-green-100 text-green-800",
    CLOSED: "bg-gray-100 text-gray-800",
  };

  // Severity badge colors
  const severityStyles = {
    LOW: "bg-green-100 text-green-800",
    MEDIUM: "bg-yellow-100 text-yellow-800",
    HIGH: "bg-orange-100 text-orange-800",
    CRITICAL: "bg-red-100 text-red-800",
  };

  let styles = "bg-gray-100 text-gray-800";

  if (variant === "status" && status) {
    styles = statusStyles[status];
  } else if (variant === "severity" && severity) {
    styles = severityStyles[severity];
  }

  return (
    <span className={`${baseStyles} ${styles} ${className}`} {...props}>
      {children || status || severity}
    </span>
  );
}
