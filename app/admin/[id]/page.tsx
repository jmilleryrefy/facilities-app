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
} from "@prisma/client";

type RequestWithDetails = FacilityRequest & {
  user: Pick<User, "id" | "name" | "email" | "department" | "jobTitle">;
  responses: RequestResponse[];
};

export default function AdminRespondPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [request, setRequest] = useState<RequestWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
    } catch (error) {
      console.error("Error fetching request:", error);
      toast.error("Failed to load request");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

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
              <div className="flex gap-2 mt-2">
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
          </div>
        </CardContent>
      </Card>

      {request.responses.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Previous Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {request.responses.map((response, index) => (
                <div
                  key={response.id}
                  className="border-l-4 border-blue-500 pl-4 py-2"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-blue-600">
                      Response #{index + 1}
                    </span>
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
    </div>
  );
}
