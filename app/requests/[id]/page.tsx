import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import AttachmentList from "@/components/AttachmentList";
import CommentForm from "@/components/CommentForm";
import RequestActions from "@/components/RequestActions";
import AuditLog from "@/components/AuditLog";

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Session is guaranteed by the layout; we still need it for ownership check
  const session = await auth();
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
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      responses: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      attachments: {
        select: {
          id: true,
          fileName: true,
          fileType: true,
          fileSize: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!request) {
    return (
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
    );
  }

  // Check if user has permission to view this request
  if (
    session!.user.role !== "ADMIN" &&
    request.userId !== session!.user.id
  ) {
    redirect("/my-requests");
  }

  return (
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
            <div className="mt-3">
              <RequestActions
                requestId={request.id}
                requestStatus={request.status}
                isOwner={request.userId === session!.user.id}
              />
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

              {request.attachments && request.attachments.length > 0 && (
                <div className="border-t pt-4">
                  <AttachmentList
                    attachments={request.attachments.map((a: { id: string; fileName: string; fileType: string; fileSize: number; createdAt: Date }) => ({
                      ...a,
                      createdAt: a.createdAt.toISOString(),
                    }))}
                  />
                </div>
              )}

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

              {request.assignee && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Assigned To
                  </h3>
                  <div className="text-sm text-gray-700">
                    <div>{request.assignee.name}</div>
                    <div className="text-gray-600">{request.assignee.email}</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversation</CardTitle>
          </CardHeader>
          <CardContent>
            {request.responses.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                No messages yet. You will be notified when an administrator responds.
              </p>
            ) : (
              <div className="space-y-4 mb-6">
                {request.responses.map((response: { id: string; isAdminResponse?: boolean; author?: { id: string; name: string | null; email: string } | null; createdAt: Date; message: string }, index: number) => (
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
            )}

            <div className="border-t pt-4">
              <CommentForm
                requestId={request.id}
                requestStatus={request.status}
              />
            </div>
          </CardContent>
        </Card>

        <AuditLog requestId={request.id} />
      </div>
  );
}
