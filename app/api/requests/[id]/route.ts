import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RequestStatus, Severity, RequestCategory } from "@prisma/client";
import { logAudit, logFieldChanges } from "@/lib/audit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const facilityRequest = await prisma.facilityRequest.findUnique({
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

    if (!facilityRequest) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to view this request
    if (
      session.user.role !== "ADMIN" &&
      facilityRequest.userId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(facilityRequest);
  } catch (error) {
    console.error("Error fetching request:", error);
    return NextResponse.json(
      { error: "Failed to fetch request" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    const hasStatus = "status" in body;
    const hasLocation = "location" in body;
    const hasDescription = "description" in body;
    const hasSeverity = "severity" in body;
    const hasCategory = "category" in body;
    const hasAssigneeId = "assigneeId" in body;
    const hasEditFields = hasLocation || hasDescription || hasSeverity || hasCategory;

    // Fetch the existing request
    const existingRequest = await prisma.facilityRequest.findUnique({
      where: { id },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    const isAdmin = session.user.role === "ADMIN";
    const isOwner = existingRequest.userId === session.user.id;

    // Admin status update
    if (hasStatus) {
      if (!isAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      if (!Object.values(RequestStatus).includes(body.status)) {
        return NextResponse.json(
          { error: "Invalid status value" },
          { status: 400 }
        );
      }
    }

    // User edit: only owner can edit, and only if PENDING
    if (hasEditFields) {
      if (!isOwner && !isAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      if (existingRequest.status !== "PENDING" && !isAdmin) {
        return NextResponse.json(
          { error: "Can only edit requests that are still pending" },
          { status: 400 }
        );
      }

      if (hasLocation && !body.location) {
        return NextResponse.json(
          { error: "Location cannot be empty" },
          { status: 400 }
        );
      }

      if (hasDescription && !body.description) {
        return NextResponse.json(
          { error: "Description cannot be empty" },
          { status: 400 }
        );
      }

      if (hasSeverity && !Object.values(Severity).includes(body.severity)) {
        return NextResponse.json(
          { error: "Invalid severity value" },
          { status: 400 }
        );
      }
    }

    // Validate category if provided
    if (hasCategory && body.category !== null && !Object.values(RequestCategory).includes(body.category)) {
      return NextResponse.json(
        { error: "Invalid category value" },
        { status: 400 }
      );
    }

    // Only admins can assign requests
    if (hasAssigneeId && !isAdmin) {
      return NextResponse.json(
        { error: "Only admins can assign requests" },
        { status: 403 }
      );
    }

    // If assigning, verify the assignee exists and is an admin
    if (hasAssigneeId && body.assigneeId) {
      const assignee = await prisma.user.findUnique({
        where: { id: body.assigneeId },
        select: { id: true, role: true },
      });
      if (!assignee || assignee.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Assignee must be a valid admin user" },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (hasStatus) updateData.status = body.status;
    if (hasLocation) updateData.location = body.location;
    if (hasDescription) updateData.description = body.description;
    if (hasSeverity) updateData.severity = body.severity;
    if (hasCategory) updateData.category = body.category;
    if (hasAssigneeId) updateData.assigneeId = body.assigneeId || null;

    const facilityRequest = await prisma.facilityRequest.update({
      where: { id },
      data: updateData,
      include: {
        user: true,
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        responses: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    // Audit log: track all field changes
    const oldValues: Record<string, string | null> = {};
    const newValues: Record<string, string | null> = {};

    if (hasStatus && body.status !== existingRequest.status) {
      oldValues.status = existingRequest.status;
      newValues.status = body.status;
    }
    if (hasLocation && body.location !== existingRequest.location) {
      oldValues.location = existingRequest.location;
      newValues.location = body.location;
    }
    if (hasDescription && body.description !== existingRequest.description) {
      oldValues.description = existingRequest.description;
      newValues.description = body.description;
    }
    if (hasSeverity && body.severity !== existingRequest.severity) {
      oldValues.severity = existingRequest.severity;
      newValues.severity = body.severity;
    }
    if (hasCategory && body.category !== existingRequest.category) {
      oldValues.category = existingRequest.category;
      newValues.category = body.category;
    }
    if (hasAssigneeId && (body.assigneeId || null) !== existingRequest.assigneeId) {
      oldValues.assigneeId = existingRequest.assigneeId;
      newValues.assigneeId = body.assigneeId || null;
    }

    if (Object.keys(newValues).length > 0) {
      logFieldChanges(id, session.user.id, "updated", oldValues, newValues);
    }

    return NextResponse.json(facilityRequest);
  } catch (error) {
    console.error("Error updating request:", error);
    return NextResponse.json(
      { error: "Failed to update request" },
      { status: 500 }
    );
  }
}
