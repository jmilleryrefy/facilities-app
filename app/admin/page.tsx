"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { FacilityRequest, User, RequestResponse, RequestStatus } from "@prisma/client";

type RequestWithDetails = FacilityRequest & {
  user: Pick<User, "id" | "name" | "email" | "department" | "jobTitle">;
  responses: RequestResponse[];
};

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<RequestWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<RequestStatus | "ALL">("ALL");
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  const fetchRequests = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: String(page),
          limit: String(pagination.limit),
        });
        if (filter !== "ALL") {
          params.set("status", filter);
        }
        const response = await fetch(`/api/requests?${params}`);
        if (!response.ok) {
          if (response.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error("Failed to fetch requests");
        }
        const result = await response.json();
        setRequests(result.data);
        setPagination(result.pagination);
      } catch (error) {
        console.error("Error fetching requests:", error);
      } finally {
        setLoading(false);
      }
    },
    [router, filter, pagination.limit]
  );

  useEffect(() => {
    fetchRequests(1);
  }, [fetchRequests]);

  if (loading && requests.length === 0) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <p className="text-center text-gray-600">Loading requests...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Manage all facility requests ({pagination.total} total)
        </p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {(["ALL", "PENDING", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const).map(
          (status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                filter === status
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {status.replace("_", " ")}
            </button>
          )
        )}
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-600">
              No {filter !== "ALL" ? filter.toLowerCase().replace("_", " ") : ""} requests found
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {requests.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {request.location}
                        </h3>
                        <Badge variant="severity" severity={request.severity} />
                        <Badge variant="status" status={request.status} />
                      </div>
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {request.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>
                          Submitted by {request.user.name} ({request.user.email})
                        </span>
                        <span>&middot;</span>
                        <span>
                          {new Date(request.createdAt).toLocaleDateString()}
                        </span>
                        {request.responses.length > 0 && (
                          <>
                            <span>&middot;</span>
                            <span className="text-blue-600">
                              {request.responses.length} response(s)
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <Link href={`/admin/${request.id}`}>
                      <Button variant="primary" size="sm">
                        Respond
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-6">
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => fetchRequests(pagination.page - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchRequests(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
