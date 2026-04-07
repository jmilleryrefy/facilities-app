import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import RequestFilters from "@/components/RequestFilters";
import { Prisma, RequestStatus, RequestCategory, Severity } from "@prisma/client";

const PAGE_SIZE = 20;

// Map severity to a numeric value for sorting
const severityOrder: Record<string, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

export default async function MyRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    status?: string;
    category?: string;
    search?: string;
    sort?: string;
  }>;
}) {
  const session = await auth();
  const userId = session!.user.id;

  const {
    page: pageParam,
    status: statusParam,
    category: categoryParam,
    search: searchParam,
    sort: sortParam,
  } = await searchParams;

  const page = Math.max(1, parseInt(pageParam || "1", 10));
  const skip = (page - 1) * PAGE_SIZE;

  // Build where clause
  const where: Prisma.FacilityRequestWhereInput = { userId };

  // Status filter
  if (
    statusParam &&
    statusParam !== "ALL" &&
    Object.values(RequestStatus).includes(statusParam as RequestStatus)
  ) {
    where.status = statusParam as RequestStatus;
  }

  // Category filter
  if (
    categoryParam &&
    categoryParam !== "ALL" &&
    Object.values(RequestCategory).includes(categoryParam as RequestCategory)
  ) {
    where.category = categoryParam as RequestCategory;
  }

  // Search filter
  if (searchParam && searchParam.trim()) {
    where.OR = [
      { location: { contains: searchParam.trim() } },
      { description: { contains: searchParam.trim() } },
    ];
  }

  // Sort order
  let orderBy: Prisma.FacilityRequestOrderByWithRelationInput;
  switch (sortParam) {
    case "oldest":
      orderBy = { createdAt: "asc" };
      break;
    case "severity":
      orderBy = { severity: "asc" }; // Prisma sorts enums in definition order
      break;
    case "updated":
      orderBy = { updatedAt: "desc" };
      break;
    default:
      orderBy = { createdAt: "desc" };
  }

  const [requests, total] = await Promise.all([
    prisma.facilityRequest.findMany({
      where,
      include: {
        responses: {
          orderBy: { createdAt: "desc" as const },
          take: 1,
        },
        _count: {
          select: { responses: true },
        },
      },
      orderBy,
      skip,
      take: PAGE_SIZE,
    }),
    prisma.facilityRequest.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Build URL params for pagination links
  const buildPageUrl = (p: number) => {
    const params = new URLSearchParams();
    params.set("page", String(p));
    if (statusParam && statusParam !== "ALL") params.set("status", statusParam);
    if (categoryParam && categoryParam !== "ALL") params.set("category", categoryParam);
    if (searchParam) params.set("search", searchParam);
    if (sortParam && sortParam !== "newest") params.set("sort", sortParam);
    return `/my-requests?${params.toString()}`;
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Requests</h1>
        <Link href="/new-request">
          <Button>New Request</Button>
        </Link>
      </div>

      <RequestFilters />

      {requests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            {searchParam || (statusParam && statusParam !== "ALL") || (categoryParam && categoryParam !== "ALL") ? (
              <p className="text-gray-600">
                No requests match your filters.{" "}
                <Link
                  href="/my-requests"
                  className="text-primary hover:underline"
                >
                  Clear filters
                </Link>
              </p>
            ) : (
              <>
                <p className="text-gray-600 mb-4">
                  You haven&apos;t submitted any requests yet
                </p>
                <Link href="/new-request">
                  <Button>Submit Your First Request</Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">
            Showing {skip + 1}–{Math.min(skip + PAGE_SIZE, total)} of {total}{" "}
            request{total !== 1 ? "s" : ""}
          </p>

          <div className="space-y-4">
            {requests.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {request.location}
                        </h3>
                        <Badge variant="category" category={request.category} />
                        <Badge variant="severity" severity={request.severity} />
                        <Badge variant="status" status={request.status} />
                      </div>
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {request.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>
                          Submitted{" "}
                          {new Date(request.createdAt).toLocaleDateString()}
                        </span>
                        {request._count.responses > 0 && (
                          <span className="text-blue-600">
                            {request._count.responses} message
                            {request._count.responses !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    <Link href={`/requests/${request.id}`}>
                      <Button variant="secondary" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-6">
              {page > 1 ? (
                <Link href={buildPageUrl(page - 1)}>
                  <Button variant="secondary" size="sm">
                    Previous
                  </Button>
                </Link>
              ) : (
                <Button variant="secondary" size="sm" disabled>
                  Previous
                </Button>
              )}
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              {page < totalPages ? (
                <Link href={buildPageUrl(page + 1)}>
                  <Button variant="secondary" size="sm">
                    Next
                  </Button>
                </Link>
              ) : (
                <Button variant="secondary" size="sm" disabled>
                  Next
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
