"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { categoryLabels } from "@/components/ui/Badge";
import { RequestCategory } from "@prisma/client";

type AuditLogEntry = {
  id: string;
  requestId: string;
  actorId: string | null;
  action: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  actor: {
    id: string;
    name: string | null;
    email: string;
  } | null;
};

function formatFieldValue(field: string | null, value: string | null): string {
  if (value === null || value === undefined) return "none";

  if (field === "status") {
    return value.replace("_", " ");
  }
  if (field === "severity") {
    return value;
  }
  if (field === "category") {
    return categoryLabels[value as RequestCategory] || value;
  }
  if (field === "assigneeId") {
    return value || "unassigned";
  }
  // For long text fields, truncate
  if (value.length > 80) {
    return value.slice(0, 80) + "...";
  }
  return value;
}

function formatAction(entry: AuditLogEntry): string {
  const actorName = entry.actor?.name || entry.actor?.email || "System";

  if (entry.action === "created") {
    return `${actorName} created this request`;
  }
  if (entry.action === "cancelled") {
    return `${actorName} cancelled this request`;
  }
  if (entry.action === "responded") {
    return `${actorName} added a response`;
  }
  if (entry.action === "updated" && entry.field) {
    const fieldLabel = entry.field === "assigneeId" ? "assignee" : entry.field;
    const oldVal = formatFieldValue(entry.field, entry.oldValue);
    const newVal = formatFieldValue(entry.field, entry.newValue);
    return `${actorName} changed ${fieldLabel} from "${oldVal}" to "${newVal}"`;
  }
  if (entry.action === "commented") {
    return `${actorName} added a comment`;
  }
  return `${actorName} performed action: ${entry.action}`;
}

function actionIcon(action: string): string {
  switch (action) {
    case "created":
      return "bg-green-100 text-green-600";
    case "updated":
      return "bg-blue-100 text-blue-600";
    case "responded":
      return "bg-blue-100 text-blue-600";
    case "cancelled":
      return "bg-red-100 text-red-600";
    case "commented":
      return "bg-gray-100 text-gray-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export default function AuditLog({ requestId }: { requestId: string }) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      const response = await fetch(`/api/requests/${requestId}/audit-log`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  if (loading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm text-center py-4">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm text-center py-4">
            No activity recorded yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  const displayLogs = expanded ? logs : logs.slice(0, 5);

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Activity Log</CardTitle>
          <span className="text-sm text-gray-500">
            {logs.length} {logs.length === 1 ? "entry" : "entries"}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayLogs.map((entry) => (
            <div key={entry.id} className="flex items-start gap-3">
              <div
                className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                  actionIcon(entry.action).split(" ")[0]
                }`}
                style={{ marginTop: "0.5rem" }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800">
                  {formatAction(entry)}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(entry.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        {logs.length > 5 && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="mt-3 text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            Show all {logs.length} entries
          </button>
        )}
        {expanded && logs.length > 5 && (
          <button
            onClick={() => setExpanded(false)}
            className="mt-3 text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            Show less
          </button>
        )}
      </CardContent>
    </Card>
  );
}
