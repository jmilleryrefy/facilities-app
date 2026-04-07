import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendResponseNotification } from "@/lib/email";
import { RequestStatus } from "@prisma/client";
import { logAudit } from "@/lib/audit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { message, status } = body;

    // Validation
    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (status && !Object.values(RequestStatus).includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    // Check if request exists
    const existingRequest = await prisma.facilityRequest.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    // Create response and optionally update status
    const [response, updatedRequest] = await prisma.$transaction([
      prisma.requestResponse.create({
        data: {
          requestId: id,
          authorId: session.user.id,
          message,
          isAdminResponse: true,
        },
      }),
      prisma.facilityRequest.update({
        where: { id },
        data: status ? { status } : {},
        include: {
          user: true,
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
        },
      }),
    ]);

    // Audit log: admin responded
    logAudit({
      requestId: id,
      actorId: session.user.id,
      action: "responded",
    });

    // Audit log: status change if applicable
    if (status && status !== existingRequest.status) {
      logAudit({
        requestId: id,
        actorId: session.user.id,
        action: "updated",
        field: "status",
        oldValue: existingRequest.status,
        newValue: status,
      });
    }

    // Create in-app notification for the request owner
    await prisma.notification.create({
      data: {
        userId: existingRequest.userId,
        requestId: id,
        message: `An administrator responded to your request for "${existingRequest.location}"`,
      },
    }).catch((err: unknown) => console.error("Failed to create notification:", err));

    // Send email notification to user (non-blocking)
    sendResponseNotification(
      updatedRequest,
      updatedRequest.user,
      message
    ).catch((error) => console.error("Failed to send notification:", error));

    return NextResponse.json({
      response,
      request: updatedRequest,
    });
  } catch (error) {
    console.error("Error creating response:", error);
    return NextResponse.json(
      { error: "Failed to create response" },
      { status: 500 }
    );
  }
}
