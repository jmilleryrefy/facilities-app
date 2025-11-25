import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export default async function MyRequestsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const requests = await prisma.facilityRequest.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      responses: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <DashboardLayout user={session.user}>
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Requests</h1>
          <Link href="/new-request">
            <Button>New Request</Button>
          </Link>
        </div>

        {requests.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-600 mb-4">You haven&apos;t submitted any requests yet</p>
              <Link href="/new-request">
                <Button>Submit Your First Request</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
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
                          Submitted {new Date(request.createdAt).toLocaleDateString()}
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
        )}
      </div>
    </DashboardLayout>
  );
}
