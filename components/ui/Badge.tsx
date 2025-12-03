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
    PENDING: "bg-warning-bg text-warning-dark",
    IN_PROGRESS: "bg-secondary-bg text-secondary-dark",
    RESOLVED: "bg-success-bg text-success-dark",
    CLOSED: "bg-neutral-300 text-neutral-700",
  };

  // Severity badge colors
  const severityStyles = {
    LOW: "bg-success-bg text-success-dark",
    MEDIUM: "bg-warning-bg text-warning-dark",
    HIGH: "bg-accent-bg text-accent-dark",
    CRITICAL: "bg-error-bg text-error-dark",
  };

  let styles = "bg-neutral-300 text-neutral-700";

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
