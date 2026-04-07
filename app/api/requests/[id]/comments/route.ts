import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { message } = body;

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Verify the request exists and user owns it
    const facilityRequest = await prisma.facilityRequest.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!facilityRequest) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    // Users can only comment on their own requests; admins can comment on any
    if (
      session.user.role !== "ADMIN" &&
      facilityRequest.userId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Don't allow comments on CLOSED requests
    if (facilityRequest.status === "CLOSED") {
      return NextResponse.json(
        { error: "Cannot comment on a closed request" },
        { status: 400 }
      );
    }

    const isAdmin = session.user.role === "ADMIN";

    const comment = await prisma.requestResponse.create({
      data: {
        requestId: id,
        authorId: session.user.id,
        message: message.trim(),
        isAdminResponse: isAdmin,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create notification for the other party
    if (isAdmin) {
      // Notify the request owner
      await prisma.notification.create({
        data: {
          userId: facilityRequest.userId,
          requestId: id,
          message: `An administrator responded to your request for "${facilityRequest.location}"`,
        },
      });
    } else {
      // Notify all admins
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true },
      });

      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            requestId: id,
            message: `${session.user.name || session.user.email} added a comment to request "${facilityRequest.location}"`,
          })),
        });
      }
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
