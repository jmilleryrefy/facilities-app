import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

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

    const existingRequest = await prisma.facilityRequest.findUnique({
      where: { id },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    // Only the owner can cancel, or an admin
    if (
      session.user.role !== "ADMIN" &&
      existingRequest.userId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Can only cancel PENDING or IN_PROGRESS requests
    if (!["PENDING", "IN_PROGRESS"].includes(existingRequest.status)) {
      return NextResponse.json(
        { error: "Can only cancel pending or in-progress requests" },
        { status: 400 }
      );
    }

    const updatedRequest = await prisma.facilityRequest.update({
      where: { id },
      data: { status: "CLOSED" },
    });

    // Audit log: request cancelled
    await logAudit({
      requestId: id,
      actorId: session.user.id,
      action: "cancelled",
      field: "status",
      oldValue: existingRequest.status,
      newValue: "CLOSED",
    });

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error("Error cancelling request:", error);
    return NextResponse.json(
      { error: "Failed to cancel request" },
      { status: 500 }
    );
  }
}
