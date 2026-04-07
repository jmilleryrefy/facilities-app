import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RequestStatus, Severity } from "@prisma/client";

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
    const { status, location, description, severity } = body;

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
    if (status) {
      if (!isAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      if (!Object.values(RequestStatus).includes(status)) {
        return NextResponse.json(
          { error: "Invalid status value" },
          { status: 400 }
        );
      }
    }

    // User edit: only owner can edit, and only if PENDING
    if (location || description || severity) {
      if (!isOwner && !isAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      if (existingRequest.status !== "PENDING" && !isAdmin) {
        return NextResponse.json(
          { error: "Can only edit requests that are still pending" },
          { status: 400 }
        );
      }

      if (severity && !Object.values(Severity).includes(severity)) {
        return NextResponse.json(
          { error: "Invalid severity value" },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (location) updateData.location = location;
    if (description) updateData.description = description;
    if (severity) updateData.severity = severity;

    const facilityRequest = await prisma.facilityRequest.update({
      where: { id },
      data: updateData,
      include: {
        user: true,
        responses: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    return NextResponse.json(facilityRequest);
  } catch (error) {
    console.error("Error updating request:", error);
    return NextResponse.json(
      { error: "Failed to update request" },
      { status: 500 }
    );
  }
}
