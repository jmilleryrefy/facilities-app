"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback, useEffect } from "react";
import Input from "@/components/ui/Input";
import { RequestStatus, RequestCategory } from "@prisma/client";

const categoryLabels: Record<string, string> = {
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

export default function RequestFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get("status") || "ALL";
  const currentCategory = searchParams.get("category") || "ALL";
  const currentSearch = searchParams.get("search") || "";
  const currentSort = searchParams.get("sort") || "newest";

  const [search, setSearch] = useState(currentSearch);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (search) {
        params.set("search", search);
      } else {
        params.delete("search");
      }
      params.delete("page"); // Reset to page 1 on search
      router.push(`/my-requests?${params.toString()}`);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "ALL" && value !== "newest") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page"); // Reset to page 1 on filter change
      router.push(`/my-requests?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="space-y-4 mb-6">
      {/* Search */}
      <Input
        placeholder="Search by location or description..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="flex flex-wrap gap-4 items-center">
        {/* Status filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(
            ["ALL", "PENDING", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const
          ).map((status) => (
            <button
              key={status}
              onClick={() => updateParam("status", status)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                currentStatus === status
                  ? "bg-primary text-white"
                  : "bg-neutral-300 text-neutral-700 hover:bg-neutral-400"
              }`}
            >
              {status === "ALL" ? "All" : status.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <select
          value={currentCategory}
          onChange={(e) => updateParam("category", e.target.value)}
          className="px-3 py-1.5 border border-neutral-400 rounded-md text-sm text-neutral-700 bg-white"
        >
          <option value="ALL">All Categories</option>
          {Object.entries(categoryLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={currentSort}
          onChange={(e) => updateParam("sort", e.target.value)}
          className="px-3 py-1.5 border border-neutral-400 rounded-md text-sm text-neutral-700 bg-white"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="severity">Severity (High to Low)</option>
          <option value="updated">Recently Updated</option>
        </select>
      </div>
    </div>
  );
}
