import { HTMLAttributes } from "react";
import { RequestStatus, Severity, RequestCategory } from "@prisma/client";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "status" | "severity" | "category";
  status?: RequestStatus;
  severity?: Severity;
  category?: RequestCategory;
}

// Human-readable labels for categories
const categoryLabels: Record<RequestCategory, string> = {
  PLUMBING: "Plumbing",
  ELECTRICAL: "Electrical",
  HVAC: "HVAC",
  CLEANING: "Cleaning",
  SECURITY: "Security",
  FURNITURE: "Furniture",
  IT_EQUIPMENT: "IT Equipment",
  STRUCTURAL: "Structural",
  LANDSCAPING: "Landscaping",
  OTHER: "Other",
};

export default function Badge({
  variant = "default",
  status,
  severity,
  category,
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

  // Category badge colors
  const categoryStyles: Record<RequestCategory, string> = {
    PLUMBING: "bg-blue-100 text-blue-800",
    ELECTRICAL: "bg-yellow-100 text-yellow-800",
    HVAC: "bg-cyan-100 text-cyan-800",
    CLEANING: "bg-green-100 text-green-800",
    SECURITY: "bg-red-100 text-red-800",
    FURNITURE: "bg-amber-100 text-amber-800",
    IT_EQUIPMENT: "bg-violet-100 text-violet-800",
    STRUCTURAL: "bg-orange-100 text-orange-800",
    LANDSCAPING: "bg-lime-100 text-lime-800",
    OTHER: "bg-neutral-200 text-neutral-700",
  };

  let styles = "bg-neutral-300 text-neutral-700";
  let label: string | undefined;

  if (variant === "status" && status) {
    styles = statusStyles[status];
  } else if (variant === "severity" && severity) {
    styles = severityStyles[severity];
  } else if (variant === "category" && category) {
    styles = categoryStyles[category];
    label = categoryLabels[category];
  }

  return (
    <span className={`${baseStyles} ${styles} ${className}`} {...props}>
      {children || label || status || severity || category}
    </span>
  );
}

export { categoryLabels };
