import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;

  const request = await prisma.facilityRequest.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
          jobTitle: true,
        },
      },
      responses: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!request) {
    return (
      <DashboardLayout user={session.user}>
        <div className="max-w-4xl mx-auto py-8 px-4">
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-600 mb-4">Request not found</p>
              <Link href="/my-requests">
                <Button>Back to My Requests</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Check if user has permission to view this request
  if (
    session.user.role !== "ADMIN" &&
    request.userId !== session.user.id
  ) {
    redirect("/my-requests");
  }

  return (
    <DashboardLayout user={session.user}>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-6">
          <Link href="/my-requests">
            <Button variant="ghost" size="sm">
              ← Back to My Requests
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
                <h3 className="font-semibold text-gray-900 mb-2">
                  Description
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {request.description}
                </p>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Submitted By
                </h3>
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

        <Card>
          <CardHeader>
            <CardTitle>Response Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {request.responses.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                No responses yet. You will be notified when an administrator responds.
              </p>
            ) : (
              <div className="space-y-4">
                {request.responses.map((response, index) => (
                  <div
                    key={response.id}
                    className="border-l-4 border-blue-500 pl-4 py-2"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-blue-600">
                        Administrator Response #{index + 1}
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
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
