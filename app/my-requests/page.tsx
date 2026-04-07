import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

const PAGE_SIZE = 20;

export default async function MyRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  const userId = session!.user.id;

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1", 10));
  const skip = (page - 1) * PAGE_SIZE;

  const where = { userId };

  const [requests, total] = await Promise.all([
    prisma.facilityRequest.findMany({
      where,
      include: {
        responses: {
          orderBy: { createdAt: "desc" as const },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" as const },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.facilityRequest.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Requests</h1>
        <Link href="/new-request">
          <Button>New Request</Button>
        </Link>
      </div>

      {requests.length === 0 && page === 1 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-600 mb-4">
              You haven&apos;t submitted any requests yet
            </p>
            <Link href="/new-request">
              <Button>Submit Your First Request</Button>
            </Link>
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
                          Submitted{" "}
                          {new Date(request.createdAt).toLocaleDateString()}
                        </span>
                        {request.responses.length > 0 && (
                          <span className="text-blue-600">
                            {request.responses.length} response(s)
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
                <Link href={`/my-requests?page=${page - 1}`}>
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
                <Link href={`/my-requests?page=${page + 1}`}>
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
