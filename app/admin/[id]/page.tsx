"use client";

import { useEffect, useState, FormEvent, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  FacilityRequest,
  User,
  RequestResponse,
  RequestStatus,
  RequestCategory,
} from "@prisma/client";
import AttachmentList from "@/components/AttachmentList";
import AuditLog from "@/components/AuditLog";

type AttachmentInfo = {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
};

type ResponseWithAuthor = RequestResponse & {
  author?: Pick<User, "id" | "name" | "email"> | null;
  isAdminResponse?: boolean;
};

type AdminUser = {
  id: string;
  name: string | null;
  email: string;
};

type RequestWithDetails = FacilityRequest & {
  user: Pick<User, "id" | "name" | "email" | "department" | "jobTitle">;
  assignee?: Pick<User, "id" | "name" | "email"> | null;
  responses: ResponseWithAuthor[];
  attachments: AttachmentInfo[];
};

export default function AdminRespondPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [request, setRequest] = useState<RequestWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [assigningUser, setAssigningUser] = useState(false);
  const [formData, setFormData] = useState({
    message: "",
    status: "" as RequestStatus | "",
  });

  const fetchRequest = useCallback(async () => {
    try {
      const response = await fetch(`/api/requests/${id}`);
      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to fetch request");
      }
      const data = await response.json();
      setRequest(data);
      setFormData((prev) => ({ ...prev, status: data.status }));
      setAssigneeId(data.assigneeId || "");
    } catch (error) {
      console.error("Error fetching request:", error);
      toast.error("Failed to load request");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  const fetchAdmins = useCallback(async () => {
    try {
      const response = await fetch("/api/users/admins");
      if (response.ok) {
        const data = await response.json();
        setAdminUsers(data);
      }
    } catch (error) {
      console.error("Error fetching admin users:", error);
    }
  }, []);

  useEffect(() => {
    fetchRequest();
    fetchAdmins();
  }, [fetchRequest, fetchAdmins]);

  const handleAssign = async () => {
    setAssigningUser(true);
    try {
      const response = await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeId: assigneeId || null }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to assign request");
      }
      toast.success(assigneeId ? "Request assigned successfully" : "Assignment removed");
      fetchRequest();
    } catch (error) {
      console.error("Error assigning request:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to assign request"
      );
    } finally {
      setAssigningUser(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.message.trim()) {
      toast.error("Please enter a response message");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/requests/${id}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit response");
      }

      toast.success("Response submitted successfully!");
      setFormData({ message: "", status: formData.status });
      fetchRequest(); // Refresh the request data
    } catch (error) {
      console.error("Error submitting response:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to submit response"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <p className="text-center text-gray-600">Loading request...</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-600 mb-4">Request not found</p>
            <Link href="/admin">
              <Button>Back to Admin Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/admin">
          <Button variant="ghost" size="sm">
            ← Back to Admin Dashboard
          </Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{request.location}</CardTitle>
              <div className="flex gap-2 mt-2 flex-wrap">
                <Badge variant="category" category={request.category} />
                <Badge variant="severity" severity={request.severity} />
                <Badge variant="status" status={request.status} />
              </div>
            </div>
            <div className="text-right text-sm text-gray-600">
              <div>Request #{request.id.slice(-8)}</div>
              <div>
                Submitted {new Date(request.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">
                {request.description}
              </p>
            </div>

            {request.attachments && request.attachments.length > 0 && (
              <div className="border-t pt-4">
                <AttachmentList attachments={request.attachments} />
              </div>
            )}

            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-2">Submitted By</h3>
              <div className="text-sm text-gray-700">
                <div>{request.user.name}</div>
                <div className="text-gray-600">{request.user.email}</div>
                {request.user.department && (
                  <div className="text-gray-600">{request.user.department}</div>
                )}
                {request.user.jobTitle && (
                  <div className="text-gray-600">{request.user.jobTitle}</div>
                )}
              </div>
            </div>

            {/* Assignment Section */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-2">Assign To</h3>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-400 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-neutral-900 text-sm"
                  >
                    <option value="">Unassigned</option>
                    {adminUsers.map((admin) => (
                      <option key={admin.id} value={admin.id}>
                        {admin.name || admin.email}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={assigneeId !== (request.assigneeId || "") ? "primary" : "secondary"}
                  disabled={assigningUser || assigneeId === (request.assigneeId || "")}
                  onClick={handleAssign}
                >
                  {assigningUser ? "Saving..." : "Update"}
                </Button>
              </div>
              {request.assignee && (
                <p className="text-sm text-gray-600 mt-1">
                  Currently assigned to {request.assignee.name || request.assignee.email}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {request.responses.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Conversation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {request.responses.map((response, index) => (
                <div
                  key={response.id}
                  className={`border-l-4 pl-4 py-2 ${
                    response.isAdminResponse
                      ? "border-blue-500"
                      : "border-primary"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-semibold ${
                          response.isAdminResponse
                            ? "text-blue-600"
                            : "text-primary-dark"
                        }`}
                      >
                        {response.author?.name || "Unknown"}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          response.isAdminResponse
                            ? "bg-blue-100 text-blue-700"
                            : "bg-primary-bg text-primary-dark"
                        }`}
                      >
                        {response.isAdminResponse ? "Admin" : "Requester"}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {new Date(response.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {response.message}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Add Response</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Textarea
              label="Response Message"
              placeholder="Enter your response to this facility request..."
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              rows={6}
              required
            />

            <Select
              label="Update Status"
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as RequestStatus,
                })
              }
              options={[
                { value: RequestStatus.PENDING, label: "Pending" },
                { value: RequestStatus.IN_PROGRESS, label: "In Progress" },
                { value: RequestStatus.RESOLVED, label: "Resolved" },
                { value: RequestStatus.CLOSED, label: "Closed" },
              ]}
            />

            <div className="flex gap-4">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Response"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push("/admin")}
                disabled={submitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <AuditLog requestId={id} />
    </div>
  );
}
